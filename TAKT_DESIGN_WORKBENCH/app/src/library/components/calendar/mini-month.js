// Kalender: kleiner Monatsnavigator für Seitenleisten.
import { html } from '../../../lib/html.js';
import { useState, useEffect } from 'preact/hooks';
import { Button } from '../../ui.js';
import { addDays, startOfWeek, dayKey, parseDay, selDate, monthStart, monthName, occurrences, WEEKDAYS, catColor, fullDay } from './_cal.js';

export const miniMonth = {
  id: 'mini-month',
  name: 'Mini-Monat',
  category: 'Kalender',
  description: 'Kompakter Monatsnavigator mit Terminpunkten. Auswahl setzt ctx.ui.selectedDate; die gewählte Woche wird hervorgehoben.',
  version: '1.0',
  props: [
    { name: 'showDots', label: 'Terminpunkte', type: 'boolean', default: true },
    { name: 'highlightWeek', label: 'Woche hervorheben', type: 'boolean', default: true },
    { name: 'showTodayButton', label: '„Heute“-Button', type: 'boolean', default: true },
  ],
  data: [{ slot: 'events', label: 'Termine', default: 'events', shape: '{id,start,end,tone?}[]', required: false }],
  events: ['date.select', 'calendar.navigate'],
  states: [],
  css: `
  .tk-mm { background:var(--tk-c-surface); border:1px solid var(--tk-c-border); border-radius:var(--tk-radius-lg); padding:var(--tk-space-3); }
  .tk-mm__head { display:flex; align-items:center; gap:4px; margin-bottom:6px; }
  .tk-mm__title { flex:1; font-weight:var(--tk-fw-semibold); font-size:var(--tk-fs-md); padding-left:6px; }
  .tk-mm__grid { display:grid; grid-template-columns:repeat(7, minmax(0,1fr)); gap:2px 0; }
  .tk-mm__dow { text-align:center; font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); padding:4px 0; font-weight:var(--tk-fw-semibold); }
  .tk-mm__day { border:0; background:transparent; font:inherit; font-size:var(--tk-fs-sm); color:var(--tk-c-text); height:36px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1px; cursor:pointer; position:relative; font-variant-numeric:tabular-nums; border-radius:var(--tk-radius-sm); min-width:0; }
  .tk-mm__day:hover { background:var(--tk-c-surface3); }
  .tk-mm__day[data-out="true"] { color:var(--tk-c-text-subtle); }
  .tk-mm__day[data-week="true"] { background:var(--tk-c-accent-soft); border-radius:0; }
  .tk-mm__day[data-today="true"] span { color:var(--tk-c-accent); font-weight:var(--tk-fw-bold); }
  .tk-mm__day[data-sel="true"] span { background:var(--tk-c-accent); color:var(--tk-c-text-on-accent); }
  .tk-mm__day span { width:26px; height:26px; border-radius:50%; display:grid; place-items:center; }
  .tk-mm__dot { position:absolute; bottom:2px; display:flex; gap:2px; font-style:normal; } .tk-mm__dot i { width:4px; height:4px; border-radius:50%; background:var(--ec); display:block; }
  .bp-mobile .tk-mm__day { height:44px; }`,
  example: { data: { events: [{ id: 'a', title: 'Stand-up', start: '2026-11-24T09:45:00', end: '2026-11-24T10:00:00', tone: 'accent' }, { id: 'b', title: 'Zahnarzt', start: '2026-11-26T08:00:00', end: '2026-11-26T09:00:00', tone: 'danger' }] } },
  render: function MiniMonth({ props, data, ctx }) {
    const sel = selDate(ctx);
    const [m, setM] = useState(() => monthStart(sel));
    useEffect(() => { if (ctx.ui.selectedDate) setM(monthStart(parseDay(ctx.ui.selectedDate))); }, [ctx.ui.selectedDate]);
    const gridStart = startOfWeek(m);
    const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
    const last = days.findIndex((d, i) => i >= 28 && d.getMonth() !== m.getMonth());
    const shown = last > 0 && last % 7 === 0 ? days.slice(0, last) : days;
    const occs = props.showDots ? occurrences(data.events, gridStart, addDays(gridStart, 42)) : [];
    const todayKey = dayKey(ctx.today), selKey = dayKey(sel), wkStart = dayKey(startOfWeek(sel)), wkEnd = dayKey(addDays(startOfWeek(sel), 6));
    const move = (dir) => { const x = new Date(m); x.setMonth(x.getMonth() + dir); setM(x); ctx.emit('calendar.navigate', { month: dayKey(x).slice(0, 7) }); };
    const pick = (d) => { ctx.setUi('selectedDate', dayKey(d)); ctx.emit('date.select', { date: dayKey(d) }); };
    return html`<div class="tk-mm">
      <div class="tk-mm__head"><span class="tk-mm__title">${monthName(m)} ${m.getFullYear()}</span>
        <${Button} size="sm" variant="ghost" icon="chevron-left" aria-label="Vorheriger Monat" onClick=${() => move(-1)} />
        <${Button} size="sm" variant="ghost" icon="chevron-right" aria-label="Nächster Monat" onClick=${() => move(1)} /></div>
      <div class="tk-mm__grid">${WEEKDAYS.map((w) => html`<div class="tk-mm__dow">${w}</div>`)}
        ${shown.map((d) => { const k = dayKey(d); const ev = occs.filter((o) => dayKey(o._s) === k).slice(0, 3);
          return html`<button type="button" class="tk-mm__day" data-out=${d.getMonth() !== m.getMonth()} data-today=${k === todayKey} data-sel=${k === selKey}
            data-week=${props.highlightWeek && k >= wkStart && k <= wkEnd} onClick=${() => pick(d)} aria-label=${fullDay(d)} aria-pressed=${k === selKey}>
            <span>${d.getDate()}</span>${ev.length > 0 && html`<em class="tk-mm__dot" aria-hidden="true">${ev.map((e) => html`<i style=${`--ec:${catColor(e)}`}></i>`)}</em>`}</button>`; })}
      </div>
      ${props.showTodayButton && html`<div style="margin-top:8px"><${Button} size="sm" onClick=${() => { setM(monthStart(ctx.today)); pick(ctx.today); }}>Heute<//></div>`}
    </div>`;
  },
};
export default miniMonth;
