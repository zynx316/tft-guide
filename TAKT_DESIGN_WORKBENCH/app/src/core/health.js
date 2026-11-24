// ============================================================================
// GESUNDHEITSRECHNER – Grundumsatz, Gesamtumsatz, Makros, Kalorienziel mit Leitplanken,
// 1RM-Schätzung, Trend, Serie mit Joker, EAN-Prüfziffer, Atwater. Rein, ohne DOM.
// Alle Werte sind Schätzungen zur Orientierung – keine medizinische Beratung.
// Energie in kcal, Gewicht in kg, Größe in cm.
// ============================================================================
import { dayStart, addDays, dayDiff, startOfWeek, toIsoDay, DEFAULT_TODAY } from '../lib/date.js';

const KCAL_PER_KG = 7700;
const num = (v, name) => { if (!Number.isFinite(v) || v <= 0) throw new RangeError(`${name} muss eine positive Zahl sein`); return v; };

/**
 * Grundumsatz nach Mifflin-St-Jeor: 10 · kg + 6,25 · cm − 5 · Alter + (m +5 | w −161 | d −78, Mittel).
 * @param {{sex:'m'|'w'|'d', weightKg:number, heightCm:number, age:number}} p Person; sex akzeptiert auch „male/female/männlich/weiblich/divers“
 * @returns {number} kcal pro Tag (ungerundet)
 */
export function bmrMifflin({ sex, weightKg, heightCm, age }) {
  num(weightKg, 'weightKg'); num(heightCm, 'heightCm'); num(age, 'age');
  const s = String(sex || '').toLowerCase();
  const offset = /^(m|male|männlich|maennlich)/.test(s) ? 5 : /^(w|f|female|weiblich)/.test(s) ? -161 : -78;
  return 10 * weightKg + 6.25 * heightCm - 5 * age + offset;
}

/**
 * Gesamtumsatz = Grundumsatz × Aktivitätsfaktor (auf 1,2 bis 1,9 begrenzt).
 * @param {number} bmr Grundumsatz in kcal
 * @param {number} [activity] 1,2 (sitzend) bis 1,9 (sehr aktiv)
 * @returns {number} kcal pro Tag
 */
export function tdee(bmr, activity = 1.4) {
  num(bmr, 'bmr');
  return bmr * Math.min(1.9, Math.max(1.2, Number.isFinite(activity) ? activity : 1.4));
}

/**
 * Makroziele aus Kalorien: Eiweiß nach Körpergewicht, Fett als Kalorienanteil, Kohlenhydrate als Rest.
 * @param {number} kcal Tagesziel
 * @param {{proteinGPerKg?:number, weightKg:number, fatPct?:number}} o Eiweiß g/kg (1,8), Körpergewicht, Fettanteil (0,28)
 * @returns {{kcal:number, proteinG:number, fatG:number, carbsG:number, proteinKcal:number, fatKcal:number, carbsKcal:number, overflow:boolean}} Gramm und kcal; overflow, wenn Eiweiß und Fett das Ziel schon übersteigen
 */
export function macroTargets(kcal, { proteinGPerKg = 1.8, weightKg, fatPct = 0.28 } = {}) {
  num(kcal, 'kcal'); num(weightKg, 'weightKg');
  const proteinG = proteinGPerKg * weightKg, proteinKcal = proteinG * 4;
  const fatKcal = kcal * fatPct, fatG = fatKcal / 9;
  const rest = kcal - proteinKcal - fatKcal, carbsKcal = Math.max(0, rest);
  return { kcal, proteinG, fatG, carbsG: carbsKcal / 4, proteinKcal, fatKcal, carbsKcal, overflow: rest < 0 };
}

/**
 * Kalorienziel mit Leitplanken: nie unter dem Grundumsatz, Abnahme höchstens 0,75 % des Körpergewichts pro Woche
 * (Standard 0,5 %), unter 18 Jahren kein Defizit. Zunehmen: Überschuss von 10 % (höchstens 500 kcal).
 * @param {{tdee:number, bmr:number, goal:'halten'|'abnehmen'|'zunehmen', weightKg:number, age:number}} p Person und Ziel
 * @returns {{kcal:number, delta:number, weeklyKg:number, goal:string, clamped:boolean, reasons:string[], text:string}} Ziel in kcal (gerundet), Abweichung zum Gesamtumsatz, erwartete Änderung je Woche, Begründungen
 */
export function safeCalorieTarget({ tdee: total, bmr, goal = 'halten', weightKg, age }) {
  num(total, 'tdee'); num(bmr, 'bmr'); num(weightKg, 'weightKg');
  const reasons = []; let clamped = false, kcal = total;
  if (goal === 'abnehmen') {
    if (age < 18) { clamped = true; reasons.push('Unter 18 Jahren gibt es kein Kaloriendefizit – das Ziel bleibt beim Gesamtumsatz.'); }
    else {
      const maxDeficit = (0.0075 * weightKg * KCAL_PER_KG) / 7;
      const wanted = (0.005 * weightKg * KCAL_PER_KG) / 7;
      const deficit = Math.min(wanted, maxDeficit);
      kcal = total - deficit;
      reasons.push(`Defizit von etwa ${Math.round(deficit)} kcal pro Tag (rund 0,5 % deines Gewichts pro Woche); mehr als 0,75 % pro Woche wird nie vorgeschlagen.`);
      if (kcal < bmr) { kcal = bmr; clamped = true; reasons.push(`Das Ziel liegt nie unter dem Grundumsatz (${Math.round(bmr)} kcal), darum wurde es angehoben.`); }
    }
  } else if (goal === 'zunehmen') {
    const surplus = Math.min(0.1 * total, 500);
    kcal = total + surplus;
    reasons.push(`Überschuss von etwa ${Math.round(surplus)} kcal pro Tag (10 %, höchstens 500) für ein ruhiges Aufbautempo.`);
  } else {
    reasons.push('Das Ziel entspricht deinem geschätzten Gesamtumsatz.');
    if (kcal < bmr) { kcal = bmr; clamped = true; reasons.push(`Das Ziel liegt nie unter dem Grundumsatz (${Math.round(bmr)} kcal), darum wurde es angehoben.`); }
  }
  kcal = Math.round(kcal);
  const delta = kcal - Math.round(total);
  return { kcal, delta, weeklyKg: Math.round(((delta * 7) / KCAL_PER_KG) * 100) / 100, goal, clamped, reasons, text: reasons.join(' ') };
}

/**
 * Geschätztes Einwiederholungsmaximum nach Epley: Gewicht · (1 + Wiederholungen / 30); bei 1 Wiederholung das Gewicht selbst.
 * @param {number} weight Gewicht in kg
 * @param {number} reps Wiederholungen (≥ 1)
 * @returns {number} geschätztes 1RM in kg (ungerundet)
 */
export function epley1RM(weight, reps) {
  num(weight, 'weight'); num(reps, 'reps');
  return reps === 1 ? weight : weight * (1 + reps / 30);
}

/**
 * Exponentiell geglätteter Trend (z. B. Gewicht): s₀ = x₀, sₜ = sₜ₋₁ + α · (xₜ − sₜ₋₁). Lücken (null/NaN) behalten den letzten Trendwert.
 * @param {Array<number|null>} values Messwerte, älteste zuerst
 * @param {number} [alpha] Glättung 0 bis 1 (Standard 0,1)
 * @returns {Array<number|null>} Trendwerte gleicher Länge (vor dem ersten Messwert null)
 */
export function ewmaTrend(values, alpha = 0.1) {
  let s = null;
  return values.map((x) => {
    if (Number.isFinite(x)) s = s === null ? x : s + alpha * (x - s);
    return s;
  });
}

/**
 * Serie mit Joker: ein verpasster Tag unterbricht die Serie nicht, solange in dieser Kalenderwoche (Mo–So) noch ein Joker frei ist.
 * Joker-Tage halten die Serie, zählen aber nicht mit. Ist heute noch offen, bricht das die Serie nicht und verbraucht keinen Joker.
 * @param {Array<boolean|string|Date>} days Entweder Wahrheitswerte je Tag (älteste zuerst, letzter Eintrag = heute) oder die erledigten Tage als Datum
 * @param {{jokersPerWeek?:number, today?:Date|string}} [o] Joker je Woche (1), Bezugstag (Standard DEFAULT_TODAY)
 * @returns {{current:number, best:number, jokersUsed:number, jokersLeftThisWeek:number}} aktuelle und beste Serie, Joker in der aktuellen Serie
 */
export function streakWithJoker(days, { jokersPerWeek = 1, today = DEFAULT_TODAY } = {}) {
  const end = dayStart(today);
  const done = new Set();
  if (days.length && typeof days[0] === 'boolean') days.forEach((v, i) => { if (v) done.add(toIsoDay(addDays(end, i - days.length + 1))); });
  else days.forEach((v) => { const d = dayStart(v); if (d <= end) done.add(toIsoDay(d)); });
  const weekKey = (d) => toIsoDay(startOfWeek(d));
  const used = new Map();                                    // Joker je Woche
  const left = (d) => jokersPerWeek - (used.get(weekKey(d)) || 0);
  const first = [...done].sort()[0];
  if (!first) return { current: 0, best: 0, jokersUsed: 0, jokersLeftThisWeek: jokersPerWeek };
  let run = 0, best = 0, runJokers = 0, gap = [];
  const bridge = (days2) => {                                // alle Lückentage mit Jokern füllen, sonst nichts verbrauchen
    const need = new Map();
    for (const d of days2) need.set(weekKey(d), (need.get(weekKey(d)) || 0) + 1);
    if ([...need].some(([k, c]) => (used.get(k) || 0) + c > jokersPerWeek)) return false;
    for (const [k, c] of need) used.set(k, (used.get(k) || 0) + c);
    return true;
  };
  for (let d = dayStart(first); d <= end; d = addDays(d, 1)) {
    if (done.has(toIsoDay(d))) {
      if (!run) { run = 1; runJokers = 0; }
      else if (!gap.length) run += 1;
      else if (bridge(gap)) { run += 1; runJokers += gap.length; }
      else { run = 1; runJokers = 0; }
      gap = []; best = Math.max(best, run);
    } else if (!(dayDiff(d, end) === 0)) gap.push(d);        // der heutige offene Tag zählt nicht als Lücke
  }
  let current = run, jokersUsed = runJokers;
  if (gap.length) { if (bridge(gap)) jokersUsed += gap.length; else { current = 0; jokersUsed = 0; } }
  return { current, best, jokersUsed, jokersLeftThisWeek: Math.max(0, left(end)) };
}

/**
 * Prüfziffer eines EAN-13 oder EAN-8 (Gewichte 3, 1, 3 … von rechts neben der Prüfziffer).
 * @param {string|number} code Strichcode (Leerzeichen werden ignoriert)
 * @returns {boolean} gültig?
 */
export function eanValid(code) {
  const s = String(code ?? '').replace(/\s+/g, '');
  if (!/^(\d{8}|\d{13})$/.test(s)) return false;
  const digits = [...s].map(Number), check = digits.pop();
  const sum = digits.reverse().reduce((a, d, i) => a + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

/**
 * Energie aus Nährwerten nach Atwater: 4 kcal/g Eiweiß und Kohlenhydrate, 9 kcal/g Fett, 7 kcal/g Alkohol.
 * @param {{protein?:number, carbs?:number, fat?:number, alcohol?:number}} m Gramm
 * @returns {number} kcal
 */
export function atwaterKcal({ protein = 0, carbs = 0, fat = 0, alcohol = 0 } = {}) {
  return 4 * protein + 4 * carbs + 9 * fat + 7 * alcohol;
}

/**
 * Passt die angegebene Energie zu den Nährwerten? Abweichung höchstens tol (relativ), mindestens aber 5 kcal Rundungsspielraum.
 * @param {number} kcal angegebene Energie
 * @param {{protein?:number, carbs?:number, fat?:number, alcohol?:number}} macros Gramm
 * @param {number} [tol] relative Toleranz (Standard 0,12)
 * @returns {boolean} plausibel?
 */
export function atwaterPlausible(kcal, macros, tol = 0.12) {
  const calc = atwaterKcal(macros);
  return Math.abs(kcal - calc) <= Math.max(5, tol * Math.max(kcal, calc));
}
