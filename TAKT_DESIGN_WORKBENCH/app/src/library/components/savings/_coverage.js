// Sparpläne – Deckungs-Check: Reicht das Girokonto am Ausführungstag? (Kontostand, Fixkosten, Sparraten, erwartetes Einkommen, Puffer)
// Vereinfachtes Modell – Kartenabrechnung und variable Ausgaben stecken im Puffer. Herleitung wird in der Oberfläche gezeigt.
import { dayStart, addDays, dayDiff, toIsoDay, daysInMonth, toDate } from '../../../lib/date.js';
import { arr, r2 } from './_savings.js';
import { allExecutions, confirmedSet, fromAccountId } from './_plans.js';

export const BUFFERS = [0, 500, 1000, 2500];
export const DEFAULT_BUFFER = 1000;

const monthDay = (y, m, day) => new Date(y, m, Math.min(day, daysInMonth(y, m)));

/** Monatliche Termine eines Tags im Zeitraum [from, to]. */
function monthlyDates(day, from, to) {
  const out = [];
  for (let k = 0; k < 4; k++) {
    const d = monthDay(from.getFullYear(), from.getMonth() + k, day);
    if (dayDiff(from, d) >= 0 && dayDiff(d, to) >= 0) out.push(d);
  }
  return out;
}

/** Konto, von dem ein Abo abgebucht wird (aus den Buchungen); sonst unbekannt. */
const payerOf = (sub, transactions) => arr(transactions).find((t) => t.subscriptionId === sub.id)?.account || null;

/**
 * Deckungsprüfung für die nächsten Tage.
 * @returns {{giro:object|null, start:number, buffer:number, rows:object[], problem:object|null, tight:object|null, events:object[]}}
 */
export function coverageCheck({ plans, accounts, subscriptions, transactions, today, buffer = DEFAULT_BUFFER, horizonDays = 45 }) {
  const giro = arr(accounts).find((a) => a.type === 'giro');
  const t0 = dayStart(today), until = addDays(t0, horizonDays);
  if (!giro) return { giro: null, start: 0, buffer, rows: [], problem: null, tight: null, events: [] };
  const confirmed = confirmedSet(transactions);
  const events = [];
  for (const ex of allExecutions(plans, t0, { perPlan: 4, until }, confirmed)) {
    if (fromAccountId(ex.plan) === giro.id) events.push({ date: ex.date, kind: 'sparen', title: ex.plan.name, amount: -ex.amount, planId: ex.planId });
  }
  for (const s of arr(subscriptions)) {
    if (s.business || (s.interval && s.interval !== 'monatlich') || payerOf(s, transactions) !== giro.id) continue;
    for (const d of monthlyDates(s.day || 1, t0, until)) events.push({ date: d, kind: 'fix', title: s.name, amount: -s.amount });
  }
  const inc = arr(transactions).filter((t) => t.type === 'income' && t.account === giro.id && t.category === 'Einnahmen').sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  if (inc) for (const d of monthlyDates(toDate(inc.date).getDate(), t0, until)) events.push({ date: d, kind: 'einkommen', title: `${inc.title} (wie im Vormonat)`, amount: inc.amount });
  // Wiederkehrende Privatentnahme (Umbuchung Geschäftskonto → Girokonto, Kategorie „Umbuchung“): kein Einkommen in der Statistik, aber ein echter Zufluss für die Deckung.
  const draw = arr(transactions).filter((t) => t.type === 'transfer' && t.account === giro.id && t.amount > 0 && t.category === 'Umbuchung' && t.from).sort((x, y) => (x.date < y.date ? 1 : -1))[0];
  if (draw) for (const d of monthlyDates(toDate(draw.date).getDate(), t0, until)) events.push({ date: d, kind: 'einkommen', title: `${draw.title} (wie im Vormonat)`, amount: draw.amount });
  events.sort((a, b) => a.date - b.date || (a.kind === 'einkommen' ? -1 : 1));

  const days = new Map();
  for (const e of events) { const k = toIsoDay(e.date); if (!days.has(k)) days.set(k, []); days.get(k).push(e); }
  let bal = giro.balance, fixed = 0, saved = 0, inflow = 0;
  const rows = [];
  for (const [iso, list] of [...days.entries()].sort()) {
    for (const e of list) { bal += e.amount; if (e.kind === 'fix') fixed += -e.amount; else if (e.kind === 'sparen') saved += -e.amount; else inflow += e.amount; }
    const sp = list.filter((e) => e.kind === 'sparen');
    if (!sp.length) continue;
    const free = r2(bal - buffer), short = free < 0 ? r2(-free) : 0;
    rows.push({ iso, date: list[0].date, items: sp, sparTotal: r2(sp.reduce((s, e) => s - e.amount, 0)), balance: r2(bal), free, short, fixed: r2(fixed), saved: r2(saved), inflow: r2(inflow),
      status: short > 0 ? 'fehlt' : free < 250 ? 'knapp' : 'ok' });
  }
  return { giro, start: giro.balance, buffer, rows, problem: rows.find((r) => r.status === 'fehlt') || null, tight: rows.find((r) => r.status === 'knapp') || null, events };
}

export const COVER_TONE = { ok: 'success', knapp: 'warning', fehlt: 'warning' };
export const COVER_LABEL = { ok: 'Gedeckt', knapp: 'Knapp', fehlt: 'Deckung fehlt' };
export const COVER_ICON = { ok: 'check-circle-2', knapp: 'alert-circle', fehlt: 'alert-triangle' };
