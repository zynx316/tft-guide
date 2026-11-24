// Ernährung: Eigenes Lebensmittel anlegen – mit Plausibilitätsprüfung (kcal gegen Makros), Portion und Duplikat-Hinweis.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Field, Input, Select, Icon } from '../../ui.js';
import { plausibility, num, r1 } from './_calc.js';
import { NU_CSS, arr } from './_ui.js';

const CATS = ['Obst & Gemüse', 'Milch & Eier', 'Fleisch & Fisch', 'Pflanzlich', 'Hülsenfrüchte', 'Getreide & Brot', 'Nüsse & Öle', 'Süßes & Snacks', 'Konserven', 'Getränke', 'Eiweiß & Supplements'];
const toNum = (v) => { const n = parseFloat(String(v ?? '').replace(',', '.')); return Number.isFinite(n) ? n : null; };

export const foodForm = {
  id: 'food-form',
  name: 'Eigenes Lebensmittel',
  category: 'Ernährung',
  description: 'Formular für ein eigenes Lebensmittel (Werte je 100 g) mit Portionsangabe. Warnt freundlich, wenn Kalorien und Makros mehr als etwa 20 % auseinanderliegen, und weist auf mögliche Duplikate hin.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Eigenes Lebensmittel' },
    { name: 'framed', label: 'In Karte', type: 'boolean', default: true },
  ],
  data: [{ slot: 'foods', label: 'Lebensmittel', default: 'foods', shape: '{id,name,kcal,protein,carbs,fat}[]', required: true }],
  events: ['food.create', 'form.invalid'],
  states: ['empty'],
  css: `${NU_CSS}
  .tk-ff { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:var(--tk-space-3) var(--tk-space-4); } .tk-ff__full { grid-column:1 / -1; }
  .tk-ff__warn { display:flex; gap:10px; padding:10px 12px; border-radius:var(--tk-radius-md); background:var(--tk-c-warning-soft); color:var(--tk-c-text); font-size:var(--tk-nfs-sm); align-items:flex-start; }
  .tk-ff__warn .icon { color:var(--tk-c-warning); flex:none; margin-top:1px; }
  .bp-mobile .tk-ff { grid-template-columns:1fr 1fr; }`,
  example: { data: { foods: [{ id: 'a', name: 'Skyr natur', kcal: 63, protein: 11, carbs: 4, fat: 0.2 }] } },
  render: function FoodForm({ props, data, setData, ctx }) {
    const foods = arr(data.foods);
    const [f, setF] = useState({ name: ctx.ui?.query || '', brand: '', category: CATS[0], kcal: '', protein: '', carbs: '', fat: '', fiber: '', sugar: '', salt: '', portion: '', portionG: '' });
    const [err, setErr] = useState({});
    const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
    const kcal = toNum(f.kcal), p = toNum(f.protein), c = toNum(f.carbs), fa = toNum(f.fat);
    const ready = kcal != null && p != null && c != null && fa != null;
    const dev = ready ? plausibility({ kcal, protein: p, carbs: c, fat: fa, fiber: toNum(f.fiber) || 0 }) : 0;
    const calc = ready ? Math.round(4 * p + 4 * c + 9 * fa + 2 * (toNum(f.fiber) || 0)) : 0;
    const dup = f.name.trim().length > 2 && foods.find((x) => x.name.toLowerCase() === f.name.trim().toLowerCase());
    const submit = () => {
      const e = {};
      if (!f.name.trim()) e.name = 'Bitte einen Namen eingeben.';
      if (kcal == null || kcal < 0) e.kcal = 'Kalorien je 100 g fehlen.';
      for (const [k, v] of [['protein', p], ['carbs', c], ['fat', fa]]) if (v == null || v < 0) e[k] = 'Wert fehlt.';
      if (kcal > 900) e.kcal = 'Mehr als 900 kcal je 100 g ist nicht möglich.';
      setErr(e);
      if (Object.keys(e).length) { ctx.emit('form.invalid', { fields: Object.keys(e) }); return; }
      const g = toNum(f.portionG) || 100;
      const food = { id: ctx.newId('f-own'), name: f.name.trim(), brand: f.brand.trim() || null, category: f.category, kcal: Math.round(kcal), protein: r1(p), carbs: r1(c), fat: r1(fa), fiber: toNum(f.fiber) || 0, sugar: toNum(f.sugar) || 0, satFat: 0, salt: toNum(f.salt) || 0, unit: 'g', portions: [{ label: f.portion.trim() ? `${f.portion.trim()} (${num(g)} g)` : `Portion (${num(g)} g)`, g }, { label: '100 g', g: 100 }], allergens: [], tags: [], fav: false, custom: true, piece: null, eur100: 0.5, barcode: null, source: 'Eigene Angabe' };
      setData('foods', (l) => [...arr(l), food]); ctx.emit('food.create', { id: food.id }); ctx.toast(`„${food.name}“ gespeichert`); ctx.setUi('selectedId', food.id);
      setF((x) => ({ ...x, name: '', brand: '', kcal: '', protein: '', carbs: '', fat: '', fiber: '', sugar: '', salt: '', portion: '', portionG: '' }));
    };
    const F2 = (k, label, ph, hint) => html`<${Field} label=${label} error=${err[k]} hint=${hint}><${Input} value=${f[k]} onInput=${set(k)} inputmode="decimal" placeholder=${ph} invalid=${!!err[k]} /><//>`;
    const body = html`<div class="tk-ff">
      <div class="tk-ff__full"><${Field} label="Name" error=${err.name}><${Input} value=${f.name} onInput=${set('name')} placeholder="z. B. Meine Granola-Mischung" invalid=${!!err.name} maxlength="60" /><//></div>
      ${dup && html`<div class="tk-ff__full tk-ff__warn" role="status"><${Icon} name="info" size=${16} /><span>„${dup.name}“ gibt es schon. Du kannst es trotzdem anlegen, zum Beispiel für eine andere Marke.</span></div>`}
      <${Field} label="Marke (optional)"><${Input} value=${f.brand} onInput=${set('brand')} /><//><${Field} label="Kategorie"><${Select} value=${f.category} onChange=${set('category')} options=${CATS} /><//>
      ${F2('kcal', 'Kalorien je 100 g', 'kcal')}${F2('protein', 'Eiweiß (g)', '0')}${F2('carbs', 'Kohlenhydrate (g)', '0')}${F2('fat', 'Fett (g)', '0')}
      ${F2('fiber', 'Ballaststoffe (g)', 'optional')}${F2('sugar', 'Zucker (g)', 'optional')}${F2('salt', 'Salz (g)', 'optional')}<div></div>
      ${F2('portion', 'Portion benennen', 'z. B. 1 Schüssel')}${F2('portionG', 'Portion in g', '100')}
      ${dev > 0.2 && ready && html`<div class="tk-ff__full tk-ff__warn" role="status"><${Icon} name="alert-triangle" size=${16} /><span>Eiweiß, Kohlenhydrate und Fett ergeben etwa <strong>${num(calc)} kcal</strong>, du hast <strong>${num(kcal)} kcal</strong> eingegeben. Bitte die Werte vom Etikett noch einmal prüfen.</span></div>`}
      <div class="tk-ff__full"><${Button} variant="primary" icon="plus" onClick=${submit}>Lebensmittel speichern<//></div></div>`;
    return props.framed ? html`<${Card} title=${props.title} icon="plus">${body}<//>` : body;
  },
};
export default [foodForm];
