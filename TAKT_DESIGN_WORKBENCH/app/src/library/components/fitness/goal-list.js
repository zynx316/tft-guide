// Fitness: Wochen- und Langzeitziele mit ruhigem Fortschritt (ohne Warnfarben), Vorschläge zum Hinzufügen.
import { html } from '../../../lib/html.js';
import { Card, Badge, Button, Icon, Progress, EmptyState } from '../../ui.js';
import { num } from './_calc.js';
import { FIT_CSS } from './_ui.js';

const SUGGEST = [{ id: 'g-mob', label: 'Beweglichkeit', target: 2, unit: 'Einheiten', icon: 'person-standing', hint: 'pro Woche' }, { id: 'g-sleep', label: 'Schlaf ab 7 Std.', target: 5, unit: 'Nächte', icon: 'bed', hint: 'pro Woche' }, { id: 'g-walk', label: 'Spaziergang', target: 3, unit: 'Mal', icon: 'footprints', hint: 'pro Woche' }];

export const goalList = {
  id: 'goal-list',
  name: 'Zielliste',
  category: 'Fitness',
  description: 'Wochenziele und Langzeitziele mit Fortschrittsbalken in ruhigen Farben (kein Rot bei Überschreitung). Ziel antippen öffnet das Detail, „Ziel hinzufügen“ bietet Vorschläge.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Ziele' },
    { name: 'showAdd', label: 'Ziel hinzufügen', type: 'boolean', default: true },
  ],
  data: [{ slot: 'items', label: 'Ziele', default: 'goals', shape: '{id,label,value,target,unit,icon,hint,decimals?}[]', required: true }],
  events: ['goal.open', 'goal.add'],
  states: ['empty'],
  css: `
  .tk-gl { display:flex; flex-direction:column; } .tk-gl__row { display:flex; flex-direction:column; gap:8px; padding:12px 0; border:0; border-bottom:1px solid var(--tk-c-border); background:none; color:inherit; cursor:pointer; text-align:left; width:100%; min-height:60px; } .tk-gl__row:last-child { border-bottom:0; }
  .tk-gl__top { display:flex; align-items:center; gap:10px; min-width:0; } .tk-gl__ico { width:32px; height:32px; border-radius:10px; display:grid; place-items:center; background:var(--tk-c-accent-soft); color:var(--tk-c-accent); flex:none; } .tk-gl__row[data-done="true"] .tk-gl__ico { background:var(--tk-c-success-soft); color:var(--tk-c-success); }`,
  example: { data: { items: [{ id: 'g1', label: 'Krafttraining', value: 1, target: 3, unit: 'Einheiten', icon: 'dumbbell', hint: 'diese Woche' }, { id: 'g2', label: 'Schritte Ø 7 Tage', value: 8400, target: 9000, unit: 'Schritte', icon: 'person-standing', hint: 'Tagesziel flexibel' }, { id: 'g3', label: 'Gewichtstrend', value: 1.5, target: 3, unit: 'kg', icon: 'scale', hint: 'Ziel 77 kg', decimals: 1 }] } },
  render: function GoalList({ props, data, setData, ctx }) {
    const items = data.items || [];
    const add = () => ctx.openDialog({ title: 'Ziel hinzufügen', body: (close) => html`<div class="tk-col" style="gap:8px"><p class="tk-muted" style="font-size:var(--tk-fs-sm)">Kleine, gut erreichbare Ziele halten dich eher dabei als große.</p>${SUGGEST.filter((s) => !items.some((i) => i.id === s.id)).map((s) => html`<button type="button" class="tk-sl-alt" onClick=${() => { setData('items', (a) => [...a, { ...s, value: 0 }]); ctx.emit('goal.add', { id: s.id }); ctx.toast(`Ziel „${s.label}“ hinzugefügt`); close(); }}><${Icon} name=${s.icon} size=${18} /><span class="tk-grow" style="text-align:left;font-weight:600">${s.label}</span><span class="tk-subtle">${s.target} ${s.unit}</span></button>`)}</div>`, footer: (close) => html`<${Button} onClick=${close}>Schließen<//>` });
    return html`<${Card} title=${props.title} icon="target" actions=${props.showAdd && html`<${Button} size="sm" icon="plus" onClick=${add}>Ziel<//>`}>
      ${!items.length ? html`<${EmptyState} icon="target" title="Noch keine Ziele" text="Starte mit einem Wochenziel, zum Beispiel drei Trainingseinheiten." action=${html`<${Button} size="sm" onClick=${add}>Vorschläge ansehen<//>`} />`
        : html`<div class="tk-gl">${items.map((g) => { const r = g.target ? g.value / g.target : 0; const done = r >= 1; return html`<button type="button" class="tk-gl__row" data-done=${String(done)} onClick=${() => { ctx.setUi('selectedId', g.id); ctx.emit('goal.open', { id: g.id }); }} aria-label=${`${g.label}: ${num(g.value, g.decimals || 0)} von ${num(g.target, g.decimals || 0)} ${g.unit}`}>
          <span class="tk-gl__top"><span class="tk-gl__ico"><${Icon} name=${done ? 'check' : g.icon} size=${16} /></span><span class="tk-grow tk-truncate" style="font-weight:600">${g.label}</span><span class="tk-num"><strong>${num(g.value, g.decimals || 0)}</strong><span class="tk-subtle"> / ${num(g.target, g.decimals || 0)} ${g.unit}</span></span></span>
          <${Progress} value=${Math.min(r, 1)} tone=${done ? 'success' : undefined} />${g.hint && html`<span class="tk-subtle" style="font-size:var(--tk-fs-xs)">${g.hint}${done ? ' · erreicht' : ''}</span>`}</button>`; })}</div>`}<//>`;
  },
};
export default [goalList];
