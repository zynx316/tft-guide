#!/usr/bin/env node
// Arbeitsauftrag (Markdown) aus dem Workbench-Stand erzeugen – ohne Browser.
//   node tools/work-order.mjs                    → Gesamtstand (offene Umsetzungen, Anmerkungen, Feedback)
//   node tools/work-order.mjs --round latest     → letzte Entscheidungsrunde
//   node tools/work-order.mjs --feature finance.home,finance.budget
//   node tools/work-order.mjs --since 2026-11-20 --out docs/work-orders/auftrag.md
//   --file <pfad>  andere Datendatei (Standard: data/workbench.json, sonst Seed)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from '../app/src/core/schema.js';
import { workOrderMarkdown } from '../app/src/core/workorder.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : null; };
const file = opt('file') || path.join(root, 'data', 'workbench.json');

let state;
if (fs.existsSync(file)) state = migrate(JSON.parse(fs.readFileSync(file, 'utf8')));
else {
  const { buildSeedState } = await import('../app/src/seed/index.js').catch(() => ({}));
  if (!buildSeedState) { console.error(`Keine Daten unter ${file} und Seed nicht ladbar.`); process.exit(1); }
  state = buildSeedState(); console.error('Hinweis: data/workbench.json fehlt – Arbeitsauftrag aus dem Seed.');
}
let roundId = opt('round');
if (roundId === 'latest') roundId = state.rounds[0]?.id || null;
if (opt('round') && !roundId) { console.error('Keine Entscheidungsrunde vorhanden.'); process.exit(1); }
const md = workOrderMarkdown(state, { roundId, featureIds: opt('feature')?.split(',').map((s) => s.trim()).filter(Boolean) || null, since: opt('since') });
const out = opt('out');
if (out) { fs.mkdirSync(path.dirname(path.resolve(root, out)), { recursive: true }); fs.writeFileSync(path.resolve(root, out), md); console.error(`Geschrieben: ${out}`); }
else process.stdout.write(md + '\n');
