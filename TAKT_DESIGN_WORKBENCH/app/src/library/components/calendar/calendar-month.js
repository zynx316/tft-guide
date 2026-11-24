// Kalender: Monatsraster mit Terminchips (Desktop/Tablet) bzw. Punkten (Mobile) und Tagesliste.
import { html } from '../../../lib/html.js';
import { useState, useEffect } from 'preact/hooks';
import { Button, Icon, EmptyState } from '../../ui.js';
import {
  addDays, startOfWeek, dayKey, isoWeek, parseDay, selDate, monthStart, monthName, occurrences, onDay, eventsFiltered, timeStr, catColor,
  openEventDialog, openCreateDialog, WEEKDAYS, longDay, EVENT_CSS,
} from './_cal.js';

export const calendarMonth = {
  id: 'calendar-month',
  name: 'Kalender Monat',
  category: 'Kalender',
  description: 'Monatsraster mit Termin-Chips (Mobile: Punkte), Tag wählen setzt ctx.ui.selectedDate; optional Tagesliste unter dem Raster.',
  version: '1.1',
  props: [
    { name: 'maxChips', label: 'Chips je Tag (Desktop)', type: 'number', default: 3 },
    { name: 'dayList', label: 'Tagesliste', type: 'select', options: ['auto', 'always', 'never'], default: 'auto' },
    { name: 'showToolbar', label: 'Navigation zeigen', type: 'boolean', default: true },
    { name: 'weekNumbers', label: 'Kalenderwochen', type: 'boolean', default: false },
    { name: 'respectFilter', label: 'Suche/Filter beachten', type: 'boolean', default: true },
  ],
  data: [{ slot: 'events', label: 'Termine', default: 'events', shape: '{id,title,start,end,category?,tone?}[]', required: true }],
  events: ['date.select', 'calendar.navigate', 'event.open', 'event.create', 'event.create.open', 'event.update', 'event.delete'],
  states: ['empty'],
  css: `${EVENT_CSS}
  .tk-cm { display:flex; flex-direction:column; gap:var(--tk-space-3); min-width:0; }
  .tk-cm__bar > .tk-btn { flex:none; min-width:36px; }
  .tk-cm__bar { display:flex; align-items:center; gap:var(--tk-space-2); }
  .tk-cm__title { font-size:var(--tk-fs-lg); font-weight:var(--tk-fw-semibold); margin:0 var(--tk-space-2); }
  .tk-cm__frame { background:var(--tk-c-surface); border:1px solid var(--tk-c-border); border-radius:var(--tk-radius-lg); overflow:hidden; }
  .tk-cm__grid { display:grid; grid-template-columns:repeat(var(--cols,7), minmax(0,1fr)); }
  .tk-cm__dow { padding:8px 4px; text-align:center; font-size:var(--tk-fs-xs); font-weight:var(--tk-fw-semibold); letter-spacing:var(--tk-ls-wide); text-transform:uppercase; color:var(--tk-c-text-subtle); border-bottom:1px solid var(--tk-c-border); background:var(--tk-c-surface2); }
  .tk-cm__cell { border:0; border-right:1px solid var(--tk-c-border); border-bottom:1px solid var(--tk-c-border); background:transparent; padding:6px; min-height:104px; display:flex; flex-direction:column; gap:3px; text-align:left; font:inherit; color:var(--tk-c-text); cursor:pointer; min-width:0; position:relative; }
  .tk-cm__cell:hover { background:var(--tk-c-surface2); }
  .tk-cm__cell[data-out="true"] { color:var(--tk-c-text-subtle); background:color-mix(in srgb, var(--tk-c-surface2) 55%, transparent); }
  .tk-cm__cell[data-sel="true"] { box-shadow:inset 0 0 0 2px var(--tk-c-accent); z-index:1; }
  .tk-cm__num { width:26px; height:26px; display:grid; place-items:center; border-radius:50%; font-size:var(--tk-fs-sm); font-weight:var(--tk-fw-semibold); font-variant-numeric:tabular-nums; }
  .tk-cm__cell[data-today="true"] .tk-cm__num { background:var(--tk-c-accent); color:var(--tk-c-text-on-accent); }
  .tk-cm__chip { display:block; width:100%; border:0; padding:2px 6px; border-radius:var(--tk-radius-xs); font:inherit; font-size:var(--tk-fs-xs); text-align:left; color:var(--tk-c-text); background:color-mix(in srgb, var(--ec) 22%, var(--tk-c-surface)); border-left:3px solid var(--ec); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; cursor:pointer; }
  .tk-cm__more { font-size:var(--tk-fs-xs); color:var(--tk-c-text-muted); padding:0 4px; }
  .tk-cm__dots { display:flex; gap:3px; justify-content:center; height:8px; }
  .tk-cm__dots i { width:6px; height:6px; border-radius:50%; background:var(--ec); display:block; }
  .tk-cm__week { padding:6px 2px; font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); text-align:center; border-right:1px solid var(--tk-c-border); border-bottom:1px solid var(--tk-c-border); background:var(--tk-c-surface2); }
  .bp-tablet .tk-cm__cell { min-height:84px; padding:4px; }
  .bp-mobile .tk-cm__cell { min-height:52px; align-items:center; padding:4px 0; gap:2px; }
  .tk-cm__daylist { background:var(--tk-c-surface); border:1px solid var(--tk-c-border); border-radius:var(--tk-radius-lg); overflow:hidden; }
  .tk-cm__dayhead { display:flex; align-items:center; gap:8px; padding:12px 16px; border-bottom:1px solid var(--tk-c-border); font-weight:var(--tk-fw-semibold); }
  .tk-cm__ev { display:flex; align-items:center; gap:12px; width:100%; border:0; background:transparent; text-align:left; font:inherit; color:var(--tk-c-text); padding:10px 16px; min-height:52px; border-bottom:1px solid var(--tk-c-border); cursor:pointer; }
  .tk-cm__ev:last-child { border-bottom:0; }
  .tk-cm__ev:hover { background:var(--tk-c-surface2); }
  .tk-cm__bar2 { width:4px; align-self:stretch; border-radius:2px; background:var(--ec); flex:none; }
  [data-tk-large-text] .tk-cm__bar { flex-wrap:wrap; row-gap:var(--tk-space-2); }
  [data-tk-large-text] .tk-cm__title { flex:1 1 100%; order:-1; margin:0; }
  [data-tk-large-text] .tk-cm__num { width:1.9em; height:1.9em; }
  [data-tk-large-text] .tk-cm__dow { padding:8px 0; letter-spacing:0; }
  [data-tk-large-text] .tk-cm__dayhead { flex-wrap:wrap; }
  [data-tk-large-text] .tk-cm__dayhead > .tk-grow { flex:1 1 8em; }
  [data-tk-large-text] .tk-cm__ev { align-items:flex-start; }`,
  example: { data: { events: [
    { id: 'a', title: 'Daily Stand-up', start: '2026-11-24T09:45:00', end: '2026-11-24T10:00:00', category: 'Arbeit', tone: 'accent' },
    { id: 'b', title: 'Zahnarzt', start: '2026-11-26T08:00:00', end: '2026-11-26T09:00:00', category: 'Gesundheit', tone: 'danger' },
    { id: 'c', title: 'Black Friday', start: '2026-11-27', allDay: true, category: 'Sales', tone: 'warning' },
  ] } },
  render: function CalendarMonth({ props, data, setData, ctx }) {
    const mobile = ctx.bp === 'mobile', desktop = ctx.bp === 'desktop';
    const sel = selDate(ctx);
    const [m, setM] = useState(() => monthStart(sel));
    useEffect(() => { if (ctx.ui.selectedDate) setM(monthStart(parseDay(ctx.ui.selectedDate))); }, [ctx.ui.selectedDate]);
    const all = Array.isArray(data.events) ? data.events : [];
    if (!all.length) return html`<${EmptyState} icon="calendar" title="Keine Termine in diesem Monat" text="Lege einen Termin an, um den Monat zu füllen." action=${html`<${Button} variant="primary" icon="plus" onClick=${() => openCreateDialog(ctx, setData, {})}>Termin anlegen<//>`} />`;
    const gridStart = startOfWeek(m);
    const next = new Date(m); next.setMonth(next.getMonth() + 1);
    const weeks = Math.ceil(((+startOfWeek(addDays(next, -1)) - +gridStart) / 864e5 + 7) / 7);
    const days = Array.from({ length: weeks * 7 }, (_, i) => addDays(gridStart, i));
    const occs = occurrences(eventsFiltered(all, ctx.ui, props.respectFilter), gridStart, addDays(gridStart, weeks * 7));
    const todayKey = dayKey(ctx.today), selKey = dayKey(sel);
    const move = (dir) => { const x = new Date(m); x.setMonth(x.getMonth() + dir); setM(x); ctx.emit('calendar.navigate', { month: dayKey(x).slice(0, 7) }); };
    const pick = (d) => { ctx.setUi('selectedDate', dayKey(d)); ctx.emit('date.select', { date: dayKey(d) }); };
    const showList = props.dayList === 'always' || (props.dayList === 'auto' && !desktop);
    const dayEvs = onDay(occs, sel).sort((a, b) => (b.allDay ? 1 : 0) - (a.allDay ? 1 : 0) || a._s - b._s);
    const cols = props.weekNumbers && !mobile ? 8 : 7;
    return html`<div class="tk-cm">
      ${props.showToolbar && html`<div class="tk-cm__bar">
        <${Button} variant="ghost" icon="chevron-left" aria-label="Vorheriger Monat" onClick=${() => move(-1)} />
        <${Button} variant="ghost" icon="chevron-right" aria-label="Nächster Monat" onClick=${() => move(1)} />
        <h3 class="tk-cm__title tk-grow">${monthName(m)} ${m.getFullYear()}</h3>
        <${Button} onClick=${() => { setM(monthStart(ctx.today)); pick(ctx.today); }}>Heute<//>
        <${Button} variant="primary" icon="plus" aria-label="Termin anlegen" onClick=${() => openCreateDialog(ctx, setData, { date: selKey })}>${mobile ? null : 'Termin'}<//>
      </div>`}
      <div class="tk-cm__frame" data-qa="calendar-frame">
        <div class="tk-cm__grid" style=${`--cols:${cols}`}>
          ${cols === 8 && html`<div class="tk-cm__dow">KW</div>`}${WEEKDAYS.map((w) => html`<div class="tk-cm__dow">${w}</div>`)}
          ${days.map((d, i) => { const k = dayKey(d); const evs = onDay(occs, d).sort((a, b) => (b.allDay ? 1 : 0) - (a.allDay ? 1 : 0) || a._s - b._s); const max = Number(props.maxChips) || 3; const lim = ctx.bp === 'tablet' ? 2 : max;
            return html`${cols === 8 && i % 7 === 0 && html`<div class="tk-cm__week">${isoWeek(d)}</div>`}
              <button type="button" class="tk-cm__cell" data-out=${d.getMonth() !== m.getMonth()} data-today=${k === todayKey} data-sel=${k === selKey} onClick=${() => pick(d)}
                aria-label=${`${longDay(d)}, ${evs.length} Termine`}>
                <span class="tk-cm__num">${d.getDate()}</span>
                ${mobile ? html`<span class="tk-cm__dots" aria-hidden="true">${evs.slice(0, 3).map((e) => html`<i style=${`--ec:${catColor(e)}`}></i>`)}</span>`
                  : html`${evs.slice(0, lim).map((e) => html`<span class="tk-cm__chip" style=${`--ec:${catColor(e)}`} onClick=${(ev) => { ev.stopPropagation(); openEventDialog(ctx, setData, e, all); }}>${!e.allDay && html`<b style="font-weight:600">${timeStr(e._s)}</b> `}${e.title}</span>`)}
                    ${evs.length > lim && html`<span class="tk-cm__more">+${evs.length - lim} weitere</span>`}`}
              </button>`; })}
        </div>
      </div>
      ${showList && html`<div class="tk-cm__daylist">
        <div class="tk-cm__dayhead"><${Icon} name="calendar-days" size=${17} /><span class="tk-grow">${longDay(sel)}</span><${Button} size="sm" icon="plus" onClick=${() => openCreateDialog(ctx, setData, { date: selKey })}>Termin<//></div>
        ${dayEvs.length ? dayEvs.map((e) => html`<button type="button" class="tk-cm__ev" onClick=${() => openEventDialog(ctx, setData, e, all)}>
          <span class="tk-cm__bar2" style=${`--ec:${catColor(e)}`}></span>
          <span class="tk-grow"><div style="font-weight:600" class="tk-truncate">${e.title}</div><div class="tk-subtle" style="font-size:var(--tk-fs-sm)">${e.allDay ? 'Ganztägig' : `${timeStr(e._s)} – ${timeStr(e._e)}`}${e.location ? ` · ${e.location}` : ''}</div></span>
        </button>`) : html`<div class="tk-subtle" style="padding:16px;font-size:var(--tk-fs-sm)">Keine Termine an diesem Tag.</div>`}
      </div>`}
    </div>`;
  },
};
export default calendarMonth;
