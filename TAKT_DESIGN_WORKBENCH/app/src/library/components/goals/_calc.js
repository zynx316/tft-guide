// Ziele: reine Rechenlogik ohne UI (auch von der Datenwelt und den Tests genutzt).
// Eigentum: „goals“ besitzt nur die Ziel-Definitionen (Titel, Warum, Bereich, Zieldatum, Meilensteine, Wochenfokus, Quelle).
// Aktuelle Werte werden hier aus den Welten der Eigentümer ABGELEITET (nur lesen): Sparziele (savingsGoals), Gewichtstrend und Training
// (bodySummary, bodyWeightLog, weeklyTraining, fitnessStreak), Umsatz (channels), Gewohnheiten (habits), Aufgaben (tasks).
//
// Definition eines Ziels (goals[]):
//   { id, title, why, area, since, due?, focus?, hideNumbers?, rolling?, status?('paused'),
//     source: { type: 'savings'|'weight'|'training'|'sales'|'habit'|'checklist'|'manual', ref?, module, label, to, link? },
//     measure?: { unit, start, target },             // nur bei manuellen und umsatz-/gewohnheitsbasierten Zielen
//     snapshots?: [{ date, value }],                  // eigene Monatsstände, NUR bei manuellen Zählern (Sparziele leiten ihren Verlauf aus savingsGoals/savingsPlans ab)
//     milestones: [{ id, title, at? | taskId? | done?, doneAt? }],
//     nextTaskId?, nextHint?: { title, to } }
// Abgeleitet (view): kind amount | weight | weekly | streak | count | checklist, current, target, progress 0–1, state, series, next …
import { trendOf } from '../fitness/_calc.js';
import { monthsToGoal, requiredMonthly } from '../../../core/finmath.js';

export const FOCUS_MAX = 3;
export const AREAS = [
  { id: 'gesundheit', name: 'Gesundheit', icon: 'heart-pulse', tone: 2, hint: 'Körper, Training, Gewohnheiten' },
  { id: 'finanzen', name: 'Finanzen', icon: 'piggy-bank', tone: 3, hint: 'Sparen und Rücklagen' },
  { id: 'business', name: 'Business', icon: 'store', tone: 1, hint: 'Umsatz und Vorhaben im Shop' },
  { id: 'persoenlich', name: 'Persönlich', icon: 'sparkles', tone: 5, hint: 'Lernen, Lesen, Reisen' },
];
export const STATE_LABEL = { done: 'Erreicht', ahead: 'Gut dabei', 'on-track': 'Im Plan', behind: 'Etwas hinter dem Plan', paused: 'Pausiert', new: 'Neu' };
export const STATE_TONE = { done: 'success', ahead: 'success', 'on-track': 'accent', behind: 'accent2', paused: 'neutral', new: 'info' };

// ------------------------------------------------------------------ Datumshelfer (ISO-Tage, ohne Systemzeit)
const p2 = (n) => String(n).padStart(2, '0');
const at12 = (iso) => new Date(`${String(iso).slice(0, 10)}T12:00:00`);
export const diffDays = (a, b) => Math.round((at12(b) - at12(a)) / 864e5);
export const addDaysIso = (iso, n) => { const d = at12(iso); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`; };
export const addMonthsIso = (iso, n) => { const d = at12(iso); const day = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + n); d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate())); return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`; };
export const weekStartIso = (iso) => addDaysIso(iso, -((at12(iso).getDay() + 6) % 7));
export const monthStartIso = (iso) => `${String(iso).slice(0, 8)}01`;
const clamp01 = (x) => (Number.isFinite(x) ? Math.max(0, Math.min(1, x)) : 0);
const r1 = (x) => Math.round(x * 10) / 10;
const monthsLeft = (from, to) => Math.max(1, Math.round(diffDays(from, to) / 30.44));
const arr = (v) => (Array.isArray(v) ? v : []);
const isOpenTask = (t) => !!t && !(t.done || t.status === 'Erledigt');

/** Serie einer Gewohnheit in Tagen bis `day` (heute zählt nur, wenn erledigt; Werktags-Gewohnheiten überspringen das Wochenende). */
export function habitStreak(h, day) {
  const need = h?.goal?.target || 1;
  const done = (k) => (Number(h.log?.[k]) || 0) >= need;
  const skip = (k) => h.rhythm?.type === 'weekdays' && ((at12(k).getDay() + 6) % 7) >= 5;
  let k = done(day) || skip(day) ? day : addDaysIso(day, -1), n = 0;
  for (let guard = 0; guard < 800 && k >= (h.since || '0000-00-00'); guard++, k = addDaysIso(k, -1)) {
    if (skip(k)) continue;
    if (!done(k)) break;
    n++;
  }
  return n;
}

/** Wert der Reihe zum Stichtag (letzter Punkt bis dahin, sonst der erste). */
export function valueAt(series, day) {
  const s = arr(series); if (!s.length) return null;
  let v = s[0].value; for (const p of s) { if (p.date <= day) v = p.value; else break; }
  return v;
}

// ------------------------------------------------------------------ Ableitung
/** Quellen der Eigentümer-Welten (nur lesen) für die Ableitung. */
export function sourcesOf(data = {}, today) {
  return {
    today, areas: arr(data.areas).length ? data.areas : AREAS, tasks: arr(data.tasks), savingsGoals: arr(data.savingsGoals), savingsPlans: arr(data.savingsPlans), bodySummary: data.bodySummary || null, bodyWeightLog: arr(data.bodyWeightLog),
    fitnessProfile: data.fitnessProfile || null, weeklyTraining: arr(data.weeklyTraining), fitnessStreak: data.fitnessStreak || null, channels: arr(data.channels), habits: arr(data.habits),
  };
}

/** Prognose eines Sparziels mit derselben Rechnung wie Sparpläne (finmath: Rendite der verknüpften Pläne, volle Monate bis zur Frist). */
function savingsForecast(s, plans, today) {
  const linked = arr(plans).filter((p) => p.goalId === s.id);
  const ratePa = linked.length ? (linked.find((p) => p.active) || linked[0]).expectedReturnPa ?? 0 : 0;
  const monthly = s.monthly || 0, current = s.current || 0, target = s.target;
  let eta = null, required = 0;
  if (current < target && monthly > 0 && !s.paused) { const m = monthsToGoal({ target, current, monthly, ratePa }); if (Number.isFinite(m)) eta = addMonthsIso(today, m); }
  if (s.due && current < target) { const d = diffMonths(today, s.due); required = requiredMonthly({ target, current, months: Math.max(1, d), ratePa }); }
  return { eta, required };
}
const diffMonths = (a, b) => { const x = at12(a), y = at12(b); return Math.max(0, (y.getFullYear() - x.getFullYear()) * 12 + y.getMonth() - x.getMonth() - (y.getDate() < x.getDate() ? 1 : 0)); };

/** Ausführungen eines Sparplans im Zeitraum (from, to] (Monatsraster ab Startdatum). */
function runsBetween(p, from, to) {
  let n = 0;
  for (let k = 0, d = p.startDate; d && d <= to && k < 600; k++, d = addMonthsIso(p.startDate, k * (p.intervalMonths || 1))) if (d > from) n++;
  return n;
}
/** Monatsstände eines Sparziels, aus dem aktuellen Stand und den aktiven Sparplänen zurückgerechnet (nur lesen, nichts wird gespeichert).
 *  Pläne ohne Konto (Depot) und ruhende Pläne verändern den Verlauf nicht: ohne Rate bleibt die Linie flach. */
export function savingsHistory(s, plans, since, today) {
  const rows = arr(plans).filter((p) => p.goalId === s.id && p.active && !p.positionId && p.monthly > 0);
  const out = [];
  for (let k = 1; k <= 6; k++) {
    const e = addDaysIso(monthStartIso(addMonthsIso(today, -(k - 1))), -1);   // Monatsende vor k Monaten
    if (since && e < since) break;
    const back = rows.reduce((sum, p) => sum + p.monthly * runsBetween(p, e, today), 0);
    out.unshift({ date: e, value: Math.round((s.current - back) * 100) / 100 });
  }
  return out;
}

function measureOf(g, src) {
  const t = g.source?.type, m = g.measure || {};
  const today = src.today;
  if (t === 'savings') {
    const s = src.savingsGoals.find((x) => x.id === g.source.ref);
    if (!s) return { missing: true };
    const f = savingsForecast(s, src.savingsPlans, today);
    return { kind: 'amount', unit: '€', start: 0, current: s.current, target: s.target, due: g.due || s.due, monthly: s.monthly || 0, paused: !!s.paused, direction: 'up',
      series: [...savingsHistory(s, src.savingsPlans, g.since, today), { date: today, value: s.current }], resume: s.pausedUntil || null,
      etaSrc: f.eta, requiredSrc: f.required };
  }
  if (t === 'weight') {
    const b = src.bodySummary; if (!b) return { missing: true };
    const log = trendOf(arr(src.bodyWeightLog)).filter((x) => x.date >= addDaysIso(today, -84));
    return { kind: 'weight', unit: 'kg', start: b.startKg, current: b.trendKg, target: b.goalKg, direction: 'down', progressSrc: b.progress, weekDelta: b.weekDeltaKg, perWeek: b.perWeekKg, etaWeeks: b.etaWeeks, last: b.weightKg,
      series: log.map((x) => ({ date: x.date, value: r1(x.trend) })), raw: log.map((x) => ({ date: x.date, value: x.kg })) };
  }
  if (t === 'training') {
    const w = arr(src.weeklyTraining), cur = w.find((x) => x.current) || w[w.length - 1], f = src.fitnessStreak || {};
    if (!cur) return { missing: true };
    return { kind: 'weekly', unit: 'Einheiten', start: 0, current: cur.sessions, target: cur.goal || src.fitnessProfile?.weeklyGoal || 3, direction: 'up', streakWeeks: f.weeks || 0, jokersLeft: f.jokersLeft ?? null,
      series: w.map((x) => ({ date: x.week, value: x.sessions, current: !!x.current })), msValue: f.weeks || 0, bars: true };
  }
  if (t === 'sales') {
    const chs = arr(src.channels); if (!chs.length) return { kind: 'amount', unit: '€', start: 0, current: 0, target: m.target || 1, direction: 'up', series: [], rolling: true };
    const n = Math.max(...chs.map((c) => arr(c.trend).length));
    const series = Array.from({ length: n }, (_, i) => ({ date: addDaysIso(today, -5 * (n - 1 - i)), value: Math.round(chs.reduce((s, c) => s + (arr(c.trend)[i - (n - arr(c.trend).length)] || 0), 0) * 100) / 100 }));
    return { kind: 'amount', unit: '€', start: 0, current: Math.round(chs.reduce((s, c) => s + (c.revenue || 0), 0) * 100) / 100, target: m.target, direction: 'up', series, rolling: true };
  }
  if (t === 'habit') {
    const h = src.habits.find((x) => x.id === g.source.ref); if (!h) return { missing: true };
    const cur = habitStreak(h, today);
    // Stützpunkte: wöchentlich, dazu der Vortag des Monatsbeginns (damit „seit Monatsbeginn“ exakt aus der Serie kommt)
    const days = [...new Set([-35, -28, -21, -14, -7, 0].map((d) => addDaysIso(today, d)).concat(addDaysIso(monthStartIso(today), -1)))].sort();
    return { kind: 'streak', unit: 'Tage', start: 0, current: cur, target: m.target, direction: 'up', series: days.map((d) => ({ date: d, value: habitStreak(h, d) })) };
  }
  if (t === 'checklist') return { kind: 'checklist', unit: 'Schritte', start: 0, direction: 'up', series: [] };
  const snaps = arr(g.snapshots), last = snaps[snaps.length - 1];
  return { kind: 'count', unit: m.unit || '', start: m.start || 0, current: last ? last.value : m.start || 0, target: m.target, direction: m.target < (m.start || 0) ? 'down' : 'up',
    series: last && last.date < today ? [...snaps, { date: today, value: last.value }] : snaps };
}

function milestonesOf(g, mv, tasks) {
  const value = mv.msValue ?? mv.current;
  return arr(g.milestones).map((m) => {
    const t = m.taskId ? tasks.find((x) => x.id === m.taskId) : null;
    let done = !!m.done;
    if (m.taskId) done = !!t && !isOpenTask(t);
    else if (m.at != null) done = mv.direction === 'down' ? value <= m.at : value >= m.at;
    return { id: m.id, title: m.title, at: m.at ?? null, taskId: m.taskId || null, due: t?.due || null, taskStatus: t?.status || null, done, doneAt: m.doneAt || (t?.doneAt || null), manual: m.at == null && !m.taskId };
  });
}

function nextOf(g, ms, tasks, mv, needed) {
  const pick = (id) => { const t = tasks.find((x) => x.id === id); return isOpenTask(t) ? t : null; };
  const t = pick(g.nextTaskId) || pick(ms.find((m) => m.taskId && !m.done)?.taskId);
  if (t) return { kind: 'task', taskId: t.id, title: t.title, due: t.due || null, priority: t.priority || null, project: t.project || null, taskStatus: t.status || null, to: 'tasks.detail' };
  if (mv.kind === 'amount' && !mv.rolling && !mv.paused && !mv.monthly && needed > 0) return { kind: 'hint', title: 'Sparrate festlegen', amount: needed, to: 'savings.goals' };
  if (g.nextHint) return { kind: 'hint', title: g.nextHint.title, to: g.nextHint.to };
  return null;
}

/** Ein Ziel mit allen abgeleiteten Werten (view). */
export function deriveGoal(g, src) {
  const today = src.today;
  const mv = measureOf(g, src);
  const area = src.areas.find((a) => a.id === g.area) || AREAS.find((a) => a.id === g.area) || AREAS[0];
  const base = { ...g, areaName: area.name, areaIcon: area.icon, areaTone: area.tone, source: { module: 'goals', to: 'goals.detail', ...g.source } };
  if (mv.missing) return { ...base, kind: 'count', unit: '', current: 0, target: 0, start: 0, progress: 0, state: 'new', stateLabel: STATE_LABEL.new, tone: STATE_TONE.new, series: [], milestones: [], doneCount: 0, next: null, missing: true, due: g.due || null, daysLeft: null };
  const due = mv.due || g.due || null;
  const ms = milestonesOf(g, mv, src.tasks);
  const doneCount = ms.filter((m) => m.done).length;
  let progress;
  if (mv.kind === 'checklist') progress = ms.length ? doneCount / ms.length : 0;
  else if (mv.kind === 'weekly') progress = clamp01(mv.current / (mv.target || 1));
  else if (mv.kind === 'weight' && Number.isFinite(mv.progressSrc)) progress = clamp01(mv.progressSrc);
  else if (mv.direction === 'down') progress = clamp01((mv.start - mv.current) / ((mv.start - mv.target) || 1));
  else progress = clamp01((mv.current - mv.start) / ((mv.target - mv.start) || 1));
  const current = mv.kind === 'checklist' ? doneCount : mv.current, target = mv.kind === 'checklist' ? ms.length : mv.target;
  const remaining = mv.direction === 'down' ? Math.max(0, current - target) : Math.max(0, (target || 0) - (current || 0));
  const daysLeft = due ? diffDays(today, due) : null;
  const expected = g.since && due && !mv.rolling && due > g.since ? clamp01(diffDays(g.since, today) / diffDays(g.since, due)) : null;
  const left = due ? monthsLeft(today, due) : null;
  // Nötige Monatsrate: bei Sparzielen genau die Rechnung aus Sparpläne (goalForecast), sonst ohne Rendite gleichmäßig verteilt
  const needed = mv.kind === 'amount' && !mv.rolling && due && remaining > 0 ? Math.round((mv.requiredSrc ?? remaining / Math.max(1, left || 1)) * 100) / 100 : 0;
  let eta = null;
  if (mv.kind === 'amount' && !mv.rolling && !mv.paused && mv.monthly > 0 && remaining > 0) eta = mv.etaSrc || addMonthsIso(today, Math.ceil(remaining / mv.monthly));
  else if (mv.kind === 'weight' && remaining > 0 && mv.etaWeeks) eta = addDaysIso(today, mv.etaWeeks * 7);
  else if (mv.kind === 'count' && g.since && current > mv.start && remaining > 0) eta = addDaysIso(today, Math.ceil(remaining / ((current - mv.start) / Math.max(1, diffDays(g.since, today)))));

  let state;
  if (progress >= 1 && mv.kind !== 'weekly') state = 'done';
  else if (g.status === 'paused' || mv.paused) state = 'paused';
  else if (mv.kind === 'weekly') state = mv.streakWeeks > 0 ? 'on-track' : 'new';
  else if (mv.kind === 'weight') state = 'on-track';
  else if (mv.rolling) state = progress >= 0.85 ? 'ahead' : progress >= 0.6 ? 'on-track' : 'behind';
  else if (eta && due) state = eta <= due ? (expected != null && progress - expected > 0.1 ? 'ahead' : 'on-track') : 'behind';
  else if (expected == null) state = 'on-track';
  else state = progress - expected > 0.08 ? 'ahead' : progress - expected >= -0.08 ? 'on-track' : 'behind';

  return { ...base, ...mv, due, kind: mv.kind, current, target, remaining, progress, expected, daysLeft, needed, eta, state, stateLabel: STATE_LABEL[state], tone: STATE_TONE[state],
    milestones: ms, doneCount, next: nextOf(g, ms, src.tasks, mv, needed), numbersHidden: !!g.hideNumbers && mv.kind === 'weight' };
}

export const deriveAll = (goals, src) => arr(goals).filter((g) => !g.archived).map((g) => deriveGoal(g, src));
export const focusOf = (views) => views.filter((v) => v.focus);
export const groupByArea = (views, areas = AREAS) => areas.map((a) => ({ area: a, items: views.filter((v) => v.area === a.id) })).concat(
  [{ area: { id: 'sonst', name: 'Weitere', icon: 'target', tone: 6 }, items: views.filter((v) => !areas.some((a) => a.id === v.area)) }]).filter((g) => g.items.length);
export const isOk = (v) => ['done', 'ahead', 'on-track'].includes(v.state);

/** Wochenfokus umschalten: höchstens FOCUS_MAX; ein weiteres Ziel wird nicht still verworfen, sondern abgelehnt (mit Grund). */
export function toggleFocus(goals, id) {
  const list = arr(goals), g = list.find((x) => x.id === id);
  if (!g) return { goals: list, blocked: null };
  const on = list.filter((x) => x.focus && !x.archived);
  if (g.focus) return { goals: list.map((x) => (x.id === id ? { ...x, focus: false } : x)), blocked: null };
  if (on.length >= FOCUS_MAX) return { goals: list, blocked: { reason: `Höchstens ${FOCUS_MAX} Ziele im Wochenfokus – so bleibt jedes Ziel greifbar. Nimm zuerst eines heraus.`, focused: on.map((x) => x.id) } };
  return { goals: list.map((x) => (x.id === id ? { ...x, focus: true } : x)), blocked: null };
}
/** Tausch: ein Ziel aus dem Fokus nehmen und ein anderes hineinsetzen. */
export const swapFocus = (goals, outId, inId) => arr(goals).map((x) => (x.id === outId ? { ...x, focus: false } : x.id === inId ? { ...x, focus: true } : x));

/** Veränderung im Monat ab `monthStart` (Wert, Einheit je Art); null, wenn nicht ableitbar. */
export function monthDelta(v, monthStart) {
  if (v.kind === 'checklist') return { value: v.milestones.filter((m) => m.done && m.doneAt && m.doneAt >= monthStart).length, mode: 'steps' };
  if (v.kind === 'weekly') return { value: v.series.filter((p) => p.date >= monthStart).reduce((s, p) => s + p.value, 0), mode: 'sessions' };
  if (!v.series.length) return null;
  const before = valueAt(v.series, addDaysIso(monthStart, -1));
  if (before == null) return null;
  // Rollende Werte (Umsatz der letzten 30 Tage) sind kein Monatswert: Richtung ja, „seit Monatsbeginn“ nein.
  return { value: Math.round((v.current - before) * 100) / 100, mode: v.rolling ? 'window' : 'diff' };
}

// ------------------------------------------------------------------ Aggregate (Launchpad, Hinweise, Suche, Mitteilungen)
export function summaryOf(views) {
  if (!views.length) return { kpis: [{ label: 'Ziele', value: 0, icon: 'target', tone: 'neutral', to: 'goals.create' }] };
  const ok = views.filter(isOk).length, focus = focusOf(views).length;
  const nextDue = views.filter((v) => v.due && v.state !== 'done' && v.daysLeft != null && v.daysLeft >= 0 && v.daysLeft <= 14).sort((a, b) => a.due.localeCompare(b.due))[0];
  return { kpis: [
    { label: 'Ziele im Plan', value: `${ok} von ${views.length}`, icon: 'target', tone: 'accent', to: 'goals.home' },
    { label: 'Wochenfokus', value: focus === 1 ? '1 Ziel' : `${focus} Ziele`, icon: 'star', tone: 'info', to: 'goals.week' },
    { label: 'Nächste Frist', value: nextDue ? `${nextDue.due.slice(8, 10)}.${nextDue.due.slice(5, 7)}.` : '–', icon: 'calendar-clock', tone: 'neutral', to: nextDue ? 'goals.detail' : 'goals.home' },
  ] };
}
