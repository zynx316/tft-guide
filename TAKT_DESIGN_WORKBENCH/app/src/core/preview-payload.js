// Baut das Payload für die Preview-Runtime (Workbench, Vergleich, QA, Direktlinks).
import { getComponent } from '../library/registry.js';
import { migrate } from './schema.js';

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
