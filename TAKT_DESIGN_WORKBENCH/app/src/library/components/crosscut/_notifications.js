// Mitteilungen: abgeleitet aus der Datenwelt (Aufgaben, Termine) plus die Mitteilungen der Module.
import { fmtTime } from '../../../lib/format.js';
import { toDate } from '../../../lib/date.js';
import { isoDay } from '../../../lib/util.js';
import { moduleMeta, plural, cap } from './_system.js';

export const PRIORITIES = [
  { id: 'wichtig', label: 'Wichtig', tone: 'danger', icon: 'alert-circle' },
  { id: 'normal', label: 'Normal', tone: 'accent', icon: 'bell' },
  { id: 'leise', label: 'Leise', tone: 'neutral', icon: 'moon' },
];
export const prio = (id) => PRIORITIES.find((p) => p.id === id) || PRIORITIES[1];
const arr = (v) => (Array.isArray(v) ? v : []);
const isoStamp = (d) => `${isoDay(d)}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:00`;

/** Aus Aufgaben und Terminen berechnete Mitteilungen (ändern sich, sobald in der Welt etwas erledigt wird). */
export function deriveNotifications({ tasks, events }, ctx) {
  const today = ctx.today, day = isoDay(today), out = [];
  const open = arr(tasks).filter((t) => !t.done && t.status !== 'Erledigt');
  const overdue = open.filter((t) => t.due && String(t.due).slice(0, 10) < day);
  if (overdue.length) out.push({ id: 'd-overdue', module: 'tasks', tone: 'danger', priority: 'wichtig', time: isoStamp(new Date(+today - 35 * 60000)), to: 'tasks.list', title: `${plural(overdue.length, 'Aufgabe', 'Aufgaben')} überfällig`, text: overdue.slice(0, 2).map((t) => t.title).join(' · ') + (overdue.length > 2 ? ` und ${overdue.length - 2} weitere` : '') });
  const dueToday = open.filter((t) => t.due && String(t.due).slice(0, 10) === day && t.priority === 'hoch' && String(t.due).length > 10)
    .sort((a, b) => String(a.due).localeCompare(String(b.due)))[0];
  if (dueToday) out.push({ id: `d-due-${dueToday.id}`, module: 'tasks', tone: 'warning', priority: 'wichtig', time: isoStamp(new Date(+today - 12 * 60000)), to: 'tasks.detail', params: { id: dueToday.id }, title: `Fällig um ${fmtTime(toDate(dueToday.due))} Uhr`, text: dueToday.title, actions: ['done'] });
  const upcoming = arr(events).map((e) => {
    const s = toDate(e.start); const isToday = isoDay(s) === day || (e.repeat === 'Werktags' && today.getDay() % 6 !== 0);
    if (!isToday) return null; const st = new Date(today); st.setHours(s.getHours(), s.getMinutes(), 0, 0); return { e, st };
  }).filter((x) => x && +x.st > +today && +x.st - +today <= 120 * 60000).sort((a, b) => a.st - b.st)[0];
  if (upcoming) out.push({ id: `d-event-${upcoming.e.id}`, module: 'calendar', tone: 'info', priority: 'normal', time: isoStamp(new Date(+today - 2 * 60000)), to: 'calendar.event', params: { id: upcoming.e.id }, title: `In ${Math.round((+upcoming.st - +today) / 60000)} Min.: ${upcoming.e.title}`, text: `${fmtTime(upcoming.st)} Uhr${upcoming.e.location ? ` · ${upcoming.e.location}` : ''}` });
  return out;
}

/** Alle Mitteilungen eines Moduls als Liste: abgeleitet + Modul-Mitteilungen (`items`, `extra`), ohne Dubletten, neueste zuerst. */
export function collectNotifications(data, ctx) {
  const seen = new Set(), list = [];
  const firstRun = [data.tasks, data.events].every((a) => Array.isArray(a) && a.length === 0);   // Erststart: noch keine eigenen Daten, keine Modul-Mitteilungen
  for (const n of firstRun ? [] : [...deriveNotifications(data, ctx), ...arr(data.extra), ...arr(data.items)]) { if (seen.has(n.id)) continue; seen.add(n.id); list.push({ ...n, meta: moduleMeta(n.module) }); }
  return list.sort((a, b) => String(b.time).localeCompare(String(a.time)));
}

/** Gruppen für die Anzeige: nach Zeit (Heute, Gestern, Früher), Modul oder Dringlichkeit. */
export function groupNotifications(list, by, ctx) {
  const day = isoDay(ctx.today), yest = isoDay(new Date(+ctx.today - 86400000));
  const key = (n) => (by === 'module' ? n.meta.name : by === 'priority' ? prio(n.priority).label : String(n.time).slice(0, 10) === day ? 'Heute' : String(n.time).slice(0, 10) === yest ? 'Gestern' : 'Früher');
  const order = by === 'priority' ? PRIORITIES.map((p) => p.label) : by === 'time' ? ['Heute', 'Gestern', 'Früher'] : null;
  const map = new Map();
  for (const n of list) { const k = key(n); if (!map.has(k)) map.set(k, []); map.get(k).push(n); }
  const groups = [...map.entries()].map(([label, items]) => ({ label, items }));
  return order ? groups.sort((a, b) => order.indexOf(a.label) - order.indexOf(b.label)) : groups.sort((a, b) => b.items.length - a.items.length || a.label.localeCompare(b.label, 'de'));
}
export const timeOf = (n) => fmtTime(toDate(n.time));
export { cap };
