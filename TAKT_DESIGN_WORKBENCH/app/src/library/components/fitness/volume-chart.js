// Fitness: Trainingsvolumen pro Woche als ruhiges Balkendiagramm (Tonnen, nach Kalenderwoche). Ohne Daten wahlweise unsichtbar.
import { html } from '../../../lib/html.js';
import { Card, EmptyState } from '../../ui.js';
import { num } from './_calc.js';
import { BarChart, CHART_CSS } from './_charts.js';

export const volumeChart = {
  id: 'volume-chart',
  name: 'Trainingsvolumen',
  category: 'Fitness',
  description: 'Volumen (Gewicht × Wiederholungen) je Woche als Balken, die laufende Woche abgesetzt. Antippen zeigt den Wert. Ohne Einheiten ein ehrlicher Leerzustand oder – mit „Ohne Daten nichts anzeigen“ – gar nichts.',
  version: '1.0',
  props: [
    { name: 'quietEmpty', label: 'Ohne Daten nichts anzeigen (Erststart)', type: 'boolean', default: false },
    { name: 'title', label: 'Titel', type: 'text', default: 'Trainingsvolumen pro Woche' },
    { name: 'height', label: 'Höhe (px)', type: 'number', default: 200 },
  ],
  data: [{ slot: 'series', label: 'Wochenvolumen', default: 'volume', shape: '{labels:string[],series:[{name,values:number[]}]}', required: true }],
  events: ['chart.point'],
  states: ['empty'],
  flutter: { widget: 'TaktVolumeChart', propMap: { title: 'title', height: 'height' }, events: ['chart.point'] },
  css: `${CHART_CSS}`,
  example: { data: { series: { labels: ['44', '45', '46', '47', '48'], series: [{ name: 'Volumen (t)', values: [9.4, 10.1, 9.8, 11.2, 4.6] }] } } },
  render: function VolumeChart({ props, data, ctx }) {
    const s = data.series; const values = s?.series?.[0]?.values || []; const labels = s?.labels || [];
    if (!values.length) return props.quietEmpty ? null : html`<${Card} title=${props.title}><${EmptyState} icon="bar-chart-3" title="Noch kein Volumen" text="Nach der ersten Einheit siehst du hier dein Trainingsvolumen pro Woche." /><//>`;
    return html`<${Card} title=${props.title}><${BarChart} labels=${labels} values=${values} height=${props.height} partial=${[values.length - 1]} label=${props.title} fmt=${(v) => num(v, 1)}
      tip=${(i) => html`<span><strong>KW ${labels[i]}</strong> · ${num(values[i], 1)} t${i === values.length - 1 ? ' (läuft)' : ''}</span>`} /><//>`;
  },
};
export default [volumeChart];
