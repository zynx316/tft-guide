// Ernährung: Schnell-Kalorien – nur kcal (optional Makros) erfassen, wenn Suchen zu lange dauert.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Chip, Input, Field } from '../../ui.js';
import { num } from './_calc.js';
import { logQuick, MealChips, useLogMeal } from './_portion.js';
import { Stepper, NU_CSS } from './_ui.js';

export const quickKcal = {
  id: 'quick-kcal',
  name: 'Schnell-Kalorien',
  category: 'Ernährung',
  description: 'Erfasst eine Schätzung mit höchstens drei Eingaben: Kalorien (Stepper oder Schnellwert), optional Name und Makros. Für Restaurant, Kantine und alles ohne Etikett.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Schnell-Kalorien' },
    { name: 'presets', label: 'Schnellwerte (kcal)', type: 'list', default: ['150', '300', '500', '800'] },
    { name: 'showMacros', label: 'Makros anbieten', type: 'boolean', default: true },
    { name: 'framed', label: 'In Karte', type: 'boolean', default: true },
  ],
  data: [{ slot: 'diary', label: 'Tagebuch', default: 'diary', shape: 'Einträge', required: true }],
  events: ['quickkcal.submit', 'portion.confirm'],
  states: ['empty'],
  css: `${NU_CSS}
  .tk-qk__more { white-space:normal; height:auto; min-height:var(--tk-size-touch); text-align:left; }
  .tk-qk { display:flex; flex-direction:column; gap:var(--tk-space-4); min-width:0; }
  .tk-qk__macros { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; } .tk-qk__macros .tk-nu-step { width:100%; } .tk-qk__macros .tk-nu-step__field { min-width:0; flex:1; padding:0 4px; } .tk-qk__macros input { width:100% !important; } .tk-qk__macros .tk-nu-step > button { width:32px; }
  .bp-mobile .tk-qk__macros { grid-template-columns:1fr; } .bp-mobile .tk-qk__macros .tk-nu-step > button { width:var(--tk-size-touch); }`,
  example: { data: { diary: [] } },
  render: function QuickKcal({ props, setData, ctx }) {
    const [kcal, setKcal] = useState(300), [name, setName] = useState(''), [open, setOpen] = useState(false);
    const [p, setP] = useState(0), [c, setC] = useState(0), [f, setF] = useState(0);
    const [meal, setMeal] = useLogMeal(ctx);
    const presets = (Array.isArray(props.presets) ? props.presets : String(props.presets).split(',')).map(Number).filter(Boolean);
    const submit = () => { logQuick(ctx, setData, { name: name.trim() || 'Schnell erfasst', kcal, protein: p, carbs: c, fat: f, meal }); ctx.emit('quickkcal.submit', { kcal, meal }); setName(''); setKcal(300); setP(0); setC(0); setF(0); setOpen(false); };
    const body = html`<div class="tk-qk"><div class="tk-nu-chips" role="group" aria-label="Schnellwerte">${presets.map((q) => html`<${Chip} active=${kcal === q} onClick=${() => setKcal(q)}>${num(q)} kcal<//>`)}</div>
      <${Stepper} value=${kcal} onChange=${setKcal} step=${50} min=${10} max=${5000} unit="kcal" label="Kalorien" />
      <${Field} label="Name (optional)"><${Input} value=${name} onInput=${setName} placeholder="z. B. Kantine, Pizza-Stück" maxlength="60" /><//>
      <${MealChips} value=${meal} onChange=${setMeal} />
      ${props.showMacros && html`<div><${Button} variant="ghost" size="sm" class="tk-qk__more" iconRight=${open ? 'chevron-up' : 'chevron-down'} onClick=${() => setOpen(!open)} aria-expanded=${String(open)}>Makros ergänzen (optional)<//>
        ${open && html`<div class="tk-qk__macros" style="margin-top:8px"><div><div class="tk-nu-meta">Eiweiß</div><${Stepper} value=${p} onChange=${setP} step=${5} unit="g" label="Eiweiß" /></div><div><div class="tk-nu-meta">Kohlenhydrate</div><${Stepper} value=${c} onChange=${setC} step=${5} unit="g" label="Kohlenhydrate" /></div><div><div class="tk-nu-meta">Fett</div><${Stepper} value=${f} onChange=${setF} step=${5} unit="g" label="Fett" /></div></div>`}</div>`}
      <${Button} variant="primary" icon="plus" onClick=${submit} style="justify-content:center">Erfassen · ${num(kcal)} kcal<//></div>`;
    return props.framed ? html`<${Card} title=${props.title} icon="zap">${body}<//>` : body;
  },
};
export default [quickKcal];
