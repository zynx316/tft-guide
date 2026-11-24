// Gemeinsame Datenwelt: Ziele (Eigentümer: goals). Besitzt NUR Ziel-Definitionen: Titel, Warum, Bereich, Zieldatum, Meilensteine, Wochenfokus, Quelle.
// Aktuelle Werte werden aus den Welten der Eigentümer abgeleitet (nur lesen): Sparziele und Sparpläne (finance.js › savingsGoals, savingsPlans; Verlauf rechnet _calc.js daraus zurück), Gewichtstrend und Training
// (fitness.js), Umsatz (sales.js › channels), Gewohnheiten-Serien (habits.js), Aufgaben (organisation.js › tasks). Ein Sparziel wird nie dupliziert:
// das Ziel verweist per `source.ref` auf das Sparziel und zeigt dessen Wert. Rechenlogik: library/components/goals/_calc.js (rein, getestet).
// Referenztag: Di, 24.11.2026 09:30.
import { savingsGoals, savingsPlans } from './finance.js';
import { bodySummary, bodyWeightLog, fitnessProfile, weeklyTraining, fitnessStreak } from './fitness.js';
import { channels } from './sales.js';
import { habits } from './habits.js';
import { tasks } from './organisation.js';
import { TODAY, at, triple } from './_util.js';
import { AREAS, sourcesOf, deriveAll, summaryOf } from '../../library/components/goals/_calc.js';

export const goalAreas = AREAS.map((a) => ({ ...a }));

const ms = (id, title, rest = {}) => ({ id, title, ...rest });

/** Ziel-Definitionen (Eigentum von goals). Werte kommen nie von Hand, sondern aus der Quelle. */
export const goals = [
  { id: 'g-gewicht', title: 'Zielgewicht erreichen', area: 'gesundheit', since: '2026-09-01', due: '2027-02-28', focus: false, hideNumbers: false,
    why: 'Mehr Energie im Training und im Alltag, ohne Eile. Der Trend zählt, nicht der Tageswert.',
    source: { type: 'weight', module: 'fitness', label: 'Gewichtstrend aus Fitness', to: 'fitness.body' },
    milestones: [ms('m1', 'Erste Etappe geschafft', { at: 79 }), ms('m2', 'Zweite Etappe', { at: 78 }), ms('m3', 'Zielgewicht', { at: 77 })],
    nextTaskId: 't19', nextHint: { title: 'Wiegen ist freiwillig: der Trend rechnet mit', to: 'fitness.body' } },
  { id: 'g-training', title: 'Dreimal pro Woche trainieren', area: 'gesundheit', since: '2026-08-31', due: null, focus: true,
    why: 'Regelmäßigkeit schlägt Härte: drei feste Termine, alles darüber ist Bonus.',
    source: { type: 'training', module: 'fitness', label: 'Wochenziel und Serie aus Fitness', to: 'fitness.goals' },
    milestones: [ms('m1', '12 Wochen in Folge', { at: 12 }), ms('m2', '16 Wochen in Folge', { at: 16 }), ms('m3', '26 Wochen in Folge', { at: 26 })],
    nextHint: { title: 'Mi 18:30 Oberkörper A im FitX Bielefeld', to: 'fitness.home' } },
  { id: 'g-vitd', title: 'Vitamin D: 100 Tage in Folge', area: 'gesundheit', since: '2026-10-01', due: '2027-01-08', focus: false,
    why: 'Von Oktober bis März gehört es zum Frühstück. Hundert Tage sind ein schöner Zwischenstand.',
    source: { type: 'habit', ref: 'h-vitd', module: 'habits', label: 'Serie der Gewohnheit „Vitamin D“', to: 'habits.detail' },
    measure: { unit: 'Tage', start: 0, target: 100 },
    milestones: [ms('m1', '30 Tage', { at: 30 }), ms('m2', '60 Tage', { at: 60 }), ms('m3', '100 Tage', { at: 100 })],
    nextHint: { title: 'Heute schon erledigt, morgen zum Frühstück', to: 'habits.home' } },
  { id: 'g-notgroschen', title: 'Notgroschen: 6 Monatsausgaben', area: 'finanzen', since: '2026-01-01', due: null, focus: false,
    why: 'Ein Polster für Unerwartetes macht vieles andere entspannter.',
    source: { type: 'savings', ref: 'g-notgroschen', module: 'savings', label: 'Sparziel in Sparpläne', to: 'savings.goals' },
    milestones: [ms('m1', 'Drei Monatsausgaben', { at: 7500 }), ms('m2', 'Fünf Monatsausgaben', { at: 12500 }), ms('m3', 'Sechs Monatsausgaben', { at: 15000 })],
    nextHint: { title: 'Sparrate prüfen', to: 'savings.goals' } },
  { id: 'g-japan', title: 'Japan-Reise 2027', area: 'finanzen', since: '2026-03-01', due: null, focus: true,
    why: 'Drei Wochen mit Jana, ohne beim Essen zu rechnen.',
    source: { type: 'savings', ref: 'g-japan', module: 'savings', label: 'Sparziel in Sparpläne', to: 'savings.goals' },
    milestones: [ms('m1', 'Ein Viertel gespart', { at: 1500 }), ms('m2', 'Die Hälfte', { at: 3000 }), ms('m3', 'Flug gebucht', { done: false }), ms('m4', 'Alles gespart', { at: 6000 })] },
  { id: 'g-ebike', title: 'Neues E-Bike', area: 'finanzen', since: '2026-04-01', due: null, focus: false,
    why: 'Die Wege in Bielefeld ohne Auto, auch im Winter.',
    source: { type: 'savings', ref: 'g-ebike', module: 'savings', label: 'Sparziel in Sparpläne', to: 'savings.goals' },
    milestones: [ms('m1', 'Ein Drittel', { at: 1167 }), ms('m2', 'Probefahrt im Laden', { done: false }), ms('m3', 'Alles gespart', { at: 3500 })],
    nextHint: { title: 'Der Sparplan ruht bis 15.01.2027', to: 'savings.goals' } },
  { id: 'g-umsatz', title: 'Monatsumsatz', area: 'business', since: '2026-10-25', due: null, rolling: true, focus: false,
    why: 'Ein klarer Maßstab für das Weihnachtsgeschäft, ohne jeden Tag auf Zahlen zu schauen.',
    source: { type: 'sales', module: 'sales', label: 'Umsatz der letzten 30 Tage aus Sales', to: 'sales.revenue' },
    measure: { unit: '€', start: 0, target: 18000 },
    milestones: [ms('m1', 'Zwei Drittel', { at: 12000 }), ms('m2', 'Fast am Ziel', { at: 15000 }), ms('m3', 'Monatsziel erreicht', { at: 18000 })],
    nextTaskId: 't1', nextHint: { title: 'Etsy neu verbinden, damit Bestellungen zählen', to: 'sales.connect' } },
  { id: 'g-blackfriday', title: 'Black Friday vorbereiten', area: 'business', since: '2026-11-10', due: '2026-11-27', focus: true,
    why: 'Am Freitag soll alles stehen: Newsletter, Fotos, Retourenprozess und ein volles Lager.',
    source: { type: 'checklist', module: 'tasks', label: 'Schritte aus Aufgaben', to: 'tasks.list' },
    milestones: [ms('m1', 'Lager geprüft', { done: true, doneAt: '2026-11-22' }), ms('m2', 'Newsletter planen', { taskId: 't6' }), ms('m3', 'Produktfotos auswählen', { taskId: 't3' }), ms('m4', 'Retourenprozess dokumentieren', { taskId: 't9' })],
    nextTaskId: 't6' },
  { id: 'g-buecher', title: '12 Bücher 2026', area: 'persoenlich', since: '2026-01-01', due: '2026-12-31', focus: false,
    why: 'Abends statt Handy: ein Buch pro Monat war der Plan.',
    source: { type: 'manual', module: 'habits', label: 'Eigene Zählung, verknüpft mit „Lesen“', to: 'habits.detail', link: { module: 'habits', ref: 'h-lesen', to: 'habits.detail', label: 'Gewohnheit Lesen' } },
    measure: { unit: 'Bücher', start: 0, target: 12 },
    snapshots: [{ date: '2026-02-28', value: 2 }, { date: '2026-04-30', value: 4 }, { date: '2026-06-30', value: 6 }, { date: '2026-08-31', value: 7 }, { date: '2026-09-30', value: 8 }, { date: '2026-10-31', value: 9 }],
    milestones: [ms('m1', 'Sechstes Buch', { at: 6 }), ms('m2', 'Neuntes Buch', { at: 9 }), ms('m3', 'Zwölftes Buch', { at: 12 })],
    nextHint: { title: 'Heute Abend 20 Minuten lesen', to: 'habits.home' } },
  { id: 'g-japanisch', title: 'Japanisch: 40 Lektionen', area: 'persoenlich', since: '2026-09-14', due: '2027-08-01', focus: false,
    why: 'Speisekarten und Schilder verstehen, bevor die Reise losgeht.',
    source: { type: 'manual', module: 'goals', label: 'Eigene Zählung', to: 'goals.detail' },
    measure: { unit: 'Lektionen', start: 0, target: 40 },
    snapshots: [{ date: '2026-09-30', value: 4 }, { date: '2026-10-15', value: 8 }, { date: '2026-10-31', value: 11 }, { date: '2026-11-15', value: 14 }],
    milestones: [ms('m1', 'Schriftzeichen Hiragana', { at: 10 }), ms('m2', 'Halbzeit', { at: 20 }), ms('m3', 'Alle 40 Lektionen', { at: 40 })],
    nextHint: { title: 'Lektion 15 am Donnerstagabend', to: 'goals.detail' } },
];

/** Kontext der Ableitung: nur lesen aus den Eigentümer-Welten. */
const SRC = sourcesOf({ areas: goalAreas, tasks, savingsGoals, savingsPlans, bodySummary, bodyWeightLog, fitnessProfile, weeklyTraining, fitnessStreak, channels, habits }, TODAY);
const dd = (iso) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.`;

const hintsOf = (views) => {
  const out = [];
  const bf = views.find((v) => v.id === 'g-blackfriday');
  if (bf && bf.state !== 'done') out.push({ id: 'h-goals-bf', text: `Black Friday am ${dd(bf.due)}: ${bf.milestones.filter((m) => !m.done).length} von ${bf.milestones.length} Schritten sind noch offen.`, source: 'goals[g-blackfriday]', module: 'goals', tone: 'info', to: 'goals.detail', carry: { selectedId: bf.id } });
  const jp = views.find((v) => v.id === 'g-japan');
  if (jp && jp.next?.kind === 'hint' && jp.next.amount) out.push({ id: 'h-goals-japan', text: `Für die Japan-Reise wäre eine Sparrate von etwa ${Math.round(jp.next.amount)} € pro Monat nötig. Aktuell gibt es keine.`, source: 'savingsGoals[g-japan]', module: 'goals', tone: 'neutral', to: 'goals.detail', carry: { selectedId: jp.id } });
  return out;
};
const searchOf = (list, views) => list.map((g) => { const v = views.find((x) => x.id === g.id); return { id: `ziel:${g.id}`, type: 'Ziel', title: g.title, subtitle: `${v.areaName} · ${v.stateLabel}`, module: 'goals', to: 'goals.detail', params: { id: g.id } }; });

const views = deriveAll(goals, SRC);
export const goalsSummary = summaryOf(views);
export const goalsHints = hintsOf(views);
export const goalsSearch = searchOf(goals, views);
export const goalsNotifications = [
  { id: 'n-goals-bf', title: 'Black Friday in 3 Tagen', text: 'Newsletter planen steht heute um 16:30 Uhr an, dazu Fotos und Retourenprozess.', module: 'goals', tone: 'info', priority: 'normal', time: at(0, '08:00'), to: 'goals.detail' },
  { id: 'n-goals-week', title: 'Dein Wochenfokus steht', text: 'Black Friday vorbereiten, Dreimal pro Woche trainieren und Japan-Reise.', module: 'goals', tone: 'neutral', priority: 'leise', time: at(-1, '19:00'), to: 'goals.week' },
];

// Erster Start: noch keine Ziele; die Lebensbereiche bleiben als Grundstruktur. Stress: Ziele verdreifacht, der Wochenfokus bleibt bei höchstens drei.
const stressGoals = triple(goals).map((g) => (g.id.includes('~') ? { ...g, focus: false } : g));
const stressViews = deriveAll(stressGoals, SRC);
export const scenarios = {
  erststart: { goals: [], goalAreas: goalAreas.map((a) => ({ ...a })), goalsSummary: summaryOf([]), goalsHints: [], goalsSearch: [], goalsNotifications: [] },
  stress: { goals: stressGoals, goalsSummary: summaryOf(stressViews), goalsHints: hintsOf(stressViews), goalsSearch: searchOf(stressGoals, stressViews) },
};
