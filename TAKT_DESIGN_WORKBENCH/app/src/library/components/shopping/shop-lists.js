// Einkauf: Listen mit offenen Artikeln – als Zeilen (dicht), Karten mit Ring (visuell) oder Auswahl-Chips (Listenwechsel).
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Icon, Chip, Ring, Input, Select, EmptyState } from '../../ui.js';
import { SHP_CSS, slots, ex, useShop, Tile } from './_shopping.js';
import { DEFAULT_AISLES } from './_logic.js';

export const shopLists = {
  id: 'shop-lists',
  name: 'Einkaufslisten',
  category: 'Einkauf',
  description: 'Alle Einkaufslisten mit offenen Artikeln, Laden und Fortschritt. Stile: Zeilen (dicht), Karten mit Ring (visuell) und Chips (Listenwechsel im Screen). Die Lebensmittel-Liste kommt aus Ernährung.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Listen' },
    { name: 'style', label: 'Stil', type: 'select', options: ['rows', 'cards', 'chips'], default: 'rows' },
    { name: 'showStore', label: 'Laden zeigen', type: 'boolean', default: true },
    { name: 'allowCreate', label: 'Neue Liste anlegen', type: 'boolean', default: true },
    { name: 'framed', label: 'In Karte', type: 'boolean', default: true },
  ],
  data: slots('lists', 'shopping', 'plan', 'recipes', 'foods', 'stores'),
  events: ['list.open', 'list.select', 'list.create'],
  states: ['empty'],
  a11y: { role: 'list', nameFrom: 'Titel' },
  flutter: { widget: 'ShopListOverview', propMap: { style: 'style', showStore: 'showStore' }, events: ['list.open', 'list.select', 'list.create'] },
  css: `${SHP_CSS}
  .tk-shpl-row { display:flex; align-items:center; gap:12px; width:100%; min-height:60px; padding:8px 0; border:0; border-bottom:1px solid var(--tk-c-border); background:none; color:inherit; text-align:left; cursor:pointer; min-width:0; }
  .tk-shpl-row:last-child { border-bottom:0; } .tk-shpl-row:hover .tk-shpl-name { text-decoration:underline; }
  .tk-shpl-name { font-weight:var(--tk-fw-semibold); } .tk-shpl-num { margin-left:auto; text-align:right; flex:none; }
  .tk-shpl-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(min(100%, 150px), 1fr)); gap:var(--tk-space-3); }
  .tk-shpl-card { display:flex; flex-direction:column; gap:12px; align-items:flex-start; padding:16px; border-radius:var(--tk-radius-lg); background:var(--tk-c-surface); border:1px solid var(--tk-c-border); color:inherit; text-align:left; cursor:pointer; min-width:0; min-height:44px; }
  .tk-shpl-card:hover { border-color:var(--tk-c-border-strong); background:var(--tk-c-surface2); } .tk-shpl-card:focus-visible { outline:2px solid var(--tk-c-focus); }
  .tk-shpl-card__top { display:flex; align-items:center; justify-content:space-between; width:100%; gap:8px; }
  .tk-shpl-card .tk-shp-big { font-size:var(--tk-fs-3xl); }
  [data-tk-large-text] .tk-shpl-row { flex-wrap:wrap; } [data-tk-large-text] .tk-shpl-row > div:nth-of-type(1) { flex:1 1 0 !important; min-width:60% !important; }
  [data-tk-large-text] .tk-shpl-num { margin-left:56px; text-align:left; display:flex; gap:8px; align-items:baseline; }`,
  example: { data: ex('lists', 'shopping', 'plan', 'recipes', 'foods', 'stores') },
  render: function ShopLists({ props, data, setData, ctx }) {
    const { views, store, sel } = useShop(data, ctx);
    const [creating, setCreating] = useState(false), [name, setName] = useState(''), [storeId, setStoreId] = useState('');
    const open = (l) => { ctx.setUi('selectedId', l.id); ctx.emit(props.style === 'chips' ? 'list.select' : 'list.open', { id: l.id }); };
    const create = () => {
      const n = name.trim(); if (!n) return;
      const st = (data.stores || []).find((s) => s.id === storeId);
      const id = ctx.newId('sl');
      setData('lists', (ls) => [...(Array.isArray(ls) ? ls : []), { id, name: n, icon: 'list', tone: 'accent', kind: 'custom', storeId: st?.id || null, shared: false, aisles: st?.aisles || DEFAULT_AISLES, items: [] }]);
      ctx.emit('list.create', { id }); ctx.toast(`Liste „${n}“ angelegt`); setName(''); setCreating(false); ctx.setUi('selectedId', id);
    };
    const form = props.allowCreate && (creating
      ? html`<div class="tk-shp-add" style="flex-wrap:wrap"><${Input} value=${name} onInput=${setName} placeholder="z. B. Geschenke" aria-label="Name der neuen Liste" onKeyDown=${(e) => e.key === 'Enter' && create()} />
          <${Select} value=${storeId} onChange=${setStoreId} aria-label="Laden" options=${[{ value: '', label: 'Ohne Laden' }, ...(data.stores || []).map((s) => ({ value: s.id, label: s.short || s.name }))]} />
          <${Button} variant="primary" icon="check" onClick=${create}>Anlegen<//><${Button} variant="ghost" onClick=${() => setCreating(false)}>Abbrechen<//></div>`
      : html`<${Button} size="sm" icon="plus" onClick=${() => setCreating(true)}>Neue Liste<//>`);
    const wrap = (b) => (props.framed && props.style !== 'chips' ? html`<${Card} title=${props.title} icon="shopping-cart" actions=${form && !creating ? form : null}>${b}${creating ? form : null}<//>` : html`<div class="tk-shp">${b}${props.style === 'chips' ? form : null}</div>`);
    if (!views.length) return wrap(html`<${EmptyState} icon="shopping-cart" title="Noch keine Liste" text="Lege eine Liste an, zum Beispiel für Drogerie oder Baumarkt." />`);
    const allEmpty = props.style !== 'chips' && views.every((l) => l.total === 0);
    if (allEmpty) return wrap(html`<${EmptyState} icon="shopping-cart" title="Erste Liste füllen" text="Schreib auf, was fehlt, oder plane Mahlzeiten, dann entsteht die Lebensmittel-Liste von selbst." action=${html`<${Button} variant="primary" icon="plus" onClick=${() => open(views[0])}>Erste Liste füllen<//>`} />`);
    const sub = (l) => `${props.showStore && store(l) ? `${store(l).short || store(l).name} · ` : ''}${l.open === 0 ? (l.total ? 'alles erledigt' : 'noch leer') : `${l.open} offen`}`;
    if (props.style === 'chips') return wrap(html`<div class="tk-shp-chips" role="group" aria-label="Liste wählen">${views.map((l) => html`<${Chip} active=${sel && sel.id === l.id} icon=${l.icon} onClick=${() => open(l)}>${l.name} <span class="tk-num">${l.open}</span><//>`)}</div>`);
    if (props.style === 'cards') return wrap(html`<div class="tk-shpl-grid">${views.map((l) => html`<button type="button" class="tk-shpl-card" onClick=${() => open(l)} aria-label=${`${l.name}: ${sub(l)}`}>
      <div class="tk-shpl-card__top"><${Tile} icon=${l.icon} tone=${l.tone} /><${Ring} value=${l.done} max=${Math.max(1, l.total)} size=${52} stroke=${6} tone=${l.tone || 'accent'} label=${`${l.done} von ${l.total} erledigt`} /></div>
      <div style="min-width:0;width:100%"><div class="tk-shp-big">${l.open}</div><div class="tk-shpl-name tk-truncate">${l.name}</div><div class="tk-shp-sub tk-truncate">${sub(l)}</div></div></button>`)}</div>`);
    return wrap(html`<div>${views.map((l) => html`<button type="button" class="tk-shpl-row" onClick=${() => open(l)}>
      <${Tile} icon=${l.icon} tone=${l.tone} /><div style="min-width:0;flex:1"><div class="tk-shpl-name tk-truncate">${l.name}</div><div class="tk-shp-sub tk-truncate">${sub(l)}${l.shared ? ' · geteilt' : ''}</div></div>
      <div class="tk-shpl-num"><div class="tk-shp-big" style="font-size:var(--tk-fs-xl)">${l.open}</div><div class="tk-shp-sub">von ${l.total}</div></div><${Icon} name="chevron-right" size=${16} /></button>`)}</div>`);
  },
};
export default shopLists;
