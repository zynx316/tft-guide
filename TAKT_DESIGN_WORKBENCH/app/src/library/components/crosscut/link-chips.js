// Verknüpfte Objekte als Chips mit Modul-Icon; Tippen navigiert über die Interaktion (to).
import { html } from '../../../lib/html.js';
import { Icon, EmptyState, Button } from '../../ui.js';
import { fmtRelativeDay } from '../../../lib/format.js';
import { moduleIcon, MODULE_NAMES } from './_crosscut.js';

export const linkChips = {
  id: 'link-chips',
  name: 'Verknüpfungen',
  category: 'Querschnitt',
  description: 'Zeigt Objekte aus anderen Modulen, die zu diesem gehören (Aufgabe, Termin, Notiz, Buchung …), als Chips mit Modul-Icon und optionalem Fälligkeitstag. Tippen meldet „open“ mit Ziel und ID, damit die Navigation (interaction.to) dorthin springt.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Überschrift (leer = ohne)', type: 'text', default: 'Verknüpft' },
    { name: 'layout', label: 'Darstellung', type: 'select', options: ['chips', 'list'], default: 'chips' },
    { name: 'showModule', label: 'Modulname zeigen', type: 'boolean', default: false },
    { name: 'editable', label: 'Verknüpfung lösen/hinzufügen', type: 'boolean', default: true },
    { name: 'event', label: 'Event beim Antippen', type: 'text', default: 'open' },
  ],
  data: [{ slot: 'links', label: 'Verknüpfungen', default: 'links', shape: '{id,label,module,to?,due?,sub?}[]', required: true }],
  events: ['open', 'link.add', 'link.remove'],
  states: ['empty'],
  flutter: {
    widget: 'TaktLinkChips',
    propMap: { title: 'title', layout: 'layout', showModule: 'showModule', editable: 'editable', links: 'links' },
    events: { open: 'onOpen', 'link.add': 'onAdd', 'link.remove': 'onRemove' },
  },
  a11y: { role: 'list', nameFrom: 'Überschrift' },
  css: `
  .tk-links { display: flex; flex-direction: column; gap: var(--tk-space-2); min-width: 0; }
  .tk-links__list { display: flex; flex-wrap: wrap; gap: var(--tk-space-2); margin: 0; padding: 0; list-style: none; min-width: 0; }
  .tk-links--list .tk-links__list { flex-direction: column; flex-wrap: nowrap; }
  .tk-links__item { display: inline-flex; align-items: center; max-width: 100%; min-width: 0; border: 1px solid var(--tk-c-border-strong); border-radius: var(--tk-radius-pill); background: var(--tk-c-surface); color: var(--tk-c-text); }
  .tk-links--list .tk-links__item { display: flex; border-radius: var(--tk-radius-md); }
  .tk-links__open { display: inline-flex; align-items: center; gap: 8px; min-width: 0; flex: 1 1 auto; min-height: 36px; padding: 4px 12px 4px 6px; border: 0; background: none; color: inherit; font: inherit; font-size: var(--tk-fs-sm); font-weight: var(--tk-fw-medium); cursor: pointer; text-align: left; border-radius: inherit; }
  .tk-links__open:hover { background: var(--tk-c-surface2); }
  .tk-links__ico { width: 26px; height: 26px; flex: none; border-radius: 50%; display: grid; place-items: center; background: var(--tk-c-accent-soft); color: var(--tk-c-accent); }
  .tk-links__text { min-width: 0; display: flex; flex-direction: column; line-height: var(--tk-lh-snug); }
  .tk-links__sub { font-size: var(--tk-fs-xs); color: var(--tk-c-text-muted); font-weight: var(--tk-fw-regular); }
  .tk-links__x { flex: none; width: 32px; height: 32px; margin-right: 2px; display: grid; place-items: center; border: 0; background: none; color: var(--tk-c-text-subtle); cursor: pointer; border-radius: 50%; }
  .tk-links__x:hover { color: var(--tk-c-danger); background: var(--tk-c-danger-soft); }
  .tk-links__add { border-style: dashed; color: var(--tk-c-text-muted); }
  .bp-mobile .tk-links__open { min-height: var(--tk-size-touch); padding-left: 8px; }
  .bp-mobile .tk-links__x { width: var(--tk-size-touch); height: var(--tk-size-touch); margin-right: 0; }`,
  example: {
    props: { showModule: true },
    data: { links: [
      { id: 'a1', label: 'Rechnung 1142 prüfen', module: 'tasks', to: 'tasks.detail', due: '2026-11-25', sub: 'Aufgabe' },
      { id: 'e1', label: 'Lieferanten-Call', module: 'calendar', to: 'calendar.event', due: '2026-11-24', sub: 'Termin' },
      { id: 'b1', label: 'Verpackungsmaterial 86,40 €', module: 'finance', to: 'finance.transaction', sub: 'Buchung' },
      { id: 'n1', label: 'Notiz: Versandpartner Vergleich', module: 'notes', to: 'notes.detail', sub: 'Notiz' },
    ] },
  },
  render: function LinkChips({ props, data, setData, ctx }) {
    const links = Array.isArray(data.links) ? data.links : [];
    const open = (l) => ctx.emit(props.event || 'open', { to: l.to, id: l.id, module: l.module });
    const remove = (l) => { setData('links', (all) => all.filter((x) => x.id !== l.id)); ctx.emit('link.remove', { id: l.id }); ctx.toast(`Verknüpfung „${l.label}“ gelöst`); };
    const add = () => { ctx.emit('link.add'); ctx.toast('Objekt zum Verknüpfen auswählen'); };
    return html`<div class=${`tk-links tk-links--${props.layout}`} data-qa="link-chips">
      ${props.title && html`<span class="tk-label">${props.title}</span>`}
      ${links.length === 0
        ? html`<${EmptyState} icon="link-2" title="Noch nichts verknüpft" text="Verknüpfe Aufgaben, Termine oder Notizen, damit alles zusammenhängt." action=${props.editable && html`<${Button} size="sm" icon="plus" onClick=${add}>Verknüpfen<//>`} />`
        : html`<ul class="tk-links__list">
          ${links.map((l) => html`<li class="tk-links__item" key=${l.id}>
            <button type="button" class="tk-links__open" onClick=${() => open(l)} aria-label=${`${MODULE_NAMES[l.module] || 'Objekt'}: ${l.label} öffnen`}>
              <span class="tk-links__ico"><${Icon} name=${moduleIcon(l.module)} size=${14} /></span>
              <span class="tk-links__text"><span class="tk-truncate">${l.label}</span>
                ${(props.showModule || l.due || l.sub) && html`<span class="tk-links__sub tk-truncate">${[props.showModule ? MODULE_NAMES[l.module] : null, l.sub && !props.showModule ? l.sub : null, l.due ? fmtRelativeDay(l.due, ctx.today) : null].filter(Boolean).join(' · ')}</span>`}</span></button>
            ${props.editable && html`<button type="button" class="tk-links__x" aria-label=${`Verknüpfung „${l.label}“ lösen`} onClick=${() => remove(l)}><${Icon} name="x" size=${14} /></button>`}</li>`)}
          ${props.editable && html`<li class="tk-links__item tk-links__add"><button type="button" class="tk-links__open" style="padding-left:12px" onClick=${add}><${Icon} name="plus" size=${15} />Verknüpfen</button></li>`}</ul>`}
    </div>`;
  },
};
export default linkChips;
