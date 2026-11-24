// Finanzen – Rechenhelfer (rein, ohne DOM, auch in Node nutzbar).
// Grundregel (FINANCE_GUIDELINES 5): Umbuchungen sind weder Einnahme noch Ausgabe. Sparquote über core/finmath.js.
import { savingsRate, nextExecutions } from '../../../core/finmath.js';
import { toDate, dayStart, addDays, dayDiff, endOfMonth, daysInMonth } from '../../../lib/date.js';

export const arr = (v) => (Array.isArray(v) ? v : []);
export const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
/** Kaufmännisch auf Cent, ohne „−0“. */
export const r2 = (x) => (Math.sign(x) * Math.round((Math.abs(x) + 1e-9) * 100)) / 100 + 0;
const sum = (list, f) => list.reduce((s, x) => s + f(x), 0);

export const monthKey = (d) => { const x = toDate(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`; };
export const isoLocal = (d) => { const x = toDate(d); const p = (n) => String(n).padStart(2, '0'); return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}T${p(x.getHours())}:${p(x.getMinutes())}:00`; };

/** Interne Bewegung (zählt nicht als Einnahme/Ausgabe): Umbuchung oder Privatentnahme (Geschäftskonto → Girokonto). */
export const isInternal = (t) => t.type === 'transfer' || t.internal === true || (t.type === 'income' && /^privatentnahme/i.test(t.title || ''));
export const monthTx = (txs, today) => arr(txs).filter((t) => monthKey(t.date) === monthKey(today));

/** Gesamtsicht eines Zeitraums: Einnahmen, Ausgaben, Gespart (Umbuchungen „Sparen“), Sparquote (finmath). */
export function flow(txs) {
  const list = arr(txs);
  const { income, spend, rate } = savingsRate(list.filter((t) => !isInternal(t)));
  const saved = r2(-sum(list.filter((t) => t.type === 'transfer' && t.category === 'Sparen'), (t) => t.amount));
  return { income, expenses: spend, saved, rate, rest: r2(income - spend - saved) };
}

/** Ausgaben je Kategorie im Monat von `today`; Splits zählen anteilig. */
export function spentByCategory(txs, today) {
  const out = {};
  for (const t of monthTx(txs, today)) {
    if (t.type !== 'expense') continue;
    const parts = arr(t.split).length ? t.split : [{ category: t.category, amount: t.amount }];
    for (const p of parts) out[p.category] = r2((out[p.category] || 0) - p.amount);
  }
  return out;
}

/** Zustand einer Budget-Hülle: Ist, Rest, Tagesbudget, Erwartung nach Monatsverlauf (Pace), Status ok | warn | over. */
export function envelope(b, spent, today, hasTx = true) {
  const d = toDate(today), dim = daysInMonth(d.getFullYear(), d.getMonth()), day = d.getDate();
  const used = hasTx && b.category ? spent[b.category] || 0 : b.value || 0;
  const left = r2(b.target - used), daysLeft = dim - day + 1;
  const status = used > b.target ? 'over' : b.target && used >= b.target * 0.85 ? 'warn' : 'ok';
  return { ...b, used, left, pct: b.target ? used / b.target : 0, status, daysLeft, perDay: left > 0 ? r2(left / daysLeft) : 0, expected: r2((b.target * day) / dim), paceTick: day / dim };
}

// --- Anstehendes --------------------------------------------------------------------------------------------
/** Erster Tag nach `from` mit Tag `day` im Monat (kurze Monate rutschen auf den letzten Tag). */
export function nextMonthly(day, from) {
  const f = dayStart(from); let y = f.getFullYear(), m = f.getMonth();
  for (let i = 0; i < 14; i++) {
    const d = new Date(y, m, Math.min(day, daysInMonth(y, m)));
    if (d > f) return d;
    m += 1; if (m > 11) { m = 0; y += 1; }
  }
  return f;
}
export const payAccount = (sub, txs) => arr(txs).find((t) => t.subscriptionId === sub.id)?.account || (sub.business ? 'acc-business' : 'acc-giro');

/** Abos, Sparpläne und Termine mit Geldwirkung der nächsten `days` Tage, sortiert nach Datum. */
export function upcomingItems({ subs, plans, events, txs, today, days = 30 }) {
  const t0 = dayStart(today), limit = addDays(t0, days), out = [];
  for (const s of arr(subs)) {
    if (s.interval && s.interval !== 'monatlich') continue;
    const d = nextMonthly(s.day || 1, t0);
    if (d <= limit) out.push({ id: `u-${s.id}`, kind: 'abo', ref: s.id, title: s.name, date: d, amount: -s.amount, icon: s.icon || 'repeat', tone: 'accent', account: payAccount(s, txs), business: !!s.business, planned: !!s.cancelPlanned });
  }
  for (const p of arr(plans)) {
    if (!p.active) continue;
    const d = nextExecutions({ day: p.day, intervalMonths: p.intervalMonths || 1 }, addDays(t0, 1), 1)[0];
    if (d && d <= limit) out.push({ id: `u-${p.id}`, kind: 'sparplan', ref: p.id, title: p.name, date: d, amount: -p.monthly, icon: 'piggy-bank', tone: 3, account: 'acc-giro', shifted: d.getDate() !== p.day });
  }
  for (const e of arr(events)) {
    const d = toDate(e.date);
    if (d > t0 && d <= limit) out.push({ id: e.id, kind: e.kind || 'termin', ref: e.id, title: e.title, date: d, amount: e.amount, icon: e.icon || 'calendar-clock', tone: e.tone || 'warning', account: e.from, business: !!e.business, note: e.note });
  }
  return out.sort((a, b) => a.date - b.date || a.amount - b.amount);
}

/** „Frei verfügbar bis Monatsende“: Girokonto − offene Kreditkarte − Abbuchungen bis zum Monatswechsel − Sparraten − Puffer. */
export function safeToSpend({ accounts, txs, subs, plans, events, today, reserve = 0 }) {
  const giro = arr(accounts).filter((a) => a.type === 'giro');
  if (!giro.length) return null;
  const typeOf = (id) => arr(accounts).find((a) => a.id === id)?.type;
  const end = endOfMonth(today), horizon = addDays(end, 1);
  const items = upcomingItems({ subs, plans, events, txs, today, days: dayDiff(today, horizon) }).filter((i) => !i.business);
  const balance = r2(sum(giro, (a) => a.balance));
  const cardOpen = r2(-sum(arr(accounts).filter((a) => a.type === 'credit' && a.balance < 0), (a) => a.balance));
  const fixedUpcoming = r2(-sum(items.filter((i) => i.kind === 'abo' && typeOf(i.account) === 'giro'), (i) => i.amount));
  const plannedSavings = r2(-sum(items.filter((i) => i.kind === 'sparplan'), (i) => i.amount));
  const free = r2(balance - cardOpen - fixedUpcoming - plannedSavings - reserve);
  const daysLeft = dayDiff(today, end) + 1;
  return { balance, cardOpen, fixedUpcoming, plannedSavings, reserve, free, daysLeft, perDay: free > 0 ? r2(free / daysLeft) : 0, end, horizon, items };
}

// --- Abos & Fixkosten -----------------------------------------------------------------------------------------
export const subKind = (s) => (!s.cancelable || ['Wohnen', 'Versicherungen', 'Gesundheit'].includes(s.category) ? 'fix' : 'abo');
export const yearly = (s) => r2(s.amount * 12);
export function subStats(subs, meta, today) {
  const list = arr(subs), priv = list.filter((s) => !s.business), m = obj(meta);
  const deadline = (s) => (m[s.id]?.cancelBy ? dayDiff(today, m[s.id].cancelBy) : null);
  return {
    monthly: r2(sum(priv, (s) => s.amount)), yearly: r2(sum(priv, yearly)), businessMonthly: r2(sum(list.filter((s) => s.business), (s) => s.amount)),
    fixed: r2(sum(priv.filter((s) => subKind(s) === 'fix'), (s) => s.amount)), abos: r2(sum(priv.filter((s) => subKind(s) === 'abo'), (s) => s.amount)),
    unused: list.filter((s) => s.cancelable && (s.lastUsedDays || 0) >= 30), deadline,
    deadlines: list.filter((s) => { const d = deadline(s); return d != null && d >= 0 && d <= 45; }).sort((a, b) => deadline(a) - deadline(b)),
  };
}

// --- Vermögen -------------------------------------------------------------------------------------------------
export const WEALTH_GROUPS = [
  { id: 'liquid', label: 'Liquidität', types: ['giro', 'business'], tone: 1, icon: 'wallet' },
  { id: 'reserve', label: 'Rücklagen', types: ['savings'], tone: 3, icon: 'piggy-bank' },
  { id: 'invest', label: 'Anlage', types: ['depot'], tone: 4, icon: 'candlestick-chart' },
];
export function wealth(accounts) {
  const list = arr(accounts);
  const groups = WEALTH_GROUPS.map((g) => { const acc = list.filter((a) => g.types.includes(a.type)); return { ...g, accounts: acc, value: r2(sum(acc, (a) => a.balance)) }; });
  const gross = r2(sum(groups, (g) => g.value)), debt = r2(-sum(list.filter((a) => a.type === 'credit' && a.balance < 0), (a) => a.balance));
  return { groups: groups.map((g) => ({ ...g, share: gross ? g.value / gross : 0 })), gross, debt, net: r2(gross - debt) };
}

// --- Monatsreihe (Vormonate aus der Welt, laufender Monat live aus den Buchungen) ---------------------------------
export function monthsSeries(months, txs, today, count = 6) {
  const cur = monthTx(txs, today), f = flow(cur), byCat = spentByCategory(cur, today), d = toDate(today);
  const label = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'][d.getMonth()];
  const hist = arr(months).filter((m) => m.key < monthKey(today)).map((m) => ({ ...m, rate: m.income ? (m.income - m.expenses) / m.income : 0 }));
  const live = cur.length ? [{ key: monthKey(today), label, income: f.income, expenses: f.expenses, saved: f.saved, rate: f.rate, byCat, partial: true }] : [];
  return [...hist, ...live].slice(-count);
}

// --- Kategorien -----------------------------------------------------------------------------------------------
export const catMeta = (cats, name) => arr(cats).find((c) => c.id === name || c.label === name) || { id: name, label: name || 'Ohne Kategorie', icon: 'tag', tone: 'neutral', kind: 'variabel' };
export const ruleHits = (rule, txs) => arr(txs).filter((t) => (t.title || '').toLowerCase().includes(rule.match.toLowerCase())).length;
/** Kategorie aus Regeln (erste aktive Regel, deren Text im Titel steckt). */
export const matchRule = (rules, title) => { const t = String(title || '').toLowerCase(); return t ? arr(rules).find((r) => r.active && t.includes(r.match.toLowerCase())) : null; };
/** Vorschläge für die Erfassung: Regeltreffer zuerst, dann häufigste Ausgabekategorien der letzten 60 Tage. */
export function suggestCategories({ txs, cats, rules, title, today, limit = 5 }) {
  const out = [], hit = matchRule(rules, title);
  if (hit) out.push(hit.category);
  const cnt = {}, from = addDays(dayStart(today), -60);
  for (const t of arr(txs)) if (t.type === 'expense' && toDate(t.date) >= from) cnt[t.category] = (cnt[t.category] || 0) + 1;
  Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a]).forEach((c) => !out.includes(c) && out.push(c));
  arr(cats).filter((c) => c.kind === 'variabel').forEach((c) => !out.includes(c.id) && out.push(c.id));
  return out.slice(0, limit);
}

// --- Erfassen: Text mit Erkennung („-12,50 Rewe“, „+120 Etsy“, „umbuchen 150 Tagesgeld“) ------------------------------
export function parseQuick(text, { accounts, cats, rules }) {
  const raw = String(text || '').trim();
  const m = /([+\-−]?)\s*(\d{1,7}(?:[.,]\d{1,2})?)/.exec(raw);
  if (!m) return null;
  const amount = Number(m[2].replace(',', '.'));
  if (!(amount > 0)) return null;
  const rest = (raw.slice(0, m.index) + ' ' + raw.slice(m.index + m[0].length)).replace(/\s+/g, ' ').replace(/€/g, '').trim();
  const lower = rest.toLowerCase();
  const isTransfer = /^(umbuch|umbuchen|überweis|transfer)/i.test(lower);
  const target = isTransfer ? arr(accounts).find((a) => a.type !== 'depot' && lower.includes(a.name.toLowerCase().split(' ')[0])) : null;
  const type = isTransfer ? 'transfer' : m[1] === '+' ? 'income' : 'expense';
  const title = rest.replace(/^(umbuchung|umbuchen)\s*/i, '').trim();
  const rule = matchRule(rules, title);
  const card = /\b(karte|kk|kreditkarte)\b/i.test(lower);
  const account = (card ? arr(accounts).find((a) => a.type === 'credit') : arr(accounts).find((a) => a.type === 'giro'))?.id;
  const category = type === 'transfer' ? (target && ['savings'].includes(target.type) ? 'Sparen' : 'Umbuchung') : rule?.category || (type === 'income' ? 'Einnahmen' : 'Sonstiges');
  return { type, amount, title: title.replace(/\b(karte|kk|kreditkarte)\b/i, '').trim(), category, account, to: target?.id, rule: rule?.id };
}

// --- Numpad: Eingabe als Text („12,5“), höchstens 7 Vorkomma- und 2 Nachkommastellen ---------------------------------
export function pressKey(digits, key) {
  if (key === 'back') return digits.slice(0, -1);
  if (key === 'clear') return '';
  if (key === ',') return digits.includes(',') ? digits : `${digits || '0'},`;
  if (!/^\d$/.test(key)) return digits;
  const [int, dec] = digits.split(',');
  if (dec !== undefined) return dec.length >= 2 ? digits : digits + key;
  if (int.length >= 7) return digits;
  return int === '0' || int === '' ? key : int + key;
}
export const digitsToNumber = (d) => Number(String(d || '0').replace(',', '.')) || 0;
export const numberToDigits = (n) => String(r2(n)).replace('.', ',');
/** Häufigste Ausgabetitel (für „Häufig“-Chips): Titel, Kategorie, letzter Betrag. */
export function frequentExpenses(txs, limit = 3) {
  const m = new Map();
  for (const t of arr(txs)) if (t.type === 'expense' && !t.subscriptionId) { const e = m.get(t.title) || { title: t.title, category: t.category, account: t.account, n: 0, amount: -t.amount }; e.n += 1; m.set(t.title, e); }
  return [...m.values()].sort((a, b) => b.n - a.n || a.title.localeCompare(b.title)).slice(0, limit);
}
