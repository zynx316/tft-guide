// Fitness: reine Rechen- und Datumshelfer (kein DOM, auch von Node nutzbar).
// Genutzt von den Fitness-Komponenten und von seed/world/fitness.js.
import { isoDay } from '../../../lib/util.js';
import { fmtNumber } from '../../../lib/format.js';

export const MUSCLES = ['Brust', 'Rücken', 'Schulter', 'Bizeps', 'Trizeps', 'Beine', 'Gesäß', 'Core'];
export const EQUIPMENT = ['Langhantel', 'Kurzhantel', 'Kabel', 'Maschine', 'Körpergewicht'];
/** Zielkorridor je Muskelgruppe (Sätze pro Woche, indirekte Sätze zählen halb) – Orientierung, kein Soll. */
export const SET_CORRIDOR = { Brust: [8, 16], Rücken: [10, 18], Schulter: [8, 16], Bizeps: [6, 12], Trizeps: [6, 12], Beine: [12, 20], Gesäß: [6, 12], Core: [4, 10] };
export const WD = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
export const WD_LONG = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

export const r1 = (n) => Math.round(n * 10) / 10;
export const sum = (a) => a.reduce((s, x) => s + x, 0);
export const avg = (a) => (a.length ? sum(a) / a.length : 0);
const pad = (n) => String(n).padStart(2, '0');

// ----------------------------------------------------------------- Datum
export const parseIso = (iso) => new Date(`${String(iso).slice(0, 10)}T12:00:00`);
export const addDaysIso = (iso, n) => { const d = parseIso(iso); d.setDate(d.getDate() + n); return isoDay(d); };
/** 0 = Montag … 6 = Sonntag */
export const dowOf = (iso) => (parseIso(iso).getDay() + 6) % 7;
export const weekStartIso = (iso) => addDaysIso(iso, -dowOf(iso));
export const diffDays = (a, b) => Math.round((parseIso(a) - parseIso(b)) / 864e5);
export const dayShort = (iso) => { const d = parseIso(iso); return `${WD[dowOf(iso)]}, ${pad(d.getDate())}.${pad(d.getMonth() + 1)}.`; };
export const dateShort = (iso) => { const d = parseIso(iso); return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.`; };
export function isoWeekNo(iso) {
  const d = parseIso(iso); d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const w1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - w1) / 864e5 - 3 + ((w1.getDay() + 6) % 7)) / 7);
}
export const relDay = (iso, today) => { const n = diffDays(iso, today); return n === 0 ? 'Heute' : n === -1 ? 'Gestern' : n === 1 ? 'Morgen' : n < 0 && n > -7 ? `vor ${-n} Tagen` : dayShort(iso); };

// ------------------------------------------------------------- Formatierung
export const num = (n, d = 0) => fmtNumber(n, { digits: d });
export const numAuto = (n, d = 1) => (Number.isInteger(n) ? num(n) : num(n, d));
export const fmtKg = (n, withUnit = true) => `${numAuto(n, 1)}${withUnit ? ' kg' : ''}`;
export const fmtClock = (sec) => `${Math.floor(Math.max(0, sec) / 60)}:${pad(Math.max(0, Math.round(sec)) % 60)}`;
export const fmtPace = (secPerKm) => `${Math.floor(secPerKm / 60)}:${pad(Math.round(secPerKm % 60))}`;
export const fmtMin = (min) => (min >= 60 ? `${Math.floor(min / 60)} Std. ${pad(Math.round(min % 60))} Min.` : `${Math.round(min)} Min.`);
export const fmtTons = (kg) => `${num(kg / 1000, 1)} t`;

// ---------------------------------------------------------------- Training
/** Geschätztes 1RM nach Epley, nur bis 10 Wiederholungen aussagekräftig. */
export const e1rm = (kg, reps) => (!kg || !reps || reps > 10 ? null : r1(reps <= 1 ? kg : kg * (1 + reps / 30)));
export const workSets = (ex) => (ex.sets || []).filter((s) => s.type !== 'warm');
export const setVolume = (s) => (s.kg || 0) * (s.reps || 0);
/** Volumen (kg × Wdh.) aller gewerteten Arbeitssätze; bei Live-Sessions nur erledigte. */
export const volumeOf = (exercises, onlyDone = false) => sum((exercises || []).flatMap((e) => workSets(e).filter((s) => !onlyDone || s.done).map(setVolume)));
export const setCount = (exercises, onlyDone = false) => (exercises || []).reduce((n, e) => n + workSets(e).filter((s) => !onlyDone || s.done).length, 0);

/** Beste Schätz-1RM-Leistung einer Übung in einer Einheit. */
export function bestOf(entry, exerciseId) {
  const ex = (entry.exercises || []).find((e) => e.exerciseId === exerciseId);
  if (!ex) return null;
  let best = null;
  for (const s of workSets(ex)) { const v = e1rm(s.kg, s.reps); if (v != null && (!best || v > best.e1rm)) best = { e1rm: v, kg: s.kg, reps: s.reps }; }
  return best || { e1rm: null, kg: Math.max(0, ...workSets(ex).map((s) => s.kg || 0)), reps: Math.max(0, ...workSets(ex).map((s) => s.reps || 0)) };
}
/** Verlauf einer Übung über alle Einheiten (aufsteigend). */
export function exerciseSeries(history, exerciseId) {
  return history.filter((h) => (h.exercises || []).some((e) => e.exerciseId === exerciseId))
    .map((h) => { const ex = h.exercises.find((e) => e.exerciseId === exerciseId); const b = bestOf(h, exerciseId); return { date: h.date, e1rm: b?.e1rm ?? null, kg: b?.kg || 0, reps: b?.reps || 0, volume: volumeOf([ex]), sets: workSets(ex).length }; });
}
/** Die letzte Einheit, in der die Übung vorkam (vor `beforeDate`). */
export const lastSets = (history, exerciseId, beforeDate = '9999') => {
  const h = [...history].reverse().find((x) => x.date < beforeDate && (x.exercises || []).some((e) => e.exerciseId === exerciseId));
  return h ? { date: h.date, sets: workSets(h.exercises.find((e) => e.exerciseId === exerciseId)) } : null;
};

/** Vorschlag nach doppelter Progression: Obergrenze bei allen Sätzen erreicht → Gewicht +Schritt, sonst +1 Wiederholung. */
export function suggest(libEx, planEx, last) {
  const lo = planEx.repLo, hi = planEx.repHi, step = libEx?.step || 2.5;
  if (!last || !last.sets.length) return { kg: 0, reps: lo, text: 'Erstes Mal: leicht beginnen und Gefühl für das Gewicht bekommen.', up: false };
  const top = last.sets[0];
  const kg = Math.max(...last.sets.map((s) => s.kg || 0));
  const allHi = last.sets.every((s) => (s.reps || 0) >= hi);
  if (libEx?.unit === 's') return { kg: 0, reps: Math.min(hi, (top.reps || lo) + 5), text: `Letztes Mal ${top.reps} s – heute ${Math.min(hi, (top.reps || lo) + 5)} s anpeilen.`, up: false };
  if (libEx?.unit === 'Wdh.') return { kg: 0, reps: Math.min(hi, (top.reps || lo) + 1), text: `Letztes Mal ${top.reps} Wdh. – heute eine mehr versuchen.`, up: false };
  if (allHi) return { kg: r1(kg + step), reps: lo, text: `Alle Sätze bei ${hi} Wdh. – heute ${fmtKg(r1(kg + step))} × ${lo}.`, up: true };
  const reps = Math.min(hi, Math.max(...last.sets.map((s) => s.reps || lo)) + 1);
  return { kg, reps, text: `Gewicht halten (${fmtKg(kg)}), Ziel ${reps} Wiederholungen.`, up: false };
}

/** Live-Einheit aus einem Programmtag, „letztes Mal“ und Vorgabe je Satz. */
export function buildSession(dayId, { program, history, library }, dateIso) {
  const day = (program?.days || []).find((d) => d.id === dayId);
  if (!day) return null;
  const libOf = (id) => (library || []).find((l) => l.id === id) || {};
  const exercises = day.exercises.map((pe, i) => {
    const lib = libOf(pe.exerciseId);
    const last = lastSets(history || [], pe.exerciseId, dateIso || '9999');
    const sg = suggest(lib, pe, last);
    const sets = [];
    if (pe.warmup && sg.kg > 0) sets.push({ id: `${dayId}-${i}-w`, type: 'warm', kg: Math.max(20, Math.round(sg.kg * 0.5 / (lib.step || 2.5)) * (lib.step || 2.5)), reps: 8, prevKg: null, prevReps: null, done: false });
    for (let k = 0; k < pe.sets; k++) {
      const prev = last?.sets[Math.min(k, last.sets.length - 1)];
      sets.push({ id: `${dayId}-${i}-${k}`, type: 'work', kg: sg.kg, reps: sg.reps, prevKg: prev ? prev.kg : null, prevReps: prev ? prev.reps : null, done: false });
    }
    const series = exerciseSeries(history || [], pe.exerciseId).filter((x) => x.date < (dateIso || '9999'));
    const best = series.length ? Math.max(...series.map((x) => (lib.unit === 'kg' ? x.e1rm ?? 0 : x.reps))) : null;
    return { id: `x${i + 1}`, exerciseId: pe.exerciseId, name: lib.name || pe.exerciseId, muscle: lib.muscle || '', equipment: lib.equipment || '', unit: lib.unit || 'kg', step: lib.step || 2.5, rest: pe.rest || 90, repLo: pe.repLo, repHi: pe.repHi, hint: sg.text, up: sg.up, lastDate: last?.date || null, best, pr: false, skipped: false, sets };
  });
  return { id: `session-${dayId}`, dayId, title: day.name, subtitle: `${day.weekdayLabel || ''} ${day.time || ''} · ca. ${day.durationMin} Min.`.trim(), status: 'ready', elapsed: 0, rest: null, rating: null, saved: false, prs: [], exercises };
}

// -------------------------------------------------------------- Trend & Rest
/** Exponentiell geglätteter Verlauf (Trend), Lücken werden ignoriert. */
export function ema(values, alpha = 0.18) {
  let t = null;
  return values.map((v) => { t = t == null ? v : t + alpha * (v - t); return r1(t * 100) / 100; });
}
export const trendOf = (log, alpha = 0.18) => { const e = ema(log.map((x) => x.kg), alpha); return log.map((x, i) => ({ ...x, trend: e[i] })); };

/** Wochenübersicht Mo–So: erledigt / geplant / Erholung / Lauf. */
export function weekOverview(program, history, runs, todayIso) {
  const mon = weekStartIso(todayIso);
  return WD.map((label, i) => {
    const date = addDaysIso(mon, i);
    const slot = (program?.rhythm || []).find((r) => r.dow === i) || { kind: 'rest' };
    const done = (history || []).filter((h) => h.date === date);
    const run = (runs || []).find((r) => r.date === date);
    const day = slot.dayId ? (program.days || []).find((d) => d.id === slot.dayId) : null;
    let kind = slot.kind;
    if (done.length) kind = 'done'; else if (run) kind = 'run-done';
    else if (date < todayIso && (kind === 'strength' || kind === 'run')) kind = date < (program?.startDate || '0000-00-00') ? 'prestart' : 'missed';
    const shortDay = (done[0] && (program.days || []).find((d) => d.id === done[0].dayId)?.short) || day?.short || (run || slot.kind === 'run' ? 'Lauf' : 'Frei');
    return { date, label, short: shortDay, dow: i, kind, planned: slot.kind, dayId: slot.dayId || null, title: done[0]?.title || (run ? `Lauf ${num(run.km, 1)} km` : day?.name || (slot.kind === 'run' ? slot.title || 'Lauf' : 'Erholung')), detail: done[0] ? `${done[0].durationMin} Min.` : run ? `${num(run.km, 1)} km` : day ? `${day.durationMin} Min.` : '', isToday: date === todayIso, sessionId: done[0]?.id || null };
  });
}

/** Wochen-Sätze je Muskelgruppe aus Plan (indirekte Sätze halb). */
export function plannedSets(program, library) {
  const out = Object.fromEntries(MUSCLES.map((m) => [m, 0]));
  for (const d of program?.days || []) for (const pe of d.exercises) {
    const l = (library || []).find((x) => x.id === pe.exerciseId); if (!l) continue;
    out[l.muscle] = (out[l.muscle] || 0) + pe.sets;
    for (const s of l.secondary || []) out[s] = (out[s] || 0) + pe.sets * 0.5;
  }
  return out;
}
/** Sätze je Muskelgruppe aus Einheiten (Arbeitssätze). */
export function setsByMuscle(entries, library) {
  const out = Object.fromEntries(MUSCLES.map((m) => [m, 0]));
  for (const h of entries) for (const ex of h.exercises || []) {
    const l = (library || []).find((x) => x.id === ex.exerciseId); if (!l) continue;
    const n = workSets(ex).length;
    out[l.muscle] += n; for (const s of l.secondary || []) out[s] += n * 0.5;
  }
  return out;
}

// ---------------------------------------------------------------- Erholung
const SCALE = {
  energy: ['leer', 'müde', 'okay', 'gut', 'voll'], soreness: ['keiner', 'leicht', 'mittel', 'stark', 'heftig'], stress: ['ruhig', 'locker', 'normal', 'hoch', 'sehr hoch'],
};
export const CHECKIN_SCALES = SCALE;
/** Nachvollziehbare Faktoren statt Pseudo-Score: Schlaf, Ruhepuls, Muskelkater, Energie, Stress, Belastung. */
export function recoveryFactors({ sleep = [], checkins = [], history = [], todayIso, goalH = 7.5, weeklyGoal = 3 }) {
  const last = sleep.at(-1); const ci = checkins.find((c) => c.date === todayIso) || null; const prevCi = ci || checkins.at(-1) || null;
  const hrBase = avg(sleep.slice(0, -1).map((s) => s.restingHr)); const out = [];
  if (last) out.push({ id: 'sleep', label: 'Schlaf', value: `${numAuto(last.hours, 1)} Std.`, note: `Ziel ${numAuto(goalH, 1)} Std.`, level: last.hours >= 7 ? 'good' : last.hours >= 6.5 ? 'ok' : 'low', reason: `Schlaf bei ${numAuto(last.hours, 1)} Std.` });
  if (last) { const d = last.restingHr - hrBase; out.push({ id: 'hr', label: 'Ruhepuls', value: `${last.restingHr} bpm`, note: `Ø ${num(hrBase, 0)} bpm`, level: d <= 2 ? 'good' : d <= 4 ? 'ok' : 'low', reason: 'Ruhepuls erhöht' }); }
  if (prevCi) {
    const ago = ci ? '' : ' (gestern)';
    out.push({ id: 'soreness', label: 'Muskelkater', value: SCALE.soreness[prevCi.soreness - 1] + ago, note: 'Check-in', level: prevCi.soreness <= 2 ? 'good' : prevCi.soreness === 3 ? 'ok' : 'low', reason: 'Muskelkater deutlich' });
    out.push({ id: 'energy', label: 'Energie', value: SCALE.energy[prevCi.energy - 1] + ago, note: 'Check-in', level: prevCi.energy >= 4 ? 'good' : prevCi.energy === 3 ? 'ok' : 'low', reason: 'wenig Energie' });
    out.push({ id: 'stress', label: 'Stress', value: SCALE.stress[prevCi.stress - 1] + ago, note: 'Check-in', level: prevCi.stress <= 2 ? 'good' : prevCi.stress === 3 ? 'ok' : 'low', reason: 'hoher Stress' });
  }
  const week = history.filter((h) => h.date > addDaysIso(todayIso, -7)); const vol = sum(week.map((h) => h.volume || 0));
  out.push({ id: 'load', label: 'Belastung', value: `${week.length} Einheiten`, note: `${num(vol / 1000, 1)} t in 7 Tagen`, level: week.length <= weeklyGoal + 1 ? 'good' : 'ok', reason: 'viel Belastung' });
  return { factors: out, checkedIn: !!ci };
}
export function recoveryAdvice(factors, { restDay = false, nextName = 'dein nächstes Training' } = {}) {
  const lows = factors.filter((f) => f.level === 'low'); const goods = factors.filter((f) => f.level === 'good');
  const because = lows.length ? lows.map((f) => f.reason).join(' und ') : `${goods.slice(0, 3).map((f) => f.label).join(', ')} unauffällig`;
  if (lows.length >= 2) return { level: 'rest', tone: 'warning', title: restDay ? 'Gut, dass heute Pause ist' : 'Heute eher leicht oder pausieren', because, text: restDay ? `Morgen lieber locker starten und nach Gefühl entscheiden – ${because}.` : `Ein lockeres Training oder ein freier Tag passt besser – ${because}.` };
  if (lows.length === 1) return { level: 'ease', tone: 'info', title: restDay ? 'Erholung läuft' : 'Mit etwas Rücksicht trainieren', because, text: restDay ? `${nextName} ist wie geplant möglich – ${because}, also gut aufwärmen.` : `Das Training ist möglich, ein Satz weniger oder etwas weniger Gewicht wäre in Ordnung – ${because}.` };
  return { level: 'go', tone: 'success', title: restDay ? 'Gut erholt' : 'Bereit fürs Training', because, text: restDay ? `${nextName} kann wie geplant stattfinden – ${because}.` : `Plan wie vorgesehen – ${because}.` };
}

/** „Heute“-Zusammenfassung aus einem Programm: nächster Krafttag ab heute (Welt-Schlüssel fitnessToday). Rein, ohne Zufall. */
export function nextTraining(program, library, todayIso, { weekSessions = 0, weekGoal = 3 } = {}) {
  const days = program?.days || [];
  for (let i = 0; i < 8; i++) {
    const date = addDaysIso(todayIso, i); const slot = (program?.rhythm || []).find((r) => r.dow === dowOf(date));
    const day = slot?.kind === 'strength' ? days.find((d) => d.id === slot.dayId) : null;
    if (!day) continue;
    const today = i === 0;
    return {
      date: todayIso, kind: today ? 'strength' : 'rest', headline: today ? 'Trainingstag' : 'Erholungstag',
      text: today ? `Heute steht ${day.name} an.` : `Heute ist Erholung eingeplant – ${i === 1 ? 'morgen' : WD[dowOf(date)]} steht ${day.name} an.`,
      nextDayId: day.id, nextDate: date, nextWhen: `${today ? 'Heute' : i === 1 ? 'Morgen' : WD[dowOf(date)]}, ${day.time}`, nextName: day.name, nextMinutes: day.durationMin,
      nextSets: day.exercises.reduce((n, e) => n + e.sets, 0), nextExercises: day.exercises.map((e) => (library || []).find((l) => l.id === e.exerciseId)?.name || e.exerciseId),
      lastTitle: '', lastDate: null, lastVolume: 0, weekSessions, weekGoal,
    };
  }
  return null;
}
