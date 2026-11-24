// Aufgaben: schnell erfassen – ein Satz genügt („Etsy-Gebühren buchen morgen !! #Finanzen 20 min“), Live-Erkennung, Ziel Liste oder Eingang.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Input, Badge, Icon } from '../../ui.js';
import { isoDay } from '../../../lib/util.js';
import { parseTask, makeTask, PROJECT_NAMES } from './_tasks-x.js';
import { PRIORITY } from './_tasks.js';

const EXAMPLES = ['Rechnung prüfen morgen !! #Finanzen', 'Lieferanten anrufen Freitag 10 Uhr 15 min', 'Idee: Adventsbundle #Shop'];

export const taskCapture = {
  id: 'task-capture',
  name: 'Aufgabe schnell erfassen',
  category: 'Aufgaben',
  description: 'Erfassen ohne Umweg: Datum, Uhrzeit, Priorität (! / !!), Projekt (#Name) und Dauer werden aus dem Satz erkannt. Ziel wahlweise die Aufgabenliste oder der Eingang zum späteren Sortieren.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Neue Aufgabe' },
    { name: 'target', label: 'Ziel', type: 'select', options: ['tasks', 'inbox'], default: 'tasks' },
    { name: 'defaultToday', label: 'Ohne Datum: heute fällig', type: 'boolean', default: true },
    { name: 'showExamples', label: 'Beispiele', type: 'boolean', default: true },
    { name: 'bare', label: 'Ohne Karte', type: 'boolean', default: false },
  ],
  data: [
    { slot: 'tasks', label: 'Aufgaben', default: 'tasks', shape: 'Aufgabenliste', required: true },
    { slot: 'inbox', label: 'Eingang', default: 'inbox', shape: '{id,title,source,at}[]', required: false },
  ],
  events: ['task.create', 'inbox.add', 'form.invalid'],
  states: ['empty'],
  css: `
  .tk-tsk-cap { display:flex; flex-direction:column; gap:var(--tk-space-3); }
  .tk-tsk-cap__row { display:flex; gap:8px; } .tk-tsk-cap__row .tk-input { flex:1; min-width:0; }
  .tk-tsk-cap__parsed { display:flex; flex-wrap:wrap; gap:6px; align-items:center; min-height:28px; }
  .tk-tsk-cap__ex { display:flex; flex-wrap:wrap; gap:6px; }
  .tk-tsk-cap__ex button { min-height:36px; padding:0 12px; border-radius:var(--tk-radius-pill); border:1px dashed var(--tk-c-border-strong); background:transparent; color:var(--tk-c-text-muted); font:inherit; font-size:var(--tk-fs-sm); cursor:pointer; text-align:left; }
  .tk-tsk-cap__ex button:hover { background:var(--tk-c-surface2); color:var(--tk-c-text); }
  .bp-mobile .tk-tsk-cap__ex button { min-height:40px; }`,
  example: { data: { tasks: [], inbox: [] } },
  render: function TaskCapture({ props, data, setData, ctx }) {
    const [text, setText] = useState('');
    const tasks = Array.isArray(data.tasks) ? data.tasks : [];
    const projects = [...new Set([...PROJECT_NAMES, ...tasks.map((t) => t.project).filter(Boolean)])];
    const p = parseTask(text, ctx.today, projects), toInbox = props.target === 'inbox';
    const due = p.due || (!toInbox && props.defaultToday ? isoDay(ctx.today) : null);
    const submit = () => {
      if (!p.title) { ctx.emit('form.invalid', { field: 'title' }); ctx.toast('Bitte eine Aufgabe eingeben'); return; }
      if (toInbox) { const it = { id: `in${Date.now().toString(36)}`, title: p.title, source: 'Erfassen', at: `${isoDay(ctx.today)}T${String(ctx.today.getHours()).padStart(2, '0')}:${String(ctx.today.getMinutes()).padStart(2, '0')}:00` }; setData('inbox', (a) => [it, ...(Array.isArray(a) ? a : [])]); ctx.emit('inbox.add', { id: it.id, title: it.title }); ctx.toast(`„${it.title}“ im Eingang`); }
      else { const t = makeTask({ ...p, due }); setData('tasks', (a) => [t, ...(Array.isArray(a) ? a : [])]); ctx.emit('task.create', { id: t.id, title: t.title }); ctx.toast(`„${t.title}“ angelegt`); }
      setText('');
    };
    const body = html`<div class="tk-tsk-cap" data-qa="task-capture">
      <div class="tk-tsk-cap__row"><${Input} value=${text} onInput=${setText} placeholder=${toInbox ? 'Gedanke festhalten … (Enter)' : 'Aufgabe eingeben … (Enter)'} aria-label="Aufgabe in einem Satz" onKeyDown=${(e) => e.key === 'Enter' && submit()} /><${Button} variant="primary" icon="plus" aria-label="Hinzufügen" onClick=${submit} /></div>
      <div class="tk-tsk-cap__parsed" aria-live="polite">${p.title ? html`${due && html`<${Badge} icon="calendar">${new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(`${due.slice(0, 10)}T00:00:00`))}${due.length > 10 ? `, ${due.slice(11, 16)}` : ''}<//>`}${p.priority && html`<${Badge} tone=${PRIORITY[p.priority].tone} icon="flag">${PRIORITY[p.priority].label}<//>`}${p.project && html`<${Badge} tone="accent" icon="folder">${p.project}<//>`}${p.estimate && html`<${Badge} icon="timer">${p.estimate} Min.<//>`}${toInbox && html`<${Badge} icon="inbox">Eingang<//>`}`
        : html`<span class="tk-subtle" style="font-size:var(--tk-fs-sm)">${toInbox ? 'Erst festhalten, später sortieren.' : 'Datum, ! für Priorität, #Projekt und Dauer werden erkannt.'}</span>`}</div>
      ${props.showExamples && !text && html`<div class="tk-tsk-cap__ex">${EXAMPLES.map((x) => html`<button type="button" onClick=${() => setText(x)}>${x}</button>`)}</div>`}</div>`;
    return props.bare ? body : html`<${Card} title=${props.title} icon="circle-plus">${body}<//>`;
  },
};
export default taskCapture;
