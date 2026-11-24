// Ziele: Welt-Konsistenz mit den Quellmodulen (Sparziele, Gewicht, Training, Umsatz, Gewohnheiten, Aufgaben) und Szenarien.
import './_helpers.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WORLD } from '../app/src/seed/world/index.js';
import { applyScenario } from '../app/src/core/world.js';
import { MANIFESTS } from '../app/src/seed/index.js';
import { goalForecast } from '../app/src/library/components/savings/_plans.js';
import { sourcesOf, deriveAll, FOCUS_MAX, habitStreak, monthDelta, monthStartIso } from '../app/src/library/components/goals/_calc.js';

const W = WORLD, TODAY = '2026-11-24';
const worlds = { alltag: applyScenario(WORLD, 'alltag'), erststart: applyScenario(WORLD, 'erststart'), stress: applyScenario(WORLD, 'stress') };
const viewsOf = (w) => deriveAll(w.goals, sourcesOf(w, TODAY));
const FEATURES = new Set(MANIFESTS.flatMap((m) => m.features.map((f) => f.id)));
const approx = (a, b, t = 0.011) => Math.abs(a - b) <= t;

test('Welt: goals, goalAreas, goalsSummary, goalsHints, goalsSearch, goalsNotifications und Szenarien sind vorhanden', () => {
  for (const k of ['goals', 'goalAreas', 'goalsSummary', 'goalsHints', 'goalsSearch', 'goalsNotifications']) assert.ok(k in W, k);
  assert.ok(W.goals.length >= 8 && W.goals.length <= 12, 'wenige, wichtige Ziele');
  assert.deepEqual(W.goalAreas.map((a) => a.id), ['gesundheit', 'finanzen', 'business', 'persoenlich']);
  assert.equal(new Set(W.goals.map((g) => g.id)).size, W.goals.length);
  for (const g of W.goals) { assert.ok(W.goalAreas.some((a) => a.id === g.area), `${g.id}: Bereich`); assert.ok(g.why && g.title, `${g.id}: Titel und Warum`); assert.ok(g.source?.to && g.source?.label, `${g.id}: Quelle mit Ziel`); assert.ok(FEATURES.has(g.source.to), `${g.id}: Quelle führt zu ${g.source.to}`); }
});

test('Eigentum: Ziele speichern keine Werte der Fachmodule (kein current/target/Betrag im Ziel, Sparziel nur als Verweis)', () => {
  for (const g of W.goals) { assert.ok(!('current' in g) && !('value' in g) && !('amount' in g), `${g.id}: kein kopierter Wert`); }
  for (const g of W.goals.filter((x) => x.source.type === 'savings')) { assert.ok(W.savingsGoals.some((s) => s.id === g.source.ref), `${g.id}: Sparziel ${g.source.ref} existiert`); assert.ok(!g.measure, `${g.id}: Zielbetrag kommt aus savingsGoals`); assert.ok(!('snapshots' in g), `${g.id}: Verlauf wird aus Sparplänen abgeleitet, nicht kopiert`); }
  for (const g of W.goals.filter((x) => !['manual'].includes(x.source.type))) assert.ok(!('snapshots' in g), `${g.id}: eigene Monatsstände nur bei eigenen Zählern`);
});

test('Sparziele werden nicht dupliziert: höchstens ein Ziel je Quelle, abgeleiteter Wert = Wert der Quelle', () => {
  const keys = W.goals.map((g) => `${g.source.type}:${g.source.ref || ''}`).filter((k) => !k.startsWith('manual') && !k.startsWith('checklist'));
  assert.equal(new Set(keys).size, keys.length, 'doppelte Quelle');
  const titles = W.goals.map((g) => g.title.toLowerCase());
  assert.equal(new Set(titles).size, titles.length);
  for (const v of viewsOf(W).filter((x) => x.source.type === 'savings')) {
    const s = W.savingsGoals.find((x) => x.id === v.source.ref);
    assert.equal(v.current, s.current, `${v.id}: Stand`); assert.equal(v.target, s.target, `${v.id}: Ziel`); assert.equal(v.due, s.due, `${v.id}: Frist`); assert.equal(v.paused, !!s.paused);
  }
});

test('Ableitungen: Gewichtstrend, Training, Umsatz und Serie stimmen mit den Eigentümer-Welten überein', () => {
  const by = Object.fromEntries(viewsOf(W).map((v) => [v.id, v]));
  assert.equal(by['g-gewicht'].current, W.bodySummary.trendKg); assert.equal(by['g-gewicht'].target, W.bodySummary.goalKg);
  assert.equal(by['g-gewicht'].progress, W.bodySummary.progress);
  assert.equal(by['g-training'].streakWeeks, W.fitnessStreak.weeks); assert.equal(by['g-training'].target, W.fitnessProfile.weeklyGoal);
  assert.equal(by['g-training'].current, W.weeklyTraining.find((w) => w.current).sessions);
  assert.ok(approx(by['g-umsatz'].current, W.channels.reduce((s, c) => s + c.revenue, 0)));
  const h = W.habits.find((x) => x.id === 'h-vitd'); assert.equal(by['g-vitd'].current, habitStreak(h, TODAY));
  assert.ok(by['g-vitd'].current >= 50, 'Persona: Serie 55 Tage');
});

test('Sparrate: dieselbe nötige Monatsrate wie in Sparpläne (Japan-Reise ohne Rate)', () => {
  const jp = viewsOf(W).find((v) => v.id === 'g-japan');
  const f = goalForecast(W.savingsGoals.find((x) => x.id === 'g-japan'), W.savingsPlans, new Date(2026, 10, 24, 9, 30));
  assert.equal(jp.needed, Math.round(f.required * 100) / 100); assert.equal(Math.round(jp.needed), 428);
  for (const id of ['g-notgroschen', 'g-ebike']) { const v = viewsOf(W).find((x) => x.id === id), ff = goalForecast(W.savingsGoals.find((x) => x.id === v.source.ref), W.savingsPlans, new Date(2026, 10, 24, 9, 30)); assert.equal(v.needed, Math.round(ff.required * 100) / 100, id); }
  assert.equal(jp.next.amount, jp.needed);
  assert.match(W.goalsHints.find((h) => h.id === 'h-goals-japan').text, /428 €/);
});

test('Monatsrückblick: Veränderungen aus den Quellen (Serie Vitamin D +24 Tage, Notgroschen +150 €, Japan unverändert, Umsatz im Fenster-Modus)', () => {
  const by = Object.fromEntries(viewsOf(W).map((v) => [v.id, v])), ms = monthStartIso(TODAY);
  assert.deepEqual(monthDelta(by['g-vitd'], ms), { value: 24, mode: 'diff' });
  assert.deepEqual(monthDelta(by['g-notgroschen'], ms), { value: 150, mode: 'diff' });
  assert.equal(monthDelta(by['g-japan'], ms).value, 0);
  assert.equal(monthDelta(by['g-umsatz'], ms).mode, 'window');
});

test('Gesundheit: kein Zieltitel und kein Meilenstein des Gewichtsziels enthält eine Kilogramm-Angabe (Zahlen ausblenden muss reichen)', () => {
  const g = W.goals.find((x) => x.id === 'g-gewicht');
  assert.ok(!/\d|\bkg\b|kilo/i.test([g.title, g.why, ...g.milestones.map((m) => m.title), g.nextHint?.title].join(' ')), 'Texte ohne Zahl');
  assert.ok(!W.goalsSearch.some((s) => /\bkg\b/.test(`${s.title} ${s.subtitle}`)));
  assert.ok(!W.goalsHints.concat(W.goalsNotifications).some((h) => /\bkg\b/.test(h.text)));
});

test('Wochenfokus: höchstens drei Ziele, alle existieren; Aufgaben-Verknüpfungen zeigen auf vorhandene Aufgaben', () => {
  assert.ok(W.goals.filter((g) => g.focus).length <= FOCUS_MAX);
  assert.equal(W.goals.filter((g) => g.focus).length, 3);
  const ids = new Set(W.tasks.map((t) => t.id));
  for (const g of W.goals) { if (g.nextTaskId) assert.ok(ids.has(g.nextTaskId), `${g.id}: nextTaskId`); for (const m of g.milestones) if (m.taskId) assert.ok(ids.has(m.taskId), `${g.id}/${m.id}: taskId`); }
});

test('Ziele zeigen einen nächsten Schritt (Aufgabe aus tasks oder Hinweis in ein Quellmodul), Hinweise führen zu vorhandenen Features', () => {
  for (const v of viewsOf(W)) { if (v.state === 'done') continue; assert.ok(v.next, `${v.id}: nächster Schritt`); if (v.next.kind === 'task') assert.ok(W.tasks.some((t) => t.id === v.next.taskId)); else assert.ok(FEATURES.has(v.next.to), `${v.id}: ${v.next.to}`); }
});

test('Gesundheits-Leitplanken: kein Zustand „Alarm“, Körperziele nie „hinter dem Plan“, Hinweise im Gesundheitskontext nie „danger“', () => {
  for (const v of viewsOf(W)) assert.ok(!['danger', 'warning'].includes(v.tone), `${v.id}: Ton ${v.tone}`);
  for (const v of viewsOf(W).filter((x) => ['weight', 'weekly'].includes(x.kind))) assert.notEqual(v.state, 'behind', v.id);
  for (const x of [...W.goalsHints, ...W.goalsNotifications]) assert.notEqual(x.tone, 'danger');
});

test('Kennzahlen: erste Kennzahl für das Launchpad ohne Betrag, Zähler passen zu den Zielen', () => {
  const k = W.goalsSummary.kpis;
  assert.ok(!/€/.test(`${k[0].value}${k[0].unit || ''}`));
  const views = viewsOf(W), ok = views.filter((v) => ['done', 'ahead', 'on-track'].includes(v.state)).length;
  assert.equal(k[0].value, `${ok} von ${views.length}`);
  assert.equal(k[1].value, '3 Ziele'); assert.equal(k[2].value, '27.11.');
});

test('Suche und Mitteilungen: eindeutige IDs (Sparziele haben „goal:“, Ziele „ziel:“), Ziele existieren', () => {
  assert.equal(W.goalsSearch.length, W.goals.length);
  for (const s of W.goalsSearch) { assert.match(s.id, /^ziel:/); assert.ok(W.goals.some((g) => g.id === s.params.id)); assert.ok(FEATURES.has(s.to)); }
  for (const n of W.goalsNotifications) assert.ok(FEATURES.has(n.to));
});

test('Szenario Erster Start: keine Ziele, Lebensbereiche bleiben, Kennzahl lädt zum ersten Ziel ein', () => {
  const w = worlds.erststart;
  assert.equal(w.goals.length, 0); assert.equal(w.goalAreas.length, 4);
  assert.equal(w.goalsSummary.kpis[0].to, 'goals.create'); assert.equal(w.goalsSearch.length, 0); assert.equal(w.goalsNotifications.length, 0);
  assert.equal(viewsOf(w).length, 0);
});

test('Szenario Stress: Ziele verdreifacht, IDs eindeutig, Wochenfokus bleibt bei drei, alles ableitbar', () => {
  const w = worlds.stress;
  assert.equal(w.goals.length, W.goals.length * 3);
  assert.equal(new Set(w.goals.map((g) => g.id)).size, w.goals.length);
  assert.equal(w.goals.filter((g) => g.focus).length, 3);
  const views = viewsOf(w);
  assert.equal(views.length, w.goals.length);
  for (const v of views) assert.ok(Number.isFinite(v.progress) && v.progress >= 0 && v.progress <= 1, v.id);
  assert.equal(w.goalsSummary.kpis[0].value.split(' von ')[1], String(w.goals.length));
  assert.ok(w.goals.some((g) => g.title.length > 80), 'lange Titel');
});

test('Szenarien verändern die Seed-Welt nicht', () => {
  const before = JSON.stringify(W.goals);
  applyScenario(WORLD, 'stress'); applyScenario(WORLD, 'erststart');
  assert.equal(JSON.stringify(W.goals), before);
});

test('Modul-Manifest: Startseite mit drei Richtungen, Welt per @world: gebunden, Entscheidungen, Navigation', () => {
  const m = MANIFESTS.find((x) => x.module.id === 'goals');
  assert.equal(m.module.homeFeatureId, 'goals.home'); assert.equal(m.module.stage, 2); assert.equal(m.module.area, 'Tag & Organisation'); assert.equal(m.module.assumption, true);
  const home = m.features.find((f) => f.id === 'goals.home');
  assert.deepEqual(home.variants.map((v) => v.direction).sort(), ['fokus', 'kompakt', 'visuell']);
  assert.equal(home.demoData.goals, '@world:goals'); assert.equal(home.tier, 1); assert.ok(home.acceptance.length >= 3 && home.acceptance.length <= 6);
  const sig = (v) => v.blocks.map((b) => `${b.component}:${b.props?.style || ''}`).join('|');
  assert.equal(new Set(home.variants.map(sig)).size, 3, 'strukturell verschieden');
  assert.deepEqual(m.features.map((f) => f.id), ['goals.home', 'goals.detail', 'goals.create', 'goals.week', 'goals.review', 'goals.settings']);
  assert.deepEqual(Object.fromEntries(m.features.map((f) => [f.id, f.tier])), { 'goals.home': 1, 'goals.detail': 2, 'goals.create': 2, 'goals.week': 2, 'goals.review': 3, 'goals.settings': 3 });
  const dec = m.decisions; assert.ok(dec.length >= 2 && dec.some((d) => d.status === 'open') && dec.some((d) => d.status === 'open' && d.recommendation));
  for (const f of m.features) for (const [k, v] of Object.entries(f.demoData || {})) assert.ok(`${v}`.slice(7) in W, `${f.id}.${k}`);
  for (const f of m.features) for (const i of f.interactions) if (i.to) assert.ok(FEATURES.has(i.to), `${f.id}: ${i.to}`);
});
