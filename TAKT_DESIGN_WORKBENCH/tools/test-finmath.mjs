#!/usr/bin/env node
// Referenztests für app/src/core/finmath.js – Werte unabhängig nachgerechnet (Formeln/Tabellenkalkulation).
import { projectSavings, fvAnnuityNominal, monthsToGoal, requiredMonthly, loanSchedule, cagr, positionReturn, estimateTax, savingsRate, nextExecutions, TAX_DE } from '../app/src/core/finmath.js';

let fail = 0, n = 0;
const near = (a, b, tol = 0.01) => Math.abs(a - b) <= tol;
const t = (name, ok, got) => { n++; if (!ok) { fail++; console.log(`✖ ${name} (erhalten: ${JSON.stringify(got)})`); } };

// 1) Klassische Rentenendwertformel: 100 €/Monat, 7 % p. a. nominal, 120 Monate → 17.308,48 €
t('FV-Annuität 100€/7%/10J', near(fvAnnuityNominal(100, 0.07, 120), 17308.48, 0.01), fvAnnuityNominal(100, 0.07, 120));
// 2) 0 % Zins: Einzahlungen = Endwert
const p0 = projectSavings({ monthly: 50, ratePa: 0, years: 2 }); t('0 % Zins', p0.value === 1200 && p0.invested === 1200 && p0.gain === 0, p0);
// 3) Effektivzins: 1.000 € Einmalanlage, 6 % p. a. effektiv, 1 Jahr → 1.060 €
const p1 = projectSavings({ monthly: 0, initial: 1000, ratePa: 0.06, years: 1 }); t('Einmalanlage effektiv 6 %', near(p1.value, 1060, 0.01), p1.value);
// 4) TER reduziert Endwert
const a = projectSavings({ monthly: 200, ratePa: 0.06, years: 20 }), b = projectSavings({ monthly: 200, ratePa: 0.06, years: 20, costPa: 0.002 }); t('TER senkt Endwert', b.value < a.value && b.invested === a.invested, [a.value, b.value]);
// 5) Dynamik erhöht Einzahlungen: 100 €, +10 %/Jahr, 2 Jahre → 1.200 + 1.320 = 2.520
const d = projectSavings({ monthly: 100, ratePa: 0, years: 2, dynamicPa: 0.10 }); t('Dynamik 10 %', near(d.invested, 2520, 0.01), d.invested);
// 6) Monate bis Ziel ohne Zins: 10.000 € bei 500 €/Monat und 1.000 € Start → 18 Monate
t('Monate bis Ziel', monthsToGoal({ target: 10000, current: 1000, monthly: 500 }) === 18, monthsToGoal({ target: 10000, current: 1000, monthly: 500 }));
t('Ziel unerreichbar', monthsToGoal({ target: 1e12, monthly: 1 }) === Infinity, null);
// 7) Benötigte Rate ohne Zins: 12.000 € in 24 Monaten → 500 €
t('Benötigte Rate', requiredMonthly({ target: 12000, months: 24 }) === 500, requiredMonthly({ target: 12000, months: 24 }));
// 8) Darlehen: 10.000 €, 0 %, 1.000 €/Monat → 10 Monate, 0 € Zinsen
const l0 = loanSchedule({ principal: 10000, ratePa: 0, monthlyPayment: 1000 }); t('Darlehen 0 %', l0.months === 10 && l0.totalInterest === 0, l0);
// 9) Darlehen 6 %: erste Zinsrate 50 €
const l1 = loanSchedule({ principal: 10000, ratePa: 0.06, monthlyPayment: 300 }); t('Darlehen 6 % Zins Monat 1', l1.rows[0].interest === 50, l1.rows[0]);
t('Rate deckt Zinsen nicht', loanSchedule({ principal: 10000, ratePa: 0.12, monthlyPayment: 50 }).months === Infinity, null);
// 10) CAGR: 100 → 121 in 2 Jahren = 10 %
t('CAGR', near(cagr(100, 121, 2), 0.10, 1e-9), cagr(100, 121, 2));
// 11) Position: 10 Stück, Kauf 50, Kurs 60 → +100 €, +20 %
const pr = positionReturn({ quantity: 10, buyPrice: 50, price: 60 }); t('Positionsrendite', pr.gain === 100 && near(pr.pct, 0.2, 1e-9), pr);
// 12) Steuer: 2.000 € Gewinn, 1.000 € Freibetrag → 1.000 € × 26,375 % = 263,75 €
t('Effektivsteuersatz', near(TAX_DE.effektiv, 0.26375, 1e-9), TAX_DE.effektiv);
const tx = estimateTax({ gain: 2000 }); t('Steuer nach Freibetrag', tx.tax === 263.75 && tx.taxable === 1000, tx);
const tf = estimateTax({ gain: 2000, equityFund: true }); t('Teilfreistellung 30 %', tf.taxable === 400 && tf.tax === 105.5, tf);
// 13) Sparquote: Umbuchung zählt nicht als Ausgabe
const sr = savingsRate([{ amount: 4000 }, { amount: -2500 }, { amount: -500, type: 'transfer' }]); t('Sparquote ohne Umbuchung', near(sr.rate, 0.375, 1e-9) && sr.spend === 2500, sr);
// 14) Ausführungstermine: am 1. jedes Monats, ab 24.11.2026 → 01.12.2026 (Di), 01.01.2027 (Fr), 01.02.2027 (Mo), 01.03.2027 (Mo), 01.04.2027, 01.05.2027 (Sa → Mo 03.05.)
const ex = nextExecutions({ day: 1 }, new Date(2026, 10, 24), 6).map((x) => `${x.getDate()}.${x.getMonth() + 1}.${x.getFullYear()}`);
t('Ausführungstermine', ex.join(' ') === '1.12.2026 1.1.2027 1.2.2027 1.3.2027 1.4.2027 3.5.2027', ex);

console.log(`${fail ? '✖' : '✓'} Finanzmathematik: ${n - fail}/${n} Referenztests bestanden`);
process.exitCode = fail ? 1 : 0;
