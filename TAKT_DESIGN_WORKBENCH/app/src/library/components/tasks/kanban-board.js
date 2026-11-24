// Aufgaben: Kanban-Board mit HTML5-Drag&Drop, Verschieben-Menü (Touch), Mobile: wischbare Spalten mit scroll-snap.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Badge, Button, Icon, Input, EmptyState, toneColor } from '../../ui.js';
import { toList } from '../../helpers.js';
import { isoDay } from '../../../lib/util.js';
import { dueInfo, filterTasks, sortTasks, PrioFlag, DueText, SubCount, STATUSES, TASK_CSS, prio } from './_tasks.js';

const COL_TONE = { Offen: 'neutral', 'In Arbeit': 'accent', Review: 'warning', Erledigt: 'success' };
const statusOf = (t, cols) => (cols.includes(t.status) ? t.status : t.done ? cols[cols.length - 1] : cols[0]);

export const kanbanBoard = {
  id: 'kanban-board',
  name: 'Kanban-Board',
  category: 'Aufgaben',
  description: 'Spalten nach Status, Karten per Drag & Drop oder über das Verschieben-Menü bewegbar. Mobile: wischbare Spalten mit scroll-snap innerhalb des Blocks.',
  version: '1.0',
  props: [
    { name: 'columns', label: 'Spalten (Status)', type: 'list', default: STATUSES },
    { name: 'showProject', label: 'Projekt anzeigen', type: 'boolean', default: true },
    { name: 'showSubtasks', label: 'Unteraufgaben-Zähler', type: 'boolean', default: true },
    { name: 'quickAdd', label: 'Karte je Spalte anlegen', type: 'boolean', default: true },
    { name: 'compact', label: 'Kompakte Karten', type: 'boolean', default: false },
    { name: 'respectFilter', label: 'Suche/Filter beachten', type: 'boolean', default: true },
  ],
  data: [{ slot: 'tasks', label: 'Aufgaben', default: 'tasks', shape: '{id,title,status?,priority?,due?,project?,subtasks?}[]', required: true }],
  events: ['kanban.move', 'task.open', 'task.create'],
  states: ['empty'],
  css: `${TASK_CSS}
  .tk-kb { display:grid; grid-auto-flow:column; grid-auto-columns:minmax(230px, 1fr); gap:var(--tk-space-3); overflow-x:auto; scroll-snap-type:x proximity; padding-bottom:6px; align-items:start; min-width:0; max-width:100%; scrollbar-width:thin; }
  .bp-mobile .tk-kb { grid-auto-columns:84%; scroll-snap-type:x mandatory; }
  .bp-tablet .tk-kb { grid-auto-columns:minmax(250px, 42%); }
  .tk-kb__col { scroll-snap-align:start; background:var(--tk-c-surface2); border:1px solid var(--tk-c-border); border-radius:var(--tk-radius-lg); display:flex; flex-direction:column; min-width:0; max-height:none; transition:border-color var(--tk-motion-fast), background var(--tk-motion-fast); }
  .tk-kb__col[data-over="true"] { border-color:var(--tk-c-accent); background:var(--tk-c-accent-soft); }
  .tk-kb__head { display:flex; align-items:center; gap:8px; padding:12px 12px 8px; font-weight:var(--tk-fw-semibold); font-size:var(--tk-fs-md); }
  .tk-kb__head i { width:9px; height:9px; border-radius:50%; background:var(--cc); display:block; flex:none; }
  .tk-kb__cards { display:flex; flex-direction:column; gap:8px; padding:4px 8px 10px; min-height:64px; }
  .tk-kb__card { background:var(--tk-c-surface); border:1px solid var(--tk-c-border); border-radius:var(--tk-radius-md); padding:10px 10px 10px 12px; cursor:grab; display:flex; flex-direction:column; gap:8px; text-align:left; font:inherit; color:var(--tk-c-text); box-shadow:var(--tk-shadow-sm); min-width:0; position:relative; }
  .tk-kb__card:hover { border-color:var(--tk-c-border-strong); }
  .tk-kb__card[data-sel="true"] { border-color:var(--tk-c-accent); }
  .tk-kb__card[data-drag="true"] { opacity:.45; }
  .tk-kb__card::before { content:''; position:absolute; left:0; top:10px; bottom:10px; width:3px; border-radius:0 2px 2px 0; background:var(--pc); }
  .tk-kb__title { font-weight:var(--tk-fw-medium); line-height:1.3; display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:3; overflow:hidden; word-break:break-word; }
  .tk-kb__card[data-done="true"] .tk-kb__title { text-decoration:line-through; color:var(--tk-c-text-subtle); }
  .tk-kb__foot { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
  .tk-kb__proj { font-size:var(--tk-fs-xs); }
  .tk-kb__add { display:flex; gap:6px; padding:0 8px 10px; } .tk-kb__add .tk-input { height:36px; }
  .tk-kb__move { margin-left:auto; }
  .bp-mobile .tk-kb__move { width:44px; height:44px; margin:-8px -6px -8px auto; }
  .tk-kb__moveopt { display:flex; align-items:center; gap:10px; width:100%; min-height:48px; border:1px solid var(--tk-c-border); background:var(--tk-c-surface); color:var(--tk-c-text); border-radius:var(--tk-radius-md); padding:0 14px; font:inherit; cursor:pointer; }
  .tk-kb__moveopt[aria-current="true"] { border-color:var(--tk-c-accent); background:var(--tk-c-accent-soft); }`,
  example: { data: { tasks: [
    { id: 'k1', title: 'Angebot Müller GmbH', status: 'In Arbeit', priority: 'hoch', due: '2026-11-24', project: 'Vertrieb', subtasks: [{ id: 'a', title: 'x', done: true }, { id: 'b', title: 'y', done: false }] },
    { id: 'k2', title: 'Produktfotos Winterkollektion', status: 'Offen', priority: 'mittel', due: '2026-11-25', project: 'Shop' },
    { id: 'k3', title: 'Belege Oktober', status: 'Review', priority: 'niedrig', due: '2026-11-23', project: 'Finanzen' },
    { id: 'k4', title: 'Newsletter versendet', status: 'Erledigt', done: true, priority: 'mittel', project: 'Shop' },
  ] } },
  render: function KanbanBoard({ props, data, setData, ctx }) {
    const [dragId, setDragId] = useState(null);
    const [over, setOver] = useState(null);
    const [draft, setDraft] = useState({});
    const cols = toList(props.columns); const last = cols[cols.length - 1];
    const all = Array.isArray(data.tasks) ? data.tasks : [];
    const items = filterTasks(all, props.respectFilter ? ctx.ui : {}, ctx.today);
    const projects = [...new Set(all.map((t) => t.project).filter(Boolean))];
    if (!all.length) return html`<${EmptyState} icon="kanban" title="Noch keine Aufgaben" text="Lege Aufgaben an, um sie auf dem Board zu organisieren." />`;
    const move = (id, to) => {
      const t = all.find((x) => x.id === id); if (!t || statusOf(t, cols) === to) return;
      setData('tasks', (a) => a.map((x) => (x.id === id ? { ...x, status: to, done: to === last, doneAt: to === last ? isoDay(ctx.today) : undefined } : x)));
      ctx.emit('kanban.move', { id, from: statusOf(t, cols), to }); ctx.toast(`„${t.title}“ → ${to}`);
    };
    const openMove = (t) => ctx.openDialog({ title: 'Verschieben nach …', body: (close) => html`<div class="tk-col" style="gap:8px">${cols.map((c) => html`<button type="button" class="tk-kb__moveopt" aria-current=${statusOf(t, cols) === c} onClick=${() => { move(t.id, c); close(); }}><i class="tk-dot" style=${`color:${toneColor(COL_TONE[c] || 'accent')}`}></i><span class="tk-grow" style="text-align:left">${c}</span>${statusOf(t, cols) === c && html`<${Icon} name="check" size=${16} />`}</button>`)}</div>` });
    const addCard = (c) => { const v = (draft[c] || '').trim(); if (!v) return; const t = { id: `t${Date.now().toString(36)}`, title: v, status: c, priority: 'mittel', done: c === last, subtasks: [] }; setData('tasks', (a) => [t, ...a]); ctx.emit('task.create', { title: v, status: c }); ctx.toast(`„${v}“ angelegt`); setDraft({ ...draft, [c]: '' }); };
    return html`<div class="tk-kb" data-scroll-x role="list" aria-label="Kanban-Board">
      ${cols.map((c) => { const list = items.filter((t) => statusOf(t, cols) === c).sort(sortTasks);
        return html`<div class="tk-kb__col" role="listitem" data-over=${over === c} onDragOver=${(e) => { e.preventDefault(); setOver(c); }} onDragLeave=${(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOver(null); }} onDrop=${(e) => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain') || dragId; setOver(null); setDragId(null); if (id) move(id, c); }}>
          <div class="tk-kb__head"><i style=${`--cc:${toneColor(COL_TONE[c] || 'accent')}`}></i><span class="tk-grow tk-truncate">${c}</span><${Badge}>${list.length}<//></div>
          <div class="tk-kb__cards">
            ${list.map((t) => { const p = prio(t); const d = dueInfo(t, ctx.today);
              return html`<div class="tk-kb__card" draggable="true" role="button" tabindex="0" data-drag=${dragId === t.id} data-sel=${ctx.ui.selectedId === t.id} data-done=${!!t.done} style=${`--pc:${toneColor(p.tone)}`}
                onDragStart=${(e) => { e.dataTransfer.setData('text/plain', t.id); e.dataTransfer.effectAllowed = 'move'; setDragId(t.id); }} onDragEnd=${() => { setDragId(null); setOver(null); }}
                onClick=${() => { ctx.setUi('selectedId', t.id); ctx.emit('task.open', { id: t.id }); }} onKeyDown=${(e) => e.key === 'Enter' && ctx.emit('task.open', { id: t.id })}>
                <div class="tk-kb__title">${t.title}</div>
                ${!props.compact && html`<div class="tk-kb__foot">
                  ${t.due && !t.done && html`<${DueText} t=${t} today=${ctx.today} />`}${props.showSubtasks && html`<${SubCount} t=${t} />`}
                  ${props.showProject && t.project && html`<${Badge} tone="accent" class="tk-kb__proj">${t.project}<//>`}</div>`}
                <div class="tk-kb__foot"><${PrioFlag} t=${t} label=${true} />
                  <${Button} size="sm" variant="ghost" icon="more-horizontal" class="tk-kb__move" aria-label=${`„${t.title}“ verschieben`} onClick=${(e) => { e.stopPropagation(); openMove(t); }} /></div>
              </div>`; })}
            ${!list.length && html`<div class="tk-subtle" style="text-align:center;padding:14px 4px;font-size:var(--tk-fs-sm)">${over === c ? 'Hier ablegen' : 'Keine Karten'}</div>`}
          </div>
          ${props.quickAdd && html`<div class="tk-kb__add"><${Input} value=${draft[c] || ''} onInput=${(v) => setDraft({ ...draft, [c]: v })} placeholder="+ Karte hinzufügen" aria-label=${`Karte in ${c} anlegen`} onKeyDown=${(e) => e.key === 'Enter' && addCard(c)} /></div>`}
        </div>`; })}
    </div>`;
  },
};
export default kanbanBoard;
