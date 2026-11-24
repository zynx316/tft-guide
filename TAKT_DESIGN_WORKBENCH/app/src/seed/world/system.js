// Gemeinsame Datenwelt: TAKT Kern (Eigentümer: system) – Papierkorb, Eingang-Kennzahlen, Mitteilungs- und Suchformat.
// Der Eingang (unsortierte Erfassungen) gehört den Aufgaben (`taskInbox`); Notizen aus „Erfassen“ landen in `notes` mit `inbox: true`.
// Mitteilungen und Suchindex aller Module sammelt `index.js` (`allNotifications`, `searchIndex`).
import { taskInbox } from './organisation.js';
import { notes } from './knowledge.js';

/** Papierkorb: Löschzeitpunkte relativ zum Referenztag (30 Tage Aufbewahrung). */
export const trash = [
  { id: 'tr1', title: 'Altes Angebot Schmidt prüfen', module: 'tasks', kind: 'task', deletedAt: '2026-11-23T16:20:00', detail: 'Vertrieb', payload: { id: 't-trash-1', title: 'Altes Angebot Schmidt prüfen', due: '2026-11-20', priority: 'mittel', project: 'Vertrieb', category: 'Arbeit', status: 'Offen', subtasks: [] } },
  { id: 'tr2', title: 'Zahnreinigung', module: 'calendar', kind: 'event', deletedAt: '2026-11-21T09:10:00', detail: 'Do, 26.11., 08:30', payload: { id: 'e-trash-1', title: 'Zahnreinigung', start: '2026-11-26T08:30:00', end: '2026-11-26T09:15:00', category: 'Gesundheit', tone: 'danger', reminders: ['1 Tag vorher'] } },
  { id: 'tr3', title: 'Idee: Newsletter-Betreff Winter', module: 'notes', kind: 'note', deletedAt: '2026-11-16T11:00:00' },
  { id: 'tr4', title: 'Doppelbuchung Amazon', module: 'finance', kind: 'transaction', deletedAt: '2026-11-10T19:45:00', detail: '23,99\u00a0€' },
  { id: 'tr5', title: 'Meditation (Gewohnheit)', module: 'habits', kind: 'habit', deletedAt: '2026-11-02T08:05:00', detail: '12 Tage Serie' },
  { id: 'tr6', title: 'Kartons bestellen', module: 'tasks', kind: 'task', deletedAt: '2026-10-28T14:00:00', detail: 'erledigt' },
  { id: 'tr7', title: 'Reiseplan Japan, Entwurf', module: 'notes', kind: 'note', deletedAt: '2026-10-26T21:30:00' },
];

const inboxNotes = notes.filter((n) => n.inbox && !n.archived).length;
const summaryOf = (inboxN, trashN) => ({ kpis: [
  { label: 'im Eingang', value: inboxN, icon: 'inbox', tone: inboxN ? 'info' : 'success', to: 'tasks.inbox' },
  { label: 'im Papierkorb', value: trashN, icon: 'trash-2', tone: 'neutral', to: 'system.trash' },
] });
export const systemSummary = summaryOf(taskInbox.length + inboxNotes, trash.length);
export const systemHints = [];
export const systemSearch = [];
export const systemNotifications = [];
export const scenarios = { erststart: { systemSummary: summaryOf(0, 0) }, stress: { systemSummary: summaryOf((taskInbox.length + inboxNotes) * 3, trash.length * 3) } };
