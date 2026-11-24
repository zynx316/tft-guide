// Finanzen: Vermögensaufteilung nach Kontoart – Ring, „Brücke“ (Liquidität → Rücklagen → Anlage) oder Zeilen.
import { html } from '../../../lib/html.js';
import { Card, Icon, EmptyState, toneColor } from '../../ui.js';
import { wealth, arr } from './_calc.js';
import { slots, pctx, eur, eur0, Tile } from './_fin.js';
import { fmtPercent } from '../../../lib/format.js';
import { ex } from './_example.js';

export const finWealthSplit = {
  id: 'fin-wealth-split',
  name: 'Vermögensaufteilung',
  category: 'Finanzen',
  description: 'Gesamtvermögen nach Kontoart: Liquidität, Rücklagen, Anlage und offene Kreditkarte. Als Ring, als „Brücke“ vom Girokonto bis zum Depot oder als Zeilen. Tippen öffnet die Vermögensansicht.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Vermögen' },
    { name: 'style', label: 'Darstellung', type: 'select', options: ['donut', 'bridge', 'rows'], default: 'donut' },
    { name: 'showDebt', label: 'Kreditkarte abziehen', type: 'boolean', default: true },
  ],
  data: slots('accounts', 'prefs'),
  events: ['wealth.open'],
  states: ['empty'],
  css: `
  .tk-fnw__donut { display:flex; align-items:center; gap:var(--tk-space-5); flex-wrap:wrap; } .tk-fnw__donut > div:last-child { flex:1 1 170px; min-width:0; }
  .tk-fnw__leg { display:flex; align-items:center; gap:10px; padding:6px 4px; min-height:40px; } .tk-fnw__leg i { width:10px; height:10px; border-radius:3px; flex:none; }
  .tk-fnw__bridge { display:flex; flex-direction:column; gap:var(--tk-space-3); } .tk-fnw__seg { display:flex; height:30px; border-radius:var(--tk-radius-md); overflow:hidden; gap:2px; }
  .tk-fnw__seg > span { min-width:6px; } .tk-fnw__steps { display:grid; grid-template-columns:repeat(auto-fit, minmax(92px, 1fr)); gap:var(--tk-space-2); }
  .tk-fnw__step { text-align:left; border:1px solid var(--tk-c-border); border-radius:var(--tk-radius-md); background:var(--tk-c-surface2); color:inherit; font:inherit; padding:var(--tk-space-3); cursor:pointer; min-height:44px; display:flex; flex-direction:column; gap:2px; min-width:0; }
  .tk-fnw__step:hover { background:var(--tk-c-surface3); } .tk-fnw__step strong { font-size:var(--tk-fs-lg); font-variant-numeric:tabular-nums; white-space:nowrap; }`,
  example: { data: ex('accounts', 'prefs') },
  render: function FinWealthSplit({ props, data, ctx }) {
    const c = pctx(ctx, data), w = wealth(data.accounts);
    if (!arr(data.accounts).length) return html`<${Card} title=${props.title} icon="landmark"><${EmptyState} icon="landmark" title="Noch kein Vermögen erfasst" text="Lege Konten an, dann siehst du die Aufteilung." /><//>`;
    const open = (id) => ctx.emit('wealth.open', { id });
    const total = props.showDebt ? w.net : w.gross;
    const pc = (v) => (c.privacy ? '•• %' : fmtPercent(v, { digits: 0 }));
    const head = html`<div class="tk-fn-cap">Gesamtvermögen</div><div class="tk-fn-big" data-qa="wealth-total">${eur0(c, total)}</div>${w.debt > 0 && props.showDebt ? html`<div class="tk-fn-sub">nach Abzug der Kreditkarte (${eur0(c, w.debt)})</div>` : null}`;
    if (props.style === 'rows') return html`<${Card} title=${props.title} icon="landmark" actions=${html`<strong class="tk-fn-num">${eur0(c, total)}</strong>`}><div class="tk-fn-list">${w.groups.map((g) => html`<button type="button" class="tk-fn-tap" style="padding:8px 4px" onClick=${() => open(g.id)}><${Tile} icon=${g.icon} tone=${g.tone} size=${34} /><span class="tk-fn-grow"><span class="tk-fn-title" style="display:block">${g.label}</span><span class="tk-fn-sub">${g.accounts.map((a) => a.name.split(' (')[0]).join(', ')}</span></span><span style="text-align:right"><strong class="tk-fn-num" style="display:block">${eur0(c, g.value)}</strong><span class="tk-fn-sub tk-fn-num">${pc(g.share)}</span></span></button>`)}
      ${w.debt > 0 && html`<div class="tk-fn-row" style="padding:8px 4px"><${Tile} icon="credit-card" tone="neutral" size=${34} /><span class="tk-fn-grow tk-fn-title">Kreditkarte offen</span><strong class="tk-fn-num">${eur0(c, -w.debt)}</strong></div>`}</div><//>`;
    if (props.style === 'bridge') return html`<${Card} title=${props.title} icon="landmark"><div class="tk-fnw__bridge"><div>${head}</div>
      <div class="tk-fnw__seg" role="img" aria-label=${`Vermögen: ${w.groups.map((g) => `${g.label} ${pc(g.share)}`).join(', ')}`}>${w.groups.filter((g) => g.value > 0).map((g) => html`<span style=${`flex:${g.value};background:${toneColor(g.tone)}`} title=${`${g.label}: ${eur0(c, g.value)}`}></span>`)}</div>
      <div class="tk-fnw__steps">${w.groups.map((g, i) => html`<button type="button" class="tk-fnw__step" onClick=${() => open(g.id)}><span class="tk-fn-sub"><${Icon} name=${g.icon} size=${12} /> ${g.label}</span><strong>${eur0(c, g.value)}</strong><span class="tk-fn-sub">${pc(g.share)}</span></button>`)}</div></div><//>`;
    const R = 52, C = 2 * Math.PI * R; let off = 0;
    return html`<${Card} title=${props.title} icon="landmark"><div class="tk-fnw__donut"><div style="position:relative;width:150px;height:150px" role="img" aria-label=${`Vermögen ${eur0(c, total)}: ${w.groups.map((g) => `${g.label} ${pc(g.share)}`).join(', ')}`}>
      <svg width="150" height="150" viewBox="0 0 150 150" aria-hidden="true"><circle cx="75" cy="75" r=${R} fill="none" stroke="var(--tk-c-surface3)" stroke-width="18" />${w.groups.map((g) => { const len = g.share * C; const el = html`<circle cx="75" cy="75" r=${R} fill="none" stroke=${toneColor(g.tone)} stroke-width="18" stroke-dasharray=${`${Math.max(len - 2, 0.5)} ${C}`} stroke-dashoffset=${-off} transform="rotate(-90 75 75)" />`; off += len; return el; })}</svg>
      <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center"><strong class="tk-fn-num" style="font-size:var(--tk-fs-lg)">${eur0(c, total)}</strong><span class="tk-fn-sub">netto</span></div></div>
      <div>${w.groups.map((g) => html`<button type="button" class="tk-fn-tap tk-fnw__leg" onClick=${() => open(g.id)}><i style=${`background:${toneColor(g.tone)}`}></i><span class="tk-fn-grow tk-fn-title">${g.label}</span><span class="tk-fn-sub tk-fn-num">${pc(g.share)}</span><strong class="tk-fn-num">${eur0(c, g.value)}</strong></button>`)}
      ${w.debt > 0 && html`<div class="tk-fnw__leg"><i style="background:var(--tk-c-text-subtle)"></i><span class="tk-fn-grow tk-fn-title">Kreditkarte offen</span><strong class="tk-fn-num">${eur0(c, -w.debt)}</strong></div>`}</div></div><//>`;
  },
};
export default [finWealthSplit];
