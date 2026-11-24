#!/usr/bin/env node
// ============================================================================
// Schnelle statische Prüfung (ohne Browser, < 1 s) – nach jeder Code-Änderung:
//   npm run check
// Prüft: Syntax aller JS-Dateien · Seed-Integrität (IDs, Varianten, Komponenten-
// Referenzen, Datenbindungen) · Regeln des Komponentenvertrags (keine Hex-Farben,
// kein new Date() für "jetzt", kein UTC-Datum, Dateigröße) · ASCII-Umlaute in
// sichtbaren Texten.  Exit-Code 1 bei Fehlern.
// Die vollständige Prüfung im Browser macht: npm run qa
// ============================================================================
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'app/src');
const errors = [], warnings = [];
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const rel = (p) => path.relative(ROOT, p);

// 1) Syntax
const jsFiles = walk(SRC).filter((f) => f.endsWith('.js'));
for (const f of [...jsFiles, path.join(ROOT, 'server.mjs'), path.join(ROOT, 'qa/run-qa.mjs')]) {
  try { execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }); } catch (e) { errors.push(`Syntax ${rel(f)}: ${String(e.stderr).split('\n').slice(0, 4).join(' ')}`); }
}

// 2) Komponenten-IDs (statisch aus den Quelltexten)
const compFiles = walk(path.join(SRC, 'library/components')).filter((f) => f.endsWith('.js'));
const compIds = new Map();
for (const f of compFiles) {
  const s = fs.readFileSync(f, 'utf8');
  for (const m of s.matchAll(/^\s*id:\s*'([a-z0-9-]+)',?\s*$/gm)) { if (compIds.has(m[1])) errors.push(`Doppelte Komponenten-ID ${m[1]} (${rel(f)} / ${rel(compIds.get(m[1]))})`); compIds.set(m[1], f); }
  const lines = s.split('\n');
  if (lines.length > 450) warnings.push(`${rel(f)}: ${lines.length} Zeilen (Richtwert ≤ 450 – aufteilen)`);
  lines.forEach((line, i) => {
    const code = line.replace(/\/\/.*$/, '');
    if (/(color|background|border|fill|stroke|shadow|outline)[^;'"`]*#[0-9a-fA-F]{3,8}\b/i.test(code)) warnings.push(`${rel(f)}:${i + 1}: Hex-Farbe – Token-Variable (--tk-…) verwenden`);
    if (/new Date\(\)/.test(code) && !/=\s*new Date\(\)\s*[,)]/.test(code)) warnings.push(`${rel(f)}:${i + 1}: new Date() – für "jetzt" ctx.today verwenden (deterministische Screenshots)`);
    if (/toISOString\(\)\.slice\(0,\s*10\)/.test(code)) warnings.push(`${rel(f)}:${i + 1}: toISOString().slice(0,10) ist UTC – isoDay() aus lib/util.js verwenden`);
  });
}

// 3) Seed-Integrität
const { buildSeedState } = await import(pathToFileURL(path.join(SRC, 'seed/index.js')).href);
const state = buildSeedState();
const fIds = new Set();
for (const f of state.features) {
  if (fIds.has(f.id)) errors.push(`Doppelte Feature-ID ${f.id}`); fIds.add(f.id);
  if (!state.modules.some((m) => m.id === f.moduleId)) errors.push(`${f.id}: unbekanntes Modul ${f.moduleId}`);
  if (f.selectedVariantId && !f.variants.some((v) => v.id === f.selectedVariantId)) errors.push(`${f.id}: bevorzugte Variante ${f.selectedVariantId} existiert nicht`);
  for (const l of f.links || []) if (!state.features.some((x) => x.id === l)) warnings.push(`${f.id}: Verknüpfung auf unbekanntes Feature ${l}`);
  const vIds = new Set();
  for (const v of f.variants) {
    if (vIds.has(v.id)) errors.push(`${f.id}: doppelte Varianten-ID ${v.id}`); vIds.add(v.id);
    const bIds = new Set();
    for (const b of v.blocks) {
      if (!compIds.has(b.component)) errors.push(`${f.id}/${v.id}#${b.id}: Komponente „${b.component}“ nicht in der Library`);
      if (bIds.has(b.id)) errors.push(`${f.id}/${v.id}: doppelte Block-ID ${b.id}`); bIds.add(b.id);
      for (const key of Object.values(b.bind || {})) if (!(key in (f.demoData || {}))) warnings.push(`${f.id}/${v.id}#${b.id}: Bindung „${key}“ fehlt in demoData`);
    }
  }
  if (['design', 'review'].includes(f.status) && !f.variants.length) warnings.push(`${f.id}: Status ${f.status}, aber keine Variante`);
  if (!f.requirements.length && f.status !== 'not_analyzed') warnings.push(`${f.id}: keine Anforderungen`);
}

// 4) ASCII-Umlaute in sichtbaren Texten (häufige Fälle)
const ascii = /\b(fuer|Fuer|ueber|Ueber|Uebersicht|waehl\w*|Waehl\w*|moeglich\w*|koennen|muessen|Aenderung\w*|aender\w*|Pruef\w*|pruef\w*|faellig|Faellig\w*|zurueck|Rueck\w*|Loesch\w*|loesch\w*|hinzufueg\w*|Hinzufueg\w*|Oeffn\w*|oeffn\w*|Groesse|groesser|naechst\w*|Naechst\w*|spaeter|Eintraege|Schluessel|Bestaetig\w*|bestaetig\w*)\b/;
for (const f of [...compFiles, ...walk(path.join(SRC, 'seed')), ...walk(path.join(SRC, 'workbench'))].filter((x) => x.endsWith('.js'))) {
  fs.readFileSync(f, 'utf8').split('\n').forEach((line, i) => { const code = line.replace(/^\s*\/\/.*$/, ''); const strs = code.match(/(['`"])(?:(?!\1).)*\1/g) || []; for (const st of strs) if (ascii.test(st)) warnings.push(`${rel(f)}:${i + 1}: Umlaut als ae/oe/ue im Text – echte Umlaute verwenden (${st.match(ascii)[0]})`); });
}

const total = `${jsFiles.length} JS-Dateien · ${compIds.size} Komponenten · ${state.modules.length} Module · ${state.features.length} Features · ${state.features.reduce((n, f) => n + f.variants.length, 0)} Varianten`;
console.log(`TAKT Workbench – statische Prüfung\n${total}\n`);
errors.forEach((e) => console.log(`✖ ${e}`));
warnings.forEach((w) => console.log(`! ${w}`));
console.log(`\n${errors.length ? '✖' : '✓'} ${errors.length} Fehler · ${warnings.length} Hinweise`);
process.exitCode = errors.length ? 1 : 0;
