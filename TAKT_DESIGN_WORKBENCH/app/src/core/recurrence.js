// ============================================================================
// WIEDERHOLUNGSREGELN – nächste Termine und deutscher Klartext. Rein, ohne DOM.
//
// Regelobjekt:
//   freq        'daily' | 'weekly' | 'monthly' | 'yearly' | 'afterDone'
//   interval    jede n-te Periode (Standard 1)
//   byWeekday   [1..7], 1 = Montag … 7 = Sonntag (weekly: Wochentage; monthly: zusammen mit bySetPos)
//   byMonthDay  Tag im Monat 1..31 oder -1 = letzter Tag (monthly, yearly); zu große Tage rutschen aufs Monatsende
//   bySetPos    n-ter Wochentag im Monat (1..4) oder -1 = letzter; gilt für jeden Wochentag aus byWeekday einzeln
//   byMonth     Monat 1..12 (yearly; sonst Monat des Startdatums)
//   start       Ankertermin 'YYYY-MM-DD' (Standard: der Tag von `from`); legt fest, wo Intervalle zu zählen beginnen
//   until       letzter erlaubter Tag 'YYYY-MM-DD' (einschließlich)
//   count       Gesamtzahl der Termine ab Anker (übersprungene Feiertage zählen mit)
//   afterDoneDays  Abstand in Tagen nach Erledigung (freq 'afterDone')
//
// Termine behalten die lokale Uhrzeit von `from` – auch über die Sommerzeitwechsel.
// ============================================================================
import { toDate, dayStart, addDays, dayDiff, isoWeekday, startOfWeek, daysInMonth, toIsoDay, WEEKDAYS_LONG, MONTHS_LONG } from '../lib/date.js';
import { fmtDate } from '../lib/format.js';

/** Erlaubte Häufigkeiten. */
export const RECURRENCE_FREQS = ['daily', 'weekly', 'monthly', 'yearly', 'afterDone'];
const MAX_DAYS = 366 * 60;

const interval = (r) => Math.max(1, Math.floor(r.interval) || 1);
const weekdays = (r) => [...new Set((r.byWeekday || []).map(Number).filter((x) => x >= 1 && x <= 7))].sort((a, b) => a - b);
const withTime = (day, tpl) => new Date(day.getFullYear(), day.getMonth(), day.getDate(), tpl.getHours(), tpl.getMinutes(), tpl.getSeconds(), tpl.getMilliseconds());
/** Tag im Monat für „n“ (positiv) bzw. „n-ter von hinten“ (negativ), begrenzt auf den Monat. */
const monthDayTarget = (md, dim) => (md > 0 ? Math.min(md, dim) : Math.max(1, dim + md + 1));

/**
 * Prüft ein Regelobjekt.
 * @param {object} rule Regel
 * @returns {string[]} Fehlertexte (leer = gültig)
 */
export function validateRule(rule) {
  const errs = [];
  if (!rule || typeof rule !== 'object') return ['Regel fehlt'];
  if (!RECURRENCE_FREQS.includes(rule.freq)) errs.push(`Unbekannte Häufigkeit „${rule.freq}“`);
  if (rule.interval !== undefined && !(Number.isInteger(rule.interval) && rule.interval >= 1)) errs.push('interval muss eine ganze Zahl ab 1 sein');
  if ((rule.byWeekday || []).some((x) => !(Number.isInteger(x) && x >= 1 && x <= 7))) errs.push('byWeekday erlaubt nur 1 (Montag) bis 7 (Sonntag)');
  if (rule.byMonthDay !== undefined && !(Number.isInteger(rule.byMonthDay) && rule.byMonthDay !== 0 && rule.byMonthDay >= -31 && rule.byMonthDay <= 31)) errs.push('byMonthDay: 1 bis 31 oder -1');
  if (rule.bySetPos !== undefined && !(Number.isInteger(rule.bySetPos) && rule.bySetPos !== 0 && Math.abs(rule.bySetPos) <= 5)) errs.push('bySetPos: 1 bis 5 oder -1');
  if (rule.until && Number.isNaN(toDate(rule.until).getTime())) errs.push('until ist kein Datum');
  if (rule.count !== undefined && !(Number.isInteger(rule.count) && rule.count >= 1)) errs.push('count muss eine ganze Zahl ab 1 sein');
  if (rule.freq === 'afterDone' && !(rule.afterDoneDays >= 1)) errs.push('afterDoneDays fehlt');
  return errs;
}

function matches(rule, day, anchor) {
  const iv = interval(rule);
  switch (rule.freq) {
    case 'daily': return dayDiff(anchor, day) % iv === 0;
    case 'weekly': {
      const weeks = Math.round(dayDiff(startOfWeek(anchor), startOfWeek(day)) / 7);
      const wds = weekdays(rule); if (!wds.length) wds.push(isoWeekday(anchor));
      return weeks % iv === 0 && wds.includes(isoWeekday(day));
    }
    case 'monthly': {
      if ((((day.getFullYear() - anchor.getFullYear()) * 12 + day.getMonth() - anchor.getMonth())) % iv !== 0) return false;
      const dim = daysInMonth(day.getFullYear(), day.getMonth()), date = day.getDate();
      const wds = weekdays(rule);
      if (rule.bySetPos !== undefined || (wds.length && rule.byMonthDay === undefined)) {
        if (!wds.length) wds.push(isoWeekday(anchor));
        if (!wds.includes(isoWeekday(day))) return false;
        if (rule.bySetPos === undefined) return true;
        const fromEnd = Math.floor((dim - date) / 7);        // 0 = letzter dieser Wochentage im Monat
        if (rule.bySetPos < 0) return fromEnd === -rule.bySetPos - 1;
        const nth = Math.ceil(date / 7), total = nth + fromEnd;
        return nth === Math.min(rule.bySetPos, total);       // 5. Wochentag gibt es nicht immer: dann der letzte
      }
      return date === monthDayTarget(rule.byMonthDay ?? anchor.getDate(), dim);
    }
    case 'yearly': {
      if ((day.getFullYear() - anchor.getFullYear()) % iv !== 0) return false;
      if (day.getMonth() !== (rule.byMonth ? rule.byMonth - 1 : anchor.getMonth())) return false;
      return day.getDate() === monthDayTarget(rule.byMonthDay ?? anchor.getDate(), daysInMonth(day.getFullYear(), day.getMonth()));
    }
    default: return false;
  }
}

/**
 * Die nächsten Termine einer Regel, beginnend mit dem Tag von `from` (einschließlich).
 * @param {object} rule Regelobjekt (siehe Dateikopf)
 * @param {Date|string|number} from Startzeitpunkt; dessen Uhrzeit bekommen alle Termine
 * @param {number} [n] Anzahl
 * @param {{holidays?:Array<Date|string>, skipHolidays?:boolean, lastDone?:Date|string|null}} [opts] holidays + skipHolidays lassen Termine auf Feiertagen aus; lastDone: letzte Erledigung (freq 'afterDone')
 * @returns {Date[]} Termine in Lokalzeit, aufsteigend (weniger als n, wenn until/count früher endet; leer bei ungültiger Regel)
 */
export function nextOccurrences(rule, from, n = 1, { holidays = [], skipHolidays = false, lastDone = null } = {}) {
  const out = [];
  const fromAt = toDate(from);
  if (!rule || !(n > 0) || Number.isNaN(fromAt.getTime()) || validateRule(rule).length) return out;
  const fromDay = dayStart(fromAt);
  const until = rule.until ? dayStart(rule.until) : null;
  const skip = skipHolidays ? new Set(holidays.map(toIsoDay)) : null;
  const room = () => out.length < n;
  let seq = 0;
  const take = (day) => {                                    // false = Reihe zu Ende
    if (until && day > until) return false;
    seq += 1;
    if (rule.count && seq > rule.count) return false;
    if (day >= fromDay && !(skip && skip.has(toIsoDay(day)))) out.push(withTime(day, fromAt));
    return true;
  };
  if (rule.freq === 'afterDone') {
    const step = Math.max(1, Math.floor(rule.afterDoneDays) || 1);
    let day = lastDone ? addDays(dayStart(lastDone), step) : fromDay;
    if (day < fromDay) day = fromDay;                        // überfällig: ab heute
    for (let i = 0; i < MAX_DAYS && room() && take(day); i++) day = addDays(day, step);
    return out;
  }
  const anchor = rule.start ? dayStart(rule.start) : fromDay;
  let day = rule.count || anchor > fromDay ? anchor : fromDay;  // ohne count genügt es, ab `from` zu suchen
  for (let i = 0; i < MAX_DAYS && room(); i++, day = addDays(day, 1)) {
    if (until && day > until) break;
    if (matches(rule, day, anchor) && !take(day)) break;
  }
  return out;
}

const list = (names) => (names.length > 1 ? `${names.slice(0, -1).join(', ')} und ${names[names.length - 1]}` : names[0]);
const wdName = (n) => WEEKDAYS_LONG[n - 1];

/**
 * Deutscher Klartext zu einer Regel, z. B. „jeden 2. Dienstag“, „jeden Monat am letzten Freitag“,
 * „monatlich am 31. (in kürzeren Monaten am Monatsende)“, „3 Tage nach Erledigung“, „täglich, bis 31.12.2026, 10-mal“.
 * @param {object} rule Regelobjekt
 * @returns {string} Beschreibung
 */
export function describeRule(rule) {
  if (!rule || !RECURRENCE_FREQS.includes(rule.freq)) return 'keine Wiederholung';
  const iv = interval(rule), wds = weekdays(rule);
  let t;
  if (rule.freq === 'daily') t = iv === 1 ? 'täglich' : `alle ${iv} Tage`;
  else if (rule.freq === 'afterDone') { const d = Math.max(1, Math.floor(rule.afterDoneDays) || 1); t = `${d} ${d === 1 ? 'Tag' : 'Tage'} nach Erledigung`; }
  else if (rule.freq === 'weekly') {
    if (!wds.length) t = iv === 1 ? 'wöchentlich' : `alle ${iv} Wochen`;
    else if (wds.length === 7 && iv === 1) t = 'täglich';
    else if (iv === 1 && wds.join() === '1,2,3,4,5') t = 'werktags (Mo–Fr)';
    else if (wds.length === 1) t = iv === 1 ? `jeden ${wdName(wds[0])}` : `jeden ${iv}. ${wdName(wds[0])}`;
    else t = `${iv === 1 ? 'wöchentlich' : `alle ${iv} Wochen`} am ${list(wds.map(wdName))}`;
  } else if (rule.freq === 'monthly') {
    const every = iv === 1 ? 'jeden Monat' : `alle ${iv} Monate`, mon = iv === 1 ? 'monatlich' : `alle ${iv} Monate`;
    const md = rule.byMonthDay;
    if (rule.bySetPos !== undefined) {
      const pos = rule.bySetPos < 0 ? (rule.bySetPos === -1 ? 'letzten' : `${-rule.bySetPos}. letzten`) : `${rule.bySetPos}.`;
      t = `${every} am ${pos} ${wds.length ? list(wds.map(wdName)) : 'Wochentag'}`;
    } else if (md === -1) t = `${mon} am letzten Tag des Monats`;
    else if (md > 28) t = `${mon} am ${md}. (in kürzeren Monaten am Monatsende)`;
    else if (md > 0) t = `${mon} am ${md}.`;
    else if (wds.length) t = `${mon} an jedem ${list(wds.map(wdName))}`;
    else t = mon;
  } else {
    const every = iv === 1 ? 'jährlich' : `alle ${iv} Jahre`;
    const m = rule.byMonth || (rule.start ? toDate(rule.start).getMonth() + 1 : 0), d = rule.byMonthDay ?? (rule.start ? toDate(rule.start).getDate() : 0);
    t = m && d > 0 ? `${every} am ${d}. ${MONTHS_LONG[m - 1]}${m === 2 && d === 29 ? ' (sonst 28.)' : ''}` : every;
  }
  if (rule.until) t += `, bis ${fmtDate(rule.until)}`;
  if (rule.count) t += `, ${rule.count}-mal`;
  return t;
}
