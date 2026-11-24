// Aufgaben: Tagesfortschritt (Ring) und Wochenverlauf (Säulen: erledigt + Fokus-Blöcke) – berechnet aus Aufgaben und Fokus-Log.
import { html } from '../../../lib/html.js';
import { Card, Badge, EmptyState } from '../../ui.js';
import { dayKey, WEEKDAYS } from '../calendar/_cal.js';
import { dueToday, overdueTasks, planMinutes, hoursOf, doneByDay, focusByDay } from './_tasks-x.js';

const TASK_SHAPE = '{id,title,due?,estimate?,done?,doneAt?}[]';

export const taskDayRing = {
  id: 'task-day-ring',
  name: 'Tagesfortschritt',
  category: 'Aufgaben',
  description: 'Ring mit „erledigt von heute“ (erledigte plus heute fällige Aufgaben) und Legende: noch offen, überfällig, geplante Zeit. Eine Botschaft: wie weit ist der Tag?',
  version: '1.0',
  props: [{ name: 'title', label: 'Titel', type: 'text', default: 'Heute' }],
  data: [
    { slot: 'tasks', label: 'Aufgaben', default: 'tasks', shape: TASK_SHAPE, required: true },
    { slot: 'activity', label: 'Archivierte Erledigungen', default: 'activity', shape: '{day,archived}[]', required: false },
  ],
  events: [],
  states: ['empty'],
  css: `
  .tk-tsk-ring { display:flex; align-items:center; gap:var(--tk-space-5); flex-wrap:wrap; }
  .tk-tsk-ring__fig { position:relative; width:132px; height:132px; flex:none; }
  .tk-tsk-ring__num { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; font-size:var(--tk-fs-2xl); font-weight:var(--tk-fw-bold); font-variant-numeric:tabular-nums; line-height:1.1; }
  .tk-tsk-ring__num small { font-size:var(--tk-fs-xs); font-weight:var(--tk-fw-regular); color:var(--tk-c-text-muted); }
  .tk-tsk-ring__legend { display:flex; flex-direction:column; gap:8px; flex:1; min-width:150px; }
  .tk-tsk-ring__legend div { display:flex; align-items:center; gap:8px; font-size:var(--tk-fs-md); } .tk-tsk-ring__legend b { margin-left:auto; font-variant-numeric:tabular-nums; }
  .tk-tsk-ring__legend i { width:10px; height:10px; border-radius:3px; background:var(--lc); flex:none; }`,
  example: { data: { tasks: [{ id: 'a', title: 'A', due: '2026-11-24', estimate: 60 }, { id: 'b', title: 'B', due: '2026-11-23' }, { id: 'c', title: 'C', due: '2026-11-24', done: true, doneAt: '2026-11-24' }], activity: [{ day: '2026-11-24', archived: 1 }] } },
  render: ({ props, data, ctx }) => {
    const tasks = Array.isArray(data.tasks) ? data.tasks : [];
    if (!tasks.length) return html`<${Card} title=${props.title}><${EmptyState} icon="target" title="Keine Aufgaben" text="Lege Aufgaben an, um den Tagesfortschritt zu sehen." /><//>`;
    const open = dueToday(tasks, ctx.today), over = overdueTasks(tasks, ctx.today), done = doneByDay(tasks, data.activity, 1, ctx.today)[0].done;
    const total = done + open.length, p = total ? done / total : 1, R = 54, C = 2 * Math.PI * R;
    return html`<${Card} title=${props.title} icon="target" actions=${html`<${Badge} tone=${p >= 1 ? 'success' : 'neutral'}>${Math.round(p * 100)} %<//>`}><div class="tk-tsk-ring" data-qa="task-day-ring">
      <div class="tk-tsk-ring__fig" role="img" aria-label=${`${done} von ${total} Aufgaben heute erledigt`}><svg viewBox="0 0 132 132" width="132" height="132" aria-hidden="true"><circle cx="66" cy="66" r=${R} fill="none" stroke="var(--tk-c-surface3)" stroke-width="12" />
        <circle cx="66" cy="66" r=${R} fill="none" stroke=${p >= 1 ? 'var(--tk-c-success)' : 'var(--tk-c-accent)'} stroke-width="12" stroke-linecap="round" stroke-dasharray=${`${C * p} ${C}`} transform="rotate(-90 66 66)" /></svg>
        <div class="tk-tsk-ring__num"><span>${done}/${total}</span><small>erledigt</small></div></div>
      <div class="tk-tsk-ring__legend"><div style="--lc:var(--tk-c-accent)"><i></i>Noch offen<b>${open.length}</b></div><div style="--lc:var(--tk-c-danger)"><i></i>Überfällig<b>${over.length}</b></div><div style="--lc:var(--tk-c-warning)"><i></i>Geplante Zeit<b>${hoursOf(planMinutes(open))}</b></div></div>
    </div><//>`;
  },
};

export const taskWeekChart = {
  id: 'task-week-chart',
  name: 'Wochenverlauf Aufgaben',
  category: 'Aufgaben',
  description: 'Säulen der letzten sieben Tage: erledigte Aufgaben je Tag, darunter die Fokus-Blöcke. Zeigt Rhythmus statt Zahlenkolonnen; heute ist hervorgehoben.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Diese Woche' },
    { name: 'showFocus', label: 'Fokus-Blöcke zeigen', type: 'boolean', default: true },
  ],
  data: [
    { slot: 'tasks', label: 'Aufgaben', default: 'tasks', shape: TASK_SHAPE, required: true },
    { slot: 'activity', label: 'Archivierte Erledigungen', default: 'activity', shape: '{day,archived}[]', required: false },
    { slot: 'log', label: 'Fokus-Sitzungen', default: 'log', shape: '{id,start,minutes}[]', required: false },
  ],
  events: [],
  states: ['empty'],
  css: `
  .tk-tsk-week { display:grid; grid-template-columns:repeat(7, minmax(0,1fr)); gap:var(--tk-space-2); align-items:end; }
  .tk-tsk-week__col { display:flex; flex-direction:column; align-items:center; gap:6px; min-width:0; }
  .tk-tsk-week__bar { width:100%; max-width:40px; height:104px; border-radius:10px; background:var(--tk-c-surface3); display:flex; align-items:flex-end; overflow:hidden; }
  .tk-tsk-week__bar i { display:block; width:100%; border-radius:10px 10px 0 0; background:var(--tk-c-accent); min-height:3px; }
  .tk-tsk-week__col[data-today="true"] .tk-tsk-week__bar i { background:var(--tk-c-success); }
  .tk-tsk-week__v { font-size:var(--tk-fs-xs); color:var(--tk-c-text-muted); font-variant-numeric:tabular-nums; height:14px; }
  .tk-tsk-week__d { font-size:var(--tk-fs-xs); font-weight:var(--tk-fw-semibold); letter-spacing:var(--tk-ls-wide); text-transform:uppercase; color:var(--tk-c-text-subtle); }
  .tk-tsk-week__col[data-today="true"] .tk-tsk-week__d { color:var(--tk-c-success); }
  .tk-tsk-week__dots { display:flex; flex-wrap:wrap; justify-content:center; gap:2px; max-width:32px; min-height:10px; } .tk-tsk-week__dots i { width:6px; height:6px; border-radius:50%; background:var(--tk-c-warning); }
  .bp-mobile .tk-tsk-week__bar { height:84px; }`,
  example: { data: { tasks: [], activity: [{ day: '2026-11-20', archived: 4 }, { day: '2026-11-23', archived: 7 }, { day: '2026-11-24', archived: 2 }], log: [{ id: 'f', start: '2026-11-24T08:00:00', minutes: 25 }] } },
  render: ({ props, data, ctx }) => {
    const tasks = Array.isArray(data.tasks) ? data.tasks : [], act = Array.isArray(data.activity) ? data.activity : [];
    if (!tasks.length && !act.length) return html`<${Card} title=${props.title}><${EmptyState} icon="bar-chart-3" title="Noch kein Verlauf" text="Erledigte Aufgaben erscheinen hier als Säulen." /><//>`;
    const days = doneByDay(tasks, act, 7, ctx.today), foc = focusByDay(data.log, 7, ctx.today), max = Math.max(4, ...days.map((d) => d.done));
    const sum = days.reduce((n, d) => n + d.done, 0), fm = foc.reduce((n, d) => n + d.minutes, 0);
    return html`<${Card} title=${props.title} icon="bar-chart-3" actions=${html`<${Badge}>${sum} erledigt${props.showFocus ? ` · ${hoursOf(fm)} Fokus` : ''}<//>`}><div class="tk-tsk-week" role="img" aria-label=${`Erledigte Aufgaben der letzten sieben Tage: ${days.map((d) => d.done).join(', ')}`} data-qa="task-week-chart">${days.map((d, i) => html`<div class="tk-tsk-week__col" data-today=${d.key === dayKey(ctx.today)}>
      <span class="tk-tsk-week__v">${d.done || ''}</span><span class="tk-tsk-week__bar"><i style=${`height:${d.done / max * 100}%`}></i></span><span class="tk-tsk-week__d">${WEEKDAYS[(d.day.getDay() + 6) % 7]}</span>
      ${props.showFocus && html`<span class="tk-tsk-week__dots">${Array.from({ length: foc[i].sessions }, () => html`<i></i>`)}</span>`}</div>`)}</div><//>`;
  },
};
export default [taskDayRing, taskWeekChart];
