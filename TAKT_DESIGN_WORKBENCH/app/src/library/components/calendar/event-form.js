// Kalender: Termin-Formular als Karte (Titel, Datum, Zeit, Kategorie, Wiederholung, Ort, Notiz).
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button } from '../../ui.js';
import { EventForm, formToEvent, openCreateDialog, dayKey, selDate, EVENT_CSS } from './_cal.js';

export const eventForm = {
  id: 'event-form',
  name: 'Termin-Formular',
  category: 'Kalender',
  description: 'Vollständiges Formular zum Anlegen eines Termins mit Kategorie-Chips, Dauer-Schnellwahl, Wiederholung und Validierung. Fügt den Termin in die Termin-Daten ein.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Neuer Termin' },
    { name: 'mode', label: 'Darstellung', type: 'select', options: ['card', 'dialog'], default: 'card' },
    { name: 'submitLabel', label: 'Button', type: 'text', default: 'Termin anlegen' },
  ],
  data: [{ slot: 'events', label: 'Termine', default: 'events', shape: 'Array von Terminen', required: false }],
  events: ['event.create', 'form.invalid', 'event.create.open'],
  states: ['empty', 'loading', 'error'],
  css: `${EVENT_CSS}
  .tk-eventform .tk-input, .tk-eventform .tk-select { height:auto; min-height:var(--tk-size-control); padding-block:6px; }`,
  example: { props: { title: 'Termin anlegen' }, data: { events: [] } },
  render: function EventFormBlock({ props, setData, ctx }) {
    const [n, setN] = useState(0);
    const date = dayKey(selDate(ctx));
    if (props.mode === 'dialog') return html`<${Button} variant="primary" icon="plus" onClick=${() => openCreateDialog(ctx, setData, { date })}>${props.title}<//>`;
    return html`<${Card} title=${props.title} icon="calendar-plus"><${EventForm} key=${n} initial=${{ date }} submitLabel=${props.submitLabel}
      onInvalid=${(er) => ctx.emit('form.invalid', er)}
      onSubmit=${(v) => { const ev = formToEvent(v, `ev${Date.now().toString(36)}`); setData('events', (all) => [ev, ...(Array.isArray(all) ? all : [])]); ctx.setUi('selectedDate', v.date); ctx.emit('event.create', { id: ev.id, title: ev.title }); ctx.toast(`„${ev.title}“ angelegt`); setN(n + 1); }} /><//>`;
  },
};
export default eventForm;
