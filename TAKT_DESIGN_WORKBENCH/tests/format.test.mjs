import './_helpers.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NB, MINUS } from './_helpers.mjs';
import {
  fmtMoney, fmtPercent, fmtPP, fmtNumber, fmtDate, fmtTime, fmtRelativeDay, fmtDuration, fmtWeight, maskMoney, FORMAT_EXAMPLES,
} from '../app/src/lib/format.js';

test('FORMAT_EXAMPLES enthält genau 14 Referenzwerte mit eindeutiger ID', () => {
  assert.equal(FORMAT_EXAMPLES.length, 14);
  assert.equal(new Set(FORMAT_EXAMPLES.map((e) => e.id)).size, 14);
});

for (const ex of FORMAT_EXAMPLES) {
  test(`Referenzwert ${ex.id}: ${ex.call}`, () => assert.equal(ex.run(), ex.expected));
}

test('Referenzwerte sind wörtlich wie im Auftrag (0, −0,01, 1.234.567,89, 9.999.999,99, 0,5 %)', () => {
  assert.equal(fmtMoney(0), `0,00${NB}€`);
  assert.equal(fmtMoney(-0.01), `${MINUS}0,01${NB}€`);
  assert.equal(fmtMoney(1234567.89), `1.234.567,89${NB}€`);
  assert.equal(fmtMoney(9999999.99), `9.999.999,99${NB}€`);
  assert.equal(fmtPercent(0.005), `0,5${NB}%`);
});

test('Einheit, Währung und Prozent haben ein geschütztes Leerzeichen, kein normales', () => {
  for (const s of [fmtMoney(5), fmtPercent(0.1), fmtPP(0.01), fmtWeight(70), fmtNumber(3, { unit: 'km' })]) {
    assert.ok(s.includes(NB), s);
    assert.ok(!/\d [^\d]/.test(s) || s.includes('Std.'), `normales Leerzeichen in „${s}“`);
  }
});

test('Negative Werte nutzen U+2212, nie den Bindestrich', () => {
  for (const s of [fmtMoney(-5), fmtPercent(-0.2), fmtPP(-0.01), fmtNumber(-3), fmtWeight(-0.4), fmtDuration(-30)]) {
    assert.ok(s.startsWith(MINUS), s);
    assert.ok(!s.includes('-'), s);
  }
});

test('sign:true setzt Plus bzw. Minus, Null bleibt vorzeichenlos', () => {
  assert.equal(fmtMoney(5, { sign: true }), `+5,00${NB}€`);
  assert.equal(fmtMoney(0, { sign: true }), `0,00${NB}€`);
  assert.equal(fmtPercent(0.031, { sign: true }), `+3,1${NB}%`);
  assert.equal(fmtNumber(2, { sign: true, unit: 'kg' }), `+2${NB}kg`);
});

test('Ein Wert, der auf 0 rundet, bekommt kein Minus', () => {
  assert.equal(fmtMoney(-0.001), `0,00${NB}€`);
  assert.equal(fmtMoney(-0), `0,00${NB}€`);
  assert.equal(fmtPercent(-0.00001), `0,0${NB}%`);
  assert.equal(fmtPP(-0.00001), `0,0${NB}PP`);
});

test('fmtMoney: ganze Euro, Fremdwährung, Kurzform', () => {
  assert.equal(fmtMoney(1999.5, { cents: false }), `2.000${NB}€`);
  assert.equal(fmtMoney(10, { currency: 'USD' }), `10,00${NB}$`);
  assert.equal(fmtMoney(15000, { compact: true }), `15,0${NB}Tsd.${NB}€`);
  assert.equal(fmtMoney(9999, { compact: true }), `9.999,00${NB}€`);
});

test('Fehlende oder ungültige Werte werden zu „–“', () => {
  for (const f of [fmtMoney, fmtPercent, fmtPP, fmtNumber, fmtWeight, fmtDuration, fmtDate, fmtTime]) {
    assert.equal(f(null), '–', f.name);
    assert.equal(f(undefined), '–', f.name);
    assert.equal(f(NaN), '–', f.name);
  }
  assert.equal(fmtMoney(Infinity), '–');
  assert.equal(fmtDate('kein Datum'), '–');
});

test('fmtNumber: Standard höchstens 2 Stellen, digits fest, Tausenderpunkt', () => {
  assert.equal(fmtNumber(1234.5), '1.234,5');
  assert.equal(fmtNumber(1234.567), '1.234,57');
  assert.equal(fmtNumber(1234, { digits: 2 }), '1.234,00');
  assert.equal(fmtNumber(12, { unit: 'kcal' }), `12${NB}kcal`);
});

test('fmtPercent und fmtPP: Stellen und Gleitkommafallen', () => {
  assert.equal(fmtPercent(0.07, { digits: 0 }), `7${NB}%`);
  assert.equal(fmtPercent(0.145, { digits: 1 }), `14,5${NB}%`);
  assert.equal(fmtPercent(1.5), `150,0${NB}%`);
  assert.equal(fmtPP(0.07 - 0.058), `+1,2${NB}PP`);
  assert.equal(fmtPP(-0.025, { digits: 1 }), `${MINUS}2,5${NB}PP`);
  assert.equal(fmtPP(0.01, { digits: 0, sign: false }), `1${NB}PP`);
});

test('fmtDuration: Minuten, volle Stunden, Null, lange Dauer', () => {
  assert.equal(fmtDuration(45), `45${NB}Min.`);
  assert.equal(fmtDuration(120), `2${NB}Std.`);
  assert.equal(fmtDuration(0), `0${NB}Min.`);
  assert.equal(fmtDuration(59.6), `1${NB}Std.`);
  assert.equal(fmtDuration(1565), `26${NB}Std. 5${NB}Min.`);
});

test('fmtWeight: eine Nachkommastelle, anpassbar', () => {
  assert.equal(fmtWeight(82), `82,0${NB}kg`);
  assert.equal(fmtWeight(0.45, { digits: 2 }), `0,45${NB}kg`);
  assert.equal(fmtWeight(1234.5), `1.234,5${NB}kg`);
});

test('fmtDate: vier Darstellungen, auch aus Text', () => {
  const d = new Date(2026, 10, 24, 9, 30);
  assert.equal(fmtDate(d, { style: 'short' }), '24.11.');
  assert.equal(fmtDate(d), '24.11.2026');
  assert.equal(fmtDate(d, { style: 'medium' }), '24.11.2026');
  assert.equal(fmtDate(d, { style: 'long' }), '24. November 2026');
  assert.equal(fmtDate(d, { style: 'weekday' }), 'Di, 24.11.');
  assert.equal(fmtDate('2026-03-05'), '05.03.2026');
  assert.equal(fmtDate('2026-12-31', { style: 'weekday' }), 'Do, 31.12.');
});

test('fmtTime: 24-Stunden-Uhr, optional „Uhr“', () => {
  assert.equal(fmtTime(new Date(2026, 10, 24, 9, 5)), '09:05');
  assert.equal(fmtTime(new Date(2026, 10, 24, 23, 59), { suffix: true }), `23:59${NB}Uhr`);
  assert.equal(fmtTime('2026-11-24T07:30'), '07:30');
});

test('fmtRelativeDay: heute, morgen, gestern, Wochentag, „in n Tagen“', () => {
  const today = new Date(2026, 10, 24, 9, 30);
  const at = (n) => new Date(2026, 10, 24 + n, 18, 0);
  assert.equal(fmtRelativeDay(at(0), today), 'heute');
  assert.equal(fmtRelativeDay(at(1), today), 'morgen');
  assert.equal(fmtRelativeDay(at(-1), today), 'gestern');
  assert.equal(fmtRelativeDay(at(2), today), 'Do');
  assert.equal(fmtRelativeDay(at(4), today), 'Sa');
  assert.equal(fmtRelativeDay(at(5), today), 'in 5 Tagen');
  assert.equal(fmtRelativeDay(at(-3), today), 'vor 3 Tagen');
  assert.equal(fmtRelativeDay(at(20), today), '14.12.');
  assert.equal(fmtRelativeDay(new Date(2027, 2, 1), today), '01.03.2027');
});

test('maskMoney: gleich breit, verrät den Betrag nicht, behält die Währung', () => {
  const a = maskMoney(fmtMoney(5)), b = maskMoney(fmtMoney(-1234567.89));
  assert.equal(a, `••••${NB}€`);
  assert.equal(a, b);
  assert.equal(maskMoney('1.234,50'), '••••');
  assert.equal(maskMoney(), '••••');
});

test('format.js ist rein: keine DOM-Globals nötig', () => {
  assert.equal(typeof document, 'undefined');
  assert.equal(typeof window, 'undefined');
  assert.equal(fmtMoney(1), `1,00${NB}€`);
});

test('Prozent: Gleitkomma-Rauschen verfälscht das Runden nicht (0,145 → 15 %)', () => {
  assert.equal(fmtPercent(0.145, { digits: 0 }), `15${NB}%`);
  assert.equal(fmtPercent(0.0105), `1,1${NB}%`);
  assert.equal(fmtPP(0.285, { digits: 0 }), `+29${NB}PP`);
});

test('Geld kompakt: Skala wird nach dem Runden gewählt', () => {
  assert.equal(fmtMoney(12345, { compact: true }), `12,3${NB}Tsd.${NB}€`);
  assert.equal(fmtMoney(999999.9, { compact: true }), `1,0${NB}Mio.${NB}€`);
  assert.equal(fmtMoney(-1234567, { compact: true, sign: true }), `${MINUS}1,2${NB}Mio.${NB}€`);
});
