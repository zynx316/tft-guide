// Seed, Migration und Referenzen. Inhalte, die andere Pakete gerade bauen (Komponenten-Referenzen, Welt-Bindungen,
// Navigationsziele), werden als Diagnose gemeldet und lassen den Test nicht scheitern.
import './_helpers.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadWorkbench, seedClone, report, worldOf } from './_helpers.mjs';

const wb = await loadWorkbench();
const { schema, seed, registry, world } = wb;
const state = await seedClone();
const featureIds = new Set(state.features.map((f) => f.id));
const moduleIds = new Set(state.modules.map((m) => m.id));
const WORLD_NOW = await worldOf(state);

test('buildSeedState liefert Module, Features, Varianten und die aktuelle Schemaversion', () => {
  assert.equal(state.schemaVersion, schema.SCHEMA_VERSION);
  assert.ok(state.modules.length >= 10 && state.features.length >= 50);
  assert.ok(state.features.some((f) => f.variants.length > 1));
  assert.equal(state.meta.seedVersion, seed.SEED_VERSION);
  assert.ok(state.directions.length >= 3);
});

test('migrate ist idempotent: zweimal angewendet ergibt dasselbe wie einmal', () => {
  const once = schema.migrate(structuredClone(state));
  const twice = schema.migrate(structuredClone(once));
  assert.deepEqual(twice, once);
});

test('Seed übersteht JSON-Rundlauf und Migration unverändert', () => {
  const round = schema.migrate(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(round, state);
});

test('migrate ergänzt fehlende Felder eines alten, minimalen Zustands', async () => {
  const m = schema.migrate({ modules: [{ id: 'a', name: 'A' }], features: [{ id: 'a.x', moduleId: 'a', name: 'X' }] });
  assert.equal(m.schemaVersion, schema.SCHEMA_VERSION);
  assert.ok(m.app && m.directions.length >= 3 && Array.isArray(m.feedback) && Array.isArray(m.pins));
  assert.equal(m.modules[0].status, 'concept');
  assert.deepEqual(m.features[0].states, ['default', 'empty', 'loading', 'error']);
  assert.ok(Object.keys(await worldOf(m)).length > 0);
});

test('migrate lehnt Unsinn ab und behält Zusatzdaten des Zustands', () => {
  const m = schema.migrate({ modules: [], features: [], scores: { 'a.x': { v1: { optik: 4 } } } });
  assert.equal(m.scores['a.x'].v1.optik, 4);
  assert.throws(() => schema.migrate(null), /Ungültig/);
  assert.throws(() => schema.migrate('text'), /Ungültig/);
});

test('inspectImport meldet Strukturfehler und zu neue Schemaversionen', () => {
  assert.equal(schema.inspectImport(state).ok, true);
  assert.equal(schema.inspectImport(null).ok, false);
  assert.ok(schema.inspectImport({ modules: [] }).errors.includes('features fehlt'));
  assert.equal(schema.inspectImport({ modules: [], features: [], schemaVersion: 99 }).ok, false);
  assert.equal(schema.inspectImport(state).summary.features, state.features.length);
});

test('mergeSeed auf vollständigem Zustand ergänzt nichts, nach Entfernen eines Moduls bringt es dieses zurück', () => {
  const full = structuredClone(state);
  const none = seed.mergeSeed(full);
  assert.deepEqual([none.modules.length, none.features.length], [0, 0]);
  const cut = structuredClone(state);
  const gone = cut.modules.pop();
  cut.features = cut.features.filter((f) => f.moduleId !== gone.id);
  const added = seed.mergeSeed(cut);
  assert.deepEqual(added.modules, [gone.name]);
  assert.equal(cut.features.length, state.features.length);
});

test('IDs: Module und Features eindeutig, jedes Feature gehört zu einem Modul', () => {
  assert.equal(moduleIds.size, state.modules.length);
  assert.equal(featureIds.size, state.features.length);
  assert.deepEqual(state.features.filter((f) => !moduleIds.has(f.moduleId)).map((f) => f.id), []);
});

test('Varianten: IDs und Block-IDs eindeutig, bevorzugte Variante existiert', () => {
  const bad = [];
  for (const f of state.features) {
    const vIds = f.variants.map((v) => v.id);
    if (new Set(vIds).size !== vIds.length) bad.push(`${f.id}: doppelte Varianten-ID`);
    if (f.selectedVariantId && !vIds.includes(f.selectedVariantId)) bad.push(`${f.id}: selectedVariantId fehlt`);
    for (const v of f.variants) { const b = v.blocks.map((x) => x.id); if (new Set(b).size !== b.length) bad.push(`${f.id}/${v.id}: doppelte Block-ID`); }
  }
  assert.deepEqual(bad, []);
});

test('jede Variante referenziert nur existierende Komponenten (nur Meldung)', (t) => {
  const bad = [];
  for (const f of state.features) for (const v of f.variants) for (const b of v.blocks) if (!registry.getComponent(b.component)) bad.push(`${f.id}/${v.id}#${b.id}: ${b.component}`);
  report(t, 'Unbekannte Komponenten in Varianten', bad);
});

test('alle @world:-Bindungen lösen auf (nur Meldung) und werden gezählt', (t) => {
  const bad = []; let n = 0;
  for (const f of state.features) for (const [k, v] of Object.entries(f.demoData || {})) {
    if (!world.isWorldRef(v)) continue;
    n++;
    if (!(world.worldKey(v) in WORLD_NOW)) bad.push(`${f.id}.${k} → ${v}`);
  }
  t.diagnostic(`${n} Welt-Bindungen geprüft`);
  report(t, 'Offene Welt-Bindungen', bad);
  assert.ok(n > 0, 'es sollte mindestens eine @world:-Bindung geben');
});

test('Welt-Helfer: isWorldRef, worldKey und worldFor', () => {
  assert.equal(world.isWorldRef('@world:tasks'), true);
  assert.equal(world.isWorldRef('tasks'), false);
  assert.equal(world.isWorldRef(5), false);
  assert.equal(world.worldKey('@world:tasks'), 'tasks');
  const key = Object.keys(WORLD_NOW).find((k) => k !== 'scenarios');
  const out = wb.payload.worldFor(state, { a: `@world:${key}`, b: '@world:gibt-es-nicht', c: 'x' });
  assert.deepEqual(Object.keys(out), [key]);
});

test('Datenbindungen (bind) zeigen auf vorhandene demoData-Schlüssel (nur Meldung)', (t) => {
  const bad = [];
  for (const f of state.features) for (const v of f.variants) for (const b of v.blocks) for (const key of Object.values(b.bind || {})) if (!(key in (f.demoData || {}))) bad.push(`${f.id}/${v.id}#${b.id}: ${key}`);
  report(t, 'Bindungen ohne Demo-Daten', bad);
});

test('jedes interaction.to zeigt auf ein Feature oder module:<id> (nur Meldung als Liste)', (t) => {
  const bad = []; let n = 0;
  for (const f of state.features) for (const i of f.interactions) {
    if (!i.to) continue;
    n++;
    const ok = featureIds.has(i.to) || (i.to.startsWith('module:') && moduleIds.has(i.to.slice(7))) || i.to === 'shell:launchpad';
    if (!ok) bad.push(`${f.id} → ${i.to}`);
  }
  t.diagnostic(`${n} Navigationsziele geprüft`);
  report(t, 'Tote Navigationsziele', bad);
});

test('Varianten tragen eine bekannte Richtung oder keine (nur Meldung)', (t) => {
  const dirs = new Set(state.directions.map((d) => d.id));
  const bad = state.features.flatMap((f) => f.variants.filter((v) => v.direction && !dirs.has(v.direction)).map((v) => `${f.id}/${v.id}: ${v.direction}`));
  report(t, 'Unbekannte Richtungen', bad);
});

test('Seed-Größe und Modul-Startseiten (nur Meldung)', (t) => {
  const mb = JSON.stringify(state).length / 1048576;
  t.diagnostic(`Seed-Zustand: ${mb.toFixed(2).replace('.', ',')} MB`);
  const noHome = state.modules.filter((m) => m.homeFeatureId && !featureIds.has(m.homeFeatureId)).map((m) => `${m.id} → ${m.homeFeatureId}`);
  report(t, 'Startseiten ohne Feature', noHome);
  assert.ok(mb < 8, 'Seed ist unplausibel groß');
});

test('Requirements, Interactions und Entscheidungen sind normalisiert', () => {
  for (const f of state.features.slice(0, 40)) {
    assert.ok(f.requirements.every((r) => r.id && r.type && r.priority), f.id);
    assert.ok(f.interactions.every((i) => i.id && 'to' in i), f.id);
  }
  assert.ok(state.decisions.every((d) => d.id && d.status && d.level));
});
