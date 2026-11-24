// Kalender: Termin-Detail als Screen – Zeit, Ort mit Fahrzeit und Kartenvorschau, Video-Link, Notiz, Quelle, Aktionen.
import { html } from '../../../lib/html.js';
import { Card, Button, Badge, Icon, EmptyState } from '../../ui.js';
import { dayKey, dayStart, minutesOf, timeStr, hm, durLabel, longDay, catColor, catTone, openEditDialog } from './_cal.js';
import { pickEvent, baseOf, baseIdOf, inLabel, sourceOf, PREVIEW_ID_PROP } from './_cal-info.js';

const SOURCE_NAMES = { personal: 'Jonas · Persönlich', work: 'Nordlicht Studio', family: 'Jana & Jonas', etsy: 'Etsy-Versandfristen', holidays: 'Feiertage NRW', birthdays: 'Geburtstage', school: 'Schulferien NRW' };

export const eventDetail = {
  id: 'event-detail',
  name: 'Termin-Detail',
  category: 'Kalender',
  description: 'Vollständige Termin-Ansicht für den gewählten Termin (ctx.ui.selectedId): Zeit mit Countdown, Ort mit Fahrzeit und Kartenvorschau, Video-Link, Notiz, Kalenderquelle sowie Bearbeiten, Duplizieren und Löschen. Ohne Auswahl der nächste Termin.',
  version: '1.0',
  props: [
    { name: 'showMap', label: 'Kartenvorschau', type: 'boolean', default: true },
    { name: 'showActions', label: 'Aktionen', type: 'boolean', default: true },
    { name: 'fallbackNext', label: 'Ohne Auswahl nächsten Termin zeigen', type: 'boolean', default: true },
    PREVIEW_ID_PROP,
    { name: 'compact', label: 'Kompakt', type: 'boolean', default: false },
  ],
  data: [{ slot: 'events', label: 'Termine', default: 'events', shape: '{id,title,start,end,category?,location?,travel?,link?,note?,repeat?}[]', required: true }],
  events: ['event.open', 'event.update', 'event.delete', 'event.duplicate', 'event.join'],
  states: ['empty'],
  css: `
  .tk-evd { display:flex; flex-direction:column; gap:var(--tk-space-4); min-width:0; }
  .tk-evd__head { display:flex; gap:14px; align-items:flex-start; }
  .tk-evd__bar { width:6px; align-self:stretch; border-radius:3px; background:var(--ec); flex:none; min-height:56px; }
  .tk-evd__title { font-size:var(--tk-fs-2xl); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); line-height:1.2; margin:6px 0 0; overflow-wrap:anywhere; }
  .tk-evd--compact .tk-evd__title { font-size:var(--tk-fs-xl); }
  .tk-evd__rows { display:flex; flex-direction:column; }
  .tk-evd__row { display:flex; gap:14px; align-items:flex-start; padding:12px 0; border-top:1px solid var(--tk-c-border); min-width:0; }
  .tk-evd__row:first-child { border-top:0; }
  .tk-evd__ico { width:34px; height:34px; border-radius:10px; flex:none; display:grid; place-items:center; background:var(--tk-c-surface3); color:var(--tk-c-text-muted); }
  .tk-evd__k { font-size:var(--tk-fs-xs); font-weight:var(--tk-fw-semibold); letter-spacing:var(--tk-ls-wide); text-transform:uppercase; color:var(--tk-c-text-subtle); }
  .tk-evd__v { font-weight:var(--tk-fw-medium); overflow-wrap:anywhere; } .tk-evd__s { color:var(--tk-c-text-muted); font-size:var(--tk-fs-sm); margin-top:2px; }
  .tk-evd__map { position:relative; height:120px; border-radius:var(--tk-radius-md); border:1px solid var(--tk-c-border); overflow:hidden; background:
    repeating-linear-gradient(90deg, transparent 0 38px, color-mix(in srgb, var(--tk-c-border-strong) 60%, transparent) 38px 39px),
    repeating-linear-gradient(0deg, transparent 0 30px, color-mix(in srgb, var(--tk-c-border-strong) 60%, transparent) 30px 31px), var(--tk-c-surface2); }
  .tk-evd__map::before { content:''; position:absolute; left:-10%; right:-10%; top:58%; height:14px; background:color-mix(in srgb, var(--tk-c-info) 22%, transparent); transform:rotate(-8deg); }
  .tk-evd__pin { position:absolute; left:50%; top:46%; transform:translate(-50%,-100%); color:var(--tk-c-danger); filter:drop-shadow(0 2px 2px var(--tk-c-overlay)); }
  .tk-evd__actions { display:flex; gap:8px; flex-wrap:wrap; }
  .bp-mobile .tk-evd__actions .tk-btn { flex:1 1 auto; }`,
  example: { data: { events: [{ id: 'e3', title: 'Sprint-Planung', start: '2026-11-24T11:00:00', end: '2026-11-24T11:45:00', category: 'Arbeit', tone: 'accent', location: 'Konferenzraum 2', note: 'Backlog-Priorisierung für Sprint 12.', link: 'Teams-Besprechung', travel: 0 }] } },
  render: function EventDetail({ props, data, setData, ctx }) {
    const events = Array.isArray(data.events) ? data.events : [];
    const ev = pickEvent(ctx, events, props.fallbackNext, props.previewId);
    if (!ev) return html`<${Card}><${EmptyState} icon="calendar-search" title=${events.length ? 'Kein Termin gewählt' : 'Keine Termine'} text=${events.length ? 'Wähle einen Termin in der Liste oder im Kalender.' : 'Lege zuerst einen Termin an.'} /><//>`;
    const base = baseOf(events, ev), mins = Math.round((ev._e - ev._s) / 60000), until = Math.round((ev._s - ctx.today) / 60000);
    const state = ev.allDay ? null : until > 0 ? { tone: 'accent', text: inLabel(until) } : ev._e > ctx.today ? { tone: 'success', text: 'läuft jetzt' } : { tone: 'neutral', text: 'vorbei' };
    const leave = base.travel && !ev.allDay ? minutesOf(ev._s) - base.travel - 5 : null;
    const row = (icon, k, v, s, extra) => html`<div class="tk-evd__row"><span class="tk-evd__ico"><${Icon} name=${icon} size=${17} /></span><div class="tk-grow"><div class="tk-evd__k">${k}</div><div class="tk-evd__v">${v}</div>${s && html`<div class="tk-evd__s">${s}</div>`}${extra}</div></div>`;
    const dup = () => { const day = new Date(+dayStart(ev._s) + 864e5), s = new Date(+ev._s + 864e5), e = new Date(+ev._e + 864e5); const c = { ...base, id: `ev${Date.now().toString(36)}`, title: `${base.title} (Kopie)`, repeat: undefined, start: base.allDay ? dayKey(day) : `${dayKey(s)}T${timeStr(s)}:00`, end: base.allDay ? dayKey(day) : `${dayKey(e)}T${timeStr(e)}:00` }; setData('events', (a) => [c, ...a]); ctx.emit('event.duplicate', { id: c.id }); ctx.toast('Termin für morgen dupliziert'); };
    const del = () => { setData('events', (a) => a.filter((x) => x.id !== baseIdOf(ev))); ctx.setUi('selectedId', null); ctx.emit('event.delete', { id: baseIdOf(ev) }); ctx.toast(ev.seriesId ? 'Terminserie gelöscht' : 'Termin gelöscht'); };
    return html`<${Card} key=${ev.id}><div class=${`tk-evd ${props.compact ? 'tk-evd--compact' : ''}`} data-qa="event-detail" style=${`--ec:${catColor(ev)}`}>
      <div class="tk-evd__head"><span class="tk-evd__bar"></span><div class="tk-grow">
        <div class="tk-row" style="flex-wrap:wrap"><${Badge} tone=${catTone(ev)} dot>${ev.category || 'Termin'}<//>${ev.repeat && ev.repeat !== 'Keine' && html`<${Badge} icon="repeat">${ev.repeat}<//>`}${state && html`<${Badge} tone=${state.tone}>${state.text}<//>`}</div>
        <h2 class="tk-evd__title">${ev.title}</h2></div></div>
      <div class="tk-evd__rows">
        ${row('clock', 'Zeit', longDay(ev._s), ev.allDay ? 'Ganztägig' : `${timeStr(ev._s)} – ${timeStr(ev._e)} Uhr · ${durLabel(mins)}`)}
        ${ev.location && row('map-pin', 'Ort', ev.location, base.travel ? `ca. ${base.travel} Min. Weg${leave != null && dayKey(ev._s) === dayKey(ctx.today) ? ` · Losgehen ${hm(leave)} Uhr` : ''}` : null, props.showMap && html`<div class="tk-evd__map" data-clip-ok role="img" aria-label=${`Kartenvorschau: ${ev.location}`} style="margin-top:10px"><span class="tk-evd__pin"><${Icon} name="map-pin" size=${28} /></span></div>`)}
        ${base.link && row('monitor', 'Online', base.link, 'Link wird zum Beginn bereitgestellt', html`<div style="margin-top:8px"><${Button} size="sm" icon="arrow-right" onClick=${() => { ctx.emit('event.join', { id: ev.id }); ctx.toast(`${base.link} wird geöffnet`); }}>Beitreten<//></div>`)}
        ${base.note && row('file-text', 'Notiz', base.note)}
        ${row('layers', 'Kalender', SOURCE_NAMES[sourceOf(base)] || 'Persönlich', ev.seriesId ? 'Serientermin – Änderungen betreffen die ganze Serie' : null)}
      </div>
      ${props.showActions && html`<div class="tk-evd__actions"><${Button} variant="primary" icon="pencil" onClick=${() => openEditDialog(ctx, setData, ev, events)}>Bearbeiten<//><${Button} icon="copy" onClick=${dup}>Duplizieren<//><${Button} variant="danger" icon="trash-2" onClick=${del}>${ev.seriesId ? 'Serie löschen' : 'Löschen'}<//></div>`}
    </div><//>`;
  },
};
export default eventDetail;
