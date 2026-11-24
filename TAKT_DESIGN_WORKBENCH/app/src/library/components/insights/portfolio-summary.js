// Trading: Depotwert, Gewinn/Verlust, Allokation und Positionen
import { html } from '../../../lib/html.js';
import { Card, Badge, Icon, Button, EmptyState, Sparkline } from '../../ui.js';
import { fmt } from '../../../lib/util.js';
import { signed, signedPct, gainColor } from './shared.js';

const TYPE_ICON = { ETF: 'pie-chart', Aktie: 'briefcase', Krypto: 'coins', Anleihe: 'landmark', Rohstoff: 'gauge' };
const calc = (p) => { const value = p.qty * p.price, cost = p.qty * p.avgPrice; return { value, cost, pl: value - cost, plPct: cost ? value / cost - 1 : 0, day: p.qty * p.price * (p.dayChange || 0) / (1 + (p.dayChange || 0)) }; };

export const portfolioSummary = {
  id: 'portfolio-summary',
  name: 'Depot-Übersicht',
  category: 'Trading',
  description: 'Depotwert, Gewinn/Verlust (absolut und prozentual), Tagesveränderung, Allokation und Positionsliste. Per „layout“ nur Kopf, nur Positionen oder alles. Ausdrücklich Anzeige/Simulation.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Depot' },
    { name: 'layout', label: 'Umfang', type: 'select', options: ['full', 'summary', 'positions'], default: 'full' },
    { name: 'allocationBy', label: 'Allokation nach', type: 'select', options: ['type', 'position'], default: 'type' },
    { name: 'cash', label: 'Verfügbares Guthaben (€)', type: 'number', default: 0 },
    { name: 'showSpark', label: 'Mini-Verlauf', type: 'boolean', default: true },
    { name: 'simulated', label: 'Als Simulation kennzeichnen', type: 'boolean', default: true },
    { name: 'respectFilter', label: 'Suche/Filter beachten', type: 'boolean', default: true },
  ],
  data: [{ slot: 'positions', label: 'Positionen', default: 'positions', shape: '{id,symbol,name,type,qty,avgPrice,price,dayChange?,spark?:number[]}[]', required: true }],
  events: ['position.open', 'position.trade'],
  states: ['empty'],
  css: `
  .tk-portfolio__hero { display:flex; align-items:flex-end; justify-content:space-between; gap:var(--tk-space-4); flex-wrap:wrap; }
  .tk-portfolio__value { font-size:var(--tk-fs-3xl); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); font-variant-numeric:tabular-nums; line-height:1.1; }
  .tk-portfolio__pl { display:flex; gap:6px 14px; flex-wrap:wrap; font-variant-numeric:tabular-nums; font-weight:var(--tk-fw-semibold); margin-top:6px; }
  .tk-portfolio__kpis { display:flex; gap:var(--tk-space-5); flex-wrap:wrap; }
  .tk-portfolio__kpi span { display:block; font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); }
  .tk-portfolio__kpi strong { font-variant-numeric:tabular-nums; }
  .tk-portfolio__alloc { display:flex; height:10px; border-radius:5px; overflow:hidden; gap:2px; margin-top:var(--tk-space-4); }
  .tk-portfolio__alloc span { display:block; height:100%; min-width:3px; }
  .tk-portfolio__legend { display:flex; flex-wrap:wrap; gap:6px 16px; margin-top:10px; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); }
  .tk-portfolio__legend span { display:inline-flex; align-items:center; gap:6px; }
  .tk-portfolio__pos { display:flex; align-items:center; gap:var(--tk-space-3); padding:12px var(--tk-space-4); border-bottom:1px solid var(--tk-c-border); cursor:pointer; min-width:0; }
  .tk-portfolio__pos:last-child { border-bottom:0; }
  .tk-portfolio__pos:hover { background:var(--tk-c-surface2); }
  .tk-portfolio__pos[aria-selected="true"] { background:var(--tk-c-accent-soft); }
  .tk-portfolio__ico { width:36px; height:36px; border-radius:10px; display:grid; place-items:center; flex:none; background:var(--tk-c-surface2); color:var(--tk-c-accent); }
  .tk-portfolio__num { text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; }
  .tk-portfolio__num strong { display:block; }
  .tk-portfolio__num small { font-size:var(--tk-fs-xs); font-weight:var(--tk-fw-semibold); }`,
  example: { data: { positions: [
    { id: 'msci', symbol: 'MSCW', name: 'MSCI World ETF', type: 'ETF', qty: 42, avgPrice: 88.4, price: 98.42, dayChange: 0.0123, spark: [94, 95, 97, 96, 98, 98.4] },
    { id: 'sap', symbol: 'SAPX', name: 'Softwarehaus AG', type: 'Aktie', qty: 15, avgPrice: 171, price: 164.2, dayChange: -0.0081, spark: [170, 168, 166, 167, 165, 164] },
  ] } },
  render: ({ props, data, ctx }) => {
    const all = data.positions || [];
    if (!all.length) return html`<${Card} title=${props.title}><${EmptyState} icon="pie-chart" title="Noch keine Positionen" text="Sobald Wertpapiere im Depot liegen, erscheinen Wert und Verlauf hier." /><//>`;
    const sums = all.map((p) => ({ p, ...calc(p) }));
    const value = sums.reduce((a, s) => a + s.value, 0), cost = sums.reduce((a, s) => a + s.cost, 0), day = sums.reduce((a, s) => a + s.day, 0);
    const pl = value - cost, plPct = cost ? pl / cost : 0, dayPct = value - day ? day / (value - day) : 0;
    const groupsMap = new Map();
    for (const s of sums) { const k = props.allocationBy === 'position' ? s.p.name : s.p.type; groupsMap.set(k, (groupsMap.get(k) || 0) + s.value); }
    const groups = [...groupsMap.entries()].sort((a, b) => b[1] - a[1]);
    const q = String(ctx.ui.query || '').toLowerCase();
    const rows = (props.respectFilter ? sums.filter((s) => !q || `${s.p.name} ${s.p.symbol}`.toLowerCase().includes(q)) : sums).sort((a, b) => b.value - a.value);
    const open = (s) => {
      ctx.setUi('selectedId', s.p.id); ctx.emit('position.open', { id: s.p.id });
      ctx.openDialog({ title: s.p.name,
        body: () => html`<div class="tk-col" style="gap:10px"><div class="tk-row"><${Badge}>${s.p.type}<//><${Badge}>${s.p.symbol}<//><${Badge} tone="info">Simulation<//></div>
          <dl style="display:grid;grid-template-columns:minmax(110px,auto) 1fr;gap:8px 16px;margin:0;font-size:var(--tk-fs-sm)">
            <dt class="tk-subtle">Stückzahl</dt><dd style="margin:0">${fmt.number(s.p.qty, 0)}</dd><dt class="tk-subtle">Einstandskurs</dt><dd style="margin:0">${fmt.currency(s.p.avgPrice)}</dd>
            <dt class="tk-subtle">Aktueller Kurs</dt><dd style="margin:0">${fmt.currency(s.p.price)}</dd><dt class="tk-subtle">Marktwert</dt><dd style="margin:0;font-weight:600">${fmt.currency(s.value)}</dd>
            <dt class="tk-subtle">Gewinn/Verlust</dt><dd style=${`margin:0;font-weight:600;color:${gainColor(s.pl)}`}>${signed(s.pl)} (${signedPct(s.plPct)})</dd></dl></div>`,
        footer: (close) => html`<${Button} onClick=${close}>Schließen<//><${Button} variant="primary" icon="arrow-up-right" onClick=${() => { ctx.emit('position.trade', { id: s.p.id }); ctx.toast('Order-Ticket (Simulation) vorbereitet'); close(); }}>Order erfassen<//>`,
      });
    };
    const head = html`<div>
      <div class="tk-portfolio__hero"><div>
        <div class="tk-row" style="gap:8px"><span class="tk-label">${props.title}</span>${props.simulated && html`<${Badge} tone="info" icon="info">Simulation<//>`}</div>
        <div class="tk-portfolio__value">${fmt.currency(value + (props.cash || 0))}</div>
        <div class="tk-portfolio__pl"><span style=${`color:${gainColor(pl)}`}>${signed(pl)} · ${signedPct(plPct)} gesamt</span><span style=${`color:${gainColor(day)}`}>${signed(day)} heute (${signedPct(dayPct)})</span></div></div>
        <div class="tk-portfolio__kpis"><div class="tk-portfolio__kpi"><span>Investiert</span><strong>${fmt.currency(value)}</strong></div>
          <div class="tk-portfolio__kpi"><span>Einstand</span><strong>${fmt.currency(cost)}</strong></div>
          ${props.cash > 0 && html`<div class="tk-portfolio__kpi"><span>Verfügbar</span><strong>${fmt.currency(props.cash)}</strong></div>`}</div></div>
      <div class="tk-portfolio__alloc" role="img" aria-label="Allokation">${groups.map(([k, v], i) => html`<span title=${`${k}: ${fmt.percent(v / value, 0)}`} style=${`flex:${v};background:var(--tk-chart-${(i % 6) + 1})`}></span>`)}</div>
      <div class="tk-portfolio__legend">${groups.map(([k, v], i) => html`<span><i class="tk-dot" style=${`background:var(--tk-chart-${(i % 6) + 1})`}></i>${k} <strong class="tk-num" style="color:var(--tk-c-text)">${fmt.percent(v / value, 0)}</strong></span>`)}</div></div>`;
    const positions = rows.length ? rows.map((s) => html`<div class="tk-portfolio__pos" role="button" tabindex="0" aria-selected=${ctx.ui.selectedId === s.p.id ? 'true' : 'false'} onClick=${() => open(s)} onKeyDown=${(e) => e.key === 'Enter' && open(s)}>
        <span class="tk-portfolio__ico"><${Icon} name=${TYPE_ICON[s.p.type] || 'circle'} size=${17} /></span>
        <div class="tk-grow"><div class="tk-truncate" style="font-weight:600">${s.p.name}</div><div class="tk-truncate tk-subtle" style="font-size:var(--tk-fs-sm)">${fmt.number(s.p.qty, s.p.qty % 1 ? 3 : 0)} × ${fmt.currency(s.p.price)}</div></div>
        ${props.showSpark && ctx.bp === 'desktop' && s.p.spark && html`<${Sparkline} values=${s.p.spark} width=${64} height=${24} tone=${s.pl >= 0 ? 'success' : 'danger'} />`}
        <div class="tk-portfolio__num"><strong>${fmt.currency(s.value)}</strong><small style=${`color:${gainColor(s.pl)}`}>${signedPct(s.plPct)}</small></div></div>`)
      : html`<${EmptyState} icon="search" title="Keine Treffer" text=${`Keine Position für „${ctx.ui.query}“.`} />`;
    if (props.layout === 'summary') return html`<${Card}>${head}<//>`;
    if (props.layout === 'positions') return html`<${Card} flush title="Positionen" actions=${html`<${Badge}>${rows.length}<//>`}>${positions}<//>`;
    return html`<div class="tk-col" style="gap:var(--tk-space-4)"><${Card}>${head}<//><${Card} flush title="Positionen" actions=${html`<${Badge}>${rows.length}<//>`}>${positions}<//></div>`;
  },
};

export default [portfolioSummary];
