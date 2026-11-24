import './_helpers.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BERLIN, ymd, ymdhm } from './_helpers.mjs';
import { nextOccurrences, describeRule, validateRule } from '../app/src/core/recurrence.js';

const at = (y, m, d, h = 9, mi = 30) => new Date(y, m - 1, d, h, mi);
const days = (list) => list.map(ymd);

test('Zeitzone der Testläufe ist Europe/Berlin (Voraussetzung für die Sommerzeit-Tests)', () => assert.ok(BERLIN));

test('täglich: ab einschließlich heute, Uhrzeit bleibt', () => {
  const r = nextOccurrences({ freq: 'daily' }, at(2026, 11, 24), 3);
  assert.deepEqual(r.map(ymdhm), ['2026-11-24 09:30', '2026-11-25 09:30', '2026-11-26 09:30']);
});

test('alle 3 Tage zählt vom Ankertermin', () => {
  const r = nextOccurrences({ freq: 'daily', interval: 3, start: '2026-11-20' }, at(2026, 11, 24), 3);
  assert.deepEqual(days(r), ['2026-11-26', '2026-11-29', '2026-12-02']);
});

test('wöchentlich ohne Wochentag nimmt den Wochentag des Starts', () => {
  assert.deepEqual(days(nextOccurrences({ freq: 'weekly' }, at(2026, 11, 24), 3)), ['2026-11-24', '2026-12-01', '2026-12-08']);
});

test('wöchentlich Mo/Mi/Fr', () => {
  const r = nextOccurrences({ freq: 'weekly', byWeekday: [1, 3, 5] }, at(2026, 11, 24), 4);
  assert.deepEqual(days(r), ['2026-11-25', '2026-11-27', '2026-11-30', '2026-12-02']);
});

test('jeden 2. Dienstag (alle zwei Wochen) mit Wochenanker', () => {
  const r = nextOccurrences({ freq: 'weekly', interval: 2, byWeekday: [2] }, at(2026, 11, 24), 3);
  assert.deepEqual(days(r), ['2026-11-24', '2026-12-08', '2026-12-22']);
});

test('zweiwöchentlich: Wochentag vor dem Start in derselben Woche wird nicht rückwärts gezählt', () => {
  const r = nextOccurrences({ freq: 'weekly', interval: 2, byWeekday: [1, 5] }, at(2026, 11, 24), 3);
  assert.deepEqual(days(r), ['2026-11-27', '2026-12-07', '2026-12-11']);
});

test('Monatsende: Tag 31 rutscht in kürzeren Monaten aufs Monatsende', () => {
  const r = nextOccurrences({ freq: 'monthly', byMonthDay: 31 }, at(2026, 1, 31), 6);
  assert.deepEqual(days(r), ['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30', '2026-05-31', '2026-06-30']);
});

test('Monatsende: byMonthDay -1 und Tag 30 im Februar', () => {
  assert.deepEqual(days(nextOccurrences({ freq: 'monthly', byMonthDay: -1 }, at(2026, 11, 24), 3)), ['2026-11-30', '2026-12-31', '2027-01-31']);
  assert.deepEqual(days(nextOccurrences({ freq: 'monthly', byMonthDay: 30 }, at(2027, 1, 31), 2)), ['2027-02-28', '2027-03-30']);
});

test('Schaltjahr: Februarende 2028 hat 29 Tage, 2027 nur 28', () => {
  assert.deepEqual(days(nextOccurrences({ freq: 'monthly', byMonthDay: 31 }, at(2028, 1, 31), 2)), ['2028-01-31', '2028-02-29']);
  assert.deepEqual(days(nextOccurrences({ freq: 'monthly', byMonthDay: 31 }, at(2027, 1, 31), 2)), ['2027-01-31', '2027-02-28']);
});

test('Schaltjahr: jährlich am 29. Februar fällt sonst auf den 28.', () => {
  const r = nextOccurrences({ freq: 'yearly' }, at(2028, 2, 29), 4);
  assert.deepEqual(days(r), ['2028-02-29', '2029-02-28', '2030-02-28', '2031-02-28']);
  assert.deepEqual(days(nextOccurrences({ freq: 'yearly' }, at(2028, 2, 29), 1, {}).concat(nextOccurrences({ freq: 'yearly', interval: 4, start: '2028-02-29' }, at(2028, 2, 29), 2))), ['2028-02-29', '2028-02-29', '2032-02-29']);
});

test('n-ter Wochentag: jeden 2. Dienstag im Monat', () => {
  const r = nextOccurrences({ freq: 'monthly', byWeekday: [2], bySetPos: 2 }, at(2026, 11, 24), 3);
  assert.deepEqual(days(r), ['2026-12-08', '2027-01-12', '2027-02-09']);
});

test('letzter Wochentag: jeden Monat am letzten Freitag', () => {
  const r = nextOccurrences({ freq: 'monthly', byWeekday: [5], bySetPos: -1 }, at(2026, 11, 24), 4);
  assert.deepEqual(days(r), ['2026-11-27', '2026-12-25', '2027-01-29', '2027-02-26']);
});

test('Sommerzeitbeginn 29.03.2026: Uhrzeit 09:30 bleibt lokal gleich', () => {
  const r = nextOccurrences({ freq: 'daily' }, at(2026, 3, 27), 4);
  assert.deepEqual(r.map(ymdhm), ['2026-03-27 09:30', '2026-03-28 09:30', '2026-03-29 09:30', '2026-03-30 09:30']);
  // Der 29.03. hat nur 23 Stunden: 09:30 am 28. bis 09:30 am 29. sind 23 h
  assert.equal((r[2] - r[1]) / 36e5, BERLIN ? 23 : 24);
});

test('Sommerzeitende 25.10.2026: Uhrzeit 09:30 bleibt, der Tag hat 25 Stunden', () => {
  const r = nextOccurrences({ freq: 'daily' }, at(2026, 10, 24), 3);
  assert.deepEqual(r.map(ymdhm), ['2026-10-24 09:30', '2026-10-25 09:30', '2026-10-26 09:30']);
  assert.equal((r[1] - r[0]) / 36e5, BERLIN ? 25 : 24);
});

test('Sommerzeit: wöchentlich über beide Wechsel ohne Stundenverschiebung', () => {
  for (const [from, until] of [[at(2026, 3, 24, 7, 0), '2026-04-07'], [at(2026, 10, 20, 22, 15), '2026-11-03']]) {
    const r = nextOccurrences({ freq: 'weekly', until }, from, 10);
    assert.equal(r.length, 3);
    assert.ok(r.every((d) => d.getHours() === from.getHours() && d.getMinutes() === from.getMinutes()), r.map(ymdhm).join(', '));
  }
});

test('nach Erledigung: letzte Erledigung plus Abstand, danach im gleichen Abstand', () => {
  const rule = { freq: 'afterDone', afterDoneDays: 3 };
  const r = nextOccurrences(rule, at(2026, 11, 24), 3, { lastDone: at(2026, 11, 23, 20, 0) });
  assert.deepEqual(days(r), ['2026-11-26', '2026-11-29', '2026-12-02']);
  assert.ok(r.every((d) => d.getHours() === 9 && d.getMinutes() === 30));
});

test('nach Erledigung: überfällig beginnt heute, ohne lastDone ebenfalls', () => {
  const rule = { freq: 'afterDone', afterDoneDays: 7 };
  assert.deepEqual(days(nextOccurrences(rule, at(2026, 11, 24), 2, { lastDone: at(2026, 11, 1, 8, 0) })), ['2026-11-24', '2026-12-01']);
  assert.deepEqual(days(nextOccurrences(rule, at(2026, 11, 24), 2)), ['2026-11-24', '2026-12-01']);
});

test('until ist einschließlich und beendet die Reihe', () => {
  const r = nextOccurrences({ freq: 'daily', until: '2026-11-26' }, at(2026, 11, 24), 10);
  assert.deepEqual(days(r), ['2026-11-24', '2026-11-25', '2026-11-26']);
  assert.deepEqual(nextOccurrences({ freq: 'daily', until: '2026-11-20' }, at(2026, 11, 24), 5), []);
});

test('count zählt ab dem Ankertermin, nicht ab „from“', () => {
  assert.equal(nextOccurrences({ freq: 'daily', count: 3 }, at(2026, 11, 24), 10).length, 3);
  const r = nextOccurrences({ freq: 'daily', count: 5, start: '2026-11-20' }, at(2026, 11, 24), 10);
  assert.deepEqual(days(r), ['2026-11-24']);
});

test('Feiertage überspringen: nur mit skipHolidays, Strings und Dates erlaubt', () => {
  const hol = ['2026-11-25', new Date(2026, 11, 25)];
  const rule = { freq: 'daily' };
  assert.deepEqual(days(nextOccurrences(rule, at(2026, 11, 24), 3, { holidays: hol })), ['2026-11-24', '2026-11-25', '2026-11-26']);
  assert.deepEqual(days(nextOccurrences(rule, at(2026, 11, 24), 3, { holidays: hol, skipHolidays: true })), ['2026-11-24', '2026-11-26', '2026-11-27']);
  assert.deepEqual(days(nextOccurrences({ freq: 'monthly', byMonthDay: 25 }, at(2026, 11, 24), 2, { holidays: hol, skipHolidays: true })), ['2027-01-25', '2027-02-25']);
});

test('Feiertag verbraucht einen count-Termin', () => {
  const r = nextOccurrences({ freq: 'daily', count: 3 }, at(2026, 11, 24), 10, { holidays: ['2026-11-25'], skipHolidays: true });
  assert.deepEqual(days(r), ['2026-11-24', '2026-11-26']);
});

test('ungültige Regeln liefern eine leere Liste und Fehlertexte', () => {
  assert.deepEqual(nextOccurrences({ freq: 'stündlich' }, at(2026, 11, 24), 3), []);
  assert.deepEqual(nextOccurrences({ freq: 'daily' }, at(2026, 11, 24), 0), []);
  assert.deepEqual(nextOccurrences(null, at(2026, 11, 24), 3), []);
  assert.ok(validateRule({ freq: 'weekly', byWeekday: [0] }).length > 0);
  assert.ok(validateRule({ freq: 'afterDone' }).length > 0);
  assert.deepEqual(validateRule({ freq: 'monthly', byMonthDay: -1, interval: 2 }), []);
});

test('describeRule: Klartext der Beispiele aus dem Auftrag', () => {
  assert.equal(describeRule({ freq: 'daily' }), 'täglich');
  assert.equal(describeRule({ freq: 'weekly', interval: 2, byWeekday: [2] }), 'jeden 2. Dienstag');
  assert.equal(describeRule({ freq: 'monthly', byWeekday: [5], bySetPos: -1 }), 'jeden Monat am letzten Freitag');
  assert.equal(describeRule({ freq: 'monthly', byMonthDay: 31 }), 'monatlich am 31. (in kürzeren Monaten am Monatsende)');
  assert.equal(describeRule({ freq: 'yearly', byMonth: 2, byMonthDay: 29 }), 'jährlich am 29. Februar (sonst 28.)');
  assert.equal(describeRule({ freq: 'afterDone', afterDoneDays: 3 }), '3 Tage nach Erledigung');
});

test('describeRule: weitere Formen, Enden und Anzahl', () => {
  assert.equal(describeRule({ freq: 'weekly', byWeekday: [1, 3, 5] }), 'wöchentlich am Montag, Mittwoch und Freitag');
  assert.equal(describeRule({ freq: 'weekly', byWeekday: [1, 2, 3, 4, 5] }), 'werktags (Mo–Fr)');
  assert.equal(describeRule({ freq: 'weekly', byWeekday: [4] }), 'jeden Donnerstag');
  assert.equal(describeRule({ freq: 'daily', interval: 2 }), 'alle 2 Tage');
  assert.equal(describeRule({ freq: 'monthly', interval: 3, byMonthDay: 15 }), 'alle 3 Monate am 15.');
  assert.equal(describeRule({ freq: 'monthly', byWeekday: [2], bySetPos: 2 }), 'jeden Monat am 2. Dienstag');
  assert.equal(describeRule({ freq: 'monthly', byMonthDay: -1 }), 'monatlich am letzten Tag des Monats');
  assert.equal(describeRule({ freq: 'yearly', start: '2026-11-24' }), 'jährlich am 24. November');
  assert.equal(describeRule({ freq: 'afterDone', afterDoneDays: 1 }), '1 Tag nach Erledigung');
  assert.equal(describeRule({ freq: 'weekly', byWeekday: [2], until: '2026-12-31' }), 'jeden Dienstag, bis 31.12.2026');
  assert.equal(describeRule({ freq: 'daily', count: 10 }), 'täglich, 10-mal');
  assert.equal(describeRule({ freq: 'daily', until: '2026-12-31', count: 10 }), 'täglich, bis 31.12.2026, 10-mal');
  assert.equal(describeRule(null), 'keine Wiederholung');
});
