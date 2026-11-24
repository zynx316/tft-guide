// Einkauf: Laden-Modus – große Touchflächen (mindestens 56 px), Gänge in der Reihenfolge des Ladens, Abgehaktes unten, funktioniert ohne Netz.
// „Einkauf fertig“ schließt die Liste ab und öffnet „Schnell erfassen“ in Finanzen mit vorbelegter Ausgabe.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Button, Icon, EmptyState, Progress } from '../../ui.js';
import { SHP_CSS, slots, ex, useShop } from './_shopping.js';
import { ROUTE_CSS, StoreRoute, stopsOf } from './_store-route.js';
import { groupByAisle, aislesFor, aisleIcon, toggleItem, finishList, estimate, arr, discardTrip, tripPrefill, TRIP_PENDING, FOOD_CATEGORY } from './_logic.js';
import { money } from '../../helpers.js';
import { fmtTime } from '../../../lib/format.js';

export const shopStoreMode = {
  id: 'shop-store-mode',
  name: 'Laden-Modus',
  category: 'Einkauf',
  description: 'Einkaufen mit einer Hand: große Flächen (mindestens 56 px), Gänge in der Reihenfolge deines Ladens, Abgehaktes wandert nach unten, Offline-Hinweis. Ansichten: alle Gänge (Liste), ein Gang nach dem anderen (walk) und Laufweg (route: Fortschrittsring, ein Stopp je Gang als Karte mit großen Artikelkacheln). „Einkauf fertig“ führt zur Ausgabe in Finanzen.',
  version: '1.2',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Im Laden' },
    { name: 'showOffline', label: 'Offline-Hinweis', type: 'boolean', default: true },
    { name: 'view', label: 'Ansicht', type: 'select', options: ['aisles', 'walk', 'route'], default: 'aisles' },
    { name: 'showListSwitch', label: 'Listenwechsel', type: 'boolean', default: true },
    { name: 'financeTarget', label: 'Ziel nach „Einkauf fertig“', type: 'text', default: 'finance.quickadd' },
  ],
  data: slots('lists', 'shopping', 'plan', 'recipes', 'foods', 'stores', 'trips', 'transactions'),
  events: ['item.toggle', 'store.switch', 'store.done', 'store.exit'],
  states: ['empty'],
  a11y: { role: 'list', nameFrom: 'Listenname' },
  flutter: { widget: 'ShopStoreMode', propMap: { financeTarget: 'financeRoute' }, events: ['item.toggle', 'store.done'] },
  css: `${SHP_CSS}
  ${ROUTE_CSS}
  .tk-shps-bar { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
  .tk-shps-sw { display:flex; flex-wrap:wrap; gap:8px; } .tk-shps-sw button { flex:0 1 auto; max-width:100%; white-space:normal; text-align:left; min-height:56px; padding:0 18px; border-radius:var(--tk-radius-lg); border:1.5px solid var(--tk-c-border-strong); background:var(--tk-c-surface2); color:inherit; font:inherit; font-weight:var(--tk-fw-semibold); cursor:pointer; display:inline-flex; align-items:center; gap:8px; }
  .tk-shps-sw button[aria-pressed="true"] { background:var(--tk-c-accent); color:var(--tk-c-text-on-accent); border-color:var(--tk-c-accent); }
  .tk-shps-off { display:flex; align-items:center; gap:8px; padding:10px 12px; border-radius:var(--tk-radius-md); background:var(--tk-c-surface2); border:1px solid var(--tk-c-border); font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); }
  .tk-shps-off[data-offline="true"] { border-color:var(--tk-c-warning); color:var(--tk-c-text); }
  .tk-shps-row { display:flex; align-items:center; gap:12px; width:100%; min-height:64px; padding:6px 4px; border:0; border-bottom:1px solid var(--tk-c-border); background:none; color:inherit; font:inherit; text-align:left; cursor:pointer; min-width:0; }
  .tk-shps-row:active { background:var(--tk-c-surface2); } .tk-shps-row:focus-visible { outline:2px solid var(--tk-c-focus); outline-offset:-2px; }
  .tk-shps-box { width:44px; height:44px; flex:none; border-radius:var(--tk-radius-md); border:2px solid var(--tk-c-border-strong); display:grid; place-items:center; color:var(--tk-c-text-on-accent); }
  .tk-shps-row[aria-checked="true"] .tk-shps-box { background:var(--tk-c-success); border-color:var(--tk-c-success); }
  .tk-shps-name { flex:1; min-width:0; font-size:var(--tk-fs-xl); font-weight:var(--tk-fw-medium); overflow-wrap:break-word; line-height:1.2; } .tk-shps-qty { font-size:var(--tk-fs-lg); font-variant-numeric:tabular-nums; white-space:nowrap; color:var(--tk-c-text-muted); }
  .tk-shps-row[aria-checked="true"] .tk-shps-name { text-decoration:line-through; color:var(--tk-c-text-muted); } .tk-shps-row[aria-checked="true"] { opacity:.7; }
  .tk-shps-aisle { display:flex; align-items:center; gap:10px; padding:16px 4px 6px; font-size:var(--tk-fs-md); font-weight:var(--tk-fw-bold); } .tk-shps-aisle span { margin-left:auto; color:var(--tk-c-text-muted); font-variant-numeric:tabular-nums; }
  .tk-shps-fold { width:100%; min-height:56px; border:0; background:none; color:inherit; font:inherit; font-size:var(--tk-fs-md); font-weight:var(--tk-fw-bold); cursor:pointer; text-align:left; } .tk-shps-fold:focus-visible { outline:2px solid var(--tk-c-focus); outline-offset:-2px; }
  .tk-shps-next { display:flex; flex-direction:column; gap:10px; margin-top:12px; } .tk-shps-chips { display:flex; flex-wrap:wrap; gap:8px; } .tk-shps-chips button { display:inline-flex; align-items:center; gap:6px; min-height:56px; padding:0 16px; border-radius:var(--tk-radius-pill); border:1px solid var(--tk-c-border-strong); background:var(--tk-c-surface3); color:inherit; font:inherit; font-size:var(--tk-fs-sm); cursor:pointer; text-align:left; } .tk-shps-chips button:focus-visible { outline:2px solid var(--tk-c-focus); }
  .tk-shps-nav { display:flex; gap:10px; flex-wrap:wrap; } .tk-shps-nav .tk-shps-nextbtn { flex:1 1 160px; width:auto; }
  .tk-shps-nextbtn { min-height:60px; width:100%; font-size:var(--tk-fs-lg); } .bp-mobile .tk-shps-nextbtn { height:60px; }
  [data-tk-large-text] .tk-shps-row { display:grid; grid-template-columns:44px minmax(0, 1fr); column-gap:12px; align-items:center; }
  [data-tk-large-text] .tk-shps-box { grid-row:1 / span 2; } [data-tk-large-text] .tk-shps-name { grid-column:2; overflow-wrap:break-word; } [data-tk-large-text] .tk-shps-qty { grid-column:2; white-space:normal; font-size:var(--tk-fs-md); }
  [data-tk-large-text] .tk-shps-aisle { flex-wrap:wrap; }
  .tk-shps-finish { min-height:60px; width:100%; font-size:var(--tk-fs-lg); margin-top:12px; } .bp-mobile .tk-shps-finish { height:60px; }`,
  example: { data: ex('lists', 'shopping', 'plan', 'recipes', 'foods', 'stores', 'trips', 'transactions') },
  render: function ShopStoreMode({ props, data, setData, ctx }) {
    const { views, sel: list, store, today } = useShop(data, ctx);
    const [showDone, setShowDone] = useState(true), [finished, setFinished] = useState(null), [walkIdx, setWalkIdx] = useState(0);
    if (!list) return html`<${EmptyState} icon="store" title="Noch keine Liste" text="Lege eine Liste an, dann kannst du sie im Laden abarbeiten." />`;
    const st = store(list), aisles = aislesFor(st, list.items), { groups, done } = groupByAisle(list.items, aisles, { doneApart: true });
    const wi = Math.max(0, Math.min(walkIdx, groups.length - 1)), cur = groups[wi], isWalk = props.view === 'walk', isRoute = props.view === 'route';
    const offline = !!ctx.env?.offline, total = list.total, left = list.open;
    const toggle = (i) => { toggleItem(setData, list, i); ctx.emit('item.toggle', { id: i.id, done: !i.done }); };
    const Row = (i) => html`<button type="button" role="checkbox" aria-checked=${String(i.done)} class="tk-shps-row" onClick=${() => toggle(i)}>
      <span class="tk-shps-box">${i.done && html`<${Icon} name="check" size=${26} stroke=${3} />`}</span><span class="tk-shps-name">${i.name}</span>${i.qty && html`<span class="tk-shps-qty">${i.qty}</span>`}</button>`;
    const finish = () => {
      const bought = list.items.filter((i) => i.done), spent = Math.round(estimate(list.items.map((i) => ({ ...i, done: !i.done }))) * 100) / 100;
      const undoList = finishList(setData, list);
      const trips = arr(data.trips), planned = trips.find((t) => t.status === 'geplant' && t.storeId === list.storeId);
      // Der Einkauf gilt erst als erledigt, wenn die Ausgabe in Finanzen gebucht ist (Abgleich in tripsView); bis dahin „abzurechnen“.
      const trip = { id: planned?.id || ctx.newId('trip'), status: TRIP_PENDING, date: today, time: fmtTime(ctx.now()), storeId: list.storeId, storeName: st?.name || list.name, listId: list.id, note: '', transactionId: null, total: spent, count: bought.length,
        category: list.kind === 'food' ? FOOD_CATEGORY : 'Haushalt', seenTx: arr(data.transactions).map((t) => t.id), planned: planned || null };
      setData('trips', (ts) => (planned ? arr(ts).map((t) => (t.id === planned.id ? trip : t)) : [trip, ...arr(ts)]));
      setFinished({ count: bought.length, trip, undoList });
      if (!ctx.emit('store.done', { id: list.id, to: props.financeTarget, ui: { prefill: tripPrefill(trip, today) } })) ctx.toast(`Einkauf abgeschlossen: ${bought.length} Artikel`);
    };
    const discard = () => { discardTrip(setData, finished.trip); finished.undoList(); setFinished(null); ctx.toast('Einkauf verworfen, die Artikel stehen wieder auf der Liste'); };
    if (finished) return html`<div class="tk-shp"><${EmptyState} icon="check-circle-2" title="Einkauf abgeschlossen" text=${`${finished.count} Artikel im Wagen. Trage die Ausgabe in Finanzen ein, damit das Budget stimmt.`} action=${html`<div class="tk-shps-nav"><${Button} variant="primary" icon="wallet" onClick=${() => ctx.emit('store.done', { id: list.id, to: props.financeTarget, ui: { prefill: tripPrefill(finished.trip, today) } })}>Ausgabe erfassen<//><${Button} variant="ghost" icon="undo-2" onClick=${discard}>Verwerfen<//></div>`} /></div>`;
    if (total === 0) return html`<div class="tk-shp"><${EmptyState} icon="shopping-cart" title="Noch nichts auf der Liste" text=${`Auf „${list.name}“ steht noch nichts. Schreib auf, was fehlt, dann kannst du es im Laden abarbeiten.`} action=${html`<${Button} variant="primary" icon="plus" onClick=${() => ctx.emit('store.exit', { id: list.id })}>Artikel erfassen<//>`} /></div>`;
    const Chips = isWalk && groups.length > 1 && html`<div class="tk-shps-chips" role="group" aria-label="Gang wählen">${groups.map((g, n) => n !== wi && html`<button type="button" onClick=${() => setWalkIdx(n)}><${Icon} name=${aisleIcon(g.aisle)} size=${16} />${g.aisle} · ${g.items.length}</button>`)}</div>`;
    const shown = isWalk ? [cur].filter(Boolean) : groups;
    return html`<div class="tk-shp">
      ${props.showListSwitch && views.length > 1 && html`<div class="tk-shps-sw" role="group" aria-label="Liste wählen">${views.map((l) => html`<button type="button" aria-pressed=${String(l.id === list.id)} onClick=${() => { ctx.setUi('selectedId', l.id); setWalkIdx(0); ctx.emit('store.switch', { id: l.id }); }}><${Icon} name=${l.icon} size=${18} />${l.name}<span class="tk-num">${l.open}</span></button>`)}</div>`}
      ${!isRoute && html`<div class="tk-shps-bar"><div class="tk-grow"><div class="tk-shp-big">${left === 0 ? 'Alles im Wagen' : `${left} offen`}</div><div class="tk-shp-meta">${st ? st.name : list.name} · ${total - left} von ${total}${list.priceOpen > 0 ? ` · ca. ${money(ctx, list.priceOpen, { digits: 0 })} offen` : ''}</div></div></div><${Progress} value=${total ? (total - left) / total : 0} tone="success" />`}
      ${props.showOffline && html`<div class="tk-shps-off" role="status" data-offline=${String(offline)} data-qa="store-offline"><${Icon} name=${offline ? 'wifi-off' : 'wifi'} size=${18} /><span>${offline ? 'Offline: Abhaken wird gespeichert und später abgeglichen.' : 'Die Liste liegt auf deinem Gerät und funktioniert auch ohne Netz.'}</span></div>`}
      ${isRoute ? html`<${StoreRoute} ctx=${ctx} stops=${stopsOf(list.items, aisles)} toggle=${toggle} left=${left} total=${total} storeName=${st ? st.name : list.name} priceOpen=${list.priceOpen} />` : html`<div>${shown.map((g) => html`<div class="tk-shps-aisle"><${Icon} name=${aisleIcon(g.aisle)} size=${20} />${isWalk ? `Gang ${wi + 1} von ${groups.length}: ` : ''}${g.aisle}<span>${g.items.length}</span></div>${g.items.map(Row)}`)}
        ${isWalk && groups.length > 1 && html`<div class="tk-shps-next"><div class="tk-shps-nav">${wi > 0 && html`<${Button} class="tk-shps-nextbtn" icon="arrow-left" onClick=${() => setWalkIdx(wi - 1)}>Vorheriger Gang<//>`}${wi < groups.length - 1 ? html`<${Button} class="tk-shps-nextbtn" icon="arrow-right" onClick=${() => setWalkIdx(wi + 1)}>Nächster Gang<//>` : html`<div class="tk-shp-sub" style="align-self:center">Das war der letzte Gang.</div>`}</div>${Chips}</div>`}
        ${groups.length === 0 && done.length > 0 && html`<${EmptyState} icon="check-circle-2" title="Alles im Wagen" text="Alle Artikel sind abgehakt. Schließe den Einkauf ab." />`}
        ${done.length > 0 && html`<button type="button" class="tk-shps-aisle tk-shps-fold" aria-expanded=${String(showDone)} onClick=${() => setShowDone(!showDone)}><${Icon} name="shopping-basket" size=${20} />Im Wagen<span>${done.length}</span><${Icon} name=${showDone ? 'chevron-up' : 'chevron-down'} size=${20} /></button>${showDone && done.map(Row)}`}</div>`}
      <${Button} class="tk-shps-finish" variant=${left === 0 ? 'primary' : 'default'} icon="check-check" disabled=${total - left === 0} onClick=${finish}>Einkauf fertig<//>
      <div class="tk-shp-sub" style="text-align:center">${total - left === 0 ? 'Hake erst etwas ab.' : 'Danach trägst du die Ausgabe in Finanzen ein.'}</div></div>`;
  },
};
export default shopStoreMode;
