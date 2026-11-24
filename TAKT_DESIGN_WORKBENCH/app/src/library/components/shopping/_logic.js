// Einkauf & Haushalt – reine Logik ohne UI (auch von Node-Tests und der Welt-Datei nutzbar).
// Listen aus der Welt (Lebensmittel = Ableitung aus Ernährung, weitere Listen = Eigentum von shopping), Gänge je Laden,
// Schnelleingabe, Vorräte und Wartungsfristen über core/recurrence.js. Kein Date.now(), kein Math.random(), kein Intl.
import { buildShopping } from '../nutrition/_recipes.js';
import { nextOccurrences, describeRule } from '../../../core/recurrence.js';
import { dayDiff, toDate, toIsoDay, addDays } from '../../../lib/date.js';
import { fmtDate, fmtRelativeDay, fmtMoney } from '../../../lib/format.js';

export const arr = (v) => (Array.isArray(v) ? v : []);
export const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
export const FOOD_LIST = 'sl-food';
export const SOON_DAYS = 14;
export const r1 = (n) => Math.round((Number(n) || 0) * 10) / 10;
/** Für Vergleiche: klein, Umlaute als ae/oe/ue/ss (wie in KEYWORDS), ohne Sonderzeichen. */
export const fold = (s) => String(s ?? '').toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
export const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
export const dayKey = (d) => toIsoDay(d);

export const DEFAULT_AISLES = ['Obst & Gemüse', 'Kühlregal', 'Trockenwaren', 'Tiefkühl', 'Getränke', 'Sonstiges'];
export const AISLE_ICON = {
  'Obst & Gemüse': 'carrot', Kühlregal: 'milk', Trockenwaren: 'wheat', Tiefkühl: 'snowflake', Getränke: 'cup-soda', Sonstiges: 'shopping-basket',
  Körperpflege: 'sparkles', Gesundheit: 'pill', 'Haushalt & Reinigung': 'droplets', 'Elektro & Licht': 'lightbulb', 'Heizung & Sanitär': 'thermometer-sun',
  'Werkzeug & Befestigung': 'ruler', 'Haus & Garten': 'trees',
};
export const aisleIcon = (a) => AISLE_ICON[a] || 'shopping-basket';

// ------------------------------------------------------------------ Gänge und Schnelleingabe ---
const KEYWORDS = [
  ['Obst & Gemüse', 'apfel banane tomate gurke salat zwiebel kartoffel paprika zitrone karotte moehre brokkoli avocado beeren pilz knoblauch obst gemuese zucchini spinat'],
  ['Kühlregal', 'milch joghurt skyr quark kaese butter sahne wurst schinken lachs fisch haehnchen fleisch hummus feta tofu ei eier'],
  ['Trockenwaren', 'nudeln broetchen olivenoel reis mehl haferflocken muesli brot zucker oel essig linsen kichererbsen dose kaffee tee nuesse schokolade kekse gewuerz salz pfeffer honig'],
  ['Tiefkühl', 'tiefkuehl eis eiscreme tk'],
  ['Getränke', 'wasser saft cola bier wein limo sprudel schorle'],
  ['Körperpflege', 'zahnpasta zahnbuerste duschgel shampoo seife deo wattepads taschentuecher creme rasierer'],
  ['Gesundheit', 'vitamin tabletten pflaster tropfen'],
  ['Haushalt & Reinigung', 'spuelmaschinentabs spuelmaschine waschmittel muellbeutel kuechenrolle toilettenpapier spuelmittel schwamm reiniger tuecher alufolie'],
  ['Elektro & Licht', 'batterie batterien lampe gluehbirne led kabel'],
  ['Heizung & Sanitär', 'entlueftungsschluessel dichtung'],
  ['Werkzeug & Befestigung', 'schraube schrauben duebel kabelbinder klebeband nagel'],
  ['Haus & Garten', 'filter filtermatte blumenerde'],
];
/** Gang für einen Artikelnamen, begrenzt auf die Gänge des Ladens (Fallback „Sonstiges“ bzw. der letzte Gang). */
export function guessAisle(name, aisles = DEFAULT_AISLES) {
  const words = fold(name).split(' ');
  const hit = KEYWORDS.find(([, kw]) => kw.split(' ').some((k) => words.some((w) => w === k || (k.length > 4 && w.startsWith(k)) || (k.length > 5 && w.endsWith(k)))));
  const list = aisles.length ? aisles : DEFAULT_AISLES;
  if (hit && list.includes(hit[0])) return hit[0];
  return list.includes('Sonstiges') ? 'Sonstiges' : list[list.length - 1];
}
const UNIT = '(?:g|kg|ml|l|stk\\.?|stück|packungen?|pck\\.?|dosen?|flaschen?|tuben?|x)';
/** Schnelleingabe: „2 Zahnpasta“, „Milch 2 l“, „500 g Haferflocken“, „3x Joghurt“ → { name, qty }. */
export function parseQuick(text) {
  const t = String(text ?? '').trim().replace(/\s+/g, ' ');
  if (!t) return null;
  const clean = (n, u) => (u && /^x$/i.test(u) ? n : [n, u].filter(Boolean).join(' '));
  let m = t.match(new RegExp(`^(\\d+(?:[.,]\\d+)?)\\s*(${UNIT})?\\s+(.+)$`, 'i'));
  if (m) return { name: cap(m[3]), qty: clean(m[1], m[2]) };
  m = t.match(new RegExp(`^(.+?)\\s+(\\d+(?:[.,]\\d+)?)\\s*(${UNIT})?$`, 'i'));
  if (m) return { name: cap(m[1]), qty: clean(m[2], m[3]) };
  return { name: cap(t), qty: '' };
}
/** Schrittweite je Einheit: Gramm 50, Milliliter 100, sonst 1 (bei Dezimalzahlen 0,5). */
export function qtyStep(qty) {
  const m = String(qty ?? '').trim().match(/^(\d+(?:[.,]\d+)?)\s*(.*)$/);
  if (!m) return 1;
  const unit = m[2].trim().toLowerCase();
  if (unit === 'g') return 50;
  if (unit === 'ml') return 100;
  return Number.isInteger(Number(m[1].replace(',', '.'))) ? 1 : 0.5;
}
/** Menge um einen Schritt ändern („2 Packungen“ + 1 → „3 Packungen“, „500 g“ + 1 → „550 g“); unter einem Schritt bleibt keine Menge. */
export function bumpQty(qty, delta) {
  const m = String(qty ?? '').trim().match(/^(\d+(?:[.,]\d+)?)(.*)$/);
  if (!m) return delta > 0 ? '2' : '';
  const n = Number(m[1].replace(',', '.')), step = qtyStep(qty);
  const next = Math.round((n + delta * step) * 10) / 10;
  if (next < Math.min(step, 1)) return '';
  return `${String(next).replace('.', ',')}${m[2]}`.trim();
}
export const qtyNumber = (qty) => { const m = String(qty ?? '').trim().match(/^(\d+(?:[.,]\d+)?)/); return m ? Number(m[1].replace(',', '.')) : 1; };

// ------------------------------------------------------------------ Listen ---
const norm = (i, extra = {}) => ({ id: i.id, key: i.id, name: i.name, qty: i.qty || '', aisle: i.aisle || 'Sonstiges', done: !!i.done, price: i.price || 0, note: i.note || '', for: i.for || null, from: [], foodId: null, derived: false, ...extra });
/** Lebensmittel-Liste: abgeleitet aus Ernährung (Wochenplan, Rezepte, Vorrat) plus manuelle Einträge – dieselben Daten wie die Liste in Ernährung. */
export function foodItems({ shopping, plan, recipes, foods, today }) {
  const sh = obj(shopping);
  const b = buildShopping({ plan: arr(plan), recipes: arr(recipes), foods: arr(foods), shopping: sh, today });
  const items = b.groups.flatMap((g) => g.items.map((i) => ({ id: i.key, key: i.key, name: i.name, qty: i.amount || '', aisle: g.aisle, done: !!i.checked, price: i.price || 0, note: '', for: null, from: i.from || [], foodId: i.foodId || null, derived: !i.manual, manual: !!i.manual })));
  return { items, pantryItems: b.pantryItems, range: b.range, priceOpen: b.priceOpen, until: b.from };
}
export const defaultFoodList = { id: FOOD_LIST, name: 'Lebensmittel', icon: 'shopping-cart', tone: 'success', kind: 'food', source: 'nutShopping', storeId: null, shared: true };
/** Alle Listen mit normalisierten Artikeln und Zählern. Die Lebensmittel-Liste ist immer da (auch im Erststart). */
export function listsView(data, today) {
  const lists = arr(data.lists).slice();
  if (!lists.some((l) => l.kind === 'food')) lists.unshift(defaultFoodList);
  return lists.map((l) => {
    const food = l.kind === 'food' ? foodItems({ shopping: data.shopping, plan: data.plan, recipes: data.recipes, foods: data.foods, today }) : null;
    const items = food ? food.items : arr(l.items).map((i) => norm(i));
    const open = items.filter((i) => !i.done);
    return { ...l, items, open: open.length, done: items.length - open.length, total: items.length, priceOpen: food ? food.priceOpen : open.reduce((s, i) => s + (i.price || 0), 0), range: food?.range, until: food?.until, pantryItems: food?.pantryItems || [] };
  });
}
export const listById = (views, id) => views.find((l) => l.id === id) || views[0] || null;
export const selectedList = (views, ctx) => listById(views, ctx?.ui?.selectedId);
export const storeOf = (stores, list) => arr(stores).find((s) => s.id === list?.storeId) || null;
/** Gänge in der Reihenfolge des Ladens; Gänge, die der Laden nicht kennt, kommen ans Ende. */
export function aislesFor(store, items) {
  const base = arr(store?.aisles).length ? store.aisles.slice() : DEFAULT_AISLES.slice();
  for (const i of items) if (!base.includes(i.aisle)) base.push(i.aisle);
  return base;
}
const byName = (a, b) => String(a.name).localeCompare(String(b.name), 'de');
/** Artikel nach Gang gruppiert; offene zuerst, abgehakte am Ende ihres Gangs (oder gesammelt, `doneApart`). */
export function groupByAisle(items, aisles, { doneApart = false } = {}) {
  const pool = doneApart ? items.filter((i) => !i.done) : items;
  const groups = aisles.map((aisle) => ({ aisle, items: pool.filter((i) => i.aisle === aisle).sort((a, b) => Number(a.done) - Number(b.done) || byName(a, b)) })).filter((g) => g.items.length);
  return { groups, done: doneApart ? items.filter((i) => i.done).sort(byName) : [] };
}
/** Preisschätzung der offenen Artikel. */
export const estimate = (items) => items.filter((i) => !i.done).reduce((s, i) => s + (i.price || 0), 0);
/** Gibt es den Artikel (Name oder Lebensmittel) schon offen auf der Liste? */
export function findOnList(view, { name, foodId }) {
  const n = fold(name);
  return arr(view?.items).find((i) => !i.done && ((foodId && i.foodId === foodId) || fold(i.name) === n || (n.length > 3 && fold(i.name).includes(n)))) || null;
}

// ------------------------------------------------------------------ Schreiben (setData-Funktionen, rückgängig-fähig) ---
const patchList = (setData, listId, fn) => setData('lists', (ls) => arr(ls).map((l) => (l.id === listId ? fn(l) : l)));
const patchShopping = (setData, fn) => setData('shopping', (s) => fn(obj(s)));
/** Artikel abhaken oder zurücknehmen. */
export function toggleItem(setData, list, item, value = !item.done) {
  if (list.kind === 'food') patchShopping(setData, (s) => ({ ...s, checked: { ...obj(s.checked), [item.key]: value } }));
  else patchList(setData, list.id, (l) => ({ ...l, items: arr(l.items).map((i) => (i.id === item.id ? { ...i, done: value } : i)) }));
}
/** Artikel anlegen; liefert die Funktion zum Zurücknehmen. */
export function addItem(setData, list, { name, qty = '', aisle, price = 0 }, id) {
  const entry = { id, name, qty, aisle: aisle || 'Sonstiges' };
  if (list.kind === 'food') patchShopping(setData, (s) => ({ ...s, manual: [...arr(s.manual), entry] }));
  else patchList(setData, list.id, (l) => ({ ...l, items: [...arr(l.items), { ...entry, done: false, price }] }));
  return () => removeItem(setData, list, { id, key: id });
}
export function removeItem(setData, list, item) {
  if (list.kind === 'food') patchShopping(setData, (s) => ({ ...s, manual: arr(s.manual).filter((m) => m.id !== item.id), checked: Object.fromEntries(Object.entries(obj(s.checked)).filter(([k]) => k !== item.key)) }));
  else patchList(setData, list.id, (l) => ({ ...l, items: arr(l.items).filter((i) => i.id !== item.id) }));
}
export function restoreItem(setData, list, item, index) {
  const entry = { id: item.id, name: item.name, qty: item.qty, aisle: item.aisle };
  if (list.kind === 'food') patchShopping(setData, (s) => { const m = arr(s.manual).filter((x) => x.id !== item.id); m.splice(Math.min(index, m.length), 0, entry); return { ...s, manual: m, checked: { ...obj(s.checked), ...(item.done ? { [item.key]: true } : {}) } }; });
  else patchList(setData, list.id, (l) => { const it = arr(l.items).filter((x) => x.id !== item.id); it.splice(Math.min(index, it.length), 0, { ...entry, done: item.done, price: item.price || 0, note: item.note || '', for: item.for || null }); return { ...l, items: it }; });
}
export function setQty(setData, list, item, qty) {
  if (list.kind === 'food') patchShopping(setData, (s) => ({ ...s, manual: arr(s.manual).map((m) => (m.id === item.id ? { ...m, qty } : m)) }));
  else patchList(setData, list.id, (l) => ({ ...l, items: arr(l.items).map((i) => (i.id === item.id ? { ...i, qty } : i)) }));
}
/** Gang eines eigenen oder manuellen Artikels ändern (abgeleitete Zutaten folgen dem Plan). */
export function setAisle(setData, list, item, aisle) {
  if (list.kind === 'food') patchShopping(setData, (s) => ({ ...s, manual: arr(s.manual).map((m) => (m.id === item.id ? { ...m, aisle } : m)) }));
  else patchList(setData, list.id, (l) => ({ ...l, items: arr(l.items).map((i) => (i.id === item.id ? { ...i, aisle } : i)) }));
}
/** Eigene Liste umbenennen; liefert die Rücknahme. */
export function renameList(setData, list, name) {
  patchList(setData, list.id, (l) => ({ ...l, name }));
  return () => patchList(setData, list.id, (l) => ({ ...l, name: list.name }));
}
/** Eigene Liste löschen (die Lebensmittel-Liste bleibt immer); liefert die Rücknahme mit der alten Position. */
export function deleteList(setData, data, list) {
  const index = arr(data.lists).findIndex((l) => l.id === list.id), saved = arr(data.lists)[index];
  setData('lists', (ls) => arr(ls).filter((l) => l.id !== list.id));
  return () => setData('lists', (ls) => { const next = arr(ls).filter((l) => l.id !== list.id); next.splice(Math.min(Math.max(index, 0), next.length), 0, saved); return next; });
}
/** „Zuhause vorhanden“ für einen abgeleiteten Lebensmittel-Artikel (wie in Ernährung); liefert die Rücknahme. */
export function toPantry(setData, item, on = true) {
  patchShopping(setData, (s) => ({ ...s, pantry: on ? [...new Set([...arr(s.pantry), item.foodId])] : arr(s.pantry).filter((x) => x !== item.foodId) }));
  return () => toPantry(setData, item, !on);
}
/** Einkauf abgeschlossen: erledigte eigene und manuelle Artikel verlassen die Liste (rückgängig-fähig). Abgeleitete bleiben unten stehen. */
export function finishList(setData, list) {
  const gone = list.items.map((i, index) => ({ i, index })).filter(({ i }) => i.done && !i.derived);
  for (const { i } of gone) removeItem(setData, list, i);
  return () => gone.forEach(({ i, index }) => restoreItem(setData, list, i, index));
}

// ------------------------------------------------------------------ Vorräte ---
export const LEVELS = [{ id: 'ok', label: 'Reicht' }, { id: 'low', label: 'Fast leer' }, { id: 'empty', label: 'Leer' }];
export const levelInfo = (id) => LEVELS.find((l) => l.id === id) || LEVELS[0];
export const needsRefill = (p) => p.level === 'low' || p.level === 'empty';
/** Vorratsstufe ändern. Lebensmittel mit Verknüpfung halten „zuhause vorhanden“ in Ernährung (nutShopping.pantry) im Gleichschritt. */
export function setLevel(setData, item, level) {
  setData('pantry', (ps) => arr(ps).map((p) => (p.id === item.id ? { ...p, level } : p)));
  if (item.foodId) patchShopping(setData, (s) => ({ ...s, pantry: level === 'ok' ? [...new Set([...arr(s.pantry), item.foodId])] : arr(s.pantry).filter((x) => x !== item.foodId) }));
}
/** Ziel-Liste eines Vorrats-Artikels: Lebensmittel auf die Lebensmittel-Liste, sonst die angegebene (oder erste eigene) Liste. */
export function targetList(views, item) {
  if (item.foodId) return views.find((l) => l.kind === 'food') || views[0];
  return views.find((l) => l.id === item.listId) || views.find((l) => l.kind !== 'food') || views[0];
}
/** Vorrat „auf die Liste“: gibt es den Artikel schon, passiert nichts; sonst als Eintrag anlegen. Liefert { added, undo }. */
export function refillToList(setData, views, item, id) {
  const list = targetList(views, item);
  if (!list) return { added: false, list: null, undo: () => {} };
  if (findOnList(list, item)) return { added: false, list, undo: () => {} };
  const aisle = guessAisle(item.name, list.aisles || [item.aisle].filter(Boolean));
  const undo = addItem(setData, list, { name: item.name, qty: item.refill || '', aisle: item.aisle || aisle }, id);
  return { added: true, list, undo };
}

// ------------------------------------------------------------------ Haushalt & Wartung ---
/** Mindestabstand nach einer Erledigung, damit eine vorzeitige Erledigung nicht schon eine Woche später wieder fällig wird (jährlich 180 Tage, monatlich 10 Tage je Intervall). */
export const minGap = (rule) => (rule.freq === 'yearly' ? 180 * (rule.interval || 1) : rule.freq === 'monthly' ? 10 * (rule.interval || 1) : 1);
/** Nächste Fälligkeit: Kalenderregeln ab dem Tag nach der letzten Erledigung, „nach Erledigung“ ab Erledigung (core/recurrence.js). */
export function dueDate(task) {
  if (!task?.rule) return null;
  const base = task.lastDone || task.since;
  if (!base) return null;
  const from = toDate(base);
  let at;
  if (task.rule.freq === 'afterDone') at = nextOccurrences(task.rule, from, 1, { lastDone: task.lastDone ? from : null })[0];
  else at = nextOccurrences(task.rule, task.lastDone ? addDays(from, minGap(task.rule)) : from, 1)[0];
  return at ? toIsoDay(at) : null;
}
/** Zustand: overdue (überfällig), today, soon (bis 14 Tage), later. */
export function householdStatus(task, today) {
  const due = dueDate(task);
  if (!due) return { due: null, days: null, state: 'later' };
  const days = dayDiff(today, due);
  return { due, days, state: days < 0 ? 'overdue' : days === 0 ? 'today' : days <= SOON_DAYS ? 'soon' : 'later' };
}
export const STATE_ORDER = { overdue: 0, today: 1, soon: 2, later: 3 };
export function householdSorted(tasks, today) {
  return arr(tasks).map((t) => ({ ...t, ...householdStatus(t, today) })).sort((a, b) => STATE_ORDER[a.state] - STATE_ORDER[b.state] || String(a.due).localeCompare(String(b.due)) || byName(a, b));
}
/** Alle Fälligkeiten der nächsten `months` Monate (erste = aktuelle Fälligkeit, auch überfällig); für die Jahresansicht. */
export function projected(task, today, months = 12) {
  const st = householdStatus(task, today);
  if (!st.due) return [];
  const end = toIsoDay(addDays(today, months * 30 + 5)), out = [st.due];
  if (task.rule.freq === 'afterDone') { for (let d = st.due, i = 0; i < 24; i++) { d = toIsoDay(addDays(d, task.rule.afterDoneDays)); if (d > end) break; out.push(d); } }
  else for (const o of nextOccurrences(task.rule, addDays(st.due, 1), 40)) { const d = toIsoDay(o); if (d > end) break; out.push(d); }
  return out;
}
/** Neue Aufgabe für „Als Aufgabe planen“ (Format der Aufgaben-Welt); überfällig oder heute = heute fällig. */
export function taskFor(task, today, id) {
  const st = householdStatus(task, today), due = st.due && st.days > 0 ? st.due : today;
  return { id, title: task.name, due, priority: st.state === 'overdue' ? 'hoch' : 'mittel', project: 'Privat', category: 'Privat', status: 'Offen', done: false, estimate: task.minutes || 15, note: `Haushalt: ${ruleText(task)}`, subtasks: [] };
}
/** „seit 7 Tagen überfällig“, „heute fällig“, „in 6 Tagen“, „am 15.10.2027“. */
export function dueText(st, today) {
  if (!st.due) return 'ohne Termin';
  if (st.state === 'overdue') return st.days === -1 ? 'seit gestern überfällig' : `seit ${-st.days} Tagen überfällig`;
  if (st.state === 'today') return 'heute fällig';
  if (st.state === 'soon') return `fällig ${fmtRelativeDay(st.due, today)}`;
  return `fällig am ${fmtDate(st.due, { style: dayDiff(today, st.due) > 300 ? 'medium' : 'weekday' })}`;
}
export const ruleText = (task) => describeRule(task?.rule);
/** Erledigt am Tag `day`: die nächste Fälligkeit ergibt sich aus der Regel. */
export const completeTask = (task, day) => ({ ...task, lastDone: day });
/** Wartung erledigen: nächste Fälligkeit setzen und die verknüpfte Aufgabe (falls offen) in Aufgaben miterledigen. Liefert { next, restore } oder null. */
export function finishHousehold(setData, data, id, today) {
  const before = arr(data.household).find((x) => x.id === id);
  if (!before) return null;
  const after = { ...completeTask(before, today), taskId: null };
  const task = before.taskId ? arr(data.tasks).find((x) => x.id === before.taskId) : null, closes = !!task && !task.done && task.status !== 'Erledigt';
  setData('household', (hs) => arr(hs).map((x) => (x.id === id ? after : x)));
  if (closes) setData('tasks', (ts) => arr(ts).map((x) => (x.id === task.id ? { ...x, done: true, status: 'Erledigt', doneAt: today } : x)));
  return { next: householdStatus(after, today), restore: () => { setData('household', (hs) => arr(hs).map((x) => (x.id === id ? before : x))); if (closes) setData('tasks', (ts) => arr(ts).map((x) => (x.id === task.id ? task : x))); } };
}
/** Offene verknüpfte Aufgabe einer Wartung (ohne Aufgaben-Daten gilt die Verknüpfung als offen). */
export const linkedTask = (t, tasks) => (!t.taskId ? null : !Array.isArray(tasks) ? { id: t.taskId } : tasks.find((x) => x.id === t.taskId && !x.done && x.status !== 'Erledigt') || null);
export const dueCount = (tasks, today) => arr(tasks).filter((t) => { const s = householdStatus(t, today).state; return s === 'overdue' || s === 'today'; }).length;

// ------------------------------------------------------------------ Budget und Einkäufe (mit Finanzen verbunden) ---
export const FOOD_CATEGORY = 'Lebensmittel';
const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
/** Lebensmittel-Budget des Monats: Ziel aus dem Finanz-Budget, Ausgaben aus den Buchungen der Kategorie (wie in Finanzen). Ohne Finanzdaten gelten die Werte aus Ernährung. */
export function foodBudget({ shopping, budgets, transactions, today }) {
  const sh = obj(shopping), month = String(today).slice(0, 7);
  const food = Array.isArray(budgets) ? budgets.find((b) => b.category === FOOD_CATEGORY) : null;
  const budget = Array.isArray(budgets) ? (food ? food.target : 0) : (sh.budgetMonth || 0);
  const spent = Array.isArray(transactions) ? r2(-transactions.filter((t) => t.type === 'expense' && t.category === FOOD_CATEGORY && String(t.date).startsWith(month)).reduce((s, t) => s + t.amount, 0)) : (sh.spentMonth || 0);
  return { budget, spent, left: r2(budget - spent) };
}
/** Status „abzurechnen“: Einkauf ist abgeschlossen, die Ausgabe in Finanzen aber noch nicht gebucht. */
export const TRIP_PENDING = 'abzurechnen';
/** Einkäufe mit Buchungsabgleich: ein offener Einkauf gilt als erledigt, sobald eine neue Ausgabe (gleiche Kategorie oder gleicher Betrag) am Tag oder später in Finanzen steht. */
export function tripsView(trips, transactions) {
  return arr(trips).map((t) => {
    if (t.status !== TRIP_PENDING) return t;
    const tx = arr(transactions).find((x) => x.type === 'expense' && !arr(t.seenTx).includes(x.id) && String(x.date).slice(0, 10) >= t.date && (x.category === t.category || Math.abs(Math.abs(x.amount) - (t.total || 0)) < 0.005));
    return tx ? { ...t, status: 'erledigt', transactionId: tx.id, total: Math.abs(tx.amount) } : t;
  });
}
/** Einkauf verwerfen: der geplante Einkauf kommt zurück, sonst verschwindet der Eintrag. Liefert die Rücknahme. */
export function discardTrip(setData, trip) {
  setData('trips', (ts) => (trip.planned ? arr(ts).map((t) => (t.id === trip.id ? trip.planned : t)) : arr(ts).filter((t) => t.id !== trip.id)));
  return () => setData('trips', (ts) => (trip.planned ? arr(ts).map((t) => (t.id === trip.id ? trip : t)) : [trip, ...arr(ts)]));
}
/** Vorbelegung für „Schnell erfassen“ in Finanzen. */
export const tripPrefill = (trip, today) => ({ kind: 'expense', title: trip.storeName, amount: trip.total, date: trip.date || today, category: trip.category || FOOD_CATEGORY, account: 'acc-giro' });

// ------------------------------------------------------------------ Kennzahlen ---
/** Kennzahlen für Launchpad und Start (`shoppingSummary`): aus Listen, Haushalt, Vorrat und Budget (nur gelesen) berechnet. */
export function shoppingSummaryOf({ lists, shopping, plan, recipes, foods, household, pantry, today }) {
  const views = listsView({ lists, shopping, plan, recipes, foods }, today);
  const openItems = views.reduce((s, l) => s + l.open, 0);
  const sh = obj(shopping), left = r1((sh.budgetMonth || 0) - (sh.spentMonth || 0));
  const due = dueCount(household, today), low = arr(pantry).filter(needsRefill).length;
  return {
    kpis: [
      { label: 'Artikel offen', value: openItems, icon: 'shopping-cart', tone: 'accent', to: 'shopping.list' },
      { label: 'Haushalt fällig', value: due, icon: 'house', tone: due ? 'warning' : 'neutral', to: 'shopping.household' },
      { label: 'Vorräte knapp', value: low, icon: 'archive', tone: 'info', to: 'shopping.pantry' },
      ...(sh.budgetMonth ? [{ label: 'Lebensmittel-Budget übrig', value: fmtMoney(left), icon: 'wallet', tone: 'neutral', to: 'shopping.home' }] : []),
    ],
    openItems, listsWithOpen: views.filter((l) => l.open > 0).length, householdDue: due, lowStock: low, budgetLeft: left,
  };
}
