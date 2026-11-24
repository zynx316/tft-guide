// Ernährung – reine Berechnungen für Rezepte, Wochenplan und Einkaufsliste (ohne UI).
import { per, totals, r1, num, shiftDay, eid } from './_calc.js';

export const byId = (list) => new Map((Array.isArray(list) ? list : []).map((x) => [x.id, x]));

export const AISLES = ['Obst & Gemüse', 'Kühlregal', 'Trockenwaren', 'Tiefkühl', 'Getränke', 'Sonstiges'];
const CAT_AISLE = {
  'Obst & Gemüse': 'Obst & Gemüse', 'Milch & Eier': 'Kühlregal', 'Fleisch & Fisch': 'Kühlregal', 'Pflanzlich': 'Kühlregal',
  'Getreide & Brot': 'Trockenwaren', 'Hülsenfrüchte': 'Trockenwaren', 'Nüsse & Öle': 'Trockenwaren', 'Konserven': 'Trockenwaren', 'Süßes & Snacks': 'Trockenwaren',
  'Getränke': 'Getränke', 'Eiweiß & Supplements': 'Trockenwaren', 'Tiefkühl': 'Tiefkühl',
};
export const aisleOf = (food) => food?.aisle || CAT_AISLE[food?.category] || 'Sonstiges';

/** Menge verständlich: 450 g · 1,2 kg · 4 Stück · 250 ml */
export function amountLabel(food, g) {
  if (food?.piece) { const n = Math.max(1, Math.round(g / food.piece.g)); return `${n} ${n === 1 ? food.piece.label : food.piece.plural || food.piece.label}`; }
  const u = food?.unit === 'ml' ? 'ml' : 'g';
  if (g >= 1000) return `${num(g / 1000, 1)} ${u === 'ml' ? 'l' : 'kg'}`;
  return `${num(Math.round(g))} ${u}`;
}

// ---------------------------------------------------------------- Rezepte
export function recipeTotals(recipe, foods) {
  const map = byId(foods);
  return totals((recipe.ingredients || []).map((i) => (map.get(i.foodId) ? per(map.get(i.foodId), i.g) : {})));
}
export function recipePerServing(recipe, foods, servings = recipe.servings) {
  const t = recipeTotals(recipe, foods), n = Math.max(1, recipe.servings || 1);
  const f = 1 / n;
  return { kcal: Math.round(t.kcal * f), protein: r1(t.protein * f), carbs: r1(t.carbs * f), fat: r1(t.fat * f), fiber: r1(t.fiber * f), sugar: r1(t.sugar * f), salt: Math.round(t.salt * f * 100) / 100, servings };
}
/** Zutaten für eine andere Portionszahl (linear skaliert). */
export function scaleIngredients(recipe, servings, foods) {
  const map = byId(foods), k = servings / Math.max(1, recipe.servings || 1);
  return (recipe.ingredients || []).map((i) => { const f = map.get(i.foodId); const g = Math.round(i.g * k * 10) / 10; return { ...i, food: f, name: f?.name || i.foodId, g, label: amountLabel(f, g) }; });
}
export const recipeAllergens = (recipe, foods) => { const map = byId(foods); return [...new Set((recipe.ingredients || []).flatMap((i) => map.get(i.foodId)?.allergens || []))]; };
export const recipeTime = (r) => (r.prepMin || 0) + (r.cookMin || 0);

// --------------------------------------------------------------- Wochenplan
/** Nährwerte eines Planpunkts (Rezept × Portionen, Lebensmittel × Gramm, sonst Schätzung). */
export function planNutrition(item, recipes, foods) {
  if (item.recipeId) { const r = byId(recipes).get(item.recipeId); if (r) { const p = recipePerServing(r, foods); const k = item.servings || 1; return { kcal: Math.round(p.kcal * k), protein: r1(p.protein * k), carbs: r1(p.carbs * k), fat: r1(p.fat * k), fiber: r1(p.fiber * k), sugar: r1(p.sugar * k), salt: 0 }; } }
  if (item.foodId) { const f = byId(foods).get(item.foodId); if (f) return per(f, item.grams || 100); }
  return { kcal: item.kcal || 0, protein: item.protein || 0, carbs: item.carbs || 0, fat: item.fat || 0, fiber: 0, sugar: 0, salt: 0 };
}
export const planLabel = (item, recipes, foods) => item.label || byId(recipes).get(item.recipeId)?.title || byId(foods).get(item.foodId)?.name || 'Eintrag';
export const planDay = (plan, iso) => (Array.isArray(plan) ? plan : []).filter((p) => p.date === iso);
export function planDayTotals(plan, iso, recipes, foods) {
  return totals(planDay(plan, iso).filter((p) => p.status !== 'skipped').map((p) => planNutrition(p, recipes, foods)));
}
/** Planpunkt → Tagebucheintrag („wie geplant gegessen“). */
export function planToEntry(item, recipes, foods, { date, time, ctx } = {}) {
  const n = planNutrition(item, recipes, foods);
  const amount = item.recipeId ? `${num(item.servings || 1, 1)} Portion${(item.servings || 1) === 1 ? '' : 'en'}` : item.foodId ? `${num(item.grams || 100)} g` : 'Schätzung';
  return { id: eid('e', ctx), date: date || item.date, meal: item.meal, time: time || null, foodId: item.foodId || null, recipeId: item.recipeId || null, name: planLabel(item, recipes, foods), amount, grams: item.grams || null, ...n, source: 'plan', planId: item.id };
}
export const recipeToEntry = (recipe, foods, servings, { meal, date, time, ctx }) => {
  const p = recipePerServing(recipe, foods);
  return { id: eid('e', ctx), date, meal, time: time || null, foodId: null, recipeId: recipe.id, name: recipe.title, amount: `${num(servings, 1)} Portion${servings === 1 ? '' : 'en'}`, grams: null, kcal: Math.round(p.kcal * servings), protein: r1(p.protein * servings), carbs: r1(p.carbs * servings), fat: r1(p.fat * servings), fiber: r1(p.fiber * servings), sugar: r1(p.sugar * servings), salt: Math.round(p.salt * servings * 100) / 100, source: 'recipe' };
};

// ------------------------------------------------------------ Einkaufsliste
/**
 * Leitet die Einkaufsliste aus dem Plan ab (Zeitraum ab heute), addiert Rezepte, die direkt
 * hinzugefügt wurden, gleicht mit dem Vorrat ab und gruppiert nach Gängen.
 * shopping: { rangeDays, checked:{key:true}, pantry:[foodId], manual:[{id,name,aisle,qty}], recipeAdds:[{recipeId,servings}] }
 */
export function buildShopping({ plan, recipes, foods, shopping = {}, today }) {
  const fmap = byId(foods), rmap = byId(recipes);
  const range = shopping.rangeDays || 3, to = shiftDay(today, range - 1);
  const rows = new Map();
  const add = (foodId, g, from) => {
    const f = fmap.get(foodId); if (!f) return;
    const row = rows.get(foodId) || { key: foodId, foodId, name: f.name, g: 0, aisle: aisleOf(f), food: f, from: [], manual: false };
    row.g += g; if (from && !row.from.includes(from)) row.from.push(from); rows.set(foodId, row);
  };
  for (const p of plan || []) {
    if (p.date < today || p.date > to || p.status === 'done' || p.status === 'skipped') continue;
    if (p.recipeId && rmap.get(p.recipeId)) { const r = rmap.get(p.recipeId); const k = (p.servings || 1) / Math.max(1, r.servings); for (const i of r.ingredients) add(i.foodId, i.g * k, r.title); }
    else if (p.foodId) add(p.foodId, p.grams || 100, 'Plan: Snack');
  }
  for (const a of shopping.recipeAdds || []) { const r = rmap.get(a.recipeId); if (!r) continue; const k = (a.servings || r.servings) / Math.max(1, r.servings); for (const i of r.ingredients) add(i.foodId, i.g * k, r.title); }
  const pantry = new Set(shopping.pantry || []);
  const items = [...rows.values()].map((r) => {
    const g = Math.ceil(r.g / 10) * 10;
    return { ...r, g, amount: amountLabel(r.food, g), price: (g / 100) * (r.food.eur100 || 0), checked: !!shopping.checked?.[r.key], pantry: pantry.has(r.foodId) };
  });
  for (const m of shopping.manual || []) items.push({ key: m.id, name: m.name, aisle: m.aisle || 'Sonstiges', amount: m.qty || '', g: 0, price: m.price || 0, from: [], manual: true, checked: !!shopping.checked?.[m.id], pantry: false });
  const buy = items.filter((i) => !i.pantry);
  const sorted = (list) => list.sort((a, b) => Number(a.checked) - Number(b.checked) || a.name.localeCompare(b.name, 'de'));
  const groups = AISLES.map((aisle) => ({ aisle, items: sorted(buy.filter((i) => i.aisle === aisle)) })).filter((g) => g.items.length);
  return {
    groups, pantryItems: items.filter((i) => i.pantry), from: to, range,
    total: buy.length, done: buy.filter((i) => i.checked).length, price: buy.reduce((a, i) => a + (i.price || 0), 0),
    priceOpen: buy.filter((i) => !i.checked).reduce((a, i) => a + (i.price || 0), 0),
  };
}
