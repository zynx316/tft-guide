// Spezifikation als JSON (takt-feature-spec/1): stabiler Hash, Freigabe-Snapshot, Routen, deterministisches Bündel.
import './_helpers.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSeedState } from '../app/src/seed/index.js';
import { getComponent } from '../app/src/library/registry.js';
import { featureSpecJson, routeTable, specBundle, canonical, hash64, SPEC_FORMAT } from '../app/src/core/spec-json.js';

const clone = (x) => JSON.parse(JSON.stringify(x));

test('kanonisches JSON ist schlüsselsortiert und der Hash stabil', () => {
  assert.equal(canonical({ b: 1, a: [2, { d: 3, c: 4 }] }), '{"a":[2,{"c":4,"d":3}],"b":1}');
  assert.equal(hash64('abc'), hash64('abc'));
  assert.notEqual(hash64('abc'), hash64('abd'));
  assert.match(hash64(''), /^[0-9a-f]{16}$/);
});

test('Feature-Spezifikation: Format, Variante, Komponenten, Daten mit Welt-Verweisen', () => {
  const s = buildSeedState();
  const spec = featureSpecJson(s, 'finance.home', { getComponent });
  assert.equal(spec.format, SPEC_FORMAT);
  assert.equal(spec.feature.id, 'finance.home');
  assert.ok(spec.variant && spec.blocks.length > 0);
  assert.ok(spec.components.every((c) => !c.missing), 'alle Komponenten in der Registry');
  assert.ok(spec.components.every((c) => typeof c.flutter === 'string' && c.flutter.length > 0), 'jede Komponente hat einen Flutter-Hinweis');
  assert.ok(Object.values(spec.data).some((d) => d && d.world), 'Welt-Bindungen bleiben als Verweis erkennbar');
  assert.match(spec.specHash, /^[0-9a-f]{16}$/);
});

test('specHash ändert sich bei Designänderung, nicht bei Status/QA/Entscheidungstexten', () => {
  const s = buildSeedState();
  const h0 = featureSpecJson(s, 'tasks.overview', { getComponent }).specHash;
  const s2 = clone(s); const f2 = s2.features.find((f) => f.id === 'tasks.overview');
  f2.status = 'review'; s2.qa = { ...(s2.qa || {}), latest: { ...(s2.qa?.latest || {}), 'tasks.overview': { status: 'pass', results: [] } } };
  assert.equal(featureSpecJson(s2, 'tasks.overview', { getComponent }).specHash, h0);
  const v = f2.variants.find((x) => x.id === f2.selectedVariantId) || f2.variants[0];
  v.blocks = [...v.blocks].reverse();
  assert.notEqual(featureSpecJson(s2, 'tasks.overview', { getComponent }).specHash, h0, 'Reihenfolge der Blöcke ist umsetzungsrelevant');
});

test('gesperrtes Feature: Quelle ist die Freigabe, auch wenn der Arbeitsstand abweicht', () => {
  const s = buildSeedState();
  const f = s.features.find((x) => x.locked && x.releasedVersionId);
  assert.ok(f, 'Seed enthält ein freigegebenes Feature');
  const spec = featureSpecJson(s, f.id, { getComponent });
  assert.equal(spec.source.version, 'freigabe');
  assert.ok(spec.source.release);
});

test('Routen: alle Ziele gültig, jedes Modul mit Startseite', () => {
  const s = buildSeedState();
  const r = routeTable(s);
  assert.ok(r.edges.length > 100);
  assert.deepEqual(r.edges.filter((e) => !e.valid).map((e) => `${e.from} ${e.event} → ${e.to}`), []);
  assert.ok(r.modules.every((m) => m.home), 'jede Modul-Startseite gesetzt');
});

test('Bündel ist deterministisch', () => {
  const a = specBundle(buildSeedState(), { getComponent });
  const b = specBundle(buildSeedState(), { getComponent });
  assert.equal(a.manifest.bundleHash, b.manifest.bundleHash);
  assert.equal(new Set(a.manifest.features.map((x) => x.file)).size, a.manifest.features.length);
});
