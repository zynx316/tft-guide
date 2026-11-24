// Aufgaben: „Jetzt dran“ – die eine Aufgabe, die als Nächstes sinnvoll ist, mit nächstem Schritt, Fokus-Start und Erledigt.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Badge, Icon, Progress, EmptyState } from '../../ui.js';
import { toggleTask, PrioFlag, DueText, subProgress, TASK_CSS } from './_tasks.js';
import { minLabel, rankedOpen } from './_tasks-x.js';

export const nextTask = {
  id: 'next-task',
  name: 'Jetzt dran',
  category: 'Aufgaben',
  description: 'Schlägt die eine Aufgabe vor, die jetzt sinnvoll ist (überfällig vor heute fällig, Priorität, „In Arbeit“ zuerst). Zeigt den nächsten Schritt und bietet Fokus starten, Erledigt und „Andere Aufgabe“.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Überschrift', type: 'text', default: 'Jetzt dran' },
    { name: 'showAlternatives', label: 'Weitere Vorschläge', type: 'boolean', default: true },
  ],
  data: [{ slot: 'tasks', label: 'Aufgaben', default: 'tasks', shape: '{id,title,due?,priority?,status?,estimate?,subtasks?,done?}[]', required: true }],
  events: ['focus.open', 'task.toggle', 'task.open'],
  states: ['empty'],
  css: `${TASK_CSS}
  .tk-tsk-next { display:flex; flex-direction:column; gap:var(--tk-space-3); padding:var(--tk-space-5); border-radius:var(--tk-radius-xl); border:1px solid var(--tk-c-border); background:linear-gradient(150deg, var(--tk-c-accent-soft), var(--tk-c-surface) 72%); }
  .tk-tsk-next__eyebrow { display:flex; align-items:center; gap:8px; flex-wrap:wrap; font-size:var(--tk-fs-xs); font-weight:var(--tk-fw-semibold); letter-spacing:var(--tk-ls-wide); text-transform:uppercase; color:var(--tk-c-accent); }
  .tk-tsk-next__title { font-size:var(--tk-fs-2xl); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); line-height:1.2; margin:0; overflow-wrap:anywhere; }
  .tk-tsk-next__step { display:flex; gap:8px; align-items:flex-start; font-size:var(--tk-fs-md); color:var(--tk-c-text-muted); }
  .tk-tsk-next__acts { display:flex; flex-wrap:wrap; gap:8px; }
  .tk-tsk-next__alt { display:flex; align-items:center; gap:10px; width:100%; min-height:48px; border:0; border-top:1px solid var(--tk-c-border); background:transparent; color:var(--tk-c-text-muted); font:inherit; font-size:var(--tk-fs-sm); text-align:left; cursor:pointer; }
  .bp-mobile .tk-tsk-next { padding:var(--tk-space-4); }`,
  example: { data: { tasks: [{ id: 't1', title: 'Angebot Müller GmbH finalisieren', due: '2026-11-24T14:00:00', priority: 'hoch', status: 'In Arbeit', estimate: 60, subtasks: [{ id: 'a', title: 'Preise prüfen', done: true }, { id: 'b', title: 'PDF erzeugen', done: false }] }, { id: 't2', title: 'Belege Oktober hochladen', due: '2026-11-23', priority: 'mittel' }] } },
  render: function NextTask({ props, data, setData, ctx }) {
    const [skip, setSkip] = useState(0);
    const list = rankedOpen(data.tasks, ctx.today);
    if (!list.length) return html`<${Card} title=${props.title}><${EmptyState} icon="check-check" title=${(Array.isArray(data.tasks) && data.tasks.length) ? 'Nichts mehr offen' : 'Keine Aufgaben'} text=${(Array.isArray(data.tasks) && data.tasks.length) ? 'Alle Aufgaben sind erledigt.' : 'Was du erledigen willst, sammelst du hier.'} /><//>`;
    const t = list[skip % list.length], step = (t.subtasks || []).find((s) => !s.done), sp = subProgress(t);
    return html`<section class="tk-tsk-next" data-qa="next-task" aria-label=${props.title} key=${t.id}>
      <div class="tk-tsk-next__eyebrow"><${Icon} name="target" size=${14} />${props.title}${t.status === 'In Arbeit' && html`<${Badge} tone="accent">In Arbeit<//>`}</div>
      <h2 class="tk-tsk-next__title">${t.title}</h2>
      <div class="tk-row" style="flex-wrap:wrap;gap:10px"><${DueText} t=${t} today=${ctx.today} /><${PrioFlag} t=${t} label=${true} />${t.project && html`<${Badge} tone="accent">${t.project}<//>`}${t.estimate && html`<span class="tk-subcount"><${Icon} name="timer" size=${13} />ca. ${minLabel(t.estimate)}</span>`}</div>
      ${sp.total > 0 && html`<div><${Progress} value=${sp.done / sp.total} tone="success" /><div class="tk-subtle" style="font-size:var(--tk-fs-sm);margin-top:4px">${sp.done} von ${sp.total} Schritten</div></div>`}
      ${step && html`<div class="tk-tsk-next__step"><${Icon} name="arrow-right" size=${16} /><span>Nächster Schritt: <b style="color:var(--tk-c-text)">${step.title}</b></span></div>`}
      <div class="tk-tsk-next__acts"><${Button} variant="primary" icon="play" onClick=${() => { ctx.setUi('selectedId', t.id); ctx.emit('focus.open', { id: t.id }); }}>Fokus starten<//><${Button} icon="check" onClick=${() => toggleTask(ctx, setData, t)}>Erledigt<//><${Button} variant="ghost" onClick=${() => { ctx.setUi('selectedId', t.id); ctx.emit('task.open', { id: t.id }); }}>Details<//></div>
      ${props.showAlternatives && list.length > 1 && html`<button type="button" class="tk-tsk-next__alt" onClick=${() => setSkip(skip + 1)}><${Icon} name="refresh-cw" size=${15} /><span class="tk-truncate">Andere Aufgabe · als Nächstes: ${list[(skip + 1) % list.length].title}</span></button>`}
    </section>`;
  },
};
export default nextTask;
