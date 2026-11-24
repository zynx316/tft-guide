// Sparpläne – gemeinsame Bausteine: Formate, kleine UI-Atome (Ring, Kachel, Hinweis) und Basis-CSS.
// Alle Beträge laufen über money(ctx, …) (Privatsphäre-Modus). Rechnen: nur über core/finmath.js (siehe _plans.js, _calc.js).
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Icon, toneColor } from '../../ui.js';
import { money } from '../../helpers.js';
import { fmtPercent, fmtNumber, fmtDate, fmtRelativeDay } from '../../../lib/format.js';
import { dayStart, dayDiff } from '../../../lib/date.js';

export const arr = (v) => (Array.isArray(v) ? v : []);
export const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
export const r2 = (x) => Math.round(x * 100) / 100;
export const sum = (list, f) => list.reduce((s, x) => s + (f(x) || 0), 0);
let seq = 0;
/** Deterministische ID: ctx.newId (Zähler der Vorschau-Sitzung), ohne Kontext ein Modulzähler. Kein Zufall. */
export const sid = (p, ctx) => (ctx && ctx.newId ? ctx.newId(p.replace(/-$/, '')) : `${p}x${++seq}`);

/** Heute (Tagesbeginn) aus dem Kontext (ctx.today). */
export const todayOf = (ctx) => dayStart(ctx.today);

/** Termin lesbar: „heute · Di, 24.11.“, „in 7 Tagen · Di, 01.12.“, später „Mo, 04.01.2027“ (Jahr nur bei anderem Jahr). */
export const whenLabel = (d, today, { short = false } = {}) => {
  const n = dayDiff(today, d), base = fmtDate(d, { style: 'weekday' }), yr = d.getFullYear() !== today.getFullYear() ? d.getFullYear() : '';
  const day = yr ? `${base.slice(0, -1)}.${yr}` : base;
  if (n >= -1 && n <= 13) return short ? fmtRelativeDay(d, today) : `${fmtRelativeDay(d, today)} · ${day}`;
  return day;
};
/** Ganze Euro (Standard für Vermögen und Raten) bzw. mit Cent. */
export const eur = (ctx, v, o = {}) => money(ctx, v, { digits: 0, ...o });
export const eur2 = (ctx, v, o = {}) => money(ctx, v, { digits: 2, ...o });
/** Prozent ohne Maskierung (Fortschritt, Annahmen – keine Beträge). */
export const pct = (v, o = {}) => fmtPercent(v, { digits: 0, ...o });
/** Zahl mit Komma für Eingabefelder („7,5“). */
export const numDe = (v, digits = 1) => fmtNumber(v, { digits: Number.isInteger(v) ? 0 : digits });
export const parseDe = (s) => { const n = parseFloat(String(s).replace(/\./g, '').replace(',', '.')); return Number.isFinite(n) ? n : null; };
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
/** Deutscher Plural: 1 Jahr, 2 Jahre. */
export const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
/** Monate → „4 Jahre 3 Monate“. */
export const spanLabel = (months) => {
  if (!Number.isFinite(months)) return 'nicht erreichbar';
  const y = Math.floor(months / 12), m = Math.round(months % 12);
  if (!y) return plural(m, 'Monat', 'Monate');
  return m ? `${plural(y, 'Jahr', 'Jahre')} ${plural(m, 'Monat', 'Monate')}` : plural(y, 'Jahr', 'Jahre');
};

/** Ruhiger Einzeiler statt voller Leer-Karte (Erststart: nur ein Block führt zur ersten Aktion, die übrigen schweigen). */
export const QuietNote = ({ icon = 'info', text }) => html`<p class="tk-sv-quiet" role="note"><${Icon} name=${icon} size=${14} /><span>${text}</span></p>`;
export const QUIET_PROP = { name: 'quietEmpty', label: 'Leerzustand als Einzeiler', type: 'boolean', default: false };

/** Fortschrittsring (SVG), Inhalt zentriert. Farbe nie allein: Text steht im Inhalt. */
export function Ring({ size = 96, stroke = 10, value = 0, tone = 'accent', label, children }) {
  const R = (size - stroke) / 2, C = 2 * Math.PI * R, c = size / 2, p = clamp(value, 0, 1);
  return html`<div class="tk-sv-ring" style=${`width:${size}px;height:${size}px`} role="img" aria-label=${label}>
    <svg width=${size} height=${size} viewBox=${`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx=${c} cy=${c} r=${R} fill="none" stroke="var(--tk-c-surface3)" stroke-width=${stroke} />
      ${p > 0 && html`<circle cx=${c} cy=${c} r=${R} fill="none" stroke=${toneColor(tone)} stroke-width=${stroke} stroke-linecap="round" stroke-dasharray=${`${Math.max(p * C, 0.01)} ${C}`} transform=${`rotate(-90 ${c} ${c})`} />`}
    </svg><div class="tk-sv-ring__in">${children}</div></div>`;
}

/** Farbige Icon-Kachel. */
export const Tile = ({ tone = 'accent', icon = 'piggy-bank', size = 18 }) =>
  html`<span class="tk-sv-tile" style=${`background:color-mix(in srgb, ${toneColor(tone)} 16%, transparent);color:${toneColor(tone)}`}><${Icon} name=${icon} size=${size} /></span>`;


/** Zahlenfeld mit − / + und Direkteingabe (Dezimalkomma). */
export function Stepper({ value, onChange, step = 1, min = 0, max = 1e9, unit = '', label = 'Wert', digits = 0 }) {
  const [txt, setTxt] = useState(null);
  const commit = () => { if (txt == null) return; const n = parseDe(txt); if (n != null) onChange(clamp(Math.round(n / step) * step, min, max)); setTxt(null); };
  const bump = (d) => onChange(clamp(r2(value + d * step), min, max));
  return html`<div class="tk-sv-step" role="group" aria-label=${label}>
    <button type="button" aria-label=${`${label} verringern`} onClick=${() => bump(-1)} disabled=${value <= min}><${Icon} name="minus" size=${18} /></button>
    <div class="tk-sv-step__f"><input inputmode="decimal" aria-label=${label} value=${txt ?? fmtNumber(value, { digits })} onInput=${(e) => setTxt(e.currentTarget.value)} onBlur=${commit} onKeyDown=${(e) => e.key === 'Enter' && commit()} />${unit && html`<span>${unit}</span>`}</div>
    <button type="button" aria-label=${`${label} erhöhen`} onClick=${() => bump(1)} disabled=${value >= max}><${Icon} name="plus" size=${18} /></button></div>`;
}

/** Pflichtsatz „Plan-Tracker“ (docs/FINANCE_GUIDELINES.md, Abschnitt 8) – nicht umformulieren. */
export const TRACKER_TEXT = 'Dieser Sparplan wird nicht von TAKT ausgeführt. Du trägst ihn bei deinem Broker ein, TAKT erinnert dich und gleicht ab.';
export const TrackerNote = ({ plural: pl }) => html`<p class="tk-sv-note" role="note"><${Icon} name="info" size=${14} /><span>${pl ? TRACKER_TEXT.replace('Dieser Sparplan wird', 'Diese Sparpläne werden').replace('Du trägst ihn bei deinem Broker ein', 'Du trägst sie bei deinem Broker ein') : TRACKER_TEXT}</span></p>`;

/** Kleine Kennzahl (Beschriftung oben, Wert unten). */
export const Stat = ({ label, value, sub, tone, big }) => html`<div class=${`tk-sv-stat${big ? ' tk-sv-stat--big' : ''}`}>
  <span class="tk-sv-stat__l">${label}</span><strong class="tk-num" style=${tone ? `color:var(--tk-c-${tone})` : ''}>${value}</strong>${sub && html`<span class="tk-sv-stat__s">${sub}</span>`}</div>`;

/** Gewinn/Verlust: Vorzeichen + Pfeil zusätzlich zur Farbe (docs/FINANCE_GUIDELINES.md 7.3). */
export function Gain({ ctx, value, ratio, digits = 0, showAmount = true }) {
  const up = value >= 0;
  return html`<span class="tk-sv-gain tk-num" style=${`color:var(--tk-c-${value === 0 ? 'text-muted' : up ? 'success' : 'danger'})`}>
    <${Icon} name=${up ? 'arrow-up-right' : 'arrow-down-right'} size=${13} />${showAmount && eur(ctx, value, { sign: true, digits })}${ratio != null && html`<span class="tk-sv-gain__p">${ctx.privacy ? '•• %' : fmtPercent(ratio, { digits: 1, sign: true })}</span>`}</span>`;
}

export const SV_CSS = `
  .tk-sv-quiet { display:flex; align-items:flex-start; gap:8px; margin:0; padding:var(--tk-space-2) var(--tk-space-1); color:var(--tk-c-text-muted); font-size:var(--tk-fs-sm); line-height:var(--tk-lh-snug); } .tk-sv-quiet svg { flex:none; margin-top:2px; }
  .tk-sv-step { display:inline-flex; align-items:center; gap:6px; max-width:100%; }
  .tk-sv-step > button { width:var(--tk-size-control); height:var(--tk-size-control); border-radius:var(--tk-radius-md); border:1px solid var(--tk-c-border-strong); background:var(--tk-c-surface2); color:var(--tk-c-text); display:grid; place-items:center; cursor:pointer; flex:none; padding:0; }
  .tk-sv-step > button:hover:not(:disabled) { background:var(--tk-c-surface3); } .tk-sv-step > button:disabled { opacity:.4; cursor:default; }
  .tk-sv-step__f { display:flex; align-items:center; gap:4px; min-width:0; flex:1 1 auto; height:var(--tk-size-control); padding:0 10px; border:1px solid var(--tk-c-border-strong); border-radius:var(--tk-radius-md); background:var(--tk-c-surface2); }
  .tk-sv-step__f:focus-within { border-color:var(--tk-c-accent); box-shadow:0 0 0 3px var(--tk-c-accent-soft); }
  .tk-sv-step__f input { width:100%; min-width:48px; border:0; background:transparent; color:var(--tk-c-text); font:inherit; font-weight:var(--tk-fw-semibold); font-size:var(--tk-fs-lg); text-align:center; outline:none; height:100%; font-variant-numeric:tabular-nums; }
  .tk-sv-step__f span { color:var(--tk-c-text-subtle); font-size:var(--tk-fs-sm); flex:none; }
  .bp-mobile .tk-sv-step > button, .bp-mobile .tk-sv-step__f { width:var(--tk-size-touch); height:var(--tk-size-touch); } .bp-mobile .tk-sv-step__f { width:auto; } .bp-mobile .tk-sv-step__f input { font-size:16px; }
  .tk-sv-tile { width:38px; height:38px; border-radius:12px; display:grid; place-items:center; flex:none; }
  .tk-sv-ring { position:relative; flex:none; } .tk-sv-ring svg { display:block; }
  .tk-sv-ring__in { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:14%; line-height:1.15; }
  .tk-sv-note { display:flex; gap:8px; align-items:flex-start; margin:0; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); line-height:var(--tk-lh-snug); }
  .tk-sv-note .icon { margin-top:2px; color:var(--tk-c-text-subtle); }
  .tk-sv-stat { display:flex; flex-direction:column; gap:2px; min-width:0; }
  .tk-sv-stat__l { overflow-wrap:anywhere; font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); letter-spacing:var(--tk-ls-wide); text-transform:uppercase; font-weight:var(--tk-fw-semibold); }
  .tk-sv-stat strong { font-size:var(--tk-fs-xl); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); line-height:1.15; overflow-wrap:anywhere; }
  .tk-sv-stat--big strong { font-size:var(--tk-fs-3xl); }
  .tk-sv-stat__s { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); }
  .tk-sv-gain { display:inline-flex; align-items:center; gap:3px; font-weight:var(--tk-fw-semibold); font-size:var(--tk-fs-sm); white-space:nowrap; }
  .tk-sv-gain__p { opacity:.9; margin-left:2px; }
  .tk-sv-row { display:flex; align-items:center; gap:var(--tk-space-3); min-width:0; }
  .tk-sv-row > .tk-grow { min-width:0; }
  .tk-sv-meta { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); }
  .tk-sv-bar { height:8px; border-radius:4px; background:var(--tk-c-surface3); overflow:hidden; display:flex; gap:2px; }
  .tk-sv-bar > i { display:block; height:100%; min-width:3px; }
  .tk-sv-btnrow { display:flex; gap:var(--tk-space-2); flex-wrap:wrap; align-items:center; }
  .tk-sv-btnrow .tk-btn { white-space:normal; height:auto; min-height:var(--tk-size-control); padding-top:6px; padding-bottom:6px; text-align:center; }
  .bp-mobile .tk-sv-btnrow .tk-btn { min-height:var(--tk-size-touch); }
  .tk-sv-undo { display:flex; align-items:center; gap:8px; padding:6px 6px 6px 12px; border-radius:var(--tk-radius-md); background:var(--tk-c-surface2); border:1px solid var(--tk-c-border); font-size:var(--tk-fs-sm); }
  .tk-sv-undo > span { flex:1; min-width:0; }
  .tk-sv-sr { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; }
  .tk-sv-foot { display:flex; flex-direction:column; gap:var(--tk-space-2); }
  .tk-sv-lead { font-size:var(--tk-fs-lg); font-weight:var(--tk-fw-semibold); line-height:var(--tk-lh-snug); }
  .tk-layout--grid .tk-block[data-component^="savings-"] > .tk-card, .tk-layout--grid .tk-block[data-component="growth-chart"] > .tk-card, .tk-layout--grid .tk-block[data-component="coverage-check"] > .tk-card, .tk-layout--grid .tk-block[data-component="execution-calendar"] > .tk-card, .tk-layout--grid .tk-block[data-component="goal-calculator"] > .tk-card { height:100%; }
`;
