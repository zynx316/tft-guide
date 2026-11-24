// Gemeinsame Daten-Helfer für Bibliothekskomponenten (Filter, Suche, Gruppierung, Beträge/Prozente).
import { fmtMoney, fmtPercent, fmtPP, fmtNumber, maskMoney, NBSP } from '../lib/format.js';
export const toList = (v) => (Array.isArray(v) ? v : String(v || '').split(',').map((s) => s.trim()).filter(Boolean));

const norm = (s) => String(s ?? '').toLowerCase();

/**
 * Wendet den geteilten UI-Zustand (ctx.ui.query / ctx.ui.filter) auf eine Liste an.
 * Filter-Semantik: "Alle" = kein Filter, "Offen"/"Erledigt" = done-Flag,
 * sonst Abgleich gegen status/group/category/tags/priority/type.
 */
export function applyUiFilter(items, ui = {}, { searchFields = ['title', 'subtitle', 'text', 'meta', 'name'], respect = true } = {}) {
  if (!respect || !Array.isArray(items)) return items || [];
  let out = items;
  const q = norm(ui.query).trim();
  if (q) out = out.filter((it) => searchFields.some((f) => norm(it[f]).includes(q)) || (it.tags || []).some((t) => norm(t).includes(q)));
  const f = ui.filter;
  if (f && !/^alle?$/i.test(f)) {
    const lf = norm(f);
    if (lf === 'offen') out = out.filter((it) => !it.done);
    else if (lf === 'erledigt') out = out.filter((it) => it.done);
    else out = out.filter((it) => ['status', 'group', 'category', 'priority', 'type', 'tone'].some((k) => norm(it[k]) === lf) || (it.tags || []).some((t) => norm(t) === lf));
  }
  return out;
}

export function groupBy(items, keyFn) {
  const m = new Map();
  for (const it of items) { const k = keyFn(it); if (!m.has(k)) m.set(k, []); m.get(k).push(it); }
  return [...m.entries()];
}

export const nextId = (items, prefix = 'n') => `${prefix}${Date.now().toString(36)}${(items?.length || 0)}`;

// ----------------------------------------------------------------------------
// Beträge und Prozente: EIN Formatierweg. Alles läuft über lib/format.js (de-DE, geschütztes Leerzeichen,
// echtes Minus U+2212, nie „−0,00 €“, „–“ für fehlende Werte). Hier kommt nur der Privatsphäre-Modus dazu.
// Intl/toLocale* gehören nicht in Komponenten (tools/check.mjs meldet das).
// ----------------------------------------------------------------------------

/** Maske für ausgeblendete Prozente („•• %“): gleich breit, unabhängig vom Wert. */
export const MASK_PERCENT = `••${NBSP}%`;

const unitOf = (currency) => fmtMoney(0, { cents: false, currency }).split(NBSP)[1] || '';
const isWhole = (v) => Math.abs(v - Math.round(v)) < 0.005;

/**
 * Anzahl der Nachkommastellen aus den (alten und neuen) Optionen: `cents` (true | false | 0 | 2 | 'auto') hat Vorrang vor `digits`.
 * 'auto' = ohne Cent, wenn der Betrag ganze Euro ergibt. Rückgabe: Anzahl der Stellen.
 */
function placesOf(value, { cents, digits }) {
  if (cents !== undefined && cents !== null) {
    if (cents === 'auto') return isWhole(value) ? 0 : 2;
    if (typeof cents === 'number') return cents === 0 ? 0 : 2;
    return cents ? 2 : 0;
  }
  return Number.isInteger(digits) && digits >= 0 && digits <= 20 ? digits : 2;
}

/** Zusätzliche Kurzformen: money(ctx, v, 0) = { digits: 0 } · money(ctx, v, true) = { sign: true }. */
const optsOf = (o) => (typeof o === 'number' ? { digits: o } : typeof o === 'boolean' ? { sign: o } : o || {});

/**
 * Geldbetrag im deutschen Format – respektiert den Privatsphäre-Modus (ctx.privacy → „•••• €“, immer gleich breit).
 * Alle Finanz-Komponenten nutzen money() statt eigener Formatierung.
 * Optionen (alle optional, rückwärtskompatibel):
 *  - sign: true → „+12,50 €“ / „−12,50 €“ (Null und auf 0 gerundete Werte ohne Vorzeichen)
 *  - digits: 2 (Standard) | 0 (ganze Euro) | andere Anzahl Stellen
 *  - cents: true | false | 0 | 2 | 'auto' (Alternative zu digits; 'auto' = ohne Cent bei vollen Euro)
 *  - compact: true → ab 10.000 „12,3 Tsd. €“ / „1,2 Mio. €“
 *  - currency: 'EUR' (Standard), 'USD', 'GBP', 'CHF', 'JPY'
 * @param {{privacy?:boolean}|null|undefined} ctx Komponentenkontext
 * @param {number|null|undefined} value Betrag
 * @param {object|number|boolean} [opts] Optionen (Zahl = digits, true = sign)
 * @returns {string} Text, bei fehlendem Wert „–“
 */
export function money(ctx, value, opts) {
  const { sign = false, digits = 2, cents, compact = false, currency = 'EUR' } = optsOf(opts);
  if (ctx?.privacy) return maskMoney(`0${NBSP}${unitOf(currency)}`);
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  const places = placesOf(n, { cents, digits });
  const abbreviated = compact && typeof n === 'number' && Math.abs(n) >= 10000;   // compact hat auch bei digits 1/3/… Vorrang (wie bisher)
  if (places === 0 || places === 2 || abbreviated) return fmtMoney(n, { cents: places !== 0, sign, currency, compact });
  const num = fmtNumber(n, { digits: places, sign });
  return num === '–' ? num : `${num}${NBSP}${unitOf(currency)}`;
}

/**
 * Prozentwert aus einem Anteil (0,05 = 5 %) – standardmäßig mit Vorzeichen („+3,2 %“), ebenfalls maskierbar („•• %“).
 * Optionen: sign (Standard true), digits (Standard 1), pp: true → Prozentpunkte („+1,2 PP“, nie „%“).
 * @param {{privacy?:boolean}|null|undefined} ctx Komponentenkontext
 * @param {number|null|undefined} value Anteil
 * @param {{sign?:boolean, digits?:number, pp?:boolean}|number} [opts] Optionen (Zahl = digits)
 * @returns {string} Text, bei fehlendem Wert „–“
 */
export function percent(ctx, value, opts) {
  const { sign = true, digits = 1, pp = false } = typeof opts === 'number' ? { digits: opts } : opts || {};
  if (ctx?.privacy) return pp ? `••${NBSP}PP` : MASK_PERCENT;
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  return pp ? fmtPP(n, { digits, sign }) : fmtPercent(n, { digits, sign });
}
