import { isoDay } from '../../../lib/util.js';
// Aufgaben: Liste mit Priorität, relativer Fälligkeit, Gruppierung, Unteraufgaben-Zähler, abhakbar.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Check, Badge, EmptyState, Input, Button, Icon, toneColor } from '../../ui.js';
import { groupBy } from '../../helpers.js';
import { rankedOpen } from './_tasks-x.js';
import { dueInfo, filterTasks, sortTasks, prio, toggleTask, PrioFlag, DueText, SubCount, RepeatIcon, GROUP_ORDER, TASK_CSS } from './_tasks.js';

const groupKey = { due: (t, today) => dueInfo(t, today).group, priority: (t) => prio(t).label, project: (t) => t.project || 'Ohne Projekt', category: (t) => t.category || 'Ohne Kategorie' };

export const taskList = {
  id: 'task-list',
  name: 'Aufgabenliste',
  category: 'Aufgaben',
  description: 'Aufgaben mit Priorität, Fälligkeit relativ zu „heute“ (überfällig rot), Projekt, Unteraufgaben-Zähler und Abhaken. Gruppierung nach Fälligkeit, Priorität, Projekt oder Kategorie. Auswahl setzt ctx.ui.selectedId (Master-Detail).',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Aufgaben' },
    { name: 'groupBy', label: 'Gruppieren nach', type: 'select', options: ['none', 'due', 'priority', 'project', 'category'], default: 'due' },
    { name: 'showDone', label: 'Erledigte zeigen', type: 'boolean', default: true },
    { name: 'showProject', label: 'Projekt anzeigen', type: 'boolean', default: true },
    { name: 'skipNext', label: 'Nächste Aufgabe auslassen („Jetzt dran“)', type: 'boolean', default: false },
    { name: 'showPriorityLabel', label: 'Priorität als Text', type: 'boolean', default: false },
    { name: 'dense', label: 'Kompakt', type: 'boolean', default: false },
    { name: 'inlineAdd', label: 'Eingabezeile oben', type: 'boolean', default: false },
    { name: 'selectable', label: 'Auswählbar (Master-Detail)', type: 'boolean', default: true },
    { name: 'limit', label: 'Max. Einträge (0 = alle)', type: 'number', default: 0 },
    { name: 'respectFilter', label: 'Suche/Filter beachten', type: 'boolean', default: true },
    { name: 'flush', label: 'Ohne Kartenrahmen', type: 'boolean', default: false },
  ],
  data: [{ slot: 'tasks', label: 'Aufgaben', default: 'tasks', shape: '{id,title,due?,priority?,project?,category?,done?,status?,subtasks?:[{id,title,done}],repeat?}[]', required: true }],
  events: ['task.toggle', 'task.open', 'task.create'],
  states: ['empty'],
  css: `${TASK_CSS}
  .tk-tl__group { padding:10px 16px 6px; display:flex; gap:8px; align-items:center; font-size:var(--tk-fs-xs); font-weight:var(--tk-fw-semibold); letter-spacing:var(--tk-ls-wide); text-transform:uppercase; color:var(--tk-c-text-subtle); background:var(--tk-c-surface2); border-bottom:1px solid var(--tk-c-border); }
  .tk-tl__group[data-danger="true"] { color:var(--tk-c-danger); }
  .tk-tl__row { display:flex; align-items:center; gap:12px; padding:10px 16px; min-height:56px; border-bottom:1px solid var(--tk-c-border); cursor:pointer; min-width:0; }
  .tk-tl--dense .tk-tl__row { min-height:44px; padding-top:6px; padding-bottom:6px; }
  .tk-tl__row:hover { background:var(--tk-c-surface2); }
  .tk-tl__row[aria-selected="true"] { background:var(--tk-c-accent-soft); }
  .tk-tl__row:last-child { border-bottom:0; }
  .tk-tl__title { font-weight:var(--tk-fw-medium); } .tk-tl__title[data-done="true"] { text-decoration:line-through; color:var(--tk-c-text-subtle); }
  .tk-tl__meta { display:flex; align-items:center; gap:10px; margin-top:2px; min-width:0; flex-wrap:wrap; }
  .tk-tl__proj { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); display:inline-flex; align-items:center; gap:5px; }
  .tk-tl__proj i { width:7px; height:7px; border-radius:2px; background:var(--pc); display:block; }
  .tk-tl__add { display:flex; gap:8px; padding:10px 12px; border-bottom:1px solid var(--tk-c-border); }
  .tk-tl__add .tk-input { border-color:transparent; background:transparent; }
  .bp-mobile .tk-tl__row { min-height:60px; }
  .bp-mobile .tk-tl--dense .tk-tl__row { min-height:52px; }`,
  example: { props: { title: 'Heute & bald' }, data: { tasks: [
    { id: 't1', title: 'Angebot Müller GmbH finalisieren', due: '2026-11-24T14:00:00', priority: 'hoch', project: 'Vertrieb', subtasks: [{ id: 's1', title: 'Preise prüfen', done: true }, { id: 's2', title: 'PDF erzeugen', done: false }] },
    { id: 't2', title: 'Belege Oktober hochladen', due: '2026-11-23', priority: 'mittel', project: 'Finanzen' },
    { id: 't3', title: 'Produktfotos Winterkollektion', due: '2026-11-25', priority: 'mittel', project: 'Shop', repeat: 'Wöchentlich' },
    { id: 't4', title: 'Steuerberater bestätigen', due: '2026-11-26', priority: 'niedrig', project: 'Finanzen', done: true },
  ] } },
  render: function TaskList({ props, data, setData, ctx }) {
    const [draft, setDraft] = useState(''), [adding, setAdding] = useState(false);
    const all = Array.isArray(data.tasks) ? data.tasks : [];
    let items = filterTasks(all, props.respectFilter ? ctx.ui : {}, ctx.today);
    if (!props.showDone) items = items.filter((t) => !t.done);
    items = [...items].sort(sortTasks);
    if (props.skipNext) { const top = rankedOpen(all, ctx.today)[0]; if (top) items = items.filter((t) => t.id !== top.id); }
    if (props.limit > 0) items = items.slice(0, props.limit);
    const projects = [...new Set(all.map((t) => t.project).filter(Boolean))];
    const open = (t) => { if (props.selectable) ctx.setUi('selectedId', t.id); ctx.emit('task.open', { id: t.id }); };
    const add = () => { const v = draft.trim(); if (!v) return; const t = { id: ctx.newId('t'), title: v, priority: 'mittel', done: false, status: 'Offen', due: isoDay(ctx.today), subtasks: [] }; setData('tasks', (a) => [t, ...a]); ctx.emit('task.create', { title: v }); ctx.toast(`„${v}“ angelegt`); setDraft(''); };
    const row = (t) => html`<div class="tk-tl__row" role="button" tabindex="0" aria-selected=${ctx.ui.selectedId === t.id ? 'true' : 'false'} onClick=${() => open(t)} onKeyDown=${(e) => e.key === 'Enter' && open(t)}>
      <${Check} checked=${t.done} onChange=${() => toggleTask(ctx, setData, t)} label=${`${t.title} erledigt`} />
      <div class="tk-grow"><div class="tk-tl__title tk-truncate" data-done=${!!t.done}>${t.title}</div>
        <div class="tk-tl__meta">${t.due && html`<${DueText} t=${t} today=${ctx.today} />`}
          ${props.showProject && t.project && html`<span class="tk-tl__proj"><i style=${`--pc:${toneColor(1 + (projects.indexOf(t.project) % 6))}`}></i>${t.project}</span>`}
          <${SubCount} t=${t} /><${RepeatIcon} t=${t} /></div></div>
      <${PrioFlag} t=${t} label=${props.showPriorityLabel && ctx.bp !== 'mobile'} />
    </div>`;
    let body;
    if (!items.length) {
      const filtered = !!(ctx.ui.query || ctx.ui.filter);
      body = filtered ? html`<${EmptyState} icon="search" title="Keine Treffer" text=${ctx.ui.query ? `Keine Aufgaben für „${ctx.ui.query}“. Prüfe die Schreibweise.` : 'Keine Aufgaben in diesem Filter.'} />`
        : all.length ? html`<${EmptyState} icon="check-check" title="Nichts mehr offen" text="Alle Aufgaben sind erledigt." />`
        : html`<${EmptyState} icon="list-checks" title="Keine Aufgaben" text="Was du erledigen willst, sammelst du hier." action=${adding ? null : html`<${Button} variant="primary" icon="plus" onClick=${() => setAdding(true)}>Aufgabe hinzufügen<//>`} />`;
    }
    else if (props.groupBy && props.groupBy !== 'none') {
      const g = groupBy(items, (t) => groupKey[props.groupBy](t, ctx.today));
      if (props.groupBy === 'due') g.sort((a, b) => GROUP_ORDER.indexOf(a[0]) - GROUP_ORDER.indexOf(b[0]));
      body = g.map(([name, list]) => html`<div><div class="tk-tl__group" data-danger=${name === 'Überfällig'}>${name === 'Überfällig' && html`<${Icon} name="alert-circle" size=${13} />`}<span>${name}</span><span class="tk-subtle">${list.length}</span></div>${list.map(row)}</div>`);
    } else body = items.map(row);
    const openCount = all.filter((t) => !t.done).length;
    return html`<${Card} flush=${true} class=${`tk-tl ${props.dense ? 'tk-tl--dense' : ''}`} style=${props.flush ? 'border:0;background:transparent' : ''} title=${props.title} actions=${props.title && html`<${Badge}>${openCount} offen<//>`}>
      ${(props.inlineAdd || adding) && html`<div class="tk-tl__add"><${Input} autoFocus=${adding} value=${draft} onInput=${setDraft} placeholder="Neue Aufgabe … (Enter)" aria-label="Neue Aufgabe" onKeyDown=${(e) => e.key === 'Enter' && add()} /><${Button} variant="primary" icon="plus" aria-label="Hinzufügen" onClick=${add} /></div>`}
      ${body}<//>`;
  },
};
export default taskList;
