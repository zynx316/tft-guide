// Trading: Order erfassen – ausdrücklich SIMULATION (keine echte Ausführung). Version 2.0: Markt/Limit/Stop, Kostenvorschau, Plausibilitätsschutz.
// Drei Bedienkonzepte: ticket (ein Formular), steps (vier Schritte), quick (Schnell-Sheet für ein gewähltes Wertpapier).
import { html } from '../../../lib/html.js';
import { Card, Button, Badge, Field, Input, Select, Segmented, NumberStepper, Icon, Chip } from '../../ui.js';
import { money } from '../../helpers.js';
import { fmtNumber } from '../../../lib/format.js';
import { arr } from '../trading/_calc.js';
import { slots, Note, Px, Chg, Tile, TRD_CSS } from '../trading/_trd.js';
import { decimalsOf, TYPES } from '../trading/_order.js';
import { useOrderForm, Preview, Notes, review, place, OT_CSS } from '../trading/_orderui.js';
import { ex } from '../trading/_example.js';

const Sim = () => html`<${Note} icon="info"><strong>Simulation</strong> – keine echte Orderausführung, es fließt kein Geld. Das Depot bleibt unverändert.<//>`;
const Sides = ({ f }) => html`<div class="tk-trd-ot__sides" role="group" aria-label="Richtung">${[['buy', 'Kaufen', 'trending-up'], ['sell', 'Verkaufen', 'trending-down']].map(([k, l, ic]) => html`<button type="button" class="tk-trd-ot__side" data-side=${k} aria-pressed=${String(f.side === k)} onClick=${() => f.setSide(k)}><${Icon} name=${ic} size=${16} />${l}</button>`)}</div>`;

function secOptions(f, data) {
  const held = new Set(arr(data.positions).map((p) => p.id)), list = f.side === 'sell' && held.size ? f.insts.filter((i) => held.has(i.id)) : f.insts;
  return list.map((i) => ({ value: i.id, label: `${i.short || i.name}${held.has(i.id) ? ' (Depot)' : ''}` }));
}
const Fields = ({ f, data, ctx, showSec = true }) => {
  const { inst, chk } = f, e = f.show ? chk.errors : {}, dp = decimalsOf(inst.type);
  return html`<div class="tk-col" style="gap:var(--tk-space-4)">
    ${showSec && html`<${Field} label="Wertpapier" hint=${html`Kurs <${Px} v=${inst.price} />${f.side === 'sell' ? ` · Bestand ${fmtNumber(chk.pv.held, { digits: chk.pv.held % 1 ? 3 : 0 })}` : ''}`}><${Select} value=${inst.id} onChange=${f.setSec} options=${secOptions(f, data)} aria-label="Wertpapier" /><//>`}
    <div class="tk-trd-ot__grid"><${Field} label="Stückzahl" error=${e.qty} hint=${dp ? '' : 'ganze Stücke'}><${Input} type="text" inputmode="decimal" value=${f.qty} onInput=${f.setQty} invalid=${!!e.qty} placeholder="z. B. 5" aria-label="Stückzahl" /><//>
      <div class="tk-col" style="gap:6px"><span class="tk-field__label">Ordertyp</span><${Segmented} label="Ordertyp" value=${f.type} onChange=${f.setType} options=${TYPES} /></div></div>
    ${f.side === 'sell' && chk.pv.held > 0 && html`<div class="tk-trd-ot__chips">${[[0.25, '25 %'], [0.5, '50 %'], [1, 'Alles']].map(([r, l]) => html`<${Chip} onClick=${() => f.setQty(String(Math.floor(chk.pv.held * r * 10 ** dp) / 10 ** dp).replace('.', ','))}>${l}<//>`)}</div>`}
    ${f.type === 'limit' && html`<${Field} label="Limit (€)" error=${e.limit}><${Input} type="text" inputmode="decimal" value=${f.limit} onInput=${f.setLimit} invalid=${!!e.limit} placeholder=${fmtNumber(inst.price, { digits: 2 })} aria-label="Limit in Euro" /><//>`}
    ${f.type === 'stop' && html`<${Field} label="Stop-Kurs (€)" error=${e.stop} hint="Löst bei Erreichen eine Marktorder aus"><${Input} type="text" inputmode="decimal" value=${f.stop} onInput=${f.setStop} invalid=${!!e.stop} placeholder=${fmtNumber(inst.price * (f.side === 'sell' ? 0.95 : 1.05), { digits: 2 })} aria-label="Stop-Kurs in Euro" /><//>`}
    ${f.type !== 'markt' && html`<${Field} label="Gültigkeit"><${Select} value=${f.validity} onChange=${f.setValidity} options=${['Tag', '30 Tage']} aria-label="Gültigkeit" /><//>`}</div>`;
};

function Steps({ f, data, setData, ctx }) {
  const [done, order] = ctx.ui.otDone || [false, null], step = ctx.ui.otStep || 1, go = (n) => { ctx.setUi('otStep', n); ctx.emit('order.step', { step: n }); };
  const { chk } = f, valid = [true, chk.ok, chk.ok && (!chk.warnings.length || f.ack)];
  if (done && order) return html`<div class="tk-col" style="gap:var(--tk-space-4);text-align:center;align-items:center"><span class="tk-trd-ico" style="width:56px;height:56px;background:var(--tk-c-success-soft);color:var(--tk-c-success)"><${Icon} name="check" size=${28} /></span>
    <div><div style="font-size:var(--tk-fs-xl);font-weight:var(--tk-fw-bold)">Simulierte Order vorgemerkt</div><div class="tk-trd-meta" style="margin-top:4px">${order.side === 'buy' ? 'Kauf' : 'Verkauf'} ${fmtNumber(order.qty, { digits: order.qty % 1 ? 3 : 0 })} × ${f.insts.find((i) => i.id === order.securityId)?.short || ''} · ${order.status === 'offen' ? 'offen, wartet auf den Kurs' : 'simuliert zum Kurs'}</div></div>
    <${Note} icon="info">Es wurde nichts an einen Broker gesendet. Das Depot bleibt unverändert.<//>
    <div class="tk-trd-cta" style="justify-content:center"><${Button} variant="primary" onClick=${() => { ctx.setUi('otDone', null); go(1); }}>Neue Order<//><${Button} onClick=${() => ctx.emit('order.done', { id: order.securityId, to: 'trading.detail' })}>Zum Wertpapier<//></div></div>`;
  return html`<div class="tk-trd-ot"><div class="tk-trd-ot__steps" role="img" aria-label=${`Schritt ${step} von 3`}>${[1, 2, 3].map((n) => html`<i data-on=${String(n <= step)}></i>`)}</div>
    <div class="tk-trd-cap">Schritt ${step} von 3 · ${['Wertpapier und Richtung', 'Menge und Ordertyp', 'Prüfen'][step - 1]}</div>
    ${step === 1 && html`<${Sides} f=${f} /><${Field} label="Wertpapier"><${Select} value=${f.inst.id} onChange=${f.setSec} options=${secOptions(f, data)} aria-label="Wertpapier" /><//>
      <div class="tk-trd-row" style="justify-content:space-between"><span class="tk-trd-meta">Aktueller Kurs</span><span><${Px} v=${f.inst.price} /> <${Chg} v=${f.inst.price / f.inst.prevClose - 1} /></span></div>`}
    ${step === 2 && html`<${Fields} f=${f} data=${data} ctx=${ctx} showSec=${false} />`}
    ${step === 3 && html`<${Preview} f=${f} ctx=${ctx} /><${Notes} f=${f} ctx=${ctx} />`}
    <div class="tk-trd-cta" style="justify-content:space-between">${step > 1 ? html`<${Button} icon="arrow-left" onClick=${() => go(step - 1)}>Zurück<//>` : html`<span></span>`}
      ${step < 3 ? html`<${Button} variant="primary" iconRight="arrow-right" onClick=${() => { f.setShow(true); if (valid[step - 1]) go(step + 1); }}>Weiter<//>`
        : html`<${Button} variant="primary" icon="check" disabled=${!valid[2]} onClick=${() => place(f, ctx, setData, (o) => { ctx.setUi('otDone', [true, o]); })}>Simuliert vormerken<//>`}</div></div>`;
}

function Quick({ f, data, setData, ctx, note }) {
  const { inst, chk } = f, dp = decimalsOf(inst.type), q = chk.qty > 0 ? chk.qty : 0, step = inst.type === 'Krypto' ? 0.01 : 1;
  return html`<div class="tk-trd-ot"><div class="tk-trd-row"><${Tile} type=${inst.type} size=${40} /><div class="tk-trd-grow"><div class="tk-trd-title">${inst.short || inst.name}</div><div class="tk-trd-meta"><${Px} v=${inst.price} /> · <${Chg} v=${inst.price / inst.prevClose - 1} /></div></div></div>
    <${Sides} f=${f} /><div style="display:flex;justify-content:center"><${NumberStepper} label="Stückzahl" value=${q} min=${0} step=${step} decimals=${dp ? 2 : 0} unit="Stück" onChange=${(v) => f.setQty(String(v).replace('.', ','))} /></div>
    ${f.side === 'sell' && chk.pv.held > 0 && html`<div class="tk-trd-ot__chips" style="justify-content:center">${[[0.5, '50 %'], [1, 'Alles']].map(([r, l]) => html`<${Chip} onClick=${() => f.setQty(String(Math.floor(chk.pv.held * r * 10 ** dp) / 10 ** dp).replace('.', ','))}>${l}<//>`)}</div>`}
    <div class="tk-trd-ot__big" aria-live="polite">${money(ctx, chk.pv.total)}</div><div class="tk-trd-meta" style="text-align:center;margin-top:-8px">${f.side === 'buy' ? 'Gesamtkosten' : 'Erlös'} inkl. ${money(ctx, chk.pv.fee)} Gebühr (Annahme) · Marktorder</div>
    ${f.show && chk.errors.qty && html`<${Note} tone="danger" icon="alert-triangle">${chk.errors.qty}<//>`}<${Notes} f=${f} ctx=${ctx} />
    <${Button} variant="primary" icon="check" style="width:100%;justify-content:center" onClick=${() => review(f, ctx, setData)}>Simuliert vormerken<//>${note && html`<${Sim} />`}</div>`;
}

export const orderTicket = {
  id: 'order-ticket',
  name: 'Order-Ticket (Simulation)',
  category: 'Trading',
  description: 'Kauf oder Verkauf durchspielen: Markt-, Limit- und Stop-Order, Kostenvorschau mit Gebühr (Annahme) und Steuer-Orientierung, Plausibilitätsschutz (Tippfehler, Größe, Börsenzeiten) und Bestätigung. Als Ticket, in vier Schritten oder als Schnell-Sheet. Immer als Simulation gekennzeichnet, das Depot bleibt unverändert.',
  version: '2.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Order erfassen' },
    { name: 'mode', label: 'Bedienkonzept', type: 'select', options: ['ticket', 'steps', 'quick'], default: 'ticket' },
    { name: 'showNote', label: 'Simulations-Hinweis im Ticket', type: 'boolean', default: true },
    { name: 'defaultSide', label: 'Start-Richtung', type: 'select', options: ['buy', 'sell'], default: 'buy' },
    { name: 'followSelection', label: 'Auswahl der Liste folgen', type: 'boolean', default: true },
  ],
  data: slots('instruments', 'positions', 'cash', 'orders', 'allowance'),
  events: ['order.review', 'order.confirm', 'order.invalid', 'order.cancel', 'order.side', 'order.type', 'order.step', 'order.done'],
  states: ['empty'],
  css: `${TRD_CSS}${OT_CSS}`,
  example: { props: { mode: 'ticket' }, data: ex('instruments', 'positions', 'cash', 'orders', 'allowance') },
  render: function OrderTicket({ props, data, setData, ctx }) {
    const f = useOrderForm(props, data, ctx);
    if (!f.inst) return html`<${Card} title=${props.title}><${Note} icon="info"><strong>Simulation</strong> – kein Wertpapier verfügbar.<//><//>`;
    const sim = html`<${Badge} tone="info" icon="info">Simulation<//>`;
    if (props.mode === 'steps') return html`<${Card} title=${props.title} actions=${sim}><${Steps} f=${f} data=${data} setData=${setData} ctx=${ctx} /><//>`;
    if (props.mode === 'quick') return html`<${Card} title=${props.title} actions=${sim}><${Quick} f=${f} data=${data} setData=${setData} ctx=${ctx} note=${props.showNote} /><//>`;
    return html`<${Card} title=${props.title} actions=${sim}><form class="tk-trd-ot" onSubmit=${(e) => { e.preventDefault(); review(f, ctx, setData); }} novalidate>${props.showNote && html`<${Sim} />`}<${Sides} f=${f} /><${Fields} f=${f} data=${data} ctx=${ctx} /><${Preview} f=${f} ctx=${ctx} /><${Notes} f=${f} ctx=${ctx} />
      <${Button} variant="primary" type="submit" icon="check" style="width:100%;justify-content:center">Order prüfen<//></form><//>`;
  },
};

export default [orderTicket];
