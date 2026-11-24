// Finanzen: Geldfluss des Monats (Sankey-ähnlich): Einnahmen verteilen sich auf Kategorien, Gespartes und Übriges.
import { html } from '../../../lib/html.js';
import { Card, Icon, EmptyState, toneColor } from '../../ui.js';
import { MASK_PERCENT } from '../../helpers.js';
import { flow, monthTx, spentByCategory, catMeta, arr, r2 } from './_calc.js';
import { SlimEmpty, slots, pctx, eur, eur0 } from './_fin.js';
import { fmtPercent } from '../../../lib/format.js';
import { ex } from './_example.js';

const MIN_H = 36, GAP = 6;

export const finCashflowSankey = {
  id: 'fin-cashflow-sankey',
  name: 'Geldfluss (Sankey)',
  category: 'Finanzen',
  description: 'Wohin die Einnahmen des Monats fließen: Kategorien, Gespartes und Übriges als Bänder mit Beträgen. Reicht das Geld nicht, erscheint die Lücke als Quelle „Aus Guthaben“.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Geldfluss im Monat' },
    { name: 'limit', label: 'Max. Kategorien', type: 'number', default: 5 },
    { name: 'height', label: 'Höhe (px)', type: 'number', default: 300 },
  ],
  data: slots('transactions', 'cats', 'prefs'),
  events: ['flow.open'],
  states: ['empty'],
  css: `
  .tk-fnsk { display:grid; grid-template-columns:14px minmax(32px, 1fr) minmax(130px, 46%); align-items:stretch; min-width:0; }
  .tk-fnsk__src { position:relative; } .tk-fnsk__src i { position:absolute; left:0; right:0; border-radius:4px; }
  .tk-fnsk svg { display:block; width:100%; height:100%; }
  .tk-fnsk__dst { position:relative; } .tk-fnsk__node { position:absolute; left:0; right:0; display:flex; align-items:center; gap:8px; padding-left:8px; border-left:4px solid var(--c); border-radius:2px; background:none; border-top:0; border-right:0; border-bottom:0; color:inherit; font:inherit; text-align:left; cursor:pointer; min-width:0; }
  .tk-fnsk__node:hover { background:var(--tk-c-surface2); } .tk-fnsk__node span { min-width:0; } .tk-fnsk__node b { display:block; font-weight:var(--tk-fw-medium); font-size:var(--tk-fs-sm); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; } .tk-fnsk__node em { display:block; font-style:normal; font-size:var(--tk-fs-xs); color:var(--tk-c-text-muted); font-variant-numeric:tabular-nums; white-space:nowrap; }
  .tk-fnsk__head { display:flex; justify-content:space-between; gap:12px; align-items:baseline; margin-bottom:var(--tk-space-3); }`,
  example: { data: ex('transactions', 'categories', 'prefs') },
  render: function FinCashflowSankey({ props, data, ctx }) {
    const c = pctx(ctx, data), cur = monthTx(data.transactions, ctx.today), f = flow(cur), spent = spentByCategory(cur, ctx.today);
    if (!cur.length || (!f.income && !f.expenses)) return SlimEmpty({ props, icon: "git-branch", title: "Noch kein Geldfluss", text: "Erfasse Einnahmen und Ausgaben, dann siehst du, wohin das Geld fließt." });
    let cats = Object.entries(spent).map(([k, v]) => ({ key: k, label: catMeta(data.categories, k).label, v, col: toneColor(catMeta(data.categories, k).tone) })).sort((a, b) => b.v - a.v);
    if (cats.length > props.limit) { const rest = cats.slice(props.limit); cats = [...cats.slice(0, props.limit), { key: 'rest', label: 'Weitere', v: r2(rest.reduce((s, x) => s + x.v, 0)), col: 'var(--tk-c-text-subtle)' }]; }
    const dst = [...cats, ...(f.saved > 0 ? [{ key: 'saved', label: 'Gespart', v: f.saved, col: 'var(--tk-c-accent)' }] : []), ...(f.rest > 0 ? [{ key: 'rest0', label: 'Übrig', v: f.rest, col: 'var(--tk-c-success)' }] : [])];
    const T = Math.max(f.income, f.expenses + f.saved), deficit = r2(Math.max(0, T - f.income));
    const avail = props.height - GAP * (dst.length - 1), k = Math.max(avail, MIN_H * dst.length) / T;
    let y = 0; const nodes = dst.map((n) => { const h = Math.max(MIN_H, n.v * k), top = y; y += h + GAP; return { ...n, h, top, t: n.v * k }; });
    const H = Math.max(y - GAP, 120);
    let y0 = 0; const bands = nodes.map((n) => { const a = y0; y0 += n.t; const b = n.top + (n.h - n.t) / 2; return { n, a, b }; });
    const pct = (v) => (c.privacy ? MASK_PERCENT : fmtPercent(v / T, { digits: 0 }));
    const path = ({ n, a, b }) => `M0,${a} C50,${a} 50,${b} 100,${b} L100,${b + n.t} C50,${b + n.t} 50,${a + n.t} 0,${a + n.t} Z`;
    return html`<${Card} title=${props.title} icon="git-branch"><div class="tk-fnsk__head"><div><div class="tk-fn-cap">Einnahmen</div><strong class="tk-fn-big" style="font-size:var(--tk-fs-xl)">${eur0(c, f.income)}</strong></div><div style="text-align:right"><div class="tk-fn-cap">Ausgaben + Gespart</div><strong class="tk-fn-num">${eur0(c, f.expenses + f.saved)}</strong></div></div>
      <div class="tk-fnsk" style=${`height:${H}px`} role="group" aria-label="Geldfluss: Einnahmen verteilen sich auf Kategorien">
        <div class="tk-fnsk__src"><i style=${`top:0;height:${f.income * k}px;background:var(--tk-c-success)`}></i>${deficit > 0 && html`<i style=${`top:${f.income * k}px;height:${deficit * k}px;background:var(--tk-c-warning)`} title="Aus Guthaben"></i>`}</div>
        <svg viewBox=${`0 0 100 ${H}`} preserveAspectRatio="none" aria-hidden="true">${bands.map((b) => html`<path d=${path(b)} fill=${b.n.col} opacity=".28" />`)}</svg>
        <div class="tk-fnsk__dst">${nodes.map((n) => html`<button type="button" class="tk-fnsk__node" style=${`top:${n.top}px;height:${n.h}px;--c:${n.col}`} onClick=${() => ctx.emit('flow.open', { id: n.key, ui: n.key.startsWith('rest') || n.key === 'saved' ? undefined : { filter: n.key } })} aria-label=${`${n.label} ${eur(c, n.v)}`}><span><b>${n.label}</b><em>${eur0(c, n.v)} · ${pct(n.v)}</em></span></button>`)}</div></div>
      ${deficit > 0 && html`<p class="tk-fn-note" style="margin:var(--tk-space-3) 0 0"><${Icon} name="info" size=${14} />${eur0(c, deficit)} mehr ausgegeben und gespart als eingenommen (gelbe Quelle: Guthaben).</p>`}
      <p class="tk-fn-note" style="margin:var(--tk-space-2) 0 0"><${Icon} name="info" size=${14} />Gesamtsicht, Stand 24.11. Die Privatentnahme zählt als Umbuchung zwischen Geschäfts- und Girokonto, nicht als Einnahme.</p><//>`;
  },
};
export default [finCashflowSankey];
