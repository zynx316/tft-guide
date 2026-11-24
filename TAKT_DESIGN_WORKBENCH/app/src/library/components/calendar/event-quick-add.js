// Kalender: Termin in einem Satz erfassen („Zahnarzt morgen 14 Uhr 45 min“) mit Live-Erkennung und Überschneidungs-Hinweis.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Input, Badge, Icon } from '../../ui.js';
import { dayKey, dayStart, addDays, occurrences, hm, timeStr, CATEGORY_TONES, formToEvent } from './_cal.js';
import { parseWhen, overlapsWith } from './_cal-info.js';

const EXAMPLES = ['Zahnarzt morgen 14 Uhr', 'Call mit Lieferant Freitag 10:30 45 min', 'Wochenmarkt Samstag 10 Uhr 2 h'];

export const eventQuickAdd = {
  id: 'event-quick-add',
  name: 'Termin schnell erfassen',
  category: 'Kalender',
  description: 'Ein Eingabefeld statt Formular: Datum, Uhrzeit und Dauer werden aus dem Satz erkannt und live angezeigt. Warnt bei Überschneidung und legt den Termin mit Enter an.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Termin erfassen' },
    { name: 'placeholder', label: 'Platzhalter', type: 'text', default: 'z. B. Zahnarzt morgen 14 Uhr' },
    { name: 'showExamples', label: 'Beispiele', type: 'boolean', default: true },
    { name: 'defaultMinutes', label: 'Standarddauer (Min.)', type: 'number', default: 60 },
    { name: 'elevated', label: 'Hervorgehoben', type: 'boolean', default: false },
  ],
  data: [{ slot: 'events', label: 'Termine', default: 'events', shape: 'Array von Terminen', required: false }],
  events: ['event.create', 'form.invalid', 'event.create.open'],
  states: ['empty'],
  css: `
  .tk-cal-quick { display:flex; flex-direction:column; gap:var(--tk-space-3); }
  .tk-cal-quick__row { display:flex; gap:8px; } .tk-cal-quick__row .tk-input { flex:1; min-width:0; }
  .tk-cal-quick__parsed { display:flex; flex-wrap:wrap; gap:6px; align-items:center; min-height:28px; }
  .tk-cal-quick__ex { display:flex; flex-wrap:wrap; gap:6px; }
  .tk-cal-quick__ex button { min-height:36px; padding:0 12px; border-radius:var(--tk-radius-pill); border:1px dashed var(--tk-c-border-strong); background:transparent; color:var(--tk-c-text-muted); font:inherit; font-size:var(--tk-fs-sm); cursor:pointer; }
  .tk-cal-quick__ex button:hover { background:var(--tk-c-surface2); color:var(--tk-c-text); }
  .tk-cal-quick--elevated { box-shadow:var(--tk-shadow-md); }
  .bp-mobile .tk-cal-quick__ex button { min-height:40px; }`,
  example: { data: { events: [] } },
  render: function EventQuickAdd({ props, data, setData, ctx }) {
    const [text, setText] = useState('');
    const events = Array.isArray(data.events) ? data.events : [];
    const p = parseWhen(text, ctx.today);
    const today = dayStart(ctx.today), date = p.date || today;
    const nowMin = ctx.today.getHours() * 60 + ctx.today.getMinutes();
    const start = p.start || (dayKey(date) === dayKey(today) ? hm(Math.min(1380, Math.ceil((nowMin + 15) / 30) * 30)) : '09:00');
    const dur = p.mins || Number(props.defaultMinutes) || 60;
    const [sh, sm] = start.split(':').map(Number), endMin = Math.min(1439, sh * 60 + sm + dur), end = hm(endMin);
    const s = new Date(date); s.setHours(sh, sm, 0, 0);
    const clash = p.title ? overlapsWith({ id: '_new', _s: s, _e: new Date(+s + dur * 60000) }, occurrences(events, today, addDays(date, 1)).filter((o) => dayKey(o._s) === dayKey(date))) : [];
    const cat = p.category || 'Arbeit';
    const submit = () => {
      if (!p.title) { ctx.emit('form.invalid', { field: 'title' }); ctx.toast('Bitte einen Titel eingeben'); return; }
      const ev = formToEvent({ title: p.title, date: dayKey(date), start, end, category: cat, repeat: 'Keine', location: '', note: '' }, `ev${Date.now().toString(36)}`);
      setData('events', (all) => [ev, ...(Array.isArray(all) ? all : [])]); ctx.setUi('selectedDate', dayKey(date)); ctx.emit('event.create', { id: ev.id, title: ev.title }); ctx.toast(`„${ev.title}“ angelegt`); setText('');
    };
    return html`<${Card} title=${props.title} icon="calendar-plus" class=${props.elevated ? 'tk-cal-quick--elevated' : ''}><div class="tk-cal-quick" data-qa="event-quick-add">
      <div class="tk-cal-quick__row"><${Input} value=${text} onInput=${setText} placeholder=${props.placeholder} aria-label="Termin in einem Satz" onKeyDown=${(e) => e.key === 'Enter' && submit()} /><${Button} variant="primary" icon="plus" aria-label="Termin anlegen" onClick=${submit} /></div>
      <div class="tk-cal-quick__parsed" aria-live="polite">${p.title ? html`<${Badge} tone=${CATEGORY_TONES[cat]} dot>${cat}<//><${Badge} icon="calendar">${new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: 'numeric', month: 'short' }).format(date)}<//><${Badge} icon="clock">${start}–${end} Uhr<//>${!p.start && html`<span class="tk-subtle" style="font-size:var(--tk-fs-xs)">Uhrzeit vorgeschlagen</span>`}`
        : html`<span class="tk-subtle" style="font-size:var(--tk-fs-sm)">Datum, Uhrzeit und Dauer werden aus dem Satz erkannt.</span>`}</div>
      ${clash.length > 0 && html`<div class="tk-row" style="color:var(--tk-c-warning);font-size:var(--tk-fs-sm)" role="status"><${Icon} name="alert-triangle" size=${15} /><span>Überschneidet sich mit „${clash[0].title}“ (${timeStr(clash[0]._s)}–${timeStr(clash[0]._e)}).</span></div>`}
      ${props.showExamples && !text && html`<div class="tk-cal-quick__ex">${EXAMPLES.map((x) => html`<button type="button" onClick=${() => setText(x)}>${x}</button>`)}</div>`}
    </div><//>`;
  },
};
export default eventQuickAdd;
