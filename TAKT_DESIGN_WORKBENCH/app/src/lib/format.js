// ============================================================================
// FORMATSTANDARD (de-DE) – rein, ohne DOM. Einzige Stelle mit Intl.NumberFormat.
// Regeln: Tausenderpunkt, Dezimalkomma, geschütztes Leerzeichen (U+00A0) vor Einheit,
// Währung und Prozent, echtes Minus (U+2212), sign:true setzt „+“ bzw. „−“.
// Ein Wert, der nach dem Runden 0 ergibt, bekommt nie ein Minus („−0,00 €“ gibt es nicht).
// Fehlende oder ungültige Werte (null, NaN) werden als „–“ (Halbgeviertstrich) angezeigt.
// ============================================================================
import { toDate, dayDiff, isoWeekday, WEEKDAYS_SHORT, MONTHS_LONG } from './date.js';

/** Geschütztes Leerzeichen. */
export const NBSP = ' ';
/** Echtes Minuszeichen. */
export const MINUS = '−';
/** Platzhalter für fehlende Werte. */
export const DASH = '–';

const CURRENCY = { EUR: '€', USD: '$', GBP: '£', CHF: 'CHF', JPY: '¥' };
const nfCache = new Map();
function nf(min, max) {
  const key = `${min}|${max}`;
  if (!nfCache.has(key)) nfCache.set(key, new Intl.NumberFormat('de-DE', { minimumFractionDigits: min, maximumFractionDigits: max, useGrouping: true }));
  return nfCache.get(key);
}
const valid = (v) => typeof v === 'number' && Number.isFinite(v);
const clampDigits = (n, dflt) => (Number.isInteger(n) && n >= 0 && n <= 20 ? n : dflt);

/** Formatiert |v| mit fester Nachkommastellenzahl; zero ist wahr, wenn der gerundete Wert 0 ist. */
/** Kaufmännisch runden (halbe Werte weg von null) mit Gleitkomma-Korrektur: 1,005 → 1,01; −2,675 → −2,68. */
const roundHalfAway = (x, d) => { const f = 10 ** d; return Math.round((Math.abs(x) * f) * (1 + Number.EPSILON * 4)) / f; };
function body(v, digits) {
  const str = nf(digits, digits).format(roundHalfAway(v, digits));
  const zero = !/[1-9]/.test(str);
  return { str, zero };
}
/** Anteil → Prozentzahl ohne Gleitkomma-Rauschen (0,145 · 100 = 14,499999… wird 14,5). */
const pct = (v) => Number((v * 100).toPrecision(12));
const signOf = (v, zero, sign) => (zero ? '' : v < 0 ? MINUS : sign ? '+' : '');

/**
 * Geldbetrag: „1.234,50 €“, negativ „−12,00 €“, mit sign „+12,50 €“.
 * @param {number} v Betrag
 * @param {{cents?:boolean, sign?:boolean, currency?:string, compact?:boolean}} [o] cents=false rundet auf ganze Euro; compact kürzt ab 10.000 („12,3 Tsd. €“)
 * @returns {string} Text
 */
export function fmtMoney(v, { cents = true, sign = false, currency = 'EUR', compact = false } = {}) {
  if (!valid(v)) return DASH;
  const sym = CURRENCY[currency] || currency;
  const abs = Math.abs(v);
  if (compact && abs >= 10000) {
    const scales = [[1e3, 'Tsd.'], [1e6, 'Mio.'], [1e9, 'Mrd.']];
    let i = scales.reduce((k, [f], j) => (abs >= f ? j : k), 0);
    if (i < scales.length - 1 && /^1\.000,0$/.test(body(abs / scales[i][0], 1).str)) i += 1;   // 999.999,9 → „1,0 Mio. €“, nicht „1.000,0 Tsd. €“
    return `${signOf(v, false, sign)}${body(abs / scales[i][0], 1).str}${NBSP}${scales[i][1]}${NBSP}${sym}`;
  }
  const { str, zero } = body(v, cents ? 2 : 0);
  return `${signOf(v, zero, sign)}${str}${NBSP}${sym}`;
}

/**
 * Prozentwert aus einem Anteil: 0.05 → „5,0 %“.
 * @param {number} v Anteil (0.05 = 5 %)
 * @param {{digits?:number, sign?:boolean}} [o] Nachkommastellen, Vorzeichen
 * @returns {string} Text
 */
export function fmtPercent(v, { digits = 1, sign = false } = {}) {
  if (!valid(v)) return DASH;
  const { str, zero } = body(pct(v), clampDigits(digits, 1));
  return `${signOf(v, zero, sign)}${str}${NBSP}%`;
}

/**
 * Differenz in Prozentpunkten aus einem Anteil: 0.012 → „+1,2 PP“ (Vorzeichen standardmäßig an).
 * @param {number} v Differenz als Anteil
 * @param {{digits?:number, sign?:boolean}} [o] Nachkommastellen, Vorzeichen
 * @returns {string} Text
 */
export function fmtPP(v, { digits = 1, sign = true } = {}) {
  if (!valid(v)) return DASH;
  const { str, zero } = body(pct(v), clampDigits(digits, 1));
  return `${signOf(v, zero, sign)}${str}${NBSP}PP`;
}

/**
 * Zahl, optional mit Einheit. digits legt die Nachkommastellen fest; ohne Angabe sind es höchstens 2 (ohne Nullen am Ende).
 * @param {number} v Wert
 * @param {{unit?:string, digits?:number, sign?:boolean}} [o] Einheit, Stellen, Vorzeichen
 * @returns {string} Text
 */
export function fmtNumber(v, { unit, digits, sign = false } = {}) {
  if (!valid(v)) return DASH;
  let str;
  if (digits === undefined) str = nf(0, 2).format(Math.abs(v));
  else str = nf(clampDigits(digits, 0), clampDigits(digits, 0)).format(Math.abs(v));
  const zero = !/[1-9]/.test(str);
  return `${signOf(v, zero, sign)}${str}${unit ? NBSP + unit : ''}`;
}

/**
 * Gewicht in Kilogramm: „82,4 kg“.
 * @param {number} kg Gewicht
 * @param {{digits?:number, sign?:boolean}} [o] Stellen (Standard 1), Vorzeichen
 * @returns {string} Text
 */
export function fmtWeight(kg, { digits = 1, sign = false } = {}) { return fmtNumber(kg, { unit: 'kg', digits, sign }); }

/**
 * Dauer in Minuten: 85 → „1 Std. 25 Min.“, 45 → „45 Min.“, 120 → „2 Std.“.
 * @param {number} min Minuten (wird auf ganze Minuten gerundet)
 * @returns {string} Text
 */
export function fmtDuration(min) {
  if (!valid(min)) return DASH;
  const total = Math.round(Math.abs(min));
  const h = Math.floor(total / 60), m = total % 60;
  const parts = [];
  if (h) parts.push(`${nf(0, 0).format(h)}${NBSP}Std.`);
  if (m || !h) parts.push(`${m}${NBSP}Min.`);
  return `${total && min < 0 ? MINUS : ''}${parts.join(' ')}`;
}

const two = (n) => String(n).padStart(2, '0');
function asDate(d) { const x = toDate(d); return Number.isNaN(x.getTime()) ? null : x; }

/**
 * Datum. short „24.11.“, medium „24.11.2026“, long „24. November 2026“, weekday „Di, 24.11.“.
 * @param {Date|number|string} d Datum
 * @param {{style?:'short'|'medium'|'long'|'weekday'}} [o] Darstellung (Standard medium)
 * @returns {string} Text
 */
export function fmtDate(d, { style = 'medium' } = {}) {
  const x = asDate(d); if (!x) return DASH;
  const dd = two(x.getDate()), mm = two(x.getMonth() + 1);
  if (style === 'short') return `${dd}.${mm}.`;
  if (style === 'long') return `${x.getDate()}. ${MONTHS_LONG[x.getMonth()]} ${x.getFullYear()}`;
  if (style === 'weekday') return `${WEEKDAYS_SHORT[isoWeekday(x) - 1]}, ${dd}.${mm}.`;
  return `${dd}.${mm}.${x.getFullYear()}`;
}

/**
 * Uhrzeit 24-Stunden: „09:30“, mit suffix „09:30 Uhr“.
 * @param {Date|number|string} d Zeitpunkt
 * @param {{suffix?:boolean}} [o] „Uhr“ anhängen
 * @returns {string} Text
 */
export function fmtTime(d, { suffix = false } = {}) {
  const x = asDate(d); if (!x) return DASH;
  return `${two(x.getHours())}:${two(x.getMinutes())}${suffix ? `${NBSP}Uhr` : ''}`;
}

/**
 * Tag relativ zu heute: „heute“, „morgen“, „gestern“, „Do“ (2 bis 4 Tage), „in 5 Tagen“ (bis 13), „vor 3 Tagen“, sonst Datum.
 * @param {Date|number|string} d Tag
 * @param {Date|number|string} today Bezugstag
 * @returns {string} Text
 */
export function fmtRelativeDay(d, today) {
  const x = asDate(d), t = asDate(today); if (!x || !t) return DASH;
  const n = dayDiff(t, x);
  if (n === 0) return 'heute';
  if (n === 1) return 'morgen';
  if (n === -1) return 'gestern';
  if (n >= 2 && n <= 4) return WEEKDAYS_SHORT[isoWeekday(x) - 1];
  if (n >= 5 && n <= 13) return `in ${n} Tagen`;
  if (n <= -2 && n >= -13) return `vor ${-n} Tagen`;
  return fmtDate(x, { style: x.getFullYear() === t.getFullYear() ? 'short' : 'medium' });
}

/**
 * Gleich breite Maske für Beträge im Privatmodus; hängt eine Einheit am Ende („€“) an, damit nur der Betrag verborgen ist.
 * @param {string} [text] formatierter Betrag, z. B. „1.234,50 €“
 * @returns {string} „••••“ bzw. „••••“ + geschütztes Leerzeichen + Einheit
 */
export function maskMoney(text = '') {
  const unit = /[  ]([^\s\d,.+−-]{1,4})$/.exec(String(text));
  return `••••${unit ? NBSP + unit[1] : ''}`;
}

/**
 * Die 14 Referenzwerte des Formatstandards (Doku und Test). `run` erzeugt den Text, `expected` ist der Sollwert.
 * @type {Array<{id:string, call:string, run:() => string, expected:string}>}
 */
export const FORMAT_EXAMPLES = [
  { id: 'null', call: 'fmtMoney(0)', run: () => fmtMoney(0), expected: `0,00${NBSP}€` },
  { id: 'cent-minus', call: 'fmtMoney(-0.01)', run: () => fmtMoney(-0.01), expected: `${MINUS}0,01${NBSP}€` },
  { id: 'million', call: 'fmtMoney(1234567.89)', run: () => fmtMoney(1234567.89), expected: `1.234.567,89${NBSP}€` },
  { id: 'max', call: 'fmtMoney(9999999.99)', run: () => fmtMoney(9999999.99), expected: `9.999.999,99${NBSP}€` },
  { id: 'ganze-euro', call: 'fmtMoney(1234.5, {cents:false})', run: () => fmtMoney(1234.5, { cents: false }), expected: `1.235${NBSP}€` },
  { id: 'vorzeichen', call: 'fmtMoney(12.5, {sign:true})', run: () => fmtMoney(12.5, { sign: true }), expected: `+12,50${NBSP}€` },
  { id: 'prozent', call: 'fmtPercent(0.05)', run: () => fmtPercent(0.05), expected: `5,0${NBSP}%` },
  { id: 'halbes-prozent', call: 'fmtPercent(0.005)', run: () => fmtPercent(0.005), expected: `0,5${NBSP}%` },
  { id: 'prozent-minus', call: 'fmtPercent(-0.0123, {sign:true})', run: () => fmtPercent(-0.0123, { sign: true }), expected: `${MINUS}1,2${NBSP}%` },
  { id: 'prozentpunkte', call: 'fmtPP(0.012)', run: () => fmtPP(0.012), expected: `+1,2${NBSP}PP` },
  { id: 'ein-pp', call: 'fmtPP(0.01, {digits:0})', run: () => fmtPP(0.01, { digits: 0 }), expected: `+1${NBSP}PP` },
  { id: 'krypto', call: "fmtNumber(0.00001234, {unit:'BTC', digits:8})", run: () => fmtNumber(0.00001234, { unit: 'BTC', digits: 8 }), expected: `0,00001234${NBSP}BTC` },
  { id: 'dauer', call: 'fmtDuration(85)', run: () => fmtDuration(85), expected: `1${NBSP}Std. 25${NBSP}Min.` },
  { id: 'gewicht', call: 'fmtWeight(82.4)', run: () => fmtWeight(82.4), expected: `82,4${NBSP}kg` },
];
