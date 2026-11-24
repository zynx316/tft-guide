// Vertrieb: Reise der Bestellung (order-journey) – große Summe, senkrechter Weg durch die vier Status mit der Aktion am aktuellen Schritt, Positionen als Kacheln.
import { html } from '../../../lib/html.js';
import { Card, Badge, Button, Icon, EmptyState } from '../../ui.js';
import { rel, ORDER_STAGES as STAGES } from './shared.js';
import { money } from '../../helpers.js';
import { STEPS, sumLines, ShipForm } from './_orders.js';

const HINT = { new: 'Zahlungseingang prüfen und bestätigen.', paid: 'Paket packen, Paketdienst und Sendungsnummer eintragen.', shipped: 'Zustellung bestätigen, sobald das Paket angekommen ist.', delivered: 'Die Bestellung ist angekommen.' };
const initials = (n) => String(n || '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

export const orderJourney = {
  id: 'order-journey',
  name: 'Bestell-Reise',
  category: 'Vertrieb',
  description: 'Die gewählte Bestellung (ctx.ui.selectedId) als Reise: große Gesamtsumme mit Kanal und Kunde, ein senkrechter Weg durch Neu, Bezahlt, Versendet und Zugestellt mit Zeitpunkten und der Aktion direkt am aktuellen Schritt, Positionen als Kacheln und ein Summenband aus Waren und Versand.',
  version: '1.1',
  props: [{ name: 'showActions', label: 'Retoure und Rechnung zeigen', type: 'boolean', default: true }],
  data: [{ slot: 'orders', label: 'Bestellungen', default: 'orders', shape: '{id,number,customer,channel,channelId,status,date,lines:[{name,qty,price}],shipping,payment,email,address,carrier?,tracking?,history?}[]', required: true }],
  events: ['order.advance', 'channel.open', 'order.contact', 'order.return', 'order.invoice'],
  states: ['empty'],
  flutter: { widget: 'OrderJourney', propMap: { showActions: 'showActions' }, events: ['order.advance', 'channel.open'] },
  css: `
  .tk-ordj { display:flex; flex-direction:column; gap:var(--tk-space-4); min-width:0; }
  .tk-ordj__hero { display:flex; flex-direction:column; gap:10px; padding:var(--tk-space-5); border-radius:var(--tk-radius-xl, var(--tk-radius-lg)); border:1px solid color-mix(in srgb, var(--tj) 35%, transparent); background:color-mix(in srgb, var(--tj) 9%, var(--tk-c-surface)); }
  .tk-ordj__top { display:flex; align-items:center; gap:8px; flex-wrap:wrap; } .tk-ordj__sum { font-size:var(--tk-fs-3xl); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); font-variant-numeric:tabular-nums; line-height:1.05; overflow-wrap:anywhere; }
  .tk-ordj__who { display:flex; align-items:center; gap:10px; min-width:0; } .tk-ordj__av { flex:none; width:40px; height:40px; border-radius:50%; display:grid; place-items:center; font-weight:var(--tk-fw-bold); background:color-mix(in srgb, var(--tj) 20%, transparent); color:var(--tj); }
  .tk-ordj__steps { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; }
  .tk-ordj__step { position:relative; display:flex; flex-direction:column; gap:6px; padding:0 0 var(--tk-space-4) 64px; min-height:44px; }
  .tk-ordj__step:last-child { padding-bottom:0; } .tk-ordj__step::before { content:''; position:absolute; left:20px; top:44px; bottom:0; width:4px; border-radius:2px; background:var(--tk-c-surface3); } .tk-ordj__step:last-child::before { display:none; }
  .tk-ordj__step[data-state="done"]::before { background:var(--ts); }
  .tk-ordj__node { position:absolute; left:0; top:0; width:44px; height:44px; border-radius:50%; display:grid; place-items:center; background:var(--tk-c-surface3); color:var(--tk-c-text-subtle); }
  .tk-ordj__step[data-state="done"] .tk-ordj__node { background:var(--ts); color:var(--tk-c-text-on-accent); } .tk-ordj__step[data-state="current"] .tk-ordj__node { background:var(--tk-c-surface); color:var(--ts); box-shadow:0 0 0 3px var(--ts) inset; }
  .tk-ordj__lbl { font-size:var(--tk-fs-lg); font-weight:var(--tk-fw-semibold); line-height:1.2; min-height:44px; display:flex; flex-direction:column; justify-content:center; } .tk-ordj__step[data-state="todo"] .tk-ordj__lbl { color:var(--tk-c-text-subtle); font-weight:var(--tk-fw-medium); }
  .tk-ordj__lbl small { font-size:var(--tk-fs-sm); font-weight:var(--tk-fw-regular, 400); color:var(--tk-c-text-muted); }
  .tk-ordj__now { display:flex; flex-direction:column; gap:10px; padding:var(--tk-space-4); border-radius:var(--tk-radius-lg); background:color-mix(in srgb, var(--ts) 10%, var(--tk-c-surface)); border:1px solid color-mix(in srgb, var(--ts) 35%, transparent); }
  .tk-ordj__now .tk-btn { min-height:52px; justify-content:center; font-size:var(--tk-fs-lg); width:100%; }
  .tk-ordj__tiles { display:grid; grid-template-columns:repeat(auto-fill, minmax(min(100%, 14rem), 1fr)); gap:10px; }
  [data-tk-large-text] .tk-ordj__tiles { grid-template-columns:repeat(auto-fill, minmax(min(100%, 20em), 1fr)); } /* rem wächst nicht mit der Schrift */
  .tk-ordj__tile { display:flex; gap:12px; align-items:center; padding:12px; border-radius:var(--tk-radius-lg); border:1px solid var(--tk-c-border); background:var(--tk-c-surface); min-width:0; }
  .tk-ordj__sw { flex:none; width:48px; height:48px; border-radius:var(--tk-radius-md); display:grid; place-items:center; background:color-mix(in srgb, var(--tc) 16%, transparent); color:var(--tc); }
  .tk-ordj__tn { font-weight:var(--tk-fw-semibold); overflow-wrap:break-word; line-height:1.25; } .tk-ordj__tq { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); font-variant-numeric:tabular-nums; }
  .tk-ordj__bar { display:flex; height:14px; border-radius:var(--tk-radius-pill); overflow:hidden; gap:2px; background:var(--tk-c-surface3); } .tk-ordj__bar i { display:block; height:100%; }
  .tk-ordj__leg { display:flex; flex-wrap:wrap; gap:6px 18px; margin-top:10px; font-size:var(--tk-fs-sm); } .tk-ordj__leg span { display:inline-flex; align-items:center; gap:6px; } .tk-ordj__leg b { width:10px; height:10px; border-radius:3px; display:inline-block; }
  .tk-ordj__acts { display:flex; gap:8px; flex-wrap:wrap; } .bp-mobile .tk-ordj__acts .tk-btn { flex:1 1 40%; min-height:44px; justify-content:center; }`,
  example: { data: { orders: [{ id: 'o4', number: '#4181', customer: 'Jonas Weber', channel: 'Etsy', channelId: 'etsy', status: 'paid', date: '2026-11-23T19:20:00', email: 'jonas.weber@example.org', address: 'Venloer Straße 88, 50823 Köln', payment: 'PayPal', shipping: 4.9, lines: [{ name: 'Keramikvase Skagen', qty: 1, price: 38 }, { name: 'Duftlicht Birke', qty: 2, price: 14.5 }], history: [{ status: 'new', at: '2026-11-23T19:20:00' }, { status: 'paid', at: '2026-11-23T19:22:00' }] }] } },
  render: function OrderJourney({ props, data, setData, ctx }) {
    const all = data.orders || [], o = all.find((x) => x.id === ctx.ui.selectedId) || all[0];
    if (!o) return html`<${Card}><${EmptyState} icon="package" title="Keine Bestellung gewählt" text="Wähle eine Bestellung aus der Liste." /><//>`;
    const st = STAGES[o.status], lines = o.lines || [], sub = sumLines(o), ship = o.shipping || 0, total = Math.round((sub + ship) * 100) / 100, vat = Math.round((total / 1.19) * 0.19 * 100) / 100;
    const cur = STEPS.indexOf(o.status), at = (k) => (o.history || []).find((h) => h.status === k)?.at, tone = (k) => `var(--tk-c-${STAGES[k].tone})`;
    const advance = (extra = {}) => { setData('orders', (list) => list.map((x) => (x.id === o.id ? { ...x, ...extra, status: st.next, history: [...(x.history || []), { status: st.next, at: ctx.today.toISOString() }] } : x))); ctx.emit('order.advance', { id: o.id, from: o.status, to: st.next }); ctx.toast(`${o.number} ${st.done}`); };
    const act = () => (o.status === 'paid' ? ctx.openDialog({ title: `${o.number} versenden`, body: (close) => html`<${ShipForm} o=${o} close=${close} onSave=${(carrier, tracking) => advance({ carrier, tracking })} />` }) : advance());
    const parts = [['Waren', sub, 'var(--tk-c-accent)'], ['Versand', ship, 'var(--tk-c-info)']].filter((p) => p[1] > 0);
    const isLast = o.status === 'delivered';
    return html`<div class="tk-ordj" style=${`--tj:${tone(o.status)}`}>
      <div class="tk-ordj__hero"><div class="tk-ordj__top"><${Badge} tone=${st.tone} icon=${st.icon}>${st.label}<//>
          <button type="button" class="tk-btn tk-btn--ghost tk-btn--sm" aria-label=${`Kanal ${o.channel} öffnen`} onClick=${() => ctx.emit('channel.open', { id: o.channelId })}><${Icon} name="store" size=${14} />${o.channel}<${Icon} name="chevron-right" size=${14} /></button><span class="tk-subtle" style="margin-left:auto">${rel(o.date, ctx.today)}</span></div>
        <div class="tk-ordj__sum">${money(ctx, total)}</div>
        <div class="tk-ordj__who"><span class="tk-ordj__av" aria-hidden="true">${initials(o.customer)}</span><div style="min-width:0"><div style="font-weight:var(--tk-fw-semibold);overflow-wrap:anywhere">${o.customer}</div><div class="tk-subtle" style="font-size:var(--tk-fs-sm);overflow-wrap:anywhere">${o.number} · ${lines.reduce((s, l) => s + l.qty, 0)} Artikel · ${o.payment || 'Zahlung offen'}</div></div></div></div>
      <${Card} title="Weg der Bestellung" icon="truck"><ol class="tk-ordj__steps" aria-label="Bestellstatus">${STEPS.map((k, i) => { const state = i < cur || (i === cur && isLast) ? 'done' : i === cur ? 'current' : 'todo';
        return html`<li class="tk-ordj__step" data-state=${state} style=${`--ts:${tone(k)}`} aria-current=${state === 'current' ? 'step' : undefined}><span class="tk-ordj__node"><${Icon} name=${state === 'done' ? 'check' : STAGES[k].icon} size=${22} stroke=${state === 'done' ? 3 : 2} /></span>
          <div class="tk-ordj__lbl">${STAGES[k].label}<small>${at(k) ? rel(at(k), ctx.today) : state === 'current' ? 'jetzt' : 'folgt'}${k === 'shipped' && o.tracking ? ` · ${o.carrier || ''} ${o.tracking}` : ''}</small></div>
          ${state === 'current' && html`<div class="tk-ordj__now"><span class="tk-muted" style="font-size:var(--tk-fs-sm)">${HINT[k]}</span>${st.next && html`<${Button} variant="primary" icon=${o.status === 'paid' ? 'truck' : 'arrow-right'} onClick=${act}>${st.action}<//>`}</div>`}</li>`; })}</ol><//>
      <${Card} title="Positionen" icon="package" actions=${html`<${Badge}>${lines.length}<//>`}><div class="tk-ordj__tiles">${lines.map((l, i) => html`<div class="tk-ordj__tile" style=${`--tc:var(--tk-chart-${(i % 6) + 1})`}><span class="tk-ordj__sw" aria-hidden="true"><${Icon} name="package" size=${22} /></span>
          <div style="min-width:0;flex:1"><div class="tk-ordj__tn">${l.name}</div><div class="tk-ordj__tq">${l.qty} × ${money(ctx, l.price)}</div></div><strong class="tk-num">${money(ctx, l.qty * l.price)}</strong></div>`)}</div>
        <div style="margin-top:var(--tk-space-4)"><div class="tk-ordj__bar" role="img" aria-label=${`Waren ${money(ctx, sub)}${ship > 0 ? `, Versand ${money(ctx, ship)}` : ', Versand kostenlos'}`}>${parts.map(([, v, c]) => html`<i style=${`width:${(v / total) * 100}%;background:${c}`}></i>`)}</div>
          <div class="tk-ordj__leg">${parts.map(([l, v, c]) => html`<span><b style=${`background:${c}`}></b>${l} ${money(ctx, v)}</span>`)}${ship === 0 && html`<span>Versand kostenlos</span>`}<span class="tk-muted">darin MwSt 19 % ${money(ctx, vat)}</span></div></div><//>
      <${Card} title="Kunde" icon="user"><div style="display:flex;flex-direction:column;gap:6px;font-size:var(--tk-fs-sm)"><div style="overflow-wrap:anywhere">${o.email || '–'}</div><div style="overflow-wrap:anywhere">${o.address || '–'}</div></div>
        <div class="tk-ordj__acts" style="margin-top:12px"><${Button} size="sm" icon="mail" onClick=${() => { ctx.emit('order.contact', { id: o.id }); ctx.toast(`E-Mail an ${o.customer}`); }}>Kunde kontaktieren<//>
          ${props.showActions && html`<${Button} size="sm" icon="rotate-ccw" onClick=${() => { ctx.emit('order.return', { id: o.id }); ctx.toast('Retoure vorgemerkt – Retouren-Workflow folgt'); }}>Retoure anlegen<//><${Button} size="sm" icon="download" onClick=${() => { ctx.emit('order.invoice', { id: o.id }); ctx.toast('Rechnung als PDF exportiert'); }}>Rechnung exportieren<//>`}</div><//></div>`;
  },
};
export default [orderJourney];
