// Ziele: Fortschrittsverlauf als Linie (Gewicht: Trend statt Tageswert) oder Balken (Training) mit Zielmarke; Stand eintragen bei eigenen Zählern.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, NumberStepper, EmptyState } from '../../ui.js';
import { fmtDate, fmtNumber } from '../../../lib/format.js';
import { GOAL_SLOTS, GL_CSS, useViews, patchGoal, valueOf, hidden, toneColor, todayIso } from './_goals.js';
import { pickGoal } from './goal-hero.js';
import { EXAMPLE } from './_example.js';

export const goalProgressChart = {
  id: 'goal-progress-chart',
  name: 'Fortschrittsverlauf',
  category: 'Ziele',
  description: 'Verlauf des gewählten Ziels mit Zielmarke: Linie für Beträge, Zähler und Serien, Trend (Rohwerte blass) für das Gewicht, Balken je Woche für Training. Zahlen lassen sich ausblenden. Eigene Zähler bekommen „Stand eintragen“.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Verlauf' },
    { name: 'height', label: 'Höhe (px)', type: 'number', default: 180 },
    { name: 'showCheckin', label: '„Stand eintragen“ bei eigenen Zählern', type: 'boolean', default: true },
  ],
  data: GOAL_SLOTS,
  events: ['goal.checkin', 'chart.point'],
  states: ['empty'],
  flutter: { widget: 'TaktGoalProgressChart', propMap: { title: 'title', height: 'height', showCheckin: 'showCheckin' }, events: { 'goal.checkin': 'onCheckin' } },
  css: `${GL_CSS}
  .tk-gl-ch { display:flex; flex-direction:column; gap:var(--tk-space-3); } .tk-gl-ch svg { display:block; width:100%; overflow:visible; } .tk-gl-ch text { font-size:11px; fill:var(--tk-c-text-subtle); font-variant-numeric:tabular-nums; }
  .tk-gl-ch__ci { display:flex; gap:12px; align-items:center; flex-wrap:wrap; padding-top:12px; border-top:1px solid var(--tk-c-border); } .tk-gl-ch__ci > span { flex:1 1 140px; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); }
  .tk-gl-ch__leg { display:flex; gap:14px; flex-wrap:wrap; font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); } .tk-gl-ch__leg i { display:inline-block; width:14px; height:0; border-top:2px solid var(--lc); margin-right:6px; vertical-align:middle; }`,
  example: { data: EXAMPLE },
  render: function GoalProgressChart({ props, data, setData, ctx }) {
    const { views, today } = useViews(data, ctx);
    const v = pickGoal(views, ctx);
    const [draft, setDraft] = useState(null);
    if (!v) return html`<${Card} title=${props.title}><${EmptyState} icon="trending-up" title="Noch kein Verlauf" text="Sobald ein Ziel existiert, siehst du hier seinen Fortschritt." /><//>`;
    const col = toneColor(v.areaTone), hide = hidden(v);
    const pts = v.series || [];
    const W = Math.max(240, (ctx.blockWidth || 340) - 32), H = props.height, pl = hide ? 8 : 40, pr = 10, pt = 10, pb = 24, iw = W - pl - pr, ih = H - pt - pb;
    const body = (() => {
      if (!pts.length) return html`<${EmptyState} icon="list-checks" title="Kein Verlauf nötig" text="Bei diesem Ziel zeigen die Schritte darunter den Stand." />`;
      const bars = v.bars;
      const vals = [...pts.map((p) => p.value), ...(v.raw || []).map((p) => p.value), v.target, ...(bars ? [0] : [])].filter((x) => Number.isFinite(x));
      let lo = Math.min(...vals), hi = Math.max(...vals); if (hi === lo) { hi += 1; lo -= 1; } const pad = (hi - lo) * 0.08; lo -= bars ? 0 : pad; hi += pad;
      const y = (x) => pt + ih - ((x - lo) / (hi - lo)) * ih;
      const t0 = new Date(`${pts[0].date}T12:00:00`).getTime(), t1 = new Date(`${(pts[pts.length - 1].date)}T12:00:00`).getTime() || t0 + 1;
      const x = (d, i) => pl + (bars ? ((i + 0.5) / pts.length) * iw : pts.length === 1 ? iw / 2 : ((new Date(`${d}T12:00:00`).getTime() - t0) / Math.max(1, t1 - t0)) * iw);
      const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.date, i).toFixed(1)},${y(p.value).toFixed(1)}`).join('');
      const label = `${v.title}: Verlauf vom ${fmtDate(pts[0].date)} bis ${fmtDate(pts[pts.length - 1].date)}${hide ? '' : `, aktuell ${valueOf(ctx, v, v.current)}, Ziel ${valueOf(ctx, v, v.target)}`}`;
      const ty = y(v.target), showT = v.target >= lo && v.target <= hi;
      return html`<svg viewBox=${`0 0 ${W} ${H}`} role="img" aria-label=${label} height=${H}>
        ${showT && html`<line x1=${pl} x2=${W - pr} y1=${ty} y2=${ty} stroke=${col} stroke-dasharray="5 4" stroke-opacity=".7" /><text x=${W - pr} y=${ty - 5} text-anchor="end">Ziel${hide ? '' : ` ${valueOf(ctx, v, v.target)}`}</text>`}
        ${!hide && [lo + pad, (lo + hi) / 2, hi - pad].map((g) => html`<text x=${pl - 6} y=${y(g) + 4} text-anchor="end">${v.kind === 'amount' ? fmtNumber(g / 1000, { digits: 1 }) + ' Tsd.' : fmtNumber(g, { digits: v.kind === 'weight' ? 1 : 0 })}</text>`)}
        ${bars ? pts.map((p, i) => html`<rect x=${x(p.date, i) - Math.max(4, iw / pts.length / 3)} width=${Math.max(8, (iw / pts.length / 3) * 2)} y=${y(p.value)} height=${Math.max(2, y(0) - y(p.value))} rx="3" fill=${col} opacity=${p.current ? 0.45 : 0.9}><title>${fmtDate(p.date, { style: 'short' })}: ${hide ? '' : p.value}</title></rect>`)
          : html`${(v.raw || []).map((p, i) => html`<circle cx=${x(p.date, i)} cy=${y(p.value)} r="2" fill=${col} opacity=".25" />`)}
            <path d=${`${line}L${x(pts[pts.length - 1].date, pts.length - 1)},${pt + ih}L${x(pts[0].date, 0)},${pt + ih}Z`} fill=${col} opacity=".1" /><path d=${line} fill="none" stroke=${col} stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
            ${pts.length < 40 && pts.map((p, i) => html`<circle cx=${x(p.date, i)} cy=${y(p.value)} r=${i === pts.length - 1 ? 4.5 : 3} fill=${i === pts.length - 1 ? col : 'var(--tk-c-surface)'} stroke=${col} stroke-width="2"><title>${fmtDate(p.date, { style: 'short' })}: ${hide ? '' : valueOf(ctx, v, p.value)}</title></circle>`)}`}
        <text x=${pl} y=${H - 6}>${fmtDate(pts[0].date, { style: 'short' })}</text><text x=${W - pr} y=${H - 6} text-anchor="end">${fmtDate(pts[pts.length - 1].date, { style: 'short' })}</text></svg>`;
    })();
    const own = v.source.type === 'manual' && v.kind === 'count';
    const val = draft ?? v.current;
    const save = () => { patchGoal(setData, v.id, (g) => ({ snapshots: [...(g.snapshots || []).filter((p) => p.date !== todayIso(ctx)), { date: todayIso(ctx), value: val }] })); ctx.emit('goal.checkin', { id: v.id, value: val }); ctx.toast(`Stand eingetragen: ${fmtNumber(val, { digits: 0 })} ${v.unit}`); setDraft(null); };
    return html`<${Card} title=${props.title}><div class="tk-gl-ch">${body}
      ${v.kind === 'weight' && !hide && html`<div class="tk-gl-ch__leg"><span style=${`--lc:${col}`}><i></i>Trend</span><span style=${`--lc:var(--tk-c-border-strong)`}><i style="border-top-style:dotted"></i>Tageswerte, blass</span></div>`}
      ${own && props.showCheckin && html`<div class="tk-gl-ch__ci"><span>Aktueller Stand in ${v.unit}</span><${NumberStepper} value=${val} min=${0} max=${v.target * 2} step=${1} unit=${v.unit} label=${`Stand ${v.unit}`} onChange=${setDraft} /><${Button} size="sm" variant="primary" icon="check" onClick=${save} disabled=${val === v.current}>Stand eintragen<//></div>`}</div><//>`;
  },
};
export default goalProgressChart;
