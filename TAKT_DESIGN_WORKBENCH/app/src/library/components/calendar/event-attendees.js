// Kalender: Teilnehmer des gewählten Termins mit Zusage-Status, Personen hinzufügen/entfernen.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Badge, Avatar, Input, Icon, EmptyState } from '../../ui.js';
import { pickEvent, patchEvent, baseOf, STATUS_TONE, PREVIEW_ID_PROP } from './_cal-info.js';

const CYCLE = ['Offen', 'Zugesagt', 'Vielleicht', 'Abgesagt'];

export const eventAttendees = {
  id: 'event-attendees',
  name: 'Teilnehmer',
  category: 'Kalender',
  description: 'Teilnehmerliste des gewählten Termins mit Avatar, Rolle und Zusage-Status (Zugesagt, Offen, Vielleicht, Abgesagt). Status antippen wechselt ihn, Personen lassen sich hinzufügen und entfernen.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Teilnehmer' },
    { name: 'editable', label: 'Bearbeitbar', type: 'boolean', default: true },
    { name: 'fallbackNext', label: 'Ohne Auswahl nächsten Termin zeigen', type: 'boolean', default: true },
    PREVIEW_ID_PROP,
  ],
  data: [{ slot: 'events', label: 'Termine', default: 'events', shape: '{id,attendees?:[{name,status,role?}]}[]', required: true }],
  events: ['attendee.add', 'attendee.remove', 'attendee.status'],
  states: ['empty'],
  css: `
  .tk-ev-people__row { display:flex; align-items:center; gap:12px; min-height:56px; padding:6px 0; border-bottom:1px solid var(--tk-c-border); min-width:0; }
  .tk-ev-people__row:last-of-type { border-bottom:0; }
  .tk-ev-people__row > .tk-btn { flex:none; min-width:36px; }
  .bp-mobile .tk-ev-people__row > .tk-btn { min-width:44px; }
  .tk-ev-people__sum { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:6px; }
  .tk-ev-people__status { border:0; background:transparent; padding:0; cursor:pointer; min-height:36px; display:inline-flex; align-items:center; }
  .tk-ev-people__add { display:flex; gap:8px; margin-top:10px; }
  .bp-mobile .tk-ev-people__status { min-height:44px; }`,
  example: { data: { events: [{ id: 'e3', title: 'Sprint-Planung', start: '2026-11-24T11:00:00', end: '2026-11-24T11:45:00', attendees: [{ name: 'Lea Hoffmann', status: 'Zugesagt', role: 'Organisatorin' }, { name: 'Ben Albrecht', status: 'Zugesagt' }, { name: 'Mara Sander', status: 'Offen' }] }] } },
  render: function EventAttendees({ props, data, setData, ctx }) {
    const [name, setName] = useState('');
    const events = Array.isArray(data.events) ? data.events : [];
    const ev = pickEvent(ctx, events, props.fallbackNext, props.previewId);
    if (!ev) return html`<${Card} title=${props.title} icon="users"><${EmptyState} icon="users" title="Kein Termin gewählt" text="Wähle einen Termin, um Teilnehmer zu sehen." /><//>`;
    const people = baseOf(events, ev).attendees || [];
    const set = (list) => patchEvent(setData, ev, { attendees: list });
    const count = (s) => people.filter((p) => p.status === s).length;
    const add = () => { const v = name.trim(); if (!v) return; set([...people, { name: v, status: 'Offen' }]); ctx.emit('attendee.add', { name: v }); ctx.toast(`${v} eingeladen`); setName(''); };
    const next = (p) => { const s = CYCLE[(CYCLE.indexOf(p.status) + 1) % CYCLE.length]; set(people.map((x) => (x === p ? { ...x, status: s } : x))); ctx.emit('attendee.status', { name: p.name, status: s }); };
    return html`<${Card} title=${props.title} icon="users" actions=${people.length > 0 && html`<${Badge}>${people.length}<//>`} key=${ev.id}><div data-qa="event-attendees">
      ${people.length > 0 && html`<div class="tk-ev-people__sum">${CYCLE.filter((s) => count(s)).map((s) => html`<${Badge} tone=${STATUS_TONE[s]}>${count(s)} ${s.toLowerCase()}<//>`)}</div>`}
      ${people.length === 0 && html`<${EmptyState} icon="user" title="Nur du" text="Dieser Termin hat keine Teilnehmer." />`}
      ${people.map((p) => html`<div class="tk-ev-people__row"><${Avatar} name=${p.name} /><div class="tk-grow"><div class="tk-truncate" style="font-weight:var(--tk-fw-medium)">${p.name}</div>${p.role && html`<div class="tk-subtle" style="font-size:var(--tk-fs-sm)">${p.role}</div>`}</div>
        ${props.editable ? html`<button type="button" class="tk-ev-people__status" onClick=${() => next(p)} aria-label=${`${p.name}: ${p.status} – Status ändern`}><${Badge} tone=${STATUS_TONE[p.status]}>${p.status}<//></button>` : html`<${Badge} tone=${STATUS_TONE[p.status]}>${p.status}<//>`}
        ${props.editable && html`<${Button} size="sm" variant="ghost" icon="x" aria-label=${`${p.name} entfernen`} onClick=${() => { set(people.filter((x) => x !== p)); ctx.emit('attendee.remove', { name: p.name }); }} />`}</div>`)}
      ${props.editable && html`<div class="tk-ev-people__add"><${Input} value=${name} onInput=${setName} placeholder="Person einladen …" aria-label="Person einladen" onKeyDown=${(e) => e.key === 'Enter' && add()} /><${Button} icon="plus" aria-label="Einladen" onClick=${add} /></div>`}
    </div><//>`;
  },
};
export default eventAttendees;
