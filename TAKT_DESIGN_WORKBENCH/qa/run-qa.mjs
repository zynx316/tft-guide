#!/usr/bin/env node
// ============================================================================
// TAKT Design Workbench – CLI-QA (Playwright)
//
//   npm run qa                         alles: Vertrag + E2E + visuelle Matrix
//   npm run qa -- --only e2e           nur Bedientests der Workbench
//   npm run qa -- --only visual        nur Screenshots/Layout-Prüfung/Regression
//   npm run qa -- --only visual --scenario erststart|stress --env privacy,offline --scale 2   Datenwelt/Umgebung
//   npm run qa -- --feature calendar.week[,tasks.overview]
//   npm run qa -- --module calendar
//   npm run qa -- --component calendar-week   (alle Features, die sie nutzen)
//   npm run qa:changed                 nur Features, deren Komponenten sich seit
//                                      dem letzten Lauf geändert haben (Datei-Hash)
//   Optionen: --all-variants --viewports desktop,mobile --themes graphite,horizon
//             --states default,empty --update-baseline --threshold 0.001 --headed
//
// Ergebnis: qa/results/latest.json (+ latest.md, Screenshots, Differenzbilder).
// Die Workbench zeigt es im Quality Center (› Screenshots & Regression).
// Die Nutzerdaten (data/workbench.json) werden NUR gelesen; E2E-Tests laufen
// auf einem frischen Seed in einem temporären Datenordner.
// ============================================================================
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { createServer } from '../server.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const QA = path.join(ROOT, 'qa');
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i > -1 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d; };
const flag = (n) => args.includes(`--${n}`);
const list = (n) => (opt(n) ? opt(n).split(',').map((s) => s.trim()).filter(Boolean) : null);
const ONLY = opt('only');
const run = (stage) => !ONLY || ONLY.split(',').includes(stage);
const THRESHOLD = Number(opt('threshold', 0.002));
// Szenario der Datenwelt und Umgebung (z. B. --scenario erststart --env privacy,offline --scale 2): Query für die Vorschau und
// Namenszusatz für Screenshots/Baselines – sonst überschreibt ein Szenario- oder 200-%-Lauf die Standard-Baselines.
const extra = `${opt('scenario') ? `&scenario=${opt('scenario')}` : ''}${opt('env') ? `&env=${opt('env')}` : ''}${opt('scale') ? `&scale=${opt('scale')}` : ''}`;
const ENV_TAG = [opt('scenario') && `sc-${opt('scenario')}`, opt('env') && `env-${opt('env').replace(/,/g, '+')}`, opt('scale') && `x${opt('scale')}`].filter(Boolean).join('__');
const envSuffix = ENV_TAG ? `__${ENV_TAG}` : '';

// ------------------------------------------------------------ Abhängigkeiten
async function loadPlaywright() {
  try { return await import('playwright'); } catch { /* weiter */ }
  for (const base of [ROOT, process.env.NODE_PATH, '/usr/local/lib/node_modules_global', '/usr/lib/node_modules'].filter(Boolean)) {
    try { return createRequire(path.join(base, 'noop.js'))('playwright'); } catch { /* weiter */ }
  }
  console.error('\n✖ Playwright nicht gefunden. Einmalig:  npm install  &&  npx playwright install chromium\n');
  process.exit(2);
}
async function loadPixel() {
  try { const pm = (await import('pixelmatch')).default; const { PNG } = await import('pngjs'); return { pixelmatch: pm, PNG }; }
  catch { return null; }
}

// ------------------------------------------------------------------ Helfer
const listen = (server) => new Promise((r) => server.listen(0, '127.0.0.1', () => r(server.address().port)));
const sha = (s) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 12);
const safe = (s) => String(s).replace(/[^a-z0-9._-]+/gi, '_');
const rel = (p) => '/qa/' + path.relative(QA, p).split(path.sep).join('/');
const now = () => new Date().toISOString();

async function loadState() {
  const file = path.join(ROOT, 'data', 'workbench.json');
  const { migrate } = await import(pathToFileURL(path.join(ROOT, 'app/src/core/schema.js')).href);
  if (fs.existsSync(file)) return { state: migrate(JSON.parse(fs.readFileSync(file, 'utf8'))), source: 'data/workbench.json' };
  const { buildSeedState } = await import(pathToFileURL(path.join(ROOT, 'app/src/seed/index.js')).href);
  return { state: buildSeedState(), source: 'Seed (noch keine data/workbench.json)' };
}

/** Komponenten-Hashes je Datei; globale Dateien beeinflussen alle Komponenten. */
async function componentHashes() {
  const libDir = path.join(ROOT, 'app/src/library/components');
  const byComp = {};
  const globals = ['app/src/library/ui.js', 'app/src/library/helpers.js', 'app/src/design-system/tokens.js', 'app/src/design-system/takt-base.css', 'app/src/preview/runtime.js', 'app/src/preview/layouts.js']
    .map((f) => sha(fs.readFileSync(path.join(ROOT, f), 'utf8'))).join('');
  for (const area of fs.readdirSync(libDir)) {
    const dir = path.join(libDir, area); if (!fs.statSync(dir).isDirectory()) continue;
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js'));
    const helpers = files.filter((f) => f.startsWith('_') || /util|shared/.test(f)).map((f) => sha(fs.readFileSync(path.join(dir, f), 'utf8'))).join('');
    for (const f of files) {
      const src = fs.readFileSync(path.join(dir, f), 'utf8');
      for (const m of src.matchAll(/^\s*id:\s*'([a-z0-9-]+)'/gm)) byComp[m[1]] = sha(src + helpers);
    }
  }
  return { globals: sha(globals), byComp };
}

// ------------------------------------------------------------------ Planung
function plan(state, changed) {
  let features = state.features.filter((f) => !f.archived && f.variants.length);
  const fIds = list('feature'), mod = opt('module'), comps = list('component');
  if (fIds) features = features.filter((f) => fIds.includes(f.id));
  if (mod) features = features.filter((f) => f.moduleId === mod);
  const usedComps = (f) => new Set(f.variants.flatMap((v) => v.blocks.map((b) => b.component)));
  if (comps) features = features.filter((f) => comps.some((c) => usedComps(f).has(c)));
  if (changed) features = features.filter((f) => changed === 'all' || [...usedComps(f)].some((c) => changed.includes(c)));
  const DEVICES = { desktop: [1440, 900], notebook: [1280, 800], 'tablet-l': [1024, 768], tablet: [768, 1024], mobile: [390, 844], 'mobile-s': [360, 780] };
  const vps = list('viewports') || ['desktop', 'notebook', 'tablet-l', 'tablet', 'mobile'];
  const themes = list('themes') || ['graphite'];
  const states = list('states') || ['default'];
  const jobs = [];
  for (const f of features) {
    const variants = flag('all-variants') || comps || changed ? f.variants.map((v) => v.id) : [f.selectedVariantId || f.variants[0].id];
    for (const v of variants) for (const vp of vps) for (const t of themes) for (const st of states) jobs.push({ f, v, vp, size: DEVICES[vp] || DEVICES.desktop, theme: t, st });
  }
  return { jobs, features };
}

// ---------------------------------------------------------- Vertragsprüfung
async function contractStage(page, base) {
  await page.goto(`${base}/preview.html`);
  return page.evaluate(async () => {
    const reg = await import('./src/library/registry.js');
    const { loadStateStandalone } = await import('./src/core/preview-payload.js');
    const state = await loadStateStandalone();
    const errors = [], warnings = [];
    const ids = new Set();
    for (const c of reg.COMPONENTS) {
      for (const e of reg.validateComponent(c)) errors.push(`Komponente ${c.id}: ${e}`);
      if (ids.has(c.id)) errors.push(`Doppelte Komponenten-ID ${c.id}`); ids.add(c.id);
      if (/#[0-9a-f]{3,8}\b/i.test(c.css || '')) warnings.push(`Komponente ${c.id}: Hex-Farbe im CSS (Token verwenden)`);
    }
    const WORLD_KEYS = new Set(Object.keys((await import('./src/seed/world/index.js')).WORLD));
    const fids = new Set();
    for (const f of state.features) {
      if (fids.has(f.id)) errors.push(`Doppelte Feature-ID ${f.id}`); fids.add(f.id);
      if (!state.modules.some((m) => m.id === f.moduleId)) errors.push(`${f.id}: Modul ${f.moduleId} existiert nicht`);
      const vids = new Set();
      for (const v of f.variants) {
        if (vids.has(v.id)) errors.push(`${f.id}: doppelte Varianten-ID ${v.id}`); vids.add(v.id);
        const bids = new Set();
        for (const b of v.blocks) {
          const def = reg.getComponent(b.component);
          if (!def) { errors.push(`${f.id}/${v.id}#${b.id}: unbekannte Komponente ${b.component}`); continue; }
          if (bids.has(b.id)) errors.push(`${f.id}/${v.id}: doppelte Block-ID ${b.id}`); bids.add(b.id);
          for (const slot of def.data || []) {
            const key = b.bind?.[slot.slot] ?? slot.default; const val = (f.demoData || {})[key];
            if (slot.required && !(key in (f.demoData || {}))) warnings.push(`${f.id}/${v.id}#${b.id}: Datenschlüssel „${key}“ fehlt in Demo-Daten`);
            if (typeof val === 'string' && val.startsWith('@world:') && !WORLD_KEYS.has(val.slice(7))) errors.push(`${f.id}/${v.id}#${b.id}: Welt-Schlüssel „${val.slice(7)}“ existiert nicht`);
          }
          for (const k of Object.keys(b.props || {})) if (!(def.props || []).some((p) => p.name === k)) warnings.push(`${f.id}/${v.id}#${b.id}: Prop „${k}“ nicht im Schema von ${def.id}`);
        }
      }
      if (f.selectedVariantId && !f.variants.some((v) => v.id === f.selectedVariantId)) errors.push(`${f.id}: bevorzugte Variante ${f.selectedVariantId} fehlt`);
      for (const i of f.interactions) if (i.to && !(i.to.startsWith('module:') ? state.modules.some((m) => m.id === i.to.slice(7)) : state.features.some((x) => x.id === i.to))) errors.push(`${f.id}: Navigationsziel „${i.to}“ existiert nicht`);
      // Ausgelöste Events: statische Liste der Komponenten + konfigurierbare Events (Props wie primaryEvent, Event-Felder in Demo-Daten)
      const evName = (e) => (typeof e === 'string' ? e : e?.name);
      const isEv = (x) => typeof x === 'string' && /^[a-z][\w-]*\.[a-z][\w.-]*$/i.test(x);
      const events = new Set(f.variants.flatMap((v) => v.blocks.flatMap((b) => (reg.getComponent(b.component)?.events || []).map(evName))));
      for (const v of f.variants) for (const b of v.blocks) for (const [k, x] of Object.entries(b.props || {})) if (/event/i.test(k) && isEv(x)) events.add(x);
      const scan = (o, depth = 0) => { if (!o || typeof o !== 'object' || depth > 4) return; for (const [k, x] of Object.entries(o)) { if (/^(event|.*Event)$/.test(k) && isEv(x)) events.add(x); else if (typeof x === 'object') scan(x, depth + 1); } };
      scan(f.demoData || {});
      const wild = [...events].filter((e) => e && e.endsWith('*')).map((e) => e.slice(0, -1));
      for (const i of f.interactions) if (i.event && f.variants.length && !events.has(i.event) && !wild.some((w) => i.event.startsWith(w)) && !/^(nav|dialog|state)\./.test(i.event) && !/^open:[a-z0-9-]+(\.[a-z0-9-]+)?$/.test(i.event)) warnings.push(`${f.id}: Interaktion „${i.event}“ wird von keiner verwendeten Komponente ausgelöst`);
    }
    return { components: reg.COMPONENTS.length, features: state.features.length, errors, warnings };
  });
}

// --------------------------------------------------------------- E2E-Tests
async function e2eStage(browser, base, log) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/404|Failed to load resource/.test(m.text())) consoleErrors.push(m.text()); });
  const tests = [];
  const T = async (name, fn) => {
    const t0 = Date.now();
    try { await fn(); tests.push({ name, status: 'pass', ms: Date.now() - t0 }); log(`  ✓ ${name}`); }
    catch (e) { tests.push({ name, status: 'fail', ms: Date.now() - t0, error: e.message.split('\n')[0] }); log(`  ✖ ${name}: ${e.message.split('\n')[0]}`); await page.screenshot({ path: path.join(OUT, `e2e-fail-${safe(name)}.png`) }).catch(() => {}); await page.keyboard.press('Escape').catch(() => {}); }
  };
  const go = async (hash) => { await page.evaluate((h) => { location.hash = h; }, hash); await page.waitForTimeout(250); };
  const confirm = () => page.locator('[data-confirm]').last().click();
  const expect = async (cond, msg) => { if (!(await cond)) throw new Error(msg); };
  const eventually = async (fn, msg, timeout = 4000) => { const t0 = Date.now(); for (;;) { if (await fn().catch(() => false)) return; if (Date.now() - t0 > timeout) throw new Error(msg); await page.waitForTimeout(150); } };
  // Liest den gespeicherten Zustand – wartet vorher, bis die Workbench gespeichert hat (Speichern ist entprellt).
  const state = async () => {
    await page.waitForFunction(() => document.querySelector('[data-save-status]')?.getAttribute('data-save-status') === 'saved', null, { timeout: 5000 }).catch(() => {});
    return page.evaluate(async () => (await fetch('/api/state', { cache: 'no-store' })).json());
  };
  const frame = async (sel = 'iframe') => { const h = await page.locator(sel).first().elementHandle(); const f = await h.contentFrame(); await f.waitForSelector('body[data-ready]', { timeout: 10000 }); return f; };

  await page.goto(base + '/');
  await page.waitForSelector('body[data-ready]', { timeout: 15000 });

  await T('Start: Übersicht lädt mit Kennzahlen', async () => { await expect(page.getByRole('heading', { name: 'Übersicht' }).isVisible(), 'Überschrift fehlt'); await expect((await page.locator('.wb-kpi').count()) >= 4, 'KPIs fehlen'); });
  await T('Navigation: alle Hauptbereiche erreichbar', async () => {
    for (const [label, heading] of [['Module', 'Module'], ['Features', 'Features'], ['Komponenten', 'Design Tokens & Themes'], ['Versionen & Entscheidungen', 'Versionen & Entscheidungen'], ['Quality Center', 'Quality Center'], ['Daten & Backup', 'Daten & Backup'], ['Übersicht', 'Übersicht']]) {
      await page.locator('.wb-nav__item', { hasText: label }).first().click(); await page.waitForTimeout(200);
      await expect(page.getByRole('heading', { name: heading }).first().isVisible(), `${heading} nicht sichtbar`);
    }
  });
  await T('Modul anlegen (Dialog, Validierung, Cockpit)', async () => {
    await go('#/modules'); await page.getByRole('button', { name: 'Modul hinzufügen' }).click();
    await confirm(); await expect(page.getByText('Name ist erforderlich').isVisible(), 'Validierung fehlt');
    await page.locator('.wb-dialog input.wb-input').first().fill('QA Testmodul'); await confirm(); await page.waitForTimeout(400);
    await expect(page.locator('input[aria-label="Modulname"]').inputValue().then((v) => v === 'QA Testmodul'), 'Cockpit nicht geöffnet');
    await eventually(() => state().then((s) => s.modules.some((m) => m.name === 'QA Testmodul')), 'Nicht gespeichert');
  });
  await T('Modul umbenennen, archivieren und wiederherstellen', async () => {
    const inp = page.locator('input[aria-label="Modulname"]'); await inp.fill('QA Modul 2'); await inp.press('Enter'); await page.waitForTimeout(300);
    await page.getByRole('button', { name: 'Weitere Aktionen' }).click(); await page.getByRole('menuitem', { name: 'Archivieren' }).click(); await page.waitForTimeout(200);
    await page.getByText('Dieses Modul ist archiviert.').waitFor({ timeout: 3000 });
    await page.getByRole('button', { name: 'Wiederherstellen' }).first().click(); await page.waitForTimeout(200);
    await eventually(() => state().then((s) => s.modules.some((m) => m.name === 'QA Modul 2' && !m.archived)), 'Umbenennen/Wiederherstellen nicht gespeichert');
  });
  await T('Feature anlegen und Workspace öffnen', async () => {
    await page.getByRole('button', { name: 'Feature', exact: true }).click();
    await page.locator('.wb-dialog input[placeholder="z. B. Wochenansicht"]').fill('QA Feature'); await page.getByRole('button', { name: 'Anlegen & öffnen' }).click(); await page.waitForTimeout(400);
    await expect(page.locator('input[aria-label="Feature-Name"]').inputValue().then((v) => v === 'QA Feature'), 'Workspace nicht geöffnet');
  });
  await T('Anforderung hinzufügen und bearbeiten', async () => {
    await page.locator('[data-tab="requirements"]').click(); await page.locator('[data-qa="req-input"]').fill('Muss offline funktionieren'); await page.locator('[data-qa="req-input"]').press('Enter'); await page.waitForTimeout(300);
    await expect(page.locator('input[aria-label="Anforderung"]').first().inputValue().then((v) => v === 'Muss offline funktionieren'), 'Anforderung fehlt');
  });
  await T('Design Studio: Variante anlegen, Block hinzufügen, Prop ändern → Vorschau', async () => {
    await page.locator('[data-tab="overview"]').click(); await page.getByRole('button', { name: 'Variante anlegen' }).click(); await page.waitForTimeout(600);
    await page.locator('[data-qa="add-block"]').click(); await page.locator('.wb-dialog [data-component="item-list"]').click(); await page.waitForTimeout(400);
    const titleField = page.locator('.wb-studio__right label', { hasText: 'Titel' }).locator('input').first(); await titleField.fill('QA Liste'); await titleField.press('Enter'); await page.waitForTimeout(700);
    const f = await frame('.wb-studio__stage iframe'); await f.waitForFunction(() => document.body.textContent.includes('QA Liste'), null, { timeout: 5000 });
  });
  await T('Vorschau: Theme- und Viewport-Wechsel', async () => {
    await page.locator('select[aria-label="Theme"]').selectOption('horizon'); await page.waitForTimeout(500);
    const f = await frame('.wb-studio__stage iframe'); await expect(f.evaluate(() => document.documentElement.getAttribute('data-tk-theme') === 'horizon'), 'Theme nicht übernommen');
    await page.locator('button[aria-label="Desktop"]').first().click(); await page.waitForTimeout(600);
    const w = await page.locator('.wb-studio__stage iframe').first().evaluate((el) => el.style.width); await expect(Promise.resolve(w === '1440px'), `Iframe-Breite ${w}`);
    await page.locator('select[aria-label="Theme"]').selectOption('graphite'); await page.locator('button[aria-label="Smartphone"]').first().click(); await page.waitForTimeout(300);
  });
  await T('Variante ableiten, Vergleich und Bevorzugen mit Entscheidung', async () => {
    const fid = (await state()).features.find((x) => x.name === 'QA Feature').id;
    await go(`#/features/${encodeURIComponent(fid)}/compare`); await page.getByRole('button', { name: 'Variante ableiten' }).click(); await page.waitForTimeout(500);
    await go(`#/features/${encodeURIComponent(fid)}/compare`); await page.waitForTimeout(500);
    await expect(page.locator('[data-compare]').count().then((n) => n === 2), 'Vergleich zeigt nicht 2 Varianten');
    await page.locator('[data-compare="B"]').getByRole('button', { name: 'Bevorzugen' }).click(); await page.locator('.wb-dialog textarea').first().fill('QA: bessere Lesbarkeit'); await confirm(); await page.waitForTimeout(300);
    await eventually(() => state().then((s) => s.features.find((x) => x.id === fid).selectedVariantId === 'B' && s.decisions.some((d) => d.featureId === fid && /Lesbarkeit/.test(d.rationale))), 'Auswahl/Entscheidung fehlt');
  });
  await T('Version sichern → Historie', async () => {
    await page.getByRole('button', { name: 'Version sichern' }).first().click(); await page.waitForTimeout(300);
    await page.locator('[data-tab="history"]').click(); await page.locator('[data-version="0.1"]').waitFor({ timeout: 4000 });
  });
  await T('QA-Lauf im Browser (alle Ziel-Viewports)', async () => {
    await page.getByRole('button', { name: 'QA ausführen' }).click();
    await page.getByText('Abgeschlossen').waitFor({ timeout: 60000 }); await page.getByRole('button', { name: 'Schließen' }).last().click();
    await eventually(() => state().then((s) => !!s.qa.latest[s.features.find((x) => x.name === 'QA Feature').id]), 'QA-Ergebnis nicht gespeichert');
  });
  await T('Freigabe sperrt Feature, neue Arbeitsversion entsperrt', async () => {
    await page.getByRole('button', { name: 'Freigeben' }).first().click(); await page.waitForTimeout(200);
    const reason = page.locator('.wb-dialog label', { hasText: 'Begründung' }).locator('textarea'); if (await reason.count()) await reason.fill('QA-Test');
    await confirm(); await page.waitForTimeout(400);
    await page.locator('[data-qa="lock-banner"]').waitFor({ timeout: 4000 });
    await expect(page.locator('input[aria-label="Feature-Name"]').isDisabled(), 'Name trotz Sperre editierbar');
    await eventually(() => state().then((s1) => { const f1 = s1.features.find((x) => x.name === 'QA Feature'); return f1.locked && f1.version === '1.0'; }), 'Nach Freigabe nicht v1.0/gesperrt');
    await page.locator('[data-qa="lock-banner"]').getByRole('button', { name: 'Neue Arbeitsversion' }).click(); await page.locator('.wb-dialog input').fill('QA Änderung'); await confirm(); await page.waitForTimeout(300);
    await eventually(() => state().then((s) => { const f2 = s.features.find((x) => x.name === 'QA Feature'); return !f2.locked && f2.version === '1.1' && s.versions.some((v) => v.featureId === f2.id && v.kind === 'release' && v.version === '1.0' && v.componentVersions); }), 'Neue Arbeitsversion v1.1 / Freigabe-Snapshot fehlt');
  });
  await T('Persistenz: Neu laden behält Zustand (Datei)', async () => {
    await page.reload(); await page.waitForSelector('body[data-ready]'); await go('#/features'); await page.waitForTimeout(300);
    await expect(page.locator('[data-feature]', { hasText: 'QA Feature' }).first().isVisible(), 'Feature nach Reload weg');
    await expect(page.locator('[data-save-status]').getAttribute('data-save-status').then((s) => ['saved', 'idle'].includes(s)), 'Speicherstatus nicht ok');
  });
  await T('Feature-Browser: Suche & Statusfilter', async () => {
    await page.locator('input[aria-label="Features durchsuchen"]').fill('Wochenansicht'); await page.waitForTimeout(200);
    const n = await page.locator('[data-feature]').count(); await expect(Promise.resolve(n >= 1 && n < 5), `Treffer ${n}`);
    await page.locator('input[aria-label="Features durchsuchen"]').fill(''); await page.getByRole('button', { name: /Freigegeben/ }).first().click(); await page.waitForTimeout(200);
    await expect(page.locator('[data-feature]').count().then((c) => c >= 1), 'Statusfilter leer'); await page.getByRole('button', { name: 'Filter zurücksetzen' }).click();
  });
  await T('Löschen und Rückgängig (Strg+Z)', async () => {
    const before = (await state()).features.length;
    await page.locator('[data-feature]', { hasText: 'QA Feature' }).first().getByRole('button', { name: 'Aktionen' }).click(); await page.getByRole('menuitem', { name: 'Löschen …' }).click(); await confirm(); await page.waitForTimeout(600);
    await eventually(() => state().then((s) => s.features.length === before - 1), 'Nicht gelöscht');
    await page.locator('body').click({ position: { x: 5, y: 300 } }); await page.keyboard.press('Control+z'); await page.waitForTimeout(700);
    await eventually(() => state().then((s) => s.features.length === before), 'Rückgängig fehlgeschlagen');
  });
  await T('Befehlspalette (Strg+K) und Zurücknavigation', async () => {
    await go('#/'); await page.keyboard.press('Control+k'); await page.keyboard.type('Kanban'); await page.keyboard.press('Enter'); await page.waitForTimeout(400);
    await expect(page.evaluate(() => location.hash.includes('kanban')), 'Palette navigiert nicht');
    await page.goBack(); await page.waitForTimeout(300); await expect(page.evaluate(() => location.hash === '#/'), 'Zurück funktioniert nicht');
  });
  await T('Vorschau-Interaktion erscheint im Interaktions-Log', async () => {
    await go('#/features/home.today/interactions'); await page.waitForTimeout(900);
    const f = await frame(); await f.locator('[role="checkbox"]').first().click(); await page.waitForTimeout(300);
    // Event-Name hängt vom Seed ab (z. B. task.toggle) – geprüft wird, dass die Interaktion im Log landet
    await page.locator('.wb-log__row', { hasText: /\.toggle/ }).first().waitFor({ timeout: 6000 });
  });
  await T('Variantenvergleich eines Seed-Features (3 bedienbare Varianten)', async () => {
    await go('#/features/calendar.week/compare'); await page.waitForTimeout(1500);
    await expect(page.locator('[data-compare]').count().then((n) => n === 3), 'Nicht 3 Varianten');
    await expect(page.locator('[data-compare] iframe').count().then((n) => n === 3), 'Nicht 3 Vorschauen');
  });
  await T('Export und Import (Rundreise)', async () => {
    await go('#/data'); const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Workbench exportieren' }).click()]);
    const file = path.join(OUT, 'export.json'); await dl.saveAs(file); const exported = JSON.parse(fs.readFileSync(file, 'utf8'));
    await expect(Promise.resolve(exported.features.length > 10 && exported.schemaVersion >= 2 && Array.isArray(exported.directions)), 'Export unvollständig');
    exported.modules.push({ id: 'qa-import', name: 'QA Import', icon: 'box' }); fs.writeFileSync(file, JSON.stringify(exported));
    await page.locator('[data-qa="import-input"]').setInputFiles(file); await page.waitForTimeout(300);
    const [dl2] = await Promise.all([page.waitForEvent('download'), confirm()]); await dl2.cancel().catch(() => {}); await page.waitForTimeout(500);
    await eventually(() => state().then((s) => s.modules.some((m) => m.id === 'qa-import')), 'Import nicht übernommen');
  });
  await T('Gesperrtes Seed-Feature ist schreibgeschützt (Studio)', async () => {
    const st = await state(); const locked = st.features.find((x) => x.locked && x.variants.length); if (!locked) throw new Error('kein freigegebenes Feature im Seed');
    await go(`#/studio/${encodeURIComponent(locked.id)}`); await page.waitForTimeout(600);
    await expect(page.locator('[data-qa="add-block"]').isDisabled(), 'Block-Button trotz Sperre aktiv');
  });
  await T('Sperrregeln: „Freigegeben“ nur über Freigabe-Aktion', async () => {
    await go('#/features/home.today'); await page.waitForTimeout(300);
    const disabled = await page.locator('select[data-qa="status-select"] option[value="released"]').evaluate((o) => o.disabled);
    await expect(Promise.resolve(disabled), 'Status „Freigegeben“ direkt wählbar');
    const err = await page.evaluate(async () => { const m = await import('./src/workbench/store.js'); try { m.actions.setFeatureStatus('home.today', 'released'); return 'kein Fehler'; } catch (e) { return e.message; } });
    await expect(Promise.resolve(/Freigeben/.test(err)), `Store erlaubt Status ohne Freigabe (${err})`);
  });
  await T('Escape schließt Dialoge', async () => {
    await go('#/modules'); await page.getByRole('button', { name: 'Modul hinzufügen' }).click(); await page.keyboard.press('Escape'); await page.waitForTimeout(200);
    await expect(page.locator('.wb-dialog').count().then((n) => n === 0), 'Dialog bleibt offen');
  });
  await T('Workbench auf Smartphone-Breite (390): Navigation per Menü', async () => {
    await page.setViewportSize({ width: 390, height: 844 }); await go('#/'); await page.waitForTimeout(300);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth); await expect(Promise.resolve(sw <= 391), `Überlauf ${sw}px`);
    await page.getByRole('button', { name: 'Navigation' }).click(); await page.waitForTimeout(300); await page.locator('.wb-nav__item', { hasText: 'Module' }).first().click(); await page.waitForTimeout(300);
    await expect(page.getByRole('heading', { name: 'Module' }).isVisible(), 'Mobile Navigation');
    await page.setViewportSize({ width: 1440, height: 900 });
  });
  await T('Demo-Launcher: Versionen, gekoppelte Navigation, Bewertung, Übernehmen', async () => {
    const lp = await ctx.newPage(); await lp.setViewportSize({ width: 1600, height: 1000 });
    lp.on('pageerror', (e) => consoleErrors.push('Launcher: ' + e.message));
    await lp.goto(base + '/launcher.html'); await lp.waitForSelector('body[data-ready]', { timeout: 15000 });
    await lp.waitForFunction(() => document.querySelectorAll('[data-launcher-version] iframe').length >= 2, null, { timeout: 8000 });
    await lp.waitForTimeout(1500);
    const n = await lp.locator('[data-launcher-version]').count(); if (n < 2) throw new Error(`nur ${n} Versionen sichtbar`);
    const f0 = lp.frameLocator('[data-launcher-version] iframe').first();
    await f0.locator('[data-nav-module="calendar"]').first().click();
    let routes = [];
    await eventually(async () => { routes = await lp.locator('.ln-col__foot .wb-trunc').allTextContents(); return routes.length >= 2 && routes.every((r) => r.startsWith('Kalender')); }, `Navigation nicht gekoppelt: ${routes.join(' | ')}`, 8000).catch(() => { throw new Error(`Navigation nicht gekoppelt: ${routes.join(' | ')}`); });
    await lp.locator('.ln-stars button').nth(4).click(); await lp.waitForTimeout(400);
    await lp.locator('[data-launcher-version]').nth(1).getByRole('button', { name: 'Übernehmen' }).click();
    await lp.locator('.wb-dialog').getByRole('tab', { name: /^Modul/ }).click();
    await lp.locator('.wb-dialog textarea').first().fill('QA: im Launcher am klarsten'); await lp.locator('[data-confirm]').last().click(); await lp.waitForTimeout(800);
    await eventually(() => state().then((s) => s.decisions.some((d) => d.level === 'module' && /Richtung/.test(d.title) && /klarsten/.test(d.rationale)) && s.modules.find((m) => m.id === 'calendar').directionId), 'Übernehmen hat keine Modul-Entscheidung erzeugt');
    const fb = await lp.evaluate(async () => (await (await fetch('/api/feedback')).json()).length); if (fb < 2) throw new Error(`Feedback nicht gespeichert (${fb})`);
    await lp.close();
  });
  await T('Launcher: Szenario „Erster Start“, Offline, Schrift 200 %, Meine Auswahl', async () => {
    const lp = await ctx.newPage(); await lp.setViewportSize({ width: 1600, height: 1000 });
    lp.on('pageerror', (e) => consoleErrors.push('Launcher: ' + e.message));
    await lp.goto(base + '/launcher.html'); await lp.waitForSelector('body[data-ready]', { timeout: 15000 });
    await lp.waitForFunction(() => document.querySelectorAll('[data-launcher-version] iframe').length >= 1, null, { timeout: 8000 });
    await lp.locator('[data-qa="ln-scenario"]').selectOption('erststart'); await lp.locator('[data-qa="ln-offline"]').click(); await lp.locator('[data-qa="ln-scale"]').selectOption('2'); await lp.waitForTimeout(1500);
    const f0 = lp.frameLocator('[data-launcher-version] iframe').first();
    await f0.locator('[data-qa="envbar"]').first().waitFor({ timeout: 15000 }); // drei Rahmen bauen neu auf – unter Last mehrere Sekunden
    const scale = await f0.locator('html').evaluate((el) => getComputedStyle(el).getPropertyValue('--tk-text-scale').trim());
    if (scale !== '2') throw new Error(`Schriftskalierung nicht aktiv (${scale})`);
    await lp.locator('[data-version="mix"]').click(); await lp.waitForTimeout(800);
    await expect(lp.locator('[data-launcher-version="mix"] iframe').count().then((c) => c === 1), '„Meine Auswahl“ nicht angezeigt');
    await lp.locator('[data-qa="ln-scenario"]').selectOption('alltag'); await lp.locator('[data-qa="ln-offline"]').click(); await lp.locator('[data-qa="ln-scale"]').selectOption('1');
    await lp.close();
  });
  await T('App-Rahmen: Launchpad öffnet Module, Fokus-Erfassen schreibt in die gemeinsame Welt', async () => {
    const ap = await ctx.newPage(); await ap.setViewportSize({ width: 390, height: 844 });
    ap.on('pageerror', (e) => consoleErrors.push('App: ' + e.message));
    await ap.goto(base + '/preview.html?app=1&version=dir:visuell'); await ap.waitForSelector('body[data-ready]');
    await ap.locator('[data-qa="launchpad"]').waitFor({ timeout: 8000 });
    await expect(ap.locator('[data-launchpad-module]').count().then((c) => c >= 8), 'Launchpad zeigt zu wenige Module');
    await ap.locator('[data-launchpad-module="calendar"]').click();
    await eventually(async () => (await ap.locator('[data-qa="launchpad"]').count()) === 0 && (await ap.locator('[data-nav-module="calendar"][aria-current="page"]').count()) === 1, 'Launchpad öffnet das Modul nicht', 6000);
    await ap.locator('[data-nav-launchpad]').click(); await ap.locator('[data-qa="launchpad"]').waitFor({ timeout: 5000 });
    await ap.goto(base + '/preview.html?app=1&version=dir:fokus'); await ap.waitForSelector('body[data-ready]');
    await ap.locator('[data-qa="nav-capture"]').click(); await ap.locator('[data-qa="capture-input"]').first().fill('!QA-Aufgabe aus dem Erfassen');
    await ap.locator('[data-qa="capture-save"]').first().click();
    // Fokus-Knopf öffnet „Schnell erfassen“ (system.capture) bzw. – ohne dieses Feature – das Erfassen-Blatt der Runtime
    await ap.getByText(/Erfasst als Aufgabe|Aufgabe erfasst/).first().waitFor({ timeout: 6000 });
    await ap.evaluate(() => window.__taktPreview.navigate('tasks.overview'));
    await eventually(async () => (await ap.getByText('QA-Aufgabe aus dem Erfassen').count()) > 0, 'Erfasste Aufgabe erscheint nicht in Aufgaben (gemeinsame Welt)', 6000);
    await ap.close();
  });
  await T('Demo & Entscheidung: Ebenen-Leiter und Feedback-Eingang', async () => {
    await go('#/decide'); await page.getByRole('heading', { name: 'Demo & Entscheidung' }).waitFor();
    await page.locator('[data-tab="feedback"]').click(); await page.getByRole('button', { name: 'Vom Server laden' }).click(); await page.waitForTimeout(600);
    await expect(page.locator('.wb-table tbody tr').count().then((c) => c >= 2), 'Feedback-Eingang leer');
  });
  await T('Spezifikation (Flutter-Vorlage) und Dart-Tokens exportierbar', async () => {
    await go('#/features'); const [dl] = await Promise.all([page.waitForEvent('download'), (async () => { await page.locator('[data-feature="calendar.month"]').getByRole('button', { name: 'Aktionen' }).click(); await page.getByRole('menuitem', { name: /Spezifikation/ }).click(); })()]);
    const md = path.join(OUT, 'spec.md'); await dl.saveAs(md); const txt = fs.readFileSync(md, 'utf8');
    if (!/# Kalender › Monatsansicht/.test(txt) || !/## Aufbau/.test(txt) || !/Freigabe v1\.0/.test(txt)) throw new Error('Spezifikation unvollständig');
    await go('#/data'); const [d2] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Flutter-Tokens/ }).click()]);
    const dart = path.join(OUT, 'takt_tokens.dart'); await d2.saveAs(dart); if (!/class TaktColors extends ThemeExtension/.test(fs.readFileSync(dart, 'utf8'))) throw new Error('Dart-Tokens fehlerhaft');
  });
  await T('App-Ebene: Leitbild, Inbox, Muster und Gates', async () => {
    await go('#/app/leitbild'); await page.getByRole('heading', { name: 'App-Ebene' }).waitFor();
    const vision = page.locator('[data-qa="app-vision"]'); await vision.fill('QA-Vision: ruhig und schnell'); await vision.blur(); await page.waitForTimeout(300);
    await eventually(async () => (await state()).app.vision === 'QA-Vision: ruhig und schnell', 'Vision nicht gespeichert');
    await go('#/app/inbox'); await expect(page.locator('[data-qa="inbox"] [data-decision]').count().then((c) => c >= 5), 'Inbox leer');
    await go('#/app/muster'); await expect(page.locator('[data-decision^="pattern-"]').count().then((c) => c >= 10), 'Pflichtfragen fehlen');
    await go('#/app/gates'); await expect(page.locator('[data-gate]').count().then((c) => c >= 5), 'App-Gate fehlt');
  });
  await T('Entscheidungsrunde: Agenda, Empfehlung, Parken, Rundenlimit, Arbeitsauftrag', async () => {
    await go('#/rounds'); await page.locator('[data-qa="new-round"]').click(); await page.waitForTimeout(300);
    await confirm(); await page.locator('[data-qa="round-timer"]').waitFor({ timeout: 5000 });
    let st = await state(); const r = st.rounds[0]; if (!r || r.agenda.length < 3) throw new Error('Runde ohne Agenda');
    // Frage 1 ist die App-Richtung (höchste Blockierwirkung): Empfehlung fehlt → Option wählen und entscheiden
    const first = st.decisions.find((d) => d.id === r.agenda[0]);
    if (first.kind === 'app-direction') { await page.locator('[data-option-select]').first().click(); await page.locator('[data-qa="round-decide"]').click(); }
    else await page.locator('[data-qa="accept-recommendation"]').click();
    const outcomes = async (n) => eventually(async () => ((await state()).rounds[0].results || []).length >= n, `Rundenergebnis ${n} nicht gespeichert`, 8000);
    await outcomes(1); await page.getByRole('heading', { name: 'Frage 2 von', exact: false }).waitFor();
    await page.locator('[data-qa="accept-recommendation"]').click(); await outcomes(2); await page.getByRole('heading', { name: 'Frage 3 von', exact: false }).waitFor();
    await page.getByRole('button', { name: /Parken/ }).click(); await outcomes(3);
    st = await state(); const res = st.rounds[0].results;
    await expect(res.filter((x) => x.outcome === 'entschieden').length === 2 && res.some((x) => x.outcome === 'geparkt'), `Ergebnisse falsch: ${JSON.stringify(res.map((x) => x.outcome))}`);
    if (first.kind === 'app-direction') await expect(!!st.app.directionId && st.decisions.filter((d) => d.kind === 'app-direction' && d.status === 'open').length === 0, 'App-Richtung nicht übernommen');
    await expect(st.decisions.find((d) => d.id === r.agenda[2]).status === 'parked' && !!st.decisions.find((d) => d.id === r.agenda[2]).revisitAt, 'Parken ohne Wiedervorlage');
    await page.getByRole('button', { name: 'Runde abschließen' }).click(); await page.getByRole('heading', { name: 'Ergebnis' }).waitFor();
    const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Arbeitsauftrag/ }).click()]);
    const md = path.join(OUT, 'arbeitsauftrag.md'); await dl.saveAs(md); const txt = fs.readFileSync(md, 'utf8');
    if (!/## 1\. Entschieden – umsetzen \(2\)/.test(txt) || !/Geparkt \(1\)/.test(txt)) throw new Error('Arbeitsauftrag unvollständig');
    // Rundenlimit: zweite Runde mit einer offenen Frage, die schon in Runde 1 war (nicht behandelt) → nach Start Runde 2 = Limit
    const leftover = r.agenda.slice(3)[0];
    if (leftover) {
      await go('#/rounds'); await page.locator('[data-qa="new-round"]').click(); await page.waitForTimeout(300);
      await page.locator('.wb-dialog input[type="checkbox"]').evaluateAll((els) => els.forEach((e) => { if (e.checked) e.click(); }));
      await page.locator('.wb-dialog label', { has: page.locator(`text=${st.decisions.find((d) => d.id === leftover).title}`) }).locator('input').first().check();
      await confirm(); await page.locator('[data-qa="round-timer"]').waitFor();
      await expect(page.getByText('Rundenlimit erreicht').first().isVisible(), 'Rundenlimit nicht angezeigt');
      await expect(page.getByRole('button', { name: 'Änderung nötig' }).isDisabled(), '„Änderung nötig“ trotz Limit aktiv');
      await page.getByRole('button', { name: 'Runde abschließen' }).click();
    }
  });
  await T('Feature-Gates, Design-Tiefe, Akzeptanzkriterien, Anmerkungen und Scorecard', async () => {
    const fid = 'calendar.week';
    await go(`#/features/${encodeURIComponent(fid)}/overview`); await page.locator('[data-qa="tier-select"]').selectOption('3');
    await eventually(async () => (await state()).features.find((x) => x.id === fid).tier === 3, 'Tier nicht gesetzt', 8000);
    await page.locator('[data-qa="pin-input"]').fill('QA: Wochenstart prüfen'); await page.keyboard.press('Enter');
    await eventually(async () => (await state()).pins.some((p) => p.featureId === fid && p.text === 'QA: Wochenstart prüfen'), 'Anmerkung fehlt', 8000);
    let st = await state(); const f = st.features.find((x) => x.id === fid);
    if (!f.locked) { await go(`#/features/${encodeURIComponent(fid)}/requirements`); await page.locator('[data-qa="acceptance-input"]').fill('Gegeben eine Woche mit Terminen, wenn ich nach links wische, dann sehe ich die Vorwoche'); await page.keyboard.press('Enter'); await page.waitForTimeout(200); }
    await go(`#/features/${encodeURIComponent(fid)}/compare`); await page.locator('[data-qa="scorecard"]').waitFor();
    await page.locator('[data-qa="scorecard"] [role="radio"]').nth(4).click(); await page.waitForTimeout(200);
    st = await state(); await expect(Object.keys(st.scores[fid] || {}).length >= 1, 'Score nicht gespeichert');
  });
  await T('Keine JavaScript-Fehler während der Bedienung', async () => { if (consoleErrors.length) throw new Error(consoleErrors.slice(0, 3).join(' | ')); });
  await ctx.close();
  return { total: tests.length, passed: tests.filter((t) => t.status === 'pass').length, failed: tests.filter((t) => t.status === 'fail').map((t) => t.name), tests };
}

// ------------------------------------------------------- Visuelle Matrix ---
async function visualStage(browser, base, jobs, pixel, log) {
  const results = [];
  const ctx = await browser.newContext({ deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  let i = 0;
  for (const j of jobs) {
    i++;
    const [w, h] = j.size;
    await page.setViewportSize({ width: w, height: h });
    errs.length = 0;
    await page.goto(`${base}/preview.html?feature=${encodeURIComponent(j.f.id)}&variant=${encodeURIComponent(j.v)}&theme=${j.theme}&state=${j.st}&chrome=1${extra}`);
    await page.waitForSelector('body[data-ready]', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(250);
    const probe = await page.evaluate(() => window.__taktQA.run()).catch((e) => ({ status: 'fail', checks: [{ id: 'runner', name: 'Prüflauf', status: 'fail', detail: e.message, items: [] }] }));
    if (errs.length) probe.checks.push({ id: 'pageerror', name: 'Laufzeitfehler', status: 'fail', detail: errs.join(' | '), items: [] });
    // Ganzseitig: Viewport auf Dokumenthöhe setzen, damit fixierte Elemente korrekt unten sitzen
    const full = Math.min(4000, await page.evaluate(() => document.documentElement.scrollHeight));
    if (full > h) { await page.setViewportSize({ width: w, height: full }); await page.waitForTimeout(150); }
    const name = `${safe(j.f.id)}__${safe(j.v)}__${j.vp}__${j.theme}${j.st !== 'default' ? '__' + j.st : ''}${envSuffix}.png`;
    const shot = path.join(OUT, 'shots', name);
    await page.screenshot({ path: shot });
    let visual = null;
    if (pixel) {
      const baseDir = path.join(QA, 'baselines', safe(j.f.id), safe(j.v)); fs.mkdirSync(baseDir, { recursive: true });
      const baseFile = path.join(baseDir, `${j.vp}__${j.theme}${j.st !== 'default' ? '__' + j.st : ''}${envSuffix}.png`);
      const strict = !!j.f.locked; // freigegebene Features: Abweichung = Regression
      if (!fs.existsSync(baseFile) || flag('update-baseline')) { fs.copyFileSync(shot, baseFile); visual = { status: fs.existsSync(baseFile) && flag('update-baseline') ? 'updated' : 'new', ratio: 0 }; }
      else {
        const a = pixel.PNG.sync.read(fs.readFileSync(baseFile)), b = pixel.PNG.sync.read(fs.readFileSync(shot));
        if (a.width !== b.width || a.height !== b.height) visual = { status: strict ? 'fail' : 'warn', ratio: 1, detail: `Größe ${a.width}×${a.height} → ${b.width}×${b.height}` };
        else {
          const diff = new pixel.PNG({ width: a.width, height: a.height });
          const n = pixel.pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.12 });
          const ratio = n / (a.width * a.height);
          visual = { status: ratio <= THRESHOLD ? 'pass' : strict ? 'fail' : 'warn', ratio };
          if (ratio > THRESHOLD) { const df = path.join(OUT, 'diff', name); fs.writeFileSync(df, pixel.PNG.sync.write(diff)); visual.diff = rel(df); }
        }
        if (!strict && visual.status !== 'pass') fs.copyFileSync(shot, baseFile); // Arbeitsstände: Baseline folgt dem letzten Lauf
        visual.baseline = rel(baseFile); visual.strict = strict;
      }
      probe.checks.push({ id: 'visual', name: strict ? 'Visuelle Regression (freigegeben)' : 'Visuelle Änderung (Arbeitsstand)', status: visual.status === 'new' || visual.status === 'updated' ? 'pass' : visual.status, detail: visual.detail || `${visual.status === 'new' ? 'Neue Baseline angelegt' : visual.status === 'updated' ? 'Baseline aktualisiert' : `Abweichung ${(visual.ratio * 100).toFixed(2)} %`}`, items: [] });
    }
    const status = probe.checks.some((c) => c.status === 'fail') ? 'fail' : probe.checks.some((c) => c.status === 'warn') ? 'warn' : 'pass';
    results.push({ featureId: j.f.id, variantId: j.v, viewport: j.vp, width: w, theme: j.theme, state: j.st, status, checks: probe.checks, screenshot: rel(shot), visual });
    if (status !== 'pass' || i % 20 === 0 || i === jobs.length) log(`  [${i}/${jobs.length}] ${status === 'pass' ? '✓' : status === 'warn' ? '!' : '✖'} ${j.f.id} ${j.v} ${j.vp} ${j.theme}${j.st !== 'default' ? ' ' + j.st : ''}${status !== 'pass' ? ' – ' + probe.checks.filter((c) => c.status !== 'pass').map((c) => `${c.name}: ${c.detail}`).join('; ') : ''}`);
  }
  await ctx.close();
  return results;
}

// ------------------------------------------------------------------- Main ---
const RUN_ID = new Date().toISOString().replace(/[:.]/g, '-');
const OUT = path.join(QA, 'results', RUN_ID);
fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true }); fs.mkdirSync(path.join(OUT, 'diff'), { recursive: true });

async function main() {
  const lines = []; const log = (s) => { console.log(s); lines.push(s); };
  log(`TAKT Workbench QA · ${now()}`);
  const pw = await loadPlaywright();
  const pixel = await loadPixel();
  if (!pixel) log('! pixelmatch/pngjs fehlen – nur Screenshots, kein Pixelvergleich (npm install).');
  const { state, source } = await loadState();
  log(`Datenbasis: ${source} · ${state.modules.length} Module · ${state.features.length} Features`);

  // Selektiv: geänderte Komponenten seit letztem Lauf
  const hashFile = path.join(QA, 'baselines', 'component-hashes.json');
  const hashes = await componentHashes();
  let changed = null;
  if (flag('changed')) {
    const prev = fs.existsSync(hashFile) ? JSON.parse(fs.readFileSync(hashFile, 'utf8')) : null;
    if (!prev || prev.globals !== hashes.globals) { changed = 'all'; log(prev ? 'Globale Dateien (Tokens/Primitive/Runtime) geändert → alle Features prüfen.' : 'Kein vorheriger Hash-Stand → alle Features prüfen.'); }
    else { changed = Object.keys(hashes.byComp).filter((c) => prev.byComp[c] !== hashes.byComp[c]); log(`Geänderte Komponenten: ${changed.join(', ') || 'keine'}`); }
  }

  const userSrv = createServer({ dataDir: path.join(ROOT, 'data'), quiet: true });
  const userBase = `http://127.0.0.1:${await listen(userSrv)}`;
  const tmpData = fs.mkdtempSync(path.join(os.tmpdir(), 'takt-qa-'));
  const testSrv = createServer({ dataDir: tmpData, quiet: true });
  const testBase = `http://127.0.0.1:${await listen(testSrv)}`;
  const browser = await pw.chromium.launch({ headless: !flag('headed'), ...(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {}) });
  const report = { ts: now(), runId: RUN_ID, source, status: 'pass', summary: '', contract: null, e2e: null, results: [] };
  try {
    if (run('contract')) {
      log('\n▶ Vertragsprüfung (Komponenten, Varianten, Bindungen)');
      const page = await browser.newPage();
      report.contract = await contractStage(page, userBase); await page.close();
      log(`  ${report.contract.components} Komponenten, ${report.contract.features} Features · ${report.contract.errors.length} Fehler · ${report.contract.warnings.length} Hinweise`);
      report.contract.errors.forEach((e) => log(`  ✖ ${e}`)); report.contract.warnings.slice(0, 30).forEach((w) => log(`  ! ${w}`));
    }
    if (run('e2e') && !changed) { log('\n▶ E2E-Bedientests der Workbench (frischer Seed, temporäre Daten)'); report.e2e = await e2eStage(browser, testBase, log); }
    if (run('visual')) {
      if (changed && changed !== 'all' && !changed.length) log('\n▶ Visuelle Matrix: nichts zu tun (keine Komponente geändert)');
      else {
        const { jobs, features } = plan(state, changed);
        log(`\n▶ Visuelle Matrix: ${features.length} Features → ${jobs.length} Prüfungen`);
        report.results = await visualStage(browser, userBase, jobs, pixel, log);
      }
      fs.writeFileSync(hashFile, JSON.stringify(hashes, null, 1));
    }
  } finally { await browser.close(); userSrv.close(); testSrv.close(); fs.rmSync(tmpData, { recursive: true, force: true }); }

  const c = { pass: 0, warn: 0, fail: 0 }; report.results.forEach((r) => c[r.status]++);
  const e2eFail = report.e2e ? report.e2e.total - report.e2e.passed : 0;
  const contractFail = report.contract?.errors.length || 0;
  report.status = c.fail || e2eFail || contractFail ? 'fail' : c.warn || report.contract?.warnings.length ? 'warn' : 'pass';
  report.summary = [report.contract && `Vertrag: ${contractFail} Fehler/${report.contract.warnings.length} Hinweise`, report.e2e && `E2E: ${report.e2e.passed}/${report.e2e.total}`, report.results.length && `Visuell: ${c.pass} ✓ · ${c.warn} ! · ${c.fail} ✖`].filter(Boolean).join(' · ');
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 1));
  fs.writeFileSync(path.join(QA, 'results', 'latest.json'), JSON.stringify(report, null, 1));
  const md = [`# QA-Lauf ${report.ts}`, '', `**Status:** ${report.status} · ${report.summary}`, `**Datenbasis:** ${source}`, '',
    report.e2e ? `## E2E (${report.e2e.passed}/${report.e2e.total})\n${report.e2e.tests.map((t) => `- ${t.status === 'pass' ? '✓' : '✖'} ${t.name}${t.error ? ` – ${t.error}` : ''}`).join('\n')}\n` : '',
    report.contract ? `## Vertrag\n${[...report.contract.errors.map((e) => `- ✖ ${e}`), ...report.contract.warnings.map((w) => `- ! ${w}`)].join('\n') || '- keine Befunde'}\n` : '',
    report.results.length ? `## Visuelle Matrix\n| Feature | Var. | Viewport | Theme | Status | Auffällig |\n|---|---|---|---|---|---|\n${report.results.map((r) => `| ${r.featureId} | ${r.variantId} | ${r.viewport} | ${r.theme}${r.state !== 'default' ? ' ' + r.state : ''} | ${r.status} | ${r.checks.filter((x) => x.status !== 'pass').map((x) => `${x.name}: ${x.detail}`).join('; ')} |`).join('\n')}` : ''].join('\n');
  fs.writeFileSync(path.join(OUT, 'report.md'), md); fs.writeFileSync(path.join(QA, 'results', 'latest.md'), md);
  // Alte Läufe aufräumen (5 behalten)
  const runs = fs.readdirSync(path.join(QA, 'results')).filter((d) => /^\d{4}-/.test(d)).sort();
  for (const d of runs.slice(0, Math.max(0, runs.length - 5))) fs.rmSync(path.join(QA, 'results', d), { recursive: true, force: true });
  log(`\n■ ${report.status.toUpperCase()} · ${report.summary}\n  Bericht: qa/results/latest.md · Screenshots: qa/results/${RUN_ID}/shots/`);
  process.exitCode = report.status === 'fail' ? 1 : 0;
}
main().catch((e) => { console.error(e); process.exit(1); });
