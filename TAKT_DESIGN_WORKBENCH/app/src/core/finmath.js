// ============================================================================
// FINANZMATHEMATIK – reiner Rechenkern für Finanzen, Sparpläne, Trading.
// Getestet in tools/test-finmath.mjs (npm run check führt die Tests aus).
// Alle Ergebnisse sind Simulationen/Modellrechnungen – keine Anlage- oder Steuerberatung.
// Konventionen: Zinssätze p. a. als Dezimalzahl (0.07 = 7 %), monatliche Verzinsung,
// Einzahlung am Monatsende (nachschüssig), Beträge in Euro, gerundet erst in der Anzeige.
// Verzinsung (Option `compounding`): 'effektiv' (Standard) = p. a. ist die tatsächliche Jahresrendite, der Monatszins
// ist die zwölfte Wurzel; 'nominal' = Jahreszins geteilt durch 12 (so rechnen die meisten Sparplan-Rechner).
// Handelstage: Wochenenden und Börsenfeiertage (Annahme, Stand siehe HANDELSTAGE) – Ausführungstermine rutschen
// auf den nächsten Handelstag. Details: docs/FINANCE_GUIDELINES.md (Abschnitte 3, 4, 8).
// ============================================================================

import { toDate, dayStart, addDays, daysInMonth, endOfMonth, dayDiff, toIsoDay } from '../lib/date.js';

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

// --- Verzinsungskonvention ---------------------------------------------------------------------
/** Standard der Workbench: effektiv (Rendite p. a. = tatsächliche Jahresrendite). Siehe FINANCE_GUIDELINES 4.3. */
export const COMPOUNDING_DEFAULT = 'effektiv';
/** Die beiden Konventionen mit Anzeigetexten (eine Quelle für Rechner, Hinweise und Dokumentation). */
export const COMPOUNDING = {
  effektiv: {
    id: 'effektiv', label: 'Effektiv',
    kurz: 'effektiv (p. a. = tatsächliche Jahresrendite)',
    text: 'Die Rendite p. a. ist die tatsächliche Jahresrendite nach Zinseszins; der Monatszins ist die zwölfte Wurzel daraus.',
  },
  nominal: {
    id: 'nominal', label: 'Nominal',
    kurz: 'nominal (p. a. ÷ 12 je Monat)',
    text: 'Der Jahreszins wird durch 12 geteilt und monatlich verzinst. Die tatsächliche Jahresrendite liegt dadurch etwas höher als der genannte Zins.',
  },
};
const assertCompounding = (c) => { if (!COMPOUNDING[c]) throw new RangeError(`Unbekannte Verzinsungskonvention „${c}“ (erlaubt: effektiv, nominal)`); return c; };

/**
 * Monatszins zu einem Jahreszins.
 * @param {number} ratePa Jahreszins als Dezimalzahl (0.05 = 5 %), bei Bedarf schon nach Kosten
 * @param {'effektiv'|'nominal'} [compounding='effektiv'] Konvention
 * @returns {number} Monatszins als Dezimalzahl
 */
export function monthlyRate(ratePa, compounding = COMPOUNDING_DEFAULT) {
  return assertCompounding(compounding) === 'nominal' ? ratePa / 12 : Math.pow(1 + ratePa, 1 / 12) - 1;
}

/** Tatsächliche Jahresrendite (nach Zinseszins) zu einem Jahreszins: nominal 5 % ergibt 5,116 %, effektiv bleibt 5 %. */
export function annualEffective(ratePa, compounding = COMPOUNDING_DEFAULT) {
  return Math.pow(1 + monthlyRate(ratePa, compounding), 12) - 1;
}

/**
 * Sparplan-Projektion (monatlich).
 * @param {object} p { monthly, initial=0, ratePa=0.06, years=10, costPa=0 (TER), dynamicPa=0 (jährliche Ratenerhöhung),
 *   compounding='effektiv' | 'nominal' (Verzinsungskonvention, siehe oben) }
 * @returns { series:[{ month, year, invested, value }], invested, value, gain, compounding }
 */
export function projectSavings({ monthly, initial = 0, ratePa = 0.06, years = 10, costPa = 0, dynamicPa = 0, compounding = COMPOUNDING_DEFAULT }) {
  const rm = monthlyRate(ratePa - costPa, compounding); // Monatszins nach Kosten
  let value = initial, invested = initial, rate = monthly;
  const series = [{ month: 0, year: 0, invested: r2(invested), value: r2(value) }];
  for (let m = 1; m <= Math.round(years * 12); m++) {
    if (m > 1 && (m - 1) % 12 === 0) rate *= 1 + dynamicPa;
    value = value * (1 + rm) + rate;
    invested += rate;
    series.push({ month: m, year: m / 12, invested: r2(invested), value: r2(value) });
  }
  return { series, invested: r2(invested), value: r2(value), gain: r2(value - invested), compounding };
}

/** Endwert einer nachschüssigen monatlichen Rente bei nominalem Jahreszins/12 (klassische Formel, für Referenztests). */
export function fvAnnuityNominal(monthly, ratePa, months) {
  const i = ratePa / 12;
  return i === 0 ? monthly * months : monthly * ((Math.pow(1 + i, months) - 1) / i);
}

/** Szenario-Spanne (pessimistisch / erwartet / optimistisch) – Endwerte. `base` darf `compounding` enthalten. */
export function savingsScenarios(base, rates = { pessimistisch: 0.02, erwartet: 0.06, optimistisch: 0.09 }) {
  return Object.fromEntries(Object.entries(rates).map(([k, ratePa]) => [k, projectSavings({ ...base, ratePa })]));
}

/** Monate bis zum Ziel (Infinity, wenn unerreichbar innerhalb von 100 Jahren). */
export function monthsToGoal({ target, current = 0, monthly, ratePa = 0, compounding = COMPOUNDING_DEFAULT }) {
  if (current >= target) return 0;
  const rm = monthlyRate(ratePa, compounding);
  let v = current;
  for (let m = 1; m <= 1200; m++) { v = v * (1 + rm) + monthly; if (v >= target) return m; }
  return Infinity;
}

/** Notwendige Monatsrate, um target in months zu erreichen. */
export function requiredMonthly({ target, current = 0, months, ratePa = 0, compounding = COMPOUNDING_DEFAULT }) {
  if (months <= 0) return Math.max(0, target - current);
  const rm = monthlyRate(ratePa, compounding);
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

// --- Handelstage -----------------------------------------------------------------------------------
/**
 * Annahme zu Börsenfeiertagen (Xetra) – vor Veröffentlichung prüfen. Gilt für 2026 bis 2028; für andere Jahre wird dieselbe
 * Regel angewendet, ist dort aber nicht geprüft. Stand der Annahme steht in `stand`.
 */
export const HANDELSTAGE = {
  stand: '2026-11-24', jahre: [2026, 2028],
  regel: 'Neujahr, Karfreitag, Ostermontag, 1. Mai, Heiligabend, 1. und 2. Weihnachtstag, Silvester; dazu Samstag und Sonntag.',
  hinweis: 'Annahme (Xetra-Handelskalender, Stand 24.11.2026), vor Veröffentlichung prüfen. Der tatsächliche Termin hängt von Broker oder Bank ab.',
};

/** Ostersonntag (gregorianisch, Meeus/Jones/Butcher) als lokales Datum. */
export function easterSunday(year) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/** Börsenfeiertage eines Jahres als [{ date: 'YYYY-MM-DD', name }], nach Datum sortiert (Annahme, siehe HANDELSTAGE). */
export function exchangeHolidays(year) {
  const easter = easterSunday(year), at = (d, name) => ({ date: toIsoDay(d), name });
  return [
    at(new Date(year, 0, 1), 'Neujahr'), at(addDays(easter, -2), 'Karfreitag'), at(addDays(easter, 1), 'Ostermontag'), at(new Date(year, 4, 1), 'Tag der Arbeit'),
    at(new Date(year, 11, 24), 'Heiligabend'), at(new Date(year, 11, 25), '1. Weihnachtstag'), at(new Date(year, 11, 26), '2. Weihnachtstag'), at(new Date(year, 11, 31), 'Silvester'),
  ].sort((x, y) => (x.date < y.date ? -1 : 1));
}

/** Börsenfeiertage 2026 bis 2028 (Annahme mit Stand, siehe HANDELSTAGE) als feste Liste. */
export const BOERSENFEIERTAGE = Object.freeze([2026, 2027, 2028].flatMap(exchangeHolidays));

const defaultNames = new Map(BOERSENFEIERTAGE.map((h) => [h.date, h.name]));
const yearNames = new Map();
const namesOfYear = (y) => { if (!yearNames.has(y)) yearNames.set(y, new Map(exchangeHolidays(y).map((h) => [h.date, h.name]))); return yearNames.get(y); };

/**
 * Feiertagsprüfung aus der Option `holidays`: fehlt sie, gelten die Börsenfeiertage (Annahme). Sonst Array, Set oder Map mit
 * Tagen 'YYYY-MM-DD' (Map: Tag → Name) oder eine Funktion (Tag → Name | true | false). Eine leere Liste heißt: nur Wochenenden.
 * @returns {(iso: string) => string} Feiertagsname, '' wenn kein Feiertag
 */
function holidayLookup(holidays) {
  if (holidays == null) return (iso) => defaultNames.get(iso) || namesOfYear(Number(iso.slice(0, 4))).get(iso) || '';
  if (typeof holidays === 'function') return (iso) => { const r = holidays(iso); return r ? (typeof r === 'string' ? r : 'Feiertag') : ''; };
  if (holidays instanceof Map) return (iso) => (holidays.has(iso) ? holidays.get(iso) || 'Feiertag' : '');
  const set = holidays instanceof Set ? holidays : new Set(holidays);
  return (iso) => (set.has(iso) ? 'Feiertag' : '');
}

/** Warum ist der Tag kein Handelstag? 'Wochenende', Name des Feiertags oder '' (Handelstag). */
export function nonTradingReason(date, opts) {
  const holidays = opts?.holidays;
  const d = toDate(date);
  if (Number.isNaN(d.getTime())) return '';
  const w = d.getDay();
  return w === 0 || w === 6 ? 'Wochenende' : holidayLookup(holidays)(toIsoDay(d));
}

/** Ist der Tag ein Handelstag (kein Wochenende, kein Börsenfeiertag)? */
export const isTradingDay = (date, opts = {}) => !Number.isNaN(toDate(date).getTime()) && !nonTradingReason(date, opts);

/**
 * Der Tag selbst, wenn Handelstag, sonst der nächste folgende Handelstag (lokale Mitternacht).
 * @param {Date|string} date Tag
 * @param {{ holidays?: Iterable<string>|Map|Function }} [opts] eigene Feiertage statt der Standardliste (siehe HANDELSTAGE)
 * @returns {Date} Handelstag; ungültiges Datum ergibt ein ungültiges Date
 */
export function nextTradingDay(date, opts) {
  let x = dayStart(date);
  if (Number.isNaN(x.getTime())) return x;
  for (let i = 0; i < 366; i++, x = addDays(x, 1)) if (isTradingDay(x, opts)) return x;
  throw new RangeError('Kein Handelstag innerhalb eines Jahres gefunden – Feiertagsliste prüfen');
}

/**
 * Nächste Ausführungstermine eines Sparplans: Tag im Monat, fällt er auf ein Wochenende oder einen Börsenfeiertag, rutscht
 * die Ausführung auf den nächsten Handelstag (auch über den Monatswechsel). Ein Termin zählt ab `from` (einschließlich),
 * gemessen am verschobenen Tag; danach folgt der Rhythmus (`intervalMonths`) ab diesem ersten Termin.
 * @param {{ day?: number, intervalMonths?: number }} plan Tag im Monat (1–31, zu große Tage zählen als Monatsende), Rhythmus
 * @param {Date|string} from Startdatum
 * @param {number} [count=6] Anzahl
 * @param {{ holidays?: Iterable<string>|Map|Function }} [opts] eigene Feiertage (leer = nur Wochenenden), sonst Standardliste
 * @returns {Date[]} Termine (lokale Mitternacht), aufsteigend
 */
export function nextExecutions({ day = 1, intervalMonths = 1 }, from, count = 6, opts = {}) {
  const start = dayStart(from), out = [];
  if (Number.isNaN(start.getTime())) return out;
  const step = Math.max(1, Math.round(intervalMonths) || 1), dom = Math.min(31, Math.max(1, Math.round(Number(day)) || 1)); // Tag im Monat: ganze Zahl 1–31, Ungültiges zählt als 1
  const at = (y, mo) => nextTradingDay(new Date(y, mo, Math.min(dom, daysInMonth(y, mo))), opts);
  const y0 = start.getFullYear(), m0 = start.getMonth();
  // Erster Termin: der nächste Handelstag-Termin ab `from`. Der Vormonat zählt mit, weil die Verschiebung ihn über `from`
  // hinaus schieben kann (z. B. Sa 31.10. → Mo 02.11.). Danach folgt der Rhythmus.
  let mo = m0 - 1;
  while (dayDiff(start, at(y0, mo)) < 0) mo += 1;
  for (let guard = 0; out.length < count && guard < 1200; guard++, mo += step) out.push(at(y0, mo));
  return out;
}

// --- Frei verfügbar ------------------------------------------------------------------------------------
/**
 * „Frei verfügbar bis Monatsende“ (FINANCE_GUIDELINES 11): Girosaldo − offene Kreditkarte − Abbuchungen bis Monatsende
 * − geplante Sparraten − Puffer. Die Posten kommen fertig (Auswahl der Konten und Termine ist Sache der Finanzen).
 * @returns { balance, cardOpen, fixedUpcoming, plannedSavings, reserve, free, daysLeft, perDay, end }
 */
export function safeToSpend({ balance, cardOpen = 0, fixedUpcoming = 0, plannedSavings = 0, reserve = 0, today }) {
  const end = endOfMonth(today), daysLeft = dayDiff(today, end) + 1;
  const free = r2(balance - cardOpen - fixedUpcoming - plannedSavings - reserve);
  return { balance: r2(balance), cardOpen: r2(cardOpen), fixedUpcoming: r2(fixedUpcoming), plannedSavings: r2(plannedSavings), reserve: r2(reserve), free, daysLeft, perDay: free > 0 ? r2(free / daysLeft) : 0, end };
}
