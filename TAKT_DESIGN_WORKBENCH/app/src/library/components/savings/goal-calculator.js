// Sparpläne: Zielrechner rückwärts – „Ich möchte X in Y Jahren“ → nötige Monatsrate (Spanne), Alternativen. Schreibt auch ui.calc.
import { html } from '../../../lib/html.js';
import { useEffect } from 'preact/hooks';
import { Card, Button, Chip, Select } from '../../ui.js';
import { fmtNumber, fmtDate } from '../../../lib/format.js';
import { arr, obj, todayOf, eur, eur2, Stepper, SV_CSS, plural } from './_savings.js';
import { getCalc, neededMonthly, SPREAD } from './_calc.js';
import { monthsBetween } from './_plans.js';
import { CHART_CSS } from './_chart.js';

const GC_DEFAULT = { target: 50000, current: 5000, years: 10, ratePa: 0.05 };
const pc = (r) => `${fmtNumber(r * 100, { digits: Number.isInteger(Math.round(r * 1000) / 10) ? 0 : 1 })} %`;

export const goalCalculator = {
  id: 'goal-calculator',
  name: 'Zielrechner',
  category: 'Sparpläne',
  description: 'Rückwärts rechnen: Zielbetrag, Zeit und vorhandenes Geld eingeben, TAKT nennt die nötige Monatsrate als Spanne (Annahme ± 2 PP), Alternativen mit mehr oder weniger Zeit und den Weg zum Sparplan. Ziele aus der Liste übernehmbar.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Was brauche ich für mein Ziel?' },
    { name: 'framed', label: 'In Karte', type: 'boolean', default: true },
    { name: 'showAlternatives', label: 'Alternativen', type: 'boolean', default: true },
  ],
  data: [{ slot: 'goals', label: 'Sparziele', default: 'goals', shape: '{id,name,target,current,due}[]' }],
  events: ['goalcalc.change', 'goalcalc.source', 'calc.create'],
  states: [],
  css: `${SV_CSS}${CHART_CSS}
  .tk-svg { display:flex; flex-direction:column; gap:var(--tk-space-5); min-width:0; }
  .tk-svg__in { display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%,210px),1fr)); gap:var(--tk-space-4); }
  .tk-svg__res { padding:var(--tk-space-5); border-radius:var(--tk-radius-xl); background:var(--tk-c-accent-soft); border:1px solid color-mix(in srgb, var(--tk-c-accent) 40%, transparent); display:flex; flex-direction:column; gap:6px; }
  .tk-svg__big { font-size:clamp(28px, 7vw, 40px); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); line-height:1.1; font-variant-numeric:tabular-nums; overflow-wrap:anywhere; }
  .tk-svg__alt { display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%,150px),1fr)); gap:var(--tk-space-3); }
  .tk-svg__alt > div { padding:var(--tk-space-3); border-radius:var(--tk-radius-lg); border:1px solid var(--tk-c-border); background:var(--tk-c-surface2); display:flex; flex-direction:column; gap:2px; min-width:0; }
  .tk-svg__alt b { font-variant-numeric:tabular-nums; font-size:var(--tk-fs-lg); } .tk-svg__alt small { color:var(--tk-c-text-muted); font-size:var(--tk-fs-sm); }
  .tk-svg__chips { display:flex; gap:6px; flex-wrap:wrap; align-items:center; }`,
  example: { data: { goals: [{ id: 'g1', name: 'Japan-Reise 2027', target: 6000, current: 2150, due: '2027-09-01' }] } },
  render: function GoalCalculator({ props, data, ctx }) {
    const g = { ...GC_DEFAULT, ...obj(ctx.ui.goalcalc) }, goals = arr(data.goals), today = todayOf(ctx);
    const apply = (patch) => {
      const n = { ...g, ...patch };
      ctx.setUi('goalcalc', n);
      const need = neededMonthly({ target: n.target, current: n.current, years: n.years, ratePa: n.ratePa });
      ctx.setUi('calc', { ...getCalc(ctx), initial: n.current, monthly: Math.round(need.annahme * 100) / 100, years: n.years, ratePa: n.ratePa, dynamicPa: 0, costPa: 0 });
    };
    useEffect(() => { if (!ctx.ui.goalcalc) apply({}); }, []);
    const fromGoal = (id) => { const gl = goals.find((x) => x.id === id); if (!gl) return; apply({ target: gl.target, current: Math.round(gl.current), years: Math.max(1, Math.ceil(monthsBetween(today, gl.due) / 12)) }); ctx.emit('goalcalc.source', { id }); };
    const set = (k) => (v) => { apply({ [k]: v }); ctx.emit('goalcalc.change', { field: k, value: v }); };
    const need = neededMonthly({ target: g.target, current: g.current, years: g.years, ratePa: g.ratePa });
    const more = neededMonthly({ target: g.target, current: g.current, years: g.years + 2, ratePa: g.ratePa }).annahme, less = g.years > 2 ? neededMonthly({ target: g.target, current: g.current, years: g.years - 2, ratePa: g.ratePa }).annahme : null;
    const zero = neededMonthly({ target: g.target, current: g.current, years: g.years, ratePa: 0 }).annahme;
    const enough = need.annahme <= 0;
    const body = html`<div class="tk-svg">
      ${goals.length > 0 && html`<label class="tk-field"><span class="tk-field__label">Ziel übernehmen</span><${Select} value="" onChange=${fromGoal} aria-label="Sparziel übernehmen" options=${[{ value: '', label: 'Eigene Eingaben' }, ...goals.map((x) => ({ value: x.id, label: x.name }))]} /></label>`}
      <div class="tk-svg__in">
        <label class="tk-field"><span class="tk-field__label">Zielbetrag</span><${Stepper} label="Zielbetrag" value=${g.target} step=${500} min=${500} max=${2000000} unit="€" onChange=${set('target')} /></label>
        <label class="tk-field"><span class="tk-field__label">Schon vorhanden</span><${Stepper} label="Schon vorhanden" value=${g.current} step=${500} min=${0} max=${2000000} unit="€" onChange=${set('current')} /></label>
        <label class="tk-field"><span class="tk-field__label">In wie vielen Jahren</span><${Stepper} label="Laufzeit in Jahren" value=${g.years} step=${1} min=${1} max=${50} unit="Jahre" onChange=${set('years')} /></label></div>
      <div class="tk-svg__chips" role="group" aria-label="Rendite-Annahme"><span class="tk-sv-meta">Annahme p. a.</span>${[0, 0.025, 0.05, 0.07].map((r) => html`<${Chip} active=${Math.abs(g.ratePa - r) < 1e-9} onClick=${() => set('ratePa')(r)}>${pc(r)}<//>`)}</div>
      <div class="tk-svg__res" role="status" aria-live="polite">
        ${enough ? html`<span class="tk-sv-lead">Dein Startbetrag würde bei ${pc(g.ratePa)} Rendite p. a. allein reichen.</span><span class="tk-sv-meta">Für ${eur(ctx, g.target)} in ${plural(g.years, 'Jahr', 'Jahren')} wäre keine Monatsrate nötig.</span>`
          : html`<span class="tk-sv-meta">Für ${eur(ctx, g.target)} in ${g.years === 1 ? 'einem Jahr' : `${g.years} Jahren`} wären etwa nötig</span><div class="tk-svg__big">${eur2(ctx, need.annahme)} <span style="font-size:var(--tk-fs-lg);font-weight:var(--tk-fw-medium)">pro Monat</span></div>
          <span class="tk-sv-meta">Spanne: ${eur(ctx, need.zuversichtlich)} bei ${pc(g.ratePa + SPREAD)} bis ${eur(ctx, need.vorsichtig)} bei ${pc(Math.max(0, g.ratePa - SPREAD))} Rendite p. a.</span>`}
        <span class="tk-sv-meta">Eingezahlt wären das ${eur(ctx, g.current + Math.max(0, need.annahme) * need.months)}, der Rest käme aus Erträgen. Stand ${fmtDate(today)}.</span></div>
      ${props.showAlternatives && !enough && html`<div class="tk-svg__alt" aria-label="Alternativen"><div><small>Ohne Rendite</small><b>${eur(ctx, zero)}</b><small>pro Monat</small></div>
        <div><small>${g.years + 2} Jahre Zeit</small><b>${eur(ctx, more)}</b><small>pro Monat</small></div>${less != null && html`<div><small>${g.years - 2} Jahre Zeit</small><b>${eur(ctx, less)}</b><small>pro Monat</small></div>`}</div>`}
      <div class="tk-sv-btnrow"><${Button} variant="primary" icon="plus" disabled=${enough} onClick=${() => ctx.emit('calc.create', { ui: { draft: { monthly: Math.ceil(need.annahme / 5) * 5, ratePa: g.ratePa, dynamicPa: 0 } } })}>Als Sparplan anlegen<//></div></div>`;
    return props.framed ? html`<${Card} title=${props.title} icon="target">${body}<//>` : body;
  },
};
export default [goalCalculator];
