// ============================================================================
// DATENMODELL – Konstanten, Fabriken, Normalisierung & Migration.
// Reines JS ohne Browser-Abhängigkeit (auch von Node/CLI importierbar).
// Siehe ARCHITECTURE.md › Datenmodell.
// ============================================================================
import { uid, nowIso, slug } from '../lib/util.js';

export const SCHEMA_VERSION = 1;

export const FEATURE_STATUSES = [
  { id: 'not_analyzed', label: 'Nicht untersucht', short: 'Offen', tone: 'neutral', icon: 'circle-dashed' },
  { id: 'analyzed', label: 'Analysiert', short: 'Analysiert', tone: 'info', icon: 'search' },
  { id: 'design', label: 'Design in Arbeit', short: 'Design', tone: 'accent', icon: 'pencil' },
  { id: 'review', label: 'In Prüfung', short: 'Prüfung', tone: 'warning', icon: 'eye' },
  { id: 'released', label: 'Freigegeben', short: 'Freigegeben', tone: 'success', icon: 'badge-check' },
  { id: 'implemented', label: 'Implementiert', short: 'Implementiert', tone: 'accent2', icon: 'code' },
  { id: 'regression_ok', label: 'Regression bestanden', short: 'Regression ok', tone: 'success', icon: 'shield-check' },
];
export const statusInfo = (id) => FEATURE_STATUSES.find((s) => s.id === id) || FEATURE_STATUSES[0];
export const statusIndex = (id) => FEATURE_STATUSES.findIndex((s) => s.id === id);
/** Status ab "Freigegeben" gelten als stabil (gesperrt bis neue Arbeitsversion). */
export const isStableStatus = (id) => statusIndex(id) >= statusIndex('released');

export const MODULE_STATUSES = [
  { id: 'concept', label: 'Konzept', tone: 'neutral' },
  { id: 'active', label: 'In Arbeit', tone: 'accent' },
  { id: 'released', label: 'Freigegeben', tone: 'success' },
  { id: 'reference', label: 'Referenz', tone: 'info' },
];
export const moduleStatusInfo = (id) => MODULE_STATUSES.find((s) => s.id === id) || MODULE_STATUSES[0];

export const REQUIREMENT_TYPES = [
  { id: 'info', label: 'Information', icon: 'eye' },
  { id: 'action', label: 'Aktion', icon: 'zap' },
  { id: 'state', label: 'Zustand', icon: 'layers' },
  { id: 'rule', label: 'Regel', icon: 'scale' },
];
export const PRIORITIES = [
  { id: 'must', label: 'Muss', tone: 'danger' },
  { id: 'should', label: 'Soll', tone: 'warning' },
  { id: 'could', label: 'Kann', tone: 'neutral' },
];
export const UI_STATES = [
  { id: 'default', label: 'Standard' }, { id: 'empty', label: 'Leer' }, { id: 'loading', label: 'Lädt' }, { id: 'error', label: 'Fehler' },
];

export function defaultSettings() {
  return {
    wbTheme: 'dark',            // Oberfläche der Workbench selbst
    previewTheme: 'graphite',   // TAKT-Theme in der Vorschau
    viewport: 'mobile',
    previewState: 'default',
    chrome: true,               // TAKT-App-Rahmen anzeigen
    zoom: 'fit',
    multiViewports: ['desktop', 'tablet', 'mobile'],
    qaViewports: ['desktop', 'notebook', 'tablet-l', 'tablet', 'mobile'],
    qaThemes: ['graphite'],
    qaStates: ['default'],
    lastFeatureId: null,
  };
}

export function createModule(partial = {}) {
  const t = nowIso();
  return {
    id: partial.id || slug(partial.name || 'modul'),
    name: 'Neues Modul', icon: 'box', description: '', status: 'concept', theme: 'graphite', designVersion: '0.1',
    order: 999, archived: false, isReference: false, links: [], docs: '', infoArchitecture: '', source: 'Workbench',
    createdAt: t, updatedAt: t,
    ...partial,
  };
}

export function createVariant(partial = {}) {
  const t = nowIso();
  return {
    id: partial.id || uid('var'), name: 'Variante', concept: '', description: '',
    layout: { type: 'stack' }, blocks: [], createdAt: t, updatedAt: t, origin: 'manual',
    ...partial,
    blocks: (partial.blocks || []).map((b, i) => ({ id: b.id || `b${i + 1}`, region: 'main', props: {}, ...b })),
  };
}

export function createFeature(partial = {}) {
  const t = nowIso();
  const f = {
    id: partial.id || `${partial.moduleId || 'feature'}.${slug(partial.name || 'feature')}`,
    moduleId: null, name: 'Neues Feature', group: 'Allgemein', order: 999, purpose: '', status: 'not_analyzed', archived: false,
    requirements: [], interactions: [], states: ['default', 'empty', 'loading', 'error'],
    viewports: ['desktop', 'notebook', 'tablet', 'mobile'],
    variants: [], selectedVariantId: null, demoData: {}, links: [], references: [], notes: '',
    version: '0.1', releasedVersionId: null, locked: false, realDevice: null,
    createdAt: t, updatedAt: t,
    ...partial,
  };
  f.requirements = (f.requirements || []).map((r, i) => (typeof r === 'string' ? { text: r } : r)).map((r, i) => ({ id: r.id || `r${i + 1}`, type: 'info', priority: 'must', ...r }));
  f.interactions = (f.interactions || []).map((x, i) => ({ id: x.id || `i${i + 1}`, trigger: '', result: '', event: '', ...x }));
  f.variants = (f.variants || []).map((v) => createVariant(v));
  if (!f.selectedVariantId && f.variants[0]) f.selectedVariantId = f.variants[0].id;
  return f;
}

export function createDecision(partial = {}) {
  return { id: uid('dec'), featureId: null, moduleId: null, title: '', decision: '', rationale: '', tradeoffs: '', alternatives: '', status: 'open', createdAt: nowIso(), decidedAt: null, ...partial };
}

export function emptyState() {
  const t = nowIso();
  return {
    schemaVersion: SCHEMA_VERSION,
    meta: { project: 'TAKT V2.0', createdAt: t, updatedAt: t, seedVersion: null },
    settings: defaultSettings(),
    modules: [], features: [], versions: [], decisions: [], history: [],
    qa: { runs: [], latest: {}, cli: null },
    components: {},
  };
}

/** Stellt sicher, dass ein (importierter/alter) Zustand alle Felder besitzt. */
export function migrate(state) {
  if (!state || typeof state !== 'object') throw new Error('Ungültiger Zustand');
  const base = emptyState();
  const s = { ...base, ...state };
  s.meta = { ...base.meta, ...(state.meta || {}) };
  s.settings = { ...base.settings, ...(state.settings || {}) };
  s.qa = { ...base.qa, ...(state.qa || {}) };
  s.modules = (s.modules || []).map((m) => createModule(m));
  s.features = (s.features || []).map((f) => createFeature(f));
  s.versions = s.versions || []; s.decisions = s.decisions || []; s.history = s.history || []; s.components = s.components || {};
  // zukünftige Migrationen: if ((state.schemaVersion || 1) < 2) { … }
  s.schemaVersion = SCHEMA_VERSION;
  return s;
}

/** Validiert einen Import grob und liefert eine Zusammenfassung. */
export function inspectImport(obj) {
  const errs = [];
  if (!obj || typeof obj !== 'object') errs.push('Keine JSON-Struktur');
  else {
    if (!Array.isArray(obj.modules)) errs.push('modules fehlt');
    if (!Array.isArray(obj.features)) errs.push('features fehlt');
    if ((obj.schemaVersion || 1) > SCHEMA_VERSION) errs.push(`schemaVersion ${obj.schemaVersion} ist neuer als diese Workbench (${SCHEMA_VERSION})`);
  }
  return { ok: !errs.length, errors: errs, summary: obj && !errs.length ? { modules: obj.modules.length, features: obj.features.length, versions: (obj.versions || []).length, decisions: (obj.decisions || []).length, updatedAt: obj.meta?.updatedAt } : null };
}
