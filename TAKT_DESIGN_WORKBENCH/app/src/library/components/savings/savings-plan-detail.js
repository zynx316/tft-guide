// Sparpläne: Sparplan-Detail – Kennzahlen, Status und Aktionen (Rate ändern, Pausieren, Dynamik, Was-wäre-wenn).
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Badge, Icon, EmptyState, Chip } from '../../ui.js';
import { fmtDate, fmtPercent, fmtRelativeDay } from '../../../lib/format.js';
import { arr, todayOf, eur, eur2, Tile, Stat, Gain, Stepper, Ring, SV_CSS, TrackerNote, pct, whenLabel } from './_savings.js';
import { planTarget, planStatus, rhythmLabel, planExecutions, planHistory, planStats, confirmedSet, patchPlan, setPlanActive, pauseUntil, nextRaise, perExecution } from './_plans.js';
import { CALC_DEFAULT } from './_calc.js';

const DYN = [0, 0.02, 0.03, 0.05];
const PAUSES = [[1, '1 Monat'], [3, '3 Monate'], [6, '6 Monate'], [0, 'Unbefristet']];

function RateForm({ plan, ctx, close, apply, from }) {
  const [v, setV] = useState(plan.monthly);
  return html`<div class="tk-col" style="gap:14px"><span class="tk-sv-meta">Rate pro Monat, gilt ab der nächsten Ausführung${from ? ` am ${fmtDate(from, { style: 'weekday' })}` : ''}.</span>
    <${Stepper} label="Rate pro Monat" value=${v} step=${25} min=${10} max=${5000} unit="€" onChange=${setV} />
    <p class="tk-sv-meta">${v === plan.monthly ? 'Unverändert.' : `${v > plan.monthly ? '+' : '−'}${eur(ctx, Math.abs(v - plan.monthly))} pro Monat, ${eur(ctx, Math.abs(v - plan.monthly) * 12)} pro Jahr.`}</p>
    <div class="tk-sv-btnrow"><${Button} variant="primary" disabled=${v === plan.monthly} onClick=${() => { apply(v); close(); }}>Rate speichern<//><${Button} variant="ghost" onClick=${close}>Abbrechen<//></div></div>`;
}

export const savingsPlanDetail = {
  id: 'savings-plan-detail',
  name: 'Sparplan-Detail',
  category: 'Sparpläne',
  description: 'Ein Sparplan im Detail: Eingezahlt, Wert, Rendite (Modell), Rate, nächste Ausführung, Dynamik. Aktionen: Rate ändern, Pausieren, Dynamik, Was-wäre-wenn im Rechner, Wertpapier öffnen. Dichte Liste, Hero-Karte oder Aktionsliste.',
  version: '1.0',
  props: [
    { name: 'style', label: 'Darstellung', type: 'select', options: ['dense', 'hero', 'actions'], default: 'dense' },
    { name: 'showActions', label: 'Aktionen', type: 'boolean', default: true },
    { name: 'showTracker', label: 'Plan-Tracker-Hinweis', type: 'boolean', default: true },
  ],
  data: [
    { slot: 'plans', label: 'Sparpläne', default: 'plans', shape: '{id,name,monthly,day,active}[]', required: true },
    { slot: 'positions', label: 'Positionen', default: 'positions', shape: '{id,cost,value,gain}[]' },
    { slot: 'accounts', label: 'Konten', default: 'accounts', shape: '{id,name,balance}[]' },
    { slot: 'goals', label: 'Sparziele', default: 'goals', shape: '{id,name,monthly,paused}[]' },
    { slot: 'transactions', label: 'Buchungen', default: 'transactions', shape: '{id,planId?}[]' },
  ],
  events: ['plan.rate', 'plan.toggle', 'plan.dynamic', 'calculator.open', 'position.open', 'goal.open', 'plan.create'],
  states: ['empty'],
  css: `${SV_CSS}
  .tk-svd { display:flex; flex-direction:column; gap:var(--tk-space-4); min-width:0; }
  .tk-svd__id { display:flex; align-items:center; gap:12px; min-width:0; flex-wrap:wrap; } .tk-svd__id h2 { margin:0; font-size:var(--tk-fs-xl); line-height:1.2; overflow-wrap:anywhere; }
  .tk-svd__kpis { display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%,150px),1fr)); gap:var(--tk-space-4) var(--tk-space-5); }
  .tk-svd__dl { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:0; margin:0; font-size:var(--tk-fs-sm); } .tk-svd__dl dt, .tk-svd__dl dd { margin:0; padding:9px 0; border-bottom:1px solid var(--tk-c-border); } .tk-svd__dl dt { color:var(--tk-c-text-muted); } .tk-svd__dl dd { text-align:right; font-variant-numeric:tabular-nums; font-weight:var(--tk-fw-medium); } .tk-svd__dl > :nth-last-child(-n+2) { border-bottom:0; }
  .tk-svd__hero { display:flex; gap:var(--tk-space-5); align-items:center; flex-wrap:wrap; } .tk-svd__hero > div:last-child { flex:1; min-width:200px; display:flex; flex-direction:column; gap:6px; }
  .tk-svd__acts { display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%,150px),1fr)); gap:var(--tk-space-2); }
  .tk-svd__act { all:unset; box-sizing:border-box; display:flex; align-items:center; gap:12px; min-height:56px; padding:10px var(--tk-space-3); border-radius:var(--tk-radius-lg); border:1px solid var(--tk-c-border); background:var(--tk-c-surface); cursor:pointer; min-width:0; }
  .tk-svd__act:hover { border-color:var(--tk-c-border-strong); background:var(--tk-c-surface2); } .tk-svd__act:focus-visible { outline:2px solid var(--tk-c-focus); } .tk-svd__act strong, .tk-svd__act small { overflow-wrap:anywhere; } .tk-svd__act strong { display:block; font-weight:var(--tk-fw-semibold); } .tk-svd__act small { display:block; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); } .tk-svd__act > div { min-width:0; }
  .tk-svd__list { display:flex; flex-direction:column; gap:var(--tk-space-2); }
  .tk-svd__note { padding:10px var(--tk-space-3); border-radius:var(--tk-radius-md); background:var(--tk-c-info-soft); display:flex; gap:10px; align-items:flex-start; font-size:var(--tk-fs-sm); }`,
  example: { data: {
    plans: [{ id: 'sp1', name: 'All-World Sparplan', positionId: 'p1', monthly: 300, day: 1, intervalMonths: 1, startDate: '2021-03-01', active: true, dynamicPa: 0.03, expectedReturnPa: 0.06, tone: 1, goalId: 'g1' }],
    positions: [{ id: 'p1', short: 'All-World', name: 'Vanguard FTSE All-World', type: 'ETF', isin: 'IE00BK5BQT80', value: 18036.55, cost: 14636.99, gain: 3399.56 }], accounts: [], goals: [{ id: 'g1', name: 'Altersvorsorge', monthly: 375 }], transactions: [] } },
  render: function SavingsPlanDetail({ props, data, setData, ctx }) {
    const today = todayOf(ctx), plans = arr(data.plans);
    const plan = plans.find((p) => p.id === ctx.ui.selectedId) || plans[0];
    if (!plan) return html`<${Card}><${EmptyState} icon="piggy-bank" title="Kein Sparplan gewählt" text="Lege einen Sparplan an oder wähle einen aus der Liste." action=${html`<${Button} variant="primary" icon="plus" onClick=${() => ctx.emit('plan.create')}>Sparplan anlegen<//>`} /><//>`;
    const tgt = planTarget(plan, data.positions, data.accounts), st = planStatus(plan), stats = planStats(plan, { positions: data.positions, accounts: data.accounts, today });
    const hist = planHistory(plan, { positions: data.positions, today }), next = planExecutions(plan, today, 1, confirmedSet(data.transactions))[0], raise = nextRaise(plan, today);
    const goal = arr(data.goals).find((g) => g.id === plan.goalId);
    const applyRate = (v) => { patchPlan(setData, plan.id, { monthly: v }); if (goal) setData('goals', (l) => arr(l).map((g) => (g.id === goal.id ? { ...g, monthly: Math.max(0, (g.monthly || 0) + v - plan.monthly) } : g))); ctx.emit('plan.rate', { id: plan.id, monthly: v }); ctx.toast(`Rate auf ${eur(ctx, v)} gesetzt.`); };
    const rate = () => ctx.openDialog({ title: 'Rate ändern', body: (close) => html`<${RateForm} plan=${plan} ctx=${ctx} close=${close} apply=${applyRate} from=${next?.date} />` });
    const dynamic = () => ctx.openDialog({ title: 'Ratensteigerung', body: (close) => html`<div class="tk-col" style="gap:12px"><span class="tk-sv-meta">Die Rate steigt jedes Jahr zum Jahrestag des Starts (${fmtDate(plan.startDate, { style: 'short' })}) um den gewählten Satz.</span>
      <div class="tk-sv-btnrow" role="group" aria-label="Ratensteigerung pro Jahr">${DYN.map((d) => html`<${Chip} active=${(plan.dynamicPa || 0) === d} onClick=${() => { patchPlan(setData, plan.id, { dynamicPa: d }); ctx.emit('plan.dynamic', { id: plan.id, dynamicPa: d }); ctx.toast(d ? `Rate steigt jährlich um ${pct(d)}.` : 'Keine Ratensteigerung.'); close(); }}>${d ? `${pct(d)} p. a.` : 'Keine'}<//>`)}</div></div>` });
    const toggle = () => {
      const base = { setData, plan, plans };
      if (plan.active) ctx.openDialog({ title: `${plan.name} pausieren`, body: (close) => html`<div class="tk-col" style="gap:12px"><p class="tk-sv-meta">Während der Pause erinnert TAKT nicht an Ausführungen. Bereits ausgeführte Käufe bleiben unverändert.</p><div class="tk-sv-btnrow">${PAUSES.map(([m, l]) => html`<${Button} onClick=${() => { setPlanActive({ ...base, active: false, until: pauseUntil(today, m) }); ctx.emit('plan.toggle', { id: plan.id, active: false }); ctx.toast(`Sparplan pausiert${m ? ` bis ${fmtDate(pauseUntil(today, m))}` : ''}.`); close(); }}>${l}<//>`)}</div></div>` });
      else { setPlanActive({ ...base, active: true }); ctx.emit('plan.toggle', { id: plan.id, active: true }); ctx.toast('Sparplan wird fortgesetzt.'); }
    };
    const whatIf = () => ctx.emit('calculator.open', { id: plan.id, ui: { calc: { ...CALC_DEFAULT, monthly: plan.monthly, initial: Math.round(stats.value / 500) * 500, ratePa: plan.expectedReturnPa ?? 0.05, dynamicPa: plan.dynamicPa || 0, years: 20 } } });
    const open = tgt.pos && (() => ctx.emit('position.open', { id: tgt.pos.id }));
    const acts = [
      { i: 'sliders-horizontal', t: 'Rate ändern', s: `Aktuell ${eur(ctx, plan.monthly)}`, f: rate }, { i: plan.active ? 'pause' : 'play', t: plan.active ? 'Pausieren' : 'Fortsetzen', s: plan.active ? 'Bis auf Weiteres anhalten' : st.label, f: toggle },
      { i: 'trending-up', t: 'Dynamik', s: plan.dynamicPa ? `${pct(plan.dynamicPa)} pro Jahr` : 'Keine Steigerung', f: dynamic }, { i: 'calculator', t: 'Was wäre wenn?', s: 'Im Rechner weiterrechnen', f: whatIf },
      ...(open ? [{ i: 'candlestick-chart', t: 'Wertpapier', s: `${tgt.label} ansehen`, f: open }] : []),
    ];
    const head = html`<div class="tk-svd__id"><${Tile} tone=${plan.tone || 1} icon=${tgt.icon} /><div class="tk-grow" style="min-width:160px"><h2>${plan.name}</h2><span class="tk-sv-meta">${tgt.label}${tgt.sub ? ` · ${tgt.sub}` : ''}</span></div><${Badge} tone=${st.tone} icon=${st.icon}>${st.label}<//></div>`;
    const rows = [['Eingezahlt', eur(ctx, stats.invested)], ['Wert', eur(ctx, stats.value)], ['Ertrag', html`<${Gain} ctx=${ctx} value=${stats.gain} ratio=${stats.ratio} />`], ...(hist ? [[`Rendite p. a. (Modell)`, ctx.privacy ? '•• %' : fmtPercent(hist.ratePa, { digits: 1 })]] : []),
      ['Rate', `${eur(ctx, plan.monthly)} · ${rhythmLabel(plan)}`], ['Nächste Ausführung', next ? `${fmtDate(next.date, { style: 'weekday' })} · ${eur2(ctx, perExecution(plan))}` : '–'], ['Seit', fmtDate(plan.startDate)], ...(goal ? [['Ziel', goal.name]] : [])];
    const actions = props.showActions && html`<div class="tk-svd__acts">${acts.map((a) => html`<button type="button" class="tk-svd__act" onClick=${a.f}><${Tile} tone="accent" icon=${a.i} size=${16} /><div><strong>${a.t}</strong><small>${a.s}</small></div></button>`)}</div>`;
    const raiseNote = raise && html`<div class="tk-svd__note"><${Icon} name="trending-up" size=${16} /><span>Die Rate steigt am ${whenLabel(raise.date, today)} von ${eur(ctx, raise.from)} auf ${eur(ctx, raise.to)}.</span></div>`;
    const tracker = props.showTracker && html`<${TrackerNote} />`;
    if (props.style === 'hero') {
      const share = stats.value ? Math.max(0, stats.gain) / stats.value : 0;
      return html`<${Card}><div class="tk-svd"><div class="tk-svd__id"><${Tile} tone=${plan.tone || 1} icon=${tgt.icon} /><div class="tk-grow" style="min-width:160px"><h2 style="margin:0;font-size:var(--tk-fs-xl)">${plan.name}</h2><span class="tk-sv-meta">${tgt.label}</span></div><${Badge} tone=${st.tone} icon=${st.icon}>${st.label}<//></div>
        <div class="tk-svd__hero"><${Ring} size=${132} stroke=${14} value=${share} tone="accent" label=${`Ertrag ${pct(share)} vom Wert`}><span class="tk-sv-meta" style="font-size:var(--tk-fs-xs)">Ertrag</span><strong class="tk-num" style="font-size:var(--tk-fs-xl)">${pct(share)}</strong><//>
          <div><${Stat} big label="Wert heute" value=${eur(ctx, stats.value)} sub=${html`<span>eingezahlt ${eur(ctx, stats.invested)} · </span><${Gain} ctx=${ctx} value=${stats.gain} ratio=${stats.ratio} />`} />
            <span class="tk-sv-meta">${eur(ctx, plan.monthly)} · ${rhythmLabel(plan)}${next ? ` · nächste Ausführung ${fmtDate(next.date, { style: 'weekday' })}` : ''}</span></div></div>${raiseNote}${actions}${tracker}</div><//>`;
    }
    if (props.style === 'actions') {
      return html`<${Card}><div class="tk-svd">${head}<div class="tk-svd__kpis"><${Stat} label="Nächste Ausführung" value=${next ? fmtDate(next.date, { style: 'weekday' }) : '–'} sub=${next ? `${eur2(ctx, perExecution(plan))} · ${fmtRelativeDay(next.date, today)}` : st.label} /><${Stat} label="Wert" value=${eur(ctx, stats.value)} sub=${html`<${Gain} ctx=${ctx} value=${stats.gain} ratio=${stats.ratio} showAmount=${false} />`} /></div>${raiseNote}${actions}${tracker}</div><//>`;
    }
    return html`<${Card}><div class="tk-svd">${head}<dl class="tk-svd__dl">${rows.map(([k, v]) => html`<dt>${k}</dt><dd>${v}</dd>`)}</dl>${raiseNote}${actions}${tracker}</div><//>`;
  },
};
export default [savingsPlanDetail];
