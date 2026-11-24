// Ernährung: Einladung im Erststart – noch nichts erfasst, genau eine Aktion („Erste Mahlzeit erfassen“), drei Darstellungen.
// Sobald Tagebuch oder Verlauf einen Eintrag enthalten, bleibt die Komponente unsichtbar.
import { html } from '../../../lib/html.js';
import { Card, Button, Icon } from '../../ui.js';
import { num } from './_calc.js';
import { NU_CSS, arr, obj } from './_ui.js';

const MODES = ['compact', 'hero', 'step'];

export const startInvite = {
  id: 'nut-start-invite',
  name: 'Erststart-Einladung (Ernährung)',
  category: 'Ernährung',
  description: 'Leerzustand der Ernährungs-Übersicht: eine klare Einladung mit genau einer Aktion „Erste Mahlzeit erfassen“ (öffnet Erfassen) und dem schon vorhandenen Tagesziel als Orientierung. Kompakt als Zeile, groß mit Illustration oder als nächster Schritt. Mit Tagebuch- oder Verlaufseinträgen unsichtbar.',
  version: '1.0',
  props: [
    { name: 'mode', label: 'Darstellung', type: 'select', options: MODES, default: 'compact' },
    { name: 'title', label: 'Titel', type: 'text', default: 'Noch nichts erfasst' },
    { name: 'text', label: 'Text (leer = Standardtext mit Tagesziel)', type: 'textarea', default: '' },
    { name: 'ctaLabel', label: 'Beschriftung der Aktion', type: 'text', default: 'Erste Mahlzeit erfassen' },
  ],
  data: [
    { slot: 'diary', label: 'Tagebuch', default: 'diary', shape: 'Einträge', required: true },
    { slot: 'history', label: 'Verlauf', default: 'history', shape: '{date,kcal}[]', required: false },
    { slot: 'goals', label: 'Ziele', default: 'goals', shape: '{kcal}', required: false },
  ],
  events: ['meal.add'],
  states: ['empty'],
  flutter: { widget: 'TaktNutritionStartInvite', propMap: { mode: 'mode', title: 'title', text: 'text', ctaLabel: 'ctaLabel' }, events: { 'meal.add': 'onAddMeal' } },
  a11y: { role: 'region', nameFrom: 'Titel' },
  css: `${NU_CSS}
  .tk-block:empty { display:none !important; }
  .tk-nut-inv { display:flex; align-items:center; gap:var(--tk-space-4); flex-wrap:wrap; } .tk-nut-inv > .tk-grow { flex:1 1 220px; min-width:0; }
  .tk-nut-inv__disc { width:48px; height:48px; border-radius:16px; display:grid; place-items:center; background:var(--tk-c-accent-soft); color:var(--tk-c-accent); flex:none; }
  .tk-nut-inv--hero { flex-direction:column; text-align:center; padding:var(--tk-space-6) var(--tk-space-4); gap:var(--tk-space-3); }
  .tk-nut-inv__big { width:96px; height:96px; border-radius:50%; display:grid; place-items:center; background:var(--tk-c-accent-soft); color:var(--tk-c-accent); border:1.5px dashed var(--tk-c-accent); }
  .tk-nut-inv__lead { max-width:44ch; margin:0; color:var(--tk-c-text-muted); }
  .tk-nut-inv--step { flex-direction:column; align-items:stretch; gap:var(--tk-space-3); } .tk-nut-inv--step .tk-btn { width:100%; min-height:52px; justify-content:center; }`,
  example: { data: { diary: [], history: [], goals: { kcal: 2400 } }, props: { mode: 'hero' } },
  render: function StartInvite({ props, data, ctx }) {
    if (arr(data.diary).length || arr(data.history).length) return null;
    const kcal = obj(data.goals).kcal;
    const mode = MODES.includes(props.mode) ? props.mode : 'compact';
    const text = props.text || `Suche ein Lebensmittel oder scanne einen Strichcode.${kcal ? ` Dein Tagesziel von ${num(kcal)} kcal steht schon bereit.` : ''}`;
    const add = () => ctx.emit('meal.add', { to: 'nutrition.log', ui: { foodTab: 'Alle' } });
    const cta = html`<${Button} variant="primary" icon="plus" onClick=${add}>${props.ctaLabel}<//>`;
    if (mode === 'hero') return html`<${Card}><div class="tk-nut-inv tk-nut-inv--hero" data-qa="nut-start-invite"><span class="tk-nut-inv__big"><${Icon} name="utensils" size=${40} /></span>
      <h3 class="tk-h2" style="margin:0">${props.title}</h3><p class="tk-nut-inv__lead">${text}</p>${cta}</div><//>`;
    if (mode === 'step') return html`<${Card}><div class="tk-nut-inv tk-nut-inv--step" data-qa="nut-start-invite"><span class="tk-label">Als Nächstes</span>
      <div><div class="tk-h2">${props.title}</div><p class="tk-nut-inv__lead" style="margin-top:6px">${text}</p></div>${cta}</div><//>`;
    return html`<${Card}><div class="tk-nut-inv" data-qa="nut-start-invite"><span class="tk-nut-inv__disc"><${Icon} name="utensils" size=${24} /></span>
      <div class="tk-grow"><div class="tk-h3">${props.title}</div><div class="tk-muted" style="font-size:var(--tk-fs-sm)">${text}</div></div>${cta}</div><//>`;
  },
};
export default [startInvite];
