// Einladung für leere Bereiche: Illustration, Nutzen in einem Satz, eine primäre Aktion, optional Beispieldaten.
import { html } from '../../../lib/html.js';
import { Button, Badge, Icon } from '../../ui.js';
import { useSynced } from './_crosscut.js';

const ICONS = ['sparkles', 'list-todo', 'calendar', 'wallet', 'piggy-bank', 'candlestick-chart', 'dumbbell', 'utensils', 'target', 'cloud-sun', 'notebook-pen', 'bell'];

export const firstrunCard = {
  id: 'firstrun-card',
  name: 'Erststart-Einladung',
  category: 'Querschnitt',
  description: 'Freundliche Einladung, wenn ein Bereich noch leer ist: Illustration, ein Satz Nutzen, eine primäre Aktion und optional „Beispieldaten laden“. Wiederverwendbar für jedes Modul.',
  version: '1.0',
  props: [
    { name: 'icon', label: 'Illustration (Icon)', type: 'select', options: ICONS, default: 'list-todo' },
    { name: 'title', label: 'Titel', type: 'text', default: 'Starte mit deiner ersten Aufgabe' },
    { name: 'text', label: 'Nutzen (ein Satz)', type: 'textarea', default: 'Halte fest, was ansteht – TAKT erinnert dich rechtzeitig und zeigt dir, was heute zählt.' },
    { name: 'primaryLabel', label: 'Primäre Aktion', type: 'text', default: 'Aufgabe anlegen' },
    { name: 'allowSample', label: 'Beispieldaten anbieten', type: 'boolean', default: true },
    { name: 'sampleLabel', label: 'Beispieldaten-Aktion', type: 'text', default: 'Beispieldaten laden' },
    { name: 'dismissible', label: 'Ausblendbar', type: 'boolean', default: true },
  ],
  data: [],
  events: ['firstrun.start', 'firstrun.sample', 'firstrun.dismiss', 'firstrun.restore'],
  states: [],
  flutter: {
    widget: 'TaktFirstRunCard',
    propMap: { icon: 'illustration', title: 'title', text: 'benefit', primaryLabel: 'primaryLabel', allowSample: 'offerSampleData', sampleLabel: 'sampleLabel', dismissible: 'dismissible' },
    events: { 'firstrun.start': 'onStart', 'firstrun.sample': 'onLoadSample', 'firstrun.dismiss': 'onDismiss' },
  },
  a11y: { role: 'region', nameFrom: 'Titel' },
  css: `
  .tk-firstrun { position: relative; display: flex; flex-direction: column; align-items: center; text-align: center; gap: var(--tk-space-3); padding: var(--tk-space-8) var(--tk-space-5) var(--tk-space-6); border-radius: var(--tk-radius-xl); border: 1px solid var(--tk-c-border); background: linear-gradient(180deg, var(--tk-c-accent-soft), var(--tk-c-surface) 62%); min-width: 0; }
  .tk-firstrun__art { position: relative; width: 88px; height: 88px; display: grid; place-items: center; margin-bottom: var(--tk-space-1); }
  .tk-firstrun__art::before, .tk-firstrun__art::after { content: ""; position: absolute; border-radius: 50%; border: 1.5px dashed var(--tk-c-accent); opacity: .35; }
  .tk-firstrun__art::before { inset: 0; }
  .tk-firstrun__art::after { inset: -10px; opacity: .18; }
  .tk-firstrun__disc { width: 64px; height: 64px; border-radius: 50%; display: grid; place-items: center; background: var(--tk-c-accent); color: var(--tk-c-text-on-accent); box-shadow: var(--tk-shadow-md); }
  .tk-firstrun__spark { position: absolute; top: -6px; right: -4px; color: var(--tk-c-accent2); }
  .tk-firstrun__title { margin: 0; font-size: var(--tk-fs-xl); font-weight: var(--tk-fw-semibold); color: var(--tk-c-text); line-height: var(--tk-lh-tight); }
  .tk-firstrun__text { margin: 0; max-width: 380px; color: var(--tk-c-text-muted); font-size: var(--tk-fs-md); line-height: var(--tk-lh-normal); }
  .tk-firstrun__actions { display: flex; flex-direction: column; align-items: center; gap: var(--tk-space-2); margin-top: var(--tk-space-2); width: 100%; max-width: 320px; }
  .tk-firstrun__actions .tk-btn { width: 100%; justify-content: center; }
  .tk-firstrun__x { position: absolute; top: var(--tk-space-2); right: var(--tk-space-2); }
  .bp-mobile .tk-firstrun__x { width: var(--tk-size-touch); min-width: var(--tk-size-touch); height: var(--tk-size-touch); top: 0; right: 0; }
  .tk-firstrun-off { display: flex; align-items: center; gap: var(--tk-space-2); color: var(--tk-c-text-muted); font-size: var(--tk-fs-sm); }`,
  example: { props: {} },
  render: function FirstrunCard({ props, ctx }) {
    const [mode, setMode] = useSynced('start');
    const detail = { icon: props.icon };
    if (mode === 'dismissed') return html`<div class="tk-firstrun-off"><span>Einladung ausgeblendet.</span><${Button} variant="ghost" size="sm" onClick=${() => { setMode('start'); ctx.emit('firstrun.restore'); }}>Wieder anzeigen<//></div>`;
    return html`<section class="tk-firstrun" aria-label=${props.title} data-qa="firstrun-card">
      ${props.dismissible && html`<${Button} class="tk-firstrun__x" variant="ghost" size="sm" icon="x" aria-label="Einladung ausblenden" onClick=${() => { setMode('dismissed'); ctx.emit('firstrun.dismiss', detail); }} />`}
      <div class="tk-firstrun__art" aria-hidden="true"><span class="tk-firstrun__disc"><${Icon} name=${props.icon} size=${30} /></span><span class="tk-firstrun__spark"><${Icon} name="sparkles" size=${18} /></span></div>
      <h3 class="tk-firstrun__title">${props.title}</h3>
      <p class="tk-firstrun__text">${props.text}</p>
      <div class="tk-firstrun__actions">
        <${Button} variant="primary" icon="plus" onClick=${() => { ctx.emit('firstrun.start', detail); ctx.toast(props.primaryLabel); }}>${props.primaryLabel}<//>
        ${props.allowSample && (mode === 'sample'
          ? html`<${Badge} tone="success" icon="check">Beispieldaten geladen – jederzeit löschbar<//>`
          : html`<${Button} variant="ghost" icon="wand-2" onClick=${() => { setMode('sample'); ctx.emit('firstrun.sample', detail); ctx.toast('Beispieldaten geladen'); }}>${props.sampleLabel}<//>`)}
      </div></section>`;
  },
};
export default firstrunCard;
