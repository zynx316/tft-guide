// Vertrieb (kompakt): Kanaltabelle mit Suche, Statusfilter und Sortierung (channel-table), Umsatz-Streifen 7 Tage (revenue-strip) und Einladung ohne Kanal (sales-firstrun).
// Alle drei zeigen ohne Kanäle nichts (quietEmpty) bzw. nur die Einladung – der Erststart bleibt eine Karte mit einer Aktion.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Badge, Button, Icon, EmptyState, Search, Sparkline } from '../../ui.js';
import { money, percent } from '../../helpers.js';
import { fmt } from '../../../lib/util.js';

const ST = { connected: { label: 'Verbunden', tone: 'success', w: 1 }, error: { label: 'Fehler', tone: 'danger', w: 0 }, paused: { label: 'Pausiert', tone: 'neutral', w: 2 } };
const FILTERS = [['all', 'Alle'], ['connected', 'Verbunden'], ['error', 'Fehler'], ['paused', 'Pausiert']];
const COLS = [['name', 'Kanal'], ['status', 'Status'], ['revenue', 'Umsatz 30 T.'], ['orders', 'Bestellungen'], ['delta', 'Veränderung'], ['trend', 'Verlauf']];

export const channelTable = {
  id: 'channel-table',
  name: 'Kanaltabelle',
  category: 'Vertrieb',
  description: 'Alle Verkaufskanäle als dichte, sortierbare Tabelle (Kanal, Status, Umsatz, Bestellungen, Veränderung, Verlauf) mit Suche und Statusfilter. Eine Zeile antippen wählt den Kanal (ctx.ui.selectedId) für das Kurz-Detail daneben. Ohne Kanäle bleibt die Komponente still, wenn quietEmpty gesetzt ist.',
  version: '1.1',
  props: [{ name: 'title', label: 'Titel', type: 'text', default: '' }, { name: 'quietEmpty', label: 'Ohne Kanäle nichts anzeigen', type: 'boolean', default: false }],
  data: [{ slot: 'channels', label: 'Kanäle', default: 'channels', shape: '{id,name,icon?,status,revenue,orders,delta?,trend?,error?}[]', required: true }],
  events: ['channel.select', 'filter.change'],
  states: ['empty'],
  flutter: { widget: 'ChannelTable', propMap: {}, events: ['channel.select', 'filter.change'] },
  css: `
  .tk-cht__bar { display:flex; flex-direction:column; gap:var(--tk-space-2); padding:var(--tk-space-3) var(--tk-space-4); border-bottom:1px solid var(--tk-c-border); } .tk-cht__chips { display:flex; flex-wrap:wrap; gap:6px; }
  .tk-cht { width:100%; border-collapse:collapse; font-variant-numeric:tabular-nums; font-size:var(--tk-fs-sm); }
  .tk-cht th { text-align:left; padding:0; border-bottom:1px solid var(--tk-c-border-strong); font-size:var(--tk-fs-xs); font-weight:var(--tk-fw-semibold); color:var(--tk-c-text-muted); }
  .tk-cht th button { all:unset; box-sizing:border-box; display:flex; align-items:center; gap:4px; width:100%; min-height:36px; padding:0 10px; cursor:pointer; } .tk-cht th button:focus-visible { outline:2px solid var(--tk-c-focus); outline-offset:-2px; }
  .tk-cht td { padding:0 10px; height:48px; border-bottom:1px solid var(--tk-c-border); } .tk-cht tbody tr { cursor:pointer; } .tk-cht tbody tr:hover td { background:var(--tk-c-surface2); } .tk-cht tbody tr[data-sel="true"] td { background:var(--tk-c-surface2); } .tk-cht tbody tr[data-sel="true"] td:first-child { box-shadow:inset 4px 0 0 var(--tk-c-accent); }
  .tk-cht .tk-cht__r { text-align:right; } .tk-cht .tk-cht__r button { justify-content:flex-end; }
  .tk-cht__rowbtn { all:unset; box-sizing:border-box; display:flex; align-items:center; gap:8px; min-height:44px; cursor:pointer; min-width:0; } .tk-cht__rowbtn:focus-visible { outline:2px solid var(--tk-c-focus); outline-offset:2px; }
  .bp-mobile .tk-cht__x { display:none; } .bp-mobile .tk-cht td { height:56px; padding:0 8px; }
  [data-tk-large-text] .tk-cht td { height:auto; padding-block:8px; } [data-tk-large-text] .tk-cht__x { display:none; }
  [data-tk-large-text] .tk-cht, [data-tk-large-text] .tk-cht thead, [data-tk-large-text] .tk-cht tbody { display:block; }
  [data-tk-large-text] .tk-cht thead tr { display:flex; flex-wrap:wrap; gap:2px 4px; padding:4px 6px; border-bottom:1px solid var(--tk-c-border-strong); } [data-tk-large-text] .tk-cht th { display:block; border-bottom:0; } [data-tk-large-text] .tk-cht th button { padding:0 8px; }
  [data-tk-large-text] .tk-cht tbody tr { display:flex; flex-wrap:wrap; align-items:center; gap:2px 12px; padding:8px var(--tk-space-4); border-bottom:1px solid var(--tk-c-border); }
  [data-tk-large-text] .tk-cht tbody td { padding:0; border-bottom:0; background:none !important; box-shadow:none !important; } [data-tk-large-text] .tk-cht tbody td:first-child { flex:1 1 100%; min-width:0; }
  [data-tk-large-text] .tk-cht tbody td.tk-cht__r { margin-left:auto; }
  [data-tk-large-text] .tk-cht tbody tr:hover, [data-tk-large-text] .tk-cht tbody tr[data-sel="true"] { background:var(--tk-c-surface2); } [data-tk-large-text] .tk-cht tbody tr[data-sel="true"] { box-shadow:inset 4px 0 0 var(--tk-c-accent); }
  [data-tk-large-text] .tk-cht__rowbtn > span > .tk-truncate { max-width:none !important; }`,
  example: { data: { channels: [{ id: 'shopify', name: 'Shopify', icon: 'shopping-cart', status: 'connected', revenue: 6240.5, orders: 78, delta: 8.2, trend: [5200, 5400, 5800, 5700, 6100, 6240] }, { id: 'etsy', name: 'Etsy', icon: 'store', status: 'error', revenue: 1980, orders: 31, delta: -4.1, error: 'Token abgelaufen', trend: [2300, 2250, 2100, 2050, 2000, 1980] }] } },
  render: function ChannelTable({ props, data, ctx }) {
    const [q, setQ] = useState(''), [flt, setFlt] = useState('all'), [sort, setSort] = useState({ key: 'status', dir: 1 });
    const all = data.channels || [];
    if (!all.length) return props.quietEmpty ? null : html`<${Card} title=${props.title}><${EmptyState} icon="store" title="Keine Verkaufskanäle" text="Verbinde einen Kanal, dann erscheint er hier." /><//>`;
    const sel = ctx.ui.selectedId || all[0].id, cnt = (k) => (k === 'all' ? all.length : all.filter((c) => c.status === k).length);
    const key = { name: (c) => c.name.toLowerCase(), status: (c) => (ST[c.status] || ST.paused).w, revenue: (c) => c.revenue, orders: (c) => c.orders, delta: (c) => c.delta || 0, trend: (c) => (c.trend || []).slice(-1)[0] || 0 }[sort.key];
    const rows = all.filter((c) => (flt === 'all' || c.status === flt) && (!q.trim() || c.name.toLowerCase().includes(q.trim().toLowerCase()))).sort((a, b) => (key(a) > key(b) ? 1 : key(a) < key(b) ? -1 : 0) * sort.dir);
    const by = (k) => setSort((s) => ({ key: k, dir: s.key === k ? -s.dir : k === 'name' || k === 'status' ? 1 : -1 }));
    const pick = (c) => { ctx.setUi('selectedId', c.id); ctx.emit('channel.select', { id: c.id }); };
    return html`<${Card} flush title=${props.title} icon=${props.title ? 'store' : undefined}><div class="tk-cht__bar"><${Search} value=${q} onInput=${setQ} placeholder="Kanal suchen …" />
        <div class="tk-cht__chips" role="group" aria-label="Status filtern">${FILTERS.map(([k, l]) => html`<button type="button" class="tk-chip" aria-pressed=${flt === k ? 'true' : 'false'} onClick=${() => { setFlt(k); ctx.emit('filter.change', { filter: k }); }}>${l} <span class="tk-num">${cnt(k)}</span></button>`)}</div></div>
      <div style="overflow-x:auto"><table class="tk-cht"><thead><tr>${COLS.map(([k, l]) => html`<th scope="col" class=${`${['revenue', 'orders', 'delta'].includes(k) ? 'tk-cht__r' : ''} ${['orders', 'trend'].includes(k) ? 'tk-cht__x' : ''}`} aria-sort=${sort.key === k ? (sort.dir > 0 ? 'ascending' : 'descending') : 'none'}>${k === 'trend' ? html`<span style="padding:0 10px">${l}</span>` : html`<button type="button" onClick=${() => by(k)}>${l}${sort.key === k && html`<${Icon} name=${sort.dir > 0 ? 'arrow-up' : 'arrow-down'} size=${12} />`}</button>`}</th>`)}</tr></thead>
        <tbody>${rows.map((c) => { const st = ST[c.status] || ST.paused;
          return html`<tr data-sel=${String(c.id === sel)} onClick=${() => pick(c)}><td><button type="button" class="tk-cht__rowbtn" aria-label=${`${c.name} wählen`} onClick=${(e) => { e.stopPropagation(); pick(c); }}><${Icon} name=${c.icon || 'store'} size=${16} /><span style="min-width:0"><strong>${c.name}</strong>${c.status === 'error' && c.error && html`<span class="tk-subtle tk-truncate" style="display:block;font-size:var(--tk-fs-xs);max-width:22ch">${c.error}</span>`}</span></button></td>
            <td><${Badge} tone=${st.tone} dot=${true}>${st.label}<//></td><td class="tk-cht__r">${money(ctx, c.revenue, { digits: 0 })}</td><td class="tk-cht__r tk-cht__x">${fmt.number(c.orders)}</td>
            <td class="tk-cht__r" style=${`color:var(--tk-c-${(c.delta || 0) >= 0 ? 'success' : 'danger'})`}>${percent(ctx, (c.delta || 0) / 100)}</td><td class="tk-cht__x">${c.trend && html`<${Sparkline} values=${c.trend} width=${72} height=${24} tone=${(c.delta || 0) >= 0 ? 'success' : 'danger'} />`}</td></tr>`; })}</tbody></table></div>
      ${rows.length === 0 && html`<${EmptyState} icon="search" title=${q ? `Keine Treffer für „${q}“` : 'Keine Kanäle mit diesem Status'} text="Prüfe die Schreibweise oder wähle „Alle“." />`}<//>`;
  },
};

export const revenueStrip = {
  id: 'revenue-strip',
  name: 'Umsatz-Streifen (7 Tage)',
  category: 'Vertrieb',
  description: 'Umsatz der letzten 7 Tage über alle Kanäle als schmale Balkenreihe mit Wochensumme. Beträge folgen dem Privatsphäre-Modus; ohne Daten bleibt die Komponente still (quietEmpty).',
  version: '1.0',
  props: [{ name: 'title', label: 'Titel', type: 'text', default: 'Umsatz 7 Tage' }, { name: 'quietEmpty', label: 'Ohne Daten nichts anzeigen', type: 'boolean', default: true }],
  data: [{ slot: 'series', label: 'Umsatzreihen', default: 'revenue', shape: '{labels:string[], series:[{name,values:number[]}]}', required: true }],
  events: [],
  states: ['empty'],
  flutter: { widget: 'RevenueStrip', propMap: {}, events: [] },
  css: `.tk-rvs { display:grid; grid-template-columns:repeat(7, minmax(0, 1fr)); gap:6px; align-items:end; height:96px; } .tk-rvs > div { display:flex; flex-direction:column; justify-content:flex-end; align-items:center; gap:4px; height:100%; font-size:var(--tk-fs-xs); color:var(--tk-c-text-muted); } .tk-rvs i { display:block; width:100%; border-radius:4px 4px 0 0; background:var(--tk-c-accent); min-height:3px; } .tk-rvs > div[data-last="true"] i { background:var(--tk-c-success); }`,
  example: { data: { series: { labels: ['Mi', 'Do', 'Fr', 'Sa', 'So', 'Mo', 'Di'], series: [{ name: 'Shopify', values: [212, 246, 301, 188, 163, 229, 120] }, { name: 'Amazon', values: [141, 162, 138, 187, 126, 152, 80] }] } } },
  render: ({ props, data, ctx }) => {
    const labels = data.series?.labels || [], series = data.series?.series || [];
    if (!series.length || !labels.length) return props.quietEmpty ? null : html`<${Card} title=${props.title}><${EmptyState} icon="bar-chart-3" title="Keine Daten" text="Für diesen Zeitraum liegen keine Werte vor." /><//>`;
    const days = labels.map((l, i) => ({ l, v: series.reduce((s, x) => s + (x.values[i] || 0), 0) })), max = Math.max(1, ...days.map((d) => d.v)), sum = days.reduce((s, d) => s + d.v, 0);
    return html`<${Card} title=${props.title} icon="bar-chart-3" actions=${html`<strong class="tk-num">${money(ctx, sum, { digits: 0 })}</strong>`}><div class="tk-rvs" role="img" aria-label=${`Umsatz der letzten ${days.length} Tage, Summe ${money(ctx, sum, { digits: 0 })}`}>${days.map((d, i) => html`<div data-last=${String(i === days.length - 1)}><i style=${`height:${Math.max(3, (d.v / max) * 70)}px`}></i><span>${d.l}</span></div>`)}</div><//>`;
  },
};

export const salesFirstrun = {
  id: 'sales-firstrun',
  name: 'Einladung ohne Kanal (Vertrieb)',
  category: 'Vertrieb',
  description: 'Leerzustand der Sales-Übersicht: eine Einladung und genau eine Aktion „Kanal verbinden“. Sobald ein Kanal verbunden ist, bleibt die Komponente unsichtbar.',
  version: '1.0',
  props: [{ name: 'title', label: 'Titel', type: 'text', default: 'Noch kein Kanal verbunden' }, { name: 'text', label: 'Text', type: 'text', default: 'Verbinde Shopify, Etsy, Amazon oder eBay, dann erscheinen hier Bestellungen und Umsatz.' }],
  data: [{ slot: 'channels', label: 'Kanäle', default: 'channels', shape: '{id,name,status}[]', required: true }],
  events: ['channel.connect'],
  states: ['empty'],
  flutter: { widget: 'SalesFirstrun', propMap: { title: 'title', text: 'text' }, events: ['channel.connect'] },
  css: ``,
  example: { data: { channels: [] } },
  render: ({ props, data, ctx }) => ((data.channels || []).length ? null : html`<${Card}><${EmptyState} icon="store" title=${props.title} text=${props.text} action=${html`<${Button} variant="primary" icon="plus" onClick=${() => ctx.emit('channel.connect', { to: 'sales.connect' })}>Kanal verbinden<//>`} /><//>`),
};
export default [channelTable, revenueStrip, salesFirstrun];
