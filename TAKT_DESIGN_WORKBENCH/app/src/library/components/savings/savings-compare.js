// Sparpläne: Szenarien vergleichen – bis zu vier Annahmen-Sätze nebeneinander (Linien, Tabelle, Unterschied zum ersten).
import { html } from '../../../lib/html.js';
import { useState, useEffect } from 'preact/hooks';
import { Card, Button, Badge, Icon, EmptyState, Input, toneColor } from '../../ui.js';
import { fmtPercent } from '../../../lib/format.js';
import { arr, obj, eur, Stepper, SV_CSS, sid } from './_savings.js';
import { CALC_DEFAULT, runCalc } from './_calc.js';
import { LinesChart, CHART_CSS } from './_chart.js';

const MAX = 4;
const mk = (n, o = {}) => ({ id: sid('sc-'), name: `Szenario ${n}`, monthly: CALC_DEFAULT.monthly, initial: CALC_DEFAULT.initial, years: CALC_DEFAULT.years, ratePa: CALC_DEFAULT.ratePa, costPa: CALC_DEFAULT.costPa, dynamicPa: 0, ...o });
const FIELDS = [['monthly', 'Rate pro Monat', 25, 0, 5000, '€', 0], ['initial', 'Startbetrag', 500, 0, 500000, '€', 0], ['years', 'Laufzeit', 1, 1, 50, 'Jahre', 0], ['ratePa', 'Rendite p. a. (Annahme)', 0.005, 0, 0.15, '%', 1], ['dynamicPa', 'Ratensteigerung p. a.', 0.005, 0, 0.1, '%', 1]];

export const savingsCompare = {
  id: 'savings-compare',
  name: 'Szenario-Vergleich',
  category: 'Sparpläne',
  description: 'Bis zu vier Szenarien (Rate, Startbetrag, Laufzeit, Rendite-Annahme, Ratensteigerung) als Linien und Tabelle nebeneinander, mit Unterschied zum ersten Szenario. Übernimmt auf Wunsch die Werte aus dem Rechner.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Szenarien im Vergleich' },
    { name: 'height', label: 'Diagramm-Höhe', type: 'number', default: 260 },
  ],
  data: [{ slot: 'scenarios', label: 'Szenarien', default: 'scenarios', shape: '{id,name,monthly,initial,years,ratePa,costPa,dynamicPa}[]', required: true }],
  events: ['compare.add', 'compare.change', 'compare.remove', 'compare.open'],
  states: ['empty'],
  css: `${SV_CSS}${CHART_CSS}
  .tk-svx2 { display:flex; flex-direction:column; gap:var(--tk-space-4); min-width:0; }
  .tk-svx2__legend { display:flex; flex-wrap:wrap; gap:6px 16px; font-size:var(--tk-fs-sm); } .tk-svx2__legend span { display:inline-flex; align-items:center; gap:6px; } .tk-svx2__legend i { width:22px; height:0; border-top:3px solid; display:inline-block; }
  .tk-svx2__card { border:1px solid var(--tk-c-border); border-radius:var(--tk-radius-lg); background:var(--tk-c-surface); overflow:hidden; }
  .tk-svx2__head { all:unset; box-sizing:border-box; display:grid; grid-template-columns:auto minmax(0,1.2fr) minmax(0,1fr) minmax(0,1fr) auto; align-items:center; gap:var(--tk-space-3); padding:12px var(--tk-space-4); cursor:pointer; width:100%; min-height:56px; }
  .tk-svx2__head:hover { background:var(--tk-c-surface2); } .tk-svx2__head:focus-visible { outline:2px solid var(--tk-c-focus); outline-offset:-2px; } .tk-svx2__head strong { display:block; font-weight:var(--tk-fw-semibold); overflow-wrap:anywhere; } .tk-svx2__head small { display:block; color:var(--tk-c-text-muted); font-size:var(--tk-fs-sm); }
  .tk-svx2__sw { width:14px; height:14px; border-radius:4px; flex:none; }
  .tk-svx2__n { text-align:right; font-variant-numeric:tabular-nums; } .tk-svx2__n b { display:block; font-size:var(--tk-fs-lg); }
  .bp-mobile .tk-svx2__head { grid-template-columns:auto minmax(0,1fr) auto; } .bp-mobile .tk-svx2__head > :nth-child(3) { display:none; } .bp-mobile .tk-svx2__head > :nth-child(4) { display:none; }
  .tk-svx2__edit { display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%,200px),1fr)); gap:var(--tk-space-4); padding:var(--tk-space-4); border-top:1px solid var(--tk-c-border); background:var(--tk-c-surface2); }
  .tk-svx2__edit .tk-btnrow { grid-column:1 / -1; display:flex; gap:8px; flex-wrap:wrap; }`,
  example: { data: { scenarios: [mk(1, { id: 's1', name: 'Basis' }), mk(2, { id: 's2', name: 'Mehr sparen', monthly: 450 })] } },
  render: function SavingsCompare({ props, data, setData, ctx }) {
    const [openId, setOpenId] = useState(null), [last, setLast] = useState(null);
    const list = arr(data.scenarios), calc = obj(ctx.ui.calc);
    useEffect(() => { if (calc.monthly != null && list.length && !list.some((s) => s.fromCalc)) setData('scenarios', (l) => [mk(arr(l).length + 1, { name: 'Aus dem Rechner', fromCalc: true, monthly: calc.monthly, initial: calc.initial ?? CALC_DEFAULT.initial, years: calc.years ?? CALC_DEFAULT.years, ratePa: calc.ratePa ?? CALC_DEFAULT.ratePa, costPa: calc.costPa ?? CALC_DEFAULT.costPa, dynamicPa: calc.dynamicPa || 0 }), ...arr(l)].slice(0, MAX)); }, [calc.monthly, list.length]);
    if (!list.length) return html`<${Card} title=${props.title} icon="git-compare"><${EmptyState} icon="git-compare" title="Noch kein Szenario" text="Lege ein Szenario an und vergleiche, wie Rate, Laufzeit und Rendite-Annahme wirken." action=${html`<${Button} variant="primary" icon="plus" onClick=${() => setData('scenarios', [mk(1, { name: 'Basis' })])}>Szenario anlegen<//>`} /><//>`;
    const runs = list.map((s) => runCalc({ ...CALC_DEFAULT, ...s, real: false, tax: false }));
    const patch = (id, p) => setData('scenarios', (l) => arr(l).map((s) => (s.id === id ? { ...s, ...p } : s)));
    const add = (src) => { if (list.length >= MAX) return; setData('scenarios', (l) => [...arr(l), mk(arr(l).length + 1, src ? { ...src, id: sid('sc-'), name: `${src.name} (Kopie)`, fromCalc: false } : { ...list[0], id: sid('sc-'), name: `Szenario ${list.length + 1}`, fromCalc: false })]); ctx.emit('compare.add'); };
    const remove = (s) => { setData('scenarios', (l) => arr(l).filter((x) => x.id !== s.id)); setLast(s); setOpenId(null); ctx.emit('compare.remove', { id: s.id }); };
    const base = runs[0].annahme.value;
    const lines = list.map((s, i) => ({ name: s.name, tone: i + 1, points: runs[i].annahme.series.filter((p, k) => k % (s.years > 25 ? 3 : 1) === 0 || k === runs[i].annahme.series.length - 1).map((p) => ({ m: p.month, value: p.value })) }));
    return html`<${Card} title=${props.title} icon="git-compare" actions=${html`<${Button} size="sm" icon="plus" disabled=${list.length >= MAX} onClick=${() => add()}>Szenario<//>`}><div class="tk-svx2">
      <${LinesChart} ctx=${ctx} lines=${lines} height=${props.height} label=${`Vergleich von ${list.length} Szenarien`} />
      <div class="tk-svx2__legend" aria-hidden="true">${list.map((s, i) => html`<span><i style=${`border-color:${toneColor(i + 1)};border-top-style:${i % 3 === 1 ? 'dashed' : i % 3 === 2 ? 'dotted' : 'solid'}`}></i>${s.name}</span>`)}</div>
      ${last && html`<div class="tk-sv-undo" role="status"><span>„${last.name}“ entfernt.</span><${Button} size="sm" variant="ghost" icon="undo-2" onClick=${() => { setData('scenarios', (l) => [...arr(l), last]); setLast(null); }}>Rückgängig<//></div>`}
      ${list.map((s, i) => { const r = runs[i], d = r.annahme.value - base, open = openId === s.id; return html`<div class="tk-svx2__card"><button type="button" class="tk-svx2__head" aria-expanded=${open ? 'true' : 'false'} onClick=${() => setOpenId(open ? null : s.id)}>
        <span class="tk-svx2__sw" style=${`background:${toneColor(i + 1)}`}></span><div><strong>${s.name}</strong><small>${eur(ctx, s.monthly)} pro Monat · ${s.years} Jahre · ${fmtPercent(s.ratePa, { digits: 1 })}${s.dynamicPa ? ` · +${fmtPercent(s.dynamicPa, { digits: 1 })} Rate` : ''}</small></div>
        <div class="tk-svx2__n"><small class="tk-sv-meta">Eingezahlt</small><b>${eur(ctx, r.annahme.invested)}</b></div><div class="tk-svx2__n"><small class="tk-sv-meta">Spanne</small><b style="font-size:var(--tk-fs-sm)">${eur(ctx, r.vorsichtig.value)} bis ${eur(ctx, r.zuversichtlich.value)}</b></div>
        <div class="tk-svx2__n"><small class="tk-sv-meta">Wert (Annahme)</small><b>${eur(ctx, r.annahme.value)}</b>${i > 0 ? html`<small class="tk-num" style=${`color:var(--tk-c-${d >= 0 ? 'success' : 'danger'})`}>${d >= 0 ? '▲' : '▼'} ${eur(ctx, d, { sign: true })}</small>` : html`<small class="tk-sv-meta">Bezug</small>`}</div></button>
        ${open && html`<div class="tk-svx2__edit"><label class="tk-field"><span class="tk-field__label">Name</span><${Input} value=${s.name} onInput=${(v) => patch(s.id, { name: v })} /></label>
          ${FIELDS.map(([k, l, step, min, max, unit, dg]) => html`<label class="tk-field"><span class="tk-field__label">${l}</span><${Stepper} label=${l} value=${unit === '%' ? Math.round(s[k] * 1000) / 10 : s[k]} step=${unit === '%' ? step * 100 : step} min=${unit === '%' ? min * 100 : min} max=${unit === '%' ? max * 100 : max} unit=${unit} digits=${dg} onChange=${(v) => { patch(s.id, { [k]: unit === '%' ? v / 100 : v }); ctx.emit('compare.change', { id: s.id, field: k }); }} /></label>`)}
          <div class="tk-btnrow"><${Button} size="sm" icon="copy" disabled=${list.length >= MAX} onClick=${() => add(s)}>Duplizieren<//><${Button} size="sm" variant="danger" icon="trash-2" disabled=${list.length <= 1} onClick=${() => remove(s)}>Entfernen<//></div></div>`}</div>`; })}
      <p class="tk-sv-note"><${Icon} name="info" size=${14} /><span>Alle Szenarien sind Modellrechnungen mit gleichbleibender Rendite-Annahme (Spanne ± 2 PP). Kein Versprechen. Unterschiede beziehen sich auf das erste Szenario.</span></p></div><//>`;
  },
};
export default [savingsCompare];
