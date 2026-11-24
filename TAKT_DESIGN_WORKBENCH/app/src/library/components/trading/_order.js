// Trading – Order-Logik (Simulation): Kostenvorschau, Prüfung mit Plausibilitätsschutz, Anlegen. Rein, ohne DOM.
// Annahmen (Stand 24.11.2026): Gebühr 1,00 € je Order, bei Krypto 1 % Aufschlag; Börse Mo–Fr 09:00–17:30. Keine echte Ausführung.
import { estimateTax } from '../../../core/finmath.js';
import { fmtNumber, fmtPercent, fmtDate, fmtTime } from '../../../lib/format.js';
import { isoLocalOf } from './_calc.js';
import { arr, obj, r2, FEE, marketState, holdings } from './_calc.js';

export const TYPES = [{ value: 'markt', label: 'Markt' }, { value: 'limit', label: 'Limit' }, { value: 'stop', label: 'Stop' }];
export const TYPE_LABEL = { markt: 'Marktorder', limit: 'Limit-Order', stop: 'Stop-Order' };
export const decimalsOf = (t) => (t === 'Krypto' ? 8 : t === 'ETF' ? 3 : 0);
export const parseNum = (s) => { const t = String(s ?? '').trim().replace(/\s/g, ''); if (!t) return NaN; return Number(t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t); };
const places = (n) => { const m = String(n).match(/\.(\d+)/); return m ? m[1].length : 0; };

/** Kostenvorschau: Kurs der Order, Wert, Gebühr, Gesamt/Erlös, Steuer-Orientierung (Verkauf), Wirkung auf Guthaben und Anteil. */
export function preview({ inst, side, type, qty, limit, stop, data }) {
  const hd = holdings(data.positions, data.cash), row = hd.rows.find((r) => r.id === inst.id), q = Number.isFinite(qty) && qty > 0 ? qty : 0;
  const price = type === 'limit' && limit > 0 ? limit : type === 'stop' && stop > 0 ? stop : inst.price;
  const value = r2(q * price), fee = value ? r2(inst.type === 'Krypto' ? value * FEE.crypto : FEE.flat) : 0, total = side === 'buy' ? r2(value + fee) : r2(value - fee);
  let gain = null, tax = null, net = null;
  if (side === 'sell' && row && q) { gain = r2(q * (price - row.buy) - fee); const left = Math.max(0, (obj(data.allowance).total ?? 0) - (obj(data.allowance).used ?? 0)); tax = estimateTax({ gain: Math.max(0, gain), allowanceLeft: left, equityFund: inst.type === 'ETF' }).tax; net = r2(total - tax); }
  const cashAfter = r2(hd.cash + (side === 'buy' ? -total : total)), posAfter = (row ? row.value : 0) + (side === 'buy' ? value : -value);
  return { price, value, fee, total, gain, tax, net, cashAfter, held: row ? row.q : 0, weightBefore: row ? row.weight : 0, weightAfter: hd.total ? Math.max(0, posAfter) / hd.total : 0, hd, max: side === 'buy' ? (price ? Math.floor((hd.cash - FEE.flat) / price * 10 ** decimalsOf(inst.type)) / 10 ** decimalsOf(inst.type) : 0) : (row ? row.q : 0) };
}

/** Prüfung: errors (blockieren), warnings (ack = muss bestätigt werden), notes (nur Information). */
export function check({ inst, side, type, qtyText, limitText, stopText, data, ctx }) {
  const qty = parseNum(qtyText), limit = parseNum(limitText), stop = parseNum(stopText), pv = preview({ inst, side, type, qty, limit, stop, data }), errors = {}, warnings = [], notes = [];
  const dp = decimalsOf(inst.type), fmtP = (v) => `${fmtNumber(v, { digits: inst.price >= 5000 ? 0 : 2 })} €`;
  if (!String(qtyText).trim() || !Number.isFinite(qty) || qty <= 0) errors.qty = 'Bitte eine Stückzahl größer 0 eingeben.';
  else if (places(qty) > dp) errors.qty = dp ? `Höchstens ${dp} Nachkommastellen möglich.` : 'Nur ganze Stücke möglich.';
  else if (side === 'sell' && qty > pv.held + 1e-9) errors.qty = pv.held ? `Im Depot sind nur ${fmtNumber(pv.held, { digits: pv.held % 1 ? 3 : 0 })} Stück.` : 'Dieses Wertpapier ist nicht im Depot.';
  else if (side === 'buy' && pv.total > pv.hd.cash + 1e-9) errors.qty = `Das Guthaben reicht nicht (verfügbar ${fmtNumber(pv.hd.cash, { digits: 2 })} €, höchstens ${fmtNumber(Math.max(0, pv.max), { digits: dp })} Stück).`;
  if (type === 'limit' && !(limit > 0)) errors.limit = 'Bitte ein Limit größer 0 eingeben.';
  if (type === 'stop') { if (!(stop > 0)) errors.stop = 'Bitte einen Stop-Kurs größer 0 eingeben.'; else if (side === 'sell' && stop >= inst.price) errors.stop = `Bei einem Verkauf muss der Stop-Kurs unter dem aktuellen Kurs liegen (${fmtP(inst.price)}).`; else if (side === 'buy' && stop <= inst.price) errors.stop = `Bei einem Kauf muss der Stop-Kurs über dem aktuellen Kurs liegen (${fmtP(inst.price)}).`; }
  if (type === 'limit' && limit > 0) {
    const d = limit / inst.price - 1;
    if (Math.abs(d) > 0.1) warnings.push({ id: 'far', text: `Das Limit liegt ${fmtPercent(Math.abs(d), { digits: 1 })} ${d > 0 ? 'über' : 'unter'} dem Kurs. Bitte auf Tippfehler prüfen.` });
    else if ((side === 'buy' && limit >= inst.price) || (side === 'sell' && limit <= inst.price)) notes.push('Das Limit ist schon erreicht. In der Simulation gilt der aktuelle Kurs.');
  }
  if (type === 'stop' && stop > 0 && !errors.stop && Math.abs(stop / inst.price - 1) > 0.2) warnings.push({ id: 'farstop', text: `Der Stop-Kurs liegt ${fmtPercent(Math.abs(stop / inst.price - 1), { digits: 0 })} vom Kurs entfernt.` });
  if (pv.hd.total && pv.value / pv.hd.total > 0.25) warnings.push({ id: 'size', text: `Die Order entspricht ${fmtPercent(pv.value / pv.hd.total, { digits: 0 })} deines Depotwerts.` });
  const dup = arr(data.orders).find((o) => o.status === 'offen' && o.securityId === inst.id && o.side === side);
  if (dup) notes.push(`Für dieses Wertpapier gibt es schon eine offene simulierte ${side === 'buy' ? 'Kauf' : 'Verkaufs'}order.`);
  if (inst.type === 'Krypto') notes.push('Kryptowerte sind hochspekulativ und können vollständig an Wert verlieren.');
  const m = marketState(ctx.now ? ctx.now() : ctx.today);
  if (!m.open && inst.type !== 'Krypto' && m.next) notes.push(`Die Börse ist geschlossen. Die Order wird für ${fmtDate(m.next, { style: 'weekday' })}, ${fmtTime(m.next)} Uhr vorgemerkt.`);
  return { qty, limit, stop, pv, errors, warnings, notes, ok: !Object.keys(errors).length };
}

let orderSeq = 0;
/** Order-ID: ctx.newId (deterministisch je Sitzung); ohne Kontext ein Modulzähler – nie Uhrzeit oder Zufall. */
const newOrderId = (ctx) => (ctx && ctx.newId ? ctx.newId('o') : `o-${++orderSeq}`);

/** Neue simulierte Order (Markt gilt sofort als simuliert zum Kurs, Limit und Stop bleiben offen). */
export function makeOrder({ ctx, inst, side, type, chk, validity }) {
  const { pv, qty, limit, stop } = chk, done = type === 'markt' || (type === 'limit' && ((side === 'buy' && limit >= inst.price) || (side === 'sell' && limit <= inst.price)));
  return { id: newOrderId(ctx), securityId: inst.id, side, type, qty, ...(type === 'limit' ? { limit } : {}), ...(type === 'stop' ? { stop } : {}), price: done && type !== 'limit' ? inst.price : pv.price, fee: pv.fee, total: pv.total,
    status: done ? 'simuliert' : 'offen', validity: type === 'markt' ? 'Tag' : validity, created: isoLocalOf(ctx.now ? ctx.now() : ctx.today), user: true };
}
