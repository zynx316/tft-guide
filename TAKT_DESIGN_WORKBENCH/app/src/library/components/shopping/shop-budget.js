// Einkauf: Lebensmittel-Budget des Monats – nur gelesen (Ernährung/Finanzen), mit Schätzung der offenen Liste. Beträge über money() (Privatmodus).
import { html } from '../../../lib/html.js';
import { Card, Button, Ring, Icon } from '../../ui.js';
import { SHP_CSS, slots, ex, useShop } from './_shopping.js';
import { foodBudget } from './_logic.js';
import { MONTHS_LONG } from '../../../lib/date.js';
import { money, percent } from '../../helpers.js';

export const shopBudget = {
  id: 'shop-budget',
  name: 'Lebensmittel-Budget',
  category: 'Einkauf',
  description: 'Budget-Rest für Lebensmittel im Monat (nur gelesen, identisch mit „Budget übrig“ in Ernährung und dem Budget in Finanzen) und die Schätzung der offenen Liste. Stile: Balken, Ring, kompakt.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Lebensmittel-Budget' },
    { name: 'style', label: 'Stil', type: 'select', options: ['bar', 'ring', 'compact'], default: 'bar' },
    { name: 'showLink', label: 'Link zu Finanzen', type: 'boolean', default: true },
    { name: 'framed', label: 'In Karte', type: 'boolean', default: true },
  ],
  data: slots('shopping', 'budgets', 'transactions', 'lists', 'plan', 'recipes', 'foods'),
  events: ['budget.open'],
  states: ['empty'],
  flutter: { widget: 'ShopBudget', propMap: { style: 'style' }, events: ['budget.open'] },
  css: `${SHP_CSS}
  .tk-shpb-ring { display:flex; align-items:center; gap:18px; flex-wrap:wrap; } .tk-shpb-nums { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:var(--tk-space-3); }
  .tk-shpb-nums .tk-shp-big { font-size:var(--tk-fs-xl); } .tk-shpb-nums > div { min-width:0; }`,
  example: { data: ex('shopping', 'budgets', 'transactions', 'lists', 'plan', 'recipes', 'foods') },
  render: function ShopBudget({ props, data, ctx }) {
    const { views, today } = useShop(data, ctx), { budget, spent, left } = foodBudget({ shopping: data.shopping, budgets: data.budgets, transactions: data.transactions, today });
    const over = left < 0, shownLeft = Math.abs(left), monthName = MONTHS_LONG[Number(today.slice(5, 7)) - 1], leftLabel = over ? 'über dem Budget' : `übrig im ${monthName}`;
    const food = views.find((l) => l.kind === 'food'), open = food ? food.priceOpen : 0, ratio = budget ? spent / budget : 0;
    const wrap = (b) => (props.framed ? html`<${Card} title=${props.title} icon="wallet">${b}<//>` : html`<div class="tk-shp">${b}</div>`);
    if (!budget) return wrap(html`<div class="tk-shp-sub">Noch kein Lebensmittel-Budget. Lege es in Finanzen unter Budgets fest.</div><${Button} size="sm" icon="wallet" onClick=${() => ctx.emit('budget.open')}>Budget festlegen<//>`);
    const link = props.showLink && html`<${Button} size="sm" variant="ghost" iconRight="chevron-right" onClick=${() => ctx.emit('budget.open')}>Budgets in Finanzen<//>`;
    const note = open > 0 && html`<div class="tk-shp-sub">Die offene Liste kostet geschätzt ca. ${money(ctx, open, { digits: 0 })}; danach blieben etwa ${money(ctx, Math.max(0, left - open), { digits: 0 })}.</div>`;
    if (props.style === 'compact') return wrap(html`<div class="tk-row" style="justify-content:space-between;gap:12px"><div><div class="tk-shp-big">${money(ctx, shownLeft, { digits: 0 })}</div><div class="tk-shp-sub">${leftLabel}</div></div>
      <div class="tk-shp-meta" style="text-align:right">${money(ctx, spent, { digits: 0 })} von ${money(ctx, budget, { digits: 0 })}</div></div><div class="tk-shp-bar" role="img" aria-label=${`${percent(ctx, ratio, { sign: false, digits: 0 })} des Budgets verbraucht`}><i style=${`width:${Math.min(100, ratio * 100)}%;--tc:var(--tk-c-accent)`}></i></div>${link}`);
    if (props.style === 'ring') return wrap(html`<div class="tk-shpb-ring"><${Ring} value=${spent} max=${budget} size=${120} stroke=${12} tone=${over ? 'warning' : 'success'} label=${`${percent(ctx, ratio, { sign: false, digits: 0 })} des Budgets verbraucht`}><div style="text-align:center"><div class="tk-shp-big" style="font-size:var(--tk-fs-xl)">${money(ctx, shownLeft, { digits: 0 })}</div><div class="tk-shp-sub">${over ? 'drüber' : 'übrig'}</div></div><//>
      <div class="tk-grow" style="min-width:160px;display:flex;flex-direction:column;gap:8px"><div class="tk-shp-meta">${money(ctx, spent, { digits: 2 })} von ${money(ctx, budget, { digits: 0 })} ausgegeben</div>${note}${link}</div></div>`);
    return wrap(html`<div class="tk-shpb-nums"><div><div class="tk-shp-big">${money(ctx, shownLeft, { digits: 2 })}</div><div class="tk-shp-sub">${leftLabel}</div></div><div><div class="tk-shp-big">${money(ctx, spent, { digits: 2 })}</div><div class="tk-shp-sub">von ${money(ctx, budget, { digits: 0 })} ausgegeben</div></div></div>
      <div class="tk-shp-bar" role="img" aria-label=${`${percent(ctx, ratio, { sign: false, digits: 0 })} des Budgets verbraucht`}><i style=${`width:${Math.min(100, ratio * 100)}%`}></i></div>${note}${link}`);
  },
};
export default shopBudget;
