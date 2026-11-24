// Trading: Positionen des Depots – sortierbare Tabelle, Karten oder schlanke Zeilen mit Wert, Gewinn/Verlust und Anteil.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, EmptyState, Sparkline, Icon } from '../../ui.js';
import { money, percent } from '../../helpers.js';
import { fmtNumber, fmtPercent } from '../../../lib/format.js';
import { holdings, arr } from './_calc.js';
import { slots, Chg, Gain, Px, Tile, TRD_CSS, openSecurity, TONE_COLOR, upDown } from './_trd.js';
import { ex } from './_example.js';

const COLS = [['name', 'Position'], ['value', 'Wert'], ['day', 'Heute'], ['gain', 'Gewinn/Verlust'], ['weight', 'Anteil']];
const qty = (r) => fmtNumber(r.q, { digits: r.q % 1 ? 3 : 0 });

export const trdPositions = {
  id: 'trd-positions',
  name: 'Positionen',
  category: 'Trading',
  description: 'Alle Positionen des Depots mit Stückzahl, Kurs, Wert, Tagesveränderung, Gewinn/Verlust und Anteil. Als sortierbare Tabelle, als Karten mit Verlauf oder als schlanke Zeilen. Tippen öffnet das Wertpapier. Gewinn mit Vorzeichen und Pfeil, Beträge maskierbar.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Positionen' },
    { name: 'style', label: 'Darstellung', type: 'select', options: ['table', 'cards', 'rows'], default: 'table' },
    { name: 'limit', label: 'Max. Einträge (0 = alle)', type: 'number', default: 0 },
    { name: 'showCash', label: 'Verrechnungskonto zeigen', type: 'boolean', default: true },
    { name: 'showTrade', label: 'Order-Knopf in der Zeile', type: 'boolean', default: true },
  ],
  data: slots('positions', 'cash', 'plans'),
  events: ['position.open', 'position.trade', 'positions.sort', 'portfolio.open'],
  states: ['empty'],
  css: `${TRD_CSS}
  .tk-trd-ps__h, .tk-trd-ps__r { display:grid; grid-template-columns:minmax(0,2.4fr) minmax(70px,1fr) minmax(76px,.9fr) minmax(110px,1.3fr) 62px 40px; gap:10px; align-items:center; padding:0 4px; }
  .tk-trd-ps__h { padding-bottom:6px; border-bottom:1px solid var(--tk-c-border-strong); } .tk-trd-ps__h button { border:0; background:none; font:inherit; color:var(--tk-c-text-subtle); font-size:var(--tk-fs-xs); text-transform:uppercase; letter-spacing:var(--tk-ls-wide); font-weight:var(--tk-fw-semibold); cursor:pointer; text-align:right; padding:6px 0; min-height:32px; }
  .tk-trd-ps__h button:first-child { text-align:left; } .tk-trd-ps__h button[aria-pressed="true"] { color:var(--tk-c-text); }
  .tk-trd-ps__r { min-height:58px; border-bottom:1px solid var(--tk-c-border); } .tk-trd-ps__r > :nth-child(n+2) { text-align:right; }
  .tk-trd-ps__main { display:flex; align-items:center; gap:12px; min-width:0; background:none; border:0; color:inherit; font:inherit; text-align:left; cursor:pointer; padding:0; min-height:44px; text-align:left; }
  .tk-trd-ps__main:hover .tk-trd-title { text-decoration:underline; }
  .tk-trd-ps__sum { display:grid; grid-template-columns:minmax(0,2.4fr) minmax(70px,1fr) minmax(76px,.9fr) minmax(110px,1.3fr) 62px 40px; gap:10px; padding:10px 4px 2px; font-weight:var(--tk-fw-semibold); } .tk-trd-ps__sum > :nth-child(n+2) { text-align:right; }
  .bp-mobile .tk-trd-ps__r, .bp-mobile .tk-trd-ps__sum { grid-template-columns:minmax(0,1fr) auto; row-gap:0; column-gap:12px; } .bp-mobile .tk-trd-ps__h { display:flex; flex-wrap:wrap; gap:0 14px; }
  .bp-mobile .tk-trd-ps__x, .bp-mobile .tk-trd-ps__x2, .bp-tablet .tk-trd-ps__x2 { display:none; } .bp-mobile .tk-trd-ps__r > :nth-child(1) { grid-row:1 / 3; } .bp-mobile .tk-trd-ps__r > :nth-child(4), .bp-mobile .tk-trd-ps__sum > :nth-child(4) { grid-column:2; }
  .bp-mobile .tk-trd-ps__r > :nth-child(4) .tk-trd-num, .bp-mobile .tk-trd-ps__r > :nth-child(4) { white-space:normal; } .bp-mobile .tk-trd-ps__r > :nth-child(4) .tk-trd-sub { display:block; }
  .bp-tablet .tk-trd-ps__h, .bp-tablet .tk-trd-ps__r, .bp-tablet .tk-trd-ps__sum { grid-template-columns:minmax(0,2fr) minmax(70px,1fr) minmax(110px,1.3fr) 58px; }
  .tk-trd-ps__cards { display:grid; grid-template-columns:repeat(auto-fill, minmax(min(100%, calc(230px * var(--tk-text-scale, 1))), 1fr)); gap:var(--tk-space-3); }
  .tk-trd-ps__card { border:1px solid var(--tk-c-border); border-radius:var(--tk-radius-lg); background:var(--tk-c-surface2); padding:var(--tk-space-4); display:flex; flex-direction:column; gap:10px; text-align:left; color:inherit; font:inherit; cursor:pointer; min-width:0; }
  .tk-trd-ps__card:hover { background:var(--tk-c-surface3); }`,
  example: { data: ex('positions', 'cash', 'plans') },
  render: function TrdPositions({ props, data, ctx }) {
    const [sort, setSort] = useState({ k: 'value', dir: -1 });
    const hd = holdings(data.positions, data.cash);
    if (!hd.rows.length) return html`<${Card} title=${props.title} icon="pie-chart"><${EmptyState} icon="pie-chart" title="Noch keine Positionen" text="Sobald Wertpapiere im Depot liegen, erscheinen Stückzahl, Wert und Gewinn hier." action=${html`<${Button} icon="trending-up" onClick=${() => ctx.emit('order.new', { to: 'trading.order' })}>Order simulieren<//>`} /><//>`;
    const key = { name: (r) => (r.short || r.name).toLowerCase(), value: (r) => r.value, day: (r) => r.dayPct, gain: (r) => r.gainPct, weight: (r) => r.weight };
    const rows = [...hd.rows].sort((a, b) => (key[sort.k](a) > key[sort.k](b) ? 1 : -1) * sort.dir), shown = props.limit > 0 ? rows.slice(0, props.limit) : rows;
    const open = (r) => openSecurity(ctx, r.id, 'position.open');
    const plan = (r) => arr(data.plans).find((p) => p.positionId === r.id && p.active);
    const more = props.limit > 0 && rows.length > props.limit && html`<div style="margin-top:8px"><${Button} variant="ghost" size="sm" iconRight="chevron-right" onClick=${() => ctx.emit('portfolio.open', { to: 'trading.portfolio' })}>Alle ${rows.length} Positionen<//></div>`;
    const name = (r) => r.short || r.name;
    const sortBy = (k) => { setSort((s) => ({ k, dir: s.k === k ? -s.dir : k === 'name' ? 1 : -1 })); ctx.emit('positions.sort', { by: k }); };
    if (props.style === 'cards') return html`<${Card} title=${props.title} icon="pie-chart" actions=${html`<span class="tk-trd-meta">${rows.length} Positionen</span>`}><div class="tk-trd-ps__cards">${shown.map((r) => html`<button type="button" class="tk-trd-ps__card" onClick=${() => open(r)} aria-label=${`${name(r)} öffnen`}>
      <div class="tk-trd-row"><${Tile} type=${r.type} size=${34} /><span class="tk-trd-grow"><span class="tk-trd-title" style="display:block">${name(r)}</span><span class="tk-trd-sub">${qty(r)} Stück · ${fmtPercent(r.weight, { digits: 0 })} vom Depot</span></span></div>
      <${Sparkline} values=${arr(r.spark)} width=${200} height=${40} tone=${r.dayPct >= 0 ? 'success' : 'danger'} />
      <div class="tk-trd-row" style="justify-content:space-between;align-items:flex-end;flex-wrap:wrap"><strong class="tk-trd-num" style="font-size:var(--tk-fs-xl)">${money(ctx, r.value)}</strong><${Gain} ctx=${ctx} v=${r.gain} pct=${r.gainPct} /></div></button>`)}</div>${more}<//>`;
    if (props.style === 'rows') return html`<${Card} title=${props.title} icon="pie-chart"><div class="tk-trd-list">${shown.map((r) => html`<button type="button" class="tk-trd-tap tk-trd-item" onClick=${() => open(r)} aria-label=${`${name(r)} öffnen`}><${Tile} type=${r.type} size=${34} />
      <span class="tk-trd-grow"><span class="tk-trd-title" style="display:block">${name(r)}</span><span class="tk-trd-sub">${qty(r)} × <${Px} v=${r.price} /></span></span><span style="text-align:right"><strong class="tk-trd-num" style="display:block">${money(ctx, r.value)}</strong><${Gain} ctx=${ctx} v=${r.gain} pct=${r.gainPct} /></span></button>`)}</div>${more}<//>`;
    return html`<${Card} title=${props.title} icon="pie-chart" actions=${html`<span class="tk-trd-meta">${rows.length} Positionen</span>`}>
      <div class="tk-trd-ps__h">${COLS.map(([k, l], i) => html`<button type="button" aria-pressed=${String(sort.k === k)} class=${k === 'weight' ? 'tk-trd-ps__x' : k === 'day' ? 'tk-trd-ps__x2' : ''} aria-label=${`Nach ${l} sortieren`} onClick=${() => sortBy(k)}>${l}${sort.k === k ? (sort.dir > 0 ? ' ↑' : ' ↓') : ''}</button>`)}<span class="tk-trd-ps__x2"></span></div>
      ${shown.map((r) => { const p = plan(r); return html`<div class="tk-trd-ps__r"><button type="button" class="tk-trd-ps__main" onClick=${() => open(r)} aria-label=${`${name(r)} öffnen`}><${Tile} type=${r.type} size=${34} />
        <span class="tk-trd-grow"><span class="tk-trd-title" style="display:block">${name(r)}</span><span class="tk-trd-sub">${qty(r)} × <${Px} v=${r.price} />${p ? ` · Sparplan ${money(ctx, p.monthly, { digits: 0 })}` : ''}</span></span></button>
        <strong class="tk-trd-num">${money(ctx, r.value)}</strong><span class="tk-trd-ps__x2"><${Chg} v=${r.dayPct} /></span><span><${Gain} ctx=${ctx} v=${r.gain} pct=${r.gainPct} digits=${0} /></span><span class="tk-trd-num tk-trd-meta tk-trd-ps__x">${fmtPercent(r.weight, { digits: 1 })}</span>
        ${props.showTrade ? html`<span class="tk-trd-ps__x2"><button type="button" class="tk-trd-tap" style="justify-content:center;width:36px;height:36px" aria-label=${`Order für ${name(r)} simulieren`} onClick=${() => { ctx.setUi('selectedId', r.id); ctx.emit('position.trade', { id: r.id, to: 'trading.order' }); }}><${Icon} name="trending-up" size=${16} /></button></span>` : html`<span class="tk-trd-ps__x2"></span>`}</div>`; })}
      <div class="tk-trd-ps__sum"><span>Summe Positionen</span><span class="tk-trd-num">${money(ctx, hd.invested)}</span><span class="tk-trd-ps__x2"><${Chg} v=${hd.dayPct} /></span><span><${Gain} ctx=${ctx} v=${hd.gain} pct=${hd.gainPct} digits=${0} /></span><span class="tk-trd-ps__x"></span><span class="tk-trd-ps__x2"></span></div>
      ${props.showCash && html`<div class="tk-trd-ps__sum" style="font-weight:var(--tk-fw-regular, 400);color:var(--tk-c-text-muted)"><span>Verrechnungskonto</span><span class="tk-trd-num">${money(ctx, hd.cash)}</span><span class="tk-trd-ps__x2"></span><span></span><span class="tk-trd-ps__x"></span><span class="tk-trd-ps__x2"></span></div>`}${more}<//>`;
  },
};
export default [trdPositions];
