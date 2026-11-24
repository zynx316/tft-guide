// Trading: Wertentwicklung – Depot gegen Vergleichsindex (gleiche Einzahlungen), Rendite und Kennzahlen. Alles Modellrechnung auf Demo-Daten.
import { html } from '../../../lib/html.js';
import { useState, useRef, useEffect } from 'preact/hooks';
import { Card, EmptyState, Segmented } from '../../ui.js';
import { money, percent } from '../../helpers.js';
import { fmtPercent } from '../../../lib/format.js';
import { dayDiff, toDate } from '../../../lib/date.js';
import { cagr } from '../../../core/finmath.js';
import { holdings, dividendPlan, buildLedger, arr, obj, sum } from './_calc.js';
import { slots, Stat, Gain, Note, TRD_CSS } from './_trd.js';
import { ex } from './_example.js';

/** Vergleichsindex mit denselben Einzahlungen: Startwert = Depotwert zu Beginn, danach Indexrendite plus Einzahlung. */
export function compare(history, bench) {
  const dep = arr(obj(arr(history.series)[0]).values), inv = arr(obj(arr(history.series)[1]).values), lv = arr(obj(bench).values);
  if (dep.length < 2 || lv.length !== dep.length) return null;
  const idx = [dep[0]]; for (let i = 1; i < dep.length; i++) idx.push(idx[i - 1] * (lv[i] / lv[i - 1]) + ((inv[i] ?? inv[i - 1]) - (inv[i - 1] ?? 0)));
  const contrib = (inv[inv.length - 1] ?? 0) - (inv[0] ?? 0), gain = (v) => v[v.length - 1] - v[0] - contrib;
  return { labels: arr(history.labels), dep, inv, idx, depGain: gain(dep), idxGain: gain(idx), depPct: gain(dep) / dep[0], idxPct: gain(idx) / dep[0], contrib };
}

function Chart({ c, mode, ctx, name }) {
  const box = useRef(null), [w, setW] = useState(600), [hv, setHv] = useState(null);
  useEffect(() => { const el = box.current; if (!el) return undefined; const m = () => setW(Math.max(240, Math.round(el.getBoundingClientRect().width))); m(); const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(m) : null; ro && ro.observe(el); return () => ro && ro.disconnect(); }, []);
  const ret = (v) => v.map((x, i) => (c.inv[i] ? (x - c.inv[i]) / c.inv[i] : 0));
  const S = mode === 'return' ? [['Depot', ret(c.dep), 'var(--tk-c-accent)', ''], [name, ret(c.idx), 'var(--tk-chart-4)', '5 4']] : [['Depot', c.dep, 'var(--tk-c-accent)', ''], [name, c.idx, 'var(--tk-chart-4)', '5 4'], ['Eingezahlt', c.inv, 'var(--tk-c-text-subtle)', '2 4']];
  const H = ctx.bp === 'mobile' ? 190 : 240, P = { l: 6, r: mode === 'return' ? 46 : 54, t: 10, b: 22 }, n = c.dep.length, all = S.flatMap((s) => s[1]), lo = Math.min(...all), hi = Math.max(...all), pad = (hi - lo) * 0.1 || 1;
  const x = (i) => P.l + (i / (n - 1)) * (w - P.l - P.r), y = (v) => P.t + (1 - (v - (lo - pad)) / (hi - lo + 2 * pad)) * (H - P.t - P.b);
  const ticks = [0, 1, 2, 3].map((k) => lo - pad + ((hi - lo + 2 * pad) * k) / 3), fmtT = (v) => (ctx.privacy ? '••' : mode === 'return' ? fmtPercent(v, { digits: 0 }) : v >= 1000 ? `${Math.round(v / 1000)} Tsd.` : Math.round(v));
  const at = (e) => { const r = e.currentTarget.getBoundingClientRect(); return Math.max(0, Math.min(n - 1, Math.round(((e.clientX - r.left) / r.width * w - P.l) / ((w - P.l - P.r) / (n - 1))))); };
  const val = (s, i) => (mode === 'return' ? percent(ctx, s[1][i], { digits: 1 }) : money(ctx, s[1][i], { digits: 0 }));
  return html`<div><div class="tk-trd-pf__tip" aria-live="polite">${hv != null ? html`<strong>${c.labels[hv]}</strong>${S.map((s) => html`<span><i style=${`background:${s[2]}`}></i>${s[0]} <strong>${val(s, hv)}</strong></span>`)}` : S.map((s) => html`<span><i style=${`background:${s[2]}`}></i>${s[0]}</span>`)}</div>
    <div ref=${box} style="position:relative;touch-action:pan-y"><svg width=${w} height=${H} viewBox=${`0 0 ${w} ${H}`} tabindex="0" role="img" aria-label=${`Wertentwicklung ${c.labels[0]} bis ${c.labels[n - 1]}: Depot, ${name}${mode === 'return' ? ', Rendite in Prozent' : ' und Einzahlungen'}. Pfeiltasten wählen einen Monat.`}
      onPointerMove=${(e) => setHv(at(e))} onPointerLeave=${() => setHv(null)} onClick=${(e) => setHv(at(e))} onKeyDown=${(e) => { if (e.key === 'ArrowRight') setHv(Math.min(n - 1, (hv ?? -1) + 1)); else if (e.key === 'ArrowLeft') setHv(Math.max(0, (hv ?? n) - 1)); else if (e.key === 'Escape') setHv(null); }}>
      ${ticks.map((t) => html`<g><line x1=${P.l} x2=${w - P.r} y1=${y(t)} y2=${y(t)} stroke="var(--tk-c-border)" stroke-dasharray="3 4" /><text x=${w - P.r + 6} y=${y(t) + 4} fill="var(--tk-c-text-subtle)" style="font-size:11px">${fmtT(t)}</text></g>`)}
      ${S.map((s, k) => html`<path d=${s[1].map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('')} fill="none" stroke=${s[2]} stroke-width=${k === 0 ? 2.5 : 1.8} stroke-dasharray=${s[3]} stroke-linejoin="round" stroke-linecap="round" />`)}
      ${[0, Math.floor((n - 1) / 2), n - 1].map((i) => html`<text x=${Math.max(16, Math.min(w - P.r - 10, x(i)))} y=${H - 6} text-anchor="middle" fill="var(--tk-c-text-subtle)" style="font-size:11px">${c.labels[i]}</text>`)}
      ${hv != null && html`<g><line x1=${x(hv)} x2=${x(hv)} y1=${P.t} y2=${H - P.b} stroke="var(--tk-c-text-subtle)" stroke-dasharray="4 3" />${S.map((s) => html`<circle cx=${x(hv)} cy=${y(s[1][hv])} r="4" fill=${s[2]} stroke="var(--tk-c-surface)" stroke-width="2" />`)}</g>`}</svg></div></div>`;
}

export const trdPerformance = {
  id: 'trd-performance',
  name: 'Wertentwicklung',
  category: 'Trading',
  description: 'Depot gegen einen Vergleichsindex, der dieselben Einzahlungen erhalten hätte (Wert in Euro oder Rendite in Prozent), dazu Kennzahlen: Gewinn seit Kauf, Wertzuwachs 12 Monate, Dividenden, realisierte Gewinne und Rendite pro Jahr der Einzelaktien. Modellrechnung auf Demo-Daten.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Wertentwicklung' },
    { name: 'part', label: 'Umfang', type: 'select', options: ['both', 'chart', 'kpis'], default: 'both' },
    { name: 'mode', label: 'Start-Ansicht', type: 'select', options: ['value', 'return'], default: 'value' },
  ],
  data: slots('positions', 'cash', 'history', 'benchmark', 'dividends', 'trades', 'instruments', 'allowance', 'watchlist'),
  events: ['perf.mode', 'perf.point', 'security.open'],
  states: ['empty'],
  css: `${TRD_CSS}
  .tk-trd-pf { display:flex; flex-direction:column; gap:var(--tk-space-5); min-width:0; } .tk-trd-pf__tip { min-height:38px; display:flex; flex-wrap:wrap; gap:2px 16px; align-items:center; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); font-variant-numeric:tabular-nums; margin-bottom:4px; }
  .tk-trd-pf__tip i { display:inline-block; width:10px; height:3px; border-radius:2px; margin-right:6px; vertical-align:middle; } .tk-trd-pf__tip strong { color:var(--tk-c-text); }
  .tk-trd-pf__pa { display:grid; grid-template-columns:minmax(0,1fr) auto auto; gap:6px 16px; align-items:center; font-size:var(--tk-fs-sm); font-variant-numeric:tabular-nums; } .tk-trd-pf__pa > :nth-child(3n+2), .tk-trd-pf__pa > :nth-child(3n) { text-align:right; }`,
  example: { data: ex('positions', 'cash', 'history', 'benchmark', 'dividends', 'trades', 'instruments', 'allowance', 'watchlist') },
  render: function TrdPerformance({ props, data, ctx }) {
    const [mode, setMode] = useState(props.mode), hd = holdings(data.positions, data.cash), c = compare(obj(data.history), data.benchmark);
    if (!hd.rows.length || !c) return html`<${Card} title=${props.title} icon="line-chart"><${EmptyState} icon="line-chart" title="Noch keine Entwicklung" text="Sobald das Depot Positionen und einen Verlauf hat, vergleicht TAKT es mit einem Index." /><//>`;
    const dv = dividendPlan(data.dividends, data.positions, ctx.today, data.allowance), led = buildLedger({ ...data, orders: [], transactions: [], plans: [] }, ctx.today, data.allowance);
    const realized = sum(led.filter((e) => e.kind === 'sell' && e.date.startsWith(String(ctx.today.getFullYear()))), (e) => e.gain), diff = c.depPct - c.idxPct, name = obj(data.benchmark).name || 'Index';
    const single = hd.rows.map((r) => { const t = arr(data.trades).find((x) => x.securityId === r.id && x.side === 'buy'); const yrs = t ? dayDiff(toDate(t.date), ctx.today) / 365.25 : 0; return t && yrs > 0.5 ? { r, pa: cagr(r.cost, r.value, yrs), yrs } : null; }).filter(Boolean);
    const chart = html`<div><div class="tk-trd-row" style="justify-content:space-between;flex-wrap:wrap;margin-bottom:8px"><${Segmented} label="Darstellung" value=${mode} onChange=${(v) => { setMode(v); ctx.emit('perf.mode', { mode: v }); }} options=${[{ value: 'value', label: 'Wert in €' }, { value: 'return', label: 'Rendite in %' }]} />
      <span class="tk-trd-meta">Index mit denselben Einzahlungen: ${name}</span></div><${Chart} c=${c} mode=${mode} ctx=${ctx} name=${name} /></div>`;
    const kpis = html`<div class="tk-trd-stats"><${Stat} label="Gewinn seit Kauf"><${Gain} ctx=${ctx} v=${hd.gain} pct=${hd.gainPct} digits=${0} /><//>
      <${Stat} label="Wertzuwachs 12 Monate" sub="bezogen auf den Startwert"><${Gain} ctx=${ctx} v=${c.depGain} pct=${c.depPct} digits=${0} /><//>
      <${Stat} label=${`Gegenüber ${name}`} sub=${`Index: ${percent(ctx, c.idxPct)}`}>${percent(ctx, diff, { pp: true })}<//>
      <${Stat} label="Dividenden 2026">${money(ctx, dv.paidSum)}<//><${Stat} label="Realisiert 2026">${money(ctx, realized, { sign: true })}<//></div>
      ${single.length > 0 && html`<div><div class="tk-trd-cap" style="margin-bottom:6px">Rendite pro Jahr, Einzelaktien (vereinfacht, seit dem Kauf)</div><div class="tk-trd-pf__pa">${single.map((s) => html`<span class="tk-trd-title">${s.r.short || s.r.name}</span><span class="tk-trd-meta">${s.yrs.toFixed(1).replace('.', ',')} Jahre</span><strong class="tk-trd-num">${percent(ctx, s.pa)} p. a.</strong>`)}</div></div>`}`;
    return html`<${Card} title=${props.title} icon="line-chart"><div class="tk-trd-pf">${props.part !== 'kpis' && chart}${props.part !== 'chart' && kpis}
      <${Note} icon="info">Modellrechnung auf fiktiven Demo-Daten: Der Index ist erfunden, Kosten und Steuern sind nicht enthalten. Die Wertentwicklung der Vergangenheit ist kein verlässlicher Indikator für die Zukunft.<//></div><//>`;
  },
};
export default [trdPerformance];
