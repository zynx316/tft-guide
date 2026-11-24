// Trading: Simulierte Orders – offene und bisherige Orders mit Status, Stornieren (mit Wiederherstellen). Das Depot bleibt unverändert.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, IconButton, EmptyState, Segmented, Badge } from '../../ui.js';
import { money } from '../../helpers.js';
import { fmtDate, fmtTime } from '../../../lib/format.js';
import { arr, byId, known } from './_calc.js';
import { TYPE_LABEL } from './_order.js';
import { slots, qtyText, Px, Tile, Note, TRD_CSS, openSecurity } from './_trd.js';
import { ex } from './_example.js';

const STATUS = { offen: ['Offen', 'warning'], simuliert: ['Simuliert', 'info'], storniert: ['Storniert', ''] };

export const trdOrderList = {
  id: 'trd-order-list',
  name: 'Simulierte Orders',
  category: 'Trading',
  description: 'Die simulierten Orders: offene (Limit, Stop) und bisherige mit Richtung, Ordertyp, Kurs, Gesamtbetrag und Status. Offene Orders lassen sich stornieren und wiederherstellen. Immer als Simulation gekennzeichnet.',
  version: '1.2',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Simulierte Orders' },
    { name: 'limit', label: 'Max. Einträge (0 = alle)', type: 'number', default: 0 },
    { name: 'showNote', label: 'Hinweis „Depot unverändert“', type: 'boolean', default: true },
  ],
  data: slots('orders', 'instruments', 'positions', 'watchlist'),
  events: ['order.storno', 'order.restore', 'order.open'],
  states: ['empty'],
  css: `${TRD_CSS}
  .tk-trd-ol__row { display:flex; align-items:center; gap:12px; padding:8px 4px; min-height:60px; } .tk-trd-ol__row[data-off="true"] { opacity:.7; } .tk-trd-ol__main { display:flex; align-items:center; gap:12px; min-width:0; flex:1 1 auto; background:none; border:0; color:inherit; font:inherit; text-align:left; cursor:pointer; padding:0; min-height:44px; }
  [data-tk-large-text] .tk-trd-ol__row { flex-wrap:wrap; row-gap:4px; } [data-tk-large-text] .tk-trd-ol__main { flex:1 1 100%; align-items:flex-start; } [data-tk-large-text] .tk-trd-ol__main > .tk-trd-ico { display:none; }`,
  example: { data: ex('orders', 'instruments', 'positions', 'watchlist') },
  render: function TrdOrderList({ props, data, setData, ctx }) {
    const [tab, setTab] = useState('offen'), ok = known(data.positions, data.watchlist), all = arr(data.orders).filter(ok);
    const open = all.filter((o) => o.status === 'offen'), shownAll = tab === 'offen' ? open : all, list = props.limit > 0 ? shownAll.slice(0, props.limit) : shownAll;
    const set = (id, status) => setData('orders', (l) => arr(l).map((o) => (o.id === id ? { ...o, status } : o)));
    const name = (o) => { const i = byId(data.instruments, o.securityId); return i ? i.short || i.name : '–'; };
    const row = (o) => { const [l, t] = STATUS[o.status] || ['', '']; return html`<div class="tk-trd-ol__row" data-off=${String(o.status === 'storniert')}><button type="button" class="tk-trd-ol__main" onClick=${() => openSecurity(ctx, o.securityId, 'order.open')} aria-label=${`${name(o)} öffnen`}>
      <${Tile} icon=${o.side === 'buy' ? 'trending-up' : 'trending-down'} tone=${o.side === 'buy' ? 'success' : 'danger'} size=${34} /><span class="tk-trd-grow"><span class="tk-trd-title" style="display:block">${o.side === 'buy' ? 'Kauf' : 'Verkauf'} ${qtyText(ctx, o.qty)} × ${name(o)}</span>
      <span class="tk-trd-sub">${TYPE_LABEL[o.type]}${o.type === 'limit' ? html` ${o.side === 'buy' ? 'bis' : 'ab'} <${Px} v=${o.limit} />` : o.type === 'stop' ? html` bei <${Px} v=${o.stop} />` : html` zu <${Px} v=${o.price} />`} · ${fmtDate(o.created, { style: 'short' })}, ${fmtTime(o.created)} Uhr</span></span></button>
      <span style="text-align:right"><strong class="tk-trd-num" style="display:block">${money(ctx, o.total)}</strong><span class=${`tk-trd-pill ${t ? `tk-trd-pill--${t}` : ''}`}>${l}</span></span>
      ${o.status === 'offen' && html`<${IconButton} icon="x" label=${`Order ${name(o)} stornieren`} onClick=${() => { set(o.id, 'storniert'); ctx.emit('order.storno', { id: o.id }); }} />`}
      ${o.status === 'storniert' && html`<${IconButton} icon="undo-2" label=${`Order ${name(o)} wiederherstellen`} onClick=${() => { set(o.id, 'offen'); ctx.emit('order.restore', { id: o.id }); }} />`}</div>`; };
    return html`<${Card} title=${props.title} icon="circle-dashed" actions=${html`<${Badge} tone="info" icon="info">Simulation<//>`}>
      <${Segmented} label="Orders" value=${tab} onChange=${setTab} options=${[{ value: 'offen', label: `Offen (${open.length})` }, { value: 'alle', label: `Alle (${all.length})` }]} />
      <div style="margin-top:12px">${list.length ? html`<div class="tk-trd-list">${list.map(row)}</div>` : html`<${EmptyState} icon="circle-dashed" title=${tab === 'offen' ? 'Keine offenen Orders' : 'Noch keine Orders'} text="Spiele im Ticket eine Order durch. Sie erscheint hier, das Depot bleibt unverändert." />`}</div>
      ${props.showNote && html`<div style="margin-top:12px"><${Note} icon="info">Simulierte Orders verändern das Depot nicht. Limit- und Stop-Orders bleiben offen, bis du sie stornierst.<//></div>`}<//>`;
  },
};
export default [trdOrderList];
