// Vertrieb: Verkaufskanäle als Karten mit Status, Sync-Aktion und Kennzahlen
import { html } from '../../../lib/html.js';
import { useState, useRef, useEffect } from 'preact/hooks';
import { Card, Button, Badge, Icon, EmptyState } from '../../ui.js';
import { fmt } from '../../../lib/util.js';
import { rel, filterItems, SPIN_CSS } from './shared.js';

const STATUS = { connected: { label: 'Verbunden', tone: 'success' }, error: { label: 'Fehler', tone: 'danger' }, paused: { label: 'Pausiert', tone: 'neutral' } };
const CHIPS = { verbunden: (c) => c.status === 'connected', fehler: (c) => c.status === 'error', pausiert: (c) => c.status === 'paused' };

export const channelCards = {
  id: 'channel-cards',
  name: 'Kanal-Karten',
  category: 'Vertrieb',
  description: 'Verkaufskanäle (Shopify, Etsy, Amazon …) als Karten mit Status, Umsatz, Bestellungen und letztem Sync. Aktion „Synchronisieren“ mit Ladezustand; Fehlerkanäle optional zuerst.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Verkaufskanäle' },
    { name: 'minWidth', label: 'Min. Kartenbreite (px)', type: 'number', default: 260 },
    { name: 'errorsFirst', label: 'Fehlerkanäle zuerst', type: 'boolean', default: false },
    { name: 'showStats', label: 'Kennzahlen zeigen', type: 'boolean', default: true },
    { name: 'density', label: 'Dichte', type: 'select', options: ['comfortable', 'compact'], default: 'comfortable' },
    { name: 'respectFilter', label: 'Suche/Filter beachten', type: 'boolean', default: true },
  ],
  data: [{ slot: 'channels', label: 'Kanäle', default: 'channels', shape: '{id,name,icon?,status:connected|error|paused,lastSync,revenue,orders,delta?,pending?,error?,needsAuth?}[]', required: true }],
  events: ['channel.open', 'channel.sync', 'channel.reconnect', 'channel.resume'],
  states: ['empty'],
  css: `
  .tk-channel-cards { display:grid; gap:var(--tk-space-3); grid-template-columns:repeat(auto-fill, minmax(min(100%, var(--minw,260px)), 1fr)); }
  .tk-channel-card { display:flex; flex-direction:column; gap:var(--tk-space-3); text-align:left; }
  .tk-channel-card[data-status="error"] { border-color:color-mix(in srgb, var(--tk-c-danger) 45%, transparent); }
  .tk-channel-card__head { display:flex; align-items:center; gap:var(--tk-space-3); min-width:0; }
  .tk-channel-card__logo { width:40px; height:40px; border-radius:12px; display:grid; place-items:center; flex:none; }
  .tk-channel-card__name { font-weight:var(--tk-fw-semibold); }
  .tk-channel-card__sub { font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); }
  .tk-channel-card__stats { display:grid; grid-template-columns:1fr 1fr; gap:var(--tk-space-3); }
  .tk-channel-card__stat span { display:block; font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); }
  .tk-channel-card__stat strong { font-size:var(--tk-fs-lg); font-weight:var(--tk-fw-bold); font-variant-numeric:tabular-nums; letter-spacing:var(--tk-ls-tight); }
  .tk-channel-card__err { display:flex; gap:8px; align-items:flex-start; padding:8px 10px; border-radius:var(--tk-radius-md); background:var(--tk-c-danger-soft); color:var(--tk-c-danger); font-size:var(--tk-fs-sm); }
  .tk-channel-card__foot { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:var(--tk-space-2); padding-top:var(--tk-space-3); border-top:1px solid var(--tk-c-border); margin-top:auto; }
  .tk-channel-card__sync { font-size:var(--tk-fs-xs); color:var(--tk-c-text-muted); display:flex; align-items:center; gap:6px; white-space:nowrap; }
  .tk-channel-card__foot .tk-btn { margin-left:auto; }
  .tk-channel-cards--compact .tk-channel-card { padding:var(--tk-space-3); gap:var(--tk-space-2); }
  .tk-spin-btn .icon { animation:tk-spin .9s linear infinite; }
  ${SPIN_CSS}`,
  example: { props: { title: 'Verkaufskanäle' }, data: { channels: [
    { id: 'shopify', name: 'Shopify', icon: 'shopping-cart', status: 'connected', lastSync: '2026-11-24T09:18:00', revenue: 6240.5, orders: 78, delta: 8.2, pending: 3 },
    { id: 'etsy', name: 'Etsy', icon: 'store', status: 'error', lastSync: '2026-11-23T21:40:00', revenue: 1980, orders: 31, delta: -4.1, error: 'Token abgelaufen', needsAuth: true },
    { id: 'ebay', name: 'eBay', icon: 'tag', status: 'paused', lastSync: '2026-11-20T10:00:00', revenue: 410, orders: 9, delta: 0 },
  ] } },
  render: function ChannelCards({ props, data, setData, ctx }) {
    const [busy, setBusy] = useState({});
    const alive = useRef(true);
    useEffect(() => () => { alive.current = false; }, []);
    const norm = (c) => ({ status: 'connected', revenue: 0, orders: 0, ...c, name: c.name || c.title || 'Neuer Kanal' });
    let items = filterItems((data.channels || []).map(norm), props.respectFilter ? ctx.ui : {}, ['name', 'status'], CHIPS);
    if (props.errorsFirst) { const w = { error: 0, paused: 2, connected: 1 }; items = [...items].sort((a, b) => w[a.status] - w[b.status]); }
    const patch = (id, p) => setData('channels', (all) => all.map((c) => (c.id === id ? { ...c, ...p } : c)));

    const sync = (ch) => {
      if (busy[ch.id]) return;
      setBusy((b) => ({ ...b, [ch.id]: true }));
      ctx.emit('channel.sync', { id: ch.id, from: ch.status });
      setTimeout(() => {
        if (!alive.current) return;
        setBusy((b) => ({ ...b, [ch.id]: false }));
        if (ch.status === 'error' && ch.needsAuth) { ctx.toast(`${ch.name}: Anmeldung abgelaufen – bitte neu verbinden`); return; }
        const add = ch.pending || 0;
        patch(ch.id, { status: 'connected', error: null, lastSync: ctx.today.toISOString(), orders: ch.orders + add, pending: 0 });
        ctx.toast(add ? `${ch.name} synchronisiert · ${add} neue ${add === 1 ? 'Bestellung' : 'Bestellungen'}` : `${ch.name} ist aktuell`);
      }, 1100);
    };
    const reconnect = (ch) => { ctx.emit('channel.reconnect', { id: ch.id }); ctx.openDialog({
      title: `${ch.name} neu verbinden`,
      body: () => html`<p class="tk-muted">Du wirst zur Anmeldung bei ${ch.name} weitergeleitet, um den Zugriff zu erneuern. (Simulation in der Vorschau)</p>`,
      footer: (close) => html`<${Button} onClick=${close}>Abbrechen<//><${Button} variant="primary" icon="link-2" onClick=${() => { patch(ch.id, { status: 'connected', error: null, needsAuth: false }); ctx.toast(`${ch.name} wieder verbunden`); close(); }}>Verbinden<//>`,
    }); };
    const resume = (ch) => { patch(ch.id, { status: 'connected' }); ctx.emit('channel.resume', { id: ch.id }); ctx.toast(`${ch.name} fortgesetzt`); };

    if (!items.length) return html`<${Card} title=${props.title}><${EmptyState} icon="store" title="Keine Verkaufskanäle" text=${ctx.ui.query || (ctx.ui.filter && !/^alle?$/i.test(ctx.ui.filter)) ? 'Keine Kanäle für diese Suche oder diesen Filter.' : 'Verbinde deinen ersten Kanal, um Bestellungen zentral zu sehen.'} /><//>`;
    const sec = ctx.bp === 'mobile';
    return html`<div class="tk-col" style="gap:12px">
      ${props.title && html`<div class="tk-h3">${props.title}</div>`}
      <div class=${`tk-channel-cards tk-channel-cards--${props.density}`} style=${`--minw:${props.minWidth}px`}>
        ${items.map((ch, i) => { const st = STATUS[ch.status] || STATUS.paused; const isBusy = !!busy[ch.id]; const col = `var(--tk-chart-${(i % 6) + 1})`;
          return html`<article class="tk-card tk-card--interactive tk-channel-card" data-status=${ch.status} onClick=${() => { ctx.setUi('selectedId', ch.id); ctx.emit('channel.open', { id: ch.id }); }}>
            <div class="tk-channel-card__head">
              <span class="tk-channel-card__logo" style=${`background:color-mix(in srgb, ${col} 16%, transparent);color:${col}`}><${Icon} name=${ch.icon || 'store'} size=${20} /></span>
              <div class="tk-grow"><div class="tk-channel-card__name tk-truncate">${ch.name}</div>${ch.pending > 0 && ch.status === 'connected' && html`<div class="tk-channel-card__sub">${ch.pending} neue noch nicht importiert</div>`}</div>
              <${Badge} tone=${st.tone} dot=${true}>${st.label}<//>
            </div>
            ${ch.status === 'error' && ch.error && html`<div class="tk-channel-card__err"><${Icon} name="alert-triangle" size=${16} /><span>${ch.error}</span></div>`}
            ${props.showStats && html`<div class="tk-channel-card__stats">
              <div class="tk-channel-card__stat"><span>Umsatz 30 Tage</span><strong>${fmt.currency(ch.revenue)}</strong></div>
              <div class="tk-channel-card__stat"><span>Bestellungen</span><strong>${fmt.number(ch.orders)}</strong></div></div>`}
            <div class="tk-channel-card__foot">
              <span class="tk-channel-card__sync"><${Icon} name="clock" size=${13} /><span>${isBusy ? 'Synchronisiere …' : `${ch.lastSync ? `Sync ${rel(ch.lastSync, ctx.today)}` : 'Noch nicht synchronisiert'}`}</span></span>
              ${ch.status === 'paused' ? html`<${Button} size="sm" icon="play" onClick=${(e) => { e.stopPropagation(); resume(ch); }}>Fortsetzen<//>`
                : ch.status === 'error' && ch.needsAuth ? html`<${Button} size="sm" variant="primary" icon="link-2" onClick=${(e) => { e.stopPropagation(); reconnect(ch); }}>Neu verbinden<//>`
                : html`<${Button} size="sm" icon=${isBusy ? 'loader-2' : 'refresh-cw'} disabled=${isBusy} aria-busy=${isBusy ? 'true' : 'false'} class=${isBusy ? 'tk-spin-btn' : ''} onClick=${(e) => { e.stopPropagation(); sync(ch); }}>${sec ? 'Sync' : 'Synchronisieren'}<//>`}
            </div></article>`; })}
      </div></div>`;
  },
};

export default [channelCards];
