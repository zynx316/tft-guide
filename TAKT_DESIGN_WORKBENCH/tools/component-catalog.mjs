#!/usr/bin/env node
// Erzeugt docs/KOMPONENTEN.md aus der Registry: alle Komponenten je Kategorie mit Version, Zweck, Datenslots, Events,
// Flutter-Hinweis und Verwendung im Seed. Aufruf mit Loader (preact/htm für Node):
//   node --import ./tools/register.mjs tools/component-catalog.mjs [--stdout]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { COMPONENTS, CATEGORY_ORDER } from '../app/src/library/registry.js';
import { buildSeedState } from '../app/src/seed/index.js';
import { flutterHintFor } from '../app/src/core/flutter.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const st = buildSeedState();
const usage = new Map();
for (const f of st.features) for (const v of f.variants) for (const b of v.blocks) {
  if (!usage.has(b.component)) usage.set(b.component, new Set());
  usage.get(b.component).add(f.id);
}
const esc = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const short = (s, n = 140) => { const t = esc(s); return t.length > n ? `${t.slice(0, n - 1)}…` : t; };
const cats = [...new Set(COMPONENTS.map((c) => c.category || 'Sonstige'))].sort((a, b) => {
  const ia = CATEGORY_ORDER.indexOf(a), ib = CATEGORY_ORDER.indexOf(b); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
});
const L = ['# Komponenten-Katalog', '',
  '> Automatisch erzeugt mit `node --import ./tools/register.mjs tools/component-catalog.mjs` – nicht von Hand bearbeiten.',
  '> Vertrag: `app/src/library/CONTRACT.md`. Galerie in der Workbench: `#/library/<id>`.', '',
  `**${COMPONENTS.length} Komponenten in ${cats.length} Kategorien · ${[...usage.keys()].length} im Seed verwendet**`, ''];
for (const cat of cats) {
  const list = COMPONENTS.filter((c) => (c.category || 'Sonstige') === cat).sort((a, b) => a.id.localeCompare(b.id));
  L.push(`## ${cat} (${list.length})`, '', '| ID | Name | Version | Zweck | Daten | Events | Verwendet in | Flutter |', '|---|---|---|---|---|---|---|---|');
  for (const c of list) {
    const used = [...(usage.get(c.id) || [])];
    L.push(`| \`${c.id}\` | ${esc(c.name)} | ${c.version || '1.0'} | ${short(c.description)} | ${(c.data || []).map((d) => d.slot).join(', ') || '–'} | ${short((c.events || []).map((e) => (typeof e === 'string' ? e : e.name)).join(', '), 80) || '–'} | ${used.length ? `${used.length} (${used.slice(0, 3).join(', ')}${used.length > 3 ? ' …' : ''})` : '–'} | ${short(flutterHintFor(c), 80)} |`);
  }
  L.push('');
}
const unused = COMPONENTS.filter((c) => !usage.has(c.id)).map((c) => `\`${c.id}\``);
if (unused.length) L.push('## Nicht im Seed verwendet', '', unused.join(', '), '');
const md = L.join('\n');
if (process.argv.includes('--stdout')) process.stdout.write(md + '\n');
else { fs.writeFileSync(path.join(root, 'docs/KOMPONENTEN.md'), md + '\n'); console.log(`docs/KOMPONENTEN.md geschrieben (${COMPONENTS.length} Komponenten).`); }
