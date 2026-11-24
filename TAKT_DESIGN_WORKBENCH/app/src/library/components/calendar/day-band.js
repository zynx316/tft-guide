// Kalender: Tagesband – der Tag als farbiger Streifen mit Terminen, freien Fenstern und Jetzt-Marke, darunter die nächsten Termine.
import { html } from '../../../lib/html.js';
import { Card, Icon, Button, EmptyState } from '../../ui.js';
import { dayStart, addDays, dayKey, selDate, occurrences, onDay, minutesOf, timeStr, hm, durLabel, catColor, layoutDay, freeSlots, longDay, openCreateDialog } from './_cal.js';
import { openEvent, OPEN_MODE_PROP, hoursLabel, bookedMinutes } from './_cal-info.js';

export const dayBand = {
  id: 'day-band',
  name: 'Tagesband',
  category: 'Kalender',
  description: 'Der Tag als Zeitstreifen: farbige Blöcke für Termine, schraffierte freie Fenster, Jetzt-Marke. Darunter die Termine als antippbare Zeilen. Zeigt auf einen Blick, wie voll und wo Luft ist.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Heute im Überblick' },
    { name: 'startHour', label: 'Beginn (Std.)', type: 'number', default: 8 },
    { name: 'endHour', label: 'Ende (Std.)', type: 'number', default: 19 },
    { name: 'day', label: 'Tag', type: 'select', options: ['today', 'selectedDate'], default: 'today' },
    { name: 'showList', label: 'Terminzeilen', type: 'boolean', default: true },
    { name: 'listLimit', label: 'Max. Zeilen', type: 'number', default: 4 },
    OPEN_MODE_PROP,
  ],
  data: [{ slot: 'events', label: 'Termine', default: 'events', shape: '{id,title,start,end,category?,tone?,repeat?}[]', required: true }],
  events: ['event.open', 'event.create', 'event.create.open', 'event.update', 'event.delete'],
  states: ['empty'],
  css: `
  .tk-cal-band { position:relative; height:76px; border-radius:var(--tk-radius-md); background:repeating-linear-gradient(135deg, transparent 0 7px, color-mix(in srgb, var(--tk-c-success) 9%, transparent) 7px 14px), var(--tk-c-surface2); border:1px solid var(--tk-c-border); overflow:hidden; }
  .tk-cal-band__ev { position:absolute; border-radius:6px; background:color-mix(in srgb, var(--ec) 78%, var(--tk-c-surface)); border:1px solid color-mix(in srgb, var(--ec) 100%, black 12%); box-shadow:0 0 0 1px var(--tk-c-surface); }
  .tk-cal-band__ev[data-past="true"] { opacity:.5; }
  .tk-cal-band__now { position:absolute; top:-2px; bottom:-2px; width:2px; background:var(--tk-c-danger); z-index:2; } .tk-cal-band__now::before { content:''; position:absolute; top:0; left:-4px; width:10px; height:10px; border-radius:50%; background:var(--tk-c-danger); }
  .tk-cal-band__ticks { position:relative; height:22px; margin-top:4px; font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); font-variant-numeric:tabular-nums; }
  .tk-cal-band__ticks span { position:absolute; transform:translateX(-50%); }
  .tk-cal-band__sum { display:flex; flex-wrap:wrap; gap:6px 16px; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); margin:6px 0 2px; }
  .tk-cal-band__sum b { color:var(--tk-c-text); }
  .tk-cal-band__row { display:flex; align-items:center; gap:12px; width:100%; min-height:52px; padding:6px 0; border:0; border-top:1px solid var(--tk-c-border); background:transparent; color:var(--tk-c-text); font:inherit; text-align:left; cursor:pointer; }
  .tk-cal-band__row i { width:4px; align-self:stretch; border-radius:2px; background:var(--ec); flex:none; }
  .tk-cal-band__time { width:48px; flex:none; font-variant-numeric:tabular-nums; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); }`,
  example: { data: { events: [
    { id: 'a', title: 'Stand-up', start: '2026-11-24T09:45:00', end: '2026-11-24T10:00:00', category: 'Arbeit', tone: 'accent' },
    { id: 'b', title: 'Fokus', start: '2026-11-24T10:30:00', end: '2026-11-24T12:00:00', category: 'Fokus', tone: 'success' },
    { id: 'c', title: 'Etsy-Call', start: '2026-11-24T15:00:00', end: '2026-11-24T16:00:00', category: 'Sales', tone: 'warning' },
  ] } },
  render: function DayBand({ props, data, setData, ctx }) {
    const events = Array.isArray(data.events) ? data.events : [];
    const day = props.day === 'selectedDate' ? selDate(ctx) : dayStart(ctx.today), s0 = Number(props.startHour) * 60, e0 = Number(props.endHour) * 60, span = e0 - s0;
    const occs = onDay(occurrences(events, day, addDays(day, 1)), day), timed = occs.filter((o) => !o.allDay);
    const isToday = dayKey(day) === dayKey(ctx.today), nowMin = minutesOf(ctx.today);
    if (!events.length) return html`<${Card} title=${props.title}><${EmptyState} icon="calendar" title="Keine Termine" text="Lege einen Termin an, dann erscheint das Tagesband." /><//>`;
    const pct = (m) => `${Math.max(0, Math.min(100, (m - s0) / span * 100))}%`;
    const lanes = layoutDay(timed, 10);
    const free = freeSlots(timed, Math.max(s0, isToday ? Math.ceil(nowMin / 15) * 15 : s0), e0, 30);
    const freeMin = free.reduce((n, [a, b]) => n + b - a, 0), rest = timed.filter((o) => !isToday || minutesOf(o._e) > nowMin);
    return html`<${Card} title=${props.title} icon="gauge" actions=${html`<span class="tk-subtle" style="font-size:var(--tk-fs-sm)">${longDay(day)}</span>`}>
      <div class="tk-cal-band" role="img" aria-label=${`${timed.length} Termine, ${hoursLabel(bookedMinutes(timed))} gebucht, ${hoursLabel(freeMin)} frei`}>
        ${lanes.map(({ ev, col, cols, s, e }) => html`<div class="tk-cal-band__ev" data-past=${isToday && minutesOf(ev._e) <= nowMin} style=${`--ec:${catColor(ev)};left:${pct(s)};width:calc(${pct(e)} - ${pct(s)});top:calc(${col} / ${cols} * 100% + 3px);height:calc(100% / ${cols} - 6px)`}></div>`)}
        ${isToday && nowMin >= s0 && nowMin <= e0 && html`<div class="tk-cal-band__now" style=${`left:${pct(nowMin)}`} aria-hidden="true"></div>`}
      </div>
      <div class="tk-cal-band__ticks" aria-hidden="true">${Array.from({ length: Math.floor(span / 120) + 1 }, (_, i) => { const m = s0 + i * 120; return html`<span style=${`left:${pct(m)}`}>${hm(m).slice(0, 2)}</span>`; })}</div>
      <div class="tk-cal-band__sum"><span><b>${timed.length}</b> Termine</span><span><b>${hoursLabel(bookedMinutes(timed))}</b> gebucht</span><span><b>${hoursLabel(freeMin)}</b> frei${free.length ? ` · längstes Fenster ${durLabel(Math.max(...free.map(([a, b]) => b - a)))}` : ''}</span></div>
      ${props.showList && html`<div style="margin-top:8px">${rest.slice(0, Number(props.listLimit) || 4).map((o) => html`<button type="button" class="tk-cal-band__row" style=${`--ec:${catColor(o)}`} onClick=${() => openEvent(ctx, setData, o, events, props)}><span class="tk-cal-band__time">${timeStr(o._s)}</span><i></i><span class="tk-grow"><div class="tk-truncate" style="font-weight:var(--tk-fw-medium)">${o.title}</div>${o.location && html`<div class="tk-subtle tk-truncate" style="font-size:var(--tk-fs-sm)">${o.location}</div>`}</span><${Icon} name="chevron-right" size=${16} /></button>`)}
        ${!rest.length && html`<div class="tk-subtle" style="padding:12px 0;font-size:var(--tk-fs-sm)">${timed.length ? 'Alle Termine des Tages sind vorbei.' : 'Keine Termine – freier Tag.'} <${Button} size="sm" variant="ghost" onClick=${() => openCreateDialog(ctx, setData, { date: dayKey(day) })}>Termin anlegen<//></div>`}</div>`}
    <//>`;
  },
};
export default dayBand;
