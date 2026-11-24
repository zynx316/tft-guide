// Ernährung: Rezept-Detail – Portionen skalieren, Nährwerte je Portion, Kochmodus, ins Tagebuch / in den Plan / zur Einkaufsliste.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Icon, Badge, Chip, EmptyState, toneColor } from '../../ui.js';
import { MEALS, mealInfo, num, todayIso, shiftDay, dayLabel, hhmm, viewDay, MACROS, r1 } from './_calc.js';
import { recipePerServing, scaleIngredients, recipeAllergens, recipeToEntry, recipeTime } from './_recipes.js';
import { logEntry } from './_portion.js';
import { CookView, COOK_CSS } from './cook-mode.js';
import { Stepper, LBL_CSS, arr, obj, tintBox, labelNote } from './_ui.js';

function LogSheet({ r, servings0, onSave }) {
  const [k, setK] = useState(1), [meal, setMeal] = useState(r.meal || 'lunch');
  return html`<div style="display:flex;flex-direction:column;gap:14px"><${Stepper} value=${k} onChange=${setK} step=${0.5} min=${0.5} max=${servings0} digits=${1} unit="Portion" label="Portionen gegessen" />
    <div class="tk-nu-chips" role="group" aria-label="Mahlzeit">${MEALS.map((m) => html`<${Chip} icon=${m.icon} active=${meal === m.id} onClick=${() => setMeal(m.id)}>${m.label}<//>`)}</div>
    <${Button} variant="primary" icon="plus" onClick=${() => onSave(k, meal)}>Ins Tagebuch<//></div>`;
}
function PlanSheet({ r, today, servings, onSave }) {
  const days = Array.from({ length: 7 }, (_, i) => shiftDay(today, i));
  const [day, setDay] = useState(days[1]), [meal, setMeal] = useState(r.meal || 'dinner');
  return html`<div style="display:flex;flex-direction:column;gap:14px"><div class="tk-nu-chips" role="group" aria-label="Tag">${days.map((d) => html`<${Chip} active=${day === d} onClick=${() => setDay(d)}>${d === today ? 'Heute' : dayLabel(d)}<//>`)}</div>
    <div class="tk-nu-chips" role="group" aria-label="Mahlzeit">${MEALS.map((m) => html`<${Chip} icon=${m.icon} active=${meal === m.id} onClick=${() => setMeal(m.id)}>${m.label}<//>`)}</div>
    <${Button} variant="primary" icon="calendar-plus" onClick=${() => onSave(day, meal)}>Einplanen · ${num(servings, 1)} Portion${servings === 1 ? '' : 'en'}<//></div>`;
}

export const recipeDetail = {
  id: 'recipe-detail',
  name: 'Rezept-Detail',
  category: 'Ernährung',
  description: 'Ein Rezept mit skalierbaren Portionen, Zutaten, Schritten, Nährwerten je Portion (aus den Zutaten berechnet) und Allergenen. Aktionen: ins Tagebuch, in den Plan, Zutaten zur Einkaufsliste und Kochmodus.',
  version: '1.1',
  props: [
    { name: 'defaultRecipe', label: 'Standard-Rezept (ID)', type: 'text', default: '' },
    { name: 'showActions', label: 'Aktionen zeigen', type: 'boolean', default: true },
  ],
  data: [
    { slot: 'recipes', label: 'Rezepte', default: 'recipes', shape: 'Rezepte', required: true },
    { slot: 'foods', label: 'Lebensmittel', default: 'foods', shape: 'Lebensmittel', required: true },
    { slot: 'diary', label: 'Tagebuch', default: 'diary', shape: 'Einträge', required: false },
    { slot: 'plan', label: 'Wochenplan', default: 'plan', shape: 'Planpunkte', required: false },
    { slot: 'shopping', label: 'Einkauf', default: 'shopping', shape: '{recipeAdds:[]}', required: false },
  ],
  events: ['recipe.log', 'recipe.plan', 'recipe.shop', 'recipe.cook', 'recipe.favorite', 'recipe.servings', 'portion.confirm'],
  states: ['empty'],
  css: `${COOK_CSS}${LBL_CSS}
  .tk-nrec { display:flex; flex-direction:column; gap:var(--tk-space-4); min-width:0; }
  .tk-nrec__head { display:flex; gap:14px; align-items:flex-start; } .tk-nrec__head h2 { margin:0; font-size:var(--tk-nfs-2xl); letter-spacing:var(--tk-ls-tight); line-height:1.2; }
  .tk-nrec__cover { width:64px; height:64px; border-radius:18px; display:grid; place-items:center; flex:none; background:color-mix(in srgb, var(--rc) 18%, var(--tk-c-surface)); color:var(--rc); }
  .tk-nrec__meta { display:flex; gap:var(--tk-space-4); flex-wrap:wrap; color:var(--tk-c-text-muted); font-size:var(--tk-nfs-sm); margin-top:6px; } .tk-nrec__meta span { display:inline-flex; gap:5px; align-items:center; flex-wrap:wrap; min-width:0; }
  .tk-nrec__nut { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:8px; } .tk-nrec__nut div { padding:10px 12px; border-radius:var(--tk-radius-md); background:var(--tk-c-surface2); border:1px solid var(--tk-c-border); } .tk-nrec__nut strong { display:block; font-size:var(--tk-nfs-xl); font-variant-numeric:tabular-nums; } .tk-nrec__nut span { font-size:var(--tk-nfs-xs); color:var(--tk-c-text-muted); } .bp-mobile .tk-nrec__nut { grid-template-columns:repeat(2,minmax(0,1fr)); }
  .tk-nrec__cols { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1.3fr); gap:var(--tk-space-5); } .bp-mobile .tk-nrec__cols, .bp-tablet .tk-nrec__cols { grid-template-columns:1fr; }
  .tk-nrec__ing { list-style:none; margin:0; padding:0; } .tk-nrec__ing li { display:flex; justify-content:space-between; gap:12px; padding:9px 0; border-bottom:1px solid var(--tk-c-border); } .tk-nrec__ing strong { font-variant-numeric:tabular-nums; white-space:nowrap; }
  .tk-nrec__steps { list-style:none; margin:0; padding:0; counter-reset:s; display:flex; flex-direction:column; gap:12px; } .tk-nrec__steps li { counter-increment:s; display:flex; gap:12px; align-items:flex-start; }
  .tk-nrec__steps li::before { content:counter(s); flex:none; width:28px; height:28px; border-radius:50%; display:grid; place-items:center; background:var(--tk-c-accent-soft); color:var(--tk-c-accent); font-weight:var(--tk-fw-bold); font-size:var(--tk-nfs-sm); }
  .tk-nrec__act { display:flex; gap:8px; flex-wrap:wrap; } .tk-nrec__fav { flex:none; } .tk-nrec__fav[aria-pressed="true"] { color:var(--tk-c-warning); }
  .tk-nrec h4 { margin:0 0 6px; font-size:var(--tk-nfs-md); font-weight:var(--tk-fw-semibold); }`,
  example: { data: {
    recipes: [{ id: 'r-lachs', title: 'Lachs mit Ofengemüse', subtitle: 'Ein Blech, wenig Aufwand', meal: 'dinner', servings: 2, prepMin: 10, cookMin: 25, level: 'einfach', tags: ['proteinreich'], tone: 3, icon: 'fish', ingredients: [{ foodId: 'f-lachs', g: 300 }, { foodId: 'f-brokkoli', g: 300 }], steps: [{ text: 'Ofen auf 200 °C vorheizen.' }, { text: 'Gemüse 15 Minuten garen.', minutes: 15 }, { text: 'Lachs zugeben und 10 Minuten garen.', minutes: 10 }] }],
    foods: [{ id: 'f-lachs', name: 'Lachsfilet', kcal: 202, protein: 20, carbs: 0, fat: 13, fiber: 0, sugar: 0, salt: 0.12, unit: 'g', allergens: ['Fisch'] }, { id: 'f-brokkoli', name: 'Brokkoli', kcal: 34, protein: 2.8, carbs: 2.7, fat: 0.4, fiber: 2.6, sugar: 1.4, salt: 0.03, unit: 'g' }],
    diary: [], plan: [], shopping: { recipeAdds: [] },
  } },
  render: function RecipeDetail({ props, data, setData, ctx }) {
    const recipes = arr(data.recipes), foods = arr(data.foods);
    const r = recipes.find((x) => x.id === (ctx.ui?.selectedId || props.defaultRecipe)) || recipes.find((x) => x.id === props.defaultRecipe) || recipes[0];
    const [servings, setServings] = useState(null), [cook, setCook] = useState(false);
    if (!r) return html`<${Card}><${EmptyState} icon="chef-hat" title="Kein Rezept gewählt" text="Wähle in der Rezeptliste ein Rezept aus." /><//>`;
    const k = servings ?? r.servings, today = todayIso(ctx);
    const ps = recipePerServing(r, foods), ing = scaleIngredients(r, k, foods), allergens = recipeAllergens(r, foods);
    const color = toneColor(r.tone);
    const fav = () => { setData('recipes', (l) => arr(l).map((x) => (x.id === r.id ? { ...x, fav: !x.fav } : x))); ctx.emit('recipe.favorite', { id: r.id, fav: !r.fav }); };
    const log = () => { ctx.emit('recipe.log', { id: r.id }); ctx.openDialog({ title: 'Ins Tagebuch', body: (close) => html`<${LogSheet} r=${r} servings0=${Math.max(k, 1)} onSave=${(n, meal) => { logEntry(ctx, setData, recipeToEntry(r, foods, n, { meal, date: viewDay(ctx), time: hhmm(ctx.today) })); close(); }} />` }); };
    const plan = () => { ctx.emit('recipe.plan', { id: r.id }); ctx.openDialog({ title: 'In den Wochenplan', body: (close) => html`<${PlanSheet} r=${r} today=${today} servings=${k} onSave=${(day, meal) => { setData('plan', (l) => [...arr(l), { id: `p-${day.slice(8)}-${meal}-${Date.now().toString(36)}`, date: day, meal, kind: 'recipe', recipeId: r.id, label: r.title, servings: k, status: 'planned', kcal: Math.round(ps.kcal * k), protein: r1(ps.protein * k), carbs: r1(ps.carbs * k), fat: r1(ps.fat * k) }]); ctx.toast(`${r.title}: ${dayLabel(day)}, ${mealInfo(meal).label}`); close(); }} />` }); };
    const shop = () => { setData('shopping', (s) => ({ ...obj(s), recipeAdds: [...arr(obj(s).recipeAdds).filter((a) => a.recipeId !== r.id), { recipeId: r.id, servings: k }] })); ctx.emit('recipe.shop', { id: r.id }); ctx.toast(`Zutaten für ${num(k, 1)} Portion${k === 1 ? '' : 'en'} auf der Einkaufsliste`); };
    const cooking = () => { setCook(true); ctx.emit('recipe.cook', { id: r.id }); };
    if (cook) return html`<${Card}><${CookView} recipe=${r} servings=${k} foods=${foods} ctx=${ctx} onExit=${() => setCook(false)} /><//>`;
    return html`<div class="tk-nrec"><${Card}><div class="tk-nrec">
      <div class="tk-nrec__head"><span class="tk-nrec__cover" style=${`--rc:${color}`}><${Icon} name=${r.icon || 'utensils'} size=${30} /></span>
        <div class="tk-grow" style="min-width:0"><h2>${r.title}</h2><div class="tk-nu-meta">${r.subtitle}</div>
          <div class="tk-nrec__meta"><span><${Icon} name="timer" size=${14} />${recipeTime(r)} Min.</span><span><${Icon} name="chef-hat" size=${14} />${r.level}</span><span>${(r.tags || []).map((t) => html`<${Badge}>${t}<//>`)}</span></div></div>
        <${Button} variant="ghost" icon="star" class="tk-nrec__fav" aria-pressed=${String(!!r.fav)} aria-label=${r.fav ? 'Aus Favoriten entfernen' : 'Als Favorit markieren'} onClick=${fav} /></div>
      <div class="tk-row" style="gap:12px;flex-wrap:wrap"><span class="tk-nu-meta">Portionen</span><${Stepper} value=${k} onChange=${(n) => { setServings(n); ctx.emit('recipe.servings', { id: r.id, servings: n }); }} step=${1} min=${1} max=${24} label="Portionen" /><span class="tk-nu-meta">Nährwerte je Portion bleiben gleich</span></div>
      <div class="tk-nrec__nut" aria-label="Nährwerte pro Portion"><div><strong>${num(ps.kcal)}</strong><span>kcal je Portion</span></div>${MACROS.map((m) => html`<div><strong>${num(ps[m.id], 1)} g</strong><span>${m.label}</span></div>`)}</div>
      <div class="tk-nu-meta">Gesamt für ${num(k, k % 1 ? 1 : 0)} Portion${k === 1 ? '' : 'en'}: ${num(ps.kcal * k)} kcal · E ${num(ps.protein * k)} g · Ballaststoffe ${num(ps.fiber * k)} g${allergens.length ? ` · Enthält: ${allergens.join(', ')}` : ''}</div>
      ${labelNote()}
      ${props.showActions && html`<div class="tk-nrec__act"><${Button} variant="primary" icon="plus" onClick=${log}>Ins Tagebuch<//><${Button} icon="calendar-plus" onClick=${plan}>In den Plan<//><${Button} icon="shopping-cart" onClick=${shop}>Zutaten zur Einkaufsliste<//><${Button} icon="chef-hat" onClick=${cooking}>Kochmodus<//></div>`}</div><//>
      <div class="tk-nrec__cols"><${Card} title="Zutaten" icon="list-checks"><ul class="tk-nrec__ing">${ing.map((x) => html`<li><span>${x.name}</span><strong>${x.label}</strong></li>`)}</ul><//>
        <${Card} title="Zubereitung" icon="list-ordered"><ol class="tk-nrec__steps">${(r.steps || []).map((s) => html`<li><div style="min-width:0">${s.text}${s.minutes ? html` <${Badge} icon="timer">${s.minutes} Min.<//>` : null}</div></li>`)}</ol><//></div></div>`;
  },
};
export default [recipeDetail];
