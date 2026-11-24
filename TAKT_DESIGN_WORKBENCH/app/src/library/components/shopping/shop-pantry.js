// Einkauf: Vorräte – Stufe je Artikel (reicht, fast leer, leer); „Fast leer“ geht mit einem Tipp auf die passende Liste.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Icon, Badge, EmptyState } from '../../ui.js';
import { SHP_CSS, slots, ex, useShop, useUndo, UndoBar, Tile } from './_shopping.js';
import { LEVELS, needsRefill, setLevel, refillToList, findOnList, targetList, aisleIcon, arr, guessAisle } from './_logic.js';

export const shopPantry = {
  id: 'shop-pantry',
  name: 'Vorräte',
  category: 'Einkauf',
  description: 'Was zuhause da ist: Stufe „Reicht / Fast leer / Leer“ je Artikel, „Auf die Liste“ mit einem Tipp (ohne Dopplung), Lebensmittel bleiben mit „Zuhause vorhanden“ in Ernährung im Gleichschritt.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Vorräte' },
    { name: 'style', label: 'Stil', type: 'select', options: ['list', 'low'], default: 'list' },
    { name: 'limit', label: 'Max. Einträge (0 = alle)', type: 'number', default: 0 },
    { name: 'allowAdd', label: 'Vorrat anlegen', type: 'boolean', default: true },
    { name: 'framed', label: 'In Karte', type: 'boolean', default: true },
  ],
  data: slots('pantry', 'lists', 'shopping', 'plan', 'recipes', 'foods', 'stores'),
  events: ['pantry.level', 'pantry.refill', 'pantry.add', 'pantry.open', 'item.undo'],
  states: ['empty'],
  a11y: { role: 'list', nameFrom: 'Titel' },
  flutter: { widget: 'ShopPantry', propMap: { style: 'style', limit: 'limit' }, events: ['pantry.level', 'pantry.refill'] },
  css: `${SHP_CSS}
  .tk-shpp-row { display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid var(--tk-c-border); flex-wrap:wrap; min-width:0; } .tk-shpp-row:last-child { border-bottom:0; }
  .tk-shpp-main { flex:1 1 160px; min-width:0; } .tk-shpp-name { font-weight:var(--tk-fw-medium); overflow-wrap:anywhere; }
  .tk-shpp-seg { display:inline-flex; border-radius:var(--tk-radius-md); border:1px solid var(--tk-c-border-strong); overflow:hidden; flex:none; }
  .tk-shpp-seg button { min-height:44px; min-width:44px; padding:0 10px; border:0; background:var(--tk-c-surface2); color:var(--tk-c-text-muted); font:inherit; font-size:var(--tk-fs-sm); cursor:pointer; border-right:1px solid var(--tk-c-border); }
  .tk-shpp-seg button:last-child { border-right:0; } .tk-shpp-seg button[aria-pressed="true"] { background:var(--tk-c-accent-soft); color:var(--tk-c-text); font-weight:var(--tk-fw-semibold); box-shadow:inset 0 -2px 0 var(--tk-c-accent); }
  .tk-shpp-group { padding:14px 0 2px; font-size:var(--tk-fs-xs); font-weight:var(--tk-fw-semibold); letter-spacing:var(--tk-ls-wide); text-transform:uppercase; color:var(--tk-c-text-subtle); }`,
  example: { data: ex('pantry', 'lists', 'shopping', 'plan', 'recipes', 'foods', 'stores') },
  render: function ShopPantry({ props, data, setData, ctx }) {
    const { views } = useShop(data, ctx);
    const [u, setU] = useUndo(), [name, setName] = useState('');
    const all = arr(data.pantry), low = all.filter(needsRefill);
    const wrap = (b) => (props.framed ? html`<${Card} title=${props.title} icon="archive" actions=${low.length ? html`<${Badge} tone="warning">${low.length} knapp<//>` : null}>${b}<//>` : html`<div class="tk-shp">${b}</div>`);
    const onList = (p) => findOnList(targetList(views, p), p);
    const level = (p, id) => { setLevel(setData, p, id); ctx.emit('pantry.level', { id: p.id, level: id }); };
    const refill = (p) => { const r = refillToList(setData, views, p, ctx.newId('si')); ctx.emit('pantry.refill', { id: p.id });
      if (r.added) setU({ text: `„${p.name}“ steht jetzt auf ${r.list.name}`, restore: r.undo }); else ctx.toast(`„${p.name}“ steht schon auf der Liste`); };
    const add = () => { const n = name.trim(); if (!n) return; const id = ctx.newId('sp'); setData('pantry', (ps) => [...arr(ps), { id, name: n, foodId: null, aisle: guessAisle(n, ['Körperpflege', 'Haushalt & Reinigung', 'Sonstiges']), level: 'ok', note: '' }]); setName(''); ctx.emit('pantry.add', { id }); };
    if (!all.length) return wrap(html`<${EmptyState} icon="archive" title="Noch keine Vorräte" text="Halte fest, was zuhause da sein soll. Wird etwas knapp, setzt du es mit einem Tipp auf die Liste." />${props.allowAdd && html`<div class="tk-shp-add" style="margin-top:12px"><input class="tk-input" value=${name} onInput=${(e) => setName(e.currentTarget.value)} placeholder="z. B. Spülmaschinentabs" aria-label="Vorrat anlegen" onKeyDown=${(e) => e.key === 'Enter' && add()} /><${Button} variant="primary" icon="plus" aria-label="Anlegen" onClick=${add} /></div>`}`);
    const shown = props.style === 'low' ? (props.limit ? low.slice(0, props.limit) : low) : props.limit ? all.slice(0, props.limit) : all;
    if (props.style === 'low' && !shown.length) return wrap(html`<${EmptyState} icon="check-circle-2" title="Nichts knapp" text="Alle Vorräte reichen im Moment." />`);
    const Row = (p) => { const need = needsRefill(p), listed = need && onList(p); return html`<div class="tk-shpp-row" key=${p.id}>
      <${Tile} icon=${aisleIcon(p.aisle)} tone=${need ? 'warning' : 'success'} size=${36} />
      <div class="tk-shpp-main"><div class="tk-shpp-name">${p.name}</div>${p.note && html`<div class="tk-shp-sub">${p.note}</div>`}</div>
      ${props.style === 'list' && html`<div class="tk-shpp-seg" role="group" aria-label=${`Vorrat ${p.name}`}>${LEVELS.map((l) => html`<button type="button" aria-pressed=${String(p.level === l.id)} onClick=${() => level(p, l.id)}>${l.label}</button>`)}</div>`}
      ${need && (listed ? html`<${Badge} tone="success" icon="check">steht auf der Liste<//>` : html`<${Button} size="sm" variant="primary" icon="plus" onClick=${() => refill(p)}>Auf die Liste<//>`)}</div>`; };
    if (props.style === 'low') return wrap(html`<div>${shown.map(Row)}</div><${UndoBar} u=${u} set=${setU} ctx=${ctx} /><${Button} variant="ghost" size="sm" iconRight="chevron-right" onClick=${() => ctx.emit('pantry.open')}>Alle Vorräte<//>`);
    const needing = shown.filter(needsRefill), okay = shown.filter((p) => !needsRefill(p));
    return wrap(html`<${UndoBar} u=${u} set=${setU} ctx=${ctx} />
      ${needing.length > 0 && html`<div class="tk-shpp-group">Knapp (${needing.length})</div>${needing.map(Row)}`}
      ${okay.length > 0 && html`<div class="tk-shpp-group">Reicht (${okay.length})</div>${okay.map(Row)}`}
      ${props.allowAdd && html`<div class="tk-shp-add" style="margin-top:12px"><input class="tk-input" value=${name} onInput=${(e) => setName(e.currentTarget.value)} placeholder="Vorrat hinzufügen" aria-label="Vorrat hinzufügen" onKeyDown=${(e) => e.key === 'Enter' && add()} /><${Button} icon="plus" aria-label="Anlegen" onClick=${add} /></div>`}`);
  },
};
export default shopPantry;
