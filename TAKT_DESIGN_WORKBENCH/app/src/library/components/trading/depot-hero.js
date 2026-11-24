// Trading: Depot-Kopf – Depotwert, Tagesveränderung, Gesamt-Gewinn/-Verlust, Verrechnungskonto. Streifen, Held mit Verlauf oder Fokus-Zeile.
import { html } from '../../../lib/html.js';
import { Card, Button, EmptyState, Badge } from '../../ui.js';
import { money, percent } from '../../helpers.js';
import { holdings, arr, obj } from './_calc.js';
import { slots, Gain, Stat, TRD_CSS } from './_trd.js';
import { ex } from './_example.js';

/** Verlaufsfläche (Depotwert) mit gestrichelter Linie „Eingezahlt“ – responsive, ohne feste Breite. */
function Lines({ h, ctx }) {
  const a = arr(obj(arr(h.series)[0]).values), b = arr(obj(arr(h.series)[1]).values), labels = arr(h.labels);
  if (a.length < 2) return null;
  const all = [...a, ...b], lo = Math.min(...all), hi = Math.max(...all), pad = (hi - lo) * 0.08 || 1, W = 300, H = 96;
  const x = (i) => (i / (a.length - 1)) * W, y = (v) => H - 4 - ((v - (lo - pad)) / (hi - lo + 2 * pad)) * (H - 8);
  const d = (l) => l.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
  return html`<div class="tk-trd-lines" role="img" aria-label=${`Depotverlauf ${labels[0] || ''} bis ${labels[labels.length - 1] || ''}: Depotwert und Einzahlungen`}>
    <svg viewBox=${`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      <path d=${`${d(a)}L${W},${H}L0,${H}Z`} fill="var(--tk-c-accent)" opacity=".13" />
      ${b.length > 1 && html`<path d=${d(b)} fill="none" stroke="var(--tk-c-text-subtle)" stroke-width="1.5" stroke-dasharray="4 4" vector-effect="non-scaling-stroke" />`}
      <path d=${d(a)} fill="none" stroke="var(--tk-c-accent)" stroke-width="2.25" stroke-linejoin="round" vector-effect="non-scaling-stroke" /></svg>
    <div class="tk-trd-lines__x"><span>${labels[0]}</span><span>${labels[labels.length - 1]}</span></div>
    <div class="tk-trd-lines__leg"><span><i style="background:var(--tk-c-accent)"></i>Depotwert</span><span><i style="background:var(--tk-c-text-subtle)"></i>Eingezahlt ${money(ctx, b[b.length - 1], { digits: 0 })}</span></div></div>`;
}

export const trdDepotHero = {
  id: 'trd-depot-hero',
  name: 'Depot-Kopf',
  category: 'Trading',
  description: 'Depotwert mit Tagesveränderung, Gesamtgewinn und Verrechnungskonto. Als dichter Streifen (Zahlen exakt), als großer Held mit Verlaufsfläche oder als schlanke Fokus-Zeile. Tippen öffnet das Depot. Ausdrücklich Anzeige und Simulation.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Depot' },
    { name: 'style', label: 'Darstellung', type: 'select', options: ['strip', 'hero', 'focus'], default: 'strip' },
    { name: 'showSim', label: 'Simulation kennzeichnen', type: 'boolean', default: true },
    { name: 'interactive', label: 'Tippen öffnet das Depot', type: 'boolean', default: true },
  ],
  data: slots('positions', 'cash', 'history'),
  events: ['depot.open', 'order.new', 'watchlist.open'],
  states: ['empty'],
  css: `${TRD_CSS}
  .tk-trd-hero { display:flex; flex-direction:column; gap:var(--tk-space-4); min-width:0; }
  .tk-trd-hero__top { display:flex; align-items:flex-start; justify-content:space-between; gap:var(--tk-space-3); flex-wrap:wrap; }
  .tk-trd-hero__chg { display:flex; gap:6px 16px; flex-wrap:wrap; margin-top:8px; font-size:var(--tk-fs-md); }
  .tk-trd-lines svg { width:100%; height:96px; display:block; }
  .tk-trd-lines__x { display:flex; justify-content:space-between; color:var(--tk-c-text-subtle); font-size:var(--tk-fs-xs); margin-top:2px; }
  .tk-trd-lines__leg { display:flex; gap:6px 16px; flex-wrap:wrap; color:var(--tk-c-text-muted); font-size:var(--tk-fs-xs); margin-top:6px; }
  .tk-trd-lines__leg i { display:inline-block; width:10px; height:3px; border-radius:2px; margin-right:6px; vertical-align:middle; }
  .tk-trd-hero__focus { display:flex; align-items:center; gap:var(--tk-space-4); flex-wrap:wrap; justify-content:space-between; }`,
  example: { data: ex('positions', 'cash', 'history') },
  render: function TrdDepotHero({ props, data, ctx }) {
    const hd = holdings(data.positions, data.cash);
    const open = () => props.interactive && ctx.emit('depot.open', { to: 'trading.portfolio' });
    if (!hd.rows.length) return html`<${Card} title=${props.title} icon="candlestick-chart"><${EmptyState} icon="candlestick-chart" title="Noch keine Positionen im Depot" text="Beobachte Wertpapiere in der Watchlist oder spiele eine Order durch. Es ist eine Simulation, es fließt kein Geld."
      action=${html`<div class="tk-trd-cta"><${Button} variant="primary" icon="plus" onClick=${() => ctx.emit('watchlist.open', { to: 'trading.watchlist' })}>Wertpapier beobachten<//><${Button} icon="trending-up" onClick=${() => ctx.emit('order.new', { to: 'trading.order' })}>Order simulieren<//></div>`} /><//>`;
    const wrap = (inner) => (props.interactive ? html`<button type="button" class="tk-trd-tap" style="display:block;padding:0" onClick=${open} aria-label=${`${props.title} öffnen`}>${inner}</button>` : inner);
    const sim = props.showSim && html`<${Badge} tone="info" icon="info">Simulation<//>`;
    const dayRow = html`<span><${Gain} ctx=${ctx} v=${hd.day} pct=${hd.dayPct} /> <span class="tk-trd-meta">heute</span></span>`;
    if (props.style === 'focus') return html`<${Card}>${wrap(html`<div class="tk-trd-hero__focus"><div><div class="tk-trd-cap">${props.title}</div><div class="tk-trd-big" data-qa="depot-total">${money(ctx, hd.total)}</div></div>
      <div style="text-align:right">${dayRow}<div class="tk-trd-meta"><${Gain} ctx=${ctx} v=${hd.gain} pct=${hd.gainPct} /> gesamt</div></div></div>`)}<//>`;
    if (props.style === 'hero') return html`<${Card}>${wrap(html`<div class="tk-trd-hero"><div class="tk-trd-hero__top"><div><div class="tk-row" style="gap:8px"><span class="tk-trd-cap">${props.title}</span>${sim}</div>
      <div class="tk-trd-big tk-trd-big--xl" data-qa="depot-total">${money(ctx, hd.total)}</div>
      <div class="tk-trd-hero__chg">${dayRow}<span><${Gain} ctx=${ctx} v=${hd.gain} pct=${hd.gainPct} /> <span class="tk-trd-meta">seit Kauf</span></span></div></div></div>
      <${Lines} h=${obj(data.history)} ctx=${ctx} /></div>`)}<//>`;
    return html`<${Card}>${wrap(html`<div class="tk-trd-hero"><div class="tk-trd-hero__top"><div><div class="tk-row" style="gap:8px"><span class="tk-trd-cap">${props.title}</span>${sim}</div><div class="tk-trd-big" data-qa="depot-total">${money(ctx, hd.total)}</div></div>
      <div class="tk-trd-hero__chg" style="margin:0">${dayRow}</div></div>
      <div class="tk-trd-stats"><${Stat} label="Gesamt seit Kauf"><${Gain} ctx=${ctx} v=${hd.gain} pct=${hd.gainPct} /><//>
        <${Stat} label="In Wertpapieren">${money(ctx, hd.invested)}<//><${Stat} label="Einstand">${money(ctx, hd.cost)}<//><${Stat} label="Verrechnungskonto">${money(ctx, hd.cash)}<//></div></div>`)}<//>`;
  },
};
export default [trdDepotHero];
