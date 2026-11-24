// Gemeinsame Datenwelt: Start (Eigentümer: home) – Kennzahlen, Hinweise, Mitteilungen. Die Persona selbst liegt in persona.js.
// Start besitzt keine eigenen Fachdaten: alles hier ist aus Aufgaben, Terminen und Gewohnheiten abgeleitet.
import { events, tasks } from './organisation.js';
import { habitsSummary } from './habits.js';
import { documentsHints } from './documents.js';
import { shoppingHints } from './shopping.js';
import { goalsHints } from './goals.js';
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
/** Untertitel der Startseite (page-header, Slot `subtitle`): die wichtigste heute fällige Aufgabe mit Uhrzeit – „Heute zählt: …“. */
export function homeHeadlineOf(taskList) {
  const rank = { hoch: 0, mittel: 1, niedrig: 2 };
  const timed = open(taskList).filter((t) => String(t.due || '').slice(0, 10) === TODAY && String(t.due).length > 10)
    .sort((a, b) => (rank[a.priority] ?? 3) - (rank[b.priority] ?? 3) || String(a.due).localeCompare(String(b.due)));
  return timed[0] ? `Heute zählt: ${timed[0].title} bis ${String(timed[0].due).slice(11, 16)} Uhr` : 'Dein Tag auf einen Blick';
}
export const homeHeadline = homeHeadlineOf(tasks);
// Hinweiskarten der Startseite (Komponente hint-cards): eigene Regeln (mit `needs`: verschwinden, wenn der Anlass erledigt ist)
// plus je Modul der dringendste Hinweis aus Dokumente & Verträge, Einkauf & Haushalt und Ziele – nur verlinkt, nicht kopiert:
// Text, Ziel und Auswahl (`to`, `carry`) kommen aus `<modul>Hints`. Reihenfolge nach Dringlichkeit (Ton), sonst wie notiert.
const START_HINTS = [
  { id: 'hi1', tone: 'danger', icon: 'alert-circle', title: 'Angebot Müller GmbH heute 14:00 fällig', text: 'Noch offen: PDF erzeugen und an den Kunden senden – etwa 60 Minuten eingeplant.', source: 'Aufgaben', module: 'tasks', actionLabel: 'Aufgabe öffnen', needs: { task: 't1' } },
  { id: 'hi2', tone: 'warning', icon: 'wind', title: 'Sturmböen ab 14 Uhr', text: 'Der Lieferanten-Call um 15:00 läuft per Zoom – Wege am besten vor 14 Uhr erledigen.', source: 'Wetter · Kalender', module: 'weather', actionLabel: 'Wetter ansehen', needs: { alert: true, events: 'e6' } },
  { id: 'hi3', tone: 'accent', icon: 'calendar-clock', title: 'Überschneidung um 11:00', text: 'Sprint-Planung und „Fokus: Workbench-Review“ liegen übereinander.', source: 'Kalender', module: 'calendar', actionLabel: 'Im Kalender ansehen', needs: { events: ['e3', 'e4'] } },
  { id: 'hi4', tone: 'info', icon: 'piggy-bank', title: 'Sparpläne laufen am 01.12.', text: 'Die nächste Ausführung ist am Dienstag; das Girokonto ist ausreichend gedeckt.', source: 'Sparpläne · Finanzen', module: 'savings', actionLabel: 'Sparpläne ansehen', needs: { plans: true } },
  { id: 'hi5', tone: 'neutral', icon: 'tv', title: 'Netflix seit 34 Tagen nicht genutzt', text: 'Das Abo läuft monatlich weiter – prüfen, ob es noch gebraucht wird.', source: 'Finanzen (Abos)', module: 'finance', actionLabel: 'Abos prüfen', needs: { sub: 'sub-netflix' } },
];
const CROSS = [
  { list: documentsHints, icon: 'folder', source: 'Dokumente & Verträge', actionLabel: 'Frist ansehen' },
  { list: shoppingHints, icon: 'shopping-basket', source: 'Einkauf & Haushalt', actionLabel: 'Ansehen' },
  { list: goalsHints, icon: 'target', source: 'Ziele', actionLabel: 'Ziel öffnen' },
];
const RANK = { danger: 0, warning: 1, accent: 2, info: 3, success: 4, neutral: 5 };
/** „Satz eins. Satz zwei.“ → Titel und Text; Datumsangaben wie „(Fr, 27.11.)“ bleiben im Titel. */
const splitText = (s = '') => { const i = s.search(/\.\s+(?=[A-ZÄÖÜ])/); return i < 0 ? { title: s.replace(/\.$/, ''), text: '' } : { title: s.slice(0, i), text: s.slice(i + 1).trim() }; };
export function homeHintCardsOf(cross = CROSS) {
  const fromModules = cross.map((c) => { const h = (c.list || [])[0]; return h && { id: `home-${h.id}`, tone: h.tone || 'info', icon: c.icon, ...splitText(h.text), source: c.source, module: h.module, actionLabel: c.actionLabel, to: h.to, carry: h.carry }; }).filter(Boolean);
  return [...START_HINTS, ...fromModules].map((h, i) => ({ h, i })).sort((a, b) => (RANK[a.h.tone] ?? 9) - (RANK[b.h.tone] ?? 9) || a.i - b.i).map((x) => x.h);
}
export const homeHintCards = homeHintCardsOf();
export const homeHints = [];
export const homeSearch = [];
export const homeNotifications = [
  { id: 'n-review', title: 'Wochenrückblick ist bereit', text: 'KW 47 in drei Zeilen: erledigt, gelernt, als Nächstes.', module: 'home', tone: 'neutral', priority: 'leise', time: at(-2, '18:00'), to: 'home.review' },
];
export const scenarios = { erststart: { homeSummary: homeSummaryOf([], [], null), homeNotifications: [], homeHintCards: [], homeHeadline: homeHeadlineOf([]) }, stress: { homeSummary: homeSummaryOf(tasks.concat(tasks, tasks), events.concat(events, events), habitsSummary.kpis[0]) } };
