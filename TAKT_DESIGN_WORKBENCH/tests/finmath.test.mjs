// Referenzwerte aus tools/test-finmath.mjs (unabhängig nachgerechnet), hier als einzelne node:test-Fälle.
import './_helpers.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { near } from './_helpers.mjs';
import {
  projectSavings, fvAnnuityNominal, savingsScenarios, monthsToGoal, requiredMonthly, loanSchedule, cagr, positionReturn, estimateTax,
  savingsRate, nextExecutions, TAX_DE,
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

test('Ausführungstermine: am 1., Wochenende rutscht auf Montag', () => {
  const ex = nextExecutions({ day: 1 }, new Date(2026, 10, 24), 6).map((x) => `${x.getDate()}.${x.getMonth() + 1}.${x.getFullYear()}`);
  assert.equal(ex.join(' '), '1.12.2026 1.1.2027 1.2.2027 1.3.2027 1.4.2027 3.5.2027');
});
