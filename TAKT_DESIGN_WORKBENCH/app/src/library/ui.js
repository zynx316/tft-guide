// ============================================================================
// TAKT UI-PRIMITIVE – gemeinsame Bausteine ALLER Bibliothekskomponenten.
// Regel: Komponenten bauen aus diesen Primitiven, statt Buttons/Badges/
// Eingabefelder selbst zu implementieren. Styles: design-system/takt-base.css
// ============================================================================
import { html } from '../lib/html.js';
import { Icon } from '../lib/icons.js';
import { cx } from '../lib/util.js';

export { Icon };

export function Button({ variant = 'default', size, icon, iconRight, children, class: c, ...rest }) {
  const iconOnly = icon && !children;
  return html`<button type="button" class=${cx('tk-btn', variant !== 'default' && `tk-btn--${variant}`, size === 'sm' && 'tk-btn--sm', iconOnly && 'tk-btn--icon', c)} ...${rest}>
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

export const Switch = ({ checked, onChange, label }) =>
  html`<button type="button" class="tk-switch" role="switch" aria-checked=${checked ? 'true' : 'false'} aria-label=${label} onClick=${() => onChange && onChange(!checked)}></button>`;

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
export const Delta = ({ value, suffix = '%', invert }) => {
  if (value == null) return null;
  const good = invert ? value < 0 : value >= 0;
  return html`<span class="tk-num" style=${`display:inline-flex;align-items:center;gap:2px;font-size:var(--tk-fs-sm);font-weight:600;color:var(--tk-c-${good ? 'success' : 'danger'})`}>
    <${Icon} name=${value >= 0 ? 'arrow-up-right' : 'arrow-down-right'} size=${14} />${value > 0 ? '+' : ''}${String(value).replace('.', ',')}${suffix}</span>`;
};
