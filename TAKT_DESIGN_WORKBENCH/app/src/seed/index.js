// ============================================================================
// SEED – Startinhalt der Workbench (Module, Features, Varianten, Demo-Daten).
// * Jede Datei in seed/modules/ beschreibt EIN Modul (Manifest, siehe SEED_FORMAT.md).
// * buildSeedState() erzeugt daraus einen vollstaendigen Workbench-Zustand.
// * mergeSeed() übernimmt später neue Module/Features aus dem Seed in einen
//   bestehenden Zustand, OHNE vorhandene Daten zu verändern.
// Reines JS – auch von Node (CLI-QA) importierbar.
// ============================================================================
import { emptyState, createModule, createFeature, createDecision, migrate } from '../core/schema.js';
import { makeVersion, bumpMinor, bumpMajor } from '../core/versioning.js';
import { nowIso, uid } from '../lib/util.js';
import { PATTERN_QUESTIONS, APP_QUESTIONS } from './catalog.js';
import { seedHash } from '../core/seedpatch.js';

import home from './modules/home.js';
import calendar from './modules/calendar.js';
import tasks from './modules/tasks.js';
import notes from './modules/notes.js';
import weather from './modules/weather.js';
import knowledge from './modules/knowledge.js';
import sales from './modules/sales.js';
import pictureToText from './modules/picture-to-text.js';
import trading from './modules/trading.js';
import fitness from './modules/fitness.js';
import finance from './modules/finance.js';
import settings from './modules/settings.js';
import savings from './modules/savings.js';
import nutrition from './modules/nutrition.js';
import habits from './modules/habits.js';
import goals from './modules/goals.js';
import shopping from './modules/shopping.js';
import documents from './modules/documents.js';
import system from './modules/system.js';

export const SEED_VERSION = '2026-11-24.6';
export const MANIFESTS = [home, calendar, tasks, habits, goals, shopping, finance, savings, trading, fitness, nutrition, notes, knowledge, pictureToText, documents, weather, sales, system, settings];

function buildModule(manifest, order) {
  const m = createModule({ ...manifest.module, order });
  const features = (manifest.features || []).map((f, i) => {
    const { seedHistory, ...rest } = f;
    return { feature: createFeature({ ...rest, moduleId: m.id, id: f.id || undefined, order: i }), seedHistory };
  });
  return { module: m, features, decisions: manifest.decisions || [] };
}

/** Spielt eine vordefinierte Historie ab (Entwurf -> Prüfung -> Freigabe) für Demo-Zwecke. */
function applySeedHistory(state, feature, seedHistory) {
  for (const step of seedHistory || []) {
    if (step.kind === 'release') {
      feature.version = bumpMajor(feature.version);
      const v = makeVersion(feature, { kind: 'release', note: step.note || 'Freigabe', qa: null });
      state.versions.push(v);
      feature.status = 'released'; feature.locked = true; feature.releasedVersionId = v.id;
    } else {
      state.versions.push(makeVersion(feature, { kind: step.kind || 'draft', note: step.note || '' }));
      feature.version = bumpMinor(feature.version);
      if (step.kind === 'review') feature.status = 'review';
    }
    if (step.status) feature.status = step.status;
  }
}

export function buildSeedState() {
  const state = emptyState();
  state.meta.seedVersion = SEED_VERSION;
  MANIFESTS.forEach((man, i) => {
    const { module, features, decisions } = buildModule(man, i);
    state.modules.push(module);
    for (const { feature, seedHistory } of features) {
      state.features.push(feature);
      applySeedHistory(state, feature, seedHistory);
    }
    for (const d of decisions) state.decisions.push(createDecision({ moduleId: module.id, ...d }));
  });
  for (const pq of [...APP_QUESTIONS, ...PATTERN_QUESTIONS]) state.decisions.push(createDecision(pq));
  state.history.push({ id: uid('h'), ts: nowIso(), type: 'seed', entity: 'workbench', entityId: null, summary: `Workbench aus Seed ${SEED_VERSION} angelegt (${state.modules.length} Module, ${state.features.length} Features)` });
  state.settings.lastFeatureId = state.features.find((f) => f.variants.length > 1)?.id || state.features[0]?.id || null;
  const out = migrate(state);
  for (const f of out.features) f.seedHash = seedHash(f); // Abdruck für den Seed-Patch (unverändert = sicher aktualisierbar)
  return out;
}

/** Neue Module/Features aus dem Seed übernehmen (nach ID). Bestehendes bleibt unangetastet. */
export function mergeSeed(state) {
  const seed = buildSeedState();
  const added = { modules: [], features: [], decisions: 0 };
  for (const m of seed.modules) if (!state.modules.some((x) => x.id === m.id)) { state.modules.push({ ...m, order: state.modules.length }); added.modules.push(m.name); }
  for (const f of seed.features) if (!state.features.some((x) => x.id === f.id)) {
    state.features.push(f); added.features.push(`${f.moduleId} › ${f.name}`);
    for (const v of seed.versions.filter((v) => v.featureId === f.id)) state.versions.push(v);
  }
  // Entscheidungen neuer Module/Features übernehmen (Abgleich über Titel + Bezug)
  const newIds = new Set([...seed.modules.filter((m) => added.modules.includes(m.name)).map((m) => m.id)]);
  const newFeat = new Set(seed.features.filter((f) => added.features.includes(`${f.moduleId} › ${f.name}`)).map((f) => f.id));
  for (const d of seed.decisions) {
    if ((d.featureId && newFeat.has(d.featureId)) || (!d.featureId && newIds.has(d.moduleId))) {
      if (!state.decisions.some((x) => x.title === d.title && x.featureId === d.featureId)) { state.decisions.push(d); added.decisions++; }
    }
  }
  for (const pq of [...APP_QUESTIONS, ...PATTERN_QUESTIONS]) if (!state.decisions.some((x) => x.id === pq.id)) { state.decisions.push(createDecision(pq)); added.decisions++; }
  state.meta.seedVersion = SEED_VERSION;
  return added;
}
