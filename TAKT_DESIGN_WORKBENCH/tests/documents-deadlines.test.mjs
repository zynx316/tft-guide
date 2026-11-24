// Dokumente & Verträge: Fristenlogik (Stufen 30/14/3, Gewährleistung, Dokumentablauf, Steuerordner) und Kündigungsvorlage.
import './_helpers.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stageOf, warrantyEnd, warrantyState, documentState, buildDeadlines, resolveRef, taxStats, countByStage, HORIZON_DAYS, REMINDER_DAYS } from '../app/src/library/components/documents/_deadlines.js';
import { cancelText } from '../app/src/library/components/documents/_cancel.js';

test('Stufen: bis 3 Tage dringend, bis 14 bald, bis 30 im Blick, danach weit', () => {
  assert.deepEqual([0, 3, 4, 14, 15, 30, 31, 400].map((d) => stageOf(d).id), ['dringend', 'dringend', 'bald', 'bald', 'blick', 'blick', 'weit', 'weit']);
  assert.deepEqual(REMINDER_DAYS, [30, 14, 3]); assert.equal(HORIZON_DAYS, 90);
});

test('Gewährleistung: Monate addieren, Monatsende begrenzen, ohne Monate kein Ende', () => {
  assert.equal(warrantyEnd('2024-11-27', 24), '2026-11-27');
  assert.equal(warrantyEnd('2024-08-31', 6), '2025-02-28');
  assert.equal(warrantyEnd('2024-02-29', 12), '2025-02-28');
  assert.equal(warrantyEnd('2024-11-27', 0), null);
});

test('Garantiezustand: nächstes Ende, läuft ab ab 30 Tagen, abgelaufen', () => {
  const w = { legalEnd: '2026-12-05', makerEnd: '2027-12-05' };
  const s = warrantyState(w, '2026-11-24'); assert.equal(s.status, 'läuft ab'); assert.equal(s.next.kind, 'legal'); assert.equal(s.days, 11); assert.equal(s.stage.id, 'bald');
  const later = warrantyState(w, '2026-12-06'); assert.equal(later.next.kind, 'maker'); assert.equal(later.status, 'aktiv');
  const gone = warrantyState(w, '2028-01-01'); assert.equal(gone.status, 'abgelaufen'); assert.equal(gone.next, null);
  assert.equal(warrantyState({ legalEnd: '2026-11-24' }, '2026-11-24').days, 0, 'heute zählt noch');
});

test('Dokumentstand: ohne Ablauf, gültig, läuft ab (90 Tage), abgelaufen', () => {
  const t = '2026-11-24';
  assert.equal(documentState({}, t).status, 'ohne Ablauf'); assert.equal(documentState({ validUntil: '2031-06-02' }, t).status, 'gültig');
  assert.equal(documentState({ validUntil: '2027-02-18' }, t).status, 'läuft ab'); assert.equal(documentState({ validUntil: '2026-11-23' }, t).status, 'abgelaufen');
});

test('buildDeadlines: Vergangenes und alles hinter dem Horizont bleibt draußen, Verträge mit Dokument ablaufdatum zählen nicht doppelt', () => {
  const contracts = [{ id: 'c1', name: 'A', cancelBy: '2026-11-20' }, { id: 'c2', name: 'B', cancelBy: '2026-12-01', amount: 10, interval: 'monatlich' }, { id: 'c3', name: 'C', cancelBy: '2027-06-01' }, { id: 'c4', name: 'D' }];
  const documents = [{ id: 'd1', title: 'Pass', validUntil: '2026-12-10' }, { id: 'd2', title: 'Police', validUntil: '2026-12-02', contractId: 'c2' }];
  const out = buildDeadlines({ contracts, warranties: [], documents, today: '2026-11-24' });
  assert.deepEqual(out.map((d) => d.refId), ['c2', 'd1']);
  assert.equal(out[0].event, 'deadline.contract'); assert.equal(out[1].to, 'documents.detail');
  assert.deepEqual(countByStage(out), { dringend: 0, bald: 1, blick: 1, weit: 0 });
  assert.equal(buildDeadlines({ contracts, today: '2026-11-24', horizon: 10 }).length, 1);
  assert.deepEqual(buildDeadlines({ today: '2026-11-24' }), []);
});

test('Steuerordner: Frist nur solange etwas offen ist; Verweise ohne Quelle fallen weg', () => {
  const tax = { year: 2026, due: '2026-11-26', categories: [{ id: 'a', refs: [{ kind: 'receipt', id: 'r1' }, { kind: 'receipt', id: 'rX' }, { kind: 'missing', id: 'm', label: 'Fehlt' }] }] };
  const src = { receipts: [{ id: 'r1', merchant: 'X', date: '2026-11-01', total: 5, status: 'gebucht' }] };
  const st = taxStats(tax, src); assert.equal(st.total, 2); assert.equal(st.open, 1); assert.equal(st.ok, 1);
  assert.equal(buildDeadlines({ tax, taxOpen: 1, today: '2026-11-24' })[0].days, 2);
  assert.equal(buildDeadlines({ tax, taxOpen: 0, today: '2026-11-24' }).length, 0);
  assert.equal(resolveRef({ kind: 'unbekannt' }, src), null);
});

test('Kündigungsvorlage: nennt Vertrag, Kundennummer und Termin, bleibt Entwurf ohne Namen im Text', () => {
  const c = { name: 'Kfz-Versicherung', kind: 'Versicherung', customerNo: '•••• 4471', endsOn: '2026-12-31' };
  const text = cancelText(c, '');
  assert.match(text, /Kfz-Versicherung/); assert.doesNotMatch(text, /••••/); assert.match(text, /\[bitte eintragen\]/); assert.match(cancelText({ ...c, customerNo: '12345' }, ''), /Kundennummer 12345/); assert.doesNotMatch(cancelText({ ...c, customerNo: '–' }, ''), /Kundennummer/); assert.match(text, /zum 31\.12\.2026/); assert.match(text, /\[Vorname Nachname\]/);
  assert.match(cancelText({ ...c, endsOn: null, kind: 'Vertrag' }, 'A B'), /zum nächstmöglichen Zeitpunkt/);
  assert.doesNotMatch(text, /!/);
});
