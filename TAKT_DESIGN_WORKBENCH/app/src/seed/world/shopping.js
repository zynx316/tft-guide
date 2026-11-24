// Gemeinsame Datenwelt: Einkauf & Haushalt (Eigentümer: shopping). Referenztag Di, 24.11.2026 09:30.
// * Lebensmittel-Liste = Ableitung aus Ernährung (`nutShopping` mit Wochenplan, Rezepten, Vorrat): wird hier NICHT kopiert, sondern gelesen
//   und geschrieben (Abhaken, „Milch“ aus Erfassen). `shoppingLists[sl-food]` ist nur der Verweis darauf.
// * Eigene Daten: weitere Listen, Läden mit Gängen, Vorräte, Einkäufe, Haushalt & Wartung (Fristen über core/recurrence.js).
// * Budget wird nur gelesen: Ziel aus finance.budgets, Ausgaben aus finance.transactions (Kategorie Lebensmittel); im Referenzzustand gleich `nutSummary.foodBudgetLeft`.
import { nutShopping, nutPlan, nutRecipes, nutFoods } from './nutrition.js';
import { triple, at, TODAY } from './_util.js';
import { shoppingSummaryOf, householdStatus, dueText, ruleText, listsView, defaultFoodList, FOOD_LIST } from '../../library/components/shopping/_logic.js';

// ------------------------------------------------------------------ Läden und Gänge ---
// Reihenfolge der Gänge = Laufweg im Laden. REWE: Kühl- und Tiefkühlware zuletzt, damit die Kette nicht unterbrochen wird.
export const shoppingStores = [
  { id: 'st-rewe', name: 'REWE Bielefeld-Mitte', short: 'REWE', kind: 'Supermarkt', icon: 'shopping-cart', tone: 'success', note: 'Kühl- und Tiefkühlware zuletzt',
    aisles: ['Obst & Gemüse', 'Trockenwaren', 'Getränke', 'Kühlregal', 'Tiefkühl', 'Sonstiges'] },
  { id: 'st-markt', name: 'Wochenmarkt Siegfriedplatz', short: 'Wochenmarkt', kind: 'Markt', icon: 'carrot', tone: 'warning', note: 'Samstagvormittag',
    aisles: ['Obst & Gemüse', 'Kühlregal', 'Sonstiges'] },
  { id: 'st-dm', name: 'dm-Markt Bielefeld-Mitte', short: 'dm', kind: 'Drogerie', icon: 'sparkles', tone: 'accent', note: '',
    aisles: ['Körperpflege', 'Gesundheit', 'Haushalt & Reinigung', 'Sonstiges'] },
  { id: 'st-bau', name: 'Baumarkt Bielefeld-Brackwede', short: 'Baumarkt', kind: 'Baumarkt', icon: 'ruler', tone: 'info', note: '',
    aisles: ['Elektro & Licht', 'Heizung & Sanitär', 'Werkzeug & Befestigung', 'Haus & Garten'] },
];

// ------------------------------------------------------------------ Listen (Lebensmittel = Verweis auf nutShopping) ---
export const shoppingLists = [
  { ...defaultFoodList, storeId: 'st-rewe' },
  { id: 'sl-drogerie', name: 'Drogerie', icon: 'sparkles', tone: 'accent', kind: 'custom', storeId: 'st-dm', shared: true, aisles: shoppingStores[2].aisles, items: [
    { id: 'si-d1', name: 'Zahnpasta', qty: '2 Tuben', aisle: 'Körperpflege', done: false, price: 3.8 },
    { id: 'si-d2', name: 'Duschgel', qty: '1', aisle: 'Körperpflege', done: false, price: 2.45 },
    { id: 'si-d3', name: 'Vitamin-D3-Tropfen', qty: '1 Flasche', aisle: 'Gesundheit', done: false, price: 9.95, note: 'für die Gewohnheit „Vitamin D“' },
    { id: 'si-d4', name: 'Müllbeutel 35 l', qty: '1 Rolle', aisle: 'Haushalt & Reinigung', done: false, price: 2.15 },
    { id: 'si-d5', name: 'Küchenrolle', qty: '1 Packung', aisle: 'Haushalt & Reinigung', done: true, price: 2.99 },
  ] },
  { id: 'sl-baumarkt', name: 'Baumarkt', icon: 'ruler', tone: 'info', kind: 'custom', storeId: 'st-bau', shared: false, aisles: shoppingStores[3].aisles, items: [
    { id: 'si-b1', name: 'Batterien 9 V', qty: '2 Stück', aisle: 'Elektro & Licht', done: false, price: 7.9, for: 'hh-rauchmelder', note: 'für die Rauchmelder' },
    { id: 'si-b2', name: 'Filtermatte Dunstabzug', qty: '1', aisle: 'Haus & Garten', done: false, price: 12.5, for: 'hh-dunstabzug' },
    { id: 'si-b3', name: 'Entlüftungsschlüssel', qty: '1', aisle: 'Heizung & Sanitär', done: true, price: 2.5, for: 'hh-heizkoerper' },
    { id: 'si-b4', name: 'LED-Lampe E27 warmweiß', qty: '2 Stück', aisle: 'Elektro & Licht', done: false, price: 8.9 },
    { id: 'si-b5', name: 'Kabelbinder', qty: '1 Packung', aisle: 'Werkzeug & Befestigung', done: false, price: 3.2 },
  ] },
];

// ------------------------------------------------------------------ Vorräte ---
// Lebensmittel mit foodId halten „zuhause vorhanden“ (nutShopping.pantry) im Gleichschritt: Stufe „Reicht“ ⇔ foodId im Vorrat der Ernährung.
export const shoppingPantry = [
  { id: 'sp-olivenoel', name: 'Olivenöl', foodId: 'f-olivenoel', aisle: 'Trockenwaren', level: 'ok', note: 'Flasche 750 ml, etwa halb voll' },
  { id: 'sp-honig', name: 'Honig', foodId: 'f-honig', aisle: 'Trockenwaren', level: 'ok', note: '' },
  { id: 'sp-haferflocken', name: 'Haferflocken', foodId: 'f-haferflocken', aisle: 'Trockenwaren', level: 'ok', note: 'Reicht für etwa 6 Skyr-Bowls' },
  { id: 'sp-reis', name: 'Basmatireis', foodId: 'f-reis', aisle: 'Trockenwaren', level: 'ok', note: '' },
  { id: 'sp-butter', name: 'Butter', foodId: 'f-butter', aisle: 'Kühlregal', level: 'low', note: 'Rest reicht für ein bis zwei Tage' },
  { id: 'sp-kaffee', name: 'Kaffeebohnen', foodId: 'f-kaffee', aisle: 'Trockenwaren', level: 'low', note: 'Etwa zwei Tassen am Tag', refill: '1 kg' },
  { id: 'sp-tabs', name: 'Spülmaschinentabs', foodId: null, aisle: 'Haushalt & Reinigung', level: 'low', listId: 'sl-drogerie', note: 'Noch etwa 4 Tabs' },
  { id: 'sp-muell', name: 'Müllbeutel 35 l', foodId: null, aisle: 'Haushalt & Reinigung', level: 'low', listId: 'sl-drogerie', note: '' },
  { id: 'sp-zahnpasta', name: 'Zahnpasta', foodId: null, aisle: 'Körperpflege', level: 'empty', listId: 'sl-drogerie', note: 'Tube ist leer' },
  { id: 'sp-klopapier', name: 'Toilettenpapier', foodId: null, aisle: 'Haushalt & Reinigung', level: 'ok', listId: 'sl-drogerie', note: '' },
  { id: 'sp-waschmittel', name: 'Waschmittel flüssig', foodId: null, aisle: 'Haushalt & Reinigung', level: 'ok', listId: 'sl-drogerie', note: '' },
];

// ------------------------------------------------------------------ Haushalt & Wartung ---
// Regeln im Format von core/recurrence.js. Fälligkeit = erster Termin nach der letzten Erledigung (bei „nach Erledigung“ ab Erledigung).
const RULES = {
  rauchmelder: { freq: 'yearly', byMonth: 12, byMonthDay: 1 },
  heizkoerper: { freq: 'yearly', byMonth: 10, byMonthDay: 15 },
  waschmaschine: { freq: 'monthly', byMonthDay: 17 },
  dunstabzug: { freq: 'monthly', interval: 3, byMonthDay: 24, start: '2026-02-24' },
  kuehlschrank: { freq: 'monthly', interval: 6, byMonthDay: 30, start: '2026-05-30' },
  wasserhaehne: { freq: 'afterDone', afterDoneDays: 180 },
};
export const householdTasks = [
  { id: 'hh-rauchmelder', name: 'Rauchmelder testen', area: 'Wohnung', icon: 'bell', tone: 'danger', rule: RULES.rauchmelder, lastDone: '2025-12-01', since: '2025-12-01', minutes: 10, note: 'Flur, Schlafzimmer, Küche: Testknopf drücken, Batterien prüfen.', taskId: null },
  { id: 'hh-heizkoerper', name: 'Heizkörper entlüften', area: 'Wohnung', icon: 'thermometer-sun', tone: 'warning', rule: RULES.heizkoerper, lastDone: '2026-10-17', since: '2025-10-15', minutes: 30, note: 'Im Herbst vor der Heizperiode, Entlüftungsschlüssel nötig.', taskId: null },
  { id: 'hh-waschmaschine', name: 'Waschmaschine: 90-Grad-Pflegewäsche', area: 'Bad', icon: 'waves', tone: 'info', rule: RULES.waschmaschine, lastDone: '2026-10-18', since: '2026-03-17', minutes: 5, note: 'Leer bei 90 Grad, Waschmittel ohne Weichspüler.', taskId: null },
  { id: 'hh-dunstabzug', name: 'Dunstabzugsfilter reinigen', area: 'Küche', icon: 'wind', tone: 'accent', rule: RULES.dunstabzug, lastDone: '2026-08-24', since: '2026-02-24', minutes: 20, note: 'Fettfilter in die Spülmaschine, Filtermatte alle 6 Monate wechseln.', taskId: null },
  { id: 'hh-kuehlschrank', name: 'Kühlschrank abtauen und reinigen', area: 'Küche', icon: 'snowflake', tone: 'info', rule: RULES.kuehlschrank, lastDone: '2026-05-31', since: '2026-05-30', minutes: 60, note: 'Vorher einkaufen und leer essen.', taskId: null },
  { id: 'hh-wasserhaehne', name: 'Wasserhähne entkalken', area: 'Bad', icon: 'droplet', tone: 'success', rule: RULES.wasserhaehne, lastDone: '2026-07-12', since: '2026-01-10', minutes: 15, note: 'Perlatoren abschrauben und in Essigwasser legen.', taskId: null },
];
/** Vorschläge für den Start (Referenzdaten, bleiben im Erststart): Name, Bereich, Regel. */
export const householdTemplates = householdTasks.map(({ id, name, area, icon, tone, rule, minutes, note }) => ({ id: `tpl-${id.slice(3)}`, name, area, icon, tone, rule, minutes, note }));

// ------------------------------------------------------------------ Einkäufe (Verlauf aus Finanzen, ein geplanter) ---
export const shoppingTrips = [
  { id: 'trip-next', status: 'geplant', date: '2026-11-26', time: '17:30', storeId: 'st-rewe', storeName: 'REWE Bielefeld-Mitte', listId: FOOD_LIST, note: 'nach dem Fokusblock', transactionId: null },
  { id: 'trip-t1', status: 'erledigt', date: '2026-11-24', time: '08:12', storeId: 'st-rewe', storeName: 'REWE Bielefeld-Mitte', listId: FOOD_LIST, note: '', transactionId: 't1', total: 38.47 },
  { id: 'trip-t8', status: 'erledigt', date: '2026-11-17', time: '08:30', storeId: null, storeName: 'Edeka Center', listId: FOOD_LIST, note: '', transactionId: 't8', total: 96.31 },
  { id: 'trip-t11', status: 'erledigt', date: '2026-11-14', time: '11:40', storeId: 'st-markt', storeName: 'Wochenmarkt Siegfriedplatz', listId: FOOD_LIST, note: '', transactionId: 't11', total: 31.6 },
];

// ------------------------------------------------------------------ Kennzahlen, Hinweise, Suche, Mitteilungen ---
const parts = (over = {}) => ({ lists: shoppingLists, shopping: nutShopping, plan: nutPlan, recipes: nutRecipes, foods: nutFoods, household: householdTasks, pantry: shoppingPantry, today: TODAY, ...over });
export const shoppingSummary = shoppingSummaryOf(parts());

const views = listsView({ lists: shoppingLists, shopping: nutShopping, plan: nutPlan, recipes: nutRecipes, foods: nutFoods }, TODAY);
const food = views.find((l) => l.id === FOOD_LIST);
const hh = householdTasks.map((t) => ({ ...t, ...householdStatus(t, TODAY) }));
const overdue = hh.find((t) => t.state === 'overdue'), dueToday = hh.find((t) => t.state === 'today');
const dunstFilter = shoppingLists[2].items.find((i) => i.for === 'hh-dunstabzug');
export const shoppingHints = [
  ...(overdue ? [{ id: 'h-shop-hh-overdue', text: `${overdue.name} ist ${dueText(overdue, TODAY)}. Etwa ${overdue.minutes} Minuten.`, source: `householdTasks[${overdue.id}]`, module: 'shopping', tone: 'warning', to: 'shopping.household', carry: { selectedId: overdue.id } }] : []),
  ...(dueToday ? [{ id: 'h-shop-hh-today', text: `${dueToday.name} ist heute fällig${dunstFilter ? `; die Filtermatte steht auf der Liste Baumarkt` : ''}.`, source: `householdTasks[${dueToday.id}]`, module: 'shopping', tone: 'info', to: 'shopping.household', carry: { selectedId: dueToday.id } }] : []),
  ...(food && food.open ? [{ id: 'h-shop-food', text: `${food.open} Artikel für die nächsten ${food.range} Tage stehen auf der Lebensmittel-Liste.`, source: 'nutShopping', module: 'shopping', tone: 'info', to: 'shopping.list' }] : []),
  ...shoppingPantry.filter((p) => p.id === 'sp-butter').map((p) => ({ id: 'h-shop-pantry', text: `${p.name} ist fast leer. ${p.note}.`, source: `shoppingPantry[${p.id}]`, module: 'shopping', tone: 'neutral', to: 'shopping.pantry' })),
];
export const shoppingSearch = [
  ...views.map((l) => ({ id: `slist:${l.id}`, type: 'Einkaufsliste', title: l.name, subtitle: `${l.open} offen von ${l.total}`, module: 'shopping', to: 'shopping.list', params: { id: l.id } })),
  ...shoppingLists.filter((l) => l.kind === 'custom').flatMap((l) => l.items.map((i) => ({ id: `sitem:${i.id}`, type: 'Einkauf', title: i.name, subtitle: `${l.name}${i.qty ? ` · ${i.qty}` : ''}`, module: 'shopping', to: 'shopping.list', params: { id: l.id } }))),
  ...hh.map((t) => ({ id: `hhtask:${t.id}`, type: 'Haushalt', title: t.name, subtitle: `${ruleText(t)} · ${dueText(t, TODAY)}`, module: 'shopping', to: 'shopping.household', params: { id: t.id } })),
  ...shoppingPantry.map((p) => ({ id: `spantry:${p.id}`, type: 'Vorrat', title: p.name, subtitle: p.level === 'ok' ? 'Reicht' : p.level === 'low' ? 'Fast leer' : 'Leer', module: 'shopping', to: 'shopping.pantry', params: { id: p.id } })),
  ...shoppingStores.map((s) => ({ id: `sstore:${s.id}`, type: 'Laden', title: s.name, subtitle: `${s.aisles.length} Gänge`, module: 'shopping', to: 'shopping.settings', params: { id: s.id } })),
];
export const shoppingNotifications = [
  ...(overdue ? [{ id: 'n-shop-hh-overdue', title: `${overdue.name}: überfällig`, text: `${dueText(overdue, TODAY)[0].toUpperCase()}${dueText(overdue, TODAY).slice(1)}, etwa ${overdue.minutes} Minuten.`, module: 'shopping', tone: 'warning', priority: 'normal', time: at(-1, '18:00'), to: 'shopping.household' }] : []),
  ...(dueToday ? [{ id: 'n-shop-hh-today', title: `${dueToday.name}: heute fällig`, text: `Wiederholung: ${ruleText(dueToday)} Etwa ${dueToday.minutes} Minuten.`, module: 'shopping', tone: 'neutral', priority: 'normal', time: at(0, '08:00'), to: 'shopping.household' }] : []),
  { id: 'n-shop-trip', title: 'Einkauf Do, 26.11. um 17:30 Uhr', text: `${food ? food.open : 0} Artikel offen, Laden-Modus funktioniert ohne Netz.`, module: 'shopping', tone: 'neutral', priority: 'leise', time: at(0, '07:30'), to: 'shopping.store' },
];

// ------------------------------------------------------------------ Szenarien ---
// Erster Start: eigene Daten leer; Läden mit Gängen, die Lebensmittel-Liste und die Vorschläge für Wartung bleiben (Referenz).
const stressLists = triple(shoppingLists).map((l) => (l.items ? { ...l, items: triple(l.items) } : l));
const stressPlan = triple(nutPlan), stressShopping = { ...nutShopping, manual: triple(nutShopping.manual) };
const stressHh = triple(householdTasks), stressPantry = triple(shoppingPantry);
const stressSummary = shoppingSummaryOf(parts({ lists: stressLists, plan: stressPlan, shopping: stressShopping, recipes: triple(nutRecipes), foods: triple(nutFoods), household: stressHh, pantry: stressPantry }));
export const scenarios = {
  erststart: {
    shoppingStores, householdTemplates,
    shoppingLists: [defaultFoodList],
    shoppingPantry: [], householdTasks: [], shoppingTrips: [],
    shoppingSummary: shoppingSummaryOf(parts({ lists: [defaultFoodList], shopping: { ...nutShopping, pantry: [], checked: {}, manual: [], recipeAdds: [], spentMonth: 0 }, plan: [], household: [], pantry: [] })),
    shoppingHints: [], shoppingSearch: [], shoppingNotifications: [],
  },
  stress: {
    shoppingLists: stressLists, shoppingPantry: stressPantry, householdTasks: stressHh,
    shoppingTrips: triple(shoppingTrips),
    shoppingSummary: stressSummary,
  },
};
