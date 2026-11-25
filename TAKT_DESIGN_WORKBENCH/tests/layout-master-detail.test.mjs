// Master-Detail mobil (layout.masterDetail): reine Entscheidung Liste/Detail und Seed-Opt-in der drei Varianten.
import './_helpers.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { masterDetailMode } from '../app/src/preview/layouts.js';
import { MANIFESTS } from '../app/src/seed/index.js';

const SB = { type: 'sidebar', masterDetail: true };

test('Master-Detail: mobil Liste ohne Auswahl, Detail mit Auswahl', () => {
  assert.equal(masterDetailMode(SB, 'mobile', undefined), 'list');
  assert.equal(masterDetailMode(SB, 'mobile', null), 'list');
  assert.equal(masterDetailMode(SB, 'mobile', ''), 'list');
  assert.equal(masterDetailMode(SB, 'mobile', 'n3'), 'detail');
  assert.equal(masterDetailMode(SB, 'mobile', 0), 'detail');
});

test('Master-Detail: Tablet/Desktop, anderer Typ oder ohne Opt-in bleiben unverändert (null)', () => {
  for (const bp of ['tablet', 'desktop']) { assert.equal(masterDetailMode(SB, bp, null), null); assert.equal(masterDetailMode(SB, bp, 'x'), null); }
  assert.equal(masterDetailMode({ type: 'stack', masterDetail: true }, 'mobile', null), null);
  assert.equal(masterDetailMode({ type: 'sidebar' }, 'mobile', null), null);
  assert.equal(masterDetailMode(undefined, 'mobile', null), null);
});

test('Seed: Master-Detail ist für notes.overview/B, knowledge.browse/A, picture-to-text.history/A gesetzt (kein panelOpen mehr)', () => {
  const feats = MANIFESTS.flatMap((m) => m.features || []);
  const lay = (fid, vid) => feats.find((f) => f.id === fid).variants.find((v) => v.id === vid).layout;
  for (const [f, v] of [['notes.overview', 'B'], ['knowledge.browse', 'A'], ['picture-to-text.history', 'A']]) {
    const l = lay(f, v); assert.equal(l.type, 'sidebar'); assert.equal(l.masterDetail, true, `${f}/${v}`); assert.equal(l.panelOpen, undefined);
  }
  for (const f of feats) for (const v of f.variants || []) if (v.layout?.masterDetail) assert.equal(v.layout.type, 'sidebar', `${f.id}/${v.id}: masterDetail nur mit sidebar`);
});
