// Datenwelt (Szenarien), Seed-Patch, Versionen „Meine Auswahl“ und „In App ansehen“.
import './_helpers.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WORLD, WORLD_SCENARIOS } from '../app/src/seed/world/index.js';
const targeted = (id) => new Set(WORLD_SCENARIOS.flatMap((x) => Object.keys(x?.[id] || {})));
import { applyScenario, getWorld, SCENARIOS, hasWorldKey, isReferenceKey } from '../app/src/core/world.js';
import { buildSeedState } from '../app/src/seed/index.js';
import { seedHash, diffSeed, applySeedPatch, userChanged } from '../app/src/core/seedpatch.js';
import { listVersions, resolveVariant, versionById, versionCoverage } from '../app/src/core/directions.js';
import { migrate } from '../app/src/core/schema.js';

const arrays = (w) => Object.entries(w).filter(([k, v]) => Array.isArray(v) && k !== 'scenarios');

test('Szenarien: drei feste IDs, Alltag ist Standard', () => {
  assert.deepEqual(SCENARIOS.map((s) => s.id), ['alltag', 'erststart', 'stress']);
  assert.deepEqual(applyScenario(WORLD, 'alltag').persona, WORLD.persona);
});

test('Erster Start: Nutzerdaten leer, Kataloge/Wetter/Persona bleiben', () => {
  const w = applyScenario(WORLD, 'erststart');
  for (const [k, v] of arrays(WORLD)) {
    if (targeted('erststart').has(k)) continue;
    if (isReferenceKey(k, v)) assert.equal(w[k].length, v.length, `${k} (Referenz) geleert`);
    else assert.equal(w[k].length, 0, `${k} nicht leer`);
  }
  assert.deepEqual(w.persona, WORLD.persona);
  if (WORLD.tasks && !targeted('erststart').has('tasks')) assert.equal(w.tasks.length, 0);
  if (WORLD.exerciseLibrary) assert.ok(w.exerciseLibrary.length > 0, 'Übungsbibliothek geleert');
});

test('Stress-Tag: Listen von Objekten verdreifacht, IDs eindeutig', () => {
  const w = applyScenario(WORLD, 'stress');
  for (const [k, v] of arrays(WORLD)) {
    if (!v.length || typeof v[0] !== 'object' || targeted('stress').has(k)) continue;
    assert.equal(w[k].length, v.length * 3, `${k} nicht verdreifacht`);
    const ids = w[k].map((x) => x.id).filter((x) => x != null);
    assert.equal(new Set(ids).size, ids.length, `${k}: doppelte IDs`);
  }
});

test('Szenario verändert die Seed-Welt nicht (keine geteilten Referenzen)', () => {
  const before = JSON.stringify(WORLD);
  const w = applyScenario(WORLD, 'stress'); for (const [, v] of arrays(w)) v.push({ id: 'x' });
  assert.equal(JSON.stringify(WORLD), before);
});

test('getWorld: Überschreibungen des Nutzers gewinnen', () => {
  const key = Object.keys(WORLD).find((k) => k !== 'scenarios');
  const w = getWorld({ worldOverrides: { [key]: 'eigen' } }, 'alltag');
  assert.equal(w[key], 'eigen');
  assert.ok(hasWorldKey(key)); assert.ok(!hasWorldKey('gibt-es-nicht'));
});

test('Migration: Welt wird nicht mehr im Zustand gespeichert', () => {
  const st = migrate({ ...buildSeedState(), world: { alt: 1 } });
  assert.equal(st.world, undefined);
  assert.deepEqual(st.worldOverrides, {});
});

test('Seed-Abdruck ist stabil und erkennt Änderungen', () => {
  const a = buildSeedState(), b = buildSeedState();
  for (const f of a.features) assert.equal(seedHash(f), seedHash(b.features.find((x) => x.id === f.id)), f.id);
  const f = a.features.find((x) => x.variants.length);
  assert.equal(f.seedHash, seedHash(f));
  assert.equal(userChanged(a, f), false);
  f.variants[0].name += ' geändert';
  assert.equal(userChanged(a, f), true);
});

test('Seed-Patch: neu, aktualisierbar, geändert, gesperrt', () => {
  const live = buildSeedState(); const seed = buildSeedState();
  const removed = live.features.find((f) => !f.locked && f.variants.length); live.features = live.features.filter((f) => f !== removed);
  const free = live.features.filter((f) => !f.locked && f.variants.length);
  const mine = free[0]; mine.variants[0].name = 'Meine Änderung';
  const theirs = seed.features.find((f) => f.id === free[1].id); theirs.purpose += ' (neuer Seed-Text)';
  const sMine = seed.features.find((f) => f.id === mine.id); sMine.purpose += ' (Seed)';
  const locked = seed.features.find((f) => f.locked); if (locked) locked.purpose += ' (Seed)';
  const d = diffSeed(live, seed);
  assert.deepEqual(d.neu.map((x) => x.id), [removed.id]);
  assert.deepEqual(d.aktualisierbar.map((x) => x.id), [free[1].id]);
  assert.deepEqual(d.geaendert.map((x) => x.id), [mine.id]);
  if (locked) assert.deepEqual(d.gesperrt.map((x) => x.id), [locked.id]);
  const versionsBefore = live.versions.length; const lockedBefore = locked && JSON.stringify(live.features.find((f) => f.id === locked.id));
  const r = applySeedPatch(live, seed, { ids: d.aktualisierbar.map((x) => x.id), seedVersion: 'test' });
  assert.equal(r.features, 1); assert.equal(r.updated, 1); assert.equal(r.backups, 1);
  assert.equal(live.versions.length, versionsBefore + 1 + seed.versions.filter((v) => v.featureId === removed.id).length);
  assert.match(live.features.find((f) => f.id === free[1].id).purpose, /neuer Seed-Text/);
  assert.equal(live.features.find((f) => f.id === mine.id).variants[0].name, 'Meine Änderung', 'Nutzeränderung überschrieben');
  if (locked) {
    assert.equal(JSON.stringify(live.features.find((f) => f.id === locked.id)), lockedBefore, 'Gesperrtes Feature verändert');
    assert.ok(live.decisions.some((x) => x.kind === 'seed-proposal' && x.featureId === locked.id));
  }
  const again = applySeedPatch(live, seed, { ids: [], seedVersion: 'test' });
  assert.equal(again.proposals, 0, 'Vorschlag doppelt angelegt');
});

test('Versionen: „Meine Auswahl“ folgt Feature › Modul › App', () => {
  const st = buildSeedState();
  assert.ok(listVersions(st).some((v) => v.id === 'mix'));
  const f = st.features.find((x) => x.variants.length >= 2 && new Set(x.variants.map((v) => v.direction)).size >= 2 && !st.decisions.some((d) => d.featureId === x.id && d.kind === 'variant' && d.status === 'decided'));
  if (!f) return;
  const dirs = [...new Set(f.variants.map((v) => v.direction).filter(Boolean))];
  st.app.directionId = dirs[0];
  assert.equal(resolveVariant(st, f, 'mix').variant.direction, dirs[0]);
  assert.equal(resolveVariant(st, f, 'mix').source, 'app');
  st.modules.find((m) => m.id === f.moduleId).directionId = dirs[1];
  assert.equal(resolveVariant(st, f, 'mix').variant.direction, dirs[1]);
  assert.equal(resolveVariant(st, f, 'mix').source, 'modul');
  st.decisions.push({ featureId: f.id, kind: 'variant', status: 'decided' });
  assert.equal(resolveVariant(st, f, 'mix').source, 'feature');
});

test('Pseudoversion pin: nur das angeheftete Feature weicht ab', () => {
  const st = buildSeedState();
  const f = st.features.find((x) => x.variants.length >= 2);
  const other = f.variants.find((v) => v.id !== f.selectedVariantId);
  const id = `pin:${f.id}:${other.id}`;
  assert.equal(versionById(st, id).kind, 'pin');
  assert.equal(resolveVariant(st, f, id).variant.id, other.id);
  const g = st.features.find((x) => x.id !== f.id && x.variants.length);
  assert.equal(resolveVariant(st, g, id).variant.id, g.variants.find((v) => v.id === g.selectedVariantId)?.id || g.variants[0].id);
  assert.ok(versionCoverage(st, 'mix').total > 0);
});

test('Gezielte Szenario-Werte der Welt-Dateien werden angewendet', () => {
  for (const id of ['erststart', 'stress']) {
    const w = applyScenario(WORLD, id);
    for (const src of WORLD_SCENARIOS) for (const [k, v] of Object.entries(src?.[id] || {})) {
      if (Array.isArray(v)) assert.deepEqual(w[k], v, `${id}: ${k} nicht übernommen`);
    }
  }
});

test('Erster Start: Summen-Zahlen der Nutzerdaten sind 0', () => {
  const w = applyScenario(WORLD, 'erststart');
  for (const [k, v] of Object.entries(WORLD)) if (typeof v === 'number' && !isReferenceKey(k, v) && !targeted('erststart').has(k)) assert.equal(w[k], 0, `${k} nicht 0`);
  // Konfiguration bleibt (z. B. Ernährungsziele, Profil)
  for (const [k, v] of Object.entries(WORLD)) if (v && typeof v === 'object' && !Array.isArray(v) && /(Goals|Profile)$/.test(k) && !targeted('erststart').has(k)) assert.deepEqual(w[k], v, `${k} verändert`);
});
