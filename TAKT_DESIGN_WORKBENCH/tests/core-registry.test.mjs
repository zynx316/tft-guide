// Registry der Bibliothekskomponenten. Inhalte, die andere Pakete gerade bauen, werden nur gemeldet.
import './_helpers.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadWorkbench, report } from './_helpers.mjs';

const { registry } = await loadWorkbench();
const { COMPONENTS, CATEGORY_ORDER, getComponent, componentsByCategory, defaultProps, validateComponent } = registry;
const name = (c) => c?.id || '(ohne id)';
const COMPONENTS_DIR = path.resolve(import.meta.dirname, '../app/src/library/components');
const areaDirs = fs.readdirSync(COMPONENTS_DIR).filter((a) => fs.statSync(path.join(COMPONENTS_DIR, a)).isDirectory()).sort();
/** Standardexport (Komponentenliste) des index.js je Bereich. */
const areaLists = new Map();
for (const a of areaDirs) areaLists.set(a, (await import(pathToFileURL(path.join(COMPONENTS_DIR, a, 'index.js')).href)).default);
const areaSource = (a) => fs.readdirSync(path.join(COMPONENTS_DIR, a)).filter((f) => f.endsWith('.js')).map((f) => fs.readFileSync(path.join(COMPONENTS_DIR, a, f), 'utf8')).join('\n');

test('registry.js lässt sich in Node ohne DOM importieren und enthält Komponenten', () => {
  assert.ok(Array.isArray(COMPONENTS));
  assert.ok(COMPONENTS.length >= 60, `nur ${COMPONENTS.length} Komponenten`);
});

test('jede Komponente hat id (kebab-case), name, category und eine render-Funktion', () => {
  const bad = COMPONENTS.filter((c) => !(/^[a-z0-9-]+$/.test(c.id || '') && c.name && c.category && typeof c.render === 'function')).map(name);
  assert.deepEqual(bad, []);
});

test('Doppelte Komponenten-IDs sind ein Fehler (ganze Registry, mit Nennung der Bereiche)', () => {
  const where = new Map();
  for (const [area, list] of areaLists) for (const c of list) where.set(c.id, [...(where.get(c.id) || []), area]);
  const dup = [...where].filter(([, areas]) => areas.length > 1).map(([id, areas]) => `${id} (${areas.join(', ')})`);
  assert.deepEqual(dup, [], `doppelte Komponenten-IDs: ${dup.join('; ')}`);
  const seen = new Set(), flat = [];
  for (const c of COMPONENTS) { if (seen.has(c.id)) flat.push(c.id); seen.add(c.id); }
  assert.deepEqual(flat, [], `doppelte IDs in COMPONENTS: ${flat.join(', ')}`);
  assert.equal(COMPONENTS.length, [...areaLists.values()].reduce((n, l) => n + l.length, 0), 'COMPONENTS ist nicht die Summe der Bereichslisten');
});

test('Jeder Bereich registriert nur Komponenten aus den eigenen Dateien (keine Hilfsregistrierung über fremde index-Listen)', () => {
  const foreign = [];
  for (const [area, list] of areaLists) {
    const src = areaSource(area);
    for (const c of list) if (!src.includes(`id: '${c.id}'`)) foreign.push(`${c.id} in ${area}`);
  }
  assert.deepEqual(foreign, []);
});

test('Jede exportierte Komponente eines Bereichs ist in dessen index.js registriert (keine toten Definitionen)', () => {
  const missing = [];
  for (const [area, list] of areaLists) {
    const ids = new Set(list.map((c) => c.id));
    for (const m of areaSource(area).matchAll(/export const (\w+) = \{\s*\n\s*id: '([a-z0-9-]+)'/g)) if (!ids.has(m[2])) missing.push(`${m[2]} (${area}/${m[1]})`);
  }
  assert.deepEqual(missing, []);
});

test('Inhalts-Komponenten (Notizen, Wissen, Erfassen, Erkennung) stehen im Bereich „content“ und nicht in „insights“', () => {
  const content = new Set(areaLists.get('content').map((c) => c.id)), insights = new Set(areaLists.get('insights').map((c) => c.id));
  for (const id of ['note-checklists', 'note-inbox', 'note-focus', 'kb-areas', 'kb-next', 'capture-launcher', 'doc-scanner', 'receipt-review', 'business-card']) {
    assert.ok(content.has(id), `${id} fehlt in content/index.js`);
    assert.ok(!insights.has(id), `${id} darf nicht über insights registriert werden`);
  }
});

test('Vertragsfelder: description, example, version, props als Liste (nur Meldung)', (t) => {
  const missing = [];
  for (const c of COMPONENTS) {
    if (!c.description) missing.push(`${name(c)}: description`);
    if (!c.example) missing.push(`${name(c)}: example`);
    if (!c.version) missing.push(`${name(c)}: version`);
    if (c.props && !Array.isArray(c.props)) missing.push(`${name(c)}: props`);
  }
  report(t, 'Vertragsfelder', missing);
});

test('Bereichsfeld „area“ (BAUPLAN) – Bestand nutzt „category“; nur Meldung', (t) => {
  const withArea = COMPONENTS.filter((c) => c.area).length;
  t.diagnostic(`${withArea} von ${COMPONENTS.length} Komponenten tragen zusätzlich „area“; Pflicht ist „category“.`);
  assert.ok(COMPONENTS.every((c) => typeof c.category === 'string' && c.category));
});

test('Kategorien sind in CATEGORY_ORDER bekannt (nur Meldung)', (t) => {
  const unknown = [...new Set(COMPONENTS.map((c) => c.category))].filter((c) => !CATEGORY_ORDER.includes(c));
  report(t, 'Unbekannte Kategorien', unknown);
});

test('getComponent findet jede Komponente und liefert undefined für Unbekanntes', () => {
  for (const c of COMPONENTS) assert.equal(getComponent(c.id), c);
  assert.equal(getComponent('gibt-es-nicht'), undefined);
});

test('componentsByCategory verteilt alle Komponenten genau einmal', () => {
  const groups = componentsByCategory();
  assert.equal(groups.reduce((n, [, list]) => n + list.length, 0), COMPONENTS.length);
  assert.equal(new Set(groups.map(([k]) => k)).size, groups.length);
});

test('defaultProps übernimmt nur Props mit Standardwert', () => {
  assert.deepEqual(defaultProps({ props: [{ name: 'a', type: 'text', default: 'x' }, { name: 'b', type: 'number' }, { name: 'c', type: 'boolean', default: false }] }), { a: 'x', c: false });
  assert.deepEqual(defaultProps(undefined), {});
});

test('validateComponent erkennt Mängel einer synthetischen Definition', () => {
  const ok = { id: 'x-y', name: 'X', category: 'Struktur', description: 'd', render: () => null, example: {} };
  assert.deepEqual(validateComponent(ok), []);
  assert.ok(validateComponent({ ...ok, id: 'X_Y' }).some((e) => e.includes('kebab')));
  assert.ok(validateComponent({ ...ok, render: 1 }).length > 0);
  assert.ok(validateComponent({ ...ok, example: undefined }).some((e) => e.includes('example')));
  assert.ok(validateComponent({ ...ok, props: [{ name: 'p' }] }).length > 0);
});

test('validateComponent über alle Komponenten (nur Meldung)', (t) => {
  report(t, 'Vertragsverstöße', COMPONENTS.flatMap((c) => validateComponent(c).map((e) => `${name(c)}: ${e}`)));
});

test('Komponenten-Events sind Zeichenketten', () => {
  const bad = COMPONENTS.filter((c) => c.events && !(Array.isArray(c.events) && c.events.every((e) => typeof e === 'string'))).map(name);
  assert.deepEqual(bad, []);
});
