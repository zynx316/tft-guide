// Vertrieb: Bestellungen nach Status (neu → bezahlt → versendet → zugestellt)
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Badge, Icon, EmptyState, Tabs, Field, Input, Select } from '../../ui.js';
import { rel, filterItems, ORDER_STAGES } from './shared.js';
import { toList, money } from '../../helpers.js';

const STAGES = ORDER_STAGES;
const CHIPS = Object.fromEntries(Object.entries(STAGES).map(([k, s]) => [s.label.toLowerCase(), (o) => o.status === k]));

export const orderPipeline = {
  id: 'order-pipeline',
  name: 'Bestell-Pipeline',
  category: 'Vertrieb',
  description: 'Bestellungen nach Status (neu → bezahlt → versendet → zugestellt) mit Zählern, Summen und Weiterschalten per Aktion. Als Reiter-Liste oder Spalten (Desktop). Ein Tipp auf eine Bestellung öffnet einen Dialog oder – mit openIn „select“ – meldet order.open mit ID (für die Navigation zum Bestelldetail).',
  version: '1.3',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Bestellungen' },
    { name: 'stages', label: 'Angezeigte Status', type: 'list', default: ['new', 'paid', 'shipped', 'delivered'] },
    { name: 'mode', label: 'Darstellung', type: 'select', options: ['tabs', 'columns'], default: 'tabs' },
    { name: 'initial', label: 'Start-Status', type: 'text', default: '' },
    { name: 'openIn', label: 'Öffnen in', type: 'select', options: ['dialog', 'select'], default: 'dialog' },
    { name: 'respectFilter', label: 'Suche/Filter beachten', type: 'boolean', default: true },
    { name: 'quietEmpty', label: 'Ohne Bestellungen nichts anzeigen', type: 'boolean', default: false },
  ],
  data: [{ slot: 'orders', label: 'Bestellungen', default: 'orders', shape: '{id,number,customer,channel,items,total,date,status:new|paid|shipped|delivered}[]', required: true }],
  events: ['order.open', 'order.advance', 'pipeline.stage'],
  states: ['empty'],
  css: `
  [data-tk-large-text] .tk-order-pipeline__sub, [data-tk-large-text] .tk-order-pipeline__no { white-space:normal; overflow:visible; text-overflow:clip; overflow-wrap:anywhere; }
  .tk-order-pipeline__stats { display:grid; grid-template-columns:repeat(var(--n,4), minmax(0,1fr)); gap:var(--tk-space-2); margin-bottom:var(--tk-space-3); }
  .tk-order-pipeline__stat { display:flex; flex-direction:column; gap:2px; padding:10px 12px; border-radius:var(--tk-radius-md); border:1px solid var(--tk-c-border); background:var(--tk-c-surface2); cursor:pointer; text-align:left; color:inherit; min-width:0; min-height:56px; }
  .tk-order-pipeline__stat[aria-pressed="true"] { border-color:var(--tk-c-accent); background:var(--tk-c-accent-soft); }
  .tk-order-pipeline__stat span { font-size:var(--tk-fs-xs); color:var(--tk-c-text-muted); display:flex; align-items:center; gap:5px; white-space:nowrap; }
  .tk-order-pipeline__stat strong { font-size:var(--tk-fs-xl); font-weight:var(--tk-fw-bold); line-height:1.1; font-variant-numeric:tabular-nums; }
  .tk-order-pipeline__stat small { font-size:var(--tk-fs-xs); color:var(--tk-c-text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .tk-order-pipeline__cols { display:grid; gap:var(--tk-space-3); grid-template-columns:repeat(var(--n,4), minmax(0,1fr)); align-items:start; }
  .bp-tablet .tk-order-pipeline__cols { grid-template-columns:repeat(2, minmax(0,1fr)); }
  .tk-order-pipeline__colhead { display:flex; align-items:center; gap:8px; font-weight:var(--tk-fw-semibold); font-size:var(--tk-fs-sm); padding:12px 16px; border-bottom:1px solid var(--tk-c-border); }
  .tk-order-pipeline__row { display:flex; align-items:center; gap:var(--tk-space-3); padding:10px var(--tk-space-4); border-bottom:1px solid var(--tk-c-border); cursor:pointer; min-width:0; }
  .tk-order-pipeline__row:last-child { border-bottom:0; }
  .tk-order-pipeline__row:hover { background:var(--tk-c-surface2); }
  .tk-order-pipeline__row[aria-selected="true"] { background:var(--tk-c-accent-soft); }
  .tk-order-pipeline__main { flex:1; min-width:0; }
  .tk-order-pipeline__no { font-weight:var(--tk-fw-semibold); display:flex; gap:8px; align-items:center; }
  .tk-order-pipeline__sub { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); }
  .tk-order-pipeline__total { font-weight:var(--tk-fw-semibold); font-variant-numeric:tabular-nums; white-space:nowrap; }
  .tk-order-pipeline--cols .tk-order-pipeline__row { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:8px 12px; align-items:center; }
  .tk-order-pipeline--cols .tk-order-pipeline__sub { white-space:normal; overflow:visible; }
  .tk-order-pipeline--cols .tk-order-pipeline__act { grid-column:1 / -1; }
  .tk-order-pipeline--cols .tk-order-pipeline__act .tk-btn { width:100%; }
  .bp-mobile .tk-order-pipeline__row { flex-wrap:wrap; padding:12px var(--tk-space-3); }
  .bp-mobile .tk-order-pipeline__act { width:100%; }
  .bp-mobile .tk-order-pipeline__act .tk-btn { width:100%; }
  .bp-mobile .tk-order-pipeline__stats { font-size:var(--tk-fs-xs); grid-template-columns:repeat(auto-fit, minmax(max(60px, 5.4em), 1fr)); }
  .tk-order-pipeline__stat span { overflow-wrap:anywhere; }
  .bp-mobile .tk-order-pipeline__stat { padding:8px 8px; }
  .bp-mobile .tk-order-pipeline__stat small { display:none; }`,
  example: { props: { title: 'Bestellungen' }, data: { orders: [
    { id: 'o1', number: '#4182', customer: 'Anna Berger', channel: 'Shopify', items: 2, total: 64.9, date: '2026-11-24T08:52:00', status: 'new' },
    { id: 'o2', number: '#4181', customer: 'Jonas Weber', channel: 'Etsy', items: 1, total: 38, date: '2026-11-23T19:20:00', status: 'paid' },
    { id: 'o3', number: '#4176', customer: 'Lena Roth', channel: 'Amazon', items: 3, total: 112.4, date: '2026-11-22T11:05:00', status: 'shipped' },
    { id: 'o4', number: '#4170', customer: 'Tim Fuchs', channel: 'Shopify', items: 1, total: 24.5, date: '2026-11-20T14:30:00', status: 'delivered' },
  ] } },
  render: function OrderPipeline({ props, data, setData, ctx }) {
    const keys = toList(props.stages).filter((k) => STAGES[k]);
    const [active, setActive] = useState(props.initial && keys.includes(props.initial) ? props.initial : keys[0]);
    const all = (data.orders || []).filter((o) => keys.includes(o.status));
    const orders = filterItems(all, props.respectFilter ? ctx.ui : {}, ['number', 'customer', 'channel'], { ...CHIPS, ...Object.fromEntries([...new Set(all.map((o) => o.channel))].map((c) => [String(c).toLowerCase(), (o) => o.channel === c])) });
    const by = (k) => orders.filter((o) => o.status === k);
    const cur = keys.includes(active) ? active : keys[0];

    const advance = (o) => {
      const st = STAGES[o.status]; if (!st.next) return;
      setData('orders', (list) => list.map((x) => (x.id === o.id ? { ...x, status: st.next } : x)));
      ctx.emit('order.advance', { id: o.id, from: o.status, to: st.next });
      ctx.toast(`${o.number} ${st.done}`);
    };
    const open = (o) => {
      ctx.setUi('selectedId', o.id); ctx.emit('order.open', { id: o.id });
      if (props.openIn === 'select') return;
      const st = STAGES[o.status];
      ctx.openDialog({ title: `Bestellung ${o.number}`,
        body: () => html`<div class="tk-col" style="gap:10px"><div class="tk-row"><${Badge} tone=${st.tone}>${st.label}<//><span class="tk-muted">${o.channel} · ${rel(o.date, ctx.today)}</span></div>
          <dl class="tk-detail__fields" style="display:grid;grid-template-columns:minmax(90px,auto) 1fr;gap:8px 16px;margin:0;font-size:var(--tk-fs-sm)">
            <dt class="tk-subtle">Kunde</dt><dd style="margin:0">${o.customer}</dd><dt class="tk-subtle">Artikel</dt><dd style="margin:0">${o.items} ${o.items === 1 ? 'Position' : 'Positionen'}</dd>
            <dt class="tk-subtle">Summe</dt><dd style="margin:0;font-weight:600">${money(ctx, o.total)}</dd></dl></div>`,
        footer: (close) => html`<${Button} onClick=${close}>Schließen<//>${st.next && html`<${Button} variant="primary" icon="arrow-right" onClick=${() => { advance(o); close(); }}>${st.action}<//>`}`,
      });
    };
    const row = (o) => { const st = STAGES[o.status];
      return html`<div class="tk-order-pipeline__row" role="button" tabindex="0" aria-selected=${ctx.ui.selectedId === o.id ? 'true' : 'false'} onClick=${() => open(o)} onKeyDown=${(e) => e.key === 'Enter' && open(o)}>
        <div class="tk-order-pipeline__main"><div class="tk-order-pipeline__no"><span>${o.number}</span><${Badge}>${o.channel}<//></div>
          <div class="tk-order-pipeline__sub tk-truncate">${o.customer} · ${o.items} Art. · ${rel(o.date, ctx.today)}</div></div>
        <span class="tk-order-pipeline__total">${money(ctx, o.total)}</span>
        ${st.next ? html`<span class="tk-order-pipeline__act"><${Button} size="sm" icon="arrow-right" onClick=${(e) => { e.stopPropagation(); advance(o); }}>${st.action}<//></span>` : html`<span class="tk-order-pipeline__act"><${Badge} tone="success" icon="check">Abgeschlossen<//></span>`}
      </div>`; };
    const empty = (txt) => html`<${EmptyState} icon="package" title="Keine Bestellungen" text=${txt || (ctx.ui.query ? `Keine Treffer für „${ctx.ui.query}“.` : 'Sobald Bestellungen eingehen, erscheinen sie hier.')} />`;
    const sum = (k) => by(k).reduce((a, o) => a + o.total, 0);

    if (!all.length) return props.quietEmpty && !ctx.ui.query ? null : html`<${Card} title=${props.title}>${empty()}<//>`;   // quietEmpty: Startseite ohne Daten zeigt nur eine Aktion
    const stats = html`<div class="tk-order-pipeline__stats" style=${`--n:${keys.length}`}>${keys.map((k) => html`<button type="button" class="tk-order-pipeline__stat" aria-pressed=${props.mode === 'tabs' || ctx.bp === 'mobile' ? String(cur === k) : 'false'}
      onClick=${() => { setActive(k); ctx.emit('pipeline.stage', { stage: k }); }}>
      <span style=${`color:var(--tk-c-${STAGES[k].tone})`}><${Icon} name=${STAGES[k].icon} size=${14} /><span style="color:var(--tk-c-text-muted)">${STAGES[k].label}</span></span>
      <strong>${by(k).length}</strong><small>${money(ctx, sum(k))}</small></button>`)}</div>`;

    if (props.mode === 'columns' && ctx.bp !== 'mobile') {
      return html`<div class="tk-order-pipeline tk-order-pipeline--cols"><div class="tk-h3" style="margin-bottom:10px">${props.title}</div>
        <div class="tk-order-pipeline__cols" style=${`--n:${keys.length}`}>${keys.map((k) => html`<${Card} flush><div class="tk-order-pipeline__colhead"><span style=${`color:var(--tk-c-${STAGES[k].tone})`}><${Icon} name=${STAGES[k].icon} size=${16} /></span><span class="tk-grow">${STAGES[k].label}</span><${Badge}>${by(k).length}<//></div>
          ${by(k).length ? by(k).map(row) : html`<div class="tk-subtle" style="padding:20px 16px;font-size:var(--tk-fs-sm)">Keine Bestellungen</div>`}<//>`)}</div></div>`;
    }
    const list = by(cur);
    return html`<${Card} title=${props.title} actions=${html`<${Badge}>${orders.length}<//>`}>
      ${stats}
      <div style="margin:0 calc(var(--tk-space-4) * -1) calc(var(--tk-space-4) * -1);border-top:1px solid var(--tk-c-border)">${list.length ? list.map(row) : empty(ctx.ui.query ? null : `Keine Bestellungen im Status „${STAGES[cur].label}“.`)}</div>
    <//>`;
  },
};


// ------------------------------------------------------------------------------------------------ Bestelldetail ---
const STEPS = ['new', 'paid', 'shipped', 'delivered'];
const CARRIERS = ['DHL', 'DPD', 'Hermes'];
const sumLines = (o) => Math.round(((o.lines || []).reduce((s, l) => s + l.qty * l.price, 0)) * 100) / 100;

function ShipForm({ o, onSave, close }) {
  const [carrier, setCarrier] = useState(o.carrier || 'DHL'); const [track, setTrack] = useState(o.tracking || `0034043412${String(o.number).replace(/\D/g, '')}`);
  return html`<div class="tk-col" style="gap:12px"><${Field} label="Paketdienst"><${Select} value=${carrier} options=${CARRIERS} onChange=${setCarrier} /><//><${Field} label="Sendungsnummer" error=${track.trim() ? '' : 'Sendungsnummer fehlt.'}><${Input} value=${track} onInput=${setTrack} invalid=${!track.trim()} /><//>
    <div class="tk-row" style="justify-content:flex-end"><${Button} onClick=${close}>Abbrechen<//><${Button} variant="primary" icon="truck" disabled=${!track.trim()} onClick=${() => { onSave(carrier, track.trim()); close(); }}>Als versendet markieren<//></div></div>`;
}

const orderDetail = {
  id: 'order-detail',
  name: 'Bestelldetail',
  category: 'Vertrieb',
  description: 'Die gewählte Bestellung (ctx.ui.selectedId) im Detail: Status-Verlauf mit Zeitpunkten, nächster Schritt (Bezahlt markieren, Versenden mit Paketdienst und Sendungsnummer, Zugestellt), Kunde, Positionen mit Summen und enthaltener MwSt, Zahlung und Versand. Layout „focus“ zeigt nur den nächsten Schritt.',
  version: '1.0',
  props: [
    { name: 'layout', label: 'Layout', type: 'select', options: ['full', 'focus'], default: 'full' },
  ],
  data: [{ slot: 'orders', label: 'Bestellungen', default: 'orders', shape: '{id,number,customer,channel,channelId,status,date,lines:[{name,qty,price}],shipping,payment,email,address,carrier?,tracking?,history?}[]', required: true }],
  events: ['order.advance', 'channel.open', 'order.return', 'order.contact', 'order.invoice'],
  states: ['empty'],
  css: `
  .tk-ord { display:flex; flex-direction:column; gap:var(--tk-space-4); min-width:0; }
  .tk-ord__head { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
  .tk-ord__no { font-size:var(--tk-fs-2xl); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); }
  .tk-ord__steps { display:grid; grid-template-columns:repeat(4, minmax(0,1fr)); gap:6px; list-style:none; margin:0; padding:0; }
  .tk-ord__step { display:flex; flex-direction:column; align-items:center; gap:4px; text-align:center; font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); position:relative; padding-top:2px; }
  .tk-ord__step i { width:34px; height:34px; border-radius:50%; display:grid; place-items:center; background:var(--tk-c-surface3); color:var(--tk-c-text-subtle); font-style:normal; }
  .tk-ord__step[data-state="done"] i { background:var(--tk-c-success-soft); color:var(--tk-c-success); }
  .tk-ord__step[data-state="current"] i { background:var(--tk-c-accent); color:var(--tk-c-on-accent, var(--tk-c-bg)); }
  .tk-ord__step[data-state="done"], .tk-ord__step[data-state="current"] { color:var(--tk-c-text); font-weight:var(--tk-fw-medium); }
  .tk-ord__step small { font-size:11px; color:var(--tk-c-text-muted); font-weight:400; min-height:14px; }
  .tk-ord__next { display:flex; align-items:center; gap:12px; padding:var(--tk-space-4); border-radius:var(--tk-radius-lg); background:var(--tk-c-accent-soft); flex-wrap:wrap; }
  .tk-ord__next--big { flex-direction:column; align-items:stretch; padding:var(--tk-space-5); gap:14px; } .tk-ord__next--big .tk-btn { min-height:52px; justify-content:center; font-size:var(--tk-fs-lg); }
  .tk-ord__cols { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:var(--tk-space-4); }
  .bp-mobile .tk-ord__cols, .bp-tablet .tk-ord__cols { grid-template-columns:minmax(0,1fr); }
  .tk-ord__kv { display:grid; grid-template-columns:minmax(90px, auto) 1fr; gap:8px 16px; margin:0; font-size:var(--tk-fs-sm); }
  .tk-ord__kv dt { color:var(--tk-c-text-subtle); } .tk-ord__kv dd { margin:0; min-width:0; overflow-wrap:anywhere; }
  .tk-ord__line { display:grid; grid-template-columns:minmax(0,1fr) auto auto; gap:12px; padding:10px var(--tk-space-4); border-bottom:1px solid var(--tk-c-border); font-size:var(--tk-fs-sm); align-items:baseline; }
  .tk-ord__line .tk-num { text-align:right; }
  .tk-ord__sum { display:flex; justify-content:space-between; padding:6px var(--tk-space-4); font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); }
  .tk-ord__sum--total { color:var(--tk-c-text); font-weight:var(--tk-fw-bold); font-size:var(--tk-fs-lg); border-top:1px solid var(--tk-c-border); padding-top:10px; padding-bottom:12px; }
  .tk-ord__acts { display:flex; gap:8px; flex-wrap:wrap; } .bp-mobile .tk-ord__acts .tk-btn { flex:1 1 40%; min-height:44px; justify-content:center; }`,
  example: { data: { orders: [{ id: 'o4', number: '#4181', customer: 'Jonas Weber', channel: 'Etsy', channelId: 'etsy', status: 'paid', date: '2026-11-23T19:20:00', email: 'jonas.weber@example.org', address: 'Venloer Straße 88, 50823 Köln', payment: 'PayPal', shipping: 4.9, lines: [{ name: 'Keramikvase Skagen', qty: 1, price: 38 }], history: [{ status: 'new', at: '2026-11-23T19:20:00' }, { status: 'paid', at: '2026-11-23T19:22:00' }] }] } },
  render: ({ props, data, setData, ctx }) => {
    const all = data.orders || []; const o = all.find((x) => x.id === ctx.ui.selectedId) || all[0];
    if (!o) return html`<${Card}><${EmptyState} icon="package" title="Keine Bestellung gewählt" text="Wähle eine Bestellung aus der Liste." /><//>`;
    const st = STAGES[o.status]; const sub = sumLines(o); const total = Math.round((sub + (o.shipping || 0)) * 100) / 100; const vat = Math.round((total / 1.19) * 0.19 * 100) / 100;
    const at = (k) => (o.history || []).find((h) => h.status === k)?.at;
    const advance = (extra = {}) => { setData('orders', (list) => list.map((x) => (x.id === o.id ? { ...x, ...extra, status: st.next, history: [...(x.history || []), { status: st.next, at: ctx.today.toISOString() }] } : x))); ctx.emit('order.advance', { id: o.id, from: o.status, to: st.next }); ctx.toast(`${o.number} ${st.done}`); };
    const act = () => (o.status === 'paid' ? ctx.openDialog({ title: `${o.number} versenden`, body: (close) => html`<${ShipForm} o=${o} close=${close} onSave=${(carrier, tracking) => advance({ carrier, tracking })} />` }) : advance());
    const cur = STEPS.indexOf(o.status);
    const stepper = html`<ol class="tk-ord__steps" aria-label="Bestellstatus">${STEPS.map((k, i) => html`<li class="tk-ord__step" data-state=${i < cur || (i === cur && k === 'delivered') ? 'done' : i === cur ? 'current' : 'todo'}><i><${Icon} name=${i < cur || (i === cur && k === 'delivered') ? 'check' : STAGES[k].icon} size=${16} /></i>${STAGES[k].label}<small>${at(k) ? rel(at(k), ctx.today) : ''}</small></li>`)}</ol>`;
    const nextBox = (big) => html`<div class=${`tk-ord__next ${big ? 'tk-ord__next--big' : ''}`}>${st.next ? html`<div class="tk-grow"><div style="font-weight:var(--tk-fw-semibold)">Nächster Schritt</div><div class="tk-muted" style="font-size:var(--tk-fs-sm)">${o.status === 'new' ? 'Zahlungseingang prüfen und bestätigen.' : o.status === 'paid' ? 'Paket packen, Paketdienst und Sendungsnummer eintragen.' : 'Zustellung bestätigen, sobald das Paket angekommen ist.'}</div></div>
      <${Button} variant="primary" icon=${o.status === 'paid' ? 'truck' : 'arrow-right'} onClick=${act}>${st.action}<//>` : html`<${Icon} name="check-circle-2" size=${20} /><div class="tk-grow"><strong>Abgeschlossen</strong><div class="tk-muted" style="font-size:var(--tk-fs-sm)">Die Bestellung wurde zugestellt.</div></div>`}</div>`;
    const head = html`<div class="tk-ord__head"><span class="tk-ord__no">${o.number}</span><${Badge} tone=${st.tone} icon=${st.icon}>${st.label}<//>
      <button type="button" class="tk-btn tk-btn--ghost tk-btn--sm" onClick=${() => ctx.emit('channel.open', { id: o.channelId })}><${Icon} name="store" size=${14} />${o.channel}<${Icon} name="chevron-right" size=${14} /></button><span class="tk-subtle" style="margin-left:auto">${rel(o.date, ctx.today)}</span></div>`;
    const customer = html`<${Card} title="Kunde" icon="user"><dl class="tk-ord__kv"><dt>Name</dt><dd>${o.customer}</dd><dt>E-Mail</dt><dd>${o.email || '–'}</dd><dt>Lieferadresse</dt><dd>${o.address || '–'}</dd></dl>
      <div style="margin-top:12px"><${Button} size="sm" icon="mail" onClick=${() => { ctx.emit('order.contact', { id: o.id }); ctx.toast(`E-Mail an ${o.customer}`); }}>Kunde kontaktieren<//></div><//>`;
    if (props.layout === 'focus') return html`<div class="tk-ord">${head}${stepper}${nextBox(true)}${customer}
      <${Card} title="Summe" icon="banknote"><div class="tk-ord__sum tk-ord__sum--total" style="border:0;padding:0"><span>Gesamt</span><span class="tk-num">${money(ctx, total)}</span></div><div class="tk-subtle" style="font-size:var(--tk-fs-xs);margin-top:4px">${(o.lines || []).reduce((s, l) => s + l.qty, 0)} Artikel · ${o.payment}</div><//></div>`;
    const ship = html`<${Card} title="Zahlung und Versand" icon="truck"><dl class="tk-ord__kv"><dt>Zahlung</dt><dd>${o.payment || '–'}${at('paid') ? ` · bezahlt ${rel(at('paid'), ctx.today)}` : ' · noch nicht bezahlt'}</dd><dt>Paketdienst</dt><dd>${o.carrier || 'noch nicht gewählt'}</dd>
      <dt>Sendungsnr.</dt><dd>${o.tracking ? html`<span class="tk-num">${o.tracking}</span>` : '–'}</dd></dl>${o.tracking && html`<div style="margin-top:12px"><${Button} size="sm" icon="external-link" onClick=${() => ctx.toast(`Sendung ${o.tracking} verfolgen`)}>Sendung verfolgen<//></div>`}<//>`;
    return html`<div class="tk-ord">${head}${stepper}${nextBox(false)}
      <${Card} flush title="Positionen" icon="package" actions=${html`<${Badge}>${(o.lines || []).length}<//>`}>${(o.lines || []).map((l) => html`<div class="tk-ord__line"><span>${l.name}</span><span class="tk-subtle tk-num">${l.qty} × ${money(ctx, l.price)}</span><span class="tk-num" style="font-weight:var(--tk-fw-medium)">${money(ctx, l.qty * l.price)}</span></div>`)}
        <div class="tk-ord__sum" style="padding-top:10px"><span>Zwischensumme</span><span class="tk-num">${money(ctx, sub)}</span></div><div class="tk-ord__sum"><span>Versand</span><span class="tk-num">${money(ctx, o.shipping || 0)}</span></div>
        <div class="tk-ord__sum"><span>darin MwSt 19 %</span><span class="tk-num">${money(ctx, vat)}</span></div><div class="tk-ord__sum tk-ord__sum--total"><span>Gesamt</span><span class="tk-num">${money(ctx, total)}</span></div><//>
      <div class="tk-ord__cols">${customer}${ship}</div>
      <div class="tk-ord__acts"><${Button} icon="rotate-ccw" onClick=${() => { ctx.emit('order.return', { id: o.id }); ctx.toast('Retoure vorgemerkt – Retouren-Workflow folgt'); }}>Retoure anlegen<//><${Button} icon="download" onClick=${() => { ctx.emit('order.invoice', { id: o.id }); ctx.toast('Rechnung als PDF exportiert'); }}>Rechnung exportieren<//></div></div>`;
  },
};

export default [orderPipeline, orderDetail];
