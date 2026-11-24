// Integritätsprüfung des Workbench-Zustands (core/validate.js).
import './_helpers.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSeedState } from '../app/src/seed/index.js';
import { getComponent } from '../app/src/library/registry.js';
import { WORLD } from '../app/src/seed/world/index.js';
import { validateState } from '../app/src/core/validate.js';

const opts = { getComponent, worldKeys: new Set(Object.keys(WORLD)) };
const seed = () => JSON.parse(JSON.stringify(buildSeedState()));
const codes = (r) => [...r.errors, ...r.warnings].map((x) => x.code);

test('Seed ist ohne Fehler und Hinweise', () => {
  const r = validateState(buildSeedState(), opts);
  assert.deepEqual([...r.errors, ...r.warnings].map((x) => x.msg), []);
  assert.equal(r.ok, true);
});

test('beschädigte Struktur → Fehler (Import wird blockiert)', () => {
  const s = seed();
  s.features.push({ ...s.features[0] });                       // doppelte ID
  s.features[1].moduleId = 'gibt-es-nicht';                     // Feature ohne Modul
  const g = s.features.find((f) => f.variants.length > 1); g.selectedVariantId = 'zz';
  const l = s.features.find((f) => !f.locked && f.variants.length); l.locked = true; l.releasedVersionId = 'ver-fehlt';
  const r = validateState(s, opts);
  assert.equal(r.ok, false);
  for (const c of ['feature-id', 'feature-modul', 'auswahl', 'sperre']) assert.ok(codes(r).includes(c), c);
});

test('Verweise ins Leere → Hinweise, Zustand bleibt gültig', () => {
  const s = seed();
  const f = s.features.find((x) => (x.interactions || []).length && x.variants.length);
  f.interactions[0].to = 'nirgendwo.feature';
  f.variants[0].blocks[0].component = 'unbekannte-komponente';
  f.demoData = { ...f.demoData, extra: '@world:gibtsNicht' };
  s.decisions.push({ id: 'd-x', featureId: 'weg.feature', status: 'open' });
  s.rounds.push({ id: 'r-x', title: 'Test', agenda: ['fehlt'] });
  s.pins.push({ id: 'p-x', featureId: f.id, variantId: 'v-fehlt' });
  s.modules[0].homeFeatureId = 'auch.weg';
  const r = validateState(s, opts);
  assert.equal(r.ok, true, 'nur Hinweise');
  for (const c of ['ziel', 'komponente', 'welt', 'entscheidung-bezug', 'runde', 'anmerkung', 'startseite']) assert.ok(codes(r).includes(c), c);
});

test('Navigationsziel module:<id> wird akzeptiert, unbekanntes Modul nicht', () => {
  const s = seed();
  const f = s.features.find((x) => x.variants.length);
  f.interactions = [{ trigger: 'a', result: 'b', event: 'x.open', to: `module:${s.modules[0].id}` }, { trigger: 'c', result: 'd', event: 'y.open', to: 'module:fehlt' }];
  const r = validateState(s, opts);
  assert.equal(r.warnings.filter((w) => w.code === 'ziel').length, 1);
});

test('keine Struktur → Fehler statt Absturz', () => {
  assert.equal(validateState(null).ok, false);
  assert.equal(validateState({}).ok, false);
});
