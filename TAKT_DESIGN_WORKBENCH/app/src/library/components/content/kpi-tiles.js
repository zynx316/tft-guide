// Kennzahlen-Kacheln mit Privatsphäre-Maske, ehrlichen Leerwerten und Umbruch statt Ellipse (Notizen, Picture to Text, Sales)
import { html } from '../../../lib/html.js';
import { Card, Icon, EmptyState, Sparkline, toneColor } from '../../ui.js';
import { money, percent } from '../../helpers.js';
import { fmtNumber } from '../../../lib/format.js';

/** Wert einer Kachel als Text. `kind` steuert Format und Maske: money (Betrag), percent (Anteil 0–100), number (Zahl). `raw` = Zahl, ohne Datenpunkt `null` → „–“. */
export function tileValue(ctx, m) {
  if (m.raw === undefined || m.raw === null) return m.raw === null ? { text: '–', unit: '' } : { text: m.value, unit: m.unit || '' };
  if (m.kind === 'money') return { text: money(ctx, m.raw, { digits: m.digits ?? 2 }), unit: '' };
  if (m.kind === 'percent') return { text: ctx?.privacy && m.sensitive ? '••' : fmtNumber(m.raw, { digits: m.digits ?? 0 }), unit: '%' };
  return { text: fmtNumber(m.raw, { digits: m.digits ?? 0 }), unit: m.unit || '' };
}

/** Veränderung als ruhiger Text: bei 0 ohne Pfeil und neutral, Prozentwerte unter Privatsphäre-Modus maskiert. */
function Change({ ctx, m }) {
  if (m.delta == null) return null;
  const d = Number(m.delta);
  const neutral = d === 0;
  const good = m.invert ? d < 0 : d > 0;
  const color = neutral ? 'var(--tk-c-text-muted)' : `var(--tk-c-${good ? 'success' : 'danger'})`;
  const priv = ctx?.privacy && m.sensitive ? { ...ctx } : { ...ctx, privacy: false };   // Veränderungen von Umsatzwerten verraten Beträge: nur diese maskieren
  const text = m.suffix === ' PP' ? percent(priv, d / 100, { pp: true, digits: 1 }) : percent(priv, d / 100, { digits: 1 });
  return html`<span class="tk-num tk-kpit__delta" style=${`color:${color}`}>${!neutral && html`<${Icon} name=${d > 0 ? 'arrow-up-right' : 'arrow-down-right'} size=${14} />`}${text}</span>`;
}

export const kpiTiles = {
  id: 'kpi-tiles',
  name: 'Kennzahlen-Kacheln',
  category: 'Inhalte',
  description: 'Kennzahlen-Kacheln wie die Kennzahlen-Reihe, aber mit Betragsmaske im Privatsphäre-Modus (kind „money“/„percent“ mit Rohwert), „–“ statt 0 ohne Datenbasis, neutraler Veränderung bei 0 und Umbruch statt Ellipse bei großer Schrift.',
  version: '1.0',
  props: [
    { name: 'columns', label: 'Spalten (Desktop)', type: 'number', default: 4 },
    { name: 'showSpark', label: 'Sparklines', type: 'boolean', default: true },
    { name: 'variant', label: 'Stil', type: 'select', options: ['card', 'plain'], default: 'card' },
  ],
  data: [{ slot: 'metrics', label: 'Kennzahlen', default: 'metrics', shape: '{label,value?,raw?:number|null,kind?:money|percent|number,sensitive?:boolean,unit?,digits?,delta?,suffix?,invert?,icon?,tone?,spark?:number[],to?}[]', required: true }],
  events: ['metric.open'],
  states: ['empty'],
  flutter: { widget: 'TaktKpiTiles', propMap: { columns: 'columns', showSpark: 'showSparklines', variant: 'variant' }, events: { 'metric.open': 'onMetricTap' } },
  css: `
  .tk-kpit { display:grid; gap:var(--tk-space-3); grid-template-columns:repeat(var(--cols,4), minmax(0,1fr)); }
  .bp-tablet .tk-kpit { grid-template-columns:repeat(2, minmax(0,1fr)); }
  .bp-mobile .tk-kpit { grid-template-columns:repeat(2, minmax(0,1fr)); gap:var(--tk-space-2); }
  [data-tk-large-text] .tk-kpit, [data-tk-large-text] .bp-mobile .tk-kpit { grid-template-columns:minmax(0,1fr); }
  .tk-kpit .tk-metric__label span:last-child { white-space:normal; overflow:visible; text-overflow:clip; overflow-wrap:anywhere; }
  .tk-kpit .tk-metric__value { white-space:normal; overflow-wrap:anywhere; }
  .tk-kpit .tk-metric__foot { flex-wrap:wrap; }
  .tk-kpit__delta { display:inline-flex; align-items:center; gap:2px; font-size:var(--tk-fs-sm); font-weight:var(--tk-fw-semibold); }`,
  example: { data: { metrics: [
    { label: 'Umsatz heute', raw: 281.89, kind: 'money', icon: 'banknote', tone: 'success', spark: [212, 246, 301, 188, 163, 229, 282] },
    { label: 'Retourenquote', raw: 2.8, kind: 'percent', digits: 1, icon: 'rotate-ccw', tone: 'info', delta: -0.4, suffix: ' PP', invert: true },
    { label: 'Ø Konfidenz', raw: null, kind: 'percent', icon: 'gauge', tone: 'success' },
    { label: 'Bestellungen', raw: 194, icon: 'shopping-cart', tone: 'accent', delta: 4.3 },
  ] } },
  render: ({ props, data, ctx }) => {
    const ms = Array.isArray(data.metrics) ? data.metrics : [];
    if (!ms.length) return html`<${Card}><${EmptyState} icon="activity" title="Keine Kennzahlen" text="Sobald Daten vorliegen, erscheinen hier die wichtigsten Werte." /><//>`;
    return html`<div class="tk-metric-row tk-kpit" style=${`--cols:${props.columns}`} data-qa="kpi-tiles">
      ${ms.map((m) => { const v = tileValue(ctx, m); return html`<button type="button" class=${`tk-metric ${props.variant === 'plain' ? 'tk-metric--plain' : ''}`} onClick=${() => ctx.emit('metric.open', { label: m.label, to: m.to })}>
        <div class="tk-metric__label">${m.icon && html`<span style=${`color:${toneColor(m.tone || 'accent')}`}><${Icon} name=${m.icon} size=${15} /></span>`}<span>${m.label}</span></div>
        <div class="tk-metric__value">${v.text}${v.unit && html`<small>${v.unit}</small>`}</div>
        ${(m.delta != null || (props.showSpark && m.spark)) && html`<div class="tk-metric__foot"><${Change} ctx=${ctx} m=${m} />${props.showSpark && m.spark && !ctx.privacy && html`<${Sparkline} values=${m.spark} width=${72} height=${24} tone=${m.tone || 'accent'} />`}</div>`}
      </button>`; })}</div>`;
  },
};
