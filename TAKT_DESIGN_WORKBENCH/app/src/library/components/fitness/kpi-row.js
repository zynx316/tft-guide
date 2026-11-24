// Fitness: Kennzahlen-Reihe für Körper- und Trainingswerte – neutral (keine Bewertungsfarbe, HEALTH T1/T6/T8) und mit „Werte ausblenden“.
import { html } from '../../../lib/html.js';
import { Card, Icon, EmptyState, Sparkline, toneColor } from '../../ui.js';
import { weightHidden } from './_ui.js';

export const fitKpis = {
  id: 'fit-kpis',
  name: 'Körper-Kennzahlen',
  category: 'Fitness',
  description: 'Kennzahlen-Kacheln für Training und Körperwerte. Veränderungen stehen als ruhiger Text (kein Grün/Rot, kein Pfeil), Gewichtswerte lassen sich app-weit ausblenden (prefs.health.hideWeight). Nutzt das Raster der Kennzahlen-Reihe.',
  version: '1.0',
  props: [
    { name: 'columns', label: 'Spalten (Desktop)', type: 'number', default: 4 },
    { name: 'showSpark', label: 'Sparklines', type: 'boolean', default: true },
  ],
  data: [{ slot: 'metrics', label: 'Kennzahlen', default: 'metrics', shape: '{label,value,unit?,note?,icon?,tone?,spark?:number[],sensitive?:boolean,faint?:boolean}[]', required: true }],
  events: ['metric.open'],
  states: ['empty'],
  flutter: { widget: 'TaktFitKpis', propMap: { columns: 'columns', showSpark: 'showSparklines' }, events: { 'metric.open': 'onMetricTap' } },
  css: `
  .tk-fk .tk-metric__value { white-space:normal; overflow-wrap:anywhere; } .tk-fk .tk-metric--faint .tk-metric__value { color:var(--tk-c-text-muted); font-weight:var(--tk-fw-semibold); }
  .tk-fk__note { color:var(--tk-c-text-muted); font-size:var(--tk-fs-sm); line-height:var(--tk-lh-snug); min-width:0; } .tk-fk .tk-metric__foot { flex-wrap:wrap; }`,
  example: { data: { metrics: [
    { label: 'Gewichtstrend', value: '78,5', unit: 'kg', icon: 'scale', tone: 'info', note: '−0,3 kg in 7 Tagen', sensitive: true, spark: [78.9, 78.8, 78.7, 78.6, 78.5] },
    { label: 'Ruhepuls', value: 58, unit: 'bpm', icon: 'heart-pulse', tone: 'info', spark: [59, 58, 58, 57, 58] },
  ] } },
  render: function FitKpis({ props, data, ctx }) {
    const ms = Array.isArray(data.metrics) ? data.metrics : [];
    if (!ms.length) return html`<${Card}><${EmptyState} icon="activity" title="Keine Kennzahlen" text="Sobald Daten vorliegen, erscheinen hier die wichtigsten Werte." /><//>`;
    const hide = weightHidden(ctx);
    return html`<div class="tk-metric-row tk-fk" style=${`--cols:${props.columns}`} data-qa="fit-kpis">
      ${ms.map((m) => { const masked = hide && m.sensitive; return html`<button type="button" class=${`tk-metric ${m.faint ? 'tk-metric--faint' : ''}`} onClick=${() => ctx.emit('metric.open', { label: m.label })}>
        <div class="tk-metric__label">${m.icon && html`<span style=${`color:${toneColor(m.tone || 'accent')}`}><${Icon} name=${m.icon} size=${15} /></span>`}<span class="tk-truncate">${m.label}</span></div>
        <div class="tk-metric__value">${masked ? '•••' : m.value}${m.unit && !masked && html`<small>${m.unit}</small>`}</div>
        ${((!masked && m.note) || (!masked && props.showSpark && m.spark)) && html`<div class="tk-metric__foot">${m.note && html`<span class="tk-fk__note">${m.note}</span>`}${props.showSpark && m.spark && html`<${Sparkline} values=${m.spark} width=${72} height=${24} tone=${m.tone || 'accent'} />`}</div>`}
      </button>`; })}</div>`;
  },
};
export default [fitKpis];
