import './_helpers.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ymd, ymdhm } from './_helpers.mjs';
import {
  dayStart, addDays, addMonths, dayDiff, isSameDay, startOfWeek, endOfMonth, isLeap, daysInMonth, parseLocal, toIsoDay,
  isoWeekday, relativeTo, toDate, DEFAULT_TODAY,
} from '../app/src/lib/date.js';

test('DEFAULT_TODAY ist Dienstag, 24.11.2026, 09:30 Lokalzeit', () => {
  assert.equal(ymdhm(DEFAULT_TODAY), '2026-11-24 09:30');
  assert.equal(isoWeekday(DEFAULT_TODAY), 2);
});

test('DEFAULT_TODAY stimmt mit dem Textwert aus preview-payload überein', async () => {
  const { payload } = await (await import('./_helpers.mjs')).loadWorkbench();
  assert.equal(ymdhm(parseLocal(payload.DEFAULT_TODAY)), ymdhm(DEFAULT_TODAY));
});

test('parseLocal: Datum lokal, Uhrzeit optional, Ungültiges null', () => {
  assert.equal(ymdhm(parseLocal('2026-03-05')), '2026-03-05 00:00');
  assert.equal(ymdhm(parseLocal('2026-03-05T14:45')), '2026-03-05 14:45');
  for (const bad of ['2026-02-30', '2026-13-01', '26-01-01', '', null, undefined, '2026-01-01T25:00', 'morgen']) assert.equal(parseLocal(bad), null, String(bad));
});

test('toIsoDay ist lokal (kein UTC-Versatz um Mitternacht)', () => {
  assert.equal(toIsoDay(new Date(2026, 0, 1, 0, 5)), '2026-01-01');
  assert.equal(toIsoDay(new Date(2026, 11, 31, 23, 55)), '2026-12-31');
});

test('dayStart und toDate kopieren, statt zu verändern', () => {
  const d = new Date(2026, 10, 24, 9, 30);
  const s = dayStart(d);
  assert.equal(ymdhm(s), '2026-11-24 00:00');
  assert.equal(ymdhm(d), '2026-11-24 09:30');
  assert.notEqual(toDate(d), d);
  assert.ok(Number.isNaN(toDate(null).getTime()));
});

test('addDays: negative Werte, Monats- und Jahreswechsel, Uhrzeit bleibt', () => {
  assert.equal(ymdhm(addDays(DEFAULT_TODAY, 7)), '2026-12-01 09:30');
  assert.equal(ymdhm(addDays(DEFAULT_TODAY, -24)), '2026-10-31 09:30');
  assert.equal(ymd(addDays(new Date(2026, 11, 31), 1)), '2027-01-01');
});

test('addDays über die Sommerzeit hält die lokale Uhrzeit', () => {
  assert.equal(ymdhm(addDays(new Date(2026, 2, 28, 9, 30), 1)), '2026-03-29 09:30');
  assert.equal(ymdhm(addDays(new Date(2026, 9, 24, 9, 30), 2)), '2026-10-26 09:30');
});

test('dayDiff zählt Kalendertage, auch über Sommerzeit und mit Uhrzeiten', () => {
  assert.equal(dayDiff(new Date(2026, 2, 28, 23, 0), new Date(2026, 2, 30, 1, 0)), 2);
  assert.equal(dayDiff(new Date(2026, 9, 24, 10), new Date(2026, 9, 26, 8)), 2);
  assert.equal(dayDiff('2026-11-24', '2026-11-20'), -4);
  assert.equal(dayDiff(DEFAULT_TODAY, new Date(2026, 10, 24, 23, 59)), 0);
  assert.equal(dayDiff('2026-01-01', '2027-01-01'), 365);
  assert.equal(relativeTo('2026-11-30'), 6);
});

test('isSameDay, isoWeekday, startOfWeek (Montag)', () => {
  assert.ok(isSameDay(new Date(2026, 10, 24, 0, 1), new Date(2026, 10, 24, 23, 59)));
  assert.ok(!isSameDay(new Date(2026, 10, 24, 23, 59), new Date(2026, 10, 25, 0, 1)));
  assert.equal(isoWeekday(new Date(2026, 10, 29)), 7);
  assert.equal(isoWeekday(new Date(2026, 10, 23)), 1);
  assert.equal(ymdhm(startOfWeek(DEFAULT_TODAY)), '2026-11-23 00:00');
  assert.equal(ymd(startOfWeek(new Date(2026, 10, 29, 22))), '2026-11-23');
  assert.equal(ymd(startOfWeek(new Date(2026, 10, 23))), '2026-11-23');
  assert.equal(ymd(startOfWeek(new Date(2027, 0, 1))), '2026-12-28');
});

test('isLeap, daysInMonth, endOfMonth', () => {
  assert.deepEqual([1900, 2000, 2024, 2026, 2028, 2100].map(isLeap), [false, true, true, false, true, false]);
  assert.equal(daysInMonth(2028, 1), 29);
  assert.equal(daysInMonth(2027, 1), 28);
  assert.equal(ymd(endOfMonth(DEFAULT_TODAY)), '2026-11-30');
  assert.equal(ymd(endOfMonth(new Date(2028, 1, 10))), '2028-02-29');
});

test('addMonths begrenzt auf das Monatsende', () => {
  assert.equal(ymd(addMonths(new Date(2026, 0, 31), 1)), '2026-02-28');
  assert.equal(ymd(addMonths(new Date(2026, 10, 24), 3)), '2027-02-24');
  assert.equal(ymd(addMonths(new Date(2026, 0, 31), -2)), '2025-11-30');
});
