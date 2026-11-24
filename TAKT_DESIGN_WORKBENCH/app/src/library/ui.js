// ============================================================================
// TAKT UI-PRIMITIVE – gemeinsame Bausteine ALLER Bibliothekskomponenten.
// Regel: Komponenten bauen aus diesen Primitiven, statt Buttons/Badges/
// Eingabefelder selbst zu implementieren. Styles: design-system/takt-base.css
// ============================================================================
import { html } from '../lib/html.js';
import { Icon } from '../lib/icons.js';
import { cx } from '../lib/util.js';
import { useState, useRef, useEffect } from 'preact/hooks';

export { Icon };

export function Button({ variant = 'default', size, icon, iconRight, children, class: c, wrap, ...rest }) {
  const iconOnly = icon && !children;
  return html`<button type="button" class=${cx('tk-btn', variant !== 'default' && `tk-btn--${variant}`, size === 'sm' && 'tk-btn--sm', iconOnly && 'tk-btn--icon', wrap && 'tk-btn--wrap', c)} ...${rest}>
    ${icon && html`<${Icon} name=${icon} size=${size === 'sm' ? 15 : 17} />`}${children}${iconRight && html`<${Icon} name=${iconRight} size=${15} />`}
  </button>`;
}

export const IconButton = ({ icon, label, ...rest }) => html`<${Button} variant="ghost" icon=${icon} aria-label=${label} title=${label} ...${rest} />`;

/** tone: neutral | accent | success | warning | danger | info */
export const Badge = ({ tone = 'neutral', dot, icon, children, class: c }) =>
  html`<span class=${cx('tk-badge', tone !== 'neutral' && `tk-badge--${tone}`, c)}>${dot && html`<span class="tk-dot"></span>`}${icon && html`<${Icon} name=${icon} size=${12} />`}${children}</span>`;

export const Chip = ({ active, icon, children, onClick, count }) =>
  html`<button type="button" class="tk-chip" aria-pressed=${active ? 'true' : 'false'} onClick=${onClick}>
    ${icon && html`<${Icon} name=${icon} size=${14} />`}${children}${count != null && html`<span class="tk-subtle tk-num">${count}</span>`}
  </button>`;

export function Card({ title, icon, actions, children, flush, interactive, onClick, class: c, style }) {
  return html`<section class=${cx('tk-card', flush && 'tk-card--flush', interactive && 'tk-card--interactive', c)} onClick=${onClick} style=${style}>
    ${(title || actions) && html`<div class="tk-card__head" style=${flush ? 'padding:14px 16px 0;margin-bottom:10px' : ''}>
      ${icon && html`<span class="tk-subtle"><${Icon} name=${icon} size=${16} /></span>`}
      <h3 class="tk-card__title">${title}</h3>${actions}
    </div>`}
    ${children}
  </section>`;
}

export const SectionHeader = ({ title, subtitle, actions }) => html`<div class="tk-row" style="align-items:flex-end;gap:12px;flex-wrap:wrap">
  <div class="tk-grow"><h2 class="tk-h2">${title}</h2>${subtitle && html`<p class="tk-muted" style="margin-top:4px;font-size:var(--tk-fs-sm)">${subtitle}</p>`}</div>${actions}
</div>`;

export const Field = ({ label, error, children, hint }) => html`<label class="tk-field">
  ${label && html`<span class="tk-field__label">${label}</span>`}${children}
  ${error ? html`<span class="tk-field__error">${error}</span>` : hint && html`<span class="tk-subtle" style="font-size:var(--tk-fs-sm)">${hint}</span>`}
</label>`;

export const Input = ({ value, onInput, invalid, ...rest }) =>
  html`<input class="tk-input" value=${value ?? ''} onInput=${(e) => onInput && onInput(e.currentTarget.value)} aria-invalid=${invalid ? 'true' : undefined} ...${rest} />`;

export const Textarea = ({ value, onInput, ...rest }) =>
  html`<textarea class="tk-textarea" value=${value ?? ''} onInput=${(e) => onInput && onInput(e.currentTarget.value)} ...${rest}></textarea>`;

export const Select = ({ value, onChange, options = [], ...rest }) =>
  html`<select class="tk-select" value=${value} onChange=${(e) => onChange && onChange(e.currentTarget.value)} ...${rest}>
    ${options.map((o) => (typeof o === 'string' ? html`<option value=${o}>${o}</option>` : html`<option value=${o.value}>${o.label}</option>`))}
  </select>`;

export const Search = ({ value, onInput, placeholder = 'Suchen …' }) =>
  html`<div class="tk-search"><${Icon} name="search" size=${16} /><${Input} type="search" value=${value} onInput=${onInput} placeholder=${placeholder} aria-label=${placeholder} /></div>`;

export const Check = ({ checked, onChange, label }) =>
  html`<button type="button" class="tk-check" role="checkbox" aria-checked=${checked ? 'true' : 'false'} aria-label=${label || 'Erledigt'}
    onClick=${(e) => { e.stopPropagation(); onChange && onChange(!checked); }}><span class="tk-check__box">${checked && html`<${Icon} name="check" size=${13} stroke=${3} />`}</span></button>`;

/** Schalter: äußerer Button = Trefferfläche (44 px auf Mobile), innere Spur `.tk-switch` (Styles/Overrides wie bisher). */
export const Switch = ({ checked, onChange, label }) =>
  html`<button type="button" class="tk-switch-hit" role="switch" aria-checked=${checked ? 'true' : 'false'} aria-label=${label} onClick=${() => onChange && onChange(!checked)}><span class="tk-switch" aria-checked=${checked ? 'true' : 'false'} aria-hidden="true"></span></button>`;

/**
 * Zahleneingabe mit − / + (44 px auf Mobile), Komma-Eingabe, Dauerdruck, Grenzen und Einheit.
 * onChange(neuerWert) erhält eine Zahl (gerundet auf decimals).
 */
export function NumberStepper({ value = 0, onChange, min = -Infinity, max = Infinity, step = 1, decimals = 0, unit, label = 'Wert', size }) {
  const [text, setText] = useState(null);
  const timer = useRef(null);
  const round = (v) => Math.round(v * 10 ** decimals) / 10 ** decimals;
  const clamp = (v) => Math.min(max, Math.max(min, round(v)));
  const set = (v) => { if (Number.isFinite(v)) onChange && onChange(clamp(v)); };
  const shown = text ?? new Intl.NumberFormat('de-DE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
  const hold = (dir) => { let v = value; const tick = () => { v = clamp(v + dir * step); set(v); }; tick(); timer.current = setTimeout(function rep() { tick(); timer.current = setTimeout(rep, 90); }, 450); };
  const stop = () => { clearTimeout(timer.current); timer.current = null; };
  useEffect(() => stop, []);
  return html`<div class=${`tk-stepper${size === 'sm' ? ' tk-stepper--sm' : ''}`} role="group" aria-label=${label}>
    <button type="button" class="tk-stepper__btn" aria-label=${`${label} verringern`} disabled=${value <= min} onPointerDown=${() => hold(-1)} onPointerUp=${stop} onPointerLeave=${stop} onKeyDown=${(e) => (e.key === 'Enter' || e.key === ' ') && set(value - step)}><${Icon} name="minus" size=${16} /></button>
    <input class="tk-stepper__input" inputmode="decimal" aria-label=${label} value=${shown} onFocus=${(e) => { setText(shown); e.currentTarget.select(); }}
      onInput=${(e) => setText(e.currentTarget.value)} onBlur=${() => { const v = parseFloat(String(text ?? '').replace(/\./g, '').replace(',', '.')); setText(null); set(v); }}
      onKeyDown=${(e) => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'ArrowUp') { e.preventDefault(); set(value + step); } if (e.key === 'ArrowDown') { e.preventDefault(); set(value - step); } }} />
    ${unit && html`<span class="tk-stepper__unit">${unit}</span>`}
    <button type="button" class="tk-stepper__btn" aria-label=${`${label} erhöhen`} disabled=${value >= max} onPointerDown=${() => hold(1)} onPointerUp=${stop} onPointerLeave=${stop} onKeyDown=${(e) => (e.key === 'Enter' || e.key === ' ') && set(value + step)}><${Icon} name="plus" size=${16} /></button>
  </div>`;
}

/** Fortschrittsring (SVG). value/max; optional zweite Runde (Überschreitung) gedämpft, nie in Warnfarbe. */
export function Ring({ value = 0, max = 1, size = 64, stroke = 8, tone = 'accent', label, children }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const ratio = max > 0 ? value / max : 0; const first = Math.min(1, Math.max(0, ratio)); const over = Math.min(1, Math.max(0, ratio - 1));
  return html`<div class="tk-ring" style=${`width:${size}px;height:${size}px`} role="img" aria-label=${label || `${Math.round(ratio * 100)} %`}>
    <svg width=${size} height=${size} viewBox=${`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx=${size / 2} cy=${size / 2} r=${r} fill="none" stroke="var(--tk-c-surface3)" stroke-width=${stroke} />
      <circle cx=${size / 2} cy=${size / 2} r=${r} fill="none" stroke=${toneColor(tone)} stroke-width=${stroke} stroke-linecap="round" stroke-dasharray=${`${first * c} ${c}`} transform=${`rotate(-90 ${size / 2} ${size / 2})`} />
      ${over > 0 && html`<circle cx=${size / 2} cy=${size / 2} r=${r} fill="none" stroke=${toneColor(tone)} stroke-opacity="0.45" stroke-width=${stroke} stroke-linecap="round" stroke-dasharray=${`${over * c} ${c}`} transform=${`rotate(-90 ${size / 2} ${size / 2})`} />`}
    </svg>${children && html`<div class="tk-ring__center">${children}</div>`}</div>`;
}

/** options: [{value,label,icon?}] */
export const Segmented = ({ value, onChange, options, label = 'Ansicht' }) =>
  html`<div class="tk-seg" role="tablist" aria-label=${label}>
    ${options.map((o) => html`<button type="button" role="tab" aria-selected=${o.value === value ? 'true' : 'false'} onClick=${() => onChange(o.value)}>
      ${o.icon && html`<${Icon} name=${o.icon} size=${14} />`}${o.label}</button>`)}
  </div>`;

export const Tabs = ({ value, onChange, options }) =>
  html`<div class="tk-tabs" role="tablist">
    ${options.map((o) => html`<button type="button" role="tab" aria-selected=${o.value === value ? 'true' : 'false'} onClick=${() => onChange(o.value)}>
      ${o.icon && html`<${Icon} name=${o.icon} size=${15} />`}${o.label}${o.count != null && html`<${Badge}>${o.count}<//>`}</button>`)}
  </div>`;

export const Progress = ({ value = 0, tone }) =>
  html`<div class="tk-progress" role="progressbar" aria-valuenow=${Math.round(value * 100)} aria-valuemin="0" aria-valuemax="100">
    <span style=${`width:${Math.max(0, Math.min(1, value)) * 100}%;${tone ? `background:var(--tk-c-${tone})` : ''}`}></span></div>`;

export const Avatar = ({ name = '?', color }) =>
  html`<span class="tk-avatar" style=${color ? `background:color-mix(in srgb, ${color} 18%, transparent);color:${color}` : ''}>${String(name).split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase()}</span>`;

export const EmptyState = ({ icon = 'inbox', title = 'Noch nichts hier', text, action }) =>
  html`<div class="tk-state" data-qa="empty-state"><div class="tk-state__icon"><${Icon} name=${icon} size=${22} /></div>
    <div class="tk-state__title">${title}</div>${text && html`<div class="tk-state__text">${text}</div>`}${action && html`<div style="margin-top:8px">${action}</div>`}</div>`;

export const ErrorState = ({ title = 'Laden fehlgeschlagen', text = 'Die Daten konnten nicht geladen werden. Bitte erneut versuchen.', onRetry }) =>
  html`<div class="tk-state tk-state--error" data-qa="error-state"><div class="tk-state__icon"><${Icon} name="alert-triangle" size=${22} /></div>
    <div class="tk-state__title">${title}</div><div class="tk-state__text">${text}</div>
    <div style="margin-top:8px"><${Button} size="sm" icon="refresh-cw" onClick=${onRetry}>Erneut versuchen<//></div></div>`;

export const Skeleton = ({ lines = 4, height = 14 }) =>
  html`<div class="tk-col" style="gap:10px" data-qa="loading-state" aria-busy="true">
    ${Array.from({ length: lines }, (_, i) => html`<div class="tk-skel" style=${`height:${height}px;width:${[92, 76, 84, 60, 70][i % 5]}%`}></div>`)}
  </div>`;

/** Tonwert -> CSS-Farbe (für Kategorien, Prioritäten …) */
export const toneColor = (tone) => ({
  accent: 'var(--tk-c-accent)', accent2: 'var(--tk-c-accent2)', success: 'var(--tk-c-success)', warning: 'var(--tk-c-warning)',
  danger: 'var(--tk-c-danger)', info: 'var(--tk-c-info)', neutral: 'var(--tk-c-text-subtle)',
  1: 'var(--tk-chart-1)', 2: 'var(--tk-chart-2)', 3: 'var(--tk-chart-3)', 4: 'var(--tk-chart-4)', 5: 'var(--tk-chart-5)', 6: 'var(--tk-chart-6)',
}[tone] || tone || 'var(--tk-c-accent)');

/** Mini-Liniendiagramm (SVG) */
export function Sparkline({ values = [], width = 96, height = 28, tone = 'accent', fill = true }) {
  if (!values.length) return null;
  const min = Math.min(...values), max = Math.max(...values), r = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1 || 1)) * width, height - 2 - ((v - min) / r) * (height - 4)]);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('');
  const col = toneColor(tone);
  return html`<svg width=${width} height=${height} viewBox=${`0 0 ${width} ${height}`} style="display:block;overflow:visible" aria-hidden="true">
    ${fill && html`<path d=${`${d}L${width},${height}L0,${height}Z`} fill=${col} opacity=".12" />`}
    <path d=${d} fill="none" stroke=${col} stroke-width="1.75" stroke-linejoin="round" stroke-linecap="round" /></svg>`;
}

/** Kennzahl-Trend (+/-) */
/** Veränderung mit Vorzeichen (echtes Minus „−“). 0 und `neutral` (Gesundheitswerte: Gewicht, Puls) ohne Pfeil und ohne Grün/Rot. */
export const Delta = ({ value, suffix = '%', invert, neutral }) => {
  if (value == null) return null;
  const n = Number(value);
  const sign = n > 0 ? '+' : n < 0 ? '−' : '';
  const text = `${sign}${String(Math.abs(n)).replace('.', ',')}${suffix}`;
  if (neutral || n === 0 || Number.isNaN(n)) return html`<span class="tk-num" style="font-size:var(--tk-fs-sm);font-weight:500;color:var(--tk-c-text-muted)">${Number.isNaN(n) ? String(value) : text}</span>`;
  const good = invert ? n < 0 : n > 0;
  return html`<span class="tk-num" style=${`display:inline-flex;align-items:center;gap:2px;font-size:var(--tk-fs-sm);font-weight:600;color:var(--tk-c-${good ? 'success' : 'danger'})`}>
    <${Icon} name=${n > 0 ? 'arrow-up-right' : 'arrow-down-right'} size=${14} />${text}</span>`;
};
