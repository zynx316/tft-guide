// Sparpläne: Deckungs-Check – reicht das Girokonto an den Ausführungstagen? Ruhig formuliert, Herleitung aufklappbar.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Badge, Chip, Icon, EmptyState } from '../../ui.js';
import { fmtDate } from '../../../lib/format.js';
import { arr, todayOf, eur, eur2, Tile, SV_CSS, plural } from './_savings.js';
import { coverageCheck, BUFFERS, DEFAULT_BUFFER, COVER_TONE, COVER_LABEL, COVER_ICON } from './_coverage.js';

export const coverageCheckCard = {
  id: 'coverage-check',
  name: 'Deckungs-Check',
  category: 'Sparpläne',
  description: 'Prüft für die nächsten Ausführungen, ob das Girokonto nach Fixkosten, Sparraten und erwartetem Einkommen ausreicht – mit einstellbarem Puffer und aufklappbarer Herleitung („Wie berechnet?“). Nie als Alarm formuliert.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Deckung Girokonto' },
    { name: 'limit', label: 'Ausführungstage', type: 'number', default: 3 },
    { name: 'showBuffer', label: 'Puffer wählbar', type: 'boolean', default: true },
    { name: 'showDetails', label: '„Wie berechnet?“', type: 'boolean', default: true },
    { name: 'framed', label: 'In Karte', type: 'boolean', default: true },
  ],
  data: [
    { slot: 'plans', label: 'Sparpläne', default: 'plans', shape: '{id,name,monthly,day,active}[]', required: true },
    { slot: 'accounts', label: 'Konten', default: 'accounts', shape: '{id,type,balance}[]' },
    { slot: 'subscriptions', label: 'Fixkosten', default: 'subscriptions', shape: '{id,name,amount,day,interval}[]' },
    { slot: 'transactions', label: 'Buchungen', default: 'transactions', shape: '{id,account,subscriptionId?,type,amount}[]' },
  ],
  events: ['coverage.buffer', 'coverage.details', 'coverage.open'],
  states: ['empty'],
  css: `${SV_CSS}
  .tk-svc { display:flex; flex-direction:column; gap:var(--tk-space-4); min-width:0; }
  .tk-svc__head { display:flex; gap:12px; align-items:flex-start; } .tk-svc__head p { margin:0; }
  .tk-svc__rows { display:flex; flex-direction:column; } .tk-svc__row { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:2px 12px; align-items:center; padding:10px 0; border-bottom:1px solid var(--tk-c-border); min-width:0; }
  .tk-svc__row:last-child { border-bottom:0; } .tk-svc__row strong { font-weight:var(--tk-fw-semibold); } .tk-svc__row .tk-sv-meta { font-variant-numeric:tabular-nums; }
  .tk-svc__row > div:last-child { text-align:right; display:flex; flex-direction:column; align-items:flex-end; gap:2px; }
  .tk-svc__dt { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:6px 16px; margin:0; font-size:var(--tk-fs-sm); font-variant-numeric:tabular-nums; } .tk-svc__dt dd { margin:0; text-align:right; } .tk-svc__dt dt { color:var(--tk-c-text-muted); }
  .tk-svc__dt .sum { font-weight:var(--tk-fw-semibold); border-top:1px solid var(--tk-c-border); padding-top:6px; color:var(--tk-c-text); }
  .tk-svc__tog { border:0; background:none; color:var(--tk-c-text-muted); font:inherit; font-size:var(--tk-fs-sm); display:inline-flex; gap:6px; align-items:center; padding:8px 0; min-height:36px; cursor:pointer; align-self:flex-start; }
  .tk-svc__chips { display:flex; flex-wrap:wrap; gap:6px; align-items:center; }`,
  example: { data: { plans: [{ id: 'a', name: 'All-World', monthly: 300, day: 1, intervalMonths: 1, active: true, startDate: '2024-01-01' }], accounts: [{ id: 'acc-giro', type: 'giro', balance: 3842.17 }], subscriptions: [{ id: 's1', name: 'Miete', amount: 1150, day: 1, interval: 'monatlich' }], transactions: [{ id: 't1', account: 'acc-giro', subscriptionId: 's1', type: 'expense', amount: -1150 }] } },
  render: function CoverageCheck({ props, data, ctx }) {
    const [open, setOpen] = useState(false);
    const buffer = ctx.ui.buffer ?? DEFAULT_BUFFER;
    const today = todayOf(ctx);
    const wrap = (b) => (props.framed ? html`<${Card} title=${props.title} icon="shield-check">${b}<//>` : b);
    const cov = coverageCheck({ plans: data.plans, accounts: data.accounts, subscriptions: data.subscriptions, transactions: data.transactions, today, buffer });
    if (!cov.giro || !cov.rows.length) return wrap(html`<${EmptyState} icon="shield-check" title="Nichts zu prüfen" text=${!cov.giro ? 'Ohne Girokonto kann TAKT die Deckung nicht prüfen.' : 'In den nächsten Wochen steht keine Ausführung an.'} />`);
    const rows = cov.rows.slice(0, Math.max(1, props.limit)), lead = cov.problem || cov.tight, first = lead || cov.rows[0];
    const tone = cov.problem ? 'warning' : cov.tight ? 'warning' : 'success';
    const head = cov.problem ? `Am ${fmtDate(cov.problem.date, { style: 'weekday' })} fehlen ${eur2(ctx, cov.problem.short)} auf dem Girokonto für ${cov.problem.items.length === 1 ? 'den Sparplan' : 'alle Sparpläne'}.`
      : cov.tight ? `Am ${fmtDate(cov.tight.date, { style: 'weekday' })} wird es knapp: nach den Sparraten bleiben ${eur(ctx, cov.tight.free)} über dem Puffer.`
        : `Alle Ausführungen der nächsten Wochen sind gedeckt. Am ${fmtDate(first.date, { style: 'weekday' })} bleiben ${eur(ctx, first.free)} über dem Puffer.`;
    const dl = (r) => html`<dl class="tk-svc__dt"><dt>Kontostand heute</dt><dd>${eur2(ctx, cov.start)}</dd>
      <dt>Fixkosten bis ${fmtDate(r.date, { style: 'short' })}</dt><dd>−${eur2(ctx, r.fixed)}</dd><dt>Sparraten bis dahin</dt><dd>−${eur2(ctx, r.saved)}</dd>
      ${r.inflow > 0 && html`<dt>Erwartetes Einkommen (wie im Vormonat)</dt><dd>+${eur2(ctx, r.inflow)}</dd>`}
      <dt class="sum">Kontostand danach</dt><dd class="sum">${eur2(ctx, r.balance)}</dd><dt>Puffer für laufende Ausgaben</dt><dd>−${eur2(ctx, cov.buffer)}</dd><dt class="sum">${r.free < 0 ? 'Es fehlen' : 'Frei'}</dt><dd class="sum">${eur2(ctx, Math.abs(r.free))}</dd></dl>`;
    return wrap(html`<div class="tk-svc">
      <div class="tk-svc__head"><${Tile} tone=${tone} icon=${COVER_ICON[cov.problem ? 'fehlt' : cov.tight ? 'knapp' : 'ok']} /><p class="tk-sv-lead" style="font-size:var(--tk-fs-md)" role="status">${head}</p></div>
      <div class="tk-svc__rows">${rows.map((r) => html`<div class="tk-svc__row"><div><strong>${fmtDate(r.date, { style: 'weekday' })}</strong><div class="tk-sv-meta">${plural(r.items.length, 'Sparplan', 'Sparpläne')} · ${eur(ctx, r.sparTotal)}</div></div>
        <div><${Badge} tone=${COVER_TONE[r.status]} icon=${COVER_ICON[r.status]}>${r.status === 'fehlt' ? `${COVER_LABEL.fehlt}: ${eur(ctx, r.short)}` : COVER_LABEL[r.status]}<//><span class="tk-sv-meta">Kontostand danach ${eur(ctx, r.balance)}</span></div></div>`)}</div>
      ${props.showBuffer && html`<div class="tk-svc__chips" role="group" aria-label="Puffer für laufende Ausgaben"><span class="tk-sv-meta">Puffer</span>${BUFFERS.map((b) => html`<${Chip} active=${buffer === b} onClick=${() => { ctx.setUi('buffer', b); ctx.emit('coverage.buffer', { buffer: b }); }}>${eur(ctx, b)}<//>`)}</div>`}
      ${props.showDetails && html`<div><button type="button" class="tk-svc__tog" aria-expanded=${open ? 'true' : 'false'} onClick=${() => { setOpen(!open); ctx.emit('coverage.details'); }}><${Icon} name=${open ? 'chevron-up' : 'chevron-down'} size=${14} />Wie berechnet?</button>
        ${open && html`<div class="tk-col" style="gap:10px">${dl(first)}<p class="tk-sv-note"><${Icon} name="info" size=${14} /><span>Vereinfachtes Modell: Kartenabrechnung und variable Ausgaben stecken im Puffer. Sparpläne laufen vom Girokonto.</span></p></div>`}</div>`}</div>`);
  },
};
export default [coverageCheckCard];
