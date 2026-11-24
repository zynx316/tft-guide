// Kalender: Konfliktwarnung zum gewählten Termin – Überschneidungen am selben Tag und freie Zeitfenster zum Verschieben.
import { html } from '../../../lib/html.js';
import { Card, Button, Badge, Icon, EmptyState } from '../../ui.js';
import { dayStart, addDays, dayKey, occurrences, onDay, minutesOf, timeStr, hm, durLabel, freeSlots, toIso, catColor } from './_cal.js';
import { pickEvent, overlapsWith, patchEvent, baseOf, PREVIEW_ID_PROP } from './_cal-info.js';

export const eventConflicts = {
  id: 'event-conflicts',
  name: 'Konfliktwarnung',
  category: 'Kalender',
  description: 'Prüft den gewählten Termin auf Überschneidungen am selben Tag, nennt die kollidierenden Termine und schlägt freie Zeitfenster gleicher Länge vor. „Verschieben“ setzt den Termin direkt um.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Konflikte' },
    { name: 'workFrom', label: 'Arbeitstag ab (Std.)', type: 'number', default: 8 },
    { name: 'workTo', label: 'Arbeitstag bis (Std.)', type: 'number', default: 18 },
    { name: 'hideWhenClear', label: 'Ausblenden, wenn kein Konflikt', type: 'boolean', default: false },
    { name: 'fallbackNext', label: 'Ohne Auswahl nächsten Termin zeigen', type: 'boolean', default: true },
    PREVIEW_ID_PROP,
  ],
  data: [{ slot: 'events', label: 'Termine', default: 'events', shape: '{id,title,start,end,repeat?}[]', required: true }],
  events: ['event.open', 'event.update', 'conflict.move'],
  states: ['empty'],
  css: `
  .tk-ev-conf__warn { display:flex; gap:12px; padding:var(--tk-space-3) var(--tk-space-4); border-radius:var(--tk-radius-md); background:var(--tk-c-warning-soft); border:1px solid color-mix(in srgb, var(--tk-c-warning) 45%, var(--tk-c-border)); }
  .tk-ev-conf__ok { display:flex; gap:12px; align-items:center; padding:var(--tk-space-3) var(--tk-space-4); border-radius:var(--tk-radius-md); background:var(--tk-c-success-soft); color:var(--tk-c-text); }
  .tk-ev-conf__row { display:flex; align-items:center; gap:10px; width:100%; min-height:48px; border:0; border-bottom:1px solid var(--tk-c-border); background:transparent; color:var(--tk-c-text); font:inherit; text-align:left; cursor:pointer; padding:4px 0; }
  .tk-ev-conf__row i { width:4px; align-self:stretch; border-radius:2px; background:var(--ec); }
  .tk-ev-conf__sug { display:flex; flex-wrap:wrap; gap:8px; margin-top:8px; }`,
  example: { data: { events: [
    { id: 'e3', title: 'Sprint-Planung', start: '2026-11-24T11:00:00', end: '2026-11-24T11:45:00', category: 'Arbeit' },
    { id: 'e4', title: 'Fokus: Workbench-Review', start: '2026-11-24T10:30:00', end: '2026-11-24T12:00:00', category: 'Fokus' },
  ] } },
  render: function EventConflicts({ props, data, setData, ctx }) {
    const events = Array.isArray(data.events) ? data.events : [];
    const ev = pickEvent(ctx, events, props.fallbackNext, props.previewId);
    if (!ev) return html`<${Card} title=${props.title} icon="shield-check"><${EmptyState} icon="shield-check" title="Kein Termin gewählt" text="Wähle einen Termin, um ihn auf Konflikte zu prüfen." /><//>`;
    const day = dayStart(ev._s), same = onDay(occurrences(events, day, addDays(day, 1)), day), clash = overlapsWith(ev, same);
    if (!clash.length && props.hideWhenClear) return null;
    const dur = Math.max(15, Math.round((ev._e - ev._s) / 60000));
    const slots = freeSlots(same.filter((o) => o.id !== ev.id), Number(props.workFrom) * 60, Number(props.workTo) * 60, dur).filter(([a]) => a !== minutesOf(ev._s)).sort((x, y) => Math.abs(x[0] - minutesOf(ev._s)) - Math.abs(y[0] - minutesOf(ev._s))).slice(0, 3);
    const move = (a) => { const s = new Date(day); s.setHours(0, a, 0, 0); const base = baseOf(events, ev); patchEvent(setData, ev, { start: toIso(ev.seriesId ? new Date(`${String(base.start).slice(0, 10)}T${hm(a)}:00`) : s), end: toIso(ev.seriesId ? new Date(`${String(base.end).slice(0, 10)}T${hm(a + dur)}:00`) : new Date(+s + dur * 60000)) }); ctx.emit('conflict.move', { id: ev.id, to: hm(a) }); ctx.emit('event.update', { id: ev.id }); ctx.toast(`„${ev.title}“ auf ${hm(a)} Uhr verschoben`); };
    return html`<${Card} title=${props.title} icon="shield-check" key=${ev.id}><div class="tk-col" style="gap:var(--tk-space-3)" data-qa="event-conflicts">
      ${clash.length ? html`<div class="tk-ev-conf__warn" role="alert"><${Icon} name="alert-triangle" size=${20} /><div><b>Überschneidung mit ${clash.length === 1 ? 'einem Termin' : `${clash.length} Terminen`}</b><div class="tk-muted" style="font-size:var(--tk-fs-sm);margin-top:2px">Zwei Dinge gleichzeitig – einer der Termine sollte weichen.</div></div></div>
        <div>${clash.map((o) => html`<button type="button" class="tk-ev-conf__row" style=${`--ec:${catColor(o)}`} onClick=${() => { ctx.setUi('selectedId', o.id); ctx.emit('event.open', { id: o.id }); }}><i></i><span class="tk-grow"><div class="tk-truncate" style="font-weight:var(--tk-fw-medium)">${o.title}</div><div class="tk-subtle" style="font-size:var(--tk-fs-sm)">${timeStr(o._s)}–${timeStr(o._e)} Uhr</div></span><${Icon} name="chevron-right" size=${16} /></button>`)}</div>`
        : html`<div class="tk-ev-conf__ok"><${Icon} name="check-circle-2" size=${20} /><span><b>Keine Überschneidung</b> – dieser Termin kollidiert mit nichts.</span></div>`}
      ${clash.length > 0 && html`<div><span class="tk-label">${slots.length ? `Freie Fenster für ${durLabel(dur)}` : 'Kein freies Fenster an diesem Tag'}</span>
        <div class="tk-ev-conf__sug">${slots.map(([a, b]) => html`<${Button} size="sm" icon="arrow-right" onClick=${() => move(a)}>${hm(a)}–${hm(a + dur)} verschieben<//>`)}</div>${ev.seriesId && slots.length > 0 && html`<p class="tk-subtle" style="font-size:var(--tk-fs-xs);margin-top:6px">Serientermin: das Verschieben gilt für die ganze Serie.</p>`}</div>`}
    </div><//>`;
  },
};
export default eventConflicts;
