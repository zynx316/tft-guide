// Fitness: Schritte und aktive Minuten – Tagesstand mit Stundenverlauf, 7/30 Tage mit individuellem Ziel (kein Zwang auf 10.000).
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Badge, Segmented, Button, Progress, EmptyState } from '../../ui.js';
import { isoDay } from '../../../lib/util.js';
import { WD, dowOf, num, avg, dayShort, dateShort } from './_calc.js';
import { BarChart, CHART_CSS } from './_charts.js';
import { Stepper, FIT_CSS } from './_ui.js';

export const stepsChart = {
  id: 'steps-chart',
  name: 'Schritte & Aktivität',
  category: 'Fitness',
  description: 'Schritte heute mit Stundenverlauf, 7 oder 30 Tage mit individuellem Tagesziel (änderbar, kein Zwang auf 10.000), aktive Minuten und Distanz. Quelle: Health Connect (simuliert).',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Schritte' },
    { name: 'goal', label: 'Tagesziel (Schritte)', type: 'number', default: 9000 },
    { name: 'showToday', label: 'Heute mit Stundenverlauf', type: 'boolean', default: true },
    { name: 'height', label: 'Höhe (px)', type: 'number', default: 170 },
  ],
  data: [
    { slot: 'log', label: 'Aktivität', default: 'activity', shape: '{date,steps,activeMin,km,partial?}[]', required: true },
    { slot: 'today', label: 'Heute stündlich', default: 'stepsToday', shape: '{hourly:number[],total,source}' },
  ],
  events: ['activity.range', 'activity.goal', 'chart.point'],
  states: ['empty'],
  css: `${CHART_CSS}
  .tk-st { display:flex; flex-direction:column; gap:var(--tk-space-4); } .tk-st__stats { display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:var(--tk-space-3); }`,
  example: { data: { log: [{ date: '2026-11-21', steps: 13707, activeMin: 118, km: 10.1 }, { date: '2026-11-22', steps: 18028, activeMin: 163, km: 13.3 }, { date: '2026-11-23', steps: 5980, activeMin: 59, km: 4.4 }, { date: '2026-11-24', steps: 3240, activeMin: 22, km: 2.4, partial: true }], today: { hourly: [0, 0, 0, 0, 0, 0, 180, 1120, 1440, 500], total: 3240, source: 'Health Connect (Demo)' } } },
  render: function StepsChart({ props, data, ctx }) {
    const [range, setRange] = useState('7 Tage');
    const all = data.log || []; const goal = ctx.ui.stepGoal || props.goal;
    if (!all.length) return html`<${Card} title=${props.title}><${EmptyState} icon="footprints" title="Keine Aktivitätsdaten" text="Erlaube den Zugriff auf Health Connect oder trage Aktivitäten von Hand ein." /><//>`;
    const today = all.at(-1); const rows = all.slice(range === '7 Tage' ? -8 : -30); const complete = all.filter((x) => !x.partial);
    const a7 = Math.round(avg(complete.slice(-7).map((x) => x.steps)));
    const setGoal = () => ctx.openDialog({ title: 'Tagesziel anpassen', body: (close) => { const Inner = () => { const [v, setV] = useState(goal); return html`<div class="tk-col" style="gap:12px"><p class="tk-muted" style="font-size:var(--tk-fs-sm)">Ein gutes Ziel ist eines, das du an den meisten Tagen gut erreichst – es muss nicht 10.000 sein.</p><${Stepper} size="lg" label="Tagesziel" value=${v} step=${500} min=${2000} max=${30000} onChange=${setV} unit="Schritte" />
      <div class="tk-row" style="justify-content:flex-end;gap:8px"><${Button} onClick=${close}>Abbrechen<//><${Button} variant="primary" onClick=${() => { ctx.setUi('stepGoal', v); ctx.emit('activity.goal', { goal: v }); close(); }}>Übernehmen<//></div></div>`; }; return html`<${Inner} />`; } });
    return html`<${Card} title=${props.title} icon="footprints" actions=${html`<${Segmented} label="Zeitraum" value=${range} onChange=${(r) => { setRange(r); ctx.emit('activity.range', { range: r }); }} options=${['7 Tage', '30 Tage'].map((r) => ({ value: r, label: r }))} />`}><div class="tk-st" data-qa="steps-chart">
      <div class="tk-st__stats"><div class="tk-fit-stat"><span>Heute</span><strong>${num(today.steps)}</strong><small>${Math.round((today.steps / goal) * 100)} % von ${num(goal)}</small></div><div class="tk-fit-stat"><span>Ø 7 Tage</span><strong>${num(a7)}</strong><small>${a7 >= goal ? 'Ziel im Schnitt erreicht' : `${num(goal - a7)} bis zum Ziel`}</small></div>
        <div class="tk-fit-stat"><span>Aktiv heute</span><strong>${today.activeMin}<small> Min.</small></strong><small>${num(today.km, 1)} km</small></div></div>
      <${Progress} value=${today.steps / goal} />
      ${props.showToday && data.today?.hourly?.length > 0 && html`<div><div class="tk-label" style="margin-bottom:6px">Heute nach Stunden</div><${BarChart} height=${110} label="Schritte pro Stunde heute" labels=${data.today.hourly.map((_, i) => String(i))} values=${data.today.hourly} tone="info" fmt=${(v) => num(v)} tip=${(i) => html`<span><strong>${i}–${i + 1} Uhr</strong> · ${num(data.today.hourly[i])} Schritte</span>`} /></div>`}
      <${BarChart} height=${props.height} label=${`Schritte ${range}`} labels=${rows.map((x) => (range === '7 Tage' ? WD[dowOf(x.date)] : dateShort(x.date).slice(0, 5)))} values=${rows.map((x) => x.steps)} goal=${goal} partial=${rows.map((x, i) => (x.partial ? i : -1)).filter((i) => i >= 0)} fmt=${(v) => (v >= 1000 ? `${num(v / 1000, 0)}k` : num(v))}
        tip=${(i) => html`<span><strong>${dayShort(rows[i].date)}</strong> · ${num(rows[i].steps)} Schritte · ${rows[i].activeMin} aktive Min.${rows[i].partial ? ' (Tag läuft noch)' : ''}</span>`} />
      <div class="tk-row" style="justify-content:space-between;gap:8px;flex-wrap:wrap"><span class="tk-subtle" style="font-size:var(--tk-fs-xs)">Quelle: ${data.today?.source || 'Health Connect (Demo)'} · gestrichelt = Tagesziel</span><${Button} size="sm" icon="target" onClick=${setGoal}>Ziel ändern<//></div></div><//>`;
  },
};
export default [stepsChart];
