// Trading: Top-Bewegungen des Tages aus Depot und Watchlist – Liste, Balken (Gewinner/Verlierer) oder Chips.
import { html } from '../../../lib/html.js';
import { Card, EmptyState } from '../../ui.js';
import { money } from '../../helpers.js';
import { holdings, arr } from './_calc.js';
import { slots, Chg, Px, Tile, TRD_CSS, openSecurity, upDown } from './_trd.js';
import { ex } from './_example.js';

/** Bewegungen: Depotpositionen (mit Euro-Wirkung) und Watchlist-Einträge, größte Veränderung zuerst. */
function movers(data) {
  const hd = holdings(data.positions, 0);
  const rows = hd.rows.map((r) => ({ id: r.id, name: r.short || r.name, type: r.type, price: r.price, change: r.dayPct, day: r.day, held: true }));
  const ids = new Set(rows.map((r) => r.id));
  for (const w of arr(data.watchlist)) if (!ids.has(w.id)) rows.push({ id: w.id, name: w.title, type: w.type, price: w.price, change: w.change || 0, day: null, held: false });
  return rows.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
}

export const trdMovers = {
  id: 'trd-movers',
  name: 'Top-Bewegungen',
  category: 'Trading',
  description: 'Die größten Kursbewegungen des Tages aus Depot und Watchlist. Als Liste mit Euro-Wirkung, als Gewinner-/Verlierer-Balken oder als schlanke Chips. Tippen öffnet das Wertpapier.',
  version: '1.3',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Top-Bewegungen' },
    { name: 'style', label: 'Darstellung', type: 'select', options: ['list', 'bars', 'chips'], default: 'list' },
    { name: 'limit', label: 'Max. Einträge', type: 'number', default: 5 },
  ],
  data: slots('positions', 'watchlist'),
  events: ['security.open'],
  states: ['empty'],
  css: `${TRD_CSS}
  .tk-trd-mv { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:var(--tk-space-5); } .tk-trd-mv__bar > :last-child { flex:0 0 auto; } .bp-mobile .tk-trd-mv { grid-template-columns:minmax(0,1fr); }
  .tk-trd-mv__bar { display:flex; align-items:center; gap:10px; min-height:40px; } .tk-trd-mv__track { height:8px; border-radius:4px; background:var(--tk-c-surface3); position:relative; flex:1 1 60px; min-width:40px; overflow:hidden; }
  .tk-trd-mv__track i { position:absolute; left:0; top:0; bottom:0; border-radius:4px; }
  .tk-trd-mv__chips { display:flex; gap:var(--tk-space-2); flex-wrap:wrap; }
  .tk-trd-mv__chip { display:flex; align-items:center; gap:8px; padding:8px 12px; border-radius:var(--tk-radius-pill); border:1px solid var(--tk-c-border); background:var(--tk-c-surface2); color:inherit; font:inherit; cursor:pointer; min-height:40px; max-width:100%; }
  .tk-trd-mv__chip:hover { background:var(--tk-c-surface3); }
  [data-tk-large-text] .tk-trd-mv { grid-template-columns:minmax(0,1fr); }
  [data-tk-large-text] .tk-trd-mv__bar { flex-wrap:wrap; row-gap:4px; padding:4px 0; }
  [data-tk-large-text] .tk-trd-mv__bar > .tk-trd-title { flex:1 1 100% !important; }`,
  example: { data: ex('positions', 'watchlist') },
  render: function TrdMovers({ props, data, ctx }) {
    const all = movers(data), list = all.slice(0, props.limit);
    if (!all.length) return html`<${Card} title=${props.title} icon="activity"><${EmptyState} icon="activity" title="Noch keine Bewegungen" text="Sobald Wertpapiere im Depot oder in der Watchlist stehen, erscheinen hier die größten Tagesbewegungen." /><//>`;
    const open = (r) => openSecurity(ctx, r.id);
    if (props.style === 'chips') return html`<${Card} title=${props.title} icon="activity"><div class="tk-trd-mv__chips">${list.map((r) => html`<button type="button" class="tk-trd-mv__chip" onClick=${() => open(r)} aria-label=${`${r.name} öffnen`}><span class="tk-trd-title">${r.name}</span><${Chg} v=${r.change} /></button>`)}</div><//>`;
    if (props.style === 'bars') {
      const max = Math.max(...all.map((r) => Math.abs(r.change)), 0.001), n = Math.max(2, Math.min(4, props.limit));
      const col = (title, items, k) => html`<div><div class="tk-trd-cap" style="margin-bottom:6px">${title}</div>${items.length ? items.map((r) => html`<button type="button" class="tk-trd-tap tk-trd-mv__bar" onClick=${() => open(r)} aria-label=${`${r.name} öffnen`}>
        <span class="tk-trd-title" style="flex:0 1 38%">${r.name}</span><span class="tk-trd-mv__track" aria-hidden="true"><i style=${`width:${Math.max(4, Math.abs(r.change) / max * 100)}%;background:var(--tk-c-${k === 'up' ? 'success' : 'danger'})`}></i></span><${Chg} v=${r.change} /></button>`) : html`<span class="tk-trd-meta">Keine</span>`}</div>`;
      return html`<${Card} title=${props.title} icon="activity"><div class="tk-trd-mv">${col('Gewinner', all.filter((r) => r.change > 0).slice(0, n), 'up')}${col('Verlierer', all.filter((r) => r.change < 0).sort((a, b) => a.change - b.change).slice(0, n), 'down')}</div><//>`;
    }
    return html`<${Card} title=${props.title} icon="activity"><div class="tk-trd-list">${list.map((r) => html`<button type="button" class="tk-trd-tap tk-trd-item" onClick=${() => open(r)} aria-label=${`${r.name} öffnen`}>
      <${Tile} type=${r.type} size=${34} /><span class="tk-trd-grow"><span class="tk-trd-title" style="display:block">${r.name}</span><span class="tk-trd-sub">${r.held ? html`im Depot · ${money(ctx, r.day, { sign: true })} heute` : 'Watchlist'}</span></span>
      <span style="text-align:right"><${Chg} v=${r.change} /><span class="tk-trd-sub" style="display:block"><${Px} v=${r.price} /></span></span></button>`)}</div><//>`;
  },
};
export default [trdMovers];
