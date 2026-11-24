// Finanzen: „Frei verfügbar bis Monatsende“ mit nachvollziehbarer Herleitung („Wie berechnet?“).
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Icon, EmptyState, toneColor } from '../../ui.js';
import { safeToSpend } from './_calc.js';
import { FIN_CSS, slots, pctx, eur, eur0, shortDate } from './_fin.js';
import { ex } from './_example.js';

export const finSafeToSpend = {
  id: 'fin-safe-to-spend',
  name: 'Frei verfügbar',
  category: 'Finanzen',
  description: 'Was bis Monatsende frei bleibt: Girokonto minus offene Kreditkarte, Abbuchungen bis zum Monatswechsel, Sparraten und Puffer. Jede Zahl ist über „Wie berechnet?“ herleitbar.',
  version: '1.2',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Frei verfügbar' },
    { name: 'style', label: 'Darstellung', type: 'select', options: ['hero', 'compact', 'formula'], default: 'hero' },
    { name: 'showHow', label: '„Wie berechnet?“ anbieten', type: 'boolean', default: true },
    { name: 'openHow', label: 'Herleitung offen', type: 'boolean', default: false },
    { name: 'reserve', label: 'Puffer in € (falls keine Einstellung)', type: 'number', default: 300 },
  ],
  data: slots('accounts', 'transactions', 'subs', 'plans', 'events', 'prefs'),
  events: ['safe.how', 'account.add'],
  states: ['empty'],
  css: `${FIN_CSS}
  .tk-fns { display:flex; flex-direction:column; gap:var(--tk-space-3); min-width:0; }
  .tk-fns__legend { display:flex; flex-wrap:wrap; gap:6px 14px; font-size:var(--tk-fs-xs); color:var(--tk-c-text-muted); }
  .tk-fns__legend span { display:inline-flex; align-items:center; gap:6px; white-space:nowrap; } .tk-fns__legend i { width:9px; height:9px; border-radius:3px; display:inline-block; }
  .tk-fns__how { margin:0; display:grid; grid-template-columns:1fr auto; gap:6px 12px; font-size:var(--tk-fs-sm); padding:var(--tk-space-3); border-radius:var(--tk-radius-md); background:var(--tk-c-surface2); border:1px solid var(--tk-c-border); }
  .tk-fns__how dt { color:var(--tk-c-text-muted); min-width:0; } .tk-fns__how dd { margin:0; text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; }
  .tk-fns__how .tk-fns__sum { font-weight:var(--tk-fw-bold); color:var(--tk-c-text); border-top:1px solid var(--tk-c-border-strong); padding-top:6px; }
  .tk-fns__row { display:flex; align-items:center; gap:12px; min-width:0; } .tk-fns__row .tk-fn-big { font-size:var(--tk-fs-2xl); }
  [data-tk-large-text] .tk-fns__row { flex-wrap:wrap; } [data-tk-large-text] .tk-fns__row > .tk-fn-grow { flex:1 1 100%; }
  .tk-fns__formula { display:flex; flex-wrap:wrap; align-items:baseline; gap:4px 8px; font-variant-numeric:tabular-nums; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); }
  .tk-fns__formula b { color:var(--tk-c-text); }`,
  example: { props: { openHow: true }, data: ex('accounts', 'transactions', 'subscriptions', 'plans', 'events', 'prefs') },
  render: function FinSafeToSpend({ props, data, ctx }) {
    const c = pctx(ctx, data);
    const [how, setHow] = useState(!!props.openHow);
    const s = safeToSpend({ accounts: data.accounts, txs: data.transactions, subs: data.subscriptions, plans: data.plans, events: data.events, today: ctx.today, reserve: data.prefs?.reserve ?? props.reserve });
    if (!s) return html`<${Card} title=${props.title} icon="wallet"><${EmptyState} icon="wallet" title="Noch kein Konto" text="Lege ein Girokonto an, dann zeigt TAKT, was bis Monatsende frei bleibt." action=${html`<${Button} variant="primary" icon="plus" onClick=${() => ctx.emit('account.add')}>Konto anlegen<//>`} /><//>`;
    const end = shortDate(c, s.end), short = s.free < 0;
    const toggle = () => { setHow(!how); ctx.emit('safe.how', { open: !how }); };
    const howBtn = props.showHow && html`<${Button} size="sm" variant="ghost" icon=${how ? 'chevron-up' : 'circle-help'} aria-expanded=${String(how)} onClick=${toggle}>Wie berechnet?<//>`;
    const lines = [['Girokonto heute', s.balance], ['Kreditkarte offen (Abrechnung)', -s.cardOpen], [`Abbuchungen am ${shortDate(c, s.horizon)}`, -s.fixedUpcoming], ['Sparraten', -s.plannedSavings], ['Puffer (deine Vorgabe)', -s.reserve]].filter(([, v]) => v !== 0);
    const table = how && html`<dl class="tk-fns__how" data-qa="safe-how">${lines.map(([l, v]) => html`<dt>${l}</dt><dd>${eur(c, v, { sign: true })}</dd>`)}<dt class="tk-fns__sum">Frei verfügbar</dt><dd class="tk-fns__sum">${eur(c, s.free)}</dd></dl>
      <p class="tk-fn-note"><${Icon} name="info" size=${14} />Annahme: Bis ${end} kommen keine weiteren Einnahmen. Abbuchungen vom ${shortDate(c, s.horizon)} sind schon abgezogen. Stand 09:30, fiktive Demo-Daten.</p>`;
    const perDay = short ? `Es fehlen ${eur0(c, -s.free)} bis zum Monatsende` : `≈ ${eur0(c, s.perDay)} pro Tag · noch ${s.daysLeft} Tage (bis ${end})`;

    if (props.style === 'compact') return html`<${Card}><div class="tk-fns"><div class="tk-fns__row"><div class="tk-fn-grow"><div class="tk-fn-cap">${props.title} bis Monatsende</div><div class="tk-fn-meta">${perDay}</div></div>
      <div class="tk-fn-big" style=${short ? 'color:var(--tk-c-warning)' : ''}>${eur(c, s.free)}</div></div>${howBtn && html`<div>${howBtn}</div>`}${table}</div><//>`;
    if (props.style === 'formula') return html`<${Card} title=${props.title} icon="wallet" actions=${howBtn}><div class="tk-fns"><div class="tk-fns__formula"><b>${eur0(c, s.balance)}</b><span>−</span><span>${eur0(c, s.cardOpen)} Karte</span><span>−</span><span>${eur0(c, s.fixedUpcoming)} Fixkosten</span><span>−</span><span>${eur0(c, s.plannedSavings)} Sparen</span>${s.reserve ? html`<span>−</span><span>${eur0(c, s.reserve)} Puffer</span>` : null}<span>=</span><b style="font-size:var(--tk-fs-lg)">${eur0(c, s.free)}</b></div><div class="tk-fn-meta">${perDay}</div>${table}</div><//>`;

    const segs = [['Frei', Math.max(0, s.free), 'var(--tk-c-success)'], ['Puffer', s.reserve, 'var(--tk-c-border-strong)'], ['Sparen', s.plannedSavings, 'var(--tk-chart-1)'], ['Fixkosten', s.fixedUpcoming, toneColor(3)], ['Kreditkarte', s.cardOpen, toneColor(6)]].filter(([, v]) => v > 0);
    const total = segs.reduce((a, [, v]) => a + v, 0) || 1;
    return html`<${Card} title=${props.title} icon="wallet" actions=${howBtn}><div class="tk-fns">
      <div><div class="tk-fn-cap">Frei verfügbar bis Monatsende</div><div class="tk-fn-big tk-fn-big--xl" style=${short ? 'color:var(--tk-c-warning)' : ''} data-qa="safe-amount">${eur(c, s.free)}</div></div>
      <div class="tk-fn-meta">${perDay}</div>
      <div class="tk-fn-bar" style="height:12px" role="img" aria-label=${`Verteilung des Girokontos: ${segs.map(([l, v]) => `${l} ${eur(c, v)}`).join(', ')}`}>${segs.map(([l, v, col]) => html`<i style=${`width:${(v / total) * 100}%;background:${col}`} title=${`${l}: ${eur(c, v)}`}></i>`)}</div>
      <div class="tk-fns__legend">${segs.map(([l, v, col]) => html`<span><i style=${`background:${col}`}></i>${l} ${eur0(c, v)}</span>`)}</div>${table}</div><//>`;
  },
};
export default [finSafeToSpend];
