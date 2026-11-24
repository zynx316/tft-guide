// Fitness: Schlaf der letzten Nächte (Dauer gegen den 7–9-Std.-Richtwert) mit Qualität und Ruhepuls.
import { html } from '../../../lib/html.js';
import { Card, Badge, Icon, Sparkline, EmptyState } from '../../ui.js';
import { WD, dowOf, num, numAuto, avg, dayShort } from './_calc.js';
import { BarChart, CHART_CSS } from './_charts.js';
import { FIT_CSS } from './_ui.js';

export const sleepChart = {
  id: 'sleep-chart',
  name: 'Schlaf',
  category: 'Fitness',
  description: 'Schlafdauer der letzten Nächte als Balken gegen den Richtwert 7–9 Stunden, dazu letzte Nacht (Einschlaf-/Aufwachzeit, Qualität 1–5) und Ruhepuls-Verlauf. Orientierung, keine Diagnose.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Schlaf' },
    { name: 'days', label: 'Nächte', type: 'number', default: 14 },
    { name: 'height', label: 'Höhe (px)', type: 'number', default: 170 },
    { name: 'showHr', label: 'Ruhepuls zeigen', type: 'boolean', default: true },
  ],
  data: [{ slot: 'log', label: 'Schlaf', default: 'sleep', shape: '{date,bed,wake,hours,quality,restingHr}[]', required: true }],
  events: ['sleep.open', 'chart.point'],
  states: ['empty'],
  css: `${CHART_CSS}
  .tk-sc { display:flex; flex-direction:column; gap:var(--tk-space-4); } .tk-sc__stats { display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:var(--tk-space-3); } .tk-sc__q { display:inline-flex; gap:3px; vertical-align:middle; } .tk-sc__q i { width:8px; height:8px; border-radius:50%; background:var(--tk-c-surface3); display:block; } .tk-sc__q i[data-on="true"] { background:var(--tk-c-accent); }`,
  example: { data: { log: [{ date: '2026-11-22', bed: '23:00', wake: '07:15', hours: 8.3, quality: 5, restingHr: 56 }, { date: '2026-11-23', bed: '23:20', wake: '06:30', hours: 7.2, quality: 4, restingHr: 57 }, { date: '2026-11-24', bed: '23:35', wake: '06:30', hours: 6.9, quality: 3, restingHr: 58 }] } },
  render: function SleepChart({ props, data, ctx }) {
    const log = (data.log || []).slice(-props.days);
    if (!log.length) return html`<${Card} title=${props.title}><${EmptyState} icon="bed" title="Keine Schlafdaten" text="Sobald Schlaf eingetragen oder verbunden ist, erscheint hier dein Verlauf." /><//>`;
    const last = log.at(-1); const a7 = avg(log.slice(-7).map((x) => x.hours));
    const q = (n) => html`<span class="tk-sc__q" role="img" aria-label=${`Qualität ${n} von 5`}>${[1, 2, 3, 4, 5].map((i) => html`<i data-on=${String(i <= n)}></i>`)}</span>`;
    return html`<${Card} title=${props.title} icon="bed" actions=${html`<${Badge} tone=${last.hours >= 7 ? 'success' : 'neutral'}>Letzte Nacht ${numAuto(last.hours, 1)} Std.<//>`}><div class="tk-sc" data-qa="sleep-chart">
      <div class="tk-sc__stats"><div class="tk-fit-stat"><span>Ø 7 Nächte</span><strong>${num(a7, 1)}<small> Std.</small></strong></div><div class="tk-fit-stat"><span>Zeiten</span><strong style="font-size:var(--tk-fs-lg)">${last.bed}–${last.wake}</strong></div>
        <div class="tk-fit-stat"><span>Qualität</span><strong>${q(last.quality)}</strong></div></div>
      <${BarChart} height=${props.height} label="Schlafdauer pro Nacht" labels=${log.map((x) => WD[dowOf(x.date)])} values=${log.map((x) => x.hours)} band=${[7, 9]} tone="accent2" fmt=${(v) => num(v, 0)} tip=${(i) => html`<span><strong>${dayShort(log[i].date)}</strong> · ${num(log[i].hours, 1)} Std. (${log[i].bed}–${log[i].wake}) · Qualität ${log[i].quality}/5</span>`} />
      <div class="tk-row" style="gap:8px;font-size:var(--tk-fs-sm)" ><span class="tk-subtle" style="display:inline-flex;gap:6px;align-items:center"><i style="width:14px;height:8px;border-radius:3px;background:var(--tk-c-success);opacity:.35;display:block"></i>Richtwert 7–9 Std.</span></div>
      ${props.showHr && html`<div class="tk-row" style="gap:var(--tk-space-3)"><div class="tk-fit-stat tk-grow"><span>Ruhepuls</span><strong>${last.restingHr}<small> bpm</small></strong></div><${Sparkline} values=${log.map((x) => x.restingHr)} width=${140} height=${36} tone="success" /></div>`}
    </div><//>`;
  },
};
export default [sleepChart];
