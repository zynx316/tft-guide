// Gemeinsame Datenwelt: Fitness – Persona Jonas Keller, Referenztag Di, 24.11.2026 09:30.
// Krafttraining Mo/Mi/Fr (Unterkörper · Oberkörper A · Ganzkörper), Laufen Sa/So, heute = Erholungstag, morgen Oberkörper A.
// Alle Werte sind reine Daten (benannte Exporte = Welt-Schlüssel); Summen, Rekorde, Trends werden hier berechnet,
// nicht von Hand eingetragen. Deterministisch (festes Seed), keine Zufälligkeit zur Laufzeit.
import { exerciseLibrary as library } from '../../library/components/fitness/_library.js';
import {
  r1, sum, avg, addDaysIso, weekStartIso, dowOf, isoWeekNo, e1rm, workSets, setVolume, volumeOf, setCount, bestOf, exerciseSeries,
  buildSession, trendOf, setsByMuscle, plannedSets, fmtKg, fmtPace, num, MUSCLES, diffDays, dateShort, WD,
} from '../../library/components/fitness/_calc.js';

const TODAY = '2026-11-24';
const FIRST_WEEK = '2026-10-05';
const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const rand = rng(2411);
const pad = (n) => String(n).padStart(2, '0');

// ------------------------------------------------------------------ Profil
export const fitnessProfile = {
  name: 'Jonas Keller', heightCm: 182, gym: 'FitX Bielefeld', weeklyGoal: 3, runGoal: 1, stepGoal: 9000, activeMinGoal: 30, weeklyActiveGoal: 210,
  sleepGoalH: 7.5, restingHr: 58, startKg: 80.0, goalKg: 77.0, goalStart: '2026-09-01', lifetimeBefore: 75, stand: '24.11.2026',
};

// --------------------------------------------------------------- Bibliothek
export const exerciseLibrary = library;

// ------------------------------------------------------------------ Programm
const pe = (exerciseId, sets, repLo, repHi, rest, warmup = false) => ({ exerciseId, sets, repLo, repHi, rest, warmup });
export const trainingProgram = {
  id: 'prog-uog', name: 'Unter-/Oberkörper/Ganzkörper', short: '3er-Split', level: 'Mittel', startDate: '2026-08-31',
  description: 'Drei Einheiten pro Woche mit wechselndem Schwerpunkt: Beine am Montag, Oberkörper am Mittwoch, Ganzkörper am Freitag. Samstag und Sonntag bleiben für lockere Läufe.',
  progression: 'Doppelte Progression: Erreichst du bei allen Sätzen die obere Wiederholungszahl, steigt das Gewicht beim nächsten Mal um einen Schritt (Langhantel +2,5 kg, Kurzhantel +1 kg), die Wiederholungen beginnen wieder unten.',
  deload: 'Alle 6 Wochen eine Entlastungswoche mit etwa 60 % Volumen. Die nächste wird für KW 50 (ab 7.12.) vorgeschlagen – du kannst sie im Plan verschieben.',
  rhythm: [
    { dow: 0, kind: 'strength', dayId: 'lower' }, { dow: 1, kind: 'rest' }, { dow: 2, kind: 'strength', dayId: 'upperA' }, { dow: 3, kind: 'rest' },
    { dow: 4, kind: 'strength', dayId: 'full' }, { dow: 5, kind: 'run', title: 'Lockerer Lauf' }, { dow: 6, kind: 'run', title: 'Langer Lauf' },
  ],
  days: [
    { id: 'lower', name: 'Unterkörper', short: 'UK', dow: 0, weekdayLabel: 'Mo', time: '18:30', durationMin: 60, focus: 'Beine & Gesäß', exercises: [
      pe('kniebeuge', 3, 6, 8, 150, true), pe('rumaenisches-kreuzheben', 3, 8, 10, 120), pe('beinpresse', 3, 10, 12, 120), pe('beinbeuger', 3, 10, 12, 75), pe('wadenheben', 3, 12, 15, 60), pe('plank', 3, 45, 60, 60)] },
    { id: 'upperA', name: 'Oberkörper A', short: 'OK', dow: 2, weekdayLabel: 'Mi', time: '18:30', durationMin: 55, focus: 'Brust, Rücken, Schulter', exercises: [
      pe('bankdruecken', 3, 8, 10, 120, true), pe('rudern-kabel', 3, 10, 12, 90), pe('schulterdruecken-kh', 3, 10, 12, 90), pe('latziehen', 3, 10, 12, 90), pe('hammercurls', 2, 10, 12, 60), pe('trizepsdruecken-kabel', 2, 10, 12, 60)] },
    { id: 'full', name: 'Ganzkörper', short: 'GK', dow: 4, weekdayLabel: 'Fr', time: '18:30', durationMin: 60, focus: 'Gesäß, Brust oben, Rücken', exercises: [
      pe('hip-thrust', 3, 8, 10, 120, true), pe('schraegbankdruecken-kh', 3, 8, 10, 90), pe('kh-rudern', 3, 10, 12, 90), pe('ausfallschritte', 3, 10, 12, 90), pe('seitheben', 3, 12, 15, 60), pe('cable-crunch', 3, 12, 15, 60)] },
  ],
  alternatives: [
    { id: 'alt-gk', name: 'Ganzkörper A/B', days: 3, text: 'Zwei abwechselnde Ganzkörper-Einheiten, wenig Aufwand je Tag – gut bei vollem Terminkalender.' },
    { id: 'alt-ppl', name: 'Push/Pull/Beine', days: 3, text: 'Drücken, Ziehen, Beine im Wechsel. Mehr Volumen je Muskelgruppe, etwas längere Einheiten.' },
    { id: 'alt-ok', name: 'Oberkörper/Unterkörper', days: 4, text: 'Vier Tage mit klarer Trennung – nur sinnvoll, wenn der Samstag fürs Training frei ist.' },
  ],
};

// Startgewicht, Sprung, Wochen je Stufe, Versatz – daraus entsteht die Progression über die 8 Wochen
const LOAD = {
  kniebeuge: [67.5, 2.5, 3, 1], 'rumaenisches-kreuzheben': [62.5, 2.5, 3, 0], beinpresse: [140, 5, 3, 2], beinbeuger: [35, 2.5, 3, 0], wadenheben: [60, 5, 4, 1], plank: [0, 0, 4, 0],
  bankdruecken: [55, 2.5, 3, 2], 'rudern-kabel': [40, 2.5, 3, 1], 'schulterdruecken-kh': [18, 1, 3, 1], latziehen: [45, 2.5, 3, 0], hammercurls: [12, 1, 3, 2], 'trizepsdruecken-kabel': [25, 2.5, 3, 0],
  'hip-thrust': [70, 5, 3, 1], 'schraegbankdruecken-kh': [20, 1, 3, 0], 'kh-rudern': [24, 1, 3, 2], ausfallschritte: [12, 1, 3, 0], seitheben: [7, 1, 4, 0], 'cable-crunch': [30, 2.5, 4, 1],
};
const libOf = (id) => library.find((l) => l.id === id);
const snap = (kg, step) => Math.round(kg / step) * step;

function makeEntry(day, weekIdx, date) {
  const exercises = day.exercises.map((p) => {
    const lib = libOf(p.exerciseId); const [start, inc, every, off] = LOAD[p.exerciseId];
    const kg = lib.unit === 'kg' ? start + inc * Math.floor((weekIdx + off) / every) : 0;
    const span = Math.max(1, Math.min(every, p.repHi - p.repLo + 1));
    const top = lib.unit === 's' ? Math.min(p.repHi, 38 + weekIdx * 3) : Math.min(p.repHi, p.repLo + ((weekIdx + off) % span));
    const sets = [];
    if (p.warmup && kg) sets.push({ type: 'warm', kg: Math.max(20, snap(kg * 0.5, lib.step)), reps: 8 });
    for (let k = 0; k < p.sets; k++) {
      const down = top > p.repLo && top < p.repHi && k > 0 && rand() < 0.4 ? 1 : 0;
      sets.push({ type: 'work', kg, reps: lib.unit === 's' ? top - (k === 2 ? 4 : 0) : top - down });
    }
    return { exerciseId: p.exerciseId, sets };
  });
  return { id: `h-${date}`, date, start: `18:${pad(30 + Math.floor(rand() * 8))}`, dayId: day.id, title: day.name, durationMin: day.durationMin - 6 + Math.floor(rand() * 9), rating: 3 + Math.floor(rand() * 3), exercises };
}
// (Woche, Wochentag) der nicht stattgefundenen Einheiten
const SKIPPED = new Set(['5-2']);
const NOTES = { 'h-2026-10-30': 'Schulter links leicht gezwickt – Seitheben mit weniger Gewicht, ohne Beschwerden beendet.', 'h-2026-11-18': 'Kurze Einheit, Termin davor ging lang.' };
const built = [];
for (let w = 0; w < 8; w++) for (const day of trainingProgram.days) {
  const date = addDaysIso(FIRST_WEEK, w * 7 + day.dow);
  if (date >= TODAY || SKIPPED.has(`${w}-${day.dow}`)) continue;
  built.push(makeEntry(day, w, date));
}
// PR-Markierung (neue geschätzte 1RM-Bestleistung je Übung, ab der zweiten Woche)
const bestSoFar = {};
export const workoutHistory = built.map((h) => {
  const prs = [];
  for (const ex of h.exercises) {
    const b = bestOf(h, ex.exerciseId); const score = libOf(ex.exerciseId).unit === 'kg' ? b?.e1rm : b?.reps;
    if (score == null) continue;
    if (bestSoFar[ex.exerciseId] != null && score > bestSoFar[ex.exerciseId] && h.date >= addDaysIso(FIRST_WEEK, 7)) prs.push(ex.exerciseId);
    bestSoFar[ex.exerciseId] = Math.max(bestSoFar[ex.exerciseId] ?? 0, score);
  }
  const flat = h.exercises;
  return { ...h, note: NOTES[h.id] || '', sets: setCount(flat), volume: Math.round(volumeOf(flat)), prs };
});

// ------------------------------------------------------------------- Läufe
const RUNS = [['2026-10-10', 5.2, 31.3, 152, 'Lockerer Lauf'], ['2026-10-11', 8.1, 50.2, 149, 'Langer Lauf'], ['2026-10-17', 5.4, 32.5, 151, 'Lockerer Lauf'], ['2026-10-25', 8.4, 51.0, 150, 'Langer Lauf'],
  ['2026-10-31', 5.5, 32.7, 153, 'Lockerer Lauf'], ['2026-11-01', 8.6, 51.8, 148, 'Langer Lauf'], ['2026-11-07', 5.6, 33.1, 152, 'Lockerer Lauf'], ['2026-11-08', 9.0, 54.0, 147, 'Langer Lauf'],
  ['2026-11-14', 5.0, 30.4, 156, 'Tempo-Intervalle, 5 × 3 Min. flott'], ['2026-11-21', 6.0, 35.4, 153, 'Lockerer Lauf'], ['2026-11-22', 9.5, 56.2, 148, 'Langer Lauf, windig']];
export const runLog = RUNS.map(([date, km, min, hr, note]) => ({ id: `r-${date}`, date, start: dowOf(date) === 6 ? '09:15' : '09:00', kind: 'Lauf', km, min, paceSec: Math.round((min * 60) / km), avgHr: hr, note }));

// ------------------------------------------------------------- Rekorde (PRs)
export const personalRecords = (() => {
  const out = [];
  for (const lib of library) {
    const series = exerciseSeries(workoutHistory, lib.id); if (!series.length) continue;
    const key = lib.unit === 'kg' ? 'e1rm' : 'reps';
    let best = null, prev = null;
    for (const s of series) { const v = s[key]; if (v == null) continue; if (!best || v > best[key]) { prev = best; best = s; } }
    if (!best) continue;
    out.push({ id: `pr-${lib.id}`, exerciseId: lib.id, name: lib.name, muscle: lib.muscle, unit: lib.unit, type: lib.unit === 'kg' ? '1RM (geschätzt)' : lib.unit === 's' ? 'Haltezeit' : 'Wiederholungen',
      value: best[key], kg: best.kg, reps: best.reps, date: best.date, previous: prev ? prev[key] : null, previousDate: prev ? prev.date : null, recent: diffDays(TODAY, best.date) <= 14 });
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.name.localeCompare(b.name, 'de')));
})();

// ------------------------------------------------------------ Wochenauswertung
const joker = new Set(['2026-11-09']);
export const weeklyTraining = Array.from({ length: 8 }, (_, w) => {
  const week = addDaysIso(FIRST_WEEK, w * 7); const end = addDaysIso(week, 6);
  const hs = workoutHistory.filter((h) => h.date >= week && h.date <= end); const rs = runLog.filter((r) => r.date >= week && r.date <= end);
  const current = week === weekStartIso(TODAY);
  return { week, label: `KW ${isoWeekNo(week)}`, current, sessions: hs.length, goal: fitnessProfile.weeklyGoal, reached: hs.length >= fitnessProfile.weeklyGoal || joker.has(week), joker: joker.has(week),
    minutes: sum(hs.map((h) => h.durationMin)), sets: sum(hs.map((h) => h.sets)), volume: sum(hs.map((h) => h.volume)), runs: rs.length, runKm: r1(sum(rs.map((r) => r.km))), setsByMuscle: setsByMuscle(hs, library) };
});
export const volumeSeries = { labels: weeklyTraining.map((w) => String(isoWeekNo(w.week))), series: [{ name: 'Volumen (t)', values: weeklyTraining.map((w) => r1(w.volume / 1000)) }] };

// ---------------------------------------------------------------- Körperwerte
const smooth = (t) => t * t * (3 - 2 * t);
const daysFrom = (a, b) => diffDays(b, a);
export const bodyWeightLog = (() => {
  const start = '2026-08-26', n = daysFrom(start, TODAY); const out = [];
  for (let i = 0; i <= n; i++) {
    const date = addDaysIso(start, i); if (i < n && (rand() < 0.1 || (date >= '2026-10-08' && date <= '2026-10-12'))) continue;
    const t = Math.max(0, Math.min(1, daysFrom('2026-09-01', date) / daysFrom('2026-09-01', TODAY)));
    const base = 80.0 - 1.55 * (0.55 * t + 0.45 * smooth(t)) + (date >= '2026-10-14' && date <= '2026-10-24' ? 0.12 : 0);
    const noise = (rand() - 0.5) * 0.7 + (dowOf(date) === 0 ? 0.28 : dowOf(date) === 5 ? -0.08 : 0);
    out.push({ date, kg: i === n ? 78.4 : r1(base + noise) });
  }
  return out;
})();
const trendLog = trendOf(bodyWeightLog);
const trendNow = trendLog[trendLog.length - 1].trend;
const trend7 = trendLog.filter((x) => x.date <= addDaysIso(TODAY, -7)).pop()?.trend ?? trendNow;
export const bodySummary = {
  weightKg: 78.4, trendKg: r1(trendNow), startKg: fitnessProfile.startKg, goalKg: fitnessProfile.goalKg, lostKg: r1(fitnessProfile.startKg - trendNow), toGoalKg: r1(trendNow - fitnessProfile.goalKg),
  progress: Math.max(0, Math.min(1, (fitnessProfile.startKg - trendNow) / (fitnessProfile.startKg - fitnessProfile.goalKg))), weekDeltaKg: r1(trendNow - trend7), entries: bodyWeightLog.length, bmi: r1(78.4 / (1.82 * 1.82)),
};
{ const t28 = trendLog.filter((x) => x.date <= addDaysIso(TODAY, -28)).pop()?.trend ?? trendNow; const perWeek = Math.max(0.1, (t28 - trendNow) / 4); bodySummary.perWeekKg = Math.round(perWeek * 100) / 100; bodySummary.etaWeeks = Math.max(1, Math.round((trendNow - fitnessProfile.goalKg) / perWeek)); }
export const bodyMeasurements = [
  { id: 'waist', label: 'Taille', unit: 'cm', icon: 'ruler', good: 'down', points: [['2026-08-30', 88.0], ['2026-09-27', 87.0], ['2026-10-25', 85.8], ['2026-11-22', 84.8]] },
  { id: 'chest', label: 'Brust', unit: 'cm', icon: 'ruler', good: 'up', points: [['2026-08-30', 101.0], ['2026-09-27', 101.5], ['2026-10-25', 102.0], ['2026-11-22', 102.5]] },
  { id: 'hip', label: 'Hüfte', unit: 'cm', icon: 'ruler', good: 'down', points: [['2026-08-30', 98.5], ['2026-09-27', 98.0], ['2026-10-25', 97.5], ['2026-11-22', 97.2]] },
  { id: 'arm', label: 'Oberarm', unit: 'cm', icon: 'ruler', good: 'up', points: [['2026-08-30', 34.8], ['2026-09-27', 35.0], ['2026-10-25', 35.4], ['2026-11-22', 35.6]] },
  { id: 'thigh', label: 'Oberschenkel', unit: 'cm', icon: 'ruler', good: 'up', points: [['2026-08-30', 58.5], ['2026-09-27', 58.8], ['2026-10-25', 59.2], ['2026-11-22', 59.4]] },
  { id: 'bodyfat', label: 'Körperfett (Waage)', unit: '%', icon: 'scale', good: 'down', points: [['2026-08-30', 19.6], ['2026-09-13', 19.4], ['2026-09-27', 19.1], ['2026-10-11', 18.9], ['2026-10-25', 18.6], ['2026-11-08', 18.5], ['2026-11-22', 18.2]] },
].map((m) => ({ ...m, points: m.points.map(([date, value]) => ({ date, value })) }));

// ---------------------------------------------------------------- Aktivität
export const activityLog = (() => {
  const out = []; const from = addDaysIso(TODAY, -29);
  for (let i = 0; i < 29; i++) {
    const date = addDaysIso(from, i); const dow = dowOf(date); const train = workoutHistory.find((h) => h.date === date); const run = runLog.find((r) => r.date === date);
    let steps = Math.round(6200 + [400, 900, 300, 700, 500, 1100, 1400][dow] + (rand() - 0.5) * 1900 + (train ? 1700 : 0) + (run ? run.km * 1280 : 0) + (date >= '2026-11-10' && date <= '2026-11-12' ? 4300 : 0));
    out.push({ date, steps, activeMin: 0, km: 0, kind: train ? 'Kraft' : run ? 'Lauf' : '' });
  }
  const last7 = out.slice(22, 29); const diff = 8400 * 7 - sum(last7.map((x) => x.steps));
  const base = Math.trunc(diff / 7); last7.forEach((x, i) => { x.steps += base + (i === 6 ? diff - base * 7 : 0); });
  out.forEach((x) => { const run = runLog.find((r) => r.date === x.date); const train = workoutHistory.find((h) => h.date === x.date); x.activeMin = Math.round(x.steps / 160 + (train ? 22 : 0) + (run ? run.min * 0.9 : 0)); x.km = r1(x.steps * 0.00074 + (run ? 0 : 0)); });
  out.push({ date: TODAY, steps: 3240, activeMin: 22, km: 2.4, kind: '', partial: true });
  return out;
})();
export const stepsToday = { date: TODAY, hourly: [0, 0, 0, 0, 0, 0, 180, 1120, 1440, 500], total: 3240, source: 'Health Connect (Demo)' };
export const stepsSeries = { labels: activityLog.slice(-8, -1).map((x) => WD[dowOf(x.date)]), series: [{ name: 'Schritte', values: activityLog.slice(-8, -1).map((x) => x.steps) }] };
export const activityItems = [...runLog.map((r) => ({ id: r.id, date: r.date, title: `${r.note.split(',')[0]} · ${num(r.km, 1)} km`, subtitle: `Pace ${fmtPace(r.paceSec)} /km · Puls Ø ${r.avgHr}`, meta: dateShort(r.date), icon: 'footprints', tone: 'accent' })),
  { id: 'a-walk-1', date: '2026-11-17', title: 'Spaziergang · 3,1 km', subtitle: '38 Min. mit Jana, Johannisberg', meta: '17.11.', icon: 'person-standing', tone: 'success' },
  { id: 'a-walk-2', date: '2026-11-24', title: 'Spaziergang · 2,4 km', subtitle: '22 Min. am Morgen', meta: 'Heute', icon: 'person-standing', tone: 'success' }].sort((a, b) => (a.date < b.date ? 1 : -1));

// ------------------------------------------------------------ Schlaf & Erholung
const SL = [['2026-11-11', '23:20', '06:40', 4, 57], ['2026-11-12', '23:45', '06:40', 3, 58], ['2026-11-13', '23:30', '06:30', 3, 58], ['2026-11-14', '00:10', '08:10', 4, 56], ['2026-11-15', '23:40', '07:50', 5, 56],
  ['2026-11-16', '22:50', '06:30', 4, 57], ['2026-11-17', '23:05', '06:30', 4, 57], ['2026-11-18', '23:40', '06:30', 3, 59], ['2026-11-19', '23:15', '06:30', 4, 58], ['2026-11-20', '00:05', '06:45', 2, 60],
  ['2026-11-21', '00:30', '08:00', 4, 58], ['2026-11-22', '23:00', '07:15', 5, 56], ['2026-11-23', '23:20', '06:30', 4, 57], ['2026-11-24', '23:35', '06:30', 3, 58]];
const mins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
export const sleepLog = SL.map(([date, bed, wake, quality, restingHr], i) => {
  const d = mins(wake) - mins(bed) + (mins(bed) > mins(wake) ? 1440 : 0); // Datum = Morgen des Aufwachens
  return { date, bed, wake, hours: r1(d / 60), quality, restingHr };
});
export const sleepSeries = { labels: sleepLog.map((s) => WD[dowOf(s.date)]), series: [{ name: 'Schlaf (Std.)', values: sleepLog.map((s) => s.hours) }] };
export const recoveryCheckins = [['2026-11-17', 4, 2, 2], ['2026-11-18', 3, 3, 3], ['2026-11-19', 4, 2, 2], ['2026-11-20', 2, 2, 4], ['2026-11-21', 4, 2, 2], ['2026-11-22', 4, 3, 2], ['2026-11-23', 4, 3, 3]]
  .map(([date, energy, soreness, stress]) => ({ date, energy, soreness, stress }));

// ---------------------------------------------------- Ziele, Serie, Meilensteine
const wkNow = weeklyTraining[weeklyTraining.length - 1];
const weekStartNow = weekStartIso(TODAY);
const activeMinWeek = sum(activityLog.filter((x) => x.date >= weekStartNow).map((x) => x.activeMin));
export const fitnessGoals = [
  { id: 'g-train', label: 'Krafttraining', value: wkNow.sessions, target: fitnessProfile.weeklyGoal, unit: 'Einheiten', icon: 'dumbbell', hint: 'diese Woche' },
  { id: 'g-run', label: 'Lauf (ab 5 km)', value: 0, target: fitnessProfile.runGoal, unit: 'Lauf', icon: 'footprints', hint: 'Sa/So geplant' },
  { id: 'g-steps', label: 'Schritte Ø 7 Tage', value: 8400, target: fitnessProfile.stepGoal, unit: 'Schritte', icon: 'person-standing', hint: 'Tagesziel flexibel' },
  { id: 'g-active', label: 'Aktive Minuten', value: activeMinWeek, target: fitnessProfile.weeklyActiveGoal, unit: 'Min.', icon: 'timer', hint: 'diese Woche' },
  { id: 'g-weight', label: 'Gewichtstrend', value: Math.max(0, bodySummary.lostKg), target: fitnessProfile.startKg - fitnessProfile.goalKg, unit: 'kg', icon: 'scale', hint: `Ziel ${fmtKg(fitnessProfile.goalKg)}`, decimals: 1 },
];
export const fitnessStreak = (() => {
  const history = Array.from({ length: 12 }, (_, i) => { const week = addDaysIso('2026-08-31', i * 7); return { week, label: `KW ${isoWeekNo(week)}`, state: joker.has(week) ? 'joker' : 'done' }; });
  return { weeks: 12, best: 12, since: history[0].week, jokersPerQuarter: 2, jokersLeft: 1, paused: false, history, current: { week: weekStartNow, sessions: wkNow.sessions, goal: fitnessProfile.weeklyGoal } };
})();
const squat = exerciseSeries(workoutHistory, 'kniebeuge'); const bench = exerciseSeries(workoutHistory, 'bankdruecken');
export const fitnessMilestones = [
  { id: 'm-sessions', title: '100. Einheit', text: 'Seit dem Start hast du 96 Trainingseinheiten abgeschlossen.', icon: 'dumbbell', tone: 'accent', value: fitnessProfile.lifetimeBefore + workoutHistory.length, target: 100, unit: 'Einheiten', done: false },
  { id: 'm-streak', title: '12 Wochen in Folge', text: 'Zwölf Wochen mit erreichtem Wochenziel – ein Joker war dabei.', icon: 'flame', tone: 'warning', value: 12, target: 12, unit: 'Wochen', done: true, date: '2026-11-22' },
  { id: 'm-squat', title: 'Kniebeuge: 90 kg (1RM geschätzt)', text: 'Mit 72,5 kg × 8 liegt die Schätzung jetzt bei knapp 92 kg.', icon: 'trophy', tone: 'success', value: squat.at(-1).e1rm, target: 90, unit: 'kg', done: true, date: squat.find((s) => s.e1rm >= 90)?.date || '2026-11-16' },
  { id: 'm-bench', title: 'Bankdrücken 85 kg (1RM geschätzt)', text: 'Aktuell 60 kg × 10 – die Schätzung liegt bei etwa 80 kg.', icon: 'medal', tone: 'info', value: bench.at(-1).e1rm, target: 85, unit: 'kg', done: false },
  { id: 'm-weight', title: '−3 kg Trend', text: `Gewichtstrend aktuell ${fmtKg(r1(trendNow))}, Ziel ${fmtKg(fitnessProfile.goalKg)}.`, icon: 'scale', tone: 'accent2', value: Math.max(0, bodySummary.lostKg), target: 3, unit: 'kg', done: false },
  { id: 'm-10k', title: 'Erster 10-km-Lauf', text: 'Längster Lauf bisher: 9,5 km am 22.11.', icon: 'footprints', tone: 'accent', value: Math.max(...runLog.map((r) => r.km)), target: 10, unit: 'km', done: false },
];
const lastWeek = weeklyTraining[weeklyTraining.length - 2];
export const weeklyRecap = {
  week: lastWeek.label, range: '16.–22.11.',
  done: [`${lastWeek.sessions} von ${lastWeek.goal} Einheiten – Wochenziel erreicht`, `${num(lastWeek.volume / 1000, 1)} t Volumen${lastWeek.volume >= Math.max(...weeklyTraining.slice(0, -1).map((w) => w.volume)) ? ' – Höchstwert der letzten 8 Wochen' : ''}`, `${lastWeek.runs} Läufe, ${num(lastWeek.runKm, 1)} km`],
  learned: 'Bankdrücken: 60 kg × 10 bei allen Sätzen – die Wiederholungsobergrenze ist erreicht.',
  next: `Bankdrücken auf 62,5 kg erhöhen, Wiederholungen wieder bei 8 beginnen. Schlaf im Blick behalten (Ø ${num(avg(sleepLog.slice(-7).map((x) => x.hours)), 1)} Std. in den letzten 7 Nächten, Ziel ${num(fitnessProfile.sleepGoalH, 1)}).`,
};

// ---------------------------------------------------------------- Heute & Sitzung
const upper = trainingProgram.days.find((d) => d.id === 'upperA');
const lastS = workoutHistory.at(-1);
export const fitnessToday = {
  date: TODAY, weekday: 'Dienstag', kind: 'rest', headline: 'Erholungstag', text: 'Heute ist Erholung eingeplant – morgen steht Oberkörper A an.',
  nextDayId: 'upperA', nextDate: '2026-11-25', nextWhen: 'Morgen, 18:30', nextName: upper.name, nextMinutes: upper.durationMin, nextSets: upper.exercises.reduce((n, e) => n + e.sets, 0),
  nextExercises: upper.exercises.map((e) => libOf(e.exerciseId).name), lastTitle: lastS.title, lastDate: lastS.date, lastVolume: lastS.volume, weekSessions: wkNow.sessions, weekGoal: fitnessProfile.weeklyGoal,
  steps: 3240, stepGoal: fitnessProfile.stepGoal, activeMin: 22, activeGoal: fitnessProfile.activeMinGoal, sleepHours: sleepLog.at(-1).hours, restingHr: 58, weightKg: 78.4,
};
export const activeWorkout = (() => {
  const s = buildSession('upperA', { program: trainingProgram, history: workoutHistory, library }, TODAY);
  return { ...s, subtitle: 'Mi, 25.11. · 18:30 · ca. 55 Min.' };
})();
export const fitnessRings = [
  { id: 'steps', label: 'Schritte', value: 3240, goal: fitnessProfile.stepGoal, unit: '', tone: 3, icon: 'footprints' },
  { id: 'active', label: 'Aktive Minuten', value: 22, goal: fitnessProfile.activeMinGoal, unit: 'Min.', tone: 2, icon: 'timer' },
  { id: 'week', label: 'Wochenziel', value: wkNow.sessions, goal: fitnessProfile.weeklyGoal, unit: 'Einheiten', tone: 1, icon: 'dumbbell' },
];
export const fitnessMetrics = [
  { label: 'Training (Woche)', value: `${wkNow.sessions}`, unit: `/ ${fitnessProfile.weeklyGoal}`, icon: 'dumbbell', tone: 'accent', delta: null },
  { label: 'Serie', value: 12, unit: 'Wochen', icon: 'flame', tone: 'warning', delta: null },
  { label: 'Gewicht', value: num(78.4, 1), unit: 'kg', icon: 'scale', tone: 'info', delta: bodySummary.weekDeltaKg, suffix: ' kg', invert: true, spark: trendLog.slice(-8).map((x) => x.trend) },
  { label: 'Ruhepuls', value: 58, unit: 'bpm', icon: 'heart-pulse', tone: 'success', delta: -1, suffix: '', invert: true, spark: sleepLog.slice(-7).map((s) => s.restingHr) },
];
export const fitnessSummary = { sessionsTotal: fitnessProfile.lifetimeBefore + workoutHistory.length, sessions8w: workoutHistory.length, volume8w: sum(workoutHistory.map((h) => h.volume)), plannedSets: plannedSets(trainingProgram, library), avgSleep7: r1(avg(sleepLog.slice(-7).map((s) => s.hours))), avgSteps7: 8400, workoutDays: ['Mo', 'Mi', 'Fr'], runDays: ['Sa', 'So'], nextWorkoutDay: 'Mi', todayKind: 'rest', stand: '24.11.2026 09:30' };
