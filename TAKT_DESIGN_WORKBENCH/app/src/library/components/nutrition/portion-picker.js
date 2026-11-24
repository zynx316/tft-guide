// Ernährung: Portions-Picker als Block – gewähltes Lebensmittel in Menge, Einheit und Mahlzeit anpassen, Live-Nährwerte.
import { html } from '../../../lib/html.js';
import { Card, EmptyState } from '../../ui.js';
import { PortionForm, PF_CSS, useLogMeal } from './_portion.js';
import { NU_CSS, arr } from './_ui.js';

export const portionPicker = {
  id: 'portion-picker',
  name: 'Portions-Picker',
  category: 'Ernährung',
  description: 'Menge wählen: Portionsgrößen als Chips, Stepper mit Dezimalkomma, Schnellwerte, Live-Kalorien und -Makros, Mahlzeit wechseln und mit einem Tap hinzufügen. Liest das Lebensmittel aus ctx.ui.selectedId; im Dialog wird dasselbe Formular genutzt.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Portion' },
    { name: 'defaultFood', label: 'Standard-Lebensmittel (ID)', type: 'text', default: '' },
  ],
  data: [{ slot: 'foods', label: 'Lebensmittel', default: 'foods', shape: '{id,name,kcal,protein,carbs,fat,portions[]}[]', required: true }, { slot: 'diary', label: 'Tagebuch', default: 'diary', shape: 'Einträge', required: true }],
  events: ['portion.confirm', 'food.pick'],
  states: ['empty'],
  css: `${NU_CSS}${PF_CSS}`,
  example: { data: { foods: [{ id: 'f-skyr', name: 'Skyr natur', brand: 'Arla', kcal: 63, protein: 11, carbs: 4, fat: 0.2, unit: 'g', portions: [{ label: 'Becher (150 g)', g: 150 }, { label: 'Schüssel (250 g)', g: 250 }], allergens: ['Milch'] }], diary: [] }, props: { defaultFood: 'f-skyr' } },
  render: function PortionPickerBlock({ props, data, setData, ctx }) {
    const foods = arr(data.foods), id = ctx.ui?.selectedId || props.defaultFood;
    const food = foods.find((f) => f.id === id) || (props.defaultFood ? null : null);
    const [meal] = useLogMeal(ctx);
    if (!food) return html`<${Card} title=${props.title}><${EmptyState} icon="scale" title="Noch nichts gewählt" text="Wähle in der Liste ein Lebensmittel, dann stellst du hier die Menge ein." /><//>`;
    return html`<${Card} title=${props.title} icon="scale"><${PortionForm} key=${food.id} food=${food} ctx=${ctx} setData=${setData} meal=${meal} /><//>`;
  },
};
export default [portionPicker];
