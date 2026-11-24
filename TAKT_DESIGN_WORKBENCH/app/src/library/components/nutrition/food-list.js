// Ernährung: Lebensmittel-Datenbank als Tabelle (Desktop) bzw. Liste (Mobile) mit Suche, Filtern und Sortierung.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Search, Chip, Select, EmptyState, Button, Badge, Icon } from '../../ui.js';
import { num } from './_calc.js';
import { NU_CSS, arr, tintBox, catIcon, catTone } from './_ui.js';

const SORTS = [{ value: 'name', label: 'Name' }, { value: 'kcal', label: 'Kalorien' }, { value: 'protein', label: 'Eiweiß' }, { value: 'fiber', label: 'Ballaststoffe' }];
const cmp = { name: (a, b) => a.name.localeCompare(b.name, 'de'), kcal: (a, b) => b.kcal - a.kcal, protein: (a, b) => b.protein - a.protein, fiber: (a, b) => (b.fiber || 0) - (a.fiber || 0) };

export const foodList = {
  id: 'food-list',
  name: 'Lebensmittel-Liste',
  category: 'Ernährung',
  description: 'Lebensmittel-Datenbank mit Suche, Filtern (Favoriten, Eigene, Marken, Kategorie) und Sortierung. Auf dem Desktop eine Tabelle mit Nährwerten je 100 g, auf dem Handy eine Liste. Auswahl füllt ctx.ui.selectedId für Detail-Blöcke.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Lebensmittel' },
    { name: 'style', label: 'Darstellung', type: 'select', options: ['auto', 'table', 'list'], default: 'auto' },
    { name: 'showSearch', label: 'Suchfeld', type: 'boolean', default: true },
    { name: 'dense', label: 'Kompakt', type: 'boolean', default: false },
    { name: 'pageSize', label: 'Einträge pro Seite', type: 'number', default: 24 },
    { name: 'framed', label: 'In Karte', type: 'boolean', default: true },
  ],
  data: [{ slot: 'foods', label: 'Lebensmittel', default: 'foods', shape: '{id,name,brand?,category,kcal,protein,carbs,fat,fiber,fav?,custom?}[]', required: true }],
  events: ['food.open', 'food.favorite', 'food.create', 'food.sort'],
  states: ['empty'],
  css: `${NU_CSS}
  .tk-fl { display:flex; flex-direction:column; gap:var(--tk-space-3); min-width:0; }
  .tk-fl__bar { display:flex; gap:8px; flex-wrap:wrap; align-items:center; } .tk-fl__bar .tk-search { flex:1 1 220px; }
  .tk-fl__tbl { width:100%; border-collapse:collapse; font-size:var(--tk-nfs-md); font-variant-numeric:tabular-nums; }
  .tk-fl__tbl th { text-align:right; font-size:var(--tk-nfs-xs); text-transform:uppercase; letter-spacing:var(--tk-ls-wide); color:var(--tk-c-text-subtle); font-weight:var(--tk-fw-semibold); padding:8px 10px; border-bottom:1px solid var(--tk-c-border); white-space:nowrap; } .tk-fl__tbl th:first-child { text-align:left; }
  .tk-fl__tbl td { padding:9px 10px; border-bottom:1px solid var(--tk-c-border); text-align:right; } .tk-fl__tbl td:first-child { text-align:left; }
  .tk-fl--dense .tk-fl__tbl td { padding:5px 10px; }
  .tk-fl__tbl tbody tr { cursor:pointer; } .tk-fl__tbl tbody tr:hover, .tk-fl__tbl tbody tr[aria-selected="true"] { background:var(--tk-c-surface2); } .tk-fl__tbl tbody tr[aria-selected="true"] td:first-child { box-shadow:inset 3px 0 var(--tk-c-accent); }
  .tk-fl__name { display:flex; align-items:center; gap:10px; min-width:0; background:none; border:0; color:inherit; font:inherit; padding:0; text-align:left; cursor:pointer; min-height:32px; }
  .tk-fl__row { display:flex; align-items:center; gap:12px; min-height:56px; padding:6px 0; border-bottom:1px solid var(--tk-c-border); width:100%; background:none; border-left:0; border-right:0; border-top:0; color:inherit; font:inherit; text-align:left; cursor:pointer; min-width:0; }
  .tk-fl__row[aria-selected="true"] { background:var(--tk-c-surface2); }
  .tk-fl__fav { color:var(--tk-c-warning); flex:none; }`,
  example: { data: { foods: [
    { id: 'a', name: 'Skyr natur', brand: 'Arla', category: 'Milch & Eier', kcal: 63, protein: 11, carbs: 4, fat: 0.2, fiber: 0, fav: true },
    { id: 'b', name: 'Haferflocken zart', brand: 'Kölln', category: 'Getreide & Brot', kcal: 372, protein: 13.5, carbs: 58.7, fat: 7, fiber: 10 },
    { id: 'c', name: 'Meine Granola-Mischung', category: 'Getreide & Brot', kcal: 410, protein: 11, carbs: 55, fat: 15, fiber: 8, custom: true },
  ] } },
  render: function FoodList({ props, data, setData, ctx }) {
    const [sort, setSort] = useState('name'), [cat, setCat] = useState('Alle'), [more, setMore] = useState(0);
    const foods = arr(data.foods), q = String(ctx.ui?.query || '').trim().toLowerCase();
    const filter = ctx.ui?.foodFilter || 'Alle';
    const cats = ['Alle', ...new Set(foods.map((f) => f.category))];
    const wrap = (b) => (props.framed ? html`<${Card} title=${props.title} icon="apple" actions=${html`<${Button} size="sm" icon="plus" onClick=${() => ctx.emit('food.create')}>Eigenes<//>`}>${b}<//>` : b);
    if (!foods.length) return wrap(html`<${EmptyState} icon="apple" title="Noch keine Lebensmittel" text="Lege dein erstes eigenes Lebensmittel an." action=${html`<${Button} size="sm" variant="primary" onClick=${() => ctx.emit('food.create')}>Eigenes Lebensmittel<//>`} />`);
    let rows = foods.filter((f) => (!q || [f.name, f.brand, f.category].some((x) => String(x || '').toLowerCase().includes(q)))
      && (filter === 'Alle' || (filter === 'Favoriten' && f.fav) || (filter === 'Eigene' && f.custom) || (filter === 'Marken' && f.brand))
      && (cat === 'Alle' || f.category === cat)).sort(cmp[sort]);
    const total = rows.length, lim = (props.pageSize || 24) * (1 + more);
    rows = rows.slice(0, lim);
    const sel = ctx.ui?.selectedId;
    const open = (f) => { ctx.setUi('selectedId', f.id); ctx.emit('food.open', { id: f.id }); };
    const table = props.style === 'table' || (props.style === 'auto' && ctx.bp !== 'mobile');
    const fav = (f) => { setData('foods', (l) => arr(l).map((x) => (x.id === f.id ? { ...x, fav: !x.fav } : x))); ctx.emit('food.favorite', { id: f.id, fav: !f.fav }); };
    const bar = html`<div class="tk-fl__bar">${props.showSearch && html`<${Search} value=${ctx.ui?.query || ''} onInput=${(v) => ctx.setUi('query', v)} placeholder="Lebensmittel, Marke oder Kategorie …" />`}
      <${Select} value=${sort} onChange=${(v) => { setSort(v); ctx.emit('food.sort', { by: v }); }} options=${SORTS.map((s) => ({ value: s.value, label: `Sortiert nach ${s.label}` }))} aria-label="Sortierung" style="width:auto" /></div>
      <div class="tk-nu-chips" role="group" aria-label="Filter">${['Alle', 'Favoriten', 'Eigene', 'Marken'].map((f) => html`<${Chip} active=${filter === f} onClick=${() => ctx.setUi('foodFilter', f)}>${f}<//>`)}</div>
      <div class="tk-nu-chips" role="group" aria-label="Kategorie" style="overflow-x:auto;flex-wrap:nowrap" data-scroll-x>${cats.map((c) => html`<${Chip} active=${cat === c} onClick=${() => setCat(c)}>${c}<//>`)}</div>`;
    let list;
    if (!rows.length) list = html`<${EmptyState} icon="search" title="Keine Treffer" text="Passe Suche oder Filter an oder lege das Lebensmittel selbst an." action=${html`<${Button} size="sm" icon="plus" onClick=${() => ctx.emit('food.create', { name: ctx.ui?.query })}>Eigenes Lebensmittel<//>`} />`;
    else if (table) list = html`<div style="overflow-x:auto" data-scroll-x><table class="tk-fl__tbl"><thead><tr><th>Lebensmittel (je 100 g)</th><th>kcal</th><th>Eiweiß</th><th>KH</th><th>Fett</th><th>Ballast.</th><th aria-label="Favorit"></th></tr></thead>
      <tbody>${rows.map((f) => html`<tr aria-selected=${String(sel === f.id)} onClick=${() => open(f)}><td><button type="button" class="tk-fl__name" onClick=${(e) => { e.stopPropagation(); open(f); }}>${tintBox(catTone(f.category), catIcon(f.category), 16)}<span style="min-width:0"><strong class="tk-truncate" style="display:block;font-weight:500">${f.name}</strong><span class="tk-nu-meta">${[f.brand, f.category].filter(Boolean).join(' · ')}</span></span>${f.custom && html`<${Badge} tone="accent">Eigenes<//>`}</button></td>
        <td><strong>${num(f.kcal)}</strong></td><td>${num(f.protein, 1)}</td><td>${num(f.carbs, 1)}</td><td>${num(f.fat, 1)}</td><td>${num(f.fiber || 0, 1)}</td>
        <td><${Button} variant="ghost" size="sm" icon="star" class=${f.fav ? 'tk-fl__fav' : ''} aria-label=${`${f.name} ${f.fav ? 'aus Favoriten entfernen' : 'als Favorit markieren'}`} onClick=${(e) => { e.stopPropagation(); fav(f); }} /></td></tr>`)}</tbody></table></div>`;
    else list = html`<div>${rows.map((f) => html`<button type="button" class="tk-fl__row" aria-selected=${String(sel === f.id)} onClick=${() => open(f)}>${tintBox(catTone(f.category), catIcon(f.category), 18)}
      <span class="tk-grow" style="min-width:0"><span class="tk-truncate" style="display:block;font-weight:500">${f.name}</span><span class="tk-nu-meta tk-truncate" style="display:block">${f.brand ? `${f.brand} · ` : ''}E ${num(f.protein, 1)} · KH ${num(f.carbs, 1)} · F ${num(f.fat, 1)}</span></span>
      ${f.fav && html`<span class="tk-fl__fav"><${Icon} name="star" size=${16} /></span>`}<span style="text-align:right;flex:none"><strong class="tk-num">${num(f.kcal)}</strong><span class="tk-nu-meta" style="display:block">kcal/100 g</span></span></button>`)}</div>`;
    const rest = total - rows.length;
    return wrap(html`<div class=${`tk-fl ${props.dense ? 'tk-fl--dense' : ''}`}>${bar}${list}${rest > 0 && html`<${Button} variant="ghost" icon="chevron-down" onClick=${() => setMore(more + 1)}>${rest} weitere anzeigen<//>`}</div>`);
  },
};
export default [foodList];
