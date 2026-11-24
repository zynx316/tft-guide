// Kalender: chronologische Agenda, nach Tag gruppiert, mit freien Zeitfenstern.
import { html } from '../../../lib/html.js';
import { Button, Badge, Icon, EmptyState } from '../../ui.js';
import {
  addDays, dayKey, selDate, occurrences, onDay, eventsFiltered, timeStr, minutesOf, hm, durLabel, freeSlots, catColor, catTone,
  openEventDialog, openCreateDialog, longDay, weekdayName, dayMonth, EVENT_CSS,
} from './_cal.js';
import { openEvent, OPEN_MODE_PROP } from './_cal-info.js';

export const agenda = {
  id: 'agenda',
  name: 'Agenda',
  category: 'Kalender',
  description: 'Chronologische Termin-Liste für einen oder mehrere Tage, gruppiert nach Tag, mit Hinweis auf freie Zeitfenster und Tagesleerzustand.',
  version: '1.2',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Agenda' },
    { name: 'days', label: 'Anzahl Tage', type: 'number', default: 3 },
    { name: 'startFrom', label: 'Start', type: 'select', options: ['selectedDate', 'today'], default: 'selectedDate' },
    { name: 'showFree', label: 'Freie Zeitfenster', type: 'boolean', default: true },
    { name: 'freeFrom', label: 'Arbeitstag ab (Std.)', type: 'number', default: 8 },
    { name: 'freeTo', label: 'Arbeitstag bis (Std.)', type: 'number', default: 18 },
    { name: 'hideEmptyDays', label: 'Leere Tage ausblenden', type: 'boolean', default: false },
    { name: 'respectFilter', label: 'Suche/Filter beachten', type: 'boolean', default: true },
    OPEN_MODE_PROP,
  ],
  data: [{ slot: 'events', label: 'Termine', default: 'events', shape: '{id,title,start,end,category?,tone?,location?}[]', required: true }],
  events: ['event.open', 'event.create', 'event.create.open', 'event.update', 'event.delete', 'agenda.free.use'],
  states: ['empty'],
  css: `${EVENT_CSS}
  .tk-agenda__day { padding:10px 16px 8px; display:flex; flex-wrap:wrap; align-items:baseline; gap:4px 8px; background:var(--tk-c-surface2); border-bottom:1px solid var(--tk-c-border); position:relative; }
  .tk-agenda__day b { font-size:var(--tk-fs-md); } .tk-agenda__day[data-today="true"] b { color:var(--tk-c-accent); }
  .tk-agenda__row { display:flex; align-items:center; gap:12px; width:100%; border:0; background:transparent; font:inherit; color:var(--tk-c-text); text-align:left; padding:10px 16px; min-height:56px; border-bottom:1px solid var(--tk-c-border); cursor:pointer; }
  .tk-agenda__row:hover { background:var(--tk-c-surface2); }
  .tk-agenda__time { min-width:52px; flex:none; white-space:nowrap; font-variant-numeric:tabular-nums; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); line-height:1.3; }
  .tk-agenda__time b { display:block; color:var(--tk-c-text); font-size:var(--tk-fs-md); }
  .tk-agenda__bar { width:4px; align-self:stretch; min-height:32px; border-radius:2px; background:var(--ec); flex:none; }
  .tk-agenda__row[data-past="true"] .tk-agenda__main { opacity:.7; }
  .tk-agenda__free { display:flex; align-items:center; gap:10px; padding:8px 16px 8px 80px; border-bottom:1px solid var(--tk-c-border); font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); background:repeating-linear-gradient(135deg, transparent 0 8px, color-mix(in srgb, var(--tk-c-success) 6%, transparent) 8px 16px); min-height:40px; }
  .tk-agenda__empty { padding:14px 16px; color:var(--tk-c-text-subtle); font-size:var(--tk-fs-sm); border-bottom:1px solid var(--tk-c-border); display:flex; gap:8px; align-items:center; }
  .bp-mobile .tk-agenda__free { padding-left:16px; }
  [data-tk-large-text] .tk-agenda__time { min-width:3.8em; }
  [data-tk-large-text] .tk-agenda__free { flex-wrap:wrap; }
  [data-tk-large-text] .tk-agenda__free .tk-grow { display:none; }
  [data-tk-large-text] .tk-agenda__free button { white-space:nowrap; margin-left:auto; }`,
  example: { data: { events: [
    { id: 'a', title: 'Daily Stand-up', start: '2026-11-24T09:45:00', end: '2026-11-24T10:00:00', category: 'Arbeit', tone: 'accent', location: 'Teams' },
    { id: 'b', title: 'Mittag mit Jana', start: '2026-11-24T12:30:00', end: '2026-11-24T13:30:00', category: 'Privat', tone: 'accent2', location: 'Café Moll' },
    { id: 'c', title: 'Lieferanten-Call Etsy', start: '2026-11-24T15:00:00', end: '2026-11-24T16:00:00', category: 'Sales', tone: 'warning' },
  ] } },
  render: function Agenda({ props, data, setData, ctx }) {
    const all = Array.isArray(data.events) ? data.events : [];
    const first = props.startFrom === 'today' ? new Date(ctx.today.getFullYear(), ctx.today.getMonth(), ctx.today.getDate()) : selDate(ctx);
    const nDays = Math.max(1, Number(props.days) || 1);
    const occs = occurrences(eventsFiltered(all, ctx.ui, props.respectFilter), first, addDays(first, nDays));
    const todayKey = dayKey(ctx.today), nowMin = minutesOf(ctx.today);
    const days = Array.from({ length: nDays }, (_, i) => addDays(first, i)).filter((d) => !props.hideEmptyDays || onDay(occs, d).length);
    if (!all.length || !days.length) return html`<${EmptyState} icon="calendar-clock" title="Keine Termine" text="In diesem Zeitraum steht nichts an." action=${html`<${Button} variant="primary" icon="plus" onClick=${() => openCreateDialog(ctx, setData, {})}>Termin anlegen<//>`} />`;
    return html`<section class="tk-card tk-card--flush" data-qa="agenda"><div class="tk-card__head" style="padding:14px 16px 0;margin-bottom:10px"><h3 class="tk-card__title">${props.title}</h3>
      <${Button} size="sm" icon="plus" onClick=${() => openCreateDialog(ctx, setData, { date: dayKey(first) })}>Termin<//></div>
      ${days.map((d) => { const k = dayKey(d); const evs = onDay(occs, d).sort((a, b) => (b.allDay ? 1 : 0) - (a.allDay ? 1 : 0) || a._s - b._s);
        const slots = props.showFree ? freeSlots(evs, Number(props.freeFrom) * 60, Number(props.freeTo) * 60) : [];
        const isToday = k === todayKey;
        const rows = [...evs.map((e) => ({ t: 'ev', at: e.allDay ? -1 : minutesOf(e._s), e })), ...slots.filter(([a, b]) => !isToday || b > nowMin).map(([a, b]) => ({ t: 'free', at: isToday ? Math.max(a, Math.ceil(nowMin / 15) * 15) : a, a: isToday ? Math.max(a, Math.ceil(nowMin / 15) * 15) : a, b }))].sort((x, y) => x.at - y.at);
        return html`<div><div class="tk-agenda__day" data-today=${isToday}><b>${isToday ? 'Heute' : k === dayKey(addDays(ctx.today, 1)) ? 'Morgen' : weekdayName(d)}</b><span class="tk-subtle" style="font-size:var(--tk-fs-sm)">${dayMonth(d)}</span><span class="tk-grow"></span><${Badge}>${evs.length} ${evs.length === 1 ? 'Termin' : 'Termine'}<//></div>
          ${!evs.length ? html`<div class="tk-agenda__empty"><${Icon} name="sun" size=${16} />Keine Termine – freier Tag.</div>` : rows.map((r) => r.t === 'free'
            ? (r.b - r.a >= 45 ? html`<div class="tk-agenda__free"><${Icon} name="timer" size=${15} /><span><b>${hm(r.a)}–${hm(r.b)}</b> frei · ${durLabel(r.b - r.a)}</span><span class="tk-grow"></span><${Button} size="sm" variant="ghost" onClick=${() => { ctx.emit('agenda.free.use', { from: hm(r.a) }); openCreateDialog(ctx, setData, { date: k, start: hm(r.a), end: hm(Math.min(r.b, r.a + 60)) }); }}>Nutzen<//></div>` : null)
            : html`<button type="button" class="tk-agenda__row" data-past=${isToday && !r.e.allDay && minutesOf(r.e._e) <= nowMin} onClick=${() => openEvent(ctx, setData, r.e, all, props)}>
              <span class="tk-agenda__time">${r.e.allDay ? html`<b>Ganztag</b>` : html`<b>${timeStr(r.e._s)}</b>${timeStr(r.e._e)}`}</span>
              <span class="tk-agenda__bar" style=${`--ec:${catColor(r.e)}`}></span>
              <span class="tk-grow tk-agenda__main"><div style="font-weight:600" class="tk-truncate">${r.e.title}</div>${r.e.location && html`<div class="tk-subtle tk-truncate" style="font-size:var(--tk-fs-sm)"><${Icon} name="map-pin" size=${12} /> ${r.e.location}</div>`}</span>
              ${ctx.bp !== 'mobile' && r.e.category && html`<${Badge} tone=${catTone(r.e)}>${r.e.category}<//>`}
            </button>`)}</div>`; })}
    </section>`;
  },
};
export default agenda;
