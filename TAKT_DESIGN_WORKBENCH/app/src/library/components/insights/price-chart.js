// Trading: Kursverlauf (Linie/Fläche/Kerzen) mit Zeitraum-Umschalter und Crosshair
import { html } from '../../../lib/html.js';
import { useState, useRef, useEffect } from 'preact/hooks';
import { Card, Segmented, EmptyState, Badge } from '../../ui.js';
import { fmt } from '../../../lib/util.js';
import { toList } from '../../helpers.js';
import { signedPct, gainColor } from './shared.js';

const nf = (v, d = 2) => fmt.number(v, d);

export const priceChart = {
  id: 'price-chart',
  name: 'Kursdiagramm',
  category: 'Trading',
  description: 'Kursverlauf eines Wertpapiers als Linie, Fläche oder Kerzen (OHLC) mit Zeitraum-Umschalter (1T/1W/1M/1J) und Crosshair-Tooltip bei Hover/Tippen. Folgt der Auswahl (ctx.ui.selectedId).',
  version: '1.0',
  props: [
    { name: 'type', label: 'Darstellung', type: 'select', options: ['line', 'area', 'candles'], default: 'area' },
    { name: 'ranges', label: 'Zeiträume', type: 'list', default: ['1T', '1W', '1M', '1J'] },
    { name: 'initialRange', label: 'Start-Zeitraum', type: 'text', default: '1M' },
    { name: 'height', label: 'Höhe (px)', type: 'number', default: 260 },
    { name: 'showTypeSwitch', label: 'Darstellungs-Umschalter', type: 'boolean', default: true },
    { name: 'showHeader', label: 'Kopf mit Kurs', type: 'boolean', default: true },
    { name: 'followSelection', label: 'Auswahl der Liste folgen', type: 'boolean', default: true },
  ],
  data: [{ slot: 'instruments', label: 'Wertpapiere', default: 'instruments', shape: '{id,symbol,name,currency?,ranges:{"1T":[{t,o,h,l,c}], …}}[]', required: true }],
  events: ['chart.range', 'chart.type', 'chart.point'],
  states: ['empty'],
  css: `
  .tk-price-chart__head { display:flex; align-items:flex-start; gap:var(--tk-space-3); flex-wrap:wrap; margin-bottom:var(--tk-space-3); }
  .tk-price-chart__name { font-weight:var(--tk-fw-semibold); display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
  .tk-price-chart__price { font-size:var(--tk-fs-3xl); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); font-variant-numeric:tabular-nums; line-height:1.15; }
  .tk-price-chart__ctl { display:flex; gap:var(--tk-space-2); flex-wrap:wrap; justify-content:flex-end; margin-left:auto; max-width:100%; }
  .tk-price-chart__tip { min-height:38px; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); font-variant-numeric:tabular-nums; display:flex; flex-wrap:wrap; gap:2px 14px; align-items:center; margin-bottom:4px; }
  .tk-price-chart__tip strong { color:var(--tk-c-text); }
  .tk-price-chart__plot { position:relative; width:100%; touch-action:pan-y; user-select:none; }
  .tk-price-chart__plot svg { display:block; }
  .bp-mobile .tk-price-chart__price { font-size:var(--tk-fs-2xl); }
  .bp-mobile .tk-price-chart__ctl { margin-left:0; width:100%; justify-content:space-between; }`,
  example: { props: { type: 'area' }, data: { instruments: [{ id: 'msci', symbol: 'MSCW', name: 'MSCI World ETF (fiktiv)', currency: 'EUR', ranges: {
    '1T': Array.from({ length: 24 }, (_, i) => { const c = 98 + Math.sin(i / 3) * 0.6 + i * 0.03; return { t: `${9 + Math.floor(i / 3)}:${(i % 3) * 20 || '00'}`, o: c - 0.1, h: c + 0.25, l: c - 0.3, c }; }),
    '1M': Array.from({ length: 22 }, (_, i) => { const c = 95 + Math.sin(i / 4) * 2 + i * 0.15; return { t: `${i + 1}.11.`, o: c - 0.3, h: c + 0.7, l: c - 0.8, c }; }),
  } }] } },
  render: function PriceChart({ props, data, ctx }) {
    const insts = data.instruments || [];
    const inst = (props.followSelection && insts.find((i) => i.id === ctx.ui.selectedId)) || insts[0];
    const avail = inst ? toList(props.ranges).filter((r) => inst.ranges?.[r]?.length) : [];
    const [range, setRange] = useState(props.initialRange);
    const [type, setType] = useState(props.type);
    const [hover, setHover] = useState(null);
    const [w, setW] = useState(0);
    const box = useRef(null);
    useEffect(() => {
      const el = box.current; if (!el) return;
      const measure = () => setW(Math.round(el.getBoundingClientRect().width));
      measure();
      let ro; if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(measure); ro.observe(el); }
      window.addEventListener('resize', measure);
      return () => { ro && ro.disconnect(); window.removeEventListener('resize', measure); };
    }, [!!inst]);
    useEffect(() => { setHover(null); }, [range, type, inst && inst.id]);

    if (!inst || !avail.length) return html`<${Card} title="Kursverlauf"><${EmptyState} icon="candlestick-chart" title="Keine Kursdaten" text="Wähle ein Wertpapier aus der Watchlist, um den Verlauf zu sehen." /><//>`;
    const cur = avail.includes(range) ? range : avail[0];
    const pts = inst.ranges[cur];
    const last = pts[pts.length - 1], first = pts[0];
    const chg = last.c / first.o - 1;
    const up = last.c >= first.o;
    const col = up ? 'var(--tk-c-success)' : 'var(--tk-c-danger)';
    const H = ctx.bp === 'mobile' ? Math.min(props.height, 220) : props.height;
    const W = w || 600;
    const P = { l: 6, r: 54, t: 10, b: 22 };
    const lo = Math.min(...pts.map((p) => (type === 'candles' ? p.l : p.c)));
    const hi = Math.max(...pts.map((p) => (type === 'candles' ? p.h : p.c)));
    const pad = (hi - lo) * 0.1 || 1;
    const min = lo - pad, max = hi + pad;
    const n = pts.length;
    const step = (W - P.l - P.r) / n;
    const x = (i) => P.l + step * (i + 0.5);
    const y = (v) => P.t + (1 - (v - min) / (max - min)) * (H - P.t - P.b);
    const ticks = [0, 1, 2, 3].map((k) => min + ((max - min) * k) / 3);
    const xl = n <= 5 ? pts.map((_, i) => i) : [0, 1, 2, 3, 4].map((k) => Math.round((k * (n - 1)) / 4));
    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.c).toFixed(1)}`).join('');
    const hp = hover != null ? pts[hover] : null;
    const shown = hp || last;
    const idxAt = (e) => { const r = e.currentTarget.getBoundingClientRect(); return Math.max(0, Math.min(n - 1, Math.floor(((e.clientX - r.left) / r.width * W - P.l) / step))); };
    const cw = Math.max(1.5, Math.min(14, step * 0.62));
    const cur2 = inst.currency === 'USD' ? '$' : '€';

    const ctl = html`<div class="tk-price-chart__ctl">
        ${props.showTypeSwitch && html`<${Segmented} label="Darstellung" value=${type} onChange=${(v) => { setType(v); ctx.emit('chart.type', { type: v }); }} options=${[{ value: 'line', label: 'Linie', icon: 'line-chart' }, { value: 'candles', label: 'Kerzen', icon: 'candlestick-chart' }]} />`}
        <${Segmented} label="Zeitraum" value=${cur} onChange=${(v) => { setRange(v); ctx.emit('chart.range', { range: v, symbol: inst.symbol }); }} options=${avail.map((r) => ({ value: r, label: r }))} />
      </div>`;
    return html`<${Card} class="tk-price-chart">
      ${props.showHeader && html`<div class="tk-price-chart__head">
        <div><div class="tk-price-chart__name"><span>${inst.name}</span><${Badge}>${inst.symbol}<//></div>
          <div class="tk-row" style="gap:10px;flex-wrap:wrap"><span class="tk-price-chart__price">${nf(last.c)} ${cur2}</span>
            <span class="tk-num" style=${`color:${col};font-weight:600`}>${signedPct(chg)} <span class="tk-subtle" style="font-weight:400">im Zeitraum ${cur}</span></span></div></div>
      ${ctl}
      </div>`}
      ${!props.showHeader && html`<div class="tk-price-chart__head">${ctl}</div>`}
      <div class="tk-price-chart__tip" aria-live="polite">${hp ? html`<strong>${hp.t}</strong>${type === 'candles'
          ? html`<span>Eröffnung ${nf(hp.o)}</span><span>Hoch ${nf(hp.h)}</span><span>Tief ${nf(hp.l)}</span><span>Schluss <strong>${nf(hp.c)}</strong></span>`
          : html`<span>Kurs <strong>${nf(hp.c)} ${cur2}</strong></span><span style=${`color:${gainColor(hp.c - first.o)}`}>${signedPct(hp.c / first.o - 1)}</span>`}`
        : html`<span class="tk-subtle">Über das Diagramm fahren oder tippen für Details</span>`}</div>
      <div class="tk-price-chart__plot" ref=${box}>
        <svg width=${W} height=${H} viewBox=${`0 0 ${W} ${H}`} role="img" aria-label=${`Kursverlauf ${inst.name}, Zeitraum ${cur}`}
          onPointerMove=${(e) => setHover(idxAt(e))} onPointerLeave=${() => setHover(null)}
          onClick=${(e) => { const i = idxAt(e); setHover(i); ctx.emit('chart.point', { symbol: inst.symbol, t: pts[i].t, close: pts[i].c }); }}>
          ${ticks.map((t) => html`<g><line x1=${P.l} x2=${W - P.r} y1=${y(t)} y2=${y(t)} stroke="var(--tk-c-border)" stroke-dasharray="3 4" />
            <text x=${W - P.r + 6} y=${y(t) + 4} fill="var(--tk-c-text-subtle)" style="font-size:11px;font-variant-numeric:tabular-nums">${nf(t, t > 1000 ? 0 : 2)}</text></g>`)}
          ${type === 'area' && html`<path d=${`${line}L${x(n - 1)},${H - P.b}L${x(0)},${H - P.b}Z`} fill=${col} opacity=".14" />`}
          ${type !== 'candles' && html`<path d=${line} fill="none" stroke=${col} stroke-width="2.25" stroke-linejoin="round" stroke-linecap="round" />`}
          ${type === 'candles' && pts.map((p, i) => { const u = p.c >= p.o; const c = u ? 'var(--tk-c-success)' : 'var(--tk-c-danger)';
            return html`<g><line x1=${x(i)} x2=${x(i)} y1=${y(p.h)} y2=${y(p.l)} stroke=${c} stroke-width="1.5" />
              <rect x=${x(i) - cw / 2} y=${Math.min(y(p.o), y(p.c))} width=${cw} height=${Math.max(1.5, Math.abs(y(p.o) - y(p.c)))} rx="1.5" fill=${c} /></g>`; })}
          ${xl.map((i, k) => html`<text x=${Math.max(14, Math.min(W - P.r - 14, x(i)))} y=${H - 6} text-anchor="middle" fill="var(--tk-c-text-subtle)" style="font-size:11px">${pts[i].t}</text>`)}
          ${hp && html`<g><line x1=${x(hover)} x2=${x(hover)} y1=${P.t} y2=${H - P.b} stroke="var(--tk-c-text-subtle)" stroke-dasharray="4 3" />
            <line x1=${P.l} x2=${W - P.r} y1=${y(hp.c)} y2=${y(hp.c)} stroke="var(--tk-c-text-subtle)" stroke-dasharray="2 4" />
            <circle cx=${x(hover)} cy=${y(hp.c)} r="4.5" fill=${col} stroke="var(--tk-c-surface)" stroke-width="2" /></g>`}
          ${!hp && html`<g><line x1=${P.l} x2=${W - P.r} y1=${y(last.c)} y2=${y(last.c)} stroke=${col} stroke-dasharray="2 3" opacity=".6" />
            <rect x=${W - P.r + 2} y=${y(last.c) - 9} width=${P.r - 4} height="18" rx="4" fill=${col} />
            <text x=${W - P.r + 6} y=${y(last.c) + 4} fill="var(--tk-c-text-on-accent)" style="font-size:11px;font-weight:700;font-variant-numeric:tabular-nums">${nf(last.c, last.c > 1000 ? 0 : 2)}</text></g>`}
        </svg>
      </div>
    <//>`;
  },
};

export default [priceChart];
