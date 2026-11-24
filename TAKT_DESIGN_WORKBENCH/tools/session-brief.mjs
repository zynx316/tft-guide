#!/usr/bin/env node
// Lage beim Sessionstart – wird von Claude Code automatisch ausgeführt (SessionStart-Hook in .claude/settings.json);
// die Ausgabe landet im Kontext. Schnell (< 1 s), ohne Abhängigkeiten, schlägt nie fehl (Exit 0).
//   node tools/session-brief.mjs          (auch von Hand nutzbar)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => { try { return fs.readFileSync(path.join(root, rel), 'utf8'); } catch { return null; } };
const out = [];
const say = (s = '') => out.push(s);

try {
  say('TAKT Design Workbench – Lage beim Sessionstart (automatisch erzeugt von tools/session-brief.mjs)');
  say('Regeln: TAKT-Projekt (TAKT-Merge-Git) NUR LESEN · Freigegebenes nie direkt ändern · Entscheidungen trifft der Nutzer · nach Änderungen npm run check + npm test.');

  // Live-Stand der Workbench
  const raw = read('data/workbench.json');
  if (raw) {
    const s = JSON.parse(raw);
    const fs_ = s.features || []; const dec = s.decisions || [];
    const open = dec.filter((d) => d.status === 'open');
    const byLevel = (lv) => open.filter((d) => (d.level || 'feature') === lv).length;
    const running = (s.rounds || []).find((r) => r.status === 'läuft');
    const fbNew = (s.feedback || []).filter((e) => !e.status || e.status === 'neu').length;
    const pinsOpen = (s.pins || []).filter((p) => p.status !== 'erledigt').length;
    const released = fs_.filter((f) => f.locked).length;
    const dir = s.app?.directionId ? `App-Richtung: ${s.app.directionId}` : 'App-Richtung: noch offen';
    say(`Live-Stand: ${(s.modules || []).length} Module · ${fs_.length} Features (${released} freigegeben) · Stand ${String(s.meta?.updatedAt || '–').slice(0, 16).replace('T', ' ')} · Seed ${s.meta?.seedVersion || '–'} · ${dir}`);
    say(`Entscheidungen offen: App ${byLevel('app')} · Muster ${byLevel('pattern')} · Modul ${byLevel('module')} · Feature ${byLevel('feature')}${running ? ` · Runde läuft: „${running.title}“` : ''}${fbNew ? ` · ${fbNew} neue Launcher-Bewertungen` : ''}${pinsOpen ? ` · ${pinsOpen} offene Anmerkungen` : ''}`);
    const seedV = (read('app/src/seed/index.js') || '').match(/SEED_VERSION = '([^']+)'/)?.[1];
    if (seedV && s.meta?.seedVersion && seedV !== s.meta.seedVersion) say(`Hinweis: Seed ${seedV} ist neuer als der Live-Stand (${s.meta.seedVersion}) → Workbench › Daten & Backup › „Seed abgleichen …“ (der Nutzer bestätigt).`);
  } else say('Live-Stand: data/workbench.json fehlt noch – beim ersten `npm start` lädt der Seed.');

  // Phase 1
  const phase1Done = !!read('docs/PHASE1_ERGEBNIS.md');
  if (!phase1Done) say('Phase 1 (Abgleich mit dem echten TAKT-Projekt) ist OFFEN → `/takt-phase1` (nur lesend). Module/Features sind bis dahin Annahmen.');

  // QA
  const qa = read('qa/results/latest.json');
  if (qa) { try { const q = JSON.parse(qa); say(`Letzte CLI-QA: ${q.status || '–'} am ${String(q.ts || '').slice(0, 16).replace('T', ' ')}${q.summary ? ` – ${String(q.summary).slice(0, 120)}` : ''}`); } catch { /* egal */ } }
  else say('CLI-QA auf diesem Rechner noch nicht gelaufen → `npm run qa` (legt Baselines an).');

  // Offene P1-Aufgaben aus TASKS.md (Abschnitte mit „P1“ im Titel)
  const tasks = read('TASKS.md');
  if (tasks) {
    const items = []; let p1 = false;
    for (const line of tasks.split('\n')) {
      if (/^## /.test(line)) p1 = /\bP1\b/.test(line);
      else if (p1 && /^- \[ \] /.test(line)) items.push(line.replace(/^- \[ \] /, '').replace(/\s+/g, ' ').slice(0, 150));
    }
    const all = (tasks.match(/^- \[ \] /gm) || []).length;
    if (items.length) { say(`Nächste Aufgaben (P1, ${items.length} von ${all} offenen in TASKS.md):`); items.slice(0, 6).forEach((t) => say(`  - ${t}`)); }
  }

  // Letzter Eintrag im Arbeitsprotokoll
  const log = read('WORK_LOG.md');
  if (log) { const heads = log.split('\n').filter((l) => /^#{2,3} /.test(l)); if (heads.length) say(`Zuletzt im WORK_LOG: ${heads[heads.length - 1].replace(/^#+ /, '').slice(0, 140)}`); }

  say('Ausführliche Lage und Vorschlag: `/takt-start`. Weitere Befehle: /takt-phase1, /takt-round-prep, /takt-work-order, /takt-spec, /takt-feature, /takt-qa, /takt-review.');
} catch (e) {
  say(`(Lagebericht unvollständig: ${e.message})`);
}
process.stdout.write(out.join('\n') + '\n');
