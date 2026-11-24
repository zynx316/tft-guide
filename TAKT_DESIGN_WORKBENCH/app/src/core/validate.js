// ============================================================================
// INTEGRITÄTSPRÜFUNG des Workbench-Zustands (Bauplan 5.2 „validateState“).
// Prüft Verweise zwischen Modulen, Features, Varianten, Versionen, Entscheidungen, Runden, Anmerkungen und Navigationszielen.
// * errors   = der Zustand ist beschädigt (doppelte IDs, Feature ohne Modul, Sperre ohne Freigabe …) – Import wird blockiert.
// * warnings = Inhalte zeigen ins Leere (Navigationsziel, Komponente, Welt-Schlüssel …) – funktioniert, sollte bereinigt werden.
// Verwendet von: Import-Dialog und „Integrität prüfen“ (Daten & Backup), tools/check.mjs (Seed), Tests.
// Browser-/Node-neutral; getComponent und worldKeys werden optional übergeben.
// ============================================================================
import { isWorldRef, worldKey } from '../seed/world/index.js';

const MAX = 200; // je Liste höchstens so viele Einträge melden (Rest zusammengefasst)

export function validateState(state, { getComponent = null, worldKeys = null } = {}) {
  const errors = [], warnings = [];
  const err = (code, msg, ref = null) => errors.push({ code, msg, ref });
  const warn = (code, msg, ref = null) => warnings.push({ code, msg, ref });
  if (!state || typeof state !== 'object') { err('struktur', 'Keine JSON-Struktur'); return result(); }
  const modules = Array.isArray(state.modules) ? state.modules : (err('struktur', 'modules fehlt'), []);
  const features = Array.isArray(state.features) ? state.features : (err('struktur', 'features fehlt'), []);
  const versions = Array.isArray(state.versions) ? state.versions : [];
  const decisions = Array.isArray(state.decisions) ? state.decisions : [];

  const dupes = (list, label, code) => { const seen = new Set(); for (const x of list) { if (!x?.id) { err(code, `${label} ohne ID`); continue; } if (seen.has(x.id)) err(code, `${label} „${x.id}“ doppelt`, x.id); seen.add(x.id); } return seen; };
  const moduleIds = dupes(modules, 'Modul', 'modul-id');
  const featureIds = dupes(features, 'Feature', 'feature-id');
  const versionIds = dupes(versions, 'Version', 'version-id');
  const decisionIds = dupes(decisions, 'Entscheidung', 'entscheidung-id');
  const byId = new Map(features.map((f) => [f.id, f]));
  const dirIds = new Set((state.directions || []).map((d) => d.id));
  const validTarget = (to) => (String(to).startsWith('module:') ? moduleIds.has(String(to).slice(7)) : featureIds.has(to));

  for (const m of modules) {
    if (m.homeFeatureId && !featureIds.has(m.homeFeatureId)) warn('startseite', `Modul „${m.id}“: Startseite „${m.homeFeatureId}“ existiert nicht`, m.id);
    else if (m.homeFeatureId && byId.get(m.homeFeatureId)?.moduleId !== m.id) warn('startseite', `Modul „${m.id}“: Startseite „${m.homeFeatureId}“ gehört zu einem anderen Modul`, m.id);
    if (m.directionId && dirIds.size && !dirIds.has(m.directionId)) warn('richtung', `Modul „${m.id}“: unbekannte Richtung „${m.directionId}“`, m.id);
  }
  for (const f of features) {
    if (!moduleIds.has(f.moduleId)) err('feature-modul', `Feature „${f.id}“: Modul „${f.moduleId}“ fehlt`, f.id);
    const variants = Array.isArray(f.variants) ? f.variants : (err('varianten', `Feature „${f.id}“: variants fehlt`, f.id), []);
    const vids = new Set();
    for (const v of variants) { if (vids.has(v.id)) err('variante-id', `Feature „${f.id}“: Variante „${v.id}“ doppelt`, f.id); vids.add(v.id); }
    if (variants.length && f.selectedVariantId && !vids.has(f.selectedVariantId)) err('auswahl', `Feature „${f.id}“: gewählte Variante „${f.selectedVariantId}“ existiert nicht`, f.id);
    if (f.locked && !(f.releasedVersionId && versionIds.has(f.releasedVersionId))) err('sperre', `Feature „${f.id}“ ist gesperrt, aber die Freigabe-Version fehlt`, f.id);
    for (const i of f.interactions || []) if (i.to && !validTarget(i.to)) warn('ziel', `Feature „${f.id}“: Navigationsziel „${i.to}“ (${i.event || 'ohne Event'}) existiert nicht`, f.id);
    for (const v of variants) {
      if (v.direction && dirIds.size && !dirIds.has(v.direction)) warn('richtung', `Feature „${f.id}“ › ${v.id}: unbekannte Richtung „${v.direction}“`, f.id);
      for (const n of v.nav || []) if (n.to && !validTarget(n.to)) warn('ziel', `Feature „${f.id}“ › ${v.id}: Navigationsziel „${n.to}“ existiert nicht`, f.id);
      const bids = new Set();
      for (const b of v.blocks || []) {
        if (bids.has(b.id)) warn('block-id', `Feature „${f.id}“ › ${v.id}: Block „${b.id}“ doppelt`, f.id); bids.add(b.id);
        if (getComponent && !getComponent(b.component)) warn('komponente', `Feature „${f.id}“ › ${v.id}: Komponente „${b.component}“ unbekannt`, f.id);
      }
    }
    if (worldKeys) for (const [k, val] of Object.entries(f.demoData || {})) if (isWorldRef(val) && !worldKeys.has(worldKey(val))) warn('welt', `Feature „${f.id}“: Welt-Schlüssel „${worldKey(val)}“ (${k}) existiert nicht`, f.id);
  }
  for (const v of versions) if (v.featureId && !featureIds.has(v.featureId)) warn('version-feature', `Version „${v.id}“: Feature „${v.featureId}“ fehlt`, v.id);
  for (const d of decisions) {
    if (d.featureId && !featureIds.has(d.featureId)) warn('entscheidung-bezug', `Entscheidung „${d.id}“: Feature „${d.featureId}“ fehlt`, d.id);
    if (d.moduleId && !moduleIds.has(d.moduleId)) warn('entscheidung-bezug', `Entscheidung „${d.id}“: Modul „${d.moduleId}“ fehlt`, d.id);
    if (d.supersedes && !decisionIds.has(d.supersedes)) warn('entscheidung-bezug', `Entscheidung „${d.id}“ ersetzt „${d.supersedes}“, die es nicht gibt`, d.id);
  }
  for (const r of state.rounds || []) for (const id of r.agenda || []) if (!decisionIds.has(id)) warn('runde', `Runde „${r.title || r.id}“: Entscheidung „${id}“ fehlt`, r.id);
  for (const p of state.pins || []) {
    if (p.featureId && !featureIds.has(p.featureId)) warn('anmerkung', `Anmerkung „${p.id}“: Feature „${p.featureId}“ fehlt`, p.id);
    else if (p.variantId && p.featureId && !(byId.get(p.featureId)?.variants || []).some((v) => v.id === p.variantId)) warn('anmerkung', `Anmerkung „${p.id}“: Variante „${p.variantId}“ fehlt`, p.id);
  }
  if (state.app?.startFeatureId && !featureIds.has(state.app.startFeatureId)) warn('app', `App-Start „${state.app.startFeatureId}“ existiert nicht`);
  if (state.app?.directionId && dirIds.size && !dirIds.has(state.app.directionId)) warn('app', `App-Richtung „${state.app.directionId}“ unbekannt`);
  return result();

  function result() {
    const cap = (list) => (list.length > MAX ? [...list.slice(0, MAX), { code: 'mehr', msg: `… und ${list.length - MAX} weitere` }] : list);
    return { ok: errors.length === 0, errors: cap(errors), warnings: cap(warnings), counts: { errors: errors.length, warnings: warnings.length } };
  }
}
