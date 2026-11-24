// ============================================================================
// FINANZMATHEMATIK – reiner Rechenkern für Finanzen, Sparpläne, Trading.
// Getestet in tools/test-finmath.mjs (npm run check führt die Tests aus).
// Alle Ergebnisse sind Simulationen/Modellrechnungen – keine Anlage- oder Steuerberatung.
// Konventionen: Zinssätze p. a. als Dezimalzahl (0.07 = 7 %), monatliche Verzinsung,
// Einzahlung am Monatsende (nachschüssig), Beträge in Euro, gerundet erst in der Anzeige.
// ============================================================================

/** Steuer-/Kostenannahmen Deutschland – Stand-Datum beachten, vor Nutzung prüfen. */
export const TAX_DE = {
  stand: '2026-01',
  abgeltungsteuer: 0.25, soli: 0.055, // effektiv 26,375 % ohne Kirchensteuer
  get effektiv() { return this.abgeltungsteuer * (1 + this.soli); },
  sparerPauschbetrag: { single: 1000, gemeinsam: 2000 },
  teilfreistellungAktienfonds: 0.30,
  hinweis: 'Vereinfachte Annahmen (Stand Januar 2026, ohne Kirchensteuer, ohne Vorabpauschale). Keine Steuerberatung.',
};

const r2 = (x) => Math.round(x * 100) / 100;

/**
 * Sparplan-Projektion (monatlich).
 * @param {object} p { monthly, initial=0, ratePa=0.06, years=10, costPa=0 (TER), dynamicPa=0 (jährliche Ratenerhöhung) }
 * @returns { series:[{ month, year, invested, value }], invested, value, gain }
 */
export function projectSavings({ monthly, initial = 0, ratePa = 0.06, years = 10, costPa = 0, dynamicPa = 0 }) {
  const rm = Math.pow(1 + ratePa - costPa, 1 / 12) - 1; // effektiver Monatszins
  let value = initial, invested = initial, rate = monthly;
  const series = [{ month: 0, year: 0, invested: r2(invested), value: r2(value) }];
  for (let m = 1; m <= Math.round(years * 12); m++) {
    if (m > 1 && (m - 1) % 12 === 0) rate *= 1 + dynamicPa;
    value = value * (1 + rm) + rate;
    invested += rate;
    series.push({ month: m, year: m / 12, invested: r2(invested), value: r2(value) });
  }
  return { series, invested: r2(invested), value: r2(value), gain: r2(value - invested) };
}

/** Endwert einer nachschüssigen monatlichen Rente bei nominalem Jahreszins/12 (klassische Formel, für Referenztests). */
export function fvAnnuityNominal(monthly, ratePa, months) {
  const i = ratePa / 12;
  return i === 0 ? monthly * months : monthly * ((Math.pow(1 + i, months) - 1) / i);
}

/** Szenario-Spanne (pessimistisch / erwartet / optimistisch) – Endwerte. */
export function savingsScenarios(base, rates = { pessimistisch: 0.02, erwartet: 0.06, optimistisch: 0.09 }) {
  return Object.fromEntries(Object.entries(rates).map(([k, ratePa]) => [k, projectSavings({ ...base, ratePa })]));
}

/** Monate bis zum Ziel (Infinity, wenn unerreichbar innerhalb von 100 Jahren). */
export function monthsToGoal({ target, current = 0, monthly, ratePa = 0 }) {
  if (current >= target) return 0;
  const rm = Math.pow(1 + ratePa, 1 / 12) - 1;
  let v = current;
  for (let m = 1; m <= 1200; m++) { v = v * (1 + rm) + monthly; if (v >= target) return m; }
  return Infinity;
}

/** Notwendige Monatsrate, um target in months zu erreichen. */
export function requiredMonthly({ target, current = 0, months, ratePa = 0 }) {
  if (months <= 0) return Math.max(0, target - current);
  const rm = Math.pow(1 + ratePa, 1 / 12) - 1;
  const grown = current * Math.pow(1 + rm, months);
  const factor = rm === 0 ? months : (Math.pow(1 + rm, months) - 1) / rm;
  return r2(Math.max(0, (target - grown) / factor));
}

/** Annuitätendarlehen: Tilgungsplan (monatlich). */
export function loanSchedule({ principal, ratePa, monthlyPayment, maxMonths = 600 }) {
  const i = ratePa / 12; let rest = principal; const rows = []; let totalInterest = 0;
  for (let m = 1; m <= maxMonths && rest > 0.005; m++) {
    const interest = rest * i; const pay = Math.min(monthlyPayment, rest + interest); const principalPart = pay - interest;
    if (principalPart <= 0) return { rows, months: Infinity, totalInterest: Infinity, error: 'Rate deckt die Zinsen nicht' };
    rest -= principalPart; totalInterest += interest;
    rows.push({ month: m, payment: r2(pay), interest: r2(interest), principal: r2(principalPart), rest: r2(Math.max(0, rest)) });
  }
  return { rows, months: rows.length, totalInterest: r2(totalInterest) };
}

/** Jährliche Rendite (CAGR). */
export const cagr = (start, end, years) => (start > 0 && years > 0 ? Math.pow(end / start, 1 / years) - 1 : 0);

/** Einfache Rendite einer Position. */
export function positionReturn({ quantity, buyPrice, price, dividends = 0 }) {
  const cost = quantity * buyPrice, value = quantity * price;
  return { cost: r2(cost), value: r2(value), gain: r2(value - cost + dividends), pct: cost ? (value - cost + dividends) / cost : 0 };
}

/** Steuer auf realisierten Gewinn (vereinfachte Schätzung, Aktienfonds-Teilfreistellung optional). */
export function estimateTax({ gain, allowanceLeft = TAX_DE.sparerPauschbetrag.single, equityFund = false }) {
  const taxable = Math.max(0, gain * (equityFund ? 1 - TAX_DE.teilfreistellungAktienfonds : 1) - allowanceLeft);
  return { taxable: r2(taxable), tax: r2(taxable * TAX_DE.effektiv), allowanceUsed: r2(Math.min(allowanceLeft, Math.max(0, gain * (equityFund ? 1 - TAX_DE.teilfreistellungAktienfonds : 1)))) };
}

/** Sparquote = (Einnahmen − Konsumausgaben) / Einnahmen; Umbuchungen (z. B. Sparplan) sind KEINE Ausgaben. */
export function savingsRate(transactions) {
  let income = 0, spend = 0;
  for (const t of transactions) {
    if (t.type === 'transfer') continue;
    if (t.amount > 0) income += t.amount; else spend += -t.amount;
  }
  return { income: r2(income), spend: r2(spend), rate: income ? (income - spend) / income : 0 };
}

/** Nächste Ausführungstermine eines Sparplans (Tag im Monat, Bankarbeitstag vereinfacht: Wochenende → Montag). */
export function nextExecutions({ day = 1, intervalMonths = 1 }, from, count = 6) {
  const out = []; const d = new Date(from); d.setHours(0, 0, 0, 0);
  let y = d.getFullYear(), mo = d.getMonth();
  if (d.getDate() > day) mo += 1;
  while (out.length < count) {
    const dt = new Date(y, mo, Math.min(day, new Date(y, mo + 1, 0).getDate()));
    const wd = dt.getDay(); if (wd === 6) dt.setDate(dt.getDate() + 2); if (wd === 0) dt.setDate(dt.getDate() + 1);
    out.push(dt); mo += intervalMonths; if (mo > 11) { y += Math.floor(mo / 12); mo %= 12; }
  }
  return out;
}
