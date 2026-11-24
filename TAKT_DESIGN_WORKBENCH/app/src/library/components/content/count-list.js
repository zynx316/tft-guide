// Liste mit ehrlicher Gesamtzahl (Verlauf, „Zu prüfen“, „Zuletzt gelesen“), „Alle (n) ›“ und fachlichen Leerzuständen
import { html } from '../../../lib/html.js';
import { Card, Button, Badge, Icon, EmptyState, toneColor } from '../../ui.js';
import { applyUiFilter } from '../../helpers.js';
import { maskMoney } from '../../../lib/format.js';

/** Privatsphäre-Modus: Beträge im Freitext (erkannter Beleg-Text) werden ausgeblendet. */
const hideAmounts = (ctx, t) => (ctx.privacy && typeof t === 'string' ? t.replace(/\d[\d.]*,\d{2}\s?(€|EUR)/g, () => maskMoney('0 €')) : t);

export const countList = {
  id: 'count-list',
  name: 'Liste mit Gesamtzahl',
  category: 'Inhalte',
  description: 'Einträge (Erfassungen, Artikel, Belege …) als Liste mit Icon, Untertitel, Badge und Meta. Der Zähler nennt immer die Gesamtzahl, auch wenn nur ein Ausschnitt sichtbar ist („Alle (11) ›“ führt zum Verlauf). Leerzustände benennen den fachlichen Grund statt eines allgemeinen „Lege den ersten Eintrag an“.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Verlauf' },
    { name: 'limit', label: 'Max. Einträge (0 = alle)', type: 'number', default: 0 },
    { name: 'dense', label: 'Kompakt (ohne Untertitel)', type: 'boolean', default: false },
    { name: 'link', label: 'Link-Beschriftung (leer = ohne)', type: 'text', default: '' },
    { name: 'emptyTitle', label: 'Leerzustand Titel', type: 'text', default: 'Noch keine Einträge' },
    { name: 'emptyText', label: 'Leerzustand Text', type: 'text', default: 'Sobald etwas vorliegt, erscheint es hier.' },
    { name: 'quietEmpty', label: 'Ohne Einträge nichts anzeigen', type: 'boolean', default: false },
    { name: 'respectFilter', label: 'Suche/Filter beachten', type: 'boolean', default: true },
  ],
  data: [{ slot: 'items', label: 'Einträge', default: 'items', shape: '{id,title,subtitle?,meta?,badge?,tone?,icon?}[]', required: true }],
  events: ['item.open', 'list.all.open'],
  states: ['empty'],
  flutter: { widget: 'TaktCountList', propMap: { title: 'title', limit: 'limit', dense: 'dense' }, events: { 'item.open': 'onItemTap', 'list.all.open': 'onAllTap' } },
  css: `
  .tk-cnl__row { display:flex; align-items:center; gap:12px; width:100%; min-height:56px; padding:8px 16px; border:0; border-bottom:1px solid var(--tk-c-border); background:transparent; color:inherit; font:inherit; text-align:left; cursor:pointer; min-width:0; }
  .tk-cnl__row:last-child { border-bottom:0; }
  .tk-cnl__row:hover { background:var(--tk-c-surface2); }
  .tk-cnl__row[aria-current="true"] { background:var(--tk-c-accent-soft); }
  .tk-cnl--dense .tk-cnl__row { min-height:44px; padding-top:4px; padding-bottom:4px; }
  .bp-mobile .tk-cnl--dense .tk-cnl__row { min-height:48px; }
  .tk-cnl__ico { width:34px; height:34px; border-radius:10px; display:grid; place-items:center; flex:none; background:var(--tk-c-surface2); }
  .tk-cnl__main { flex:1; min-width:0; display:flex; flex-direction:column; gap:1px; }
  .tk-cnl__title { font-weight:var(--tk-fw-medium); }
  .tk-cnl__sub { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); }
  .tk-cnl__meta { font-size:var(--tk-fs-sm); color:var(--tk-c-text-subtle); white-space:nowrap; flex:none; }
  [data-tk-large-text] .tk-cnl__title, [data-tk-large-text] .tk-cnl__sub { white-space:normal; overflow:visible; text-overflow:clip; overflow-wrap:anywhere; }
  [data-tk-large-text] .tk-cnl__row { flex-wrap:wrap; }
  [data-tk-large-text] .tk-cnl__meta { white-space:normal; }`,
  example: { props: { title: 'Verlauf', limit: 2, link: 'Alle' }, data: { items: [
    { id: 'c1', title: 'Quittung Bäckerei Hoffmann', subtitle: 'Bäckerei Hoffmann · Bahnhofstraße 12', meta: 'Heute, 08:12', badge: '97 %', tone: 'success', icon: 'camera' },
    { id: 'c2', title: 'Whiteboard Sprint-Planung', subtitle: 'Sprint 23 – Planung · Ziel: Workbench-Beta', meta: 'Gestern', badge: '91 %', tone: 'warning', icon: 'camera' },
    { id: 'c3', title: 'Screenshot Fehlermeldung', subtitle: 'Error 503: Service Unavailable', meta: '20.11.', badge: '99 %', tone: 'success', icon: 'clipboard' },
  ] } },
  render: ({ props, data, ctx }) => {
    const all = applyUiFilter(data.items, ctx.ui, { respect: props.respectFilter });
    const total = all.length;
    const narrow = (ctx.blockWidth || 999) < 420 && ctx.bp !== 'mobile'; // schmale Master-Spalte am Desktop: Zeitangabe unter den Titel
    if (!total && props.quietEmpty && !ctx.ui.query && !(data.items || []).length) return null;
    const items = props.limit > 0 ? all.slice(0, props.limit) : all;
    const open = (it) => { ctx.setUi('selectedId', it.id); ctx.emit('item.open', { id: it.id }); };
    const link = props.link && total > 0 && html`<${Button} size="sm" variant="ghost" iconRight="chevron-right" onClick=${() => ctx.emit('list.all.open')}>${total > items.length ? `${props.link} (${total})` : props.link}<//>`;
    const body = !items.length
      ? html`<${EmptyState} icon="inbox" title=${props.emptyTitle} text=${ctx.ui.query ? `Keine Treffer für „${ctx.ui.query}“.` : props.emptyText} />`
      : items.map((it) => html`<button type="button" class="tk-cnl__row" aria-current=${ctx.ui.selectedId === it.id ? 'true' : 'false'} onClick=${() => open(it)}>
        ${it.icon && html`<span class="tk-cnl__ico" style=${`color:${toneColor(it.tone || 'accent')}`}><${Icon} name=${it.icon} size=${17} /></span>`}
        <span class="tk-cnl__main"><span class="tk-cnl__title tk-truncate">${it.title}</span>${(it.subtitle || (narrow && it.meta)) && !props.dense && html`<span class="tk-cnl__sub tk-truncate">${[narrow && it.meta, it.subtitle && hideAmounts(ctx, it.subtitle)].filter(Boolean).join(' · ')}</span>`}</span>
        ${it.badge && html`<${Badge} tone=${it.tone || 'neutral'}>${it.badge}<//>`}${it.meta && ctx.bp !== 'mobile' && !narrow && html`<span class="tk-cnl__meta">${it.meta}</span>`}
      </button>`);
    return html`<${Card} flush title=${props.title} class=${`tk-cnl ${props.dense ? 'tk-cnl--dense' : ''}`} actions=${html`<div class="tk-row"><${Badge}>${total}<//>${link}</div>`}>${body}<//>`;
  },
};
