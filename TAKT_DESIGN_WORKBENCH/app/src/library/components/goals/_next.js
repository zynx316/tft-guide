// Ziele: „Nächster Schritt“ – verknüpfte Aufgabe aus der Welt (tasks) oder ein Hinweis in das Quellmodul.
import { html } from '../../../lib/html.js';
import { fmtRelativeDay, fmtTime } from '../../../lib/format.js';
import { Button, Icon } from '../../ui.js';
import { pushUndo } from '../crosscut/_crosscut.js';
import { nextTitle, todayIso } from './_goals.js';

export const dueText = (ctx, due) => { if (!due) return ''; const t = /T\d\d:\d\d/.test(due) ? `, ${fmtTime(due)} Uhr` : ''; return `${fmtRelativeDay(due, ctx.today)}${t}`; };

/** Aufgabe als erledigt markieren (schreibt in die gemeinsame Welt: erscheint auch in Aufgaben, Start und Kalender). Mit „Rückgängig“ (undo-toast im Screen). */
export const finishTask = (ctx, setData, id, title, prevStatus) => {
  const patch = (fn) => setData('tasks', (ts) => (Array.isArray(ts) ? ts : []).map((t) => (t.id === id ? fn(t) : t)));
  patch((t) => ({ ...t, done: true, status: 'Erledigt', doneAt: todayIso(ctx) }));
  ctx.emit('step.done', { id });
  pushUndo(ctx, { text: title ? `Erledigt: ${title}` : 'Aufgabe erledigt', restore: () => { patch(({ doneAt, ...t }) => ({ ...t, done: false, status: prevStatus && prevStatus !== 'Erledigt' ? prevStatus : 'Offen' })); ctx.emit('step.undo', { id }); } });
};

export function NextStep({ v, ctx, setData, compact }) {
  const n = v.next;
  if (!n) return html`<div class="tk-gl-note">Gerade ist kein Schritt offen.</div>`;
  const open = () => (n.kind === 'task' ? ctx.emit('task.open', { id: n.taskId, to: 'tasks.detail' }) : ctx.emit('source.open', { id: v.source.ref || v.id, to: n.to }));
  return html`<div class="tk-gl-ns">
    <span class="tk-gl-ns__ic"><${Icon} name=${n.kind === 'task' ? 'list-checks' : 'arrow-right'} size=${16} /></span>
    <div class="tk-gl-ns__t"><b>${nextTitle(ctx, n)}</b><span>${n.kind === 'task' ? `Aufgabe${n.due ? ` · ${dueText(ctx, n.due)}` : ''}${n.project ? ` · ${n.project}` : ''}` : 'Hinweis aus der Quelle'}</span></div>
    <div class="tk-gl-ns__a">${n.kind === 'task' && html`<${Button} size="sm" variant="primary" icon="check" onClick=${() => finishTask(ctx, setData, n.taskId, n.title, n.taskStatus)}>Erledigt<//>`}
      <${Button} size="sm" variant=${compact ? 'ghost' : 'default'} onClick=${open}>${n.kind === 'task' ? 'Öffnen' : 'Ansehen'}<//></div></div>`;
}
export const NS_CSS = `
.tk-gl-ns { display:flex; align-items:center; gap:12px; flex-wrap:wrap; min-width:0; }
.tk-gl-ns__ic { width:34px; height:34px; border-radius:10px; display:grid; place-items:center; flex:none; background:var(--tk-c-accent-soft); color:var(--tk-c-accent); }
.tk-gl-ns__t { flex:1 1 180px; min-width:0; display:flex; flex-direction:column; gap:2px; } .tk-gl-ns__t b { font-weight:var(--tk-fw-medium); overflow-wrap:anywhere; } .tk-gl-ns__t span { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); }
.tk-gl-ns__a { display:flex; gap:8px; flex-wrap:wrap; } .bp-mobile .tk-gl-ns__a .tk-btn { min-height:44px; }
`;
