// Finanzen: Cashflow der letzten Monate – gestapelte Balken (Wohin ging das Geld?) mit Einnahmen-Marke, oder Tabelle.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Icon, EmptyState, toneColor } from '../../ui.js';
import { MASK_PERCENT } from '../../helpers.js';
import { monthsSeries, catMeta, arr, r2 } from './_calc.js';
import { SlimEmpty, slots, pctx, eur, eur0 } from './_fin.js';
import { fmtPercent } from '../../../lib/format.js';
import { ex } from './_example.js';

export const CF_GROUPS = [
  { id: 'fix', label: 'Wohnen und Fixkosten', cats: ['Wohnen', 'Versicherungen', 'Abos', 'Gesundheit'], tone: 1 },
  { id: 'food', label: 'Essen und Trinken', cats: ['Lebensmittel', 'Restaurants'], tone: 2 },
  { id: 'free', label: 'Freizeit', cats: ['Freizeit'], tone: 3 },
  { id: 'mob', label: 'Mobilität', cats: ['Mobilität'], tone: 5 },
  { id: 'other', label: 'Haushalt und Sonstiges', cats: null, tone: 'neutral' },
];
export const groupSums = (byCat) => CF_GROUPS.map((g) => ({ ...g, v: r2(Object.entries(byCat || {}).filter(([k]) => (g.cats ? g.cats.includes(k) : !CF_GROUPS.some((x) => x.cats && x.cats.includes(k)))).reduce((s, [, v]) => s + v, 0)) }));

export const finCashflowBars = {
  id: 'fin-cashflow-bars',
  name: 'Cashflow-Balken',
  category: 'Finanzen',
  description: 'Sechs Monate Cashflow: Jeder Balken zeigt, wohin das Geld ging (Ausgaben nach Gruppen und Gespartes); die Marke zeigt die Einnahmen. Monat antippen für Details, oder als Tabelle.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Cashflow' },
    { name: 'style', label: 'Darstellung', type: 'select', options: ['stacked', 'table'], default: 'stacked' },
    { name: 'months', label: 'Monate', type: 'number', default: 6 },
    { name: 'height', label: 'Höhe (px)', type: 'number', default: 190 },
    { name: 'showDetail', label: 'Details zum gewählten Monat', type: 'boolean', default: true },
  ],
  data: slots('transactions', 'months', 'cats', 'prefs'),
  events: ['cashflow.month'],
  states: ['empty'],
  css: `
  .tk-fncb__plot { display:flex; align-items:flex-end; gap:clamp(6px, 2vw, 18px); }
  .tk-fncb__col { flex:1 1 0; min-width:0; display:flex; flex-direction:column; align-items:center; gap:6px; background:none; border:0; color:inherit; font:inherit; cursor:pointer; padding:0 0 4px; border-radius:var(--tk-radius-md); min-height:44px; }
  .tk-fncb__col[aria-pressed="true"] { background:var(--tk-c-accent-soft); }
  .tk-fncb__bar { position:relative; width:100%; max-width:56px; display:flex; flex-direction:column-reverse; border-bottom:1px solid var(--tk-c-border-strong); }
  .tk-fncb__bar > i { display:block; width:100%; } .tk-fncb__bar > i:first-child { border-radius:0; } .tk-fncb__bar > i:last-of-type { border-radius:4px 4px 0 0; }
  .tk-fncb__saved { background-image:repeating-linear-gradient(135deg, var(--tk-c-accent) 0 4px, transparent 4px 8px); border:1px solid var(--tk-c-accent); background-color:var(--tk-c-accent-soft); box-sizing:border-box; }
  .tk-fncb__inc { position:absolute; left:-4px; right:-4px; height:0; border-top:2px solid var(--tk-c-success); } .tk-fncb__inc::after { content:''; position:absolute; right:-2px; top:-5px; width:8px; height:8px; border-radius:50%; background:var(--tk-c-success); }
  .tk-fncb__legend { display:flex; flex-wrap:wrap; gap:6px 14px; margin-top:var(--tk-space-3); font-size:var(--tk-fs-xs); color:var(--tk-c-text-muted); } .tk-fncb__legend span { display:inline-flex; gap:6px; align-items:center; } .tk-fncb__legend i { width:10px; height:10px; border-radius:3px; }
  .tk-fncb__detail { margin-top:var(--tk-space-3); padding:var(--tk-space-3) var(--tk-space-4); border-radius:var(--tk-radius-md); background:var(--tk-c-surface2); border:1px solid var(--tk-c-border); display:grid; grid-template-columns:repeat(auto-fit, minmax(calc(120px * var(--tk-text-scale, 1)), 1fr)); gap:10px; }
  .tk-fncb__detail strong { display:block; font-variant-numeric:tabular-nums; white-space:nowrap; }
  .tk-fncb__tbl { width:100%; border-collapse:collapse; font-variant-numeric:tabular-nums; font-size:var(--tk-fs-sm); } .tk-fncb__tbl th, .tk-fncb__tbl td { padding:8px 6px; text-align:right; border-bottom:1px solid var(--tk-c-border); white-space:nowrap; } .tk-fncb__tbl th:first-child, .tk-fncb__tbl td:first-child { text-align:left; }
  .tk-fncb__tbl th { color:var(--tk-c-text-subtle); font-weight:var(--tk-fw-semibold); font-size:var(--tk-fs-xs); text-transform:uppercase; letter-spacing:var(--tk-ls-wide); }
  .tk-fncb__tbl tr[aria-selected="true"] { background:var(--tk-c-accent-soft); } .tk-fncb__tbl tbody tr { cursor:pointer; }`,
  example: { data: ex('transactions', 'months', 'categories', 'prefs') },
  render: function FinCashflowBars({ props, data, ctx }) {
    const c = pctx(ctx, data);
    const ser = monthsSeries(data.months, data.transactions, ctx.today, props.months);
    const [sel, setSel] = useState(null);
    if (!ser.length) return SlimEmpty({ props, icon: "bar-chart-3", title: "Noch keine Auswertung", text: "Sobald Buchungen vorliegen, erscheint hier der Cashflow." });
    const cur = ser.find((m) => m.key === sel) || ser[ser.length - 1];
    const pick = (m) => { setSel(m.key); ctx.emit('cashflow.month', { key: m.key }); };
    const rate = (m) => (c.privacy ? MASK_PERCENT : fmtPercent(m.rate, { digits: 0 }));
    const lab = (m) => `${m.label}${m.partial ? '*' : ''}`;
    const detail = props.showDetail && html`<div class="tk-fncb__detail" aria-live="polite"><div><span class="tk-fn-cap">${lab(cur)}: Einnahmen</span><strong>${eur0(c, cur.income)}</strong></div><div><span class="tk-fn-cap">Ausgaben</span><strong>${eur0(c, cur.expenses)}</strong></div><div><span class="tk-fn-cap">Gespart</span><strong>${eur0(c, cur.saved)}</strong></div><div><span class="tk-fn-cap">Sparquote</span><strong>${rate(cur)}</strong></div></div>`;
    const note = ser.some((m) => m.partial) && html`<p class="tk-fn-note" style="margin:var(--tk-space-3) 0 0"><${Icon} name="info" size=${14} />* Der laufende Monat ist noch nicht abgeschlossen (Stand 24.11.). Umbuchungen und die Privatentnahme zählen nicht als Einnahme oder Ausgabe.</p>`;
    if (props.style === 'table') return html`<${Card} flush title=${props.title} icon="bar-chart-3"><div style="padding:0 var(--tk-space-4) var(--tk-space-4);overflow-x:auto" data-scroll-x><table class="tk-fncb__tbl"><thead><tr><th>Monat</th><th>Einnahmen</th><th>Ausgaben</th><th>Gespart</th><th>Quote</th></tr></thead>
      <tbody>${[...ser].reverse().map((m) => html`<tr aria-selected=${String(m.key === cur.key)} onClick=${() => pick(m)}><td>${lab(m)}</td><td>${eur0(c, m.income)}</td><td>${eur0(c, m.expenses)}</td><td>${eur0(c, m.saved)}</td><td>${rate(m)}</td></tr>`)}</tbody></table>${note}</div><//>`;
    const sums = ser.map((m) => ({ m, g: groupSums(m.byCat) }));
    const max = Math.max(...ser.map((m) => Math.max(m.income, m.expenses + m.saved)), 1), H = props.height;
    return html`<${Card} title=${props.title} icon="bar-chart-3"><div class="tk-fncb__plot" role="group" aria-label="Cashflow je Monat">${sums.map(({ m, g }) => html`<button type="button" class="tk-fncb__col" aria-pressed=${String(m.key === cur.key)} onClick=${() => pick(m)} aria-label=${`${lab(m)}: Einnahmen ${eur0(c, m.income)}, Ausgaben ${eur0(c, m.expenses)}, gespart ${eur0(c, m.saved)}`}>
      <span class="tk-fncb__bar" style=${`height:${H}px;justify-content:flex-start`}>${g.map((x) => x.v > 0 && html`<i style=${`height:${(x.v / max) * H}px;background:${toneColor(x.tone)}`} title=${`${x.label}: ${eur(c, x.v)}`}></i>`)}${m.saved > 0 && html`<i class="tk-fncb__saved" style=${`height:${(m.saved / max) * H}px`} title=${`Gespart: ${eur(c, m.saved)}`}></i>`}<span class="tk-fncb__inc" style=${`bottom:${(m.income / max) * H}px`} title=${`Einnahmen: ${eur(c, m.income)}`}></span></span>
      <span class="tk-fn-meta">${lab(m)}</span></button>`)}</div>
      <div class="tk-fncb__legend">${CF_GROUPS.map((g) => html`<span><i style=${`background:${toneColor(g.tone)}`}></i>${g.label}</span>`)}<span><i class="tk-fncb__saved"></i>Gespart</span><span><i style="background:var(--tk-c-success)"></i>Einnahmen (Marke)</span></div>${detail}${note}<//>`;
  },
};
export default [finCashflowBars];
