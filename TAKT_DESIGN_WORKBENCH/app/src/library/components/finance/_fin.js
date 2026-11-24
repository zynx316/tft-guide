// Finanzen – gemeinsame UI-Bausteine, Datenslots und Basis-CSS (Präfix tk-fn-).
import { html } from '../../../lib/html.js';
import { Icon, Card, toneColor } from '../../ui.js';
import { money } from '../../helpers.js';
import { fmtDate, fmtRelativeDay } from '../../../lib/format.js';
import { arr, r2, isoLocal } from './_calc.js';

export { arr, obj } from './_calc.js';

/** Datenslots, die viele Komponenten teilen (alle per '@world:' gebunden, Slot-Name = demoData-Schlüssel). */
export const SLOT = {
  accounts: { slot: 'accounts', label: 'Konten', default: 'accounts', shape: '{id,name,bank?,type,balance,icon?,tone?,spark?}[]' },
  transactions: { slot: 'transactions', label: 'Buchungen', default: 'transactions', shape: '{id,date,title,category,amount,account,type,to?,icon?}[]' },
  budgets: { slot: 'budgets', label: 'Budgets', default: 'budgets', shape: '{id,label,category,target,value,icon}[]' },
  subs: { slot: 'subscriptions', label: 'Abos und Fixkosten', default: 'subscriptions', shape: '{id,name,amount,interval,day,category,icon,cancelable}[]' },
  plans: { slot: 'plans', label: 'Sparpläne', default: 'plans', shape: '{id,name,monthly,day,active}[]' },
  cats: { slot: 'categories', label: 'Kategorien', default: 'categories', shape: '{id,label,icon,tone,kind}[]' },
  rules: { slot: 'rules', label: 'Regeln', default: 'rules', shape: '{id,match,category,active}[]' },
  events: { slot: 'events', label: 'Termine mit Geldwirkung', default: 'events', shape: '{id,kind,title,date,amount,from}[]' },
  prefs: { slot: 'prefs', label: 'Einstellungen Finanzen', default: 'prefs', shape: '{hideAmounts?,reserve?,…}' },
  subMeta: { slot: 'subMeta', label: 'Vertragsangaben', default: 'subMeta', shape: '{[subId]:{cancelBy?,term?,note?}}' },
  months: { slot: 'months', label: 'Vormonate', default: 'months', shape: '{key,label,income,expenses,saved,byCat}[]' },
};
export const slots = (...names) => names.map((n) => ({ ...SLOT[n], required: false }));

/** Kontext mit Privatmodus: global (ctx.privacy) oder per Finanz-Einstellung „Beträge ausblenden“. */
export const pctx = (ctx, data) => (data?.prefs?.hideAmounts && !ctx.privacy ? { ...ctx, privacy: true } : ctx);
export const eur = (ctx, v, o) => money(ctx, v, o);
export const eur0 = (ctx, v, o) => money(ctx, v, { digits: 0, ...o });
/** Buchungsbetrag: Ausgabe mit Minus, Einnahme mit Plus, Umbuchung neutral ohne Vorzeichen. */
export const txAmount = (ctx, t) => (t.type === 'transfer' ? money(ctx, Math.abs(t.amount)) : money(ctx, t.amount, { sign: true }));
export const txColor = (t) => (t.type === 'transfer' ? 'var(--tk-c-text-muted)' : t.amount > 0 ? 'var(--tk-c-success)' : 'var(--tk-c-text)');

export const Tile = ({ icon, tone = 'accent', size = 36 }) => html`<span class="tk-fn-ico" style=${`width:${size}px;height:${size}px;background:color-mix(in srgb, ${toneColor(tone)} 16%, transparent);color:${toneColor(tone)}`}><${Icon} name=${icon} size=${Math.round(size * 0.5)} /></span>`;

/** Schlanker Leerzustand für Karten in Übersichten (Erststart: keine sechs hohen Leerkarten untereinander). */
export const SlimEmpty = ({ props, icon, title, text, action }) => html`<${Card} title=${props.title} icon=${icon}><div class="tk-fn-row tk-fn-slim"><div class="tk-fn-grow"><div class="tk-fn-title" style="white-space:normal">${title}</div><div class="tk-fn-sub">${text}</div></div>${action || null}</div><//>`;

/** Datum als „Di, 01.12.“, relativ („in 7 Tagen“) und kurz – bezogen auf ctx.today. */
export const dayLabel = (ctx, d) => fmtDate(d, { style: 'weekday' });
export const relDay = (ctx, d) => fmtRelativeDay(d, ctx.today);
export const shortDate = (ctx, d) => fmtDate(d, { style: 'short' });

/** Neue Buchung in den Weltzustand schreiben und Salden anpassen (Umbuchung: beide Konten). */
let seq = 0;
export function newTxId(ctx, list) { seq += 1; return ctx.newId ? ctx.newId('t') : `t-neu-${arr(list).length + 1}-${seq}`; }
export const nowOf = (ctx) => (ctx.now ? ctx.now() : ctx.today);
export function bookTx(setData, tx) {
  setData('transactions', (l) => [tx, ...arr(l)]);
  setData('accounts', (l) => arr(l).map((a) => (a.id === tx.account ? { ...a, balance: r2(a.balance + tx.amount) } : a.id === tx.to ? { ...a, balance: r2(a.balance - tx.amount) } : a)));
}
export function unbookTx(setData, tx) {
  setData('transactions', (l) => arr(l).filter((t) => t.id !== tx.id));
  setData('accounts', (l) => arr(l).map((a) => (a.id === tx.account ? { ...a, balance: r2(a.balance - tx.amount) } : a.id === tx.to ? { ...a, balance: r2(a.balance + tx.amount) } : a)));
}
export const buildTx = (ctx, list, f) => ({
  id: newTxId(ctx, list), date: isoLocal(nowOf(ctx)), title: f.title || (f.type === 'transfer' ? 'Umbuchung' : f.category), category: f.category, account: f.account, type: f.type,
  amount: f.type === 'income' ? Math.abs(f.amount) : -Math.abs(f.amount), ...(f.type === 'transfer' ? { to: f.to } : {}), icon: f.icon || (f.type === 'transfer' ? 'arrow-left-right' : 'receipt'),
});

// Basis-CSS (einmal geladen über fin-safe-to-spend). Karten im Raster füllen die Zeilenhöhe.
export const FIN_CSS = `
  .tk-layout--grid .tk-block[data-component^="fin-"] > .tk-card { height:100%; }
  [data-component^="fin-"] .tk-btn { white-space:normal; height:auto; min-height:var(--tk-size-control); text-align:left; max-width:100%; }
  .tk-fn-slim { padding:2px 0 4px; flex-wrap:wrap; }
  .tk-fn-ico { border-radius:11px; display:grid; place-items:center; flex:none; }
  .tk-fn-row { display:flex; align-items:center; gap:12px; min-width:0; }
  .tk-fn-grow { flex:1 1 auto; min-width:0; }
  .tk-fn-num { font-variant-numeric:tabular-nums; white-space:nowrap; }
  .tk-fn-big { font-size:var(--tk-fs-3xl); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); line-height:1.05; font-variant-numeric:tabular-nums; white-space:nowrap; }
  .tk-fn-big--xl { font-size:var(--tk-fs-4xl); }
  .bp-mobile .tk-fn-big--xl { font-size:var(--tk-fs-3xl); }
  .tk-fn-cap { font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); letter-spacing:var(--tk-ls-wide); text-transform:uppercase; font-weight:var(--tk-fw-semibold); }
  .tk-fn-meta { color:var(--tk-c-text-muted); font-size:var(--tk-fs-sm); }
  .tk-fn-sub { color:var(--tk-c-text-subtle); font-size:var(--tk-fs-xs); }
  .tk-fn-title { font-weight:var(--tk-fw-medium); min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .tk-fn-bar { height:8px; border-radius:4px; background:var(--tk-c-surface3); overflow:hidden; display:flex; position:relative; }
  .tk-fn-bar > i { display:block; height:100%; }
  .tk-fn-tap { width:100%; border:0; background:transparent; color:inherit; font:inherit; text-align:left; cursor:pointer; padding:0; display:flex; align-items:center; gap:12px; min-width:0; border-radius:var(--tk-radius-md); }
  .tk-fn-tap:hover { background:var(--tk-c-surface2); }
  .tk-fn-tap:focus-visible, .tk-fn-btn:focus-visible { outline:2px solid var(--tk-c-focus); outline-offset:2px; }
  .bp-mobile .tk-fn-tap { min-height:var(--tk-size-touch); }
  .tk-fn-pill { display:inline-flex; align-items:center; gap:4px; padding:2px 8px; border-radius:var(--tk-radius-pill); font-size:var(--tk-fs-xs); font-weight:var(--tk-fw-semibold); background:var(--tk-c-surface3); color:var(--tk-c-text-muted); max-width:100%; }
  .tk-fn-pill--warning { background:var(--tk-c-warning-soft); color:var(--tk-c-text); } .tk-fn-pill--success { background:var(--tk-c-success-soft); color:var(--tk-c-text); }
  .tk-fn-pill--info { background:var(--tk-c-info-soft); color:var(--tk-c-text); } .tk-fn-pill--accent { background:var(--tk-c-accent-soft); color:var(--tk-c-text); }
  .tk-fn-list > * + * { border-top:1px solid var(--tk-c-border); }
  .tk-fn-stack { display:flex; flex-direction:column; gap:var(--tk-space-3); min-width:0; }
  .tk-fn-actions { display:flex; gap:8px; flex-wrap:wrap; }
  .tk-fn-undo { display:flex; align-items:center; gap:8px; padding:6px 6px 6px 12px; border-radius:var(--tk-radius-md); background:var(--tk-c-surface2); border:1px solid var(--tk-c-border); font-size:var(--tk-fs-sm); }
  .tk-fn-note { display:flex; gap:8px; align-items:flex-start; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); line-height:var(--tk-lh-snug); }
  .tk-fn-note svg { flex:none; margin-top:2px; }
  .tk-fn-card-btn { all:unset; box-sizing:border-box; cursor:pointer; display:block; width:100%; }
`;
