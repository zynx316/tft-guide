// Gemeinsame Datenwelt: Start (Eigentümer: home) – Kennzahlen, Hinweise, Mitteilungen. Die Persona selbst liegt in persona.js.
// Start besitzt keine eigenen Fachdaten: alles hier ist aus Aufgaben, Terminen und Gewohnheiten abgeleitet.
import { events, tasks } from './organisation.js';
import { habitsSummary } from './habits.js';
import { TODAY, eventsOn, at } from './_util.js';

const open = (list) => list.filter((t) => !t.done && t.status !== 'Erledigt');
function homeSummaryOf(taskList, eventList, habitKpi) {
  const dueToday = open(taskList).filter((t) => String(t.due || '').slice(0, 10) === TODAY).length;
  const nToday = eventsOn(eventList, TODAY).filter((e) => !e.allDay).length;
  return { kpis: [
    { label: 'Aufgaben heute fällig', value: dueToday, icon: 'list-checks', tone: dueToday ? 'warning' : 'success', to: 'tasks.list' },
    { label: 'Termine heute', value: nToday, icon: 'calendar', tone: 'accent', to: 'calendar.home' },
    ...(habitKpi ? [{ ...habitKpi, to: 'habits.home' }] : []),
  ] };
}
export const homeSummary = homeSummaryOf(tasks, events, habitsSummary.kpis[0]);
export const homeHints = [];
export const homeSearch = [];
export const homeNotifications = [
  { id: 'n-review', title: 'Wochenrückblick ist bereit', text: 'KW 47 in drei Zeilen: erledigt, gelernt, als Nächstes.', module: 'home', tone: 'neutral', priority: 'leise', time: at(-2, '18:00'), to: 'home.review' },
];
export const scenarios = { erststart: { homeSummary: homeSummaryOf([], [], null), homeNotifications: [] }, stress: { homeSummary: homeSummaryOf(tasks.concat(tasks, tasks), events.concat(events, events), habitsSummary.kpis[0]) } };
