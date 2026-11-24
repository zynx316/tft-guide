// ============================================================================
// QA-RUNNER (Workbench) – rendert Feature-Varianten nacheinander in einem
// sichtbaren Prüf-Iframe in jeder Ziel-Größe und führt die QA-Sonde aus.
// Dieselbe Sonde nutzt das CLI (qa/run-qa.mjs) – Ergebnisse sind vergleichbar.
// ============================================================================
import { buildFeaturePayload } from '../core/preview-payload.js';
import { deviceById, devicesForFeature } from '../core/devices.js';
import { uid, nowIso } from '../lib/util.js';

function loadFrame(host, device) {
  return new Promise((resolve, reject) => {
    host.innerHTML = '';
    const f = document.createElement('iframe');
    f.src = './preview.html';
    f.style.cssText = `width:${device.width}px;height:${device.height}px;border:0;transform-origin:0 0;transform:scale(${Math.min(1, 360 / device.width)});`;
    host.style.width = `${device.width * Math.min(1, 360 / device.width)}px`;
    host.style.height = `${device.height * Math.min(1, 360 / device.width)}px`;
    const t = setTimeout(() => reject(new Error('Preview lädt nicht (Timeout)')), 15000);
    f.onload = () => { clearTimeout(t); resolve(f); };
    host.append(f);
  });
}

/**
 * runQa({ state, jobs:[{featureId, variantId?}], devices?, themes, states, host, onProgress, signal })
 * Liefert { id, ts, status, counts, results:[{featureId, variantId, viewport, group, theme, state, status, checks}] }
 */
export async function runQa({ state, jobs, devices, themes = ['graphite'], states = ['default'], host, onProgress, signal, scope = 'manuell' }) {
  const results = [];
  const plan = [];
  for (const job of jobs) {
    const f = state.features.find((x) => x.id === job.featureId);
    if (!f || !f.variants.length) continue;
    const variants = job.variantId === '*' ? f.variants.map((v) => v.id) : [job.variantId || f.selectedVariantId || f.variants[0].id];
    const devs = (devices ? devices.map(deviceById) : devicesForFeature(f));
    for (const variantId of variants) for (const d of devs) for (const theme of themes) for (const st of states) plan.push({ f, variantId, d, theme, st });
  }
  // Iframes je Gerät wiederverwenden (Breite bleibt gleich)
  let current = null, currentDevice = null;
  for (let i = 0; i < plan.length; i++) {
    if (signal?.aborted) break;
    const { f, variantId, d, theme, st } = plan[i];
    onProgress && onProgress({ index: i, total: plan.length, label: `${f.name} · ${variantId} · ${d.label} · ${theme}${st !== 'default' ? ' · ' + st : ''}` });
    try {
      if (currentDevice !== d.id) { current = await loadFrame(host, d); currentDevice = d.id; await waitFor(() => current.contentWindow.__taktPreview, 8000); }
      current.contentWindow.__taktPreview.render(buildFeaturePayload(state, f.id, variantId, { theme, state: st, chrome: true }));
      await sleep(180);
      const r = await current.contentWindow.__taktQA.run();
      results.push({ featureId: f.id, variantId, viewport: d.id, group: d.group, width: d.width, theme, state: st, status: r.status, checks: r.checks });
    } catch (e) {
      results.push({ featureId: f.id, variantId, viewport: d.id, group: d.group, width: d.width, theme, state: st, status: 'fail', checks: [{ id: 'runner', name: 'Prüflauf', status: 'fail', detail: e.message, items: [] }] });
      currentDevice = null;
    }
  }
  onProgress && onProgress({ index: plan.length, total: plan.length, label: 'fertig' });
  const counts = { pass: 0, warn: 0, fail: 0 };
  results.forEach((r) => counts[r.status]++);
  return { id: uid('qa'), ts: nowIso(), scope, status: counts.fail ? 'fail' : counts.warn ? 'warn' : 'pass', counts, results, aborted: !!signal?.aborted };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(fn, timeout) { const t0 = Date.now(); while (!fn()) { if (Date.now() - t0 > timeout) throw new Error('Preview-Runtime nicht bereit'); await sleep(40); } }
