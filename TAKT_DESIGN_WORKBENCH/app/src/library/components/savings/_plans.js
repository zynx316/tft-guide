// Sparpläne – Plan-Logik: Ausführungstermine (Handelstage), Status, Verlauf, Ziele-Prognose, Bestätigen.
// Rechenkern ist core/finmath.js; hier steht nur Zuordnung, Terminlogik und Formulierung.
import { projectSavings, monthsToGoal, requiredMonthly, nextExecutions } from '../../../core/finmath.js';
import { toDate, dayStart, addDays, addMonths, dayDiff, toIsoDay, daysInMonth } from '../../../lib/date.js';
import { fmtDate } from '../../../lib/format.js';
import { arr, r2, sum, sid, clamp } from './_savings.js';

// --- Handelstage -------------------------------------------------------------
// Annahme (Stand 2026): Xetra-Schließtage und Bankfeiertage; Wochenenden sowieso. Vorerst lokal, Wunsch an den Kern.
const HOLIDAYS = new Set([
  '2026-12-24', '2026-12-25', '2026-12-26', '2026-12-31',
  '2027-01-01', '2027-03-26', '2027-03-29', '2027-05-01', '2027-12-24', '2027-12-25', '2027-12-26', '2027-12-31',
  '2028-01-01', '2028-04-14', '2028-04-17', '2028-05-01', '2028-12-24', '2028-12-25', '2028-12-26', '2028-12-31',
]);
export const isTradingDay = (d) => { const w = toDate(d).getDay(); return w !== 0 && w !== 6 && !HOLIDAYS.has(toIsoDay(d)); };
export const nextTradingDay = (d) => { let x = dayStart(d); while (!isTradingDay(x)) x = addDays(x, 1); return x; };
export const holidayName = (d) => (HOLIDAYS.has(toIsoDay(d)) ? 'Feiertag' : [0, 6].includes(toDate(d).getDay()) ? 'Wochenende' : '');

// --- Zuordnung ------------------------------------------------------------------
export const planPosition = (plan, positions) => arr(positions).find((p) => p.id === plan?.positionId) || null;
export const planAccount = (plan, accounts) => arr(accounts).find((a) => a.id === plan?.accountId) || null;
export const fromAccountId = (plan) => plan?.fromAccount || 'acc-giro';
export const perMonth = (plan) => plan.monthly || 0;                              // Monatsäquivalent (Summe = Sparrate)
export const perExecution = (plan) => r2((plan.monthly || 0) * (plan.intervalMonths || 1)); // Betrag je Ausführung
export const monthlyTotal = (plans) => r2(sum(arr(plans).filter((p) => p.active), perMonth));

export function planTarget(plan, positions, accounts) {
  const pos = planPosition(plan, positions), acc = planAccount(plan, accounts);
  if (pos) return { kind: 'depot', label: pos.short || pos.name, sub: `${pos.type} · ${pos.isin || ''}`.replace(/ · $/, ''), icon: 'candlestick-chart', toId: 'acc-depot', pos };
  if (plan?.instrumentName) return { kind: 'depot', label: plan.instrumentShort || plan.instrumentName, sub: `ETF · ${plan.isin || 'ohne ISIN'}`, icon: 'candlestick-chart', toId: 'acc-depot', pos: null };
  if (acc) return { kind: 'konto', label: acc.name, sub: acc.interestPa != null ? `Konto · ${String(acc.interestPa * 100).replace('.', ',')} % Zinsen` : 'Konto', icon: 'piggy-bank', toId: acc.id, acc };
  return { kind: 'frei', label: 'Ohne Zuordnung', sub: 'Noch kein Ziel-Konto', icon: 'wallet', toId: null };
}
const RHYTHM = { 1: 'monatlich', 3: 'vierteljährlich', 6: 'halbjährlich', 12: 'jährlich' };
export const rhythmLabel = (plan) => `${RHYTHM[plan.intervalMonths || 1] || `alle ${plan.intervalMonths} Monate`} am ${plan.day || 1}.`;
export const RHYTHMS = Object.entries(RHYTHM).map(([v, l]) => ({ value: Number(v), label: l[0].toUpperCase() + l.slice(1) }));

export function planStatus(plan) {
  if (plan.ended) return { id: 'beendet', label: 'Beendet', tone: 'neutral', icon: 'circle-slash' };
  if (plan.active) return { id: 'aktiv', label: 'Aktiv', tone: 'success', icon: 'check-circle-2' };
  if (plan.pausedUntil) return { id: 'pausiert', label: `Pausiert bis ${fmtDate(plan.pausedUntil)}`, tone: 'warning', icon: 'pause' };
  return { id: 'pausiert', label: 'Pausiert', tone: 'warning', icon: 'pause' };
}

// --- Ausführungen -------------------------------------------------------------------
/** Menge der bereits bestätigten Ausführungen („planId|YYYY-MM-DD“) aus den Buchungen. */
export const confirmedSet = (transactions) => new Set(arr(transactions).filter((t) => t.planId && t.execDate).map((t) => `${t.planId}|${t.execDate}`));

function nominalOf(plan, shifted) {
  const day = plan.day || 1;
  for (const off of [0, -1]) {
    const m = addMonths(new Date(shifted.getFullYear(), shifted.getMonth(), 1), off);
    const nom = new Date(m.getFullYear(), m.getMonth(), Math.min(day, daysInMonth(m.getFullYear(), m.getMonth())));
    const gap = dayDiff(nom, shifted);
    if (gap >= 0 && gap <= 6) return nom;
  }
  return shifted;
}

/** Kommende Ausführungen eines Plans ab „from“ (Handelstag-Verschiebung, Pause beachtet). */
export function planExecutions(plan, from, count = 6, confirmed = new Set()) {
  if (!plan || plan.ended) return [];
  let start = dayStart(from);
  if (!plan.active) { if (!plan.pausedUntil) return []; const pu = dayStart(plan.pausedUntil); if (dayDiff(start, pu) > 0) start = pu; }
  const raw = nextExecutions({ day: plan.day || 1, intervalMonths: plan.intervalMonths || 1 }, start, count + 3 + confirmed.size);
  const out = [];
  for (const r of raw) {
    const date = nextTradingDay(r), iso = toIsoDay(date);
    if (confirmed.has(`${plan.id}|${iso}`)) continue;
    const nominal = nominalOf(plan, r);
    out.push({ planId: plan.id, plan, date, iso, nominal, shifted: toIsoDay(nominal) !== iso, why: holidayName(nominal) || holidayName(addDays(date, -1)), amount: perExecution(plan) });
    if (out.length >= count) break;
  }
  return out;
}

/** Alle kommenden Ausführungen aller Pläne, nach Datum sortiert. */
export function allExecutions(plans, from, { perPlan = 14, until } = {}, confirmed = new Set()) {
  const list = arr(plans).flatMap((p) => planExecutions(p, from, perPlan, confirmed));
  const lim = until ? dayStart(until) : null;
  return list.filter((e) => !lim || dayDiff(e.date, lim) >= 0).sort((a, b) => a.date - b.date || a.plan.name.localeCompare(b.plan.name));
}

const stripPrefix = (t) => String(t || '').replace(/^(Sparplan|Dauerauftrag)\s+/i, '').toLowerCase();
/** Gehört eine Buchung zu einem Plan? (planId oder Name/Wertpapier im Buchungstitel) */
export function txMatchesPlan(tx, plan, pos) {
  if (tx.type !== 'transfer' || tx.category !== 'Sparen') return false;
  if (tx.planId) return tx.planId === plan.id;
  const core = stripPrefix(tx.title);
  return !!core && (core === String(pos?.short || '').toLowerCase() || String(pos?.name || '').toLowerCase().includes(core) || String(plan.name).toLowerCase().includes(core) || core.includes(String(plan.name).toLowerCase().split(' ')[0]));
}
export const pastExecutions = (plan, transactions, positions) => arr(transactions).filter((t) => txMatchesPlan(t, plan, planPosition(plan, positions))).sort((a, b) => (a.date < b.date ? 1 : -1));

// --- Verlauf & Kennzahlen (Modell auf Basis von Rate, Dynamik und Position) ---------------
export function monthsActive(plan, today) {
  const s = toDate(plan.startDate), t = dayStart(today);
  if (Number.isNaN(s.getTime()) || dayDiff(s, t) < 0) return 0;
  return Math.max(0, (t.getFullYear() - s.getFullYear()) * 12 + t.getMonth() - s.getMonth() + (t.getDate() >= s.getDate() ? 1 : 0));
}

function solveRate(m0, dynamicPa, n, target) {
  let lo = -0.6, hi = 0.8;
  for (let i = 0; i < 36; i++) { const mid = (lo + hi) / 2; const v = projectSavings({ monthly: m0, ratePa: mid, years: n / 12, dynamicPa }).value; if (v < target) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}

/**
 * Verlauf seit Start: Einzahlungen und Wert je Monat. Rate rückwärts aus Dynamik; bei Wertpapier-Plänen auf Einstand
 * und Wert der Position abgestimmt (implizite, gleichbleibende Rendite). Konto-Pläne: Zinsannahme des Plans.
 */
export function planHistory(plan, { positions, today }) {
  const n = monthsActive(plan, today);
  if (n < 1) return null;
  const dyn = plan.dynamicPa || 0, Y = Math.floor((n - 1) / 12);
  const m0 = plan.monthly / Math.pow(1 + dyn, Y), pos = planPosition(plan, positions);
  let start = m0, ratePa = plan.expectedReturnPa || 0;
  if (pos) {
    const flat = projectSavings({ monthly: m0, ratePa: 0, years: n / 12, dynamicPa: dyn });
    start = flat.invested ? m0 * (pos.cost / flat.invested) : m0;
    ratePa = solveRate(start, dyn, n, pos.value);
  }
  const p = projectSavings({ monthly: start, ratePa, years: n / 12, dynamicPa: dyn });
  return { n, ratePa, series: p.series, invested: p.invested, value: p.value, gain: p.gain, pos };
}

/** Kennzahlen für Listen: Position (echt) bzw. Modell bei Konto-Plänen. */
export function planStats(plan, { positions, accounts, today }) {
  const pos = planPosition(plan, positions);
  if (pos) return { invested: pos.cost, value: pos.value, gain: pos.gain, ratio: pos.cost ? pos.gain / pos.cost : 0, model: false };
  const h = planHistory(plan, { positions, today });
  if (!h) return { invested: 0, value: 0, gain: 0, ratio: 0, model: true };
  return { invested: h.invested, value: h.value, gain: h.gain, ratio: h.invested ? h.gain / h.invested : 0, model: true };
}

/** Jahrestag der Ratenerhöhung (Dynamik): nächstes Datum und neue Rate. */
export function nextRaise(plan, today) {
  if (!plan.active || !(plan.dynamicPa > 0)) return null;
  const s = toDate(plan.startDate), t = dayStart(today);
  let d = new Date(t.getFullYear(), s.getMonth(), s.getDate());
  if (dayDiff(t, d) <= 0) d = new Date(t.getFullYear() + 1, s.getMonth(), s.getDate());
  return { date: d, from: plan.monthly, to: r2(plan.monthly * (1 + plan.dynamicPa)) };
}

// --- Sparziele ---------------------------------------------------------------------------------
export const monthsBetween = (a, b) => {
  const x = dayStart(a), y = dayStart(b);
  return Math.max(0, (y.getFullYear() - x.getFullYear()) * 12 + y.getMonth() - x.getMonth() - (y.getDate() < x.getDate() ? 1 : 0));
};
const GOAL_RATE_FALLBACK = 0;

/** Prognose eines Ziels: voraussichtliches Datum, nötige Rate, Status (im Plan / hinterher / erreicht / ohne Rate). */
export function goalForecast(goal, plans, today) {
  const linked = arr(plans).filter((p) => p.goalId === goal.id);
  const ratePa = linked.length ? (linked.find((p) => p.active) || linked[0]).expectedReturnPa ?? GOAL_RATE_FALLBACK : GOAL_RATE_FALLBACK;
  const monthly = goal.monthly || 0;
  const target = goal.target, current = goal.current || 0;
  const progress = target > 0 ? clamp(current / target, 0, 1) : 0;
  const due = goal.due ? toDate(goal.due) : null;
  const left = due ? monthsBetween(today, due) : null;
  const resume = linked.find((p) => !p.active && p.pausedUntil)?.pausedUntil;
  const offset = goal.paused && resume ? monthsBetween(today, resume) : 0;
  const m2g = current >= target ? 0 : monthly > 0 ? monthsToGoal({ target, current, monthly, ratePa }) + offset : Infinity;
  const eta = Number.isFinite(m2g) ? addMonths(dayStart(today), m2g) : null;
  const required = due && left != null && current < target ? requiredMonthly({ target, current, months: Math.max(1, left), ratePa }) : 0;
  let status = 'im Plan';
  if (current >= target) status = 'erreicht';
  else if (!monthly) status = 'ohne Rate';
  else if (due && eta && dayDiff(eta, due) < 0) status = 'hinterher';
  return { goal, linked, ratePa, monthly, progress, due, left, eta, months: m2g, required, missing: Math.max(0, target - current), status, paused: !!goal.paused, resume,
    tone: { 'im Plan': 'success', erreicht: 'success', hinterher: 'warning', 'ohne Rate': 'warning' }[status], gap: Math.max(0, required - monthly) };
}

// --- Aktionen auf Weltdaten (setData) -------------------------------------------------------------
export const patchPlan = (setData, id, patch) => setData('plans', (list) => arr(list).map((p) => (p.id === id ? { ...p, ...patch } : p)));
export const pauseUntil = (today, months) => (months ? toIsoDay(addMonths(dayStart(today), months)) : null);

/** Ausführung bestätigen: Umbuchung, Position (Stück/Einstand) und Kontostände fortschreiben. Liefert eine Rückgängig-Funktion. */
export function confirmExecution({ ex, positions, accounts, setData, today, ctx }) {
  const plan = ex.plan, pos = planPosition(plan, positions), tgt = planTarget(plan, positions, accounts);
  const from = fromAccountId(plan), amt = ex.amount, id = sid('t', ctx);
  const day = dayDiff(ex.date, today) < 0 ? ex.date : dayStart(today);
  const tx = { id, date: `${toIsoDay(day)}T07:00:00`, title: `Sparplan ${plan.name}`, category: 'Sparen', amount: -amt, account: from, type: 'transfer', to: tgt.toId, planId: plan.id, execDate: ex.iso, icon: 'piggy-bank' };
  setData('transactions', (l) => [tx, ...arr(l)]);
  const bump = (list, f) => arr(list).map(f);
  if (pos) setData('positions', (l) => bump(l, (p) => (p.id !== pos.id ? p : (() => { const quantity = r2(p.quantity + amt / p.price), cost = r2(p.cost + amt), value = r2(quantity * p.price); return { ...p, quantity, cost, value, gain: r2(value - cost), gainPct: cost ? (value - cost) / cost : 0 }; })())));
  setData('accounts', (l) => bump(l, (a) => (a.id === from ? { ...a, balance: r2(a.balance - amt) } : a.id === tgt.toId ? { ...a, balance: r2(a.balance + amt) } : a)));
  return () => {
    setData('transactions', (l) => arr(l).filter((t) => t.id !== id));
    if (pos) setData('positions', (l) => bump(l, (p) => (p.id === pos.id ? pos : p)));
    setData('accounts', (l) => bump(l, (a) => (a.id === from ? { ...a, balance: r2(a.balance + amt) } : a.id === tgt.toId ? { ...a, balance: r2(a.balance - amt) } : a)));
  };
}

/** Plan pausieren/fortsetzen und das verknüpfte Ziel mitführen (Rate, Pause-Kennzeichen). */
export function setPlanActive({ setData, plan, plans, active, until = null }) {
  patchPlan(setData, plan.id, { active, pausedUntil: active ? null : until });
  if (!plan.goalId) return;
  const others = arr(plans).filter((p) => p.goalId === plan.goalId && p.id !== plan.id && p.active);
  const monthly = sum(others, perMonth) + (active || !others.length ? plan.monthly : 0);
  setData('goals', (l) => arr(l).map((g) => (g.id === plan.goalId ? { ...g, monthly, paused: !active && !others.length } : g)));
}
