// Einkauf & Haushalt: „Was ist als Nächstes zu tun?“ – priorisiert aus Wartung, Einkaufsplan und knappen Vorräten, jede Zeile mit einer Ein-Tipp-Aktion.
import { html } from '../../../lib/html.js';
import { Card, Button, Icon, EmptyState } from '../../ui.js';
import { SHP_CSS, slots, ex, useShop, useUndo, UndoBar, Tile } from './_shopping.js';
import { householdSorted, dueText, finishHousehold, needsRefill, tripsView, tripPrefill, TRIP_PENDING, refillToList, findOnList, targetList, arr } from './_logic.js';
import { fmtDate, fmtRelativeDay } from '../../../lib/format.js';
import { money } from '../../helpers.js';

export const shopNextUp = {
  id: 'shop-next-up',
  name: 'Als Nächstes (Einkauf)',
  category: 'Einkauf',
  description: 'Priorisierte nächste Schritte: überfällige und heutige Wartung, geplanter Einkauf, knappe Vorräte. Die erste Zeile ist groß, jede Zeile hat eine Aktion ohne Umweg.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Als Nächstes' },
    { name: 'limit', label: 'Max. Einträge', type: 'number', default: 4 },
    { name: 'soonDays', label: 'Wartung „bald“ bis (Tage)', type: 'number', default: 7 },
  ],
  data: slots('household', 'trips', 'transactions', 'tasks', 'pantry', 'lists', 'shopping', 'plan', 'recipes', 'foods', 'stores'),
  events: ['next.household', 'next.trip', 'next.book', 'next.pantry', 'next.open', 'item.add.open', 'item.undo'],
  states: ['empty'],
  flutter: { widget: 'ShopNextUp', propMap: { limit: 'limit' }, events: ['next.household', 'next.trip', 'next.pantry'] },
  css: `${SHP_CSS}
  .tk-shpn-hero { display:flex; flex-direction:column; gap:12px; padding:18px; border-radius:var(--tk-radius-xl); background:color-mix(in srgb, var(--tc) 10%, var(--tk-c-surface)); border:1px solid color-mix(in srgb, var(--tc) 40%, var(--tk-c-border)); }
  .tk-shpn-hero .tk-h2 { overflow-wrap:anywhere; } .tk-shpn-hero .tk-btn { align-self:flex-start; }
  .tk-shpn-row { display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid var(--tk-c-border); flex-wrap:wrap; min-width:0; } .tk-shpn-row:last-child { border-bottom:0; }
  .tk-shpn-row .tk-grow { flex:1 1 160px; } .tk-shpn-t { font-weight:var(--tk-fw-medium); overflow-wrap:anywhere; }`,
  example: { data: ex('household', 'trips', 'transactions', 'tasks', 'pantry', 'lists', 'shopping', 'plan', 'recipes', 'foods', 'stores') },
  render: function ShopNextUp({ props, data, setData, ctx }) {
    const { today, views } = useShop(data, ctx), [u, setU] = useUndo();
    const hh = householdSorted(data.household, today), food = views.find((l) => l.kind === 'food');
    const allTrips = tripsView(data.trips, data.transactions), booking = allTrips.find((t) => t.status === TRIP_PENDING);
    const trip = allTrips.filter((t) => t.status === 'geplant').sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))[0];
    const done = (t) => { const r = finishHousehold(setData, data, t.id, today); if (!r) return; ctx.emit('next.household', { id: t.id });
      setU({ text: `${t.name}: erledigt. Nächstes Mal ${fmtDate(r.next.due, { style: 'weekday' })}`, restore: r.restore }); };
    const refill = (p) => { const r = refillToList(setData, views, p, ctx.newId('si')); ctx.emit('next.pantry', { id: p.id }); if (r.added) setU({ text: `„${p.name}“ steht jetzt auf ${r.list.name}`, restore: r.undo }); };
    const items = [
      ...hh.filter((t) => t.state === 'overdue' || t.state === 'today').map((t) => ({ k: `h-${t.id}`, icon: t.icon, tone: t.state === 'overdue' ? 'danger' : 'warning', title: t.name, sub: `${dueText(t, today)} · etwa ${t.minutes} Min.`, act: html`<${Button} variant="primary" icon="check" onClick=${() => done(t)}>Erledigt<//>` })),
      ...(booking ? [{ k: 'book', icon: 'receipt', tone: 'warning', title: 'Ausgabe vom Einkauf erfassen', sub: `${booking.storeName} · ${booking.count} Artikel${booking.total ? `, ca. ${money(ctx, booking.total)}` : ''}`, act: html`<${Button} variant="primary" icon="wallet" onClick=${() => ctx.emit('next.book', { id: booking.id, to: 'finance.quickadd', ui: { prefill: tripPrefill(booking, today) } })}>Ausgabe erfassen<//>` }] : []),
      ...(trip ? [{ k: 'trip', icon: 'shopping-basket', tone: 'accent', title: `Einkauf ${fmtRelativeDay(trip.date, today) === 'heute' ? 'heute' : fmtDate(trip.date, { style: 'weekday' })}, ${trip.time} Uhr`, sub: `${trip.storeName} · ${food ? food.open : 0} Artikel offen`, act: html`<${Button} variant="primary" icon="store" onClick=${() => ctx.emit('next.trip', { id: trip.listId })}>Laden-Modus<//>` }] : []),
      ...arr(data.pantry).filter(needsRefill).filter((p) => !findOnList(targetList(views, p), p)).map((p) => ({ k: `p-${p.id}`, icon: 'archive', tone: 'info', title: `${p.name}: ${p.level === 'empty' ? 'leer' : 'fast leer'}`, sub: p.note || 'Noch nicht auf der Liste', act: html`<${Button} icon="plus" onClick=${() => refill(p)}>Auf die Liste<//>` })),
      ...hh.filter((t) => t.state === 'soon' && t.days <= props.soonDays).map((t) => ({ k: `s-${t.id}`, icon: t.icon, tone: 'info', title: t.name, sub: dueText(t, today), act: html`<${Button} icon="check" onClick=${() => done(t)}>Schon erledigt<//>` })),
    ].slice(0, Math.max(1, props.limit));
    const empty = !hh.length && !allTrips.length && !arr(data.pantry).length && views.every((l) => l.total === 0);
    if (empty) return html`<${Card} title=${props.title} icon="sparkles"><${EmptyState} icon="shopping-cart" title="Noch nichts angelegt" text="Schreib auf, was fehlt, oder übernimm Vorschläge für Wartung im Haushalt. Danach siehst du hier, was als Nächstes dran ist." action=${html`<${Button} variant="primary" icon="plus" onClick=${() => ctx.emit('item.add.open')}>Erste Liste füllen<//>`} /><//>`;
    if (!items.length) return html`<${Card} title=${props.title} icon="sparkles"><${EmptyState} icon="check-circle-2" title="Nichts Dringendes" text=${hh[0] ? `Als Nächstes: ${hh[0].name}, ${dueText(hh[0], today)}.` : 'Alles im Griff.'} /><//>`;
    const [first, ...rest] = items;
    return html`<div class="tk-shp"><div class="tk-label">${props.title}</div>
      <div class="tk-shpn-hero" style=${`--tc:var(--tk-c-${first.tone})`}><div class="tk-row" style="gap:12px"><${Tile} icon=${first.icon} tone=${first.tone} size=${48} /><div class="tk-grow"><div class="tk-h2">${first.title}</div><div class="tk-shp-meta">${first.sub}</div></div></div>${first.act}</div>
      <${UndoBar} u=${u} set=${setU} ctx=${ctx} />
      ${rest.length > 0 && html`<div>${rest.map((r) => html`<div class="tk-shpn-row" key=${r.k}><${Tile} icon=${r.icon} tone=${r.tone} size=${36} /><div class="tk-grow"><div class="tk-shpn-t">${r.title}</div><div class="tk-shp-sub">${r.sub}</div></div>${r.act}</div>`)}</div>`}
      <div><${Button} variant="ghost" size="sm" iconRight="chevron-right" onClick=${() => ctx.emit('next.open')}>Haushalt ansehen<//></div></div>`;
  },
};
export default shopNextUp;
