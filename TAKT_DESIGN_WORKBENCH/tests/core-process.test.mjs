// Versionen, Varianten-Auflösung, Entscheidungs-Rangfolge, Arbeitsauftrag, Spezifikation und Payloads.
// Synthetische Zustände halten die Tests unabhängig vom Seed, der gerade von anderen Paketen wächst.
import './_helpers.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadWorkbench, seedClone } from './_helpers.mjs';

const wb = await loadWorkbench();
const { schema, directions, process: proc, workorder, spec, payload, versioning, registry } = wb;
const { emptyState, createModule, createFeature, createDecision } = schema;
const NOW = new Date(2026, 10, 24, 9, 30);
const day = (n) => new Date(2026, 10, 24 + n, 9, 30).toISOString();

const blk = (id, component, extra = {}) => ({ id, component, region: 'main', ...extra });
const comp = registry.COMPONENTS[0].id;

/** Zwei Module, vier Features; Feature a.home hat drei Varianten (kompakt, visuell, ohne Richtung). */
function synth() {
  const s = emptyState();
  s.world = {};
  s.modules = [createModule({ id: 'a', name: 'Modul A' }), createModule({ id: 'b', name: 'Modul B' })];
  s.features = [
    createFeature({ id: 'a.home', moduleId: 'a', name: 'Start A', group: 'Übersicht', variants: [
      { id: 'v1', name: 'Kompakt', direction: 'kompakt', blocks: [blk('b1', comp)] },
      { id: 'v2', name: 'Visuell', direction: 'visuell', blocks: [blk('b1', comp)] },
      { id: 'v3', name: 'Neutral', direction: null, blocks: [blk('b1', comp)] },
    ], selectedVariantId: 'v3', demoData: { items: [1] },
    interactions: [{ trigger: 'Tippen', event: 'row.open', to: 'a.detail' }] }),
    createFeature({ id: 'a.detail', moduleId: 'a', name: 'Detail A', variants: [{ id: 'd1', name: 'Detail', direction: 'fokus', blocks: [blk('b1', comp)] }], links: ['a.home'] }),
    createFeature({ id: 'b.list', moduleId: 'b', name: 'Liste B', variants: [] }),
    createFeature({ id: 'b.stats', moduleId: 'b', name: 'Statistik B', variants: [{ id: 's1', name: 'S', direction: null, blocks: [] }] }),
  ];
  return s;
}

test('listVersions: Arbeitsstand, je Richtung dir:<id>, Freigabe', () => {
  const s = synth();
  const ids = directions.listVersions(s).map((v) => v.id);
  assert.equal(ids[0], 'arbeitsstand');
  for (const d of s.directions) assert.ok(ids.includes(`dir:${d.id}`), d.id);
  assert.ok(ids.includes('freigabe'));
  assert.equal(new Set(ids).size, ids.length);
});

test('listVersions nutzt die Standardrichtungen, wenn der Zustand keine hat', () => {
  const ids = directions.listVersions({ directions: [] }).map((v) => v.id);
  assert.ok(['dir:kompakt', 'dir:visuell', 'dir:fokus'].every((x) => ids.includes(x)));
});

test('resolveVariant: Arbeitsstand liefert die bevorzugte Variante', () => {
  const s = synth(), r = directions.resolveVariant(s, s.features[0], 'arbeitsstand');
  assert.equal(r.variant.id, 'v3');
  assert.equal(r.source, 'selected');
});

test('resolveVariant: Richtung wählt passende Variante, sonst Rückfall auf den Arbeitsstand', () => {
  const s = synth(), f = s.features[0];
  assert.deepEqual([directions.resolveVariant(s, f, 'dir:kompakt').variant.id, directions.resolveVariant(s, f, 'dir:kompakt').source], ['v1', 'direction']);
  assert.equal(directions.resolveVariant(s, f, 'dir:visuell').variant.id, 'v2');
  const fb = directions.resolveVariant(s, f, 'dir:fokus');
  assert.deepEqual([fb.variant.id, fb.source], ['v3', 'fallback']);
});

test('resolveVariant: Feature ohne Variante ergibt source „none“', () => {
  const s = synth();
  for (const v of ['arbeitsstand', 'dir:kompakt', 'freigabe']) {
    const r = directions.resolveVariant(s, s.features[2], v);
    assert.equal(r.variant, null, v);
    assert.equal(r.source, 'none', v);
  }
});

test('resolveVariant: Freigabe nutzt den Snapshot, sonst Rückfall', () => {
  const s = synth(), f = s.features[0];
  assert.equal(directions.resolveVariant(s, f, 'freigabe').source, 'fallback');
  const ver = versioning.makeVersion(f, { kind: 'release' });
  ver.snapshot.selectedVariantId = 'v1';
  s.versions.push(ver); f.releasedVersionId = ver.id; f.selectedVariantId = 'v2';
  const r = directions.resolveVariant(s, f, 'freigabe');
  assert.deepEqual([r.variant.id, r.source], ['v1', 'freigabe']);
  assert.equal(directions.resolveVariant(s, f, 'arbeitsstand').variant.id, 'v2');
});

test('versionCoverage zählt Features mit eigener Variante der Richtung', () => {
  const s = synth();
  assert.deepEqual(directions.versionCoverage(s, 'dir:kompakt'), { total: 3, own: 1, ratio: 1 / 3 });
  assert.equal(directions.versionCoverage(s, 'dir:kompakt', 'b').own, 0);
  assert.equal(directions.versionCoverage(s, 'arbeitsstand').own, 3);
});

test('moduleHome: explizite Startseite, sonst Übersicht, sonst erstes Feature mit Variante', () => {
  const s = synth();
  assert.equal(directions.moduleHome(s, 'a'), 'a.home');
  assert.equal(directions.moduleHome(s, 'b'), 'b.stats');
  s.modules[0].homeFeatureId = 'a.detail';
  assert.equal(directions.moduleHome(s, 'a'), 'a.detail');
  assert.equal(directions.moduleHome(s, 'gibt-es-nicht'), null);
});

test('navigationRules: nur Interaktionen mit Ereignis und Ziel', () => {
  const s = synth();
  assert.deepEqual(directions.navigationRules(s.features[0]), [{ event: 'row.open', to: 'a.detail', label: 'Tippen' }]);
  assert.deepEqual(directions.navigationRules(s.features[1]), []);
});

test('Versionsnummern: bumpMinor, bumpMajor, compareVersions', () => {
  assert.equal(versioning.bumpMinor('0.3'), '0.4');
  assert.equal(versioning.bumpMajor('1.2'), '2.0');
  assert.ok(versioning.compareVersions('1.10', '1.9') > 0);
  assert.equal(versioning.compareVersions('2.0', '2.0'), 0);
});

test('diffSnapshots erkennt Anforderungen, Varianten und Auswahl', () => {
  const s = synth(), f = s.features[0];
  const a = versioning.snapshotOf(f);
  f.requirements.push({ id: 'r9', text: 'Neu', type: 'info', priority: 'must' });
  f.selectedVariantId = 'v1';
  const diff = versioning.diffSnapshots(a, versioning.snapshotOf(f));
  assert.ok(diff.some((x) => x.area === 'Anforderungen' && x.text.startsWith('+')));
  assert.ok(diff.some((x) => x.area === 'Auswahl'));
  assert.deepEqual(versioning.diffSnapshots(a, a), []);
});

test('blocking: App-Entscheidung betrifft alle Features, Modul nur seine, Feature sich und Verknüpfte', () => {
  const s = synth();
  assert.equal(proc.blocking(s, { level: 'app' }), 4);
  assert.equal(proc.blocking(s, { level: 'module', moduleId: 'a' }), 2);
  assert.equal(proc.blocking(s, { level: 'feature', featureId: 'a.home' }), 2);   // a.detail verlinkt a.home
  assert.equal(proc.blocking(s, { level: 'feature', featureId: 'b.list' }), 1);
});

test('rankDecisions sortiert nach Blockierwirkung (absteigend)', () => {
  const s = synth();
  s.decisions = [
    createDecision({ id: 'f', title: 'Feature', level: 'feature', featureId: 'b.list', createdAt: day(0) }),
    createDecision({ id: 'a', title: 'App', level: 'app', createdAt: day(0) }),
    createDecision({ id: 'm', title: 'Modul', level: 'module', moduleId: 'a', createdAt: day(0) }),
  ];
  const r = proc.rankDecisions(s, NOW);
  assert.deepEqual(r.map((x) => x.d.id), ['a', 'm', 'f']);
  assert.ok(r.every((x, i, arr) => i === 0 || arr[i - 1].score >= x.score));
  assert.equal(r[0].blocks, 4);
  assert.match(r[0].reason, /blockiert 4 Features/);
});

test('rankDecisions: schwer umkehrbare und ältere Entscheidungen rücken nach oben', () => {
  const s = synth();
  s.decisions = [
    createDecision({ id: 'leicht', level: 'feature', featureId: 'b.list', reversibility: 'leicht', createdAt: day(0) }),
    createDecision({ id: 'hart', level: 'feature', featureId: 'b.stats', reversibility: 'unumkehrbar', createdAt: day(0) }),
    createDecision({ id: 'alt', level: 'feature', featureId: 'a.detail', reversibility: 'leicht', createdAt: day(-60) }),
  ];
  const ids = proc.rankDecisions(s, NOW).map((x) => x.d.id);
  assert.equal(ids[0], 'hart');
  assert.ok(ids.indexOf('alt') < ids.indexOf('leicht'));
});

test('rankDecisions: nur offene und fällig geparkte Entscheidungen', () => {
  const s = synth();
  s.decisions = [
    createDecision({ id: 'offen', level: 'app', status: 'open', createdAt: day(0) }),
    createDecision({ id: 'fertig', level: 'app', status: 'decided', createdAt: day(0) }),
    createDecision({ id: 'parkt', level: 'app', status: 'parked', revisitAt: day(5), createdAt: day(0) }),
    createDecision({ id: 'faellig', level: 'app', status: 'parked', revisitAt: day(-1), createdAt: day(0) }),
  ];
  assert.deepEqual(proc.rankDecisions(s, NOW).map((x) => x.d.id).sort(), ['faellig', 'offen']);
  assert.equal(proc.revisitDue(s, s.decisions[2], NOW), false);
  assert.equal(proc.revisitDue(s, s.decisions[3], NOW), true);
});

test('tierOf: explizit, Startseiten-Muster, Variantenzahl', () => {
  assert.equal(proc.tierOf({ id: 'x.y', tier: 2, variants: [], group: '' }), 2);
  assert.equal(proc.tierOf({ id: 'x.home', variants: [], group: '' }), 1);
  assert.equal(proc.tierOf({ id: 'x.y', variants: [1], group: 'Details' }), 2);
  assert.equal(proc.tierOf({ id: 'x.y', variants: [], group: 'Details' }), 3);
});

test('Gates und Score: gateSummary und weightedScore', () => {
  const s = synth();
  assert.deepEqual(proc.gateSummary([{ ok: true }, { ok: false }]), { passed: 1, total: 2, ok: false });
  s.scores = { 'a.home': { v1: { schnelligkeit: 5, optik: 3 } } };
  s.app.weights = { schnelligkeit: 3, optik: 1 };
  assert.equal(proc.weightedScore(s, 'a.home', 'v1'), 4.5);
  assert.equal(proc.weightedScore(s, 'a.home', 'v2'), null);
  assert.ok(proc.featureReady(s, s.features[0]).length >= 5);
});

test('workOrderMarkdown enthält alle Abschnitte', () => {
  const s = synth();
  s.decisions = [
    createDecision({ id: 'd1', title: 'Navigation unten', level: 'app', status: 'decided', chosen: 'a', options: [{ id: 'a', label: 'Untere Leiste' }], decidedAt: day(0), rationale: 'Daumen' }),
    createDecision({ id: 'd2', title: 'Später klären', level: 'module', moduleId: 'a', status: 'parked', revisitIf: 'nach Phase 1' }),
    createDecision({ id: 'd3', title: 'Noch offen', level: 'app', createdAt: day(0) }),
  ];
  s.pins = [{ id: 'p1', status: 'offen', severity: 'muss', text: 'Zahl zu klein', featureId: 'a.home' }];
  s.feedback = [{ id: 'f1', choose: true, target: 'a.home', versionName: 'Kompakt', comment: 'gefällt mir' }];
  const md = workorder.workOrderMarkdown(s);
  for (const part of ['# Arbeitsauftrag', '## 1. Entschieden – umsetzen (1)', '## 2. Änderungen nötig (1)', '## 3. Feedback aus dem Demo-Launcher (1)', '## 4. Geparkt (1)', '## Als Nächstes entscheiden', '## Prüfschritte']) assert.ok(md.includes(part), part);
  for (const text of ['Navigation unten', 'Untere Leiste', 'Zahl zu klein', 'Später klären', 'Noch offen', 'npm run check']) assert.ok(md.includes(text), text);
});

test('workOrderMarkdown ohne Inhalte nennt die leeren Abschnitte, ohne Feedback-Abschnitt', () => {
  const md = workorder.workOrderMarkdown(synth());
  assert.ok(md.includes('_Keine neuen Entscheidungen._') && md.includes('_Keine offenen Anmerkungen._') && md.includes('_Nichts geparkt._'));
  assert.ok(md.includes('## 3. Geparkt (0)'));
});

test('workOrderMarkdown auf dem echten Seed liefert die Pflichtabschnitte', async () => {
  const md = workorder.workOrderMarkdown(await seedClone(), { getComponent: registry.getComponent });
  assert.ok(md.startsWith('# Arbeitsauftrag'));
  assert.ok(md.includes('## 1. Entschieden') && md.includes('## Prüfschritte'));
});

test('featureSpecMarkdown und moduleSpecMarkdown nennen Feature, Komponente und Navigation', () => {
  const s = synth();
  const md = spec.featureSpecMarkdown(s, 'a.home', { getComponent: registry.getComponent });
  assert.ok(md.includes('Start A'));
  assert.ok(md.includes(comp) || md.includes(registry.getComponent(comp).name));
  assert.equal(spec.featureSpecMarkdown(s, 'gibt-es-nicht', { getComponent: registry.getComponent }), '');
  assert.ok(spec.moduleSpecMarkdown(s, 'a', { getComponent: registry.getComponent }).includes('Modul A'));
});

test('buildAppPayload: Version, Module, Abdeckung und Startfeature', () => {
  const s = synth();
  const p = payload.buildAppPayload(s, 'dir:kompakt');
  assert.equal(p.mode, 'app');
  assert.equal(p.versionId, 'dir:kompakt');
  assert.deepEqual(p.modules.map((m) => m.id), ['a', 'b']);
  assert.deepEqual(p.coverage, { own: 1, total: 3 });
  assert.equal(p.features['a.home'].variant.id, 'v1');
  assert.equal(p.features['a.home'].nav[0].to, 'a.detail');
  assert.equal(p.features['b.list'].variant, null);
  assert.ok(p.features['b.list'].requirements, 'Features ohne Variante liefern Anforderungen für die Platzhalteransicht');
  assert.equal(p.startFeatureId, 'a.home');
  assert.equal(payload.buildAppPayload(s, 'gibt-es-nicht').versionId, 'arbeitsstand');
});

test('buildFeaturePayload und buildComponentPayload', () => {
  const s = synth();
  const f = payload.buildFeaturePayload(s, 'a.home', 'v2', { theme: 'horizon' });
  assert.deepEqual([f.mode, f.theme, f.variant.id, f.feature.id, f.today], ['feature', 'horizon', 'v2', 'a.home', payload.DEFAULT_TODAY]);
  assert.throws(() => payload.buildFeaturePayload(s, 'x.y'), /nicht gefunden/);
  const c = payload.buildComponentPayload(comp);
  assert.deepEqual([c.mode, c.component.id], ['component', comp]);
  assert.throws(() => payload.buildComponentPayload('gibt-es-nicht'), /nicht registriert/);
});
