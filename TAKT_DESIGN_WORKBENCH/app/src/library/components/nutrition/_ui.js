// Ernährung – gemeinsame UI-Bausteine (Ring, Zahlen-Stepper, Makro-Marker) und Basis-CSS.
import { html } from '../../../lib/html.js';
import { useState, useEffect } from 'preact/hooks';
import { Icon, toneColor } from '../../ui.js';
import { num, MACROS } from './_calc.js';

export const arr = (v) => (Array.isArray(v) ? v : []);
export const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});

/** Fortschrittsring. Über dem Ziel läuft eine zweite Runde in neutraler Akzentfarbe (nie Rot). */
export function Ring({ size = 160, stroke = 14, value = 0, max = 1, color = 'var(--tk-c-accent)', over = 'var(--tk-c-accent2)', label, children }) {
  const R = (size - stroke) / 2, C = 2 * Math.PI * R, c = size / 2;
  const p = max > 0 ? value / max : 0, first = Math.min(p, 1), second = Math.min(Math.max(p - 1, 0), 1);
  return html`<div class="tk-nu-ring" style=${`width:${size}px;height:${size}px`} role="img" aria-label=${label}>
    <svg width=${size} height=${size} viewBox=${`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx=${c} cy=${c} r=${R} fill="none" stroke="var(--tk-c-surface3)" stroke-width=${stroke} />
      ${first > 0 && html`<circle cx=${c} cy=${c} r=${R} fill="none" stroke=${color} stroke-width=${stroke} stroke-linecap="round" stroke-dasharray=${`${Math.max(first * C, 0.01)} ${C}`} transform=${`rotate(-90 ${c} ${c})`} />`}
      ${second > 0 && html`<circle cx=${c} cy=${c} r=${R} fill="none" stroke=${over} stroke-width=${stroke} stroke-linecap="round" stroke-dasharray=${`${Math.max(second * C, 0.01)} ${C}`} transform=${`rotate(-90 ${c} ${c})`} />`}
    </svg><div class="tk-nu-ring__in">${children}</div></div>`;
}

export const MacroMark = ({ id }) => { const m = MACROS.find((x) => x.id === id); return html`<span class="tk-nu-mm" title=${m.label}><i style=${`background:${m.color}`}></i>${m.short}</span>`; };

/** Zahlenfeld mit − / + (Dezimalkomma, min/max). */
export function Stepper({ value, onChange, step = 1, min = 0, max = 99999, unit = '', label = 'Menge', digits = 0, fast = 5 }) {
  const [txt, setTxt] = useState(num(value, digits));
  useEffect(() => { setTxt(num(value, digits)); }, [value]);
  const clamp = (n) => Math.min(max, Math.max(min, n));
  const commit = (raw) => { const n = parseFloat(String(raw).replace(/\./g, '').replace(',', '.')); if (Number.isFinite(n)) onChange(clamp(Math.round(n * 100) / 100)); else setTxt(num(value, digits)); };
  const bump = (dir, e) => onChange(clamp(Math.round((value + dir * step * (e && e.shiftKey ? fast : 1)) * 100) / 100));
  return html`<div class="tk-nu-step" role="group" aria-label=${label}>
    <button type="button" aria-label=${`${label} verringern`} onClick=${(e) => bump(-1, e)} disabled=${value <= min}><${Icon} name="minus" size=${18} /></button>
    <div class="tk-nu-step__field"><input inputmode="decimal" aria-label=${label} value=${txt} onInput=${(e) => setTxt(e.currentTarget.value)} onBlur=${(e) => commit(e.currentTarget.value)} onKeyDown=${(e) => { if (e.key === 'Enter') commit(e.currentTarget.value); }} />${unit && html`<span>${unit}</span>`}</div>
    <button type="button" aria-label=${`${label} erhöhen`} onClick=${(e) => bump(1, e)} disabled=${value >= max}><${Icon} name="plus" size=${18} /></button></div>`;
}

const FILL_IDS = ['calorie-budget', 'macro-summary', 'meal-timeline', 'water-tracker', 'next-meal-card', 'nutrition-hints', 'kcal-trend', 'food-search', 'scan-sim', 'quick-kcal', 'portion-picker', 'food-list', 'nutrition-table', 'food-form', 'recipe-list', 'recipe-detail', 'week-planner', 'shopping-list', 'goal-wizard', 'nutrition-stats', 'cook-mode'];
/** Karten im Dashboard-Raster füllen die Zeilenhöhe (gleich hohe Karten). */
const FILL = FILL_IDS.map((id) => `.tk-layout--grid .tk-block[data-component="${id}"] > .tk-card, .tk-layout--grid .tk-block[data-component="${id}"] > .tk-nm--hero`).join(',') + '{height:100%}';
export const NU_CSS = `${FILL}
  .tk-nu-ring { position:relative; flex:none; } .tk-nu-ring svg { display:block; }
  .tk-nu-ring__in { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:12%; }
  .tk-nu-mm { display:inline-flex; align-items:center; gap:4px; font-size:var(--tk-nfs-xs); font-weight:var(--tk-fw-semibold); color:var(--tk-c-text-muted); }
  .tk-nu-mm i { width:8px; height:8px; border-radius:3px; display:inline-block; flex:none; }
  .tk-nu-step { display:inline-flex; align-items:center; gap:6px; }
  .tk-nu-step > button { width:var(--tk-size-control); height:var(--tk-size-control); border-radius:var(--tk-radius-md); border:1px solid var(--tk-c-border-strong); background:var(--tk-c-surface2); color:var(--tk-c-text); display:grid; place-items:center; cursor:pointer; flex:none; }
  .tk-nu-step > button:hover:not(:disabled) { background:var(--tk-c-surface3); } .tk-nu-step > button:disabled { opacity:.4; cursor:default; }
  .tk-nu-step__field { display:flex; align-items:center; justify-content:center; gap:4px; min-width:84px; height:var(--tk-size-control); padding:0 10px; border:1px solid var(--tk-c-border); border-radius:var(--tk-radius-md); background:var(--tk-c-surface); }
  .tk-nu-step__field input { width:64px; border:0; background:transparent; color:var(--tk-c-text); font:inherit; font-weight:var(--tk-fw-semibold); font-size:var(--tk-nfs-lg); text-align:center; outline:none; align-self:stretch; height:100%; font-variant-numeric:tabular-nums; }
  .tk-nu-step__field:focus-within { border-color:var(--tk-c-accent); box-shadow:0 0 0 3px var(--tk-c-accent-soft); }
  .tk-nu-step__field span { color:var(--tk-c-text-subtle); font-size:var(--tk-nfs-sm); align-self:center; }
  .bp-mobile .tk-nu-step > button { width:var(--tk-size-touch); height:var(--tk-size-touch); } .bp-mobile .tk-nu-step__field { height:var(--tk-size-touch); } .bp-mobile .tk-nu-step__field input { font-size:16px; }
  .tk-mt .tk-btn--icon, .tk-nfs .tk-btn--icon, .tk-nwat .tk-btn--icon, .tk-rl .tk-btn--icon, .tk-nrec .tk-btn--icon, .tk-fl .tk-btn--icon, .tk-ds .tk-btn--icon, .tk-lb .tk-btn--icon, .tk-nscan .tk-btn--icon, .tk-wp .tk-btn--icon, .tk-sh .tk-btn--icon, .tk-gw .tk-btn--icon { flex:none; }
  .bp-mobile .tk-nu-sw .tk-switch { width:60px; height:36px; border-radius:18px; } .bp-mobile .tk-nu-sw .tk-switch::after { width:30px; height:30px; top:2px; left:2px; } .bp-mobile .tk-nu-sw .tk-switch[aria-checked="true"]::after { transform:translateX(24px); }
  .tk-nu-sw { display:inline-flex; align-items:center; }
  .tk-nu-big { font-size:var(--tk-nfs-3xl); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); line-height:1.05; font-variant-numeric:tabular-nums; }
  .tk-nu-cap { font-size:var(--tk-nfs-xs); color:var(--tk-c-text-subtle); letter-spacing:var(--tk-ls-wide); text-transform:uppercase; font-weight:var(--tk-fw-semibold); }
  .tk-nu-bar { height:8px; border-radius:4px; background:var(--tk-c-surface3); overflow:hidden; display:flex; }
  .tk-nu-bar > i { display:block; height:100%; }
  .tk-nu-chips { display:flex; gap:6px; flex-wrap:wrap; }
  .tk-nu-icon { width:36px; height:36px; border-radius:11px; display:grid; place-items:center; flex:none; }
  .tk-nu-row { display:flex; align-items:center; gap:12px; min-width:0; }
  .tk-nu-row > .tk-grow { min-width:0; }
  .tk-nu-meta { color:var(--tk-c-text-subtle); font-size:var(--tk-nfs-sm); }
  .tk-nu-btnrow { display:flex; gap:8px; flex-wrap:wrap; }
  .tk-nu-btnrow > .tk-btn, .tk-nrec__act > .tk-btn { white-space:normal; height:auto; min-height:var(--tk-size-control); padding-block:8px; text-align:left; max-width:100%; }
  .tk-nu-tap { width:100%; border:0; background:transparent; color:inherit; font:inherit; text-align:left; cursor:pointer; padding:0; display:flex; align-items:center; gap:12px; min-width:0; }
  .tk-nu-sticky { position:sticky; bottom:0; }
`;

/** Pflichttext für Lebensmittel-, Rezept- und Scan-Features (HEALTH_GUIDELINES 7, Punkt 4). */
export const LABEL_NOTE = 'Angaben ohne Gewähr. Prüfe das Etikett.';
export const labelNote = () => html`<p class="tk-nu-lbl" role="note"><${Icon} name="info" size=${13} /><span>${LABEL_NOTE}</span></p>`;
export const LBL_CSS = `.tk-nu-lbl { margin:0; display:flex; gap:6px; align-items:flex-start; font-size:var(--tk-nfs-xs); color:var(--tk-c-text-subtle); line-height:var(--tk-lh-snug); }
  .tk-nu-lbl svg { flex:none; margin-top:2px; }`;

export const tintBox = (tone, icon, size = 18) => html`<span class="tk-nu-icon" style=${`background:color-mix(in srgb, ${toneColor(tone)} 16%, transparent);color:${toneColor(tone)}`}><${Icon} name=${icon} size=${size} /></span>`;

const CAT = {
  'Milch & Eier': ['milk', 1], 'Fleisch & Fisch': ['drumstick', 2], 'Pflanzlich': ['leaf', 3], 'Hülsenfrüchte': ['soup', 4], 'Getreide & Brot': ['wheat', 5],
  'Obst & Gemüse': ['carrot', 3], 'Nüsse & Öle': ['cookie', 4], 'Süßes & Snacks': ['croissant', 6], 'Konserven': ['package', 2], 'Getränke': ['cup-soda', 5], 'Eiweiß & Supplements': ['dumbbell', 1],
};
export const catIcon = (c) => (CAT[c] || ['utensils', 1])[0];
export const catTone = (c) => (CAT[c] || ['utensils', 1])[1];
