// ============================================================================
// DATUMS-HELFER – rein, ohne DOM. Alles in Lokalzeit (kein toISOString für Tage,
// das wäre UTC). Kalendertage werden über die Datumsbestandteile gerechnet, nicht
// über Millisekunden-Differenzen – dadurch sind Sommerzeitwechsel (23/25-Stunden-Tage)
// kein Problem. Wochen beginnen am Montag.
// ============================================================================

/** Wochentagsnamen, Index 0 = Montag … 6 = Sonntag (ISO-Wochentag − 1). */
export const WEEKDAYS_LONG = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
/** Kurzformen, Index 0 = Montag … 6 = Sonntag. */
export const WEEKDAYS_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
/** Monatsnamen, Index 0 = Januar. */
export const MONTHS_LONG = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/;

/**
 * Liest 'YYYY-MM-DD' (optional mit 'THH:mm[:ss]') als lokales Datum. Ungültige Eingaben (auch 2026-02-30) ergeben null.
 * @param {string} s Datumstext
 * @returns {Date|null} lokales Datum oder null
 */
export function parseLocal(s) {
  const m = ISO_RE.exec(String(s ?? '').trim());
  if (!m) return null;
  const [y, mo, d, h = 0, mi = 0, se = 0] = m.slice(1).map((x) => (x === undefined ? 0 : Number(x)));
  const dt = new Date(y, mo - 1, d, h, mi, se);
  const ok = dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d && h < 24 && mi < 60 && se < 60;
  return ok ? dt : null;
}

/**
 * Macht aus Date, Zeitstempel oder ISO-Text ein neues Date (Text ohne Zeitzone wird lokal gelesen).
 * @param {Date|number|string} v Eingabe
 * @returns {Date} Kopie; bei ungültiger Eingabe ein „Invalid Date“
 */
export function toDate(v) {
  if (v === null || v === undefined || v === '') return new Date(NaN);
  if (v instanceof Date) return new Date(v.getTime());
  if (typeof v === 'string') { const p = parseLocal(v); if (p) return p; }
  return new Date(v);
}

/** Referenztag der Demo: Dienstag, 24.11.2026, 09:30 Uhr (Lokalzeit). */
export const DEFAULT_TODAY = new Date(2026, 10, 24, 9, 30, 0, 0);

/**
 * Beginn des Tages (00:00 Lokalzeit).
 * @param {Date|number|string} d Datum
 * @returns {Date} neues Date
 */
export function dayStart(d) { const x = toDate(d); return new Date(x.getFullYear(), x.getMonth(), x.getDate()); }

/**
 * Addiert Kalendertage; die lokale Uhrzeit bleibt erhalten, auch über Sommerzeitwechsel.
 * @param {Date|number|string} d Datum
 * @param {number} n Tage (auch negativ)
 * @returns {Date} neues Date
 */
export function addDays(d, n) { const x = toDate(d); x.setDate(x.getDate() + n); return x; }

/**
 * Kalendertage von a bis b (positiv, wenn b später liegt); Uhrzeiten und Sommerzeit spielen keine Rolle.
 * @param {Date|number|string} a Start
 * @param {Date|number|string} b Ende
 * @returns {number} ganze Tage
 */
export function dayDiff(a, b) {
  const x = toDate(a), y = toDate(b);
  return Math.round((Date.UTC(y.getFullYear(), y.getMonth(), y.getDate()) - Date.UTC(x.getFullYear(), x.getMonth(), x.getDate())) / 86400000);
}

/**
 * Wie weit liegt d vom Bezugstag entfernt? (positiv = Zukunft)
 * @param {Date|number|string} d Datum
 * @param {Date|number|string} [today] Bezugstag, Standard DEFAULT_TODAY
 * @returns {number} Tage
 */
export function relativeTo(d, today = DEFAULT_TODAY) { return dayDiff(today, d); }

/**
 * Gleicher Kalendertag?
 * @param {Date|number|string} a Datum
 * @param {Date|number|string} b Datum
 * @returns {boolean}
 */
export function isSameDay(a, b) { return dayDiff(a, b) === 0; }

/**
 * ISO-Wochentag: 1 = Montag … 7 = Sonntag.
 * @param {Date|number|string} d Datum
 * @returns {number} 1 bis 7
 */
export function isoWeekday(d) { return ((toDate(d).getDay() + 6) % 7) + 1; }

/**
 * Montag 00:00 der Woche, in der d liegt.
 * @param {Date|number|string} d Datum
 * @returns {Date} neues Date
 */
export function startOfWeek(d) { const x = dayStart(d); x.setDate(x.getDate() - (isoWeekday(x) - 1)); return x; }

/**
 * Schaltjahr nach gregorianischer Regel.
 * @param {number} year Jahr
 * @returns {boolean}
 */
export function isLeap(year) { return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0; }

/**
 * Anzahl der Tage eines Monats.
 * @param {number} year Jahr
 * @param {number} month Monat 0 bis 11
 * @returns {number} 28 bis 31
 */
export function daysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }

/**
 * Letzter Tag des Monats, in dem d liegt (00:00).
 * @param {Date|number|string} d Datum
 * @returns {Date} neues Date
 */
export function endOfMonth(d) { const x = toDate(d); return new Date(x.getFullYear(), x.getMonth() + 1, 0); }

/**
 * Addiert Monate; der Tag wird auf das Monatsende begrenzt (31.01. + 1 Monat = 28.02.), die Uhrzeit bleibt.
 * @param {Date|number|string} d Datum
 * @param {number} n Monate (auch negativ)
 * @returns {Date} neues Date
 */
export function addMonths(d, n) {
  const x = toDate(d);
  const first = new Date(x.getFullYear(), x.getMonth() + n, 1, x.getHours(), x.getMinutes(), x.getSeconds(), x.getMilliseconds());
  first.setDate(Math.min(x.getDate(), daysInMonth(first.getFullYear(), first.getMonth())));
  return first;
}

/**
 * Lokales Datum als 'YYYY-MM-DD' (nicht UTC).
 * @param {Date|number|string} d Datum
 * @returns {string} Tagesschlüssel
 */
export function toIsoDay(d) {
  const x = toDate(d);
  return `${String(x.getFullYear()).padStart(4, '0')}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}
