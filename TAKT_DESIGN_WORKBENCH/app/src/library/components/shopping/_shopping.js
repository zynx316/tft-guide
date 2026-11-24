// Einkauf & Haushalt – gemeinsame UI-Hilfen: Datenslots, Hook für die Listen der Welt, Rückgängig-Leiste, Beispieldaten, CSS (Präfix tk-shp-).
import { html } from '../../../lib/html.js';
import { useState, useEffect, useRef } from 'preact/hooks';
import { Button, Icon, toneColor } from '../../ui.js';
import { listsView, arr, obj, dayKey } from './_logic.js';

const SLOT = {
  lists: ['Listen', 'shoppingLists', '{id,name,kind,storeId?,items?}[]'],
  shopping: ['Lebensmittel-Einkauf (Ernährung)', 'shopping', '{rangeDays,checked,pantry,manual,recipeAdds,budgetMonth,spentMonth}'],
  plan: ['Wochenplan (Ernährung)', 'plan', 'Planpunkte'], recipes: ['Rezepte (Ernährung)', 'recipes', 'Rezepte'], foods: ['Lebensmittel (Ernährung)', 'foods', 'Lebensmittel'],
  stores: ['Läden und Gänge', 'stores', '{id,name,short,aisles[]}[]'], pantry: ['Vorräte', 'pantry', '{id,name,level,foodId?}[]'],
  household: ['Haushalt und Wartung', 'household', '{id,name,rule,lastDone}[]'], trips: ['Einkäufe', 'trips', '{id,status,date,storeId}[]'],
  budgets: ['Budgets (Finanzen)', 'budgets', '{category,target}[]'], transactions: ['Buchungen (Finanzen)', 'transactions', '{id,type,category,amount,date}[]'],
  tasks: ['Aufgaben', 'tasks', 'Aufgaben'], templates: ['Vorschläge Wartung', 'templates', '{id,name,rule}[]'],
};
/** Datenslots der Komponenten (Schlüssel = Name im demoData des Features). */
export const slots = (...names) => names.map((n) => ({ slot: n, label: SLOT[n][0], default: n, shape: SLOT[n][2], required: ['lists'].includes(n) }));

/** Listen der Welt mit Artikeln und Zählern; `sel` = gewählte Liste (ctx.ui.selectedId oder erste). */
export function useShop(data, ctx) {
  const today = dayKey(ctx.today);
  const views = listsView(data, today);
  const sel = views.find((l) => l.id === ctx.ui?.selectedId) || views[0] || null;
  const stores = arr(data.stores);
  return { today, views, sel, stores, store: (l) => stores.find((s) => s.id === l?.storeId) || null };
}
/** Rückgängig-Leiste mit Frist (Timer nur im Browser, ohne Date.now). */
export function useUndo(seconds = 7) {
  const [u, set] = useState(null);
  useEffect(() => { if (!u) return undefined; const t = setTimeout(() => set(null), seconds * 1000); return () => clearTimeout(t); }, [u]);
  return [u, set];
}
export const UndoBar = ({ u, set, ctx }) => u && html`<div class="tk-shp-undo" role="status" data-qa="shop-undo"><${Icon} name="check-circle-2" size=${16} /><span class="tk-grow">${u.text}</span>
  <${Button} size="sm" variant="ghost" icon="undo-2" onClick=${() => { u.restore(); ctx.emit('item.undo', { text: u.text }); set(null); }}>Rückgängig<//>
  <button type="button" class="tk-shp-x" aria-label="Hinweis schließen" onClick=${() => set(null)}><${Icon} name="x" size=${15} /></button></div>`;

export const useFocusRef = () => { const ref = useRef(null); return [ref, () => ref.current && ref.current.focus()]; };
export const Tile = ({ icon, tone = 'accent', size = 40 }) => html`<span class="tk-shp-tile" style=${`--tc:${toneColor(tone)};width:${size}px;height:${size}px`}><${Icon} name=${icon || 'list'} size=${Math.round(size * 0.48)} /></span>`;

// ------------------------------------------------------------------ Beispieldaten für die Galerie ---
export const EX = {
  stores: [{ id: 'st-rewe', name: 'REWE Bielefeld-Mitte', short: 'REWE', icon: 'shopping-cart', tone: 'success', aisles: ['Obst & Gemüse', 'Trockenwaren', 'Kühlregal', 'Sonstiges'] }, { id: 'st-dm', name: 'dm-Markt', short: 'dm', icon: 'sparkles', tone: 'accent', aisles: ['Körperpflege', 'Haushalt & Reinigung'] }],
  lists: [{ id: 'sl-food', name: 'Lebensmittel', icon: 'shopping-cart', tone: 'success', kind: 'food', storeId: 'st-rewe' },
    { id: 'sl-drogerie', name: 'Drogerie', icon: 'sparkles', tone: 'accent', kind: 'custom', storeId: 'st-dm', aisles: ['Körperpflege', 'Haushalt & Reinigung'], items: [
      { id: 'a1', name: 'Zahnpasta', qty: '2 Tuben', aisle: 'Körperpflege', done: false, price: 3.8 }, { id: 'a2', name: 'Müllbeutel 35 l', qty: '1 Rolle', aisle: 'Haushalt & Reinigung', done: false, price: 2.15 }, { id: 'a3', name: 'Küchenrolle', qty: '1', aisle: 'Haushalt & Reinigung', done: true, price: 2.99 }] }],
  shopping: { rangeDays: 3, pantry: [], checked: {}, manual: [{ id: 'm1', name: 'Milch', qty: '2 l', aisle: 'Kühlregal' }, { id: 'm2', name: 'Bananen', qty: '6 Stück', aisle: 'Obst & Gemüse' }, { id: 'm3', name: 'Haferflocken', qty: '1 kg', aisle: 'Trockenwaren' }], recipeAdds: [], budgetMonth: 450, spentMonth: 262.9 },
  pantry: [{ id: 'p1', name: 'Butter', level: 'low', aisle: 'Kühlregal', foodId: null, note: 'Reicht noch zwei Tage' }, { id: 'p2', name: 'Zahnpasta', level: 'empty', aisle: 'Körperpflege', listId: 'sl-drogerie', note: '' }, { id: 'p3', name: 'Olivenöl', level: 'ok', aisle: 'Trockenwaren', note: '' }],
  household: [{ id: 'h1', name: 'Waschmaschine: 90-Grad-Pflegewäsche', area: 'Bad', icon: 'waves', tone: 'info', rule: { freq: 'monthly', byMonthDay: 17 }, lastDone: '2026-10-18', since: '2026-03-17', minutes: 5, note: 'Leer bei 90 Grad.' },
    { id: 'h2', name: 'Rauchmelder testen', area: 'Wohnung', icon: 'bell', tone: 'danger', rule: { freq: 'yearly', byMonth: 12, byMonthDay: 1 }, lastDone: '2025-12-01', since: '2025-12-01', minutes: 10, note: '' }],
  trips: [{ id: 'tr1', status: 'geplant', date: '2026-11-26', time: '17:30', storeId: 'st-rewe', storeName: 'REWE Bielefeld-Mitte', listId: 'sl-food' }, { id: 'tr0', status: 'erledigt', date: '2026-11-24', time: '08:12', storeId: 'st-rewe', storeName: 'REWE Markt Bielefeld', listId: 'sl-food', total: 38.47 }],
  templates: [{ id: 'tpl-1', name: 'Rauchmelder testen', area: 'Wohnung', icon: 'bell', tone: 'danger', rule: { freq: 'yearly', byMonth: 12, byMonthDay: 1 }, minutes: 10, note: '' }],
  budgets: [{ id: 'b-food', label: 'Lebensmittel', category: 'Lebensmittel', target: 450 }],
  transactions: [{ id: 'x1', type: 'expense', category: 'Lebensmittel', amount: -262.9, date: '2026-11-10T10:00:00', title: 'REWE' }],
  plan: [], recipes: [], foods: [], tasks: [],
};
export const ex = (...names) => Object.fromEntries(names.map((n) => [n, EX[n]]));

// ------------------------------------------------------------------ CSS (geteilt; steht nur in shop-lists) ---
export const SHP_CSS = `
  .tk-shp { display:flex; flex-direction:column; gap:var(--tk-space-3); min-width:0; }
  .tk-shp-tile { display:grid; place-items:center; flex:none; border-radius:var(--tk-radius-md); background:color-mix(in srgb, var(--tc, var(--tk-c-accent)) 16%, transparent); color:var(--tc, var(--tk-c-accent)); }
  .tk-shp-meta { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); font-variant-numeric:tabular-nums; }
  .tk-shp-sub { font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); overflow-wrap:anywhere; }
  .tk-shp-head { display:flex; align-items:center; gap:10px; flex-wrap:wrap; min-width:0; } .tk-shp-head > .tk-grow { min-width:120px; }
  .tk-shp-big { font-size:var(--tk-fs-2xl); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); font-variant-numeric:tabular-nums; line-height:1.1; }
  .tk-shp-aisle { display:flex; align-items:center; gap:8px; padding:14px 0 4px; font-size:var(--tk-fs-xs); font-weight:var(--tk-fw-semibold); letter-spacing:var(--tk-ls-wide); text-transform:uppercase; color:var(--tk-c-text-subtle); }
  .tk-shp-aisle span { margin-left:auto; font-variant-numeric:tabular-nums; }
  .tk-shp-row { display:flex; align-items:center; gap:8px; min-height:52px; border-bottom:1px solid var(--tk-c-border); min-width:0; }
  .tk-shp-row .tk-check { min-width:44px; min-height:44px; justify-content:center; }
  .tk-shp-row__main { flex:1; min-width:0; text-align:left; background:none; border:0; padding:6px 0; color:inherit; cursor:pointer; display:flex; flex-direction:column; gap:1px; min-height:44px; justify-content:center; }
  .tk-shp-row__name { font-weight:var(--tk-fw-medium); overflow-wrap:anywhere; } .tk-shp-row[data-done="true"] .tk-shp-row__name { text-decoration:line-through; color:var(--tk-c-text-muted); } .tk-shp-row[data-done="true"] { opacity:.62; }
  .tk-shp-qty { font-variant-numeric:tabular-nums; color:var(--tk-c-text-muted); white-space:nowrap; font-size:var(--tk-fs-sm); }
  .tk-shp-edit { display:flex; align-items:center; gap:8px; flex-wrap:wrap; padding:6px 0 10px 52px; border-bottom:1px solid var(--tk-c-border); background:var(--tk-c-surface2); }
  .tk-shp-undo { display:flex; align-items:center; gap:8px; padding:6px 6px 6px 12px; border-radius:var(--tk-radius-md); background:var(--tk-c-surface3); border:1px solid var(--tk-c-border-strong); font-size:var(--tk-fs-sm); flex-wrap:wrap; }
  .tk-shp-x { width:36px; height:36px; display:grid; place-items:center; border:0; background:none; color:inherit; cursor:pointer; border-radius:var(--tk-radius-sm); } .bp-mobile .tk-shp-x { width:44px; height:44px; }
  .tk-shp-add { display:flex; flex-wrap:wrap; gap:8px; align-items:center; } .tk-shp-add > select { flex:1 1 140px; min-width:0; width:auto; } .tk-shp-add .tk-input { flex:1; min-width:0; }
  .tk-shp-chips { display:flex; flex-wrap:wrap; gap:6px; min-width:0; } .tk-shp-chips .tk-chip { max-width:100%; height:auto; min-height:36px; white-space:normal; text-align:left; padding-block:6px; }
  .tk-shp-bar { height:8px; border-radius:var(--tk-radius-pill); background:var(--tk-c-surface3); overflow:hidden; } .tk-shp-bar i { display:block; height:100%; border-radius:var(--tk-radius-pill); background:var(--tc, var(--tk-c-accent)); }
  .tk-shp-state { display:inline-flex; align-items:center; gap:4px; padding:2px 8px; border-radius:var(--tk-radius-pill); font-size:var(--tk-fs-xs); font-weight:var(--tk-fw-semibold); background:color-mix(in srgb, var(--tc) 15%, transparent); color:var(--tc); white-space:nowrap; }
  .bp-mobile .tk-shp-row { min-height:56px; }
  [data-tk-large-text] .tk-shp-row { flex-wrap:wrap; } [data-tk-large-text] .tk-shp-row .tk-shp-qty { flex-basis:100%; padding-left:52px; white-space:normal; margin-top:-6px; margin-bottom:6px; }
  [data-tk-large-text] .tk-shp-row__name, [data-tk-large-text] .tk-shpl-name, [data-tk-large-text] .tk-shph-name { overflow-wrap:break-word; }
  [data-tk-large-text] .tk-shp-row__main .tk-truncate, [data-tk-large-text] .tk-shpl-row .tk-truncate, [data-tk-large-text] .tk-shpl-card .tk-truncate, [data-tk-large-text] .tk-shp .tk-truncate { white-space:normal; overflow:visible; text-overflow:clip; overflow-wrap:break-word; }
  [data-tk-large-text] .tk-shp-edit { padding-left:12px; }`;
export { arr, obj };
