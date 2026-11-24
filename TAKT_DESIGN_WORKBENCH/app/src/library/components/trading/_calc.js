// Trading – Rechenhelfer (rein, ohne DOM, auch in Node nutzbar). Alles ist Simulation und Anzeige.
// Finanzmathematik nur über core/finmath.js (Rendite, Steuer-Orientierung, Ausführungstermine).
import { positionReturn, estimateTax, nextExecutions } from '../../../core/finmath.js';
import { toDate, dayStart, addMonths, dayDiff, toIsoDay, isoWeekday } from '../../../lib/date.js';

export const arr = (v) => (Array.isArray(v) ? v : []);
export const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
/** Kaufmännisch auf Cent, ohne „−0“. */
export const r2 = (x) => (Math.sign(x) * Math.round((Math.abs(x) + 1e-9) * 100)) / 100 + 0;
export const sum = (list, f) => arr(list).reduce((s, x) => s + f(x), 0);
export const FEE = { flat: 1, crypto: 0.01, stand: '24.11.2026' };

const qtyOf = (p) => Number(p.quantity ?? p.qty ?? 0);
const buyOf = (p) => Number(p.buyPrice ?? p.avgPrice ?? 0);
const prevOf = (p) => (p.prevClose != null ? p.prevClose : p.price / (1 + Number(p.dayChangePct ?? p.dayChange ?? 0)));

/** Depot: Zeilen mit Wert, Einstand, Gewinn, Tagesveränderung, Anteil; Summen inklusive Verrechnungskonto. */
export function holdings(positions, cash = 0) {
  const rows = arr(positions).map((p) => {
    const q = qtyOf(p), r = positionReturn({ quantity: q, buyPrice: buyOf(p), price: p.price });
    const prev = prevOf(p), day = q * (p.price - prev);
    return { ...p, q, buy: buyOf(p), value: q * p.price, cost: r.cost, gain: q * p.price - r.cost, gainPct: r.cost ? q * p.price / r.cost - 1 : 0, day, dayPct: prev ? p.price / prev - 1 : 0 };
  });
  const invested = sum(rows, (r) => r.value), cost = sum(rows, (r) => r.cost), day = sum(rows, (r) => r.day);
  const total = invested + (Number(cash) || 0);
  rows.forEach((r) => { r.weight = total ? r.value / total : 0; });
  return { rows, invested, cost, gain: invested - cost, gainPct: cost ? invested / cost - 1 : 0, day, dayPct: invested - day ? day / (invested - day) : 0, cash: Number(cash) || 0, total };
}

export const byId = (list, id) => arr(list).find((x) => x.id === id);
export const dayPctOf = (i) => (i && i.prevClose ? i.price / i.prevClose - 1 : 0);

/** Kennzahlen aus den Kurszeitreihen: Tageshoch/-tief (bisher), Spanne 52 Wochen, Rendite je Zeitraum. */
export function stats(inst) {
  const r = inst?.ranges || {}, t = arr(r['1T']), y = arr(r['1J']);
  const hi = (l) => (l.length ? Math.max(...l.map((c) => c.h)) : null), lo = (l) => (l.length ? Math.min(...l.map((c) => c.l)) : null);
  const ret = (k) => { const l = arr(r[k]); return l.length ? l[l.length - 1].c / l[0].o - 1 : null; };
  return { dayHigh: hi(t), dayLow: lo(t), yearHigh: hi(y), yearLow: lo(y), r1w: ret('1W'), r1m: ret('1M'), r1y: ret('1J'), r5y: ret('5J') };
}

/** Kurs zu einem Tag (nächster Kerzenschluss bis dahin) – für Sparplan-Ausführungen früherer Monate. */
export function priceAt(inst, iso) {
  for (const k of ['1M', '1J', '5J']) {
    const l = arr(inst?.ranges?.[k]).filter((c) => c.d);
    if (l.length && iso >= l[0].d) { let best = l[0]; for (const c of l) if (c.d <= iso) best = c; return best.c; }
  }
  return inst?.price ?? 0;
}

// ---------------------------------------------------------------- Alarme ---
/** Zustand eines Alarms gegen den aktuellen Kurs. dist > 0: Kurs muss noch so weit steigen/fallen. */
export function alertInfo(a, inst) {
  const price = inst?.price ?? 0, dist = price ? (a.price - price) / price * (a.dir === 'above' ? 1 : -1) : 0;
  return { price, dist, crossed: a.dir === 'above' ? price >= a.price : price <= a.price, near: dist > 0 && dist <= 0.03 };
}
/** Seed-Einträge nur zeigen, wenn ihr Wertpapier im Depot oder in der Watchlist steht (Szenario „Erster Start“ bleibt leer). */
export const known = (positions, watchlist) => { const ids = new Set([...arr(positions), ...arr(watchlist)].map((x) => x.id)); return (x) => x.user || ids.has(x.securityId); };

// ---------------------------------------------------------- Ausführungen ---
/** Nächste Sparplan-Ausführungen (nur aktive Pläne mit Depotposition), nach Datum sortiert. */
export function planExecutions(plans, positions, today, count = 4) {
  const out = [];
  for (const p of arr(plans)) {
    if (!p.active || !p.positionId) continue;
    const pos = byId(positions, p.positionId);
    for (const d of nextExecutions({ day: p.day, intervalMonths: p.intervalMonths || 1 }, today, 3)) out.push({ date: d, plan: p, position: pos, amount: p.monthly });
  }
  return out.sort((a, b) => a.date - b.date).slice(0, count);
}

// ------------------------------------------------------------ Dividenden ---
/** Dividenden: erhalten, erwartet und fortgeschriebene Prognose (Annahme: gleichbleibende Ausschüttung je Aktie). */
export function dividendPlan(dividends, positions, today, allowance) {
  const t = dayStart(today), end = addMonths(t, 12), list = arr(dividends).map((d) => ({ ...d, date: toDate(d.payDate), forecast: false }));
  const forecast = [];
  for (const p of arr(positions).filter((x) => x.distribution === 'ausschüttend')) {
    const mine = list.filter((d) => d.positionId === p.id).sort((a, b) => a.date - b.date);
    if (!mine.length) continue;
    const last = mine[mine.length - 1], prev = mine[mine.length - 2];
    const step = prev && dayDiff(prev.date, last.date) <= 120 ? 3 : 12;
    for (let k = 1; k <= 12; k++) {
      const date = addMonths(last.date, step * k); if (date > end) break;
      if (!mine.some((d) => d.date.getFullYear() === date.getFullYear() && d.date.getMonth() === date.getMonth())) forecast.push({ id: `${last.id}~f${k}`, positionId: p.id, title: last.title, date, perShare: last.perShare, quantity: qtyOf(p), amount: r2(last.perShare * qtyOf(p)), status: 'Prognose', forecast: true });
    }
  }
  const all = [...list, ...forecast].sort((a, b) => a.date - b.date);
  const paid = all.filter((d) => d.status === 'gezahlt'), ahead = all.filter((d) => d.status !== 'gezahlt' && d.date >= t && d.date <= end);
  const months = Array.from({ length: 12 }, (_, i) => { const m = addMonths(new Date(t.getFullYear(), t.getMonth(), 1), i); const key = `${m.getFullYear()}-${m.getMonth()}`;
    const items = all.filter((d) => `${d.date.getFullYear()}-${d.date.getMonth()}` === key); return { key, date: m, items, amount: r2(sum(items, (x) => x.amount)) }; });
  const total = r2(sum(ahead, (d) => d.amount)), left = Math.max(0, (obj(allowance).total ?? 0) - (obj(allowance).used ?? 0));
  const tax = estimateTax({ gain: total, allowanceLeft: left });
  return { all, paid, ahead, months, total, paidSum: r2(sum(paid, (d) => d.amount)), allowanceLeft: left, tax: tax.tax, next: ahead[0] || null };
}

// -------------------------------------------------------------- Transaktionen ---
const KIND = { buy: 'Kauf', sell: 'Verkauf', plan: 'Sparplan', dividend: 'Dividende', sim: 'Simulation' };
export const kindLabel = (k) => KIND[k] || k;
const shiftWeekend = (d) => { const w = isoWeekday(d); return w === 6 ? new Date(d.getFullYear(), d.getMonth(), d.getDate() + 2) : w === 7 ? new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1) : d; };

/** Alle Bewegungen in einer Liste: Käufe/Verkäufe, Sparplan-Ausführungen (Buchungen + frühere Monate), Dividenden, Simulation. */
export function buildLedger({ trades, orders, transactions, dividends, plans, instruments, positions }, today, allowance) {
  const out = [], t0 = dayStart(today), isoT = toIsoDay(t0);
  const inst = (id) => byId(instruments, id), name = (id) => inst(id)?.short || inst(id)?.name || byId(positions, id)?.short || '–';
  for (const tr of arr(trades)) {
    const gross = tr.qty * tr.price, gain = tr.side === 'sell' ? tr.qty * (tr.price - tr.buyPrice) - tr.fee : null;
    const tax = gain != null ? estimateTax({ gain: Math.max(0, gain), allowanceLeft: Math.max(0, (obj(allowance).total ?? 0) - (obj(allowance).used ?? 0)), equityFund: inst(tr.securityId)?.type === 'ETF' }).tax : null;
    out.push({ id: tr.id, kind: tr.side, date: tr.date, securityId: tr.securityId, title: `${tr.side === 'buy' ? 'Kauf' : 'Verkauf'} ${name(tr.securityId)}`, qty: tr.qty, price: tr.price, fee: tr.fee, amount: tr.side === 'buy' ? -(gross + tr.fee) : gross - tr.fee, gain, tax, simulated: false });
  }
  for (const o of arr(orders)) if (o.status !== 'storniert') out.push({ id: o.id, kind: 'sim', side: o.side, date: toIsoDay(o.created), securityId: o.securityId, title: `${o.side === 'buy' ? 'Kauf' : 'Verkauf'} ${name(o.securityId)}`, qty: o.qty, price: o.price, fee: o.fee, amount: o.side === 'buy' ? -o.total : o.total, status: o.status, simulated: true });
  const seen = new Set();
  for (const tx of arr(transactions)) {
    if (tx.type !== 'transfer' || tx.to !== 'acc-depot' || !/sparplan/i.test(tx.title || '')) continue;
    const plan = arr(plans).find((p) => p.positionId && p.monthly === Math.abs(tx.amount)); const iso = tx.date.slice(0, 10);
    seen.add(`${plan?.id}|${iso.slice(0, 7)}`);
    const px = priceAt(inst(plan?.positionId), iso);
    out.push({ id: `pl-${tx.id}`, kind: 'plan', date: iso, securityId: plan?.positionId, planId: plan?.id, title: `Sparplan ${name(plan?.positionId)}`, qty: px ? Math.abs(tx.amount) / px : 0, price: px, fee: 0, amount: tx.amount, simulated: false });
  }
  for (const p of arr(plans).filter((x) => x.positionId)) for (let k = 1; k <= 5; k++) {
    const d0 = addMonths(new Date(t0.getFullYear(), t0.getMonth(), p.day), -k), d = shiftWeekend(d0), iso = toIsoDay(d);
    if (iso < (p.startDate || '0000') || seen.has(`${p.id}|${iso.slice(0, 7)}`)) continue;
    const px = priceAt(inst(p.positionId), iso);
    out.push({ id: `pl-${p.id}-${iso}`, kind: 'plan', date: iso, securityId: p.positionId, planId: p.id, title: `Sparplan ${name(p.positionId)}`, qty: px ? p.monthly / px : 0, price: px, fee: 0, amount: -p.monthly, simulated: false });
  }
  for (const d of arr(dividends).filter((x) => x.status === 'gezahlt')) out.push({ id: `dv-${d.id}`, kind: 'dividend', date: d.payDate, securityId: d.positionId, title: `Dividende ${d.title}`, qty: d.quantity, price: d.perShare, fee: 0, amount: d.amount, simulated: false });
  return out.filter((e) => e.date <= isoT || e.simulated).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : String(b.id).localeCompare(String(a.id))));
}

// ------------------------------------------------------------ Handelszeiten ---
/** Börsenzeiten (Annahme Xetra: Mo–Fr 09:00–17:30, ohne Feiertage). Krypto handelt rund um die Uhr. */
export function marketState(now) {
  const d = toDate(now), wd = isoWeekday(d), mins = d.getHours() * 60 + d.getMinutes(), open = wd <= 5 && mins >= 540 && mins < 1050;
  let next = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, 0);
  if (open) next = null; else { if (wd > 5 || mins >= 1050) next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 9, 0); while (isoWeekday(next) > 5) next = new Date(next.getFullYear(), next.getMonth(), next.getDate() + 1, 9, 0); }
  return { open, closesAt: '17:30', next };
}

/** Lokaler Zeitstempel 'YYYY-MM-DDTHH:mm:00' (nicht UTC). */
export const isoLocalOf = (d) => { const x = toDate(d), p = (n) => String(n).padStart(2, '0'); return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}T${p(x.getHours())}:${p(x.getMinutes())}:00`; };
