// Sparpläne: Sparziele mit ehrlicher Prognose – Fortschritt, voraussichtliches Datum, nötige Rate (Liste, Karten mit Ring, Fokus-Karte).
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Badge, Icon, EmptyState, Progress } from '../../ui.js';
import { fmtDate, fmtPercent } from '../../../lib/format.js';
import { MONTHS_LONG } from '../../../lib/date.js';
import { monthsToGoal } from '../../../core/finmath.js';
import { arr, todayOf, eur, pct, Tile, Ring, Stepper, SV_CSS, spanLabel, sum } from './_savings.js';
import { goalForecast, patchPlan } from './_plans.js';
import { SPREAD } from './_calc.js';
import { CHART_CSS } from './_chart.js';

const monthYear = (d) => `${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
const STATUS = { 'im Plan': ['success', 'check-circle-2'], erreicht: ['success', 'trophy'], hinterher: ['warning', 'alert-circle'], 'ohne Rate': ['warning', 'alert-circle'] };

/** Ein Satz Prognose, sachlich und konkret (Konjunktiv, mit Annahme). */
export function goalSentence(ctx, f) {
  const lead = f.paused ? `Pausiert${f.resume ? ` bis ${fmtDate(f.resume)}` : ''}. ` : '';
  if (f.status === 'erreicht') return 'Ziel erreicht.';
  if (f.status === 'ohne Rate') return `Ohne Sparrate wird das Ziel nicht erreicht.${f.due ? ` Bis ${fmtDate(f.due)} wären etwa ${eur(ctx, f.required)} pro Monat nötig.` : ''}`;
  if (f.status === 'hinterher') return `${lead}Mit ${eur(ctx, f.monthly)} pro Monat wäre das Ziel erst im ${monthYear(f.eta)} erreicht. Bis ${fmtDate(f.due)} wären etwa ${eur(ctx, f.required)} pro Monat nötig.`;
  return `${lead}Voraussichtlich erreicht im ${monthYear(f.eta)}${f.due ? `, geplant bis ${fmtDate(f.due)}` : ''}.`;
}

function RateDialog({ f, setData, plans, ctx, close }) {
  const [v, setV] = useState(f.goal.monthly || 0);
  const sim = goalForecast({ ...f.goal, monthly: v, paused: false }, plans, todayOf(ctx));
  return html`<div class="tk-col" style="gap:14px"><span class="tk-sv-meta">Monatliche Rate für „${f.goal.name}“</span>
    <${Stepper} label="Rate pro Monat" value=${v} step=${25} min=${0} max=${5000} unit="€" onChange=${setV} />
    <p class="tk-sv-lead" style="font-size:var(--tk-fs-md)">${goalSentence(ctx, sim)}</p>
    <p class="tk-sv-meta">Modellrechnung mit ${pct(sim.ratePa)} Rendite p. a. (Annahme des Plans). Kein Versprechen.</p>
    <div class="tk-sv-btnrow"><${Button} variant="primary" onClick=${() => { setData('goals', (l) => arr(l).map((g) => (g.id === f.goal.id ? { ...g, monthly: v } : g))); const act = f.linked.filter((p) => p.active); if (act.length === 1) patchPlan(setData, act[0].id, { monthly: v }); ctx.emit('goal.rate', { id: f.goal.id, monthly: v }); ctx.toast(`Rate auf ${eur(ctx, v)} gesetzt.`); close(); }}>Rate speichern<//><${Button} variant="ghost" onClick=${close}>Abbrechen<//></div></div>`;
}

export const savingsGoalCard = {
  id: 'savings-goal-card',
  name: 'Sparziele mit Prognose',
  category: 'Sparpläne',
  description: 'Sparziele mit Fortschritt, voraussichtlichem Datum und nötiger Rate (Modellrechnung). Liste (dicht), Karten mit Ring oder Fokus-Karte für das Ziel, das Aufmerksamkeit braucht. Rate anpassen direkt im Dialog.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Sparziele' },
    { name: 'style', label: 'Darstellung', type: 'select', options: ['list', 'cards', 'hero'], default: 'list' },
    { name: 'limit', label: 'Max. Einträge (0 = alle)', type: 'number', default: 0 },
    { name: 'showForecast', label: 'Prognose-Satz', type: 'boolean', default: true },
    { name: 'framed', label: 'In Karte', type: 'boolean', default: true },
  ],
  data: [
    { slot: 'goals', label: 'Sparziele', default: 'goals', shape: '{id,name,target,current,due,monthly,icon,tone,paused?}[]', required: true },
    { slot: 'plans', label: 'Sparpläne', default: 'plans', shape: '{id,goalId,monthly,active,expectedReturnPa}[]' },
  ],
  events: ['goal.open', 'goal.rate', 'goal.create', 'goals.open', 'plan.create'],
  states: ['empty'],
  css: `${SV_CSS}${CHART_CSS}
  .tk-svgl { display:flex; flex-direction:column; min-width:0; }
  .tk-svgl__row { all:unset; box-sizing:border-box; display:grid; grid-template-columns:auto minmax(0,1fr) minmax(0,1.1fr) auto; gap:var(--tk-space-3); align-items:center; padding:12px var(--tk-space-4); border-bottom:1px solid var(--tk-c-border); cursor:pointer; min-width:0; width:100%; }
  .tk-svgl__row:last-child { border-bottom:0; } .tk-svgl__row:hover { background:var(--tk-c-surface2); } .tk-svgl__row:focus-visible { outline:2px solid var(--tk-c-focus); outline-offset:-2px; }
  .tk-svgl__row strong { display:block; font-weight:var(--tk-fw-semibold); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .tk-svgl__row small, .tk-svgl__meta { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); display:block; }
  .tk-svgl__prog { display:flex; flex-direction:column; gap:6px; min-width:0; } .tk-svgl__prog .tk-sv-meta { font-variant-numeric:tabular-nums; }
  .bp-mobile .tk-svgl__row { grid-template-columns:auto minmax(0,1fr) auto; } .bp-mobile .tk-svgl__prog { grid-column:1 / -1; }
  .tk-svgl__cards { display:grid; grid-template-columns:repeat(auto-fill, minmax(260px,1fr)); gap:var(--tk-space-4); }
  .tk-svgl__card { all:unset; box-sizing:border-box; display:flex; gap:var(--tk-space-4); align-items:center; padding:var(--tk-space-4); border-radius:var(--tk-radius-lg); border:1px solid var(--tk-c-border); background:var(--tk-c-surface); cursor:pointer; min-width:0; }
  .tk-svgl__card:hover { border-color:var(--tk-c-border-strong); } .tk-svgl__card:focus-visible { outline:2px solid var(--tk-c-focus); }
  .tk-svgl__card > div:last-child { min-width:0; display:flex; flex-direction:column; gap:4px; flex:1; } .tk-svgl__card strong { font-weight:var(--tk-fw-semibold); }
  .tk-svgl__hero { display:flex; flex-direction:column; gap:var(--tk-space-4); }
  .tk-svgl__hero h3 { margin:0; font-size:var(--tk-fs-xl); line-height:1.25; }
  .tk-svgl__facts { display:grid; grid-template-columns:repeat(auto-fit, minmax(120px,1fr)); gap:var(--tk-space-3); }
  .tk-svgl__ms { display:flex; gap:6px; flex-wrap:wrap; }`,
  example: { data: { goals: [{ id: 'g1', name: 'Notgroschen (6 Monatsausgaben)', target: 15000, current: 9500, icon: 'shield', tone: 3, due: '2029-12-31', monthly: 150 }, { id: 'g2', name: 'Japan-Reise 2027', target: 6000, current: 2150, icon: 'plane', tone: 5, due: '2027-09-01', monthly: 0 }], plans: [{ id: 'sp1', goalId: 'g1', monthly: 150, active: true, expectedReturnPa: 0.025 }] } },
  render: function SavingsGoalCard({ props, data, setData, ctx }) {
    const today = todayOf(ctx), plans = arr(data.plans);
    const wrap = (b, actions) => (props.framed ? html`<${Card} flush=${props.style === 'list'} title=${props.title} icon="target" actions=${actions}>${b}<//>` : b);
    const add = html`<${Button} size="sm" icon="plus" onClick=${() => ctx.emit('goal.create')}>Ziel<//>`;
    const goals = arr(data.goals);
    if (!goals.length) return wrap(html`<${EmptyState} icon="target" title="Noch kein Sparziel" text="Ein Ziel gibt deinen Sparplänen einen Zweck: Betrag, Datum, fertig. TAKT zeigt, ob du auf Kurs bist." action=${html`<${Button} variant="primary" icon="plus" onClick=${() => ctx.emit('goal.create')}>Ziel anlegen<//>`} />`);
    let fc = goals.map((g) => goalForecast(g, plans, today));
    if (props.limit > 0) fc = fc.slice(0, props.limit);
    const open = (f) => {
      ctx.emit('goal.open', { id: f.goal.id });
      const ms = [0.25, 0.5, 0.75, 1];
      const alt = f.monthly > 0 && f.status !== 'erreicht' ? [[Math.max(0, f.ratePa - SPREAD), 'vorsichtig'], [f.ratePa, 'Annahme'], [f.ratePa + SPREAD, 'zuversichtlich']].map(([r, n]) => [n, r, monthsToGoal({ target: f.goal.target, current: f.goal.current, monthly: f.monthly, ratePa: r })]) : [];
      ctx.openDialog({ title: f.goal.name, body: () => html`<div class="tk-col" style="gap:14px"><${Progress} value=${f.progress} /><div class="tk-svgl__facts">
          <div class="tk-sv-stat"><span class="tk-sv-stat__l">Stand</span><strong class="tk-num" style="font-size:var(--tk-fs-lg)">${eur(ctx, f.goal.current)}</strong></div>
          <div class="tk-sv-stat"><span class="tk-sv-stat__l">Ziel</span><strong class="tk-num" style="font-size:var(--tk-fs-lg)">${eur(ctx, f.goal.target)}</strong></div>
          <div class="tk-sv-stat"><span class="tk-sv-stat__l">Rate</span><strong class="tk-num" style="font-size:var(--tk-fs-lg)">${eur(ctx, f.monthly)}</strong></div></div>
        <p class="tk-sv-lead" style="font-size:var(--tk-fs-md)">${goalSentence(ctx, f)}</p>
        <div class="tk-svgl__ms" aria-label="Meilensteine">${ms.map((m) => html`<${Badge} tone=${f.progress >= m ? 'success' : 'neutral'} icon=${f.progress >= m ? 'check' : undefined}>${fmtPercent(m, { digits: 0 })}<//>`)}</div>
        ${alt.length > 0 && html`<div><div class="tk-label" style="margin-bottom:6px">Dauer bis zum Ziel bei ${eur(ctx, f.monthly)} pro Monat</div>${alt.map(([n, r, m]) => html`<div class="tk-sv-row" style="justify-content:space-between;padding:4px 0"><span class="tk-sv-meta">${n} · ${fmtPercent(r, { digits: 1 })} p. a.</span><strong class="tk-num">${spanLabel(m)}</strong></div>`)}</div>`}
        <p class="tk-sv-meta">Modellrechnung, kein Versprechen. Annahmen kommen vom verknüpften Sparplan.</p></div>`,
        footer: (close) => html`<${Button} variant="ghost" onClick=${close}>Schließen<//><${Button} variant="primary" icon="sliders-horizontal" onClick=${() => { close(); rate(f); }}>Rate anpassen<//>` });
    };
    const rate = (f) => ctx.openDialog({ title: 'Rate anpassen', body: (close) => html`<${RateDialog} f=${f} setData=${setData} plans=${plans} ctx=${ctx} close=${close} />` });
    const badge = (f) => html`<${Badge} tone=${STATUS[f.status][0]} icon=${STATUS[f.status][1]}>${f.paused && f.status !== 'erreicht' ? 'Pausiert' : f.status === 'im Plan' ? 'Im Plan' : f.status === 'ohne Rate' ? 'Ohne Rate' : f.status === 'hinterher' ? 'Hinterher' : 'Erreicht'}<//>`;

    if (props.style === 'hero') {
      const order = { hinterher: 0, 'ohne Rate': 0, 'im Plan': 1, erreicht: 2 };
      const f = [...fc].sort((a, b) => order[a.status] - order[b.status] || b.gap - a.gap)[0];
      const attn = f.status === 'hinterher' || f.status === 'ohne Rate';
      return wrap(html`<div class="tk-svgl__hero"><div class="tk-sv-row"><${Tile} tone=${f.goal.tone || 1} icon=${f.goal.icon || 'target'} /><div class="tk-grow"><span class="tk-sv-meta">${attn ? 'Braucht Aufmerksamkeit' : 'Als Nächstes erreicht'}</span><h3 class="tk-truncate">${f.goal.name}</h3></div>${badge(f)}</div>
        <div><div class="tk-sv-row" style="justify-content:space-between;margin-bottom:6px"><strong class="tk-num">${eur(ctx, f.goal.current)}</strong><span class="tk-sv-meta tk-num">von ${eur(ctx, f.goal.target)} · ${pct(f.progress)}</span></div><${Progress} value=${f.progress} tone=${attn ? 'warning' : 'success'} /></div>
        <p class="tk-sv-lead">${goalSentence(ctx, f)}</p>
        <div class="tk-sv-btnrow"><${Button} variant="primary" icon=${attn ? 'plus' : 'sliders-horizontal'} onClick=${() => (attn && f.status === 'ohne Rate' ? ctx.emit('plan.create', { ui: { draft: { goalId: f.goal.id, monthly: Math.ceil(f.required / 5) * 5 } } }) : rate(f))}>${attn && f.status === 'ohne Rate' ? 'Sparplan anlegen' : 'Rate anpassen'}<//><${Button} onClick=${() => open(f)}>Details<//></div></div>`);
    }
    if (props.style === 'cards') {
      return wrap(html`<div class="tk-svgl__cards">${fc.map((f) => html`<button type="button" class="tk-svgl__card" onClick=${() => open(f)} aria-label=${`${f.goal.name}: ${pct(f.progress)} erreicht`}>
        <${Ring} size=${86} stroke=${9} value=${f.progress} tone=${f.tone === 'warning' ? 'warning' : f.goal.tone || 'success'} label=${`${pct(f.progress)} von ${eur(ctx, f.goal.target)}`}><strong class="tk-num" style="font-size:var(--tk-fs-lg)">${pct(f.progress)}</strong><${Icon} name=${f.goal.icon || 'target'} size=${14} /><//>
        <div><strong class="tk-truncate">${f.goal.name}</strong><span class="tk-sv-meta tk-num">${eur(ctx, f.goal.current)} von ${eur(ctx, f.goal.target)}</span>${props.showForecast && html`<span class="tk-sv-meta">${f.status === 'erreicht' ? 'Erreicht' : f.eta ? `Voraussichtlich ${monthYear(f.eta)}` : 'Ohne Sparrate'}</span>`}<span>${badge(f)}</span></div></button>`)}</div>`, add);
    }
    return wrap(html`<div class="tk-svgl">${fc.map((f) => html`<button type="button" class="tk-svgl__row" onClick=${() => open(f)} aria-label=${`${f.goal.name} öffnen`}>
      <${Tile} tone=${f.goal.tone || 1} icon=${f.goal.icon || 'target'} size=${17} />
      <div style="min-width:0"><strong>${f.goal.name}</strong><span class="tk-svgl__meta">${f.due ? `bis ${fmtDate(f.due)}` : 'ohne Datum'}${f.monthly ? ` · ${eur(ctx, f.monthly)} pro Monat` : ''}</span></div>
      <div class="tk-svgl__prog"><${Progress} value=${f.progress} tone=${f.tone === 'warning' ? 'warning' : 'success'} /><span class="tk-sv-meta">${eur(ctx, f.goal.current)} von ${eur(ctx, f.goal.target)} · ${pct(f.progress)}${props.showForecast && f.eta && f.status !== 'erreicht' ? ` · ca. ${monthYear(f.eta)}` : ''}</span></div>${badge(f)}</button>`)}</div>`, add);
  },
};
export default [savingsGoalCard];
