// Trading – gemeinsame UI-Bausteine, Datenslots und Basis-CSS (Präfix tk-trd-).
import { html } from '../../../lib/html.js';
import { Icon, toneColor } from '../../ui.js';
import { money, percent } from '../../helpers.js';
import { fmtNumber, fmtPercent } from '../../../lib/format.js';
import { arr } from './_calc.js';

export { arr, obj } from './_calc.js';

/** Datenslots, die viele Komponenten teilen. Welt-Slots sind per '@world:' gebunden, lokale Slots liegen im Feature. */
export const SLOT = {
  positions: { slot: 'positions', label: 'Positionen', default: 'positions', shape: '{id,name,short,type,quantity,buyPrice,price,prevClose,spark?}[]' },
  cash: { slot: 'cash', label: 'Verrechnungskonto', default: 'cash', shape: 'Zahl (Euro)' },
  history: { slot: 'history', label: 'Depotverlauf', default: 'history', shape: '{labels:string[], series:[{name,values:number[]}]}' },
  watchlist: { slot: 'watchlist', label: 'Watchlist', default: 'watchlist', shape: '{id,title,type,price,change,trend}[]' },
  dividends: { slot: 'dividends', label: 'Dividenden', default: 'dividends', shape: '{id,positionId,title,payDate,perShare,quantity,amount,status}[]' },
  plans: { slot: 'plans', label: 'Sparpläne', default: 'plans', shape: '{id,name,positionId,monthly,day,active}[]' },
  transactions: { slot: 'transactions', label: 'Buchungen', default: 'transactions', shape: '{id,date,title,amount,type,to?}[]' },
  accounts: { slot: 'accounts', label: 'Konten', default: 'accounts', shape: '{id,name,type,balance}[]' },
  allowance: { slot: 'allowance', label: 'Freistellungsauftrag', default: 'allowance', shape: '{total,used}' },
  instruments: { slot: 'instruments', label: 'Wertpapiere mit Kursverlauf', default: 'instruments', shape: '{id,symbol,name,type,price,prevClose,ranges}[]' },
  alerts: { slot: 'alerts', label: 'Kursalarme', default: 'alerts', shape: '{id,securityId,dir,price,status}[]' },
  orders: { slot: 'orders', label: 'Simulierte Orders', default: 'orders', shape: '{id,securityId,side,type,qty,status,created}[]' },
  trades: { slot: 'trades', label: 'Gebuchte Käufe und Verkäufe', default: 'trades', shape: '{id,date,side,securityId,qty,price,fee}[]' },
  targets: { slot: 'targets', label: 'Soll-Anteile', default: 'targets', shape: '{[positionId|cash]: Prozent}' },
  benchmark: { slot: 'benchmark', label: 'Vergleichsindex', default: 'benchmark', shape: '{name,labels,values}' },
};
export const slots = (...names) => names.map((n) => ({ ...SLOT[n], required: false }));

export const TYPE_ICON = { ETF: 'pie-chart', Aktie: 'briefcase', Krypto: 'coins', Anleihe: 'landmark', Rohstoff: 'gauge', Cash: 'wallet' };
export const TYPE_TONE = { ETF: 1, Aktie: 3, Krypto: 5, Anleihe: 2, Rohstoff: 4, Cash: 'neutral' };
export const upDown = (v) => (v > 0 ? 'up' : v < 0 ? 'down' : 'flat');
export const TONE_COLOR = { up: 'var(--tk-c-success)', down: 'var(--tk-c-danger)', flat: 'var(--tk-c-text-muted)' };

/** Kurs als Zahl mit abgesetzter Einheit (Marktdaten, nicht maskiert; Einheit als eigenes Element). */
export const Px = ({ v, unit = '€', dec }) => html`<span class="tk-trd-num">${fmtNumber(v, { digits: dec ?? (v >= 5000 ? 0 : 2) })}<span class="tk-trd-u">${unit}</span></span>`;
/** Veränderung in Prozent mit Pfeil und Vorzeichen (Farbe nie allein). */
export const Chg = ({ v, digits = 1, mask }) => { const k = upDown(Math.round(v * 10 ** (digits + 2)) / 10 ** (digits + 2)); return html`<span class=${`tk-trd-num tk-trd-${k}`}><span aria-hidden="true">${k === 'up' ? '▲' : k === 'down' ? '▼' : '•'}</span> ${mask ? '•• %' : fmtPercent(v, { digits, sign: true })}</span>`; };
/** Gewinn/Verlust privat (Betrag und Prozent maskierbar). */
export const Gain = ({ ctx, v, pct, digits = 2 }) => { const k = upDown(Math.round(v * 100) / 100); return html`<span class=${`tk-trd-num tk-trd-${k}`}><span aria-hidden="true">${k === 'up' ? '▲' : k === 'down' ? '▼' : '•'}</span> ${money(ctx, v, { sign: true, digits })}${pct != null && html` <span class="tk-trd-sub">(${percent(ctx, pct)})</span>`}</span>`; };
export const Tile = ({ type, icon, tone, size = 36 }) => { const t = tone ?? TYPE_TONE[type] ?? 1; return html`<span class="tk-trd-ico" style=${`width:${size}px;height:${size}px;background:color-mix(in srgb, ${toneColor(t)} 16%, transparent);color:${toneColor(t)}`}><${Icon} name=${icon || TYPE_ICON[type] || 'circle'} size=${Math.round(size * 0.5)} /></span>`; };
export const Stat = ({ label, children, sub }) => html`<div class="tk-trd-stat"><span class="tk-trd-cap">${label}</span><strong class="tk-trd-num">${children}</strong>${sub && html`<span class="tk-trd-sub">${sub}</span>`}</div>`;

/** Wertpapier einer Auswahl: Id aus ctx.ui.selectedId, sonst erste Position, sonst erstes Papier. */
export function pickSecurity(data, ctx, followSelection = true) {
  const list = arr(data.instruments), id = followSelection ? ctx.ui?.selectedId : null;
  return list.find((i) => i.id === id) || list.find((i) => arr(data.positions).some((p) => p.id === i.id)) || list[0] || null;
}
/** Wertpapier-Karte aus Position, Watchlist-Eintrag oder Katalog-Papier (Namen, Typ, Kurs, Tagesveränderung). */
export const secOf = (data, id) => {
  const i = arr(data.instruments).find((x) => x.id === id); if (i) return i;
  const p = arr(data.positions).find((x) => x.id === id), w = arr(data.watchlist).find((x) => x.id === id);
  const s = p || w; return s ? { id: s.id, name: s.name || s.title, short: s.short || s.title, type: s.type, price: s.price, prevClose: p ? p.prevClose : s.price / (1 + (s.change || 0)), symbol: '' } : null;
};

export const TRD_CSS = `
  .tk-layout--grid .tk-block[data-component^="trd-"] > .tk-card { height:100%; }
  [data-component^="trd-"] .tk-btn { white-space:normal; height:auto; min-height:var(--tk-size-control); text-align:left; max-width:100%; }
  [data-component^="trd-"] .tk-btn--icon { height:var(--tk-size-control); }
  .tk-trd-ico { border-radius:11px; display:grid; place-items:center; flex:none; }
  .tk-trd-row { display:flex; align-items:center; gap:12px; min-width:0; }
  .tk-trd-grow { flex:1 1 auto; min-width:0; }
  .tk-trd-num { font-variant-numeric:tabular-nums; white-space:nowrap; }
  .tk-trd-u { font-size:.82em; margin-left:.2em; color:var(--tk-c-text-muted); font-weight:var(--tk-fw-medium); }
  .tk-trd-big { font-size:var(--tk-fs-3xl); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); line-height:1.05; font-variant-numeric:tabular-nums; white-space:nowrap; }
  .tk-trd-big--xl { font-size:var(--tk-fs-4xl); }
  .bp-mobile .tk-trd-big--xl { font-size:var(--tk-fs-3xl); }
  .tk-trd-cap { font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); letter-spacing:var(--tk-ls-wide); text-transform:uppercase; font-weight:var(--tk-fw-semibold); }
  .tk-trd-meta { color:var(--tk-c-text-muted); font-size:var(--tk-fs-sm); }
  .tk-trd-sub { color:var(--tk-c-text-subtle); font-size:var(--tk-fs-xs); font-weight:var(--tk-fw-regular, 400); }
  .tk-trd-title { font-weight:var(--tk-fw-medium); min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .tk-trd-up { color:var(--tk-c-success); } .tk-trd-down { color:var(--tk-c-danger); } .tk-trd-flat { color:var(--tk-c-text-muted); }
  .tk-trd-up, .tk-trd-down, .tk-trd-flat { font-weight:var(--tk-fw-semibold); }
  .tk-trd-stat { display:flex; flex-direction:column; gap:2px; min-width:0; } .tk-trd-stat strong { font-size:var(--tk-fs-lg); }
  .tk-trd-stats { display:grid; grid-template-columns:repeat(auto-fit, minmax(calc(110px * var(--tk-text-scale, 1)), 1fr)); gap:var(--tk-space-4); }
  .tk-trd-tap { width:100%; border:0; background:transparent; color:inherit; font:inherit; text-align:left; cursor:pointer; padding:0; display:flex; align-items:center; gap:12px; min-width:0; border-radius:var(--tk-radius-md); }
  .tk-trd-tap:hover { background:var(--tk-c-surface2); }
  .tk-trd-tap:focus-visible, .tk-trd-btn:focus-visible { outline:2px solid var(--tk-c-focus); outline-offset:2px; }
  .bp-mobile .tk-trd-tap { min-height:var(--tk-size-touch); }
  .tk-trd-pill { display:inline-flex; align-items:center; gap:4px; padding:2px 8px; border-radius:var(--tk-radius-pill); font-size:var(--tk-fs-xs); font-weight:var(--tk-fw-semibold); background:var(--tk-c-surface3); color:var(--tk-c-text-muted); max-width:100%; }
  .tk-trd-pill--warning { background:var(--tk-c-warning-soft); color:var(--tk-c-text); } .tk-trd-pill--success { background:var(--tk-c-success-soft); color:var(--tk-c-text); }
  .tk-trd-pill--info { background:var(--tk-c-info-soft); color:var(--tk-c-text); } .tk-trd-pill--danger { background:var(--tk-c-danger-soft); color:var(--tk-c-text); }
  .tk-trd-bar { height:8px; border-radius:4px; background:var(--tk-c-surface3); overflow:hidden; display:flex; position:relative; }
  .tk-trd-bar > i { display:block; height:100%; }
  .tk-trd-list > * + * { border-top:1px solid var(--tk-c-border); }
  .tk-trd-item { display:flex; align-items:center; gap:12px; padding:10px 4px; min-width:0; }
  .tk-trd-cta { display:flex; gap:var(--tk-space-2); flex-wrap:wrap; }
  .tk-trd-note { display:flex; gap:8px; align-items:flex-start; padding:10px 12px; border-radius:var(--tk-radius-md); background:var(--tk-c-surface2); color:var(--tk-c-text-muted); font-size:var(--tk-fs-sm); }
  .tk-trd-note--warning { background:var(--tk-c-warning-soft); color:var(--tk-c-text); } .tk-trd-note--info { background:var(--tk-c-info-soft); color:var(--tk-c-text); }
  .tk-trd-note--danger { background:var(--tk-c-danger-soft); color:var(--tk-c-text); } .tk-trd-note svg { flex:none; margin-top:2px; }
`;
export const Note = ({ tone = '', icon = 'info', children }) => html`<div class=${`tk-trd-note${tone ? ` tk-trd-note--${tone}` : ''}`} role=${tone === 'danger' ? 'alert' : 'note'}><${Icon} name=${icon} size=${15} /><div class="tk-trd-grow">${children}</div></div>`;
/** Öffnen eines Wertpapiers: Auswahl setzen, Event melden (Navigation im App-Modus über detail.to). */
export const openSecurity = (ctx, id, event = 'security.open', to = 'trading.detail', extra = {}) => { ctx.setUi('selectedId', id); return ctx.emit(event, { id, to, ...extra }); };
