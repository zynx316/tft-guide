// Einkauf & Haushalt: Logik ohne UI – Wartungsfristen (core/recurrence.js), Schnelleingabe, Gänge, Abhaken, Vorrat, Einkauf fertig.
import './_helpers.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WORLD } from '../app/src/seed/world/index.js';
import * as L from '../app/src/library/components/shopping/_logic.js';

const TODAY = '2026-11-24';
const clone = (v) => JSON.parse(JSON.stringify(v));
/** Minimaler Weltzustand mit setData(slot, wert|fn) wie in der Vorschau. */
function makeStore() {
  const s = { lists: clone(WORLD.shoppingLists), shopping: clone(WORLD.nutShopping), pantry: clone(WORLD.shoppingPantry), household: clone(WORLD.householdTasks), plan: WORLD.nutPlan, recipes: WORLD.nutRecipes, foods: WORLD.nutFoods, stores: WORLD.shoppingStores };
  const setData = (k, v) => { s[k] = typeof v === 'function' ? v(s[k]) : v; };
  const views = () => L.listsView(s, TODAY);
  return { s, setData, views, list: (id) => views().find((l) => l.id === id) };
}
const task = (id) => clone(WORLD.householdTasks.find((t) => t.id === id));

test('Wartung: Fälligkeit aus Regel und letzter Erledigung', () => {
  const st = (id) => L.householdStatus(task(id), TODAY);
  assert.deepEqual([st('hh-waschmaschine').due, st('hh-waschmaschine').state, st('hh-waschmaschine').days], ['2026-11-17', 'overdue', -7]);
  assert.deepEqual([st('hh-dunstabzug').due, st('hh-dunstabzug').state], ['2026-11-24', 'today']);
  assert.deepEqual([st('hh-kuehlschrank').due, st('hh-kuehlschrank').state], ['2026-11-30', 'soon']);
  assert.deepEqual([st('hh-rauchmelder').due, st('hh-rauchmelder').state], ['2026-12-01', 'soon']);
  assert.deepEqual([st('hh-wasserhaehne').due, st('hh-wasserhaehne').state], ['2027-01-08', 'later']);
  assert.deepEqual([st('hh-heizkoerper').due, st('hh-heizkoerper').state], ['2027-10-15', 'later']);
});

test('Wartung: Abhaken setzt die nächste Fälligkeit (Kalenderregel und „nach Erledigung“)', () => {
  assert.equal(L.householdStatus(L.completeTask(task('hh-waschmaschine'), TODAY), TODAY).due, '2026-12-17');
  assert.equal(L.householdStatus(L.completeTask(task('hh-dunstabzug'), TODAY), TODAY).due, '2027-02-24');
  assert.equal(L.householdStatus(L.completeTask(task('hh-rauchmelder'), TODAY), TODAY).due, '2027-12-01');
  assert.equal(L.householdStatus(L.completeTask(task('hh-wasserhaehne'), TODAY), TODAY).due, '2027-05-23');
  assert.equal(L.householdStatus(L.completeTask(task('hh-kuehlschrank'), TODAY), TODAY).due, '2027-05-30');
});

test('Wartung: Sortierung nach Dringlichkeit, Texte, Zähler', () => {
  const sorted = L.householdSorted(WORLD.householdTasks, TODAY);
  assert.deepEqual(sorted.map((t) => t.state), ['overdue', 'today', 'soon', 'soon', 'later', 'later']);
  assert.equal(L.dueText(sorted[0], TODAY), 'seit 7 Tagen überfällig');
  assert.equal(L.dueText(sorted[1], TODAY), 'heute fällig');
  assert.equal(L.dueText(sorted[2], TODAY), 'fällig in 6 Tagen');
  assert.equal(L.ruleText(task('hh-dunstabzug')), 'alle 3 Monate am 24.');
  assert.equal(L.ruleText(task('hh-rauchmelder')), 'jährlich am 1. Dezember');
  assert.equal(L.dueCount(WORLD.householdTasks, TODAY), 2);
});

test('Wartung: nie erledigte Aufgabe ist ab dem Anlegetag fällig; Vorschau der Termine', () => {
  const t = { ...task('hh-rauchmelder'), lastDone: null, since: TODAY };
  assert.equal(L.householdStatus(t, TODAY).due, '2026-12-01');
  const months = L.projected(task('hh-waschmaschine'), TODAY, 12);
  assert.equal(months[0], '2026-11-17'); assert.ok(months.length >= 12 && months[1] === '2026-12-17');
  const after = L.projected(task('hh-wasserhaehne'), TODAY, 12);
  assert.equal(after[0], '2027-01-08'); assert.equal(after[1], '2027-07-07');
});

test('Als Aufgabe planen: überfällig = heute fällig, Priorität hoch; später = Fälligkeitstag', () => {
  const a = L.taskFor(task('hh-waschmaschine'), TODAY, 't-hh-1'), b = L.taskFor(task('hh-rauchmelder'), TODAY, 't-hh-2');
  assert.deepEqual([a.due, a.priority, a.status, a.estimate], [TODAY, 'hoch', 'Offen', 5]);
  assert.deepEqual([b.due, b.priority], ['2026-12-01', 'mittel']);
});

test('Schnelleingabe: Menge und Name erkennen, Gang aus dem Laden', () => {
  assert.deepEqual(L.parseQuick('2 l Milch'), { name: 'Milch', qty: '2 l' });
  assert.deepEqual(L.parseQuick('Milch 2 l'), { name: 'Milch', qty: '2 l' });
  assert.deepEqual(L.parseQuick('3x joghurt'), { name: 'Joghurt', qty: '3' });
  assert.deepEqual(L.parseQuick('500 g Haferflocken'), { name: 'Haferflocken', qty: '500 g' });
  assert.deepEqual(L.parseQuick('Zahnpasta'), { name: 'Zahnpasta', qty: '' });
  assert.equal(L.parseQuick('   '), null);
  const rewe = WORLD.shoppingStores[0].aisles, dm = WORLD.shoppingStores[2].aisles;
  assert.equal(L.guessAisle('Milch', rewe), 'Kühlregal');
  assert.equal(L.guessAisle('Bananen', rewe), 'Obst & Gemüse');
  assert.equal(L.guessAisle('Zahnpasta', dm), 'Körperpflege');
  assert.equal(L.guessAisle('Zahnpasta', rewe), 'Sonstiges');
  assert.equal(L.guessAisle('Etwas Unbekanntes', dm), 'Sonstiges');
});

test('Menge: − und + mit Einheit, unter 1 bleibt keine Menge', () => {
  assert.equal(L.bumpQty('2 Tuben', 1), '3 Tuben'); assert.equal(L.bumpQty('2 l', -1), '1 l'); assert.equal(L.bumpQty('1 l', -1), '');
  assert.equal(L.bumpQty('', 1), '2'); assert.equal(L.bumpQty('1,5 kg', 1), '2 kg'); assert.equal(L.qtyNumber('2 Tuben'), 2); assert.equal(L.qtyNumber(''), 1);
});

test('Gänge: Reihenfolge des Ladens, Abgehaktes zuletzt, unbekannte Gänge am Ende', () => {
  const st = makeStore(), food = st.list('sl-food'), rewe = WORLD.shoppingStores[0];
  const aisles = L.aislesFor(rewe, food.items), g = L.groupByAisle(food.items, aisles, { doneApart: true });
  assert.deepEqual(g.groups.map((x) => x.aisle), ['Obst & Gemüse', 'Trockenwaren', 'Kühlregal', 'Sonstiges']);
  assert.deepEqual(g.done.map((i) => i.name), ['Zwiebel']);
  const inline = L.groupByAisle(food.items, aisles).groups[0].items;
  assert.equal(inline[inline.length - 1].name, 'Zwiebel', 'abgehakt steht am Ende des Gangs');
  assert.deepEqual(L.aislesFor({ aisles: ['A'] }, [{ aisle: 'B' }]), ['A', 'B']);
});

test('Lebensmittel: Hinzufügen und Abhaken schreiben in nutShopping (wirkt auch in Ernährung)', () => {
  const st = makeStore(), food = st.list('sl-food');
  const undo = L.addItem(st.setData, food, { name: 'Milch', qty: '2 l', aisle: 'Kühlregal' }, 'si-1');
  assert.ok(st.s.shopping.manual.some((m) => m.id === 'si-1' && m.qty === '2 l'));
  const milk = st.list('sl-food').items.find((i) => i.id === 'si-1');
  assert.equal(milk.aisle, 'Kühlregal'); assert.equal(milk.derived, false);
  L.toggleItem(st.setData, st.list('sl-food'), milk); assert.equal(st.s.shopping.checked['si-1'], true);
  const lachs = st.list('sl-food').items.find((i) => i.foodId === 'f-lachs');
  L.toggleItem(st.setData, st.list('sl-food'), lachs); assert.equal(st.s.shopping.checked['f-lachs'], true, 'abgeleitete Zutat: Schlüssel = foodId wie in Ernährung');
  undo(); assert.ok(!st.s.shopping.manual.some((m) => m.id === 'si-1'));
});

test('Eigene Listen: Abhaken, Menge, Entfernen mit Rückgängig an derselben Stelle', () => {
  const st = makeStore(), dr = st.list('sl-drogerie'), before = clone(st.s.lists.find((l) => l.id === 'sl-drogerie').items);
  L.toggleItem(st.setData, dr, dr.items[0]); assert.equal(st.list('sl-drogerie').items[0].done, true);
  L.setQty(st.setData, dr, dr.items[0], L.bumpQty(dr.items[0].qty, 1)); assert.equal(st.list('sl-drogerie').items[0].qty, '3 Tuben');
  const it = st.list('sl-drogerie').items[1];
  L.removeItem(st.setData, dr, it); assert.equal(st.list('sl-drogerie').total, before.length - 1);
  L.restoreItem(st.setData, dr, it, 1); assert.equal(st.list('sl-drogerie').items[1].id, it.id);
});

test('Vorrat: „Auf die Liste“ ohne Dopplung; Butter steht durch den Plan schon dort, Kaffee wird angelegt', () => {
  const st = makeStore(), pantry = (id) => st.s.pantry.find((p) => p.id === id);
  const butter = L.refillToList(st.setData, st.views(), pantry('sp-butter'), 'si-b');
  assert.equal(butter.added, false); assert.ok(L.findOnList(st.list('sl-food'), pantry('sp-butter')));
  const k = L.refillToList(st.setData, st.views(), pantry('sp-kaffee'), 'si-k');
  assert.equal(k.added, true); assert.equal(k.list.id, 'sl-food');
  const added = st.list('sl-food').items.find((i) => i.id === 'si-k'); assert.equal(added.qty, '1 kg');
  assert.equal(L.refillToList(st.setData, st.views(), pantry('sp-kaffee'), 'si-k2').added, false, 'zweiter Versuch legt nichts doppelt an');
  const tabs = L.refillToList(st.setData, st.views(), pantry('sp-tabs'), 'si-t');
  assert.equal(tabs.list.id, 'sl-drogerie'); assert.ok(st.list('sl-drogerie').items.some((i) => i.id === 'si-t'));
  assert.equal(L.refillToList(st.setData, st.views(), pantry('sp-zahnpasta'), 'si-z').added, false, 'Zahnpasta steht schon auf der Drogerie-Liste');
  k.undo(); assert.ok(!st.list('sl-food').items.some((i) => i.id === 'si-k'));
});

test('Vorrat: Stufe wirkt auf „zuhause vorhanden“ in Ernährung', () => {
  const st = makeStore(), hafer = st.s.pantry.find((p) => p.id === 'sp-haferflocken');
  L.setLevel(st.setData, hafer, 'low'); assert.ok(!st.s.shopping.pantry.includes('f-haferflocken'));
  L.setLevel(st.setData, hafer, 'ok'); assert.ok(st.s.shopping.pantry.includes('f-haferflocken'));
});

test('Einkauf fertig: erledigte eigene Artikel verlassen die Liste, abgeleitete bleiben, Rückgängig stellt her', () => {
  const st = makeStore(), dr = st.list('sl-drogerie');
  assert.equal(dr.items.filter((i) => i.done).length, 1);
  const restore = L.finishList(st.setData, dr); assert.equal(st.list('sl-drogerie').total, dr.total - 1);
  restore(); assert.equal(st.list('sl-drogerie').total, dr.total);
  const food = st.list('sl-food'); L.finishList(st.setData, food); assert.equal(st.list('sl-food').total, food.total, 'abgeleitete Zutaten bleiben stehen');
});

test('Plan übernehmen: längerer Zeitraum liefert mehr Zutaten', async () => {
  const { previewImport } = await import('../app/src/library/components/shopping/shop-plan-import.js');
  const data = { shopping: WORLD.nutShopping, plan: WORLD.nutPlan, recipes: WORLD.nutRecipes, foods: WORLD.nutFoods };
  const p3 = previewImport(data, TODAY, { range: 3, adds: [] }), p7 = previewImport(data, TODAY, { range: 7, adds: [] });
  assert.ok(p7.derived.length > p3.derived.length);
  assert.equal(p3.pantryItems.length, 4, 'Vorräte werden abgezogen');
  const dup = previewImport({ ...data, shopping: { ...WORLD.nutShopping, manual: [...WORLD.nutShopping.manual, { id: 'm-x', name: 'Lachsfilet', aisle: 'Kühlregal', qty: '1' }] } }, TODAY, { range: 3, adds: [] });
  assert.deepEqual(dup.dupes.map((m) => m.key), ['m-x']);
});

test('Gang-Erkennung: Wörter mit Umlaut und ß (Käse, Müllbeutel, Spülmaschinentabs, Hähnchen)', () => {
  const rewe = WORLD.shoppingStores[0].aisles, dm = WORLD.shoppingStores[2].aisles;
  for (const [name, aisle] of [['Käse', 'Kühlregal'], ['Hähnchenbrust', 'Kühlregal'], ['Müsli', 'Trockenwaren'], ['Möhren', 'Obst & Gemüse'], ['Brötchen', 'Trockenwaren'], ['Olivenöl', 'Trockenwaren']]) assert.equal(L.guessAisle(name, rewe), aisle, name);
  for (const [name, aisle] of [['Müllbeutel', 'Haushalt & Reinigung'], ['Spülmaschinentabs', 'Haushalt & Reinigung'], ['Zahnbürste', 'Körperpflege'], ['Taschentücher', 'Körperpflege'], ['Küchenrolle', 'Haushalt & Reinigung']]) assert.equal(L.guessAisle(name, dm), aisle, name);
});

test('Menge: Gramm in 50er-, Milliliter in 100er-Schritten', () => {
  assert.equal(L.bumpQty('500 g', 1), '550 g'); assert.equal(L.bumpQty('500 g', -1), '450 g'); assert.equal(L.bumpQty('50 g', -1), '');
  assert.equal(L.bumpQty('250 ml', 1), '350 ml'); assert.equal(L.bumpQty('2 Tuben', -1), '1 Tuben');
});

test('Gang ändern, Liste umbenennen und löschen mit Rückgängig', () => {
  const st = makeStore(), dr = st.list('sl-drogerie'), it = dr.items[1];
  L.setAisle(st.setData, dr, it, 'Gesundheit'); assert.equal(st.list('sl-drogerie').items[1].aisle, 'Gesundheit');
  const back = L.renameList(st.setData, dr, 'Bad & Drogerie'); assert.equal(st.list('sl-drogerie').name, 'Bad & Drogerie'); back(); assert.equal(st.list('sl-drogerie').name, 'Drogerie');
  const undo = L.deleteList(st.setData, st.s, dr); assert.ok(!st.list('sl-drogerie')); undo();
  assert.deepEqual(st.s.lists.map((l) => l.id), WORLD.shoppingLists.map((l) => l.id), 'Liste kommt an derselben Stelle zurück');
});

test('Budget: Rest aus Finanz-Budget und Buchungen, stimmt im Referenzzustand mit Ernährung überein und folgt neuen Buchungen', () => {
  const base = { shopping: WORLD.nutShopping, budgets: WORLD.budgets, transactions: WORLD.transactions, today: TODAY };
  const b = L.foodBudget(base);
  assert.deepEqual([b.budget, b.spent, b.left], [450, WORLD.nutShopping.spentMonth, WORLD.nutSummary.foodBudgetLeft]);
  const after = L.foodBudget({ ...base, transactions: [{ id: 'tx-new', type: 'expense', category: 'Lebensmittel', amount: -4.75, date: '2026-11-24T09:31:00' }, ...WORLD.transactions] });
  assert.equal(after.left, Math.round((b.left - 4.75) * 100) / 100);
  assert.deepEqual(L.foodBudget({ ...base, budgets: [], transactions: [] }), { budget: 0, spent: 0, left: 0 }, 'Erststart: kein Budget');
  assert.equal(L.foodBudget({ shopping: WORLD.nutShopping, today: TODAY }).left, WORLD.nutSummary.foodBudgetLeft, 'ohne Finanzdaten gelten die Werte aus Ernährung');
});

test('Einkauf: bleibt „abzurechnen“, bis die Ausgabe gebucht ist; Verwerfen holt den geplanten Einkauf zurück', () => {
  const planned = WORLD.shoppingTrips.find((t) => t.status === 'geplant'), seenTx = WORLD.transactions.map((t) => t.id);
  const pending = { ...planned, status: L.TRIP_PENDING, date: TODAY, time: '09:30', total: 4.75, count: 3, category: 'Lebensmittel', seenTx, planned };
  assert.equal(L.tripsView([pending], WORLD.transactions)[0].status, L.TRIP_PENDING, 'ohne neue Buchung offen');
  const booked = L.tripsView([pending], [{ id: 'tx-new', type: 'expense', category: 'Lebensmittel', amount: -4.9, date: '2026-11-24T09:31:00' }, ...WORLD.transactions])[0];
  assert.deepEqual([booked.status, booked.transactionId, booked.total], ['erledigt', 'tx-new', 4.9]);
  let trips = [pending]; const setData = (k, v) => { trips = typeof v === 'function' ? v(trips) : v; };
  const undo = L.discardTrip(setData, pending); assert.equal(trips[0].status, 'geplant'); undo(); assert.equal(trips[0].status, L.TRIP_PENDING);
  assert.equal(L.tripPrefill(pending, TODAY).amount, 4.75);
});

test('Wartung erledigen schließt die verknüpfte Aufgabe mit und löst die Verknüpfung; Rückgängig stellt beides her', () => {
  const st = makeStore(); st.s.tasks = clone(WORLD.tasks);
  const hh = st.s.household.find((h) => h.id === 'hh-waschmaschine'), entry = L.taskFor(hh, TODAY, 't-hh-1');
  st.setData('tasks', (ts) => [entry, ...ts]); st.setData('household', (hs) => hs.map((h) => (h.id === hh.id ? { ...h, taskId: 't-hh-1' } : h)));
  assert.ok(L.linkedTask(st.s.household.find((h) => h.id === hh.id), st.s.tasks));
  const r = L.finishHousehold(st.setData, st.s, hh.id, TODAY);
  assert.equal(st.s.tasks.find((t) => t.id === 't-hh-1').status, 'Erledigt'); assert.equal(st.s.household.find((h) => h.id === hh.id).taskId, null);
  assert.equal(L.linkedTask({ taskId: 't-hh-1' }, st.s.tasks), null, 'erledigte Aufgabe gilt nicht mehr als Verknüpfung');
  assert.equal(r.next.due, '2026-12-17');
  r.restore(); assert.equal(st.s.tasks.find((t) => t.id === 't-hh-1').status, 'Offen'); assert.equal(st.s.household.find((h) => h.id === hh.id).taskId, 't-hh-1');
});
