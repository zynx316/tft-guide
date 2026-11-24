// Kalender: Erinnerungen des gewählten Termins (relativ zum Beginn) mit absoluter Uhrzeit, hinzufügen/entfernen.
import { html } from '../../../lib/html.js';
import { Card, Button, Select, Icon, EmptyState } from '../../ui.js';
import { timeStr, shortDay } from './_cal.js';
import { pickEvent, patchEvent, baseOf, PREVIEW_ID_PROP } from './_cal-info.js';

export const REMINDER_OPTIONS = [['Zum Beginn', 0], ['5 Min. vorher', 5], ['10 Min. vorher', 10], ['15 Min. vorher', 15], ['30 Min. vorher', 30], ['1 Std. vorher', 60], ['1 Tag vorher', 1440]];
const minsOf = (label) => (REMINDER_OPTIONS.find(([l]) => l === label) || [0, 0])[1];

export const eventReminders = {
  id: 'event-reminders',
  name: 'Erinnerungen',
  category: 'Kalender',
  description: 'Mehrere Erinnerungen je Termin, relativ zum Beginn („15 Min. vorher“, „1 Tag vorher“) mit der ausgerechneten Uhrzeit. Hinzufügen per Auswahl, Entfernen per Tipp.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Erinnerungen' },
    { name: 'fallbackNext', label: 'Ohne Auswahl nächsten Termin zeigen', type: 'boolean', default: true },
    PREVIEW_ID_PROP,
  ],
  data: [{ slot: 'events', label: 'Termine', default: 'events', shape: '{id,reminders?:string[]}[]', required: true }],
  events: ['reminder.add', 'reminder.remove'],
  states: ['empty'],
  css: `
  .tk-ev-rem__row { display:flex; align-items:center; gap:12px; min-height:52px; border-bottom:1px solid var(--tk-c-border); }
  .tk-ev-rem__row:last-of-type { border-bottom:0; }
  .tk-ev-rem__ico { width:34px; height:34px; border-radius:10px; display:grid; place-items:center; background:var(--tk-c-warning-soft); color:var(--tk-c-warning); flex:none; }
  .tk-ev-rem__add { display:flex; gap:8px; margin-top:10px; } .tk-ev-rem__add .tk-select { flex:1; min-width:0; }`,
  example: { data: { events: [{ id: 'e3', title: 'Sprint-Planung', start: '2026-11-24T11:00:00', end: '2026-11-24T11:45:00', reminders: ['15 Min. vorher', '1 Tag vorher'] }] } },
  render: function EventReminders({ props, data, setData, ctx }) {
    const events = Array.isArray(data.events) ? data.events : [];
    const ev = pickEvent(ctx, events, props.fallbackNext, props.previewId);
    if (!ev) return html`<${Card} title=${props.title} icon="bell"><${EmptyState} icon="bell" title="Kein Termin gewählt" text="Wähle einen Termin, um Erinnerungen zu verwalten." /><//>`;
    const list = baseOf(events, ev).reminders || [];
    const free = REMINDER_OPTIONS.map(([l]) => l).filter((l) => !list.includes(l));
    const set = (r) => patchEvent(setData, ev, { reminders: r });
    const when = (label) => { const t = new Date(+ev._s - minsOf(label) * 60000); return minsOf(label) >= 1440 ? `${shortDay(t)}, ${timeStr(t)} Uhr` : `${timeStr(t)} Uhr`; };
    return html`<${Card} title=${props.title} icon="bell" key=${ev.id}><div data-qa="event-reminders">
      ${!list.length && html`<${EmptyState} icon="bell" title="Keine Erinnerung" text="Du wirst für diesen Termin nicht erinnert." />`}
      ${list.map((l) => html`<div class="tk-ev-rem__row"><span class="tk-ev-rem__ico"><${Icon} name="bell" size=${16} /></span><div class="tk-grow"><div style="font-weight:var(--tk-fw-medium)">${l}</div>${!ev.allDay && html`<div class="tk-subtle" style="font-size:var(--tk-fs-sm)">${when(l)}</div>`}</div>
        <${Button} size="sm" variant="ghost" icon="x" aria-label=${`Erinnerung „${l}“ entfernen`} onClick=${() => { set(list.filter((x) => x !== l)); ctx.emit('reminder.remove', { label: l }); }} /></div>`)}
      ${free.length > 0 && html`<div class="tk-ev-rem__add"><${Select} value="" aria-label="Erinnerung hinzufügen" onChange=${(v) => { if (!v) return; set([...list, v]); ctx.emit('reminder.add', { label: v }); ctx.toast(`Erinnerung „${v}“ hinzugefügt`); }} options=${[{ value: '', label: 'Erinnerung hinzufügen …' }, ...free.map((l) => ({ value: l, label: l }))]} /></div>`}
    </div><//>`;
  },
};
export default eventReminders;
