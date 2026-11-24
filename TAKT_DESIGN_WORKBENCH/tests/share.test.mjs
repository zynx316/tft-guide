// Strukturelles Teilen (lib/share.js): Ergebnis inhaltlich gleich, unveränderte Teile geteilt, Vorzustand unberührt.
import './_helpers.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { shareUnchanged } from '../app/src/lib/share.js';
import { buildSeedState } from '../app/src/seed/index.js';

const clone = (x) => structuredClone(x);

test('gleiche Inhalte → Vorzustand wird zurückgegeben', () => {
  const a = { x: [1, { id: 'a', v: 2 }], y: 'z' };
  assert.equal(shareUnchanged(a, clone(a)), a);
});

test('Änderung tief im Baum: Ergebnis gleich dem neuen Stand, Rest geteilt, Vorzustand unverändert', () => {
  const prev = buildSeedState(); const before = JSON.stringify(prev);
  const next = clone(prev);
  next.features[5].notes = 'geändert'; next.meta.rev = 99;
  next.decisions.unshift({ id: 'neu', title: 'Neu' });           // Einfügen vorne: Zuordnung über id
  next.features.splice(10, 1);                                     // Entfernen
  const expected = JSON.stringify(next);
  const out = shareUnchanged(prev, next);
  assert.equal(JSON.stringify(out), expected, 'Inhalt identisch mit dem neuen Stand');
  assert.equal(JSON.stringify(prev), before, 'Vorzustand unverändert');
  assert.notEqual(out.features[5], prev.features[5], 'geändertes Feature nicht geteilt');
  assert.equal(out.features[6], prev.features[6], 'unverändertes Feature geteilt');
  assert.equal(out.features[10], prev.features[11], 'nach dem Entfernen über die ID zugeordnet');
  assert.equal(out.decisions[1], prev.decisions[0], 'nach Einfügen vorne über die ID zugeordnet');
  assert.equal(out.modules, prev.modules, 'unveränderte Liste geteilt');
});

test('Schlüssel entfernt/hinzugefügt, Typwechsel, Arrays ohne IDs', () => {
  const prev = { a: 1, b: { c: 2 }, d: [1, 2, 3], e: [{ k: 1 }, { k: 2 }], t: [1] };
  const next = { a: 1, d: [1, 2, 3, 4], e: [{ k: 1 }, { k: 3 }], t: { 0: 1 }, n: null };
  const expected = JSON.stringify(next);
  const out = shareUnchanged(prev, next);
  assert.equal(JSON.stringify(out), expected);
  assert.equal(out.e[0], prev.e[0]);
  assert.notEqual(out, prev);
});

test('doppelte IDs und Elemente ohne ID im selben Array bleiben korrekt', () => {
  const prev = [{ id: 'x', v: 1 }, { id: 'x', v: 2 }, { v: 3 }];
  const next = clone(prev); next[1].v = 5;
  const expected = JSON.stringify(next);
  assert.equal(JSON.stringify(shareUnchanged(prev, next)), expected);
});
