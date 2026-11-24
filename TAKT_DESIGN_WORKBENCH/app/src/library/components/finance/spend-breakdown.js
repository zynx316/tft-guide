// Finanzen: Ausgaben nach Kategorie (Monat) mit Vormonats-Marke; Balken oder Ring.
import { html } from '../../../lib/html.js';
import { Card, Icon, EmptyState, toneColor } from '../../ui.js';
import { monthsSeries, spentByCategory, catMeta, arr, r2 } from './_calc.js';
import { SlimEmpty, slots, pctx, eur, eur0, Tile } from './_fin.js';
import { fmtPercent } from '../../../lib/format.js';
import { ex } from './_example.js';

export const finSpendBreakdown = {
  id: 'fin-spend-breakdown',
  name: 'Ausgaben nach Kategorie',
  category: 'Finanzen',
  description: 'Wohin das Geld im Monat geht: Kategorien nach Betrag, mit Anteil und der Marke des Vormonats. Tippen zeigt die Buchungen der Kategorie. Umbuchungen zählen nicht als Ausgaben.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Ausgaben nach Kategorie' },
    { name: 'style', label: 'Darstellung', type: 'select', options: ['bars', 'donut'], default: 'bars' },
    { name: 'limit', label: 'Max. Kategorien', type: 'number', default: 6 },
    { name: 'showPrev', label: 'Vormonats-Marke', type: 'boolean', default: true },
  ],
  data: slots('transactions', 'cats', 'months', 'prefs'),
  events: ['category.open'],
  states: ['empty'],
  css: `
  .tk-fnd__row { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:4px 12px; padding:8px 4px; min-height:48px; }
  .tk-fnd__track { grid-column:1 / -1; position:relative; } .tk-fnd__prev { position:absolute; top:-3px; bottom:-3px; width:2px; background:var(--tk-c-text); opacity:.5; border-radius:1px; }
  .tk-fnd__donut { display:flex; gap:var(--tk-space-5); align-items:center; flex-wrap:wrap; } .tk-fnd__donut > div:last-child { flex:1 1 180px; min-width:0; }
  .tk-fnd__leg { display:flex; align-items:center; gap:10px; padding:6px 4px; min-height:36px; } .tk-fnd__leg i { width:10px; height:10px; border-radius:3px; flex:none; }`,
  example: { data: ex('transactions', 'categories', 'months', 'prefs') },
  render: function FinSpendBreakdown({ props, data, ctx }) {
    const c = pctx(ctx, data);
    const spent = spentByCategory(data.transactions, ctx.today), ser = monthsSeries(data.months, data.transactions, ctx.today, 2), prev = ser.length > 1 ? ser[0].byCat || {} : {};
    let rows = Object.entries(spent).map(([cat, v]) => ({ cat, v, meta: catMeta(data.categories, cat), prev: prev[cat] })).sort((a, b) => b.v - a.v);
    const total = r2(rows.reduce((s, r) => s + r.v, 0));
    if (!rows.length) return SlimEmpty({ props, icon: "receipt", title: "Noch keine Ausgaben", text: "Sobald du Ausgaben erfasst, siehst du hier die Verteilung." });
    if (rows.length > props.limit) { const rest = rows.slice(props.limit - 1); rows = [...rows.slice(0, props.limit - 1), { cat: 'Weitere', v: r2(rest.reduce((s, r) => s + r.v, 0)), meta: { icon: 'more-horizontal', tone: 'neutral', label: 'Weitere' }, rest: true }]; }
    const open = (r) => !r.rest && ctx.emit('category.open', { id: r.cat, ui: { filter: r.cat } });
    const max = Math.max(...rows.map((r) => Math.max(r.v, r.prev || 0)), 1);
    const pct = (v) => (c.privacy ? '•• %' : fmtPercent(total ? v / total : 0, { digits: 0 }));
    if (props.style === 'donut') {
      const R = 52, C = 2 * Math.PI * R; let off = 0;
      return html`<${Card} title=${props.title} icon="pie-chart"><div class="tk-fnd__donut"><div style="position:relative;width:150px;height:150px" role="img" aria-label=${`Ausgaben ${eur0(c, total)}: ${rows.map((r) => `${r.meta.label} ${pct(r.v)}`).join(', ')}`}><svg width="150" height="150" viewBox="0 0 150 150" aria-hidden="true">
        ${rows.map((r, i) => { const len = (r.v / total) * C; const el = html`<circle cx="75" cy="75" r=${R} fill="none" stroke=${toneColor(r.meta.tone === 'neutral' ? 'neutral' : (i % 6) + 1)} stroke-width="18" stroke-dasharray=${`${Math.max(len - 2, 0.5)} ${C}`} stroke-dashoffset=${-off} transform="rotate(-90 75 75)" />`; off += len; return el; })}</svg>
        <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center"><strong class="tk-fn-num" style="font-size:var(--tk-fs-lg)">${eur0(c, total)}</strong><span class="tk-fn-sub">Ausgaben</span></div></div>
        <div>${rows.map((r, i) => html`<button type="button" class="tk-fn-tap tk-fnd__leg" onClick=${() => open(r)}><i style=${`background:${toneColor(r.meta.tone === 'neutral' ? 'neutral' : (i % 6) + 1)}`}></i><span class="tk-fn-grow tk-fn-title">${r.meta.label}</span><span class="tk-fn-sub tk-fn-num">${pct(r.v)}</span><span class="tk-fn-num" style="font-weight:600">${eur0(c, r.v)}</span></button>`)}</div></div><//>`;
    }
    return html`<${Card} title=${props.title} icon="pie-chart" actions=${html`<span class="tk-fn-num tk-fn-meta">${eur0(c, total)}</span>`}><div class="tk-fn-list">${rows.map((r, i) => html`<button type="button" class="tk-fn-tap tk-fnd__row" style="display:grid" onClick=${() => open(r)} aria-label=${`${r.meta.label} ${eur(c, r.v)}, ${pct(r.v)} der Ausgaben`}>
      <span class="tk-fn-row"><${Tile} icon=${r.meta.icon} tone=${r.meta.tone === 'neutral' ? 'neutral' : (i % 6) + 1} size=${28} /><span class="tk-fn-title">${r.meta.label}</span><span class="tk-fn-sub tk-fn-num">${pct(r.v)}</span></span><span class="tk-fn-num" style="font-weight:600">${eur(c, r.v)}</span>
      <span class="tk-fnd__track"><span class="tk-fn-bar"><i style=${`width:${(r.v / max) * 100}%;background:${toneColor(r.meta.tone === 'neutral' ? 'neutral' : (i % 6) + 1)}`}></i></span>${props.showPrev && r.prev != null && html`<span class="tk-fnd__prev" style=${`left:${(r.prev / max) * 100}%`} title=${`Vormonat: ${eur(c, r.prev)}`}></span>`}</span></button>`)}</div>
      ${props.showPrev && html`<p class="tk-fn-note" style="margin:var(--tk-space-3) 0 0"><${Icon} name="info" size=${14} />Senkrechte Marke: Betrag im Vormonat (gesamt). Der laufende Monat ist noch nicht abgeschlossen.</p>`}<//>`;
  },
};
export default [finSpendBreakdown];
