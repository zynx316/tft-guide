// Darstellungsbausteine der globalen Suche: Trefferzeile, Befehlszeile, Eingabefeld, Chips.
import { html } from '../../../lib/html.js';
import { Icon, Badge } from '../../ui.js';
import { money } from '../../helpers.js';
import { Hl, moduleMeta } from './_system.js';
import { toneIc } from './_xc-css.js';

export const ResultRow = ({ it, q, ctx, onOpen, selected, showModule = true }) => html`<button type="button" class="tk-xc-row" role="option" aria-selected=${selected ? 'true' : 'false'} onClick=${() => onOpen(it)} data-result=${it.key}>
  <span class="tk-xc-ic"><${Icon} name=${it.icon} size=${18} /></span>
  <span class="tk-xc-main"><span class="tk-xc-t"><${Hl} text=${it.title} q=${q} /></span>${it.subtitle && html`<span class="tk-xc-s"><${Hl} text=${it.subtitle} q=${q} /></span>`}</span>
  <span class="tk-xc-end">${it.amount != null && html`<span class="tk-num" style=${`color:var(--tk-c-${it.amount < 0 ? 'text' : 'success'});font-weight:var(--tk-fw-medium)`}>${money(ctx, it.amount, { sign: it.group === 'transaction' })}</span>`}
    ${showModule && it.group !== 'module' && html`<span>${moduleMeta(it.module).name}</span>`}</span>
  <${Icon} name="chevron-right" size=${15} /></button>`;

export const CommandRow = ({ c, q, onRun, selected }) => html`<button type="button" class="tk-xc-row" role="option" aria-selected=${selected ? 'true' : 'false'} onClick=${() => onRun(c)} data-command=${c.id}>
  <span class="tk-xc-ic tk-xc-ic--info"><${Icon} name=${c.icon} size=${18} /></span>
  <span class="tk-xc-main"><span class="tk-xc-t"><${Hl} text=${c.label} q=${q} /></span><span class="tk-xc-s">${c.hint}</span></span>
  <${Badge}>Befehl<//><${Icon} name=${c.to ? 'arrow-right' : 'zap'} size=${15} /></button>`;

/** Eingabefeld der Suche (groß/klein), mit Löschen-Knopf. */
export function Field({ value, onInput, onKey, placeholder, big, lead = 'search' }) {
  return html`<div class=${`tk-xc-gs__field${big ? ' tk-xc-gs__field--big' : ''}`} role="search">
    <${Icon} name=${lead} size=${big ? 22 : 18} />
    <input type="search" class="tk-xc-gs__input" value=${value} placeholder=${placeholder} aria-label="Suchen" autocomplete="off" enterkeyhint="search" data-qa="search-input"
      onInput=${(e) => onInput(e.currentTarget.value)} onKeyDown=${onKey} />
    ${value && html`<button type="button" class="tk-xc-iconbtn" aria-label="Eingabe löschen" onClick=${() => onInput('')}><${Icon} name="x" size=${16} /></button>`}</div>`;
}

export const GS_CSS = `
  .tk-xc-gs { display: flex; flex-direction: column; gap: var(--tk-space-3); min-width: 0; }
  .tk-xc-gs__field { display: flex; align-items: center; gap: var(--tk-space-2); height: 48px; padding: 0 var(--tk-space-2) 0 var(--tk-space-4); border-radius: var(--tk-radius-lg); border: 1.5px solid var(--tk-c-border-strong); background: var(--tk-c-surface); color: var(--tk-c-text-muted); min-width: 0; }
  .tk-xc-gs__field:focus-within { border-color: var(--tk-c-accent); box-shadow: 0 0 0 3px var(--tk-c-accent-soft); }
  .tk-xc-gs__field--big { height: 60px; border-radius: var(--tk-radius-xl); box-shadow: var(--tk-shadow-md); }
  .tk-xc-gs__input { flex: 1 1 auto; min-width: 0; height: 100%; border: 0; outline: 0; background: none; color: var(--tk-c-text); font: inherit; font-size: var(--tk-fs-lg); -webkit-appearance: none; appearance: none; }
  .tk-xc-gs__input::-webkit-search-cancel-button { display: none; }
  .tk-xc-gs__input::placeholder { color: var(--tk-c-text-subtle); }
  .bp-mobile .tk-xc-gs__input { font-size: 16px; }
  .tk-xc-gs__more { width: 100%; justify-content: center; }
  .tk-xc-gs__tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(92px, 1fr)); gap: var(--tk-space-2); }
  .tk-xc-gs__tile { display: flex; flex-direction: column; align-items: center; gap: var(--tk-space-2); padding: var(--tk-space-3) var(--tk-space-1); border: 1px solid var(--tk-c-border); border-radius: var(--tk-radius-lg); background: var(--tk-c-surface); color: var(--tk-c-text); font: inherit; font-size: var(--tk-fs-sm); cursor: pointer; min-width: 0; min-height: 84px; }
  .tk-xc-gs__tile span:last-child { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .tk-xc-gs__tile:hover { border-color: var(--tk-c-accent); }
  .tk-xc-gs__cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 230px), 1fr)); gap: var(--tk-space-3); }
  .tk-xc-gs__card { display: flex; flex-direction: column; gap: var(--tk-space-2); align-items: flex-start; padding: var(--tk-space-4); border: 1px solid var(--tk-c-border); border-radius: var(--tk-radius-lg); background: var(--tk-c-surface); color: var(--tk-c-text); font: inherit; text-align: left; cursor: pointer; min-width: 0; }
  .tk-xc-gs__card:hover { border-color: var(--tk-c-accent); }
  .tk-xc-gs__card .tk-xc-t, .tk-xc-gs__card .tk-xc-s { max-width: 100%; }
  .tk-xc-gs__hero { padding: var(--tk-space-5); border-radius: var(--tk-radius-xl); background: linear-gradient(135deg, var(--tk-c-accent-soft), var(--tk-c-surface) 70%); border: 1px solid var(--tk-c-border); display: flex; gap: var(--tk-space-4); align-items: center; width: 100%; color: var(--tk-c-text); font: inherit; text-align: left; cursor: pointer; min-width: 0; }
  .tk-xc-gs__hero .tk-xc-ic { width: 52px; height: 52px; border-radius: var(--tk-radius-lg); }
  .tk-xc-gs__hero .tk-xc-t { font-size: var(--tk-fs-xl); font-weight: var(--tk-fw-semibold); white-space: normal; }
  .tk-xc-gs__foot { display: flex; gap: var(--tk-space-4); flex-wrap: wrap; font-size: var(--tk-fs-xs); color: var(--tk-c-text-subtle); padding: var(--tk-space-2) var(--tk-space-1); }
  .tk-xc-gs__foot span { display: inline-flex; align-items: center; gap: 6px; }
  .bp-mobile .tk-xc-gs__foot { display: none; }
  .tk-xc-gs__hint { display: flex; gap: var(--tk-space-3); align-items: center; padding: var(--tk-space-3) var(--tk-space-4); border-radius: var(--tk-radius-lg); background: var(--tk-c-info-soft); color: var(--tk-c-text); font-size: var(--tk-fs-sm); }
  .tk-xc-gs__hint svg { color: var(--tk-c-info); flex: none; }`;
