// Ernährung: Mahlzeiten-Timeline – Tagebuch nach Mahlzeiten oder Uhrzeit, Summen, „+“ je Gruppe, geplante Punkte zum Abhaken.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Icon, Badge, EmptyState, Chip } from '../../ui.js';
import { MEALS, mealInfo, dayView, num, hhmm, eid, shiftDay, totals, dayLabel } from './_calc.js';
import { Stepper, NU_CSS, arr, tintBox } from './_ui.js';

const SCALE = ['kcal', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'salt'];
const fromPlan = (p, date, time, ctx) => ({ id: eid('e', ctx), date, meal: p.meal, time, foodId: p.foodId || null, recipeId: p.recipeId || null, name: p.label || 'Geplante Mahlzeit', amount: p.recipeId ? `${num(p.servings || 1, 1)} Portion` : p.grams ? `${num(p.grams)} g` : 'Schätzung', grams: p.grams || null, kcal: p.kcal || 0, protein: p.protein || 0, carbs: p.carbs || 0, fat: p.fat || 0, fiber: 0, sugar: 0, salt: 0, source: 'plan', planId: p.id });

export const mealTimeline = {
  id: 'meal-timeline',
  name: 'Mahlzeiten-Timeline',
  category: 'Ernährung',
  description: 'Das Tagebuch des Tages nach Mahlzeiten (oder Uhrzeit) mit Summen, „+“ je Gruppe, Bearbeiten, Kopieren und Löschen mit Rückgängig. Geplante Mahlzeiten stehen gedämpft dabei und lassen sich mit einem Tap als gegessen übernehmen.',
  version: '1.3',
  props: [
    { name: 'quietEmpty', label: 'Im Erststart (noch nichts erfasst) nichts anzeigen', type: 'boolean', default: false },
    { name: 'title', label: 'Titel', type: 'text', default: 'Mahlzeiten' },
    { name: 'grouping', label: 'Gruppierung', type: 'select', options: ['meal', 'time'], default: 'meal' },
    { name: 'density', label: 'Dichte', type: 'select', options: ['comfortable', 'compact'], default: 'comfortable' },
    { name: 'showMacros', label: 'Eiweiß je Eintrag', type: 'boolean', default: true },
    { name: 'showPlanned', label: 'Geplantes zeigen', type: 'boolean', default: true },
    { name: 'limit', label: 'Max. Einträge (Uhrzeit-Ansicht, 0 = alle)', type: 'number', default: 0 },
    { name: 'framed', label: 'In Karte', type: 'boolean', default: true },
  ],
  data: [
    { slot: 'diary', label: 'Tagebuch', default: 'diary', shape: '{id,date,meal,time?,name,amount,kcal,protein,carbs,fat}[]', required: true },
    { slot: 'plan', label: 'Wochenplan', default: 'plan', shape: '{id,date,meal,status,label,kcal,protein}[]', required: false },
  ],
  events: ['meal.add', 'entry.open', 'entry.update', 'entry.copy', 'entry.delete', 'entry.undo', 'plan.eat', 'copy.yesterday'],
  states: ['empty'],
  css: `${NU_CSS}
  .tk-mt { display:flex; flex-direction:column; min-width:0; }
  .tk-mt__group + .tk-mt__group { border-top:1px solid var(--tk-c-border); }
  .tk-mt__head { display:flex; align-items:center; gap:10px; padding:10px 0 6px; min-width:0; }
  .tk-mt__head h4 { margin:0; font-size:var(--tk-nfs-md); font-weight:var(--tk-fw-semibold); } .tk-mt__sum { margin-left:auto; text-align:right; font-variant-numeric:tabular-nums; font-size:var(--tk-nfs-sm); color:var(--tk-c-text-muted); }
  .tk-mt__row { display:flex; align-items:center; gap:10px; min-height:48px; padding:6px 0 6px 46px; min-width:0; width:100%; border:0; background:transparent; color:inherit; font:inherit; text-align:left; cursor:pointer; border-radius:var(--tk-radius-md); }
  .tk-mt__row:hover { background:var(--tk-c-surface2); } .tk-mt--compact .tk-mt__row { min-height:38px; padding-top:2px; padding-bottom:2px; }
  .tk-mt__row--plan { opacity:.9; } .tk-mt__row--plan .tk-mt__name { color:var(--tk-c-text-muted); }
  .tk-mt__name { font-weight:var(--tk-fw-medium); display:block; } .tk-mt__sub { font-size:var(--tk-nfs-sm); color:var(--tk-c-text-subtle); display:block; }
  .tk-mt__txt { min-width:0; } .tk-mt__txt > span { min-width:0; max-width:100%; }
  .tk-mt--compact .tk-mt__txt { display:flex; align-items:baseline; gap:8px; } .tk-mt--compact .tk-mt__name { flex:0 1 auto; } .tk-mt--compact .tk-mt__sub { flex:1 1 0; min-width:0; font-size:var(--tk-nfs-xs); }
  .bp-mobile .tk-mt--compact .tk-mt__txt { flex-direction:column; gap:0; } .bp-mobile .tk-mt--compact .tk-mt__sub { flex:none; }
  [data-tk-large-text] .tk-mt--compact .tk-mt__txt { flex-direction:column; gap:0; } [data-tk-large-text] .tk-mt--compact .tk-mt__sub { flex:none; } /* Nebenzeile nie auf 0 px gequetscht */
  .tk-mt__kcal { margin-left:auto; text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; flex:none; } .tk-mt__kcal small { display:block; font-size:var(--tk-nfs-xs); color:var(--tk-c-text-subtle); }
  .tk-mt__suggest { margin:2px 0 8px 46px; }
  .tk-mt__undo { display:flex; align-items:center; gap:10px; padding:8px 12px; border-radius:var(--tk-radius-md); background:var(--tk-c-surface2); border:1px solid var(--tk-c-border); margin-top:8px; font-size:var(--tk-nfs-sm); }
  .tk-mt__plus { flex:none; } .tk-mt__eat { flex:none; }
  .bp-mobile .tk-mt__row { min-height:52px; padding-left:46px; }
  [data-tk-large-text] .tk-mt__head { flex-wrap:wrap; row-gap:2px; } [data-tk-large-text] .tk-mt__head h4 { hyphens:manual; overflow-wrap:normal; } [data-tk-large-text] .tk-mt__row, [data-tk-large-text] .bp-mobile .tk-mt__row { padding-left:12px; } [data-tk-large-text] .tk-mt__suggest { margin-left:12px; }
  [data-tk-large-text] .tk-mt__row--plan { flex-wrap:wrap; row-gap:6px; } [data-tk-large-text] .tk-mt__row--plan > :first-child { flex:1 1 100%; } [data-tk-large-text] .tk-mt__row--plan .tk-mt__kcal { margin-left:0; text-align:left; flex:1 1 auto; } [data-tk-large-text] .tk-mt__row--plan .tk-mt__eat { margin-left:auto; }`,
  example: { data: {
    diary: [
      { id: 'a', date: '2026-11-24', meal: 'breakfast', time: '07:40', name: 'Skyr natur', amount: '250 g', grams: 250, unit: 'g', foodId: 'x', kcal: 158, protein: 27.5, carbs: 10, fat: 0.5 },
      { id: 'b', date: '2026-11-24', meal: 'lunch', name: 'Quiche mit Salat (geschätzt)', amount: 'Schätzung', kcal: 720, protein: 26, carbs: 52, fat: 44, prelogged: true },
    ],
    plan: [{ id: 'p', date: '2026-11-24', meal: 'dinner', status: 'planned', label: 'Lachs mit Ofengemüse', kcal: 636, protein: 39 }],
  } },
  render: function MealTimeline({ props, data, setData, ctx }) {
    const [undo, setUndo] = useState(null);
    const [all, setAll] = useState(false);
    const v = dayView(ctx, { goals: { kcal: 1 }, diary: arr(data.diary), plan: arr(data.plan) });
    const diary = arr(data.diary), plan = props.showPlanned ? v.plannedItems : [];
    if (props.quietEmpty && !diary.length && !arr(data.plan).length) return null;
    const allEmpty = !v.entries.length && !plan.length;
    const now = hhmm(ctx.today);
    const wrap = (b) => (props.framed ? html`<${Card} title=${props.title} icon="utensils" actions=${!v.isToday && html`<span class="tk-nu-meta">${dayLabel(v.iso)}</span>`}>${b}<//>` : b);

    const add = (meal) => ctx.emit('meal.add', { meal });
    const del = (e) => { setData('diary', (d) => arr(d).filter((x) => x.id !== e.id)); setUndo(e); ctx.emit('entry.delete', { id: e.id }); };
    const restore = () => { if (!undo) return; setData('diary', (d) => [...arr(d), undo]); ctx.emit('entry.undo', { id: undo.id }); setUndo(null); };
    const copy = (e, meal = e.meal) => { setData('diary', (d) => [...arr(d), { ...e, id: eid('e', ctx), meal, time: now, prelogged: false }]); ctx.emit('entry.copy', { id: e.id }); ctx.toast(`${e.name} kopiert`); };
    const update = (e, patch) => setData('diary', (d) => arr(d).map((x) => (x.id === e.id ? { ...x, ...patch } : x)));
    const eatPlan = (p) => { setData('diary', (d) => [...arr(d), fromPlan(p, v.iso, now, ctx)]); setData('plan', (pl) => arr(pl).map((x) => (x.id === p.id ? { ...x, status: 'done' } : x))); ctx.emit('plan.eat', { id: p.id }); ctx.toast(`${p.label} als gegessen übernommen`); };
    const yesterday = () => { const y = arr(diary).filter((e) => e.date === shiftDay(v.iso, -1) && !e.prelogged); if (!y.length) { ctx.toast('Gestern war nichts erfasst'); return; } setData('diary', (d) => [...arr(d), ...y.map((e) => ({ ...e, id: eid('e', ctx), date: v.iso, time: now }))]); ctx.emit('copy.yesterday', { count: y.length }); ctx.toast(`${y.length} Einträge von gestern übernommen`); };
    const lastFor = (meal) => [...diary].filter((e) => e.date < v.iso && e.meal === meal && e.foodId).sort((a, b) => (a.date < b.date ? 1 : -1))[0];

    const openEntry = (e) => {
      ctx.emit('entry.open', { id: e.id });
      ctx.openDialog({ title: e.name, body: (close) => html`<${EntrySheet} e=${e} close=${close} onUpdate=${update} onCopy=${copy} onDelete=${del} />` });
    };
    const Row = ({ e }) => html`<button type="button" class="tk-mt__row" onClick=${() => openEntry(e)} aria-label=${`${e.name}, ${num(e.kcal)} Kilokalorien, bearbeiten`}>
      <span class="tk-grow tk-mt__txt" style="min-width:0"><span class="tk-mt__name tk-truncate">${e.name}</span><span class="tk-mt__sub tk-truncate">${[e.amount, e.time, e.prelogged ? 'vorab erfasst' : null].filter(Boolean).join(' · ')}</span></span>
      <span class="tk-mt__kcal"><strong>${num(e.kcal)}</strong> kcal${props.showMacros && props.density !== 'compact' && html`<small>${num(e.protein, 1)} g E</small>`}</span></button>`;
    const PlanRow = ({ p }) => html`<div class="tk-mt__row tk-mt__row--plan" style="cursor:default"><span class="tk-grow" style="min-width:0"><span class="tk-mt__name" style="display:block">${p.label}</span><span class="tk-mt__sub">geplant${p.note ? ` · ${p.note}` : ''}</span></span>
      <span class="tk-mt__kcal">${num(p.kcal)} kcal</span><${Button} size="sm" class="tk-mt__eat" icon="check" onClick=${() => eatPlan(p)} aria-label=${`${p.label} als gegessen übernehmen`}>Gegessen<//></div>`;

    let body;
    if (allEmpty) body = html`<${EmptyState} icon="utensils" title="Noch nichts erfasst" text=${v.isToday ? 'Erfasse die erste Mahlzeit oder übernimm den Tag von gestern.' : 'Für diesen Tag gibt es keine Einträge.'} action=${html`<div class="tk-nu-btnrow" style="justify-content:center"><${Button} size="sm" variant="primary" icon="plus" onClick=${() => add(v.isToday ? 'breakfast' : 'snack')}>Erfassen<//><${Button} size="sm" icon="copy" onClick=${yesterday}>Wie gestern<//></div>`} />`;
    else if (props.grouping === 'time') {
      const sorted = [...v.entries].sort((a, b) => (a.time || '99') < (b.time || '99') ? -1 : 1);
      const cut = props.limit > 0 && !all && sorted.length > props.limit;
      const rows = cut ? sorted.slice(-props.limit) : sorted;
      body = html`<div class="tk-mt">${cut && html`<${Button} variant="ghost" size="sm" icon="chevron-up" onClick=${() => setAll(true)}>${sorted.length - rows.length} frühere Einträge zeigen<//>`}${rows.map((e) => html`<div class="tk-mt__group"><${Row} e=${e} /></div>`)}${plan.map((p) => html`<div class="tk-mt__group"><${PlanRow} p=${p} /></div>`)}</div>`;
    } else {
      body = html`<div class="tk-mt">${MEALS.map((m) => {
        const es = v.entries.filter((e) => e.meal === m.id), ps = plan.filter((p) => p.meal === m.id), t = totals(es), last = !es.length && !ps.length && v.isToday ? lastFor(m.id) : null;
        return html`<div class="tk-mt__group"><div class="tk-mt__head">${tintBox('accent', m.icon, 17)}<h4>${m.label}</h4>
          <span class="tk-mt__sum">${es.length ? `${num(t.kcal)} kcal` : ''}</span>
          <${Button} variant="ghost" size="sm" icon="plus" class="tk-mt__plus" aria-label=${`${m.label}: Eintrag hinzufügen`} onClick=${() => add(m.id)} /></div>
          ${es.map((e) => html`<${Row} e=${e} />`)}${ps.map((p) => html`<${PlanRow} p=${p} />`)}
          ${last && html`<div class="tk-mt__suggest"><${Chip} icon="history" onClick=${() => copy(last, m.id)}>Zuletzt: ${last.name} · ${last.amount}<//></div>`}</div>`;
      })}</div>`;
    }
    return wrap(html`<div class=${props.density === 'compact' ? 'tk-mt--compact' : ''}>${body}${undo && html`<div class="tk-mt__undo" role="status"><${Icon} name="trash-2" size=${15} /><span class="tk-grow tk-truncate">„${undo.name}“ entfernt</span><${Button} size="sm" variant="ghost" icon="undo-2" onClick=${restore}>Rückgängig<//></div>`}</div>`);
  },
};

function EntrySheet({ e, close, onUpdate, onCopy, onDelete }) {
  const [g, setG] = useState(e.grams || 0);
  const k = e.grams ? g / e.grams : 1;
  const preview = { kcal: Math.round(e.kcal * k), protein: Math.round(e.protein * k * 10) / 10, carbs: Math.round(e.carbs * k * 10) / 10, fat: Math.round(e.fat * k * 10) / 10 };
  const save = () => { const patch = {}; if (e.grams && g !== e.grams) { for (const key of SCALE) patch[key] = Math.round((Number(e[key]) || 0) * k * 100) / 100; patch.grams = g; patch.amount = `${num(g)} ${e.unit || 'g'}`; } onUpdate(e, patch); close(); };
  return html`<div style="display:flex;flex-direction:column;gap:14px">
    <div class="tk-nu-meta">${mealInfo(e.meal).label}${e.time ? ` · ${e.time}` : ''} · ${e.amount}</div>
    <div class="tk-row" style="gap:10px;flex-wrap:wrap"><span class="tk-nu-big">${num(preview.kcal)}</span><span class="tk-muted">kcal</span><${Badge}>E ${num(preview.protein, 1)} g<//><${Badge}>KH ${num(preview.carbs, 1)} g<//><${Badge}>F ${num(preview.fat, 1)} g<//></div>
    ${e.grams ? html`<${Stepper} value=${g} onChange=${setG} step=${10} min=${5} max=${2000} unit=${e.unit || 'g'} label="Menge" />` : html`<p class="tk-nu-meta" style="margin:0">Dieser Eintrag ist eine Schätzung. Die Mahlzeit kannst du über Kopieren neu zuordnen.</p>`}
    <div class="tk-nu-chips" role="group" aria-label="Mahlzeit ändern">${MEALS.map((m) => html`<${Chip} active=${e.meal === m.id} onClick=${() => { onUpdate(e, { meal: m.id }); close(); }}>${m.label}<//>`)}</div>
    <div class="tk-nu-btnrow"><${Button} variant="primary" icon="check" onClick=${save}>Speichern<//><${Button} icon="copy" onClick=${() => { onCopy(e); close(); }}>Kopieren<//><${Button} variant="danger" icon="trash-2" onClick=${() => { onDelete(e); close(); }}>Löschen<//></div></div>`;
}
export default [mealTimeline];
