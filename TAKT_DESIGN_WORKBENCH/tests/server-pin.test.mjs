// WLAN-PIN des Servers: andere Geräte brauchen für /api/* die PIN, der eigene Rechner nicht; /api/ping bleibt offen.
// Ein „anderes Gerät“ wird simuliert, indem der Test den Server über die LAN-Adresse dieses Rechners anspricht
// (Absenderadresse ist dann nicht 127.0.0.1). Ohne LAN-Adresse wird der Teil übersprungen.
import './_helpers.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from '../server.mjs';

const lanIp = Object.values(os.networkInterfaces()).flat().find((a) => a && a.family === 'IPv4' && !a.internal)?.address;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'takt-pin-'));

async function withServer(pin, fn) {
  const srv = createServer({ dataDir: tmp, quiet: true, pin });
  await new Promise((r) => srv.listen(0, '0.0.0.0', r));
  try { await fn(srv.address().port); } finally { await new Promise((r) => srv.close(r)); }
}
const post = (base, headers = {}) => fetch(`${base}/api/feedback`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base, ...headers }, body: JSON.stringify({ id: `t-${Math.round(performance.now() * 1000)}`, rating: 4 }) });

test('eigener Rechner: keine PIN nötig, /api/network liefert die PIN für den QR-Link', async () => {
  await withServer('482913', async (port) => {
    const base = `http://127.0.0.1:${port}`;
    assert.equal((await fetch(`${base}/api/state`)).status, 404); // noch kein Zustand – aber kein 401
    const net = await (await fetch(`${base}/api/network`)).json();
    assert.equal(net.pin, '482913');
    assert.equal(net.pinRequired, true);
    assert.equal(net.boundTo, '0.0.0.0', 'Launcher soll erkennen, dass der Server im WLAN lauscht');
    assert.equal((await post(base)).status, 200);
  });
});

test('anderes Gerät im WLAN: ohne/mit falscher PIN 401, mit PIN erlaubt, Ping offen, PIN nie ausgeliefert', { skip: !lanIp && 'keine LAN-Adresse' }, async () => {
  await withServer('482913', async (port) => {
    const base = `http://${lanIp}:${port}`;
    assert.equal((await fetch(`${base}/api/ping`)).status, 200);
    assert.equal((await fetch(`${base}/api/state`)).status, 401);
    assert.equal((await post(base)).status, 401);
    assert.equal((await post(base, { 'X-Takt-Pin': '000000' })).status, 401);
    assert.equal((await post(base, { 'X-Takt-Pin': '482913' })).status, 200);
    assert.equal((await fetch(`${base}/api/feedback?k=482913`)).status, 200);
    const net = await fetch(`${base}/api/network`, { headers: { 'X-Takt-Pin': '482913' } });
    assert.equal(net.status, 200);
    assert.equal((await net.json()).pin, undefined, 'PIN darf nur an den eigenen Rechner gehen');
    // Statische Dateien (App-Code) brauchen keine PIN
    assert.equal((await fetch(`${base}/launcher.html`)).status, 200);
    // Schreiben des Zustands bleibt im WLAN verboten – auch mit PIN
    const put = await fetch(`${base}/api/state`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Takt-Pin': '482913' }, body: '{"modules":[],"features":[]}' });
    assert.equal(put.status, 403);
  });
});

test('ohne PIN (lokaler Modus): andere Geräte wie bisher', { skip: !lanIp && 'keine LAN-Adresse' }, async () => {
  await withServer(null, async (port) => {
    const base = `http://${lanIp}:${port}`;
    assert.equal((await post(base)).status, 200);
    assert.equal((await (await fetch(`${base}/api/network`)).json()).pinRequired, false);
  });
});
