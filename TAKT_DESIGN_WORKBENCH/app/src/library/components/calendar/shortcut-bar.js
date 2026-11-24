// Navigation: Schnellzugriffe auf andere Screens des Moduls (Chips, Kacheln oder Liste). Jeder Eintrag löst ein eigenes Event aus.
import { html } from '../../../lib/html.js';
import { Icon, Badge } from '../../ui.js';

/** Format je Eintrag: „Beschriftung|icon|event|Zusatz“ (Zusatz optional, z. B. Anzahl). */
const DEFAULT_ITEMS = ['Tag|calendar-days|day.open', 'Woche|calendar-range|week.open', 'Monat|calendar|month.open', 'Agenda|list|agenda.open'];
const parse = (v) => (Array.isArray(v) ? v : String(v || '').split(',')).map((s) => String(s).split('|').map((x) => x.trim())).filter((p) => p[0] && p[2]);

export const shortcutBar = {
  id: 'shortcut-bar',
  name: 'Schnellzugriffe',
  category: 'Navigation',
  description: 'Schnellzugriffe auf andere Ansichten des Moduls als Chips, Kacheln oder Liste. Jeder Eintrag meldet ein eigenes Event (z. B. day.open), das im Demo-Launcher per Navigationsregel zum Ziel führt.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: '' },
    { name: 'style', label: 'Darstellung', type: 'select', options: ['chips', 'tiles', 'list'], default: 'chips' },
    { name: 'items', label: 'Einträge (Beschriftung|icon|event|Zusatz)', type: 'list', default: DEFAULT_ITEMS },
  ],
  data: [],
  events: ['day.open', 'week.open', 'month.open', 'agenda.open', 'sources.open', 'create.open', 'list.open', 'inbox.open', 'focus.open', 'board.open', 'overdue.open', 'projects.open', 'detail.open'],
  states: ['empty'],
  css: `
  .tk-shortcuts { display:flex; flex-direction:column; gap:var(--tk-space-2); min-width:0; }
  .tk-shortcuts__chips { display:flex; flex-wrap:wrap; gap:8px; }
  .tk-shortcuts__chip { display:inline-flex; align-items:center; gap:7px; min-height:40px; padding:0 14px; border-radius:var(--tk-radius-pill); border:1px solid var(--tk-c-border-strong); background:var(--tk-c-surface); color:var(--tk-c-text); font:inherit; font-size:var(--tk-fs-md); font-weight:var(--tk-fw-medium); cursor:pointer; }
  .tk-shortcuts__chip:hover { background:var(--tk-c-surface2); }
  .tk-shortcuts__tiles { display:grid; grid-template-columns:repeat(auto-fit, minmax(116px, 1fr)); gap:var(--tk-space-3); }
  .tk-shortcuts__tile { display:flex; flex-direction:column; align-items:flex-start; gap:10px; min-height:88px; padding:var(--tk-space-3) var(--tk-space-4); border-radius:var(--tk-radius-lg); border:1px solid var(--tk-c-border); background:var(--tk-c-surface); color:var(--tk-c-text); font:inherit; font-weight:var(--tk-fw-semibold); cursor:pointer; text-align:left; }
  .tk-shortcuts__tile:hover { border-color:var(--tk-c-border-strong); background:var(--tk-c-surface2); }
  .tk-shortcuts__ico { width:36px; height:36px; border-radius:11px; display:grid; place-items:center; background:var(--tk-c-accent-soft); color:var(--tk-c-accent); }
  .tk-shortcuts__list { border:1px solid var(--tk-c-border); border-radius:var(--tk-radius-lg); background:var(--tk-c-surface); overflow:hidden; }
  .tk-shortcuts__row { display:flex; align-items:center; gap:12px; width:100%; min-height:52px; padding:0 16px; border:0; border-bottom:1px solid var(--tk-c-border); background:transparent; color:var(--tk-c-text); font:inherit; cursor:pointer; text-align:left; }
  .tk-shortcuts__row:last-child { border-bottom:0; } .tk-shortcuts__row:hover { background:var(--tk-c-surface2); }
  .bp-mobile .tk-shortcuts__tiles { grid-template-columns:repeat(2, minmax(0,1fr)); gap:var(--tk-space-2); }
  .bp-mobile .tk-shortcuts__chip { min-height:44px; }`,
  example: { props: { style: 'tiles' } },
  render: ({ props, ctx }) => {
    const items = parse(props.items);
    const open = (p) => ctx.emit(p[2], { id: p[0] });
    const body = props.style === 'tiles' ? html`<div class="tk-shortcuts__tiles">${items.map((p) => html`<button type="button" class="tk-shortcuts__tile" onClick=${() => open(p)}><span class="tk-shortcuts__ico"><${Icon} name=${p[1] || 'arrow-right'} size=${19} /></span><span>${p[0]}</span>${p[3] && html`<${Badge}>${p[3]}<//>`}</button>`)}</div>`
      : props.style === 'list' ? html`<div class="tk-shortcuts__list">${items.map((p) => html`<button type="button" class="tk-shortcuts__row" onClick=${() => open(p)}><${Icon} name=${p[1] || 'arrow-right'} size=${18} /><span class="tk-grow">${p[0]}</span>${p[3] && html`<${Badge}>${p[3]}<//>`}<${Icon} name="chevron-right" size=${16} /></button>`)}</div>`
      : html`<div class="tk-shortcuts__chips">${items.map((p) => html`<button type="button" class="tk-shortcuts__chip" onClick=${() => open(p)}><${Icon} name=${p[1] || 'arrow-right'} size=${16} />${p[0]}${p[3] && html`<span class="tk-subtle tk-num">${p[3]}</span>`}</button>`)}</div>`;
    return html`<div class="tk-shortcuts" data-qa="shortcut-bar">${props.title && html`<span class="tk-label">${props.title}</span>`}${body}</div>`;
  },
};
export default shortcutBar;
