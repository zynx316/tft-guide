// ============================================================================
// SPEZIFIKATION ALS JSON („takt-feature-spec/1“) – maschinenlesbare Umsetzungsvorlage je Feature für das Flutter-Projekt.
// * Quelle je Feature: Freigabe-Snapshot (gesperrt) > gewählte Version (Standard „mix“ = Meine Auswahl: Feature-Entscheidung,
//   Modul-Richtung, App-Richtung, sonst Arbeitsstand).
// * `specHash`: stabiler Inhaltsabdruck über alles, was die Umsetzung bestimmt (Variante, Anforderungen, Interaktionen,
//   Daten-Struktur, Komponentenversionen, Token-Version) – ohne Zeitstempel und QA. Ändert sich der Hash, muss die
//   Flutter-Umsetzung nachgezogen werden.
// * `routeTable`: Navigationswege der ganzen App (Startseiten + interaction.to) für die Routen-Definition in Flutter.
// Browser-/Node-neutral; getComponent wird übergeben. CLI: tools/export-spec.mjs.
// ============================================================================
import { resolveVariant, navigationRules, moduleHome, areaOf, stageOf } from './directions.js';
import { LAYOUT_FLUTTER, REGION_FLUTTER, flutterHintFor } from './flutter.js';
import { TOKENS_VERSION } from '../design-system/tokens.js';
import { isWorldRef, worldKey } from '../seed/world/index.js';

export const SPEC_FORMAT = 'takt-feature-spec/1';

/** Kanonisches JSON (sortierte Schlüssel, ohne undefined) – Grundlage des Hashes. */
export function canonical(v) {
  if (Array.isArray(v)) return `[${v.map(canonical).join(',')}]`;
  if (v && typeof v === 'object') return `{${Object.keys(v).sort().filter((k) => v[k] !== undefined).map((k) => `${JSON.stringify(k)}:${canonical(v[k])}`).join(',')}}`;
  return JSON.stringify(v ?? null);
}
/** FNV-1a 64 bit (zwei 32-bit-Hälften) als 16 Hex-Zeichen – kurz, stabil, ohne Abhängigkeiten. */
export function hash64(str) {
  let h1 = 0x811c9dc5, h2 = 0x01000193 ^ 0x5bd1e995;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ c, 0x5bd1e995) >>> 0; h2 ^= h2 >>> 15;
  }
  return h1.toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
}

/** Struktur eines Demo-Werts (für das Datenmodell) – Welt-Bindungen bleiben als Verweis sichtbar. */
function shape(value, depth = 0) {
  if (isWorldRef(value)) return { world: worldKey(value) };
  if (Array.isArray(value)) return { list: value.length ? shape(value[0], depth + 1) : null };
  if (value && typeof value === 'object') {
    if (depth > 2) return 'object';
    return Object.fromEntries(Object.keys(value).sort().slice(0, 24).map((k) => [k, shape(value[k], depth + 1)]));
  }
  return value === null ? 'null' : typeof value;
}

function pickVersion(state, f, versionId) {
  const rel = f.releasedVersionId && state.versions?.find((v) => v.id === f.releasedVersionId);
  if (versionId === 'auto') return rel && f.locked ? 'freigabe' : 'mix';
  return versionId;
}

/** Spezifikation eines Features als Objekt. `versionId`: 'auto' | 'freigabe' | 'mix' | 'arbeitsstand' | 'dir:<id>'. */
export function featureSpecJson(state, featureId, { getComponent = null, versionId = 'auto' } = {}) {
  const f = state.features.find((x) => x.id === featureId); if (!f) return null;
  const m = state.modules.find((x) => x.id === f.moduleId);
  const vid = pickVersion(state, f, versionId);
  const rel = f.releasedVersionId && state.versions?.find((v) => v.id === f.releasedVersionId);
  const snap = vid === 'freigabe' && rel?.snapshot ? { ...f, ...rel.snapshot } : f;
  const res = resolveVariant(state, f, vid);
  const variant = res.variant;
  const demo = res.demoData || snap.demoData || {};
  const comps = variant ? [...new Set(variant.blocks.map((b) => b.component))].map((id) => {
    const def = getComponent ? getComponent(id) : null;
    return { id, name: def?.name || id, version: def?.version || null, events: def?.events || [], flutter: def ? flutterHintFor(def) : null, missing: getComponent ? !def : undefined };
  }) : [];
  const spec = {
    format: SPEC_FORMAT,
    feature: { id: f.id, name: f.name, group: f.group || null, status: f.status, tier: f.tier ?? null, usage: f.usage ?? null, version: f.version || null, locked: !!f.locked },
    module: { id: f.moduleId, name: m?.name || f.moduleId, area: m ? areaOf(m) : null, stage: m ? stageOf(m) : null, home: m ? moduleHome(state, m.id) : null, legal: m?.legal || [] },
    source: { version: vid, resolvedBy: res.source, reason: res.reason || null, release: vid === 'freigabe' && rel ? { version: rel.version, id: rel.id } : null },
    purpose: snap.purpose || '',
    requirements: (snap.requirements || []).map((r) => ({ type: r.type, priority: r.priority, text: r.text })),
    acceptance: [...(f.acceptance || [])],
    flows: (f.flows || []).map((fl) => ({ name: fl.name, steps: (fl.steps || []).map((s) => ({ featureId: s.featureId, action: s.action })) })),
    interactions: (snap.interactions || []).map((i) => ({ trigger: i.trigger, result: i.result, event: i.event || null, to: i.to || null })),
    navigation: navigationRules({ interactions: [...(snap.interactions || []), ...(variant?.nav || [])] }),
    states: [...(snap.states || [])], viewports: [...(snap.viewports || [])],
    variant: variant ? { id: variant.id, name: variant.name, direction: variant.direction || null, concept: variant.concept || '' } : null,
    layout: variant ? { ...(variant.layout || { type: 'stack' }), flutter: LAYOUT_FLUTTER[variant.layout?.type || 'stack'] || null } : null,
    blocks: variant ? variant.blocks.map((b) => ({ id: b.id, region: b.region || 'main', regionFlutter: REGION_FLUTTER[b.region || 'main'] || null, component: b.component,
      props: b.props || {}, bind: b.bind || {}, hideOn: b.hideOn || [], span: b.span ?? null })) : [],
    components: comps,
    data: Object.fromEntries(Object.keys(demo).sort().map((k) => [k, shape(demo[k])])),
    tokens: { version: TOKENS_VERSION },
    decisions: (state.decisions || []).filter((d) => d.featureId === f.id && d.status !== 'superseded')
      .map((d) => ({ id: d.id, title: d.title, status: d.status, decision: d.decision || null, rationale: d.rationale || null, tradeoffs: d.tradeoffs || null })),
  };
  // Hash nur über umsetzungsrelevante Teile (ohne Entscheidungstexte, Status, QA)
  const { decisions, feature, source, ...core } = spec;
  spec.specHash = hash64(canonical({ ...core, feature: { id: feature.id, tier: feature.tier } }));
  const qa = state.qa?.latest?.[f.id];
  spec.quality = { qa: qa ? { status: qa.status, checks: qa.results?.length || 0 } : null, realDevice: f.realDevice ? { ok: !!f.realDevice.ok, note: f.realDevice.note || '' } : null };
  return spec;
}

/** Navigationswege der App: Modul-Startseiten und alle interaction.to (inkl. variant.nav der aufgelösten Variante). */
export function routeTable(state, { versionId = 'mix' } = {}) {
  const ids = new Set(state.features.map((f) => f.id));
  const modules = state.modules.filter((m) => !m.archived).map((m) => ({ module: m.id, name: m.name, home: moduleHome(state, m.id) }));
  const edges = [];
  for (const f of state.features.filter((x) => !x.archived)) {
    const v = resolveVariant(state, f, versionId).variant;
    for (const n of navigationRules({ interactions: [...(f.interactions || []), ...(v?.nav || [])] })) {
      const valid = n.to.startsWith('module:') ? state.modules.some((m) => `module:${m.id}` === n.to) : ids.has(n.to);
      edges.push({ from: f.id, event: n.event, to: n.to, label: n.label || null, valid });
    }
  }
  edges.sort((a, b) => (a.from + a.event + a.to).localeCompare(b.from + b.event + b.to));
  const seen = new Set();
  return { format: 'takt-routes/1', version: versionId, modules, edges: edges.filter((e) => { const k = `${e.from}|${e.event}|${e.to}`; if (seen.has(k)) return false; seen.add(k); return true; }) };
}

/** Exportbündel: Spezifikationen (gefiltert) + Routen + deterministisches Manifest. */
export function specBundle(state, { getComponent = null, versionId = 'auto', featureIds = null, releasedOnly = false } = {}) {
  let fs = state.features.filter((f) => !f.archived && f.variants?.length);
  if (featureIds) fs = fs.filter((f) => featureIds.includes(f.id));
  if (releasedOnly) fs = fs.filter((f) => f.locked && f.releasedVersionId);
  const specs = fs.map((f) => featureSpecJson(state, f.id, { getComponent, versionId })).sort((a, b) => a.feature.id.localeCompare(b.feature.id));
  const routes = routeTable(state, { versionId: versionId === 'auto' ? 'mix' : versionId });
  const manifest = {
    format: 'takt-spec-bundle/1', version: versionId, tokens: TOKENS_VERSION,
    features: specs.map((s) => ({ id: s.feature.id, module: s.module.id, variant: s.variant?.id || null, direction: s.variant?.direction || null, source: s.source.resolvedBy, specHash: s.specHash, file: `features/${s.feature.id}.json` })),
    routesHash: hash64(canonical(routes)),
  };
  manifest.bundleHash = hash64(canonical(manifest.features.map((x) => x.specHash).concat(manifest.routesHash)));
  return { manifest, specs, routes };
}
