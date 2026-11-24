// ============================================================================
// ABHÄNGIGKEITS-/AUSWIRKUNGSANALYSE (Grundlage für selektive Tests)
// Welche Features/Varianten nutzen Komponente X? Welche sind freigegeben und
// müssen nach einer Änderung an X in die Regression?
// ============================================================================
export function componentUsage(state) {
  const usage = new Map(); // componentId -> [{featureId, featureName, moduleId, variantId, variantName, selected, released}]
  for (const f of state.features) {
    if (f.archived) continue;
    for (const v of f.variants) {
      for (const b of v.blocks) {
        if (!usage.has(b.component)) usage.set(b.component, []);
        const list = usage.get(b.component);
        if (!list.some((u) => u.featureId === f.id && u.variantId === v.id)) {
          list.push({ featureId: f.id, featureName: f.name, moduleId: f.moduleId, variantId: v.id, variantName: v.name, selected: f.selectedVariantId === v.id, released: !!f.locked });
        }
      }
    }
  }
  return usage;
}

/** Features, die bei Änderung der gegebenen Komponenten (erneut) geprüft werden müssen. */
export function affectedFeatures(state, componentIds) {
  const usage = componentUsage(state);
  const out = new Map();
  for (const id of componentIds) for (const u of usage.get(id) || []) {
    if (!out.has(u.featureId)) out.set(u.featureId, { featureId: u.featureId, featureName: u.featureName, moduleId: u.moduleId, variants: new Set(), released: u.released, via: new Set() });
    const e = out.get(u.featureId); e.variants.add(u.variantId); e.via.add(id);
  }
  return [...out.values()].map((e) => ({ ...e, variants: [...e.variants], via: [...e.via] }));
}
