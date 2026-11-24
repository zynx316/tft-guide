// Finanzen (Referenz): Umsätze nach Datum gruppiert
import { html } from '../../../lib/html.js';
import { Card, Badge, Icon, EmptyState, Button, toneColor } from '../../ui.js';
import { applyUiFilter, groupBy, money } from '../../helpers.js';
import { fmt } from '../../../lib/util.js';

const sg = (ctx, t) => (t.type === 'transfer' ? money(ctx, Math.abs(t.amount)) : money(ctx, t.amount, { sign: true }));
const dayKey = (d) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };

export const transactionList = {
  id: 'transaction-list',
  name: 'Transaktionsliste',
  category: 'Finanzen',
  description: 'Umsätze nach Datum gruppiert (Heute/Gestern/Datum) mit Kategorie-Icon, Betrag und Tagessumme; Umbuchungen sind neutral und zählen nicht in die Summe. Reagiert auf Suche/Filter (Kategorie) und das gewählte Konto.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Umsätze' },
    { name: 'limit', label: 'Max. Einträge (0 = alle)', type: 'number', default: 0 },
    { name: 'followAccount', label: 'Gewähltes Konto beachten', type: 'boolean', default: true },
    { name: 'showDaySum', label: 'Tagessumme', type: 'boolean', default: true },
    { name: 'respectFilter', label: 'Suche/Filter beachten', type: 'boolean', default: true },
  ],
  data: [{ slot: 'transactions', label: 'Transaktionen', default: 'transactions', shape: '{id,title,subtitle?,amount,date,category,type?,icon?,tone?,account?}[]', required: true }],
  events: ['transaction.open'],
  states: ['empty'],
  css: `
  .tk-tx__group { display:flex; justify-content:space-between; gap:8px; padding:10px var(--tk-space-4) 6px; font-size:var(--tk-fs-xs); font-weight:var(--tk-fw-semibold); letter-spacing:var(--tk-ls-wide); text-transform:uppercase; color:var(--tk-c-text-subtle); background:var(--tk-c-surface2); border-bottom:1px solid var(--tk-c-border); font-variant-numeric:tabular-nums; }
  .tk-tx__row { display:flex; align-items:center; gap:var(--tk-space-3); padding:10px var(--tk-space-4); border-bottom:1px solid var(--tk-c-border); cursor:pointer; min-height:56px; min-width:0; }
  .tk-tx__row:last-child { border-bottom:0; }
  .tk-tx__row:hover { background:var(--tk-c-surface2); }
  .tk-tx__ico { width:36px; height:36px; border-radius:11px; display:grid; place-items:center; flex:none; }
  .tk-tx__amt { font-weight:var(--tk-fw-semibold); font-variant-numeric:tabular-nums; white-space:nowrap; }`,
  example: { props: { title: 'Umsätze' }, data: { transactions: [
    { id: 't1', title: 'Rewe Markt', subtitle: 'Lebensmittel', amount: -42.8, date: '2026-11-24T08:15:00', category: 'Lebensmittel', icon: 'shopping-cart', tone: 1, account: 'giro' },
    { id: 't2', title: 'Gehalt November', subtitle: 'Northnode GmbH', amount: 3150, date: '2026-11-23T06:00:00', category: 'Einkommen', icon: 'banknote', tone: 'success', account: 'giro' },
  ] } },
  render: function TransactionList({ props, data, ctx }) {
    let items = applyUiFilter(data.transactions, props.respectFilter ? ctx.ui : {}, { searchFields: ['title', 'subtitle', 'category'] });
    if (props.followAccount && ctx.ui.account) items = items.filter((t) => t.account === ctx.ui.account);
    items = [...items].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (props.limit > 0) items = items.slice(0, props.limit);
    const filtered = !!ctx.ui.query || (ctx.ui.filter && !/^alle?$/i.test(ctx.ui.filter)) || (props.followAccount && ctx.ui.account);
    if (!items.length) return html`<${Card} title=${props.title}><${EmptyState} icon="receipt" title="Keine Umsätze" text=${filtered ? 'Keine Umsätze für diese Auswahl.' : 'Sobald Zahlungen eingehen, erscheinen sie hier.'}
      action=${props.followAccount && ctx.ui.account ? html`<${Button} size="sm" onClick=${() => ctx.setUi('account', null)}>Konto-Filter aufheben<//>` : null} /><//>`;
    const today = dayKey(ctx.today), yest = dayKey(new Date(ctx.today.getTime() - 86400000));
    const label = (k, d) => (k === today ? 'Heute' : k === yest ? 'Gestern' : `${fmt.weekday(d)}, ${fmt.date(d)}`);
    const groups = groupBy(items, (t) => dayKey(t.date));
    const open = (t) => { ctx.emit('transaction.open', { id: t.id }); ctx.openDialog({ title: t.title,
      body: () => html`<div class="tk-col" style="gap:10px"><div style=${`font-size:var(--tk-fs-3xl);font-weight:700;color:var(--tk-c-${t.type === 'transfer' ? 'text-muted' : t.amount >= 0 ? 'success' : 'text'})`}>${sg(ctx, t)}</div>
        <div class="tk-row"><${Badge}>${t.category}<//><span class="tk-muted">${fmt.dateTime(t.date)}</span></div>${t.subtitle && html`<p class="tk-muted">${t.subtitle}</p>`}</div>`,
      footer: (close) => html`<${Button} onClick=${close}>Schließen<//>` }); };
    return html`<${Card} flush title=${props.title} actions=${html`<${Badge}>${items.length}<//>`}>
      ${groups.map(([k, list]) => html`<div><div class="tk-tx__group"><span>${label(k, list[0].date)}</span>${props.showDaySum && html`<span>${money(ctx, list.filter((t) => t.type !== 'transfer').reduce((a, t) => a + t.amount, 0), { sign: true })}</span>`}</div>
        ${list.map((t) => { const col = toneColor(t.type === 'transfer' ? 'neutral' : t.tone || 'accent');
          return html`<div class="tk-tx__row" role="button" tabindex="0" onClick=${() => open(t)} onKeyDown=${(e) => e.key === 'Enter' && open(t)}>
            <span class="tk-tx__ico" style=${`background:color-mix(in srgb, ${col} 15%, transparent);color:${col}`}><${Icon} name=${t.type === 'transfer' ? 'arrow-left-right' : t.icon || 'receipt'} size=${17} /></span>
            <div class="tk-grow"><div class="tk-truncate" style="font-weight:500">${t.title}</div><div class="tk-truncate tk-subtle" style="font-size:var(--tk-fs-sm)">${t.category}${t.subtitle ? ` · ${t.subtitle}` : ''}</div></div>
            <span class="tk-tx__amt" style=${`color:var(--tk-c-${t.type === 'transfer' ? 'text-muted' : t.amount >= 0 ? 'success' : 'text'})`}>${sg(ctx, t)}</span></div>`; })}</div>`)}
    <//>`;
  },
};

export default [transactionList];
