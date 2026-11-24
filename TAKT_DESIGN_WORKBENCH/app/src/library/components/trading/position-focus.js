// Trading: Position im Fokus – das Depot Position für Position. Eine große Karte mit Wert, Tagesveränderung und Gesamtgewinn, darunter zwei klare
// Aktionen (Wertpapier ansehen, Order simulieren); mit „Zurück/Weiter“ und Auswahl-Chips durch alle Positionen. Sortiert nach der
// größten Tagesbewegung (Information, keine Empfehlung). Alles Simulation, Beträge im Privatmodus maskiert, Kurse öffentlich.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, EmptyState, Icon } from '../../ui.js';
import { money } from '../../helpers.js';
import { fmtPercent } from '../../../lib/format.js';
import { holdings, arr } from './_calc.js';
import { slots, Tile, Chg, Gain, Px, Stat, qtyText, TRD_CSS, openSecurity } from './_trd.js';
import { ex } from './_example.js';

export const trdPositionFocus = {
  id: 'trd-position-focus',
  name: 'Position im Fokus',
  category: 'Trading',
  description: 'Das Depot Position für Position: eine große Karte mit Wert, Tagesveränderung und Gesamtgewinn, zwei klare Aktionen (Wertpapier ansehen, Order simulieren) und Blättern über Zurück/Weiter oder Auswahl-Chips. Sortiert nach der größten Tagesbewegung, ohne Empfehlung. Simulation, Beträge maskierbar.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Positionen' },
    { name: 'showPlan', label: 'Sparplan zeigen', type: 'boolean', default: true },
  ],
  data: slots('positions', 'cash', 'plans'),
  events: ['position.open', 'position.trade', 'position.focus', 'order.new'],
  states: ['empty'],
  flutter: { widget: 'TrdPositionFocus', propMap: { showPlan: 'showPlan' }, events: ['position.open', 'position.trade', 'position.focus'] },
  css: `${TRD_CSS}
  .tk-trd-pf { display:flex; flex-direction:column; gap:var(--tk-space-4); min-width:0; }
  .tk-trd-pf__chips { display:flex; gap:6px; flex-wrap:wrap; }
  .tk-trd-pf__chip { border:1px solid var(--tk-c-border-strong); background:var(--tk-c-surface); color:var(--tk-c-text); font:inherit; font-size:var(--tk-fs-sm); border-radius:var(--tk-radius-pill); padding:6px 12px; min-height:36px; cursor:pointer; max-width:100%; overflow-wrap:anywhere; }
  .tk-trd-pf__chip[aria-pressed="true"] { background:var(--tk-c-accent-soft); border-color:var(--tk-c-accent); font-weight:var(--tk-fw-semibold); }
  .tk-trd-pf__chip:focus-visible { outline:2px solid var(--tk-c-focus); outline-offset:2px; }
  .bp-mobile .tk-trd-pf__chip { min-height:var(--tk-size-touch); display:inline-flex; align-items:center; }
  .tk-trd-pf__card { display:flex; flex-direction:column; gap:var(--tk-space-4); padding:var(--tk-space-5); border-radius:var(--tk-radius-lg); border:1px solid var(--tk-c-border); background:var(--tk-c-surface2); min-width:0; }
  .tk-trd-pf__id strong { display:block; font-size:var(--tk-fs-xl); font-weight:var(--tk-fw-bold); overflow-wrap:break-word; } .tk-trd-pf__id .tk-trd-sub { display:block; overflow-wrap:anywhere; }
  .tk-trd-pf__val { display:flex; flex-direction:column; gap:6px; }
  .tk-trd-pf__acts { display:flex; flex-direction:column; gap:var(--tk-space-2); } .tk-trd-pf__acts .tk-btn { width:100%; justify-content:center; text-align:center; min-height:var(--tk-size-touch); }
  .tk-trd-pf__nav { display:flex; align-items:center; justify-content:space-between; gap:8px; }
  .tk-trd-pf__nav .tk-btn { min-height:var(--tk-size-touch); }
  [data-tk-large-text] .tk-trd-pf__nav { flex-wrap:wrap; justify-content:center; } [data-tk-large-text] .tk-trd-pf__nav .tk-btn { flex:1 1 40%; justify-content:center; hyphens:none; white-space:nowrap; } [data-tk-large-text] .tk-trd-pf__nav > span { order:-1; flex:1 1 100%; text-align:center; }`,
  example: { data: ex('positions', 'cash', 'plans') },
  render: function TrdPositionFocus({ props, data, ctx }) {
    const [pick, setPick] = useState(0);
    const hd = holdings(data.positions, data.cash);
    if (!hd.rows.length) return html`<${Card} title=${props.title} icon="pie-chart"><${EmptyState} icon="pie-chart" title="Noch keine Positionen" text="Sobald Wertpapiere im Depot liegen, blätterst du hier Position für Position durch. Es ist eine Simulation, es fließt kein Geld."
      action=${html`<${Button} variant="primary" icon="trending-up" onClick=${() => ctx.emit('order.new', { to: 'trading.order' })}>Order simulieren<//>`} /><//>`;
    const rows = [...hd.rows].sort((a, b) => Math.abs(b.dayPct) - Math.abs(a.dayPct)), n = rows.length, i = Math.min(pick, n - 1), r = rows[i];
    const name = (x) => x.short || x.name;
    const plan = arr(data.plans).find((p) => p.positionId === r.id && p.active);
    const go = (k) => { setPick(k); ctx.emit('position.focus', { id: rows[k].id }); };
    return html`<div class="tk-trd-pf">
      <div class="tk-trd-pf__chips" role="group" aria-label="Position wählen">${rows.map((x, k) => html`<button type="button" class="tk-trd-pf__chip" aria-pressed=${String(k === i)} onClick=${() => go(k)}>${name(x)}</button>`)}</div>
      <article class="tk-trd-pf__card" aria-live="polite" aria-label=${`${name(r)}, Position ${i + 1} von ${n}`}>
        <div class="tk-trd-row"><${Tile} type=${r.type} size=${44} /><div class="tk-trd-grow tk-trd-pf__id"><strong>${name(r)}</strong><span class="tk-trd-sub">${r.type}${r.isin ? ` · ${r.isin}` : ''} · ${fmtPercent(r.weight, { digits: 0 })} vom Depot</span></div></div>
        <div class="tk-trd-pf__val"><span class="tk-trd-cap">Wert</span><span class="tk-trd-big" data-qa="focus-value">${money(ctx, r.value)}</span>
          <span><${Chg} v=${r.dayPct} /> <span class="tk-trd-meta">heute</span> · <span class="tk-trd-meta">${money(ctx, r.day, { sign: true })}</span></span></div>
        <div class="tk-trd-stats"><${Stat} label="Gewinn/Verlust"><${Gain} ctx=${ctx} v=${r.gain} pct=${r.gainPct} digits=${0} /><//><${Stat} label="Stück">${qtyText(ctx, r.q)}<//><${Stat} label="Kurs"><${Px} v=${r.price} /><//></div>
        ${props.showPlan && plan && html`<p class="tk-trd-meta tk-trd-row" style="margin:0;gap:8px"><${Icon} name="repeat" size=${14} /><span>Sparplan ${money(ctx, plan.monthly, { digits: 0 })} pro Monat, am ${plan.day}.</span></p>`}
        <div class="tk-trd-pf__acts"><${Button} variant="primary" icon="search" onClick=${() => openSecurity(ctx, r.id, 'position.open')}>Wertpapier ansehen<//>
          <${Button} icon="trending-up" onClick=${() => { ctx.setUi('selectedId', r.id); ctx.emit('position.trade', { id: r.id, to: 'trading.order' }); }}>Order simulieren<//></div></article>
      <div class="tk-trd-pf__nav"><${Button} icon="chevron-left" disabled=${i === 0} onClick=${() => go(i - 1)} aria-label="Vorherige Position">Zurück<//><span class="tk-trd-meta tk-num" role="status">${i + 1} von ${n}</span><${Button} iconRight="chevron-right" disabled=${i === n - 1} onClick=${() => go(i + 1)} aria-label="Nächste Position">Weiter<//></div></div>`;
  },
};
export default [trdPositionFocus];
