// Aufgaben: sachliche Hinweise – Überfälliges, Eingang, Tagesplan gegen freie Zeit, Aufgabe mit Uhrzeit; jeder Hinweis führt zur Aktion.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Icon, EmptyState, toneColor } from '../../ui.js';
import { timeStr } from '../calendar/_cal.js';
import { sortTasks } from './_tasks.js';
import { dueToday, overdueTasks, planMinutes, hoursOf, freeToday, minLabel } from './_tasks-x.js';

export const taskHints = {
  id: 'task-hints',
  name: 'Aufgaben-Hinweise',
  category: 'Aufgaben',
  description: 'Berechnete Hinweise statt Datenwüste: überfällige Aufgaben, unsortierter Eingang, Tagesplan gegen freie Zeit aus dem Kalender (passt / überlastet) und Aufgaben mit Uhrzeit. Jeder Hinweis hat eine Aktion.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Hinweise' },
    { name: 'limit', label: 'Max. Hinweise', type: 'number', default: 4 },
    { name: 'workEnd', label: 'Feierabend (Std.)', type: 'number', default: 18 },
    { name: 'dense', label: 'Kompakt', type: 'boolean', default: false },
  ],
  data: [
    { slot: 'tasks', label: 'Aufgaben', default: 'tasks', shape: '{id,title,due?,estimate?,priority?,done?}[]', required: true },
    { slot: 'inbox', label: 'Eingang', default: 'inbox', shape: '{id,title}[]', required: false },
    { slot: 'events', label: 'Termine (freie Zeit)', default: 'events', shape: '{id,start,end}[]', required: false },
  ],
  events: ['task.open', 'inbox.open', 'focus.open', 'overdue.open', 'hint.dismiss'],
  states: ['empty'],
  css: `
  .tk-tsk-hints { display:flex; flex-direction:column; gap:var(--tk-space-2); min-width:0; }
  .tk-tsk-hint { display:flex; gap:12px; align-items:flex-start; padding:var(--tk-space-3) var(--tk-space-4); border:1px solid var(--tk-c-border); border-left:4px solid var(--hc); border-radius:var(--tk-radius-md); background:var(--tk-c-surface); min-width:0; }
  .tk-tsk-hint__ico { width:36px; height:36px; flex:none; border-radius:11px; display:grid; place-items:center; background:color-mix(in srgb, var(--hc) 15%, transparent); color:var(--hc); }
  .tk-tsk-hint__t { font-weight:var(--tk-fw-semibold); line-height:1.3; } .tk-tsk-hint__x { color:var(--tk-c-text-muted); font-size:var(--tk-fs-sm); margin-top:2px; }
  .tk-tsk-hint__a { display:flex; gap:8px; margin-top:8px; flex-wrap:wrap; } .tk-tsk-hint__close { margin:-6px -8px 0 0; flex:none; }`,
  example: { data: { tasks: [{ id: 't8', title: 'Etsy-Gebühren buchen', due: '2026-11-22', priority: 'hoch', estimate: 20 }, { id: 't1', title: 'Angebot Müller', due: '2026-11-24T14:00:00', estimate: 60 }], inbox: [{ id: 'i', title: 'Rückruf' }], events: [] } },
  render: function TaskHints({ props, data, ctx }) {
    const [gone, setGone] = useState([]);
    const tasks = Array.isArray(data.tasks) ? data.tasks : [], inbox = Array.isArray(data.inbox) ? data.inbox : [];
    const over = overdueTasks(tasks, ctx.today).sort(sortTasks), today = dueToday(tasks, ctx.today), hints = [];
    const open = (t) => () => { ctx.setUi('selectedId', t.id); ctx.emit('task.open', { id: t.id }); };
    if (over.length) hints.push({ id: 'over', tone: 'danger', icon: 'alert-circle', title: over.length === 1 ? `${over[0].title} ist überfällig` : `${over.length} Aufgaben sind überfällig`, text: `${over.slice(0, 2).map((t) => `„${t.title}“`).join(' und ')}${over.length > 2 ? ' u. a.' : ''} – zusammen ca. ${minLabel(planMinutes(over))}`, acts: [{ label: over.length === 1 ? 'Öffnen' : 'Ansehen', run: over.length === 1 ? open(over[0]) : () => ctx.emit('overdue.open', { id: 'overdue' }) }] });
    const timed = today.filter((t) => t.due && t.due.length > 10 && new Date(t.due) > ctx.today).sort((a, b) => String(a.due).localeCompare(b.due))[0];
    if (timed) hints.push({ id: `t-${timed.id}`, tone: 'warning', icon: 'clock', title: `${timed.title} – heute um ${timeStr(timed.due)} fällig`, text: `Aufgabe mit Frist, dafür ca. ${minLabel(Number(timed.estimate) || 30)} einplanen`, acts: [{ label: 'Fokus starten', primary: true, run: () => { ctx.setUi('selectedId', timed.id); ctx.emit('focus.open', { id: timed.id }); } }, { label: 'Öffnen', run: open(timed) }] });
    const plan = planMinutes(today), free = freeToday(data.events, ctx.today, Number(props.workEnd));
    if (today.length && Array.isArray(data.events) && data.events.length) hints.push({ id: 'plan', tone: plan > free ? 'warning' : 'success', icon: plan > free ? 'alert-triangle' : 'check-circle-2', title: plan > free ? `Heute überlastet: ${hoursOf(plan)} geplant, ${hoursOf(free)} frei` : `Tagesplan passt: ${hoursOf(plan)} von ${hoursOf(free)} freier Zeit`, text: plan > free ? 'Verschiebe eine Aufgabe auf morgen oder kürze Termine.' : `${today.length} Aufgaben heute fällig, die Lücken im Kalender reichen.`, acts: [] });
    if (inbox.length) hints.push({ id: 'inbox', tone: 'accent', icon: 'inbox', title: `${inbox.length} Einträge im Eingang`, text: 'Kurz sortieren: Heute, Morgen, Diese Woche oder Irgendwann.', acts: [{ label: 'Eingang sortieren', primary: true, run: () => ctx.emit('inbox.open', { id: 'inbox' }) }] });
    const shown = hints.filter((h) => !gone.includes(h.id)).slice(0, Number(props.limit) || 4);
    if (!tasks.length || !shown.length) return html`<${Card} title=${props.title} icon="sparkles"><${EmptyState} icon="check-circle-2" title="Alles im Griff" text="Nichts überfällig, der Eingang ist leer." /><//>`;
    return html`<div class="tk-tsk-hints" data-qa="task-hints">${props.title && html`<span class="tk-label">${props.title}</span>`}${shown.map((h) => html`<div class="tk-tsk-hint" style=${`--hc:${toneColor(h.tone)}`}><span class="tk-tsk-hint__ico"><${Icon} name=${h.icon} size=${18} /></span>
      <div class="tk-grow"><div class="tk-tsk-hint__t">${h.title}</div>${!props.dense && html`<div class="tk-tsk-hint__x">${h.text}</div>`}${h.acts.length > 0 && html`<div class="tk-tsk-hint__a">${h.acts.map((a) => html`<${Button} size="sm" variant=${a.primary ? 'primary' : 'default'} onClick=${a.run}>${a.label}<//>`)}</div>`}</div>
      <${Button} size="sm" variant="ghost" icon="x" class="tk-tsk-hint__close" aria-label=${`Hinweis „${h.title}“ ausblenden`} onClick=${() => { setGone((g) => [...g, h.id]); ctx.emit('hint.dismiss', { id: h.id }); }} /></div>`)}</div>`;
  },
};
export default taskHints;
