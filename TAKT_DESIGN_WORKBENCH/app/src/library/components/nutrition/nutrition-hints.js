// Ernährung: konstruktive Tageshinweise (Eiweiß, Wasser, Plan, Training) – nie wertend, mit Ein-Tap-Aktion.
import { html } from '../../../lib/html.js';
import { Card, Button, Icon, EmptyState } from '../../ui.js';
import { buildHints, dayView, hhmm, todayIso, shiftDay, wdOf, viewDay, suggestMeal, eid } from './_calc.js';
import { logFood } from './_portion.js';
import { NU_CSS, arr, obj, tintBox } from './_ui.js';

export const nutritionHints = {
  id: 'nutrition-hints',
  name: 'Ernährungs-Hinweise',
  category: 'Ernährung',
  description: 'Berechnet aus Tagebuch, Plan und Wasser kurze, freundliche Hinweise („Eiweiß: noch 38 g – Skyr passt“) mit Ein-Tap-Aktion. Keine Bewertung, keine Alarmfarben.',
  version: '1.1',
  props: [
    { name: 'quietEmpty', label: 'Im Erststart (noch nichts erfasst) nichts anzeigen', type: 'boolean', default: false },
    { name: 'title', label: 'Titel', type: 'text', default: 'Was fehlt noch?' },
    { name: 'limit', label: 'Max. Hinweise', type: 'number', default: 3 },
    { name: 'style', label: 'Darstellung', type: 'select', options: ['list', 'cards'], default: 'list' },
    { name: 'framed', label: 'In Karte', type: 'boolean', default: true },
  ],
  data: [
    { slot: 'goals', label: 'Ziele', default: 'goals', shape: '{kcal,protein,water,fiber,trainingDays}', required: true },
    { slot: 'diary', label: 'Tagebuch', default: 'diary', shape: 'Einträge', required: true },
    { slot: 'plan', label: 'Wochenplan', default: 'plan', shape: 'Planpunkte', required: false },
    { slot: 'water', label: 'Wasser', default: 'water', shape: '{entries}', required: false },
    { slot: 'foods', label: 'Lebensmittel', default: 'foods', shape: 'Lebensmittel', required: false },
  ],
  events: ['hint.log', 'hint.water', 'goals.open', 'hint.open'],
  states: ['empty'],
  css: `${NU_CSS}
  .tk-nh { display:flex; flex-direction:column; gap:var(--tk-space-3); }
  .tk-nh__item { display:flex; flex-wrap:wrap; align-items:center; gap:10px 12px; padding:10px 12px; border-radius:var(--tk-radius-md); background:var(--tk-c-surface2); border:1px solid var(--tk-c-border); min-width:0; }
  .tk-nh__item strong { display:block; font-weight:var(--tk-fw-semibold); } .tk-nh__item p { margin:2px 0 0; color:var(--tk-c-text-muted); font-size:var(--tk-nfs-sm); }
  .tk-nh--cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); }
  .tk-nh--cards .tk-nh__item { flex-direction:column; align-items:flex-start; }
  .tk-nh__item .tk-grow { flex:1 1 150px; } .tk-nh--cards .tk-nh__item .tk-grow { flex:0 1 auto; }`,
  example: { data: {
    goals: { kcal: 2400, protein: 140, fiber: 30, water: 2500, trainingDays: ['Mo', 'Mi', 'Fr'] },
    diary: [{ id: 'a', date: '2026-11-24', meal: 'breakfast', kcal: 520, protein: 38, carbs: 56, fat: 15, fiber: 9 }],
    plan: [{ id: 'p', date: '2026-11-24', meal: 'dinner', status: 'planned', kcal: 636, protein: 39, carbs: 46, fat: 30 }],
    water: { entries: [{ id: 'w', date: '2026-11-24', time: '08:00', ml: 250 }] },
    foods: [{ id: 'f-skyr', name: 'Skyr natur', kcal: 63, protein: 11, carbs: 4, fat: 0.2, fav: true, portions: [{ label: 'Becher (150 g)', g: 150 }, { label: 'Schüssel (250 g)', g: 250 }] }],
  } },
  render: function NutritionHints({ props, data, setData, ctx }) {
    const goals = obj(data.goals), v = dayView(ctx, { goals, diary: arr(data.diary), plan: arr(data.plan) });
    if (props.quietEmpty && !arr(data.diary).length) return null;
    const iso = viewDay(ctx), waterMl = arr(obj(data.water).entries).filter((e) => e.date === iso).reduce((a, e) => a + e.ml, 0);
    const hour = ctx.today.getHours() + ctx.today.getMinutes() / 60;
    const hints = buildHints({ goals, entries: v.entries, plannedToday: v.plannedItems, waterMl, foods: arr(data.foods), hour, viewIsToday: v.isToday, trainingTomorrow: !!goals.trainingDays?.includes(wdOf(shiftDay(todayIso(ctx), 1))) && v.isToday }).slice(0, props.limit);
    const act = (h) => {
      const a = h.action; if (!a) return;
      ctx.emit(a.event, { id: h.id });
      if (a.event === 'hint.log') { const f = arr(data.foods).find((x) => x.id === a.foodId); if (f) logFood(ctx, setData, f, a.grams, suggestMeal(ctx)); }
      if (a.event === 'hint.water') { setData('water', (x) => ({ ...obj(x), entries: [...arr(obj(x).entries), { id: eid('w', ctx), date: iso, time: hhmm(ctx.today), ml: a.ml, vessel: 'Glas' }] })); ctx.toast(`+${a.ml} ml Wasser`); }
    };
    const body = !hints.length ? html`<${EmptyState} icon="sparkles" title="Alles im Fluss" text="Gerade gibt es nichts Besonderes. Weiter so, wie es sich gut anfühlt." />`
      : html`<div class=${`tk-nh ${props.style === 'cards' ? 'tk-nh--cards' : ''}`}>${hints.map((h) => html`<div class="tk-nh__item">${tintBox(h.tone === 'neutral' ? 'neutral' : h.tone, h.icon)}<div class="tk-grow" style="min-width:0"><strong>${h.title}</strong><p>${h.text}</p></div>
        ${h.action && html`<${Button} size="sm" variant=${h.tone === 'accent' ? 'primary' : 'default'} onClick=${() => act(h)}>${h.action.label}<//>`}</div>`)}</div>`;
    return props.framed ? html`<${Card} title=${props.title} icon="sparkles">${body}<//>` : body;
  },
};
export default [nutritionHints];
