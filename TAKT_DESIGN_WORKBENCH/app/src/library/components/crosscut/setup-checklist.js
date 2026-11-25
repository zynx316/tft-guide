// Erste Schritte / Empfehlungen: Fortschritt mit Ring und Schritten, je Schritt eine Aktion mit Ziel.
import { html } from '../../../lib/html.js';
import { Icon, Button, Ring, Card, EmptyState } from '../../ui.js';
import { XC_CSS, toneIc } from './_xc-css.js';

const CSS = `
  .tk-xc-chk { display: flex; flex-direction: column; gap: var(--tk-space-3); min-width: 0; }
  .tk-xc-chk__head { display: flex; align-items: center; gap: var(--tk-space-4); padding: var(--tk-space-4); border-radius: var(--tk-radius-xl); background: linear-gradient(135deg, var(--tk-c-accent-soft), var(--tk-c-surface) 75%); border: 1px solid var(--tk-c-border); min-width: 0; }
  .tk-xc-chk__head h3 { margin: 0; font-size: var(--tk-fs-lg); }
  .tk-xc-chk__step { display: flex; align-items: center; gap: var(--tk-space-3); padding: var(--tk-space-3) var(--tk-space-4); border-bottom: 1px solid var(--tk-c-border); min-width: 0; flex-wrap: wrap; }
  .tk-xc-chk__step:last-child { border-bottom: 0; }
  .tk-xc-chk__step[data-done="true"] .tk-xc-t { text-decoration: line-through; color: var(--tk-c-text-subtle); }
  .tk-xc-chk__step .tk-btn { flex: none; }`;

export const setupChecklist = {
  id: 'setup-checklist',
  name: 'Empfehlungen',
  category: 'Querschnitt',
  description: 'Erste Schritte und Empfehlungen als kurze Liste mit Fortschritt („2 von 5 erledigt“). Jeder Schritt hat eine Aktion, die direkt zur passenden Einstellung führt.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Empfohlen für dich' },
    { name: 'hideDone', label: 'Erledigte ausblenden', type: 'boolean', default: false },
  ],
  data: [{ slot: 'items', label: 'Schritte', default: 'steps', shape: '{id,title,text,icon,done?,to?,actionLabel?}[]', required: true }],
  events: ['setup.open', 'setup.done'],
  states: ['empty'],
  flutter: { widget: 'TaktSetupChecklist', propMap: { title: 'title', hideDone: 'hideCompleted' }, events: { 'setup.open': 'onOpenStep', 'setup.done': 'onComplete' } },
  a11y: { role: 'list', nameFrom: 'Titel' },
  css: XC_CSS + CSS,
  example: { props: {}, data: { items: [{ id: 's1', title: 'Sicherung einrichten', text: 'Automatisch jede Nacht', icon: 'cloud-upload', done: false, to: 'settings.data', actionLabel: 'Einrichten' }, { id: 's2', title: 'Module wählen', text: 'Nur, was du brauchst', icon: 'layout-grid', done: true }] } },
  render: function SetupChecklist({ props, data, setData, ctx }) {
    const items = Array.isArray(data.items) ? data.items : [];
    if (!items.length) return html`<${EmptyState} icon="check-circle-2" title="Alles eingerichtet" text="Es gibt keine offenen Empfehlungen." />`;
    const done = items.filter((i) => i.done).length;
    const shown = props.hideDone ? items.filter((i) => !i.done) : items;
    const mark = (i) => { setData('items', (l) => (Array.isArray(l) ? l : []).map((x) => (x.id === i.id ? { ...x, done: !x.done } : x))); ctx.emit('setup.done', { id: i.id, done: !i.done }); };
    return html`<div class="tk-xc-chk" data-qa="setup-checklist">
      <div class="tk-xc-chk__head"><${Ring} value=${done} max=${items.length} size=${56} stroke=${7} label=${`${done} von ${items.length} erledigt`}><span class="tk-num" style="font-size:var(--tk-fs-sm);font-weight:var(--tk-fw-semibold)">${done}/${items.length}</span><//>
        <div class="tk-grow"><h3>${props.title}</h3><span class="tk-xc-s" style="display:block;white-space:normal">${done === items.length ? 'Alles erledigt.' : `${done} von ${items.length} erledigt`}</span></div></div>
      <${Card} flush>${shown.map((i) => html`<div class="tk-xc-chk__step" key=${i.id} data-done=${i.done ? 'true' : undefined}>
        <button type="button" class="tk-xc-iconbtn" role="checkbox" aria-checked=${i.done ? 'true' : 'false'} aria-label=${`${i.title} erledigt`} onClick=${() => mark(i)}><${Icon} name=${i.done ? 'check-circle-2' : 'circle'} size=${22} /></button>
        <span class=${`tk-xc-ic${toneIc(i.tone)}`}><${Icon} name=${i.icon || 'sparkles'} size=${18} /></span>
        <span class="tk-xc-main" style="flex-basis:140px"><span class="tk-xc-t" style="white-space:normal">${i.title}</span><span class="tk-xc-s" style="white-space:normal">${i.text}</span></span>
        ${!i.done && i.to && html`<${Button} size="sm" variant="primary" onClick=${() => { ctx.emit('setup.open', { id: i.id }); ctx.emit(`open:${i.to}`); }}>${i.actionLabel || 'Öffnen'}<//>`}</div>`)}
        ${shown.length === 0 && html`<div class="tk-xc-chk__step"><span class="tk-xc-s">Alle Schritte erledigt.</span></div>`}<//></div>`;
  },
};
export default setupChecklist;
