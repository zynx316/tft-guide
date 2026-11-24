// Registry der Bibliothekskomponenten. Inhalte, die andere Pakete gerade bauen, werden nur gemeldet.
import './_helpers.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadWorkbench, report } from './_helpers.mjs';

const { registry } = await loadWorkbench();
const { COMPONENTS, CATEGORY_ORDER, getComponent, componentsByCategory, defaultProps, validateComponent } = registry;
const name = (c) => c?.id || '(ohne id)';

test('registry.js lässt sich in Node ohne DOM importieren und enthält Komponenten', () => {
  assert.ok(Array.isArray(COMPONENTS));
  assert.ok(COMPONENTS.length >= 60, `nur ${COMPONENTS.length} Komponenten`);
});

test('jede Komponente hat id (kebab-case), name, category und eine render-Funktion', () => {
  const bad = COMPONENTS.filter((c) => !(/^[a-z0-9-]+$/.test(c.id || '') && c.name && c.category && typeof c.render === 'function')).map(name);
  assert.deepEqual(bad, []);
});

test('Komponenten-IDs sind eindeutig', () => {
  const seen = new Set(), dup = [];
  for (const c of COMPONENTS) { if (seen.has(c.id)) dup.push(c.id); seen.add(c.id); }
  assert.deepEqual(dup, []);
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
