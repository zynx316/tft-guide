// Sparpläne: Regler für den Rechner – Startbetrag, Rate, Laufzeit, Rendite, Kosten, Ratensteigerung (schreibt ui.calc).
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Chip, Switch, Select, Segmented } from '../../ui.js';
import { fmtNumber } from '../../../lib/format.js';
import { arr, parseDe, clamp, SV_CSS } from './_savings.js';
import { COMPOUNDING } from '../../../core/finmath.js';
import { CALC_DEFAULT, CALC_LIMITS, COMPOUNDING_OPTIONS, INFLATION, getCalc, setCalc } from './_calc.js';
import { planPosition } from './_plans.js';

const PCT = { ratePa: 1, costPa: 2, dynamicPa: 1 };
const show = (k, v) => (PCT[k] != null ? fmtNumber(v * 100, { digits: PCT[k] }) : fmtNumber(v, { digits: 0 }));
const read = (k, raw) => { const n = parseDe(raw); if (n == null) return null; const L = CALC_LIMITS[k]; const v = PCT[k] != null ? n / 100 : n; return clamp(Math.round(v / L.step) * L.step, L.min, L.max); };

function Slider({ k, value, onChange, onCommit }) {
  const L = CALC_LIMITS[k], [txt, setTxt] = useState(null);
  const pct = ((value - L.min) / (L.max - L.min)) * 100;
  const unit = L.unit;
  const commit = () => { if (txt == null) return; const v = read(k, txt); if (v != null) { onChange(v); onCommit(v); } setTxt(null); };
  return html`<div class="tk-svs__f"><div class="tk-svs__top"><label class="tk-svs__lab" for=${`svs-${k}`}>${L.label}</label>
      <span class="tk-svs__val"><input id=${`svs-${k}`} class="tk-svs__num" inputmode="decimal" value=${txt ?? show(k, value)} aria-label=${`${L.label} in ${unit === '%' ? 'Prozent' : unit === '€' ? 'Euro' : 'Jahren'}`}
        onInput=${(e) => setTxt(e.currentTarget.value)} onBlur=${commit} onKeyDown=${(e) => e.key === 'Enter' && commit()} /><span>${unit}</span></span></div>
    <input type="range" class="tk-svs__range" style=${`--pct:${pct}%`} min=${L.min} max=${L.max} step=${L.step} value=${value} aria-label=${`${L.label} (Regler)`} aria-valuetext=${`${show(k, value)} ${unit}`}
      onInput=${(e) => { setTxt(null); onChange(Number(e.currentTarget.value)); }} onChange=${(e) => onCommit(Number(e.currentTarget.value))} /></div>`;
}

export const savingsSliders = {
  id: 'savings-sliders',
  name: 'Rechner-Regler',
  category: 'Sparpläne',
  description: 'Regler und Direkteingabe für Startbetrag, Monatsrate, Laufzeit, Rendite-Annahme, Kosten und Ratensteigerung. Schreibt den Rechner-Zustand (ui.calc), auf den Diagramm, Ergebnis und Tabelle reagieren. Optionen: Verzinsung (effektiv oder nominal), Inflation, Steuer-Schätzung.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Eingaben' },
    { name: 'fields', label: 'Felder', type: 'list', default: ['initial', 'monthly', 'years', 'ratePa', 'costPa', 'dynamicPa'] },
    { name: 'columns', label: 'Spalten (Desktop)', type: 'select', options: ['1', '2'], default: '1' },
    { name: 'showPresets', label: 'Rendite-Voreinstellungen', type: 'boolean', default: true },
    { name: 'showOptions', label: 'Optionen Inflation/Steuer', type: 'boolean', default: true },
    { name: 'showSource', label: 'Aus Sparplan übernehmen', type: 'boolean', default: true },
    { name: 'framed', label: 'In Karte', type: 'boolean', default: true },
  ],
  data: [
    { slot: 'plans', label: 'Sparpläne', default: 'plans', shape: '{id,name,monthly,dynamicPa,expectedReturnPa,positionId?}[]' },
    { slot: 'positions', label: 'Positionen', default: 'positions', shape: '{id,value}[]' },
  ],
  events: ['calc.change', 'calc.preset', 'calc.reset', 'calc.source', 'calc.option', 'calc.compounding'],
  states: [],
  css: `${SV_CSS}
  .tk-svs { display:flex; flex-direction:column; gap:var(--tk-space-4); min-width:0; }
  .tk-svs__grid { display:grid; gap:var(--tk-space-5) var(--tk-space-6); grid-template-columns:minmax(0,1fr); } .bp-desktop .tk-svs__grid--2 { grid-template-columns:repeat(2, minmax(0,1fr)); }
  .tk-svs__f { display:flex; flex-direction:column; gap:2px; min-width:0; }
  .tk-svs__top { display:flex; align-items:center; justify-content:space-between; gap:12px; }
  .tk-svs__lab { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); font-weight:var(--tk-fw-medium); }
  .tk-svs__val { display:inline-flex; align-items:center; gap:6px; color:var(--tk-c-text-muted); font-size:var(--tk-fs-sm); }
  .tk-svs__num { width:max(92px, 6.4em); max-width:100%; box-sizing:border-box; height:34px; text-align:right; padding:0 10px; border-radius:var(--tk-radius-md); border:1px solid var(--tk-c-border-strong); background:var(--tk-c-surface2); color:var(--tk-c-text); font-weight:var(--tk-fw-semibold); font-size:var(--tk-fs-lg); font-variant-numeric:tabular-nums; outline:none; }
  .tk-svs__num:focus { border-color:var(--tk-c-accent); box-shadow:0 0 0 3px var(--tk-c-accent-soft); } .bp-mobile .tk-svs__num { height:44px; font-size:16px; }
  .tk-svs__range { -webkit-appearance:none; appearance:none; width:100%; height:32px; margin:0; background:transparent; cursor:pointer; }
  .bp-mobile .tk-svs__range { height:44px; }
  .tk-svs__range::-webkit-slider-runnable-track { height:6px; border-radius:3px; background:linear-gradient(to right, var(--tk-c-accent) var(--pct), var(--tk-c-surface3) var(--pct)); }
  .tk-svs__range::-moz-range-track { height:6px; border-radius:3px; background:var(--tk-c-surface3); } .tk-svs__range::-moz-range-progress { height:6px; border-radius:3px; background:var(--tk-c-accent); }
  .tk-svs__range::-webkit-slider-thumb { -webkit-appearance:none; appearance:none; width:24px; height:24px; border-radius:50%; background:var(--tk-c-accent); border:3px solid var(--tk-c-surface); box-shadow:var(--tk-shadow-sm), 0 0 0 1px var(--tk-c-accent); margin-top:-9px; }
  .tk-svs__range::-moz-range-thumb { width:20px; height:20px; border-radius:50%; background:var(--tk-c-accent); border:3px solid var(--tk-c-surface); box-shadow:0 0 0 1px var(--tk-c-accent); }
  .tk-svs__range:focus-visible { outline:2px solid var(--tk-c-focus); outline-offset:2px; border-radius:6px; }
  .tk-svs__opts { display:flex; flex-direction:column; gap:10px; padding-top:var(--tk-space-3); border-top:1px solid var(--tk-c-border); }
  .tk-svs__conv { display:flex; flex-direction:column; align-items:flex-start; gap:6px; } .tk-svs__convt { color:var(--tk-c-text-subtle); font-size:var(--tk-fs-xs); line-height:var(--tk-lh-snug); }
  .tk-svs__opt { display:flex; align-items:center; justify-content:space-between; gap:12px; min-height:36px; font-size:var(--tk-fs-sm); color:var(--tk-c-text); } .tk-svs__opt small { display:block; color:var(--tk-c-text-subtle); }
  .tk-svs__chips { display:flex; flex-wrap:wrap; gap:6px; align-items:center; } .tk-svs__chips > span { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); margin-right:4px; }`,
  example: { data: { plans: [{ id: 'sp1', name: 'All-World Sparplan', monthly: 300, dynamicPa: 0.03, expectedReturnPa: 0.06, positionId: 'p1' }], positions: [{ id: 'p1', value: 18036.55 }] } },
  render: function SavingsSliders({ props, data, ctx }) {
    const c = getCalc(ctx);
    const fields = (Array.isArray(props.fields) ? props.fields : String(props.fields).split(',')).map((s) => s.trim()).filter((k) => CALC_LIMITS[k]);
    const set = (patch) => setCalc(ctx, patch);
    const plans = arr(data.plans);
    const fromPlan = (id) => { const p = plans.find((x) => x.id === id); if (!p) return; const pos = planPosition(p, data.positions); set({ monthly: p.monthly, dynamicPa: p.dynamicPa || 0, ratePa: p.expectedReturnPa ?? c.ratePa, initial: pos ? Math.round(pos.value / 500) * 500 : c.initial }); ctx.emit('calc.source', { id }); };
    const body = html`<div class="tk-svs">
      ${props.showSource && plans.length > 0 && html`<label class="tk-field"><span class="tk-field__label">Werte übernehmen von</span><${Select} value="" onChange=${fromPlan} aria-label="Werte aus einem Sparplan übernehmen" options=${[{ value: '', label: 'Eigene Eingaben' }, ...plans.map((p) => ({ value: p.id, label: p.name }))]} /></label>`}
      ${props.showPresets && fields.includes('ratePa') && html`<div class="tk-svs__chips" role="group" aria-label="Rendite-Annahme wählen"><span>Annahme</span>${[0.03, 0.05, 0.07].map((r) => html`<${Chip} active=${Math.abs(c.ratePa - r) < 1e-9} onClick=${() => { set({ ratePa: r }); ctx.emit('calc.preset', { ratePa: r }); }}>${fmtNumber(r * 100, { digits: 0 })} %<//>`)}</div>`}
      <div class=${`tk-svs__grid ${props.columns === '2' ? 'tk-svs__grid--2' : ''}`}>${fields.map((k) => html`<${Slider} key=${k} k=${k} value=${c[k]} onChange=${(v) => set({ [k]: v })} onCommit=${(v) => ctx.emit('calc.change', { field: k, value: v })} />`)}</div>
      ${props.showOptions && html`<div class="tk-svs__opts">
        <div class="tk-svs__conv" data-qa="calc-convention"><span class="tk-svs__lab" id="svs-conv-l">Verzinsung</span>
          <${Segmented} label="Verzinsungskonvention" value=${c.compounding} onChange=${(v) => { set({ compounding: v }); ctx.emit('calc.compounding', { compounding: v }); }} options=${COMPOUNDING_OPTIONS} />
          <small class="tk-svs__convt">${COMPOUNDING[c.compounding]?.kurz}</small></div>
        <div class="tk-svs__opt"><span>In heutiger Kaufkraft<small>Rendite abzüglich ${fmtNumber(INFLATION * 100, { digits: 0 })} % Inflation p. a. (Annahme)</small></span><${Switch} checked=${c.real} label="In heutiger Kaufkraft rechnen" onChange=${(v) => { set({ real: v }); ctx.emit('calc.option', { real: v }); }} /></div>
        <div class="tk-svs__opt"><span>Nach Steuern schätzen<small>Vereinfacht, Aktienfonds, ohne Kirchensteuer</small></span><${Switch} checked=${c.tax} label="Nach Steuern schätzen" onChange=${(v) => { set({ tax: v }); ctx.emit('calc.option', { tax: v }); }} /></div></div>`}
      <div class="tk-sv-btnrow"><${Button} size="sm" variant="ghost" icon="rotate-ccw" onClick=${() => { ctx.setUi('calc', { ...CALC_DEFAULT }); ctx.emit('calc.reset'); }}>Zurücksetzen<//></div></div>`;
    return props.framed ? html`<${Card} title=${props.title} icon="sliders-horizontal">${body}<//>` : body;
  },
};
export default [savingsSliders];
