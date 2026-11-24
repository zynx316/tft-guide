// Einkauf & Haushalt: Welt-Konsistenz mit den Quellmodulen (Ernährung, Finanzen), Ableitungen, Szenarien, Aggregate.
import './_helpers.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { near } from './_helpers.mjs';
import { WORLD } from '../app/src/seed/world/index.js';
import { applyScenario } from '../app/src/core/world.js';
import { MANIFESTS } from '../app/src/seed/index.js';
import { shoppingSummaryOf, listsView, foodItems, householdStatus, needsRefill, FOOD_LIST } from '../app/src/library/components/shopping/_logic.js';

const TODAY = '2026-11-24';
const W = applyScenario(WORLD, 'alltag'), E = applyScenario(WORLD, 'erststart'), S = applyScenario(WORLD, 'stress');
const view = (w) => ({ lists: w.shoppingLists, shopping: w.nutShopping, plan: w.nutPlan, recipes: w.nutRecipes, foods: w.nutFoods, household: w.householdTasks, pantry: w.shoppingPantry, today: TODAY });

test('Welt: alle Schlüssel des Moduls vorhanden', () => {
  for (const k of ['shoppingLists', 'shoppingStores', 'householdTasks', 'householdTemplates', 'shoppingPantry', 'shoppingTrips', 'shoppingSummary', 'shoppingHints', 'shoppingSearch', 'shoppingNotifications']) assert.ok(k in WORLD, k);
});

test('Budget: nur gelesen, passt zu Ernährung (foodBudgetLeft) und Finanz-Budget „Lebensmittel“', () => {
  const left = Math.round((W.nutShopping.budgetMonth - W.nutShopping.spentMonth) * 10) / 10;
  assert.equal(W.nutSummary.foodBudgetLeft, left);
  assert.equal(W.shoppingSummary.budgetLeft, left);
  const b = W.budgets.find((x) => x.id === 'b-food');
  assert.ok(near(b.target, W.nutShopping.budgetMonth) && near(b.value, W.nutShopping.spentMonth));
});

test('Lebensmittel-Liste ist der Verweis auf nutShopping (keine Kopie der Artikel)', () => {
  const food = W.shoppingLists.find((l) => l.id === FOOD_LIST);
  assert.equal(food.kind, 'food'); assert.equal(food.source, 'nutShopping'); assert.equal(food.items, undefined);
  const v = listsView(view(W), TODAY).find((l) => l.id === FOOD_LIST);
  const ref = foodItems({ shopping: W.nutShopping, plan: W.nutPlan, recipes: W.nutRecipes, foods: W.nutFoods, today: TODAY });
  assert.equal(v.total, ref.items.length);
  assert.ok(v.total > 20, 'Lebensmittel-Liste ist gefüllt');
});

test('Referenzen: Läden, Listen, Vorräte, Einkäufe zeigen auf vorhandene Einträge', () => {
  const stores = new Set(W.shoppingStores.map((s) => s.id)), lists = new Set(W.shoppingLists.map((l) => l.id));
  for (const l of W.shoppingLists) if (l.storeId) assert.ok(stores.has(l.storeId), `${l.id}.storeId`);
  const foods = new Set(W.nutFoods.map((f) => f.id)), tx = new Set(W.transactions.map((t) => t.id));
  for (const p of W.shoppingPantry) { if (p.foodId) assert.ok(foods.has(p.foodId), `${p.id}.foodId`); if (p.listId) assert.ok(lists.has(p.listId), `${p.id}.listId`); }
  for (const t of W.shoppingTrips) { if (t.storeId) assert.ok(stores.has(t.storeId)); assert.ok(lists.has(t.listId)); if (t.transactionId) { assert.ok(tx.has(t.transactionId)); assert.ok(near(Math.abs(W.transactions.find((x) => x.id === t.transactionId).amount), t.total)); } }
  const hh = new Set(W.householdTasks.map((h) => h.id));
  for (const l of W.shoppingLists) for (const i of l.items || []) if (i.for) assert.ok(hh.has(i.for), `${i.id}.for`);
  for (const l of W.shoppingLists.filter((x) => x.kind === 'custom')) for (const i of l.items) assert.ok(stores.has(l.storeId) && W.shoppingStores.find((s) => s.id === l.storeId).aisles.includes(i.aisle), `${i.id}: Gang ${i.aisle} im Laden`);
});

test('Vorräte: „Reicht“ bei Lebensmitteln ⇔ „zuhause vorhanden“ in Ernährung', () => {
  const home = new Set(W.nutShopping.pantry);
  for (const id of home) assert.ok(W.shoppingPantry.some((p) => p.foodId === id && p.level === 'ok'), `Vorrat der Ernährung ${id} fehlt in shoppingPantry`);
  for (const p of W.shoppingPantry.filter((x) => x.foodId)) assert.equal(home.has(p.foodId), p.level === 'ok', p.id);
  assert.ok(W.shoppingPantry.some(needsRefill));
});

test('Kennzahlen: aus den Daten berechnet, erste Kennzahl ohne Betrag', () => {
  const s = W.shoppingSummary, again = shoppingSummaryOf(view(W));
  assert.deepEqual(s, again);
  const open = listsView(view(W), TODAY).reduce((n, l) => n + l.open, 0);
  assert.equal(s.kpis[0].value, open); assert.ok(!/€/.test(String(s.kpis[0].value)));
  assert.equal(s.householdDue, W.householdTasks.filter((t) => ['overdue', 'today'].includes(householdStatus(t, TODAY).state)).length);
  assert.equal(s.householdDue, 2);
});

test('Erster Start: eigene Daten leer, Läden/Vorschläge/Lebensmittel-Liste bleiben, Kennzahlen folgen', () => {
  assert.equal(E.shoppingLists.length, 1); assert.equal(E.shoppingLists[0].id, FOOD_LIST);
  for (const k of ['shoppingPantry', 'householdTasks', 'shoppingTrips', 'shoppingHints', 'shoppingSearch', 'shoppingNotifications']) assert.equal(E[k].length, 0, k);
  assert.ok(E.shoppingStores.length >= 4 && E.householdTemplates.length >= 5);
  assert.deepEqual(E.shoppingSummary, shoppingSummaryOf(view(E)));
  assert.equal(E.shoppingSummary.kpis[0].value, 0);
  assert.equal(E.shoppingSummary.budgetLeft, E.nutSummary.foodBudgetLeft);
});

test('Stress-Tag: Listen verdreifacht mit eindeutigen IDs, Kennzahlen folgen', () => {
  assert.equal(S.shoppingLists.length, W.shoppingLists.length * 3);
  assert.equal(new Set(S.shoppingLists.map((l) => l.id)).size, S.shoppingLists.length);
  assert.equal(S.householdTasks.length, W.householdTasks.length * 3);
  assert.deepEqual(S.shoppingSummary, shoppingSummaryOf(view(S)));
  assert.ok(S.shoppingSummary.kpis[0].value > W.shoppingSummary.kpis[0].value);
});

test('Aggregate: Hinweise, Suche und Mitteilungen im Vertragsformat mit vorhandenen Zielen', () => {
  const features = new Set(MANIFESTS.flatMap((m) => m.features.map((f) => f.id)));
  assert.ok(W.shoppingHints.length >= 3 && W.shoppingSearch.length >= 15 && W.shoppingNotifications.length >= 2);
  for (const x of [...W.shoppingHints, ...W.shoppingSearch, ...W.shoppingNotifications]) { assert.equal(x.module, 'shopping'); assert.ok(features.has(x.to), `${x.id}: ${x.to}`); }
  assert.ok(W.shoppingSearch.every((s) => /^[a-z]+:/.test(s.id)));
  assert.ok(W.shoppingNotifications.every((n) => n.time <= '2026-11-24T09:30:00'));
  assert.ok(W.allNotifications.some((n) => n.module === 'shopping') && W.searchIndex.some((s) => s.module === 'shopping') && W.allKpis.shopping.length >= 3);
});

test('Manifest: Pflichtumfang (Startseite 3 Richtungen, Tier, Entscheidungen, Bindung per @world)', () => {
  const m = MANIFESTS.find((x) => x.module.id === 'shopping');
  assert.equal(m.module.homeFeatureId, 'shopping.home'); assert.equal(m.module.assumption, true); assert.equal(m.module.stage, 3); assert.match(m.module.offline, /Pflicht/);
  const f = Object.fromEntries(m.features.map((x) => [x.id, x]));
  assert.deepEqual(Object.keys(f).sort(), ['shopping.home', 'shopping.household', 'shopping.list', 'shopping.pantry', 'shopping.plan-import', 'shopping.settings', 'shopping.store']);
  assert.deepEqual(f['shopping.home'].variants.map((v) => v.direction), ['kompakt', 'visuell', 'fokus']);
  assert.equal(f['shopping.home'].tier, 1); assert.equal(f['shopping.list'].tier, 1); assert.equal(f['shopping.store'].tier, 1); assert.equal(f['shopping.household'].tier, 2);
  assert.ok(f['shopping.store'].interactions.some((i) => i.to === 'finance.quickadd'));
  assert.ok(m.decisions.length >= 2 && m.decisions.some((d) => d.status === 'open') && m.decisions.filter((d) => d.status === 'open').every((d) => d.recommendation));
  for (const x of m.features) for (const [k, v] of Object.entries(x.demoData)) assert.ok(typeof v === 'string' && v.startsWith('@world:'), `${x.id}.${k} muss gebunden sein`);
  for (const id of ['shopping.home', 'shopping.list', 'shopping.store']) assert.ok(f[id].acceptance.length >= 3 && f[id].acceptance.length <= 6, id);
  const layouts = f['shopping.home'].variants.map((v) => `${v.layout.type}:${v.blocks.map((b) => b.component).join(',')}`);
  assert.equal(new Set(layouts).size, 3);
});
