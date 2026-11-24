#!/usr/bin/env node
// ============================================================================
// Gesamtprüfung in fester Reihenfolge:  npm run verify  [-- --full] [-- --keep-going]
//   1. check       statische Prüfung (tools/check.mjs, unter 2 s)
//   2. test        Node-Tests (tests/, unter 10 s)
//   3. qa:changed  nur mit --full: Browser-QA der geänderten Komponenten (braucht Playwright)
// Misst die Zeit je Stufe und gibt einen kurzen Bericht aus. Exit-Code 1, sobald eine Stufe scheitert;
// ohne --keep-going bricht die Prüfung bei der ersten fehlgeschlagenen Stufe ab.
// ============================================================================
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const full = args.has('--full'), keepGoing = args.has('--keep-going');
const NODE = process.execPath;
// Testdateien selbst auflisten (unabhängig von der Glob-Unterstützung der Node-Version und der Shell)
const testFiles = fs.readdirSync(path.join(ROOT, 'tests')).filter((f) => f.endsWith('.test.mjs')).sort().map((f) => `tests/${f}`);

const STAGES = [
  { id: 'check', label: 'Statische Prüfung', args: ['tools/check.mjs'] },
  { id: 'test', label: 'Node-Tests', args: ['--import', './tools/register.mjs', '--test', ...testFiles] },
  ...(full ? [{ id: 'qa:changed', label: 'Browser-QA (geänderte Komponenten)', args: ['qa/run-qa.mjs', '--changed'], live: true }] : []),
];

const tail = (text, n = 25) => String(text || '').trim().split('\n').slice(-n).join('\n');
const fmtMs = (ms) => (ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1).replace('.', ',')} s`);

const results = [];
for (const st of STAGES) {
  console.log(`▶ ${st.id} – ${st.label}`);
  const t0 = performance.now();
  const r = spawnSync(NODE, st.args, { cwd: ROOT, encoding: 'utf8', stdio: st.live ? 'inherit' : 'pipe', maxBuffer: 64 * 1024 * 1024 });
  const ms = performance.now() - t0;
  const ok = r.status === 0 && !r.error;
  results.push({ ...st, ok, ms });
  if (!ok) {
    if (!st.live) console.log(tail(`${r.stdout || ''}\n${r.stderr || ''}`));
    if (r.error) console.log(`Start fehlgeschlagen: ${r.error.message}`);
    if (!keepGoing) break;
  }
}

console.log('\nBericht');
for (const r of results) console.log(`  ${r.ok ? '✓' : '✖'} ${r.id.padEnd(11)} ${fmtMs(r.ms).padStart(8)}`);
const skipped = STAGES.filter((s) => !results.some((r) => r.id === s.id));
for (const s of skipped) console.log(`  – ${s.id.padEnd(11)} ${'übersprungen'.padStart(8)}`);
if (!full) console.log('  (Browser-QA mit --full: npm run verify -- --full)');
const failed = results.filter((r) => !r.ok);
console.log(`\n${failed.length ? '✖' : '✓'} ${failed.length ? `${failed.length} Stufe(n) fehlgeschlagen: ${failed.map((f) => f.id).join(', ')}` : 'Alles grün'} · ${fmtMs(results.reduce((a, r) => a + r.ms, 0))} gesamt`);
process.exitCode = failed.length ? 1 : 0;
