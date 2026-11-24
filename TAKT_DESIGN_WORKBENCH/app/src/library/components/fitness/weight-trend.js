// Fitness: Gewichtstrend – Rohwerte blass, geglätteter Trend, Zielwert; Werte ausblenden (Gewohnheitsmodus).
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Segmented, Icon, EmptyState, Progress } from '../../ui.js';
import { isoDay, addDays } from '../../../lib/util.js';
import { trendOf, num, dateShort, dayShort, diffDays, addDaysIso, r1 } from './_calc.js';
import { LineChart, CHART_CSS } from './_charts.js';
import { FIT_CSS, hideVal, Toggle, weightHidden, setWeightHidden } from './_ui.js';

export const weightTrend = {
  id: 'weight-trend',
  name: 'Gewichtstrend',
  category: 'Fitness',
  description: 'Gewichtsverlauf mit exponentiell geglättetem Trend (Rohwerte blass), Zielwert und Wochenänderung auf Trend-Basis. Tagesschwankungen werden eingeordnet statt bewertet. „Werte ausblenden“ blendet alle Gewichtszahlen im Feature aus.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Gewichtstrend' },
    { name: 'height', label: 'Höhe (px)', type: 'number', default: 200 },
    { name: 'showGoal', label: 'Ziel zeigen', type: 'boolean', default: true },
    { name: 'showHide', label: '„Werte ausblenden“ anbieten', type: 'boolean', default: true },
  ],
  data: [
    { slot: 'log', label: 'Gewichtsverlauf', default: 'log', shape: '{date,kg}[]', required: true },
    { slot: 'summary', label: 'Zusammenfassung', default: 'summary', shape: '{goalKg,startKg,progress,weekDeltaKg}' },
  ],
  events: ['body.range', 'body.hide', 'chart.point'],
  states: ['empty'],
  css: `${CHART_CSS}
  .tk-wt { display:flex; flex-direction:column; gap:var(--tk-space-4); } .tk-wt__stats { display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:var(--tk-space-3); }
  .tk-wt__note { display:flex; gap:8px; align-items:flex-start; color:var(--tk-c-text-muted); font-size:var(--tk-fs-sm); } .tk-wt__note .icon { margin-top:2px; color:var(--tk-c-info); flex:none; }`,
  example: { data: { log: [{ date: '2026-11-01', kg: 79.2 }, { date: '2026-11-08', kg: 79.0 }, { date: '2026-11-14', kg: 78.8 }, { date: '2026-11-20', kg: 78.3 }, { date: '2026-11-24', kg: 78.4 }], summary: { goalKg: 77, startKg: 80, weekDeltaKg: -0.3 } } },
  render: function WeightTrend({ props, data, ctx }) {
    const [range, setRange] = useState('3 Monate');
    const log = [...(data.log || [])].sort((a, b) => (a.date < b.date ? -1 : 1));
    if (!log.length) return html`<${Card} title=${props.title}><${EmptyState} icon="scale" title="Noch keine Werte" text="Trage dein Gewicht ein – schon wenige Werte pro Woche zeigen einen Trend." /><//>`;
    const hide = weightHidden(ctx); const today = isoDay(ctx.today); const all = trendOf(log);
    const from = isoDay(addDays(ctx.today, range === '4 Wochen' ? -28 : -90)); const pts = all.filter((p) => p.date >= from);
    const now = all.at(-1); const wk = all.filter((p) => p.date <= addDaysIso(now.date, -7)).at(-1); const delta = wk ? r1((now.trend - wk.trend) * 10) / 10 : null;
    const goal = data.summary?.goalKg; const start = data.summary?.startKg; const prog = goal && start ? Math.max(0, Math.min(1, (start - now.trend) / (start - goal))) : null;
    const gap = diffDays(today, now.date); const v = (k) => hideVal(ctx, `${num(k, 1)} kg`);
    const toggle = props.showHide && html`<${Toggle} checked=${hide} label="Werte ausblenden" onChange=${(on) => { setWeightHidden(ctx, on); ctx.emit('body.hide', { hidden: on }); }} />`;
    return html`<${Card} title=${props.title} icon="scale" actions=${html`<${Segmented} label="Zeitraum" value=${range} onChange=${(r) => { setRange(r); ctx.emit('body.range', { range: r }); }} options=${['4 Wochen', '3 Monate'].map((r) => ({ value: r, label: r }))} />`}><div class="tk-wt" data-qa="weight-trend">
      <div class="tk-wt__stats"><div class="tk-fit-stat"><span>Trend</span><strong>${hide ? '•••' : num(now.trend, 1)}<small>${hide ? '' : ' kg'}</small></strong></div>
        <div class="tk-fit-stat"><span>Letzte 7 Tage</span><strong>${hide || delta == null ? '•••' : `${delta > 0 ? '+' : delta < 0 ? '−' : '±'}${num(Math.abs(delta), 1)}`}<small>${hide ? '' : ' kg'}</small></strong></div>
        <div class="tk-fit-stat"><span>Zum Ziel</span><strong>${hide || !goal ? '•••' : num(Math.max(0, now.trend - goal), 1)}<small>${hide ? '' : ' kg'}</small></strong></div></div>
      ${props.showGoal && prog != null && html`<div class="tk-col" style="gap:6px"><div class="tk-row" style="justify-content:space-between;font-size:var(--tk-fs-sm)"><span class="tk-muted">Weg zum Zielgewicht</span><span class="tk-num">${hide ? '••' : `${num(prog * 100)} %`}</span></div><${Progress} value=${hide ? 0.5 : prog} /></div>`}
      <${LineChart} height=${props.height} label="Gewichtsverlauf mit Trend" labels=${pts.map((p) => dateShort(p.date))} xs=${pts.map((p) => diffDays(p.date, pts[0].date))}
        lines=${[{ values: pts.map((p) => p.kg), dots: true, width: 0, dim: true, tone: 'neutral', r: 2.4 }, { values: pts.map((p) => p.trend), tone: 'accent', width: 3 }]} goal=${props.showGoal && !hide ? goal : undefined} goalLabel=${goal ? `Ziel ${num(goal, 1)} kg` : ''} fmt=${(t) => (hide ? '' : num(t, 1))}
        tip=${(i) => html`<span><strong>${dayShort(pts[i].date)}</strong>${hide ? '' : ` · ${num(pts[i].kg, 1)} kg · Trend ${num(pts[i].trend, 1)} kg`}</span>`} onPoint=${(i) => ctx.emit('chart.point', { date: pts[i].date })} />
      <div class="tk-wt__note"><${Icon} name="info" size=${15} /><span>Der Trend glättet Tagesschwankungen – 1 bis 2 kg Unterschied von Tag zu Tag sind normal (Wasser, Salz, Verdauung).${gap > 14 ? ' Die letzte Messung ist schon etwas her – ein neuer Wert hilft dem Trend, ganz ohne Eile.' : ''}</span></div>
      <div class="tk-row" style="justify-content:space-between;flex-wrap:wrap;gap:8px">${toggle}<span class="tk-subtle" style="font-size:var(--tk-fs-xs)">Letzter Wert: ${v(now.kg)} am ${dateShort(now.date)}</span></div></div><//>`;
  },
};
export default [weightTrend];
