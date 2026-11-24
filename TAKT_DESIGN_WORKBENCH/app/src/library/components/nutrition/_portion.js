// Ernährung – Portions-Formular (Dialog/Bottom-Sheet oder inline) und Schreib-Helfer ins Tagebuch.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Button, Chip, Icon, Badge } from '../../ui.js';
import { MEALS, MACROS, per, num, entryFromFood, entryQuick, hhmm, viewDay, suggestMeal, kj, mealInfo } from './_calc.js';
import { Stepper } from './_ui.js';

/** Eintrag ins Tagebuch (Welt) schreiben und melden. */
export function logEntry(ctx, setData, entry, { silent = false } = {}) {
  setData('diary', (d) => [...(Array.isArray(d) ? d : []), entry]);
  ctx.emit('portion.confirm', { id: entry.id, foodId: entry.foodId, meal: entry.meal, kcal: entry.kcal });
  if (!silent) ctx.toast(`${entry.name} · ${num(entry.kcal)} kcal zu ${mealInfo(entry.meal).label} hinzugefügt`);
  return entry;
}
export function logFood(ctx, setData, food, grams, meal, extra) {
  return logEntry(ctx, setData, entryFromFood(food, grams, { meal, date: viewDay(ctx), time: hhmm(ctx.today), ...extra }));
}
export const logQuick = (ctx, setData, q) => logEntry(ctx, setData, entryQuick({ ...q, date: viewDay(ctx), time: hhmm(ctx.today) }));

const QUICK_G = [50, 100, 150, 200];

/** Portions-Picker: Einheiten-Chips, Stepper, Schnellwerte, Live-Nährwerte, Mahlzeit, Hinzufügen. */
export function PortionForm({ food, ctx, setData, meal: meal0, grams: g0, onDone, compact, ctaLabel }) {
  const unit = food.unit === 'ml' ? 'ml' : 'g';
  const [g, setG] = useState(g0 || food.lastG || food.portions?.[0]?.g || 100);
  const [meal, setMeal] = useState(meal0 || suggestMeal(ctx));
  const n = per(food, g);
  const pieces = food.piece ? g / food.piece.g : null;
  const add = () => { logFood(ctx, setData, food, g, meal); onDone && onDone(); };
  return html`<div class="tk-pf">
    <div class="tk-pf__head"><div class="tk-grow" style="min-width:0"><div class="tk-pf__name tk-truncate">${food.name}</div>
      <div class="tk-nu-meta tk-truncate">${food.brand ? `${food.brand} · ` : ''}${num(food.kcal)} kcal je 100 ${unit}</div></div>
      ${(food.allergens || []).slice(0, 2).map((a) => html`<${Badge} tone="warning">${a}<//>`)}</div>
    <div class="tk-pf__kcal" aria-live="polite"><span class="tk-nu-big">${num(n.kcal)}</span><span class="tk-nu-meta"> kcal · ${num(kj(n.kcal))} kJ</span></div>
    <div class="tk-pf__macros">${MACROS.map((m) => html`<div class="tk-pf__m"><i style=${`background:${m.color}`}></i><span class="tk-nu-meta">${m.short}</span><strong class="tk-num">${num(n[m.id], 1)} g</strong></div>`)}</div>
    <div class="tk-pf__row"><${Stepper} value=${g} onChange=${setG} step=${food.portions?.length && g < 40 ? 5 : 10} min=${5} max=${2000} unit=${unit} label="Menge" />
      ${pieces != null && html`<span class="tk-nu-meta">≈ ${num(pieces, 1)} ${food.piece.plural || food.piece.label}</span>`}</div>
    <div class="tk-nu-chips" role="group" aria-label="Portionsgrößen">${(food.portions || []).map((p) => html`<${Chip} active=${g === p.g} onClick=${() => setG(p.g)}>${p.label}<//>`)}
      ${QUICK_G.filter((q) => !(food.portions || []).some((p) => p.g === q)).slice(0, compact ? 2 : 4).map((q) => html`<${Chip} active=${g === q} onClick=${() => setG(q)}>${q} ${unit}<//>`)}</div>
    <div class="tk-pf__meals" role="group" aria-label="Mahlzeit">${MEALS.map((m) => html`<button type="button" aria-pressed=${String(meal === m.id)} onClick=${() => setMeal(m.id)}><${Icon} name=${m.icon} size=${15} />${m.label}</button>`)}</div>
    <${Button} variant="primary" icon="plus" onClick=${add} style="width:100%;justify-content:center">${ctaLabel || `Hinzufügen · ${num(n.kcal)} kcal`}<//>
  </div>`;
}

export function openPortion(ctx, setData, food, opts = {}) {
  ctx.emit('food.pick', { id: food.id });
  ctx.openDialog({ title: 'Portion wählen', body: (close) => html`<${PortionForm} food=${food} ctx=${ctx} setData=${setData} meal=${opts.meal} grams=${opts.grams} onDone=${() => { close(); opts.onDone && opts.onDone(); }} />` });
}

/** Mahlzeit-Auswahl als Chips (gemeinsam mit anderen Erfassen-Blöcken über ctx.ui.logMeal). */
export const MealChips = ({ value, onChange }) => html`<div class="tk-nu-chips" role="group" aria-label="Mahlzeit">${MEALS.map((m) => html`<${Chip} icon=${m.icon} active=${value === m.id} onClick=${() => onChange(m.id)}>${m.label}<//>`)}</div>`;
export const useLogMeal = (ctx) => [ctx.ui?.logMeal || suggestMeal(ctx), (m) => ctx.setUi('logMeal', m)];

export const PF_CSS = `
  .tk-pf { display:flex; flex-direction:column; gap:14px; min-width:0; }
  .tk-pf__head { display:flex; align-items:center; gap:8px; }
  .tk-pf__name { font-size:var(--tk-nfs-lg); font-weight:var(--tk-fw-semibold); }
  .tk-pf__kcal { display:flex; align-items:baseline; gap:4px; flex-wrap:wrap; }
  .tk-pf__macros { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; }
  .tk-pf__m { display:flex; align-items:center; gap:6px; padding:8px 10px; border-radius:var(--tk-radius-md); background:var(--tk-c-surface2); border:1px solid var(--tk-c-border); font-size:var(--tk-nfs-sm); }
  .tk-pf__m i { width:8px; height:8px; border-radius:3px; flex:none; } .tk-pf__m strong { margin-left:auto; }
  .tk-pf__row { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
  .tk-pf__meals { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:6px; }
  .tk-pf__meals button { display:flex; flex-direction:column; align-items:center; gap:3px; padding:8px 2px; min-height:52px; border-radius:var(--tk-radius-md); border:1px solid var(--tk-c-border); background:transparent; color:var(--tk-c-text-muted); font:inherit; font-size:var(--tk-nfs-xs); cursor:pointer; }
  .tk-pf__meals button[aria-pressed="true"] { background:var(--tk-c-accent-soft); border-color:transparent; color:var(--tk-c-accent); font-weight:var(--tk-fw-semibold); }
`;
