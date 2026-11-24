// Datenwelt: Konsistenz-Invarianten W1 bis W17 (docs/DATENWELT.md Abschnitt 7), Aggregate (Summary, Hints, Search, Notifications),
// Referenzen, eindeutige IDs und Szenarien. Jede Invariante läuft gegen die Welt „Alltag“; W1 bis W3, W5, W6, W9, W14 und W15 zusätzlich
// gegen „Erster Start“ und „Stress-Tag“ (W17).
import { near } from './_helpers.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WORLD, WORLD_MODULES, camelOf } from '../app/src/seed/world/index.js';
import { applyScenario } from '../app/src/core/world.js';
import { atwaterPlausible } from '../app/src/core/health.js';
import { MANIFESTS } from '../app/src/seed/index.js';
import { DEFAULT_PREFS } from '../app/src/library/components/crosscut/_system.js';

const NOW = '2026-11-24T09:30:00', TODAY = '2026-11-24';
const SCENARIO_IDS = ['alltag', 'erststart', 'stress'];
const worlds = Object.fromEntries(SCENARIO_IDS.map((id) => [id, applyScenario(WORLD, id)]));
const sum = (list, f) => list.reduce((s, x) => s + f(x), 0);
const r2 = (x) => Math.round(x * 100) / 100;
const arr = (v) => (Array.isArray(v) ? v : []);
const FEATURES = new Set(MANIFESTS.flatMap((m) => m.features.map((f) => f.id)));
const MODULE_IDS = new Set(MANIFESTS.map((m) => m.module.id));

// ------------------------------------------------------------------ Prüfungen je Welt (wiederverwendet für W17) ---
const checks = {
  W1(w, id) {
    const depotSum = r2(sum(arr(w.positions), (p) => p.value) + w.depotCash);
    assert.ok(near(w.depotValue, depotSum), `${id}: depotValue ${w.depotValue} ≠ Σ Positionen + Verrechnung ${depotSum}`);
    const acc = arr(w.accounts).find((a) => a.id === 'acc-depot');
    if (acc) assert.ok(near(acc.balance, depotSum), `${id}: Depotkonto ${acc.balance} ≠ ${depotSum}`);
    else assert.equal(depotSum, 0, `${id}: ohne Depotkonto muss das Depot leer sein`);
  },
  W2(w, id) { assert.ok(near(w.netWorth, sum(arr(w.accounts), (a) => a.balance)), `${id}: netWorth ≠ Σ Kontostände`); },
  W3(w, id) {
    for (const b of arr(w.budgets)) {
      const spent = r2(-sum(arr(w.transactions).filter((t) => t.type === 'expense' && t.category === b.category && t.date.startsWith('2026-11')), (t) => t.amount));
      assert.ok(near(b.value, spent), `${id}: Budget ${b.label} ${b.value} ≠ Σ Buchungen ${spent}`);
    }
  },
  W5(w, id) {
    const plans = r2(sum(arr(w.savingsPlans).filter((p) => p.active), (p) => p.monthly));
    const booked = r2(-sum(arr(w.transactions).filter((t) => t.type === 'transfer' && t.category === 'Sparen' && t.date.startsWith('2026-11')), (t) => t.amount));
    assert.ok(near(plans, w.savingsMonthlyTotal), `${id}: Σ aktive Raten ${plans} ≠ savingsMonthlyTotal ${w.savingsMonthlyTotal}`);
    assert.ok(near(plans, booked), `${id}: Σ aktive Raten ${plans} ≠ gebuchte Sparumbuchungen ${booked}`);
  },
  W6(w, id) {
    const tg = arr(w.accounts).find((a) => a.type === 'savings');
    for (const g of arr(w.savingsGoals)) {
      if (g.id === 'g-notgroschen' && tg) assert.ok(near(g.current, tg.balance), `${id}: Notgroschen ${g.current} ≠ Tagesgeld ${tg.balance}`);
      if (g.id === 'g-rente') assert.ok(near(g.current, w.depotValue), `${id}: Altersvorsorge ${g.current} ≠ Depotwert ${w.depotValue}`);
      assert.ok(near(g.monthly, sum(arr(w.savingsPlans).filter((p) => p.goalId === g.id), (p) => p.monthly)), `${id}: ${g.id}.monthly ≠ Σ Raten der Pläne`);
    }
  },
  W9(w, id) {
    const day = arr(w.nutDiary).filter((e) => e.date === TODAY);
    const eaten = Math.round(sum(day, (e) => e.kcal));
    assert.equal(w.nutSummary.eatenKcal, eaten, `${id}: nutSummary.eatenKcal ≠ Σ Tagebuch heute`);
    const row = arr(w.nutHistory).find((h) => h.date === TODAY);
    if (row) assert.equal(row.kcal, eaten, `${id}: nutHistory[heute].kcal ≠ Tagebuch`);
    else assert.equal(arr(w.nutHistory).length, 0, `${id}: Verlauf ohne heutigen Tag`);
    assert.equal(w.nutSummary.leftKcal, w.nutSummary.goalKcal - eaten, `${id}: übrige kcal`);
  },
  W14(w, id) {
    const ids = (key) => new Set(arr(w[key]).map((x) => x.id));
    const accounts = ids('accounts'), subs = ids('subscriptions'), positions = ids('positions'), plans = ids('savingsPlans'), goals = ids('savingsGoals');
    const foods = ids('nutFoods'), recipes = ids('nutRecipes'), events = ids('events'), ex = ids('exerciseLibrary'), captures = ids('captures'), habits = ids('habits');
    const securities = new Set([...positions, ...arr(w.watchlist).map((x) => x.id)]);
    const must = (set, v, what) => { if (v != null) assert.ok(set.has(String(v).split('~')[0]) || set.has(v), `${id}: ${what} „${v}“ zeigt ins Leere`); };
    for (const t of arr(w.transactions)) { must(accounts, t.account, `Buchung ${t.id}.account`); must(accounts, t.to, `Buchung ${t.id}.to`); must(accounts, t.from, `Buchung ${t.id}.from`); must(subs, t.subscriptionId, `Buchung ${t.id}.subscriptionId`); }
    for (const p of arr(w.positions)) must(plans, p.savingsPlanId, `Position ${p.id}.savingsPlanId`);
    for (const p of arr(w.savingsPlans)) { must(positions, p.positionId, `Plan ${p.id}.positionId`); must(accounts, p.accountId, `Plan ${p.id}.accountId`); must(goals, p.goalId, `Plan ${p.id}.goalId`); }
    for (const d of arr(w.dividends)) must(positions, d.positionId, `Dividende ${d.id}.positionId`);
    for (const s of [...arr(w.tradingAlerts), ...arr(w.tradingOrders), ...arr(w.tradingTrades)]) must(securities, s.securityId, `Trading ${s.id}.securityId`);
    if (positions.size) for (const k of Object.keys(w.tradingTargets || {})) assert.ok(k === 'cash' || positions.has(k), `${id}: Soll-Anteil ${k} zeigt ins Leere`); // Soll-Anteile sind Konfiguration und bleiben im Ersten Start stehen
    for (const e of arr(w.nutDiary)) { must(foods, e.foodId, `Tagebuch ${e.id}.foodId`); must(recipes, e.recipeId, `Tagebuch ${e.id}.recipeId`); must(events, e.eventId, `Tagebuch ${e.id}.eventId`); }
    for (const r of arr(w.nutRecipes)) for (const i of r.ingredients || []) must(foods, i.foodId, `Rezept ${r.id}.foodId`);
    for (const p of arr(w.nutPlan)) { must(foods, p.foodId, `Plan ${p.id}.foodId`); must(recipes, p.recipeId, `Plan ${p.id}.recipeId`); must(events, p.eventId, `Plan ${p.id}.eventId`); }
    for (const t of arr(w.nutTemplates)) for (const i of t.items || []) must(foods, i.foodId, `Vorlage ${t.id}.foodId`);
    for (const t of arr(w.wxTraining)) must(events, t.eventId, `Training ${t.id}.eventId`);
    for (const h of arr(w.workoutHistory)) for (const e of h.exercises || []) must(ex, e.exerciseId, `Einheit ${h.id}.exerciseId`);
    for (const d of w.trainingProgram?.days || []) for (const e of d.exercises) must(ex, e.exerciseId, `Programm ${d.id}.exerciseId`);
    for (const r of arr(w.personalRecords)) must(ex, r.exerciseId, `Rekord ${r.id}.exerciseId`);
    for (const r of arr(w.receipts)) must(captures, r.captureId, `Beleg ${r.id}.captureId`);
    for (const k of arr(w.businessCards)) must(captures, k.captureId, `Visitenkarte ${k.id}.captureId`);
    for (const c of arr(w.captures)) { must(new Set(arr(w.receipts).map((x) => x.id)), c.receiptId, `Erfassung ${c.id}.receiptId`); must(new Set(arr(w.businessCards).map((x) => x.id)), c.cardId, `Erfassung ${c.id}.cardId`); }
    for (const r of arr(w.routines)) for (const s of r.steps) must(habits, s.habitId, `Routine ${r.id}.habitId`);
  },
  W15(w, id) {
    for (const [key, list] of Object.entries(w)) {
      if (!Array.isArray(list) || !list.length || typeof list[0] !== 'object' || list[0].id == null) continue;
      const seen = new Set();
      for (const x of list) { if (x.id == null) continue; assert.ok(!seen.has(x.id), `${id}: ${key} hat die ID „${x.id}“ doppelt`); seen.add(x.id); }
    }
  },
};
const W = worlds.alltag;

// ------------------------------------------------------------------ W1 bis W3, W5, W6, W9, W14, W15 in allen Szenarien (W17) ---
for (const [name, fn] of Object.entries(checks)) {
  test(`${name}${['W1', 'W2', 'W3', 'W5', 'W9'].includes(name) ? ' (W17)' : ''}: gilt in Alltag, Erster Start und Stress-Tag`, () => { for (const id of SCENARIO_IDS) fn(worlds[id], id); });
}
test('W17: Szenarien verändern Persona und Einstellungen nie', () => {
  for (const id of SCENARIO_IDS) { assert.deepEqual(worlds[id].persona, W.persona); assert.deepEqual(worlds[id].prefs, W.prefs); }
});

// ------------------------------------------------------------------ W4 Umbuchung neutral ---
test('W4: Umbuchungen zählen weder als Einnahme noch als Ausgabe, beide Seiten haben denselben Typ', () => {
  const nov = W.transactions.filter((t) => t.date.startsWith('2026-11'));
  const priv = nov.filter((t) => /^Privatentnahme/.test(t.title));
  assert.equal(priv.length, 2);
  assert.ok(priv.every((t) => t.type === 'transfer'), 'beide Seiten der Privatentnahme sind „transfer“');
  assert.ok(near(sum(priv, (t) => t.amount), 0), 'Privatentnahme gleicht sich aus');
  assert.ok(nov.filter((t) => t.category === 'Umbuchung').every((t) => t.type === 'transfer'));
  const s = W.financeSummary;
  assert.ok(near(s.income, sum(nov.filter((t) => t.type === 'income'), (t) => t.amount)), 'Einnahmen enthalten nur type income');
  assert.ok(near(s.expenses, -sum(nov.filter((t) => t.type === 'expense'), (t) => t.amount)), 'Ausgaben enthalten nur type expense');
  assert.ok(near(s.income, 2952.4), `Einnahmen ${s.income}`);
  assert.ok(s.savingsRate > 0.3 && s.savingsRate < 0.36, `Sparquote ${s.savingsRate} sollte etwa 33 % sein`);
  for (const t of nov.filter((x) => x.type === 'transfer' && x.to)) assert.ok(W.accounts.some((a) => a.id === t.to), `Umbuchung ${t.id}: Zielkonto`);
});

// ------------------------------------------------------------------ W7, W8 Rechnen ---
test('W7: Position value = Menge × Kurs, gain = value − cost', () => {
  for (const p of W.positions) {
    assert.ok(near(p.value, p.quantity * p.price), p.id);
    assert.ok(near(p.gain, p.value - p.cost, 0.011), `${p.id}: Gewinn`); // Rundung je Wert auf Cent
  }
});
test('W8: Energie passt zu den Nährwerten (Atwater, ±12 %) bei Lebensmitteln und Tagebuch, Alkohol zählt mit', () => {
  const bad = [...W.nutFoods.filter((f) => !atwaterPlausible(f.kcal, f)).map((f) => f.id), ...W.nutDiary.filter((e) => !atwaterPlausible(e.kcal, e)).map((e) => `${e.id} ${e.name}`)];
  assert.deepEqual(bad, []);
  const beer = W.nutFoods.find((f) => f.id === 'f-bier');
  assert.ok(beer.alcohol > 0, 'Bier hat ein Alkoholfeld');
  for (const e of W.nutDiary.filter((x) => x.foodId === 'f-bier')) assert.ok(e.alcohol > 0, `${e.id} trägt Alkohol`);
});

// ------------------------------------------------------------------ W10 bis W13 ---
test('W10: Kalorienziel der Zusammenfassung = Ziel, Ziel ≥ Grundumsatz', () => {
  assert.equal(W.nutSummary.goalKcal, W.nutGoals.kcal);
  assert.ok(W.nutGoals.kcal >= W.nutProfile.bmr, `Ziel ${W.nutGoals.kcal} < Grundumsatz ${W.nutProfile.bmr}`);
});
test('W11: Termine in Tagebuch, Plan und Training existieren im Kalender; Start liest die Termine ohne Kopie', () => {
  const events = new Set(W.events.map((e) => e.id));
  for (const x of [...W.nutDiary, ...W.nutPlan, ...W.wxTraining].filter((y) => y.eventId)) assert.ok(events.has(x.eventId), `${x.id}: eventId ${x.eventId}`);
  for (const f of MANIFESTS.find((m) => m.module.id === 'home').features) for (const [k, v] of Object.entries(f.demoData || {})) if (k === 'events') assert.equal(v, '@world:events', `${f.id}: Termine müssen gebunden sein`);
});
test('W12: Trainingstage, Zeiten und Orte sind in Wochenplan, Kalender, Wetter und Ernährung gleich', () => {
  const days = W.trainingProgram.days;
  assert.deepEqual(W.nutGoals.trainingDays, days.map((d) => d.weekdayLabel));
  assert.deepEqual(W.fitnessSummary.workoutDays, days.map((d) => d.weekdayLabel));
  assert.equal(W.events.some((e) => e.id === 'e-fitness'), false, 'die Donnerstags-Serie „Krafttraining Oberkörper“ entfällt');
  const wd = (iso) => (new Date(`${iso.slice(0, 10)}T12:00:00`).getDay() + 6) % 7;
  for (const d of days) {
    const ev = W.events.find((e) => e.id === `e-fit-${d.id}`);
    assert.ok(ev, `Kalenderserie für ${d.name}`);
    assert.equal(ev.repeat, 'Wöchentlich');
    assert.equal(wd(ev.start), d.dow, `${d.name}: Wochentag im Kalender`);
    assert.equal(ev.start.slice(11, 16), d.time, `${d.name}: Uhrzeit im Kalender`);
    assert.equal(ev.location, W.fitnessProfile.gym, `${d.name}: Ort im Kalender`);
    const wx = W.wxTraining.find((t) => t.eventId === ev.id);
    assert.ok(wx, `${d.name}: Wetter kennt das Training`);
    assert.equal(wd(wx.date), d.dow); assert.equal(wx.start, d.time); assert.equal(wx.where, W.fitnessProfile.gym);
  }
  assert.ok(W.wxVenues[W.fitnessProfile.gym], 'Weg zum Studio ist bekannt');
});
test('W13: Gewicht, Größe und Zielgewicht sind in Persona, Fitness und Ernährung gleich', () => {
  assert.equal(W.nutProfile.heightCm, W.fitnessProfile.heightCm);
  assert.equal(W.nutProfile.goalWeightKg, W.fitnessProfile.goalKg);
  assert.equal(W.nutProfile.weightKg, W.bodySummary.weightKg);
  assert.equal(W.nutSummary.weightKg, W.bodySummary.weightKg);
  assert.equal(W.nutSummary.goalWeightKg, W.fitnessProfile.goalKg);
  assert.equal(W.fitnessToday.weightKg, W.bodySummary.weightKg);
  assert.equal(W.persona.name, W.fitnessProfile.name);
});
test('W16: Zeitstempel liegen nicht nach dem Referenzmoment, Zukünftiges ist nur geplant oder vorab erfasst', () => {
  const past = (iso, what) => assert.ok(String(iso) <= NOW || String(iso).length === 10 && String(iso) <= TODAY, `${what} liegt nach ${NOW}: ${iso}`);
  for (const t of W.transactions) past(t.date, `Buchung ${t.id}`);
  for (const n of W.notes) past(n.updated, `Notiz ${n.id}`);
  for (const c of W.captures) past(c.created, `Erfassung ${c.id}`);
  for (const o of W.orders) past(o.date, `Bestellung ${o.id}`);
  for (const t of W.trash) past(t.deletedAt, `Papierkorb ${t.id}`);
  for (const n of W.allNotifications) past(n.time, `Mitteilung ${n.id}`);
  for (const h of W.workoutHistory) past(h.date, `Einheit ${h.id}`);
  for (const a of W.tradingAlerts.filter((x) => x.triggeredAt)) past(a.triggeredAt, `Alarm ${a.id}`);
  for (const e of W.nutDiary.filter((x) => x.date === TODAY && x.time && x.time > '09:30')) assert.equal(e.prelogged, true, `Tagebuch ${e.id}: nach 09:30 nur vorab erfasst`);
  assert.ok(W.nutDiary.every((e) => e.date <= TODAY));
});

// ------------------------------------------------------------------ Befunde als Regressionstests ---
test('Befunde B10 bis B12: gewollte Überschneidung gekennzeichnet, Sparplan nicht am Sonntag, World IT mit Ziel', () => {
  const e3 = W.events.find((e) => e.id === 'e3'), e4 = W.events.find((e) => e.id === 'e4');
  assert.match(e3.note, /gewollt/); assert.match(e4.note, /gewollt/);
  const t10 = W.transactions.find((t) => t.id === 't10');
  assert.notEqual(new Date(t10.date).getDay(), 0, 'Sparplan am Sonntag gebucht');
  assert.equal(W.savingsPlans.find((p) => p.id === 'sp-tech').goalId, 'g-rente');
  assert.equal(W.savingsGoals.find((g) => g.id === 'g-rente').monthly, 425);
});

// ------------------------------------------------------------------ Gemeinsame Daten statt Kopien ---
test('Start und Gewohnheiten binden dieselben Gewohnheiten und Routinen', () => {
  const find = (mod, key) => MANIFESTS.find((m) => m.module.id === mod).features.flatMap((f) => (f.demoData && f.demoData[key] !== undefined ? [[f.id, f.demoData[key]]] : []));
  for (const [fid, v] of find('home', 'habits')) assert.equal(v, '@world:habits', fid);
  for (const [fid, v] of find('habits', 'habits')) assert.equal(v, '@world:habits', fid);
  for (const [fid, v] of find('habits', 'routines')) assert.equal(v, '@world:routines', fid);
  assert.ok(find('home', 'habits').length > 0 && find('habits', 'habits').length > 0);
});
test('Geteilte Sammlungen sind in den Manifesten nur noch per @world: gebunden (keine Kopien)', () => {
  const owned = { notes: 'notes', articles: 'articles', habits: 'habits', routines: 'routines', captures: 'captures', receipts: 'receipts', channels: 'channels', orders: 'orders', alerts: 'tradingAlerts', trades: 'tradingTrades', targets: 'tradingTargets', trash: 'trash', backups: 'backups' };
  for (const m of MANIFESTS) for (const f of m.features) for (const [k, v] of Object.entries(f.demoData || {})) {
    if (!(k in owned) || !['notes', 'knowledge', 'picture-to-text', 'sales', 'habits', 'home', 'trading', 'system', 'settings'].includes(m.module.id)) continue;
    if (k === 'orders' && m.module.id === 'trading') assert.equal(v, '@world:tradingOrders', `${f.id}.${k}`);
    else if (k === 'alerts' || k === 'trades' || k === 'targets') assert.equal(v, `@world:${owned[k]}`, `${f.id}.${k}`);
    else assert.equal(typeof v === 'string' && v.startsWith('@world:'), true, `${f.id}.${k} ist eine Kopie`);
  }
});
test('Jede @world:-Bindung in allen Manifesten zeigt auf einen vorhandenen Welt-Schlüssel', () => {
  const missing = [];
  for (const m of MANIFESTS) for (const f of m.features) for (const [k, v] of Object.entries(f.demoData || {})) if (typeof v === 'string' && v.startsWith('@world:') && !(v.slice(7) in WORLD)) missing.push(`${f.id}.${k} → ${v}`);
  assert.deepEqual(missing, []);
});

// ------------------------------------------------------------------ Aggregate: Summary, Hints, Search, Notifications ---
const kpiOk = (k) => k && typeof k.label === 'string' && k.label && k.value !== undefined && k.value !== null && k.value !== '';
test('Jedes Modul liefert <modul>Summary.kpis (erste Kennzahl = Launchpad-Kachel) in allen Szenarien', () => {
  assert.equal(WORLD_MODULES.length, 19);
  assert.deepEqual([...WORLD_MODULES].sort(), [...MODULE_IDS].sort(), 'Modulliste der Welt = Module der Manifeste');
  for (const id of SCENARIO_IDS) for (const m of WORLD_MODULES) {
    const s = worlds[id][`${camelOf(m)}Summary`];
    assert.ok(s && Array.isArray(s.kpis) && s.kpis.length >= 1, `${id}: ${m}Summary.kpis fehlt`);
    for (const k of s.kpis) assert.ok(kpiOk(k), `${id}: ${m} Kennzahl ohne Label oder Wert`);
  }
});
test('Alltag: erste Kennzahl ist nicht monetär, wo es einen sinnvollen Zähler gibt', () => {
  for (const m of WORLD_MODULES) { const k = W[`${camelOf(m)}Summary`].kpis[0]; assert.ok(!/€|\$/.test(`${k.value}${k.unit || ''}`), `${m}: erste Kennzahl „${k.label}“ nennt einen Betrag`); }
});
test('Aggregate: allKpis, allHints, searchIndex und allNotifications sammeln die Modulexporte', () => {
  for (const m of WORLD_MODULES) assert.deepEqual(W.allKpis[m], W[`${camelOf(m)}Summary`].kpis, m);
  assert.equal(W.allHints.length, sum(WORLD_MODULES, (m) => arr(W[`${camelOf(m)}Hints`]).length));
  assert.equal(W.searchIndex.length, sum(WORLD_MODULES, (m) => arr(W[`${camelOf(m)}Search`]).length));
  assert.equal(W.allNotifications.length, sum(WORLD_MODULES, (m) => arr(W[`${camelOf(m)}Notifications`]).length));
  const modulesInIndex = new Set(W.searchIndex.map((s) => s.module));
  for (const m of ['notes', 'knowledge', 'habits', 'sales', 'picture-to-text']) assert.ok(modulesInIndex.has(m), `${m} fehlt im Suchindex`);
  assert.ok(new Set(W.allNotifications.map((n) => n.module)).size >= 8, 'Mitteilungen aus mehreren Modulen');
  for (let i = 1; i < W.allNotifications.length; i++) assert.ok(W.allNotifications[i - 1].time >= W.allNotifications[i].time, 'neueste zuerst');
});
const targetOk = (to) => FEATURES.has(to) || (/^module:/.test(to) && MODULE_IDS.has(to.slice(7)));
test('Hints, Search und Notifications haben das Vertragsformat und führen zu vorhandenen Zielen', () => {
  for (const h of W.allHints) { for (const f of ['id', 'text', 'source', 'module', 'tone', 'to']) assert.ok(h[f], `Hinweis ${h.id}: ${f}`); assert.ok(targetOk(h.to), `Hinweis ${h.id}: Ziel ${h.to}`); }
  for (const s of W.searchIndex) { for (const f of ['id', 'type', 'title', 'module', 'to']) assert.ok(s[f], `Suchtreffer ${s.id}: ${f}`); assert.ok(targetOk(s.to), `Suchtreffer ${s.id}: Ziel ${s.to}`); assert.match(s.id, /^[a-z]+:/, `Suchtreffer ${s.id}: ID als <sammlung>:<id>`); }
  assert.equal(new Set(W.searchIndex.map((s) => s.id)).size, W.searchIndex.length, 'Suchindex-IDs eindeutig');
  for (const n of W.allNotifications) { for (const f of ['id', 'title', 'text', 'module', 'tone', 'priority', 'time', 'to']) assert.ok(n[f], `Mitteilung ${n.id}: ${f}`); assert.ok(['wichtig', 'normal', 'leise'].includes(n.priority)); assert.ok(targetOk(n.to), `Mitteilung ${n.id}: Ziel ${n.to}`); }
  assert.equal(new Set(W.allNotifications.map((n) => n.id)).size, W.allNotifications.length, 'Mitteilungs-IDs eindeutig');
  for (const x of [...W.allHints, ...W.allNotifications].filter((y) => ['fitness', 'nutrition', 'habits'].includes(y.module))) assert.notEqual(x.tone, 'danger', `${x.id}: Gesundheitskontext nie „danger“`);
});
test('Die Mitteilungen und Suchtreffer der Welt sind in system.notifications bzw. system.search als Navigationsziel eingetragen', () => {
  const sys = MANIFESTS.find((m) => m.module.id === 'system').features;
  const targets = (fid) => new Set(sys.find((f) => f.id === fid).interactions.map((i) => i.to).filter(Boolean));
  const tn = targets('system.notifications'), ts = targets('system.search');
  for (const n of W.allNotifications) assert.ok(tn.has(n.to), `Mitteilung ${n.id}: ${n.to} fehlt in system.notifications`);
  for (const s of W.searchIndex) assert.ok(ts.has(s.to), `Suchtreffer ${s.id}: ${s.to} fehlt in system.search`);
});
test('Szenarien Erster Start und Stress: Aggregate folgen (leer bzw. verdreifacht)', () => {
  for (const k of ['allHints', 'searchIndex', 'allNotifications']) { assert.equal(worlds.erststart[k].length, 0, `erststart ${k}`); assert.ok(worlds.stress[k].length >= W[k].length * 3 - 1 || W[k].length === 0, `stress ${k}`); }
  assert.equal(worlds.stress.notes.length, W.notes.length * 3);
  assert.equal(worlds.erststart.notes.length, 0); assert.equal(worlds.erststart.habits.length, 0);
  assert.ok(worlds.erststart.nutFoods.length > 0 && worlds.erststart.exerciseLibrary.length > 0, 'Kataloge bleiben');
  assert.equal(worlds.erststart.nutSummary.eatenKcal, 0);
  assert.equal(worlds.erststart.financeSummary.income, 0);
});

// ------------------------------------------------------------------ Einstellungen, Trading, Erfassen ---
test('prefs: Format und Standardwerte sind identisch mit DEFAULT_PREFS (keine Änderung gegenüber dem Standard)', () => {
  assert.deepEqual(W.prefs, DEFAULT_PREFS);
  for (const k of ['favorites', 'privacy', 'quietHours', 'textScale']) assert.ok(k in W.prefs);
});
test('Trading: Orders, Alarme, Käufe, Soll-Anteile und Vergleichsindex liegen in der Welt, Soll-Anteile ergeben 100 %', () => {
  for (const k of ['tradingOrders', 'tradingAlerts', 'tradingTrades', 'tradingTargets', 'tradingBenchmark', 'tradingSummary']) assert.ok(k in W, k);
  assert.equal(sum(Object.values(W.tradingTargets), (x) => x), 100);
  assert.equal(W.tradingBenchmark.labels.length, W.tradingBenchmark.values.length);
  assert.equal(W.tradingSummary.kpis[0].value, W.positions.length);
});
test('Erfassen legt Notizen als eigenes Objekt in `notes` an (nicht im Aufgaben-Eingang)', async () => {
  const { commitCapture, parseCapture, KINDS } = await import('../app/src/library/components/crosscut/_capture.js');
  assert.equal(KINDS.note.to, 'notes.inbox');
  const store = { notes: [], inbox: [] }; let capCount = 0;
  const ctx = { today: new Date(2026, 10, 24, 9, 30), ui: {}, setUi: () => { capCount += 1; } };
  const setData = (slot, fn) => { store[slot] = typeof fn === 'function' ? fn(store[slot]) : fn; };
  const p = parseCapture('Notiz: Idee für den Newsletter-Betreff', ctx.today);
  assert.equal(p.kind, 'note');
  const r = commitCapture(p, { setData, ctx });
  assert.equal(store.notes.length, 1); assert.equal(store.inbox.length, 0);
  assert.equal(store.notes[0].inbox, true); assert.equal(store.notes[0].title, 'Idee für den Newsletter-Betreff');
  r.restore(); assert.equal(store.notes.length, 0); assert.ok(capCount >= 1);
});

// ------------------------------------------------------------------ Größe, Determinismus ---
test('Welt ist deterministisch und bleibt klein (Seed unter 1,6 MB)', async () => {
  const bytes = Buffer.byteLength(JSON.stringify(WORLD));
  assert.ok(bytes < 1.6 * 1024 * 1024, `Welt ${bytes} Bytes`);
  const fs = await import('node:fs'); const path = await import('node:path'); const dir = path.resolve(import.meta.dirname, '../app/src/seed/world');
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.js'))) {
    const code = fs.readFileSync(path.join(dir, f), 'utf8').split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
    assert.ok(!/Date\.now\(\)|Math\.random\(\)|new Date\(\)/.test(code), `${f}: nicht deterministisch`);
  }
});
