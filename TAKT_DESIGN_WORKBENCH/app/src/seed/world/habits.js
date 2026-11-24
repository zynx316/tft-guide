// Gemeinsame Datenwelt: Gewohnheiten und Routinen (Eigentümer: habits). Start und Gewohnheiten binden dieselben Listen
// (`@world:habits`, `@world:routines`): ein Haken auf „Start“ erscheint in „Gewohnheiten“. Verläufe sind deterministisch erzeugt (kein Zufall zur Laufzeit).
// Verknüpfungen: Krafttraining zählt aus dem Trainingsverlauf der Fitness-Welt, Wasser aus dem Wassertagebuch der Ernährung (heute 4 Gläser = 1.000 ml).
import { workoutHistory } from './fitness.js';
import { nutGoals, nutWater } from './nutrition.js';
import { triple } from './_util.js';

// --- Datenerzeugung (reines JS, ohne UI-Importe) --------------------------------------------------------------
const pad = (n) => String(n).padStart(2, '0');
const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const add = (k, n) => { const d = parse(k); d.setDate(d.getDate() + n); return keyOf(d); };
const wd = (k) => (parse(k).getDay() + 6) % 7;
const END = '2026-11-23', TODAY = '2026-11-24';
const lcg = (seed) => { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; };

/** recent: Muster der letzten Tage bis gestern (d = erledigt, p = teilweise, m = verpasst); davor zufällig nach Quote. */
function build({ since, rate, recent = '', days = null, goal = null, seed, partial = 0.08 }) {
  const rnd = lcg(seed), log = {}, start = add(END, -(recent.length - 1));
  for (let k = since; k <= END; k = add(k, 1)) {
    if (days && !days.includes(wd(k))) continue;
    let st;
    if (recent && k >= start) st = recent[Math.round((parse(k) - parse(start)) / 864e5)];
    else { const r = rnd(); st = r < rate ? 'd' : r < rate + partial ? 'p' : 'm'; }
    if (st === 'd') log[k] = goal ? goal.target : 1;
    else if (st === 'p' && goal) log[k] = Math.max(goal.step, Math.floor((goal.target * (0.4 + rnd() * 0.4)) / goal.step) * goal.step);
  }
  return log;
}
/** Krafttraining: vor dem 05.10. synthetisch (3× pro Woche, Mo/Mi/Fr), danach die echten Einheiten aus dem Trainingsverlauf der Fitness-Welt. */
function trainingLog() {
  const rnd = lcg(77), log = {};
  for (let w = '2026-03-02', i = 0; w < '2026-10-05'; w = add(w, 7), i++) {
    const full = w >= '2026-09-21';
    const n = full ? 3 : rnd() < 0.78 ? 3 : 2;
    [0, 2, 4].slice(0, n).forEach((d) => { log[add(w, d + (rnd() < 0.18 ? 1 : 0))] = 1; });
  }
  for (const h of workoutHistory) log[h.date] = 1;
  return log;
}

const withToday = (log, v) => ({ ...log, [TODAY]: v });
const W8 = { target: Math.round(nutGoals.water / 250), unit: 'Gläser', step: 1 }; // Gläser à 250 ml, Wasserziel aus Ernährung (2,5 l = 10 Gläser)
const glassesToday = Math.round(nutWater.entries.reduce((s, e) => s + e.ml, 0) / 250);
const READ = { target: 20, unit: 'Min.', step: 5 };

export const habits = [
  { id: 'h-water', name: 'Wasser trinken', icon: 'droplet', tone: 3, daypart: 'tagsüber', time: '09:00', reminder: true, rhythm: { type: 'daily' }, goal: W8, since: '2026-06-15', link: { module: 'nutrition', label: 'Ernährung' },
    log: withToday(build({ since: '2026-06-15', rate: 0.74, recent: 'dpddmddpdddmddddpdddddd', goal: W8, seed: 11 }), glassesToday), note: 'Ein Glas = 250 ml. Ziel 2,5 Liter.' },
  { id: 'h-vitd', name: 'Vitamin D', icon: 'pill', tone: 4, daypart: 'morgens', time: '07:15', reminder: true, rhythm: { type: 'daily' }, since: '2026-10-01', link: null,
    log: withToday(build({ since: '2026-10-01', rate: 0.96, recent: 'dddddddddddddddddddddddd', seed: 21 }), 1), note: 'Oktober bis März, mit dem Frühstück.' },
  { id: 'h-dehnen', name: 'Dehnen', icon: 'activity', tone: 2, daypart: 'morgens', time: '07:30', reminder: true, rhythm: { type: 'daily' }, since: '2026-08-10', link: null,
    log: build({ since: '2026-08-10', rate: 0.66, recent: 'dmddmdddmddmdddmdmdddmddd', seed: 31 }), note: '10 Minuten: Nacken, Rücken, Hüfte – nach dem Aufstehen.' },
  { id: 'h-plan', name: 'Tagesplanung', icon: 'list-checks', tone: 1, daypart: 'morgens', time: '08:30', reminder: true, rhythm: { type: 'weekdays' }, since: '2026-06-01', link: { module: 'calendar', label: 'Kalender' },
    log: withToday(build({ since: '2026-06-01', rate: 0.86, recent: 'dddddddddddddddddddddddd', days: [0, 1, 2, 3, 4], seed: 41 }), 1), note: 'Top 3 festlegen, Kalender und Aufgaben abgleichen.' },
  { id: 'h-lesen', name: 'Lesen', icon: 'book-open', tone: 5, daypart: 'abends', time: '21:30', reminder: true, rhythm: { type: 'daily' }, goal: READ, since: '2026-07-20', link: null,
    log: build({ since: '2026-07-20', rate: 0.56, recent: 'mdddmpdmdddpmdddmddddmddd', goal: READ, seed: 51 }), note: 'Aktuell: „Die Kunst des guten Handelns“.' },
  { id: 'h-handy', name: 'Kein Handy nach 22 Uhr', icon: 'moon', tone: 6, daypart: 'abends', time: '21:45', reminder: true, rhythm: { type: 'daily' }, since: '2026-09-14', link: null,
    log: build({ since: '2026-09-14', rate: 0.55, recent: 'ddmdmdddmdmmdddmddmdmmdmm', seed: 61 }), note: 'Handy lädt im Flur. Wecker liegt in der Küche.' },
  { id: 'h-training', name: 'Krafttraining', icon: 'dumbbell', tone: 6, daypart: 'abends', time: '18:30', reminder: false, rhythm: { type: 'perWeek', perWeek: 3 }, since: '2026-03-02', link: { module: 'fitness', label: 'Fitness' },
    log: trainingLog(), note: 'Zählt automatisch, sobald ein Training in Fitness abgeschlossen wird.' },
];

export const routines = [
  { id: 'r-morning', name: 'Morgenroutine', icon: 'sunrise', time: '06:45', steps: [
    { id: 'rm1', title: 'Vitamin D nehmen', minutes: 1, habitId: 'h-vitd' },
    { id: 'rm2', title: 'Kaffee ohne Handy', minutes: 5 },
    { id: 'rm3', title: 'Dehnen', minutes: 10, habitId: 'h-dehnen' },
    { id: 'rm4', title: 'Tagesplanung', minutes: 10, habitId: 'h-plan' },
  ], log: { [TODAY]: ['rm2'] } },
  { id: 'r-evening', name: 'Abendroutine', icon: 'moon', time: '21:30', steps: [
    { id: 're1', title: 'Tagesabschluss', minutes: 5 },
    { id: 're2', title: 'Lesen', minutes: 20, habitId: 'h-lesen' },
    { id: 're3', title: 'Handy weglegen', minutes: 1, habitId: 'h-handy' },
    { id: 're4', title: 'Licht aus', minutes: 1 },
  ], log: {} },
];

export const habitHintCards = [
  { id: 'h-dehnen', tone: 'accent', icon: 'activity', title: 'Dehnen steht noch aus', text: 'Zehn Minuten reichen – danach läuft der Tag leichter.', source: 'Gewohnheiten', module: 'habits', actionLabel: 'Ansehen' },
  { id: 'h-water', tone: 'info', icon: 'droplet', title: 'Wasser: ein Glas jetzt', text: 'Bis zum Mittag sind etwa fünf Gläser ein guter Stand.', source: 'Gewohnheiten · Ernährung', module: 'habits', actionLabel: 'Ansehen' },
  { id: 'h-handy', tone: 'accent2', icon: 'moon', title: 'Gnadentag diese Woche noch frei', text: 'Ein verpasster Abend bricht deine Serie nicht – Pause statt Druck.', source: 'Gewohnheiten', module: 'habits', actionLabel: 'Serie ansehen' },
];

// ------------------------------------------------------------------ Launchpad, Hinweise, Suche, Mitteilungen
const doneOn = (h, day) => { const v = h.log?.[day]; return h.goal ? (v || 0) >= h.goal.target : !!v; };
// Wie in „Gewohnheiten – Heute“: tägliche und Werktags-Gewohnheiten nach Rhythmus, Wochenziele (z. B. Krafttraining) stehen jeden Tag in der Liste
const scheduledOn = (h, day) => h.rhythm.type !== 'weekdays' || wd(day) < 5;
/** Serie in Tagen bis einschließlich heute (heute zählt nur, wenn erledigt; nicht planbare Tage werden übersprungen). */
function streakOf(h) {
  let n = 0;
  for (let k = TODAY; k >= h.since; k = add(k, -1)) {
    if (!scheduledOn(h, k)) continue;
    if (doneOn(h, k)) n += 1; else if (k !== TODAY) break;
  }
  return n;
}
function habitsSummaryOf(list) {
  const today = list.filter((h) => scheduledOn(h, TODAY));
  const done = today.filter((h) => doneOn(h, TODAY)).length;
  const best = [...list].filter((h) => h.rhythm.type !== 'perWeek').map((h) => ({ h, n: streakOf(h) })).sort((a, b) => b.n - a.n)[0];
  return { kpis: list.length ? [
    { label: 'heute erledigt', value: `${done} von ${today.length}`, icon: 'repeat', tone: 'accent', to: 'habits.home' },
    { label: best ? `Serie ${best.h.name}` : 'Serie', value: best ? `${best.n} Tage` : '–', icon: 'flame', tone: 'warning', to: 'habits.detail' },
    { label: 'Routinen', value: routines.length, icon: 'sunrise', tone: 'neutral', to: 'habits.routines' },
  ] : [{ label: 'Gewohnheiten', value: 0, icon: 'repeat', tone: 'neutral', to: 'habits.create' }] };
}
export const habitsSummary = habitsSummaryOf(habits);
const openToday = habits.filter((h) => scheduledOn(h, TODAY) && !doneOn(h, TODAY) && h.daypart === 'morgens');
export const habitsHints = openToday.slice(0, 1).map((h) => ({ id: `h-hab-${h.id}`, text: `${h.name} steht noch aus. ${h.note}`, source: `habits[${h.id}]`, module: 'habits', tone: 'neutral', to: 'habits.detail', carry: { selectedId: h.id } }));
export const habitsSearch = [
  ...habits.map((h) => ({ id: `habit:${h.id}`, type: 'Gewohnheit', title: h.name, subtitle: `${h.daypart} · seit ${h.since.slice(8)}.${h.since.slice(5, 7)}.${h.since.slice(0, 4)}`, module: 'habits', to: 'habits.detail', params: { id: h.id } })),
  ...routines.map((r) => ({ id: `routine:${r.id}`, type: 'Routine', title: r.name, subtitle: `${r.time} Uhr · ${r.steps.length} Schritte`, module: 'habits', to: 'habits.routines', params: { id: r.id } })),
];
const evening = routines.find((r) => r.id === 'r-evening');
export const habitsNotifications = [
  { id: 'n-habit', title: `${evening.name} um ${evening.time} Uhr`, text: `${evening.steps.length} Schritte, etwa ${evening.steps.reduce((s, x) => s + x.minutes, 0)} Minuten.`, module: 'habits', tone: 'neutral', priority: 'leise', time: '2026-11-23T21:00:00', to: 'habits.routines' },
];

export const scenarios = {
  erststart: { habitsSummary: habitsSummaryOf([]), habitHintCards: [] },
  stress: { habitsSummary: habitsSummaryOf(triple(habits)) },
};
