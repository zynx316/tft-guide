// Finanzen: Anstehendes – Abos, Sparraten, Kreditkarte und Steuertermine der nächsten Tage, nach Tag gruppiert.
import { html } from '../../../lib/html.js';
import { Card, Badge, Icon, EmptyState } from '../../ui.js';
import { upcomingItems, r2 } from './_calc.js';
import { SlimEmpty, slots, pctx, eur, Tile, dayLabel, relDay } from './_fin.js';
import { ex } from './_example.js';

const ACC = { 'acc-giro': 'Girokonto', 'acc-business': 'Geschäftskonto', 'acc-kreditkarte': 'Kreditkarte', 'acc-tagesgeld': 'Tagesgeld' };

export const finUpcoming = {
  id: 'fin-upcoming',
  name: 'Anstehende Zahlungen',
  category: 'Finanzen',
  description: 'Abos, Fixkosten, Sparpläne, Kreditkartenabrechnung und Steuertermine der nächsten Tage – nach Tag gruppiert mit Tagessumme. Tippen öffnet die Abos bzw. den Sparplan.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Anstehend' },
    { name: 'days', label: 'Zeitraum (Tage)', type: 'number', default: 14 },
    { name: 'limit', label: 'Max. Zeilen (0 = alle)', type: 'number', default: 0 },
    { name: 'density', label: 'Dichte', type: 'select', options: ['comfortable', 'compact'], default: 'comfortable' },
    { name: 'grouped', label: 'Nach Tag gruppieren', type: 'boolean', default: true },
    { name: 'includeBusiness', label: 'Betriebliche Zahlungen zeigen', type: 'boolean', default: true },
  ],
  data: slots('subs', 'plans', 'events', 'transactions', 'prefs'),
  events: ['upcoming.open', 'upcoming.plan'],
  states: ['empty'],
  css: `
  .tk-fnu__grp { display:flex; justify-content:space-between; gap:8px; align-items:baseline; padding:10px var(--tk-space-4) 4px; background:var(--tk-c-surface2); border-bottom:1px solid var(--tk-c-border); font-size:var(--tk-fs-xs); font-weight:var(--tk-fw-semibold); letter-spacing:var(--tk-ls-wide); text-transform:uppercase; color:var(--tk-c-text-subtle); font-variant-numeric:tabular-nums; }
  .tk-fnu__row { padding:8px var(--tk-space-4); min-height:52px; border-bottom:1px solid var(--tk-c-border); } .tk-fnu__row:last-child { border-bottom:0; }
  .tk-fnu--compact .tk-fnu__row { min-height:40px; padding:4px var(--tk-space-4); } .tk-fnu--compact .tk-fn-ico { width:28px !important; height:28px !important; }
  .tk-fnu__amt { font-weight:var(--tk-fw-semibold); }
  [data-tk-large-text] .tk-fnu__days { display:none; }
  [data-tk-large-text] .tk-fn-title { white-space:normal; overflow:visible; text-overflow:clip; overflow-wrap:break-word; }
  [data-tk-large-text] .tk-fnu__row { flex-wrap:wrap; } [data-tk-large-text] .tk-fnu__row > .tk-fn-grow { flex:1 1 calc(100% - 3.5em); } [data-tk-large-text] .tk-fnu__grp { flex-wrap:wrap; }`,
  example: { props: { days: 14 }, data: ex('subscriptions', 'plans', 'events', 'transactions', 'prefs') },
  render: function FinUpcoming({ props, data, ctx }) {
    const c = pctx(ctx, data);
    let items = upcomingItems({ subs: data.subscriptions, plans: data.plans, events: data.events, txs: data.transactions, today: ctx.today, days: props.days });
    if (!props.includeBusiness) items = items.filter((i) => !i.business);
    const total = items.length;
    if (!total) return SlimEmpty({ props, icon: "calendar-check", title: "Nichts Anstehendes", text: `In den nächsten ${props.days} Tagen sind keine Abbuchungen geplant.` });
    // Summen immer über alle Posten des Zeitraums; das Limit kürzt nur die Zeilen.
    const sum = r2(-items.reduce((s, i) => s + i.amount, 0));
    const groups = []; for (const i of items) { const k = i.date.toDateString(); const g = groups.find((x) => x.k === k) || (groups.push({ k, date: i.date, list: [] }), groups[groups.length - 1]); g.list.push(i); }
    const cap = props.limit > 0 ? props.limit : Infinity; let used = 0;
    const visible = []; for (const g of groups) { if (used >= cap) break; const rows = g.list.slice(0, cap - used); used += rows.length; visible.push({ ...g, rows }); }
    items = items.slice(0, Math.min(used, total));
    const open = (i) => (i.kind === 'sparplan' ? ctx.emit('upcoming.plan', { id: i.ref }) : ctx.emit('upcoming.open', { id: i.ref, kind: i.kind }));
    const row = (i) => html`<button type="button" class="tk-fn-tap tk-fnu__row" onClick=${() => open(i)} aria-label=${`${i.title}, ${dayLabel(c, i.date)}, ${eur(c, i.amount)}`}>
      <${Tile} icon=${i.icon} tone=${i.tone} size=${props.density === 'compact' ? 28 : 36} />
      <div class="tk-fn-grow"><div class="tk-fn-title">${i.title}</div><div class="tk-fn-sub tk-fn-title">${props.grouped ? '' : `${dayLabel(c, i.date)} · `}${ACC[i.account] || 'Konto'}${i.shifted ? ' · Bankarbeitstag' : ''}${i.planned ? ' · Kündigung vorgemerkt' : ''}${i.note ? ` · ${i.note}` : ''}</div></div>
      ${i.kind === 'sparplan' && html`<${Badge} tone="accent">Sparen<//>`}<span class="tk-fn-num tk-fnu__amt">${eur(c, i.amount)}</span></button>`;
    const head = (g) => html`<div class="tk-fnu__grp"><span>${dayLabel(c, g.date)} · ${relDay(c, g.date)}</span><span>${g.list.length > 1 ? `${g.list.length} Posten · ` : ''}${eur(c, g.list.reduce((s, i) => s + i.amount, 0))}</span></div>`;
    return html`<${Card} flush title=${props.title} icon="calendar-clock" actions=${html`<${Badge}>${eur(c, -sum)}<span class="tk-fnu__days"> · ${props.days} Tage</span><//>`} class=${`tk-fnu--${props.density}`}>
      ${props.grouped ? visible.map((g) => html`<div>${head(g)}${g.rows.map(row)}</div>`) : items.map(row)}
      ${total > items.length && html`<div class="tk-fn-sub" style="padding:8px var(--tk-space-4)">+ ${total - items.length} weitere Posten im Zeitraum</div>`}<//>`;
  },
};
export default [finUpcoming];
