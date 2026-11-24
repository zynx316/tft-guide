// Einkauf: nächster Einkauf – Tag, Laden, offene Artikel, Laufweg durch die Gänge; dazu der letzte Einkauf. Starten führt in den Laden-Modus.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Icon, EmptyState, Select } from '../../ui.js';
import { SHP_CSS, slots, ex, useShop, Tile } from './_shopping.js';
import { aislesFor, aisleIcon, arr, FOOD_LIST, tripsView, discardTrip, tripPrefill, TRIP_PENDING } from './_logic.js';
import { money } from '../../helpers.js';
import { fmtDate, fmtRelativeDay } from '../../../lib/format.js';
import { addDays, toIsoDay } from '../../../lib/date.js';

export const shopNextTrip = {
  id: 'shop-next-trip',
  name: 'Nächster Einkauf',
  category: 'Einkauf',
  description: 'Der nächste geplante Einkauf mit Tag, Laden, offenen Artikeln und Laufweg durch die Gänge. Darunter der letzte Einkauf aus Finanzen. „Laden-Modus starten“ öffnet die Liste für den Laden.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Nächster Einkauf' },
    { name: 'size', label: 'Größe', type: 'select', options: ['compact', 'hero'], default: 'compact' },
    { name: 'framed', label: 'In Karte', type: 'boolean', default: true },
  ],
  data: slots('trips', 'transactions', 'lists', 'shopping', 'plan', 'recipes', 'foods', 'stores'),
  events: ['trip.start', 'trip.plan', 'trip.book', 'trip.discard', 'trip.open'],
  states: ['empty'],
  flutter: { widget: 'ShopNextTrip', propMap: { size: 'size' }, events: ['trip.start', 'trip.plan', 'trip.book'] },
  css: `${SHP_CSS}
  .tk-shpt-hero { display:flex; flex-direction:column; gap:14px; } .tk-shpt-when { font-size:var(--tk-fs-2xl); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); line-height:1.15; }
  .tk-shpt-route { display:flex; flex-wrap:wrap; align-items:center; gap:6px; } .tk-shpt-route span { display:inline-flex; align-items:center; gap:5px; min-height:28px; padding:0 10px; border-radius:var(--tk-radius-pill); background:var(--tk-c-surface3); font-size:var(--tk-fs-xs); }
  .tk-shpt-route b { color:var(--tk-c-text-subtle); font-weight:var(--tk-fw-regular, 400); } .tk-shpt-last { display:flex; align-items:center; gap:10px; padding-top:12px; border-top:1px solid var(--tk-c-border); flex-wrap:wrap; }`,
  example: { data: ex('trips', 'transactions', 'lists', 'shopping', 'plan', 'recipes', 'foods', 'stores') },
  render: function ShopNextTrip({ props, data, setData, ctx }) {
    const { views, stores, today } = useShop(data, ctx);
    const [picking, setPicking] = useState(false), [day, setDay] = useState(1), [time, setTime] = useState('17:30');
    const trips = tripsView(data.trips, data.transactions), next = trips.filter((t) => t.status === 'geplant').sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))[0];
    const last = trips.filter((t) => t.status === 'erledigt').sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))[0];
    const pending = trips.find((t) => t.status === TRIP_PENDING);
    const wrap = (b) => (props.framed ? html`<${Card} title=${props.title} icon="shopping-basket">${b}<//>` : html`<div class="tk-shp">${b}</div>`);
    const plan = (offset, at) => { const date = toIsoDay(addDays(today, offset)), food = views.find((l) => l.kind === 'food') || views[0]; const id = ctx.newId('trip');
      setData('trips', (ts) => [...arr(ts), { id, status: 'geplant', date, time: at, storeId: food?.storeId || null, storeName: stores.find((s) => s.id === food?.storeId)?.name || food?.name, listId: food?.id || FOOD_LIST, note: '', transactionId: null }]);
      ctx.emit('trip.plan', { id }); setPicking(false); ctx.toast(`Einkauf ${fmtRelativeDay(date, today)} um ${at} Uhr geplant`); };
    const dayOpts = Array.from({ length: 7 }, (_, n) => ({ value: String(n), label: n === 0 ? 'Heute' : n === 1 ? 'Morgen' : fmtDate(toIsoDay(addDays(today, n)), { style: 'weekday' }) }));
    const timeOpts = Array.from({ length: 27 }, (_, n) => { const m = 7 * 60 + n * 30, t = `${String(Math.floor(m / 60)).padStart(2, '0')}:${m % 60 ? '30' : '00'}`; return { value: t, label: `${t} Uhr` }; });
    const lastRow = last && html`<div class="tk-shpt-last"><${Icon} name="receipt" size=${16} /><span class="tk-shp-meta tk-grow">Zuletzt: ${fmtRelativeDay(last.date, today)}, ${last.time} · ${last.storeName}</span>${last.total != null && html`<strong class="tk-num">${money(ctx, last.total)}</strong>`}</div>`;
    const pendingRow = pending && html`<div class="tk-shpt-last" data-qa="trip-pending" style="flex-direction:column;align-items:stretch"><div class="tk-row" style="gap:8px"><${Icon} name="receipt" size=${16} /><span class="tk-shp-meta tk-grow">Einkauf ${fmtRelativeDay(pending.date, today)}, ${pending.time} abgeschlossen: ${pending.count} Artikel${pending.total ? `, ca. ${money(ctx, pending.total)}` : ''}. Die Ausgabe ist noch nicht gebucht.</span></div>
      <div class="tk-row" style="gap:8px;flex-wrap:wrap"><${Button} size="sm" variant="primary" icon="wallet" onClick=${() => ctx.emit('trip.book', { id: pending.id, to: 'finance.quickadd', ui: { prefill: tripPrefill(pending, today) } })}>Ausgabe erfassen<//>
      <${Button} size="sm" variant="ghost" icon="undo-2" onClick=${() => { discardTrip(setData, pending); ctx.emit('trip.discard', { id: pending.id }); ctx.toast('Einkauf verworfen'); }}>Verwerfen<//></div></div>`;
    const picker = picking && html`<div class="tk-shp-add" role="group" aria-label="Tag und Uhrzeit wählen"><${Select} value=${String(day)} onChange=${(v) => setDay(Number(v))} aria-label="Tag" options=${dayOpts} /><${Select} value=${time} onChange=${setTime} aria-label="Uhrzeit" options=${timeOpts} />
      <${Button} variant="primary" icon="check" onClick=${() => plan(day, time)}>Planen<//><${Button} variant="ghost" onClick=${() => setPicking(false)}>Abbrechen<//></div>`;
    if (!next) return wrap(html`<${EmptyState} icon="shopping-basket" title="Kein Einkauf geplant" text="Plane einen Tag, dann erinnert TAKT dich und die Liste ist im Laden bereit." action=${html`<div class="tk-row" style="gap:8px;flex-wrap:wrap;justify-content:center"><${Button} variant="primary" icon="calendar-plus" onClick=${() => plan(1, '17:30')}>Für morgen planen<//><${Button} icon="calendar-clock" aria-expanded=${String(picking)} onClick=${() => setPicking(!picking)}>Tag und Uhrzeit wählen<//></div>`} />${picker}${pendingRow}${lastRow}`);
    const list = views.find((l) => l.id === next.listId) || views[0], st = stores.find((s) => s.id === next.storeId);
    const route = list ? aislesFor(st, list.items).filter((a) => list.items.some((i) => i.aisle === a && !i.done)) : [];
    const hero = props.size === 'hero';
    return wrap(html`<div class=${hero ? 'tk-shpt-hero' : 'tk-shp'}>
      <div class="tk-row" style="gap:12px;align-items:flex-start"><${Tile} icon=${st?.icon || 'store'} tone=${st?.tone || 'accent'} size=${hero ? 52 : 40} />
        <div class="tk-grow"><div class=${hero ? 'tk-shpt-when' : 'tk-shp-big'} style=${hero ? '' : 'font-size:var(--tk-fs-xl)'}>${fmtRelativeDay(next.date, today) === 'heute' || fmtRelativeDay(next.date, today) === 'morgen' ? fmtRelativeDay(next.date, today)[0].toUpperCase() + fmtRelativeDay(next.date, today).slice(1) : fmtDate(next.date, { style: 'weekday' })}, ${next.time} Uhr</div>
          <div class="tk-shp-meta">${next.storeName}${next.note ? ` · ${next.note}` : ''}</div></div></div>
      <div class="tk-shp-meta"><strong>${list ? list.open : 0}</strong> Artikel offen${list && list.priceOpen > 0 ? ` · ca. ${money(ctx, list.priceOpen, { digits: 0 })}` : ''}</div>
      ${route.length > 0 && html`<div class="tk-shpt-route" aria-label="Laufweg durch die Gänge">${route.map((a, n) => html`${n > 0 && html`<b aria-hidden="true">›</b>`}<span><${Icon} name=${aisleIcon(a)} size=${13} />${a}</span>`)}</div>`}
      <${Button} variant="primary" icon="store" onClick=${() => ctx.emit('trip.start', { id: list?.id })}>Laden-Modus starten<//>${pendingRow}${hero ? lastRow : null}</div>${hero ? null : lastRow}`);
  },
};
export default shopNextTrip;
