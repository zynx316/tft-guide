// ============================================================================
// WORKBENCH-STORE – einziger Ort, an dem der Zustand verändert wird.
// * Persistenz: Server-Datei (data/workbench.json) + Browser-Speicher (Fallback/Cache)
// * Undo/Redo (Strg+Z / Strg+Umschalt+Z), Änderungsprotokoll (history)
// * Sperrlogik: freigegebene Features sind schreibgeschützt -> neue Arbeitsversion
// Alle UI-Teile rufen ausschließlich die exportierten `actions` auf.
// ============================================================================
import { clone, nowIso, uid, slug, debounce } from '../lib/util.js';
import { migrate, createModule, createFeature, createVariant, createDecision, inspectImport, statusInfo, defaultSettings } from '../core/schema.js';
import { makeVersion, bumpMinor, bumpMajor, snapshotOf, releaseChecklist } from '../core/versioning.js';
import { STORAGE_KEY } from '../core/preview-payload.js';
import { buildSeedState, mergeSeed } from '../seed/index.js';
import { getComponent, defaultProps } from '../library/registry.js';

let state = null;
const listeners = new Set();
const undoStack = [], redoStack = [];
let lastCoalesce = { key: null, ts: 0 };
let serverRev = null; // zuletzt bekannte Revision der Server-Datei (Konflikterkennung)
export const CONFLICT_KEY = 'takt-workbench-conflict-copy';
export const persistence = { mode: 'browser', status: 'idle', lastSaved: null, error: null, server: false, conflictCopy: null };

export class LockedError extends Error {
  constructor(feature) { super(`„${feature.name}“ ist freigegeben (v${feature.version}) und gesperrt. Lege eine neue Arbeitsversion an, um es zu ändern.`); this.featureId = feature.id; }
}

const notify = () => listeners.forEach((l) => l(state));
export const getState = () => state;
export const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

// ------------------------------------------------------------ Persistenz ---
async function fetchJson(url, opts = {}, timeout = 2500) {
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), timeout);
  try { return await fetch(url, { ...opts, signal: ctrl.signal, cache: 'no-store' }); } finally { clearTimeout(t); }
}

export async function initStore() {
  let serverState = null, localState = null;
  try {
    const r = await fetchJson('/api/state');
    persistence.server = r.ok || r.status === 404;
    if (r.ok) serverState = await r.json();
  } catch { persistence.server = false; }
  try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) localState = JSON.parse(raw); } catch { /* noop */ }
  // Server-Datei ist maßgeblich. Ein neuerer Browser-Stand (z. B. offline bearbeitet) wird NICHT
  // stillschweigend übernommen, sondern als Konflikt-Kopie abgelegt (Daten & Backup › wiederherstellen).
  let chosen = serverState || localState;
  if (serverState && localState && new Date(localState.meta?.updatedAt) > new Date(serverState.meta?.updatedAt) && (localState.meta?.rev || 0) !== (serverState.meta?.rev || 0)) {
    try { localStorage.setItem(CONFLICT_KEY, JSON.stringify(localState)); persistence.conflictCopy = localState.meta.updatedAt; } catch { /* noop */ }
  }
  state = chosen ? migrate(chosen) : buildSeedState();
  state.meta.rev = state.meta.rev || 0;
  // Freigaben ohne Komponentenversionen (z. B. Demo-Freigaben aus dem Seed) einmalig ergänzen → Drift-Erkennung greift
  for (const v of state.versions) if (v.kind === 'release' && !v.componentVersions && v.snapshot) v.componentVersions = componentVersionsOf({ variants: v.snapshot.variants || [] });
  serverRev = serverState ? (serverState.meta?.rev || 0) : null;
  persistence.mode = persistence.server ? 'file' : 'browser';
  if (!serverState) schedulePersist();
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && e.newValue && persistence.status !== 'saving') {
      try { const s = JSON.parse(e.newValue); if (new Date(s.meta.updatedAt) > new Date(state.meta.updatedAt)) { state = migrate(s); notify(); } } catch { /* noop */ }
    }
  });
  window.addEventListener('beforeunload', () => { if (persistence.status === 'dirty') persistNow(true); });
  notify();
  return state;
}

async function persistNow(keepalive = false) {
  const json = JSON.stringify(state);
  try { localStorage.setItem(STORAGE_KEY, json); } catch (e) { persistence.error = 'Browser-Speicher voll: ' + e.message; }
  if (!persistence.server) { persistence.status = 'saved'; persistence.lastSaved = nowIso(); notify(); return; }
  persistence.status = 'saving'; notify();
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (serverRev != null) headers['X-Base-Rev'] = String(serverRev);
    const sentRev = state.meta.rev;
    const r = await fetch('/api/state', { method: 'PUT', headers, body: json, keepalive });
    if (r.status === 409) {
      persistence.status = 'conflict'; persistence.mode = 'browser';
      persistence.error = 'Konflikt: Ein anderer Tab oder Prozess hat die Datei zwischenzeitlich gespeichert. Dein Stand liegt im Browser-Speicher. Seite neu laden, um den Datei-Stand zu sehen (dein Stand bleibt als Konflikt-Kopie unter „Daten & Backup“).';
      try { localStorage.setItem(CONFLICT_KEY, json); persistence.conflictCopy = state.meta.updatedAt; } catch { /* noop */ }
      notify(); return;
    }
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    serverRev = sentRev;
    persistence.status = persistence.status === 'dirty' ? 'dirty' : 'saved'; persistence.lastSaved = nowIso(); persistence.error = null; persistence.mode = 'file';
  } catch (e) {
    persistence.status = 'error'; persistence.error = `Datei-Speichern fehlgeschlagen (${e.message}) – Stand liegt im Browser-Speicher.`; persistence.mode = 'browser';
  }
  notify();
}
const debouncedPersist = debounce(() => persistNow(), 400);
function schedulePersist() { if (persistence.status === 'conflict') return; persistence.status = 'dirty'; debouncedPersist(); }

// ------------------------------------------------------------- Mutation ---
/**
 * mutate(summary, recipe, meta)
 *  recipe(draft) verändert eine Kopie; meta: { entity, entityId, featureId, moduleId, type, coalesce, history:false, undo:false }
 */
export function mutate(summary, recipe, meta = {}) {
  const prev = state;
  const draft = clone(state);
  const result = recipe(draft);
  draft.meta.updatedAt = nowIso();
  draft.meta.rev = (state.meta.rev || 0) + 1;
  const coalesce = meta.coalesce && lastCoalesce.key === meta.coalesce && Date.now() - lastCoalesce.ts < 2500;
  if (meta.undo !== false && !coalesce) { undoStack.push(prev); if (undoStack.length > 60) undoStack.shift(); redoStack.length = 0; }
  if (summary && meta.history !== false) {
    const entry = { id: uid('h'), ts: draft.meta.updatedAt, type: meta.type || 'update', entity: meta.entity || null, entityId: meta.entityId || null, featureId: meta.featureId || null, moduleId: meta.moduleId || null, summary };
    if (coalesce && draft.history[0]?.summary === summary) draft.history[0] = entry; else draft.history.unshift(entry);
    if (draft.history.length > 3000) draft.history.length = 3000;
  }
  lastCoalesce = { key: meta.coalesce || null, ts: Date.now() };
  state = draft;
  schedulePersist();
  notify();
  return result;
}
export const canUndo = () => undoStack.length > 0;
export const canRedo = () => redoStack.length > 0;
// Undo/Redo betreffen nur Inhalte – Einstellungen (Viewport, Theme …) und QA-Ergebnisse bleiben erhalten.
const restoreFrom = (snap) => ({ ...snap, settings: state.settings, qa: state.qa, meta: { ...snap.meta, updatedAt: nowIso(), rev: (state.meta.rev || 0) + 1 } });
export function undo() { if (!undoStack.length) return; redoStack.push(state); state = restoreFrom(undoStack.pop()); schedulePersist(); notify(); }
export function redo() { if (!redoStack.length) return; undoStack.push(state); state = restoreFrom(redoStack.pop()); schedulePersist(); notify(); }

// -------------------------------------------------------------- Helfer ---
const F = (s, id) => { const f = s.features.find((x) => x.id === id); if (!f) throw new Error(`Feature ${id} nicht gefunden`); return f; };
const M = (s, id) => { const m = s.modules.find((x) => x.id === id); if (!m) throw new Error(`Modul ${id} nicht gefunden`); return m; };
const V = (f, id) => { const v = f.variants.find((x) => x.id === id); if (!v) throw new Error(`Variante ${id} nicht gefunden`); return v; };
const editable = (f) => { if (f.locked) throw new LockedError(f); f.updatedAt = nowIso(); if (f.status === 'not_analyzed' || f.status === 'analyzed') { /* bleibt */ } return f; };
const uniqueId = (base, exists) => { let id = base, i = 2; while (exists(id)) id = `${base}-${i++}`; return id; };
const touchVariant = (v) => { v.updatedAt = nowIso(); };
const nextVariantId = (f) => { const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; for (const l of letters) if (!f.variants.some((v) => v.id === l)) return l; return uid('v'); };

// Organisatorische Felder (nicht Teil des Freigabe-Snapshots) dürfen auch bei gesperrten Features geändert werden.
const META_FEATURE_KEYS = ['group', 'order', 'realDevice', 'links', 'notes'];
// Diese Felder ändern nur eigene Aktionen (Status-/Versions-/Sperrlogik bleibt konsistent).
const PROTECTED_FEATURE_KEYS = ['id', 'moduleId', 'status', 'locked', 'version', 'releasedVersionId', 'archived', 'createdAt'];
const STABLE = ['released', 'implemented', 'regression_ok'];

export const featureMeta = (f) => ({ entity: 'feature', entityId: f.id, featureId: f.id, moduleId: f.moduleId });

// ------------------------------------------------------------- Actions ---
export const actions = {
  // ---- Einstellungen (ohne Historie/Undo) ----
  setSetting(key, value) { mutate(null, (s) => { s.settings[key] = value; }, { history: false, undo: false }); },
  setSettings(patch) { mutate(null, (s) => { Object.assign(s.settings, patch); }, { history: false, undo: false }); },

  // ---- Module ----
  addModule(data) {
    return mutate(`Modul „${data.name}“ angelegt`, (s) => {
      const id = uniqueId(slug(data.id || data.name), (x) => s.modules.some((m) => m.id === x));
      const m = createModule({ ...data, id, order: s.modules.length });
      s.modules.push(m); return m.id;
    }, { entity: 'module', type: 'module.add' });
  },
  updateModule(id, patch, label) {
    mutate(label || `Modul „${patch.name || id}“ bearbeitet`, (s) => { Object.assign(M(s, id), patch, { updatedAt: nowIso() }); }, { entity: 'module', entityId: id, moduleId: id, coalesce: `mod:${id}:${Object.keys(patch).join()}` });
  },
  archiveModule(id, archived = true) {
    mutate(`Modul „${id}“ ${archived ? 'archiviert' : 'wiederhergestellt'}`, (s) => { M(s, id).archived = archived; }, { entity: 'module', entityId: id, moduleId: id, type: 'module.archive' });
  },
  deleteModule(id) {
    mutate(`Modul „${id}“ gelöscht`, (s) => {
      if (s.features.some((f) => f.moduleId === id)) throw new Error('Modul enthält noch Features – zuerst verschieben, archivieren oder löschen.');
      s.modules = s.modules.filter((m) => m.id !== id);
    }, { entity: 'module', entityId: id, type: 'module.delete' });
  },
  reorderModules(ids) {
    mutate('Modulreihenfolge geändert', (s) => { ids.forEach((id, i) => { const m = s.modules.find((x) => x.id === id); if (m) m.order = i; }); }, { entity: 'module', type: 'module.reorder' });
  },

  // ---- Features ----
  addFeature(moduleId, data) {
    return mutate(`Feature „${data.name}“ angelegt`, (s) => {
      const id = uniqueId(`${moduleId}.${slug(data.name)}`, (x) => s.features.some((f) => f.id === x));
      const order = s.features.filter((f) => f.moduleId === moduleId).length;
      const f = createFeature({ ...data, id, moduleId, order });
      s.features.push(f); return f.id;
    }, { entity: 'feature', moduleId, type: 'feature.add' });
  },
  updateFeature(id, patch, label, opts = {}) {
    mutate(label || 'Feature bearbeitet', (s) => {
      const f = F(s, id);
      for (const k of PROTECTED_FEATURE_KEYS) if (k in patch) throw new Error(`„${k}“ ist nur über die dafür vorgesehene Aktion änderbar.`);
      const metaOnly = Object.keys(patch).every((k) => META_FEATURE_KEYS.includes(k));
      if (!metaOnly) editable(f); else f.updatedAt = nowIso();
      Object.assign(f, patch);
    }, { ...featureMeta({ id, moduleId: null }), coalesce: opts.coalesce, type: opts.type || 'feature.update' });
  },
  setFeatureStatus(id, status) {
    mutate(`Status → ${statusInfo(status).label}`, (s) => {
      const f = F(s, id);
      if (f.locked && !STABLE.includes(status)) throw new LockedError(f);
      if (!f.locked && status === 'released') throw new Error('„Freigegeben“ wird nur über die Aktion „Freigeben“ gesetzt (Snapshot, Sperre, QA-Nachweis).');
      if (!f.locked && STABLE.includes(status)) throw new Error(`„${statusInfo(status).label}“ setzt eine Freigabe voraus.`);
      f.status = status; f.updatedAt = nowIso();
    }, { entity: 'feature', entityId: id, featureId: id, type: 'feature.status' });
  },
  duplicateFeature(id) {
    return mutate('Feature dupliziert', (s) => {
      const src = F(s, id);
      const copy = clone(src);
      copy.id = uniqueId(`${src.id}-kopie`, (x) => s.features.some((f) => f.id === x));
      Object.assign(copy, { name: `${src.name} (Kopie)`, status: STABLE.includes(src.status) || src.status === 'review' ? 'design' : src.status, locked: false, releasedVersionId: null, version: '0.1', createdAt: nowIso(), updatedAt: nowIso(), order: src.order + 0.5 });
      s.features.push(copy); return copy.id;
    }, { entity: 'feature', entityId: id, featureId: id, type: 'feature.duplicate' });
  },
  moveFeature(id, moduleId) {
    mutate(`Feature verschoben nach „${moduleId}“`, (s) => {
      const f = F(s, id); f.moduleId = moduleId; f.order = s.features.filter((x) => x.moduleId === moduleId).length; f.updatedAt = nowIso();
    }, { entity: 'feature', entityId: id, featureId: id, moduleId, type: 'feature.move' });
  },
  archiveFeature(id, archived = true) {
    mutate(`Feature ${archived ? 'archiviert' : 'wiederhergestellt'}`, (s) => { F(s, id).archived = archived; }, { entity: 'feature', entityId: id, featureId: id, type: 'feature.archive' });
  },
  deleteFeature(id, { force = false } = {}) {
    mutate(`Feature „${id}“ gelöscht`, (s) => {
      const f = F(s, id);
      if (f.locked && !force) throw new Error(`„${f.name}“ ist freigegeben. Löschen nur mit ausdrücklicher Bestätigung.`);
      s.features = s.features.filter((x) => x.id !== id);
      for (const x of s.features) x.links = (x.links || []).filter((l) => l !== id);
      delete s.qa.latest[id]; // Versionen & Entscheidungen bleiben als Historie erhalten
    }, { entity: 'feature', entityId: id, type: 'feature.delete' });
  },
  reorderFeatures(ids) {
    mutate('Feature-Reihenfolge geändert', (s) => { ids.forEach((id, i) => { const f = s.features.find((x) => x.id === id); if (f) f.order = i; }); }, { entity: 'feature', type: 'feature.reorder' });
  },
  /** Ausgewählte Anforderungen in ein neues Feature auslagern (Feature aufteilen). */
  splitFeature(id, requirementIds, name) {
    return mutate(`Feature aufgeteilt → „${name}“`, (s) => {
      const f = editable(F(s, id));
      const moved = f.requirements.filter((r) => requirementIds.includes(r.id));
      f.requirements = f.requirements.filter((r) => !requirementIds.includes(r.id));
      const nid = uniqueId(`${f.moduleId}.${slug(name)}`, (x) => s.features.some((y) => y.id === x));
      s.features.push(createFeature({ id: nid, moduleId: f.moduleId, name, group: f.group, purpose: `Ausgelagert aus „${f.name}“.`, requirements: moved, status: 'analyzed', links: [f.id], order: f.order + 0.5, demoData: clone(f.demoData) }));
      f.links = [...new Set([...(f.links || []), nid])];
      return nid;
    }, { ...featureMeta({ id }), type: 'feature.split' });
  },
  /** Quelle in Ziel zusammenführen (Anforderungen, Interaktionen, Varianten, Demo-Daten); Quelle wird archiviert. */
  mergeFeatures(targetId, sourceId) {
    mutate('Features zusammengeführt', (s) => {
      const t = editable(F(s, targetId)), src = F(s, sourceId);
      if (src.locked) throw new LockedError(src);
      const pre = (x) => ({ ...x, id: uid('m') });
      t.requirements.push(...src.requirements.map(pre));
      t.interactions.push(...src.interactions.map(pre));
      t.variants.push(...src.variants.map((v) => ({ ...clone(v), id: uniqueId(`${v.id}*`, (x) => t.variants.some((y) => y.id === x)), name: `${v.name} (aus ${src.name})` })));
      t.demoData = { ...src.demoData, ...t.demoData };
      src.archived = true; src.notes = `${src.notes || ''}\nZusammengeführt in ${t.id} am ${new Date().toLocaleDateString('de-DE')}.`.trim();
    }, { ...featureMeta({ id: targetId }), type: 'feature.merge' });
  },

  // ---- Varianten ----
  addVariant(featureId, { from = null, name, layoutType = 'stack' } = {}) {
    return mutate('Variante angelegt', (s) => {
      const f = editable(F(s, featureId));
      const id = nextVariantId(f);
      const base = from ? clone(V(f, from)) : { layout: { type: layoutType }, blocks: [{ id: 'hdr', component: 'page-header', region: 'header', props: { title: f.name, subtitle: '' } }] };
      const v = createVariant({ ...base, id, name: name || (from ? `${base.name} – Abwandlung` : `Variante ${id}`), concept: from ? base.concept : '', origin: from ? `dupliziert aus ${from}` : 'neu', createdAt: nowIso(), updatedAt: nowIso() });
      f.variants.push(v);
      if (!f.selectedVariantId) f.selectedVariantId = v.id;
      if (f.status === 'not_analyzed' || f.status === 'analyzed') f.status = 'design';
      return v.id;
    }, { ...featureMeta({ id: featureId }), type: 'variant.add' });
  },
  updateVariant(featureId, variantId, patch, label) {
    mutate(label || 'Variante bearbeitet', (s) => { const f = editable(F(s, featureId)); const v = V(f, variantId); delete patch.id; delete patch.createdAt; Object.assign(v, patch); touchVariant(v); },
      { ...featureMeta({ id: featureId }), coalesce: `var:${featureId}:${variantId}:${Object.keys(patch).join()}`, type: 'variant.update' });
  },
  deleteVariant(featureId, variantId) {
    mutate(`Variante ${variantId} gelöscht`, (s) => {
      const f = editable(F(s, featureId)); f.variants = f.variants.filter((v) => v.id !== variantId);
      if (f.selectedVariantId === variantId) f.selectedVariantId = f.variants[0]?.id || null;
    }, { ...featureMeta({ id: featureId }), type: 'variant.delete' });
  },
  /** Bevorzugte Variante wählen – optional mit dokumentierter Entscheidung. */
  selectVariant(featureId, variantId, decision) {
    mutate(`Variante ${variantId} als bevorzugt gewählt`, (s) => {
      const f = editable(F(s, featureId)); V(f, variantId); f.selectedVariantId = variantId;
      if (decision) s.decisions.unshift(createDecision({ featureId, moduleId: f.moduleId, status: 'decided', decidedAt: nowIso(), title: decision.title || `Variante ${variantId} für „${f.name}“`, decision: decision.decision || `Variante ${variantId} („${V(f, variantId).name}“) wird weiterverfolgt.`, rationale: decision.rationale || '', tradeoffs: decision.tradeoffs || '', alternatives: decision.alternatives || f.variants.filter((v) => v.id !== variantId).map((v) => `${v.id} – ${v.name}`).join(', ') }));
    }, { ...featureMeta({ id: featureId }), type: 'variant.select' });
  },

  // ---- Blöcke ----
  addBlock(featureId, variantId, componentId, region = 'main') {
    return mutate(`Block „${componentId}“ hinzugefügt`, (s) => {
      const f = editable(F(s, featureId)); const v = V(f, variantId); const def = getComponent(componentId);
      const id = uniqueId(componentId.split('-')[0], (x) => v.blocks.some((b) => b.id === x));
      const bind = {};
      for (const slot of def?.data || []) {
        const keys = Object.keys(f.demoData || {});
        bind[slot.slot] = keys.includes(slot.default) ? slot.default : keys[0] || slot.default;
      }
      if (def?.example?.data) for (const slot of def.data || []) if (!(bind[slot.slot] in (f.demoData || {})) && def.example.data[slot.slot] !== undefined) { f.demoData = { ...f.demoData, [bind[slot.slot]]: clone(def.example.data[slot.slot]) }; }
      v.blocks.push({ id, component: componentId, region, props: clone(def?.example?.props || {}), bind });
      touchVariant(v); return id;
    }, { ...featureMeta({ id: featureId }), type: 'block.add' });
  },
  updateBlock(featureId, variantId, blockId, patch, label) {
    mutate(label || 'Block bearbeitet', (s) => {
      const f = editable(F(s, featureId)); const v = V(f, variantId); const b = v.blocks.find((x) => x.id === blockId);
      Object.assign(b, patch); touchVariant(v);
    }, { ...featureMeta({ id: featureId }), coalesce: `blk:${featureId}:${variantId}:${blockId}:${Object.keys(patch).join()}`, type: 'block.update' });
  },
  setBlockProp(featureId, variantId, blockId, prop, value) {
    mutate(`Eigenschaft „${prop}“ geändert`, (s) => {
      const f = editable(F(s, featureId)); const v = V(f, variantId); const b = v.blocks.find((x) => x.id === blockId);
      b.props = { ...(b.props || {}), [prop]: value }; touchVariant(v);
    }, { ...featureMeta({ id: featureId }), coalesce: `prop:${featureId}:${variantId}:${blockId}:${prop}`, type: 'block.prop' });
  },
  moveBlock(featureId, variantId, blockId, toIndex) {
    mutate('Block verschoben', (s) => {
      const f = editable(F(s, featureId)); const v = V(f, variantId);
      const from = v.blocks.findIndex((b) => b.id === blockId); const [b] = v.blocks.splice(from, 1);
      v.blocks.splice(Math.max(0, Math.min(toIndex, v.blocks.length)), 0, b); touchVariant(v);
    }, { ...featureMeta({ id: featureId }), type: 'block.move' });
  },
  duplicateBlock(featureId, variantId, blockId) {
    return mutate('Block dupliziert', (s) => {
      const f = editable(F(s, featureId)); const v = V(f, variantId); const i = v.blocks.findIndex((b) => b.id === blockId);
      const copy = clone(v.blocks[i]); copy.id = uniqueId(`${copy.id}-2`, (x) => v.blocks.some((b) => b.id === x));
      v.blocks.splice(i + 1, 0, copy); touchVariant(v); return copy.id;
    }, { ...featureMeta({ id: featureId }), type: 'block.duplicate' });
  },
  removeBlock(featureId, variantId, blockId) {
    mutate('Block entfernt', (s) => { const f = editable(F(s, featureId)); const v = V(f, variantId); v.blocks = v.blocks.filter((b) => b.id !== blockId); touchVariant(v); }, { ...featureMeta({ id: featureId }), type: 'block.remove' });
  },

  // ---- Anforderungen / Interaktionen / Daten ----
  setList(featureId, field, list, label) {
    mutate(label || `${field} aktualisiert`, (s) => { const f = editable(F(s, featureId)); f[field] = list; }, { ...featureMeta({ id: featureId }), coalesce: `list:${featureId}:${field}:${label}`, type: `feature.${field}` });
  },
  setDemoData(featureId, key, value) {
    mutate(`Demo-Daten „${key}“ gespeichert`, (s) => { const f = editable(F(s, featureId)); f.demoData = { ...f.demoData, [key]: value }; }, { ...featureMeta({ id: featureId }), type: 'feature.demoData' });
  },
  deleteDemoData(featureId, key) {
    mutate(`Demo-Daten „${key}“ entfernt`, (s) => { const f = editable(F(s, featureId)); const d = { ...f.demoData }; delete d[key]; f.demoData = d; }, { ...featureMeta({ id: featureId }), type: 'feature.demoData' });
  },
  markInteractionSeen(featureId, event) {
    // Bewusst außerhalb des Features gespeichert: Beobachtung ≠ Design-Änderung (kein Snapshot-Diff, auch bei Sperre erlaubt)
    mutate(null, (s) => { s.qa.seen = { ...(s.qa.seen || {}), [featureId]: { ...(s.qa.seen?.[featureId] || {}), [event]: nowIso() } }; }, { history: false, undo: false });
  },

  // ---- Versionen & Freigabe ----
  saveVersion(featureId, note = '') {
    mutate('Version gesichert', (s) => {
      const f = F(s, featureId); if (f.locked) throw new LockedError(f);
      s.versions.unshift(makeVersion(f, { kind: 'draft', note }));
      f.version = bumpMinor(f.version); f.updatedAt = nowIso();
    }, { ...featureMeta({ id: featureId }), type: 'version.save' });
  },
  submitReview(featureId, note = '') {
    mutate('Zur Prüfung eingereicht', (s) => {
      const f = F(s, featureId); if (f.locked) throw new LockedError(f);
      f.status = 'review';
      s.versions.unshift(makeVersion(f, { kind: 'review', note: note || 'Prüfversion' }));
      f.version = bumpMinor(f.version); f.updatedAt = nowIso();
    }, { ...featureMeta({ id: featureId }), type: 'version.review' });
  },
  release(featureId, { note = '', override = '' } = {}) {
    mutate('Feature freigegeben', (s) => {
      const f = F(s, featureId); if (f.locked) throw new LockedError(f);
      const qa = s.qa.latest[featureId] || null;
      const open = releaseChecklist(f, qa).filter((c) => !c.ok);
      if (open.length && !override.trim()) throw new Error(`Freigabe nicht möglich – offen: ${open.map((c) => c.label).join(', ')}. Mit Begründung (Ausnahme) freigeben.`);
      f.version = bumpMajor(f.version);
      f.status = 'released';
      const decisionIds = s.decisions.filter((d) => d.featureId === featureId).map((d) => d.id);
      const v = makeVersion(f, { kind: 'release', note: [note, override && `QA-Ausnahme: ${override}`].filter(Boolean).join(' · '), qa: qa ? { runId: qa.runId, ts: qa.ts, status: qa.status, variantId: qa.variantId, results: qa.results.map((r) => ({ viewport: r.viewport, theme: r.theme, state: r.state, status: r.status })) } : null, decisionIds });
      v.componentVersions = componentVersionsOf(f); // Darstellung zum Freigabezeitpunkt nachweisbar (Drift-Erkennung)
      s.versions.unshift(v);
      f.locked = true; f.releasedVersionId = v.id; f.updatedAt = nowIso();
      const m = s.modules.find((x) => x.id === f.moduleId); if (m && m.status === 'concept') m.status = 'active';
    }, { ...featureMeta({ id: featureId }), type: 'version.release' });
  },
  newWorkingVersion(featureId, reason = '') {
    mutate('Neue Arbeitsversion angelegt', (s) => {
      const f = F(s, featureId); if (!f.locked) return;
      f.locked = false; f.status = 'design'; f.version = bumpMinor(f.version); f.updatedAt = nowIso();
      if (reason) f.notes = `${f.notes ? f.notes + '\n' : ''}v${f.version}: ${reason}`;
    }, { ...featureMeta({ id: featureId }), type: 'version.newWorking' });
  },
  restoreVersion(versionId) {
    mutate('Version wiederhergestellt', (s) => {
      const v = s.versions.find((x) => x.id === versionId); if (!v) throw new Error('Version nicht gefunden');
      const f = F(s, v.featureId);
      if (f.locked) throw new LockedError(f);
      // Sicherheitsnetz: aktuellen Arbeitsstand vorher automatisch als Version sichern
      s.versions.unshift(makeVersion(f, { kind: 'draft', note: `Automatisch vor Wiederherstellung von v${v.version}` }));
      f.version = bumpMinor(f.version);
      Object.assign(f, clone(v.snapshot)); f.updatedAt = nowIso();
      f.notes = `${f.notes ? f.notes + '\n' : ''}Stand v${v.version} wiederhergestellt am ${new Date().toLocaleString('de-DE')}.`;
    }, { entity: 'feature', type: 'version.restore' });
  },
  setRealDevice(featureId, check) {
    mutate('Gerätetest dokumentiert', (s) => { const f = F(s, featureId); f.realDevice = { ...check, at: nowIso() }; }, { ...featureMeta({ id: featureId }), type: 'qa.device' });
  },

  // ---- Entscheidungen ----
  addDecision(d) { return mutate(`Entscheidung „${d.title}“ angelegt`, (s) => { const x = createDecision(d); if (x.status === 'decided') x.decidedAt = nowIso(); s.decisions.unshift(x); return x.id; }, { entity: 'decision', featureId: d.featureId, type: 'decision.add' }); },
  updateDecision(id, patch) {
    mutate('Entscheidung bearbeitet', (s) => { const d = s.decisions.find((x) => x.id === id); Object.assign(d, patch); if (patch.status === 'decided' && !d.decidedAt) d.decidedAt = nowIso(); }, { entity: 'decision', entityId: id, coalesce: `dec:${id}:${Object.keys(patch).join()}`, type: 'decision.update' });
  },
  deleteDecision(id) { mutate('Entscheidung gelöscht', (s) => { s.decisions = s.decisions.filter((d) => d.id !== id); }, { entity: 'decision', entityId: id, type: 'decision.delete' }); },

  // ---- QA ----
  recordQaRun(run) {
    mutate(`QA-Lauf: ${run.results.length} Prüfungen, ${run.status}`, (s) => {
      s.qa.runs.unshift({ id: run.id, ts: run.ts, scope: run.scope, status: run.status, features: [...new Set(run.results.map((r) => r.featureId))], counts: run.counts, source: 'workbench' });
      if (s.qa.runs.length > 60) s.qa.runs.length = 60;
      const byFeature = new Map();
      for (const r of run.results) { if (!byFeature.has(r.featureId)) byFeature.set(r.featureId, []); byFeature.get(r.featureId).push(r); }
      for (const [fid, results] of byFeature) {
        const st = results.some((r) => r.status === 'fail') ? 'fail' : results.some((r) => r.status === 'warn') ? 'warn' : 'pass';
        const f = s.features.find((x) => x.id === fid);
        s.qa.latest[fid] = { runId: run.id, ts: run.ts, status: st, variantId: results[0].variantId, version: f?.version, results };
      }
    }, { entity: 'qa', type: 'qa.run', undo: false });
  },
  setCliQa(cli) { mutate(null, (s) => { s.qa.cli = cli; }, { history: false, undo: false }); },
  updateComponentMeta(id, patch) {
    mutate(`Komponente „${id}“: Status/Notiz`, (s) => { s.components[id] = { ...(s.components[id] || {}), ...patch, changedAt: nowIso() }; }, { entity: 'component', entityId: id, coalesce: `cmp:${id}`, type: 'component.meta' });
  },

  // ---- Daten ----
  importState(obj) {
    const check = inspectImport(obj); if (!check.ok) throw new Error(check.errors.join('; '));
    mutate(`Workbench-Daten importiert (${check.summary.modules} Module, ${check.summary.features} Features)`, (s) => {
      const next = migrate(obj); Object.keys(s).forEach((k) => delete s[k]); Object.assign(s, next);
    }, { type: 'data.import' });
  },
  resetToSeed() { mutate('Auf Seed zurückgesetzt', (s) => { const next = buildSeedState(); next.settings = { ...defaultSettings(), ...s.settings }; Object.keys(s).forEach((k) => delete s[k]); Object.assign(s, next); }, { type: 'data.reset' }); },
  mergeSeed() { return mutate('Neue Seed-Inhalte übernommen', (s) => mergeSeed(s), { type: 'data.mergeSeed' }); },
};

/** Komponenten-Versionen, die die Varianten eines Features verwenden. */
export function componentVersionsOf(f) {
  const out = {};
  for (const v of f.variants) for (const b of v.blocks) out[b.component] = getComponent(b.component)?.version || '?';
  return out;
}
/** Freigegebene Features, deren Komponenten seit der Freigabe eine neue Version haben → Regression nötig. */
export function releaseDrift(st, f) {
  const rel = st.versions.find((v) => v.id === f.releasedVersionId);
  if (!rel?.componentVersions) return [];
  return Object.entries(rel.componentVersions).filter(([id, ver]) => (getComponent(id)?.version || '?') !== ver).map(([id, ver]) => ({ id, released: ver, current: getComponent(id)?.version || 'fehlt' }));
}

export const exportState = () => JSON.stringify({ ...state, meta: { ...state.meta, exportedAt: nowIso() } }, null, 1);

/** Bequemer Wrapper: führt eine Aktion aus und meldet Fehler (z. B. Sperre) als Toast. */
export function tryAction(fn, toast) {
  try { return fn(); } catch (e) { (toast || console.warn)(e.message, 'danger', e instanceof LockedError ? e.featureId : null); return undefined; }
}
export { snapshotOf, defaultProps };
