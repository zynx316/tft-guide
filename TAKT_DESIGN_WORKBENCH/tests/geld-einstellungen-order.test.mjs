// Order-IDs sind deterministisch (kein Zufall, keine Uhrzeit); Planname mit Zusatz bleibt zusammen.
import './_helpers.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeOrder } from '../app/src/library/components/trading/_order.js';

const inst = { id: 'i1', price: 100 };
const chk = { qty: 1, limit: null, stop: null, pv: { price: 100, fee: 1, total: 101 } };
const base = { inst, side: 'buy', type: 'markt', chk, validity: 'Tag' };

test('makeOrder: ID kommt aus ctx.newId', () => {
  const ctx = { today: new Date(2026, 10, 24, 9, 30), newId: (p) => `${p}-7` };
  assert.equal(makeOrder({ ctx, ...base }).id, 'o-7');
});

test('makeOrder: ohne ctx.newId zählt ein Modulzähler hoch (nie Zeit oder Zufall)', () => {
  const ctx = { today: new Date(2026, 10, 24, 9, 30) };
  const a = makeOrder({ ctx, ...base }).id, b = makeOrder({ ctx, ...base }).id;
  assert.match(a, /^o-\d+$/);
  assert.notEqual(a, b);
  assert.ok(Number(b.slice(2)) === Number(a.slice(2)) + 1);
});
