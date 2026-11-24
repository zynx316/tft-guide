#!/usr/bin/env node
// ============================================================================
// TAKT Design Workbench – lokaler Server (Node >= 18, KEINE Abhaengigkeiten)
//   node server.mjs [--port 4317] [--host 127.0.0.1] [--data ./data] [--open]
// * liefert app/ statisch aus
// * GET/PUT /api/state         -> data/workbench.json (atomar geschrieben)
// * automatische Backups       -> data/backups/ (max. 1 je 10 Min., 40 behalten)
// * GET  /api/backups          -> Liste;  GET /api/backups/<datei> -> Inhalt
// * POST /api/backups          -> sofortiges Backup
// * GET  /api/qa/latest        -> qa/results/latest.json (CLI-QA-Ergebnis)
// * /qa/...                    -> Screenshots/Baselines fuer das Quality Center
// Ohne Server laeuft die Workbench auch rein im Browser-Speicher (Fallback).
// ============================================================================
import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.md': 'text/markdown; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.webp': 'image/webp' };

export function createServer({ dataDir = path.join(ROOT, 'data'), quiet = false } = {}) {
  const STATE = path.join(dataDir, 'workbench.json');
  const BACKUPS = path.join(dataDir, 'backups');
  const APP = path.join(ROOT, 'app');
  const QA = path.join(ROOT, 'qa');
  fs.mkdirSync(BACKUPS, { recursive: true });
  let lastBackup = 0;
  const log = (...a) => { if (!quiet) console.log(new Date().toLocaleTimeString('de-DE'), ...a); };

  async function backup(reason = 'auto') {
    if (!fs.existsSync(STATE)) return null;
    const name = `workbench-${new Date().toISOString().replace(/[:.]/g, '-')}-${reason}.json`;
    await fsp.copyFile(STATE, path.join(BACKUPS, name));
    lastBackup = Date.now();
    const files = (await fsp.readdir(BACKUPS)).filter((f) => f.endsWith('.json')).sort();
    for (const f of files.slice(0, Math.max(0, files.length - 40))) await fsp.unlink(path.join(BACKUPS, f)).catch(() => {});
    return name;
  }
  const send = (res, code, body, type = 'application/json; charset=utf-8') => {
    res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' });
    res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
  };
  const readBody = (req) => new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    req.on('data', (c) => { size += c.length; if (size > 50 * 1024 * 1024) { reject(new Error('zu gross')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8'))); req.on('error', reject);
  });
  const safeJoin = (base, rel) => { const p = path.normalize(path.join(base, rel)); return p === base || p.startsWith(base + path.sep) ? p : null; };

  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      const p = decodeURIComponent(url.pathname);
      // Schreibschutz: nur JSON, nur vom eigenen Rechner, kein fremder Origin (CSRF/DNS-Rebinding)
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        const remote = req.socket.remoteAddress || '';
        const local = /^(::1|127\.|::ffff:127\.)/.test(remote);
        const origin = req.headers.origin;
        const hostOk = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(req.headers.host || '');
        if (!local || !hostOk) return send(res, 403, { error: 'Schreiben nur lokal (LAN-Modus ist schreibgeschützt)' });
        if (origin && !/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin)) return send(res, 403, { error: 'Fremder Origin' });
        if (req.method === 'PUT' && !/^application\/json/.test(req.headers['content-type'] || '')) return send(res, 415, { error: 'Nur application/json' });
      }
      if (p === '/api/health') return send(res, 200, { ok: true, dataDir, hasState: fs.existsSync(STATE) });
      if (p === '/api/state' && req.method === 'GET') {
        if (!fs.existsSync(STATE)) return send(res, 404, { error: 'noch kein Zustand gespeichert' });
        return send(res, 200, await fsp.readFile(STATE, 'utf8'));
      }
      if (p === '/api/state' && req.method === 'PUT') {
        const body = await readBody(req);
        const parsed = JSON.parse(body); // validiert JSON
        if (!Array.isArray(parsed.modules) || !Array.isArray(parsed.features)) return send(res, 400, { error: 'ungueltiger Zustand' });
        // Konflikterkennung: Client sendet die Revision, auf der er aufbaut
        const baseRev = req.headers['x-base-rev'];
        if (baseRev != null && fs.existsSync(STATE)) {
          const cur = JSON.parse(await fsp.readFile(STATE, 'utf8'));
          if (String(cur.meta?.rev || 0) !== String(baseRev)) return send(res, 409, { error: 'Konflikt', serverRev: cur.meta?.rev || 0 });
        }
        if (Date.now() - lastBackup > 10 * 60 * 1000) await backup('auto');
        const tmp = STATE + '.tmp';
        await fsp.writeFile(tmp, JSON.stringify(parsed, null, 1), 'utf8');
        await fsp.rename(tmp, STATE);
        return send(res, 200, { ok: true, savedAt: new Date().toISOString() });
      }
      if (p === '/api/backups' && req.method === 'GET') {
        const files = (await fsp.readdir(BACKUPS)).filter((f) => f.endsWith('.json')).sort().reverse();
        return send(res, 200, await Promise.all(files.map(async (f) => ({ name: f, size: (await fsp.stat(path.join(BACKUPS, f))).size }))));
      }
      if (p === '/api/backups' && req.method === 'POST') return send(res, 200, { ok: true, name: await backup('manuell') });
      if (p.startsWith('/api/backups/') && req.method === 'GET') {
        const f = safeJoin(BACKUPS, p.slice('/api/backups/'.length));
        if (!f || !fs.existsSync(f)) return send(res, 404, { error: 'nicht gefunden' });
        return send(res, 200, await fsp.readFile(f, 'utf8'));
      }
      if (p === '/api/qa/latest') {
        const f = path.join(QA, 'results', 'latest.json');
        if (!fs.existsSync(f)) return send(res, 404, { error: 'noch kein CLI-QA-Lauf' });
        return send(res, 200, await fsp.readFile(f, 'utf8'));
      }
      // statische Dateien
      let file = p.startsWith('/qa/') ? safeJoin(QA, p.slice(4)) : safeJoin(APP, p === '/' ? 'index.html' : p.slice(1));
      if (!file) return send(res, 403, 'verboten', 'text/plain');
      if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
      if (!fs.existsSync(file)) return send(res, 404, 'nicht gefunden', 'text/plain');
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      fs.createReadStream(file).pipe(res);
    } catch (err) {
      log('Fehler', req.method, req.url, err.message);
      send(res, 500, { error: err.message });
    }
  });
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
  const port = Number(arg('port', process.env.PORT || 4317));
  const host = arg('host', '127.0.0.1');
  const dataDir = path.resolve(arg('data', path.join(ROOT, 'data')));
  createServer({ dataDir }).listen(port, host, () => {
    const url = `http://${host === '0.0.0.0' ? 'localhost' : host}:${port}/`;
    console.log(`\n  TAKT Design Workbench laeuft:  ${url}\n  Daten: ${dataDir}\n  Beenden: Strg+C\n`);
    if (host === '0.0.0.0') console.log('  Hinweis: Im WLAN erreichbar – fuer Tests auf dem echten Smartphone http://<PC-IP>:' + port + '/preview.html?feature=…\n');
    if (process.argv.includes('--open')) exec(`${process.platform === 'win32' ? 'start ""' : process.platform === 'darwin' ? 'open' : 'xdg-open'} ${url}`);
  });
}
