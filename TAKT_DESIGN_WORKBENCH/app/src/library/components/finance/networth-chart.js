// Finanzen: Vermögensverlauf als gestapelte Fläche (Liquidität, Rücklagen, Depot) mit Zeitraum und Punktauswahl.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Chip, EmptyState, toneColor } from '../../ui.js';
import { wealth, arr, r2 } from './_calc.js';
import { slots, pctx, eur, eur0 } from './_fin.js';
import { fmtPercent } from '../../../lib/format.js';
import { ex } from './_example.js';

const PX = 8, PT = 12, PB = 24;
const TONES = [1, 3, 4];

export const finNetworthChart = {
  id: 'fin-networth-chart',
  name: 'Vermögensverlauf',
  category: 'Finanzen',
  description: 'Verlauf des Gesamtvermögens über 6 oder 12 Monate, gestapelt nach Liquidität, Rücklagen und Depot. Punkt antippen zeigt die Aufteilung des Monats; der letzte Punkt folgt den aktuellen Kontoständen.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Vermögensverlauf' },
    { name: 'range', label: 'Zeitraum (Monate)', type: 'select', options: ['6', '12'], default: '12' },
    { name: 'showRange', label: 'Zeitraum wählbar', type: 'boolean', default: true },
    { name: 'height', label: 'Höhe (px)', type: 'number', default: 220 },
  ],
  data: [...slots('accounts', 'prefs'), { slot: 'history', label: 'Vermögensverlauf', default: 'history', shape: '{labels:string[],series:[{name,values:number[]}]}', required: false }],
  events: ['networth.point', 'networth.range'],
  states: ['empty'],
  css: `
  .tk-fnn svg { display:block; width:100%; height:auto; overflow:visible; } .tk-fnn__legend { display:flex; flex-wrap:wrap; gap:6px 14px; margin-top:var(--tk-space-3); font-size:var(--tk-fs-xs); color:var(--tk-c-text-muted); } .tk-fnn__legend span { display:inline-flex; align-items:center; gap:6px; } .tk-fnn__legend i { width:10px; height:10px; border-radius:3px; }
  .tk-fnn__head { display:flex; justify-content:space-between; align-items:flex-end; gap:12px; flex-wrap:wrap; margin-bottom:var(--tk-space-3); }
  .tk-fnn__hit { fill:transparent; cursor:pointer; }
  .tk-fnn__tip { display:grid; grid-template-columns:repeat(auto-fit, minmax(110px, 1fr)); gap:8px; padding:var(--tk-space-3); border-radius:var(--tk-radius-md); background:var(--tk-c-surface2); border:1px solid var(--tk-c-border); margin-top:var(--tk-space-3); }
  .tk-fnn__tip strong { display:block; font-variant-numeric:tabular-nums; white-space:nowrap; }`,
  example: { data: ex('accounts', 'history', 'prefs') },
  render: function FinNetworthChart({ props, data, ctx }) {
    const W = ctx.bp === 'mobile' ? 340 : 640, c = pctx(ctx, data), hist = data.history || {}, labels = arr(hist.labels), series = arr(hist.series);
    const [range, setRange] = useState(String(props.range));
    const [pick, setPick] = useState(null);
    if (!labels.length || !series.length) return html`<${Card} title=${props.title} icon="trending-up"><${EmptyState} icon="trending-up" title="Noch kein Verlauf" text="Nach dem ersten Monat mit Kontoständen erscheint hier dein Vermögensverlauf." /><//>`;
    const n = Math.min(Number(range), labels.length), from = labels.length - n;
    const live = wealth(data.accounts);
    // letzter Punkt = aktuelle Kontostände
    const vals = series.map((s, si) => s.values.slice(from).map((v, i, a) => (i === a.length - 1 ? [live.groups[0].value - live.debt, live.groups[1].value, live.groups[2].value][si] ?? v : v)));
    const totals = labels.slice(from).map((_, i) => r2(vals.reduce((s, v) => s + v[i], 0)));
    const max = Math.max(...totals) * 1.05, min = 0, h = props.height, x = (i) => PX + (i / Math.max(1, n - 1)) * (W - 2 * PX), y = (v) => PT + (1 - (v - min) / (max - min || 1)) * (h - PT - PB);
    const cum = vals.map((_, si) => vals[0].map((__, i) => vals.slice(0, si + 1).reduce((s, v) => s + v[i], 0)));
    const area = (si) => { const top = cum[si].map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(''); const bot = (si ? cum[si - 1] : cum[si].map(() => 0)).map((v, i) => `L${x(n - 1 - i).toFixed(1)},${y((si ? cum[si - 1] : cum[si].map(() => 0))[n - 1 - i]).toFixed(1)}`).join(''); return `${top}${bot}Z`; };
    const idx = pick == null ? n - 1 : Math.min(pick, n - 1), lbl = labels.slice(from);
    const delta = totals[n - 1] - totals[0], rel = totals[0] ? delta / totals[0] : 0;
    const setR = (r) => { setRange(r); ctx.emit('networth.range', { range: r }); };
    return html`<${Card} title=${props.title} icon="trending-up" actions=${props.showRange && html`<div style="display:flex;gap:6px"><${Chip} active=${range === '6'} onClick=${() => setR('6')}>6 Monate<//><${Chip} active=${range === '12'} onClick=${() => setR('12')}>12 Monate<//></div>`}><div class="tk-fnn">
      <div class="tk-fnn__head"><div><div class="tk-fn-cap">Vermögen heute</div><div class="tk-fn-big">${eur0(c, totals[n - 1])}</div></div><div class="tk-fn-meta tk-fn-num">${eur0(c, delta, { sign: true })}${c.privacy ? '' : ` (${fmtPercent(rel, { digits: 1, sign: true })})`} seit ${lbl[0]}</div></div>
      <svg viewBox=${`0 0 ${W} ${h}`} role="img" aria-label=${`Vermögensverlauf: von ${eur0(c, totals[0])} auf ${eur0(c, totals[n - 1])}`}>
        ${[0.25, 0.5, 0.75, 1].map((f) => html`<line x1=${PX} x2=${W - PX} y1=${y(max * f)} y2=${y(max * f)} stroke="var(--tk-c-border)" stroke-width="1" />`)}
        ${vals.map((_, si) => html`<path d=${area(si)} fill=${toneColor(TONES[si % 3])} opacity=".78" stroke="var(--tk-c-surface)" stroke-width="1" />`)}
        <line x1=${x(idx)} x2=${x(idx)} y1=${PT} y2=${h - PB} stroke="var(--tk-c-text)" stroke-width="1.5" stroke-dasharray="3 3" opacity=".7" />
        ${lbl.map((l, i) => (n <= 6 || i % 2 === (n - 1) % 2) && html`<text x=${x(i)} y=${h - 6} text-anchor="middle" fill="var(--tk-c-text-subtle)" font-size=${ctx.bp === 'mobile' ? 11 : 12}>${l}</text>`)}
        ${lbl.map((l, i) => html`<rect class="tk-fnn__hit" x=${x(i) - (W / n) / 2} y="0" width=${W / n} height=${h} onClick=${() => { setPick(i); ctx.emit('networth.point', { label: l }); }}><title>${l}: ${eur0(c, totals[i])}</title></rect>`)}</svg>
      <div class="tk-fnn__tip" aria-live="polite"><div><span class="tk-fn-cap">${lbl[idx]}</span><strong>${eur0(c, totals[idx])}</strong></div>${series.map((s, si) => html`<div><span class="tk-fn-sub" style="display:flex;gap:6px;align-items:center"><i style=${`width:9px;height:9px;border-radius:3px;background:${toneColor(TONES[si % 3])}`}></i>${s.name}</span><strong>${eur0(c, vals[si][idx])}</strong></div>`)}</div></div><//>`;
  },
};
export default [finNetworthChart];
