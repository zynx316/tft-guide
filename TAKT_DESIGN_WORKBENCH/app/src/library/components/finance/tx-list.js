// Finanzen: Buchungen – Suche, Filter, Gruppierung nach Tag oder Kategorie; Umbuchungen neutral.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Icon, EmptyState, Search, Badge } from '../../ui.js';
import { arr, obj, isInternal, catMeta, r2 } from './_calc.js';
import { FIN_CSS, slots, pctx, eur, Tile, txAmount, txColor, dayLabel } from './_fin.js';
import { dayDiff, toDate } from '../../../lib/date.js';
import { isoDay } from '../../../lib/util.js';
import { fmtTime } from '../../../lib/format.js';
import { ex } from './_example.js';

const TYPE_CHIPS = ['Alle', 'Ausgaben', 'Einnahmen', 'Umbuchungen', 'Ohne Beleg'];
const hasReceipt = (t, meta) => !!(t.receipt || obj(meta)[t.id]?.receipt);

export function filterTx(txs, ui, meta) {
  let out = arr(txs);
  const q = String(ui.query || '').trim().toLowerCase();
  if (q) out = out.filter((t) => `${t.title} ${t.category}`.toLowerCase().includes(q) || String(Math.abs(t.amount)).replace('.', ',').includes(q));
  if (ui.account) out = out.filter((t) => t.account === ui.account || t.to === ui.account);
  const f = ui.filter;
  if (f && !/^alle?$/i.test(f)) {
    if (f === 'Ausgaben') out = out.filter((t) => t.type === 'expense');
    else if (f === 'Einnahmen') out = out.filter((t) => t.type === 'income');
    else if (f === 'Umbuchungen') out = out.filter((t) => t.type === 'transfer');
    else if (f === 'Ohne Beleg') out = out.filter((t) => t.type === 'expense' && !hasReceipt(t, meta));
    else out = out.filter((t) => t.category === f || arr(t.split).some((s) => s.category === f));
  }
  return [...out].sort((a, b) => toDate(b.date) - toDate(a.date));
}

export const finTxList = {
  id: 'fin-tx-list',
  name: 'Buchungsliste',
  category: 'Finanzen',
  description: 'Alle Buchungen mit Suche und Filtern (Art, Kategorie, Konto), gruppiert nach Tag oder Kategorie mit Summe. Umbuchungen sind neutral markiert und zählen nicht in die Summen. Tippen öffnet das Buchungs-Detail.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Buchungen' },
    { name: 'groupBy', label: 'Gruppieren nach', type: 'select', options: ['day', 'category', 'none'], default: 'day' },
    { name: 'density', label: 'Dichte', type: 'select', options: ['comfortable', 'compact'], default: 'comfortable' },
    { name: 'limit', label: 'Anzahl (0 = alle)', type: 'number', default: 0 },
    { name: 'showFilters', label: 'Suche und Filter in der Karte', type: 'boolean', default: false },
    { name: 'followAccount', label: 'Gewähltes Konto beachten', type: 'boolean', default: true },
    { name: 'respectFilter', label: 'Geteilte Suche/Filter beachten', type: 'boolean', default: true },
    { name: 'showDaySum', label: 'Gruppensumme', type: 'boolean', default: true },
    { name: 'showMore', label: '„Mehr anzeigen“', type: 'boolean', default: true },
  ],
  data: [...slots('transactions', 'accounts', 'cats', 'prefs'), { slot: 'txMeta', label: 'Zusatzangaben', default: 'txMeta', shape: '{[txId]:{note?,receipt?}}', required: false }],
  events: ['tx.open', 'tx.add', 'filter.change'],
  states: ['empty'],
  css: `
  .tk-fnt__bar { display:flex; flex-direction:column; gap:var(--tk-space-2); padding:0 var(--tk-space-4) var(--tk-space-3); }
  .tk-fnt__chips { display:flex; gap:6px; overflow-x:auto; scrollbar-width:none; padding-bottom:2px; } .tk-fnt__chips > * { flex:none; }
  .tk-fnt__sum { padding:0 var(--tk-space-4) var(--tk-space-2); display:flex; flex-wrap:wrap; gap:4px 16px; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); font-variant-numeric:tabular-nums; }
  .tk-fnt__grp { display:flex; justify-content:space-between; gap:8px; padding:8px var(--tk-space-4) 4px; background:var(--tk-c-surface2); border-bottom:1px solid var(--tk-c-border); border-top:1px solid var(--tk-c-border); font-size:var(--tk-fs-xs); font-weight:var(--tk-fw-semibold); letter-spacing:var(--tk-ls-wide); text-transform:uppercase; color:var(--tk-c-text-subtle); font-variant-numeric:tabular-nums; }
  .tk-fnt__row { padding:8px var(--tk-space-4); min-height:56px; border-radius:0; border-bottom:1px solid var(--tk-c-border); } .tk-fnt__row:last-child { border-bottom:0; }
  .tk-fnt--compact .tk-fnt__row { min-height:44px; padding-block:4px; } .tk-fnt--compact .tk-fn-ico { width:28px !important; height:28px !important; }
  .tk-fnt__amt { font-weight:var(--tk-fw-semibold); }`,
  example: { data: ex('transactions', 'accounts', 'categories', 'prefs', 'txMeta') },
  render: function FinTxList({ props, data, ctx }) {
    const c = pctx(ctx, data), [more, setMore] = useState(0);
    const ui = props.respectFilter ? ctx.ui : {}, own = ctx.ui;
    const all = arr(data.transactions), meta = data.txMeta, accs = arr(data.accounts);
    const accName = (id) => (accs.find((a) => a.id === id)?.name || '').split(' (')[0];
    let items = filterTx(all, { query: ui.query, filter: ui.filter, account: props.followAccount ? ctx.ui.account : null }, meta);
    const filtered = items.length !== all.length;
    const lim = props.limit > 0 ? props.limit + more : 0, shown = lim ? items.slice(0, lim) : items;
    const accFilter = props.followAccount && ctx.ui.account && accs.find((a) => a.id === ctx.ui.account);
    const used = [...new Set(all.map((t) => t.category))].slice(0, 5), cur = ui.filter && !/^alle?$/i.test(ui.filter) ? ui.filter : null;
    const chips = [...TYPE_CHIPS, ...used.filter((u) => !TYPE_CHIPS.includes(u))];
    if (cur && !chips.includes(cur)) chips.push(cur);
    const filterBar = props.showFilters && html`<div class="tk-fnt__bar"><${Search} value=${ctx.ui.query || ''} onInput=${(v) => { ctx.setUi('query', v); ctx.emit('filter.change', { query: v }); }} placeholder="Buchung suchen (Titel, Kategorie, Betrag)" />
      <div class="tk-fnt__chips" data-scroll-x role="group" aria-label="Filter">${chips.map((x) => html`<button type="button" class="tk-chip" aria-pressed=${String((cur || 'Alle') === x)} onClick=${() => { ctx.setUi('filter', x); ctx.emit('filter.change', { filter: x }); }}>${x}</button>`)}</div>
      ${accFilter && html`<div><${Badge} tone="accent" icon="filter">${accFilter.name}<//> <${Button} size="sm" variant="ghost" icon="x" onClick=${() => ctx.setUi('account', null)} aria-label="Kontofilter aufheben">Alle Konten<//></div>`}</div>`;
    if (!all.length) return html`<${Card} title=${props.title} icon="receipt"><${EmptyState} icon="receipt" title="Noch keine Buchungen" text="Erfasse Ausgaben und Einnahmen, dann siehst du, was bis Monatsende frei ist." action=${html`<${Button} variant="primary" icon="plus" onClick=${() => ctx.emit('tx.add')}>Buchung erfassen<//>`} /><//>`;
    if (!items.length) return html`<${Card} flush title=${props.title} icon="receipt">${filterBar}<div style="padding:0 var(--tk-space-4) var(--tk-space-4)"><${EmptyState} icon="search" title="Keine Treffer" text="Für diese Auswahl gibt es keine Buchungen." action=${html`<${Button} size="sm" onClick=${() => { ctx.setUi('query', ''); ctx.setUi('filter', 'Alle'); ctx.setUi('account', null); }}>Filter zurücksetzen<//>`} /></div><//>`;
    const real = items.filter((t) => !isInternal(t));
    const inc = r2(real.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0)), exp = r2(real.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0));
    const key = (t) => (props.groupBy === 'category' ? t.category : isoDay(t.date));
    const groups = []; if (props.groupBy === 'none') groups.push({ k: 'all', list: shown }); else for (const t of shown) { const g = groups.find((x) => x.k === key(t)) || (groups.push({ k: key(t), list: [] }), groups[groups.length - 1]); g.list.push(t); }
    const label = (g) => { if (props.groupBy === 'category') return catMeta(data.categories, g.k).label; const n = dayDiff(ctx.today, g.list[0].date); return `${n === 0 ? 'Heute · ' : n === -1 ? 'Gestern · ' : ''}${dayLabel(c, g.list[0].date)}`; };
    const row = (t) => { const m = catMeta(data.categories, t.category), tr = t.type === 'transfer', rec = hasReceipt(t, meta), note = t.note || obj(meta)[t.id]?.note;
      return html`<button type="button" class="tk-fn-tap tk-fnt__row" onClick=${() => ctx.emit('tx.open', { id: t.id })} aria-label=${`${t.title}, ${txAmount(c, t)}`}>
        <${Tile} icon=${tr ? 'arrow-left-right' : t.icon || m.icon} tone=${tr ? 'neutral' : m.tone} size=${props.density === 'compact' ? 28 : 36} />
        <span class="tk-fn-grow"><span class="tk-fn-title" style="display:block">${t.title}</span><span class="tk-fn-sub tk-fn-title" style="display:block">${tr ? `Umbuchung · ${accName(t.account)} → ${accName(t.to)}` : `${arr(t.split).length ? 'Aufgeteilt' : m.label} · ${accName(t.account)}`}${props.groupBy === 'category' ? ` · ${dayLabel(c, t.date)}` : ` · ${fmtTime(t.date)}`}</span></span>
        ${(rec || note) && html`<span class="tk-fn-sub" title=${rec ? 'Beleg angehängt' : 'Notiz vorhanden'}><${Icon} name=${rec ? 'paperclip' : 'sticky-note'} size=${14} /></span>`}<span class="tk-fn-num tk-fnt__amt" style=${`color:${txColor(t)}`}>${txAmount(c, t)}</span></button>`; };
    return html`<${Card} flush title=${props.title} icon="receipt" actions=${html`<${Badge}>${items.length}<//>`} class=${`tk-fnt--${props.density}`}>${filterBar}
      ${filtered && html`<div class="tk-fnt__sum"><span>Ausgaben ${eur(c, exp)}</span><span>Einnahmen ${eur(c, inc, { sign: true })}</span></div>`}
      ${groups.map((g) => html`<div>${props.groupBy !== 'none' && html`<div class="tk-fnt__grp"><span>${label(g)}</span>${props.showDaySum && html`<span>${eur(c, g.list.filter((t) => !isInternal(t)).reduce((s, t) => s + t.amount, 0), { sign: true })}</span>`}</div>`}${g.list.map(row)}</div>`)}
      ${props.showMore && lim && items.length > shown.length ? html`<div style="padding:var(--tk-space-3) var(--tk-space-4)"><${Button} size="sm" onClick=${() => setMore(more + (props.limit || 10))}>Mehr anzeigen (${items.length - shown.length})<//></div>` : null}<//>`;
  },
};
export default [finTxList];
