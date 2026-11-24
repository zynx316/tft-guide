// Wiederholung festlegen (täglich bis jährlich, nach Erledigung) mit Klartext und den nächsten Terminen.
import { html } from '../../../lib/html.js';
import { Card, Button, Icon } from '../../ui.js';
import { nextOccurrences, describeRule } from '../../../core/recurrence.js';
import { fmtDate, fmtRelativeDay } from '../../../lib/format.js';
import { dayStart, toDate, dayDiff } from '../../../lib/date.js';
import { RuleEditor, ScopeChooser, RECUR_CSS } from './_recurrence-ui.js';

/** „heute“, „in 7 Tagen“, „in 5 Wochen“, „in 3 Monaten“ – für weiter entfernte Termine kein zweites Datum. */
const distance = (d, today) => {
  const n = dayDiff(today, d);
  if (n <= 13) return fmtRelativeDay(d, today);
  return n < 70 ? `in ${Math.round(n / 7)} Wochen` : n < 700 ? `in ${Math.round(n / 30.4)} Monaten` : `in ${Math.round(n / 365)} Jahren`;
};

const defaultRule = { freq: 'weekly', interval: 1, byWeekday: [2], start: '2026-11-24' };

export const recurrencePicker = {
  id: 'recurrence-picker',
  name: 'Wiederholungs-Auswahl',
  category: 'Querschnitt',
  description: 'Legt fest, wie sich ein Termin oder eine Aufgabe wiederholt: täglich, Wochentage, monatlich (Tag oder n-ter/letzter Wochentag), jährlich, nach Erledigung – mit Ende, Klartext und Vorschau der nächsten drei Termine. Modus „series-scope“: Serien-Dialog „nur dieser / dieser und folgende / alle“.',
  version: '1.0',
  props: [
    { name: 'mode', label: 'Modus', type: 'select', options: ['picker', 'series-scope'], default: 'picker' },
    { name: 'title', label: 'Titel', type: 'text', default: 'Wiederholung' },
    { name: 'startDate', label: 'Starttag (leer = heute)', type: 'text', default: '' },
    { name: 'isSeries', label: 'Serientermin (Übernehmen fragt nach Umfang)', type: 'boolean', default: false },
    { name: 'subject', label: 'Name des Termins (Serien-Dialog)', type: 'text', default: 'Wochenreview' },
    { name: 'submitLabel', label: 'Button (leer = ohne)', type: 'text', default: 'Übernehmen' },
  ],
  data: [{ slot: 'recurrenceRule', label: 'Wiederholungsregel', default: 'recurrenceRule', shape: '{freq,interval?,byWeekday?,byMonthDay?,bySetPos?,until?,count?,start?} | null', required: false }],
  events: ['recurrence.change', 'recurrence.save', 'recurrence.scope', 'recurrence.cancel'],
  states: ['empty'],
  flutter: {
    widget: 'TaktRecurrencePicker',
    propMap: { startDate: 'startDate', isSeries: 'isSeries', subject: 'subject', recurrenceRule: 'value' },
    events: { 'recurrence.change': 'onChanged', 'recurrence.save': 'onSaved', 'recurrence.scope': 'onScopeSelected', 'recurrence.cancel': 'onCancel' },
  },
  a11y: { role: 'group', nameFrom: 'Titel' },
  css: RECUR_CSS,
  example: { props: { isSeries: true }, data: { recurrenceRule: defaultRule } },
  render: function RecurrencePicker({ props, data, setData, ctx }) {
    const start = dayStart(props.startDate ? toDate(props.startDate) : ctx.today);
    const from = new Date(start.getFullYear(), start.getMonth(), start.getDate(), ctx.today.getHours(), ctx.today.getMinutes());
    const rule = data.recurrenceRule && data.recurrenceRule.freq ? data.recurrenceRule : null;
    const text = rule ? describeRule(rule) : 'keine Wiederholung';

    if (props.mode === 'series-scope') {
      return html`<${Card} title="Serientermin ändern" icon="repeat"><${ScopeChooser} subject=${props.subject} date=${from} rule=${rule ? text : ''} confirmLabel=${props.submitLabel || 'Übernehmen'}
        onConfirm=${(scope) => { ctx.emit('recurrence.scope', { scope }); ctx.toast(`Änderung gilt für: ${{ this: 'diesen Termin', following: 'diesen und folgende', all: 'alle Termine' }[scope]}`); }}
        onCancel=${() => ctx.emit('recurrence.cancel')} /><//>`;
    }

    const change = (r) => { setData('recurrenceRule', r); ctx.emit('recurrence.change', { rule: r, text: r ? describeRule(r) : 'keine Wiederholung' }); };
    const next = rule ? nextOccurrences(rule, from, rule.freq === 'afterDone' ? 1 : 3) : [];   // nach Erledigung: Folgetermine hängen vom Erledigen ab
    const save = () => {
      const done = (scope) => { ctx.emit('recurrence.save', { rule, scope: scope || null }); ctx.toast(`Wiederholung gespeichert: ${text}`); };
      if (!props.isSeries) return done();
      ctx.openDialog({ title: 'Serientermin ändern', body: (close) => html`<${ScopeChooser} subject=${props.subject} date=${from} rule=${text}
        onConfirm=${(scope) => { ctx.emit('recurrence.scope', { scope }); close(); done(scope); }} onCancel=${() => { ctx.emit('recurrence.cancel'); close(); }} />` });
    };
    return html`<${Card} title=${props.title} icon="repeat"><div class="tk-recur" data-qa="recurrence-picker">
      <${RuleEditor} rule=${rule} start=${start} onChange=${change} />
      <div class="tk-recur__preview" aria-live="polite">
        <span class="tk-recur__plain">${rule ? text.charAt(0).toUpperCase() + text.slice(1) : 'Keine Wiederholung'}</span>
        ${rule && rule.freq === 'afterDone' && html`<span class="tk-muted" style="font-size:var(--tk-fs-sm)">Der nächste Termin entsteht, sobald du den aktuellen erledigst.</span>`}
        ${next.length > 0 && html`<ul class="tk-recur__next" aria-label="Nächste Termine">${next.map((d, i) => html`<li key=${i}><b>${fmtDate(d, { style: 'weekday' })}${d.getFullYear() !== ctx.today.getFullYear() ? d.getFullYear() : ''}</b><span>${distance(d, ctx.today)}</span></li>`)}</ul>`}
        ${rule && !next.length && html`<span class="tk-muted" style="font-size:var(--tk-fs-sm)"><${Icon} name="info" size=${13} /> Keine weiteren Termine – das Ende liegt vor dem Start.</span>`}
      </div>
      ${props.submitLabel && html`<div class="tk-recur__foot"><${Button} variant="primary" icon="check" onClick=${save}>${props.submitLabel}<//></div>`}
    </div><//>`;
  },
};
export default recurrencePicker;
