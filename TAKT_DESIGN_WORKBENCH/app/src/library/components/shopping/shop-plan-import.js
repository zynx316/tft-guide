// Einkauf: Zutaten aus dem Ernährungsplan übernehmen – Zeitraum wählen, Rezepte ergänzen, Vorräte werden abgezogen, doppelte Einträge zusammengeführt.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Icon, Segmented, Badge, EmptyState, NumberStepper } from '../../ui.js';
import { SHP_CSS, slots, ex, Tile } from './_shopping.js';
import { foodItems, fold, arr, obj, dayKey, aisleIcon } from './_logic.js';
import { fmtDate } from '../../../lib/format.js';
import { addDays, toIsoDay } from '../../../lib/date.js';

/** Vorschau: Liste mit dem gewählten Zeitraum und den zusätzlichen Rezepten, plus Dopplungen mit manuellen Einträgen. */
export function previewImport(data, today, draft) {
  const sh = { ...obj(data.shopping), rangeDays: draft.range, recipeAdds: draft.adds };
  const food = foodItems({ shopping: sh, plan: data.plan, recipes: data.recipes, foods: data.foods, today });
  const derived = food.items.filter((i) => i.derived), manual = food.items.filter((i) => i.manual);
  const dupes = manual.filter((m) => derived.some((d) => fold(d.name) === fold(m.name) || (fold(m.name).length > 3 && fold(d.name).includes(fold(m.name)))));
  return { ...food, derived, manual, dupes };
}

export const shopPlanImport = {
  id: 'shop-plan-import',
  name: 'Zutaten aus dem Plan',
  category: 'Einkauf',
  description: 'Übernimmt Zutaten aus dem Ernährungsplan auf die Lebensmittel-Liste: Zeitraum 3 oder 7 Tage, weitere Rezepte, Vorräte werden abgezogen, doppelte manuelle Einträge zusammengeführt. Vorschau vor dem Übernehmen.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Zutaten aus dem Plan' },
    { name: 'framed', label: 'In Karte', type: 'boolean', default: true },
  ],
  data: slots('shopping', 'plan', 'recipes', 'foods', 'lists'),
  events: ['plan.range', 'plan.recipe', 'plan.apply', 'plan.open'],
  states: ['empty'],
  flutter: { widget: 'ShopPlanImport', propMap: {}, events: ['plan.apply'] },
  css: `${SHP_CSS}
  .tk-shpi-sum { display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%, 150px), 1fr)); gap:var(--tk-space-2); }
  .tk-shpi-sum > div { padding:10px 12px; border-radius:var(--tk-radius-md); background:var(--tk-c-surface2); border:1px solid var(--tk-c-border); min-width:0; } .tk-shpi-sum .tk-shp-big { font-size:var(--tk-fs-xl); }
  .tk-shpi-rec { display:flex; align-items:center; gap:10px; flex-wrap:wrap; padding:8px 0; border-bottom:1px solid var(--tk-c-border); min-width:0; }
  .tk-shpi-chips { display:flex; flex-wrap:wrap; gap:6px; margin-top:6px; } .tk-shpi-list { max-height:none; }`,
  example: { data: { shopping: { rangeDays: 3, pantry: ['f-honig'], checked: {}, manual: [{ id: 'm1', name: 'Honig', qty: '1', aisle: 'Sonstiges' }], recipeAdds: [], budgetMonth: 450, spentMonth: 262.9 },
    plan: [{ id: 'p1', date: '2026-11-24', meal: 'dinner', recipeId: 'r1', servings: 2, status: 'planned' }],
    recipes: [{ id: 'r1', title: 'Lachs mit Ofengemüse', servings: 2, ingredients: [{ foodId: 'f1', g: 300 }, { foodId: 'f2', g: 300 }, { foodId: 'f3', g: 20 }] }, { id: 'r2', title: 'Linsen-Curry', servings: 2, ingredients: [{ foodId: 'f2', g: 100 }] }],
    foods: [{ id: 'f1', name: 'Lachsfilet', category: 'Fleisch & Fisch', unit: 'g', eur100: 2.2 }, { id: 'f2', name: 'Brokkoli', category: 'Obst & Gemüse', unit: 'g', eur100: 0.25 }, { id: 'f3', name: 'Honig', category: 'Süßes & Snacks', unit: 'g', eur100: 1 }], lists: [] } },
  render: function ShopPlanImport({ props, data, setData, ctx }) {
    const today = dayKey(ctx.today), sh = obj(data.shopping);
    const [draft, setDraft] = useState(() => ({ range: sh.rangeDays || 3, adds: arr(sh.recipeAdds) })), [picked, setPicked] = useState('');
    const wrap = (b) => (props.framed ? html`<${Card} title=${props.title} icon="calendar-days">${b}<//>` : html`<div class="tk-shp">${b}</div>`);
    const recipes = arr(data.recipes), plan = arr(data.plan);
    if (!plan.length && !recipes.length) return wrap(html`<${EmptyState} icon="calendar-days" title="Noch kein Plan" text="Plane Mahlzeiten in Ernährung, dann übernimmt TAKT die Zutaten für dich." action=${html`<${Button} variant="primary" icon="calendar-days" onClick=${() => ctx.emit('plan.open')}>Wochenplan öffnen<//>`} />`);
    const now = previewImport(data, today, { range: sh.rangeDays || 3, adds: arr(sh.recipeAdds) }), next = previewImport(data, today, draft);
    const until = toIsoDay(addDays(today, draft.range - 1)), fresh = next.derived.filter((i) => !now.derived.some((n) => n.key === i.key)).length;
    const inRange = plan.filter((p) => p.recipeId && p.date >= today && p.date <= until && p.status !== 'done' && p.status !== 'skipped');
    const addable = recipes.filter((r) => !draft.adds.some((a) => a.recipeId === r.id));
    const addRecipe = () => { const r = recipes.find((x) => x.id === picked); if (!r) return; setDraft((d) => ({ ...d, adds: [...d.adds, { recipeId: r.id, servings: r.servings || 2 }] })); setPicked(''); ctx.emit('plan.recipe', { id: r.id }); };
    const apply = () => {
      setData('shopping', (s) => { const o = obj(s); const gone = new Set(next.dupes.map((m) => m.key)); return { ...o, rangeDays: draft.range, recipeAdds: draft.adds, manual: arr(o.manual).filter((m) => !gone.has(m.id)) }; });
      ctx.toast(`${next.derived.length} Zutaten auf der Liste${next.dupes.length ? `, ${next.dupes.length} Doppelte zusammengeführt` : ''}`);
      ctx.emit('plan.apply', { id: 'sl-food', range: draft.range });
    };
    return wrap(html`<div class="tk-shp">
      <div class="tk-shp-head"><div class="tk-grow"><div class="tk-shp-meta">Plan von heute bis ${fmtDate(until, { style: 'weekday' })}</div></div>
        <${Segmented} label="Zeitraum" value=${String(draft.range)} onChange=${(v) => { setDraft((d) => ({ ...d, range: Number(v) })); ctx.emit('plan.range', { days: Number(v) }); }} options=${[{ value: '3', label: '3 Tage' }, { value: '7', label: '7 Tage' }]} /></div>
      <div class="tk-shpi-sum" role="group" aria-label="Vorschau"><div><div class="tk-shp-big">${next.derived.length}</div><div class="tk-shp-sub">Zutaten gesamt${fresh ? `, ${fresh} neu` : ''}</div></div>
        <div><div class="tk-shp-big">${next.pantryItems.length}</div><div class="tk-shp-sub">aus dem Vorrat abgezogen</div></div><div><div class="tk-shp-big">${next.dupes.length}</div><div class="tk-shp-sub">Doppelte zusammengeführt</div></div></div>
      ${next.pantryItems.length > 0 && html`<div class="tk-shp-sub">Im Vorrat: ${next.pantryItems.map((i) => i.name).join(', ')}.</div>`}
      ${next.dupes.length > 0 && html`<div class="tk-shpi-chips" aria-label="Doppelte Einträge">${next.dupes.map((m) => html`<${Badge} tone="warning" icon="merge">${m.name} steht schon im Plan<//>`)}</div>`}
      <div><div class="tk-shp-aisle" style="padding-top:6px"><${Icon} name="chef-hat" size=${14} />Rezepte im Zeitraum<span>${inRange.length}</span></div>
        ${inRange.length ? inRange.map((p) => { const r = recipes.find((x) => x.id === p.recipeId); return html`<div class="tk-shpi-rec"><${Tile} icon="utensils" tone="success" size=${32} /><div class="tk-grow"><div class="tk-shpl-name" style="font-weight:var(--tk-fw-medium);overflow-wrap:anywhere">${r ? r.title : 'Rezept'}</div><div class="tk-shp-sub">${fmtDate(p.date, { style: 'weekday' })} · ${p.servings || 1} Portion${(p.servings || 1) === 1 ? '' : 'en'}</div></div></div>`; })
          : html`<div class="tk-shp-sub" style="padding:6px 0">Im gewählten Zeitraum ist nichts geplant.</div>`}
        ${draft.adds.map((a) => { const r = recipes.find((x) => x.id === a.recipeId); return html`<div class="tk-shpi-rec"><${Tile} icon="plus" tone="accent" size=${32} /><div class="tk-grow"><div style="font-weight:var(--tk-fw-medium);overflow-wrap:anywhere">${r ? r.title : 'Rezept'}</div><div class="tk-shp-sub">zusätzlich</div></div>
          <${NumberStepper} value=${a.servings} min=${1} max=${12} unit="Port." label=${`Portionen ${r ? r.title : ''}`} onChange=${(v) => setDraft((d) => ({ ...d, adds: d.adds.map((x) => (x.recipeId === a.recipeId ? { ...x, servings: v } : x)) }))} />
          <${Button} variant="ghost" icon="x" aria-label="Rezept entfernen" onClick=${() => setDraft((d) => ({ ...d, adds: d.adds.filter((x) => x.recipeId !== a.recipeId) }))} /></div>`; })}</div>
      ${addable.length > 0 && html`<div class="tk-shp-add"><select class="tk-select" value=${picked} onChange=${(e) => setPicked(e.currentTarget.value)} aria-label="Weiteres Rezept"><option value="">Weiteres Rezept einkaufen …</option>${addable.map((r) => html`<option value=${r.id}>${r.title}</option>`)}</select><${Button} icon="plus" disabled=${!picked} onClick=${addRecipe}>Dazu<//></div>`}
      <${Button} variant="primary" icon="check" onClick=${apply}>Auf die Liste übernehmen<//></div>`);
  },
};
export default shopPlanImport;
