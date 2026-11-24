// Reine Regel-Logik des recurrence-picker (ohne Oberfläche, im Test ladbar).
import { toDate, dayStart, isoWeekday, toIsoDay, addDays } from '../../../lib/date.js';

export const FREQS = [
  { value: 'none', label: 'Keine' }, { value: 'daily', label: 'Täglich' }, { value: 'weekly', label: 'Wöchentlich' },
  { value: 'monthly', label: 'Monatlich' }, { value: 'yearly', label: 'Jährlich' }, { value: 'afterDone', label: 'Nach Erledigung' },
];
export const UNIT = { daily: ['Tag', 'Tage'], weekly: ['Woche', 'Wochen'], monthly: ['Monat', 'Monate'], yearly: ['Jahr', 'Jahre'] };
export const SETPOS = [{ value: '1', label: 'ersten' }, { value: '2', label: 'zweiten' }, { value: '3', label: 'dritten' }, { value: '4', label: 'vierten' }, { value: '-1', label: 'letzten' }];

export const freqOf = (rule) => (rule && rule.freq) || 'none';
export const endMode = (rule) => (rule?.until ? 'until' : rule?.count ? 'count' : 'never');
export const monthMode = (rule) => (rule?.bySetPos !== undefined ? 'weekday' : 'day');

/** Entfernt undefinierte Felder, damit Regeln sauber vergleich- und speicherbar bleiben. */
const clean = (r) => Object.fromEntries(Object.entries(r).filter(([, v]) => v !== undefined));

/**
 * Standardregel für eine Häufigkeit. Intervall und Ende der bisherigen Regel bleiben erhalten, soweit sinnvoll.
 * @param {string} freq 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'afterDone'
 * @param {Date|string} start Starttag des Termins
 * @param {object|null} [prev] bisherige Regel
 * @returns {object|null} neue Regel (null = keine Wiederholung)
 */
export function ruleFor(freq, start, prev = null) {
  if (freq === 'none') return null;
  const s = dayStart(toDate(start));
  const keep = { start: toIsoDay(s), until: prev?.until, count: prev?.count };
  if (freq === 'afterDone') return clean({ freq, afterDoneDays: prev?.afterDoneDays || 7, ...keep });
  const base = { freq, interval: prev && prev.freq !== 'afterDone' ? prev.interval || 1 : 1, ...keep };
  if (freq === 'weekly') return clean({ ...base, byWeekday: [isoWeekday(s)] });
  if (freq === 'monthly') return clean({ ...base, byMonthDay: s.getDate() });
  if (freq === 'yearly') return clean({ ...base, byMonth: s.getMonth() + 1, byMonthDay: s.getDate() });
  return clean(base);
}

/** Setzt das Ende: 'never' | 'until' (Datum) | 'count' (Anzahl). */
export function withEnd(rule, mode, start) {
  if (!rule) return rule;
  const r = { ...rule, until: undefined, count: undefined };
  if (mode === 'until') r.until = toIsoDay(addDays(rule.until || start, rule.until ? 0 : 90));
  if (mode === 'count') r.count = rule.count || 10;
  return clean(r);
}

/** Wechselt die Monatsart: am Tag des Monats oder am n-ten Wochentag. */
export function withMonthMode(rule, mode, start) {
  const s = dayStart(toDate(start));
  const r = { ...rule, byMonthDay: undefined, byWeekday: undefined, bySetPos: undefined };
  if (mode === 'weekday') { r.byWeekday = [isoWeekday(s)]; r.bySetPos = Math.min(4, Math.ceil(s.getDate() / 7)); } else r.byMonthDay = s.getDate();
  return clean(r);
}

/** Wochentag ein-/ausschalten; der letzte aktive Wochentag bleibt stehen. */
export function toggleWeekday(rule, wd) {
  const cur = rule.byWeekday || [];
  const next = cur.includes(wd) ? cur.filter((x) => x !== wd) : [...cur, wd].sort((a, b) => a - b);
  return next.length ? { ...rule, byWeekday: next } : rule;
}

/** Klartext der Serien-Optionen „nur dieser / dieser und folgende / alle“. */
export const SCOPES = [
  { value: 'this', label: 'Nur dieser Termin', hint: (d) => `Nur der Termin am ${d} ändert sich, die Serie bleibt.` },
  { value: 'following', label: 'Dieser und folgende', hint: (d) => `Ab ${d} gilt die Änderung, frühere Termine bleiben.` },
  { value: 'all', label: 'Alle Termine', hint: () => 'Die ganze Serie ändert sich, auch vergangene Termine.' },
];
