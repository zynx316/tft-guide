// Vertrieb: Kanal-Cockpit (channel-cockpit) – großer Kopf mit Umsatzverlauf und der einen Aktion, Anteil als Ring, Kanalvergleich als Bänder, Sync-Rhythmus als Punktleiste, letzte Bestellungen als Karten.
import { html } from '../../../lib/html.js';
import { useState, useRef, useEffect } from 'preact/hooks';
import { Card, Badge, Button, Icon, EmptyState, Ring, toneColor } from '../../ui.js';
import { money, percent } from '../../helpers.js';
import { fmt } from '../../../lib/util.js';
import { rel, patchChannel, reconnectDialog, ORDER_STAGES } from './shared.js';

const STATUS = { connected: { label: 'Verbunden', tone: 'success', icon: 'check-circle-2', head: 'Alles in Ordnung' }, error: { label: 'Fehler', tone: 'danger', icon: 'alert-triangle', head: 'Verbindung unterbrochen' }, paused: { label: 'Pausiert', tone: 'warning', icon: 'circle-pause', head: 'Kanal pausiert' } };

function Area({ values, w, h = 120, color, id }) {
  const lo = Math.min(...values), hi = Math.max(...values), span = hi - lo || 1, pad = 8;
  const pts = values.map((v, i) => [pad + (i / Math.max(1, values.length - 1)) * (w - pad * 2), pad + (h - pad * 2) * (1 - (v - lo) / span)]);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' '), last = pts[pts.length - 1];
  return html`<svg width=${w} height=${h} viewBox=${`0 0 ${w} ${h}`} role="img" aria-label=${`Umsatzverlauf der letzten ${values.length} Wochen, ${values[values.length - 1] >= values[0] ? 'steigend' : 'fallend'}`} style="display:block;max-width:100%">
    <defs><linearGradient id=${`tk-chc-${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color=${color} stop-opacity=".35" /><stop offset="1" stop-color=${color} stop-opacity="0" /></linearGradient></defs>
    <path d=${`${d} L${last[0]},${h} L${pts[0][0]},${h} Z`} fill=${`url(#tk-chc-${id})`} /><path d=${d} fill="none" stroke=${color} stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
    <circle cx=${last[0]} cy=${last[1]} r="5" fill=${color} stroke="var(--tk-c-surface)" stroke-width="2" /></svg>`;
}

export const channelCockpit = {
  id: 'channel-cockpit',
  name: 'Kanal-Cockpit',
  category: 'Vertrieb',
  description: 'Der gewählte Kanal (ctx.ui.selectedId) visuell: großer Kopf mit 30-Tage-Umsatz, Veränderung und Verlaufsfläche, die eine passende Aktion (Synchronisieren, Neu verbinden, Fortsetzen), Umsatzanteil als Ring, Vergleich aller Kanäle als Bänder (Antippen wechselt den Kanal), Sync-Rhythmus als Punktleiste und letzte Bestellungen als wischbare Karten.',
  version: '1.0',
  props: [{ name: 'showCompare', label: 'Kanalvergleich zeigen', type: 'boolean', default: true }],
  data: [
    { slot: 'channels', label: 'Kanäle', default: 'channels', shape: '{id,name,status,lastSync,revenue,orders,delta?,pending?,error?,needsAuth?,url?,trend?,log?}[]', required: true },
    { slot: 'orders', label: 'Bestellungen', default: 'orders', shape: '{id,number,customer,channelId,total,status,date}[]', required: false },
  ],
  events: ['channel.sync', 'channel.reconnect', 'channel.resume', 'channel.switch', 'order.open'],
  states: ['empty'],
  flutter: { widget: 'ChannelCockpit', propMap: { showCompare: 'showCompare' }, events: ['channel.sync', 'order.open'] },
  css: `
  .tk-chc { display:flex; flex-direction:column; gap:var(--tk-space-4); min-width:0; }
  .tk-chc__hero { display:flex; flex-direction:column; gap:var(--tk-space-3); padding:var(--tk-space-5); border-radius:var(--tk-radius-xl, var(--tk-radius-lg)); border:1px solid color-mix(in srgb, var(--tc) 35%, transparent); background:color-mix(in srgb, var(--tc) 8%, var(--tk-c-surface)); overflow:hidden; }
  .tk-chc__top { display:flex; align-items:center; gap:var(--tk-space-3); min-width:0; flex-wrap:wrap; } .tk-chc__logo { flex:none; width:60px; height:60px; border-radius:18px; display:grid; place-items:center; background:color-mix(in srgb, var(--tc) 18%, transparent); color:var(--tc); }
  .tk-chc__name { font-size:var(--tk-fs-xl); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); overflow-wrap:anywhere; } .tk-chc__big { font-size:var(--tk-fs-3xl); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); font-variant-numeric:tabular-nums; line-height:1.05; overflow-wrap:anywhere; }
  .tk-chc__state { display:flex; align-items:flex-start; gap:10px; padding:10px 12px; border-radius:var(--tk-radius-md); background:var(--tk-c-surface); border:1px solid var(--tk-c-border); font-size:var(--tk-fs-sm); }
  .tk-chc__state[data-tone="danger"] { background:var(--tk-c-danger-soft); border-color:color-mix(in srgb, var(--tk-c-danger) 40%, transparent); } .tk-chc__state[data-tone="warning"] { background:var(--tk-c-warning-soft); }
  .tk-chc__hero .tk-btn { min-height:52px; justify-content:center; font-size:var(--tk-fs-lg); width:100%; height:auto; white-space:normal; }
  .tk-chc__trio { display:grid; grid-template-columns:auto repeat(2, minmax(0, 1fr)); gap:var(--tk-space-4); align-items:center; } .bp-mobile .tk-chc__trio { grid-template-columns:auto minmax(0, 1fr); } .bp-mobile .tk-chc__trio > .tk-chc__stat:last-child { grid-column:1 / -1; }
  .tk-chc__stat span { display:block; font-size:var(--tk-fs-xs); color:var(--tk-c-text-muted); } .tk-chc__stat strong { font-size:var(--tk-fs-2xl); font-weight:var(--tk-fw-bold); font-variant-numeric:tabular-nums; letter-spacing:var(--tk-ls-tight); overflow-wrap:anywhere; }
  .tk-chc__cmp { display:flex; flex-direction:column; gap:6px; } .tk-chc__bandbtn { display:grid; grid-template-columns:minmax(5.5rem, 28%) minmax(0, 1fr) auto; gap:10px; align-items:center; width:100%; min-height:44px; padding:0 4px; border:0; border-radius:var(--tk-radius-md); background:transparent; color:inherit; font:inherit; text-align:left; cursor:pointer; }
  .tk-chc__bandbtn[aria-pressed="true"] { background:color-mix(in srgb, var(--tc) 10%, transparent); font-weight:var(--tk-fw-semibold); } .tk-chc__bandbtn:focus-visible { outline:2px solid var(--tk-c-focus); }
  .tk-chc__track { height:14px; border-radius:var(--tk-radius-pill); background:var(--tk-c-surface3); overflow:hidden; } .tk-chc__track i { display:block; height:100%; border-radius:var(--tk-radius-pill); background:var(--tc); }
  .tk-chc__dots { display:flex; gap:8px; align-items:center; flex-wrap:wrap; } .tk-chc__dot { width:44px; height:44px; border-radius:50%; border:0; display:grid; place-items:center; background:color-mix(in srgb, var(--td) 18%, transparent); color:var(--td); cursor:pointer; } .tk-chc__dot[aria-pressed="true"] { box-shadow:0 0 0 3px var(--td) inset; } .tk-chc__dot:focus-visible { outline:2px solid var(--tk-c-focus); outline-offset:2px; }
  .tk-chc__orders { display:flex; gap:10px; overflow-x:auto; scroll-snap-type:x proximity; padding:2px 2px 8px; margin:0 -2px; } .tk-chc__oc { flex:0 0 min(70%, 12.5rem); scroll-snap-align:start; display:flex; flex-direction:column; gap:6px; padding:12px; min-height:44px; border-radius:var(--tk-radius-lg); border:1px solid var(--tk-c-border); background:var(--tk-c-surface); color:inherit; font:inherit; text-align:left; cursor:pointer; min-width:0; }
  .tk-chc__oc:focus-visible { outline:2px solid var(--tk-c-focus); } .tk-chc__oc strong { font-size:var(--tk-fs-lg); font-variant-numeric:tabular-nums; } .tk-chc__oc span { overflow-wrap:anywhere; }
  .tk-spin-btn .icon { animation:tk-spin .9s linear infinite; }
  [data-tk-large-text] .tk-chc__bandbtn { grid-template-columns:minmax(0, 1fr); gap:4px; padding:6px 4px; } [data-tk-large-text] .tk-chc__trio { grid-template-columns:minmax(0, 1fr); }`,
  example: { data: { orders: [{ id: 'o1', number: '#4185', customer: 'Anna Berger', channelId: 'shopify', total: 64.9, status: 'new', date: '2026-11-24T09:12:00' }], channels: [
    { id: 'shopify', name: 'Shopify', icon: 'shopping-cart', status: 'connected', lastSync: '2026-11-24T09:18:00', revenue: 6240.5, orders: 78, delta: 8.2, pending: 3, url: 'nordlicht-studio.myshopify.com', trend: [5200, 5400, 5800, 5700, 6100, 6240], log: [{ at: '2026-11-24T09:18:00', text: '3 neue Bestellungen importiert', tone: 'success' }] },
    { id: 'etsy', name: 'Etsy', icon: 'store', status: 'error', lastSync: '2026-11-23T21:40:00', revenue: 1980, orders: 31, delta: -4.1, error: 'Zugriffstoken abgelaufen', needsAuth: true, trend: [2300, 2250, 2100, 2050, 2000, 1980], log: [] }] } },
  render: function ChannelCockpit({ props, data, setData, ctx }) {
    const [busy, setBusy] = useState(false), [dot, setDot] = useState(0), alive = useRef(true);
    useEffect(() => () => { alive.current = false; }, []);
    const list = data.channels || [], ch = list.find((c) => c.id === ctx.ui.selectedId) || list[0];
    if (!ch) return html`<${Card}><${EmptyState} icon="store" title="Kein Kanal gewählt" text="Verbinde einen Kanal, um Bestellungen und Umsatz zu sehen." /><//>`;
    const idx = Math.max(0, list.indexOf(ch)), col = `var(--tk-chart-${(idx % 6) + 1})`, st = STATUS[ch.status] || STATUS.paused;
    const orders = (data.orders || []).filter((o) => o.channelId === ch.id).sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 6);
    const totalRev = list.reduce((s, c) => s + (c.revenue || 0), 0), share = totalRev ? ch.revenue / totalRev : 0, aov = ch.orders ? ch.revenue / ch.orders : 0, maxRev = Math.max(1, ...list.map((c) => c.revenue || 0));
    const log = (ch.log || []).slice(0, 8), cur = log[Math.min(dot, log.length - 1)], w = Math.max(220, Math.min(720, (ctx.blockWidth || 340) - 48));
    const sync = () => { if (busy) return; setBusy(true); ctx.emit('channel.sync', { id: ch.id }); setTimeout(() => { if (!alive.current) return; setBusy(false); const add = ch.pending || 0; patchChannel(setData, ch.id, { lastSync: ctx.today.toISOString(), orders: ch.orders + add, pending: 0 }); ctx.toast(add ? `${ch.name} synchronisiert · ${add} neue ${add === 1 ? 'Bestellung' : 'Bestellungen'}` : `${ch.name} ist aktuell`); }, 1100); };
    const resume = () => { patchChannel(setData, ch.id, { status: 'connected' }); ctx.emit('channel.resume', { id: ch.id }); ctx.toast(`${ch.name} fortgesetzt`); };
    const action = ch.status === 'error' && ch.needsAuth ? html`<${Button} variant="primary" icon="link-2" onClick=${() => reconnectDialog(ctx, setData, ch)}>Neu verbinden<//>`
      : ch.status === 'paused' ? html`<${Button} variant="primary" icon="play" onClick=${resume}>Fortsetzen<//>`
      : html`<${Button} variant="primary" icon=${busy ? 'loader-2' : 'refresh-cw'} disabled=${busy} class=${busy ? 'tk-spin-btn' : ''} onClick=${sync}>${busy ? 'Synchronisiere …' : 'Jetzt synchronisieren'}<//>`;
    const why = ch.status === 'error' ? (ch.error || 'Bestellungen werden nicht importiert.') : ch.status === 'paused' ? `Letzter Sync ${rel(ch.lastSync, ctx.today)}. Es werden keine Bestellungen importiert.` : `Letzter Sync ${rel(ch.lastSync, ctx.today)}${ch.pending ? ` · ${ch.pending} neue noch nicht importiert` : ''}`;
    const dtone = (l) => (l.tone === 'danger' ? 'danger' : l.tone === 'success' ? 'success' : 'info');
    return html`<div class="tk-chc" style=${`--tc:${col}`}>
      <div class="tk-chc__hero"><div class="tk-chc__top"><span class="tk-chc__logo"><${Icon} name=${ch.icon || 'store'} size=${30} /></span><div class="tk-grow" style="min-width:0"><div class="tk-chc__name">${ch.name}</div>${ch.url && html`<div class="tk-subtle" style="font-size:var(--tk-fs-sm);overflow-wrap:anywhere">${ch.url}</div>`}</div><${Badge} tone=${st.tone} dot=${true}>${st.label}<//></div>
        <div><div class="tk-subtle" style="font-size:var(--tk-fs-sm)">Umsatz 30 Tage</div><div style="display:flex;align-items:baseline;gap:12px;flex-wrap:wrap"><span class="tk-chc__big">${money(ctx, ch.revenue, { digits: 0 })}</span><span style=${`font-weight:var(--tk-fw-semibold);color:var(--tk-c-${(ch.delta || 0) >= 0 ? 'success' : 'danger'})`}>${percent(ctx, (ch.delta || 0) / 100, { sign: true })}</span></div></div>
        ${ch.trend && ch.trend.length > 1 && html`<div><${Area} values=${ch.trend} w=${w} color=${col} id=${ch.id} /><div class="tk-subtle" style="display:flex;justify-content:space-between;font-size:var(--tk-fs-xs)"><span>vor ${ch.trend.length} Wochen</span><span>jetzt</span></div></div>`}
        <div class="tk-chc__state" data-tone=${st.tone} role="status"><span style=${`color:var(--tk-c-${st.tone});display:inline-flex`}><${Icon} name=${st.icon} size=${20} /></span><div><strong>${st.head}</strong><div class="tk-muted">${why}</div></div></div>${action}</div>
      <${Card}><div class="tk-chc__trio"><div style="text-align:center"><${Ring} value=${share} max=${1} size=${96} stroke=${12} label=${`Umsatzanteil ${percent(ctx, share, { sign: false })}`}><strong style="font-size:var(--tk-fs-lg)">${percent(ctx, share, { digits: 0, sign: false })}</strong><//><div class="tk-subtle" style="font-size:var(--tk-fs-xs);margin-top:4px">Umsatzanteil</div></div>
        <div class="tk-chc__stat"><span>Bestellungen</span><strong>${fmt.number(ch.orders)}</strong></div><div class="tk-chc__stat"><span>Ø Warenkorb</span><strong>${money(ctx, aov)}</strong></div></div><//>
      ${props.showCompare && list.length > 1 && html`<${Card} title="Kanäle im Vergleich" icon="bar-chart-3"><div class="tk-chc__cmp" role="group" aria-label="Kanal wechseln">${[...list].sort((a, b) => b.revenue - a.revenue).map((c) => html`<button type="button" class="tk-chc__bandbtn" style=${`--tc:var(--tk-chart-${(list.indexOf(c) % 6) + 1})`} aria-pressed=${c.id === ch.id ? 'true' : 'false'} onClick=${() => { setDot(0); ctx.setUi('selectedId', c.id); ctx.emit('channel.switch', { id: c.id }); }}><span class="tk-truncate">${c.name}</span><span class="tk-chc__track"><i style=${`width:${Math.max(2, (c.revenue / maxRev) * 100)}%`}></i></span><span class="tk-num">${money(ctx, c.revenue, { digits: 0 })}</span></button>`)}</div><//>`}
      ${log.length > 0 && html`<${Card} title="Sync-Rhythmus" icon="history"><div class="tk-chc__dots" role="group" aria-label="Letzte Läufe">${log.map((l, i) => html`<button type="button" class="tk-chc__dot" style=${`--td:${toneColor(dtone(l))}`} aria-pressed=${i === dot ? 'true' : 'false'} aria-label=${`${l.text}, ${rel(l.at, ctx.today)}`} onClick=${() => setDot(i)}><${Icon} name=${l.tone === 'danger' ? 'alert-triangle' : l.tone === 'success' ? 'download' : 'refresh-cw'} size=${18} /></button>`)}</div>
        <div style="margin-top:10px" aria-live="polite"><strong>${cur.text}</strong><div class="tk-subtle" style="font-size:var(--tk-fs-sm)">${rel(cur.at, ctx.today)}</div></div><//>`}
      <div><div class="tk-h3" style="margin-bottom:8px">Letzte Bestellungen</div>${orders.length ? html`<div class="tk-chc__orders">${orders.map((o) => html`<button type="button" class="tk-chc__oc" aria-label=${`Bestellung ${o.number} von ${o.customer} öffnen`} onClick=${() => { ctx.setUi('selectedId', o.id); ctx.emit('order.open', { id: o.id }); }}><span class="tk-subtle">${o.number} · ${rel(o.date, ctx.today)}</span><strong>${money(ctx, o.total)}</strong><span>${o.customer}</span><${Badge} tone=${ORDER_STAGES[o.status]?.tone || 'neutral'}>${ORDER_STAGES[o.status]?.label || o.status}<//></button>`)}</div>`
        : html`<${EmptyState} icon="package" title="Keine Bestellungen" text="Sobald der Kanal Bestellungen liefert, erscheinen sie hier." />`}</div></div>`;
  },
};
export default [channelCockpit];
