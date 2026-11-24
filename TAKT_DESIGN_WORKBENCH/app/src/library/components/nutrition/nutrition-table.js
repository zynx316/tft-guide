// Ernährung: Nährwert-Tabelle nach EU-Muster (je 100 g oder je Portion) mit Allergenen und Quellenhinweis.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Segmented, Badge, Button, EmptyState, Icon } from '../../ui.js';
import { num, kj, per } from './_calc.js';
import { openPortion } from './_portion.js';
import { NU_CSS, arr } from './_ui.js';

export const nutritionTable = {
  id: 'nutrition-table',
  name: 'Nährwert-Tabelle',
  category: 'Ernährung',
  description: 'Nährwerte eines Lebensmittels im EU-Muster: Brennwert in kJ und kcal, Fett (davon gesättigt), Kohlenhydrate (davon Zucker), Ballaststoffe, Eiweiß, Salz. Umschalter je 100 g oder je Portion, Allergene als Chips und ein Quellenhinweis.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Nährwerte' },
    { name: 'defaultFood', label: 'Standard-Lebensmittel (ID)', type: 'text', default: '' },
    { name: 'showLog', label: 'Erfassen-Button', type: 'boolean', default: true },
  ],
  data: [
    { slot: 'foods', label: 'Lebensmittel', default: 'foods', shape: '{id,name,kcal,protein,carbs,fat,fiber,sugar,satFat,salt,portions[],allergens[],source}[]', required: true },
    { slot: 'diary', label: 'Tagebuch', default: 'diary', shape: 'Einträge', required: false },
  ],
  events: ['nutrient.basis', 'food.pick', 'portion.confirm'],
  states: ['empty'],
  css: `${NU_CSS}
  .bp-desktop .tk-region--aside > .tk-block[data-component="nutrition-table"] { position:sticky; top:12px; align-self:start; }
  .tk-nt { display:flex; flex-direction:column; gap:var(--tk-space-4); min-width:0; }
  .tk-nt__tbl { width:100%; border-collapse:collapse; font-variant-numeric:tabular-nums; }
  .tk-nt__tbl th, .tk-nt__tbl td { padding:9px 4px; border-bottom:1px solid var(--tk-c-border); text-align:left; font-weight:var(--tk-fw-regular); } .tk-nt__tbl td { text-align:right; font-weight:var(--tk-fw-semibold); }
  .tk-nt__tbl tr.sub th { padding-left:18px; color:var(--tk-c-text-muted); font-size:var(--tk-nfs-sm); } .tk-nt__tbl tr.sub td { font-weight:var(--tk-fw-regular); color:var(--tk-c-text-muted); font-size:var(--tk-nfs-sm); }
  .tk-nt__tbl tr.top th, .tk-nt__tbl tr.top td { font-weight:var(--tk-fw-bold); border-top:2px solid var(--tk-c-text); } .tk-nt__tbl tr:last-child th, .tk-nt__tbl tr:last-child td { border-bottom:0; }
  .tk-nt__head { display:flex; gap:12px; align-items:flex-start; flex-wrap:wrap; } .tk-nt__head h3 { margin:0; font-size:var(--tk-nfs-xl); }
  .tk-nt__foot { font-size:var(--tk-nfs-xs); color:var(--tk-c-text-subtle); display:flex; gap:6px; align-items:flex-start; }`,
  example: { data: { foods: [{ id: 'f-skyr', name: 'Skyr natur', brand: 'Arla', category: 'Milch & Eier', kcal: 63, protein: 11, carbs: 4, fat: 0.2, fiber: 0, sugar: 4, satFat: 0.1, salt: 0.1, unit: 'g', portions: [{ label: 'Becher (150 g)', g: 150 }, { label: 'Schüssel (250 g)', g: 250 }], allergens: ['Milch'], source: 'Demo-Daten (Herstellerangabe, nicht verifiziert)' }], diary: [] }, props: { defaultFood: 'f-skyr' } },
  render: function NutritionTable({ props, data, setData, ctx }) {
    const foods = arr(data.foods);
    const food = foods.find((f) => f.id === (ctx.ui?.selectedId || props.defaultFood)) || foods.find((f) => f.id === props.defaultFood) || foods[0];
    const [basis, setBasis] = useState('100');
    const [pi, setPi] = useState(0);
    if (!food) return html`<${Card} title=${props.title}><${EmptyState} icon="list" title="Kein Lebensmittel gewählt" text="Wähle in der Liste ein Lebensmittel, um die Nährwerte zu sehen." /><//>`;
    const portion = food.portions?.[Math.min(pi, (food.portions?.length || 1) - 1)];
    const g = basis === '100' ? 100 : portion?.g || 100, unit = food.unit === 'ml' ? 'ml' : 'g';
    const n = per(food, g);
    const sw = (b) => { setBasis(b); ctx.emit('nutrient.basis', { basis: b }); };
    const Row = ({ k, v, cls = '' }) => html`<tr class=${cls}><th scope="row">${k}</th><td>${v}</td></tr>`;
    return html`<${Card} title=${props.title} icon="list"><div class="tk-nt">
      <div class="tk-nt__head"><div class="tk-grow" style="min-width:0"><h3>${food.name}</h3><div class="tk-nu-meta">${[food.brand, food.category].filter(Boolean).join(' · ')}</div></div>
        <${Segmented} value=${basis} onChange=${sw} label="Bezugsgröße" options=${[{ value: '100', label: `je 100 ${unit}` }, { value: 'p', label: 'je Portion' }]} /></div>
      ${basis === 'p' && (food.portions?.length || 0) > 1 && html`<div class="tk-nu-chips" role="group" aria-label="Portion">${food.portions.map((p, i) => html`<button type="button" class="tk-chip" aria-pressed=${String(i === pi)} onClick=${() => setPi(i)}>${p.label}</button>`)}</div>`}
      <table class="tk-nt__tbl" aria-label=${`Nährwerte ${food.name} je ${g} ${unit}`}><tbody>
        <${Row} cls="top" k=${`Brennwert (je ${num(g)} ${unit})`} v=${`${num(kj(n.kcal))} kJ / ${num(n.kcal)} kcal`} />
        <${Row} k="Fett" v=${`${num(n.fat, 1)} g`} /><${Row} cls="sub" k="davon gesättigte Fettsäuren" v=${`${num(n.satFat, 1)} g`} />
        <${Row} k="Kohlenhydrate" v=${`${num(n.carbs, 1)} g`} /><${Row} cls="sub" k="davon Zucker" v=${`${num(n.sugar, 1)} g`} />
        <${Row} k="Ballaststoffe" v=${`${num(n.fiber, 1)} g`} /><${Row} k="Eiweiß" v=${`${num(n.protein, 1)} g`} /><${Row} k="Salz" v=${`${num(n.salt, 2)} g`} /></tbody></table>
      <div class="tk-nu-chips" aria-label="Allergene">${(food.allergens || []).length ? food.allergens.map((a) => html`<${Badge} tone="warning" icon="alert-triangle">${a}<//>`) : html`<span class="tk-nu-meta">Keine der 14 Hauptallergene hinterlegt.</span>`}</div>
      <div class="tk-nt__foot"><${Icon} name="info" size=${13} /><span>${food.source || 'Eigene Angabe'}. Angaben ohne Gewähr. Prüfe das Etikett.</span></div>
      ${props.showLog && html`<${Button} variant="primary" icon="plus" onClick=${() => openPortion(ctx, setData, food, { grams: portion?.g })}>Erfassen<//>`}</div><//>`;
  },
};
export default [nutritionTable];
