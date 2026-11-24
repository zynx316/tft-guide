// Aufgaben: Detailansicht (Master-Detail) – bearbeitbar: Titel, Priorität, Fälligkeit, Projekt, Wiederholung, Unteraufgaben, Notiz.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Check, Button, Badge, Field, Input, Select, Textarea, Segmented, Progress, EmptyState, Icon } from '../../ui.js';
import { isoDay } from '../../../lib/util.js';
import { dueInfo, dueDate, subProgress, toggleTask, PRIORITY, STATUSES, TASK_REPEATS, TASK_CSS } from './_tasks.js';

export const taskDetail = {
  id: 'task-detail',
  name: 'Aufgaben-Detail',
  category: 'Aufgaben',
  description: 'Detailpanel zur gewählten Aufgabe (ctx.ui.selectedId): Titel, Priorität, Status, Fälligkeit, Projekt, Wiederholung, Unteraufgaben mit Fortschritt und Notiz. Änderungen wirken sofort in allen Listen.',
  version: '1.1',
  props: [
    { name: 'fallbackFirst', label: 'Ohne Auswahl erste Aufgabe zeigen', type: 'boolean', default: true },
    { name: 'showNote', label: 'Notiz', type: 'boolean', default: true },
    { name: 'showRepeat', label: 'Wiederholung', type: 'boolean', default: true },
    { name: 'showFocus', label: 'Button „Fokus starten“', type: 'boolean', default: true },
  ],
  data: [{ slot: 'tasks', label: 'Aufgaben', default: 'tasks', shape: 'Aufgaben mit subtasks, repeat, note, project', required: true }],
  events: ['task.update', 'task.toggle', 'subtask.toggle', 'subtask.add', 'task.delete', 'focus.open'],
  states: ['empty'],
  css: `${TASK_CSS}
  .tk-td .tk-input, .tk-td .tk-select { height:auto; min-height:var(--tk-size-control); padding-block:6px; }
  .tk-td { display:flex; flex-direction:column; gap:var(--tk-space-4); }
  .tk-td__title { font-size:var(--tk-fs-xl); font-weight:var(--tk-fw-semibold); background:transparent; border:1px solid transparent; border-radius:var(--tk-radius-sm); padding:4px 8px; margin:-4px -8px; width:calc(100% + 16px); color:var(--tk-c-text); font-family:inherit; text-overflow:ellipsis; }
  .tk-td__title:hover { border-color:var(--tk-c-border); } .tk-td__title:focus { outline:none; border-color:var(--tk-c-accent); background:var(--tk-c-surface2); }
  .tk-td__grid { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:var(--tk-space-3); }
  .bp-mobile .tk-td__grid { grid-template-columns:minmax(0,1fr); }
  .tk-td__sub { display:flex; align-items:center; gap:10px; min-height:44px; border-bottom:1px solid var(--tk-c-border); }
  .tk-td__sub span[data-done="true"] { text-decoration:line-through; color:var(--tk-c-text-subtle); }
  .tk-td__add { display:flex; gap:8px; margin-top:8px; }`,
  example: { data: { tasks: [{ id: 't1', title: 'Angebot Müller GmbH finalisieren', due: '2026-11-24', priority: 'hoch', project: 'Vertrieb', status: 'In Arbeit', repeat: 'Keine', note: 'Kunde erwartet Rückmeldung bis 14:00 Uhr.', subtasks: [{ id: 's1', title: 'Preise prüfen', done: true }, { id: 's2', title: 'PDF erzeugen', done: false }, { id: 's3', title: 'An Kunden senden', done: false }] }] } },
  render: function TaskDetail({ props, data, setData, ctx }) {
    const [sub, setSub] = useState('');
    const tasks = Array.isArray(data.tasks) ? data.tasks : [];
    const t = tasks.find((x) => x.id === ctx.ui.selectedId) || (props.fallbackFirst ? tasks.find((x) => !x.done) || tasks[0] : null);
    if (!t) return html`<${Card}><${EmptyState} icon="list-checks" title=${tasks.length ? 'Keine Aufgabe gewählt' : 'Keine Aufgaben'} text=${tasks.length ? 'Wähle links eine Aufgabe, um Details zu sehen.' : 'Lege zuerst eine Aufgabe an.'} /><//>`;
    const projects = [...new Set(tasks.map((x) => x.project).filter(Boolean))];
    const upd = (patch, what) => { setData('tasks', (a) => a.map((x) => (x.id === t.id ? { ...x, ...patch } : x))); ctx.emit('task.update', { id: t.id, field: what || Object.keys(patch)[0] }); };
    const subs = t.subtasks || []; const p = subProgress(t); const di = dueInfo(t, ctx.today);
    const dueVal = t.due ? t.due.slice(0, 10) : '';
    const toggleSub = (s) => { upd({ subtasks: subs.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x)) }, 'subtasks'); ctx.emit('subtask.toggle', { id: s.id }); };
    const addSub = () => { const v = sub.trim(); if (!v) return; upd({ subtasks: [...subs, { id: ctx.newId('s'), title: v, done: false }] }, 'subtasks'); ctx.emit('subtask.add', { title: v }); setSub(''); };
    const del = () => { setData('tasks', (a) => a.filter((x) => x.id !== t.id)); ctx.setUi('selectedId', null); ctx.emit('task.delete', { id: t.id }); ctx.toast('Aufgabe gelöscht'); };
    return html`<${Card} key=${t.id}><div class="tk-td" data-qa="task-detail">
      <div class="tk-row" style="align-items:flex-start;gap:12px"><${Check} checked=${t.done} onChange=${() => toggleTask(ctx, setData, t)} label="Erledigt" />
        <div class="tk-grow"><input class="tk-td__title" value=${t.title} aria-label="Titel" onChange=${(e) => upd({ title: e.currentTarget.value.trim() || t.title }, 'title')} />
          <div class="tk-row" style="margin-top:6px;flex-wrap:wrap"><${Badge} tone=${di.overdue ? 'danger' : di.tone === 'warning' ? 'warning' : 'neutral'} icon="calendar">${di.text}<//>${t.project && html`<${Badge} tone="accent">${t.project}<//>`}${t.repeat && t.repeat !== 'Keine' && html`<${Badge} icon="repeat">${t.repeat}<//>`}</div></div>
        <${Button} variant="ghost" icon="trash-2" aria-label="Aufgabe löschen" style="flex:none" onClick=${del} /></div>
      ${props.showFocus && !t.done && html`<div><${Button} variant="primary" icon="play" onClick=${() => { ctx.setUi('selectedId', t.id); ctx.emit('focus.open', { id: t.id }); }}>Fokus starten<//></div>`}
      <div class="tk-field"><span class="tk-field__label">Priorität</span><${Segmented} label="Priorität" value=${t.priority || 'mittel'} onChange=${(v) => upd({ priority: v })} options=${Object.entries(PRIORITY).map(([value, o]) => ({ value, label: o.label }))} /></div>
      <div class="tk-td__grid">
        <${Field} label="Fällig am"><${Input} type="date" value=${dueVal} onInput=${(v) => upd({ due: v || undefined }, 'due')} /><//>
        <${Field} label="Status"><${Select} value=${t.status || (t.done ? 'Erledigt' : 'Offen')} onChange=${(v) => upd({ status: v, done: v === 'Erledigt', doneAt: v === 'Erledigt' ? isoDay(ctx.today) : undefined }, 'status')} options=${STATUSES} /><//>
        <${Field} label="Projekt"><${Select} value=${t.project || ''} onChange=${(v) => upd({ project: v || undefined })} options=${[{ value: '', label: 'Kein Projekt' }, ...projects.map((x) => ({ value: x, label: x }))]} /><//>
        ${props.showRepeat && html`<${Field} label="Wiederholung"><${Select} value=${t.repeat || 'Keine'} onChange=${(v) => upd({ repeat: v === 'Keine' ? undefined : v }, 'repeat')} options=${TASK_REPEATS} /><//>`}
      </div>
      <div><div class="tk-row" style="margin-bottom:6px"><span class="tk-field__label tk-grow">Unteraufgaben</span><span class="tk-subtle tk-num" style="font-size:var(--tk-fs-sm)">${p.done}/${p.total}</span></div>
        ${p.total > 0 && html`<${Progress} value=${p.done / p.total} tone="success" />`}
        <div style="margin-top:6px">${subs.map((s) => html`<div class="tk-td__sub"><${Check} checked=${s.done} onChange=${() => toggleSub(s)} label=${s.title} /><span class="tk-grow" data-done=${!!s.done}>${s.title}</span></div>`)}</div>
        <div class="tk-td__add"><${Input} value=${sub} onInput=${setSub} placeholder="Unteraufgabe hinzufügen …" aria-label="Unteraufgabe hinzufügen" onKeyDown=${(e) => e.key === 'Enter' && addSub()} /><${Button} icon="plus" aria-label="Hinzufügen" onClick=${addSub} /></div></div>
      ${props.showNote && html`<${Field} label="Notiz"><${Textarea} value=${t.note || ''} rows="3" placeholder="Notiz hinzufügen …" onInput=${(v) => upd({ note: v }, 'note')} /><//>`}
    </div><//>`;
  },
};
export default taskDetail;
