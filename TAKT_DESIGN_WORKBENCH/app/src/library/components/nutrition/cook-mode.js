// Ernährung: Kochmodus – ein Schritt pro Ansicht, große Schrift, Zutaten griffbereit, optionaler Timer.
import { html } from '../../../lib/html.js';
import { useState, useEffect } from 'preact/hooks';
import { Card, Button, Icon, Progress, EmptyState } from '../../ui.js';
import { num } from './_calc.js';
import { scaleIngredients } from './_recipes.js';
import { NU_CSS, arr } from './_ui.js';

const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export function CookView({ recipe, servings, foods, ctx, onExit }) {
  const [i, setI] = useState(0), [showIng, setShowIng] = useState(false), [left, setLeft] = useState(null), [run, setRun] = useState(false);
  const steps = recipe.steps || [], step = steps[i], last = i === steps.length - 1;
  const ing = scaleIngredients(recipe, servings, foods);
  useEffect(() => { setLeft(step?.minutes ? step.minutes * 60 : null); setRun(false); }, [i]);
  useEffect(() => { if (!run || left == null) return undefined; const t = setInterval(() => setLeft((s) => (s > 0 ? s - 1 : 0)), 1000); return () => clearInterval(t); }, [run, left == null]);
  const go = (n) => { setI(n); ctx.emit('cook.step', { id: recipe.id, step: n + 1 }); };
  if (!step) return html`<${EmptyState} icon="chef-hat" title="Keine Schritte" text="Für dieses Rezept sind noch keine Schritte hinterlegt." />`;
  return html`<div class="tk-ck" role="region" aria-label=${`Kochmodus ${recipe.title}`}>
    <div class="tk-ck__top"><${Button} variant="ghost" size="sm" icon="x" onClick=${onExit} aria-label="Kochmodus beenden">Beenden<//><span class="tk-nu-meta tk-num">Schritt ${i + 1} von ${steps.length}</span></div>
    <${Progress} value=${(i + 1) / steps.length} />
    <p class="tk-ck__text" aria-live="polite">${step.text}</p>
    ${left != null && html`<div class="tk-ck__timer"><${Icon} name="timer" size=${20} /><strong class="tk-num">${mmss(left)}</strong><${Button} size="sm" onClick=${() => { setRun(!run); ctx.emit('cook.timer', { running: !run }); }}>${run ? 'Pause' : left === 0 ? 'Fertig' : 'Timer starten'}<//></div>`}
    <button type="button" class="tk-ck__ing" aria-expanded=${String(showIng)} onClick=${() => setShowIng(!showIng)}><${Icon} name="list-checks" size=${16} />Zutaten für ${num(servings, 1)} Portion${servings === 1 ? '' : 'en'}<${Icon} name=${showIng ? 'chevron-up' : 'chevron-down'} size=${16} /></button>
    ${showIng && html`<ul class="tk-ck__list">${ing.map((x) => html`<li><span>${x.name}</span><strong class="tk-num">${x.label}</strong></li>`)}</ul>`}
    <div class="tk-ck__nav"><${Button} icon="arrow-left" disabled=${i === 0} onClick=${() => go(i - 1)}>Zurück<//>
      ${last ? html`<${Button} variant="primary" icon="check" onClick=${() => { ctx.emit('cook.done', { id: recipe.id }); ctx.toast('Guten Appetit!'); onExit(); }}>Fertig<//>` : html`<${Button} variant="primary" iconRight="arrow-right" onClick=${() => go(i + 1)}>Weiter<//>`}</div></div>`;
}

export const COOK_CSS = `${NU_CSS}
  .tk-ck { display:flex; flex-direction:column; gap:var(--tk-space-4); min-width:0; }
  .tk-ck__top { display:flex; align-items:center; justify-content:space-between; }
  .tk-ck__text { margin:var(--tk-space-3) 0; font-size:var(--tk-nfs-3xl); line-height:1.3; font-weight:var(--tk-fw-semibold); letter-spacing:var(--tk-ls-tight); min-height:140px; }
  .bp-mobile .tk-ck__text { font-size:var(--tk-nfs-2xl); min-height:160px; }
  .tk-ck__timer { display:flex; align-items:center; gap:12px; padding:10px 14px; border-radius:var(--tk-radius-md); background:var(--tk-c-surface2); border:1px solid var(--tk-c-border); } .tk-ck__timer strong { font-size:var(--tk-nfs-2xl); }
  .tk-ck__ing { display:flex; align-items:center; gap:8px; width:100%; min-height:44px; border:0; background:transparent; color:var(--tk-c-text-muted); font:inherit; cursor:pointer; padding:0; text-align:left; } .tk-ck__ing .icon:last-child { margin-left:auto; }
  .tk-ck__list { list-style:none; margin:0; padding:0; } .tk-ck__list li { display:flex; justify-content:space-between; gap:12px; padding:8px 0; border-bottom:1px solid var(--tk-c-border); font-size:var(--tk-nfs-lg); }
  .tk-ck__nav { display:grid; grid-template-columns:1fr 1fr; gap:10px; position:sticky; bottom:0; padding-top:8px; } .tk-ck__nav .tk-btn { justify-content:center; min-height:52px; font-size:var(--tk-nfs-lg); }`;

export const cookMode = {
  id: 'cook-mode',
  name: 'Kochmodus',
  category: 'Ernährung',
  description: 'Rezept Schritt für Schritt: ein Schritt pro Ansicht in großer Schrift, Fortschritt, aufklappbare Zutaten (skaliert) und ein Timer für Schritte mit Zeitangabe. Wird im Rezept-Detail eingebettet und ist auch einzeln nutzbar.',
  version: '1.0',
  props: [{ name: 'servings', label: 'Portionen', type: 'number', default: 0 }, { name: 'defaultRecipe', label: 'Standard-Rezept (ID)', type: 'text', default: '' }],
  data: [{ slot: 'recipes', label: 'Rezepte', default: 'recipes', shape: 'Rezepte mit steps[]', required: true }, { slot: 'foods', label: 'Lebensmittel', default: 'foods', shape: 'für Zutaten', required: false }],
  events: ['cook.step', 'cook.timer', 'cook.done'],
  states: ['empty'],
  css: COOK_CSS,
  example: { data: { recipes: [{ id: 'r1', title: 'Rotes Linsen-Curry', servings: 4, ingredients: [{ foodId: 'f1', g: 300 }], steps: [{ text: 'Zwiebeln fein würfeln.' }, { text: 'Öl erhitzen, Zwiebeln dünsten.', minutes: 5 }, { text: 'Linsen und Kokosmilch zugeben und köcheln lassen.', minutes: 15 }] }], foods: [{ id: 'f1', name: 'Rote Linsen, roh', unit: 'g' }] } },
  render: function CookModeBlock({ props, data, ctx }) {
    const r = arr(data.recipes).find((x) => x.id === (ctx.ui?.selectedId || props.defaultRecipe)) || arr(data.recipes)[0];
    if (!r) return html`<${Card}><${EmptyState} icon="chef-hat" title="Kein Rezept" text="Wähle ein Rezept, um den Kochmodus zu starten." /><//>`;
    return html`<${Card} title=${r.title} icon="chef-hat"><${CookView} recipe=${r} servings=${props.servings || r.servings} foods=${arr(data.foods)} ctx=${ctx} onExit=${() => ctx.toast('Kochmodus beendet')} /><//>`;
  },
};
export default [cookMode];
