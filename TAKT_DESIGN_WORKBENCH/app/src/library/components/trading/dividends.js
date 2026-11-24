// Trading: Dividenden – Zahlungskalender über zwölf Monate, nächste Zahlungen, Prognose mit Annahme und Steuer-Orientierung.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, EmptyState, Icon } from '../../ui.js';
import { money } from '../../helpers.js';
import { fmtDate, fmtRelativeDay, fmtNumber } from '../../../lib/format.js';
import { MONTHS_LONG } from '../../../lib/date.js';
import { dividendPlan, arr, byId } from './_calc.js';
import { slots, Tile, Stat, Note, TRD_CSS } from './_trd.js';
import { ex } from './_example.js';

const MON = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
const STATUS = { gezahlt: ['Erhalten', 'success'], erwartet: ['Erwartet', 'info'], Prognose: ['Prognose', ''] };

export const trdDividends = {
  id: 'trd-dividends',
  name: 'Dividenden',
  category: 'Trading',
  description: 'Dividenden aus dem Depot: Zahlungskalender über zwölf Monate, erhaltene und erwartete Zahlungen, Prognose für die nächsten zwölf Monate (Annahme: gleichbleibende Ausschüttung) und Steuer-Orientierung mit dem Freistellungsauftrag.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Dividenden' },
    { name: 'style', label: 'Darstellung', type: 'select', options: ['calendar', 'list', 'next'], default: 'calendar' },
    { name: 'limit', label: 'Max. Zahlungen in der Liste (0 = alle)', type: 'number', default: 0 },
    { name: 'showTax', label: 'Steuer-Orientierung zeigen', type: 'boolean', default: true },
  ],
  data: slots('dividends', 'positions', 'allowance'),
  events: ['dividend.open', 'dividend.month', 'dividends.open', 'tax.open'],
  states: ['empty'],
  css: `${TRD_CSS}
  .tk-trd-dv { display:flex; flex-direction:column; gap:var(--tk-space-5); min-width:0; }
  .tk-trd-dv__cal { display:grid; grid-template-columns:repeat(12, minmax(0,1fr)); gap:6px; align-items:end; height:150px; }
  .bp-mobile .tk-trd-dv__cal { grid-template-columns:repeat(6, minmax(0,1fr)); height:auto; row-gap:12px; }
  .tk-trd-dv__m { display:flex; flex-direction:column; align-items:center; justify-content:flex-end; gap:4px; height:100%; border:0; background:none; color:inherit; font:inherit; cursor:pointer; padding:4px 0; border-radius:var(--tk-radius-md); min-width:0; }
  .bp-mobile .tk-trd-dv__m { height:96px; } .tk-trd-dv__m:hover, .tk-trd-dv__m[aria-pressed="true"] { background:var(--tk-c-surface2); }
  .tk-trd-dv__bar { width:70%; max-width:34px; min-height:4px; border-radius:6px 6px 2px 2px; background:var(--tk-c-accent); } .tk-trd-dv__bar--f { background:repeating-linear-gradient(135deg, var(--tk-c-accent) 0 4px, transparent 4px 8px); outline:1px solid var(--tk-c-accent); outline-offset:-1px; } .tk-trd-dv__bar--0 { background:var(--tk-c-surface3); }
  .tk-trd-dv__lab { font-size:var(--tk-fs-xs); color:var(--tk-c-text-muted); } .tk-trd-dv__amt { font-size:var(--tk-fs-xs); font-variant-numeric:tabular-nums; min-height:1.2em; }
  .tk-trd-dv__row { display:flex; align-items:center; gap:12px; padding:10px 4px; min-height:56px; width:100%; background:none; border:0; color:inherit; font:inherit; text-align:left; cursor:pointer; border-radius:var(--tk-radius-md); } .tk-trd-dv__row:hover { background:var(--tk-c-surface2); }`,
  example: { data: ex('dividends', 'positions', 'allowance') },
  render: function TrdDividends({ props, data, ctx }) {
    const plan = dividendPlan(data.dividends, data.positions, ctx.today, data.allowance), [sel, setSel] = useState(null);
    if (!plan.all.length) return html`<${Card} title=${props.title} icon="calendar-days"><${EmptyState} icon="calendar-days" title="Noch keine Dividenden" text="Sobald ausschüttende Aktien im Depot liegen, erscheinen Zahlungstermine und die Prognose hier. Thesaurierende ETFs zahlen nichts aus." /><//>`;
    const open = (d) => { ctx.setUi('selectedId', d.positionId); ctx.emit('dividend.open', { id: d.positionId, to: 'trading.detail' }); };
    const nm = (d) => byId(data.positions, d.positionId)?.short || d.title;
    const pill = (d) => { const [l, t] = STATUS[d.status] || ['', '']; return html`<span class=${`tk-trd-pill ${t ? `tk-trd-pill--${t}` : ''}`}>${l}</span>`; };
    const item = (d) => html`<button type="button" class="tk-trd-dv__row" onClick=${() => open(d)} aria-label=${`${nm(d)} öffnen`}><${Tile} type=${byId(data.positions, d.positionId)?.type || 'Aktie'} size=${34} /><span class="tk-trd-grow"><span class="tk-trd-title" style="display:block">${nm(d)}</span>
      <span class="tk-trd-sub">${fmtDate(d.date, { style: 'weekday' })}${d.date.getFullYear() !== ctx.today.getFullYear() ? ` ${d.date.getFullYear()}` : ''} · ${fmtNumber(d.perShare, { digits: 2 })} € × ${fmtNumber(d.quantity, { digits: d.quantity % 1 ? 2 : 0 })}</span></span>${pill(d)}<strong class="tk-trd-num">${money(ctx, d.amount, { sign: true })}</strong></button>`;
    const stats = html`<div class="tk-trd-stats"><${Stat} label="Nächste 12 Monate" sub="Annahme: gleichbleibende Ausschüttung">${money(ctx, plan.total)}<//><${Stat} label="Erhalten 2026">${money(ctx, plan.paidSum)}<//>
      <${Stat} label="Nächste Zahlung" sub=${plan.next ? `${fmtDate(plan.next.date, { style: 'weekday' })} · ${nm(plan.next)}` : ''}>${plan.next ? money(ctx, plan.next.amount) : '–'}<//></div>`;
    const tax = props.showTax && html`<${Note} icon="scale"><span>${plan.tax > 0 ? `Schätzung der Steuer auf die Prognose: ${money(ctx, plan.tax)}.` : `Voraussichtlich steuerfrei: Vom Freistellungsauftrag sind noch ${money(ctx, plan.allowanceLeft)} frei.`} Ohne Quellensteuer, Annahme Stand 01/2026, keine Steuerberatung.
      <button type="button" class="tk-btn tk-btn--ghost tk-btn--sm" style="margin-left:4px" onClick=${() => ctx.emit('tax.open', { to: 'trading.tax' })}>Steuer-Orientierung<//></span><//>`;
    if (props.style === 'next') return html`<${Card} title=${props.title} icon="calendar-days"><div class="tk-trd-dv">${stats}${plan.ahead.slice(0, 3).map(item)}</div><//>`;
    const upcoming = plan.ahead.slice(0, props.limit > 0 ? props.limit : 99), paid = plan.paid;
    const m = sel != null ? plan.months.find((x) => x.key === sel) : null, max = Math.max(...plan.months.map((x) => x.amount), 1);
    const cal = html`<div class="tk-trd-dv__cal" role="group" aria-label="Dividenden je Monat">${plan.months.map((x) => { const f = x.items.length && x.items.every((i) => i.forecast); return html`<button type="button" class="tk-trd-dv__m" aria-pressed=${String(sel === x.key)} aria-label=${`${MONTHS_LONG[x.date.getMonth()]} ${x.date.getFullYear()}: ${x.items.length ? money(ctx, x.amount) : 'keine Zahlung'}`} onClick=${() => { setSel(sel === x.key ? null : x.key); ctx.emit('dividend.month', { month: x.key }); }}>
      <span class="tk-trd-dv__amt">${x.amount ? money(ctx, x.amount, { digits: x.amount >= 10 ? 0 : 2 }) : ''}</span><span class=${`tk-trd-dv__bar ${f ? 'tk-trd-dv__bar--f' : ''} ${x.amount ? '' : 'tk-trd-dv__bar--0'}`} style=${`height:${x.amount ? Math.max(8, x.amount / max * 100) : 4}px`}></span><span class="tk-trd-dv__lab">${MON[x.date.getMonth()]}</span></button>`; })}</div>`;
    return html`<${Card} title=${props.title} icon="calendar-days"><div class="tk-trd-dv">${stats}
      ${props.style === 'calendar' && html`<div>${cal}<p class="tk-trd-sub" style="margin-top:8px"><span class="tk-trd-dv__bar tk-trd-dv__bar--f" style="display:inline-block;width:14px;height:10px;vertical-align:middle;margin-right:6px"></span>schraffiert = Prognose (Annahme, kein Versprechen)</p>${m && html`<div class="tk-trd-list" style="margin-top:8px">${m.items.length ? m.items.map(item) : html`<p class="tk-trd-meta" style="padding:8px 4px">Keine Zahlung im ${MONTHS_LONG[m.date.getMonth()]}.</p>`}</div>`}</div>`}
      <div><div class="tk-trd-cap" style="margin-bottom:4px">Kommende Zahlungen</div><div class="tk-trd-list">${upcoming.length ? upcoming.map(item) : html`<p class="tk-trd-meta" style="padding:8px 4px">Keine weiteren Zahlungen in den nächsten zwölf Monaten.</p>`}</div></div>
      ${props.style === 'list' && paid.length ? html`<div><div class="tk-trd-cap" style="margin-bottom:4px">Erhalten</div><div class="tk-trd-list">${paid.map(item)}</div></div>` : null}${tax}</div><//>`;
  },
};
export default [trdDividends];
