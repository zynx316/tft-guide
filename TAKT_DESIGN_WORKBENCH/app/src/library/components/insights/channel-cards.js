// Vertrieb: Verkaufskanäle als Karten mit Status, Sync-Aktion und Kennzahlen
import { html } from '../../../lib/html.js';
import { useState, useRef, useEffect } from 'preact/hooks';
import { Card, Button, Badge, Icon, EmptyState, Switch, Sparkline, toneColor } from '../../ui.js';
import { money, percent } from '../../helpers.js';
import { fmt, isoDay } from '../../../lib/util.js';
import { rel, filterItems, SPIN_CSS, patchChannel, reconnectDialog, ORDER_STAGES } from './shared.js';
import channelCockpit from './channel-cockpit.js';
import channelTableParts from './channel-table.js';

const STATUS = { connected: { label: 'Verbunden', tone: 'success' }, error: { label: 'Fehler', tone: 'danger' }, paused: { label: 'Pausiert', tone: 'neutral' } };
const CHIPS = { verbunden: (c) => c.status === 'connected', fehler: (c) => c.status === 'error', pausiert: (c) => c.status === 'paused' };

export const channelCards = {
  id: 'channel-cards',
  name: 'Kanal-Karten',
  category: 'Vertrieb',
  description: 'Verkaufskanäle (Shopify, Etsy, Amazon …) als Karten oder Zeilen mit Status, Umsatz, Bestellungen und letztem Sync. Aktion „Synchronisieren“ mit Ladezustand; Fehlerkanäle optional zuerst. Ein Tipp auf den Kanal meldet channel.open mit ID.',
  version: '1.3',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Verkaufskanäle' },
    { name: 'minWidth', label: 'Min. Kartenbreite (px)', type: 'number', default: 260 },
    { name: 'errorsFirst', label: 'Fehlerkanäle zuerst', type: 'boolean', default: false },
    { name: 'showStats', label: 'Kennzahlen zeigen', type: 'boolean', default: true },
    { name: 'density', label: 'Dichte', type: 'select', options: ['comfortable', 'compact'], default: 'comfortable' },
    { name: 'layout', label: 'Darstellung', type: 'select', options: ['cards', 'rows'], default: 'cards' },
    { name: 'respectFilter', label: 'Suche/Filter beachten', type: 'boolean', default: true },
    { name: 'quietEmpty', label: 'Ohne Kanäle nichts anzeigen', type: 'boolean', default: false },
  ],
  data: [{ slot: 'channels', label: 'Kanäle', default: 'channels', shape: '{id,name,icon?,status:connected|error|paused,lastSync,revenue,orders,delta?,pending?,error?,needsAuth?}[]', required: true }],
  events: ['channel.open', 'channel.sync', 'channel.reconnect', 'channel.resume'],
  states: ['empty'],
  css: `
  [data-tk-large-text] .tk-channel-card__sub { white-space:normal; overflow:visible; text-overflow:clip; overflow-wrap:anywhere; }
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
  .tk-channel-row { display:flex; align-items:center; gap:var(--tk-space-3); padding:10px var(--tk-space-4); min-height:60px; border-bottom:1px solid var(--tk-c-border); cursor:pointer; min-width:0; }
  .tk-channel-row .tk-btn { flex:none; min-width:36px; } .bp-mobile .tk-channel-row .tk-btn { min-width:44px; min-height:44px; }
  .tk-channel-row:last-child { border-bottom:0; } .tk-channel-row:hover { background:var(--tk-c-surface2); }
  .tk-spin-btn .icon { animation:tk-spin .9s linear infinite; }
  ${SPIN_CSS}
  [data-tk-large-text] .tk-channel-card__name, [data-tk-large-text] .tk-channel-card .tk-truncate, [data-tk-large-text] .tk-attn__body strong { white-space:normal; overflow:visible; text-overflow:clip; overflow-wrap:anywhere; }`,
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

    if (!(data.channels || []).length && props.quietEmpty && !ctx.ui.query) return null;   // quietEmpty: andere Karte der Seite trägt die Aktion „Kanal verbinden“
    if (!items.length) return html`<${Card} title=${props.title}><${EmptyState} icon="store" title="Keine Verkaufskanäle" text=${ctx.ui.query || (ctx.ui.filter && !/^alle?$/i.test(ctx.ui.filter)) ? 'Keine Kanäle für diese Suche oder diesen Filter.' : 'Verbinde deinen ersten Kanal, um Bestellungen zentral zu sehen.'} /><//>`;
    const sec = ctx.bp === 'mobile';
    if (props.layout === 'rows') {
      return html`<${Card} flush title=${props.title} icon="store">${items.map((ch, i) => { const st = STATUS[ch.status] || STATUS.paused; const isBusy = !!busy[ch.id]; const col = `var(--tk-chart-${(i % 6) + 1})`;
        return html`<div class="tk-channel-row" role="button" tabindex="0" onClick=${() => { ctx.setUi('selectedId', ch.id); ctx.emit('channel.open', { id: ch.id }); }} onKeyDown=${(e) => e.key === 'Enter' && ctx.emit('channel.open', { id: ch.id })}>
          <span class="tk-channel-card__logo" style=${`background:color-mix(in srgb, ${col} 16%, transparent);color:${col}`}><${Icon} name=${ch.icon || 'store'} size=${18} /></span>
          <div class="tk-grow" style="min-width:0"><div class="tk-channel-card__name tk-truncate">${ch.name}</div><div class="tk-channel-card__sub tk-truncate">${ch.status === 'error' ? (ch.error || 'Verbindung unterbrochen') : isBusy ? 'Synchronisiere …' : `Sync ${rel(ch.lastSync, ctx.today)}`}</div></div>
          <${Badge} tone=${st.tone} dot=${true}>${st.label}<//>
          ${ch.status === 'paused' ? html`<${Button} size="sm" icon="play" aria-label=${`${ch.name} fortsetzen`} onClick=${(e) => { e.stopPropagation(); resume(ch); }} />`
            : ch.status === 'error' && ch.needsAuth ? html`<${Button} size="sm" variant="primary" icon="link-2" aria-label=${`${ch.name} neu verbinden`} onClick=${(e) => { e.stopPropagation(); reconnect(ch); }} />`
            : html`<${Button} size="sm" icon=${isBusy ? 'loader-2' : 'refresh-cw'} disabled=${isBusy} aria-label=${`${ch.name} synchronisieren`} class=${isBusy ? 'tk-spin-btn' : ''} onClick=${(e) => { e.stopPropagation(); sync(ch); }} />`}</div>`; })}<//>`;
    }
    return html`<div class="tk-col" style="gap:12px">
      ${props.title && html`<div class="tk-h3">${props.title}</div>`}
      <div class=${`tk-channel-cards tk-channel-cards--${props.density}`} style=${`--minw:${props.minWidth}px`}>
        ${items.map((ch, i) => { const st = STATUS[ch.status] || STATUS.paused; const isBusy = !!busy[ch.id]; const col = `var(--tk-chart-${(i % 6) + 1})`;
          return html`<article class="tk-card tk-card--interactive tk-channel-card" role="button" tabindex="0" aria-label=${`${ch.name} öffnen`} data-status=${ch.status} onClick=${() => { ctx.setUi('selectedId', ch.id); ctx.emit('channel.open', { id: ch.id }); }} onKeyDown=${(e) => { if (e.target === e.currentTarget && e.key === 'Enter') { ctx.setUi('selectedId', ch.id); ctx.emit('channel.open', { id: ch.id }); } }}>
            <div class="tk-channel-card__head">
              <span class="tk-channel-card__logo" style=${`background:color-mix(in srgb, ${col} 16%, transparent);color:${col}`}><${Icon} name=${ch.icon || 'store'} size=${20} /></span>
              <div class="tk-grow"><div class="tk-channel-card__name tk-truncate">${ch.name}</div>${ch.pending > 0 && ch.status === 'connected' && html`<div class="tk-channel-card__sub">${ch.pending} neue noch nicht importiert</div>`}</div>
              <${Badge} tone=${st.tone} dot=${true}>${st.label}<//>
            </div>
            ${ch.status === 'error' && ch.error && html`<div class="tk-channel-card__err"><${Icon} name="alert-triangle" size=${16} /><span>${ch.error}</span></div>`}
            ${props.showStats && html`<div class="tk-channel-card__stats">
              <div class="tk-channel-card__stat"><span>Umsatz 30 Tage</span><strong>${money(ctx, ch.revenue)}</strong></div>
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



// ------------------------------------------------------------------------------------------------ Kanal-Detail ---
const PERMS = ['Bestellungen lesen', 'Produkte und Bestand lesen', 'Versandstatus zurückschreiben'];

export const channelDetail = {
  id: 'channel-detail',
  name: 'Kanal-Detail',
  category: 'Vertrieb',
  description: 'Der gewählte Kanal (ctx.ui.selectedId) im Detail: Status, Synchronisation (jetzt, nächster Lauf, Fehler und Neu verbinden), Kennzahlen mit Verlauf, letzte Bestellungen, Protokoll und Einstellungen. Layouts: voll, fokussiert (nur das Nötige) und kompakt (für Seitenspalten).',
  version: '1.1',
  props: [
    { name: 'layout', label: 'Layout', type: 'select', options: ['full', 'focus', 'compact'], default: 'full' },
    { name: 'showOrders', label: 'Letzte Bestellungen', type: 'boolean', default: true },
    { name: 'showLog', label: 'Protokoll', type: 'boolean', default: true },
    { name: 'showSettings', label: 'Einstellungen', type: 'boolean', default: true },
    { name: 'quietEmpty', label: 'Ohne Kanäle nichts anzeigen', type: 'boolean', default: false },
  ],
  data: [
    { slot: 'channels', label: 'Kanäle', default: 'channels', shape: '{id,name,status,lastSync,revenue,orders,delta?,pending?,error?,needsAuth?,url?,trend?,log?,autoSync?,notify?}[]', required: true },
    { slot: 'orders', label: 'Bestellungen', default: 'orders', shape: '{id,number,customer,channelId,total,status,date}[]', required: false },
  ],
  events: ['channel.sync', 'channel.reconnect', 'channel.resume', 'channel.open', 'channel.setting', 'order.open'],
  states: ['empty'],
  css: `
  .tk-chd { display:flex; flex-direction:column; gap:var(--tk-space-4); min-width:0; }
  .tk-chd__head { display:flex; align-items:center; gap:var(--tk-space-3); min-width:0; flex-wrap:wrap; }
  .tk-chd__logo { width:52px; height:52px; border-radius:16px; display:grid; place-items:center; flex:none; }
  .tk-chd__name { font-size:var(--tk-fs-xl); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); }
  .tk-chd__status { display:flex; align-items:center; gap:var(--tk-space-3); padding:var(--tk-space-4); border-radius:var(--tk-radius-lg); border:1px solid var(--tk-c-border); background:var(--tk-c-surface2); flex-wrap:wrap; }
  .tk-chd__status[data-tone="danger"] { background:var(--tk-c-danger-soft); border-color:color-mix(in srgb, var(--tk-c-danger) 40%, transparent); }
  .tk-chd__status[data-tone="success"] { background:var(--tk-c-success-soft); border-color:color-mix(in srgb, var(--tk-c-success) 30%, transparent); }
  .tk-chd__status[data-tone="warning"] { background:var(--tk-c-warning-soft); }
  .tk-chd__status .tk-btn { max-width:100%; height:auto; min-height:var(--tk-size-control); white-space:normal; text-align:center; }
  .tk-chd__kpis { display:grid; grid-template-columns:repeat(4, minmax(0,1fr)); gap:var(--tk-space-3); }
  .bp-mobile .tk-chd__kpis, .bp-tablet .tk-chd__kpis { grid-template-columns:repeat(2, minmax(0,1fr)); }
  .tk-chd--compact .tk-chd__kpis { grid-template-columns:repeat(2, minmax(0,1fr)); }
  .tk-chd__kpi { padding:var(--tk-space-3) var(--tk-space-4); border-radius:var(--tk-radius-md); border:1px solid var(--tk-c-border); background:var(--tk-c-surface); min-width:0; }
  .tk-chd__kpi span { display:block; font-size:var(--tk-fs-xs); color:var(--tk-c-text-muted); }
  .tk-chd__kpi strong { font-size:var(--tk-fs-xl); font-weight:var(--tk-fw-bold); font-variant-numeric:tabular-nums; letter-spacing:var(--tk-ls-tight); }
  .tk-chd__row { display:flex; align-items:center; gap:12px; min-height:48px; padding:6px var(--tk-space-4); border-bottom:1px solid var(--tk-c-border); min-width:0; }
  .tk-chd__row:last-child { border-bottom:0; }
  .tk-chd__btn { width:100%; border:0; background:none; color:inherit; font:inherit; text-align:left; cursor:pointer; padding:0; display:flex; align-items:center; gap:12px; min-width:0; }
  .tk-chd__log { display:flex; gap:10px; align-items:flex-start; padding:8px var(--tk-space-4); border-bottom:1px solid var(--tk-c-border); font-size:var(--tk-fs-sm); }
  .tk-chd__log:last-child { border-bottom:0; }
  .tk-chd__perm { display:flex; align-items:center; gap:6px; }
  .tk-chd__set { display:flex; align-items:center; gap:12px; min-height:48px; padding:0 var(--tk-space-4); border-bottom:1px solid var(--tk-c-border); }
  .tk-chd__set:last-child { border-bottom:0; } .tk-chd__set > span { flex:1; }`,
  example: { data: { orders: [{ id: 'o1', number: '#4185', customer: 'Anna Berger', channelId: 'shopify', total: 64.9, status: 'new', date: '2026-11-24T09:12:00' }], channels: [
    { id: 'shopify', name: 'Shopify', icon: 'shopping-cart', status: 'connected', lastSync: '2026-11-24T09:18:00', revenue: 6240.5, orders: 78, delta: 8.2, pending: 3, url: 'nordlicht-studio.myshopify.com', trend: [5200, 5400, 5800, 5700, 6100, 6240], log: [{ at: '2026-11-24T09:18:00', text: '3 neue Bestellungen importiert', tone: 'success' }] },
  ] } },
  render: function ChannelDetail({ props, data, setData, ctx }) {
    const [busy, setBusy] = useState(false);
    const alive = useRef(true); useEffect(() => () => { alive.current = false; }, []);
    const list = data.channels || [];
    const ch = list.find((c) => c.id === ctx.ui.selectedId) || list[0];
    if (!ch && props.quietEmpty) return null;
    if (!ch) return html`<${Card}><${EmptyState} icon="store" title="Kein Kanal gewählt" text="Verbinde einen Kanal, um Bestellungen und Umsatz zu sehen." /><//>`;
    const idx = Math.max(0, list.indexOf(ch)); const col = `var(--tk-chart-${(idx % 6) + 1})`; const st = STATUS[ch.status] || STATUS.paused;
    const orders = (data.orders || []).filter((o) => o.channelId === ch.id).sort((a, b) => String(b.date).localeCompare(String(a.date)));
    const next = ch.lastSync ? new Date(new Date(ch.lastSync).getTime() + 15 * 60000) : null;
    const sync = () => {
      if (busy) return; setBusy(true); ctx.emit('channel.sync', { id: ch.id });
      setTimeout(() => { if (!alive.current) return; setBusy(false); const add = ch.pending || 0; patchChannel(setData, ch.id, { lastSync: ctx.today.toISOString(), orders: ch.orders + add, pending: 0 }); ctx.toast(add ? `${ch.name} synchronisiert · ${add} neue ${add === 1 ? 'Bestellung' : 'Bestellungen'}` : `${ch.name} ist aktuell`); }, 1100);
    };
    const resume = () => { patchChannel(setData, ch.id, { status: 'connected' }); ctx.emit('channel.resume', { id: ch.id }); ctx.toast(`${ch.name} fortgesetzt`); };
    const aov = ch.orders ? ch.revenue / ch.orders : 0;
    const action = ch.status === 'error' && ch.needsAuth ? html`<${Button} variant="primary" icon="link-2" onClick=${() => reconnectDialog(ctx, setData, ch)}>Neu verbinden<//>`
      : ch.status === 'paused' ? html`<${Button} variant="primary" icon="play" onClick=${resume}>Fortsetzen<//>`
      : html`<${Button} variant="primary" icon=${busy ? 'loader-2' : 'refresh-cw'} disabled=${busy} class=${busy ? 'tk-spin-btn' : ''} onClick=${sync}>${busy ? 'Synchronisiere …' : 'Jetzt synchronisieren'}<//>`;
    const tone = ch.status === 'error' ? 'danger' : ch.status === 'paused' ? 'warning' : 'success';
    const statusBox = html`<div class="tk-chd__status" data-tone=${tone} role="status"><span style=${`color:var(--tk-c-${tone})`}><${Icon} name=${ch.status === 'error' ? 'alert-triangle' : ch.status === 'paused' ? 'circle-pause' : 'check-circle-2'} size=${22} /></span>
      <div class="tk-grow" style="min-width:0"><div style="font-weight:var(--tk-fw-semibold)">${ch.status === 'error' ? 'Verbindung unterbrochen' : ch.status === 'paused' ? 'Kanal pausiert' : 'Alles in Ordnung'}</div>
        <div class="tk-muted" style="font-size:var(--tk-fs-sm)">${ch.status === 'error' ? (ch.error || 'Bestellungen werden nicht importiert.') : ch.status === 'paused' ? `Letzter Sync ${rel(ch.lastSync, ctx.today)}. Es werden keine Bestellungen importiert.` : `Letzter Sync ${rel(ch.lastSync, ctx.today)}${ch.autoSync === false || !next ? '' : ' · nächster Lauf ' + (next < ctx.today ? 'fällig' : rel(next, ctx.today))}${ch.pending ? ` · ${ch.pending} neue noch nicht importiert` : ''}`}</div></div>${action}</div>`;
    const head = html`<div class="tk-chd__head"><span class="tk-chd__logo" style=${`background:color-mix(in srgb, ${col} 16%, transparent);color:${col}`}><${Icon} name=${ch.icon || 'store'} size=${26} /></span>
      <div class="tk-grow" style="min-width:0"><div class="tk-chd__name">${ch.name}</div>${ch.url && html`<div class="tk-subtle tk-truncate" style="font-size:var(--tk-fs-sm)">${ch.url}</div>`}</div><${Badge} tone=${st.tone} dot=${true}>${st.label}<//></div>`;
    const kpis = html`<div class="tk-chd__kpis"><div class="tk-chd__kpi"><span>Umsatz 30 Tage</span><strong>${money(ctx, ch.revenue, { digits: 0 })}</strong></div><div class="tk-chd__kpi"><span>Bestellungen</span><strong>${fmt.number(ch.orders)}</strong></div>
      <div class="tk-chd__kpi"><span>Ø Warenkorb</span><strong>${money(ctx, aov)}</strong></div><div class="tk-chd__kpi"><span>Veränderung</span><strong style=${`color:var(--tk-c-${(ch.delta || 0) >= 0 ? 'success' : 'danger'})`}>${percent(ctx, (ch.delta || 0) / 100)}</strong></div></div>`;
    if (props.layout === 'compact') return html`<${Card} title=${ch.name} icon=${ch.icon || 'store'} actions=${html`<${Badge} tone=${st.tone} dot=${true}>${st.label}<//>`}><div class="tk-chd tk-chd--compact">${statusBox}${kpis}
      <${Button} iconRight="chevron-right" onClick=${() => ctx.emit('channel.open', { id: ch.id })}>Vollständige Ansicht<//></div><//>`;
    const orderRows = props.showOrders && html`<${Card} flush title="Letzte Bestellungen" icon="package" actions=${html`<${Badge}>${orders.length}<//>`}>${orders.length ? orders.slice(0, props.layout === 'focus' ? 3 : 5).map((o) => html`<div class="tk-chd__row"><button type="button" class="tk-chd__btn" onClick=${() => { ctx.setUi('selectedId', o.id); ctx.emit('order.open', { id: o.id }); }}>
      <div class="tk-grow" style="min-width:0"><div style="font-weight:var(--tk-fw-medium)">${o.number} · ${o.customer}</div><div class="tk-subtle" style="font-size:var(--tk-fs-xs)">${rel(o.date, ctx.today)}</div></div>
      <span class="tk-num" style="font-weight:var(--tk-fw-semibold)">${money(ctx, o.total)}</span><${Badge} tone=${ORDER_STAGES[o.status]?.tone || 'neutral'}>${ORDER_STAGES[o.status]?.label || o.status}<//><${Icon} name="chevron-right" size=${15} /></button></div>`)
      : html`<${EmptyState} icon="package" title="Keine Bestellungen" text="Sobald der Kanal Bestellungen liefert, erscheinen sie hier." />`}<//>`;
    if (props.layout === 'focus') return html`<div class="tk-chd">${head}${statusBox}${kpis}${orderRows}</div>`;
    const log = props.showLog && html`<${Card} flush title="Protokoll" icon="history">${(ch.log || []).length ? ch.log.map((l) => html`<div class="tk-chd__log"><span style=${`color:${toneColor(l.tone || 'info')}`}><${Icon} name=${l.tone === 'danger' ? 'alert-triangle' : l.tone === 'success' ? 'check-circle-2' : 'info'} size=${15} /></span><div class="tk-grow">${l.text}</div><span class="tk-subtle" style="white-space:nowrap">${rel(l.at, ctx.today)}</span></div>`) : html`<${EmptyState} icon="history" title="Noch kein Protokoll" />`}<//>`;
    const set = (key, label) => html`<div class="tk-chd__set"><span>${label}</span><${Switch} checked=${ch[key] !== false} label=${label} onChange=${(v) => { patchChannel(setData, ch.id, { [key]: v }); ctx.emit('channel.setting', { id: ch.id, key, value: v }); }} /></div>`;
    const settings = props.showSettings && html`<${Card} flush title="Einstellungen" icon="settings">${set('autoSync', 'Automatisch alle 15 Minuten synchronisieren')}${set('notify', 'Bei Fehlern benachrichtigen')}
      <div class="tk-chd__log" style="flex-direction:column;gap:4px"><span class="tk-label">TAKT darf</span>${PERMS.map((p) => html`<span class="tk-muted tk-chd__perm"><${Icon} name="check" size=${13} />${p}</span>`)}<span class="tk-subtle" style="font-size:var(--tk-fs-xs)">Zahlungsdaten werden nie gespeichert.</span></div><//>`;
    return html`<div class="tk-chd">${head}${statusBox}${kpis}
      ${ch.trend && html`<${Card} title="Umsatzverlauf (6 Wochen)" icon="trending-up"><${Sparkline} values=${ch.trend} width=${Math.min(560, ctx.width ? ctx.width - 80 : 320)} height=${72} tone=${ch.delta >= 0 ? 'success' : 'danger'} /><//>`}
      ${orderRows}${log}${settings}</div>`;
  },
};

// ------------------------------------------------------------------------------------------------ Aufmerksamkeit ---
const dayKey = isoDay;

export const salesAttention = {
  id: 'sales-attention',
  name: 'Jetzt zu tun (Vertrieb)',
  category: 'Vertrieb',
  description: 'Priorisierte Handlungen im Vertrieb (ohne verbundenen Kanal: „Kanal verbinden“ als einzige Aktion): getrennte Kanäle, neue Bestellungen zum Zahlungsabgleich, Bestellungen zum Versenden und Kontext aus Kalender und Aufgaben (Termin mit betroffenem Kanal, überfällige Buchungsaufgabe). Jede Zeile hat eine Aktion; Erledigtes verschwindet.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Jetzt zu tun' },
    { name: 'limit', label: 'Max. Einträge (0 = alle)', type: 'number', default: 0 },
  ],
  data: [
    { slot: 'channels', label: 'Kanäle', default: 'channels', shape: 'wie channel-cards', required: true },
    { slot: 'orders', label: 'Bestellungen', default: 'orders', shape: 'wie order-pipeline', required: true },
    { slot: 'events', label: 'Termine (Kalender)', default: 'events', shape: '{id,title,start,category,allDay?}[]', required: false },
    { slot: 'tasks', label: 'Aufgaben', default: 'tasks', shape: '{id,title,due?,done?,project?,status?}[]', required: false },
  ],
  events: ['channel.open', 'order.open', 'channel.reconnect', 'channel.connect', 'task.toggle'],
  states: ['empty'],
  css: `
  .tk-attn { display:flex; gap:12px; align-items:flex-start; padding:12px var(--tk-space-4); border-bottom:1px solid var(--tk-c-border); min-width:0; }
  .tk-attn:last-child { border-bottom:0; }
  .tk-attn__ico { width:36px; height:36px; border-radius:12px; display:grid; place-items:center; flex:none; }
  .tk-attn__body { flex:1; min-width:0; } .tk-attn__body strong { font-weight:var(--tk-fw-semibold); display:block; }
  .tk-attn__text { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); margin-top:2px; }
  .tk-attn__acts { display:flex; gap:6px; flex-wrap:wrap; margin-top:8px; }
  .bp-mobile .tk-attn__acts .tk-btn { min-height:44px; }`,
  example: { data: { events: [{ id: 'e6', title: 'Lieferanten-Call Etsy', start: '2026-11-24T15:00:00', category: 'Sales' }], tasks: [{ id: 't8', title: 'Etsy-Gebühren buchen', due: '2026-11-22', project: 'Finanzen', status: 'Offen' }],
    channels: [{ id: 'etsy', name: 'Etsy', status: 'error', error: 'Zugriffstoken abgelaufen', needsAuth: true, lastSync: '2026-11-23T21:40:00', revenue: 1980, orders: 31 }],
    orders: [{ id: 'o1', number: '#4185', customer: 'Anna Berger', channelId: 'shopify', channel: 'Shopify', total: 64.9, status: 'new', date: '2026-11-24T09:12:00' }, { id: 'o4', number: '#4181', customer: 'Jonas Weber', channelId: 'etsy', channel: 'Etsy', total: 38, status: 'paid', date: '2026-11-23T19:20:00' }] } },
  render: ({ props, data, setData, ctx }) => {
    const items = [];
    const chs = data.channels || []; const ords = data.orders || [];
    for (const c of chs.filter((x) => x.status === 'error')) items.push({ k: `c-${c.id}`, tone: 'danger', icon: 'alert-triangle', title: `${c.name} ist nicht verbunden`, text: `${c.error || 'Bestellungen werden nicht importiert.'} Letzter Sync ${rel(c.lastSync, ctx.today)}.`, acts: [c.needsAuth && ['Neu verbinden', 'link-2', () => reconnectDialog(ctx, setData, c), true], ['Kanal', 'chevron-right', () => { ctx.setUi('selectedId', c.id); ctx.emit('channel.open', { id: c.id }); }]].filter(Boolean) });
    const fresh = ords.filter((o) => o.status === 'new').sort((a, b) => String(a.date).localeCompare(String(b.date)));
    if (fresh.length) items.push({ k: 'new', tone: 'warning', icon: 'inbox', title: `${fresh.length} neue ${fresh.length === 1 ? 'Bestellung wartet' : 'Bestellungen warten'} auf Zahlungsabgleich`, text: `Älteste: ${fresh[0].number} · ${fresh[0].customer} · ${rel(fresh[0].date, ctx.today)}`, acts: [['Prüfen', 'arrow-right', () => { ctx.setUi('selectedId', fresh[0].id); ctx.emit('order.open', { id: fresh[0].id }); }, true]] });
    const paid = ords.filter((o) => o.status === 'paid').sort((a, b) => String(a.date).localeCompare(String(b.date)));
    if (paid.length) items.push({ k: 'paid', tone: 'accent', icon: 'truck', title: `${paid.length} ${paid.length === 1 ? 'Bestellung' : 'Bestellungen'} zu versenden`, text: `Älteste seit ${rel(paid[0].date, ctx.today)}: ${paid[0].number} · ${paid[0].customer}`, acts: [['Versenden', 'truck', () => { ctx.setUi('selectedId', paid[0].id); ctx.emit('order.open', { id: paid[0].id }); }, true]] });
    const salesEv = (data.events || []).filter((e) => e.category === 'Sales' && !e.allDay && dayKey(e.start) === dayKey(ctx.today) && new Date(e.start) > ctx.today).sort((a, b) => String(a.start).localeCompare(String(b.start)))[0];
    if (salesEv) { const hit = chs.find((c) => c.status === 'error' && String(salesEv.title).toLowerCase().includes(c.name.toLowerCase())); items.push({ k: 'ev', tone: 'info', icon: 'calendar-clock', title: `${fmt.time(salesEv.start)} Uhr · ${salesEv.title}`, text: hit ? `Vor dem Termin ${hit.name} neu verbinden, damit die aktuellen Bestellungen vorliegen.` : 'Kontext aus dem Kalender.', acts: [] }); }
    const task = (data.tasks || []).find((t) => !t.done && t.status !== 'Erledigt' && t.due && new Date(t.due) < new Date(dayKey(ctx.today)) && /etsy|shopify|amazon|ebay|gebühr|auszahlung/i.test(t.title));
    if (task) items.push({ k: 't', tone: 'neutral', icon: 'list-checks', title: `Überfällig: ${task.title}`, text: `Fällig seit ${fmt.dateShort(task.due)}, aus deiner Aufgabenliste.`, acts: [['Erledigt', 'check', () => { setData('tasks', (all) => all.map((t) => (t.id === task.id ? { ...t, done: true, status: 'Erledigt' } : t))); ctx.emit('task.toggle', { id: task.id }); ctx.toast('Aufgabe erledigt'); }]] });
    const shown = props.limit > 0 ? items.slice(0, props.limit) : items;
    if (!chs.length) return html`<${Card} title=${props.title} icon="store"><${EmptyState} icon="store" title="Noch kein Kanal verbunden" text="Verbinde Shopify, Etsy, Amazon oder eBay, dann erscheinen hier Bestellungen und nächste Schritte." action=${html`<${Button} variant="primary" icon="plus" onClick=${() => ctx.emit('channel.connect')}>Kanal verbinden<//>`} /><//>`;
    if (!shown.length) return html`<${Card} title=${props.title} icon="check-circle-2"><${EmptyState} icon="check-circle-2" title="Nichts zu tun" text="Alle Kanäle laufen, keine Bestellung wartet." /><//>`;
    return html`<${Card} flush title=${props.title} icon="target" actions=${html`<${Badge} tone="warning">${items.length}<//>`}>${shown.map((it) => html`<div class="tk-attn"><span class="tk-attn__ico" style=${`background:color-mix(in srgb, ${toneColor(it.tone)} 16%, transparent);color:${toneColor(it.tone)}`}><${Icon} name=${it.icon} size=${18} /></span>
      <div class="tk-attn__body"><strong>${it.title}</strong><div class="tk-attn__text">${it.text}</div>${it.acts.length > 0 && html`<div class="tk-attn__acts">${it.acts.map(([label, icon, fn, primary]) => html`<${Button} size="sm" variant=${primary ? 'primary' : 'default'} icon=${icon === 'chevron-right' ? undefined : icon} iconRight=${icon === 'chevron-right' ? icon : undefined} onClick=${fn}>${label}<//>`)}</div>`}</div></div>`)}<//>`;
  },
};

export default [channelCards, channelDetail, salesAttention, ...channelCockpit, ...channelTableParts];
