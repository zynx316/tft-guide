// Kalender: Auslastung der Woche – gebuchte Zeit je Tag, Überschneidungen, freie Zeit (Zeilen oder Säulen).
import { html } from '../../../lib/html.js';
import { Card, Icon, Badge, EmptyState } from '../../ui.js';
import { dayKey } from './_cal.js';
import { weekLoad, hoursLabel, hoursNum } from './_cal-info.js';

export const weekLoadComp = {
  id: 'week-load',
  name: 'Wochenlast',
  category: 'Kalender',
  description: 'Zeigt, wie voll jeder Tag der Woche ist: gebuchte Stunden, Anzahl Termine, Überschneidungen und Ganztagstermine (Feiertage, Geburtstage). Antippen springt zum Tag.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Wochenlast' },
    { name: 'style', label: 'Darstellung', type: 'select', options: ['rows', 'bars'], default: 'rows' },
    { name: 'workFrom', label: 'Arbeitstag ab (Std.)', type: 'number', default: 8 },
    { name: 'workTo', label: 'Arbeitstag bis (Std.)', type: 'number', default: 18 },
  ],
  data: [{ slot: 'events', label: 'Termine', default: 'events', shape: '{id,start,end,allDay?,repeat?}[]', required: true }],
  events: ['day.open'],
  states: ['empty'],
  css: `
  .tk-cal-load__row { display:grid; grid-template-columns:44px minmax(0,1fr) auto; align-items:center; gap:12px; width:100%; min-height:52px; padding:6px 16px; border:0; border-bottom:1px solid var(--tk-c-border); background:transparent; color:var(--tk-c-text); font:inherit; text-align:left; cursor:pointer; }
  .tk-cal-load__row:last-child { border-bottom:0; } .tk-cal-load__row:hover { background:var(--tk-c-surface2); }
  .tk-cal-load__row[data-today="true"] { background:var(--tk-c-accent-soft); }
  .tk-cal-load__dow { font-size:var(--tk-fs-xs); font-weight:var(--tk-fw-semibold); letter-spacing:var(--tk-ls-wide); text-transform:uppercase; color:var(--tk-c-text-muted); display:block; }
  .tk-cal-load__dnum { font-size:var(--tk-fs-lg); font-weight:var(--tk-fw-semibold); font-variant-numeric:tabular-nums; }
  .tk-cal-load__track { height:8px; border-radius:99px; background:var(--tk-c-surface3); overflow:hidden; } .tk-cal-load__track i { display:block; height:100%; border-radius:99px; background:var(--tk-c-accent); }
  .tk-cal-load__track[data-over="true"] i { background:var(--tk-c-warning); }
  .tk-cal-load__meta { display:flex; align-items:center; gap:6px; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); white-space:nowrap; font-variant-numeric:tabular-nums; }
  .tk-cal-load__note { grid-column:2 / -1; font-size:var(--tk-fs-xs); color:var(--tk-c-text-muted); margin-top:-6px; }
  .tk-cal-load__bars { display:grid; grid-template-columns:repeat(7, minmax(0,1fr)); gap:var(--tk-space-2); align-items:end; padding:var(--tk-space-2) 0 0; }
  .tk-cal-load__bar { display:flex; flex-direction:column; align-items:center; gap:6px; border:0; background:transparent; color:var(--tk-c-text); font:inherit; cursor:pointer; min-width:0; min-height:44px; border-radius:var(--tk-radius-md); padding:4px 0; }
  .tk-cal-load__bar:hover { background:var(--tk-c-surface2); }
  .tk-cal-load__col { width:100%; max-width:44px; height:112px; border-radius:10px; background:var(--tk-c-surface3); display:flex; align-items:flex-end; overflow:hidden; }
  .tk-cal-load__col i { display:block; width:100%; border-radius:10px 10px 0 0; background:var(--tk-c-accent); min-height:3px; }
  .tk-cal-load__bar[data-over="true"] .tk-cal-load__col i { background:var(--tk-c-warning); }
  .tk-cal-load__bar[data-today="true"] .tk-cal-load__dnum { color:var(--tk-c-accent); }
  .tk-cal-load__val { font-size:var(--tk-fs-xs); color:var(--tk-c-text-muted); font-variant-numeric:tabular-nums; }
  .bp-mobile .tk-cal-load__col { height:92px; }`,
  example: { data: { events: [
    { id: 'a', title: 'A', start: '2026-11-24T09:45:00', end: '2026-11-24T12:00:00' }, { id: 'b', title: 'B', start: '2026-11-25T09:00:00', end: '2026-11-25T16:00:00' },
    { id: 'c', title: 'C', start: '2026-11-26T10:00:00', end: '2026-11-26T12:00:00' },
  ] } },
  render: ({ props, data, ctx }) => {
    const events = Array.isArray(data.events) ? data.events : [];
    if (!events.length) return html`<${Card} title=${props.title}><${EmptyState} icon="calendar-range" title="Keine Termine" text="Die Wochenlast erscheint, sobald Termine existieren." /><//>`;
    const days = weekLoad(events, ctx.today, Number(props.workFrom), Number(props.workTo));
    const work = (props.workTo - props.workFrom) * 60, todayKey = dayKey(ctx.today);
    const open = (d) => ctx.emit('day.open', { id: d.key, ui: { selectedDate: d.key } });
    const note = (d) => [d.conflicts ? `${d.conflicts} Überschneidung${d.conflicts > 1 ? 'en' : ''}` : '', ...d.allDay.slice(0, 1).map((o) => o.title)].filter(Boolean).join(' · ');
    const busiest = days.reduce((a, b) => (b.booked > a.booked ? b : a), days[0]);
    const act = html`<${Badge} tone=${busiest.over ? 'warning' : 'neutral'}>${busiest.booked ? `Dichtester Tag: ${busiest.label} ${hoursLabel(busiest.booked)}` : 'Woche frei'}<//>`;
    if (props.style === 'bars') return html`<${Card} title=${props.title} icon="bar-chart-3" actions=${act}><div class="tk-cal-load__bars" role="list">${days.map((d) => html`<button type="button" role="listitem" class="tk-cal-load__bar" data-today=${d.key === todayKey} data-over=${d.over} onClick=${() => open(d)} aria-label=${`${d.label} ${d.day.getDate()}.: ${d.n} Termine, ${hoursLabel(d.booked)} gebucht`}>
      <span class="tk-cal-load__val">${d.booked ? hoursNum(d.booked) : '–'}</span><span class="tk-cal-load__col"><i style=${`height:${Math.min(100, d.booked / work * 100)}%`}></i></span>
      <span><span class="tk-cal-load__dow">${d.label}</span><span class="tk-cal-load__dnum">${d.day.getDate()}</span></span></button>`)}</div><//>`;
    return html`<${Card} flush=${true} title=${props.title} icon="bar-chart-3" actions=${act}><div role="list">${days.map((d) => html`<button type="button" role="listitem" class="tk-cal-load__row" data-today=${d.key === todayKey} onClick=${() => open(d)} aria-label=${`${d.label} ${d.day.getDate()}.: ${d.n} Termine, ${hoursLabel(d.booked)} gebucht`}>
      <span><span class="tk-cal-load__dow">${d.label}</span><span class="tk-cal-load__dnum">${d.day.getDate()}</span></span>
      <span class="tk-cal-load__track" data-over=${d.over}><i style=${`width:${Math.min(100, d.booked / work * 100)}%`}></i></span>
      <span class="tk-cal-load__meta">${d.conflicts > 0 && html`<${Icon} name="alert-triangle" size=${14} />`}${d.n} · ${d.booked ? hoursLabel(d.booked) : 'frei'}</span>
      ${note(d) && html`<span class="tk-cal-load__note tk-truncate">${note(d)}</span>`}</button>`)}</div><//>`;
  },
};
export default weekLoadComp;
