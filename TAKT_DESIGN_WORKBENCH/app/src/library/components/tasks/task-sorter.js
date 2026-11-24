// Aufgaben: Eingang als Sortier-Fächer – eine Karte im Blick, vier Fächer mit Füllstand, die Warteschlange als Kartenreihe.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Badge, Icon, Ring, EmptyState } from '../../ui.js';
import { isoDay } from '../../../lib/util.js';
import { addDays, dayStart, parseDay, shortDay } from '../calendar/_cal.js';
import { makeTask, weekEnd, openTasks, planMinutes, minLabel, INBOX_SRC, inboxAgo } from './_tasks-x.js';
import { dueInfo, PRIORITY } from './_tasks.js';

const FACH = [{ label: 'Heute', icon: 'sun' }, { label: 'Morgen', icon: 'sunrise' }, { label: 'Diese Woche', icon: 'calendar-range' }, { label: 'Irgendwann', icon: 'archive' }];

export const taskSorter = {
  id: 'task-sorter',
  name: 'Eingang: Sortier-Fächer',
  category: 'Aufgaben',
  description: 'Eingang grafisch sortieren: Fortschrittsring, die aktuelle Karte groß, vier Fächer (Heute, Morgen, Diese Woche, Irgendwann) mit Füllstand und Zeitbedarf, darunter die wartenden Karten. Karte wählen, Fach antippen – oder den Vorschlag übernehmen.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Eingang sortieren' },
    { name: 'showSuggestion', label: 'Vorschlag zeigen', type: 'boolean', default: true },
  ],
  data: [
    { slot: 'inbox', label: 'Eingang', default: 'inbox', shape: '{id,title,source,at,suggest?:{project?,due?,priority?}}[]', required: true },
    { slot: 'tasks', label: 'Aufgaben (Ziel)', default: 'tasks', shape: 'Aufgabenliste', required: true },
  ],
  events: ['inbox.triage', 'inbox.delete', 'task.create', 'inbox.select'],
  states: ['empty'],
  flutter: { widget: 'TaktInboxSorter', propMap: { title: 'title', showSuggestion: 'showSuggestion' }, events: ['inbox.triage', 'inbox.delete', 'task.create', 'inbox.select'] },
  css: `
  .tk-tsk-sort { display:flex; flex-direction:column; gap:var(--tk-space-4); min-width:0; }
  .tk-tsk-sort__strip { display:flex; align-items:center; gap:var(--tk-space-4); padding:var(--tk-space-4) var(--tk-space-5); border:1px solid var(--tk-c-border); border-radius:var(--tk-radius-xl); background:var(--tk-c-surface); }
  .tk-tsk-sort__strip b { display:block; font-size:var(--tk-fs-lg); font-weight:var(--tk-fw-bold); }
  .tk-tsk-sort__strip span { color:var(--tk-c-text-muted); font-size:var(--tk-fs-sm); }
  .tk-tsk-sort__stage { display:grid; gap:var(--tk-space-4); grid-template-columns:minmax(0,1fr); }
  .tk-tsk-sort__spot { display:flex; flex-direction:column; gap:var(--tk-space-3); padding:var(--tk-space-5); border:1px solid var(--tk-c-border); border-radius:var(--tk-radius-xl); background:linear-gradient(160deg, var(--tk-c-accent-soft), var(--tk-c-surface) 75%); min-width:0; }
  .tk-tsk-sort__src { display:flex; align-items:center; gap:10px; color:var(--tk-c-text-muted); font-size:var(--tk-fs-sm); }
  .tk-tsk-sort__ico { width:40px; height:40px; border-radius:12px; flex:none; display:grid; place-items:center; background:var(--tk-c-accent-soft); color:var(--tk-c-accent); }
  .tk-tsk-sort__big { font-size:var(--tk-fs-xl); font-weight:var(--tk-fw-bold); line-height:1.3; overflow-wrap:anywhere; }
  .tk-tsk-sort__sug { align-self:flex-start; display:inline-flex; align-items:center; gap:6px; min-height:40px; padding:0 14px; border-radius:var(--tk-radius-pill); border:1px solid var(--tk-c-accent); background:transparent; color:var(--tk-c-accent); font:inherit; font-size:var(--tk-fs-sm); cursor:pointer; text-align:left; }
  .tk-tsk-sort__fach { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:var(--tk-space-3); align-content:start; }
  .tk-tsk-sort__tile { display:flex; flex-direction:column; gap:4px; align-items:flex-start; min-height:96px; padding:var(--tk-space-4); border:1px solid var(--tk-c-border); border-radius:var(--tk-radius-xl); background:var(--tk-c-surface); color:var(--tk-c-text); font:inherit; text-align:left; cursor:pointer; min-width:0; }
  .tk-tsk-sort__tile:hover, .tk-tsk-sort__tile:focus-visible { border-color:var(--tk-c-accent); background:var(--tk-c-surface2); }
  .tk-tsk-sort__tile .tk-tsk-sort__ico { width:34px; height:34px; border-radius:10px; }
  .tk-tsk-sort__tile strong { font-size:var(--tk-fs-md); font-weight:var(--tk-fw-semibold); }
  .tk-tsk-sort__tile small { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); font-variant-numeric:tabular-nums; }
  .tk-tsk-sort__tile[data-hit="1"] { border-color:var(--tk-c-success); }
  .tk-tsk-sort__bar { display:block; width:100%; height:6px; border-radius:3px; background:var(--tk-c-surface3); margin-top:auto; overflow:hidden; } .tk-tsk-sort__bar i { display:block; height:100%; background:var(--tk-c-accent); border-radius:3px; }
  .tk-tsk-sort__plus { color:var(--tk-c-success); font-weight:var(--tk-fw-semibold); }
  .tk-tsk-sort__queue { display:grid; grid-template-columns:repeat(auto-fill, minmax(min(100%, 210px), 1fr)); gap:var(--tk-space-3); }
  .tk-tsk-sort__q { display:flex; flex-direction:column; gap:8px; min-height:104px; padding:var(--tk-space-4); border:1px solid var(--tk-c-border); border-radius:var(--tk-radius-lg); background:var(--tk-c-surface2); color:var(--tk-c-text); font:inherit; text-align:left; cursor:pointer; min-width:0; }
  .tk-tsk-sort__q:hover, .tk-tsk-sort__q:focus-visible { border-color:var(--tk-c-accent); }
  .tk-tsk-sort__q span { font-weight:var(--tk-fw-medium); overflow-wrap:anywhere; }
  .tk-tsk-sort__q small { color:var(--tk-c-text-subtle); font-size:var(--tk-fs-sm); margin-top:auto; }
  .tk-tsk-sort__cap { display:flex; align-items:center; justify-content:space-between; gap:8px; flex-wrap:wrap; }
  @media (min-width:900px) { .tk-tsk-sort__stage { grid-template-columns:minmax(0,1fr) minmax(0,1.1fr); } .tk-tsk-sort__fach { grid-template-columns:repeat(2, minmax(0,1fr)); } }
  .bp-mobile .tk-tsk-sort__strip { padding:var(--tk-space-3) var(--tk-space-4); }`,
  example: { data: { inbox: [{ id: 'i1', title: 'Rückruf Spedition wegen Palette', source: 'Sprache', at: '2026-11-24T08:12:00', suggest: { project: 'Shop', due: '2026-11-24', priority: 'hoch' } }, { id: 'i2', title: 'Rechnung Fotograf prüfen', source: 'Scan', at: '2026-11-24T07:55:00' }], tasks: [] } },
  render: function TaskSorter({ props, data, setData, ctx }) {
    const [sel, setSel] = useState(null), [handled, setHandled] = useState(0), [added, setAdded] = useState({});
    const inbox = Array.isArray(data.inbox) ? data.inbox : [], tasks = Array.isArray(data.tasks) ? data.tasks : [];
    const today = dayStart(ctx.today), WHEN = { Heute: isoDay(today), Morgen: isoDay(addDays(today, 1)), 'Diese Woche': isoDay(weekEnd(ctx.today)), Irgendwann: null };
    const cur = inbox.find((x) => x.id === sel) || inbox[0], total = handled + inbox.length;
    const move = (it, label, due) => {
      const s = it.suggest || {}, t = makeTask(ctx, { title: it.title, due, priority: s.priority, project: s.project });
      setData('tasks', (a) => [t, ...(Array.isArray(a) ? a : [])]); setData('inbox', (a) => a.filter((x) => x.id !== it.id));
      setHandled((n) => n + 1); if (label) setAdded((a) => ({ ...a, [label]: (a[label] || 0) + 1 })); setSel(null);
      ctx.emit('inbox.triage', { id: it.id, to: label || 'Vorschlag' }); ctx.emit('task.create', { id: t.id, title: t.title }); ctx.toast(`„${it.title}“ → ${label || 'übernommen'}`);
    };
    const del = (it) => { setData('inbox', (a) => a.filter((x) => x.id !== it.id)); setHandled((n) => n + 1); setSel(null); ctx.emit('inbox.delete', { id: it.id }); ctx.toast('Eintrag gelöscht'); };
    const sugText = (s) => [s.project, s.due ? shortDay(parseDay(s.due)) : null, s.priority ? `Priorität ${PRIORITY[s.priority]?.label.toLowerCase()}` : null].filter(Boolean).join(' · ');
    const fill = (label) => {
      const list = openTasks(tasks).filter((t) => { const d = dueInfo(t, ctx.today).diff; return label === 'Heute' ? d === 0 : label === 'Morgen' ? d === 1 : label === 'Diese Woche' ? d != null && d >= 2 && d <= 7 : d == null; });
      const min = planMinutes(list);
      return { n: `${list.length} ${list.length === 1 ? 'Aufgabe' : 'Aufgaben'}`, t: list.length ? minLabel(min) : 'noch leer', pct: Math.min(100, Math.round(min / 4.8)) };
    };
    if (!cur) return html`<${Card} title=${props.title} icon="inbox"><${EmptyState} icon="check-check" title=${handled ? 'Eingang leer' : 'Noch nichts im Eingang'} text=${handled ? `${handled} ${handled === 1 ? 'Eintrag' : 'Einträge'} sortiert. Alles liegt dort, wo es hingehört.` : 'Was du schnell festhältst, sammelt sich hier zum Sortieren.'} /><//>`;
    const s = cur.suggest || {}, rest = inbox.filter((x) => x.id !== cur.id);
    return html`<div class="tk-tsk-sort" data-qa="task-sorter">
      <div class="tk-tsk-sort__strip"><${Ring} value=${handled} max=${total} size=${64} stroke=${8} tone=${handled === total ? 'success' : 'accent'} label=${`${handled} von ${total} sortiert`}><b style="font-size:var(--tk-fs-md)">${handled}/${total}</b><//>
        <div><b>${inbox.length} ${inbox.length === 1 ? 'Eintrag wartet' : 'Einträge warten'}</b><span>Wähle ein Fach für die Karte.</span></div></div>
      <div class="tk-tsk-sort__stage">
        <div class="tk-tsk-sort__spot" key=${cur.id} aria-live="polite"><div class="tk-tsk-sort__src"><span class="tk-tsk-sort__ico"><${Icon} name=${INBOX_SRC[cur.source] || 'inbox'} size=${20} /></span>${cur.source} · ${inboxAgo(cur.at, ctx.today)}</div>
          <div class="tk-tsk-sort__big">${cur.title}</div>
          ${props.showSuggestion && sugText(s) && html`<button type="button" class="tk-tsk-sort__sug" onClick=${() => move(cur, null, s.due)} aria-label=${`Vorschlag übernehmen: ${sugText(s)}`}><${Icon} name="sparkles" size=${15} />Vorschlag: ${sugText(s)}</button>`}
          <div><${Button} variant="ghost" size="sm" icon="trash-2" onClick=${() => del(cur)}>Löschen<//></div></div>
        <div class="tk-tsk-sort__fach" role="group" aria-label="Fach wählen">${FACH.map((f) => html`<button type="button" class="tk-tsk-sort__tile" data-hit=${added[f.label] ? '1' : '0'} onClick=${() => move(cur, f.label, WHEN[f.label])} aria-label=${`${f.label}: ${fill(f.label).n}, ${fill(f.label).t}`}>
          <span class="tk-tsk-sort__ico"><${Icon} name=${f.icon} size=${17} /></span><strong>${f.label}</strong><small>${fill(f.label).n}</small><small>${fill(f.label).t}</small><span class="tk-tsk-sort__bar" aria-hidden="true"><i style=${`width:${fill(f.label).pct}%`}></i></span>${added[f.label] ? html`<small class="tk-tsk-sort__plus">+${added[f.label]} neu</small>` : null}</button>`)}</div>
      </div>
      ${rest.length ? html`<div><div class="tk-tsk-sort__cap"><span class="tk-label">Wartet noch</span><${Badge}>${rest.length}<//></div>
        <div class="tk-tsk-sort__queue" style="margin-top:var(--tk-space-3)">${rest.map((it) => html`<button type="button" class="tk-tsk-sort__q" onClick=${() => { setSel(it.id); ctx.emit('inbox.select', { id: it.id }); }} aria-label=${`„${it.title}“ als Nächstes sortieren`}><span class="tk-tsk-sort__src"><${Icon} name=${INBOX_SRC[it.source] || 'inbox'} size=${15} />${it.source}</span><span>${it.title}</span><small>${inboxAgo(it.at, ctx.today)}</small></button>`)}</div></div>` : null}
    </div>`;
  },
};
export default taskSorter;
