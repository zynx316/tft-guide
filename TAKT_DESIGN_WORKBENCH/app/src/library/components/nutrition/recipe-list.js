// Ernährung: Rezeptkarten mit Suche und Filtern (Mahlzeit, Zeit, Tags) als Raster oder Liste.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Search, Chip, Button, Icon, EmptyState, toneColor } from '../../ui.js';
import { num, mealInfo } from './_calc.js';
import { recipePerServing, recipeTime } from './_recipes.js';
import { NU_CSS, LBL_CSS, arr, tintBox, labelNote } from './_ui.js';

const TAGS = ['vegetarisch', 'vegan', 'proteinreich', 'meal-prep', 'schnell'];
const TIMES = [{ id: 'all', label: 'Jede Dauer' }, { id: '15', label: 'bis 15 Min.' }, { id: '30', label: 'bis 30 Min.' }];

export const recipeList = {
  id: 'recipe-list',
  name: 'Rezept-Liste',
  category: 'Ernährung',
  description: 'Rezepte als Karten oder Liste mit Suche und Filtern nach Mahlzeit, Zubereitungszeit und Tags. Jede Karte zeigt Zeit, Kalorien und Eiweiß je Portion; Antippen öffnet das Rezept.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Rezepte' },
    { name: 'style', label: 'Darstellung', type: 'select', options: ['grid', 'list'], default: 'grid' },
    { name: 'showFilters', label: 'Filter zeigen', type: 'boolean', default: true },
    { name: 'framed', label: 'In Karte', type: 'boolean', default: false },
  ],
  data: [
    { slot: 'recipes', label: 'Rezepte', default: 'recipes', shape: '{id,title,subtitle,meal,servings,prepMin,cookMin,tags[],fav?,tone,icon,ingredients[],perServing?}[]', required: true },
    { slot: 'foods', label: 'Lebensmittel', default: 'foods', shape: 'für Nährwerte', required: false },
  ],
  events: ['recipe.open', 'recipe.favorite', 'recipe.create'],
  states: ['empty'],
  css: `${NU_CSS}${LBL_CSS}
  .tk-rl { display:flex; flex-direction:column; gap:var(--tk-space-3); min-width:0; }
  .tk-rl__grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:var(--tk-space-4); }
  .tk-rl__card { position:relative; display:flex; flex-direction:column; text-align:left; border-radius:var(--tk-radius-lg); border:1px solid var(--tk-c-border); background:var(--tk-c-surface); color:inherit; font:inherit; cursor:pointer; overflow:hidden; padding:0; min-width:0; }
  .tk-rl__card:hover { border-color:var(--tk-c-border-strong); box-shadow:var(--tk-shadow-sm); }
  .tk-rl__cover { height:84px; display:grid; place-items:center; background:linear-gradient(135deg, color-mix(in srgb, var(--rc) 26%, var(--tk-c-surface)), color-mix(in srgb, var(--rc) 8%, var(--tk-c-surface))); color:var(--rc); }
  .tk-rl__body { padding:12px 14px 14px; display:flex; flex-direction:column; gap:6px; min-width:0; }
  .tk-rl__title { font-weight:var(--tk-fw-semibold); font-size:var(--tk-nfs-lg); line-height:1.25; } .tk-rl__sub { color:var(--tk-c-text-muted); font-size:var(--tk-nfs-sm); }
  .tk-rl__meta { display:flex; gap:12px; flex-wrap:wrap; font-size:var(--tk-nfs-sm); color:var(--tk-c-text-muted); font-variant-numeric:tabular-nums; } .tk-rl__meta span { display:inline-flex; gap:4px; align-items:center; } .tk-rl__meta strong { color:var(--tk-c-text); }
  .tk-rl__fav { position:absolute; top:6px; right:6px; } .tk-rl__fav[aria-pressed="true"] { color:var(--tk-c-warning); }
  .tk-rl__tags { display:flex; gap:6px; flex-wrap:wrap; }
  .tk-rl__row { display:flex; align-items:center; gap:12px; min-height:60px; padding:8px 0; border-bottom:1px solid var(--tk-c-border); width:100%; background:none; border-left:0; border-right:0; border-top:0; color:inherit; font:inherit; text-align:left; cursor:pointer; min-width:0; }
  .bp-mobile .tk-rl__grid { grid-template-columns:1fr; } .bp-mobile .tk-rl__cover { height:64px; }`,
  example: { data: { recipes: [
    { id: 'r1', title: 'Skyr-Bowl mit Blaubeeren', subtitle: 'Frühstück in fünf Minuten', meal: 'breakfast', servings: 1, prepMin: 5, cookMin: 0, tags: ['vegetarisch', 'proteinreich', 'schnell'], fav: true, tone: 1, icon: 'milk', ingredients: [], perServing: { kcal: 507, protein: 37.2 } },
    { id: 'r2', title: 'Lachs mit Ofengemüse', subtitle: 'Ein Blech, wenig Aufwand', meal: 'dinner', servings: 2, prepMin: 10, cookMin: 25, tags: ['proteinreich'], tone: 3, icon: 'fish', ingredients: [], perServing: { kcal: 636, protein: 38.9 } },
  ], foods: [] } },
  render: function RecipeList({ props, data, setData, ctx }) {
    const [meal, setMeal] = useState('Alle'), [time, setTime] = useState('all'), [tag, setTag] = useState(null);
    const recipes = arr(data.recipes), q = String(ctx.ui?.query || '').trim().toLowerCase();
    const wrap = (b) => (props.framed ? html`<${Card} title=${props.title} icon="chef-hat">${b}<//>` : b);
    if (!recipes.length) return wrap(html`<${EmptyState} icon="chef-hat" title="Noch keine Rezepte" text="Lege dein erstes Rezept an, dann erscheinen hier Karten mit Nährwerten." action=${html`<${Button} size="sm" variant="primary" icon="plus" onClick=${() => ctx.emit('recipe.create')}>Rezept anlegen<//>`} />`);
    const list = recipes.filter((r) => (!q || [r.title, r.subtitle, ...(r.tags || [])].some((x) => String(x || '').toLowerCase().includes(q))) && (meal === 'Alle' || r.meal === meal)
      && (time === 'all' || recipeTime(r) <= Number(time)) && (!tag || (r.tags || []).includes(tag)));
    const ps = (r) => r.perServing || recipePerServing(r, arr(data.foods));
    const open = (r) => { ctx.setUi('selectedId', r.id); ctx.emit('recipe.open', { id: r.id }); };
    const fav = (r, e) => { e.stopPropagation(); setData('recipes', (l) => arr(l).map((x) => (x.id === r.id ? { ...x, fav: !x.fav } : x))); ctx.emit('recipe.favorite', { id: r.id, fav: !r.fav }); };
    const meals = [{ id: 'Alle', label: 'Alle' }, ...['breakfast', 'lunch', 'dinner'].map((m) => ({ id: m, label: mealInfo(m).label }))];
    const filters = props.showFilters && html`<div class="tk-rl"><${Search} value=${ctx.ui?.query || ''} onInput=${(v) => ctx.setUi('query', v)} placeholder="Rezept oder Zutat suchen …" />
      <div class="tk-nu-chips" role="group" aria-label="Mahlzeit">${meals.map((m) => html`<${Chip} active=${meal === m.id} onClick=${() => setMeal(m.id)}>${m.label}<//>`)}${TIMES.slice(1).map((t) => html`<${Chip} icon="timer" active=${time === t.id} onClick=${() => setTime(time === t.id ? 'all' : t.id)}>${t.label}<//>`)}</div>
      <div class="tk-nu-chips" role="group" aria-label="Eigenschaften">${TAGS.map((t) => html`<${Chip} active=${tag === t} onClick=${() => setTag(tag === t ? null : t)}>${t}<//>`)}</div></div>`;
    const favBtn = (r) => html`<${Button} variant="ghost" size="sm" icon="star" class="tk-rl__fav" aria-pressed=${String(!!r.fav)} aria-label=${`${r.title} ${r.fav ? 'aus Favoriten entfernen' : 'als Favorit markieren'}`} onClick=${(e) => fav(r, e)} />`;
    let body;
    if (!list.length) body = html`<${EmptyState} icon="search" title="Keine passenden Rezepte" text="Lockere die Filter oder suche nach einer Zutat." />`;
    else if (props.style === 'list') body = html`<div>${list.map((r) => { const p = ps(r); return html`<button type="button" class="tk-rl__row" onClick=${() => open(r)}>${tintBox(r.tone, r.icon, 20)}<span class="tk-grow" style="min-width:0"><span class="tk-truncate" style="display:block;font-weight:500">${r.title}</span><span class="tk-nu-meta">${recipeTime(r)} Min. · E ${num(p.protein)} g</span></span><strong class="tk-num" style="flex:none">${num(p.kcal)} kcal</strong></button>`; })}</div>`;
    else body = html`<div class="tk-rl__grid">${list.map((r) => { const p = ps(r); return html`<div style="position:relative"><button type="button" class="tk-rl__card" style="width:100%;height:100%" onClick=${() => open(r)} aria-label=${`${r.title}, ${recipeTime(r)} Minuten, ${num(p.kcal)} Kilokalorien pro Portion`}>
      <div class="tk-rl__cover" style=${`--rc:${toneColor(r.tone)}`}><${Icon} name=${r.icon || 'utensils'} size=${34} /></div>
      <div class="tk-rl__body"><div class="tk-rl__title">${r.title}</div><div class="tk-rl__sub">${r.subtitle}</div>
        <div class="tk-rl__meta"><span><${Icon} name="timer" size=${14} /><strong>${recipeTime(r)}</strong> Min.</span><span><strong>${num(p.kcal)}</strong> kcal</span><span><strong>${num(p.protein)} g</strong> E</span></div>
        <div class="tk-rl__tags">${(r.tags || []).slice(0, 3).map((t) => html`<span class="tk-badge">${t}</span>`)}</div></div></button>${favBtn(r)}</div>`; })}</div>`;
    return wrap(html`<div class="tk-rl">${filters}${body}${labelNote()}</div>`);
  },
};
export default [recipeList];
