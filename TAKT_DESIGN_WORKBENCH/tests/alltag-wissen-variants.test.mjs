// Paket „alltag-wissen“: neue Varianten Richtung visuell, Kapitelzerlegung und Leerzustände der Wissensdatenbank.
import './_helpers.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import tasks from '../app/src/seed/modules/tasks.js';
import notes from '../app/src/seed/modules/notes.js';
import knowledge from '../app/src/seed/modules/knowledge.js';
import scans from '../app/src/seed/modules/picture-to-text.js';
import { splitChapters } from '../app/src/library/components/content/kb-story.js';

const feature = (m, id) => m.features.find((f) => f.id === id);

test('Vier Tier-1-Features haben eine visuelle Variante, strukturell mit eigener Komponente', () => {
  const want = [[tasks, 'tasks.inbox', 'task-sorter'], [notes, 'notes.inbox', 'note-board'], [knowledge, 'knowledge.article', 'kb-story'], [scans, 'picture-to-text.receipt', 'receipt-slip']];
  for (const [m, id, comp] of want) {
    const f = feature(m, id), v = f.variants.find((x) => x.direction === 'visuell');
    assert.ok(v, `${id}: visuelle Variante fehlt`);
    assert.ok(v.blocks.some((b) => b.component === comp), `${id}: Komponente ${comp} fehlt`);
    assert.ok(f.variants.filter((x) => x.direction === 'kompakt' || x.direction === 'fokus').every((x) => !x.blocks.some((b) => b.component === comp)), `${id}: Komponente nur in der neuen Variante`);
  }
});

test('Geteilte Daten sind an die Welt gebunden (keine Kopien)', () => {
  assert.equal(tasks.features.find((f) => f.id === 'tasks.inbox').demoData.inbox, '@world:taskInbox');
  assert.equal(feature(notes, 'notes.inbox').demoData.notes, '@world:notes');
  assert.equal(feature(knowledge, 'knowledge.home').demoData.articles, '@world:articles');
  assert.equal(feature(scans, 'picture-to-text.receipt').demoData.receipts, '@world:receipts');
});

test('splitChapters: Einleitung, Kapitel, Codeblöcke bleiben unberührt', () => {
  const r = splitChapters('Einleitung.\n\n## Eins\nText\n\n```\n## kein Kapitel\n```\n\n## Zwei\nMehr');
  assert.equal(r.lead, 'Einleitung.');
  assert.deepEqual(r.chapters.map((c) => c.title), ['Eins', 'Zwei']);
  assert.ok(r.chapters[0].body.includes('## kein Kapitel'));
  assert.deepEqual(splitChapters('Nur Text').chapters, []);
});

test('Wissens-Startseite: Anlegen-Interaktion und Kennzahlen-Navigation sind verknüpft', () => {
  const home = feature(knowledge, 'knowledge.home');
  assert.ok(home.interactions.some((i) => i.event === 'kb.create' && i.to === 'knowledge.article'));
  assert.ok(home.variants.some((v) => v.blocks.some((b) => b.component === 'kpi-tiles')), 'metric.open braucht kpi-tiles');
});
