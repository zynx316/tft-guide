// Gemeinsame Helfer für Aufgaben-Startseite, Eingang und Fokus-Timer: Text → Aufgabe, Kennzahlen, Fokus-Sitzungen.
import { isoDay } from '../../../lib/util.js';
import { parseWhen } from '../calendar/_cal-info.js';
import { dayStart, addDays, dayKey, minutesOf, occurrences, onDay, freeSlots } from '../calendar/_cal.js';
import { dueInfo, dueDate } from './_tasks.js';

export const CATEGORY_BY_PROJECT = { Vertrieb: 'Arbeit', Shop: 'Arbeit', 'TAKT V2': 'Arbeit', Finanzen: 'Finanzen', Privat: 'Privat' };
export const PROJECT_NAMES = ['Shop', 'Vertrieb', 'Finanzen', 'TAKT V2', 'Privat'];

/** Aufgabe aus freiem Text: „Etsy-Gebühren buchen morgen 15 Uhr !! #Finanzen 20 min“ (Datum, Uhrzeit, Priorität, Projekt, Schätzung). */
export function parseTask(text, today, projects = PROJECT_NAMES) {
  let t = ` ${String(text || '')} `, priority = null, project = null;
  if (/\s!!+(?=\s|$)|\s(?:dringend|wichtig)(?=\s|$)/i.test(t)) { priority = 'hoch'; t = t.replace(/\s!!+(?=\s|$)|\s(?:dringend|wichtig)(?=\s|$)/gi, ' '); }
  else if (/\s!(?=\s|$)/.test(t)) { priority = 'mittel'; t = t.replace(/\s!(?=\s|$)/g, ' '); }
  const tag = t.match(/\s#([\wäöüÄÖÜß-]+)(?=\s|$)/);
  if (tag) { project = projects.find((p) => p.toLowerCase().replace(/\s/g, '') === tag[1].toLowerCase()) || null; t = t.replace(tag[0], ' '); }
  const w = parseWhen(t, today);
  const due = w.date ? (w.start ? `${isoDay(w.date)}T${w.start}:00` : isoDay(w.date)) : null;
  return { title: w.title, due, priority, project, estimate: w.mins || null, hints: w.hints };
}

export const newTaskId = () => `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
export function makeTask({ title, due, priority, project, estimate }) {
  return { id: newTaskId(), title, due: due || undefined, priority: priority || 'mittel', project: project || undefined, category: CATEGORY_BY_PROJECT[project] || 'Arbeit', status: 'Offen', done: false, estimate: estimate || undefined, subtasks: [] };
}

/** Wochenende-Datum für „Diese Woche“: Freitag der laufenden Woche (an Fr–So der heutige Tag). */
export const weekEnd = (today) => { const d = dayStart(today), wd = (d.getDay() + 6) % 7; return addDays(d, Math.max(0, 4 - wd)); };

export const openTasks = (tasks) => (Array.isArray(tasks) ? tasks : []).filter((t) => !t.done);
export const dueToday = (tasks, today) => openTasks(tasks).filter((t) => dueInfo(t, today).diff === 0);
export const overdueTasks = (tasks, today) => openTasks(tasks).filter((t) => dueInfo(t, today).overdue);
export const planMinutes = (list) => list.reduce((n, t) => n + (Number(t.estimate) || 30), 0);
export const hoursOf = (min) => `${(Math.round(min / 6) / 10).toLocaleString('de-DE', { maximumFractionDigits: 1 })} h`;
export const minLabel = (min) => (min < 60 ? `${min} Min.` : `${Math.floor(min / 60)} Std.${min % 60 ? ` ${min % 60} Min.` : ''}`);

/** Erledigungen je Tag: archivierte (activity) + Aufgaben mit doneAt. */
export function doneByDay(tasks, activity, days, today) {
  const list = Array.isArray(tasks) ? tasks : [], act = Array.isArray(activity) ? activity : [];
  return Array.from({ length: days }, (_, i) => {
    const d = addDays(dayStart(today), i - (days - 1)), k = dayKey(d);
    return { day: d, key: k, done: (act.find((a) => a.day === k)?.archived || 0) + list.filter((t) => t.done && t.doneAt === k).length };
  });
}
/** Fokus-Sitzungen je Tag (Anzahl und Minuten). */
export function focusByDay(log, days, today) {
  const list = Array.isArray(log) ? log : [];
  return Array.from({ length: days }, (_, i) => { const d = addDays(dayStart(today), i - (days - 1)), k = dayKey(d), s = list.filter((x) => String(x.start).slice(0, 10) === k); return { day: d, key: k, sessions: s.length, minutes: s.reduce((n, x) => n + (x.minutes || 0), 0) }; });
}

/** Restliche freie Zeit des Tages (Minuten) aus den Terminen – optional. */
export function freeToday(events, today, workEnd = 18) {
  const d = dayStart(today), occ = onDay(occurrences(Array.isArray(events) ? events : [], d, addDays(d, 1)), d).filter((o) => !o.allDay);
  return freeSlots(occ, Math.max(Math.ceil(minutesOf(today) / 15) * 15, 8 * 60), workEnd * 60, 30).reduce((n, [x, y]) => n + y - x, 0);
}

// ---------------------------------------------------------------- Fokus-Timer ---
export const PRESETS = { '25 / 5': { focus: 25, brk: 5, long: 15 }, '50 / 10': { focus: 50, brk: 10, long: 20 }, '15 / 3': { focus: 15, brk: 3, long: 10 } };
export const fmtClock = (sec) => `${String(Math.floor(Math.max(0, sec) / 60)).padStart(2, '0')}:${String(Math.max(0, sec) % 60).padStart(2, '0')}`;
export const sessionsOn = (log, key) => (Array.isArray(log) ? log : []).filter((x) => String(x.start).slice(0, 10) === key && (x.kind || 'Fokus') === 'Fokus');
export { dueDate };
