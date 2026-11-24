// Sparpläne: Wachstumsdiagramm – Einzahlungen gegen Wert, mit Spanne (Annahme ± 2 PP). Quelle: Rechner, Sparplan oder Depotverlauf.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Segmented, EmptyState } from '../../ui.js';
import { addMonths, toDate } from '../../../lib/date.js';
import { fmtDate } from '../../../lib/format.js';
import { arr, obj, todayOf, SV_CSS, QuietNote, QUIET_PROP } from './_savings.js';
import { GrowthChart, GrowthLegend, CHART_CSS } from './_chart.js';
import { getCalc, runCalc, calcPoints, forwardRun } from './_calc.js';
import { planHistory } from './_plans.js';

const FWD = [{ value: 0, label: 'Verlauf' }, { value: 5, label: '+5 Jahre' }, { value: 10, label: '+10 Jahre' }, { value: 20, label: '+20 Jahre' }];

/** Plan-Verlauf (Modell) plus optional Projektion mit Spanne. */
function planPoints(plan, ctx, data, years) {
  const h = planHistory(plan, { positions: data.positions, today: todayOf(ctx) });
  if (!h) return null;
  const pts = h.series.map((p) => ({ m: p.month, invested: p.invested, value: p.value, ...(years > 0 ? { low: p.value, high: p.value } : {}) }));
  if (years > 0) {
    const run = forwardRun({ monthly: plan.monthly, initial: h.value, ratePa: plan.expectedReturnPa ?? 0.05, years, dynamicPa: plan.dynamicPa || 0 });
    const a = run.annahme.series, lo = run.vorsichtig.series, hi = run.zuversichtlich.series;
    a.forEach((p, i) => { if (i && (i % 3 === 0 || i === a.length - 1)) pts.push({ m: h.n + p.month, invested: h.invested + (p.invested - h.value), value: p.value, low: lo[i].value, high: hi[i].value }); });
  }
  return { pts, h, now: h.n };
}

export const growthChart = {
  id: 'growth-chart',
  name: 'Wachstumsdiagramm',
  category: 'Sparpläne',
  description: 'Eingezahlt gegen Wert über die Zeit, Ertrag als Fläche dazwischen und – bei Projektionen – die Spanne „Annahme ± 2 Prozentpunkte“. Quelle wählbar: Rechner (ui.calc), Sparplan-Verlauf mit Ausblick oder Depotverlauf.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Eingezahlt und Wert' },
    QUIET_PROP,
    { name: 'source', label: 'Quelle', type: 'select', options: ['calc', 'plan', 'depot'], default: 'calc' },
    { name: 'height', label: 'Höhe (px)', type: 'number', default: 260 },
    { name: 'showBand', label: 'Spanne zeigen', type: 'boolean', default: true },
    { name: 'outlook', label: 'Ausblick Jahre (Quelle Sparplan)', type: 'number', default: 10 },
    { name: 'switcher', label: 'Ausblick wählbar', type: 'boolean', default: true },
    { name: 'framed', label: 'In Karte', type: 'boolean', default: true },
    { name: 'compact', label: 'Kompakt (ohne Legende)', type: 'boolean', default: false },
  ],
  data: [
    { slot: 'plans', label: 'Sparpläne', default: 'plans', shape: '{id,name,monthly,startDate,dynamicPa,expectedReturnPa}[]' },
    { slot: 'positions', label: 'Positionen', default: 'positions', shape: '{id,cost,value}[]' },
    { slot: 'history', label: 'Depotverlauf', default: 'history', shape: '{labels:string[],series:[{name,values:number[]}]}' },
  ],
  events: ['chart.point', 'chart.outlook'],
  states: ['empty'],
  css: `${SV_CSS}${CHART_CSS}
  .tk-svgc__head { display:flex; align-items:center; justify-content:space-between; gap:var(--tk-space-3); flex-wrap:wrap; margin-bottom:var(--tk-space-3); }
  .tk-svgc__note { margin-top:8px; font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); }`,
  example: { props: { source: 'depot' }, data: { history: { labels: ['Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov'], series: [{ name: 'Depotwert', values: [24910, 25560, 25240, 26480, 27120, 30097] }, { name: 'Eingezahlt', values: [21450, 21875, 22300, 22725, 23150, 23575] }] } } },
  render: function GrowthChartBlock({ props, data, ctx }) {
    const [fwd, setFwd] = useState(Number(props.outlook) || 0);
    const wrap = (body, head) => (props.framed ? html`<${Card} title=${props.title} icon="line-chart" actions=${head}>${body}<//>` : html`<div>${head}${body}</div>`);
    const empty = (t, x) => props.quietEmpty ? html`<${QuietNote} icon="line-chart" text=${x} />` : wrap(html`<${EmptyState} icon="line-chart" title=${t} text=${x} />`);
    const common = { ctx, height: props.height, compact: props.compact };
    if (props.source === 'depot') {
      const h = obj(data.history), find = (n) => arr(h.series).find((s) => String(s.name).startsWith(n));
      const val = arr(find('Depotwert')?.values), inv = arr(find('Eingezahlt')?.values), labels = arr(h.labels);
      if (val.length < 2) return empty('Noch kein Verlauf', 'Sobald Ausführungen und Kurse vorliegen, erscheint hier der Verlauf.');
      const pts = val.map((v, i) => ({ m: i, invested: inv[i] ?? v, value: v }));
      return wrap(html`<${GrowthChart} ...${common} points=${pts} xTicks=${[0, 3, 6, 9, val.length - 1]} xLabel=${(m) => labels[Math.round(m)] || ''} label="Depotverlauf der letzten zwölf Monate" />${!props.compact && html`<${GrowthLegend} />`}`);
    }
    if (props.source === 'plan') {
      const plans = arr(data.plans);
      const plan = plans.find((p) => p.id === ctx.ui.selectedId) || plans[0];
      if (!plan) return empty('Kein Sparplan', 'Lege einen Plan an, dann zeigt TAKT Einzahlungen und Wert seit dem Start.');
      const r = planPoints(plan, ctx, data, fwd);
      if (!r) return empty('Noch keine Ausführung', `Der Plan beginnt am ${fmtDate(plan.startDate)}. Danach erscheint hier der Verlauf.`);
      const start = toDate(plan.startDate), yearOf = (m) => String(addMonths(start, m).getFullYear());
      const sw = props.switcher && html`<div class="tk-svg-sw"><${Segmented} label="Ausblick" value=${fwd} onChange=${(v) => { setFwd(v); ctx.emit('chart.outlook', { years: v }); }} options=${FWD} /></div>`;
      return wrap(html`<${GrowthChart} ...${common} points=${r.pts} now=${fwd ? r.now : undefined} xLabel=${yearOf} label=${`Verlauf von ${plan.name}`} />
        ${!props.compact && html`<${GrowthLegend} band=${fwd > 0} bandText="Spanne Annahme ± 2 PP" projected=${fwd > 0} />`}
        <p class="tk-svgc__note">Modell: gleichbleibende Rendite, auf Einstand und Wert der Position abgestimmt${fwd ? '. Ausblick mit den Annahmen des Plans, ohne Gewähr' : ''}.</p>`, sw);
    }
    const c = getCalc(ctx), run = runCalc(c), pts = calcPoints(run, c.years > 25 ? 3 : 1);
    return wrap(html`<${GrowthChart} ...${common} points=${props.showBand ? pts : pts.map((p) => ({ ...p, low: undefined, high: undefined }))} bandLabel="Spanne" xLabel=${(m) => (m === 0 ? 'Start' : `${Math.round(m / 12)} J.`)} label=${`Wachstum über ${c.years} Jahre`} />
      ${!props.compact && html`<${GrowthLegend} band=${props.showBand} bandText=${`Spanne ${Math.round(run.nominal.vorsichtig * 100)} bis ${Math.round(run.nominal.zuversichtlich * 100)} % (Annahme)`} />`}`);
  },
};
export default [growthChart];
