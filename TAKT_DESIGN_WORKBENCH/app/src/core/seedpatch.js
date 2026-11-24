// ============================================================================
// SEED-PATCH – neue Seed-Stände sicher übernehmen (Bauplan 5.10).
// * Neue Module/Features → hinzufügen.
// * Vom Nutzer unveränderte, nicht freigegebene Features → aktualisieren (vorher Arbeitsversion sichern).
// * Vom Nutzer geänderte Features → nur auf ausdrücklichen Wunsch (vorher Arbeitsversion sichern).
// * Freigegebene (gesperrte) Features → nie ändern; stattdessen offene Entscheidung „Seed-Vorschlag“.
// „Unverändert“ erkennt der Patch am seedHash (Inhaltsabdruck beim letzten Einspielen) bzw. – bei älteren
// Ständen ohne Abdruck – daran, dass es keine eigenen Verlaufseinträge zum Feature gibt.
// Rein (kein DOM), auch in Node nutzbar.
// ============================================================================
import { createDecision } from './schema.js';
import { makeVersion } from './versioning.js';

/** Felder, die der Seed liefert und der Patch ersetzt. Status, Version, Sperre, Notizen, Verknüpfungen des Nutzers bleiben. */
export const SEED_FIELDS = ['purpose', 'requirements', 'interactions', 'states', 'viewports', 'variants', 'demoData', 'acceptance', 'flows', 'tier', 'group', 'order'];
const VOLATILE = new Set(['createdAt', 'updatedAt']);

function normalize(v, parentKey = '') {
  if (Array.isArray(v)) return v.map((x) => normalize(x, parentKey));
  if (v && typeof v === 'object') {
    const out = {};
    for (const k of Object.keys(v).sort()) {
      if (VOLATILE.has(k)) continue;
      if (k === 'id' && ['requirements', 'interactions', 'acceptance', 'flows'].includes(parentKey)) continue; // generierte IDs
      out[k] = normalize(v[k], k);
    }
    return out;
  }
  return v;
}

/** Stabiler Inhaltsabdruck (FNV-1a 32 bit) der Seed-Felder eines Features. */
export function seedHash(feature) {
  const s = JSON.stringify(normalize(Object.fromEntries(SEED_FIELDS.map((k) => [k, feature[k] ?? null]))));
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, '0');
}

/** Hat der Nutzer das Feature seit dem letzten Einspielen verändert? */
export function userChanged(state, f) {
  if (f.seedHash) return seedHash(f) !== f.seedHash;
  return (state.history || []).some((h) => h.featureId === f.id && h.type && !/^seed|^data\./.test(h.type));
}

/**
 * Abgleich Live-Stand ↔ Seed.
 * @returns {{neueModule:object[], neu:object[], aktualisierbar:object[], geaendert:object[], gesperrt:object[], gleich:number}}
 */
export function diffSeed(state, seed) {
  const out = { neueModule: [], neu: [], aktualisierbar: [], geaendert: [], gesperrt: [], gleich: 0 };
  for (const m of seed.modules) if (!state.modules.some((x) => x.id === m.id)) out.neueModule.push({ id: m.id, name: m.name });
  for (const sf of seed.features) {
    const live = state.features.find((x) => x.id === sf.id);
    const label = `${seed.modules.find((m) => m.id === sf.moduleId)?.name || sf.moduleId} › ${sf.name}`;
    if (!live) { out.neu.push({ id: sf.id, label }); continue; }
    const target = seedHash(sf);
    if (seedHash(live) === target) { out.gleich++; continue; }
    if (live.seedHash === target) { out.gleich++; continue; } // Seed unverändert seit Einspielen, Nutzer hat bewusst geändert
    const info = { id: sf.id, label, variants: `${live.variants.length} → ${sf.variants.length}` };
    if (live.locked) out.gesperrt.push(info);
    else if (userChanged(state, live)) out.geaendert.push(info);
    else out.aktualisierbar.push(info);
  }
  return out;
}

/**
 * Patch anwenden (mutiert state). ids: Feature-IDs, die aktualisiert werden sollen (aktualisierbar/geändert);
 * neue Module/Features werden immer ergänzt, gesperrte bekommen eine Vorschlags-Entscheidung.
 */
export function applySeedPatch(state, seed, { ids = [], seedVersion = '' } = {}) {
  const d = diffSeed(state, seed);
  const res = { modules: 0, features: 0, updated: 0, proposals: 0, backups: 0 };
  for (const m of seed.modules) if (!state.modules.some((x) => x.id === m.id)) { state.modules.push({ ...m, order: state.modules.length }); res.modules++; }
  // Modul-Metadaten nur ergänzen, nie überschreiben
  for (const m of state.modules) { const sm = seed.modules.find((x) => x.id === m.id); if (!sm) continue; for (const k of ['area', 'homeFeatureId', 'stage', 'source']) if (m[k] == null && sm[k] != null) m[k] = sm[k]; }
  for (const n of d.neu) {
    const sf = seed.features.find((x) => x.id === n.id);
    state.features.push({ ...sf, seedHash: seedHash(sf) }); res.features++;
    for (const v of seed.versions.filter((x) => x.featureId === sf.id)) state.versions.push(v);
    for (const dec of seed.decisions.filter((x) => x.featureId === sf.id)) if (!state.decisions.some((y) => y.title === dec.title && y.featureId === dec.featureId)) state.decisions.push(dec);
  }
  for (const id of ids) {
    const live = state.features.find((x) => x.id === id); const sf = seed.features.find((x) => x.id === id);
    if (!live || !sf || live.locked) continue;
    state.versions.push(makeVersion(live, { kind: 'draft', note: `Sicherung vor Seed-Patch ${seedVersion}` })); res.backups++;
    for (const k of SEED_FIELDS) if (sf[k] !== undefined) live[k] = JSON.parse(JSON.stringify(sf[k]));
    if (!live.variants.some((v) => v.id === live.selectedVariantId)) live.selectedVariantId = sf.selectedVariantId || live.variants[0]?.id || null;
    live.seedHash = seedHash(live); live.updatedAt = new Date().toISOString(); res.updated++;
  }
  for (const g of d.gesperrt) {
    const title = `Seed-Vorschlag für „${g.label}“ (${seedVersion})`;
    if (state.decisions.some((x) => x.title === title)) continue;
    const live = state.features.find((x) => x.id === g.id);
    state.decisions.unshift(createDecision({ featureId: g.id, moduleId: live?.moduleId, level: 'feature', kind: 'seed-proposal', status: 'open', reversibility: 'leicht',
      title, question: 'Der Seed enthält einen neueren Entwurf für dieses freigegebene Feature. Übernehmen (über „Neue Arbeitsversion“) oder verwerfen?',
      options: [{ id: 'einspielen', label: 'Neue Arbeitsversion anlegen und Seed-Stand einspielen' }, { id: 'verwerfen', label: 'Freigegebenen Stand behalten' }],
      consequences: `Varianten: ${g.variants}. Freigabe-Snapshots bleiben unverändert.` }));
    res.proposals++;
  }
  return res;
}
