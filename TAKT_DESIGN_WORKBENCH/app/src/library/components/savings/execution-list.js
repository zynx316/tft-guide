// Sparpläne: Ausführungen eines Plans – kommende (mit Handelstag-Hinweis) und bereits ausgeführte Umbuchungen.
import { html } from '../../../lib/html.js';
import { Card, Badge, Icon, EmptyState } from '../../ui.js';
import { fmtDate, fmtNumber } from '../../../lib/format.js';
import { arr, todayOf, eur2, SV_CSS, whenLabel } from './_savings.js';
import { planExecutions, pastExecutions, confirmedSet, planPosition } from './_plans.js';

export const executionList = {
  id: 'execution-list',
  name: 'Ausführungen eines Plans',
  category: 'Sparpläne',
  description: 'Kommende und bereits ausgeführte Ausführungen des gewählten Sparplans (ui.selectedId). Kommende mit Hinweis auf Verschiebung (Wochenende, Feiertag) und geschätzter Stückzahl, ausgeführte als Umbuchungen.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Ausführungen' },
    { name: 'upcoming', label: 'Kommende', type: 'number', default: 4 },
    { name: 'past', label: 'Ausgeführte', type: 'number', default: 4 },
  ],
  data: [
    { slot: 'plans', label: 'Sparpläne', default: 'plans', shape: '{id,name,monthly,day,active}[]', required: true },
    { slot: 'positions', label: 'Positionen', default: 'positions', shape: '{id,price}[]' },
    { slot: 'transactions', label: 'Buchungen', default: 'transactions', shape: '{id,title,date,amount,type,category}[]' },
  ],
  events: ['execution.open'],
  states: ['empty'],
  css: `${SV_CSS}
  .tk-sx { display:flex; flex-direction:column; min-width:0; } .tk-sx__h { padding:10px 0 4px; }
  .tk-sx__r { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:2px 12px; align-items:center; padding:10px 0; border-bottom:1px solid var(--tk-c-border); min-width:0; } .tk-sx__r:last-child { border-bottom:0; }
  .tk-sx__r strong { font-weight:var(--tk-fw-semibold); } .tk-sx__r small { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); display:block; } .tk-sx__r > div:last-child { text-align:right; display:flex; flex-direction:column; align-items:flex-end; gap:2px; font-variant-numeric:tabular-nums; }`,
  example: { data: { plans: [{ id: 'sp1', name: 'All-World Sparplan', positionId: 'p1', monthly: 300, day: 1, intervalMonths: 1, active: true, startDate: '2024-01-01' }], positions: [{ id: 'p1', price: 118.42, short: 'All-World' }], transactions: [{ id: 't1', title: 'Sparplan All-World', date: '2026-11-02T07:00:00', amount: -300, type: 'transfer', category: 'Sparen' }] } },
  render: function ExecutionList({ props, data, ctx }) {
    const today = todayOf(ctx), plans = arr(data.plans);
    const plan = plans.find((p) => p.id === ctx.ui.selectedId) || plans[0];
    if (!plan) return html`<${Card} title=${props.title} icon="list-checks"><${EmptyState} icon="list-checks" title="Keine Ausführungen" text="Wähle einen Sparplan, um seine Ausführungen zu sehen." /><//>`;
    const pos = planPosition(plan, data.positions);
    const up = planExecutions(plan, today, props.upcoming, confirmedSet(data.transactions)), past = pastExecutions(plan, data.transactions, data.positions).slice(0, props.past);
    return html`<${Card} title=${props.title} icon="list-checks"><div class="tk-sx">
      <div class="tk-label tk-sx__h">Kommende</div>${up.length ? up.map((e) => html`<div class="tk-sx__r"><div><strong>${fmtDate(e.date, { style: 'weekday' })}</strong><small>${e.shifted ? `Verschoben vom ${fmtDate(e.nominal, { style: 'short' })} (${e.why || 'kein Handelstag'})` : whenLabel(e.date, today, { short: true })}</small></div>
        <div><strong>${eur2(ctx, e.amount)}</strong>${pos?.price ? html`<small>≈ ${fmtNumber(e.amount / pos.price, { digits: 3 })} Stück</small>` : null}</div></div>`) : html`<p class="tk-sv-meta" style="padding:8px 0">${plan.active ? 'Keine Ausführung im Zeitraum.' : 'Pausiert: keine Ausführungen geplant.'}</p>`}
      <div class="tk-label tk-sx__h">Ausgeführt</div>${past.length ? past.map((t) => html`<div class="tk-sx__r"><div><strong>${fmtDate(t.date, { style: 'weekday' })}</strong><small>${t.title} · Umbuchung</small></div><div><strong>${eur2(ctx, -t.amount)}</strong><${Badge} tone="success" icon="check">Ausgeführt<//></div></div>`) : html`<p class="tk-sv-meta" style="padding:8px 0">Noch keine bestätigte Ausführung in den Buchungen.</p>`}</div><//>`;
  },
};
export default [executionList];
