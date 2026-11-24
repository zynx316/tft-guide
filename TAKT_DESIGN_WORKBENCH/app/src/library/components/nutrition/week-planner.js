// Ernährung: Wochenplaner – Raster Mo bis So × Mahlzeiten (Desktop) bzw. Tagesliste (Mobil), Tagessummen, Slots füllen, verschieben, übernehmen.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Icon, Chip, Segmented, EmptyState, Input, Field } from '../../ui.js';
import { MEALS, mealInfo, num, todayIso, shiftDay, wdOf, dayShort, dayOf, hhmm, totals, goalForDay, eid, r1 } from './_calc.js';
import { recipePerServing } from './_recipes.js';
import { recentFoods } from './food-search.js';
import { planEntry } from './next-meal-card.js';
import { Stepper, NU_CSS, arr, obj } from './_ui.js';

const KIND_ICON = { recipe: 'chef-hat', food: 'apple', out: 'map-pin', leftover: 'repeat' };
const monday = (iso) => { const d = dayOf(iso); return shiftDay(iso, -((d.getDay() + 6) % 7)); };

function MoveSheet({ item, today, onSave }) {
  const days = Array.from({ length: 7 }, (_, i) => shiftDay(monday(today), i));
  const [day, setDay] = useState(item.date), [meal, setMeal] = useState(item.meal);
  return html`<div style="display:flex;flex-direction:column;gap:12px"><div class="tk-nu-chips" role="group" aria-label="Tag">${days.map((d) => html`<${Chip} active=${day === d} onClick=${() => setDay(d)}>${wdOf(d)} ${dayShort(d)}<//>`)}</div>
    <div class="tk-nu-chips" role="group" aria-label="Mahlzeit">${MEALS.map((m) => html`<${Chip} icon=${m.icon} active=${meal === m.id} onClick=${() => setMeal(m.id)}>${m.label}<//>`)}</div>
    <${Button} variant="primary" icon="check" onClick=${() => onSave(day, meal)}>Verschieben<//></div>`;
}
function AddSheet({ date, meal, recipes, foods, diary, plan, onAdd }) {
  const [tab, setTab] = useState('recipe'), [label, setLabel] = useState('Abendessen auswärts'), [kcal, setKcal] = useState(700);
  const rec = recentFoods(diary, foods, 6);
  const leftovers = [...new Map(arr(plan).filter((p) => p.recipeId).map((p) => [p.recipeId, p])).values()];
  const Row = ({ ic, t, s, k, on }) => html`<button type="button" class="tk-wp__pick" onClick=${on}><${Icon} name=${ic} size=${18} /><span class="tk-grow" style="min-width:0"><span class="tk-truncate" style="display:block;font-weight:500">${t}</span><span class="tk-nu-meta">${s}</span></span><strong class="tk-num">${k}</strong></button>`;
  return html`<div style="display:flex;flex-direction:column;gap:12px"><${Segmented} value=${tab} onChange=${setTab} label="Quelle" options=${[{ value: 'recipe', label: 'Rezepte' }, { value: 'recent', label: 'Zuletzt' }, { value: 'left', label: 'Reste' }, { value: 'out', label: 'Auswärts' }]} />
    ${tab === 'recipe' && html`<div>${recipes.map((r) => { const p = r.perServing || recipePerServing(r, foods); return html`<${Row} ic=${r.icon || 'chef-hat'} t=${r.title} s=${`E ${num(p.protein)} g`} k=${`${num(p.kcal)} kcal`} on=${() => onAdd({ kind: 'recipe', recipeId: r.id, label: r.title, servings: 1, kcal: Math.round(p.kcal), protein: r1(p.protein), carbs: r1(p.carbs), fat: r1(p.fat) })} />`; })}</div>`}
    ${tab === 'recent' && html`<div>${rec.length ? rec.map(({ food, grams }) => { const k = grams / 100; return html`<${Row} ic="apple" t=${food.name} s=${`${num(grams)} ${food.unit === 'ml' ? 'ml' : 'g'}`} k=${`${num(food.kcal * k)} kcal`} on=${() => onAdd({ kind: 'food', foodId: food.id, grams, label: food.name, servings: 1, kcal: Math.round(food.kcal * k), protein: r1(food.protein * k), carbs: r1(food.carbs * k), fat: r1(food.fat * k) })} />`; }) : html`<p class="tk-nu-meta">Noch nichts erfasst.</p>`}</div>`}
    ${tab === 'left' && html`<div>${leftovers.length ? leftovers.map((p) => html`<${Row} ic="repeat" t=${`Reste: ${p.label}`} s="eine Portion von früher" k=${`${num(p.kcal)} kcal`} on=${() => onAdd({ kind: 'leftover', recipeId: p.recipeId, label: `Reste: ${p.label}`, servings: 1, kcal: p.kcal, protein: p.protein, carbs: p.carbs, fat: p.fat })} />`) : html`<p class="tk-nu-meta">Noch keine Rezepte im Plan.</p>`}</div>`}
    ${tab === 'out' && html`<div style="display:flex;flex-direction:column;gap:12px"><${Field} label="Wo / was?"><${Input} value=${label} onInput=${setLabel} maxlength="60" /><//><${Stepper} value=${kcal} onChange=${setKcal} step=${50} min=${100} max=${3000} unit="kcal" label="Geschätzte Kalorien" />
      <${Button} variant="primary" icon="check" onClick=${() => onAdd({ kind: 'out', label: label.trim() || 'Auswärts', servings: 1, kcal, protein: Math.round(kcal * 0.04), carbs: 0, fat: 0 })}>Eintragen<//></div>`}</div>`;
}

export const weekPlanner = {
  id: 'week-planner',
  name: 'Wochenplaner',
  category: 'Ernährung',
  description: 'Mahlzeiten vorausplanen: Raster Mo bis So × Mahlzeiten (Desktop) oder Tagesliste mit Tagesleiste (Mobil). Tagessummen gegen das Ziel, Slots aus Rezepten, Zuletzt, Resten oder Auswärts füllen, verschieben, „wie geplant gegessen“ und Woche kopieren.',
  version: '1.2',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Wochenplan' },
    { name: 'view', label: 'Ansicht', type: 'select', options: ['auto', 'grid', 'day'], default: 'auto' },
    { name: 'framed', label: 'In Karte', type: 'boolean', default: true },
  ],
  data: [
    { slot: 'plan', label: 'Wochenplan', default: 'plan', shape: '{id,date,meal,kind,label,recipeId?,servings,status,kcal,protein}[]', required: true },
    { slot: 'recipes', label: 'Rezepte', default: 'recipes', shape: 'Rezepte', required: true },
    { slot: 'foods', label: 'Lebensmittel', default: 'foods', shape: 'Lebensmittel', required: true },
    { slot: 'goals', label: 'Ziele', default: 'goals', shape: '{kcal,protein}', required: false },
    { slot: 'diary', label: 'Tagebuch', default: 'diary', shape: 'Einträge', required: false },
  ],
  events: ['plan.slot', 'plan.set', 'plan.move', 'plan.remove', 'plan.eat', 'plan.copyweek', 'recipe.open'],
  states: ['empty'],
  css: `${NU_CSS}
  .tk-wp { display:flex; flex-direction:column; gap:var(--tk-space-3); min-width:0; }
  .tk-wp__grid { display:grid; grid-template-columns:76px repeat(7,minmax(0,1fr)); gap:6px; } .tk-wp__h { text-align:center; padding:6px 2px; border-radius:var(--tk-radius-md); font-size:var(--tk-nfs-sm); color:var(--tk-c-text-muted); } .tk-wp__h strong { display:block; color:var(--tk-c-text); font-size:var(--tk-nfs-lg); } .tk-wp__h[data-today="true"] { background:var(--tk-c-accent-soft); color:var(--tk-c-accent); } .tk-wp__h[data-today="true"] strong { color:var(--tk-c-accent); }
  .tk-wp__m { display:flex; align-items:center; gap:6px; font-size:var(--tk-nfs-sm); color:var(--tk-c-text-muted); font-weight:var(--tk-fw-medium); }
  .tk-wp__cell { min-height:84px; padding:4px; border-radius:var(--tk-radius-md); border:1px dashed var(--tk-c-border); display:flex; flex-direction:column; gap:4px; min-width:0; } .tk-wp__cell[data-today="true"] { border-color:var(--tk-c-accent); }
  .tk-wp__item { display:flex; flex-direction:column; gap:2px; text-align:left; width:100%; padding:6px 8px; border-radius:8px; border:1px solid var(--tk-c-border); background:var(--tk-c-surface2); color:inherit; font:inherit; cursor:pointer; min-width:0; } .tk-wp__item:hover { border-color:var(--tk-c-border-strong); }
  .tk-wp__item[data-status="done"] { background:var(--tk-c-success-soft); border-color:transparent; } .tk-wp__item[data-status="done"] span, .tk-wp__row[data-status="done"] .tk-nu-meta { color:var(--tk-c-text); } .tk-wp__item b { font-weight:var(--tk-fw-medium); font-size:var(--tk-nfs-sm); line-height:1.25; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; } .tk-wp__item span { font-size:var(--tk-nfs-xs); color:var(--tk-c-text-muted); font-variant-numeric:tabular-nums; }
  .tk-wp__add { margin:auto; width:100%; min-height:36px; border:0; background:transparent; color:var(--tk-c-text-subtle); cursor:pointer; border-radius:8px; display:grid; place-items:center; } .tk-wp__add:hover { background:var(--tk-c-surface2); color:var(--tk-c-text); }
  .tk-wp__sum { font-size:var(--tk-nfs-xs); text-align:center; color:var(--tk-c-text-muted); font-variant-numeric:tabular-nums; padding-top:4px; } .tk-wp__sum .tk-progress { margin-top:4px; height:5px; }
  .tk-wp__days { display:grid; grid-template-columns:repeat(auto-fit, minmax(3em,1fr)); gap:4px; font-size:var(--tk-nfs-xs); }
  .tk-wp__day { display:flex; flex-direction:column; align-items:center; gap:2px; padding:6px 2px; min-height:56px; border-radius:var(--tk-radius-md); border:1px solid transparent; background:transparent; color:var(--tk-c-text-muted); font:inherit; font-size:var(--tk-nfs-xs); cursor:pointer; } .tk-wp__day strong { font-size:var(--tk-nfs-lg); color:var(--tk-c-text); } .tk-wp__day[aria-pressed="true"] { background:var(--tk-c-accent-soft); color:var(--tk-c-accent); } .tk-wp__day[aria-pressed="true"] strong { color:var(--tk-c-accent); }
  .tk-wp__slot { padding:10px 0; border-top:1px solid var(--tk-c-border); display:flex; flex-direction:column; gap:8px; }
  .tk-wp__row { display:flex; align-items:center; gap:10px; min-height:52px; padding:6px 10px; border-radius:var(--tk-radius-md); border:1px solid var(--tk-c-border); background:var(--tk-c-surface2); width:100%; color:inherit; font:inherit; text-align:left; cursor:pointer; min-width:0; } .tk-wp__row[data-status="done"] { background:var(--tk-c-success-soft); border-color:transparent; }
  .tk-wp__pick { display:flex; align-items:center; gap:12px; width:100%; min-height:52px; border:0; border-bottom:1px solid var(--tk-c-border); background:transparent; color:inherit; font:inherit; text-align:left; cursor:pointer; padding:4px 0; }
  .tk-wp__total { display:flex; justify-content:space-between; gap:8px; flex-wrap:wrap; font-size:var(--tk-nfs-sm); color:var(--tk-c-text-muted); padding-top:8px; border-top:1px solid var(--tk-c-border); font-variant-numeric:tabular-nums; }`,
  example: { data: {
    plan: [{ id: 'p1', date: '2026-11-24', meal: 'dinner', kind: 'recipe', recipeId: 'r1', label: 'Lachs mit Ofengemüse', servings: 1, status: 'planned', kcal: 636, protein: 39 }, { id: 'p2', date: '2026-11-25', meal: 'breakfast', kind: 'recipe', recipeId: 'r2', label: 'Skyr-Bowl mit Blaubeeren', servings: 1, status: 'planned', kcal: 507, protein: 37 }],
    recipes: [{ id: 'r1', title: 'Lachs mit Ofengemüse', icon: 'fish', meal: 'dinner', servings: 2, ingredients: [], perServing: { kcal: 636, protein: 39, carbs: 46, fat: 30 } }, { id: 'r2', title: 'Skyr-Bowl mit Blaubeeren', icon: 'milk', meal: 'breakfast', servings: 1, ingredients: [], perServing: { kcal: 507, protein: 37, carbs: 54, fat: 14 } }],
    foods: [], goals: { kcal: 2400, protein: 140 }, diary: [],
  } },
  render: function WeekPlanner({ props, data, setData, ctx }) {
    const today = todayIso(ctx), plan = arr(data.plan), recipes = arr(data.recipes), foods = arr(data.foods), goals = obj(data.goals);
    const days = Array.from({ length: 7 }, (_, i) => shiftDay(monday(today), i));
    const [sel, setSel] = useState(today);
    const big = (ctx.env?.scale || 1) >= 1.5; // große Schrift: sieben Spalten sind nicht lesbar, Tagesliste zeigen
    const grid = !big && (props.view === 'grid' || (props.view === 'auto' && ctx.bp === 'desktop'));
    const wrap = (b) => (props.framed ? html`<${Card} title=${props.title} icon="calendar-days" actions=${html`<${Button} size="sm" variant="ghost" icon="copy" onClick=${copyWeek}>Woche kopieren<//>`}>${b}<//>` : b);
    const inDay = (d, m) => plan.filter((p) => p.date === d && (!m || p.meal === m));
    const sum = (d) => totals(inDay(d).filter((p) => p.status !== 'skipped').map((p) => ({ kcal: p.kcal, protein: p.protein })));
    const goalK = (d) => goalForDay(goals, d)?.kcal || 0;
    const set = (fn) => setData('plan', (l) => fn(arr(l)));
    function copyWeek() { const next = days.map((d) => shiftDay(d, 7)); if (plan.some((p) => next.includes(p.date))) { ctx.toast('Die nächste Woche hat schon Einträge'); return; } set((l) => [...l, ...l.filter((p) => days.includes(p.date)).map((p) => ({ ...p, id: eid('p', ctx), date: shiftDay(p.date, 7), status: 'planned' }))]); ctx.emit('plan.copyweek'); ctx.toast('Woche in die nächste Woche kopiert'); }
    if (!plan.length) return wrap(html`<${EmptyState} icon="calendar-days" title="Noch kein Plan" text="Plane Mahlzeiten vor, dann wird Erfassen zum Abhaken und die Einkaufsliste entsteht von selbst." action=${html`<${Button} size="sm" variant="primary" icon="plus" onClick=${() => openAdd(today, 'dinner')}>Erste Mahlzeit planen<//>`} />`);

    function openAdd(date, meal) {
      ctx.emit('plan.slot', { date, meal });
      ctx.openDialog({ title: `${wdOf(date)} ${dayShort(date)} · ${mealInfo(meal).label}`, body: (close) => html`<${AddSheet} date=${date} meal=${meal} recipes=${recipes} foods=${foods} diary=${data.diary} plan=${plan} onAdd=${(it) => { set((l) => [...l, { id: eid('p', ctx), date, meal, status: 'planned', ...it }]); ctx.emit('plan.set', { date, meal, kind: it.kind }); close(); }} />` });
    }
    function openItem(p) {
      const canEat = p.status === 'planned' && p.date <= today;
      ctx.openDialog({ title: p.label, body: (close) => html`<div style="display:flex;flex-direction:column;gap:14px"><div class="tk-nu-meta">${wdOf(p.date)} ${dayShort(p.date)} · ${mealInfo(p.meal).label}${p.note ? ` · ${p.note}` : ''}</div>
        <div class="tk-row" style="gap:10px"><span class="tk-nu-big">${num(p.kcal)}</span><span class="tk-muted">kcal · E ${num(p.protein)} g · ${p.status === 'done' ? 'gegessen' : 'geplant'}</span></div>
        <div class="tk-nu-btnrow">${p.recipeId && html`<${Button} icon="chef-hat" onClick=${() => { close(); ctx.emit('recipe.open', { id: p.recipeId }); }}>Rezept öffnen<//>`}
          ${canEat && html`<${Button} variant="primary" icon="check" onClick=${() => { setData('diary', (d) => [...arr(d), planEntry(p, p.date, hhmm(ctx.today), ctx)]); set((l) => l.map((x) => (x.id === p.id ? { ...x, status: 'done' } : x))); ctx.emit('plan.eat', { id: p.id }); ctx.toast(`${p.label} als gegessen übernommen`); close(); }}>Wie geplant gegessen<//>`}
          <${Button} icon="arrow-left-right" onClick=${() => { close(); ctx.openDialog({ title: 'Verschieben', body: (c2) => html`<${MoveSheet} item=${p} today=${today} onSave=${(day, meal) => { set((l) => l.map((x) => (x.id === p.id ? { ...x, date: day, meal } : x))); ctx.emit('plan.move', { id: p.id, date: day, meal }); c2(); }} />` }); }}>Verschieben<//>
          <${Button} variant="danger" icon="trash-2" onClick=${() => { set((l) => l.filter((x) => x.id !== p.id)); ctx.emit('plan.remove', { id: p.id }); ctx.toast(`${p.label} aus dem Plan entfernt`); close(); }}>Entfernen<//></div></div>` });
    }
    const Item = ({ p, row }) => html`<button type="button" class=${row ? 'tk-wp__row' : 'tk-wp__item'} data-status=${p.status} onClick=${() => openItem(p)} aria-label=${`${p.label}, ${num(p.kcal)} Kilokalorien, ${p.status === 'done' ? 'gegessen' : 'geplant'}`}>
      ${row ? html`<${Icon} name=${p.status === 'done' ? 'check-circle-2' : KIND_ICON[p.kind] || 'utensils'} size=${18} /><span class="tk-grow" style="min-width:0"><span class="tk-truncate" style="display:block;font-weight:500">${p.label}</span><span class="tk-nu-meta">${p.note || (p.status === 'done' ? 'gegessen' : 'geplant')}</span></span><strong class="tk-num">${num(p.kcal)} kcal</strong>` : html`<b>${p.label}</b><span>${num(p.kcal)} kcal${p.status === 'done' ? ' · ✓' : ''}</span>`}</button>`;

    let body;
    if (grid) {
      body = html`<div class="tk-wp"><div class="tk-wp__grid"><div></div>${days.map((d) => html`<div class="tk-wp__h" data-today=${String(d === today)}>${wdOf(d)}<strong>${dayOf(d).getDate()}</strong></div>`)}
        ${MEALS.map((m) => html`<div class="tk-wp__m"><${Icon} name=${m.icon} size=${15} />${m.short}</div>${days.map((d) => html`<div class="tk-wp__cell" data-today=${String(d === today)}>${inDay(d, m.id).map((p) => html`<${Item} p=${p} />`)}<button type="button" class="tk-wp__add" aria-label=${`${wdOf(d)} ${m.label} hinzufügen`} onClick=${() => openAdd(d, m.id)}><${Icon} name="plus" size=${16} /></button></div>`)}`)}
        <div class="tk-wp__m">Summe</div>${days.map((d) => { const s = sum(d), g = goalK(d); return html`<div class="tk-wp__sum"><strong style="color:var(--tk-c-text)">${s.kcal ? num(s.kcal) : '–'}</strong> kcal<br />E ${num(s.protein)} g${g > 0 && html`<div class="tk-progress"><span style=${`width:${Math.min(100, (s.kcal / g) * 100)}%`}></span></div>`}</div>`; })}</div></div>`;
    } else {
      const s = sum(sel), g = goalK(sel);
      body = html`<div class="tk-wp"><div class="tk-wp__days" role="group" aria-label="Tag wählen">${days.map((d) => html`<button type="button" class="tk-wp__day" aria-pressed=${String(d === sel)} onClick=${() => setSel(d)} aria-label=${`${wdOf(d)} ${dayShort(d)}${d === today ? ', heute' : ''}`}>${wdOf(d)}<strong>${dayOf(d).getDate()}</strong><span>${sum(d).kcal ? num(sum(d).kcal) : '–'}</span></button>`)}</div>
        ${MEALS.map((m) => html`<div class="tk-wp__slot"><div class="tk-row" style="justify-content:space-between"><span class="tk-wp__m"><${Icon} name=${m.icon} size=${16} />${m.label}</span><${Button} size="sm" variant="ghost" icon="plus" aria-label=${`${m.label} hinzufügen`} onClick=${() => openAdd(sel, m.id)} /></div>
          ${inDay(sel, m.id).map((p) => html`<${Item} p=${p} row />`)}${!inDay(sel, m.id).length && html`<span class="tk-nu-meta">Noch nichts geplant</span>`}</div>`)}
        <div class="tk-wp__total"><span>Tagessumme: <strong style="color:var(--tk-c-text)">${num(s.kcal)} kcal</strong>${g ? ` von ${num(g)}` : ''}</span><span>E ${num(s.protein)} g${goals.protein ? ` von ${num(goals.protein)}` : ''}</span></div></div>`;
    }
    return wrap(body);
  },
};
export default [weekPlanner];
