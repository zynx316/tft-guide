// Finanzen (Referenz): Konten mit Saldo und Gesamtvermögen
import { html } from '../../../lib/html.js';
import { Card, Badge, Icon, EmptyState, Sparkline, toneColor } from '../../ui.js';
import { money } from '../../helpers.js';

const ICON = { Girokonto: 'landmark', Tagesgeld: 'piggy-bank', Kreditkarte: 'credit-card', Depot: 'candlestick-chart', Bargeld: 'banknote', giro: 'landmark', business: 'briefcase', savings: 'piggy-bank', credit: 'credit-card', depot: 'candlestick-chart' };

export const accountCards = {
  id: 'account-cards',
  name: 'Konten-Karten',
  category: 'Finanzen',
  description: 'Konten (Giro, Tagesgeld, Kreditkarte, Depot) mit Saldo, maskierter IBAN und Mini-Verlauf plus Gesamtvermögen. Auswahl eines Kontos filtert verbundene Transaktionslisten (ctx.ui.account).',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Konten' },
    { name: 'showTotal', label: 'Gesamtvermögen zeigen', type: 'boolean', default: true },
    { name: 'layout', label: 'Anordnung', type: 'select', options: ['grid', 'scroll'], default: 'grid' },
    { name: 'minWidth', label: 'Min. Kartenbreite (px)', type: 'number', default: 230 },
  ],
  data: [{ slot: 'accounts', label: 'Konten', default: 'accounts', shape: '{id,name,type,bank?,iban?,balance,icon?,delta?,spark?:number[],tone?}[]', required: true }],
  events: ['account.open'],
  states: ['empty'],
  css: `
  .tk-accounts { display:grid; gap:var(--tk-space-3); grid-template-columns:repeat(auto-fill, minmax(min(100%, var(--minw,230px)), 1fr)); }
  .tk-accounts--scroll { display:flex; overflow-x:auto; scroll-snap-type:x mandatory; scrollbar-width:none; }
  .tk-accounts--scroll > * { flex:0 0 min(78%, 280px); scroll-snap-align:start; }
  .tk-account { display:flex; flex-direction:column; gap:10px; text-align:left; color:inherit; font:inherit; min-width:0; }
  .tk-account[aria-pressed="true"] { border-color:var(--tk-c-accent); background:var(--tk-c-accent-soft); }
  .tk-account__top { display:flex; align-items:center; gap:10px; min-width:0; }
  .tk-account__ico { width:34px; height:34px; border-radius:10px; display:grid; place-items:center; flex:none; }
  .tk-account__bal { font-size:var(--tk-fs-xl); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); font-variant-numeric:tabular-nums; white-space:nowrap; }
  .tk-account__foot { display:flex; align-items:center; justify-content:space-between; gap:8px; min-height:24px; }
  .tk-accounts__total { display:flex; align-items:baseline; gap:12px; flex-wrap:wrap; margin-bottom:var(--tk-space-3); }
  .tk-accounts__total strong { font-size:var(--tk-fs-3xl); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); font-variant-numeric:tabular-nums; }
  .bp-mobile .tk-accounts__total strong { font-size:var(--tk-fs-2xl); }`,
  example: { data: { accounts: [
    { id: 'giro', name: 'Girokonto', type: 'Girokonto', iban: 'DE•• •••• 4821', balance: 3482.16, delta: 2.1, spark: [3100, 3000, 3300, 3250, 3400, 3482], tone: 1 },
    { id: 'tg', name: 'Tagesgeld', type: 'Tagesgeld', iban: 'DE•• •••• 9033', balance: 12500, delta: 0.3, spark: [12300, 12350, 12400, 12450, 12480, 12500], tone: 2 },
    { id: 'cc', name: 'Kreditkarte', type: 'Kreditkarte', iban: '•••• 7714', balance: -642.9, delta: -12, spark: [-200, -350, -420, -500, -600, -643], tone: 3 },
  ] } },
  render: function AccountCards({ props, data, ctx }) {
    const acc = data.accounts || [];
    if (!acc.length) return html`<${Card} title=${props.title}><${EmptyState} icon="wallet" title="Noch keine Konten" text="Lege ein Konto an, um Salden und Umsätze zu sehen." /><//>`;
    const total = acc.reduce((a, c) => a + c.balance, 0);
    const pick = (a) => { ctx.setUi('account', ctx.ui.account === a.id ? null : a.id); ctx.emit('account.open', { id: a.id, ui: { account: a.id } }); };
    return html`<div>
      ${props.showTotal && html`<div class="tk-accounts__total"><div><div class="tk-label">Gesamtvermögen</div><strong>${money(ctx, total)}</strong></div>${ctx.ui.account && html`<${Badge} tone="accent" icon="filter">Filter aktiv<//>`}</div>`}
      <div class=${`tk-accounts tk-accounts--${ctx.bp === "mobile" ? "scroll" : props.layout}`} style=${`--minw:${props.minWidth}px`} data-scroll-x=${ctx.bp === "mobile" || props.layout === "scroll" ? "" : undefined}>
        ${acc.map((a, i) => { const col = toneColor(a.tone || i + 1); const neg = a.balance < 0;
          return html`<button type="button" class="tk-card tk-card--interactive tk-account" aria-pressed=${String(ctx.ui.account === a.id)} onClick=${() => pick(a)}>
            <div class="tk-account__top"><span class="tk-account__ico" style=${`background:color-mix(in srgb, ${col} 16%, transparent);color:${col}`}><${Icon} name=${a.icon || ICON[a.type] || 'wallet'} size=${17} /></span>
              <div class="tk-grow"><div class="tk-truncate" style="font-weight:600">${a.name}</div><div class="tk-truncate tk-subtle" style="font-size:var(--tk-fs-xs)">${a.iban || a.bank || a.type}</div></div></div>
            <div class="tk-account__bal" style=${neg ? 'color:var(--tk-c-danger)' : ''}>${money(ctx, a.balance)}</div>
            <div class="tk-account__foot">${a.delta != null ? html`<span class="tk-num" style=${`font-size:var(--tk-fs-sm);font-weight:600;color:var(--tk-c-${a.delta >= 0 ? 'success' : 'danger'})`}>${a.delta > 0 ? '+' : ''}${String(a.delta).replace('.', ',')} % <span class="tk-subtle" style="font-weight:400">30 Tage</span></span>` : html`<span></span>`}
              ${a.spark && html`<${Sparkline} values=${a.spark} width=${64} height=${22} tone=${a.balance >= 0 ? col : 'danger'} />`}</div></button>`; })}
      </div></div>`;
  },
};

export default [accountCards];
