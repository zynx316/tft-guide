// Trading: Kopf eines Wertpapiers – Name, Kürzel, Kurs mit Tagesveränderung und die Aktionen Kauf simulieren, Verkauf simulieren, Alarm, Beobachten.
import { html } from '../../../lib/html.js';
import { Card, Button, Badge, EmptyState } from '../../ui.js';
import { fmtNumber } from '../../../lib/format.js';
import { arr, holdings, dayPctOf } from './_calc.js';
import { slots, Px, Chg, Tile, Note, TRD_CSS, pickSecurity } from './_trd.js';
import { toggleWatch } from './_watch.js';
import { TXT } from './_text.js';
import { ex } from './_example.js';

export const trdSecurityHead = {
  id: 'trd-security-head',
  name: 'Wertpapier-Kopf',
  category: 'Trading',
  description: 'Kopf der Wertpapier-Seite: Name, Kürzel, Typ und ISIN, aktueller Kurs mit Tagesveränderung (fiktiv, Stand 09:30) und die Aktionen Kauf simulieren und Verkauf simulieren, Kursalarm und Beobachten. Folgt der Auswahl.',
  version: '1.2',
  props: [
    { name: 'followSelection', label: 'Auswahl folgen', type: 'boolean', default: true },
    { name: 'showActions', label: 'Aktionen zeigen', type: 'boolean', default: true },
    { name: 'compact', label: 'Kompakt (ohne Kennzeile)', type: 'boolean', default: false },
  ],
  data: slots('instruments', 'positions', 'watchlist', 'cash'),
  events: ['order.new', 'alert.new', 'watch.add', 'watch.remove', 'portfolio.open'],
  states: ['empty'],
  css: `${TRD_CSS}
  .tk-trd-sh { display:flex; align-items:flex-start; justify-content:space-between; gap:var(--tk-space-4); flex-wrap:wrap; } .tk-trd-sh__id { display:flex; gap:14px; align-items:center; min-width:0; flex:1 1 260px; }
  .tk-trd-sh__name { font-size:var(--tk-fs-xl); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); line-height:1.15; overflow-wrap:anywhere; }
  .tk-trd-sh__price { display:flex; align-items:baseline; gap:10px; flex-wrap:wrap; margin-top:6px; } .tk-trd-sh__price > :first-child { font-size:var(--tk-fs-3xl); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); }
  .tk-trd-sh__acts { display:flex; gap:var(--tk-space-2); flex-wrap:wrap; } .bp-mobile .tk-trd-sh__acts { width:100%; } .bp-mobile .tk-trd-sh__acts .tk-btn { flex:1 1 calc(50% - 8px); justify-content:center; }
  [data-tk-large-text] .tk-trd-sh__id > :first-child { display:none; } [data-tk-large-text] .tk-trd-sh__acts { width:100%; flex-direction:column; } [data-tk-large-text] .tk-trd-sh__acts .tk-btn { flex:1 1 auto; width:100%; justify-content:center; }`,
  example: { data: ex('instruments', 'positions', 'watchlist', 'cash') },
  render: function TrdSecurityHead({ props, data, setData, ctx }) {
    const insts = arr(data.instruments), inst = (props.followSelection && insts.find((i) => i.id === ctx.ui.selectedId)) || insts.find((i) => arr(data.positions).some((p) => p.id === i.id)) || insts[0];
    if (!inst) return html`<${Card}><${EmptyState} icon="candlestick-chart" title="Kein Wertpapier gewählt" text="Wähle ein Wertpapier in der Watchlist oder im Depot." /><//>`;
    const hd = holdings(data.positions, data.cash), pos = hd.rows.find((r) => r.id === inst.id), watched = arr(data.watchlist).some((w) => w.id === inst.id), chg = dayPctOf(inst);
    const buy = (side) => { ctx.setUi('selectedId', inst.id); ctx.emit('order.new', { id: inst.id, to: 'trading.order', ui: { side, selectedId: inst.id } }); };
    return html`<${Card}><div class="tk-trd-sh"><div class="tk-trd-sh__id"><${Tile} type=${inst.type} size=${48} /><div style="min-width:0"><div class="tk-trd-sh__name">${inst.name}</div>
      <div class="tk-row" style="gap:6px;flex-wrap:wrap;margin-top:4px"><${Badge}>${inst.symbol}<//><${Badge}>${inst.type}<//>${inst.isin && html`<span class="tk-trd-sub">ISIN ${inst.isin} (Demo)</span>`}${pos && html`<${Badge} tone="accent" icon="check">Im Depot<//>`}</div>
      <div class="tk-trd-sh__price"><span class="tk-trd-num"><${Px} v=${inst.price} /></span><${Chg} v=${chg} digits=${2} /><span class="tk-trd-sub">heute · ${TXT.stand}</span></div></div></div>
      ${props.showActions && html`<div class="tk-trd-sh__acts"><${Button} variant="primary" icon="trending-up" onClick=${() => buy('buy')}>Kauf simulieren<//>
        <${Button} icon="trending-down" disabled=${!pos} title=${pos ? '' : 'Nicht im Depot'} onClick=${() => buy('sell')}>Verkauf simulieren<//><${Button} icon="bell" onClick=${() => ctx.emit('alert.new', { id: inst.id, to: 'trading.alerts' })}>Alarm<//>
        <${Button} icon=${watched ? 'star' : 'plus'} aria-pressed=${String(watched)} onClick=${() => toggleWatch(ctx, inst, data.watchlist, setData)}>${watched ? 'Beobachtet' : 'Beobachten'}<//></div>`}</div>
      ${inst.type === 'Krypto' && html`<div style="margin-top:12px"><${Note} tone="warning" icon="alert-triangle"><strong>Kryptowert:</strong> ${TXT.krypto}. Gewinne können steuerpflichtig sein.<//></div>`}<//>`;
  },
};
export default [trdSecurityHead];
