// Einkauf & Haushalt: Wartung – fällig und überfällig, Abhaken setzt die nächste Fälligkeit (core/recurrence.js), „Als Aufgabe planen“ legt eine Aufgabe an.
// Stile: Liste nach Dringlichkeit (list), Jahresübersicht mit Monatsraster (year), Kurzfassung für die Startseite (summary).
import { html } from '../../../lib/html.js';
import { Card, Button, Icon, Badge, EmptyState } from '../../ui.js';
import { SHP_CSS, slots, ex, useShop, useUndo, UndoBar, Tile } from './_shopping.js';
import { householdSorted, dueText, ruleText, finishHousehold, linkedTask, taskFor, projected, dueCount, arr } from './_logic.js';
import { fmtDate } from '../../../lib/format.js';
import { MONTHS_LONG } from '../../../lib/date.js';

const STATE = { overdue: ['Überfällig', 'warning', 'alert-triangle'], today: ['Heute', 'accent', 'clock'], soon: ['Bald', 'info', 'calendar-clock'], later: ['Später', 'neutral', 'calendar-check'] };

export const shopHousehold = {
  id: 'shop-household',
  name: 'Haushalt & Wartung',
  category: 'Einkauf',
  description: 'Wiederkehrende Haushaltsaufgaben mit Fälligkeit: überfällig, heute, bald. „Erledigt“ setzt die nächste Fälligkeit aus der Wiederholungsregel, „Als Aufgabe planen“ legt eine Aufgabe an. Stile: Liste, Jahresübersicht, Kurzfassung.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Haushalt & Wartung' },
    { name: 'style', label: 'Stil', type: 'select', options: ['list', 'year', 'summary'], default: 'list' },
    { name: 'limit', label: 'Max. Einträge (0 = alle)', type: 'number', default: 0 },
    { name: 'showPlan', label: '„Als Aufgabe planen“', type: 'boolean', default: true },
    { name: 'framed', label: 'In Karte', type: 'boolean', default: true },
  ],
  data: slots('household', 'tasks', 'lists', 'templates'),
  events: ['hh.done', 'hh.plan', 'hh.task.open', 'hh.open', 'hh.adopt', 'item.undo'],
  states: ['empty'],
  a11y: { role: 'list', nameFrom: 'Titel' },
  flutter: { widget: 'ShopHousehold', propMap: { style: 'style', limit: 'limit' }, events: ['hh.done', 'hh.plan', 'hh.open'] },
  css: `${SHP_CSS}
  .tk-shph-row { display:flex; align-items:center; gap:12px; padding:12px 0; border-bottom:1px solid var(--tk-c-border); flex-wrap:wrap; min-width:0; } .tk-shph-row:last-child { border-bottom:0; }
  .tk-shph-main { flex:1 1 140px; min-width:0; } .tk-shph-name { font-weight:var(--tk-fw-semibold); overflow-wrap:anywhere; }
  .tk-shph-acts { display:flex; gap:6px; flex-wrap:wrap; margin-left:auto; }
  .tk-shph-hero { display:flex; gap:14px; align-items:center; padding:16px; border-radius:var(--tk-radius-lg); background:color-mix(in srgb, var(--tc) 10%, var(--tk-c-surface)); border:1px solid color-mix(in srgb, var(--tc) 35%, var(--tk-c-border)); flex-wrap:wrap; }
  .tk-shph-year { display:flex; flex-direction:column; gap:10px; }
  .tk-shph-ycard { padding:12px 14px; border-radius:var(--tk-radius-lg); background:var(--tk-c-surface); border:1px solid var(--tk-c-border); display:flex; flex-direction:column; gap:8px; min-width:0; }
  .tk-shph-months { display:grid; grid-template-columns:repeat(12, minmax(0, 1fr)); gap:3px; }
  .tk-shph-m { height:26px; border-radius:var(--tk-radius-xs); background:var(--tk-c-surface3); display:grid; place-items:center; font-size:10px; color:var(--tk-c-text-subtle); }
  .tk-shph-m[data-on="true"] { background:var(--tc); color:var(--tk-c-text-on-accent); font-weight:var(--tk-fw-bold); }
  .tk-shph-m[data-over="true"] { background:var(--tk-c-danger); color:var(--tk-c-text-on-accent); font-weight:var(--tk-fw-bold); }
  .tk-shph-legend { display:grid; grid-template-columns:repeat(12, minmax(0, 1fr)); gap:3px; font-size:10px; color:var(--tk-c-text-subtle); text-align:center; }
  .tk-shph-link { background:none; border:0; padding:0; font:inherit; font-size:var(--tk-fs-xs); color:var(--tk-c-accent); cursor:pointer; text-decoration:underline; min-height:24px; }`,
  example: { data: ex('household', 'tasks', 'lists', 'templates') },
  render: function ShopHousehold({ props, data, setData, ctx }) {
    const { today, views } = useShop(data, ctx);
    const [u, setU] = useUndo();
    const list = householdSorted(data.household, today), shown = props.limit ? list.slice(0, props.limit) : list;
    const wrap = (b, n) => (props.framed ? html`<${Card} title=${props.title} icon="house" actions=${n > 0 ? html`<${Badge} tone="warning">${n} fällig<//>` : null}>${b}<//>` : html`<div class="tk-shp">${b}</div>`);
    const materials = (t) => views.flatMap((l) => (l.items || []).filter((i) => i.for === t.id && !i.done)).length;
    const done = (t) => {
      const r = finishHousehold(setData, data, t.id, today); if (!r) return; ctx.emit('hh.done', { id: t.id });
      setU({ text: `${t.name}: erledigt. Nächstes Mal ${fmtDate(r.next.due, { style: 'weekday' })}${r.next.due.slice(0, 4) !== today.slice(0, 4) ? ` ${r.next.due.slice(0, 4)}` : ''}`, restore: r.restore });
    };
    const plan = (t) => {
      const open = arr(data.tasks).find((x) => !x.done && x.status !== 'Erledigt' && x.title === t.name);
      const id = open ? open.id : ctx.newId('t-hh'), entry = open ? null : taskFor(t, today, id);
      if (entry) setData('tasks', (ts) => [entry, ...arr(ts)]);
      setData('household', (hs) => arr(hs).map((x) => (x.id === t.id ? { ...x, taskId: id } : x)));
      ctx.emit('hh.plan', { id: t.id, taskId: id }); ctx.toast(entry ? `Aufgabe angelegt: ${fmtDate(entry.due, { style: 'weekday' })}` : 'Die Aufgabe gibt es schon und ist jetzt verknüpft');
    };
    const adopt = (tpl) => { const id = ctx.newId('hh'); setData('household', (hs) => [...arr(hs), { ...tpl, id, lastDone: null, since: today, taskId: null }]); ctx.emit('hh.adopt', { id }); };
    if (!list.length) {
      const tpls = arr(data.templates);
      return wrap(html`<${EmptyState} icon="house" title="Noch keine Wartung" text="Rauchmelder, Heizkörper, Dunstabzug: TAKT erinnert dich, wenn etwas dran ist. Starte mit einem Vorschlag." />
        ${tpls.length > 0 && html`<div>${tpls.slice(0, 4).map((t) => html`<div class="tk-shph-row"><${Tile} icon=${t.icon} tone=${t.tone} size=${36} /><div class="tk-shph-main"><div class="tk-shph-name">${t.name}</div><div class="tk-shp-sub">${ruleText(t)}</div></div><${Button} size="sm" icon="plus" onClick=${() => adopt(t)}>Übernehmen<//></div>`)}</div>`}`, 0);
    }
    const Badges = (t) => { const [label, tone, icon] = STATE[t.state]; return html`<${Badge} tone=${tone} icon=${icon}>${label}<//>`; };
    const Acts = (t) => html`<div class="tk-shph-acts"><${Button} size="sm" variant=${t.state === 'later' ? 'default' : 'primary'} icon="check" aria-label=${`${t.name} erledigt`} onClick=${() => done(t)}>Erledigt<//>
      ${props.showPlan && (linkedTask(t, data.tasks) ? html`<button type="button" class="tk-shph-link" onClick=${() => ctx.emit('hh.task.open', { id: t.taskId, to: 'tasks.detail' })}>Aufgabe ansehen</button>` : html`<${Button} size="sm" icon="calendar-plus" aria-label=${`${t.name} als Aufgabe planen`} onClick=${() => plan(t)}>Als Aufgabe planen<//>`)}</div>`;
    const dueN = dueCount(data.household, today);
    if (props.style === 'summary') return wrap(html`<div>${shown.filter((t) => t.state !== 'later').slice(0, props.limit || 3).map((t) => html`<div class="tk-shph-row" key=${t.id}><${Tile} icon=${t.icon} tone=${t.tone} size=${36} /><div class="tk-shph-main"><div class="tk-shph-name">${t.name}</div><div class="tk-shp-sub">${dueText(t, today)}</div></div>
      <${Button} size="sm" variant="primary" icon="check" aria-label=${`${t.name} erledigt`} onClick=${() => done(t)}>Erledigt<//></div>`)}
      ${!shown.some((t) => t.state !== 'later') && html`<div class="tk-shp-sub" style="padding:8px 0">Nichts fällig. Als Nächstes: ${list[0].name}, ${dueText(list[0], today)}.</div>`}</div>
      <${UndoBar} u=${u} set=${setU} ctx=${ctx} /><${Button} variant="ghost" size="sm" iconRight="chevron-right" onClick=${() => ctx.emit('hh.open')}>Alle Wartungsaufgaben<//>`, dueN);
    if (props.style === 'year') {
      const first = list[0], mi = (iso) => (+iso.slice(0, 4) - +today.slice(0, 4)) * 12 + (+iso.slice(5, 7) - +today.slice(5, 7)), cur = +today.slice(5, 7) - 1;
      const labels = Array.from({ length: 12 }, (_, i) => MONTHS_LONG[(cur + i) % 12].slice(0, 1));
      return wrap(html`${first.state !== 'later' && html`<div class="tk-shph-hero" style=${`--tc:${first.state === 'overdue' ? 'var(--tk-c-danger)' : 'var(--tk-c-warning)'}`}><${Tile} icon=${first.icon} tone=${first.tone} size=${48} /><div class="tk-shph-main"><div class="tk-shp-sub">Als Nächstes</div><div class="tk-h3">${first.name}</div><div class="tk-shp-meta">${dueText(first, today)} · etwa ${first.minutes} Min.</div></div>${Acts(first)}</div>`}
        <div class="tk-shph-year"><div class="tk-shph-legend" aria-hidden="true">${labels.map((l) => html`<span>${l}</span>`)}</div>
        ${shown.map((t) => { const pts = projected(t, today), set = new Set(pts.map((d) => Math.max(0, mi(d)))); return html`<div class="tk-shph-ycard" key=${t.id} style=${'--tc:var(--tk-c-accent)'}>
          <div class="tk-row" style="gap:10px;flex-wrap:wrap"><${Tile} icon=${t.icon} tone=${t.tone} size=${32} /><div class="tk-grow"><div class="tk-shph-name">${t.name}</div><div class="tk-shp-sub">${ruleText(t)} · ${dueText(t, today)}</div></div>${Badges(t)}</div>
          <div class="tk-shph-months" role="img" aria-label=${`${t.name}: ${[...set].length} Termine in den nächsten 12 Monaten`}>${Array.from({ length: 12 }, (_, i) => html`<span class="tk-shph-m" data-on=${String(set.has(i))} data-over=${String(t.state === 'overdue' && i === 0)}>${set.has(i) ? (i === 0 && t.due < today ? '!' : '●') : ''}</span>`)}</div></div>`; })}</div><${UndoBar} u=${u} set=${setU} ctx=${ctx} />${props.limit > 0 && html`<${Button} variant="ghost" size="sm" iconRight="chevron-right" onClick=${() => ctx.emit('hh.open')}>Alle Wartungsaufgaben<//>`}`, dueN);
    }
    return wrap(html`<${UndoBar} u=${u} set=${setU} ctx=${ctx} />${shown.map((t) => html`<div class="tk-shph-row" key=${t.id}><${Tile} icon=${t.icon} tone=${t.tone} size=${40} />
      <div class="tk-shph-main"><div class="tk-shph-name">${t.name}</div><div class="tk-shp-sub">${ruleText(t)} · ${t.area}${materials(t) ? ` · Material auf der Liste: ${materials(t)}` : ''}</div>${t.note && html`<div class="tk-shp-sub">${t.note}</div>`}</div>
      <div style="display:flex;flex-direction:column;gap:2px;align-items:flex-end">${Badges(t)}<span class="tk-shp-sub">${dueText(t, today)}</span></div>${Acts(t)}</div>`)}`, dueN);
  },
};
export default shopHousehold;
