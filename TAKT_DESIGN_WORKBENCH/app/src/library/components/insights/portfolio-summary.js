// Trading: Depotwert, Gewinn/Verlust, Allokation und Positionen (Weltformat). Version 2.0 – ersetzt durch trd-* Komponenten in neuen Entwürfen.
import { html } from '../../../lib/html.js';
import { Card, Badge, Icon, Button, EmptyState, Sparkline } from '../../ui.js';
import { money, percent } from '../../helpers.js';
import { fmtNumber, fmtPercent } from '../../../lib/format.js';
import { holdings, arr } from '../trading/_calc.js';
import { Gain, Px, TRD_CSS, TYPE_ICON, slots } from '../trading/_trd.js';
import { ex } from '../trading/_example.js';

export const portfolioSummary = {
  id: 'portfolio-summary',
  name: 'Depot-Übersicht',
  category: 'Trading',
  description: 'Depotwert, Gewinn/Verlust (absolut und prozentual), Tagesveränderung, Allokation und Positionsliste. Per „layout“ nur Kopf, nur Positionen oder alles. Positionen im Weltformat, Antippen öffnet das Wertpapier. Ausdrücklich Anzeige und Simulation.',
  version: '2.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Depot' },
    { name: 'layout', label: 'Umfang', type: 'select', options: ['full', 'summary', 'positions'], default: 'full' },
    { name: 'allocationBy', label: 'Allokation nach', type: 'select', options: ['type', 'position'], default: 'type' },
    { name: 'showSpark', label: 'Mini-Verlauf', type: 'boolean', default: true },
    { name: 'simulated', label: 'Als Simulation kennzeichnen', type: 'boolean', default: true },
    { name: 'respectFilter', label: 'Suche/Filter beachten', type: 'boolean', default: true },
  ],
  data: slots('positions', 'cash').map((s, i) => ({ ...s, required: i === 0 })),
  events: ['position.open', 'position.trade'],
  states: ['empty'],
  css: `${TRD_CSS}
  .tk-portfolio__hero { display:flex; align-items:flex-end; justify-content:space-between; gap:var(--tk-space-4); flex-wrap:wrap; }
  .tk-portfolio__pl { display:flex; gap:6px 14px; flex-wrap:wrap; margin-top:6px; }
  .tk-portfolio__alloc { display:flex; height:10px; border-radius:5px; overflow:hidden; gap:2px; margin-top:var(--tk-space-4); } .tk-portfolio__alloc span { display:block; height:100%; min-width:3px; }
  .tk-portfolio__legend { display:flex; flex-wrap:wrap; gap:6px 16px; margin-top:10px; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); } .tk-portfolio__legend span { display:inline-flex; align-items:center; gap:6px; }
  .tk-portfolio__pos { display:flex; align-items:center; gap:var(--tk-space-3); padding:12px var(--tk-space-4); border:0; border-bottom:1px solid var(--tk-c-border); cursor:pointer; min-width:0; width:100%; background:none; color:inherit; font:inherit; text-align:left; min-height:56px; }
  .tk-portfolio__pos:last-child { border-bottom:0; } .tk-portfolio__pos:hover { background:var(--tk-c-surface2); } .tk-portfolio__pos[aria-selected="true"] { background:var(--tk-c-accent-soft); }
  .tk-portfolio__ico { width:36px; height:36px; border-radius:10px; display:grid; place-items:center; flex:none; background:var(--tk-c-surface2); color:var(--tk-c-accent); }
  .tk-portfolio__num { text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; } .tk-portfolio__num strong { display:block; }`,
  example: { data: ex('positions', 'cash') },
  render: ({ props, data, ctx }) => {
    const hd = holdings(data.positions, data.cash);
    if (!hd.rows.length) return html`<${Card} title=${props.title}><${EmptyState} icon="pie-chart" title="Noch keine Positionen" text="Sobald Wertpapiere im Depot liegen, erscheinen Wert und Verlauf hier." /><//>`;
    const groupsMap = new Map();
    for (const r of hd.rows) { const k = props.allocationBy === 'position' ? (r.short || r.name) : r.type; groupsMap.set(k, (groupsMap.get(k) || 0) + r.value); }
    if (hd.cash > 0) groupsMap.set('Guthaben', hd.cash);
    const groups = [...groupsMap.entries()].sort((a, b) => b[1] - a[1]), q = String(ctx.ui.query || '').toLowerCase();
    const rows = (props.respectFilter ? hd.rows.filter((r) => !q || `${r.name} ${r.short || ''}`.toLowerCase().includes(q)) : hd.rows).sort((a, b) => b.value - a.value);
    const open = (r) => {
      ctx.setUi('selectedId', r.id);
      if (ctx.emit('position.open', { id: r.id, to: 'trading.detail' }) || ctx.mode === 'app') return;
      ctx.openDialog({ title: r.short || r.name, body: () => html`<div class="tk-col" style="gap:10px"><div class="tk-row"><${Badge}>${r.type}<//><${Badge} tone="info">Simulation<//></div>
        <dl style="display:grid;grid-template-columns:minmax(110px,auto) 1fr;gap:8px 16px;margin:0;font-size:var(--tk-fs-sm)"><dt class="tk-subtle">Stückzahl</dt><dd style="margin:0">${fmtNumber(r.q, { digits: r.q % 1 ? 3 : 0 })}</dd><dt class="tk-subtle">Einstandskurs</dt><dd style="margin:0"><${Px} v=${r.buy} /></dd>
          <dt class="tk-subtle">Aktueller Kurs</dt><dd style="margin:0"><${Px} v=${r.price} /></dd><dt class="tk-subtle">Marktwert</dt><dd style="margin:0;font-weight:600">${money(ctx, r.value)}</dd><dt class="tk-subtle">Gewinn/Verlust</dt><dd style="margin:0"><${Gain} ctx=${ctx} v=${r.gain} pct=${r.gainPct} /></dd></dl></div>`,
        footer: (close) => html`<${Button} onClick=${close}>Schließen<//><${Button} variant="primary" icon="arrow-up-right" onClick=${() => { ctx.emit('position.trade', { id: r.id, to: 'trading.order' }); ctx.toast('Order-Ticket (Simulation) vorbereitet'); close(); }}>Order simulieren<//>` });
    };
    const head = html`<div><div class="tk-portfolio__hero"><div><div class="tk-row" style="gap:8px"><span class="tk-label">${props.title}</span>${props.simulated && html`<${Badge} tone="info" icon="info">Simulation<//>`}</div>
        <div class="tk-trd-big">${money(ctx, hd.total)}</div><div class="tk-portfolio__pl"><span><${Gain} ctx=${ctx} v=${hd.gain} pct=${hd.gainPct} /> <span class="tk-trd-meta">gesamt</span></span><span><${Gain} ctx=${ctx} v=${hd.day} pct=${hd.dayPct} /> <span class="tk-trd-meta">heute</span></span></div></div>
        <div class="tk-trd-stats" style="gap:var(--tk-space-5)"><div class="tk-trd-stat"><span class="tk-trd-cap">Investiert</span><strong class="tk-trd-num">${money(ctx, hd.invested)}</strong></div><div class="tk-trd-stat"><span class="tk-trd-cap">Einstand</span><strong class="tk-trd-num">${money(ctx, hd.cost)}</strong></div>${hd.cash > 0 && html`<div class="tk-trd-stat"><span class="tk-trd-cap">Verrechnungskonto</span><strong class="tk-trd-num">${money(ctx, hd.cash)}</strong></div>`}</div></div>
      <div class="tk-portfolio__alloc" role="img" aria-label="Allokation">${groups.map(([k, v], i) => html`<span title=${`${k}: ${fmtPercent(v / hd.total, { digits: 0 })}`} style=${`flex:${v};background:var(--tk-chart-${(i % 6) + 1})`}></span>`)}</div>
      <div class="tk-portfolio__legend">${groups.map(([k, v], i) => html`<span><i class="tk-dot" style=${`background:var(--tk-chart-${(i % 6) + 1})`}></i>${k} <strong class="tk-num" style="color:var(--tk-c-text)">${fmtPercent(v / hd.total, { digits: 0 })}</strong></span>`)}</div></div>`;
    const positions = rows.length ? rows.map((r) => html`<button type="button" class="tk-portfolio__pos" aria-selected=${ctx.ui.selectedId === r.id ? 'true' : 'false'} onClick=${() => open(r)} aria-label=${`${r.short || r.name} öffnen`}>
        <span class="tk-portfolio__ico"><${Icon} name=${TYPE_ICON[r.type] || 'circle'} size=${17} /></span><span class="tk-grow" style="min-width:0"><span class="tk-truncate" style="display:block;font-weight:600">${r.short || r.name}</span><span class="tk-truncate tk-subtle" style="display:block;font-size:var(--tk-fs-sm)">${fmtNumber(r.q, { digits: r.q % 1 ? 3 : 0 })} × <${Px} v=${r.price} /></span></span>
        ${props.showSpark && ctx.bp === 'desktop' && arr(r.spark).length > 1 && html`<${Sparkline} values=${r.spark} width=${64} height=${24} tone=${r.gain >= 0 ? 'success' : 'danger'} />`}
        <span class="tk-portfolio__num"><strong>${money(ctx, r.value)}</strong><${Gain} ctx=${ctx} v=${r.gain} pct=${r.gainPct} digits=${0} /></span></button>`)
      : html`<${EmptyState} icon="search" title="Keine Treffer" text=${`Keine Position für „${ctx.ui.query}“.`} />`;
    if (props.layout === 'summary') return html`<${Card}>${head}<//>`;
    if (props.layout === 'positions') return html`<${Card} flush title="Positionen" actions=${html`<${Badge}>${rows.length}<//>`}>${positions}<//>`;
    return html`<div class="tk-col" style="gap:var(--tk-space-4)"><${Card}>${head}<//><${Card} flush title="Positionen" actions=${html`<${Badge}>${rows.length}<//>`}>${positions}<//></div>`;
  },
};

export default [portfolioSummary];
