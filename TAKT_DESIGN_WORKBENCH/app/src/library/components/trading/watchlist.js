// Trading: Watchlist – Kurse, Tagesveränderung, Mini-Verlauf, Alarm-Markierung; sortieren, filtern, hinzufügen, entfernen mit Rückgängig.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, IconButton, EmptyState, Search, Chip, Segmented, Sparkline, Icon } from '../../ui.js';
import { arr, alertInfo, known, byId } from './_calc.js';
import { slots, Chg, Px, Tile, TRD_CSS, openSecurity } from './_trd.js';
import { TXT } from './_text.js';
import { openAddDialog } from './_watch.js';
import { ex } from './_example.js';

const SORTS = [{ value: 'manual', label: 'Eigene' }, { value: 'name', label: 'Name' }, { value: 'change', label: 'Heute' }, { value: 'price', label: 'Kurs' }];

export const trdWatchlist = {
  id: 'trd-watchlist',
  name: 'Watchlist',
  category: 'Trading',
  description: 'Beobachtete Wertpapiere mit Kurs, Tagesveränderung und Mini-Verlauf. Als Tabelle mit Aktionen in der Zeile, als Karten oder als schlanke Liste. Suchen, nach Typ filtern, sortieren, hinzufügen und entfernen (mit Rückgängig). Kurse sind fiktiv.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Watchlist' },
    { name: 'style', label: 'Darstellung', type: 'select', options: ['table', 'cards', 'compact'], default: 'table' },
    { name: 'limit', label: 'Max. Einträge (0 = alle)', type: 'number', default: 0 },
    { name: 'showTools', label: 'Suche, Filter und Sortierung', type: 'boolean', default: true },
    { name: 'showAdd', label: 'Hinzufügen-Knopf', type: 'boolean', default: true },
    { name: 'showAll', label: 'Link „Alle anzeigen“', type: 'boolean', default: false },
  ],
  data: slots('watchlist', 'instruments', 'alerts', 'positions'),
  events: ['security.open', 'watch.add', 'watch.remove', 'watch.sort', 'watch.filter', 'alert.new', 'watchlist.open'],
  states: ['empty'],
  css: `${TRD_CSS}
  .tk-trd-wl__tools { display:flex; gap:var(--tk-space-2); flex-wrap:wrap; align-items:center; margin-bottom:var(--tk-space-3); } .tk-trd-wl__tools .tk-search { flex:1 1 180px; min-width:0; }
  .tk-trd-wl__row { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:12px; align-items:center; padding:8px 4px; min-height:56px; }
  .tk-trd-wl__row--t { grid-template-columns:minmax(0,1fr) 92px auto auto; } .bp-mobile .tk-trd-wl__row--t { grid-template-columns:minmax(0,1fr) auto; }
  .tk-trd-wl__pc { display:flex; gap:14px; align-items:center; justify-content:flex-end; } .bp-mobile .tk-trd-wl__pc { flex-direction:column; align-items:flex-end; gap:2px; } .bp-mobile .tk-trd-wl__spark { display:none; }
  .tk-trd-wl__main { display:flex; align-items:center; gap:12px; min-width:0; cursor:pointer; background:none; border:0; color:inherit; font:inherit; text-align:left; padding:0; min-height:44px; border-radius:var(--tk-radius-md); }
  .tk-trd-wl__main:hover .tk-trd-title { text-decoration:underline; } .tk-trd-wl__acts { display:flex; gap:2px; } .bp-mobile .tk-trd-wl__acts { display:none; }
  .tk-trd-wl__cards { display:grid; grid-template-columns:repeat(auto-fill, minmax(min(100%, calc(210px * var(--tk-text-scale, 1))), 1fr)); gap:var(--tk-space-3); }
  .tk-trd-wl__card { border:1px solid var(--tk-c-border); border-radius:var(--tk-radius-lg); background:var(--tk-c-surface2); padding:var(--tk-space-4); display:flex; flex-direction:column; gap:10px; text-align:left; color:inherit; font:inherit; cursor:pointer; min-width:0; }
  .tk-trd-wl__card:hover { background:var(--tk-c-surface3); } .tk-trd-wl__undo { display:flex; align-items:center; gap:8px; justify-content:space-between; padding:8px 12px; border-radius:var(--tk-radius-md); background:var(--tk-c-surface2); margin-bottom:var(--tk-space-3); font-size:var(--tk-fs-sm); }`,
  example: { data: ex('watchlist', 'instruments', 'alerts', 'positions') },
  render: function TrdWatchlist({ props, data, setData, ctx }) {
    const [q, setQ] = useState(''), [type, setType] = useState('Alle'), [sort, setSort] = useState('manual'), [undo, setUndo] = useState(null);
    const all = arr(data.watchlist), types = ['Alle', ...new Set(all.map((w) => w.type))];
    const ok = known(data.positions, data.watchlist), alerts = arr(data.alerts).filter((a) => a.status === 'aktiv' && ok(a));
    let rows = all.filter((w) => (type === 'Alle' || w.type === type) && w.title.toLowerCase().includes(q.toLowerCase()));
    if (sort === 'name') rows = [...rows].sort((a, b) => a.title.localeCompare(b.title, 'de')); else if (sort === 'change') rows = [...rows].sort((a, b) => b.change - a.change); else if (sort === 'price') rows = [...rows].sort((a, b) => b.price - a.price);
    const shown = props.limit > 0 ? rows.slice(0, props.limit) : rows;
    const add = () => openAddDialog(ctx, data, setData);
    const remove = (w) => { setData('watchlist', (l) => arr(l).filter((x) => x.id !== w.id)); setUndo(w); ctx.emit('watch.remove', { id: w.id }); };
    const restore = () => { setData('watchlist', (l) => [undo, ...arr(l)]); ctx.emit('watch.add', { id: undo.id }); setUndo(null); };
    const addBtn = props.showAdd && html`<${Button} size="sm" icon="plus" onClick=${add}>Hinzufügen<//>`;
    if (!all.length) return html`<${Card} title=${props.title} icon="star" actions=${addBtn}><${EmptyState} icon="star" title="Deine Watchlist ist leer" text="Füge Wertpapiere hinzu, um Kurse, Verlauf und Alarme im Blick zu behalten. Die Kurse sind fiktiv." action=${html`<${Button} variant="primary" icon="plus" onClick=${add}>Wertpapier hinzufügen<//>`} /><//>`;
    const alertOf = (w) => alerts.find((a) => a.securityId === w.id);
    const open = (w) => openSecurity(ctx, w.id);
    const alertPill = (w) => { const a = alertOf(w); if (!a) return null; const i = alertInfo(a, byId(data.instruments, w.id) || w); return html`<span class="tk-trd-pill ${i.near ? 'tk-trd-pill--warning' : ''}" title="Kursalarm aktiv"><${Icon} name="bell" size=${11} />${a.dir === 'above' ? 'über' : 'unter'} <${Px} v=${a.price} /></span>`; };
    const sub = (w) => (w.type === 'Krypto' ? html`<span class="tk-trd-sub">${TXT.krypto}</span>` : html`<span class="tk-trd-sub">${w.type}</span>`);
    const tools = props.showTools && html`<div class="tk-trd-wl__tools"><${Search} value=${q} onInput=${setQ} placeholder="Watchlist durchsuchen" />
      <${Segmented} label="Sortierung" value=${sort} onChange=${(v) => { setSort(v); ctx.emit('watch.sort', { by: v }); }} options=${SORTS} />
      <div class="tk-row" style="gap:6px;flex-wrap:wrap;flex-basis:100%">${types.map((t) => html`<${Chip} active=${t === type} onClick=${() => { setType(t); ctx.emit('watch.filter', { type: t }); }}>${t}<//>`)}</div></div>`;
    const undoBar = undo && html`<div class="tk-trd-wl__undo" role="status"><span>${undo.title} entfernt</span><${Button} size="sm" icon="undo-2" onClick=${restore}>Rückgängig<//></div>`;
    const empty = !shown.length && html`<${EmptyState} icon="search" title="Keine Treffer" text="Passe Suche oder Filter an." />`;
    const more = props.showAll && html`<div style="margin-top:8px"><${Button} variant="ghost" size="sm" iconRight="chevron-right" onClick=${() => ctx.emit('watchlist.open', { to: 'trading.watchlist' })}>Alle ${all.length} anzeigen<//></div>`;
    const body = props.style === 'cards'
      ? html`<div class="tk-trd-wl__cards">${shown.map((w) => html`<button type="button" class="tk-trd-wl__card" onClick=${() => open(w)} aria-label=${`${w.title} öffnen`}><div class="tk-trd-row"><${Tile} type=${w.type} size=${34} /><span class="tk-trd-grow"><span class="tk-trd-title" style="display:block">${w.title}</span>${sub(w)}</span></div>
          <${Sparkline} values=${w.trend} width=${200} height=${44} tone=${w.change >= 0 ? 'success' : 'danger'} /><div class="tk-trd-row" style="justify-content:space-between"><strong class="tk-trd-num" style="font-size:var(--tk-fs-lg)"><${Px} v=${w.price} /></strong><${Chg} v=${w.change} /></div>${alertPill(w)}</button>`)}</div>`
      : html`<div class="tk-trd-list">${shown.map((w) => html`<div class=${`tk-trd-wl__row ${props.style === 'table' ? 'tk-trd-wl__row--t' : ''}`}>
          <button type="button" class="tk-trd-wl__main" onClick=${() => open(w)} aria-label=${`${w.title} öffnen`}><${Tile} type=${w.type} size=${34} /><span class="tk-trd-grow"><span class="tk-trd-title" style="display:block">${w.title}</span><span class="tk-row" style="gap:6px;flex-wrap:wrap">${sub(w)}${alertPill(w)}</span></span></button>
          ${props.style === 'table' && html`<span class="tk-trd-wl__spark"><${Sparkline} values=${w.trend} width=${84} height=${28} tone=${w.change >= 0 ? 'success' : 'danger'} /></span>`}
          <span class="tk-trd-wl__pc"><${Px} v=${w.price} /><${Chg} v=${w.change} /></span>
          ${props.style === 'table' && html`<span class="tk-trd-wl__acts"><${IconButton} icon="bell" label=${`Alarm für ${w.title} anlegen`} onClick=${() => ctx.emit('alert.new', { id: w.id, to: 'trading.alerts' })} /><${IconButton} icon="x" label=${`${w.title} von der Watchlist entfernen`} onClick=${() => remove(w)} /></span>`}</div>`)}</div>`;
    return html`<${Card} title=${props.title} icon="star" actions=${addBtn}>${tools}${undoBar}${empty || body}${more}<//>`;
  },
};
export default [trdWatchlist];
