// Aufgaben: Projekt-Übersicht mit Fortschritt; Antippen filtert Aufgaben-Blöcke (ctx.ui.filter).
import { html } from '../../../lib/html.js';
import { Card, Badge, Progress, EmptyState, Icon, toneColor } from '../../ui.js';
import { dueInfo, TASK_CSS } from './_tasks.js';

export const projectList = {
  id: 'project-list',
  name: 'Projekte',
  category: 'Aufgaben',
  description: 'Projekte aus den Aufgaben abgeleitet: offene/erledigte Aufgaben, Fortschritt und nächste Fälligkeit. Antippen filtert verknüpfte Aufgabenlisten nach Projekt.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Projekte' },
    { name: 'showProgress', label: 'Fortschrittsbalken', type: 'boolean', default: true },
  ],
  data: [{ slot: 'tasks', label: 'Aufgaben', default: 'tasks', shape: 'Aufgaben mit project', required: true }],
  events: ['project.select', 'filter.change'],
  states: ['empty'],
  css: `${TASK_CSS}
  .tk-pl__row { display:flex; flex-direction:column; gap:8px; width:100%; border:0; border-bottom:1px solid var(--tk-c-border); background:transparent; font:inherit; color:var(--tk-c-text); text-align:left; padding:12px 16px; cursor:pointer; min-height:64px; }
  .tk-pl__row:last-child { border-bottom:0; } .tk-pl__row:hover { background:var(--tk-c-surface2); }
  .tk-pl__row[aria-pressed="true"] { background:var(--tk-c-accent-soft); }
  .tk-pl__sw { width:10px; height:10px; border-radius:3px; background:var(--pc); flex:none; }`,
  example: { data: { tasks: [
    { id: 'a', title: 'Angebot', project: 'Vertrieb', due: '2026-11-24' }, { id: 'b', title: 'Preisliste', project: 'Vertrieb', done: true },
    { id: 'c', title: 'Belege', project: 'Finanzen', due: '2026-11-23' }, { id: 'd', title: 'Fotos', project: 'Shop', due: '2026-11-25' },
  ] } },
  render: ({ props, data, ctx }) => {
    const tasks = Array.isArray(data.tasks) ? data.tasks : [];
    const names = [...new Set(tasks.map((t) => t.project).filter(Boolean))];
    if (!names.length) return html`<${Card} title=${props.title}><${EmptyState} icon="folder" title="Keine Projekte" text="Ordne Aufgaben einem Projekt zu, um sie hier zu bündeln." /><//>`;
    const active = ctx.ui.filter && names.includes(ctx.ui.filter) ? ctx.ui.filter : null;
    const pick = (n) => { const v = active === n ? 'Alle' : n; ctx.setUi('filter', v); ctx.emit('project.select', { project: n }); ctx.emit('filter.change', { filter: v }); };
    return html`<${Card} flush=${true} title=${props.title} icon="folder" actions=${html`<${Badge}>${names.length}<//>`}>
      ${names.map((n, i) => { const ts = tasks.filter((t) => t.project === n); const done = ts.filter((t) => t.done).length; const open = ts.filter((t) => !t.done);
        const next = open.filter((t) => t.due).sort((a, b) => String(a.due).localeCompare(b.due))[0]; const od = open.filter((t) => dueInfo(t, ctx.today).overdue).length;
        return html`<button type="button" class="tk-pl__row" aria-pressed=${active === n} onClick=${() => pick(n)} style=${`--pc:${toneColor(1 + (i % 6))}`}>
          <span class="tk-row"><span class="tk-pl__sw"></span><b class="tk-grow tk-truncate">${n}</b>${od > 0 && html`<${Badge} tone="danger">${od} überfällig<//>`}<span class="tk-subtle tk-num" style="font-size:var(--tk-fs-sm)">${done}/${ts.length}</span></span>
          ${props.showProgress && html`<${Progress} value=${done / ts.length} />`}
          ${next && html`<span class="tk-subtle" style="font-size:var(--tk-fs-sm)">Nächste Fälligkeit: ${dueInfo(next, ctx.today).text} · ${next.title}</span>`}
        </button>`; })}
    <//>`;
  },
};
export default projectList;
