// Sparpläne – SVG-Diagramme: Wachstum (Einzahlungen, Ertrag, Spanne) und Mehrfach-Linien (Szenario-Vergleich).
// Tooltip per Tippen/Pfeiltasten, Achsenwerte über money() (Privatsphäre), Farben nur über Tokens.
import { html } from '../../../lib/html.js';
import { useState, useRef, useLayoutEffect } from 'preact/hooks';
import { toneColor } from '../../ui.js';
import { money } from '../../helpers.js';
import { fmtPercent } from '../../../lib/format.js';

function useWidth(dep) {
  const box = useRef(); const [W, setW] = useState(320);
  useLayoutEffect(() => {
    if (!box.current) return undefined;
    setW(Math.max(200, Math.round(box.current.getBoundingClientRect().width)));
    const ro = new ResizeObserver(([e]) => setW(Math.max(200, Math.round(e.contentRect.width)))); ro.observe(box.current);
    return () => ro.disconnect();
  }, [dep]);
  return [box, W];
}
const PAD = { l: 52, r: 12, t: 12, b: 24 };
const niceMax = (v) => { if (v <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))); const n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; };
const thin = (pts, max = 140) => { if (pts.length <= max) return pts; const k = Math.ceil(pts.length / max); return pts.filter((_, i) => i % k === 0 || i === pts.length - 1); };

/** Punkte: [{ m, invested, value, low?, high? }]; now = Index des Heute-Punkts (Rest ist Projektion). */
export function GrowthChart({ ctx, points, now, height = 240, label, xLabel = (m) => `${Math.round(m / 12)} J.`, bandLabel = 'Spanne', yearsStep, xTicks, compact }) {
  const [box, W] = useWidth(height); const [sel, setSel] = useState(null);
  if (!points?.length || points.length < 2) return null;
  const hasBand = points.some((p) => p.high != null);
  const maxV = niceMax(Math.max(...points.map((p) => Math.max(p.value, p.high ?? 0, p.invested))));
  const m0 = points[0].m, m1 = points[points.length - 1].m;
  const x = (m) => PAD.l + ((m - m0) / (m1 - m0 || 1)) * (W - PAD.l - PAD.r);
  const y = (v) => PAD.t + (1 - v / maxV) * (height - PAD.t - PAD.b);
  const P = thin(points);
  const line = (key, from = 0, to = P.length) => P.slice(from, to).map((p, i) => `${i ? 'L' : 'M'}${x(p.m).toFixed(1)},${y(p[key]).toFixed(1)}`).join('');
  const area = (top, bottom) => `${line(top)}${[...P].reverse().map((p) => `L${x(p.m).toFixed(1)},${y(bottom === 0 ? 0 : p[bottom]).toFixed(1)}`).join('')}Z`;
  const nowM = now != null ? points[now].m : null;
  const iNow = P.findIndex((p) => nowM != null && p.m >= nowM);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * maxV);
  const totalY = Math.max(1, (m1 - m0) / 12), stepY = yearsStep || (totalY > 30 ? 10 : totalY > 15 ? 5 : totalY > 6 ? 2 : 1);
  const xt = xTicks || []; if (!xTicks) for (let yr = 0; yr <= totalY + 0.01; yr += stepY) xt.push(m0 + yr * 12);
  const pick = (e) => { const r = e.currentTarget.getBoundingClientRect(); const rel = m0 + ((e.clientX - r.left - PAD.l) / (r.width - PAD.l - PAD.r)) * (m1 - m0); let b = 0; points.forEach((p, i) => { if (Math.abs(p.m - rel) < Math.abs(points[b].m - rel)) b = i; }); setSel(b); };
  const key = (e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); setSel((s) => Math.min(points.length - 1, Math.max(0, (s ?? points.length - 1) + (e.key === 'ArrowRight' ? 12 : -12)))); } };
  const s = sel != null ? points[sel] : null, last = points[points.length - 1];
  const tip = s || last;
  return html`<div class="tk-sv-chart" ref=${box}>
    <div class="tk-sv-chart__tip" aria-live="polite">
      <strong>${xLabel(tip.m)}</strong>
      <span><i style="background:var(--tk-c-text-subtle)"></i>Eingezahlt ${money(ctx, tip.invested, { digits: 0 })}</span>
      <span><i style="background:var(--tk-c-accent)"></i>Wert ${money(ctx, tip.value, { digits: 0 })}</span>
      ${tip.high != null && html`<span class="tk-sv-chart__band">${bandLabel} ${money(ctx, tip.low, { digits: 0 })} bis ${money(ctx, tip.high, { digits: 0 })}</span>`}
      ${!s && !compact && html`<em class="tk-subtle">Diagramm antippen für Details</em>`}</div>
    <svg viewBox=${`0 0 ${W} ${height}`} width=${W} height=${height} role="img" tabindex="0" onKeyDown=${key}
      aria-label=${label || `Wachstum: eingezahlt ${money(ctx, last.invested, { digits: 0 })}, Wert ${money(ctx, last.value, { digits: 0 })} nach ${xLabel(last.m)}`} style="display:block;overflow:visible;touch-action:pan-y">
      ${ticks.map((t) => html`<g><line x1=${PAD.l} x2=${W - PAD.r} y1=${y(t)} y2=${y(t)} stroke="var(--tk-c-border)" stroke-dasharray=${t ? '3 4' : undefined} />
        <text x=${PAD.l - 8} y=${y(t) + 4} text-anchor="end" fill="var(--tk-c-text-subtle)" style="font-size:11px">${money(ctx, t, { digits: 0, compact: true })}</text></g>`)}
      ${hasBand && html`<path d=${`${line('high')}${[...P].reverse().map((p) => `L${x(p.m).toFixed(1)},${y(p.low).toFixed(1)}`).join('')}Z`} fill="var(--tk-c-accent)" opacity=".13" />
        <path d=${line('high')} fill="none" stroke="var(--tk-c-accent)" stroke-width="1" stroke-dasharray="4 4" opacity=".7" /><path d=${line('low')} fill="none" stroke="var(--tk-c-accent)" stroke-width="1" stroke-dasharray="4 4" opacity=".7" />`}
      <path d=${area('value', 'invested')} fill="var(--tk-c-accent)" opacity=".16" />
      <path d=${area('invested', 0)} fill="var(--tk-c-text-subtle)" opacity=".16" />
      <path d=${line('invested')} fill="none" stroke="var(--tk-c-text-subtle)" stroke-width="1.75" stroke-linejoin="round" />
      ${iNow > 0 && iNow < P.length - 1
        ? html`<path d=${line('value', 0, iNow + 1)} fill="none" stroke="var(--tk-c-accent)" stroke-width="2.75" stroke-linejoin="round" stroke-linecap="round" />
          <path d=${line('value', iNow)} fill="none" stroke="var(--tk-c-accent)" stroke-width="2.75" stroke-dasharray="6 5" stroke-linecap="round" />
          <line x1=${x(nowM)} x2=${x(nowM)} y1=${PAD.t} y2=${height - PAD.b} stroke="var(--tk-c-border-strong)" /><text x=${x(nowM) + 5} y=${PAD.t + 10} fill="var(--tk-c-text-muted)" style="font-size:11px">Heute</text>`
        : html`<path d=${line('value')} fill="none" stroke="var(--tk-c-accent)" stroke-width="2.75" stroke-linejoin="round" stroke-linecap="round" />`}
      ${xt.map((m) => html`<text x=${x(m)} y=${height - 6} text-anchor=${m === m0 ? 'start' : m >= m1 - 0.5 ? 'end' : 'middle'} fill="var(--tk-c-text-subtle)" style="font-size:11px">${xLabel(m)}</text>`)}
      ${s && html`<g><line x1=${x(s.m)} x2=${x(s.m)} y1=${PAD.t} y2=${height - PAD.b} stroke="var(--tk-c-border-strong)" />
        <circle cx=${x(s.m)} cy=${y(s.value)} r="5" fill="var(--tk-c-accent)" stroke="var(--tk-c-surface)" stroke-width="2" /><circle cx=${x(s.m)} cy=${y(s.invested)} r="4" fill="var(--tk-c-text-subtle)" stroke="var(--tk-c-surface)" stroke-width="2" /></g>`}
      <rect x=${PAD.l} y="0" width=${W - PAD.l - PAD.r} height=${height} fill="transparent" style="cursor:crosshair" onClick=${pick} onMouseMove=${pick} />
    </svg></div>`;
}

/** Legende zum Wachstumsdiagramm (Form + Text, nie nur Farbe). */
export const GrowthLegend = ({ band, bandText = 'Spanne', projected }) => html`<div class="tk-sv-legend" aria-hidden="true">
  <span><i class="tk-sv-legend__a"></i>Eingezahlt</span><span><i class="tk-sv-legend__b"></i>Wert (Annahme)</span>${band && html`<span><i class="tk-sv-legend__c"></i>${bandText}</span>`}${projected && html`<span><i class="tk-sv-legend__d"></i>Projektion</span>`}</div>`;

/** Mehrere Linien (Szenarien): lines [{ name, tone, points:[{m,value}] }]. */
export function LinesChart({ ctx, lines, height = 240, label, xLabel = (m) => `${Math.round(m / 12)} J.` }) {
  const [box, W] = useWidth(height); const [sel, setSel] = useState(null);
  const all = lines.flatMap((l) => l.points);
  if (!all.length) return null;
  const maxV = niceMax(Math.max(...all.map((p) => p.value))), m1 = Math.max(...all.map((p) => p.m));
  const x = (m) => PAD.l + (m / (m1 || 1)) * (W - PAD.l - PAD.r), y = (v) => PAD.t + (1 - v / maxV) * (height - PAD.t - PAD.b);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * maxV), totalY = m1 / 12, step = totalY > 30 ? 10 : totalY > 15 ? 5 : totalY > 6 ? 2 : 1;
  const xt = []; for (let yr = 0; yr <= totalY + 0.01; yr += step) xt.push(yr * 12);
  const pick = (e) => { const r = e.currentTarget.getBoundingClientRect(); setSel(Math.max(0, Math.min(m1, Math.round((((e.clientX - r.left - PAD.l) / (r.width - PAD.l - PAD.r)) * m1) / 12) * 12))); };
  const at = (l, m) => (l.points.find((p) => p.m >= m) || l.points[l.points.length - 1]).value;
  const showM = sel ?? m1;
  return html`<div class="tk-sv-chart" ref=${box}>
    <div class="tk-sv-chart__tip" aria-live="polite"><strong>${xLabel(showM)}</strong>${lines.map((l) => html`<span><i style=${`background:${toneColor(l.tone)}`}></i>${l.name} ${money(ctx, at(l, showM), { digits: 0 })}</span>`)}</div>
    <svg viewBox=${`0 0 ${W} ${height}`} width=${W} height=${height} role="img" aria-label=${label || 'Vergleich der Szenarien'} style="display:block;overflow:visible;touch-action:pan-y">
      ${ticks.map((t) => html`<g><line x1=${PAD.l} x2=${W - PAD.r} y1=${y(t)} y2=${y(t)} stroke="var(--tk-c-border)" stroke-dasharray=${t ? '3 4' : undefined} /><text x=${PAD.l - 8} y=${y(t) + 4} text-anchor="end" fill="var(--tk-c-text-subtle)" style="font-size:11px">${money(ctx, t, { digits: 0, compact: true })}</text></g>`)}
      ${lines.map((l, i) => html`<path d=${thin(l.points).map((p, k) => `${k ? 'L' : 'M'}${x(p.m).toFixed(1)},${y(p.value).toFixed(1)}`).join('')} fill="none" stroke=${toneColor(l.tone)} stroke-width="2.5" stroke-linejoin="round" stroke-dasharray=${i % 3 === 1 ? '7 4' : i % 3 === 2 ? '2 4' : undefined} />`)}
      ${xt.map((m) => html`<text x=${x(m)} y=${height - 6} text-anchor=${m === 0 ? 'start' : m >= m1 - 0.5 ? 'end' : 'middle'} fill="var(--tk-c-text-subtle)" style="font-size:11px">${xLabel(m)}</text>`)}
      ${sel != null && html`<line x1=${x(sel)} x2=${x(sel)} y1=${PAD.t} y2=${height - PAD.b} stroke="var(--tk-c-border-strong)" />`}
      <rect x=${PAD.l} y="0" width=${W - PAD.l - PAD.r} height=${height} fill="transparent" style="cursor:crosshair" onClick=${pick} onMouseMove=${pick} />
    </svg></div>`;
}

export const CHART_CSS = `
  .tk-sv-chart { min-width:0; width:100%; }
  .tk-sv-chart__tip { display:flex; flex-wrap:wrap; align-items:center; gap:4px 14px; min-height:24px; margin-bottom:6px; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); }
  .tk-sv-chart__tip strong { color:var(--tk-c-text); font-variant-numeric:tabular-nums; }
  .tk-sv-chart__tip span { display:inline-flex; align-items:center; gap:6px; font-variant-numeric:tabular-nums; }
  .tk-sv-chart__tip i { width:10px; height:10px; border-radius:3px; display:inline-block; flex:none; }
  .tk-sv-chart__tip em { font-style:normal; font-size:var(--tk-fs-xs); }
  .tk-sv-chart svg:focus-visible { outline:2px solid var(--tk-c-focus); outline-offset:2px; border-radius:4px; }
  .tk-sv-legend { display:flex; flex-wrap:wrap; gap:6px 16px; margin-top:8px; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); }
  .tk-sv-legend span { display:inline-flex; align-items:center; gap:6px; }
  .tk-sv-legend i { display:inline-block; width:18px; height:0; border-top:3px solid var(--tk-c-text-subtle); border-radius:2px; }
  .tk-sv-legend__b { border-top-color:var(--tk-c-accent) !important; }
  .tk-sv-legend__c { height:10px !important; border:1px dashed var(--tk-c-accent) !important; background:var(--tk-c-accent-soft); border-radius:3px !important; }
  .tk-sv-legend__d { border-top:3px dashed var(--tk-c-accent) !important; }
`;
export const rateText = (r) => fmtPercent(r, { digits: 1 });
