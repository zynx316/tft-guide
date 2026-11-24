// Finanz-Abläufe auf dem Rechenkern: Plan-Termine mit Feiertagen, Konvention im Sparrechner, Beleg → Vorbelegung, Frei verfügbar.
import './_helpers.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planExecutions, holidayName, isTradingDay } from '../app/src/library/components/savings/_plans.js';
import { runCalc, CALC_DEFAULT, conventionNote, conventionShort, neededMonthly } from '../app/src/library/components/savings/_calc.js';
import { readPrefill, prefillDate, prefillAmountText, buildTx } from '../app/src/library/components/finance/_fin.js';
import { safeToSpend } from '../app/src/library/components/finance/_calc.js';
import { projectSavings } from '../app/src/core/finmath.js';

const D = (y, m, d) => new Date(y, m - 1, d);
const iso = (x) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
const plan = (o) => ({ id: 'p', name: 'Plan', active: true, monthly: 100, ...o });

test('Plan-Ausführungen: Feiertag, Wochenende und Jahreswechsel verschieben mit Grund', () => {
  const ex = planExecutions(plan({ day: 1 }), D(2026, 11, 24), 4);
  assert.deepEqual(ex.map((e) => e.iso), ['2026-12-01', '2027-01-04', '2027-02-01', '2027-03-01']);
  assert.equal(ex[1].shifted, true);
  assert.equal(ex[1].why, 'Neujahr');
  assert.equal(ex[0].shifted, false);
  const xmas = planExecutions(plan({ day: 24 }), D(2026, 12, 1), 1)[0];
  assert.deepEqual([xmas.iso, xmas.why], ['2026-12-28', 'Heiligabend']);
  const sat = planExecutions(plan({ day: 28 }), D(2026, 11, 24), 1)[0];
  assert.deepEqual([sat.iso, sat.why], ['2026-11-30', 'Wochenende']);
});

test('Plan-Ausführungen: bestätigte Ausführung wird übersprungen, Pause beachtet', () => {
  const ex = planExecutions(plan({ day: 1 }), D(2026, 11, 24), 2, new Set(['p|2026-12-01']));
  assert.deepEqual(ex.map((e) => e.iso), ['2027-01-04', '2027-02-01']);
  assert.deepEqual(planExecutions(plan({ day: 1, active: false, pausedUntil: '2027-02-10' }), D(2026, 11, 24), 1).map((e) => e.iso), ['2027-03-01']);
  assert.deepEqual(planExecutions(plan({ day: 1, active: false }), D(2026, 11, 24), 1), []);
});

test('Plan-Termine: Handelstag-Helfer des Sparens kommen aus dem Kern', () => {
  assert.equal(isTradingDay(D(2027, 3, 26)), false);
  assert.equal(holidayName(D(2027, 3, 26)), 'Karfreitag');
  assert.equal(holidayName(D(2027, 3, 27)), 'Wochenende');
  assert.equal(holidayName(D(2027, 3, 30)), '');
});

test('Sparrechner: Standard effektiv, nominal wählbar, Referenz 150.436,50 € bei 5 % ohne Kosten', () => {
  const base = { ...CALC_DEFAULT, costPa: 0 };
  assert.equal(CALC_DEFAULT.compounding, 'effektiv');
  assert.equal(runCalc(base).annahme.value, 148274.32);
  assert.equal(runCalc({ ...base, compounding: 'nominal' }).annahme.value, 150436.5);
  assert.equal(runCalc({ ...base, compounding: 'nominal' }).vorsichtig.value, 116698.15);
  assert.equal(runCalc({ ...base, compounding: 'nominal' }).zuversichtlich.value, 196665.39);
  assert.ok(runCalc({ ...base, compounding: 'nominal', tax: true }).annahme.net < 150436.5);
  const real = runCalc({ ...base, real: true });
  assert.ok(real.annahme.value < 148274.32);
});

test('Sparrechner: Anzeige nennt die Konvention', () => {
  assert.match(conventionNote({ compounding: 'effektiv', ratePa: 0.05 }), /^Verzinsung effektiv: .*tatsächliche Jahresrendite.* Einzahlung am Monatsende\.$/);
  assert.match(conventionNote({ compounding: 'nominal', ratePa: 0.05 }), /^Verzinsung nominal: .*durch 12 .* 5,00 % nominal entsprechen etwa 5,12 % tatsächlicher Jahresrendite\.$/);
  assert.match(conventionShort({ compounding: 'nominal' }), /nominal \(p\. a\. ÷ 12 je Monat\)/);
  assert.match(conventionShort({}), /effektiv/);
  assert.ok(neededMonthly({ target: 50000, years: 10, ratePa: 0.05, compounding: 'nominal' }).annahme < neededMonthly({ target: 50000, years: 10, ratePa: 0.05 }).annahme);
});

test('Plan-Rückrechnung bleibt in der Standardkonvention (Verlauf passt zu Einstand und Wert)', () => {
  const a = projectSavings({ monthly: 100, ratePa: 0.06, years: 3 }).value;
  assert.equal(runCalc({ ...CALC_DEFAULT, monthly: 100, initial: 0, ratePa: 0.06, years: 3, costPa: 0 }).annahme.value, a);
});

// ------------------------------------------------------------------------------------------------ Beleg → Buchung
const ACC = [{ id: 'acc-giro', name: 'Girokonto' }, { id: 'acc-business', name: 'Geschäftskonto' }];
const CATS = [{ id: 'Lebensmittel', label: 'Lebensmittel' }, { id: 'Einnahmen', label: 'Sonstige Einnahmen' }];
const ctxWith = (prefill, today = new Date(2026, 10, 24, 9, 30)) => ({ ui: { prefill }, today, now: () => today, newId: (p) => `${p}-9` });

test('Vorbelegung: Beleg-Angaben werden gelesen, Betrag positiv, Konto per ID oder Name aufgelöst', () => {
  const pf = readPrefill(ctxWith({ kind: 'expense', title: ' Bäckerei Hoffmann ', amount: -4.5, date: '2026-11-24', time: '8:05', category: 'Lebensmittel', account: 'acc-giro', receiptId: 'r1' }), { accounts: ACC, categories: CATS });
  assert.deepEqual(pf, { kind: 'expense', title: 'Bäckerei Hoffmann', amount: 4.5, date: '2026-11-24', time: '08:05', category: 'Lebensmittel', account: 'acc-giro', receiptId: 'r1', label: 'aus Beleg' });
  assert.equal(readPrefill(ctxWith({ amount: 10, account: 'Geschäftskonto' }), { accounts: ACC }).account, 'acc-business');
  assert.equal(readPrefill(ctxWith({ amount: 10, account: 'Unbekannt' }), { accounts: ACC }).account, null);
  assert.equal(readPrefill(ctxWith({ amount: 10, category: 'Sonstige Einnahmen' }), { categories: CATS }).category, 'Einnahmen');
  assert.equal(readPrefill(ctxWith({ amount: 10, category: 'Business' }), { categories: CATS }).category, 'Business');
});

test('Vorbelegung: ohne Angaben oder mit Unsinn kommt nichts Falsches heraus', () => {
  assert.equal(readPrefill({ ui: {} }, { accounts: ACC }), null);
  assert.equal(readPrefill({ ui: { prefill: 'x' } }, { accounts: ACC }), null);
  const pf = readPrefill(ctxWith({ kind: 'bogus', amount: 'abc', date: '24.11.2026' }), { accounts: ACC });
  assert.deepEqual([pf.kind, pf.amount, pf.date, pf.label], ['expense', 0, null, 'Vorbelegt']);
  assert.equal(prefillAmountText({ amount: 4.5 }), '4,50');
  assert.equal(prefillAmountText({ amount: 128 }), '128,00');
  assert.equal(prefillAmountText(null), '');
});

test('Vorbelegung: Datum aus dem Beleg, Uhrzeit vom Beleg, sonst jetzt (heute) oder 12:00', () => {
  const c = ctxWith({}, new Date(2026, 10, 24, 9, 30));
  assert.equal(prefillDate(c, { date: '2026-11-24', time: '08:05' }), '2026-11-24T08:05:00');
  assert.equal(prefillDate(c, { date: '2026-11-24' }), '2026-11-24T09:30:00');
  assert.equal(prefillDate(c, { date: '2026-11-16' }), '2026-11-16T12:00:00');
  assert.equal(prefillDate(c, { date: null }), undefined);
});

test('Buchung aus Beleg: Datum und Beleg-Verweis landen in der Buchung, Ausgabe ist negativ', () => {
  const c = ctxWith({});
  const tx = buildTx(c, [], { type: 'expense', amount: 4.5, account: 'acc-giro', category: 'Lebensmittel', title: 'Bäckerei Hoffmann', date: '2026-11-24T08:05:00', receiptId: 'r1' });
  assert.deepEqual([tx.amount, tx.date, tx.receiptId, tx.type, tx.title], [-4.5, '2026-11-24T08:05:00', 'r1', 'expense', 'Bäckerei Hoffmann']);
  const plain = buildTx(c, [], { type: 'expense', amount: 4.5, account: 'acc-giro', category: 'Lebensmittel' });
  assert.equal('receiptId' in plain, false);
  assert.equal(plain.date, '2026-11-24T09:30:00');
});

// ------------------------------------------------------------------------------------------------ Frei verfügbar
test('Frei verfügbar (Finanzen) nutzt den Kern: Posten und Summe stimmen', () => {
  const accounts = [{ id: 'acc-giro', type: 'giro', balance: 3842.17 }, { id: 'acc-kk', type: 'credit', balance: -412.3 }];
  const s = safeToSpend({ accounts, txs: [], subs: [{ id: 's1', name: 'Abo', amount: 20, day: 28, interval: 'monatlich' }], plans: [{ id: 'p1', name: 'Plan', monthly: 300, day: 27, active: true }], events: [], today: new Date(2026, 10, 24, 9, 30), reserve: 100 });
  assert.deepEqual([s.balance, s.cardOpen, s.reserve, s.daysLeft], [3842.17, 412.3, 100, 7]);
  assert.equal(s.free, Math.round((s.balance - s.cardOpen - s.fixedUpcoming - s.plannedSavings - s.reserve) * 100) / 100);
  assert.equal(iso(s.end), '2026-11-30');
  assert.equal(safeToSpend({ accounts: [], txs: [], today: new Date(2026, 10, 24) }), null);
});
