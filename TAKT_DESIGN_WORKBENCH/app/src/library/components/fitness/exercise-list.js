// Fitness: Übungsbibliothek als Liste oder Kartenraster mit Suche und Filtern (Muskelgruppe × Equipment × Favoriten).
import { html } from '../../../lib/html.js';
import { Card, Chip, Badge, Icon, Search, Button, EmptyState } from '../../ui.js';
import { MUSCLES, EQUIPMENT, exerciseSeries, e1rm, numAuto } from './_calc.js';
import { muscleColor, FIT_CSS } from './_ui.js';

const norm = (s) => String(s || '').toLowerCase();
export const filterExercises = (items, ui = {}) => {
  const q = norm(ui.query).trim(); const m = ui.filter && !/^alle?$/i.test(ui.filter) ? ui.filter : null;
  return (items || []).filter((e) => (!m || e.muscle === m) && (!ui.equip || e.equipment === ui.equip) && (!ui.favs || e.favorite)
    && (!q || [e.name, e.muscle, e.equipment, e.type, ...(e.secondary || [])].some((t) => norm(t).includes(q))));
};

function Card1({ e, best, onOpen, onFav }) {
  return html`<div class="tk-exl__card" role="button" tabindex="0" onClick=${onOpen} onKeyDown=${(k) => k.key === 'Enter' && onOpen()} aria-label=${`${e.name} öffnen`}>
    <div class="tk-exl__cover" style=${`color:${muscleColor(e.muscle)};background:color-mix(in srgb, ${muscleColor(e.muscle)} 14%, transparent)`}><${Icon} name=${{ Körpergewicht: 'person-standing', Kabel: 'link-2', Maschine: 'settings-2' }[e.equipment] || 'dumbbell'} size=${30} />
      <button type="button" class="tk-exl__star" aria-pressed=${String(!!e.favorite)} aria-label=${`${e.name} ${e.favorite ? 'aus Favoriten entfernen' : 'als Favorit markieren'}`} onClick=${(k) => { k.stopPropagation(); onFav(); }}><${Icon} name="star" size=${18} /></button></div>
    <div class="tk-exl__body"><div class="tk-exl__name">${e.name}</div><div class="tk-fit-chips"><${Badge}>${e.muscle}<//><${Badge}>${e.equipment}<//></div>
      <div class="tk-subtle" style="font-size:var(--tk-fs-sm)">${best != null ? `Bestwert ${e.unit === 'kg' ? `${numAuto(best, 1)} kg (1RM)` : e.unit === 's' ? `${best} s` : `${best} Wdh.`}` : `${e.type} · ${e.level}`}</div></div></div>`;
}

export const exerciseList = {
  id: 'exercise-list',
  name: 'Übungsliste',
  category: 'Fitness',
  description: 'Übungsbibliothek mit Suche und Filtern (Muskelgruppe, Equipment, Favoriten) als dichte Liste oder Kartenraster. Antippen öffnet die Übung (exercise.open), der Stern markiert Favoriten.',
  version: '1.0',
  props: [
    { name: 'view', label: 'Darstellung', type: 'select', options: ['list', 'grid'], default: 'list' },
    { name: 'title', label: 'Titel', type: 'text', default: 'Übungen' },
    { name: 'showFilters', label: 'Filter zeigen', type: 'boolean', default: true },
    { name: 'limit', label: 'Max. Einträge (0 = alle)', type: 'number', default: 0 },
  ],
  data: [
    { slot: 'items', label: 'Übungen', default: 'library', shape: '{id,name,muscle,secondary,equipment,type,level,unit,favorite}[]', required: true },
    { slot: 'history', label: 'Verlauf (für Bestwerte)', default: 'history', shape: 'Einheiten[]' },
  ],
  events: ['exercise.open', 'exercise.favorite', 'filter.change', 'search.input'],
  states: ['empty'],
  css: `
  .tk-exl__filters { display:flex; flex-direction:column; gap:var(--tk-space-2); margin-bottom:var(--tk-space-3); } .tk-exl__chips { display:flex; gap:var(--tk-space-2); overflow-x:auto; scrollbar-width:none; padding-bottom:2px; } .tk-exl__chips > * { flex:none; }
  .tk-exl__row { display:flex; align-items:center; gap:var(--tk-space-3); padding:6px var(--tk-space-3) 6px var(--tk-space-4); min-height:56px; border-bottom:1px solid var(--tk-c-border); cursor:pointer; min-width:0; } .tk-exl__row:last-child { border-bottom:0; } .tk-exl__row:hover { background:var(--tk-c-surface2); }
  .tk-exl__ico { width:34px; height:34px; border-radius:10px; display:grid; place-items:center; flex:none; } .tk-exl__name { font-weight:var(--tk-fw-semibold); overflow-wrap:anywhere; }
  .tk-exl__star { border:0; background:none; color:var(--tk-c-text-subtle); width:40px; height:40px; display:grid; place-items:center; cursor:pointer; border-radius:50%; flex:none; } .tk-exl__star[aria-pressed="true"] { color:var(--tk-c-warning); } .tk-exl__star[aria-pressed="true"] svg { fill:currentColor; }
  .tk-exl__grid { display:grid; gap:var(--tk-space-3); grid-template-columns:repeat(auto-fill, minmax(min(100%, 210px), 1fr)); }
  .tk-exl__card { display:flex; flex-direction:column; background:var(--tk-c-surface); border:1px solid var(--tk-c-border); border-radius:var(--tk-radius-lg); overflow:hidden; cursor:pointer; min-width:0; } .tk-exl__card:hover { border-color:var(--tk-c-border-strong); }
  .tk-exl__cover { height:84px; display:grid; place-items:center; position:relative; } .tk-exl__cover .tk-exl__star { position:absolute; top:4px; right:4px; } .tk-exl__body { padding:var(--tk-space-3); display:flex; flex-direction:column; gap:8px; min-width:0; }
  .bp-mobile .tk-exl__grid { grid-template-columns:repeat(2, minmax(0,1fr)); gap:var(--tk-space-2); }`,
  example: { props: { title: 'Übungen' }, data: { items: [
    { id: 'bankdruecken', name: 'Bankdrücken', muscle: 'Brust', secondary: ['Trizeps'], equipment: 'Langhantel', type: 'Verbund', level: 'Mittel', unit: 'kg', favorite: true },
    { id: 'latziehen', name: 'Latziehen', muscle: 'Rücken', secondary: ['Bizeps'], equipment: 'Kabel', type: 'Verbund', level: 'Anfänger', unit: 'kg', favorite: false },
    { id: 'plank', name: 'Unterarmstütz (Plank)', muscle: 'Core', secondary: [], equipment: 'Körpergewicht', type: 'Isolation', level: 'Anfänger', unit: 's', favorite: false }], history: [] } },
  render: function ExerciseList({ props, data, setData, ctx }) {
    const all = data.items || [];
    const rows = filterExercises(all, ctx.ui); const shown = props.limit > 0 ? rows.slice(0, props.limit) : rows;
    const bestOf1 = (e) => { const s = exerciseSeries(data.history || [], e.id); if (!s.length) return null; return Math.max(...s.map((x) => (e.unit === 'kg' ? x.e1rm ?? 0 : x.reps))); };
    const open = (e) => { ctx.setUi('selectedId', e.id); ctx.emit('exercise.open', { id: e.id }); };
    const fav = (e) => { setData('items', (a) => a.map((x) => (x.id === e.id ? { ...x, favorite: !x.favorite } : x))); ctx.emit('exercise.favorite', { id: e.id, favorite: !e.favorite }); };
    const set = (k, v) => { ctx.setUi(k, v); ctx.emit('filter.change', { [k]: v }); };
    const muscle = ctx.ui.filter && !/^alle?$/i.test(ctx.ui.filter) ? ctx.ui.filter : 'Alle';
    const reset = () => { ctx.setUi('filter', 'Alle'); ctx.setUi('equip', null); ctx.setUi('favs', false); ctx.setUi('query', ''); };
    const filters = props.showFilters && html`<div class="tk-exl__filters"><${Search} value=${ctx.ui.query || ''} placeholder="Übung oder Muskel suchen …" onInput=${(v) => { ctx.setUi('query', v); ctx.emit('search.input', { query: v }); }} />
      <div class="tk-exl__chips" role="group" aria-label="Muskelgruppe">${['Alle', ...MUSCLES].map((m) => html`<${Chip} active=${muscle === m} onClick=${() => set('filter', m)}>${m}<//>`)}</div>
      <div class="tk-exl__chips" role="group" aria-label="Equipment"><${Chip} icon="star" active=${!!ctx.ui.favs} onClick=${() => set('favs', !ctx.ui.favs)}>Favoriten<//>${EQUIPMENT.map((q) => html`<${Chip} active=${ctx.ui.equip === q} onClick=${() => set('equip', ctx.ui.equip === q ? null : q)}>${q}<//>`)}</div></div>`;
    const empty = html`<${EmptyState} icon="search" title=${all.length ? 'Keine Treffer' : 'Noch keine Übungen'} text=${all.length ? 'Mit diesen Filtern gibt es keine Übung. Versuche einen anderen Muskel oder Gerätetyp.' : 'Lege deine erste eigene Übung an.'} action=${all.length ? html`<${Button} size="sm" onClick=${reset}>Filter zurücksetzen<//>` : null} />`;
    const star = (e) => html`<button type="button" class="tk-exl__star" aria-pressed=${String(!!e.favorite)} aria-label=${`${e.name} ${e.favorite ? 'aus Favoriten entfernen' : 'als Favorit markieren'}`} onClick=${(k) => { k.stopPropagation(); fav(e); }}><${Icon} name="star" size=${18} /></button>`;
    const body = !shown.length ? empty : props.view === 'grid'
      ? html`<div class="tk-exl__grid">${shown.map((e) => html`<${Card1} e=${e} best=${bestOf1(e)} onOpen=${() => open(e)} onFav=${() => fav(e)} />`)}</div>`
      : html`<div style="margin:0 calc(var(--tk-space-4) * -1)">${shown.map((e) => html`<div class="tk-exl__row" role="button" tabindex="0" onClick=${() => open(e)} onKeyDown=${(k) => k.key === 'Enter' && open(e)} aria-label=${`${e.name} öffnen`}>
        <span class="tk-exl__ico" style=${`color:${muscleColor(e.muscle)};background:color-mix(in srgb, ${muscleColor(e.muscle)} 15%, transparent)`}><${Icon} name="dumbbell" size=${17} /></span>
        <div class="tk-grow"><div class="tk-exl__name tk-truncate">${e.name}</div><div class="tk-subtle tk-truncate" style="font-size:var(--tk-fs-sm)">${e.muscle} · ${e.equipment} · ${e.type}</div></div>${star(e)}<span class="tk-subtle"><${Icon} name="chevron-right" size=${16} /></span></div>`)}</div>`;
    return html`<${Card} title=${props.title} actions=${html`<${Badge}>${rows.length}<//>`}>${filters}${body}<//>`;
  },
};
export default [exerciseList];
