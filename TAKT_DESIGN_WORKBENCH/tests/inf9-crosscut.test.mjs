// INF-9: Querschnitt-Bausteine – Regel-Logik des recurrence-picker, Vertrag aller Komponenten, Hinweisarten.
import './_helpers.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ymd } from './_helpers.mjs';
import { nextOccurrences, describeRule, validateRule } from '../app/src/core/recurrence.js';
import { ruleFor, withEnd, withMonthMode, toggleWeekday, endMode, monthMode, FREQS, SCOPES } from '../app/src/library/components/crosscut/_recurrence.js';
import crosscut from '../app/src/library/components/crosscut/index.js';
import { validateComponent } from '../app/src/library/registry.js';

const START = new Date(2026, 10, 24, 9, 30); // Di 24.11.2026
const ids = ['legal-notice', 'offline-banner', 'sync-status', 'permission-card', 'recurrence-picker', 'undo-toast', 'link-chips', 'firstrun-card'];

test('crosscut/index.js exportiert alle acht Komponenten', () => {
  assert.deepEqual(crosscut.map((c) => c.id), ids);
});

test('Vertrag: Pflichtfelder, example, flutter {widget, propMap, events}, Kategorie', () => {
  for (const c of crosscut) {
    assert.deepEqual(validateComponent(c), [], c.id);
    assert.equal(c.category, 'Querschnitt', c.id);
    assert.ok(c.flutter && c.flutter.widget && c.flutter.propMap && c.flutter.events, `${c.id}: flutter-Feld`);
    assert.ok(Array.isArray(c.events) && c.events.length, `${c.id}: events`);
  }
});

test('legal-notice kennt alle sieben Hinweisarten', () => {
  const kinds = crosscut.find((c) => c.id === 'legal-notice').props.find((p) => p.name === 'kind').options;
  for (const k of ['simulation', 'keine-beratung', 'modellrechnung', 'steuer', 'kursdaten', 'krypto', 'gesundheit']) assert.ok(kinds.includes(k), k);
  for (const k of ['finanzen', 'trading', 'sparplan', 'daten']) assert.ok(kinds.includes(k), `bestehende Art ${k}`);
});

test('Picker: jede Häufigkeit erzeugt eine gültige Regel mit Klartext', () => {
  for (const f of FREQS.filter((x) => x.value !== 'none')) {
    const r = ruleFor(f.value, START);
    assert.deepEqual(validateRule(r), [], f.value);
    assert.ok(describeRule(r).length > 3, f.value);
    assert.ok(nextOccurrences(r, START, 3).length >= 1, f.value);
  }
  assert.equal(ruleFor('none', START), null);
});

test('Picker: wöchentlich am Dienstag – Klartext und nächste Termine', () => {
  const r = ruleFor('weekly', START);
  assert.equal(describeRule(r), 'jeden Dienstag');
  assert.deepEqual(nextOccurrences(r, START, 3).map(ymd), ['2026-11-24', '2026-12-01', '2026-12-08']);
});

test('Picker: Wochentage umschalten, der letzte bleibt stehen', () => {
  let r = ruleFor('weekly', START);
  r = toggleWeekday(r, 4);
  assert.deepEqual(r.byWeekday, [2, 4]);
  assert.equal(describeRule(r), 'wöchentlich am Dienstag und Donnerstag');
  r = toggleWeekday(toggleWeekday(r, 4), 2);
  assert.deepEqual(r.byWeekday, [2], 'letzter Wochentag lässt sich nicht abwählen');
});

test('Picker: monatlich am Tag und am n-ten Wochentag', () => {
  const day = ruleFor('monthly', START);
  assert.equal(monthMode(day), 'day');
  assert.equal(describeRule(day), 'monatlich am 24.');
  const wd = withMonthMode(day, 'weekday', START);
  assert.equal(monthMode(wd), 'weekday');
  assert.equal(describeRule(wd), 'jeden Monat am 4. Dienstag');
  assert.deepEqual(nextOccurrences(wd, START, 2).map(ymd), ['2026-11-24', '2026-12-22']);
  const last = { ...wd, bySetPos: -1 };
  assert.equal(describeRule(last), 'jeden Monat am letzten Dienstag');
  assert.deepEqual(nextOccurrences(last, START, 2).map(ymd), ['2026-11-24', '2026-12-29']);
});

test('Picker: Monatsende und jährlich', () => {
  const end = { ...ruleFor('monthly', START), byMonthDay: -1 };
  assert.equal(describeRule(end), 'monatlich am letzten Tag des Monats');
  assert.deepEqual(nextOccurrences(end, START, 2).map(ymd), ['2026-11-30', '2026-12-31']);
  const y = ruleFor('yearly', START);
  assert.equal(describeRule(y), 'jährlich am 24. November');
});

test('Picker: nach Erledigung', () => {
  const r = ruleFor('afterDone', START);
  assert.equal(describeRule(r), '7 Tage nach Erledigung');
  assert.equal(ymd(nextOccurrences({ ...r, afterDoneDays: 3 }, START, 1, { lastDone: new Date(2026, 10, 23) })[0]), '2026-11-26');
});

test('Picker: Ende nie / am Datum / nach Anzahl, Wechsel der Häufigkeit behält das Ende', () => {
  let r = ruleFor('daily', START);
  assert.equal(endMode(r), 'never');
  r = withEnd(r, 'count', START);
  assert.equal(r.count, 10);
  assert.equal(describeRule(r), 'täglich, 10-mal');
  assert.equal(nextOccurrences(r, START, 20).length, 10);
  r = withEnd(r, 'until', START);
  assert.equal(r.until, '2027-02-22');
  assert.equal(r.count, undefined);
  assert.equal(describeRule(withEnd({ ...r, until: '2026-11-26' }, 'until', START)), 'täglich, bis 26.11.2026');
  assert.equal(endMode(ruleFor('weekly', START, r)), 'until');
  assert.equal(endMode(withEnd(r, 'never', START)), 'never');
});

test('Serien-Dialog liefert genau drei Optionen: nur dieser, dieser und folgende, alle', () => {
  assert.deepEqual(SCOPES.map((s) => s.value), ['this', 'following', 'all']);
  assert.deepEqual(SCOPES.map((s) => s.label), ['Nur dieser Termin', 'Dieser und folgende', 'Alle Termine']);
});
