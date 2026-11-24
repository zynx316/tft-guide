// Upgrade-Weg „Seed abgleichen …“ (Daten & Backup) mit dem echten Seed: ein älterer Live-Stand ohne die Module
// Ziele, Einkauf & Haushalt und Dokumente & Verträge, mit einem vom Nutzer geänderten und einem freigegebenen Feature.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSeedState } from '../app/src/seed/index.js';
import { diffSeed, applySeedPatch, seedHash } from '../app/src/core/seedpatch.js';
import { validateState } from '../app/src/core/validate.js';
import { WORLD } from '../app/src/seed/world/index.js';

const NEW = ['goals', 'shopping', 'documents'];
function olderState() {
  const s = buildSeedState();
  s.modules = s.modules.filter((m) => !NEW.includes(m.id));
  s.features = s.features.filter((f) => !NEW.includes(f.moduleId));
  s.versions = s.versions.filter((v) => s.features.some((f) => f.id === v.featureId));
  s.decisions = s.decisions.filter((d) => !d.featureId || s.features.some((f) => f.id === d.featureId)).filter((d) => !d.moduleId || s.modules.some((m) => m.id === d.moduleId));
  for (const f of s.features) f.seedHash = seedHash(f);
  return s;
}

test('Seed abgleichen: neue Module und Features kommen dazu, nichts geht verloren', () => {
  const seed = buildSeedState(), live = olderState();
  const before = { modules: live.modules.length, features: live.features.length };
  const d = diffSeed(live, seed);
  assert.deepEqual(d.neueModule.map((m) => m.id).sort(), [...NEW].sort());
  assert.equal(d.neu.length, seed.features.filter((f) => NEW.includes(f.moduleId)).length);
  const r = applySeedPatch(live, seed, { ids: [], seedVersion: 'upgrade' });
  assert.equal(r.modules, 3);
  assert.equal(live.modules.length, before.modules + 3);
  assert.equal(live.features.length, seed.features.length);
  assert.equal(diffSeed(live, seed).neu.length, 0, 'zweiter Abgleich findet nichts Neues');
  const v = validateState(live, { worldKeys: new Set(Object.keys(WORLD)) });
  assert.deepEqual(v.errors, [], 'nach dem Abgleich ist der Stand integer');
});

test('Seed abgleichen: Änderungen des Nutzers und Freigaben bleiben unangetastet', () => {
  const seed = buildSeedState(), live = olderState();
  const changed = live.features.find((f) => f.id === 'home.today' && !f.locked);
  changed.purpose = 'Eigener Zweck des Nutzers';
  const locked = live.features.find((f) => f.locked);
  assert.ok(locked, 'Seed enthält ein freigegebenes Feature');
  const lockedBefore = JSON.stringify(locked.variants);
  applySeedPatch(live, seed, { ids: [], seedVersion: 'upgrade' });
  assert.equal(live.features.find((f) => f.id === 'home.today').purpose, 'Eigener Zweck des Nutzers');
  assert.equal(JSON.stringify(live.features.find((f) => f.id === locked.id).variants), lockedBefore);
});
