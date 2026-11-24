#!/usr/bin/env node
// Erzeugt docs/FEATURE_IDS.md aus dem Seed: alle Module und Feature-IDs mit Tier, Startseite, Richtungen,
// Status und Navigationszielen. Verbindliche Referenz für Querverweise (interaction.to) zwischen Modulen.
//   node tools/feature-ids.mjs            → schreibt docs/FEATURE_IDS.md
//   node tools/feature-ids.mjs --stdout   → nur ausgeben
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSeedState, SEED_VERSION } from '../app/src/seed/index.js';
import { moduleHome, navigationRules, DEFAULT_DIRECTIONS, areaOf } from '../app/src/core/directions.js';
import { tierOf } from '../app/src/core/process.js';
import { statusInfo } from '../app/src/core/schema.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const st = buildSeedState();
const dirs = DEFAULT_DIRECTIONS.map((d) => d.id);
const mods = st.modules.filter((m) => !m.archived).sort((a, b) => a.order - b.order);
const L = [];
L.push('# Feature-Katalog (verbindliche IDs)', '');
L.push(`> Automatisch erzeugt aus dem Seed ${SEED_VERSION} mit \`node tools/feature-ids.mjs\` – nicht von Hand bearbeiten.`);
L.push('> Feature-IDs werden nie umbenannt (Querverweise, Entscheidungen, Versionen hängen daran). Neue IDs nach dem Muster `<modul>.<name>`.', '');
const total = st.features.filter((f) => !f.archived);
L.push(`**${mods.length} Module · ${total.length} Features · ${total.filter((f) => f.variants.length).length} mit Design · ${total.reduce((n, f) => n + f.variants.length, 0)} Varianten**`, '');
L.push('Legende: Tier 1 = täglich/kritisch, 2 = regelmäßig, 3 = selten · Richtungen K/V/F = Kompakt/Visuell/Fokus (● eigene Variante, ○ fehlt) · ⌂ = Modul-Startseite', '');
for (const m of mods) {
  const fs_ = st.features.filter((f) => f.moduleId === m.id && !f.archived).sort((a, b) => a.order - b.order);
  const home = moduleHome(st, m.id);
  L.push(`## ${m.name} (\`${m.id}\`) · ${areaOf(m)}`, '');
  if (m.description) L.push(m.description, '');
  L.push('| Feature-ID | Name | Tier | K V F | Status | führt zu |', '|---|---|---|---|---|---|');
  for (const f of fs_) {
    const d = dirs.map((x) => (f.variants.some((v) => v.direction === x) ? '●' : '○')).join(' ');
    const to = [...new Set(navigationRules(f).map((r) => r.to))].map((x) => `\`${x}\``).join(', ');
    L.push(`| \`${f.id}\`${f.id === home ? ' ⌂' : ''} | ${f.name} | ${tierOf(f)}${f.tier ? '' : '*'} | ${f.variants.length ? d : '–'} | ${statusInfo(f.status).label}${f.locked ? ' 🔒' : ''} | ${to || '–'} |`);
  }
  L.push('');
}
L.push('\\* Tier geschätzt (nicht explizit gesetzt).', '');
const md = L.join('\n').replace(/\\\*/g, '*');
if (process.argv.includes('--stdout')) process.stdout.write(md + '\n');
else { fs.writeFileSync(path.join(root, 'docs/FEATURE_IDS.md'), md + '\n'); console.log(`docs/FEATURE_IDS.md geschrieben (${total.length} Features).`); }
