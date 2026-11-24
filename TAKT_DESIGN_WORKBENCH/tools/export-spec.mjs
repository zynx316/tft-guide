#!/usr/bin/env node
// Umsetzungsvorlagen für Flutter exportieren (JSON „takt-feature-spec/1“ + Markdown + Routen + Manifest) – ohne Browser.
//   node --import ./tools/register.mjs tools/export-spec.mjs                 → alle Features mit Variante, Version „auto“
//   … --released                    nur freigegebene (gesperrte) Features
//   … --feature finance.home,finance.quickadd
//   … --version mix|arbeitsstand|freigabe|dir:kompakt   (Standard auto = Freigabe, sonst „Meine Auswahl“)
//   … --out export/spec             Zielordner (Standard export/spec, wird ersetzt)   --file <pfad> andere Datendatei
//   … --check                       nur vergleichen: meldet geänderte specHash gegenüber dem vorhandenen Manifest (Exit 1)
// Das Manifest ist deterministisch (ohne Zeitstempel): gleiche Eingabe → gleiche Dateien → sauberer Git-Diff im Flutter-Projekt.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from '../app/src/core/schema.js';
import { specBundle } from '../app/src/core/spec-json.js';
import { featureSpecMarkdown } from '../app/src/core/spec.js';
import { getComponent } from '../app/src/library/registry.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : null; };
const file = opt('file') || path.join(root, 'data', 'workbench.json');
let state;
if (fs.existsSync(file)) state = migrate(JSON.parse(fs.readFileSync(file, 'utf8')));
else { const { buildSeedState } = await import('../app/src/seed/index.js'); state = buildSeedState(); console.error('Hinweis: data/workbench.json fehlt – Export aus dem Seed.'); }

const out = path.resolve(root, opt('out') || 'export/spec');
const bundle = specBundle(state, { getComponent, versionId: opt('version') || 'auto', featureIds: opt('feature')?.split(',').map((s) => s.trim()).filter(Boolean) || null, releasedOnly: args.includes('--released') });

if (args.includes('--check')) {
  const mf = path.join(out, 'manifest.json');
  if (!fs.existsSync(mf)) { console.error(`Kein Manifest unter ${mf} – zuerst ohne --check exportieren.`); process.exit(1); }
  const old = new Map(JSON.parse(fs.readFileSync(mf, 'utf8')).features.map((x) => [x.id, x.specHash]));
  const changed = bundle.manifest.features.filter((x) => old.get(x.id) !== x.specHash).map((x) => `${old.has(x.id) ? 'geändert' : 'neu'}: ${x.id}`);
  const removed = [...old.keys()].filter((id) => !bundle.manifest.features.some((x) => x.id === id)).map((id) => `entfernt: ${id}`);
  const all = [...changed, ...removed];
  console.log(all.length ? all.join('\n') : 'Keine Änderungen gegenüber dem letzten Export.');
  process.exit(all.length ? 1 : 0);
}

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'features'), { recursive: true });
for (const s of bundle.specs) {
  fs.writeFileSync(path.join(out, 'features', `${s.feature.id}.json`), JSON.stringify(s, null, 1) + '\n');
  fs.writeFileSync(path.join(out, 'features', `${s.feature.id}.md`), featureSpecMarkdown(state, s.feature.id, { getComponent }) + '\n');
}
fs.writeFileSync(path.join(out, 'routes.json'), JSON.stringify(bundle.routes, null, 1) + '\n');
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(bundle.manifest, null, 1) + '\n');
const invalid = bundle.routes.edges.filter((e) => !e.valid);
console.log(`${bundle.specs.length} Spezifikationen, ${bundle.routes.edges.length} Navigationswege${invalid.length ? ` (${invalid.length} ohne gültiges Ziel)` : ''} → ${path.relative(root, out)}/  (bundleHash ${bundle.manifest.bundleHash})`);
