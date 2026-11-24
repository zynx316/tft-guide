// Oberfläche des recurrence-picker: Regel-Editor, Zähler, Serien-Auswahl. Logik: _recurrence.js
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Button, Chip, Select, Segmented, Icon } from '../../ui.js';
import { WEEKDAYS_SHORT, WEEKDAYS_LONG, MONTHS_LONG, isoWeekday } from '../../../lib/date.js';
import { fmtDate } from '../../../lib/format.js';
import { FREQS, UNIT, SETPOS, freqOf, endMode, monthMode, ruleFor, withEnd, withMonthMode, toggleWeekday, SCOPES } from './_recurrence.js';

export const RECUR_CSS = `
  .tk-recur { display: flex; flex-direction: column; gap: var(--tk-space-4); min-width: 0; }
  .tk-recur__group { display: flex; flex-direction: column; gap: var(--tk-space-2); min-width: 0; }
  .tk-recur__chips { display: flex; flex-wrap: wrap; gap: var(--tk-space-2); }
  .tk-recur__line { display: flex; align-items: center; gap: var(--tk-space-2); flex-wrap: wrap; color: var(--tk-c-text-muted); font-size: var(--tk-fs-md); }
  .tk-recur__line .tk-select, .tk-recur__line .tk-input { width: auto; min-width: 0; flex: 1 1 120px; max-width: 220px; }
  .tk-recur__step { display: inline-flex; align-items: center; border: 1px solid var(--tk-c-border-strong); border-radius: var(--tk-radius-md); background: var(--tk-c-surface2); overflow: hidden; flex: none; }
  .tk-recur__step button { width: 36px; height: 36px; border: 0; background: none; color: var(--tk-c-text); cursor: pointer; display: grid; place-items: center; }
  .tk-recur__step button:disabled { opacity: .4; cursor: not-allowed; }
  .tk-recur__step output { min-width: 34px; text-align: center; font-weight: var(--tk-fw-semibold); color: var(--tk-c-text); font-variant-numeric: tabular-nums; }
  .bp-mobile .tk-recur__step button { width: var(--tk-size-touch); height: var(--tk-size-touch); }
  .tk-recur__days { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px; }
  .tk-recur__day { height: 40px; border-radius: var(--tk-radius-md); border: 1px solid var(--tk-c-border); background: var(--tk-c-surface); color: var(--tk-c-text-muted); font: inherit; font-size: var(--tk-fs-sm); font-weight: var(--tk-fw-medium); cursor: pointer; }
  .tk-recur__day[aria-pressed="true"] { background: var(--tk-c-accent); border-color: transparent; color: var(--tk-c-text-on-accent); }
  .bp-mobile .tk-recur__day { height: var(--tk-size-touch); }
  .bp-mobile .tk-recur .tk-chip { height: var(--tk-size-touch); padding: 0 16px; }
  .bp-mobile .tk-recur .tk-seg button { min-height: var(--tk-size-touch); }
  .bp-mobile .tk-recur__days { gap: 2px; }
  .tk-recur .tk-seg button[aria-selected="true"] { background: var(--tk-c-accent-soft); color: var(--tk-c-accent); box-shadow: inset 0 0 0 1px var(--tk-c-accent); }
  .tk-recur__preview { padding: var(--tk-space-3) var(--tk-space-4); border-radius: var(--tk-radius-md); background: var(--tk-c-accent-soft); display: flex; flex-direction: column; gap: 6px; }
  .tk-recur__plain { font-size: var(--tk-fs-lg); font-weight: var(--tk-fw-semibold); color: var(--tk-c-text); line-height: var(--tk-lh-snug); }
  .tk-recur__next { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 2px; font-size: var(--tk-fs-sm); color: var(--tk-c-text-muted); }
  .tk-recur__next li { display: flex; gap: var(--tk-space-2); }
  .tk-recur__next b { color: var(--tk-c-text); font-weight: var(--tk-fw-medium); min-width: 104px; font-variant-numeric: tabular-nums; }
  .tk-recur__scope { display: flex; flex-direction: column; gap: var(--tk-space-2); }
  .tk-recur__opt { display: flex; align-items: flex-start; gap: var(--tk-space-3); width: 100%; min-height: 56px; padding: var(--tk-space-3); text-align: left; font: inherit; color: var(--tk-c-text); border-radius: var(--tk-radius-md); border: 1px solid var(--tk-c-border-strong); background: var(--tk-c-surface); cursor: pointer; }
  .tk-recur__opt[aria-checked="true"] { border-color: var(--tk-c-accent); background: var(--tk-c-accent-soft); }
  .tk-recur__radio { width: 20px; height: 20px; border-radius: 50%; border: 2px solid var(--tk-c-border-strong); flex: none; margin-top: 2px; display: grid; place-items: center; }
  .tk-recur__opt[aria-checked="true"] .tk-recur__radio { border-color: var(--tk-c-accent); }
  .tk-recur__opt[aria-checked="true"] .tk-recur__radio::after { content: ""; width: 10px; height: 10px; border-radius: 50%; background: var(--tk-c-accent); }
  .tk-recur__opt strong { display: block; font-weight: var(--tk-fw-semibold); }
  .tk-recur__opt span span { display: block; color: var(--tk-c-text-muted); font-size: var(--tk-fs-sm); margin-top: 2px; }
  .tk-recur__foot { display: flex; justify-content: flex-end; gap: var(--tk-space-2); flex-wrap: wrap; }
  .bp-mobile .tk-recur__foot { flex-direction: column-reverse; }
  .bp-mobile .tk-recur__foot .tk-btn { flex: 1 1 auto; }`;

/** Zähler mit − / + (Dauerwert in der Mitte), min/max begrenzt. */
export const Stepper = ({ value, onChange, min = 1, max = 99, label }) => html`<span class="tk-recur__step" role="group" aria-label=${label}>
  <button type="button" aria-label=${`${label} verringern`} disabled=${value <= min} onClick=${() => onChange(Math.max(min, value - 1))}><${Icon} name="minus" size=${16} /></button>
  <output aria-live="polite">${value}</output>
  <button type="button" aria-label=${`${label} erhöhen`} disabled=${value >= max} onClick=${() => onChange(Math.min(max, value + 1))}><${Icon} name="plus" size=${16} /></button></span>`;

const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const unitText = (f, n) => (UNIT[f] || ['', ''])[n === 1 ? 0 : 1];
/** „Alle [n] Woche(n)“: Einzahl und Mehrzahl in einem Wort, weil der Zähler zwischen „Alle“ und Einheit steht. */
const UNIT_FLEX = { daily: 'Tag(e)', weekly: 'Woche(n)', monthly: 'Monat(e)', yearly: 'Jahr(e)' };

/** Alle Eingaben zur Regel. onChange erhält die neue Regel (oder null = keine Wiederholung). */
export function RuleEditor({ rule, onChange, start }) {
  const f = freqOf(rule), wds = rule?.byWeekday || [];
  const set = (patch) => onChange({ ...rule, ...patch });
  const iv = rule?.interval || 1;
  const days = ['', ...range(1, 31).map(String)];
  return html`<div class="tk-recur__group" style="gap:var(--tk-space-4)">
    <div class="tk-recur__group"><span class="tk-label">Häufigkeit</span>
      <div class="tk-recur__chips" role="group" aria-label="Häufigkeit">${FREQS.map((o) => html`<${Chip} key=${o.value} active=${f === o.value} onClick=${() => onChange(ruleFor(o.value, start, rule))}>${o.label}<//>`)}</div></div>
    ${f !== 'none' && f !== 'afterDone' && html`<div class="tk-recur__line"><span>Alle</span><${Stepper} label="Intervall" value=${iv} max=${f === 'daily' ? 365 : 60} onChange=${(v) => set({ interval: v })} /><span>${UNIT_FLEX[f]}</span></div>`}
    ${f === 'afterDone' && html`<div class="tk-recur__line"><span>Neuer Termin</span><${Stepper} label="Tage nach Erledigung" value=${rule.afterDoneDays || 7} max=${365} onChange=${(v) => set({ afterDoneDays: v })} /><span>${unitText('daily', rule.afterDoneDays || 7)} nach Erledigung</span></div>`}
    ${f === 'weekly' && html`<div class="tk-recur__days" role="group" aria-label="Wochentage">${WEEKDAYS_SHORT.map((d, i) => html`<button type="button" class="tk-recur__day" aria-pressed=${String(wds.includes(i + 1))} aria-label=${WEEKDAYS_LONG[i]} onClick=${() => onChange(toggleWeekday(rule, i + 1))}>${d}</button>`)}</div>`}
    ${f === 'monthly' && html`<div class="tk-recur__group"><${Segmented} label="Monatsart" value=${monthMode(rule)} onChange=${(m) => onChange(withMonthMode(rule, m, start))} options=${[{ value: 'day', label: 'Am Tag' }, { value: 'weekday', label: 'An Wochentag' }]} />
      ${monthMode(rule) === 'day' ? html`<div class="tk-recur__line"><span>am</span><${Select} aria-label="Tag im Monat" value=${String(rule.byMonthDay)} onChange=${(v) => set({ byMonthDay: Number(v) })} options=${[...days.slice(1).map((d) => ({ value: d, label: `${d}.` })), { value: '-1', label: 'letzten Tag' }]} /></div>`
        : html`<div class="tk-recur__line"><span>am</span><${Select} aria-label="Wievielter" value=${String(rule.bySetPos)} onChange=${(v) => set({ bySetPos: Number(v) })} options=${SETPOS} />
          <${Select} aria-label="Wochentag" value=${String((rule.byWeekday || [isoWeekday(start)])[0])} onChange=${(v) => set({ byWeekday: [Number(v)] })} options=${WEEKDAYS_LONG.map((d, i) => ({ value: String(i + 1), label: d }))} /></div>`}</div>`}
    ${f === 'yearly' && html`<div class="tk-recur__line"><span>am</span><${Select} aria-label="Tag" value=${String(rule.byMonthDay)} onChange=${(v) => set({ byMonthDay: Number(v) })} options=${range(1, 31).map((d) => ({ value: String(d), label: `${d}.` }))} />
      <${Select} aria-label="Monat" value=${String(rule.byMonth)} onChange=${(v) => set({ byMonth: Number(v) })} options=${MONTHS_LONG.map((m, i) => ({ value: String(i + 1), label: m }))} /></div>`}
    ${f !== 'none' && html`<div class="tk-recur__group"><span class="tk-label">Ende</span>
      <${Segmented} label="Ende" value=${endMode(rule)} onChange=${(m) => onChange(withEnd(rule, m, start))} options=${[{ value: 'never', label: 'Nie' }, { value: 'until', label: 'Am Datum' }, { value: 'count', label: 'Nach Anzahl' }]} />
      ${endMode(rule) === 'until' && html`<div class="tk-recur__line"><span>bis einschließlich</span><input class="tk-input" type="date" aria-label="Enddatum" value=${rule.until} min=${rule.start} onInput=${(e) => e.currentTarget.value && set({ until: e.currentTarget.value })} /></div>`}
      ${endMode(rule) === 'count' && html`<div class="tk-recur__line"><span>nach</span><${Stepper} label="Anzahl Termine" value=${rule.count} max=${999} onChange=${(v) => set({ count: v })} /><span>${rule.count === 1 ? 'Termin' : 'Terminen'}</span></div>`}</div>`}
  </div>`;
}

/** Serien-Auswahl: nur dieser / dieser und folgende / alle. */
export function ScopeChooser({ subject, date, rule, confirmLabel = 'Übernehmen', onConfirm, onCancel }) {
  const [scope, setScope] = useState('this');
  const d = fmtDate(date, { style: 'weekday' });
  return html`<div class="tk-recur__scope" data-qa="series-scope">
    <p class="tk-muted" style="margin:0;font-size:var(--tk-fs-sm)">${subject ? html`<strong style="color:var(--tk-c-text)">${subject}</strong> ist ein Serientermin` : 'Dieser Termin gehört zu einer Serie'}${rule ? ' (' : ''}${rule ? html`<span>${rule}</span>` : ''}${rule ? ')' : ''}. Was soll sich ändern?</p>
    <div role="radiogroup" aria-label="Umfang der Änderung" class="tk-recur__scope">${SCOPES.map((o) => html`<button type="button" role="radio" class="tk-recur__opt" key=${o.value} aria-checked=${String(scope === o.value)} onClick=${() => setScope(o.value)}>
      <span class="tk-recur__radio"></span><span><strong>${o.label}</strong><span>${o.hint(d)}</span></span></button>`)}</div>
    <div class="tk-recur__foot"><${Button} variant="ghost" onClick=${onCancel}>Abbrechen<//><${Button} variant="primary" onClick=${() => onConfirm(scope)}>${confirmLabel}<//></div></div>`;
}
