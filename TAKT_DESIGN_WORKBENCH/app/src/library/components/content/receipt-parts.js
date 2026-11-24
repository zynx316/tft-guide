// Beleg erkennen: gemeinsame Logik für Prüfformular und Beleg-Karte (Eingabeprüfung, Vorbelegung für Finanzen, Buchen).
import { useState, useEffect, useRef } from 'preact/hooks';
import { isoLocal } from './content-util.js';
import { money } from '../../helpers.js';

export const CATS = ['Lebensmittel', 'Haushalt', 'Mobilität', 'Freizeit', 'Gesundheit', 'Business'];
export const CAT_ICON = { Lebensmittel: 'shopping-basket', Haushalt: 'home', Mobilität: 'car', Freizeit: 'ticket', Gesundheit: 'heart-pulse', Business: 'briefcase' };
export const ACCOUNTS = { Girokonto: 'acc-giro', Kreditkarte: 'acc-kreditkarte', Geschäftskonto: 'acc-business' };
export const toNum = (v) => parseFloat(String(v).replace(/\./g, '').replace(',', '.'));

/** Zustand und Regeln eines Belegs: Felder, Fehlertexte, MwSt, Vorbelegung, Buchen. Löst `form.invalid` aus, sobald ein Feld ungültig wird. */
export function useReceiptForm({ rc, setData, ctx }) {
  const [f, setF] = useState({ merchant: rc.merchant, date: rc.date, total: rc.total.toFixed(2).replace('.', ','), cat: rc.category, acc: rc.account || 'Girokonto' });
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const total = toNum(f.total), today = isoLocal(ctx.today).slice(0, 10);
  const err = { total: !(total > 0) ? 'Diese Angabe passt nicht. Prüfe den Betrag.' : '', date: !f.date || f.date > today ? 'Das Datum liegt in der Zukunft oder fehlt.' : '', merchant: !f.merchant.trim() ? 'Händler fehlt.' : '' };
  const prev = useRef({ total: '', date: '', merchant: '' });
  useEffect(() => { Object.keys(err).forEach((k) => { if (err[k] && !prev.current[k]) ctx.emit('form.invalid', { field: k }); }); prev.current = { ...err }; }, [err.total, err.date, err.merchant]);
  const booked = rc.status === 'gebucht', valid = !err.total && !err.date && !err.merchant;
  const vat = total > 0 ? Math.round((total / (1 + rc.vatRate / 100)) * (rc.vatRate / 100) * 100) / 100 : 0;
  // Vorbelegung für „Schnell erfassen“ (Finanzen): Betrag positiv, Konto als ID, Uhrzeit vom Beleg.
  const prefill = { kind: 'expense', title: f.merchant.trim(), amount: total > 0 ? total : 0, date: f.date, time: rc.time, category: f.cat, account: ACCOUNTS[f.acc] || 'acc-giro', receiptId: rc.id };
  const book = () => {
    // App: Schnell erfassen öffnet mit den Angaben, gebucht wird dort nach „Speichern“. Einzel-Screen (kein Ziel erreichbar): direkt buchen.
    if (ctx.emit('receipt.book', { id: rc.id, to: 'finance.quickadd', ui: { prefill } })) return;
    setData('transactions', (a) => [{ id: `t-${rc.id}`, date: `${f.date}T${rc.time || '12:00'}:00`, title: f.merchant.trim(), category: f.cat, amount: -total, account: ACCOUNTS[f.acc] || 'acc-giro', type: 'expense', icon: 'receipt', receiptId: rc.id }, ...(Array.isArray(a) ? a : [])]);
    setData('receipts', (a) => a.map((x) => (x.id === rc.id ? { ...x, status: 'gebucht', merchant: f.merchant, date: f.date, total, category: f.cat, account: f.acc } : x)));
    ctx.toast(`Gebucht: ${money(ctx, -total)} · ${f.merchant.trim()}`);
  };
  const toFinance = () => ctx.emit('receipt.finance', { id: rc.id, ui: { prefill } });
  return { f, set, total, err, booked, valid, vat, prefill, book, toFinance };
}

/** Mögliche Dublette: gleicher Betrag innerhalb von vier Tagen in den Buchungen. */
export const findDupe = (transactions, sel) => (transactions || []).find((t) => Math.abs(Math.abs(t.amount) - sel.total) < 0.005 && Math.abs(new Date(t.date) - new Date(sel.date)) < 4 * 864e5 && t.id !== `t-${sel.id}`);
