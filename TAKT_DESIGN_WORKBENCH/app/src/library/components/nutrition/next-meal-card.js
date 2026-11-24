// Ernährung: nächste geplante Mahlzeit – Hero- oder Kompaktkarte mit „Wie geplant gegessen“ und Rezept-Link.
import { html } from '../../../lib/html.js';
import { Card, Button, Icon, EmptyState, Badge, toneColor } from '../../ui.js';
import { mealInfo, num, dayLabel, todayIso, hhmm, eid, shiftDay } from './_calc.js';
import { NU_CSS, arr, tintBox } from './_ui.js';

const RANK = { breakfast: 1, lunch: 2, dinner: 3, snack: 4 };
export const nextPlanned = (plan, today) => arr(plan).filter((p) => p.status === 'planned' && p.date >= today).sort((a, b) => (a.date === b.date ? RANK[a.meal] - RANK[b.meal] : a.date < b.date ? -1 : 1))[0] || null;
export const planEntry = (p, date, time) => ({ id: eid(), date, meal: p.meal, time, foodId: p.foodId || null, recipeId: p.recipeId || null, name: p.label || 'Geplante Mahlzeit', amount: p.recipeId ? `${num(p.servings || 1, 1)} Portion` : p.grams ? `${num(p.grams)} g` : 'Schätzung', grams: p.grams || null, kcal: p.kcal || 0, protein: p.protein || 0, carbs: p.carbs || 0, fat: p.fat || 0, fiber: 0, sugar: 0, salt: 0, source: 'plan', planId: p.id });

export const nextMealCard = {
  id: 'next-meal-card',
  name: 'Nächste Mahlzeit',
  category: 'Ernährung',
  description: 'Zeigt die nächste geplante Mahlzeit mit Kalorien und Eiweiß. Ein Tap übernimmt sie als gegessen ins Tagebuch, ein zweiter öffnet das Rezept.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Als Nächstes' },
    { name: 'size', label: 'Größe', type: 'select', options: ['hero', 'compact'], default: 'hero' },
    { name: 'showRecipe', label: 'Rezept-Link', type: 'boolean', default: true },
  ],
  data: [
    { slot: 'plan', label: 'Wochenplan', default: 'plan', shape: '{id,date,meal,status,label,recipeId?,kcal,protein}[]', required: true },
    { slot: 'recipes', label: 'Rezepte', default: 'recipes', shape: '{id,tone,icon,prepMin,cookMin}[]', required: false },
    { slot: 'diary', label: 'Tagebuch', default: 'diary', shape: '{id,date,meal,name,kcal}[]', required: true },
  ],
  events: ['plan.eat', 'recipe.open', 'meal.add'],
  states: ['empty'],
  css: `${NU_CSS}
  .tk-nm { display:flex; flex-direction:column; gap:var(--tk-space-3); }
  .tk-nm--hero { padding:var(--tk-space-5); border-radius:var(--tk-radius-lg); border:1px solid var(--tk-c-border); background:linear-gradient(135deg, var(--tk-c-accent-soft), var(--tk-c-surface) 75%); }
  .tk-nm__eyebrow { font-size:var(--tk-nfs-xs); font-weight:var(--tk-fw-semibold); letter-spacing:var(--tk-ls-wide); text-transform:uppercase; color:var(--tk-c-text-muted); display:flex; gap:6px; align-items:center; }
  .tk-nm__title { margin:0; font-size:var(--tk-nfs-xl); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); line-height:1.2; }
  .tk-nm__facts { display:flex; gap:var(--tk-space-4); flex-wrap:wrap; color:var(--tk-c-text-muted); font-size:var(--tk-nfs-sm); font-variant-numeric:tabular-nums; } .tk-nm__facts strong { color:var(--tk-c-text); }
  .tk-nm__top { display:flex; gap:12px; align-items:center; min-width:0; }
  .bp-mobile .tk-nm--hero { padding:var(--tk-space-4); } .bp-mobile .tk-nm__title { font-size:var(--tk-nfs-lg); }`,
  example: { data: {
    plan: [{ id: 'p', date: '2026-11-24', meal: 'dinner', status: 'planned', label: 'Lachs mit Ofengemüse', recipeId: 'r-lachs', servings: 1, kcal: 636, protein: 39 }],
    recipes: [{ id: 'r-lachs', tone: 3, icon: 'fish', prepMin: 10, cookMin: 25 }], diary: [],
  } },
  render: function NextMealCard({ props, data, setData, ctx }) {
    const today = todayIso(ctx), p = nextPlanned(data.plan, today);
    const hero = props.size === 'hero';
    if (!p) return html`<${Card} title=${props.title}><${EmptyState} icon="calendar-days" title="Nichts mehr geplant" text="Im Wochenplan kannst du die nächsten Mahlzeiten festlegen. Spontan erfassen geht natürlich immer." action=${html`<${Button} size="sm" icon="plus" onClick=${() => ctx.emit('meal.add', {})}>Erfassen<//>`} /><//>`;
    const r = arr(data.recipes).find((x) => x.id === p.recipeId);
    const when = p.date === today ? mealInfo(p.meal).label : p.date === shiftDay(today, 1) ? `Morgen · ${mealInfo(p.meal).label}` : `${dayLabel(p.date)} · ${mealInfo(p.meal).label}`;
    const eat = () => { setData('diary', (d) => [...arr(d), planEntry(p, today, hhmm(ctx.today))]); setData('plan', (pl) => arr(pl).map((x) => (x.id === p.id ? { ...x, status: 'done' } : x))); ctx.emit('plan.eat', { id: p.id }); ctx.toast(`${p.label} als gegessen übernommen`); };
    const mins = r ? (r.prepMin || 0) + (r.cookMin || 0) : 0;
    const inner = html`<div class=${`tk-nm ${hero ? 'tk-nm--hero' : ''}`}>
      <div class="tk-nm__top">${tintBox(r?.tone || 'accent', r?.icon || mealInfo(p.meal).icon, hero ? 22 : 18)}<div class="tk-grow" style="min-width:0"><div class="tk-nm__eyebrow"><${Icon} name="calendar-check" size=${13} />${hero ? `Geplant · ${when}` : when}</div>
        <h3 class="tk-nm__title tk-truncate" style="margin-top:4px">${p.label}</h3></div></div>
      <div class="tk-nm__facts"><span><strong>${num(p.kcal)}</strong> kcal</span><span><strong>${num(p.protein)} g</strong> Eiweiß</span>${mins > 0 && html`<span><strong>${mins}</strong> Min.</span>`}${p.note && html`<span>${p.note}</span>`}</div>
      <div class="tk-nu-btnrow"><${Button} variant="primary" icon="check" onClick=${eat}>Wie geplant gegessen<//>${props.showRecipe && p.recipeId && html`<${Button} icon="chef-hat" onClick=${() => ctx.emit('recipe.open', { id: p.recipeId })}>Rezept<//>`}</div></div>`;
    return hero ? inner : html`<${Card} title=${props.title} icon="calendar-check">${inner}<//>`;
  },
};
export default [nextMealCard];
