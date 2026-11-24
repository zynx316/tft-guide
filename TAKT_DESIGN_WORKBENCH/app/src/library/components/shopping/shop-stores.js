// Einkauf: Einstellungen – Läden mit Gängen in Laufweg-Reihenfolge und Teilen von Listen mit dem Haushalt (Abgleich ist eine offene Grundsatzfrage).
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Icon, Badge, Switch } from '../../ui.js';
import { SHP_CSS, slots, ex, Tile } from './_shopping.js';
import { arr, aisleIcon } from './_logic.js';

export const shopStores = {
  id: 'shop-stores',
  name: 'Läden & Gänge',
  category: 'Einkauf',
  description: 'Läden mit der Reihenfolge der Gänge (so läufst du durch den Laden) und Teilen der Listen mit dem Haushalt. Die Reihenfolge wirkt sofort in Liste und Laden-Modus.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Läden & Gänge' },
    { name: 'showSharing', label: 'Teilen zeigen', type: 'boolean', default: true },
  ],
  data: slots('stores', 'lists'),
  events: ['store.aisle.move', 'list.share', 'store.open'],
  states: ['empty'],
  flutter: { widget: 'ShopStoreSettings', propMap: {}, events: ['store.aisle.move', 'list.share'] },
  css: `${SHP_CSS}
  .tk-shpz-aisle { display:flex; align-items:center; gap:8px; min-height:48px; border-bottom:1px solid var(--tk-c-border); } .tk-shpz-aisle:last-child { border-bottom:0; } .tk-shpz-n { width:22px; text-align:center; font-variant-numeric:tabular-nums; color:var(--tk-c-text-subtle); font-size:var(--tk-fs-sm); }
  .tk-shpz-share { display:flex; align-items:center; gap:12px; min-height:52px; border-bottom:1px solid var(--tk-c-border); } .tk-shpz-share:last-child { border-bottom:0; }`,
  example: { data: ex('stores', 'lists') },
  render: function ShopStores({ props, data, setData, ctx }) {
    const stores = arr(data.stores), lists = arr(data.lists).filter((l) => l.kind !== 'food' || true);
    const [openId, setOpen] = useState(stores[0]?.id);
    const move = (s, i, d) => {
      const j = i + d; if (j < 0 || j >= s.aisles.length) return;
      const next = s.aisles.slice(); [next[i], next[j]] = [next[j], next[i]];
      setData('stores', (ss) => arr(ss).map((x) => (x.id === s.id ? { ...x, aisles: next } : x))); ctx.emit('store.aisle.move', { id: s.id });
    };
    const share = (l, on) => { setData('lists', (ls) => arr(ls).map((x) => (x.id === l.id ? { ...x, shared: on } : x))); ctx.emit('list.share', { id: l.id, on }); };
    return html`<div class="tk-shp">
      <${Card} title=${props.title} icon="store">${stores.length ? stores.map((s) => html`<div key=${s.id}>
        <button type="button" class="tk-shpl-row" aria-expanded=${String(openId === s.id)} onClick=${() => setOpen(openId === s.id ? null : s.id)}><${Tile} icon=${s.icon} tone=${s.tone} /><div style="flex:1;min-width:0"><div class="tk-shpl-name tk-truncate">${s.name}</div><div class="tk-shp-sub">${s.aisles.length} Gänge${s.note ? ` · ${s.note}` : ''}</div></div><${Icon} name=${openId === s.id ? 'chevron-up' : 'chevron-down'} size=${16} /></button>
        ${openId === s.id && html`<div style="padding:0 0 8px 4px">${s.aisles.map((a, i) => html`<div class="tk-shpz-aisle"><span class="tk-shpz-n">${i + 1}</span><${Icon} name=${aisleIcon(a)} size=${16} /><span class="tk-grow">${a}</span>
          <${Button} variant="ghost" icon="arrow-up" aria-label=${`${a} nach oben`} disabled=${i === 0} onClick=${() => move(s, i, -1)} /><${Button} variant="ghost" icon="arrow-down" aria-label=${`${a} nach unten`} disabled=${i === s.aisles.length - 1} onClick=${() => move(s, i, 1)} /></div>`)}</div>`}</div>`)
        : html`<div class="tk-shp-sub">Noch kein Laden. Mit einem Laden ordnet TAKT die Artikel nach Gang.</div>`}<//>
      ${props.showSharing && html`<${Card} title="Mit dem Haushalt teilen" icon="users" actions=${html`<${Badge} tone="warning" icon="circle-help">Abgleich offen<//>`}>
        <div class="tk-shp-sub" style="margin-bottom:6px">Geteilte Listen sieht auch Jana. Wie der Abgleich technisch läuft (Konto, Link, lokal im WLAN), ist noch nicht entschieden. Bis dahin gilt der Schalter nur als Absicht.</div>
        ${lists.map((l) => html`<div class="tk-shpz-share"><${Tile} icon=${l.icon} tone=${l.tone} size=${34} /><span class="tk-grow">${l.name}</span><${Switch} checked=${!!l.shared} onChange=${(v) => share(l, v)} label=${`${l.name} teilen`} /></div>`)}<//>`}</div>`;
  },
};
export default shopStores;
