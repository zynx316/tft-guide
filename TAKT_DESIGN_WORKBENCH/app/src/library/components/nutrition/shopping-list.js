// Ernährung: Einkaufsliste – aus dem Plan abgeleitet, summiert, nach Gängen, mit Vorrat, Abhaken, Preisschätzung und Laden-Modus.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Icon, Check, Segmented, Progress, EmptyState, Badge, Input, Switch } from '../../ui.js';
import { num, todayIso, dayLabel, shiftDay } from './_calc.js';
import { buildShopping } from './_recipes.js';
import { NU_CSS, arr, obj } from './_ui.js';
import { money } from '../../helpers.js';

const AISLE_ICON = { 'Obst & Gemüse': 'carrot', Kühlregal: 'milk', Trockenwaren: 'wheat', Tiefkühl: 'snowflake', Getränke: 'cup-soda', Sonstiges: 'shopping-basket' };

export const shoppingList = {
  id: 'shopping-list',
  name: 'Einkaufsliste',
  category: 'Ernährung',
  description: 'Leitet die Liste aus dem Wochenplan ab (3 oder 7 Tage), summiert gleiche Zutaten, gleicht den Vorrat ab und sortiert nach Gängen. Große Abhak-Flächen (erledigt rutscht nach unten), Preisschätzung mit Lebensmittel-Budget, Laden-Modus und Export als Aufgabe.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Einkaufsliste' },
    { name: 'showPrice', label: 'Preisschätzung', type: 'boolean', default: true },
    { name: 'showExport', label: 'Als Aufgabe exportieren', type: 'boolean', default: true },
    { name: 'framed', label: 'In Karte', type: 'boolean', default: true },
  ],
  data: [
    { slot: 'plan', label: 'Wochenplan', default: 'plan', shape: 'Planpunkte', required: true },
    { slot: 'recipes', label: 'Rezepte', default: 'recipes', shape: 'Rezepte', required: true },
    { slot: 'foods', label: 'Lebensmittel', default: 'foods', shape: 'Lebensmittel', required: true },
    { slot: 'shopping', label: 'Einkauf', default: 'shopping', shape: '{rangeDays,checked,pantry,manual,recipeAdds,budgetMonth,spentMonth}', required: true },
    { slot: 'tasks', label: 'Aufgaben', default: 'tasks', shape: 'Aufgaben (Export)', required: false },
  ],
  events: ['shop.toggle', 'shop.pantry', 'shop.add', 'shop.range', 'shop.export', 'shop.store', 'shop.plan'],
  states: ['empty'],
  css: `${NU_CSS}
  .tk-sh { display:flex; flex-direction:column; gap:var(--tk-space-4); min-width:0; }
  .tk-sh__top { display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; }
  .tk-sh__stats { display:flex; gap:var(--tk-space-4); flex-wrap:wrap; font-size:var(--tk-nfs-sm); color:var(--tk-c-text-muted); font-variant-numeric:tabular-nums; } .tk-sh__stats strong { color:var(--tk-c-text); }
  .tk-sh__export { white-space:normal; height:auto; min-height:var(--tk-size-control); padding-block:8px; text-align:left; }
  .tk-sh__aisle { display:flex; align-items:center; gap:8px; padding:12px 0 4px; font-size:var(--tk-nfs-xs); text-transform:uppercase; letter-spacing:var(--tk-ls-wide); font-weight:var(--tk-fw-semibold); color:var(--tk-c-text-subtle); }
  .tk-sh__row { display:flex; align-items:center; gap:12px; min-height:52px; border-bottom:1px solid var(--tk-c-border); min-width:0; } .tk-sh__row[data-done="true"] { opacity:.55; } .tk-sh__row[data-done="true"] .tk-sh__name { text-decoration:line-through; }
  .tk-sh__row .tk-check { min-width:44px; min-height:44px; justify-content:center; }
  .tk-sh__name { font-weight:var(--tk-fw-medium); } .tk-sh__from { font-size:var(--tk-nfs-xs); color:var(--tk-c-text-subtle); }
  .tk-sh__amt { font-variant-numeric:tabular-nums; white-space:nowrap; color:var(--tk-c-text-muted); }
  .tk-sh--store .tk-sh__row { min-height:68px; } .tk-sh--store .tk-sh__name { font-size:var(--tk-nfs-xl); } .tk-sh--store .tk-sh__amt { font-size:var(--tk-nfs-lg); color:var(--tk-c-text); }
  .tk-sh__add { display:flex; gap:8px; } .tk-sh__add .tk-input { flex:1; }
  .tk-sh__budget { display:flex; flex-direction:column; gap:6px; padding:10px 12px; border-radius:var(--tk-radius-md); background:var(--tk-c-surface2); border:1px solid var(--tk-c-border); font-size:var(--tk-nfs-sm); }
  .tk-sh__pantry { margin-top:8px; padding-top:8px; border-top:1px dashed var(--tk-c-border); }
  [data-tk-large-text] .tk-sh__row { flex-wrap:wrap; align-items:flex-start; row-gap:2px; padding-block:6px; } [data-tk-large-text] .tk-sh__row > .tk-grow { flex:1 1 12ch; } [data-tk-large-text] .tk-sh__amt { white-space:normal; }`,
  example: { data: {
    plan: [{ id: 'p1', date: '2026-11-24', meal: 'dinner', recipeId: 'r1', servings: 2, status: 'planned' }],
    recipes: [{ id: 'r1', title: 'Lachs mit Ofengemüse', servings: 2, ingredients: [{ foodId: 'f1', g: 300 }, { foodId: 'f2', g: 300 }] }],
    foods: [{ id: 'f1', name: 'Lachsfilet', category: 'Fleisch & Fisch', unit: 'g', eur100: 2.2 }, { id: 'f2', name: 'Brokkoli', category: 'Obst & Gemüse', unit: 'g', eur100: 0.25 }],
    shopping: { rangeDays: 3, checked: {}, pantry: [], manual: [], recipeAdds: [], budgetMonth: 450, spentMonth: 263 }, tasks: [],
  } },
  render: function ShoppingList({ props, data, setData, ctx }) {
    const eur = (n, d = 0) => money(ctx, n, { digits: d });
    const [store, setStore] = useState(false), [draft, setDraft] = useState(''), [showPantry, setShowPantry] = useState(false);
    const today = todayIso(ctx), sh = obj(data.shopping);
    const list = buildShopping({ plan: arr(data.plan), recipes: arr(data.recipes), foods: arr(data.foods), shopping: sh, today });
    const upd = (fn) => setData('shopping', (s) => fn(obj(s)));
    const wrap = (b) => (props.framed ? html`<${Card} title=${props.title} icon="shopping-cart">${b}<//>` : b);
    const highlight = arr(data.recipes).find((r) => r.id === ctx.ui?.selectedId)?.title;
    if (!list.total && !list.pantryItems.length) return wrap(html`<${EmptyState} icon="shopping-cart" title="Die Liste ist leer" text="Plane Mahlzeiten im Wochenplan, dann entsteht die Einkaufsliste automatisch." action=${html`<${Button} size="sm" variant="primary" icon="calendar-days" onClick=${() => ctx.emit('shop.plan')}>Plan erstellen<//>`} />`);
    const toggle = (i) => { upd((s) => ({ ...s, checked: { ...obj(s.checked), [i.key]: !i.checked } })); ctx.emit('shop.toggle', { key: i.key, checked: !i.checked }); };
    const pantry = (i, on) => { upd((s) => ({ ...s, pantry: on ? [...new Set([...arr(s.pantry), i.foodId])] : arr(s.pantry).filter((x) => x !== i.foodId) })); ctx.emit('shop.pantry', { id: i.foodId, on }); };
    const add = () => { const name = draft.trim(); if (!name) return; upd((s) => ({ ...s, manual: [...arr(s.manual), { id: ctx.newId('m'), name, aisle: 'Sonstiges', qty: '' }] })); setDraft(''); ctx.emit('shop.add', { name }); };
    const setRange = (r) => { upd((s) => ({ ...s, rangeDays: Number(r) })); ctx.emit('shop.range', { days: Number(r) }); };
    const exportTask = () => { const due = shiftDay(today, 4); setData('tasks', (t) => [{ id: ctx.newId('t-shop'), title: 'Einkaufen', due, priority: 'mittel', project: 'Privat', category: 'Privat', status: 'Offen', estimate: 45, subtasks: list.groups.flatMap((g) => g.items.filter((i) => !i.checked).slice(0, 8).map((i, n) => ({ id: `s${n}`, title: `${i.name} ${i.amount}`.trim(), done: false }))) }, ...arr(t)]); ctx.emit('shop.export', { due }); ctx.toast(`Aufgabe „Einkaufen“ für ${dayLabel(due)} angelegt`); };
    const left = (sh.budgetMonth || 0) - (sh.spentMonth || 0) - list.priceOpen;
    const Row = ({ i }) => html`<div class="tk-sh__row" data-done=${String(i.checked)}><${Check} checked=${i.checked} onChange=${() => toggle(i)} label=${`${i.name} abhaken`} />
      <div class="tk-grow" style="min-width:0"><div class="tk-sh__name tk-truncate">${i.name}${highlight && i.from?.includes(highlight) && html` <${Badge} tone="accent">neu<//>`}</div>${i.from?.length > 0 && !store && html`<div class="tk-sh__from tk-truncate">${i.from.join(', ')}</div>`}</div>
      <span class="tk-sh__amt">${i.amount}</span>${!store && !i.manual && html`<${Button} variant="ghost" size="sm" icon="house" aria-label=${`${i.name}: ist zuhause vorhanden`} title="Zuhause vorhanden" onClick=${() => pantry(i, true)} />`}</div>`;
    return wrap(html`<div class=${`tk-sh ${store ? 'tk-sh--store' : ''}`}>
      ${highlight && html`<div class="tk-sh__budget" role="status"><span>Zutaten für <strong>${highlight}</strong> sind auf der Liste.</span></div>`}
      <div class="tk-sh__top"><${Segmented} value=${String(list.range)} onChange=${setRange} label="Zeitraum" options=${[{ value: '3', label: '3 Tage' }, { value: '7', label: '7 Tage' }]} />
        <label class="tk-row" style="gap:8px;font-size:var(--tk-nfs-sm);color:var(--tk-c-text-muted)">Laden-Modus<span class="tk-nu-sw"><${Switch} checked=${store} onChange=${(v) => { setStore(v); ctx.emit('shop.store', { on: v }); }} label="Laden-Modus" /></span></label></div>
      <div><div class="tk-sh__stats"><span><strong>${list.done}</strong> von ${list.total} erledigt</span><span>bis ${dayLabel(list.from)}</span>${props.showPrice && html`<span>ca. <strong>${eur(list.priceOpen)}</strong> offen</span>`}</div><div style="margin-top:8px"><${Progress} value=${list.total ? list.done / list.total : 0} /></div></div>
      ${props.showPrice && sh.budgetMonth > 0 && html`<div class="tk-sh__budget"><span>Lebensmittel-Budget November: ${eur(sh.spentMonth, 0)} von ${eur(sh.budgetMonth)} ausgegeben</span><span class="tk-nu-meta">Nach diesem Einkauf bleiben etwa ${eur(Math.max(0, left))}.</span></div>`}
      <div class="tk-sh__add"><${Input} value=${draft} onInput=${setDraft} placeholder="Etwas hinzufügen …" aria-label="Eintrag hinzufügen" onKeyDown=${(e) => e.key === 'Enter' && add()} /><${Button} icon="plus" aria-label="Hinzufügen" onClick=${add} /></div>
      <div>${list.groups.map((g) => html`<div class="tk-sh__aisle"><${Icon} name=${AISLE_ICON[g.aisle] || 'shopping-basket'} size=${14} />${g.aisle}<span>· ${g.items.length}</span></div>${g.items.map((i) => html`<${Row} i=${i} />`)}`)}</div>
      ${list.pantryItems.length > 0 && html`<div class="tk-sh__pantry"><${Button} variant="ghost" size="sm" iconRight=${showPantry ? 'chevron-up' : 'chevron-down'} onClick=${() => setShowPantry(!showPantry)} aria-expanded=${String(showPantry)}>Vorrat zuhause (${list.pantryItems.length})<//>
        ${showPantry && list.pantryItems.map((i) => html`<div class="tk-sh__row"><span class="tk-grow tk-sh__name">${i.name}</span><span class="tk-sh__amt">${i.amount}</span><${Button} size="sm" onClick=${() => pantry(i, false)}>Doch kaufen<//></div>`)}</div>`}
      ${props.showExport && html`<${Button} icon="list-todo" class="tk-sh__export" onClick=${exportTask}>Als Aufgabe „Einkaufen“ anlegen<//>`}</div>`);
  },
};
export default [shoppingList];
