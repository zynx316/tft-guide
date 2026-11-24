// Trading: Order erfassen – ausdrücklich SIMULATION (keine echte Ausführung)
import { html } from '../../../lib/html.js';
import { useState, useEffect } from 'preact/hooks';
import { Card, Button, Badge, Field, Input, Select, Segmented, Icon } from '../../ui.js';
import { fmt } from '../../../lib/util.js';
import { nextId } from '../../helpers.js';

const FEE = 1;
const num = (s) => parseFloat(String(s).replace(',', '.'));

export const orderTicket = {
  id: 'order-ticket',
  name: 'Order-Ticket (Simulation)',
  category: 'Trading',
  description: 'Kauf/Verkauf erfassen mit Stückzahl, Markt-/Limit-Order, Validierung (Guthaben, Bestand) und Bestätigungsdialog. Immer als Simulation gekennzeichnet; neue Order landet in der Orderliste.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Order erfassen' },
    { name: 'cash', label: 'Verfügbares Guthaben (€)', type: 'number', default: 5000 },
    { name: 'defaultSide', label: 'Start-Richtung', type: 'select', options: ['buy', 'sell'], default: 'buy' },
    { name: 'followSelection', label: 'Auswahl der Liste folgen', type: 'boolean', default: true },
  ],
  data: [
    { slot: 'instruments', label: 'Wertpapiere', default: 'instruments', shape: '{id,symbol,name,price}[]', required: true },
    { slot: 'positions', label: 'Bestand (für Verkauf)', default: 'positions', shape: '{id,qty}[]', required: false },
    { slot: 'target', label: 'Orderliste (Ziel)', default: 'orders', shape: 'Array neuer Orders', required: false },
  ],
  events: ['order.review', 'order.confirm', 'order.invalid', 'order.cancel'],
  states: ['empty'],
  css: `
  .tk-order-ticket { display:flex; flex-direction:column; gap:var(--tk-space-4); }
  .tk-order-ticket__sim { display:flex; gap:10px; align-items:flex-start; padding:10px 12px; border-radius:var(--tk-radius-md); background:var(--tk-c-info-soft); color:var(--tk-c-info); font-size:var(--tk-fs-sm); }
  .tk-order-ticket__sim span { color:var(--tk-c-text-muted); }
  .tk-order-ticket__sides { display:grid; grid-template-columns:1fr 1fr; gap:var(--tk-space-2); }
  .tk-order-ticket__side { height:44px; border-radius:var(--tk-radius-md); border:1px solid var(--tk-c-border-strong); background:var(--tk-c-surface2); color:var(--tk-c-text-muted); font-weight:var(--tk-fw-semibold); cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; }
  .tk-order-ticket__side[aria-pressed="true"][data-side="buy"] { background:var(--tk-c-success-soft); color:var(--tk-c-success); border-color:var(--tk-c-success); }
  .tk-order-ticket__side[aria-pressed="true"][data-side="sell"] { background:var(--tk-c-danger-soft); color:var(--tk-c-danger); border-color:var(--tk-c-danger); }
  .tk-order-ticket__grid { display:grid; grid-template-columns:1fr 1fr; gap:var(--tk-space-3); }
  .bp-mobile .tk-order-ticket__grid { grid-template-columns:minmax(0,1fr); }
  .tk-order-ticket__sum { border-radius:var(--tk-radius-md); border:1px solid var(--tk-c-border); background:var(--tk-c-surface2); padding:12px 14px; display:grid; gap:6px; font-size:var(--tk-fs-sm); font-variant-numeric:tabular-nums; }
  .tk-order-ticket__sum div { display:flex; justify-content:space-between; gap:12px; }
  .tk-order-ticket__sum div:last-child { font-weight:var(--tk-fw-bold); font-size:var(--tk-fs-md); padding-top:6px; border-top:1px solid var(--tk-c-border); }`,
  example: { props: { cash: 5000 }, data: {
    instruments: [{ id: 'msci', symbol: 'MSCW', name: 'MSCI World ETF', price: 98.42 }, { id: 'sap', symbol: 'SAPX', name: 'Softwarehaus AG', price: 164.2 }],
    positions: [{ id: 'msci', qty: 42 }], target: [] } },
  render: function OrderTicket({ props, data, setData, ctx }) {
    const insts = data.instruments || [];
    const [sym, setSym] = useState(insts[0]?.id || '');
    const [side, setSide] = useState(props.defaultSide);
    const [type, setType] = useState('market');
    const [qty, setQty] = useState('');
    const [limit, setLimit] = useState('');
    const [err, setErr] = useState({});
    useEffect(() => { if (props.followSelection && insts.some((i) => i.id === ctx.ui.selectedId)) setSym(ctx.ui.selectedId); }, [ctx.ui.selectedId]);
    const inst = insts.find((i) => i.id === sym) || insts[0];
    if (!inst) return html`<${Card} title=${props.title}><div class="tk-order-ticket"><div class="tk-order-ticket__sim"><${Icon} name="info" size=${16} /><div><strong>Simulation</strong> – kein Wertpapier verfügbar.</div></div></div><//>`;
    const held = (data.positions || []).find((p) => p.id === inst.id)?.qty || 0;
    const q = num(qty);
    const price = type === 'limit' && num(limit) > 0 ? num(limit) : inst.price;
    const value = (Number.isFinite(q) ? q : 0) * price;
    const total = side === 'buy' ? value + (value ? FEE : 0) : value - (value ? FEE : 0);

    const validate = () => {
      const e = {};
      if (!qty.trim() || !Number.isFinite(q) || q <= 0) e.qty = 'Bitte eine Stückzahl größer 0 eingeben.';
      else if (!Number.isInteger(q)) e.qty = 'Nur ganze Stücke möglich.';
      else if (side === 'sell' && q > held) e.qty = held ? `Im Depot sind nur ${held} Stück vorhanden.` : 'Dieses Wertpapier ist nicht im Depot.';
      else if (side === 'buy' && total > props.cash) e.qty = `Guthaben reicht nicht (verfügbar ${fmt.currency(props.cash)}).`;
      if (type === 'limit' && (!limit.trim() || !(num(limit) > 0))) e.limit = 'Bitte ein Limit größer 0 eingeben.';
      return e;
    };
    const submit = (ev) => {
      ev && ev.preventDefault();
      const e = validate(); setErr(e);
      if (Object.keys(e).length) { ctx.emit('order.invalid', e); return; }
      ctx.emit('order.review', { symbol: inst.symbol, side, qty: q });
      const label = `${side === 'buy' ? 'Kauf' : 'Verkauf'} ${q} × ${inst.name}`;
      ctx.openDialog({ title: 'Order prüfen (Simulation)',
        body: () => html`<div class="tk-col" style="gap:12px"><div class="tk-order-ticket__sim"><${Icon} name="info" size=${16} /><div><strong>Simulation</strong><br /><span>Es wird keine echte Order an eine Börse oder einen Broker gesendet.</span></div></div>
          <div class="tk-order-ticket__sum"><div><span>Wertpapier</span><strong>${inst.name}</strong></div><div><span>Richtung</span><strong>${side === 'buy' ? 'Kauf' : 'Verkauf'}</strong></div>
            <div><span>Stückzahl</span><strong>${q}</strong></div><div><span>${type === 'limit' ? 'Limit' : 'Marktpreis (ca.)'}</span><strong>${fmt.currency(price)}</strong></div>
            <div><span>Gebühr (Annahme)</span><strong>${fmt.currency(FEE)}</strong></div><div><span>${side === 'buy' ? 'Gesamtkosten' : 'Erlös'}</span><strong>${fmt.currency(total)}</strong></div></div></div>`,
        footer: (close) => html`<${Button} onClick=${() => { ctx.emit('order.cancel'); close(); }}>Abbrechen<//><${Button} variant="primary" icon="check" onClick=${() => {
          setData('target', (all) => [{ id: nextId(all, 'ord'), title: label, subtitle: `${type === 'limit' ? 'Limit ' + fmt.currency(price) : 'Marktorder'} · Gesamt ${fmt.currency(total)}`, meta: 'gerade eben', badge: 'Simulation', tone: 'info', icon: side === 'buy' ? 'trending-up' : 'trending-down', done: false }, ...(Array.isArray(all) ? all : [])]);
          ctx.emit('order.confirm', { symbol: inst.symbol, side, qty: q, type }); ctx.toast('Simulierte Order platziert'); setQty(''); setLimit(''); setErr({}); close(); }}>Simuliert platzieren<//>`,
      });
    };
    return html`<${Card} title=${props.title} actions=${html`<${Badge} tone="info" icon="info">Simulation<//>`}>
      <form class="tk-order-ticket" onSubmit=${submit} novalidate>
        <div class="tk-order-ticket__sim"><${Icon} name="info" size=${16} /><div><strong>Simulation</strong> <span>– keine echte Orderausführung, es fließt kein Geld.</span></div></div>
        <div class="tk-order-ticket__sides" role="group" aria-label="Richtung">
          <button type="button" class="tk-order-ticket__side" data-side="buy" aria-pressed=${String(side === 'buy')} onClick=${() => { setSide('buy'); setErr({}); }}><${Icon} name="trending-up" size=${16} />Kaufen</button>
          <button type="button" class="tk-order-ticket__side" data-side="sell" aria-pressed=${String(side === 'sell')} onClick=${() => { setSide('sell'); setErr({}); }}><${Icon} name="trending-down" size=${16} />Verkaufen</button></div>
        <${Field} label="Wertpapier" hint=${`Kurs ${fmt.currency(inst.price)}${side === 'sell' ? ` · Bestand ${held}` : ''}`}><${Select} value=${sym || inst.id} onChange=${(v) => { setSym(v); ctx.setUi('selectedId', v); setErr({}); }} options=${insts.map((i) => ({ value: i.id, label: `${i.name} (${i.symbol})` }))} /><//>
        <div class="tk-order-ticket__grid">
          <${Field} label="Stückzahl" error=${err.qty}><${Input} type="text" inputmode="numeric" value=${qty} onInput=${setQty} invalid=${!!err.qty} placeholder="z. B. 5" /><//>
          <div class="tk-col" style="gap:6px"><span class="tk-field__label">Ordertyp</span><${Segmented} label="Ordertyp" value=${type} onChange=${(v) => { setType(v); setErr({}); }} options=${[{ value: 'market', label: 'Markt' }, { value: 'limit', label: 'Limit' }]} /></div></div>
        ${type === 'limit' && html`<${Field} label="Limit (€)" error=${err.limit}><${Input} type="text" inputmode="decimal" value=${limit} onInput=${setLimit} invalid=${!!err.limit} placeholder=${fmt.number(inst.price, 2)} /><//>`}
        <div class="tk-order-ticket__sum"><div><span>Geschätzter Wert</span><span>${fmt.currency(value)}</span></div><div><span>Gebühr (Annahme)</span><span>${fmt.currency(value ? FEE : 0)}</span></div><div><span>${side === 'buy' ? 'Gesamtkosten' : 'Erlös'}</span><span>${fmt.currency(Math.max(total, 0))}</span></div></div>
        <${Button} variant="primary" type="submit" icon="check" style="width:100%">Order prüfen<//>
      </form><//>`;
  },
};

export default [orderTicket];
