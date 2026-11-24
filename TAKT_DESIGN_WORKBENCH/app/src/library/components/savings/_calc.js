// Sparpläne – Rechner-Zustand (ctx.ui.calc) und Projektionen. Mathematik: ausschließlich core/finmath.js.
// Konvention (aus dem Kern): Rendite p. a. nach Kosten, monatlich umgerechnet, Einzahlung am Monatsende.
import { projectSavings, savingsScenarios, requiredMonthly, estimateTax, TAX_DE } from '../../../core/finmath.js';
import { obj, r2, clamp } from './_savings.js';

export const INFLATION = 0.02;           // Annahme für „heutige Kaufkraft“
export const SPREAD = 0.02;              // Spanne ± 2 Prozentpunkte um die Annahme (3 % · 5 % · 7 %)
export const CALC_DEFAULT = { initial: 10000, monthly: 300, years: 20, ratePa: 0.05, costPa: 0.002, dynamicPa: 0, real: false, tax: false };
export const CALC_LIMITS = {
  initial: { min: 0, max: 100000, step: 500, label: 'Startbetrag', unit: '€' },
  monthly: { min: 0, max: 2000, step: 25, label: 'Monatliche Rate', unit: '€' },
  years: { min: 1, max: 50, step: 1, label: 'Laufzeit', unit: 'Jahre' },
  ratePa: { min: 0, max: 0.12, step: 0.005, label: 'Rendite p. a. (Annahme)', unit: '%' },
  costPa: { min: 0, max: 0.02, step: 0.0005, label: 'Kosten p. a. (TER)', unit: '%' },
  dynamicPa: { min: 0, max: 0.1, step: 0.005, label: 'Ratensteigerung p. a.', unit: '%' },
};
export const SCENARIO_NAMES = { vorsichtig: 'Vorsichtig', annahme: 'Annahme', zuversichtlich: 'Zuversichtlich' };

export const getCalc = (ctx, base = {}) => ({ ...CALC_DEFAULT, ...obj(base), ...obj(ctx.ui?.calc) });
export const setCalc = (ctx, patch, base) => ctx.setUi('calc', { ...getCalc(ctx, base), ...patch });

const cache = new Map();
/** Projektion in drei Annahmen (Annahme ± 2 PP). Ergebnis je Szenario: finmath-Projektion plus optional Steuer-Schätzung. */
export function runCalc(c) {
  const key = JSON.stringify(c);
  if (cache.has(key)) return cache.get(key);
  const adj = (r) => (c.real ? (1 + r) / (1 + INFLATION) - 1 : r);
  const rates = { vorsichtig: adj(Math.max(0, c.ratePa - SPREAD)), annahme: adj(c.ratePa), zuversichtlich: adj(c.ratePa + SPREAD) };
  const sc = savingsScenarios({ monthly: c.monthly, initial: c.initial, years: c.years, costPa: c.costPa, dynamicPa: c.dynamicPa }, rates);
  const out = { calc: c, rates, nominal: { vorsichtig: Math.max(0, c.ratePa - SPREAD), annahme: c.ratePa, zuversichtlich: c.ratePa + SPREAD } };
  for (const [k, v] of Object.entries(sc)) {
    const tax = c.tax ? estimateTax({ gain: Math.max(0, v.gain), allowanceLeft: TAX_DE.sparerPauschbetrag.single, equityFund: true }).tax : 0;
    out[k] = { ...v, tax, net: r2(v.value - tax) };
  }
  cache.set(key, out); if (cache.size > 40) cache.delete(cache.keys().next().value);
  return out;
}

/** Punkte für das Wachstumsdiagramm (Annahme + Spanne). */
export function calcPoints(run, step = 1) {
  const a = run.annahme.series, lo = run.vorsichtig.series, hi = run.zuversichtlich.series;
  const out = [];
  a.forEach((p, i) => { if (i % step === 0 || i === a.length - 1) out.push({ m: p.month, invested: p.invested, value: p.value, low: lo[i].value, high: hi[i].value }); });
  return out;
}

/** Meilensteine der Annahme-Kurve: erster Monat, in dem der Wert die Schwelle erreicht. */
export function milestones(run, ctxMax = 6) {
  const s = run.annahme.series, end = s[s.length - 1].value, start = s[0].value;
  const marks = [10000, 25000, 50000, 100000, 250000, 500000, 1000000].filter((t) => t > start && t <= end);
  return marks.slice(-ctxMax).map((t) => ({ target: t, month: s.find((p) => p.value >= t).month }));
}

/** Zielrechner rückwärts: nötige Monatsrate (Kern: requiredMonthly) für Annahme ± 2 PP. */
export function neededMonthly({ target, current = 0, years, ratePa }) {
  const months = Math.max(1, Math.round(years * 12));
  const at = (r) => requiredMonthly({ target, current, months, ratePa: r });
  return { annahme: at(ratePa), vorsichtig: at(Math.max(0, ratePa - SPREAD)), zuversichtlich: at(ratePa + SPREAD), months };
}

/** Vorwärts-Projektion eines Plans ab dem heutigen Wert (für Plan-Detail und Szenarien). */
export function forwardRun({ monthly, initial, ratePa, years, dynamicPa = 0, costPa = 0 }) {
  return runCalc({ ...CALC_DEFAULT, monthly, initial, ratePa, years: clamp(years, 1, 50), dynamicPa, costPa, real: false, tax: false });
}
export { projectSavings };
