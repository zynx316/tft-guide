// Dokumente & Verträge – Fristenlogik (rein, ohne UI). Genutzt von den Komponenten und von seed/world/documents.js.
// Fristen gehören documents; laufende Kosten und Summen gehören Finanzen (Abos). Beträge und Kündigungsfristen der Verträge
// kommen aus der Finanzwelt und werden hier nur gelesen, nie neu gepflegt.
// Stufen: bis 3 Tage „Dringend“, bis 14 Tage „Bald“, bis 30 Tage „Im Blick“, danach „Später“ (Erinnerungen 30/14/3 Tage vorher).
import { dayDiff, addMonths, toIsoDay } from '../../../lib/date.js';

export const HORIZON_DAYS = 90;
export const REMINDER_DAYS = [30, 14, 3];
export const STAGES = [
  { id: 'dringend', max: 3, label: 'Dringend', tone: 'danger' },
  { id: 'bald', max: 14, label: 'Bald', tone: 'warning' },
  { id: 'blick', max: 30, label: 'Im Blick', tone: 'info' },
  { id: 'weit', max: Infinity, label: 'Später', tone: 'neutral' },
];
export const stageOf = (days) => STAGES.find((s) => days <= s.max) || STAGES[STAGES.length - 1];
export const KIND_ICON = { contract: 'scroll-text', warranty: 'badge-check', document: 'file-text', tax: 'landmark' };
export const KIND_EVENT = { contract: 'deadline.contract', warranty: 'deadline.warranty', document: 'deadline.document', tax: 'deadline.tax' };
export const KIND_TO = { contract: 'documents.contract', warranty: 'documents.warranties', document: 'documents.detail', tax: 'documents.tax-folder' };

const arr = (v) => (Array.isArray(v) ? v : []);

/** Ende der gesetzlichen Gewährleistung bzw. der Herstellergarantie aus Kaufdatum und Monaten. */
export const warrantyEnd = (purchaseDate, months) => (months ? toIsoDay(addMonths(purchaseDate, months)) : null);

/** Zustand einer Garantie am Tag `today`: aktiv, läuft ab (bis 30 Tage) oder abgelaufen; nächstes Ende und letztes Ende. */
export function warrantyState(w, today) {
  const ends = [w.legalEnd && { kind: 'legal', label: 'Gewährleistung', date: w.legalEnd }, w.makerEnd && { kind: 'maker', label: 'Herstellergarantie', date: w.makerEnd }].filter(Boolean)
    .map((e) => ({ ...e, days: dayDiff(today, e.date) })).sort((a, b) => a.days - b.days);
  const last = ends[ends.length - 1];
  const next = ends.find((e) => e.days >= 0);
  if (!next) return { status: 'abgelaufen', next: null, last, days: last ? last.days : null, stage: null, ends };
  const stage = stageOf(next.days);
  return { status: next.days <= 30 ? 'läuft ab' : 'aktiv', next, last, days: next.days, stage, ends };
}

/** Stand eines Dokuments mit Ablaufdatum: gültig, läuft ab (bis 90 Tage), abgelaufen, ohne Ablauf. */
export function documentState(d, today) {
  if (!d.validUntil) return { status: 'ohne Ablauf', days: null };
  const days = dayDiff(today, d.validUntil);
  return { status: days < 0 ? 'abgelaufen' : days <= HORIZON_DAYS ? 'läuft ab' : 'gültig', days };
}

/** Eintrag des Steuerordners auflösen (Verweis auf Beleg, Buchung, Dokument, Abo oder fehlenden Nachweis). Fehlt die Quelle: null. */
export function resolveRef(ref, src = {}) {
  const find = (list, id) => arr(list).find((x) => x.id === id);
  if (ref.kind === 'tx') { const t = find(src.transactions, ref.id); return t && { ref, kind: 'tx', title: t.title, date: String(t.date).slice(0, 10), amount: Math.abs(t.amount), note: t.type === 'income' ? 'Einnahme' : 'Ausgabe', state: 'ok', to: 'finance.transaction', id: t.id }; }
  if (ref.kind === 'receipt') { const r = find(src.receipts, ref.id); return r && { ref, kind: 'receipt', title: r.merchant, date: r.date, amount: r.total, note: r.status === 'gebucht' ? 'Beleg, gebucht' : 'Beleg, noch nicht gebucht', state: r.status === 'gebucht' ? 'ok' : 'offen', to: 'picture-to-text.receipt', id: r.id }; }
  if (ref.kind === 'doc') { const d = find(src.documents, ref.id); return d && { ref, kind: 'doc', title: d.title, date: d.date, note: d.type, state: 'ok', to: 'documents.detail', id: d.id }; }
  if (ref.kind === 'sub') { const s = find(src.subscriptions, ref.id); return s && { ref, kind: 'sub', title: s.name, amount: s.amount, per: 'Monat', note: 'Abo, Betriebsausgabe', state: 'ok', to: 'finance.subscriptions', id: s.id }; }
  if (ref.kind === 'missing') return { ref, kind: 'missing', title: ref.label, note: ref.note || 'Fehlt noch', state: 'offen', to: ref.to, id: ref.id };
  return null;
}

/** Steuerordner mit aufgelösten Einträgen je Kategorie; `open` zählt Belege ohne Buchung und fehlende Nachweise. */
export function taxStats(tax, src) {
  const cats = arr(tax?.categories).map((c) => { const items = arr(c.refs).map((r) => resolveRef(r, src)).filter(Boolean); return { ...c, items, open: items.filter((i) => i.state === 'offen').length }; });
  const total = cats.reduce((n, c) => n + c.items.length, 0), open = cats.reduce((n, c) => n + c.open, 0);
  return { categories: cats, total, open, ok: total - open };
}

/**
 * Alle anstehenden Fristen (aufsteigend nach Tagen): Kündigungsfristen der Verträge, Ablauf von Garantien, Ablauf von Dokumenten
 * ohne Vertrag (Ausweise) und der Steuerordner, solange etwas offen ist. Vergangenes und alles hinter dem Horizont bleibt draußen.
 */
export function buildDeadlines({ contracts, warranties, documents, tax, taxOpen = 0, today, horizon = HORIZON_DAYS }) {
  const out = [];
  const push = (d) => { if (d.days >= 0 && d.days <= horizon) out.push({ ...d, stage: stageOf(d.days), kindIcon: KIND_ICON[d.kind], event: KIND_EVENT[d.kind], to: KIND_TO[d.kind] }); };
  for (const c of arr(contracts)) if (c.cancelBy) push({ id: `dl-${c.id}`, kind: 'contract', refId: c.id, title: c.name, label: 'Kündigung bis', date: c.cancelBy, days: dayDiff(today, c.cancelBy), endsOn: c.endsOn, amount: c.amount, interval: c.interval, icon: c.icon });
  for (const w of arr(warranties)) { const s = warrantyState(w, today); if (s.next) push({ id: `dl-${w.id}`, kind: 'warranty', refId: w.id, title: w.title, label: `${s.next.label} endet`, date: s.next.date, days: s.next.days, icon: 'badge-check', business: !!w.business }); }
  for (const d of arr(documents)) if (d.validUntil && !d.contractId) push({ id: `dl-${d.id}`, kind: 'document', refId: d.id, title: d.title, label: 'Gültig bis', date: d.validUntil, days: dayDiff(today, d.validUntil), icon: 'contact-round' });
  if (tax?.due && taxOpen > 0) push({ id: `dl-tax-${tax.year}`, kind: 'tax', refId: String(tax.year), title: `Steuerordner ${tax.year}`, label: 'Unterlagen bis', date: tax.due, days: dayDiff(today, tax.due), note: `${taxOpen} ${taxOpen === 1 ? 'Eintrag' : 'Einträge'} offen`, icon: 'landmark' });
  return out.sort((a, b) => a.days - b.days || a.title.localeCompare(b.title, 'de'));
}

/** Zählt die Fristen je Stufe (für Streifen und Kennzahlen). */
export const countByStage = (list) => Object.fromEntries(STAGES.map((s) => [s.id, arr(list).filter((d) => d.stage.id === s.id).length]));
