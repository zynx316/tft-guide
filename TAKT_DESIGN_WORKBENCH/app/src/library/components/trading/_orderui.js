// Trading – Order-Bausteine für das Order-Ticket: Formularzustand, Kostenvorschau, Hinweise, Bestätigungsdialog.
import { html } from '../../../lib/html.js';
import { useState, useEffect } from 'preact/hooks';
import { Button, Check, Icon } from '../../ui.js';
import { money } from '../../helpers.js';
import { fmtNumber, fmtPercent } from '../../../lib/format.js';
import { arr } from './_calc.js';
import { check, makeOrder, TYPE_LABEL } from './_order.js';
import { Px, Note } from './_trd.js';

/** Formularzustand eines Tickets; Auswahl und Richtung folgen ctx.ui.selectedId und ctx.ui.side. */
export function useOrderForm(props, data, ctx) {
  const insts = arr(data.instruments);
  const [sec, setSec] = useState(ctx.ui.selectedId || insts[0]?.id || '');
  const [side, setSide] = useState(ctx.ui.side || props.defaultSide || 'buy');
  const [type, setType] = useState('markt'), [qty, setQty] = useState(''), [limit, setLimit] = useState(''), [stop, setStop] = useState(''), [validity, setValidity] = useState('Tag');
  const [show, setShow] = useState(false), [ack, setAck] = useState(false);
  useEffect(() => { if (props.followSelection !== false && insts.some((i) => i.id === ctx.ui.selectedId)) setSec(ctx.ui.selectedId); }, [ctx.ui.selectedId]);
  useEffect(() => { if (ctx.ui.side) setSide(ctx.ui.side); }, [ctx.ui.side]);
  const inst = insts.find((i) => i.id === sec) || insts[0];
  const chk = inst ? check({ inst, side, type, qtyText: qty, limitText: limit, stopText: stop, data, ctx }) : null;
  const reset = () => { setQty(''); setLimit(''); setStop(''); setShow(false); setAck(false); };
  const touch = () => { setShow(false); setAck(false); };
  return { insts, inst, chk, sec, side, type, qty, limit, stop, validity, show, ack, setAck, setShow, reset,
    setSec: (v) => { setSec(v); ctx.setUi('selectedId', v); touch(); }, setSide: (v) => { setSide(v); ctx.emit('order.side', { side: v }); touch(); }, setType: (v) => { setType(v); ctx.emit('order.type', { type: v }); touch(); },
    setQty: (v) => { setQty(v); touch(); }, setLimit: (v) => { setLimit(v); touch(); }, setStop: (v) => { setStop(v); touch(); }, setValidity };
}

export const Row = ({ k, children, strong }) => html`<div class=${strong ? 'tk-trd-ot__sum' : ''}><span>${k}</span><span class="tk-trd-num">${children}</span></div>`;

/** Kostenvorschau mit Gebühr (Annahme), Steuer-Orientierung beim Verkauf und Wirkung auf Guthaben und Anteil. */
export function Preview({ f, ctx }) {
  const { chk, inst, side, type } = f, pv = chk.pv;
  return html`<div class="tk-trd-ot__box" aria-live="polite"><${Row} k=${type === 'limit' ? 'Limit' : type === 'stop' ? 'Stop-Kurs' : 'Kurs (aktuell)'}><${Px} v=${pv.price} /><//>
    <${Row} k="Geschätzter Wert">${money(ctx, pv.value)}<//><${Row} k="Gebühr (Annahme)">${money(ctx, pv.fee)}<//>
    <${Row} k=${side === 'buy' ? 'Gesamtkosten' : 'Erlös'} strong>${money(ctx, Math.max(pv.total, 0))}<//>
    ${pv.gain != null && html`<${Row} k="Realisierter Gewinn">${money(ctx, pv.gain, { sign: true })}<//><${Row} k="Steuer (Schätzung)">${money(ctx, pv.tax)}<//><${Row} k="Erlös nach Steuer (Schätzung)">${money(ctx, pv.net)}<//>`}
    ${pv.value > 0 && html`<${Row} k="Guthaben danach">${money(ctx, pv.cashAfter)}<//><${Row} k=${`Anteil ${inst.short || inst.name}`}>${fmtPercent(pv.weightBefore, { digits: 1 })} → ${fmtPercent(pv.weightAfter, { digits: 1 })}<//>`}</div>`;
}

/** Hinweise: Information, Warnungen mit Bestätigung („Ich habe die Eingabe geprüft“). */
export function Notes({ f, ctx }) {
  const { chk } = f; if (!chk.warnings.length && !chk.notes.length) return null;
  return html`<div class="tk-col" style="gap:8px">${chk.warnings.map((w) => html`<${Note} tone="warning" icon="alert-triangle">${w.text}<//>`)}${chk.notes.map((n) => html`<${Note} icon="info">${n}<//>`)}
    ${chk.warnings.length > 0 && html`<label class="tk-row" style="gap:10px;min-height:44px;cursor:pointer"><${Check} checked=${f.ack} onChange=${f.setAck} label="Eingabe geprüft" /><span>Ich habe die Eingabe geprüft.</span></label>`}</div>`;
}

/** Order anlegen (Simulation): Eintrag in die Orderliste, Depot bleibt unverändert. */
export function place(f, ctx, setData, after) {
  const { chk, inst, side, type, validity } = f, o = makeOrder({ ctx, inst, side, type, chk, validity });
  setData('orders', (all) => [o, ...arr(all)]); ctx.emit('order.confirm', { id: inst.id, side, type, qty: chk.qty, status: o.status });
  ctx.toast(o.status === 'offen' ? 'Simulierte Order vorgemerkt (offen)' : 'Simulierte Order vorgemerkt'); f.reset(); after && after(o); return o;
}
/** Prüfen: Fehler und unbestätigte Warnungen zeigen, sonst Bestätigungsdialog (Simulation, nicht wegklickbar). */
export function review(f, ctx, setData, after) {
  const { chk, inst, side, type, validity } = f;
  if (!chk.ok) { ctx.emit('order.invalid', chk.errors); f.setShow(true); return; }
  if (chk.warnings.length && !f.ack) { ctx.emit('order.invalid', { ack: true }); f.setShow(true); return; }
  ctx.emit('order.review', { id: inst.id, side, type, qty: chk.qty });
  const pv = chk.pv;
  ctx.openDialog({ title: 'Order prüfen (Simulation)', body: () => html`<div class="tk-col" style="gap:12px"><${Note} icon="info"><strong>Simulation.</strong> Es wird nichts an einen Broker gesendet, es fließt kein Geld und das Depot bleibt unverändert.<//>
      <div class="tk-trd-ot__box"><${Row} k="Wertpapier">${inst.short || inst.name}<//><${Row} k="Art">${side === 'buy' ? 'Kauf' : 'Verkauf'} · ${TYPE_LABEL[type]}<//><${Row} k="Stück">${fmtNumber(chk.qty, { digits: chk.qty % 1 ? 3 : 0 })}<//>
        <${Row} k=${type === 'limit' ? 'Limit' : type === 'stop' ? 'Stop-Kurs' : 'Kurs (ca.)'}><${Px} v=${pv.price} /><//><${Row} k="Gebühr (Annahme)">${money(ctx, pv.fee)}<//><${Row} k=${side === 'buy' ? 'Gesamtkosten' : 'Erlös'} strong>${money(ctx, pv.total)}<//>${type !== 'markt' && html`<${Row} k="Gültigkeit">${validity}<//>`}</div></div>`,
    footer: (close) => html`<${Button} onClick=${() => { ctx.emit('order.cancel'); close(); }}>Abbrechen<//><${Button} variant="primary" icon="check" onClick=${() => { place(f, ctx, setData, after); close(); }}>Simuliert vormerken<//>` });
}

export const OT_CSS = `
  .tk-trd-ot { display:flex; flex-direction:column; gap:var(--tk-space-4); }
  .tk-trd-ot__sides { display:grid; grid-template-columns:1fr 1fr; gap:var(--tk-space-2); } .tk-trd-ot__side { min-height:44px; border-radius:var(--tk-radius-md); border:1px solid var(--tk-c-border-strong); background:var(--tk-c-surface2); color:var(--tk-c-text-muted); font:inherit; font-weight:var(--tk-fw-semibold); cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; }
  .tk-trd-ot__side[aria-pressed="true"][data-side="buy"] { background:var(--tk-c-success-soft); color:var(--tk-c-text); border-color:var(--tk-c-success); } .tk-trd-ot__side[aria-pressed="true"][data-side="sell"] { background:var(--tk-c-danger-soft); color:var(--tk-c-text); border-color:var(--tk-c-danger); }
  .tk-trd-ot__grid { display:grid; grid-template-columns:1fr 1fr; gap:var(--tk-space-3); } .bp-mobile .tk-trd-ot__grid { grid-template-columns:minmax(0,1fr); }
  .tk-trd-ot__box { border-radius:var(--tk-radius-md); border:1px solid var(--tk-c-border); background:var(--tk-c-surface2); padding:12px 14px; display:grid; gap:6px; font-size:var(--tk-fs-sm); } .tk-trd-ot__box > div { display:flex; justify-content:space-between; gap:12px; } .tk-trd-ot__box > div > :first-child { color:var(--tk-c-text-muted); }
  .tk-trd-ot__box .tk-trd-ot__sum { font-weight:var(--tk-fw-bold); font-size:var(--tk-fs-md); padding-top:6px; border-top:1px solid var(--tk-c-border); } .tk-trd-ot__box .tk-trd-ot__sum > :first-child { color:var(--tk-c-text); }
  .tk-trd-ot__chips { display:flex; gap:6px; flex-wrap:wrap; } .tk-trd-ot__steps { display:flex; gap:6px; align-items:center; margin-bottom:var(--tk-space-3); } .tk-trd-ot__steps i { flex:1 1 0; height:6px; border-radius:3px; background:var(--tk-c-surface3); } .tk-trd-ot__steps i[data-on="true"] { background:var(--tk-c-accent); }
  .tk-trd-ot__big { font-size:var(--tk-fs-3xl); font-weight:var(--tk-fw-bold); text-align:center; }`;
