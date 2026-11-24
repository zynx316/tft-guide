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

// 1) Syntax – nur geänderte Dateien (Cache nach Größe+Zeitstempel), parallel in 4 Prozessen
const jsFiles = walk(SRC).filter((f) => f.endsWith('.js'));
const CACHE = path.join(ROOT, '.cache', 'check-syntax.json');
let cache = {}; try { cache = JSON.parse(fs.readFileSync(CACHE, 'utf8')); } catch { /* erster Lauf */ }
const sig = (f) => { const st = fs.statSync(f); return `${st.size}:${Math.round(st.mtimeMs)}`; };
const todo = [...jsFiles, path.join(ROOT, 'server.mjs'), path.join(ROOT, 'qa/run-qa.mjs')].filter((f) => cache[rel(f)] !== sig(f));
const { execFile } = await import('node:child_process');
const checkOne = (f) => new Promise((resolve) => execFile(process.execPath, ['--check', f], (err, _o, stderr) => {
  if (err) { errors.push(`Syntax ${rel(f)}: ${String(stderr).split('\n').slice(0, 4).join(' ')}`); delete cache[rel(f)]; } else cache[rel(f)] = sig(f);
  resolve();
}));
for (let i = 0; i < todo.length; i += 4) await Promise.all(todo.slice(i, i + 4).map(checkOne));
try { fs.mkdirSync(path.dirname(CACHE), { recursive: true }); fs.writeFileSync(CACHE, JSON.stringify(cache)); } catch { /* nur Beschleunigung */ }

// 1b) Referenztests Finanzmathematik
try { execFileSync(process.execPath, [path.join(ROOT, 'tools/test-finmath.mjs')], { stdio: 'pipe' }); } catch (e) { errors.push(`Finanzmathematik-Tests: ${String(e.stdout).trim().split('\n').slice(-4).join(' | ')}`); }

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

// 3b) Navigationsgraph, Startseiten und Richtungen (Hinweise – Module entstehen schrittweise)
const { moduleHome } = await import(pathToFileURL(path.join(SRC, 'core/directions.js')).href);
const featById = new Map(state.features.map((f) => [f.id, f]));
const navTargets = new Set();
for (const f of state.features) for (const i of [...(f.interactions || []), ...f.variants.flatMap((v) => (v.nav || []).map((n) => ({ ...n, trigger: `Variante ${v.id}` })))]) {
  if (!i.to) continue;
  const ok = i.to.startsWith('module:') ? state.modules.some((m) => m.id === i.to.slice(7)) : featById.has(i.to);
  if (!ok) warnings.push(`${f.id}: Interaktion „${i.event || i.trigger}“ führt zu unbekanntem Ziel ${i.to}`);
  else if (!i.to.startsWith('module:') && !featById.get(i.to).variants.length) warnings.push(`${f.id}: Interaktion „${i.event || i.trigger}“ führt zu ${i.to} ohne Variante (Skizze)`);
  navTargets.add(i.to);
}
for (const m of state.modules.filter((x) => !x.archived)) {
  const fs = state.features.filter((f) => f.moduleId === m.id && !f.archived && f.variants.length);
  if (fs.length < 3) continue;
  const home = moduleHome(state, m.id); const hf = featById.get(home);
  const dirs = new Set((hf?.variants || []).map((v) => v.direction).filter(Boolean));
  if (dirs.size < 3) warnings.push(`Modul ${m.id}: Startseite ${home || '–'} hat ${dirs.size} von 3 Richtungen (${[...dirs].join(', ') || 'keine'})`);
  const orphan = fs.filter((f) => f.id !== home && !navTargets.has(f.id)).map((f) => f.id);
  if (orphan.length > 2) warnings.push(`Modul ${m.id}: ${orphan.length} Features nur über das Bereichsmenü erreichbar (${orphan.slice(0, 4).join(', ')}${orphan.length > 4 ? ' …' : ''}) – Navigationsregeln (interaction.to) ergänzen`);
}

// 3c) Begriffslisten der Leitlinien: Gesundheit (verboten/warnen), Finanzen (verboten). Zitate in „…“ sind erlaubt.
const termBlock = (file, name) => {
  const f = path.join(ROOT, 'docs', file); if (!fs.existsSync(f)) return [];
  const block = (fs.readFileSync(f, 'utf8').match(new RegExp(`<!-- ${name}:start -->([\\s\\S]*?)<!-- ${name}:end -->`)) || [])[1] || '';
  // Format: je Zeile ein Teilwort (Groß/klein egal) oder /Regex/Flags; „#“ = Kommentar
  return block.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#') && !l.startsWith('```') && !l.startsWith('<!--')).map((l) => {
    const m = l.match(/^\/(.+)\/([a-z]*)$/);
    try { return m ? new RegExp(m[1], m[2].includes('u') ? m[2] : `${m[2]}u`) : new RegExp(l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'iu'); } catch { return null; }
  }).filter(Boolean);
};
const filesOf = (areas, modules) => [...areas.flatMap((a) => (fs.existsSync(path.join(SRC, 'library/components', a)) ? walk(path.join(SRC, 'library/components', a)) : [])),
  ...modules.flatMap((m) => [path.join(SRC, 'seed/modules', `${m}.js`), path.join(SRC, 'seed/world', `${m}.js`)])].filter((f) => fs.existsSync(f) && f.endsWith('.js'));
const scanTerms = (files, res, msg) => { for (const f of files) fs.readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
  if (/^\s*(\/\/|\*)/.test(line)) return;
  for (const raw of line.match(/(['`"])(?:(?!\1).)*\1/g) || []) { const st = raw.replace(/„[^“]*“/g, ''); for (const re of res) { const hit = st.match(re); if (hit) { warnings.push(`${rel(f)}:${i + 1}: „${hit[0].trim()}“ – ${msg}`); break; } } }
}); };
const health = filesOf(['fitness', 'nutrition', 'habits', 'health', 'goals'], ['fitness', 'nutrition', 'habits', 'goals']);
scanTerms(health, termBlock('HEALTH_GUIDELINES.md', 'verbotsbegriffe'), 'widerspricht den Gesundheits-Leitlinien (docs/HEALTH_GUIDELINES.md)');
scanTerms(health, termBlock('HEALTH_GUIDELINES.md', 'warnbegriffe'), 'Warnbegriff laut docs/HEALTH_GUIDELINES.md – Formulierung prüfen');
scanTerms(filesOf(['finance', 'savings', 'trading'], ['finance', 'savings', 'trading']), termBlock('FINANCE_GUIDELINES.md', 'finanzbegriffe'), 'widerspricht den Finanz-Leitlinien (docs/FINANCE_GUIDELINES.md)');

// 3e) CSS-Klassen-Kollisionen zwischen Bereichen: dieselbe Klasse als Regelanfang in zwei Bereichen definiert
const baseCss = fs.readFileSync(path.join(SRC, 'design-system/takt-base.css'), 'utf8');
const baseClasses = new Set([...baseCss.matchAll(/\.(tk-[a-z0-9-]+)/g)].map((m) => m[1]));
const owners = new Map();
for (const area of fs.readdirSync(path.join(SRC, 'library/components'))) {
  const dir = path.join(SRC, 'library/components', area); if (!fs.statSync(dir).isDirectory()) continue;
  const defined = new Set();
  for (const f of walk(dir).filter((x) => x.endsWith('.js'))) {
    const code = fs.readFileSync(f, 'utf8');
    for (const rule of code.split('}')) { const sel = rule.split('{')[0]; const m = sel.match(/^\s*\.(tk-[a-z0-9]+(?:-[a-z0-9]+)*)/); if (m && rule.includes('{') && !baseClasses.has(m[1])) defined.add(m[1]); }
  }
  for (const c of defined) { if (!owners.has(c)) owners.set(c, new Set()); owners.get(c).add(area); }
}
const clashes = [...owners].filter(([, a]) => a.size > 1);
if (clashes.length) warnings.push(`CSS-Klassen in mehreren Bereichen definiert (Präfix je Bereich verwenden, CONTRACT.md): ${clashes.slice(0, 8).map(([c, a]) => `${c} (${[...a].join(', ')})`).join('; ')}${clashes.length > 8 ? ' …' : ''}`);

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
