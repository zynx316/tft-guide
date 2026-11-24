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
// * GET  /api/network          -> LAN-Adressen (QR-Code "Auf dem Handy öffnen" im Launcher)
// * GET/POST /api/feedback     -> Bewertungen/Kommentare aus dem Demo-Launcher (nur anhängen,
//                                 auch vom Handy im LAN erlaubt, Same-Origin, max. 20 KB je Eintrag)
// * /qa/...                    -> Screenshots/Baselines fuer das Quality Center
// Ohne Server laeuft die Workbench auch rein im Browser-Speicher (Fallback).
// ============================================================================
import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';
import os from 'node:os';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.md': 'text/markdown; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.webp': 'image/webp' };

export function createServer({ dataDir = path.join(ROOT, 'data'), quiet = false } = {}) {
  const STATE = path.join(dataDir, 'workbench.json');
  const FEEDBACK = path.join(dataDir, 'feedback.jsonl');
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
      // Feedback aus dem Demo-Launcher: einzige Schreib-Ausnahme für das LAN (append-only, Same-Origin, klein)
      if (p === '/api/feedback' && req.method === 'POST') {
        const origin = req.headers.origin; const host = req.headers.host || '';
        if (origin && origin !== `http://${host}` && origin !== `https://${host}`) return send(res, 403, { error: 'Fremder Origin' });
        if (!/^application\/json/.test(req.headers['content-type'] || '')) return send(res, 415, { error: 'Nur application/json' });
        const body = await readBody(req);
        if (body.length > 20000) return send(res, 413, { error: 'Eintrag zu groß' });
        const entry = JSON.parse(body);
        const clean = { id: String(entry.id || Date.now().toString(36)).slice(0, 40), ts: new Date().toISOString(), device: String(entry.device || '').slice(0, 80),
          version: String(entry.version || '').slice(0, 60), level: String(entry.level || '').slice(0, 20), target: String(entry.target || '').slice(0, 120),
          rating: Number.isFinite(entry.rating) ? Math.max(0, Math.min(5, entry.rating)) : null, favorite: !!entry.favorite,
          choose: !!entry.choose, comment: String(entry.comment || '').slice(0, 2000) };
        await fsp.appendFile(FEEDBACK, JSON.stringify(clean) + '\n', 'utf8');
        return send(res, 200, { ok: true, id: clean.id });
      }
      if (p === '/api/feedback' && req.method === 'GET') {
        if (!fs.existsSync(FEEDBACK)) return send(res, 200, []);
        const lines = (await fsp.readFile(FEEDBACK, 'utf8')).split('\n').filter(Boolean);
        return send(res, 200, lines.map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean));
      }
      if (p === '/api/network') {
        const addrs = Object.values(os.networkInterfaces()).flat().filter((a) => a && a.family === 'IPv4' && !a.internal).map((a) => a.address);
        const port = req.socket.localPort;
        return send(res, 200, { port, lan: addrs.map((a) => `http://${a}:${port}`), boundTo: req.socket.localAddress });
      }
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
