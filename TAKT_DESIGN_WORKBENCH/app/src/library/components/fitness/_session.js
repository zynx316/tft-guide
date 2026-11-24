// Fitness: reine Zustandsfunktionen der Live-Einheit (kein DOM). Jede Funktion liefert eine neue Session.
import { e1rm, workSets, volumeOf, setCount, sum, lastSets, bestOf } from './_calc.js';

const mapEx = (s, exId, fn) => ({ ...s, exercises: s.exercises.map((e) => (e.id === exId ? fn(e) : e)) });
export const liveExercises = (s) => (s?.exercises || []).filter((e) => !e.skipped);
export const doneCount = (s) => setCount(liveExercises(s), true);
export const totalCount = (s) => setCount(liveExercises(s), false);
export const volumeNow = (s) => volumeOf(liveExercises(s), true);
/** Nächster offener Satz (Aufwärmen zählt mit): { ex, set, exIdx, setIdx } */
export function nextSet(s) {
  const exs = liveExercises(s);
  for (let i = 0; i < exs.length; i++) { const k = exs[i].sets.findIndex((x) => !x.done); if (k >= 0) return { ex: exs[i], set: exs[i].sets[k], exIdx: i, setIdx: k }; }
  return null;
}
export const patchSet = (s, exId, setId, patch) => mapEx(s, exId, (e) => ({ ...e, sets: e.sets.map((x) => (x.id === setId ? { ...x, ...patch } : x)) }));
export const start = (s) => (s.status === 'ready' ? { ...s, status: 'running', elapsed: s.elapsed || 0 } : s);
export const startRest = (s, seconds, exerciseId) => ({ ...s, rest: { total: seconds, left: seconds, running: true, done: false, exerciseId: exerciseId || null } });
export const clearRest = (s) => ({ ...s, rest: null });
export const addRest = (s, delta) => (s.rest ? { ...s, rest: { ...s.rest, total: Math.max(15, s.rest.total + delta), left: Math.max(0, s.rest.left + delta), running: true, done: false } } : s);

/** Satz abhaken / zurücknehmen. Ergebnis: { session, set, ex, pr, finished } */
export function toggleDone(s, exId, setId) {
  const ex = s.exercises.find((e) => e.id === exId); const st = ex?.sets.find((x) => x.id === setId);
  if (!st) return { session: s };
  const done = !st.done;
  let session = start(patchSet(s, exId, setId, { done }));
  let pr = false;
  if (done && st.type !== 'warm' && !ex.pr && ex.best != null) {
    const score = ex.unit === 'kg' ? e1rm(st.kg, st.reps) : st.reps;
    if (score != null && score > ex.best) { pr = true; session = { ...mapEx(session, exId, (e) => ({ ...e, pr: true })), prs: [...(session.prs || []), ex.exerciseId] }; }
  }
  const finished = done && doneCount(session) >= totalCount(session);
  session = done && !finished ? startRest(session, st.type === 'warm' ? 45 : ex.rest, exId) : done ? clearRest(session) : session;
  return { session, set: { ...st, done }, ex, pr, finished };
}
export function addSet(s, exId) {
  return mapEx(s, exId, (e) => { const last = [...e.sets].reverse().find((x) => x.type === 'work') || e.sets[e.sets.length - 1]; return { ...e, sets: [...e.sets, { id: `${exId}-n${e.sets.length}-${Math.abs(Math.round((last?.kg || 0) * 10))}`, type: 'work', kg: last?.kg || 0, reps: last?.reps || e.repLo, prevKg: null, prevReps: null, done: false, extra: true }] }; });
}
export const removeSet = (s, exId, setId) => mapEx(s, exId, (e) => ({ ...e, sets: e.sets.length > 1 ? e.sets.filter((x) => x.id !== setId) : e.sets }));
export const skipExercise = (s, exId, skipped = true) => mapEx(s, exId, (e) => ({ ...e, skipped }));
/** Übung tauschen: Vorgabe neu aus dem Verlauf, bereits erledigte Sätze bleiben erhalten. */
export function swapExercise(s, exId, lib, history) {
  return mapEx(s, exId, (e) => {
    const last = lastSets(history || [], lib.id); const n = e.sets.filter((x) => x.type === 'work').length;
    const kg = last ? Math.max(...last.sets.map((x) => x.kg || 0)) : 0; const reps = last ? last.sets[0].reps : e.repLo;
    const done = e.sets.filter((x) => x.done);
    const open = Array.from({ length: Math.max(1, n - done.filter((x) => x.type === 'work').length) }, (_, k) => ({ id: `${exId}-s${k}-${lib.id}`, type: 'work', kg, reps, prevKg: last ? kg : null, prevReps: last ? reps : null, done: false }));
    return { ...e, exerciseId: lib.id, name: lib.name, muscle: lib.muscle, equipment: lib.equipment, unit: lib.unit, step: lib.step || 2.5, rest: lib.rest || e.rest, hint: last ? `Letztes Mal ${last.sets[0].kg} kg × ${last.sets[0].reps} – als Vorgabe übernommen.` : 'Neue Übung – leicht beginnen.', up: false, best: null, pr: false, swapped: true, sets: [...done, ...open] };
  });
}
export const setRating = (s, rating) => ({ ...s, rating });
export const finish = (s) => ({ ...s, status: 'done', rest: null });
export const resetSession = (s) => ({ ...s, status: 'ready', elapsed: 0, rest: null, rating: null, saved: false, prs: [], exercises: s.exercises.map((e) => ({ ...e, pr: false, skipped: false, sets: e.sets.filter((x) => !x.extra).map((x) => ({ ...x, done: false })) })) });

/** Verlaufseintrag aus der beendeten Session. */
export function toHistoryEntry(s, dateIso, startTime = '18:30') {
  const exs = liveExercises(s).map((e) => ({ exerciseId: e.exerciseId, sets: e.sets.filter((x) => x.done).map((x) => ({ type: x.type, kg: x.kg, reps: x.reps })) })).filter((e) => e.sets.length);
  return { id: `h-${dateIso}-live`, date: dateIso, start: startTime, dayId: s.dayId, title: s.title, durationMin: Math.max(1, Math.round((s.elapsed || 0) / 60)), rating: s.rating || null, exercises: exs, note: '', sets: setCount(exs), volume: Math.round(volumeOf(exs)), prs: [...(s.prs || [])] };
}
export { workSets, sum, bestOf };
