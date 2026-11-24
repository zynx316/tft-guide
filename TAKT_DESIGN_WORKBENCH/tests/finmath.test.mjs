// Referenzwerte aus tools/test-finmath.mjs (unabhängig nachgerechnet), hier als einzelne node:test-Fälle.
import './_helpers.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { near } from './_helpers.mjs';
import {
  projectSavings, fvAnnuityNominal, savingsScenarios, monthsToGoal, requiredMonthly, loanSchedule, cagr, positionReturn, estimateTax,
  savingsRate, nextExecutions, TAX_DE, monthlyRate, annualEffective, COMPOUNDING, COMPOUNDING_DEFAULT,
  easterSunday, exchangeHolidays, BOERSENFEIERTAGE, HANDELSTAGE, isTradingDay, nextTradingDay, nonTradingReason, safeToSpend,
} from '../app/src/core/finmath.js';

test('Rentenendwert: 100 €/Monat, 7 % nominal, 120 Monate = 17.308,48 €', () => {
  assert.ok(near(fvAnnuityNominal(100, 0.07, 120), 17308.48, 0.01));
  assert.equal(fvAnnuityNominal(100, 0, 12), 1200);
});

test('0 % Zins: Endwert gleich Einzahlungen', () => {
  const p = projectSavings({ monthly: 50, ratePa: 0, years: 2 });
  assert.deepEqual([p.value, p.invested, p.gain], [1200, 1200, 0]);
});

test('Einmalanlage 1.000 € bei 6 % effektiv nach einem Jahr = 1.060 €', () => {
  assert.ok(near(projectSavings({ monthly: 0, initial: 1000, ratePa: 0.06, years: 1 }).value, 1060, 0.01));
});

test('Reihe hat Monat 0 bis n, aufsteigend', () => {
  const p = projectSavings({ monthly: 100, ratePa: 0.05, years: 3 });
  assert.equal(p.series.length, 37);
  assert.equal(p.series[0].value, 0);
  assert.ok(p.series.every((x, i, a) => i === 0 || x.value >= a[i - 1].value));
});

test('Kosten (TER) senken den Endwert, nicht die Einzahlungen', () => {
  const a = projectSavings({ monthly: 200, ratePa: 0.06, years: 20 });
  const b = projectSavings({ monthly: 200, ratePa: 0.06, years: 20, costPa: 0.002 });
  assert.ok(b.value < a.value);
  assert.equal(b.invested, a.invested);
});

test('Dynamik 10 % pro Jahr: 1.200 + 1.320 = 2.520 € eingezahlt', () => {
  assert.ok(near(projectSavings({ monthly: 100, ratePa: 0, years: 2, dynamicPa: 0.1 }).invested, 2520, 0.01));
});

test('Szenarien: pessimistisch < erwartet < optimistisch', () => {
  const s = savingsScenarios({ monthly: 150, years: 15 });
  assert.ok(s.pessimistisch.value < s.erwartet.value && s.erwartet.value < s.optimistisch.value);
});

test('Monate bis zum Ziel: 18, sofort erreicht = 0, unerreichbar = Infinity', () => {
  assert.equal(monthsToGoal({ target: 10000, current: 1000, monthly: 500 }), 18);
  assert.equal(monthsToGoal({ target: 100, current: 100, monthly: 0 }), 0);
  assert.equal(monthsToGoal({ target: 1e12, monthly: 1 }), Infinity);
});

test('Benötigte Monatsrate: 12.000 € in 24 Monaten = 500 €, mit Zins kleiner', () => {
  assert.equal(requiredMonthly({ target: 12000, months: 24 }), 500);
  assert.ok(requiredMonthly({ target: 12000, months: 24, ratePa: 0.05 }) < 500);
  assert.equal(requiredMonthly({ target: 100, current: 500, months: 12 }), 0);
});

test('Darlehen 0 %: 10 Monate, keine Zinsen', () => {
  const l = loanSchedule({ principal: 10000, ratePa: 0, monthlyPayment: 1000 });
  assert.equal(l.months, 10);
  assert.equal(l.totalInterest, 0);
});

test('Darlehen 6 %: erste Zinsen 50 €, Rate unter Zins = unendlich', () => {
  assert.equal(loanSchedule({ principal: 10000, ratePa: 0.06, monthlyPayment: 300 }).rows[0].interest, 50);
  assert.equal(loanSchedule({ principal: 10000, ratePa: 0.12, monthlyPayment: 50 }).months, Infinity);
});

test('CAGR: 100 → 121 in 2 Jahren = 10 %', () => {
  assert.ok(near(cagr(100, 121, 2), 0.1, 1e-9));
  assert.equal(cagr(0, 100, 2), 0);
});

test('Positionsrendite: 10 Stück, Kauf 50, Kurs 60 = +100 € / +20 %', () => {
  const r = positionReturn({ quantity: 10, buyPrice: 50, price: 60 });
  assert.equal(r.gain, 100);
  assert.ok(near(r.pct, 0.2, 1e-9));
  assert.equal(positionReturn({ quantity: 10, buyPrice: 50, price: 60, dividends: 20 }).gain, 120);
});

test('Steuer: Effektivsatz 26,375 %, 2.000 € Gewinn nach Freibetrag = 263,75 €', () => {
  assert.ok(near(TAX_DE.effektiv, 0.26375, 1e-9));
  const t = estimateTax({ gain: 2000 });
  assert.deepEqual([t.taxable, t.tax], [1000, 263.75]);
});

test('Steuer: Teilfreistellung 30 % bei Aktienfonds', () => {
  const t = estimateTax({ gain: 2000, equityFund: true });
  assert.deepEqual([t.taxable, t.tax], [400, 105.5]);
  assert.equal(estimateTax({ gain: -50 }).tax, 0);
});

test('Sparquote: Umbuchungen sind keine Ausgaben', () => {
  const s = savingsRate([{ amount: 4000 }, { amount: -2500 }, { amount: -500, type: 'transfer' }]);
  assert.ok(near(s.rate, 0.375, 1e-9));
  assert.equal(s.spend, 2500);
});

const dm = (x) => `${x.getDate()}.${x.getMonth() + 1}.${x.getFullYear()}`;
const D = (y, m, d) => new Date(y, m - 1, d);

test('Ausführungstermine: am 1., Wochenende und Neujahr rutschen auf den nächsten Handelstag', () => {
  const ex = nextExecutions({ day: 1 }, D(2026, 11, 24), 6).map(dm);
  assert.equal(ex.join(' '), '1.12.2026 4.1.2027 1.2.2027 1.3.2027 1.4.2027 3.5.2027');
});

// ------------------------------------------------------------------------------------------------ Verzinsungskonvention
const REF = { initial: 10000, monthly: 300, years: 20 };
const endValue = (ratePa, compounding) => projectSavings({ ...REF, ratePa, compounding }).value;

test('Konvention nominal (p. a. ÷ 12): 10.000 € + 300 €/Monat, 20 Jahre = 116.698,15 / 150.436,50 / 196.665,39 €', () => {
  assert.equal(endValue(0.03, 'nominal'), 116698.15);
  assert.equal(endValue(0.05, 'nominal'), 150436.5);
  assert.equal(endValue(0.07, 'nominal'), 196665.39);
});

test('Konvention nominal stimmt mit der klassischen Formel überein (Start + Rente)', () => {
  for (const r of [0.03, 0.05, 0.07]) {
    const formel = 10000 * Math.pow(1 + r / 12, 240) + fvAnnuityNominal(300, r, 240);
    assert.ok(near(endValue(r, 'nominal'), formel, 0.01), `r=${r}`);
  }
});

test('Konvention effektiv (zwölfte Wurzel): gleiche Eingaben = 116.117,45 / 148.274,32 / 190.957,76 €', () => {
  assert.equal(endValue(0.03, 'effektiv'), 116117.45);
  assert.equal(endValue(0.05, 'effektiv'), 148274.32);
  assert.equal(endValue(0.07, 'effektiv'), 190957.76);
});

test('Standard bleibt effektiv; nominal liefert bei positivem Zins mehr, bei 0 % dasselbe', () => {
  assert.equal(COMPOUNDING_DEFAULT, 'effektiv');
  assert.equal(projectSavings({ ...REF, ratePa: 0.05 }).value, endValue(0.05, 'effektiv'));
  assert.ok(endValue(0.05, 'nominal') > endValue(0.05, 'effektiv'));
  assert.equal(endValue(0, 'nominal'), endValue(0, 'effektiv'));
  assert.equal(projectSavings({ ...REF, ratePa: 0.05, compounding: 'nominal' }).compounding, 'nominal');
});

test('Einmalanlage nach einem Jahr: effektiv 5,00 %, nominal 5,12 %', () => {
  const one = (c) => projectSavings({ monthly: 0, initial: 1000, ratePa: 0.05, years: 1, compounding: c }).value;
  assert.equal(one('effektiv'), 1050);
  assert.equal(one('nominal'), 1051.16);
  assert.ok(near(annualEffective(0.05, 'nominal'), 0.0511619, 1e-7));
  assert.ok(near(annualEffective(0.05, 'effektiv'), 0.05, 1e-12));
});

test('Kosten (TER) wirken in beiden Konventionen auf den Zins nach Kosten', () => {
  const a = projectSavings({ ...REF, ratePa: 0.05, costPa: 0.002, compounding: 'nominal' }).value;
  const b = projectSavings({ ...REF, ratePa: 0.048, compounding: 'nominal' }).value;
  assert.equal(a, b);
});

test('Szenarien, Ziel-Monate und nötige Rate übernehmen die Konvention', () => {
  const eff = savingsScenarios({ monthly: 300, initial: 10000, years: 20 }), nom = savingsScenarios({ monthly: 300, initial: 10000, years: 20, compounding: 'nominal' });
  assert.equal(eff.erwartet.value, endValue(0.06, 'effektiv'));
  assert.equal(nom.erwartet.value, endValue(0.06, 'nominal'));
  assert.ok(monthsToGoal({ target: 50000, monthly: 300, ratePa: 0.05, compounding: 'nominal' }) <= monthsToGoal({ target: 50000, monthly: 300, ratePa: 0.05 }));
  assert.ok(requiredMonthly({ target: 50000, months: 120, ratePa: 0.05, compounding: 'nominal' }) <= requiredMonthly({ target: 50000, months: 120, ratePa: 0.05 }));
  assert.equal(requiredMonthly({ target: 12000, months: 24, compounding: 'nominal' }), 500);
});

test('monthlyRate: nominal = p. a. ÷ 12, effektiv = zwölfte Wurzel; unbekannte Konvention wirft', () => {
  assert.ok(near(monthlyRate(0.06, 'nominal'), 0.005, 1e-12));
  assert.ok(near(monthlyRate(0.06, 'effektiv'), Math.pow(1.06, 1 / 12) - 1, 1e-15));
  assert.throws(() => monthlyRate(0.05, 'stetig'), RangeError);
  assert.throws(() => projectSavings({ monthly: 1, compounding: 'x' }), RangeError);
  assert.deepEqual(Object.keys(COMPOUNDING), ['effektiv', 'nominal']);
});

// ------------------------------------------------------------------------------------------------ Handelstage
test('Börsenfeiertage 2026–2028 (Annahme mit Stand): Ostern aus der Regel, feste Tage', () => {
  assert.equal(dm(easterSunday(2026)), '5.4.2026');
  assert.equal(dm(easterSunday(2027)), '28.3.2027');
  assert.equal(dm(easterSunday(2028)), '16.4.2028');
  assert.deepEqual(exchangeHolidays(2026).map((h) => h.date), ['2026-01-01', '2026-04-03', '2026-04-06', '2026-05-01', '2026-12-24', '2026-12-25', '2026-12-26', '2026-12-31']);
  assert.deepEqual(exchangeHolidays(2027).map((h) => h.date.slice(5)), ['01-01', '03-26', '03-29', '05-01', '12-24', '12-25', '12-26', '12-31']);
  assert.deepEqual(exchangeHolidays(2028).map((h) => h.date.slice(5)), ['01-01', '04-14', '04-17', '05-01', '12-24', '12-25', '12-26', '12-31']);
  assert.equal(BOERSENFEIERTAGE.length, 24);
  assert.equal(HANDELSTAGE.stand, '2026-11-24');
  assert.deepEqual(HANDELSTAGE.jahre, [2026, 2028]);
});

test('Handelstag: Wochentag bleibt, Wochenende rutscht auf Montag', () => {
  assert.equal(dm(nextTradingDay(D(2026, 11, 24))), '24.11.2026');
  assert.equal(dm(nextTradingDay(D(2026, 11, 28))), '30.11.2026');
  assert.equal(dm(nextTradingDay(D(2026, 11, 29))), '30.11.2026');
  assert.equal(dm(nextTradingDay('2026-11-28')), '30.11.2026');
  assert.equal(nextTradingDay(new Date(2026, 10, 28, 15, 45)).getHours(), 0);
});

test('Handelstag: Feiertag mitten in der Woche und Ostern (Karfreitag + Ostermontag)', () => {
  assert.equal(dm(nextTradingDay(D(2027, 3, 26))), '30.3.2027');
  assert.equal(dm(nextTradingDay(D(2026, 4, 3))), '7.4.2026');
  assert.equal(dm(nextTradingDay(D(2026, 12, 25))), '28.12.2026');
});

test('Handelstag: Feiertag vor dem Wochenende (Fr 1.5.2026) und Feiertag am Wochenende', () => {
  assert.equal(dm(nextTradingDay(D(2026, 5, 1))), '4.5.2026');
  assert.equal(dm(nextTradingDay(D(2027, 5, 1))), '3.5.2027');
  assert.equal(nonTradingReason(D(2026, 5, 1)), 'Tag der Arbeit');
  assert.equal(nonTradingReason(D(2026, 5, 2)), 'Wochenende');
  assert.equal(nonTradingReason(D(2026, 5, 4)), '');
});

test('Handelstag: Jahreswechsel (24., 25., 26., 31.12. und 1.1.)', () => {
  assert.equal(dm(nextTradingDay(D(2026, 12, 24))), '28.12.2026');
  assert.equal(dm(nextTradingDay(D(2026, 12, 31))), '4.1.2027');
  assert.equal(dm(nextTradingDay(D(2027, 12, 24))), '27.12.2027');
  assert.equal(dm(nextTradingDay(D(2027, 12, 31))), '3.1.2028');
  assert.equal(dm(nextTradingDay(D(2028, 12, 29))), '29.12.2028');
  assert.equal(dm(nextTradingDay(D(2028, 12, 31))), '2.1.2029');
});

test('Handelstag: eigene Feiertage ersetzen die Standardliste', () => {
  assert.equal(dm(nextTradingDay(D(2026, 12, 24), { holidays: [] })), '24.12.2026');
  assert.equal(dm(nextTradingDay(D(2026, 11, 24), { holidays: ['2026-11-24'] })), '25.11.2026');
  assert.equal(dm(nextTradingDay(D(2026, 11, 24), { holidays: new Set(['2026-11-24', '2026-11-25']) })), '26.11.2026');
  assert.equal(dm(nextTradingDay(D(2026, 11, 24), { holidays: (iso) => iso === '2026-11-24' })), '25.11.2026');
  assert.equal(isTradingDay(D(2026, 12, 24), { holidays: [] }), true);
  assert.equal(isTradingDay(D(2026, 12, 24)), false);
  assert.throws(() => nextTradingDay(D(2026, 11, 24), { holidays: () => true }), RangeError);
});

test('Handelstag: ungültige Eingabe ergibt kein Datum statt Endlosschleife', () => {
  assert.ok(Number.isNaN(nextTradingDay('kein Datum').getTime()));
  assert.equal(isTradingDay('kein Datum'), false);
  assert.deepEqual(nextExecutions({ day: 1 }, 'kein Datum', 3), []);
});

test('nextExecutions: Feiertage verschieben den Termin, Rhythmus und Monatsende bleiben richtig', () => {
  assert.equal(nextExecutions({ day: 24 }, D(2026, 12, 1), 1).map(dm)[0], '28.12.2026');
  assert.equal(nextExecutions({ day: 31 }, D(2026, 12, 20), 4).map(dm).join(' '), '4.1.2027 1.2.2027 1.3.2027 31.3.2027');
  assert.equal(nextExecutions({ day: 1, intervalMonths: 3 }, D(2026, 11, 24), 3).map(dm).join(' '), '1.12.2026 1.3.2027 1.6.2027');
  assert.equal(nextExecutions({ day: 1 }, D(2026, 11, 24), 2, { holidays: [] }).map(dm).join(' '), '1.12.2026 1.1.2027');
  assert.equal(nextExecutions({ day: 15 }, D(2026, 11, 15), 1).map(dm)[0], '16.11.2026');
});

test('nextExecutions: Termin, der durch Verschiebung erst nach „ab“ liegt, zählt (Sa 31.10. → Mo 2.11.)', () => {
  assert.equal(nextExecutions({ day: 31 }, D(2026, 11, 1), 2).map(dm).join(' '), '2.11.2026 30.11.2026');
  assert.equal(nextExecutions({ day: 1 }, D(2026, 11, 2), 2).map(dm).join(' '), '2.11.2026 1.12.2026');
  assert.equal(nextExecutions({ day: 1 }, D(2026, 11, 3), 1).map(dm).join(' '), '1.12.2026');
  assert.ok(nextExecutions({ day: 5 }, D(2026, 11, 24), 8).every((d, i, a) => i === 0 || d > a[i - 1]));
});

test('nextExecutions: ungültiger Tag im Monat zählt als 1, Tage über 31 als Monatsende; null als Option ist erlaubt', () => {
  for (const day of [0, -3, NaN, null, undefined, 'x']) assert.equal(nextExecutions({ day }, D(2026, 11, 24), 2).map(dm).join(' '), '1.12.2026 4.1.2027', `day=${day}`);
  assert.equal(nextExecutions({ day: 45 }, D(2026, 11, 24), 2).map(dm).join(' '), '30.11.2026 4.1.2027');
  assert.equal(dm(nextTradingDay(D(2026, 12, 24), null)), '28.12.2026');
  assert.equal(nonTradingReason(D(2026, 12, 25), null), '1. Weihnachtstag');
});

// ------------------------------------------------------------------------------------------------ Frei verfügbar
test('Frei verfügbar bis Monatsende: Posten, Resttage, Tagesbetrag', () => {
  const s = safeToSpend({ balance: 3842.17, cardOpen: 412.3, fixedUpcoming: 120, plannedSavings: 300, reserve: 500, today: new Date(2026, 10, 24, 9, 30) });
  assert.deepEqual([s.free, s.daysLeft, s.perDay], [2509.87, 7, 358.55]);
  assert.equal(dm(s.end), '30.11.2026');
  assert.equal(safeToSpend({ balance: 100, fixedUpcoming: 250, today: D(2026, 11, 30) }).perDay, 0);
  assert.equal(safeToSpend({ balance: 100, fixedUpcoming: 250, today: D(2026, 11, 30) }).free, -150);
});
