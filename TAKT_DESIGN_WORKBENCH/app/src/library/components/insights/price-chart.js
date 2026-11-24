// Trading: Kursverlauf (Linie/Fläche/Kerzen) mit Zeitraum-Umschalter, Crosshair, Einstandslinie und Alarmmarken. Version 2.0.
import { html } from '../../../lib/html.js';
import { useState, useRef, useEffect } from 'preact/hooks';
import { Card, Segmented, EmptyState, Badge } from '../../ui.js';
import { fmtNumber, fmtPercent } from '../../../lib/format.js';
import { toList } from '../../helpers.js';
import { arr } from '../trading/_calc.js';
import { Px, Chg, TRD_CSS, TONE_COLOR, upDown } from '../trading/_trd.js';
import { ex } from '../trading/_example.js';

const RANGE_LABEL = { '1T': 'heute', '1W': '1 Woche', '1M': '1 Monat', '1J': '1 Jahr', '5J': '5 Jahre' };
const dec = (v) => (v >= 5000 ? 0 : 2);

export const priceChart = {
  id: 'price-chart',
  name: 'Kursdiagramm',
  category: 'Trading',
  description: 'Kursverlauf eines Wertpapiers als Linie, Fläche oder Kerzen (OHLC) mit Zeitraum-Umschalter (heute, 1 Woche, 1 Monat, 1 Jahr, 5 Jahre), Crosshair per Maus, Touch und Pfeiltasten, optional mit Linie des Ø-Einstands und gesetzten Kursalarmen. Folgt der Auswahl (ctx.ui.selectedId). Kurse sind fiktiv.',
  version: '2.0',
  props: [
    { name: 'type', label: 'Darstellung', type: 'select', options: ['line', 'area', 'candles'], default: 'area' },
    { name: 'ranges', label: 'Zeiträume', type: 'list', default: ['1T', '1W', '1M', '1J', '5J'] },
    { name: 'initialRange', label: 'Start-Zeitraum', type: 'text', default: '1M' },
    { name: 'height', label: 'Höhe (px)', type: 'number', default: 260 },
    { name: 'showTypeSwitch', label: 'Darstellungs-Umschalter', type: 'boolean', default: true },
    { name: 'showHeader', label: 'Kopf mit Kurs', type: 'boolean', default: true },
    { name: 'showCost', label: 'Ø-Einstand als Linie', type: 'boolean', default: true },
    { name: 'showAlerts', label: 'Kursalarme als Linien', type: 'boolean', default: true },
    { name: 'followSelection', label: 'Auswahl der Liste folgen', type: 'boolean', default: true },
  ],
  data: [
    { slot: 'instruments', label: 'Wertpapiere', default: 'instruments', shape: '{id,symbol,name,currency?,ranges:{"1T":[{t,o,h,l,c}], …}}[]', required: true },
    { slot: 'positions', label: 'Positionen (für Einstand)', default: 'positions', shape: '{id,buyPrice}[]', required: false },
    { slot: 'alerts', label: 'Kursalarme', default: 'alerts', shape: '{securityId,dir,price,status}[]', required: false },
  ],
  events: ['chart.range', 'chart.type', 'chart.point'],
  states: ['empty'],
  css: `${TRD_CSS}
  .tk-price-chart__head { display:flex; align-items:flex-start; gap:var(--tk-space-3); flex-wrap:wrap; margin-bottom:var(--tk-space-3); }
  .tk-price-chart__name { font-weight:var(--tk-fw-semibold); display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
  .tk-price-chart__price { font-size:var(--tk-fs-3xl); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); line-height:1.15; }
  .tk-price-chart__ctl { display:flex; gap:var(--tk-space-2); flex-wrap:wrap; justify-content:flex-end; margin-left:auto; max-width:100%; }
  .tk-price-chart__tip { min-height:38px; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); font-variant-numeric:tabular-nums; display:flex; flex-wrap:wrap; gap:2px 14px; align-items:center; margin-bottom:4px; }
  .tk-price-chart__tip strong { color:var(--tk-c-text); }
  .tk-price-chart__plot { position:relative; width:100%; touch-action:pan-y; user-select:none; } .tk-price-chart__plot svg { display:block; } .tk-price-chart__plot svg:focus-visible { outline:2px solid var(--tk-c-focus); outline-offset:2px; border-radius:var(--tk-radius-sm); }
  .tk-price-chart__leg { display:flex; gap:6px 16px; flex-wrap:wrap; margin-top:6px; font-size:var(--tk-fs-xs); color:var(--tk-c-text-muted); } .tk-price-chart__leg i { display:inline-block; width:14px; border-top:2px dashed; margin-right:6px; vertical-align:middle; }
  .bp-mobile .tk-price-chart__price { font-size:var(--tk-fs-2xl); } .bp-mobile .tk-price-chart__ctl { margin-left:0; width:100%; justify-content:space-between; }`,
  example: { props: { type: 'area' }, data: ex('instruments', 'positions', 'alerts') },
  render: function PriceChart({ props, data, ctx }) {
    const insts = arr(data.instruments), held = (i) => arr(data.positions).some((p) => p.id === i.id);
    const inst = (props.followSelection && insts.find((i) => i.id === ctx.ui.selectedId)) || insts.find(held) || insts[0];
    const avail = inst ? toList(props.ranges).filter((r) => inst.ranges?.[r]?.length) : [];
    const [range, setRange] = useState(props.initialRange), [type, setType] = useState(props.type), [hover, setHover] = useState(null), [w, setW] = useState(0), box = useRef(null);
    useEffect(() => {
      const el = box.current; if (!el) return undefined;
      const measure = () => setW(Math.round(el.getBoundingClientRect().width));
      measure(); let ro; if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(measure); ro.observe(el); }
      window.addEventListener('resize', measure); return () => { ro && ro.disconnect(); window.removeEventListener('resize', measure); };
    }, [!!inst]);
    useEffect(() => { setHover(null); }, [range, type, inst && inst.id]);
    if (!inst || !avail.length) return html`<${Card} title="Kursverlauf"><${EmptyState} icon="candlestick-chart" title="Keine Kursdaten" text="Wähle ein Wertpapier aus der Watchlist oder dem Depot, um den Verlauf zu sehen." /><//>`;
    const cur = avail.includes(range) ? range : avail[0], pts = inst.ranges[cur], last = pts[pts.length - 1], first = pts[0], chg = last.c / first.o - 1;
    const col = TONE_COLOR[upDown(last.c - first.o)] === TONE_COLOR.flat ? 'var(--tk-c-success)' : TONE_COLOR[upDown(last.c - first.o)];
    const H = ctx.bp === 'mobile' ? Math.min(props.height, 220) : props.height, W = w || 600, P = { l: 6, r: 56, t: 10, b: 22 };
    const lo0 = Math.min(...pts.map((p) => (type === 'candles' ? p.l : p.c))), hi0 = Math.max(...pts.map((p) => (type === 'candles' ? p.h : p.c))), span = hi0 - lo0 || 1;
    const cost = props.showCost ? arr(data.positions).find((p) => p.id === inst.id)?.buyPrice : null;
    const refs = [...(cost ? [{ v: cost, label: 'Ø Einstand', c: 'var(--tk-c-accent)' }] : []), ...(props.showAlerts ? arr(data.alerts).filter((a) => a.securityId === inst.id && a.status === 'aktiv').map((a) => ({ v: a.price, label: `Alarm ${a.dir === 'above' ? 'über' : 'unter'}`, c: 'var(--tk-c-warning)' })) : [])].filter((r) => r.v > lo0 - span * 0.3 && r.v < hi0 + span * 0.3);
    const lo = Math.min(lo0, ...refs.map((r) => r.v)), hi = Math.max(hi0, ...refs.map((r) => r.v)), pad = (hi - lo) * 0.1 || 1, min = lo - pad, max = hi + pad, n = pts.length, step = (W - P.l - P.r) / n;
    const x = (i) => P.l + step * (i + 0.5), y = (v) => P.t + (1 - (v - min) / (max - min)) * (H - P.t - P.b);
    const ticks = [0, 1, 2, 3].map((k) => min + ((max - min) * k) / 3), xl = n <= 5 ? pts.map((_, i) => i) : [0, 1, 2, 3, 4].map((k) => Math.round((k * (n - 1)) / 4));
    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.c).toFixed(1)}`).join(''), hp = hover != null ? pts[hover] : null, d = dec(last.c);
    const idxAt = (e) => { const r = e.currentTarget.getBoundingClientRect(); return Math.max(0, Math.min(n - 1, Math.floor(((e.clientX - r.left) / r.width * W - P.l) / step))); };
    const key = (e) => { if (e.key === 'ArrowRight') { e.preventDefault(); setHover(Math.min(n - 1, (hover ?? -1) + 1)); } else if (e.key === 'ArrowLeft') { e.preventDefault(); setHover(Math.max(0, (hover ?? n) - 1)); } else if (e.key === 'Escape') setHover(null); };
    const cw = Math.max(1.5, Math.min(14, step * 0.62));
    const ctl = html`<div class="tk-price-chart__ctl">${props.showTypeSwitch && html`<${Segmented} label="Darstellung" value=${type} onChange=${(v) => { setType(v); ctx.emit('chart.type', { type: v }); }} options=${[{ value: 'area', label: 'Fläche', icon: 'line-chart' }, { value: 'candles', label: 'Kerzen', icon: 'candlestick-chart' }]} />`}
      <${Segmented} label="Zeitraum" value=${cur} onChange=${(v) => { setRange(v); ctx.emit('chart.range', { range: v, symbol: inst.symbol }); }} options=${avail.map((r) => ({ value: r, label: r === '1T' ? 'Heute' : r }))} /></div>`;
    return html`<${Card} class="tk-price-chart">
      ${props.showHeader ? html`<div class="tk-price-chart__head"><div><div class="tk-price-chart__name"><span>${inst.name}</span><${Badge}>${inst.symbol}<//></div>
        <div class="tk-row" style="gap:10px;flex-wrap:wrap"><span class="tk-price-chart__price"><${Px} v=${last.c} /></span><${Chg} v=${chg} digits=${2} /><span class="tk-trd-sub">${RANGE_LABEL[cur] || cur}</span></div></div>${ctl}</div>` : html`<div class="tk-price-chart__head">${ctl}</div>`}
      <div class="tk-price-chart__tip" aria-live="polite">${hp ? html`<strong>${hp.t}</strong>${type === 'candles' ? html`<span>Eröffnung ${fmtNumber(hp.o, { digits: d })}</span><span>Hoch ${fmtNumber(hp.h, { digits: d })}</span><span>Tief ${fmtNumber(hp.l, { digits: d })}</span><span>Schluss <strong>${fmtNumber(hp.c, { digits: d })}</strong></span>` : html`<span>Kurs <strong><${Px} v=${hp.c} /></strong></span><${Chg} v=${hp.c / first.o - 1} digits=${2} />`}`
        : html`<span class="tk-trd-sub">Über das Diagramm fahren, tippen oder mit den Pfeiltasten wählen</span>`}</div>
      <div class="tk-price-chart__plot" ref=${box}><svg width=${W} height=${H} viewBox=${`0 0 ${W} ${H}`} tabindex="0" role="img" aria-label=${`Kursverlauf ${inst.name}, Zeitraum ${RANGE_LABEL[cur] || cur}, von ${fmtNumber(first.o, { digits: d })} auf ${fmtNumber(last.c, { digits: d })}. Pfeiltasten wählen einen Punkt.`}
        onPointerMove=${(e) => setHover(idxAt(e))} onPointerLeave=${() => setHover(null)} onKeyDown=${key} onClick=${(e) => { const i = idxAt(e); setHover(i); ctx.emit('chart.point', { symbol: inst.symbol, t: pts[i].t, close: pts[i].c }); }}>
        ${ticks.map((t) => html`<g><line x1=${P.l} x2=${W - P.r} y1=${y(t)} y2=${y(t)} stroke="var(--tk-c-border)" stroke-dasharray="3 4" /><text x=${W - P.r + 6} y=${y(t) + 4} fill="var(--tk-c-text-subtle)" style="font-size:11px;font-variant-numeric:tabular-nums">${fmtNumber(t, { digits: t > 1000 ? 0 : 2 })}</text></g>`)}
        ${type === 'area' && html`<path d=${`${line}L${x(n - 1)},${H - P.b}L${x(0)},${H - P.b}Z`} fill=${col} opacity=".14" />`}
        ${type !== 'candles' && html`<path d=${line} fill="none" stroke=${col} stroke-width="2.25" stroke-linejoin="round" stroke-linecap="round" />`}
        ${type === 'candles' && pts.map((p, i) => { const u = p.c >= p.o, c = u ? 'var(--tk-c-success)' : 'var(--tk-c-danger)'; return html`<g><line x1=${x(i)} x2=${x(i)} y1=${y(p.h)} y2=${y(p.l)} stroke=${c} stroke-width="1.5" /><rect x=${x(i) - cw / 2} y=${Math.min(y(p.o), y(p.c))} width=${cw} height=${Math.max(1.5, Math.abs(y(p.o) - y(p.c)))} rx="1.5" fill=${c} /></g>`; })}
        ${refs.map((r) => html`<g><line x1=${P.l} x2=${W - P.r} y1=${y(r.v)} y2=${y(r.v)} stroke=${r.c} stroke-width="1.5" stroke-dasharray="6 4" /></g>`)}
        ${xl.map((i) => html`<text x=${Math.max(18, Math.min(W - P.r - 18, x(i)))} y=${H - 6} text-anchor="middle" fill="var(--tk-c-text-subtle)" style="font-size:11px">${pts[i].t}</text>`)}
        ${hp && html`<g><line x1=${x(hover)} x2=${x(hover)} y1=${P.t} y2=${H - P.b} stroke="var(--tk-c-text-subtle)" stroke-dasharray="4 3" /><line x1=${P.l} x2=${W - P.r} y1=${y(hp.c)} y2=${y(hp.c)} stroke="var(--tk-c-text-subtle)" stroke-dasharray="2 4" /><circle cx=${x(hover)} cy=${y(hp.c)} r="4.5" fill=${col} stroke="var(--tk-c-surface)" stroke-width="2" /></g>`}
        ${!hp && html`<g><line x1=${P.l} x2=${W - P.r} y1=${y(last.c)} y2=${y(last.c)} stroke=${col} stroke-dasharray="2 3" opacity=".6" /><rect x=${W - P.r + 2} y=${y(last.c) - 9} width=${P.r - 4} height="18" rx="4" fill=${col} /><text x=${W - P.r + 6} y=${y(last.c) + 4} fill="var(--tk-c-text-on-accent)" style="font-size:11px;font-weight:700;font-variant-numeric:tabular-nums">${fmtNumber(last.c, { digits: last.c > 1000 ? 0 : 2 })}</text></g>`}</svg></div>
      ${refs.length > 0 && html`<div class="tk-price-chart__leg">${refs.map((r) => html`<span><i style=${`border-color:${r.c}`}></i>${r.label} <${Px} v=${r.v} /></span>`)}</div>`}
    <//>`;
  },
};

export default [priceChart];
