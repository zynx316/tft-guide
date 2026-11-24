// Ziele: Rechenlogik (Ableitung aus den Quellen, Fristen, Zustände, Wochenfokus, Monatsveränderung, Anlegen). Rein, ohne Browser.
import './_helpers.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addDaysIso, addMonthsIso, diffDays, weekStartIso, habitStreak, deriveGoal, toggleFocus, swapFocus, monthDelta, summaryOf, FOCUS_MAX, sourcesOf, valueAt, groupByArea } from '../app/src/library/components/goals/_calc.js';
import { savingsHistory } from '../app/src/library/components/goals/_calc.js';
import { sourceOptions, buildGoal } from '../app/src/library/components/goals/_create.js';

const TODAY = '2026-11-24';
const src = (over = {}) => sourcesOf({ tasks: [], savingsGoals: [], habits: [], channels: [], weeklyTraining: [], ...over }, TODAY);
const savingsGoal = (o = {}) => ({ id: 's1', name: 'Reise', target: 6000, current: 2000, due: '2027-09-01', monthly: 0, ...o });
const goal = (o = {}) => ({ id: 'g1', title: 'Reise', area: 'finanzen', since: '2026-03-01', due: null, source: { type: 'savings', ref: 's1' }, milestones: [], ...o });

test('Datumshelfer: Tage, Monate, Wochenbeginn', () => {
  assert.equal(addDaysIso('2026-11-30', 1), '2026-12-01');
  assert.equal(addMonthsIso('2026-01-31', 1), '2026-02-28');
  assert.equal(addMonthsIso(TODAY, 3), '2027-02-24');
  assert.equal(diffDays('2026-11-24', '2026-11-27'), 3);
  assert.equal(weekStartIso(TODAY), '2026-11-23');
});

test('Fristen: Tage bis zum Zieldatum, ohne Datum ist die Frist leer', () => {
  const s = src({ savingsGoals: [savingsGoal()] });
  assert.equal(deriveGoal(goal(), s).daysLeft, 281);
  const open = deriveGoal(goal({ due: null }), src({ savingsGoals: [savingsGoal({ due: null })] }));
  assert.equal(open.daysLeft, null);
  assert.equal(open.due, null);
});

test('Sparziel: Wert, Ziel und Frist kommen aus der Quelle, nicht aus dem Ziel', () => {
  const v = deriveGoal(goal(), src({ savingsGoals: [savingsGoal()] }));
  assert.equal(v.current, 2000); assert.equal(v.target, 6000); assert.equal(v.due, '2027-09-01');
  assert.ok(Math.abs(v.progress - 1 / 3) < 1e-9);
  assert.equal(v.kind, 'amount');
});

test('Sparziel ohne Rate: nötige Monatsrate wird berechnet, Zustand „hinter dem Plan“ ohne Alarm; nächster Schritt ist ein Hinweis in Sparpläne', () => {
  const v = deriveGoal(goal(), src({ savingsGoals: [savingsGoal()] }));
  assert.equal(v.state, 'behind'); assert.equal(v.stateLabel, 'Etwas hinter dem Plan');
  assert.equal(v.needed, 444.44);   // 4.000 € in 9 vollen Monaten, ohne Rendite: dieselbe Rechnung wie in Sparpläne
  assert.equal(v.next.kind, 'hint'); assert.equal(v.next.to, 'savings.goals'); assert.equal(v.next.amount, 444.44);
});

test('Sparziel mit Rate: voraussichtliches Datum, im Plan, wenn es vor dem Zieldatum liegt', () => {
  const v = deriveGoal(goal(), src({ savingsGoals: [savingsGoal({ monthly: 500 })] }));
  assert.equal(v.eta, addMonthsIso(TODAY, 8));
  assert.ok(['on-track', 'ahead'].includes(v.state));
  const slow = deriveGoal(goal(), src({ savingsGoals: [savingsGoal({ monthly: 100 })] }));
  assert.equal(slow.state, 'behind');
});

test('Pausiertes Sparziel bleibt sichtbar und heißt „Pausiert“', () => {
  const v = deriveGoal(goal(), src({ savingsGoals: [savingsGoal({ paused: true, monthly: 100 })] }));
  assert.equal(v.state, 'paused'); assert.equal(v.eta, null);
});

test('Erreichtes Ziel: Zustand „Erreicht“, Fortschritt 100 %', () => {
  const v = deriveGoal(goal(), src({ savingsGoals: [savingsGoal({ current: 6000 })] }));
  assert.equal(v.state, 'done'); assert.equal(v.progress, 1);
  assert.equal(deriveGoal(goal(), src({ savingsGoals: [savingsGoal({ current: 9000 })] })).progress, 1);
});

test('Quelle fehlt (Sparziel gelöscht): Ziel bleibt lesbar, kein Absturz', () => {
  const v = deriveGoal(goal({ source: { type: 'savings', ref: 'weg' } }), src());
  assert.equal(v.missing, true); assert.equal(v.progress, 0);
});

test('Gewicht: Trend statt Tageswert, nie „hinter dem Plan“, Zahlen ausblendbar', () => {
  const body = { startKg: 80, goalKg: 77, trendKg: 78.5, weightKg: 78.4, weekDeltaKg: -0.3, perWeekKg: 0.14, etaWeeks: 10 };
  const g = { id: 'w', title: 'Zielgewicht', area: 'gesundheit', since: '2026-09-01', due: '2026-12-01', source: { type: 'weight' }, milestones: [{ id: 'm', title: '1 kg', at: 79 }, { id: 'n', title: 'Ziel', at: 77 }] };
  const v = deriveGoal(g, src({ bodySummary: body, bodyWeightLog: [{ date: '2026-11-23', kg: 78.7 }, { date: '2026-11-24', kg: 78.4 }] }));
  assert.equal(v.current, 78.5); assert.equal(v.progress, 0.5); assert.equal(v.state, 'on-track');
  assert.deepEqual(v.milestones.map((m) => m.done), [true, false]);
  assert.equal(v.eta, addDaysIso(TODAY, 70));
  assert.equal(deriveGoal({ ...g, hideNumbers: true }, src({ bodySummary: body })).numbersHidden, true);
});

test('Training: Wochenzähler und Serie aus Fitness, Meilensteine zählen Wochen', () => {
  const g = { id: 't', title: 'Training', area: 'gesundheit', since: '2026-08-31', source: { type: 'training' }, milestones: [{ id: 'a', title: '12 Wochen', at: 12 }, { id: 'b', title: '16 Wochen', at: 16 }] };
  const v = deriveGoal(g, src({ weeklyTraining: [{ week: '2026-11-16', sessions: 3, goal: 3 }, { week: '2026-11-23', sessions: 1, goal: 3, current: true }], fitnessStreak: { weeks: 12, jokersLeft: 1 } }));
  assert.equal(v.kind, 'weekly'); assert.equal(v.current, 1); assert.equal(v.target, 3); assert.equal(v.streakWeeks, 12);
  assert.deepEqual(v.milestones.map((m) => m.done), [true, false]);
  assert.equal(v.state, 'on-track');
});

test('Gewohnheiten-Serie: heute zählt nur, wenn erledigt; Werktags-Gewohnheiten überspringen das Wochenende', () => {
  const log = (days) => Object.fromEntries(days.map((d) => [d, 1]));
  const h = { id: 'h', since: '2026-11-01', rhythm: { type: 'daily' }, log: log(['2026-11-22', '2026-11-23']) };
  assert.equal(habitStreak(h, TODAY), 2);
  assert.equal(habitStreak({ ...h, log: log(['2026-11-22', '2026-11-23', TODAY]) }, TODAY), 3);
  const wk = { id: 'w', since: '2026-11-01', rhythm: { type: 'weekdays' }, log: log(['2026-11-19', '2026-11-20', '2026-11-23', TODAY]) };
  assert.equal(habitStreak(wk, TODAY), 4, 'Sa und So brechen die Serie nicht');
  assert.equal(habitStreak({ ...h, log: {} }, TODAY), 0);
});

test('Umsatz: Summe der Kanäle der letzten 30 Tage gegen das Ziel, laufendes Ziel ohne Fristen', () => {
  const g = { id: 'u', title: 'Umsatz', area: 'business', since: '2026-10-25', rolling: true, source: { type: 'sales' }, measure: { unit: '€', start: 0, target: 18000 } };
  const v = deriveGoal(g, src({ channels: [{ id: 'a', revenue: 9000, trend: [8000, 9000] }, { id: 'b', revenue: 6000, trend: [5000, 6000] }] }));
  assert.equal(v.current, 15000); assert.ok(Math.abs(v.progress - 15000 / 18000) < 1e-9); assert.equal(v.expected, null); assert.equal(v.state, 'on-track');
  assert.equal(v.series.at(-1).value, 15000);
});

test('Checkliste: Fortschritt aus erledigten Aufgaben, nächster Schritt ist die erste offene Aufgabe', () => {
  const g = { id: 'c', title: 'Black Friday', area: 'business', since: '2026-11-10', due: '2026-11-27', source: { type: 'checklist' }, milestones: [{ id: '1', title: 'Lager', done: true }, { id: '2', title: 'Newsletter', taskId: 't6' }, { id: '3', title: 'Fotos', taskId: 't3' }] };
  const tasks = [{ id: 't6', title: 'Newsletter planen', due: '2026-11-24T16:30:00', status: 'In Arbeit' }, { id: 't3', title: 'Fotos', done: true, status: 'Erledigt' }];
  const v = deriveGoal(g, src({ tasks }));
  assert.equal(v.kind, 'checklist'); assert.equal(v.current, 2); assert.equal(v.target, 3);
  assert.equal(v.next.kind, 'task'); assert.equal(v.next.taskId, 't6'); assert.equal(v.next.to, 'tasks.detail');
  const all = deriveGoal(g, src({ tasks: tasks.map((t) => ({ ...t, done: true, status: 'Erledigt' })) }));
  assert.equal(all.state, 'done'); assert.equal(all.next, null);
});

test('Eigener Zähler: letzter Monatsstand ist der Wert; „hinter dem Plan“ nur nach der Zeit, nicht nach Schwellen', () => {
  const g = { id: 'b', title: '12 Bücher', area: 'persoenlich', since: '2026-01-01', due: '2026-12-31', source: { type: 'manual' }, measure: { unit: 'Bücher', start: 0, target: 12 }, snapshots: [{ date: '2026-06-30', value: 6 }, { date: '2026-10-31', value: 9 }] };
  const v = deriveGoal(g, src());
  assert.equal(v.current, 9); assert.equal(v.progress, 0.75); assert.equal(v.state, 'behind');
  assert.equal(v.series.at(-1).date, TODAY);
  assert.equal(deriveGoal({ ...g, snapshots: [...g.snapshots, { date: '2026-11-20', value: 11 }] }, src()).state, 'on-track');
});

test('Wochenfokus: höchstens drei, ein viertes wird mit Grund abgelehnt, Tausch möglich', () => {
  const list = ['a', 'b', 'c', 'd'].map((id, i) => ({ id, focus: i < 3 }));
  assert.equal(FOCUS_MAX, 3);
  const r = toggleFocus(list, 'd');
  assert.ok(r.blocked && /Höchstens 3/.test(r.blocked.reason)); assert.deepEqual(r.blocked.focused, ['a', 'b', 'c']);
  assert.equal(r.goals.filter((g) => g.focus).length, 3);
  assert.equal(toggleFocus(list, 'a').goals.filter((g) => g.focus).length, 2);
  const free = toggleFocus(toggleFocus(list, 'a').goals, 'd');
  assert.equal(free.blocked, null); assert.equal(free.goals.filter((g) => g.focus).length, 3);
  const sw = swapFocus(list, 'b', 'd');
  assert.deepEqual(sw.filter((g) => g.focus).map((g) => g.id), ['a', 'c', 'd']);
});

test('Monatsveränderung: Betrag aus dem zurückgerechneten Verlauf, Training aus Wochen, Schritte aus Meilensteinen', () => {
  const plan = { id: 'p1', goalId: 's1', accountId: 'a', monthly: 100, day: 1, intervalMonths: 1, startDate: '2026-01-01', active: true };
  const s = src({ savingsGoals: [savingsGoal({ current: 2150, monthly: 100 })], savingsPlans: [plan] });
  const v = deriveGoal(goal(), s);
  assert.deepEqual(monthDelta(v, '2026-11-01'), { value: 100, mode: 'diff' });   // am 01.11. lief die Rate einmal
  assert.deepEqual(v.series.slice(-2).map((p) => p.value), [2050, 2150]);
  const t = deriveGoal({ id: 't', title: 'T', area: 'gesundheit', source: { type: 'training' }, milestones: [] }, src({ weeklyTraining: [{ week: '2026-10-26', sessions: 3, goal: 3 }, { week: '2026-11-02', sessions: 3, goal: 3 }, { week: '2026-11-23', sessions: 1, goal: 3, current: true }] }));
  assert.deepEqual(monthDelta(t, '2026-11-01'), { value: 4, mode: 'sessions' });
  assert.equal(valueAt([{ date: '2026-10-01', value: 1 }, { date: '2026-11-01', value: 2 }], '2026-10-15'), 1);
});

test('Sparziel-Verlauf wird zurückgerechnet statt gespeichert: ohne Rate bleibt er flach, ruhende Pläne zählen nicht, nie vor dem Start', () => {
  const sg = savingsGoal({ current: 2150 });
  const flat = savingsHistory(sg, [], '2026-03-01', TODAY);
  assert.ok(flat.length >= 5 && flat.every((p) => p.value === 2150));
  const paused = { id: 'p', goalId: 's1', accountId: 'a', monthly: 100, day: 15, intervalMonths: 1, startDate: '2026-03-15', active: false };
  assert.ok(savingsHistory(sg, [paused], '2026-03-01', TODAY).every((p) => p.value === 2150));
  const depot = { id: 'd', goalId: 's1', positionId: 'x', monthly: 300, day: 1, intervalMonths: 1, startDate: '2021-03-01', active: true };
  assert.ok(savingsHistory(sg, [depot], '2026-03-01', TODAY).every((p) => p.value === 2150), 'Depotwerte folgen dem Markt, nicht der Rate');
  const act = { ...paused, active: true, day: 1, startDate: '2026-01-01' };
  const h = savingsHistory(sg, [act], '2026-09-15', TODAY);
  assert.deepEqual(h.map((p) => [p.date, p.value]), [['2026-09-30', 1950], ['2026-10-31', 2050]]);
});

test('Monatsveränderung Serie: exakt aus der Serie am Vortag des Monatsbeginns (nicht aus dem letzten Wochen-Stützpunkt)', () => {
  const log = {}; for (let d = 1; d <= 24; d++) log[`2026-11-${String(d).padStart(2, '0')}`] = 1; for (let d = 1; d <= 31; d++) log[`2026-10-${String(d).padStart(2, '0')}`] = 1;
  const h = { id: 'h', since: '2026-09-01', rhythm: { type: 'daily' }, goal: { target: 1 }, log };
  const v = deriveGoal({ id: 'g', title: 'Serie', area: 'gesundheit', since: '2026-09-01', source: { type: 'habit', ref: 'h' }, measure: { unit: 'Tage', start: 0, target: 100 }, milestones: [] }, src({ habits: [h] }));
  assert.equal(v.current, 55);
  assert.deepEqual(monthDelta(v, '2026-11-01'), { value: 24, mode: 'diff' });
});

test('Rollender Umsatz: kein „seit Monatsbeginn“, sondern Fenster-Modus', () => {
  const g = { id: 'u', title: 'Umsatz', area: 'business', since: '2026-10-25', rolling: true, source: { type: 'sales' }, measure: { unit: '€', start: 0, target: 18000 } };
  const v = deriveGoal(g, src({ channels: [{ id: 'a', revenue: 9000, trend: [7000, 8000, 9000] }] }));
  assert.equal(monthDelta(v, '2026-11-01').mode, 'window');
});

test('Gewicht: Fortschritt kommt unverändert aus Fitness (bodySummary.progress)', () => {
  const body = { startKg: 80, goalKg: 77, trendKg: 78.5, progress: 0.5077, weightKg: 78.4, etaWeeks: 10 };
  const g = { id: 'w', title: 'Zielgewicht erreichen', area: 'gesundheit', since: '2026-09-01', source: { type: 'weight' }, milestones: [] };
  assert.equal(deriveGoal(g, src({ bodySummary: body })).progress, 0.5077);
});

test('Kennzahlen: erste Kennzahl ohne Betrag, leer ohne Ziele eine Einladung', () => {
  const s = summaryOf([]);
  assert.equal(s.kpis[0].to, 'goals.create');
  const v = deriveGoal(goal({ focus: true }), src({ savingsGoals: [savingsGoal({ current: 6000 })] }));
  const k = summaryOf([v]);
  assert.equal(k.kpis[0].value, '1 von 1'); assert.equal(k.kpis[1].value, '1 Ziel');
});

test('Gruppierung nach Lebensbereich: unbekannte Bereiche landen unter „Weitere“', () => {
  const g = groupByArea([{ id: '1', area: 'finanzen' }, { id: '2', area: 'xyz' }]);
  assert.deepEqual(g.map((x) => x.area.id), ['finanzen', 'sonst']);
});

test('Anlegen: zu einer Quelle nur ein Ziel, Sparziele werden verknüpft statt kopiert', () => {
  const s = src({ savingsGoals: [savingsGoal(), savingsGoal({ id: 's2', name: 'Rente' })], bodySummary: { startKg: 80, goalKg: 77 }, habits: [{ id: 'h1', name: 'Vitamin D', rhythm: { type: 'daily' } }, { id: 'h2', name: 'Training', rhythm: { type: 'perWeek' } }] });
  const opts = sourceOptions(s, [goal()]);
  assert.equal(opts.find((o) => o.key === 'savings:s1').used, true);
  assert.equal(opts.find((o) => o.key === 'savings:s2').used, false);
  assert.ok(!opts.some((o) => o.key === 'habit:h2'), 'Wochenziel-Gewohnheiten haben keine Tages-Serie');
  assert.ok(opts.some((o) => o.key === 'manual'));
  const g = buildGoal({ option: opts.find((o) => o.key === 'savings:s2'), area: 'finanzen', focus: true, due: null }, { id: 'g9', today: TODAY, src: s });
  assert.equal(g.source.ref, 's2'); assert.equal(g.title, 'Rente'); assert.equal(g.source.to, 'savings.goals');
  assert.ok(!('current' in g) && !('target' in g), 'kein Wert im Ziel kopiert');
  assert.deepEqual(g.milestones.map((m) => m.at), [3000, 6000]);
});

test('Anlegen: eigener Zähler startet bei 0, Gewicht bekommt Meilensteine aus dem Profil', () => {
  const s = src({ bodySummary: { startKg: 80, goalKg: 77 } });
  const m = buildGoal({ title: ' Bücher ', unit: 'Bücher', target: 10, option: { type: 'manual' }, area: 'persoenlich' }, { id: 'g1', today: TODAY, src: s });
  assert.equal(m.title, 'Bücher'); assert.deepEqual(m.snapshots, [{ date: TODAY, value: 0 }]); assert.equal(m.measure.target, 10);
  const w = buildGoal({ option: { type: 'weight', title: 'Zielgewicht erreichen' }, area: 'gesundheit' }, { id: 'g2', today: TODAY, src: s });
  assert.deepEqual(w.milestones.map((x) => x.at), [78.5, 77]);
});
