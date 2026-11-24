// Sparpläne: Zusammenfassung – Sparrate, Gesamtwert, nächste Ausführung, Ziele im Plan (strip | hero).
import { html } from '../../../lib/html.js';
import { Card, Button, EmptyState } from '../../ui.js';
import { fmtDate } from '../../../lib/format.js';
import { dayDiff } from '../../../lib/date.js';
import { arr, sum, r2, todayOf, eur, Stat, Gain, SV_CSS, plural } from './_savings.js';
import { monthlyTotal, planPosition, planAccount, allExecutions, confirmedSet, goalForecast } from './_plans.js';
import { CHART_CSS } from './_chart.js';

/** Kennzahlen für Übersichten (rein, auch von anderen Savings-Komponenten genutzt). */
export function summarize({ plans, positions, accounts, goals, transactions, today }) {
  const list = arr(plans), active = list.filter((p) => p.active);
  const pos = [...new Set(list.map((p) => planPosition(p, positions)).filter(Boolean))];
  const acc = [...new Set(list.map((p) => planAccount(p, accounts)).filter(Boolean))];
  const depot = sum(pos, (p) => p.value), cost = sum(pos, (p) => p.cost), konto = sum(acc, (a) => a.balance);
  const nextAll = allExecutions(list, today, { perPlan: 1 }, confirmedSet(transactions));
  const nextDate = nextAll[0]?.date || null;
  const sameDay = nextDate ? nextAll.filter((e) => dayDiff(e.date, nextDate) === 0) : [];
  const fc = arr(goals).map((g) => goalForecast(g, list, today));
  return { count: list.length, active: active.length, monthly: monthlyTotal(list), total: r2(depot + konto), invested: r2(cost + konto), gain: r2(depot - cost), depot, cost, konto,
    ratio: cost ? (depot - cost) / cost : 0, nextDate, nextAmount: r2(sum(sameDay, (e) => e.amount)), nextCount: sameDay.length, goals: fc, onTrack: fc.filter((f) => ['im Plan', 'erreicht'].includes(f.status)).length };
}

export const savingsSummary = {
  id: 'savings-summary',
  name: 'Sparplan-Zusammenfassung',
  category: 'Sparpläne',
  description: 'Sparrate pro Monat, Wert der Sparpläne, nächste Ausführung und Ziele im Plan. Als dichte Kennzahlen-Zeile oder als große Karte mit Verhältnis Eingezahlt zu Ertrag.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Sparen im Überblick' },
    { name: 'style', label: 'Darstellung', type: 'select', options: ['strip', 'hero'], default: 'strip' },
    { name: 'framed', label: 'In Karte', type: 'boolean', default: true },
  ],
  data: [
    { slot: 'plans', label: 'Sparpläne', default: 'plans', shape: '{id,name,monthly,day,active,positionId?,accountId?}[]', required: true },
    { slot: 'positions', label: 'Positionen', default: 'positions', shape: '{id,value,cost,gain}[]' },
    { slot: 'accounts', label: 'Konten', default: 'accounts', shape: '{id,balance}[]' },
    { slot: 'goals', label: 'Sparziele', default: 'goals', shape: '{id,name,target,current,due}[]' },
    { slot: 'transactions', label: 'Buchungen', default: 'transactions', shape: '{id,planId?,execDate?}[]' },
  ],
  events: ['summary.rate', 'summary.value', 'summary.next', 'summary.goals', 'plan.create'],
  states: ['empty'],
  css: `${SV_CSS}${CHART_CSS}
  .tk-svsum__grid { display:grid; grid-template-columns:repeat(4, minmax(0,1fr)); gap:var(--tk-space-4); }
  .bp-tablet .tk-svsum__grid { grid-template-columns:repeat(2, minmax(0,1fr)); } .bp-mobile .tk-svsum__grid { grid-template-columns:repeat(2, minmax(0,1fr)); gap:var(--tk-space-3); }
  .tk-svsum__cell { all:unset; box-sizing:border-box; display:block; min-width:0; cursor:pointer; padding:6px; margin:-6px; border-radius:var(--tk-radius-md); }
  .tk-svsum__cell:hover { background:var(--tk-c-surface2); } .tk-svsum__cell:focus-visible { outline:2px solid var(--tk-c-focus); }
  .tk-svsum--hero { display:flex; flex-direction:column; gap:var(--tk-space-5); }
  .tk-svsum__top { display:flex; flex-wrap:wrap; align-items:flex-end; justify-content:space-between; gap:var(--tk-space-4); }
  .tk-svsum__bar { display:flex; flex-direction:column; gap:8px; }
  .tk-svsum__split { display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); }
  .tk-svsum__split span { display:inline-flex; align-items:center; gap:6px; } .tk-svsum__split i { width:10px; height:10px; border-radius:3px; display:inline-block; }
  .tk-svsum__row { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:var(--tk-space-3); padding-top:var(--tk-space-4); border-top:1px solid var(--tk-c-border); }
  .tk-svsum--hero .tk-sv-stat--big strong { font-size:clamp(28px, 6vw, 40px); }`,
  example: { data: {
    plans: [{ id: 'a', name: 'All-World', positionId: 'p1', monthly: 300, day: 1, active: true, startDate: '2024-01-01' }, { id: 'b', name: 'Notgroschen', accountId: 'k1', monthly: 150, day: 1, active: true, startDate: '2024-01-01' }],
    positions: [{ id: 'p1', value: 18036.55, cost: 14636.99, gain: 3399.56, price: 118.42, quantity: 152.31 }], accounts: [{ id: 'k1', balance: 9500 }, { id: 'acc-giro', type: 'giro', balance: 3842 }],
    goals: [{ id: 'g1', name: 'Notgroschen', target: 15000, current: 9500, due: '2029-12-31', monthly: 150 }], transactions: [] } },
  render: function SavingsSummary({ props, data, ctx }) {
    const today = todayOf(ctx);
    const plans = arr(data.plans);
    const wrap = (body) => (props.framed ? html`<${Card} title=${props.style === 'hero' ? undefined : props.title} icon=${props.style === 'hero' ? undefined : 'piggy-bank'}>${body}<//>` : body);
    if (!plans.length) return html`<${Card} title=${props.title} icon="piggy-bank"><${EmptyState} icon="piggy-bank" title="Noch kein Sparplan" text="Lege einen Plan an. TAKT erinnert dich an jede Ausführung und zeigt, wie das Vermögen wächst." action=${html`<${Button} variant="primary" icon="plus" onClick=${() => ctx.emit('plan.create')}>Sparplan anlegen<//>`} /><//>`;
    const s = summarize({ plans, positions: data.positions, accounts: data.accounts, goals: data.goals, transactions: data.transactions, today });
    const cells = [
      { ev: 'summary.rate', label: 'Sparrate pro Monat', value: eur(ctx, s.monthly), sub: `${plural(s.active, 'aktiver Plan', 'aktive Pläne')}${s.count > s.active ? ` · ${s.count - s.active} pausiert` : ''}` },
      { ev: 'summary.value', label: 'Wert der Sparpläne', value: eur(ctx, s.total), sub: html`<span>eingezahlt ${eur(ctx, s.invested)}</span>` },
      { ev: 'summary.next', label: 'Nächste Ausführung', value: s.nextDate ? fmtDate(s.nextDate, { style: 'weekday' }) : '–', sub: s.nextDate ? `${eur(ctx, s.nextAmount)} · ${plural(s.nextCount, 'Plan', 'Pläne')}` : 'Alle Pläne pausiert' },
      { ev: 'summary.goals', label: 'Ziele im Plan', value: `${s.onTrack} von ${s.goals.length}`, sub: s.goals.length - s.onTrack ? `${plural(s.goals.length - s.onTrack, 'Ziel braucht', 'Ziele brauchen')} mehr Rate` : 'Alle Ziele auf Kurs' },
    ];
    if (props.style === 'hero') {
      const eShare = s.total ? clamp01(s.gain / s.total) : 0;
      return wrap(html`<div class="tk-svsum--hero"><div class="tk-svsum__top">
          <${Stat} big label=${props.title} value=${eur(ctx, s.total)} sub=${html`<${Gain} ctx=${ctx} value=${s.gain} ratio=${s.ratio} /> <span>seit Start (ETF-Positionen)</span>`} />
          <button type="button" class="tk-svsum__cell" style="text-align:right" onClick=${() => ctx.emit('summary.rate')} aria-label=${`Sparrate ${eur(ctx, s.monthly)} pro Monat, Sparpläne öffnen`}><${Stat} label="Sparrate pro Monat" value=${eur(ctx, s.monthly)} sub=${cells[0].sub} /></button></div>
        <div class="tk-svsum__bar"><div class="tk-sv-bar" role="img" aria-label=${`Eingezahlt ${eur(ctx, s.invested)}, Ertrag ${eur(ctx, s.gain)}`}><i style=${`flex:${Math.max(1, 1 - eShare) * 100};background:var(--tk-c-text-subtle);opacity:.55`}></i><i style=${`flex:${Math.max(0.01, eShare) * 100};background:var(--tk-c-accent)`}></i></div>
          <div class="tk-svsum__split"><span><i style="background:var(--tk-c-text-subtle);opacity:.55"></i>Eingezahlt ${eur(ctx, s.invested)}</span><span><i style="background:var(--tk-c-accent)"></i>Ertrag ${eur(ctx, s.gain, { sign: true })}</span></div></div>
        <div class="tk-svsum__row">${cells.slice(2).map((c) => html`<button type="button" class="tk-svsum__cell" onClick=${() => ctx.emit(c.ev)}><${Stat} label=${c.label} value=${c.value} sub=${c.sub} /></button>`)}</div></div>`);
    }
    return wrap(html`<div class="tk-svsum__grid">${cells.map((c) => html`<button type="button" class="tk-svsum__cell" onClick=${() => ctx.emit(c.ev)}><${Stat} label=${c.label} value=${c.value} sub=${c.sub} /></button>`)}</div>`);
  },
};
const clamp01 = (v) => Math.min(1, Math.max(0, v));
export default [savingsSummary];
