// Dokumente & Verträge: Manifest (Startseite in drei strukturell verschiedenen Richtungen, Navigation, Bindungen, Komponenten, Entscheidungen).
import './_helpers.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MANIFESTS } from '../app/src/seed/index.js';
import { COMPONENTS, getComponent, validateComponent } from '../app/src/library/registry.js';
import { WORLD } from '../app/src/seed/world/index.js';
import { MODULES } from '../app/src/library/components/crosscut/_system.js';

const man = MANIFESTS.find((m) => m.module.id === 'documents');
const feat = (id) => man.features.find((f) => f.id === id);
const ALL = new Set(MANIFESTS.flatMap((m) => m.features.map((f) => f.id)));
const dok = COMPONENTS.filter((c) => c.id.startsWith('dok-'));

test('Modulfelder: Startseite, Bereich, Ausbaustufe, lokal, Rechtshinweis, Annahme', () => {
  const m = man.module;
  assert.equal(m.name, 'Dokumente & Verträge'); assert.equal(m.homeFeatureId, 'documents.home'); assert.equal(m.area, 'Wissen & Inhalte'); assert.equal(m.stage, 4);
  assert.equal(m.offline, 'lokal'); assert.equal(m.assumption, true); assert.deepEqual(m.legal, ['dokumente', 'steuer-ordner', 'gewaehrleistung']); assert.ok(m.dataSource && m.docs.includes('## Leitidee') && m.docs.includes('## Offene Fragen'));
  assert.deepEqual(MODULES.find((x) => x.id === 'documents'), { id: 'documents', name: 'Dokumente & Verträge', icon: 'folder', area: 'Wissen & Inhalte', home: 'documents.home', desc: 'Verträge, Fristen, Belege' });
});

test('Feature-IDs, Tiers und Varianten wie im Bauplan', () => {
  const tiers = { 'documents.home': 1, 'documents.contracts': 2, 'documents.contract': 2, 'documents.list': 3, 'documents.detail': 2, 'documents.warranties': 3, 'documents.tax-folder': 3, 'documents.scan-in': 3, 'documents.settings': 3 };
  for (const [id, tier] of Object.entries(tiers)) { assert.ok(feat(id), id); assert.equal(feat(id).tier, tier, id); assert.ok(feat(id).usage && feat(id).purpose && feat(id).requirements.length, id); }
  assert.equal(feat('documents.contracts').variants.length, 2);
  assert.ok(feat('documents.home').acceptance.length >= 3 && feat('documents.home').acceptance.length <= 6 && feat('documents.home').flows.length >= 1);
});

test('Startseite: drei Richtungen, strukturell verschieden, jede Variante bindet die Welt', () => {
  const vs = feat('documents.home').variants;
  assert.deepEqual(vs.map((v) => v.direction), ['kompakt', 'visuell', 'fokus']);
  const sig = vs.map((v) => `${v.layout.type}|${v.blocks.filter((b) => b.id !== 'hdr' && b.id !== 'legal').map((b) => `${b.component}:${b.props.style || ''}`).join(',')}`);
  assert.equal(new Set(sig).size, 3, 'Layout oder Komponentenwahl unterscheidet sich');
  assert.equal(new Set(vs.map((v) => v.layout.type)).size >= 2, true);
  const dd = feat('documents.home').demoData;
  for (const v of vs) { assert.ok(v.blocks.some((b) => b.component === 'dok-deadlines'), `${v.id}: Fristen`); assert.ok(v.blocks.some((b) => b.component === 'dok-folders'), `${v.id}: Ordner`); assert.ok(v.blocks.some((b) => b.component === 'dok-list'), `${v.id}: zuletzt hinzugefügt`); assert.ok(v.blocks.some((b) => b.component === 'legal-notice')); }
  for (const f of man.features) for (const v of f.variants) for (const b of v.blocks) for (const key of Object.values(b.bind || {})) assert.ok(key in f.demoData, `${f.id}/${v.id}#${b.id}: ${key}`);
  for (const f of man.features) for (const val of Object.values(f.demoData || {})) if (typeof val === 'string' && val.startsWith('@world:')) assert.ok(val.slice(7) in WORLD, val);
  assert.equal(dd.contracts, '@world:contracts'); assert.equal(dd.folders, '@world:documentFolders'); assert.equal(dd.tax, '@world:taxFolder');
});

test('Navigation: jedes Ziel existiert, hat eine Variante und das Event wird von einer Komponente der Variante ausgelöst', () => {
  const emits = (v) => new Set(v.blocks.flatMap((b) => [...(getComponent(b.component)?.events || []), ...(b.component === 'page-header' ? ['header.primary', 'header.secondary'].filter((e) => (e === 'header.primary' ? b.props.primaryLabel : b.props.secondaryLabel)) : [])]));
  for (const f of man.features) for (const i of f.interactions.filter((x) => x.to)) {
    assert.ok(ALL.has(i.to), `${f.id}: Ziel ${i.to}`);
    if (i.to.startsWith('documents.')) assert.ok(feat(i.to).variants.length, `${i.to} ohne Variante`);
    assert.ok(f.variants.some((v) => emits(v).has(i.event)), `${f.id}: Event ${i.event} wird von keiner Variante ausgelöst`);
  }
  const reached = new Set(man.features.flatMap((f) => f.interactions.map((i) => i.to)).filter(Boolean));
  for (const f of man.features.filter((x) => x.variants.length && x.id !== 'documents.home')) assert.ok(reached.has(f.id), `${f.id} ist nicht per Navigation erreichbar`);
  const vs = feat('documents.home').variants;
  for (const v of vs) { const e = emits(v); const tos = new Set(feat('documents.home').interactions.filter((i) => i.to && e.has(i.event)).map((i) => i.to)); assert.ok(tos.size >= 4, `Startseite ${v.id}: nur ${tos.size} Ziele`); }
  assert.equal(feat('documents.scan-in').interactions.find((i) => i.event === 'scan.open').to, 'picture-to-text.scanner');
  assert.equal(feat('documents.contract').interactions.find((i) => i.event === 'cost.open').to, 'finance.subscriptions');
});

test('Legal-Hinweis in jeder Variante der Module-Features mit Steuer- oder Rechtsbezug', () => {
  for (const id of ['documents.home', 'documents.contracts', 'documents.contract', 'documents.warranties', 'documents.tax-folder', 'documents.settings']) for (const v of feat(id).variants) assert.ok(v.blocks.some((b) => b.component === 'legal-notice'), `${id}/${v.id}`);
});

test('Entscheidungen: mindestens zwei, davon eine offen mit Empfehlung', () => {
  assert.ok(man.decisions.length >= 2); const open = man.decisions.filter((d) => d.status === 'open');
  assert.ok(open.length >= 1 && open.every((d) => /Empfehlung/.test(d.rationale))); assert.ok(man.decisions.some((d) => d.status === 'decided' && d.decision));
  for (const d of man.decisions) assert.ok(feat(d.featureId), d.featureId);
});

test('Komponenten: Vertrag, example, flutter-Feld, Präfix, Leerzustand und keine Hex-Farben', async () => {
  assert.equal(dok.length, 11);
  const fs = await import('node:fs'), path = await import('node:path');
  const dir = path.resolve(import.meta.dirname, '../app/src/library/components/documents');
  for (const c of dok) {
    assert.deepEqual(validateComponent(c), [], c.id); assert.equal(c.category, 'Dokumente'); assert.ok(c.flutter?.widget && c.flutter.propMap && c.flutter.events, `${c.id}: flutter`);
    assert.ok(c.example && c.version && Array.isArray(c.events) && c.events.length, c.id); assert.ok(c.states.includes('empty'), `${c.id}: Leerzustand`);
    for (const slot of c.data) assert.ok(slot.slot && slot.shape, `${c.id}: Slot`);
  }
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.js'))) {
    const code = fs.readFileSync(path.join(dir, f), 'utf8');
    assert.ok(!/#[0-9a-fA-F]{3,8}\b/.test(code.replace(/&#\d+;/g, '')), `${f}: Hex-Farbe`); assert.ok(!/Date\.now|Math\.random|new Date\(\)|Intl\./.test(code), `${f}: nicht deterministisch`);
    assert.ok(code.split('\n').length <= 250, `${f}: zu lang`);
  }
});
