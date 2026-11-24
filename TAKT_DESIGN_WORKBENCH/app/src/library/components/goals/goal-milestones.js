// Ziele: Meilensteine als Etappen – Schwellenwerte aus der Quelle, verknüpfte Aufgaben, eigene Häkchen.
import { html } from '../../../lib/html.js';
import { Card, Icon, EmptyState, Badge } from '../../ui.js';
import { GOAL_SLOTS, GL_CSS, useViews, patchGoal, valueOf, hidden, todayIso } from './_goals.js';
import { dueText, finishTask } from './_next.js';
import { pickGoal } from './goal-hero.js';
import { EXAMPLE } from './_example.js';

export const goalMilestones = {
  id: 'goal-milestones',
  name: 'Meilensteine',
  category: 'Ziele',
  description: 'Etappen eines Ziels: Schwellenwerte (werden aus der Quelle abgehakt, z. B. „Zwei Kilo“, „Die Hälfte gespart“), verknüpfte Aufgaben (erledigt in Aufgaben) und eigene Häkchen. Der nächste offene Meilenstein ist hervorgehoben.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Meilensteine' },
    { name: 'dense', label: 'Kompakt', type: 'boolean', default: false },
  ],
  data: GOAL_SLOTS,
  events: ['milestone.toggle', 'task.open', 'step.done', 'step.undo'],
  states: ['empty'],
  flutter: { widget: 'TaktGoalMilestones', propMap: { title: 'title', dense: 'dense' }, events: { 'milestone.toggle': 'onToggle', 'task.open': 'onOpenTask' } },
  css: `${GL_CSS}
  .tk-gl-ms { margin:0; padding:0; list-style:none; display:flex; flex-direction:column; }
  .tk-gl-ms__i { display:flex; gap:12px; align-items:center; padding:10px 0; min-height:52px; border-bottom:1px solid var(--tk-c-border); min-width:0; position:relative; } .tk-gl-ms__i:last-child { border-bottom:0; }
  .tk-gl-ms__d { width:26px; height:26px; flex:none; border-radius:50%; display:grid; place-items:center; border:2px solid var(--tk-c-border-strong); background:var(--tk-c-surface); color:var(--tk-c-text-on-accent); }
  .tk-gl-ms__i[data-done="true"] .tk-gl-ms__d { background:var(--tk-c-success); border-color:var(--tk-c-success); } .tk-gl-ms__i[data-next="true"] .tk-gl-ms__d { border-color:var(--tk-c-accent); box-shadow:0 0 0 3px var(--tk-c-accent-soft); }
  .tk-gl-ms__b { flex:1; min-width:0; display:flex; flex-direction:column; gap:2px; } .tk-gl-ms__b b { font-weight:var(--tk-fw-medium); overflow-wrap:anywhere; } .tk-gl-ms__i[data-done="true"] .tk-gl-ms__b b { color:var(--tk-c-text-muted); }
  .tk-gl-ms__btn { all:unset; box-sizing:border-box; display:flex; gap:12px; align-items:center; flex:1; min-width:0; cursor:pointer; min-height:44px; } .tk-gl-ms__btn:focus-visible { outline:2px solid var(--tk-c-focus); outline-offset:2px; border-radius:var(--tk-radius-sm); }
  .tk-gl-ms--dense .tk-gl-ms__i { min-height:40px; padding:6px 0; }`,
  example: { data: EXAMPLE },
  render: function GoalMilestones({ props, data, setData, ctx }) {
    const { views } = useViews(data, ctx);
    const v = pickGoal(views, ctx);
    if (!v || !v.milestones.length) return html`<${Card} title=${props.title}><${EmptyState} icon="flag" title="Keine Meilensteine" text="Etappen machen ein großes Ziel greifbar. Sie lassen sich später ergänzen." /><//>`;
    const nextId = v.milestones.find((m) => !m.done)?.id;
    const toggle = (m) => {
      if (m.taskId) { if (!m.done) finishTask(ctx, setData, m.taskId, m.title, m.taskStatus); else ctx.emit('task.open', { id: m.taskId, to: 'tasks.detail' }); return; }
      if (!m.manual) return;
      patchGoal(setData, v.id, (g) => ({ milestones: g.milestones.map((x) => (x.id === m.id ? { ...x, done: !m.done, doneAt: m.done ? null : todayIso(ctx) } : x)) }));
      ctx.emit('milestone.toggle', { id: m.id, done: !m.done }); ctx.toast(m.done ? 'Meilenstein zurückgenommen' : 'Meilenstein erreicht');
    };
    const sub = (m) => (m.taskId ? `Aufgabe${m.due ? ` · ${dueText(ctx, m.due)}` : ''}` : m.at != null ? (hidden(v) ? 'aus der Quelle' : v.kind === 'weekly' ? `ab ${m.at} Wochen in Folge` : v.kind === 'streak' ? `ab ${m.at} Tagen` : `ab ${valueOf(ctx, v, m.at)}`) : 'von dir abgehakt');
    const inert = (m) => !m.taskId && !m.manual;
    return html`<${Card} title=${props.title} actions=${html`<${Badge}>${v.doneCount} von ${v.milestones.length}<//>`}><ol class=${`tk-gl-ms ${props.dense ? 'tk-gl-ms--dense' : ''}`}>${v.milestones.map((m) => html`<li class="tk-gl-ms__i" data-done=${m.done} data-next=${m.id === nextId}>
      ${inert(m) ? html`<span class="tk-gl-ms__d">${m.done && html`<${Icon} name="check" size=${14} />`}</span><div class="tk-gl-ms__b"><b>${m.title}</b><span class="tk-gl-note">${m.done ? 'Erreicht' : sub(m)}${m.done ? ` · ${sub(m)}` : ''}</span></div>`
        : html`<button type="button" class="tk-gl-ms__btn" onClick=${() => toggle(m)} aria-pressed=${m.done} aria-label=${`${m.title}: ${m.done ? 'erreicht' : 'offen'}`}><span class="tk-gl-ms__d">${m.done && html`<${Icon} name="check" size=${14} />`}</span><span class="tk-gl-ms__b"><b>${m.title}</b><span class="tk-gl-note">${sub(m)}</span></span></button>`}</li>`)}</ol><//>`;
  },
};
export default goalMilestones;
