// Kalender: berechnete Hinweise – Überschneidungen, volle Tage, freie Fenster mit passender Aufgabe, fällige Aufgaben.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Icon, EmptyState, toneColor } from '../../ui.js';
import { dayStart, addDays, dayKey, occurrences, onDay, minutesOf, timeStr, hm, durLabel, freeSlots, toIso, longDay } from './_cal.js';
import { conflictPairs, weekLoad, hoursLabel } from './_cal-info.js';

const sameDayLabel = (d, today) => (dayKey(d) === dayKey(today) ? 'heute' : dayKey(d) === dayKey(addDays(today, 1)) ? 'morgen' : new Intl.DateTimeFormat('de-DE', { weekday: 'long' }).format(d));

export const calHints = {
  id: 'cal-hints',
  name: 'Kalender-Hinweise',
  category: 'Kalender',
  description: 'Sachliche Hinweise aus Terminen und Aufgaben: Überschneidungen, sehr volle Tage, freie Fenster mit passender Aufgabe zum Einplanen und Aufgaben mit Uhrzeit. Jeder Hinweis führt mit einem Tipp zum Objekt.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Hinweise' },
    { name: 'limit', label: 'Max. Hinweise', type: 'number', default: 4 },
    { name: 'workEnd', label: 'Feierabend (Std.)', type: 'number', default: 18 },
    { name: 'dense', label: 'Kompakt', type: 'boolean', default: false },
  ],
  data: [
    { slot: 'events', label: 'Termine', default: 'events', shape: '{id,title,start,end,repeat?}[]', required: true },
    { slot: 'tasks', label: 'Aufgaben (optional)', default: 'tasks', shape: '{id,title,due?,estimate?,priority?,done?}[]', required: false },
  ],
  events: ['event.open', 'task.open', 'focus.schedule', 'day.open', 'hint.dismiss'],
  states: ['empty'],
  css: `
  .tk-cal-hints { display:flex; flex-direction:column; gap:var(--tk-space-2); min-width:0; }
  .tk-cal-hint { display:flex; gap:12px; align-items:flex-start; padding:var(--tk-space-3) var(--tk-space-4); border:1px solid var(--tk-c-border); border-left:4px solid var(--hc); border-radius:var(--tk-radius-md); background:var(--tk-c-surface); min-width:0; }
  .tk-cal-hint__ico { width:36px; height:36px; flex:none; border-radius:11px; display:grid; place-items:center; background:color-mix(in srgb, var(--hc) 15%, transparent); color:var(--hc); }
  .tk-cal-hint__title { font-weight:var(--tk-fw-semibold); line-height:1.3; } .tk-cal-hint__text { color:var(--tk-c-text-muted); font-size:var(--tk-fs-sm); margin-top:2px; }
  .tk-cal-hint__act { display:flex; gap:8px; margin-top:8px; flex-wrap:wrap; }
  .tk-cal-hint__x { margin:-6px -8px 0 0; flex:none; }`,
  example: { data: { events: [
    { id: 'a', title: 'Sprint-Planung', start: '2026-11-24T11:00:00', end: '2026-11-24T11:45:00' }, { id: 'b', title: 'Fokus: Workbench-Review', start: '2026-11-24T10:30:00', end: '2026-11-24T12:00:00' },
  ], tasks: [{ id: 't1', title: 'Angebot Müller GmbH finalisieren', due: '2026-11-24T14:00:00', priority: 'hoch', estimate: 60 }] } },
  render: function CalHints({ props, data, setData, ctx }) {
    const [gone, setGone] = useState([]);
    const events = Array.isArray(data.events) ? data.events : [], tasks = Array.isArray(data.tasks) ? data.tasks : [];
    const today = dayStart(ctx.today), nowMin = minutesOf(ctx.today), end = Number(props.workEnd) * 60;
    const occs = occurrences(events, today, addDays(today, 7)), hints = [];
    for (const [a, b] of conflictPairs(occs).slice(0, 2)) hints.push({ id: `c-${a.id}-${b.id}`, tone: 'warning', icon: 'alert-triangle', title: `Überschneidung ${sameDayLabel(a._s, ctx.today)} um ${timeStr(b._s)}`, text: `„${a.title}“ und „${b.title}“ liegen übereinander.`, act: { label: 'Ansehen', run: () => ctx.emit('event.open', { id: b.id }) } });
    const todays = onDay(occs, today).filter((o) => !o.allDay);
    const pool = tasks.filter((t) => !t.done && t.due && dayKey(new Date(/^\d{4}-\d\d-\d\d$/.test(t.due) ? `${t.due}T00:00:00` : t.due)) <= dayKey(today) && !events.some((e) => e.taskId === t.id)).sort((x, y) => (x.priority === 'hoch' ? 0 : 1) - (y.priority === 'hoch' ? 0 : 1));
    const slot = freeSlots(todays, Math.ceil(nowMin / 15) * 15, end, 45).sort((x, y) => (y[1] - y[0]) - (x[1] - x[0]))[0];
    const fit = slot && pool.find((t) => (Number(t.estimate) || 30) <= slot[1] - slot[0]);
    if (slot) hints.push({ id: 'free', tone: 'success', icon: 'timer', title: `${hm(slot[0])}–${hm(slot[1])} Uhr frei (${durLabel(slot[1] - slot[0])})`, text: fit ? `Passt für „${fit.title}“ (ca. ${durLabel(Number(fit.estimate) || 30)}).` : 'Zeit für Pause, Spaziergang oder Spontanes.',
      act: fit ? { label: 'Einplanen', primary: true, run: () => { const s = new Date(today); s.setHours(0, slot[0], 0, 0); const d = Number(fit.estimate) || 30; const ev = { id: `ev${Date.now().toString(36)}`, title: fit.title, start: toIso(s), end: toIso(new Date(+s + d * 60000)), category: 'Fokus', tone: 'success', taskId: fit.id, note: 'Aus Aufgabe eingeplant' }; setData('events', (a) => [ev, ...a]); ctx.emit('focus.schedule', { task: fit.id, at: hm(slot[0]) }); ctx.toast(`„${fit.title}“ um ${hm(slot[0])} eingeplant`); setGone((g) => [...g, 'free']); } } : null });
    const timedTask = tasks.filter((t) => !t.done && t.due && t.due.length > 10 && dayKey(new Date(t.due)) === dayKey(today) && new Date(t.due) > ctx.today)[0];
    if (timedTask) hints.push({ id: `t-${timedTask.id}`, tone: 'danger', icon: 'list-checks', title: `${timedTask.title} fällig um ${timeStr(timedTask.due)}`, text: 'Aufgabe mit Uhrzeit – im Kalender als Frist sichtbar.', act: { label: 'Aufgabe öffnen', run: () => { ctx.setUi('selectedId', timedTask.id); ctx.emit('task.open', { id: timedTask.id }); } } });
    const loads = weekLoad(events, ctx.today).filter((d) => d.over && d.key >= dayKey(today)).sort((x, y) => y.booked - x.booked);
    if (loads[0]) hints.push({ id: `l-${loads[0].key}`, tone: 'accent', icon: 'calendar-range', title: `${longDay(loads[0].day).split(',')[0]} ist dicht: ${hoursLabel(loads[0].booked)} gebucht`, text: `${loads[0].n} Termine – plane Pausen ein oder verschiebe Fokuszeit.`, act: { label: 'Tag ansehen', run: () => ctx.emit('day.open', { id: loads[0].key, ui: { selectedDate: loads[0].key } }) } });
    const shown = hints.filter((h) => !gone.includes(h.id)).slice(0, Number(props.limit) || 4);
    if (!events.length || !shown.length) return html`<${Card} title=${props.title} icon="sparkles"><${EmptyState} icon="check-circle-2" title="Alles im grünen Bereich" text="Keine Überschneidungen, keine überfüllten Tage." /><//>`;
    return html`<div class="tk-cal-hints" data-qa="cal-hints">${props.title && html`<span class="tk-label">${props.title}</span>`}${shown.map((h) => html`<div class="tk-cal-hint" style=${`--hc:${toneColor(h.tone)}`}>
      <span class="tk-cal-hint__ico"><${Icon} name=${h.icon} size=${18} /></span>
      <div class="tk-grow"><div class="tk-cal-hint__title">${h.title}</div>${!props.dense && html`<div class="tk-cal-hint__text">${h.text}</div>`}
        ${h.act && html`<div class="tk-cal-hint__act"><${Button} size="sm" variant=${h.act.primary ? 'primary' : 'default'} onClick=${h.act.run}>${h.act.label}<//></div>`}</div>
      <${Button} size="sm" variant="ghost" icon="x" class="tk-cal-hint__x" aria-label=${`Hinweis „${h.title}“ ausblenden`} onClick=${() => { setGone((g) => [...g, h.id]); ctx.emit('hint.dismiss', { id: h.id }); }} /></div>`)}</div>`;
  },
};
export default calHints;
