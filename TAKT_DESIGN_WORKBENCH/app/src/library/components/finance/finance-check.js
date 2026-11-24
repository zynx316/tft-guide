// Finanzen: Finanz-Check – nüchterne Kennzahlen mit Herleitung (Rücklage in Monaten, Sparquote, Fixkostenquote, Kreditkarte).
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Icon, EmptyState } from '../../ui.js';
import { monthsSeries, subStats, arr, r2 } from './_calc.js';
import { FIN_CSS, slots, pctx, eur, eur0, Tile } from './_fin.js';
import { fmtPercent, fmtNumber } from '../../../lib/format.js';
import { ex } from './_example.js';

export const finFinanceCheck = {
  id: 'fin-finance-check',
  name: 'Finanz-Check',
  category: 'Finanzen',
  description: 'Vier Kennzahlen zur Orientierung: Rücklage in Monatsausgaben, Sparquote, Fixkostenquote und Kreditkarten-Auslastung. Jede Zahl zeigt ihre Herleitung, Richtwerte sind markiert, nicht bewertet.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Finanz-Check' },
    { name: 'style', label: 'Darstellung', type: 'select', options: ['list', 'cards'], default: 'list' },
  ],
  data: slots('accounts', 'transactions', 'months', 'subs', 'subMeta', 'prefs'),
  events: ['check.open'],
  states: ['empty'],
  css: `${FIN_CSS}
  .tk-fnc__grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap:var(--tk-space-3); }
  .tk-fnc__item { display:flex; flex-direction:column; gap:8px; padding:var(--tk-space-3) var(--tk-space-4); border-radius:var(--tk-radius-md); background:var(--tk-c-surface2); border:1px solid var(--tk-c-border); text-align:left; color:inherit; font:inherit; cursor:pointer; min-width:0; min-height:44px; }
  .tk-fnc__item--list { background:none; border:0; border-radius:0; padding:var(--tk-space-3) 0; }
  .tk-fnc__meter { position:relative; height:8px; border-radius:4px; background:var(--tk-c-surface3); } .tk-fnc__meter > i { position:absolute; left:0; top:0; bottom:0; border-radius:4px; background:var(--tk-c-accent); }
  .tk-fnc__band { position:absolute; top:-2px; bottom:-2px; border:1.5px solid var(--tk-c-text-subtle); border-radius:4px; opacity:.8; }`,
  example: { data: ex('accounts', 'transactions', 'months', 'subscriptions', 'subMeta', 'prefs') },
  render: function FinFinanceCheck({ props, data, ctx }) {
    const c = pctx(ctx, data), [open, setOpen] = useState(null);
    const accs = arr(data.accounts), ser = monthsSeries(data.months, data.transactions, ctx.today, 12).filter((m) => !m.partial);
    if (!accs.length || !ser.length) return html`<${Card} title=${props.title} icon="stethoscope"><${EmptyState} icon="gauge" title="Noch zu wenig Daten" text="Nach dem ersten vollen Monat zeigt der Check deine Kennzahlen." /><//>`;
    const avgExp = r2(ser.reduce((s, m) => s + m.expenses, 0) / ser.length), avgInc = r2(ser.reduce((s, m) => s + m.income, 0) / ser.length);
    const avgRate = ser.reduce((s, m) => s + m.rate, 0) / ser.length;
    const reserve = r2(accs.filter((a) => a.type === 'savings').reduce((s, a) => s + a.balance, 0));
    const st = subStats(data.subscriptions, data.subMeta, ctx.today);
    const card = accs.find((a) => a.type === 'credit'), used = card ? Math.max(0, -card.balance) : 0;
    const p = c.privacy;
    const items = [
      { id: 'reserve', icon: 'shield', tone: 3, label: 'Rücklage', value: p ? '•• Monate' : `${fmtNumber(avgExp ? reserve / avgExp : 0, { digits: 1 })} Monate`, sub: 'Tagesgeld in Monatsausgaben', fill: avgExp ? Math.min(1, reserve / avgExp / 12) : 0, band: [3 / 12, 6 / 12], ref: 'Richtwert der Verbraucherberatung: 3 bis 6 Monatsausgaben', how: `${eur0(c, reserve)} Tagesgeld ÷ Ø Ausgaben ${eur0(c, avgExp)} (${ser[0].label} bis ${ser[ser.length - 1].label})` },
      { id: 'rate', icon: 'piggy-bank', tone: 'accent', label: 'Sparquote', value: p ? '•• %' : fmtPercent(avgRate, { digits: 0 }), sub: `Ø der letzten ${ser.length} Monate`, fill: Math.max(0, Math.min(1, avgRate)), how: '(Einnahmen − Ausgaben) ÷ Einnahmen je Monat, dann Mittelwert. Umbuchungen zählen nicht.' },
      { id: 'fixed', icon: 'repeat', tone: 1, label: 'Fixkostenquote', value: p ? '•• %' : fmtPercent(avgInc ? st.monthly / avgInc : 0, { digits: 0 }), sub: 'Abos und Fixkosten an den Einnahmen', fill: avgInc ? Math.min(1, st.monthly / avgInc) : 0, how: `${eur0(c, st.monthly)} Abos und Fixkosten ÷ Ø Einnahmen ${eur0(c, avgInc)}` },
      ...(card ? [{ id: 'card', icon: 'credit-card', tone: 6, label: 'Kreditkarte', value: p ? '•• %' : fmtPercent(card.limit ? used / card.limit : 0, { digits: 0 }), sub: 'des Rahmens in Anspruch', fill: card.limit ? Math.min(1, used / card.limit) : 0, how: `${eur(c, used)} offen von ${eur0(c, card.limit || 0)} Rahmen` }] : []),
    ];
    const pick = (i) => { setOpen(open === i.id ? null : i.id); ctx.emit('check.open', { id: i.id }); };
    const one = (i) => html`<button type="button" class=${`tk-fnc__item ${props.style === 'list' ? 'tk-fnc__item--list' : ''}`} aria-expanded=${String(open === i.id)} onClick=${() => pick(i)}>
      <span class="tk-fn-row"><${Tile} icon=${i.icon} tone=${i.tone} size=${32} /><span class="tk-fn-grow"><span class="tk-fn-title" style="display:block">${i.label}</span><span class="tk-fn-sub">${i.sub}</span></span><strong class="tk-fn-num" style="font-size:var(--tk-fs-lg)">${i.value}</strong></span>
      <span class="tk-fnc__meter" role="img" aria-label=${`${i.label}: ${i.value}`}><i style=${`width:${i.fill * 100}%`}></i>${i.band && html`<span class="tk-fnc__band" style=${`left:${i.band[0] * 100}%;width:${(i.band[1] - i.band[0]) * 100}%`} title=${i.ref}></span>`}</span>
      ${i.ref && html`<span class="tk-fn-sub">Markierter Bereich: ${i.ref}.</span>`}
      ${open === i.id && html`<span class="tk-fn-note"><${Icon} name="calculator" size=${14} />So berechnet: ${i.how}</span>`}</button>`;
    return html`<${Card} title=${props.title} icon="stethoscope">${props.style === 'cards' ? html`<div class="tk-fnc__grid">${items.map(one)}</div>` : html`<div class="tk-fn-list">${items.map(one)}</div>`}
      <p class="tk-fn-note" style="margin:var(--tk-space-3) 0 0"><${Icon} name="info" size=${14} />Orientierung, keine Beratung. Richtwerte sind Annahmen, Stand 24.11.2026.</p><//>`;
  },
};
export default [finFinanceCheck];
