// Finanzen: Monatskennzahlen – Einnahmen, Ausgaben, Gespart, Sparquote (Umbuchungen zählen nicht).
import { html } from '../../../lib/html.js';
import { Card, Icon, EmptyState } from '../../ui.js';
import { monthsSeries, arr } from './_calc.js';
import { slots, pctx, eur, eur0, Tile } from './_fin.js';
import { fmtPercent, fmtPP } from '../../../lib/format.js';
import { ex } from './_example.js';

const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

export const finMonthKpis = {
  id: 'fin-month-kpis',
  name: 'Monatskennzahlen',
  category: 'Finanzen',
  description: 'Einnahmen, Ausgaben, Gespart und Sparquote des laufenden Monats mit Vergleich zum Vormonat. Sparquote = (Einnahmen − Ausgaben) / Einnahmen; Umbuchungen und die Privatentnahme zählen nicht mit.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Dieser Monat' },
    { name: 'style', label: 'Darstellung', type: 'select', options: ['tiles', 'row', 'ring'], default: 'tiles' },
  ],
  data: slots('transactions', 'months', 'prefs'),
  events: ['kpi.open'],
  states: ['empty'],
  css: `
  .tk-fnk__tiles { display:grid; grid-template-columns:repeat(auto-fit, minmax(calc(140px * var(--tk-text-scale, 1)), 1fr)); gap:var(--tk-space-3); }
  .tk-fnk__tile { display:flex; flex-direction:column; gap:6px; padding:var(--tk-space-3) var(--tk-space-4); border-radius:var(--tk-radius-md); background:var(--tk-c-surface2); border:1px solid var(--tk-c-border); text-align:left; color:inherit; font:inherit; cursor:pointer; min-width:0; min-height:44px; }
  .tk-fnk__tile:hover { background:var(--tk-c-surface3); } .tk-fnk__tile strong { font-size:var(--tk-fs-xl); font-variant-numeric:tabular-nums; white-space:nowrap; }
  .tk-fnk__row { display:flex; flex-wrap:wrap; gap:6px 18px; align-items:baseline; }
  .tk-fnk__row > button { display:inline-flex; gap:6px; align-items:baseline; border:0; background:none; color:inherit; font:inherit; cursor:pointer; padding:6px 0; min-height:36px; }
  .tk-fnk__ring { display:flex; align-items:center; gap:var(--tk-space-5); flex-wrap:wrap; } .tk-fnk__ring svg { flex:none; }
  .tk-fnk__stats { display:flex; flex-direction:column; gap:10px; flex:1 1 150px; min-width:0; }`,
  example: { data: ex('transactions', 'months', 'prefs') },
  render: function FinMonthKpis({ props, data, ctx }) {
    const c = pctx(ctx, data);
    const ser = monthsSeries(data.months, data.transactions, ctx.today, 3), cur = ser[ser.length - 1], prev = ser.length > 1 ? ser[ser.length - 2] : null;
    if (!arr(data.transactions).length || !cur) return html`<${Card} title=${props.title} icon="bar-chart-3"><${EmptyState} icon="receipt" title="Noch keine Buchungen" text="Erfasse Ausgaben und Einnahmen, dann siehst du hier den Monat." /><//>`;
    const mon = MONTHS[ctx.today.getMonth()], pm = prev ? MONTHS[(ctx.today.getMonth() + 11) % 12] : '';
    const open = (id) => ctx.emit('kpi.open', { id });
    const items = [
      { id: 'income', label: 'Einnahmen', v: eur0(c, cur.income), icon: 'banknote', tone: 'success', ref: prev && `${pm}: ${eur0(c, prev.income)}` },
      { id: 'expenses', label: 'Ausgaben', v: eur0(c, cur.expenses), icon: 'credit-card', tone: 'accent', ref: prev && `${pm} gesamt: ${eur0(c, prev.expenses)}` },
      { id: 'saved', label: 'Gespart', v: eur0(c, cur.saved), icon: 'piggy-bank', tone: 'accent2', ref: prev && `${pm}: ${eur0(c, prev.saved)}` },
      { id: 'rate', label: 'Sparquote', v: c.privacy ? '•• %' : fmtPercent(cur.rate, { digits: 0 }), icon: 'percent', tone: 'info', ref: prev && (c.privacy ? '' : `${pm}: ${fmtPercent(prev.rate, { digits: 0 })} (${fmtPP(cur.rate - prev.rate, { digits: 0 })})`) },
    ];
    if (props.style === 'row') return html`<${Card} title=${props.title} icon="bar-chart-3"><div class="tk-fnk__row">${items.map((i) => html`<button type="button" onClick=${() => open(i.id)}><span class="tk-fn-meta">${i.label}</span><strong class="tk-fn-num">${i.v}</strong></button>`)}</div><//>`;
    if (props.style === 'ring') {
      const R = 56, C = 2 * Math.PI * R, p = Math.max(0, Math.min(1, cur.rate));
      return html`<${Card} title=${props.title} icon="bar-chart-3"><div class="tk-fnk__ring"><div style="position:relative;width:140px;height:140px" role="img" aria-label=${c.privacy ? 'Sparquote ausgeblendet' : `Sparquote ${fmtPercent(cur.rate, { digits: 0 })}`}><svg width="140" height="140" viewBox="0 0 140 140" aria-hidden="true"><circle cx="70" cy="70" r=${R} fill="none" stroke="var(--tk-c-surface3)" stroke-width="14" />
        <circle cx="70" cy="70" r=${R} fill="none" stroke="var(--tk-c-accent)" stroke-width="14" stroke-linecap="round" stroke-dasharray=${`${Math.max(p * C, 0.01)} ${C}`} transform="rotate(-90 70 70)" /></svg>
        <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center"><strong class="tk-fn-big" style="font-size:var(--tk-fs-2xl)">${c.privacy ? '•• %' : fmtPercent(cur.rate, { digits: 0 })}</strong><span class="tk-fn-sub">Sparquote</span></div></div>
        <div class="tk-fnk__stats">${items.slice(0, 3).map((i) => html`<button type="button" class="tk-fn-tap" onClick=${() => open(i.id)}><${Tile} icon=${i.icon} tone=${i.tone} size=${30} /><span class="tk-fn-grow"><span class="tk-fn-sub" style="display:block">${i.label}</span><strong class="tk-fn-num">${i.v}</strong></span></button>`)}</div></div>
        <p class="tk-fn-note" style="margin:var(--tk-space-3) 0 0"><${Icon} name="info" size=${14} />(Einnahmen − Ausgaben) / Einnahmen. Umbuchungen und die Privatentnahme zählen nicht mit. ${mon} läuft noch.</p><//>`;
    }
    return html`<${Card} title=${props.title} icon="bar-chart-3" actions=${html`<span class="tk-fn-sub">${mon}, Stand 24.</span>`}><div class="tk-fnk__tiles">${items.map((i) => html`<button type="button" class="tk-fnk__tile" onClick=${() => open(i.id)} aria-label=${`${i.label} ${i.v}`}><span class="tk-fn-row"><${Tile} icon=${i.icon} tone=${i.tone} size=${26} /><span class="tk-fn-meta">${i.label}</span></span><strong>${i.v}</strong><span class="tk-fn-sub">${i.ref || ' '}</span></button>`)}</div><//>`;
  },
};
export default [finMonthKpis];
