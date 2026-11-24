// Fitness: schlanke SVG-Diagramme (Linie mit Trend/Band/Zielwert, Balken mit Zielwert) mit Tooltip per Tippen.
import { html } from '../../../lib/html.js';
import { useState, useRef, useLayoutEffect } from 'preact/hooks';
import { toneColor } from '../../ui.js';

function useWidth(dep) {
  const box = useRef(); const [W, setW] = useState(320);
  useLayoutEffect(() => {
    if (!box.current) return undefined;
    setW(Math.max(180, Math.round(box.current.getBoundingClientRect().width)));
    const ro = new ResizeObserver(([e]) => setW(Math.max(180, Math.round(e.contentRect.width)))); ro.observe(box.current); return () => ro.disconnect();
  }, [dep]);
  return [box, W];
}
const niceRange = (vals, pad = 0.08) => { const lo = Math.min(...vals), hi = Math.max(...vals), d = hi - lo || 1; return [lo - d * pad, hi + d * pad]; };

/** lines: [{values:(number|null)[], tone, dots, dim, width, dashed}], xs: optionale numerische x-Positionen. */
export function LineChart({ labels = [], lines = [], xs, height = 180, yMin, yMax, band, goal, goalLabel, tip, label = 'Diagramm', fmt = (v) => String(v), onPoint, xLabels = 4 }) {
  const [box, W] = useWidth(height); const [sel, setSel] = useState(null);
  const all = lines.flatMap((l) => l.values.filter((v) => v != null)).concat(band ? [band[0], band[1]] : [], goal != null ? [goal] : []);
  if (!all.length) return null;
  const [lo0, hi0] = niceRange(all); const lo = yMin ?? lo0, hi = yMax ?? hi0;
  const P = { l: 40, r: 10, t: 10, b: 22 }; const n = labels.length || lines[0].values.length;
  const px = xs || Array.from({ length: n }, (_, i) => i); const x0 = Math.min(...px), x1 = Math.max(...px) || 1;
  const x = (i) => P.l + ((px[i] - x0) / (x1 - x0 || 1)) * (W - P.l - P.r); const y = (v) => P.t + (1 - (v - lo) / (hi - lo || 1)) * (height - P.t - P.b);
  const ticks = [0, 0.5, 1].map((t) => lo + t * (hi - lo));
  const pick = (e) => { const r = e.currentTarget.getBoundingClientRect(); const rel = ((e.clientX - r.left) / r.width) * W; let b = 0; for (let i = 0; i < n; i++) if (Math.abs(x(i) - rel) < Math.abs(x(b) - rel)) b = i; setSel(b); onPoint && onPoint(b); };
  const path = (l) => { let d = '', pen = false; l.values.forEach((v, i) => { if (v == null) { pen = false; return; } d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`; pen = true; }); return d; };
  const step = Math.max(1, Math.ceil(n / xLabels));
  return html`<div class="tk-fit-chart" ref=${box}>
    <div class="tk-fit-chart__tip" aria-live="polite">${sel != null && tip ? tip(sel) : html`<span class="tk-subtle">Punkt antippen für Details</span>`}</div>
    <svg viewBox=${`0 0 ${W} ${height}`} width=${W} height=${height} role="img" aria-label=${label} style="display:block;overflow:visible;touch-action:pan-y">
      ${ticks.map((t) => html`<g><line x1=${P.l} x2=${W - P.r} y1=${y(t)} y2=${y(t)} stroke="var(--tk-c-border)" stroke-dasharray="3 4" /><text x=${P.l - 6} y=${y(t) + 4} text-anchor="end" fill="var(--tk-c-text-subtle)" style="font-size:11px">${fmt(t)}</text></g>`)}
      ${band && html`<rect x=${P.l} y=${y(band[1])} width=${W - P.l - P.r} height=${Math.max(2, y(band[0]) - y(band[1]))} fill="var(--tk-c-success)" opacity=".10" />`}
      ${goal != null && html`<g><line x1=${P.l} x2=${W - P.r} y1=${y(goal)} y2=${y(goal)} stroke="var(--tk-c-success)" stroke-width="1.5" stroke-dasharray="6 4" />${goalLabel && html`<text x=${W - P.r} y=${y(goal) - 5} text-anchor="end" fill="var(--tk-c-text-muted)" style="font-size:11px">${goalLabel}</text>`}</g>`}
      ${lines.map((l) => html`<g opacity=${l.dim ? 0.55 : 1}>${l.width !== 0 && html`<path d=${path(l)} fill="none" stroke=${toneColor(l.tone || 'accent')} stroke-width=${l.width || 2.5} stroke-linejoin="round" stroke-linecap="round" stroke-dasharray=${l.dashed ? '5 4' : undefined} />`}
        ${l.dots && l.values.map((v, i) => v != null && html`<circle cx=${x(i)} cy=${y(v)} r=${l.r || 2.6} fill=${toneColor(l.tone || 'accent')} />`)}</g>`)}
      ${sel != null && lines.map((l) => l.values[sel] != null && html`<circle cx=${x(sel)} cy=${y(l.values[sel])} r="5" fill=${toneColor(l.tone || 'accent')} stroke="var(--tk-c-surface)" stroke-width="2" />`)}
      ${labels.map((lb, i) => (i % step === 0 || i === n - 1) && html`<text x=${x(i)} y=${height - 4} text-anchor=${i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'} fill="var(--tk-c-text-subtle)" style="font-size:11px">${lb}</text>`)}
      <rect x=${P.l} y="0" width=${W - P.l - P.r} height=${height} fill="transparent" style="cursor:pointer" onClick=${pick} onMouseMove=${pick} />
    </svg></div>`;
}

/** Balken mit optionaler Zielmarke; hl = hervorgehobene Indizes (z. B. heutiger Teiltag). */
export function BarChart({ labels = [], values = [], goal, height = 150, tone = 'accent', tip, label = 'Diagramm', fmt = (v) => String(v), partial = [], band }) {
  const [box, W] = useWidth(height); const [sel, setSel] = useState(null);
  const n = values.length; if (!n) return null;
  const max = Math.max(...values, goal || 0, band ? band[1] : 0) * 1.12 || 1; const P = { l: 40, r: 6, t: 8, b: 22 };
  const slot = (W - P.l - P.r) / n, bw = Math.min(26, slot * 0.68); const y = (v) => P.t + (1 - v / max) * (height - P.t - P.b);
  const ticks = [0, 0.5, 1].map((t) => t * max); const step = Math.max(1, Math.ceil(n / Math.max(3, Math.floor((W - P.l) / 46))));
  return html`<div class="tk-fit-chart" ref=${box}>
    <div class="tk-fit-chart__tip" aria-live="polite">${sel != null && tip ? tip(sel) : html`<span class="tk-subtle">Balken antippen für Details</span>`}</div>
    <svg viewBox=${`0 0 ${W} ${height}`} width=${W} height=${height} role="img" aria-label=${label} style="display:block;overflow:visible">
      ${ticks.map((t) => html`<g><line x1=${P.l} x2=${W - P.r} y1=${y(t)} y2=${y(t)} stroke="var(--tk-c-border)" stroke-dasharray="3 4" /><text x=${P.l - 6} y=${y(t) + 4} text-anchor="end" fill="var(--tk-c-text-subtle)" style="font-size:11px">${fmt(t)}</text></g>`)}
      ${band && html`<rect x=${P.l} y=${y(band[1])} width=${W - P.l - P.r} height=${y(band[0]) - y(band[1])} fill="var(--tk-c-success)" opacity=".10" />`}
      ${values.map((v, i) => html`<g onClick=${() => setSel(i)} style="cursor:pointer"><rect x=${P.l + i * slot} y="0" width=${slot} height=${height} fill="transparent" />
        <rect x=${P.l + i * slot + (slot - bw) / 2} y=${y(v)} width=${bw} height=${Math.max(2, y(0) - y(v))} rx="4" fill=${toneColor(tone)} opacity=${partial.includes(i) ? 0.45 : sel != null && sel !== i ? 0.5 : 1} /></g>`)}
      ${goal != null && html`<line x1=${P.l} x2=${W - P.r} y1=${y(goal)} y2=${y(goal)} stroke="var(--tk-c-success)" stroke-width="1.5" stroke-dasharray="6 4" />`}
      ${labels.map((l, i) => (i % step === 0 || i === n - 1) && html`<text x=${P.l + i * slot + slot / 2} y=${height - 4} text-anchor="middle" fill="var(--tk-c-text-subtle)" style="font-size:11px">${l}</text>`)}
    </svg></div>`;
}
export const CHART_CSS = `
  .tk-fit-chart { min-width:0; } .tk-fit-chart__tip { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); min-height:22px; margin-bottom:6px; font-variant-numeric:tabular-nums; } .tk-fit-chart__tip strong { color:var(--tk-c-text); }`;
