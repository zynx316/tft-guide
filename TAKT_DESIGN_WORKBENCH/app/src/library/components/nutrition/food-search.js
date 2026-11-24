// Ernährung: Lebensmittelsuche zum Erfassen – Suche, Zuletzt, Favoriten, Vorlagen; „+“ = Standardportion in einem Tap.
import { html } from '../../../lib/html.js';
import { Card, Button, Icon, Tabs, Search, EmptyState, Badge } from '../../ui.js';
import { per, num, viewDay, hhmm, entryFromFood, eid, mealInfo } from './_calc.js';
import { PortionForm, openPortion, logFood, logEntry, MealChips, useLogMeal, PF_CSS } from './_portion.js';
import { NU_CSS, LBL_CSS, arr, tintBox, catIcon, catTone, labelNote } from './_ui.js';

/** Zuletzt gegessene Lebensmittel (eindeutig, neueste zuerst) mit der zuletzt genutzten Menge. */
export function recentFoods(diary, foods, limit = 12) {
  const fm = new Map(arr(foods).map((f) => [f.id, f])), seen = new Set(), out = [];
  for (const e of [...arr(diary)].filter((x) => x.foodId && fm.has(x.foodId)).sort((a, b) => (`${a.date}${a.time || ''}` < `${b.date}${b.time || ''}` ? 1 : -1))) {
    if (seen.has(e.foodId)) continue; seen.add(e.foodId); out.push({ food: fm.get(e.foodId), grams: e.grams || fm.get(e.foodId).portions?.[0]?.g || 100 }); if (out.length >= limit) break;
  }
  return out;
}
const match = (f, q) => [f.name, f.brand, f.category, f.barcode, ...(f.tags || [])].some((x) => String(x || '').toLowerCase().includes(q));

export const foodSearch = {
  id: 'food-search',
  name: 'Lebensmittelsuche',
  category: 'Ernährung',
  description: 'Erfassen in höchstens drei Taps: Suchfeld mit Sofortergebnissen, Reiter Zuletzt, Favoriten, Vorlagen und Alle. Das „+“ trägt die zuletzt genutzte Portion ein, ein Tap auf die Zeile öffnet den Portions-Picker. Auch als Kachelraster.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Lebensmittel' },
    { name: 'style', label: 'Darstellung', type: 'select', options: ['list', 'tiles'], default: 'list' },
    { name: 'tabs', label: 'Reiter', type: 'list', default: ['Zuletzt', 'Favoriten', 'Vorlagen', 'Alle'] },
    { name: 'showMeal', label: 'Mahlzeit-Auswahl', type: 'boolean', default: true },
    { name: 'limit', label: 'Max. Treffer', type: 'number', default: 12 },
    { name: 'framed', label: 'In Karte', type: 'boolean', default: true },
  ],
  data: [
    { slot: 'foods', label: 'Lebensmittel', default: 'foods', shape: '{id,name,brand?,category,kcal,protein,carbs,fat,portions[],fav?}[]', required: true },
    { slot: 'diary', label: 'Tagebuch', default: 'diary', shape: 'Einträge (für „Zuletzt“)', required: true },
    { slot: 'templates', label: 'Vorlagen', default: 'templates', shape: '{id,name,meal,kcal,items:[{foodId,g}]}[]', required: false },
  ],
  events: ['food.search', 'food.pick', 'food.favorite', 'portion.confirm', 'template.log', 'food.create', 'quick.open'],
  states: ['empty'],
  css: `${NU_CSS}${PF_CSS}${LBL_CSS}
  .tk-nfs { display:flex; flex-direction:column; gap:var(--tk-space-3); min-width:0; }
  .tk-nfs__row { display:flex; align-items:center; gap:10px; min-height:56px; padding:6px 0; border-bottom:1px solid var(--tk-c-border); min-width:0; } .tk-nfs__row:last-child { border-bottom:0; }
  .tk-nfs__main { flex:1; min-width:0; display:flex; align-items:center; gap:12px; border:0; background:transparent; color:inherit; font:inherit; text-align:left; cursor:pointer; padding:0; min-height:44px; }
  .tk-nfs__name { font-weight:var(--tk-fw-medium); } .tk-nfs__sub { font-size:var(--tk-nfs-sm); color:var(--tk-c-text-subtle); }
  .tk-nfs__fav[aria-pressed="true"] { color:var(--tk-c-warning); }
  .tk-nfs__tiles { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:var(--tk-space-3); }
  .tk-nfs__tile { position:relative; display:flex; flex-direction:column; gap:8px; align-items:flex-start; text-align:left; padding:12px; min-height:112px; border-radius:var(--tk-radius-lg); border:1px solid var(--tk-c-border); background:var(--tk-c-surface); color:inherit; font:inherit; cursor:pointer; }
  .tk-nfs__tile:hover { border-color:var(--tk-c-border-strong); background:var(--tk-c-surface2); } .tk-nfs__tile .tk-nfs__name { line-height:1.25; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
  .tk-nfs__tile .tk-nfs__plus { position:absolute; top:8px; right:8px; width:32px; height:32px; border-radius:10px; background:var(--tk-c-accent); color:var(--tk-c-text-on-accent); display:grid; place-items:center; }
  .tk-nfs__tile .tk-nfs__more { margin-top:auto; font-size:var(--tk-nfs-xs); }
  .bp-mobile .tk-nfs__tiles { grid-template-columns:repeat(2,minmax(0,1fr)); }`,
  example: { data: {
    foods: [
      { id: 'f-skyr', name: 'Skyr natur', brand: 'Arla', category: 'Milch & Eier', kcal: 63, protein: 11, carbs: 4, fat: 0.2, fav: true, unit: 'g', portions: [{ label: 'Becher (150 g)', g: 150 }, { label: 'Schüssel (250 g)', g: 250 }] },
      { id: 'f-banane', name: 'Banane', category: 'Obst & Gemüse', kcal: 93, protein: 1.1, carbs: 20.5, fat: 0.2, unit: 'g', portions: [{ label: 'mittel (120 g)', g: 120 }] },
      { id: 'f-mandeln', name: 'Mandeln', category: 'Nüsse & Öle', kcal: 576, protein: 21, carbs: 5, fat: 51, unit: 'g', portions: [{ label: 'Handvoll (25 g)', g: 25 }] },
    ],
    diary: [{ id: 'e1', date: '2026-11-23', time: '10:00', meal: 'snack', foodId: 'f-banane', grams: 120, name: 'Banane', kcal: 112 }],
    templates: [{ id: 't1', name: 'Shake nach dem Training', meal: 'snack', kcal: 359, items: [{ foodId: 'f-skyr', g: 150 }] }],
  } },
  render: function FoodSearch({ props, data, setData, ctx }) {
    const tabNames = (Array.isArray(props.tabs) ? props.tabs : String(props.tabs).split(',')).map((t) => t.trim()).filter(Boolean);
    const [tab, setTab] = ctx.ui?.foodTab ? [ctx.ui.foodTab, (t) => ctx.setUi('foodTab', t)] : [tabNames[0], (t) => ctx.setUi('foodTab', t)];
    const [meal, setMeal] = useLogMeal(ctx);
    const foods = arr(data.foods), q = String(ctx.ui?.query || '').trim().toLowerCase();
    const wrap = (b) => (props.framed ? html`<${Card} title=${props.title} icon="search">${b}<//>` : b);
    if (!foods.length) return wrap(html`<${EmptyState} icon="apple" title="Keine Lebensmittel" text="Lege ein eigenes Lebensmittel an oder nutze Schnell-Kalorien." action=${html`<${Button} size="sm" onClick=${() => ctx.emit('quick.open')}>Schnell-Kalorien<//>`} />`);
    const active = tabNames.includes(tab) ? tab : tabNames[0];
    let rows;
    if (q) rows = foods.filter((f) => match(f, q)).map((food) => ({ food, grams: food.lastG || food.portions?.[0]?.g || 100 }));
    else if (active === 'Zuletzt') rows = recentFoods(data.diary, foods, props.limit);
    else if (active === 'Favoriten') rows = foods.filter((f) => f.fav).map((food) => ({ food, grams: food.portions?.[Math.min(1, food.portions.length - 1)]?.g || 100 }));
    else rows = [...foods].sort((a, b) => a.name.localeCompare(b.name, 'de')).map((food) => ({ food, grams: food.portions?.[0]?.g || 100 }));
    rows = rows.slice(0, active === 'Alle' || q ? 40 : props.limit);
    const tpls = !q && active === 'Vorlagen' ? arr(data.templates) : null;
    const quickAdd = (food, grams) => logFood(ctx, setData, food, grams, meal);
    const toggleFav = (f) => { setData('foods', (list) => arr(list).map((x) => (x.id === f.id ? { ...x, fav: !x.fav } : x))); ctx.emit('food.favorite', { id: f.id, fav: !f.fav }); };
    const logTemplate = (t) => { const fm = new Map(foods.map((f) => [f.id, f])); for (const it of t.items) { const f = fm.get(it.foodId); if (f) logEntry(ctx, setData, entryFromFood(f, it.g, { meal: t.meal || meal, date: viewDay(ctx), time: hhmm(ctx.today), source: 'template' }), { silent: true }); } ctx.emit('template.log', { id: t.id }); ctx.toast(`${t.name} · ${num(t.kcal)} kcal erfasst`); };
    const onSearch = (v) => { ctx.setUi('query', v); ctx.emit('food.search', { q: v }); };

    const head = html`<${Search} value=${ctx.ui?.query || ''} onInput=${onSearch} placeholder="Lebensmittel oder Marke suchen …" />
      ${!q && html`<${Tabs} value=${active} onChange=${setTab} options=${tabNames.map((t) => ({ value: t, label: t }))} />`}
      ${props.showMeal && html`<div class="tk-row" style="gap:8px;flex-wrap:wrap"><span class="tk-nu-meta">Zu</span><${MealChips} value=${meal} onChange=${setMeal} /></div>`}`;
    let list;
    if (tpls) list = tpls.length ? html`<div>${tpls.map((t) => html`<div class="tk-nfs__row"><button type="button" class="tk-nfs__main" onClick=${() => logTemplate(t)}>${tintBox('accent2', 'layers', 18)}<span class="tk-grow" style="min-width:0"><span class="tk-nfs__name tk-truncate" style="display:block">${t.name}</span><span class="tk-nfs__sub">${t.items.length} Zutaten · ${mealInfo(t.meal).label}</span></span><strong class="tk-num">${num(t.kcal)} kcal</strong></button><${Button} variant="primary" size="sm" icon="plus" aria-label=${`${t.name} erfassen`} onClick=${() => logTemplate(t)} /></div>`)}</div>` : html`<${EmptyState} icon="layers" title="Noch keine Vorlagen" text="Speichere häufige Mahlzeiten als Vorlage, um sie mit einem Tap zu erfassen." />`;
    else if (!rows.length) list = html`<${EmptyState} icon="search" title=${q ? 'Keine Treffer' : active === 'Favoriten' ? 'Noch keine Favoriten' : 'Noch nichts erfasst'} text=${q ? `Zu „${ctx.ui.query}“ gibt es kein Lebensmittel. Lege es an oder schätze die Kalorien.` : 'Tippe auf den Stern, um Lebensmittel hier anzupinnen.'} action=${q && html`<div class="tk-nu-btnrow" style="justify-content:center"><${Button} size="sm" icon="plus" onClick=${() => ctx.emit('food.create', { name: ctx.ui.query })}>Eigenes Lebensmittel<//><${Button} size="sm" icon="zap" onClick=${() => ctx.emit('quick.open')}>Schnell-Kalorien<//></div>`} />`;
    else if (props.style === 'tiles') list = html`<div class="tk-nfs__tiles">${rows.map(({ food, grams }) => { const n = per(food, grams); return html`<div style="position:relative"><button type="button" class="tk-nfs__tile" style="width:100%" onClick=${() => quickAdd(food, grams)} aria-label=${`${food.name}, ${num(grams)} ${food.unit === 'ml' ? 'ml' : 'g'}, ${num(n.kcal)} Kilokalorien, erfassen`}>
        ${tintBox(catTone(food.category), catIcon(food.category), 18)}<span class="tk-nfs__name">${food.name}</span><span class="tk-nfs__sub tk-num">${num(grams)} ${food.unit === 'ml' ? 'ml' : 'g'} · ${num(n.kcal)} kcal</span><span class="tk-nfs__plus" aria-hidden="true"><${Icon} name="plus" size=${18} /></span></button>
        <${Button} variant="ghost" size="sm" icon="sliders-horizontal" style="position:absolute;right:6px;bottom:6px" aria-label=${`${food.name}: Portion wählen`} onClick=${() => openPortion(ctx, setData, food, { meal, grams })} /></div>`; })}</div>`;
    else list = html`<div>${rows.map(({ food, grams }) => { const n = per(food, grams); return html`<div class="tk-nfs__row">
      <button type="button" class="tk-nfs__main" onClick=${() => openPortion(ctx, setData, food, { meal, grams })} aria-label=${`${food.name}, Portion wählen`}>${tintBox(catTone(food.category), catIcon(food.category), 18)}
        <span class="tk-grow" style="min-width:0"><span class="tk-nfs__name tk-truncate" style="display:block">${food.name}</span><span class="tk-nfs__sub tk-truncate" style="display:block">${food.brand ? `${food.brand} · ` : ''}${num(grams)} ${food.unit === 'ml' ? 'ml' : 'g'} · ${num(n.kcal)} kcal · E ${num(n.protein)} g</span></span></button>
      <${Button} variant="ghost" size="sm" icon="star" class="tk-nfs__fav" aria-pressed=${String(!!food.fav)} aria-label=${`${food.name} ${food.fav ? 'aus Favoriten entfernen' : 'als Favorit markieren'}`} onClick=${() => toggleFav(food)} />
      <${Button} variant="primary" size="sm" icon="plus" aria-label=${`${food.name} ${num(grams)} ${food.unit === 'ml' ? 'ml' : 'g'} hinzufügen`} onClick=${() => quickAdd(food, grams)} /></div>`; })}</div>`;
    return wrap(html`<div class="tk-nfs">${head}${list}${labelNote()}</div>`);
  },
};
export default [foodSearch];
