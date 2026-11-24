// Kalender: Kennzahlen aus den Terminen (heute, gebucht, Woche, Fokuszeit, freie Zeit) – berechnet, nie von Hand gepflegt.
import { html } from '../../../lib/html.js';
import { Icon, EmptyState } from '../../ui.js';
import { addDays, dayKey, dayStart, startOfWeek, occurrences, onDay, minutesOf, durLabel } from './_cal.js';
import { bookedMinutes, hoursLabel, freeSlots } from './_cal-info.js';

const ALL = ['today', 'booked', 'week', 'focus', 'free'];

export const calStats = {
  id: 'cal-stats',
  name: 'Kalender-Kennzahlen',
  category: 'Kalender',
  description: 'Kennzahlen aus den Terminen: Termine heute, gebuchte Zeit, Woche, Fokuszeit und freie Zeit bis Feierabend. Alles berechnet relativ zu „heute“; Antippen öffnet Tag oder Woche.',
  version: '1.0',
  props: [
    { name: 'style', label: 'Darstellung', type: 'select', options: ['tiles', 'strip'], default: 'tiles' },
    { name: 'items', label: 'Kennzahlen', type: 'list', default: ALL },
    { name: 'workEnd', label: 'Feierabend (Std.)', type: 'number', default: 18 },
  ],
  data: [{ slot: 'events', label: 'Termine', default: 'events', shape: '{id,title,start,end,category?,repeat?,allDay?}[]', required: true }],
  events: ['day.open', 'week.open'],
  states: ['empty'],
  css: `
  .tk-cal-stats { display:grid; gap:var(--tk-space-3); grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); min-width:0; }
  .tk-cal-stats__tile { display:flex; flex-direction:column; gap:4px; text-align:left; font:inherit; color:var(--tk-c-text); background:var(--tk-c-surface); border:1px solid var(--tk-c-border); border-radius:var(--tk-radius-lg); padding:var(--tk-space-3) var(--tk-space-4); cursor:pointer; min-height:92px; min-width:0; transition:border-color var(--tk-motion-fast); }
  .tk-cal-stats__tile:hover { border-color:var(--tk-c-border-strong); }
  .tk-cal-stats__label { display:flex; align-items:center; gap:6px; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); }
  .tk-cal-stats__value { font-size:var(--tk-fs-2xl); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); font-variant-numeric:tabular-nums; line-height:1.1; }
  .tk-cal-stats__value small { font-size:var(--tk-fs-md); font-weight:var(--tk-fw-medium); color:var(--tk-c-text-muted); margin-left:3px; }
  .tk-cal-stats__sub { font-size:var(--tk-fs-sm); color:var(--tk-c-text-subtle); }
  .tk-cal-stats--strip { display:flex; flex-wrap:wrap; gap:6px; }
  .tk-cal-stats--strip .tk-cal-stats__tile { flex-direction:row; align-items:center; gap:8px; min-height:44px; padding:6px 12px; border-radius:var(--tk-radius-pill); }
  .tk-cal-stats--strip .tk-cal-stats__value { font-size:var(--tk-fs-lg); }
  .tk-cal-stats--strip .tk-cal-stats__sub { display:none; }
  .bp-mobile .tk-cal-stats { grid-template-columns:repeat(2, minmax(0,1fr)); gap:var(--tk-space-2); }
  .bp-mobile .tk-cal-stats__tile { padding:var(--tk-space-3); }`,
  example: { data: { events: [
    { id: 'a', title: 'Stand-up', start: '2026-11-24T09:45:00', end: '2026-11-24T10:00:00', category: 'Arbeit' },
    { id: 'b', title: 'Review', start: '2026-11-24T11:00:00', end: '2026-11-24T12:00:00', category: 'Arbeit' },
    { id: 'c', title: 'Fokus', start: '2026-11-25T10:00:00', end: '2026-11-25T11:30:00', category: 'Fokus' },
  ] } },
  render: ({ props, data, ctx }) => {
    const events = Array.isArray(data.events) ? data.events : [];
    if (!events.length) return html`<${EmptyState} icon="calendar" title="Noch keine Termine" text="Sobald Termine existieren, erscheinen hier die Kennzahlen." />`;
    const today = dayStart(ctx.today), wk = startOfWeek(today), nowMin = minutesOf(ctx.today);
    const week = occurrences(events, wk, addDays(wk, 7)), todays = onDay(week, today);
    const timedToday = todays.filter((o) => !o.allDay), booked = bookedMinutes(todays);
    const weekTimed = week.filter((o) => !o.allDay), focus = weekTimed.filter((o) => o.category === 'Fokus').reduce((n, o) => n + Math.round((o._e - o._s) / 60000), 0);
    const left = timedToday.filter((o) => minutesOf(o._e) > nowMin).length;
    const free = freeSlots(timedToday, Math.max(Math.ceil(nowMin / 15) * 15, 8 * 60), Number(props.workEnd) * 60, 30).reduce((n, [a, b]) => n + b - a, 0);
    const go = (name, detail) => ctx.emit(name, detail);
    const T = {
      today: { icon: 'calendar-days', label: 'Termine heute', value: timedToday.length, sub: left ? `${left} noch offen` : 'alle vorbei', ev: ['day.open', { id: dayKey(today), ui: { selectedDate: dayKey(today) } }] },
      booked: { icon: 'clock', label: 'Gebucht heute', value: hoursLabel(booked).replace(' h', ''), unit: 'h', sub: `von ${props.workEnd - 8} h Arbeitstag`, ev: ['day.open', { id: dayKey(today), ui: { selectedDate: dayKey(today) } }] },
      week: { icon: 'calendar-range', label: 'Termine diese Woche', value: weekTimed.length, sub: `${hoursLabel(bookedMinutes(weekTimed))} gebucht`, ev: ['week.open', null] },
      focus: { icon: 'target', label: 'Fokuszeit Woche', value: hoursLabel(focus).replace(' h', ''), unit: 'h', sub: `${weekTimed.filter((o) => o.category === 'Fokus').length} Fokus-Blöcke`, ev: ['week.open', null] },
      free: { icon: 'timer', label: 'Frei bis Feierabend', value: hoursLabel(free).replace(' h', ''), unit: 'h', sub: free ? `längstes Fenster ${durLabel(Math.max(0, ...freeSlots(timedToday, Math.max(Math.ceil(nowMin / 15) * 15, 8 * 60), Number(props.workEnd) * 60, 30).map(([a, b]) => b - a)))}` : 'heute voll', ev: ['day.open', { id: dayKey(today), ui: { selectedDate: dayKey(today) } }] },
    };
    const items = (Array.isArray(props.items) ? props.items : String(props.items || '').split(',').map((s) => s.trim())).filter((k) => T[k]);
    return html`<div class=${`tk-cal-stats tk-cal-stats--${props.style}`} data-qa="cal-stats" role="list">${items.map((k) => { const t = T[k];
      return html`<button type="button" role="listitem" class="tk-cal-stats__tile" onClick=${() => go(...t.ev)} aria-label=${`${t.label}: ${t.value}${t.unit ? ` ${t.unit}` : ''}`}>
        <span class="tk-cal-stats__label"><${Icon} name=${t.icon} size=${15} />${t.label}</span>
        <span class="tk-cal-stats__value">${t.value}${t.unit && html`<small>${t.unit}</small>`}</span><span class="tk-cal-stats__sub">${t.sub}</span></button>`; })}</div>`;
  },
};
export default calStats;
