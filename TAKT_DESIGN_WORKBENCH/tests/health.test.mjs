import './_helpers.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { near } from './_helpers.mjs';
import {
  bmrMifflin, tdee, macroTargets, safeCalorieTarget, epley1RM, ewmaTrend, streakWithJoker, eanValid, atwaterKcal, atwaterPlausible,
} from '../app/src/core/health.js';

const TODAY = new Date(2026, 10, 24, 9, 30);       // Dienstag
const streak = (days, o) => streakWithJoker(days, { today: TODAY, ...o });

test('Mifflin-St-Jeor: bekannte Werte auf ±1 kcal', () => {
  assert.ok(near(bmrMifflin({ sex: 'm', weightKg: 80, heightCm: 180, age: 30 }), 1780, 1));
  assert.ok(near(bmrMifflin({ sex: 'w', weightKg: 60, heightCm: 165, age: 25 }), 1345.25, 1));
  assert.ok(near(bmrMifflin({ sex: 'w', weightKg: 70, heightCm: 170, age: 35 }), 1426.5, 1));
  assert.ok(near(bmrMifflin({ sex: 'm', weightKg: 100, heightCm: 190, age: 45 }), 1967.5, 1));
});

test('Mifflin: Geschlechterschreibweisen und „divers“ als Mittelwert', () => {
  const base = { weightKg: 70, heightCm: 170, age: 30 };
  const m = bmrMifflin({ sex: 'männlich', ...base }), w = bmrMifflin({ sex: 'weiblich', ...base }), d = bmrMifflin({ sex: 'd', ...base });
  assert.equal(m, bmrMifflin({ sex: 'male', ...base }));
  assert.equal(w, bmrMifflin({ sex: 'f', ...base }));
  assert.equal(m - w, 166);
  assert.ok(near(d, (m + w) / 2, 0.001));
});

test('Mifflin: ungültige Eingaben werfen RangeError', () => {
  assert.throws(() => bmrMifflin({ sex: 'm', weightKg: 0, heightCm: 180, age: 30 }), RangeError);
  assert.throws(() => bmrMifflin({ sex: 'm', weightKg: 80, heightCm: NaN, age: 30 }), RangeError);
  assert.throws(() => bmrMifflin({ sex: 'm', weightKg: 80, heightCm: 180, age: -1 }), RangeError);
});

test('Gesamtumsatz: Faktor wird auf 1,2 bis 1,9 begrenzt', () => {
  assert.ok(near(tdee(1780, 1.55), 2759, 0.01));
  assert.ok(near(tdee(1500, 1.0), 1800, 0.01));
  assert.ok(near(tdee(1500, 3), 2850, 0.01));
  assert.ok(near(tdee(1500), 2100, 0.01));
});

test('Makroziele: Gramm und Kalorien passen zum Ziel', () => {
  const m = macroTargets(2500, { weightKg: 80 });
  assert.ok(near(m.proteinG, 144, 0.01));
  assert.ok(near(m.fatG, 77.78, 0.01));
  assert.ok(near(m.carbsG, 306, 0.01));
  assert.ok(near(m.proteinKcal + m.fatKcal + m.carbsKcal, 2500, 0.001));
  assert.equal(m.overflow, false);
  assert.ok(near(atwaterKcal({ protein: m.proteinG, fat: m.fatG, carbs: m.carbsG }), 2500, 0.001));
});

test('Makroziele: eigene Parameter, Überlauf bei zu wenig Kalorien', () => {
  const m = macroTargets(1200, { weightKg: 100, proteinGPerKg: 2.2, fatPct: 0.3 });
  assert.equal(m.overflow, true);
  assert.equal(m.carbsG, 0);
  assert.ok(near(m.proteinG, 220, 0.001));
});

test('Kalorienziel „halten“ entspricht dem Gesamtumsatz', () => {
  const r = safeCalorieTarget({ tdee: 2400, bmr: 1700, goal: 'halten', weightKg: 80, age: 30 });
  assert.equal(r.kcal, 2400);
  assert.equal(r.delta, 0);
  assert.equal(r.clamped, false);
  assert.ok(r.text.length > 10);
});

test('Leitplanke: Abnahme höchstens 0,75 % Körpergewicht pro Woche, Standard 0,5 %', () => {
  const r = safeCalorieTarget({ tdee: 2800, bmr: 1780, goal: 'abnehmen', weightKg: 80, age: 30 });
  assert.equal(r.kcal, 2800 - 440);
  assert.ok(-r.weeklyKg <= 0.0075 * 80 + 1e-9, `Wochenverlust ${r.weeklyKg}`);
  assert.ok(r.text.includes('0,75'));
});

test('Leitplanke: nie unter dem Grundumsatz', () => {
  const r = safeCalorieTarget({ tdee: 1800, bmr: 1700, goal: 'abnehmen', weightKg: 90, age: 40 });
  assert.equal(r.kcal, 1700);
  assert.equal(r.clamped, true);
  assert.ok(r.reasons.some((x) => x.includes('Grundumsatz')));
});

test('Leitplanke: unter 18 kein Defizit', () => {
  const r = safeCalorieTarget({ tdee: 2600, bmr: 1700, goal: 'abnehmen', weightKg: 70, age: 17 });
  assert.equal(r.kcal, 2600);
  assert.equal(r.delta, 0);
  assert.equal(r.clamped, true);
  assert.ok(r.text.includes('Unter 18'));
});

test('Kalorienziel „zunehmen“: 10 % Überschuss, höchstens 500 kcal', () => {
  assert.equal(safeCalorieTarget({ tdee: 2000, bmr: 1500, goal: 'zunehmen', weightKg: 60, age: 25 }).kcal, 2200);
  assert.equal(safeCalorieTarget({ tdee: 6000, bmr: 2000, goal: 'zunehmen', weightKg: 90, age: 25 }).kcal, 6500);
});

test('Kalorienziel: nur sachliche Begründungstexte ohne Verbotsbegriffe', () => {
  for (const goal of ['halten', 'abnehmen', 'zunehmen']) {
    const t = safeCalorieTarget({ tdee: 2400, bmr: 1700, goal, weightKg: 80, age: 30 }).text;
    assert.ok(!/Sünde|abtrainieren|versagt|verbrennen/i.test(t), t);
  }
});

test('Epley: 80 kg × 5 ≈ 93,3 kg, eine Wiederholung bleibt das Gewicht', () => {
  assert.ok(near(epley1RM(80, 5), 93.3333, 0.001));
  assert.equal(epley1RM(100, 1), 100);
  assert.ok(near(epley1RM(60, 10), 80, 0.001));
  assert.throws(() => epley1RM(80, 0), RangeError);
});

test('ewmaTrend: Startwert, Glättung, Lücken, Konstante bleibt konstant', () => {
  assert.deepEqual(ewmaTrend([80, 80, 80]), [80, 80, 80]);
  const t = ewmaTrend([80, 81, null, 79], 0.5);
  assert.deepEqual(t, [80, 80.5, 80.5, 79.75]);
  assert.deepEqual(ewmaTrend([null, 70]), [null, 70]);
  assert.deepEqual(ewmaTrend([]), []);
  assert.ok(near(ewmaTrend([80, 81])[1], 80.1, 1e-9));
});

test('Serie ohne Lücke zählt jeden Tag', () => {
  assert.deepEqual(streak([true, true, true, true, true]), { current: 5, best: 5, jokersUsed: 0, jokersLeftThisWeek: 1 });
});

test('Serie: ein verpasster Tag wird durch den Wochen-Joker überbrückt', () => {
  const r = streak([true, true, false, true, true]);       // Fr, Sa, So (verpasst), Mo, Di
  assert.equal(r.current, 4);
  assert.equal(r.jokersUsed, 1);
  assert.equal(r.jokersLeftThisWeek, 1);
});

test('Serie: zwei verpasste Tage in einer Woche brechen sie, danach beginnt sie neu', () => {
  const r = streak([true, true, true, false, false, true, true]);   // Sa, So, Mo… Joker nur 1 je Woche
  assert.equal(r.current, 2);
  assert.equal(r.best, 3);
});

test('Serie: mit zwei Jokern pro Woche hält auch die doppelte Lücke', () => {
  const r = streak([true, false, false, true, true], { jokersPerWeek: 2 });
  assert.equal(r.current, 3);
  assert.equal(r.jokersUsed, 2);
});

test('Serie: heute noch offen bricht nichts und verbraucht keinen Joker', () => {
  const r = streak([true, true, true, false]);
  assert.equal(r.current, 3);
  assert.equal(r.jokersUsed, 0);
  assert.equal(r.jokersLeftThisWeek, 1);
});

test('Serie: gestern verpasst nutzt den Joker, zwei verpasste Tage derselben Woche beenden sie', () => {
  const donnerstag = new Date(2026, 10, 26);
  assert.equal(streakWithJoker([true, true, true, false, false, false], { today: donnerstag }).current, 0);
  assert.equal(streakWithJoker([true, true, true, true, false, false], { today: donnerstag }).current, 4);
  const r = streak([true, true, false, false]);
  assert.equal(r.current, 2);
  assert.equal(r.jokersUsed, 1);
  assert.equal(r.jokersLeftThisWeek, 0);
});

test('Serie: Datumsliste statt Wahrheitswerten, beste Serie bleibt erhalten', () => {
  const days = ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-20', '2026-11-23', '2026-11-24'];
  const r = streak(days);
  assert.equal(r.best, 6);
  assert.equal(r.current, 2);
  assert.deepEqual(streak([]), { current: 0, best: 0, jokersUsed: 0, jokersLeftThisWeek: 1 });
});

test('EAN: gültige und ungültige Prüfziffern (13 und 8 Stellen)', () => {
  for (const ok of ['4006381333931', '5901234123457', '9780201379624', '96385074', '73513537', ' 4006381333931 ', 4006381333931]) assert.equal(eanValid(ok), true, String(ok));
  for (const bad of ['4006381333932', '5901234123458', '96385075', '123', '', 'abcdefghijklm', '40063813339311', null]) assert.equal(eanValid(bad), false, String(bad));
});

test('Atwater: 4/4/9/7 kcal je Gramm', () => {
  assert.equal(atwaterKcal({ protein: 10, carbs: 20, fat: 5 }), 165);
  assert.equal(atwaterKcal({ alcohol: 10 }), 70);
  assert.equal(atwaterKcal({}), 0);
});

test('Atwater-Plausibilität: Toleranz 12 %, kleiner Rundungsspielraum', () => {
  assert.equal(atwaterPlausible(165, { protein: 10, carbs: 20, fat: 5 }), true);
  assert.equal(atwaterPlausible(180, { protein: 10, carbs: 20, fat: 5 }), true);
  assert.equal(atwaterPlausible(250, { protein: 10, carbs: 20, fat: 5 }), false);
  assert.equal(atwaterPlausible(0, {}), true);
  assert.equal(atwaterPlausible(4, { carbs: 0.4 }), true);
  assert.equal(atwaterPlausible(200, { protein: 10, carbs: 20, fat: 5 }, 0.3), true);
  assert.equal(atwaterPlausible(500, { protein: 10 }), false);
});

test('Leitplanke gilt auch für „halten“: Ziel nie unter dem Grundumsatz', () => {
  const r = safeCalorieTarget({ tdee: 1500, bmr: 1600, goal: 'halten', weightKg: 60, age: 30 });
  assert.equal(r.kcal, 1600);
  assert.equal(r.clamped, true);
  assert.ok(r.reasons.some((x) => x.includes('Grundumsatz')));
});
