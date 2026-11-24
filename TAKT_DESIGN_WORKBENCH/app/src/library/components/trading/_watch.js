// Trading – Watchlist-Aktionen: Wertpapier hinzufügen (Dialog mit Suche) und Beobachten ein/aus.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Search, Chip, EmptyState } from '../../ui.js';
import { arr, dayPctOf } from './_calc.js';
import { Tile, Chg, Px } from './_trd.js';

/** Zeile im Weltformat der Watchlist aus einem Papier mit Kursverlauf. */
export const watchRowOf = (i) => ({ id: i.id, title: i.name, type: i.type, price: i.price, change: +dayPctOf(i).toFixed(4), trend: arr(i.ranges?.['1M']).slice(-8).map((c) => c.c) });

function AddBody({ candidates, onPick }) {
  const [q, setQ] = useState(''), [type, setType] = useState('Alle');
  const types = ['Alle', ...new Set(candidates.map((c) => c.type))];
  const list = candidates.filter((c) => (type === 'Alle' || c.type === type) && `${c.name} ${c.symbol} ${c.isin || ''}`.toLowerCase().includes(q.toLowerCase()));
  return html`<div class="tk-col" style="gap:12px"><${Search} value=${q} onInput=${setQ} placeholder="Name, Kürzel oder ISIN" />
    <div class="tk-row" style="gap:6px;flex-wrap:wrap">${types.map((t) => html`<${Chip} active=${t === type} onClick=${() => setType(t)}>${t}<//>`)}</div>
    ${list.length ? html`<div class="tk-trd-list">${list.map((c) => html`<button type="button" class="tk-trd-tap tk-trd-item" onClick=${() => onPick(c)} aria-label=${`${c.name} zur Watchlist hinzufügen`}>
      <${Tile} type=${c.type} size=${34} /><span class="tk-trd-grow"><span class="tk-trd-title" style="display:block">${c.name}</span><span class="tk-trd-sub">${c.symbol}${c.isin ? ` · ${c.isin}` : ''} · ${c.type}</span></span>
      <span style="text-align:right"><${Px} v=${c.price} /><span style="display:block"><${Chg} v=${dayPctOf(c)} /></span></span></button>`)}</div>`
      : html`<${EmptyState} icon="search" title="Nichts gefunden" text="Prüfe die Schreibweise oder wähle einen anderen Typ." />`}</div>`;
}

/** Dialog „Wertpapier hinzufügen“. Der Katalog enthält fiktive Papiere, die noch nicht beobachtet werden. */
export function openAddDialog(ctx, data, setData) {
  const have = new Set([...arr(data.watchlist), ...arr(data.positions)].map((x) => x.id));
  const candidates = arr(data.instruments).filter((i) => !have.has(i.id));
  ctx.emit('watch.add.open');
  ctx.openDialog({ title: 'Wertpapier hinzufügen', body: (close) => html`<${AddBody} candidates=${candidates} onPick=${(c) => { setData('watchlist', (l) => [watchRowOf(c), ...arr(l)]); ctx.emit('watch.add', { id: c.id }); ctx.toast(`${c.short || c.name} steht jetzt auf der Watchlist`); close(); }} />`,
    footer: (close) => html`<button type="button" class="tk-btn" onClick=${close}>Schließen</button>` });
}
/** Beobachten ein/aus für ein Papier (Watchlist-Eintrag anlegen oder entfernen). */
export function toggleWatch(ctx, inst, watchlist, setData) {
  const on = arr(watchlist).some((w) => w.id === inst.id);
  setData('watchlist', (l) => (on ? arr(l).filter((w) => w.id !== inst.id) : [watchRowOf(inst), ...arr(l)]));
  ctx.emit(on ? 'watch.remove' : 'watch.add', { id: inst.id }); ctx.toast(on ? `${inst.short || inst.name} von der Watchlist entfernt` : `${inst.short || inst.name} steht jetzt auf der Watchlist`);
}
