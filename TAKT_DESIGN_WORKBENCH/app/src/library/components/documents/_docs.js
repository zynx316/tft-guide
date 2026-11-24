// Dokumente & Verträge – gemeinsame Bausteine: Datumstexte, Icon-Kachel, Tage-Zähler, Fristen aus Slots und das Basis-CSS (Präfix tk-dok-).
// Das Basis-CSS steht nur in der Komponente `dok-deadlines` (die Registry fügt das CSS aller Komponenten zusammen).
import { html } from '../../../lib/html.js';
import { Icon, Badge, toneColor } from '../../ui.js';
import { fmtDate } from '../../../lib/format.js';
import { dayStart, dayDiff, toDate } from '../../../lib/date.js';
import { buildDeadlines, taxStats } from './_deadlines.js';

export const arr = (v) => (Array.isArray(v) ? v : []);
export const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
export const todayOf = (ctx) => dayStart(ctx.today);
export const TYPE_ICON = { Vertrag: 'scroll-text', Versicherung: 'shield-check', Rechnung: 'receipt-text', Beleg: 'receipt', Bescheid: 'landmark', Bescheinigung: 'landmark', Meldung: 'file-text', Schreiben: 'mail', Ausweis: 'contact-round' };
export const typeIcon = (type) => TYPE_ICON[type] || 'file-text';

/** „Mo, 30.11.“, in einem anderen Jahr „15.03.2027“. */
export const dateLabel = (iso, today) => (!iso ? '–' : today && toDate(iso).getFullYear() !== today.getFullYear() ? fmtDate(iso) : fmtDate(iso, { style: 'weekday' }));
/** „heute“, „morgen“, „in 6 Tagen“, ab 60 Tagen „in 12 Wochen“, ab 120 Tagen „in 14 Monaten“, vergangen „seit 3 Tagen“. */
export const inDays = (n) => (n < 0 ? `seit ${-n} ${-n === 1 ? 'Tag' : 'Tagen'}` : n === 0 ? 'heute' : n === 1 ? 'morgen' : n > 120 ? `in ${Math.round(n / 30.4)} Monaten` : n > 60 ? `in ${Math.round(n / 7)} Wochen` : `in ${n} Tagen`);
export const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
export const daysTo = (ctx, iso) => dayDiff(todayOf(ctx), iso);
export const folderOf = (folders, id) => arr(folders).find((f) => f.id === id);
/** Neueste zuerst (Zeitpunkt des Hinzufügens). */
export const recentFirst = (docs) => [...arr(docs)].sort((a, b) => String(b.added).localeCompare(String(a.added)));
/** Anfangsbuchstaben-tolerante Suche (ä = a) über Titel, Auszug, Tags, Typ. */
const fold = (s) => String(s ?? '').toLowerCase().replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 's');
export const matchDoc = (d, q, folders) => { const n = fold(q).trim(); return !n || [d.title, d.excerpt, d.type, folderOf(folders, d.folderId)?.name, ...arr(d.tags)].some((x) => fold(x).includes(n)); };

/** Anstehende Fristen aus den gebundenen Slots (contracts, warranties, documents, tax, receipts, transactions). */
export function deadlinesOf(data, ctx, horizon) {
  const src = { transactions: data.transactions, receipts: data.receipts, documents: data.documents, subscriptions: arr(data.contracts).map((c) => ({ id: c.subscriptionId, name: c.name, amount: c.amount })) };
  const tax = obj(data.tax);
  return buildDeadlines({ contracts: data.contracts, warranties: data.warranties, documents: data.documents, tax, taxOpen: taxStats(tax, src).open, today: todayOf(ctx), horizon });
}

/** Fortschritt durch die Vertragslaufzeit (0–1), nur mit bekanntem Anfang und Ende. */
export const termProgress = (c, today) => { if (!c.termStart || !c.endsOn) return null; const all = dayDiff(c.termStart, c.endsOn); return all > 0 ? Math.min(1, Math.max(0, dayDiff(c.termStart, today) / all)) : null; };

export const IconTile = ({ icon, tone = 'accent', size }) => html`<span class="tk-dok-ic" style=${`--tc:${toneColor(tone)}${size ? `;--ic:${size}px` : ''}`}><${Icon} name=${icon} size=${size ? Math.round(size / 2) : 18} /></span>`;
export const StageBadge = ({ stage }) => html`<${Badge} tone=${stage.tone}>${stage.label}<//>`;
/** Tage-Zähler: Zahl plus „Tage“, Farbe nach Stufe (auch ohne Farbe lesbar: Zahl und Stufenwort). */
export const DaysCount = ({ days, stage }) => html`<span class="tk-dok-days" style=${`--tc:${toneColor(stage.tone)}`} role="img" aria-label=${days === 0 ? 'heute' : `${days} ${days === 1 ? 'Tag' : 'Tage'}`}>
  <b>${days}</b><small>${days === 1 ? 'Tag' : 'Tage'}</small></span>`;

export const DOK_CSS = `
  .tk-dok-ic { width:var(--ic,36px); height:var(--ic,36px); border-radius:10px; display:grid; place-items:center; flex:none; background:color-mix(in srgb, var(--tc) 15%, transparent); color:var(--tc); }
  .tk-dok-sub { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); overflow-wrap:anywhere; } .tk-dok-fine { font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); overflow-wrap:anywhere; }
  .tk-dok-sec { display:flex; align-items:center; justify-content:space-between; gap:8px; flex-wrap:wrap; margin:0 0 var(--tk-space-2); } .tk-dok-sec h3 { margin:0; font-size:var(--tk-fs-lg); font-weight:var(--tk-fw-semibold); letter-spacing:var(--tk-ls-tight); }
  .tk-dok-col { display:flex; flex-direction:column; gap:var(--tk-space-3); min-width:0; } .tk-dok-wrap { display:flex; flex-wrap:wrap; gap:var(--tk-space-2); align-items:center; min-width:0; }
  .tk-dok-row { all:unset; box-sizing:border-box; display:flex; flex-wrap:wrap; align-items:center; gap:8px 12px; width:100%; min-height:56px; padding:10px var(--tk-space-4); border-bottom:1px solid var(--tk-c-border); cursor:pointer; min-width:0; }
  .tk-dok-row:last-child { border-bottom:0; } .tk-dok-row:hover { background:var(--tk-c-surface2); } .tk-dok-row:focus-visible, .tk-dok-card:focus-visible { outline:2px solid var(--tk-c-focus); outline-offset:-2px; }
  .tk-dok-row[aria-current="true"] { background:var(--tk-c-accent-soft); }
  .tk-dok-main { flex:1 1 0; min-width:min(100%, calc(var(--tk-fs-md) * 8)); } .tk-dok-main b { display:block; font-weight:var(--tk-fw-semibold); overflow-wrap:anywhere; } .tk-dok-end { flex:none; text-align:right; display:flex; flex-direction:column; align-items:flex-end; gap:4px; min-width:0; }
  .tk-dok-days { min-width:calc(var(--tk-fs-lg) * 3.3); min-height:calc(var(--tk-fs-lg) * 3.3); padding:6px; box-sizing:border-box; border-radius:var(--tk-radius-pill); border:2px solid var(--tc); display:inline-flex; flex-direction:column; align-items:center; justify-content:center; line-height:1.05; flex:none; }
  .tk-dok-days b { font-size:var(--tk-fs-lg); font-variant-numeric:tabular-nums; } .tk-dok-days small { font-size:var(--tk-fs-xs); color:var(--tk-c-text-muted); }
  .tk-dok-card { all:unset; box-sizing:border-box; display:flex; flex-direction:column; gap:10px; padding:var(--tk-space-4); border-radius:var(--tk-radius-lg); background:var(--tk-c-surface); border:1px solid var(--tk-c-border); cursor:pointer; min-width:0; }
  .tk-dok-card:hover { border-color:var(--tk-c-border-strong); background:var(--tk-c-surface2); }
  .tk-dok-bar { height:6px; border-radius:var(--tk-radius-pill); background:var(--tk-c-surface3); overflow:hidden; } .tk-dok-bar > i { display:block; height:100%; background:var(--tc, var(--tk-c-accent)); border-radius:inherit; }
  .tk-dok-kv { display:grid; grid-template-columns:minmax(0,max-content) minmax(0,1fr); gap:0; margin:0; font-size:var(--tk-fs-sm); } .tk-dok-kv dt, .tk-dok-kv dd { margin:0; padding:9px 0; border-bottom:1px solid var(--tk-c-border); overflow-wrap:anywhere; }
  .tk-dok-kv dt { color:var(--tk-c-text-muted); padding-right:var(--tk-space-4); } .tk-dok-kv dd { text-align:right; font-variant-numeric:tabular-nums; }
  .tk-dok-btns { display:flex; flex-wrap:wrap; gap:var(--tk-space-2); }
  .bp-mobile .tk-dok-row { min-height:var(--tk-size-touch); padding-left:var(--tk-space-3); padding-right:var(--tk-space-3); }
  [data-tk-large-text] .tk-dok-end { align-items:flex-start; text-align:left; }`;
