// Trading: Als Nächstes – kommende Sparplan-Ausführungen und Dividenden nach Tag, mit Deckungs-Hinweis für das Girokonto.
import { html } from '../../../lib/html.js';
import { Card, Button, EmptyState, Icon } from '../../ui.js';
import { money } from '../../helpers.js';
import { fmtDate, fmtRelativeDay } from '../../../lib/format.js';
import { toIsoDay } from '../../../lib/date.js';
import { arr, byId, planExecutions, dividendPlan, sum } from './_calc.js';
import { slots, Tile, Note, TRD_CSS } from './_trd.js';
import { ex } from './_example.js';

const MON = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
/** Termine mit Geldwirkung: Sparplan-Ausführungen und Dividenden, nach Datum. */
export function upcomingItems(data, today, count = 6) {
  const ex_ = planExecutions(data.plans, data.positions, today, count).map((e) => ({ id: `${e.plan.id}|${toIsoDay(e.date)}`, kind: 'plan', date: e.date, title: `Sparplan ${e.position?.short || e.plan.name}`, amount: -e.amount, plan: e.plan }));
  const dv = dividendPlan(data.dividends, data.positions, today, data.allowance).ahead.slice(0, count).map((d) => ({ id: d.id, kind: 'dividend', date: d.date, title: `Dividende ${byId(data.positions, d.positionId)?.short || d.title}`, amount: d.amount, forecast: d.forecast, positionId: d.positionId }));
  return [...ex_, ...dv].sort((a, b) => a.date - b.date).slice(0, count);
}

export const trdUpcoming = {
  id: 'trd-upcoming',
  name: 'Als Nächstes',
  category: 'Trading',
  description: 'Die nächsten Termine mit Geldwirkung im Depot: Sparplan-Ausführungen (mit Verschiebung auf den nächsten Handelstag und Deckungs-Hinweis für das Girokonto) und erwartete Dividenden. Als Liste nach Tag oder als hervorgehobener nächster Termin.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Als Nächstes' },
    { name: 'style', label: 'Darstellung', type: 'select', options: ['list', 'next'], default: 'list' },
    { name: 'limit', label: 'Max. Einträge', type: 'number', default: 4 },
    { name: 'showCoverage', label: 'Deckungs-Hinweis zeigen', type: 'boolean', default: true },
  ],
  data: slots('plans', 'positions', 'dividends', 'allowance', 'accounts'),
  events: ['plan.open', 'dividends.open', 'upcoming.open'],
  states: ['empty'],
  css: `${TRD_CSS}
  .tk-trd-up__row { display:flex; align-items:center; gap:12px; padding:8px 4px; min-height:56px; width:100%; background:none; border:0; color:inherit; font:inherit; text-align:left; cursor:pointer; border-radius:var(--tk-radius-md); } .tk-trd-up__row:hover { background:var(--tk-c-surface2); }
  .tk-trd-up__hero { display:flex; align-items:center; gap:14px; width:100%; padding:var(--tk-space-4); border-radius:var(--tk-radius-lg); background:var(--tk-c-accent-soft); border:0; color:inherit; font:inherit; text-align:left; cursor:pointer; min-height:72px; } .tk-trd-up__hero:hover { filter:brightness(.97); }
  .tk-trd-up__day { text-align:center; min-width:48px; line-height:1.1; } .tk-trd-up__day strong { display:block; font-size:var(--tk-fs-2xl); } .tk-trd-up__day span { font-size:var(--tk-fs-xs); text-transform:uppercase; color:var(--tk-c-text-muted); letter-spacing:var(--tk-ls-wide); }`,
  example: { data: ex('plans', 'positions', 'dividends', 'allowance', 'accounts') },
  render: function TrdUpcoming({ props, data, ctx }) {
    const items = upcomingItems(data, ctx.today, props.limit);
    if (!items.length) return html`<${Card} title=${props.title} icon="calendar-clock"><${EmptyState} icon="calendar-clock" title="Nichts in Sicht" text="Sparpläne und ausschüttende Aktien erscheinen hier mit ihren nächsten Terminen." /><//>`;
    const open = (it) => (it.kind === 'plan' ? ctx.emit('plan.open', { id: it.plan.id, to: 'savings.plan' }) : ctx.emit('dividends.open', { id: it.positionId, to: 'trading.dividends' }));
    const giro = arr(data.accounts).find((a) => a.type === 'giro'), first = items.find((i) => i.kind === 'plan');
    const due = first ? sum(items.filter((i) => i.kind === 'plan' && toIsoDay(i.date) === toIsoDay(first.date)), (i) => -i.amount) : 0;
    const cover = props.showCoverage && giro && first && html`<${Note} tone=${giro.balance >= due ? '' : 'warning'} icon=${giro.balance >= due ? 'check-circle-2' : 'alert-triangle'}>${giro.balance >= due ? `Das Girokonto deckt die Abbuchung am ${fmtDate(first.date, { style: 'weekday' })} (${money(ctx, due)} von ${money(ctx, giro.balance)}).` : `Am ${fmtDate(first.date, { style: 'weekday' })} fehlen ${money(ctx, due - giro.balance)} auf dem Girokonto.`}<//>`;
    const meta = (it) => `${fmtRelativeDay(it.date, ctx.today)}${it.kind === 'plan' ? ' · führt dein Broker aus' : it.forecast ? ' · Prognose' : ' · erwartet'}`;
    if (props.style === 'next') { const it = items[0]; return html`<${Card} title=${props.title} icon="calendar-clock"><div class="tk-col" style="gap:12px"><button type="button" class="tk-trd-up__hero" onClick=${() => open(it)} aria-label=${`${it.title}, ${fmtDate(it.date, { style: 'weekday' })}`}>
      <span class="tk-trd-up__day"><strong>${it.date.getDate()}</strong><span>${MON[it.date.getMonth()]}</span></span><span class="tk-trd-grow"><span class="tk-trd-title" style="display:block">${it.title}</span><span class="tk-trd-sub">${meta(it)}</span></span><strong class="tk-trd-num">${money(ctx, it.amount, { sign: it.kind === 'dividend', digits: it.kind === 'plan' ? 0 : 2 })}</strong></button>
      ${items.slice(1, 3).map((x) => html`<button type="button" class="tk-trd-up__row" onClick=${() => open(x)}><${Tile} icon=${x.kind === 'plan' ? 'repeat' : 'coins'} tone=${x.kind === 'plan' ? 'info' : 'success'} size=${30} /><span class="tk-trd-grow"><span class="tk-trd-title" style="display:block">${x.title}</span><span class="tk-trd-sub">${fmtDate(x.date, { style: 'weekday' })}</span></span><span class="tk-trd-num">${money(ctx, x.amount, { digits: x.kind === 'plan' ? 0 : 2 })}</span></button>`)}${cover}</div><//>`; }
    return html`<${Card} title=${props.title} icon="calendar-clock"><div class="tk-trd-list">${items.map((it) => html`<button type="button" class="tk-trd-up__row" onClick=${() => open(it)} aria-label=${`${it.title}, ${fmtDate(it.date, { style: 'weekday' })}`}>
      <${Tile} icon=${it.kind === 'plan' ? 'repeat' : 'coins'} tone=${it.kind === 'plan' ? 'info' : 'success'} size=${34} /><span class="tk-trd-grow"><span class="tk-trd-title" style="display:block">${it.title}</span><span class="tk-trd-sub">${fmtDate(it.date, { style: 'weekday' })} · ${meta(it)}</span></span>
      <strong class="tk-trd-num">${money(ctx, it.amount, { sign: it.kind === 'dividend', digits: it.kind === 'plan' ? 0 : 2 })}</strong></button>`)}</div>${cover && html`<div style="margin-top:8px">${cover}</div>`}<//>`;
  },
};
export default [trdUpcoming];
