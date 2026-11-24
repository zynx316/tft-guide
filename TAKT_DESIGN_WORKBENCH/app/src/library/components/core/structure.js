// Struktur & Navigation: page-header, view-switcher, search-filter, action-bar, notice-banner
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Button, Icon, Segmented, Search, Chip, Badge } from '../../ui.js';

const list = (v) => (Array.isArray(v) ? v : String(v || '').split(',').map((s) => s.trim()).filter(Boolean));

export const pageHeader = {
  id: 'page-header',
  name: 'Seitenkopf',
  category: 'Struktur',
  description: 'Titel, Untertitel und Primäraktion eines Feature-Screens. Auf Mobile kompakt, Aktion als Icon-Button.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Titel' },
    { name: 'subtitle', label: 'Untertitel', type: 'text', default: '' },
    { name: 'eyebrow', label: 'Überzeile', type: 'text', default: '' },
    { name: 'primaryLabel', label: 'Primäraktion', type: 'text', default: 'Neu' },
    { name: 'primaryIcon', label: 'Icon Primäraktion', type: 'text', default: 'plus' },
    { name: 'primaryEvent', label: 'Event Primäraktion', type: 'text', default: 'header.primary' },
    { name: 'secondaryLabel', label: 'Sekundäraktion', type: 'text', default: '' },
    { name: 'secondaryIcon', label: 'Icon Sekundär', type: 'text', default: 'sliders-horizontal' },
  ],
  data: [],
  events: ['header.primary', 'header.secondary'],
  states: ['empty', 'loading', 'error'],
  css: `
  .tk-page-header { display:flex; align-items:flex-end; gap:var(--tk-space-4); flex-wrap:wrap; min-width:0; }
  .tk-page-header__text { flex:1 1 240px; min-width:0; }
  .tk-page-header__sub { color:var(--tk-c-text-muted); margin-top:6px; font-size:var(--tk-fs-md); }
  .tk-page-header__actions { display:flex; gap:var(--tk-space-2); }
  .bp-mobile .tk-page-header { align-items:center; flex-wrap:nowrap; }
  .bp-mobile .tk-page-header__sub { font-size:var(--tk-fs-sm); margin-top:2px; }
  `,
  example: { props: { title: 'Wochenansicht', subtitle: 'KW 48 · 24.–30. November', eyebrow: 'Kalender', primaryLabel: 'Termin' } },
  render: ({ props, ctx }) => {
    const mobile = ctx.bp === 'mobile';
    // Im App-Modus navigiert die Runtime (emit → true); dann kein zusätzlicher Hinweis.
    const primary = () => { if (!ctx.emit(props.primaryEvent || 'header.primary') && (props.primaryEvent || 'header.primary') === 'header.primary') ctx.toast(`${props.primaryLabel} – Aktion ausgelöst`); };
    return html`<header class="tk-page-header">
      <div class="tk-page-header__text">
        ${props.eyebrow && !mobile && html`<div class="tk-label" style="margin-bottom:6px">${props.eyebrow}</div>`}
        <h1 class="tk-h1 tk-truncate">${props.title}</h1>
        ${props.subtitle && html`<p class="tk-page-header__sub tk-truncate">${props.subtitle}</p>`}
      </div>
      <div class="tk-page-header__actions">
        ${props.secondaryLabel && html`<${Button} icon=${props.secondaryIcon} onClick=${() => { if (!ctx.emit('header.secondary')) ctx.toast(props.secondaryLabel); }} aria-label=${props.secondaryLabel}>${mobile ? null : props.secondaryLabel}<//>`}
        ${props.primaryLabel && html`<${Button} variant="primary" icon=${props.primaryIcon} onClick=${primary} aria-label=${props.primaryLabel}>${mobile ? null : props.primaryLabel}<//>`}
      </div>
    </header>`;
  },
};

export const viewSwitcher = {
  id: 'view-switcher',
  name: 'Ansichts-Umschalter',
  category: 'Navigation',
  description: 'Segmentierter Umschalter (z. B. Tag/Woche/Monat). Schreibt in den geteilten UI-Zustand (ctx.ui[uiKey]); andere Blöcke reagieren darauf.',
  version: '1.0',
  props: [
    { name: 'options', label: 'Optionen', type: 'list', default: ['Tag', 'Woche', 'Monat'] },
    { name: 'icons', label: 'Icons (optional)', type: 'list', default: [] },
    { name: 'uiKey', label: 'UI-Schlüssel', type: 'text', default: 'view' },
    { name: 'initial', label: 'Startwert', type: 'text', default: '' },
    { name: 'align', label: 'Ausrichtung', type: 'select', options: ['start', 'center', 'end', 'stretch'], default: 'start' },
  ],
  data: [],
  events: ['view.change'],
  states: ['empty', 'loading', 'error'],
  css: `.tk-view-switcher { display:flex; } .tk-view-switcher--stretch .tk-seg { width:100%; } .tk-view-switcher--stretch .tk-seg button { flex:1; justify-content:center; }`,
  example: { props: { options: ['Tag', 'Woche', 'Monat'] } },
  render: ({ props, ctx }) => {
    const opts = list(props.options); const icons = list(props.icons);
    const val = ctx.ui[props.uiKey] ?? (props.initial || opts[0]);
    return html`<div class=${`tk-view-switcher tk-view-switcher--${props.align}`} style=${`justify-content:${{ start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch' }[props.align]}`}>
      <${Segmented} value=${val} options=${opts.map((o, i) => ({ value: o, label: o, icon: icons[i] }))}
        onChange=${(v) => { ctx.setUi(props.uiKey, v); ctx.emit('view.change', { [props.uiKey]: v }); }} />
    </div>`;
  },
};

export const searchFilter = {
  id: 'search-filter',
  name: 'Suche & Filter',
  category: 'Navigation',
  description: 'Suchfeld plus Filterchips. Setzt ctx.ui.query und ctx.ui.filter – Listen, Tabellen und Karten filtern automatisch.',
  version: '1.0',
  props: [
    { name: 'placeholder', label: 'Platzhalter', type: 'text', default: 'Suchen …' },
    { name: 'filters', label: 'Filterchips', type: 'list', default: ['Alle', 'Offen', 'Erledigt'] },
    { name: 'showSearch', label: 'Suchfeld', type: 'boolean', default: true },
    { name: 'layout', label: 'Anordnung', type: 'select', options: ['inline', 'stacked'], default: 'inline' },
  ],
  data: [],
  events: ['search.input', 'filter.change'],
  states: ['empty', 'loading', 'error'],
  css: `
  .tk-search-filter { display:flex; gap:var(--tk-space-3); align-items:center; flex-wrap:wrap; min-width:0; }
  .tk-search-filter .tk-search { flex:1 1 220px; max-width:420px; }
  .tk-search-filter__chips { display:flex; gap:var(--tk-space-2); overflow-x:auto; scrollbar-width:none; min-width:0; max-width:100%; }
  .tk-search-filter--stacked { flex-direction:column; align-items:stretch; }
  .tk-search-filter--stacked .tk-search { max-width:none; flex:none; }
  .bp-mobile .tk-search-filter { flex-direction:column; align-items:stretch; }
  .bp-mobile .tk-search-filter .tk-search { max-width:none; flex:none; }`,
  example: { props: { filters: ['Alle', 'Heute', 'Diese Woche', 'Überfällig'] } },
  render: ({ props, ctx }) => {
    const filters = list(props.filters);
    const active = ctx.ui.filter ?? filters[0];
    return html`<div class=${`tk-search-filter tk-search-filter--${props.layout}`}>
      ${props.showSearch && html`<${Search} value=${ctx.ui.query || ''} placeholder=${props.placeholder} onInput=${(v) => { ctx.setUi('query', v); ctx.emit('search.input', { query: v }); }} />`}
      ${filters.length > 0 && html`<div class="tk-search-filter__chips" role="group" aria-label="Filter">
        ${filters.map((f) => html`<${Chip} active=${f === active} onClick=${() => { ctx.setUi('filter', f); ctx.emit('filter.change', { filter: f }); }}>${f}<//>`)}
      </div>`}
    </div>`;
  },
};

export const actionBar = {
  id: 'action-bar',
  name: 'Aktionsleiste',
  category: 'Navigation',
  description: 'Reihe von Schnellaktionen. Auf Mobile als horizontal scrollbare Icon-Buttons mit Beschriftung.',
  version: '1.0',
  props: [
    { name: 'actions', label: 'Aktionen (Label)', type: 'list', default: ['Neu', 'Importieren', 'Teilen'] },
    { name: 'icons', label: 'Icons', type: 'list', default: ['plus', 'upload', 'link-2'] },
    { name: 'style', label: 'Stil', type: 'select', options: ['buttons', 'tiles'], default: 'buttons' },
  ],
  data: [],
  events: ['action.run'],
  states: ['empty', 'loading', 'error'],
  css: `
  .tk-action-bar { display:flex; gap:var(--tk-space-2); flex-wrap:wrap; }
  .tk-action-bar--tiles { display:grid; grid-template-columns:repeat(auto-fill, minmax(110px, 1fr)); gap:var(--tk-space-3); }
  .tk-action-bar__tile { display:flex; flex-direction:column; align-items:center; gap:8px; padding:14px 8px; border-radius:var(--tk-radius-lg); border:1px solid var(--tk-c-border); background:var(--tk-c-surface); color:var(--tk-c-text); cursor:pointer; font-size:var(--tk-fs-sm); font-weight:var(--tk-fw-medium); }
  .tk-action-bar__tile:hover { border-color:var(--tk-c-border-strong); }
  .tk-action-bar__tile span:first-child { width:38px; height:38px; border-radius:12px; display:grid; place-items:center; background:var(--tk-c-accent-soft); color:var(--tk-c-accent); }
  .bp-mobile .tk-action-bar--buttons { flex-wrap:nowrap; overflow-x:auto; scrollbar-width:none; }
  .bp-mobile .tk-action-bar--tiles { grid-template-columns:repeat(4, minmax(0,1fr)); gap:var(--tk-space-2); }
  .bp-mobile .tk-action-bar__tile { padding:10px 4px; font-size:11px; }`,
  example: { props: { actions: ['Foto', 'Datei', 'Zwischenablage', 'Scan'], icons: ['camera', 'upload', 'clipboard', 'scan'], style: 'tiles' } },
  render: ({ props, ctx }) => {
    const acts = list(props.actions), icons = list(props.icons);
    const run = (a) => { if (!ctx.emit('action.run', { action: a })) ctx.toast(`${a}`); };
    if (props.style === 'tiles') return html`<div class="tk-action-bar tk-action-bar--tiles">
      ${acts.map((a, i) => html`<button type="button" class="tk-action-bar__tile" onClick=${() => run(a)}><span><${Icon} name=${icons[i] || 'circle'} size=${18} /></span><span class="tk-truncate" style="max-width:100%">${a}</span></button>`)}</div>`;
    return html`<div class="tk-action-bar tk-action-bar--buttons">
      ${acts.map((a, i) => html`<${Button} size="sm" icon=${icons[i]} onClick=${() => run(a)}>${a}<//>`)}</div>`;
  },
};

export const noticeBanner = {
  id: 'notice-banner',
  name: 'Hinweis-Banner',
  category: 'Feedback',
  description: 'Kontextueller Hinweis (Info, Warnung, Erfolg, Fehler) mit optionaler Aktion; schliessbar.',
  version: '1.0',
  props: [
    { name: 'tone', label: 'Ton', type: 'select', options: ['info', 'warning', 'success', 'danger', 'accent'], default: 'info' },
    { name: 'title', label: 'Titel', type: 'text', default: 'Hinweis' },
    { name: 'text', label: 'Text', type: 'textarea', default: '' },
    { name: 'actionLabel', label: 'Aktion', type: 'text', default: '' },
    { name: 'dismissible', label: 'Schließbar', type: 'boolean', default: true },
  ],
  data: [],
  events: ['notice.action', 'notice.dismiss'],
  states: ['empty', 'loading', 'error'],
  css: `
  .tk-notice { display:flex; gap:var(--tk-space-3); align-items:flex-start; padding:var(--tk-space-3) var(--tk-space-4); border-radius:var(--tk-radius-lg); border:1px solid transparent; }
  .tk-notice__body { flex:1; min-width:0; }
  .tk-notice__title { font-weight:var(--tk-fw-semibold); }
  .tk-notice__text { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); margin-top:2px; }`,
  example: { props: { tone: 'warning', title: 'Unwetterwarnung', text: 'Sturmböen bis 75 km/h zwischen 14 und 19 Uhr.', actionLabel: 'Details' } },
  render: function Notice({ props, ctx }) {
    const [hidden, setHidden] = useState(false);
    if (hidden) return null;
    const icon = { info: 'info', warning: 'alert-triangle', success: 'check-circle-2', danger: 'alert-circle', accent: 'sparkles' }[props.tone];
    return html`<div class="tk-notice" role="status" style=${`background:var(--tk-c-${props.tone === 'accent' ? 'accent' : props.tone}-soft);border-color:color-mix(in srgb, var(--tk-c-${props.tone}) 30%, transparent)`}>
      <span style=${`color:var(--tk-c-${props.tone});margin-top:1px`}><${Icon} name=${icon} size=${18} /></span>
      <div class="tk-notice__body"><div class="tk-notice__title">${props.title}</div>${props.text && html`<div class="tk-notice__text">${props.text}</div>`}</div>
      ${props.actionLabel && html`<${Button} size="sm" onClick=${() => { if (!ctx.emit('notice.action')) ctx.toast(props.actionLabel); }}>${props.actionLabel}<//>`}
      ${props.dismissible && html`<${Button} size="sm" variant="ghost" icon="x" aria-label="Schließen" onClick=${() => { setHidden(true); ctx.emit('notice.dismiss'); }} />`}
    </div>`;
  },
};

export default [pageHeader, viewSwitcher, searchFilter, actionBar, noticeBanner];
export { list as toList };
