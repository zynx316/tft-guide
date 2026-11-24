// Trading: Transaktionen – Käufe, Verkäufe, Sparplan-Ausführungen, Dividenden und simulierte Orders nach Monat; Filter, Suche, Detail, CSV.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, EmptyState, Segmented, Search, Icon } from '../../ui.js';
import { money } from '../../helpers.js';
import { fmtDate, fmtNumber } from '../../../lib/format.js';
import { MONTHS_LONG, parseLocal } from '../../../lib/date.js';
import { download } from '../../../lib/util.js';
import { buildLedger, kindLabel, arr, byId, known, sum } from './_calc.js';
import { slots, Tile, Stat, Note, Px, TRD_CSS, openSecurity } from './_trd.js';
import { ex } from './_example.js';

const ICON = { buy: 'trending-up', sell: 'trending-down', plan: 'repeat', dividend: 'coins', sim: 'circle-dashed' };
const TONE = { buy: 'accent', sell: 'warning', plan: 'info', dividend: 'success', sim: 'neutral' };
const FILTERS = [['all', 'Alle'], ['buy', 'Käufe'], ['sell', 'Verkäufe'], ['plan', 'Sparplan'], ['dividend', 'Dividenden'], ['sim', 'Simulation']];

export const trdHistory = {
  id: 'trd-history',
  name: 'Transaktionen',
  category: 'Trading',
  description: 'Alle Bewegungen im Depot nach Monat: Käufe, Verkäufe (mit realisiertem Gewinn und Steuer-Orientierung), Sparplan-Ausführungen, Dividenden und simulierte Orders. Filtern, suchen, Detail öffnen und als CSV ausgeben.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Transaktionen' },
    { name: 'limit', label: 'Max. Einträge (0 = alle)', type: 'number', default: 0 },
    { name: 'showSummary', label: 'Kennzahlen zeigen', type: 'boolean', default: true },
    { name: 'showExport', label: 'CSV-Export', type: 'boolean', default: true },
  ],
  data: slots('trades', 'orders', 'transactions', 'dividends', 'plans', 'instruments', 'positions', 'watchlist', 'allowance'),
  events: ['history.filter', 'history.open', 'history.export', 'security.open'],
  states: ['empty'],
  css: `${TRD_CSS}
  .tk-trd-hs { display:flex; flex-direction:column; gap:var(--tk-space-4); min-width:0; } .tk-trd-hs__tools { display:flex; gap:var(--tk-space-2); flex-wrap:wrap; align-items:center; } .tk-trd-hs__tools .tk-search { flex:1 1 200px; min-width:0; }
  .tk-trd-hs__m { display:flex; justify-content:space-between; align-items:baseline; gap:8px; padding:12px 4px 4px; } .tk-trd-hs__row { display:flex; align-items:center; gap:12px; padding:8px 4px; min-height:58px; width:100%; background:none; border:0; color:inherit; font:inherit; text-align:left; cursor:pointer; border-radius:var(--tk-radius-md); }
  .tk-trd-hs__row:hover { background:var(--tk-c-surface2); } .tk-trd-hs__dl { display:grid; grid-template-columns:minmax(110px,auto) minmax(0,1fr); gap:8px 16px; margin:0; font-size:var(--tk-fs-sm); } .tk-trd-hs__dl dd { margin:0; text-align:right; font-variant-numeric:tabular-nums; } .tk-trd-hs__dl dt { color:var(--tk-c-text-muted); }`,
  example: { data: ex('trades', 'orders', 'transactions', 'dividends', 'plans', 'instruments', 'positions', 'watchlist', 'allowance') },
  render: function TrdHistory({ props, data, ctx }) {
    const [f, setF] = useState('all'), [q, setQ] = useState('');
    const ok = known(data.positions, data.watchlist);
    const led = buildLedger({ ...data, trades: arr(data.trades).filter(ok), orders: arr(data.orders).filter(ok), positions: data.positions }, ctx.today, data.allowance);
    const cnt = (k) => (k === 'all' ? led.length : led.filter((e) => e.kind === k).length);
    const list = led.filter((e) => (f === 'all' || e.kind === f) && e.title.toLowerCase().includes(q.toLowerCase())), shown = props.limit > 0 ? list.slice(0, props.limit) : list;
    const nm = (e) => { const i = byId(data.instruments, e.securityId); return i ? i.short || i.name : e.title; };
    const groups = []; for (const e of shown) { const k = e.date.slice(0, 7); let g = groups[groups.length - 1]; if (!g || g.k !== k) { g = { k, items: [] }; groups.push(g); } g.items.push(e); }
    const year = String(ctx.today.getFullYear()), sells = led.filter((e) => e.kind === 'sell' && e.date.startsWith(year));
    const exportCsv = () => { const rows = [['Datum', 'Art', 'Wertpapier', 'Stück', 'Kurs', 'Gebühr', 'Betrag'], ...list.map((e) => [fmtDate(e.date), kindLabel(e.kind), nm(e), fmtNumber(e.qty, { digits: 4 }), fmtNumber(e.price, { digits: 2 }), fmtNumber(e.fee || 0, { digits: 2 }), fmtNumber(e.amount, { digits: 2 })])];
      try { download('transaktionen.csv', rows.map((r) => r.join(';')).join('\n'), 'text/csv'); } catch { /* Vorschau ohne Download */ } ctx.emit('history.export', { rows: list.length }); ctx.toast(`CSV mit ${list.length} Zeilen erstellt (Demo)`); };
    const detail = (e) => { ctx.emit('history.open', { id: e.id }); ctx.openDialog({ title: e.title, body: (close) => html`<div class="tk-col" style="gap:12px"><dl class="tk-trd-hs__dl"><dt>Datum</dt><dd>${fmtDate(e.date, { style: 'weekday' })}</dd><dt>Art</dt><dd>${kindLabel(e.kind)}${e.simulated ? ' (Simulation)' : ''}</dd>
        <dt>Stück</dt><dd>${fmtNumber(e.qty, { digits: e.qty % 1 ? 4 : 0 })}</dd><dt>${e.kind === 'dividend' ? 'je Aktie' : 'Kurs'}</dt><dd><${Px} v=${e.price} /></dd><dt>Gebühr</dt><dd>${money(ctx, e.fee || 0)}</dd><dt>Betrag</dt><dd><strong>${money(ctx, e.amount, { sign: true })}</strong></dd>
        ${e.gain != null && html`<dt>Realisierter Gewinn</dt><dd>${money(ctx, e.gain, { sign: true })}</dd><dt>Steuer (Schätzung)</dt><dd>${money(ctx, e.tax)}</dd>`}</dl>
        ${e.simulated && html`<${Note} icon="info">Simuliert: Es wurde nichts an einen Broker gesendet.<//>`}${e.gain != null && html`<${Note} icon="scale">Steuer-Orientierung, keine Steuerberatung. Annahmen Stand 01/2026, mit Freistellungsauftrag.<//>`}</div>`,
        footer: (close) => html`<${Button} onClick=${close}>Schließen<//>${e.securityId && html`<${Button} variant="primary" icon="arrow-up-right" onClick=${() => { close(); openSecurity(ctx, e.securityId); }}>Wertpapier öffnen<//>`}` }); };
    const summary = props.showSummary && led.length > 0 && html`<div class="tk-trd-stats"><${Stat} label=${`Realisiert ${year}`}>${money(ctx, sum(sells, (e) => e.gain), { sign: true })}<//><${Stat} label="Dividenden erhalten">${money(ctx, sum(led.filter((e) => e.kind === 'dividend'), (e) => e.amount))}<//><${Stat} label="Per Sparplan investiert">${money(ctx, -sum(led.filter((e) => e.kind === 'plan'), (e) => e.amount), { digits: 0 })}<//></div>`;
    if (!led.length) return html`<${Card} title=${props.title} icon="history"><${EmptyState} icon="history" title="Noch keine Transaktionen" text="Käufe, Verkäufe, Sparplan-Ausführungen und Dividenden erscheinen hier. Simulierte Orders sind gekennzeichnet." action=${html`<${Button} icon="trending-up" onClick=${() => ctx.emit('order.new', { to: 'trading.order' })}>Order simulieren<//>`} /><//>`;
    return html`<${Card} title=${props.title} icon="history" actions=${props.showExport && html`<${Button} size="sm" icon="download" onClick=${exportCsv}>CSV<//>`}><div class="tk-trd-hs">${summary}
      <div class="tk-trd-hs__tools"><${Search} value=${q} onInput=${setQ} placeholder="Transaktionen durchsuchen" /><${Segmented} label="Art der Transaktion" value=${f} onChange=${(v) => { setF(v); ctx.emit('history.filter', { kind: v }); }} options=${FILTERS.map(([v, l]) => ({ value: v, label: `${l} ${cnt(v)}` }))} /></div>
      ${groups.length ? groups.map((g) => { const [y, m] = g.k.split('-'); return html`<section><div class="tk-trd-hs__m"><strong>${MONTHS_LONG[Number(m) - 1]} ${y}</strong><span class="tk-trd-meta tk-trd-num">${money(ctx, sum(g.items, (e) => e.amount), { sign: true })}</span></div>
        <div class="tk-trd-list">${g.items.map((e) => html`<button type="button" class="tk-trd-hs__row" onClick=${() => detail(e)} aria-label=${`${e.title}, Details`}><${Tile} icon=${ICON[e.kind]} tone=${TONE[e.kind]} size=${34} />
          <span class="tk-trd-grow"><span class="tk-trd-title" style="display:block">${e.title}</span><span class="tk-trd-sub">${fmtDate(parseLocal(e.date), { style: 'weekday' })}${e.kind !== 'dividend' && e.qty ? ` · ${fmtNumber(e.qty, { digits: e.qty % 1 ? 3 : 0 })} Stück` : ''}${e.status === 'offen' ? ' · offen' : ''}</span></span>
          ${e.simulated && html`<span class="tk-trd-pill tk-trd-pill--info">Simulation</span>`}<strong class="tk-trd-num">${money(ctx, e.amount, { sign: true })}</strong></button>`)}</div></section>`; })
        : html`<${EmptyState} icon="search" title="Keine Treffer" text="Passe Filter oder Suche an." />`}</div><//>`;
  },
};
export default [trdHistory];
