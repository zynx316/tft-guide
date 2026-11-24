// Einkauf: Laufweg-Ansicht des Laden-Modus (visuell) – Fortschrittsring, ein Stopp je Gang als Karte, Artikel als große Kacheln.
import { html } from '../../../lib/html.js';
import { Icon, Ring } from '../../ui.js';
import { aisleIcon, arr } from './_logic.js';
import { money } from '../../helpers.js';

export const ROUTE_CSS = `
  .tk-shps-hero { display:flex; align-items:center; gap:var(--tk-space-4); padding:var(--tk-space-4); border-radius:var(--tk-radius-xl, var(--tk-radius-lg)); border:1px solid var(--tk-c-border); background:var(--tk-c-surface); flex-wrap:wrap; }
  .tk-shps-hero__ring { flex:none; } .tk-shps-hero__num { font-size:var(--tk-fs-3xl); font-weight:var(--tk-fw-bold); line-height:1; font-variant-numeric:tabular-nums; } .tk-shps-hero__lbl { font-size:var(--tk-fs-xs); color:var(--tk-c-text-muted); }
  .tk-shps-hero__txt { flex:1 1 160px; min-width:0; display:flex; flex-direction:column; gap:4px; } .tk-shps-hero__ttl { font-size:var(--tk-fs-xl); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); overflow-wrap:break-word; line-height:1.2; }
  .tk-shps-hero__next { display:inline-flex; align-items:center; gap:6px; margin-top:4px; font-size:var(--tk-fs-sm); color:var(--tk-c-accent); font-weight:var(--tk-fw-semibold); }
  .tk-shps-route { display:grid; grid-template-columns:repeat(auto-fill, minmax(min(100%, 320px), 1fr)); gap:var(--tk-space-3); align-items:start; }
  .tk-shps-stop { display:flex; flex-direction:column; gap:var(--tk-space-3); padding:var(--tk-space-4); border-radius:var(--tk-radius-xl, var(--tk-radius-lg)); border:1.5px solid var(--tk-c-border); background:var(--tk-c-surface); min-width:0; }
  .tk-shps-stop[data-state="current"] { border-color:var(--tk-c-accent); background:color-mix(in srgb, var(--tk-c-accent) 6%, var(--tk-c-surface)); }
  .tk-shps-stop[data-state="done"] { background:var(--tk-c-surface2); }
  .tk-shps-stop__head { display:flex; align-items:center; gap:12px; min-width:0; }
  .tk-shps-stop__no { flex:none; width:40px; height:40px; border-radius:50%; display:grid; place-items:center; font-weight:var(--tk-fw-bold); font-variant-numeric:tabular-nums; background:var(--tk-c-surface3); color:var(--tk-c-text-muted); }
  .tk-shps-stop[data-state="current"] .tk-shps-stop__no { background:var(--tk-c-accent); color:var(--tk-c-text-on-accent); } .tk-shps-stop[data-state="done"] .tk-shps-stop__no { background:var(--tk-c-success); color:var(--tk-c-text-on-accent); }
  .tk-shps-stop__name { flex:1; min-width:0; font-size:var(--tk-fs-lg); font-weight:var(--tk-fw-bold); overflow-wrap:break-word; line-height:1.2; display:flex; align-items:center; gap:8px; } .tk-shps-stop__cnt { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); font-variant-numeric:tabular-nums; white-space:nowrap; }
  .tk-shps-tiles { display:grid; grid-template-columns:repeat(auto-fill, minmax(min(100%, 9.5rem), 1fr)); gap:10px; }
  .tk-shps-tile { display:flex; flex-direction:column; justify-content:center; gap:2px; min-height:64px; padding:10px 14px; border-radius:var(--tk-radius-lg); border:1.5px solid var(--tk-c-border-strong); background:var(--tk-c-surface); color:inherit; font:inherit; text-align:left; cursor:pointer; min-width:0; }
  .tk-shps-tile:active { background:var(--tk-c-surface2); } .tk-shps-tile:focus-visible { outline:2px solid var(--tk-c-focus); outline-offset:2px; }
  .tk-shps-tile__n { font-size:var(--tk-fs-lg); font-weight:var(--tk-fw-semibold); line-height:1.2; overflow-wrap:break-word; } .tk-shps-tile__q { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); font-variant-numeric:tabular-nums; overflow-wrap:anywhere; }
  .tk-shps-chipdone { display:inline-flex; align-items:center; gap:6px; min-height:56px; padding:0 14px; border-radius:var(--tk-radius-pill); border:1px solid var(--tk-c-border); background:var(--tk-c-surface3); color:var(--tk-c-text-muted); font:inherit; font-size:var(--tk-fs-sm); text-decoration:line-through; cursor:pointer; text-align:left; max-width:100%; }
  .tk-shps-chipdone:focus-visible { outline:2px solid var(--tk-c-focus); } .tk-shps-chipdone svg { color:var(--tk-c-success); flex:none; }
  .tk-shps-donerow { display:flex; flex-wrap:wrap; gap:8px; }
  [data-tk-large-text] .tk-shps-tiles { grid-template-columns:minmax(0, 1fr); }`;

/** Stopps in Laufweg-Reihenfolge: je Gang offene und abgehakte Artikel. */
export const stopsOf = (items, aisles) => aisles.map((aisle) => { const all = arr(items).filter((i) => i.aisle === aisle); return { aisle, open: all.filter((i) => !i.done), done: all.filter((i) => i.done) }; }).filter((s) => s.open.length + s.done.length > 0);

export function StoreRoute({ ctx, stops, toggle, left, total, storeName, priceOpen }) {
  const cur = stops.find((s) => s.open.length > 0), nr = (s) => stops.indexOf(s) + 1;
  const bought = total - left;
  return html`<div class="tk-shps-hero"><div class="tk-shps-hero__ring"><${Ring} value=${bought} max=${total} size=${116} stroke=${12} tone="success" label=${`${bought} von ${total} im Wagen`}><div style="text-align:center"><div class="tk-shps-hero__num">${left}</div><div class="tk-shps-hero__lbl">offen</div></div><//></div>
      <div class="tk-shps-hero__txt"><div class="tk-shps-hero__ttl">${left === 0 ? 'Alles im Wagen' : storeName}</div>
        <div class="tk-shp-meta">${bought} von ${total} im Wagen · ${stops.length} ${stops.length === 1 ? 'Gang' : 'Gänge'}${priceOpen > 0 ? ` · ca. ${money(ctx, priceOpen, { digits: 0 })} offen` : ''}</div>
        ${cur && html`<div class="tk-shps-hero__next"><${Icon} name=${aisleIcon(cur.aisle)} size=${16} />Als Nächstes: ${cur.aisle}</div>`}</div></div>
    <div class="tk-shps-route" role="list" aria-label="Laufweg durch den Laden">${stops.map((s) => { const state = s.open.length === 0 ? 'done' : s === cur ? 'current' : 'todo', n = s.open.length + s.done.length;
      return html`<section class="tk-shps-stop" role="listitem" data-state=${state} aria-label=${`Gang ${nr(s)}: ${s.aisle}`}>
        <div class="tk-shps-stop__head"><span class="tk-shps-stop__no" aria-hidden="true">${state === 'done' ? html`<${Icon} name="check" size=${20} stroke=${3} />` : nr(s)}</span>
          <div class="tk-shps-stop__name"><${Icon} name=${aisleIcon(s.aisle)} size=${20} /><span>${s.aisle}</span></div><span class="tk-shps-stop__cnt">${s.done.length} von ${n}</span></div>
        ${s.open.length > 0 && html`<div class="tk-shps-tiles">${s.open.map((i) => html`<button type="button" role="checkbox" aria-checked="false" class="tk-shps-tile" onClick=${() => toggle(i)}><span class="tk-shps-tile__n">${i.name}</span>${i.qty && html`<span class="tk-shps-tile__q">${i.qty}</span>`}</button>`)}</div>`}
        ${s.done.length > 0 && html`<div class="tk-shps-donerow">${s.done.map((i) => html`<button type="button" role="checkbox" aria-checked="true" class="tk-shps-chipdone" onClick=${() => toggle(i)}><${Icon} name="check" size=${16} stroke=${3} />${i.name}</button>`)}</div>`}</section>`; })}</div>`;
}
