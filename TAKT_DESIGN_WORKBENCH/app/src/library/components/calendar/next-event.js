// Kalender: der nächste (oder laufende) Termin als große Karte – Countdown, Ort mit Fahrzeit, Teilnehmer, Konflikt-Hinweis.
import { html } from '../../../lib/html.js';
import { Card, Button, Badge, Icon, Avatar, EmptyState } from '../../ui.js';
import { dayStart, addDays, dayKey, minutesOf, timeStr, hm, durLabel, catColor, catTone, longDay, occurrences } from './_cal.js';
import { nextOccurrences, overlapsWith, inLabel, openEvent, OPEN_MODE_PROP } from './_cal-info.js';

export const nextEvent = {
  id: 'next-event',
  name: 'Nächster Termin',
  category: 'Kalender',
  description: 'Der laufende oder nächste Termin groß dargestellt: Countdown, Uhrzeit, Ort mit Fahrzeit und Losgehzeit, Teilnehmer und Warnung bei Überschneidung. Dahinter der darauffolgende Termin.',
  version: '1.0',
  props: [
    { name: 'style', label: 'Darstellung', type: 'select', options: ['hero', 'compact'], default: 'hero' },
    { name: 'showAttendees', label: 'Teilnehmer', type: 'boolean', default: true },
    { name: 'showFollowing', label: 'Danach-Zeile', type: 'boolean', default: true },
    OPEN_MODE_PROP,
  ],
  data: [{ slot: 'events', label: 'Termine', default: 'events', shape: '{id,title,start,end,category?,location?,travel?,attendees?}[]', required: true }],
  events: ['event.open', 'event.create', 'event.create.open', 'event.update', 'event.delete'],
  states: ['empty'],
  css: `
  .tk-cal-next { position:relative; overflow:hidden; display:flex; flex-direction:column; gap:var(--tk-space-3); padding:var(--tk-space-5); border-radius:var(--tk-radius-xl); border:1px solid var(--tk-c-border); background:linear-gradient(150deg, color-mix(in srgb, var(--ec) 20%, var(--tk-c-surface)), var(--tk-c-surface) 70%); min-width:0; }
  .tk-cal-next::before { content:''; position:absolute; left:0; top:0; bottom:0; width:5px; background:var(--ec); }
  .tk-cal-next__eyebrow { display:flex; align-items:center; gap:8px; flex-wrap:wrap; font-size:var(--tk-fs-xs); font-weight:var(--tk-fw-semibold); letter-spacing:var(--tk-ls-wide); text-transform:uppercase; color:var(--tk-c-text-muted); }
  .tk-cal-next__eyebrow b { color:var(--tk-c-text); }
  .tk-cal-next__title { font-size:var(--tk-fs-2xl); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); line-height:1.2; margin:0; overflow-wrap:anywhere; }
  .tk-cal-next__facts { display:flex; flex-direction:column; gap:6px; color:var(--tk-c-text-muted); font-size:var(--tk-fs-md); }
  .tk-cal-next__facts > div { display:flex; align-items:flex-start; gap:8px; } .tk-cal-next__facts .icon { flex:none; margin-top:2px; color:var(--tk-c-text-subtle); }
  .tk-cal-next__people { display:flex; align-items:center; } .tk-cal-next__people .tk-avatar { margin-right:-6px; box-shadow:0 0 0 2px var(--tk-c-surface); }
  .tk-cal-next__foot { display:flex; align-items:center; gap:var(--tk-space-3); flex-wrap:wrap; margin-top:4px; }
  .tk-cal-next__after { display:flex; align-items:center; gap:10px; width:100%; min-height:44px; padding:6px 0 0; border:0; border-top:1px solid var(--tk-c-border); background:transparent; color:var(--tk-c-text-muted); font:inherit; font-size:var(--tk-fs-sm); text-align:left; cursor:pointer; }
  .tk-cal-next--compact { padding:var(--tk-space-4); } .tk-cal-next--compact .tk-cal-next__title { font-size:var(--tk-fs-xl); }
  .bp-mobile .tk-cal-next { padding:var(--tk-space-4) var(--tk-space-4) var(--tk-space-4) var(--tk-space-5); }`,
  example: { data: { events: [
    { id: 'a', title: 'Mittag mit Jana', start: '2026-11-24T12:30:00', end: '2026-11-24T13:30:00', category: 'Privat', tone: 'accent2', location: 'Café Moll', travel: 10, attendees: [{ name: 'Jana', status: 'Zugesagt' }] },
    { id: 'b', title: 'Lieferanten-Call Etsy', start: '2026-11-24T15:00:00', end: '2026-11-24T16:00:00', category: 'Sales', tone: 'warning', location: 'Zoom' },
  ] } },
  render: function NextEvent({ props, data, setData, ctx }) {
    const events = Array.isArray(data.events) ? data.events : [];
    const list = nextOccurrences(events, ctx.today, 14);
    if (!list.length) return html`<${Card}><${EmptyState} icon="calendar-check" title="Nichts mehr geplant" text="In den nächsten zwei Wochen steht kein Termin an." action=${html`<${Button} variant="primary" icon="plus" onClick=${() => ctx.emit('event.create.open')}>Termin anlegen<//>`} /><//>`;
    const nowMin = Math.round((+ctx.today - +dayStart(ctx.today)) / 60000);
    const cur = list.find((o) => o._s <= ctx.today && o._e > ctx.today), ev = cur || list[0], following = list.find((o) => o.id !== ev.id && o._s >= ev._s);
    const mins = Math.round((ev._s - ctx.today) / 60000), left = Math.round((ev._e - ctx.today) / 60000);
    const sameDay = dayKey(ev._s) === dayKey(ctx.today), tomorrow = dayKey(ev._s) === dayKey(addDays(ctx.today, 1));
    const clash = overlapsWith(ev, occurrences(events, dayStart(ev._s), addDays(dayStart(ev._s), 1)));
    const leave = ev.travel ? minutesOf(ev._s) - ev.travel - 5 : null;
    const people = props.showAttendees ? (ev.attendees || []) : [];
    const when = cur ? `Läuft jetzt · noch ${durLabel(left)}` : mins < 1440 && sameDay ? `Als Nächstes · ${inLabel(mins)}` : tomorrow ? 'Morgen' : longDay(ev._s);
    return html`<section class=${`tk-cal-next tk-cal-next--${props.style}`} style=${`--ec:${catColor(ev)}`} data-qa="next-event" aria-label=${`Nächster Termin: ${ev.title}`}>
      <div class="tk-cal-next__eyebrow"><${Icon} name=${cur ? 'play' : 'clock'} size=${14} /><b>${when}</b><${Badge} tone=${catTone(ev)} dot>${ev.category || 'Termin'}<//>${clash.length > 0 && html`<${Badge} tone="warning" icon="alert-triangle">Überschneidung<//>`}</div>
      <h2 class="tk-cal-next__title">${ev.title}</h2>
      <div class="tk-cal-next__facts">
        <div><${Icon} name="clock" size=${16} /><span>${ev.allDay ? 'Ganztägig' : `${timeStr(ev._s)} – ${timeStr(ev._e)} Uhr · ${durLabel(Math.round((ev._e - ev._s) / 60000))}`}</span></div>
        ${ev.location && html`<div><${Icon} name="map-pin" size=${16} /><span>${ev.location}${leave != null && sameDay ? ` · Losgehen ${hm(leave)} (${ev.travel} Min. Weg)` : ev.travel ? ` · ${ev.travel} Min. Weg` : ''}</span></div>`}
      </div>
      <div class="tk-cal-next__foot"><${Button} variant="primary" icon="arrow-right" onClick=${() => openEvent(ctx, setData, ev, events, props)}>Details<//>
        ${people.length > 0 && html`<span class="tk-cal-next__people" aria-label=${`${people.length} Teilnehmer`}>${people.slice(0, 4).map((p) => html`<${Avatar} name=${p.name} />`)}</span>`}</div>
      ${props.showFollowing && following && html`<button type="button" class="tk-cal-next__after" onClick=${() => openEvent(ctx, setData, following, events, props)}><${Icon} name="chevron-right" size=${15} /><span class="tk-truncate">Danach: <b>${following.title}</b> · ${dayKey(following._s) === dayKey(ev._s) ? timeStr(following._s) : `${longDay(following._s)}, ${timeStr(following._s)}`}</span></button>`}
    </section>`;
  },
};
export default nextEvent;
