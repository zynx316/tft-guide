// Baut das Payload für die Preview-Runtime (Workbench, Vergleich, QA, Direktlinks).
import { getComponent } from '../library/registry.js';
import { migrate } from './schema.js';
import { resolveVariant, moduleHome, navigationRules, versionById, areaOf, shellOf } from './directions.js';
import { isWorldRef, worldKey } from '../seed/world/index.js';
import { getWorld } from './world.js';

/** Nur die Welt-Schlüssel, die die Demo-Daten referenzieren (im gewählten Szenario). */
export function worldFor(state, demoData, scenario = 'alltag') {
  const world = getWorld(state, scenario); const out = {};
  for (const v of Object.values(demoData || {})) if (isWorldRef(v)) { const k = worldKey(v); if (k in world) out[k] = world[k]; }
  return out;
}
/** Umgebung der Vorschau: offline, veraltet, Schriftskalierung (1 | 1.3 | 2). */
const envOf = (opts) => ({ offline: !!opts.env?.offline, stale: !!opts.env?.stale, scale: Number(opts.env?.scale) || 1 });

export const STORAGE_KEY = 'takt-workbench-state-v1';
export const DEFAULT_TODAY = '2026-11-24T09:30:00';

export function buildFeaturePayload(state, featureId, variantId, opts = {}) {
  const feature = state.features.find((f) => f.id === featureId);
  if (!feature) throw new Error(`Feature „${featureId}“ nicht gefunden`);
  const variant = feature.variants.find((v) => v.id === (variantId || feature.selectedVariantId)) || feature.variants[0] || null;
  const module = state.modules.find((m) => m.id === feature.moduleId);
  return {
    mode: 'feature',
    theme: opts.theme || state.settings?.previewTheme || 'graphite',
    state: opts.state || 'default',
    chrome: opts.chrome ?? true,
    today: opts.today || DEFAULT_TODAY,
    module: module ? { id: module.id, name: module.name, icon: module.icon } : null,
    modules: state.modules.filter((m) => !m.archived).sort((a, b) => a.order - b.order).map((m) => ({ id: m.id, name: m.name, icon: m.icon })),
    feature: { id: feature.id, name: feature.name },
    variant: variant ? { id: variant.id, name: variant.name, layout: variant.layout, blocks: variant.blocks } : null,
    demoData: feature.demoData || {},
    scenario: opts.scenario || 'alltag', env: envOf(opts), privacy: !!opts.privacy,
    world: worldFor(state, feature.demoData, opts.scenario),
  };
}

export function buildComponentPayload(componentId, opts = {}) {
  const def = getComponent(componentId);
  if (!def) throw new Error(`Komponente „${componentId}“ nicht registriert`);
  return {
    mode: 'component', theme: opts.theme || 'graphite', state: opts.state || 'default', today: opts.today || DEFAULT_TODAY,
    component: { id: def.id, props: { ...(def.example?.props || {}), ...(opts.props || {}) }, data: opts.data || def.example?.data || {} },
  };
}

/** Zustand ohne Workbench laden: Server-Datei -> Browser-Speicher -> Seed. */
export async function loadStateStandalone() {
  try {
    const r = await fetch('/api/state', { cache: 'no-store' });
    if (r.ok) return migrate(await r.json());
  } catch { /* kein Server */ }
  try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) return migrate(JSON.parse(raw)); } catch { /* noop */ }
  const { buildSeedState } = await import('../seed/index.js');
  return buildSeedState();
}

/**
 * App-Payload (Demo-Launcher): ganze App in einer Version.
 * versionId: 'arbeitsstand' | 'freigabe' | 'dir:<richtung>'
 */
export function buildAppPayload(state, versionId = 'arbeitsstand', opts = {}) {
  const version = versionById(state, versionId);
  const modules = state.modules.filter((m) => !m.archived).sort((a, b) => a.order - b.order);
  const features = {};
  let own = 0, total = 0;
  for (const f of state.features) {
    if (f.archived || !modules.some((m) => m.id === f.moduleId)) continue;
    const r = resolveVariant(state, f, version.id);
    if (r.variant) { total++; if (r.source !== 'fallback') own++; }
    features[f.id] = {
      id: f.id, moduleId: f.moduleId, name: f.name, group: f.group, order: f.order,
      variant: r.variant ? { id: r.variant.id, name: r.variant.name, layout: r.variant.layout, blocks: r.variant.blocks, direction: r.variant.direction } : null,
      source: r.source, demoData: r.demoData || {}, nav: navigationRules(f),
      purpose: r.variant ? undefined : f.purpose, requirements: r.variant ? undefined : f.requirements.slice(0, 8).map((x) => ({ text: x.text, type: x.type, priority: x.priority })),
    };
  }
  const ordered = Object.values(features).sort((a, b) => (modules.findIndex((m) => m.id === a.moduleId) - modules.findIndex((m) => m.id === b.moduleId)) || a.order - b.order);
  const sortedFeatures = Object.fromEntries(ordered.map((f) => [f.id, f]));
  const startId = state.app?.startFeatureId && features[state.app.startFeatureId]?.variant ? state.app.startFeatureId : moduleHome(state, modules[0]?.id);
  return {
    mode: 'app', versionId: version.id, versionName: version.name,
    theme: opts.theme || version.theme || state.settings?.previewTheme || 'graphite',
    state: opts.state || 'default', chrome: opts.chrome ?? true, today: opts.today || DEFAULT_TODAY,
    modules: modules.map((m) => ({ id: m.id, name: m.name, icon: m.icon, home: moduleHome(state, m.id), area: areaOf(m) })),
    favorites: (state.app?.favorites || []).filter((id) => modules.some((m) => m.id === id)),
    features: sortedFeatures, startFeatureId: startId, route: opts.route || (version.kind === 'pin' ? version.featureId : null),
    coverage: { own, total }, revision: opts.revision || state.meta?.rev || 0,
    scenario: opts.scenario || 'alltag', env: envOf(opts), shell: opts.shell || shellOf(state, version),
    world: getWorld(state, opts.scenario || 'alltag'), privacy: !!opts.privacy,
  };
}
