// Trading: Aufteilung des Depots – Ist gegen Soll nach Baustein, Anlageklasse, Region und Sektor; Zielwerte anpassen.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, EmptyState, Segmented, NumberStepper, toneColor } from '../../ui.js';
import { money } from '../../helpers.js';
import { fmtPercent, fmtPP } from '../../../lib/format.js';
import { holdings, arr, obj, sum } from './_calc.js';
import { slots, Note, TRD_CSS } from './_trd.js';
import { ex } from './_example.js';

const VIEWS = [{ value: 'position', label: 'Bausteine' }, { value: 'class', label: 'Klasse' }, { value: 'region', label: 'Region' }, { value: 'sector', label: 'Sektor' }];

/** Gruppen mit Ist-Anteil und Soll-Anteil (Soll nur für Bausteine und Klassen). */
export function groupsOf(hd, targets, by) {
  const t = obj(targets), hasT = Object.keys(t).length > 0, map = new Map();
  const add = (k, label, ist, soll) => { const g = map.get(k) || { k, label, ist: 0, soll: soll == null ? null : 0 }; g.ist += ist; if (soll != null) g.soll = (g.soll || 0) + soll; map.set(k, g); };
  for (const r of hd.rows) {
    const s = hasT ? (t[r.id] ?? 0) / 100 : null;
    if (by === 'position') add(r.id, r.short || r.name, r.weight, s); else if (by === 'class') add(r.type, r.type, r.weight, s);
    else add(r[by] || 'Sonstige', r[by] || 'Sonstige', r.weight, null);
  }
  if (hd.cash > 0 || t.cash) add('cash', by === 'position' || by === 'class' ? 'Verrechnungskonto' : 'Guthaben', hd.total ? hd.cash / hd.total : 0, by === 'position' || by === 'class' ? (hasT ? (t.cash ?? 0) / 100 : null) : null);
  return [...map.values()].sort((a, b) => b.ist - a.ist);
}

function TargetsBody({ rows, targets, onSave, close }) {
  const [v, setV] = useState(() => Object.fromEntries(rows.map((r) => [r.k, Math.round((targets[r.k] ?? 0))]))), total = sum(rows, (r) => v[r.k] || 0);
  return html`<div class="tk-col" style="gap:12px"><p class="tk-trd-meta">Lege fest, wie das Depot idealerweise verteilt sein soll. Die Summe muss 100 % ergeben. Das ist deine eigene Vorgabe, keine Empfehlung.</p>
    ${rows.map((r) => html`<div class="tk-trd-row" style="justify-content:space-between"><span class="tk-trd-title">${r.label}</span><${NumberStepper} label=${`Soll-Anteil ${r.label}`} value=${v[r.k] || 0} min=${0} max=${100} step=${1} unit="%" onChange=${(x) => setV({ ...v, [r.k]: x })} /></div>`)}
    <div class="tk-trd-row" style="justify-content:space-between"><strong>Summe</strong><strong class="tk-trd-num ${total === 100 ? 'tk-trd-up' : 'tk-trd-down'}">${total} %${total === 100 ? '' : ` (${total > 100 ? '+' : '−'}${Math.abs(100 - total)})`}</strong></div>
    <div class="tk-trd-cta"><${Button} variant="primary" disabled=${total !== 100} onClick=${() => { onSave(v); close(); }}>Speichern<//><${Button} variant="ghost" onClick=${close}>Abbrechen<//></div></div>`;
}

export const trdAllocation = {
  id: 'trd-allocation',
  name: 'Aufteilung Soll und Ist',
  category: 'Trading',
  description: 'Verteilung des Depots nach Baustein, Anlageklasse, Region oder Sektor mit Ist-Anteil, eigenem Soll-Anteil und Abweichung in Prozentpunkten. Zielwerte lassen sich anpassen (Summe 100 %). Als Tabelle oder als zwei gestapelte Balken. Keine Empfehlung.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Aufteilung' },
    { name: 'style', label: 'Darstellung', type: 'select', options: ['table', 'bars'], default: 'table' },
    { name: 'by', label: 'Start-Ansicht', type: 'select', options: ['position', 'class', 'region', 'sector'], default: 'position' },
    { name: 'tolerance', label: 'Toleranz (Prozentpunkte)', type: 'number', default: 2 },
  ],
  data: slots('positions', 'cash', 'targets'),
  events: ['alloc.view', 'alloc.edit', 'alloc.save'],
  states: ['empty'],
  css: `${TRD_CSS}
  .tk-trd-al2__row { display:grid; grid-template-columns:minmax(0,1.3fr) minmax(90px,2fr) 64px 64px 84px; gap:12px; align-items:center; padding:10px 4px; border-bottom:1px solid var(--tk-c-border); min-height:48px; } .tk-trd-al2__row > :nth-child(n+3) { text-align:right; }
  .tk-trd-al2__h { color:var(--tk-c-text-subtle); font-size:var(--tk-fs-xs); text-transform:uppercase; letter-spacing:var(--tk-ls-wide); font-weight:var(--tk-fw-semibold); border-bottom:1px solid var(--tk-c-border-strong); min-height:0; padding-bottom:6px; }
  .tk-trd-al2__track { position:relative; height:10px; border-radius:5px; background:var(--tk-c-surface3); } .tk-trd-al2__track i { position:absolute; left:0; top:0; bottom:0; border-radius:5px; } .tk-trd-al2__track b { position:absolute; top:-3px; bottom:-3px; width:3px; border-radius:2px; background:var(--tk-c-text); }
  .bp-mobile .tk-trd-al2__row { grid-template-columns:minmax(0,1fr) auto auto; row-gap:6px; } .bp-mobile .tk-trd-al2__track { grid-column:1 / -1; order:5; } .bp-mobile .tk-trd-al2__soll { display:none; } .bp-mobile .tk-trd-al2__h > :nth-child(2) { display:none; }
  .tk-trd-al2__stack { display:flex; height:28px; border-radius:var(--tk-radius-md); overflow:hidden; gap:2px; } .tk-trd-al2__stack span { min-width:3px; }
  .tk-trd-al2__leg { display:flex; flex-wrap:wrap; gap:6px 16px; margin-top:8px; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); } .tk-trd-al2__leg i { display:inline-block; width:10px; height:10px; border-radius:3px; margin-right:6px; }`,
  example: { data: ex('positions', 'cash', 'targets') },
  render: function TrdAllocation({ props, data, setData, ctx }) {
    const [by, setBy] = useState(props.by), hd = holdings(data.positions, data.cash);
    if (!hd.rows.length) return html`<${Card} title=${props.title} icon="pie-chart"><${EmptyState} icon="pie-chart" title="Noch keine Aufteilung" text="Sobald Positionen im Depot liegen, siehst du hier die Verteilung und kannst Zielwerte festlegen." /><//>`;
    const tg = obj(data.targets), g = groupsOf(hd, tg, by), hasSoll = g.some((x) => x.soll != null), tol = props.tolerance / 100;
    const edit = () => { const rows = groupsOf(hd, tg, 'position'); ctx.emit('alloc.edit'); ctx.openDialog({ title: 'Zielwerte anpassen', body: (close) => html`<${TargetsBody} rows=${rows} targets=${tg} close=${close} onSave=${(v) => { setData('targets', v); ctx.emit('alloc.save', v); ctx.toast('Zielwerte gespeichert'); }} />` }); };
    const dev = (x) => (x.soll == null ? null : x.ist - x.soll), euro = (x) => (x.soll == null ? '' : money(ctx, Math.abs(dev(x)) * hd.total, { digits: 0 }));
    const devCell = (x) => { const d = dev(x); if (d == null) return html`<span class="tk-trd-meta">–</span>`; const out = Math.abs(d) > tol; return html`<span class=${`tk-trd-num ${out ? '' : 'tk-trd-meta'}`} style=${out ? 'font-weight:var(--tk-fw-semibold)' : ''} title=${out ? `${d > 0 ? 'Über' : 'Unter'} dem Zielwert, rechnerisch ${euro(x)}` : 'Im Toleranzband'}>${out ? (d > 0 ? '▲ ' : '▼ ') : ''}${fmtPP(d)}</span>`; };
    const viewSw = html`<div class="tk-trd-row" style="justify-content:space-between;flex-wrap:wrap;margin-bottom:12px"><${Segmented} label="Aufteilung nach" value=${by} onChange=${(v) => { setBy(v); ctx.emit('alloc.view', { by: v }); }} options=${VIEWS} />${hasSoll && by === 'position' && html`<${Button} size="sm" icon="sliders-horizontal" onClick=${edit}>Ziele anpassen<//>`}</div>`;
    const foot = html`<div style="margin-top:12px"><${Note} icon="info">Soll ist deine eigene Vorgabe, Toleranz ±${props.tolerance} PP. Abweichungen sind rechnerisch, keine Handlungsempfehlung.<//></div>`;
    if (props.style === 'bars') return html`<${Card} title=${props.title} icon="pie-chart">${viewSw}<div class="tk-col" style="gap:14px">
      ${[['Ist', 'ist'], ...(hasSoll ? [['Soll', 'soll']] : [])].map(([l, k]) => html`<div><div class="tk-trd-cap" style="margin-bottom:6px">${l}</div><div class="tk-trd-al2__stack" role="img" aria-label=${`${l}: ${g.filter((x) => x[k]).map((x) => `${x.label} ${fmtPercent(x[k], { digits: 0 })}`).join(', ')}`}>${g.filter((x) => x[k] > 0).map((x, i) => html`<span title=${`${x.label} ${fmtPercent(x[k], { digits: 1 })}`} style=${`flex:${x[k]};background:${toneColor((g.indexOf(x) % 6) + 1)}`}></span>`)}</div></div>`)}
      <div class="tk-trd-al2__leg">${g.map((x, i) => html`<span><i style=${`background:${toneColor((i % 6) + 1)}`}></i>${x.label} <strong class="tk-trd-num" style="color:var(--tk-c-text)">${fmtPercent(x.ist, { digits: 1 })}</strong>${x.soll != null ? html` <span class="tk-trd-sub">Soll ${fmtPercent(x.soll, { digits: 0 })}</span>` : ''}</span>`)}</div></div>${foot}<//>`;
    return html`<${Card} title=${props.title} icon="pie-chart">${viewSw}<div><div class="tk-trd-al2__row tk-trd-al2__h"><span>Baustein</span><span></span><span>Ist</span><span class="tk-trd-al2__soll">Soll</span><span>Abweichung</span></div>
      ${g.map((x, i) => html`<div class="tk-trd-al2__row"><span class="tk-trd-title">${x.label}</span><span class="tk-trd-al2__track" aria-hidden="true"><i style=${`width:${Math.min(100, x.ist * 100)}%;background:${toneColor((i % 6) + 1)}`}></i>${x.soll != null && html`<b style=${`left:${Math.min(99, x.soll * 100)}%`}></b>`}</span>
        <strong class="tk-trd-num">${fmtPercent(x.ist, { digits: 1 })}</strong><span class="tk-trd-num tk-trd-meta tk-trd-al2__soll">${x.soll != null ? fmtPercent(x.soll, { digits: 0 }) : '–'}</span>${devCell(x)}</div>`)}</div>${foot}<//>`;
  },
};
export default [trdAllocation];
