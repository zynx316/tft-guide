// Aufgaben: Eingang – schnell Erfasstes später sortieren (Heute, Morgen, Diese Woche, Irgendwann) als Liste oder Karte für Karte.
import { html } from '../../../lib/html.js';
import { Card, Button, Badge, Icon, EmptyState } from '../../ui.js';
import { isoDay } from '../../../lib/util.js';
import { addDays, dayStart, parseDay } from '../calendar/_cal.js';
import { makeTask, weekEnd } from './_tasks-x.js';
import { PRIORITY } from './_tasks.js';

const SRC = { Sprache: 'mic', Notiz: 'notebook-pen', Teilen: 'share-2', Scan: 'scan-line', Erfassen: 'plus', Mail: 'mail' };
const ago = (at, today) => { const m = Math.round((+today - +new Date(at)) / 60000); return m < 60 ? `vor ${Math.max(1, m)} Min.` : m < 1440 ? `vor ${Math.round(m / 60)} Std.` : m < 2880 ? 'gestern' : `vor ${Math.round(m / 1440)} Tagen`; };

export const taskInbox = {
  id: 'task-inbox',
  name: 'Aufgaben-Eingang',
  category: 'Aufgaben',
  description: 'Eingang für schnell Erfasstes (Sprache, Notiz, Teilen, Scan). Triage mit einem Tipp: Heute, Morgen, Diese Woche oder Irgendwann – der Eintrag wird zur Aufgabe und verschwindet aus dem Eingang. Darstellung als Liste oder Karte für Karte.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Eingang' },
    { name: 'style', label: 'Darstellung', type: 'select', options: ['list', 'steps'], default: 'list' },
    { name: 'showSuggestion', label: 'Vorschlag zeigen', type: 'boolean', default: true },
  ],
  data: [
    { slot: 'inbox', label: 'Eingang', default: 'inbox', shape: '{id,title,source,at,suggest?:{project?,due?,priority?}}[]', required: true },
    { slot: 'tasks', label: 'Aufgaben (Ziel)', default: 'tasks', shape: 'Aufgabenliste', required: true },
  ],
  events: ['inbox.triage', 'inbox.delete', 'task.create', 'task.open'],
  states: ['empty'],
  css: `
  .tk-tsk-inbox__item { display:flex; flex-direction:column; gap:10px; padding:12px 16px; border-bottom:1px solid var(--tk-c-border); min-width:0; }
  .tk-tsk-inbox__item:last-child { border-bottom:0; }
  .tk-tsk-inbox__top { display:flex; align-items:flex-start; gap:12px; }
  .tk-tsk-inbox__src { width:34px; height:34px; border-radius:10px; flex:none; display:grid; place-items:center; background:var(--tk-c-surface3); color:var(--tk-c-text-muted); }
  .tk-tsk-inbox__meta { font-size:var(--tk-fs-sm); color:var(--tk-c-text-subtle); display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-top:2px; }
  .tk-tsk-inbox__acts { display:flex; flex-wrap:wrap; gap:8px; align-items:center; padding-left:46px; }
  .tk-tsk-inbox__acts .tk-btn { flex:none; }
  .tk-tsk-inbox__sug { display:inline-flex; align-items:center; gap:6px; font-size:var(--tk-fs-sm); color:var(--tk-c-accent); }
  .tk-tsk-inbox__card { margin:var(--tk-space-4); padding:var(--tk-space-5); border:1px solid var(--tk-c-border); border-radius:var(--tk-radius-xl); background:linear-gradient(160deg, var(--tk-c-accent-soft), transparent 70%); display:flex; flex-direction:column; gap:var(--tk-space-3); }
  .tk-tsk-inbox__big { font-size:var(--tk-fs-xl); font-weight:var(--tk-fw-bold); line-height:1.3; overflow-wrap:anywhere; }
  .tk-tsk-inbox__grid { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:8px; }
  .tk-tsk-inbox__grid .tk-btn { height:48px; justify-content:center; }
  .tk-tsk-inbox__del { flex:none; }
  .bp-mobile .tk-tsk-inbox__sug { min-height:36px; }
  .bp-mobile .tk-tsk-inbox__acts { padding-left:0; } .bp-mobile .tk-tsk-inbox__acts .tk-btn { flex:1 1 40%; height:40px; }`,
  example: { data: { inbox: [
    { id: 'i1', title: 'Rückruf Spedition wegen Palette', source: 'Sprache', at: '2026-11-24T08:12:00', suggest: { project: 'Shop', due: '2026-11-24', priority: 'hoch' } },
    { id: 'i2', title: 'Rechnung Fotograf prüfen', source: 'Scan', at: '2026-11-24T07:55:00', suggest: { project: 'Finanzen', due: '2026-11-26' } },
  ], tasks: [] } },
  render: function TaskInbox({ props, data, setData, ctx }) {
    const inbox = Array.isArray(data.inbox) ? data.inbox : [];
    const today = dayStart(ctx.today), WHEN = { Heute: isoDay(today), Morgen: isoDay(addDays(today, 1)), 'Diese Woche': isoDay(weekEnd(ctx.today)), Irgendwann: null };
    const sort = (it, label) => {
      const s = it.suggest || {}, t = makeTask({ title: it.title, due: label ? WHEN[label] : undefined, priority: s.priority, project: s.project });
      setData('tasks', (a) => [t, ...a]); setData('inbox', (a) => a.filter((x) => x.id !== it.id));
      ctx.emit('inbox.triage', { id: it.id, to: label || 'Vorschlag' }); ctx.emit('task.create', { id: t.id, title: t.title }); ctx.toast(`„${it.title}“ → ${label || 'übernommen'}`);
    };
    const accept = (it) => { const s = it.suggest || {}; const t = makeTask({ title: it.title, due: s.due, priority: s.priority, project: s.project }); setData('tasks', (a) => [t, ...a]); setData('inbox', (a) => a.filter((x) => x.id !== it.id)); ctx.emit('inbox.triage', { id: it.id, to: 'Vorschlag' }); ctx.emit('task.create', { id: t.id, title: t.title }); ctx.toast(`„${it.title}“ übernommen`); };
    const del = (it) => { setData('inbox', (a) => a.filter((x) => x.id !== it.id)); ctx.emit('inbox.delete', { id: it.id }); ctx.toast('Eintrag gelöscht'); };
    const sugText = (s) => [s.project, s.due ? new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: 'numeric', month: 'numeric' }).format(parseDay(s.due)) : null, s.priority ? `Priorität ${PRIORITY[s.priority]?.label.toLowerCase()}` : null].filter(Boolean).join(' · ');
    if (!inbox.length) return html`<${Card} title=${props.title} icon="inbox"><${EmptyState} icon="check-check" title="Eingang leer" text="Alles sortiert. Neue Gedanken landen beim Erfassen hier." /><//>`;
    const head = html`<${Badge} tone="accent">${inbox.length} offen<//>`;
    const acts = (it) => html`${Object.keys(WHEN).map((l) => html`<${Button} size="sm" onClick=${() => sort(it, l)}>${l}<//>`)}`;
    if (props.style === 'steps') {
      const it = inbox[0], s = it.suggest || {};
      return html`<${Card} flush=${true} title=${props.title} icon="inbox" actions=${html`<${Badge} tone="accent">${inbox.length} übrig<//>`}><div data-qa="task-inbox" class="tk-tsk-inbox__card" key=${it.id}>
        <span class="tk-label">${it.source} · ${ago(it.at, ctx.today)}</span><div class="tk-tsk-inbox__big">${it.title}</div>
        ${props.showSuggestion && sugText(s) && html`<div class="tk-tsk-inbox__sug"><${Icon} name="sparkles" size=${15} />Vorschlag: ${sugText(s)}</div>`}
        ${props.showSuggestion && sugText(s) && html`<${Button} variant="primary" icon="check" onClick=${() => accept(it)}>Vorschlag übernehmen<//>`}
        <div class="tk-tsk-inbox__grid">${Object.keys(WHEN).map((l) => html`<${Button} onClick=${() => sort(it, l)}>${l}<//>`)}</div>
        <${Button} variant="ghost" icon="trash-2" onClick=${() => del(it)}>Löschen<//></div><//>`;
    }
    return html`<${Card} flush=${true} title=${props.title} icon="inbox" actions=${head}><div data-qa="task-inbox">${inbox.map((it) => { const s = it.suggest || {};
      return html`<div class="tk-tsk-inbox__item"><div class="tk-tsk-inbox__top"><span class="tk-tsk-inbox__src"><${Icon} name=${SRC[it.source] || 'inbox'} size=${17} /></span>
        <div class="tk-grow"><div style="font-weight:var(--tk-fw-medium);overflow-wrap:anywhere">${it.title}</div><div class="tk-tsk-inbox__meta"><span>${it.source} · ${ago(it.at, ctx.today)}</span>${props.showSuggestion && sugText(s) && html`<button type="button" class="tk-tsk-inbox__sug" style="border:0;background:none;font:inherit;cursor:pointer;padding:0" onClick=${() => accept(it)} aria-label=${`Vorschlag übernehmen: ${sugText(s)}`}><${Icon} name="sparkles" size=${13} />${sugText(s)}</button>`}</div></div>
        <${Button} size="sm" variant="ghost" icon="trash-2" class="tk-tsk-inbox__del" aria-label=${`„${it.title}“ löschen`} onClick=${() => del(it)} /></div>
        <div class="tk-tsk-inbox__acts">${acts(it)}</div></div>`; })}</div><//>`;
  },
};
export default taskInbox;
