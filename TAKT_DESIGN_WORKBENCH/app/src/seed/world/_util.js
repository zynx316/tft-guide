// Hilfen der Welt-Dateien (KEINE Welt-Schlüssel: index.js importiert diese Datei nicht als Welt).
// Alles rein und deterministisch – Referenztag Di, 24.11.2026 09:30, nie Date.now() oder Math.random().
import { fmtMoney, fmtNumber } from '../../lib/format.js';

export const TODAY = '2026-11-24';
export const NOW = '2026-11-24T09:30:00';
export const r2 = (x) => Math.round(x * 100) / 100;
const p2 = (n) => String(n).padStart(2, '0');

/** Tag um n Tage verschieben (ISO-Tag, Mittagszeit gegen Sommerzeit-Sprünge). */
export function addDay(iso, n) { const d = new Date(`${String(iso).slice(0, 10)}T12:00:00`); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`; }
/** Wochentag eines ISO-Tags, 0 = Montag … 6 = Sonntag. */
export const dowOf = (iso) => (new Date(`${String(iso).slice(0, 10)}T12:00:00`).getDay() + 6) % 7;
export const WD = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
/** ISO-Zeitstempel relativ zum Referenztag: `at(-1, '18:30')` = gestern 18:30. */
export const at = (offset, hhmm = '00:00') => `${addDay(TODAY, offset)}T${hhmm}:00`;

/** Euro ohne Cent („575 €“) bzw. mit Cent, mit geschütztem Leerzeichen. */
export const eur = (v, cents = false) => fmtMoney(v, { cents });
export const num = (v, digits) => fmtNumber(v, digits === undefined ? {} : { digits });

/**
 * Stress-Tag: Liste von Objekten verdreifachen (IDs der Kopien `<id>~2`, `<id>~3`, Titel verlängert).
 * Entspricht der generischen Umformung in core/world.js und dient Welt-Dateien, die abgeleitete Werte im Szenario neu berechnen.
 */
const LONG = ' – mit ausführlichem Zusatztext, der Umbrüche und Kürzungen auf schmalen Geräten prüft';
const TEXT_FIELDS = ['title', 'name', 'text', 'note', 'label', 'subtitle', 'description'];
export function triple(list) {
  if (!Array.isArray(list) || !list.length || typeof list[0] !== 'object') return list;
  const out = [];
  for (let copy = 1; copy <= 3; copy++) {
    for (const item of list) {
      const x = { ...item };
      if (copy > 1 && x.id != null) x.id = `${x.id}~${copy}`;
      if (copy > 1) for (const f of TEXT_FIELDS) if (typeof x[f] === 'string' && x[f].length > 2) { x[f] = x[f] + (f === 'title' || f === 'name' ? LONG : ''); break; }
      out.push(x);
    }
  }
  return out;
}

/** Ereignis (Serie, mehrtägig, ganztägig) am ISO-Tag? Spiegel der Regeln aus dem Kalender (calendar/_cal.js). */
export function occursOn(ev, day) {
  if (!ev || !ev.start || ev.hidden) return false;
  const s = String(ev.start).slice(0, 10);
  if (ev.allDay) return day >= s && day <= String(ev.end || ev.start).slice(0, 10);
  const rep = ev.repeat || 'Keine';
  if (rep === 'Keine') return s === day;
  const diff = Math.round((new Date(`${day}T12:00:00`) - new Date(`${s}T12:00:00`)) / 864e5);
  if (diff < 0) return false;
  const dow = new Date(`${day}T12:00:00`).getDay();
  return rep === 'Täglich' || (rep === 'Werktags' && dow % 6 !== 0) || (rep === 'Wöchentlich' && diff % 7 === 0) || (rep === 'Alle 2 Wochen' && diff % 14 === 0) || (rep === 'Monatlich' && day.slice(8) === s.slice(8));
}
/** Uhrzeit „HH:MM“ eines ISO-Zeitstempels, '' bei reinem Datum. */
export const timeOf = (iso) => (/T\d\d:\d\d/.test(String(iso)) ? String(iso).slice(11, 16) : '');
/** Termine eines Tages mit Beginn (Serien auf den Tag projiziert), nach Uhrzeit sortiert. */
export function eventsOn(events, day) {
  return (events || []).filter((e) => occursOn(e, day)).map((e) => ({ ...e, _t: e.allDay ? '00:00' : timeOf(e.start) })).sort((a, b) => a._t.localeCompare(b._t));
}
/** Uhrzeit „HH:MM“ plus Minuten (über Mitternacht hinaus umbrechend). */
export const plusMin = (hhmm, min) => { const m = (((parseInt(hhmm.slice(0, 2), 10) * 60 + parseInt(hhmm.slice(3, 5), 10) + min) % 1440) + 1440) % 1440; return `${p2(Math.floor(m / 60))}:${p2(m % 60)}`; };
