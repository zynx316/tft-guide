// Aufgaben: Kennzahlen aus den Aufgaben (heute fällig, überfällig, Eingang, erledigt, Fokus) – berechnet, mit Sprung in den Bereich.
import { html } from '../../../lib/html.js';
import { Icon, EmptyState, Sparkline } from '../../ui.js';
import { dayKey, startOfWeek } from '../calendar/_cal.js';
import { dueToday, overdueTasks, planMinutes, hoursOf, doneByDay, sessionsOn } from './_tasks-x.js';

export const taskStats = {
  id: 'task-stats',
  name: 'Aufgaben-Kennzahlen',
  category: 'Aufgaben',
  description: 'Kennzahlen, die sich aus den Aufgaben berechnen: heute fällig (mit geplanter Zeit), überfällig, Eingang, diese Woche erledigt und Fokus-Blöcke heute. Jede Kachel führt in den passenden Bereich.',
  version: '1.0',
  props: [
    { name: 'style', label: 'Darstellung', type: 'select', options: ['tiles', 'strip'], default: 'tiles' },
    { name: 'items', label: 'Kennzahlen', type: 'list', default: ['today', 'overdue', 'inbox', 'done', 'focus'] },
  ],
  data: [
    { slot: 'tasks', label: 'Aufgaben', default: 'tasks', shape: '{id,title,due?,estimate?,done?,doneAt?}[]', required: true },
    { slot: 'inbox', label: 'Eingang', default: 'inbox', shape: '{id,title}[]', required: false },
    { slot: 'activity', label: 'Archivierte Erledigungen', default: 'activity', shape: '{day,archived}[]', required: false },
    { slot: 'log', label: 'Fokus-Sitzungen', default: 'log', shape: '{id,start,minutes}[]', required: false },
  ],
  events: ['list.open', 'overdue.open', 'inbox.open', 'focus.open'],
  states: ['empty'],
  css: `
  .tk-tsk-stats { display:grid; gap:var(--tk-space-3); grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); min-width:0; }
  .tk-tsk-stats__tile { display:flex; flex-direction:column; gap:4px; text-align:left; font:inherit; color:var(--tk-c-text); background:var(--tk-c-surface); border:1px solid var(--tk-c-border); border-radius:var(--tk-radius-lg); padding:var(--tk-space-3) var(--tk-space-4); cursor:pointer; min-height:96px; min-width:0; position:relative; }
  .tk-tsk-stats__tile:hover { border-color:var(--tk-c-border-strong); }
  .tk-tsk-stats__tile[data-tone="danger"] { border-color:color-mix(in srgb, var(--tk-c-danger) 45%, var(--tk-c-border)); }
  .tk-tsk-stats__label { display:flex; align-items:center; gap:6px; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); }
  .tk-tsk-stats__tile[data-tone="danger"] .tk-tsk-stats__label { color:var(--tk-c-danger); }
  .tk-tsk-stats__value { font-size:var(--tk-fs-2xl); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); font-variant-numeric:tabular-nums; line-height:1.1; }
  .tk-tsk-stats__sub { font-size:var(--tk-fs-sm); color:var(--tk-c-text-subtle); }
  .tk-tsk-stats__spark { position:absolute; right:12px; bottom:12px; }
  .tk-tsk-stats--strip { display:flex; flex-wrap:wrap; gap:6px; }
  .tk-tsk-stats--strip .tk-tsk-stats__tile { flex-direction:row; align-items:center; gap:8px; min-height:44px; padding:6px 14px; border-radius:var(--tk-radius-pill); }
  .tk-tsk-stats--strip .tk-tsk-stats__value { font-size:var(--tk-fs-lg); } .tk-tsk-stats--strip .tk-tsk-stats__sub, .tk-tsk-stats--strip .tk-tsk-stats__spark { display:none; }
  .bp-mobile .tk-tsk-stats { grid-template-columns:repeat(2, minmax(0,1fr)); gap:var(--tk-space-2); } .bp-mobile .tk-tsk-stats__tile { padding:var(--tk-space-3); }`,
  example: { data: { tasks: [{ id: 'a', title: 'Angebot', due: '2026-11-24', estimate: 60 }, { id: 'b', title: 'Belege', due: '2026-11-23' }, { id: 'c', title: 'Fotos', due: '2026-11-25', done: true, doneAt: '2026-11-24' }], inbox: [{ id: 'i', title: 'Rückruf' }], activity: [], log: [] } },
  render: ({ props, data, ctx }) => {
    const tasks = Array.isArray(data.tasks) ? data.tasks : [], inbox = Array.isArray(data.inbox) ? data.inbox : [];
    if (!tasks.length && !inbox.length) return html`<${EmptyState} icon="list-checks" title="Noch keine Aufgaben" text="Sobald Aufgaben existieren, erscheinen hier die Kennzahlen." />`;
    const today = dueToday(tasks, ctx.today), over = overdueTasks(tasks, ctx.today), week = doneByDay(tasks, data.activity, 7, ctx.today);
    const ws = startOfWeek(ctx.today), wk = week.filter((d) => +d.day >= +ws).reduce((n, d) => n + d.done, 0), sess = sessionsOn(data.log, dayKey(ctx.today)).length;
    const T = {
      today: { icon: 'list-checks', label: 'Heute fällig', value: today.length, sub: today.length ? `${hoursOf(planMinutes(today))} geplant` : 'nichts fällig', ev: 'list.open' },
      overdue: { icon: 'alert-circle', label: 'Überfällig', value: over.length, sub: over.length ? 'zuerst erledigen' : 'alles im Plan', ev: 'overdue.open', tone: over.length ? 'danger' : null },
      inbox: { icon: 'inbox', label: 'Im Eingang', value: inbox.length, sub: inbox.length ? 'noch zu sortieren' : 'Eingang leer', ev: 'inbox.open' },
      done: { icon: 'check-circle-2', label: 'Diese Woche erledigt', value: wk, sub: 'seit Montag', ev: 'list.open', spark: week.map((d) => d.done) },
      focus: { icon: 'timer', label: 'Fokus heute', value: sess, sub: sess === 1 ? 'Block à 25 Min.' : 'Blöcke à 25 Min.', ev: 'focus.open' },
    };
    const keys = (Array.isArray(props.items) ? props.items : String(props.items || '').split(',').map((s) => s.trim())).filter((k) => T[k]);
    return html`<div class=${`tk-tsk-stats tk-tsk-stats--${props.style}`} data-qa="task-stats" role="list">${keys.map((k) => { const t = T[k];
      return html`<button type="button" role="listitem" class="tk-tsk-stats__tile" data-tone=${t.tone} onClick=${() => ctx.emit(t.ev, { id: k })} aria-label=${`${t.label}: ${t.value}`}>
        <span class="tk-tsk-stats__label"><${Icon} name=${t.icon} size=${15} />${t.label}</span><span class="tk-tsk-stats__value">${t.value}</span><span class="tk-tsk-stats__sub">${t.sub}</span>
        ${t.spark && html`<span class="tk-tsk-stats__spark"><${Sparkline} values=${t.spark} width=${64} height=${26} tone="success" /></span>`}</button>`; })}</div>`;
  },
};
export default taskStats;
