// ============================================================================
// VERSIONIERUNG & FREIGABE
// Regeln:
//  * Arbeitsversion 0.x – "Version sichern" friert den Stand ein (Snapshot) und
//    zählt die Arbeitsversion hoch (0.3 -> 0.4).
//  * Freigabe = Major-Sprung (0.4 -> 1.0, 1.2 -> 2.0), Snapshot inkl. QA-Ergebnis,
//    Viewports, Interaktionen, Entscheidungen. Feature wird GESPERRT.
//  * Änderung an Freigegebenem: "Neue Arbeitsversion" (1.0 -> 1.1, entsperrt).
//    Der freigegebene Snapshot bleibt unverändert erhalten.
// ============================================================================
import { clone, nowIso, uid } from '../lib/util.js';

// Design-relevante Felder. links/notes/realDevice sind Organisation und nicht Teil der Freigabe.
export const SNAPSHOT_FIELDS = ['purpose', 'requirements', 'interactions', 'states', 'viewports', 'variants', 'selectedVariantId', 'demoData', 'references'];

export const snapshotOf = (feature) => clone(Object.fromEntries(SNAPSHOT_FIELDS.map((k) => [k, feature[k]])));

const parse = (v) => { const [a, b] = String(v || '0.1').split('.').map((n) => parseInt(n, 10) || 0); return [a, b]; };
export const bumpMinor = (v) => { const [a, b] = parse(v); return `${a}.${b + 1}`; };
export const bumpMajor = (v) => { const [a] = parse(v); return `${a + 1}.0`; };
export const compareVersions = (x, y) => { const [a1, b1] = parse(x), [a2, b2] = parse(y); return a1 - a2 || b1 - b2; };

export function makeVersion(feature, { kind = 'draft', note = '', version, qa = null, decisionIds = [] } = {}) {
  return {
    id: uid('ver'), featureId: feature.id, moduleId: feature.moduleId,
    version: version || feature.version, kind, note, createdAt: nowIso(),
    status: feature.status, snapshot: snapshotOf(feature), qa, decisionIds,
  };
}

/** Unterschiede zwischen zwei Snapshots (für Versionsvergleich). */
export function diffSnapshots(a, b) {
  const out = [];
  if (!a || !b) return out;
  if ((a.purpose || '') !== (b.purpose || '')) out.push({ area: 'Zweck', text: 'Zweck geändert' });
  const reqA = new Map((a.requirements || []).map((r) => [r.id, r])), reqB = new Map((b.requirements || []).map((r) => [r.id, r]));
  for (const [id, r] of reqB) if (!reqA.has(id)) out.push({ area: 'Anforderungen', text: `+ ${r.text}` }); else if (reqA.get(id).text !== r.text || reqA.get(id).priority !== r.priority) out.push({ area: 'Anforderungen', text: `~ ${r.text}` });
  for (const [id, r] of reqA) if (!reqB.has(id)) out.push({ area: 'Anforderungen', text: `− ${r.text}` });
  const vA = new Map((a.variants || []).map((v) => [v.id, v])), vB = new Map((b.variants || []).map((v) => [v.id, v]));
  for (const [id, v] of vB) {
    if (!vA.has(id)) { out.push({ area: 'Varianten', text: `+ Variante „${v.name}“` }); continue; }
    const o = vA.get(id);
    if (JSON.stringify(o.layout) !== JSON.stringify(v.layout)) out.push({ area: 'Varianten', text: `„${v.name}“: Layout ${o.layout?.type} → ${v.layout?.type}` });
    const bo = (o.blocks || []).map((x) => x.component).join(','), bn = (v.blocks || []).map((x) => x.component).join(',');
    if (bo !== bn) out.push({ area: 'Varianten', text: `„${v.name}“: Blöcke ${o.blocks.length} → ${v.blocks.length}` });
    else if (JSON.stringify(o.blocks) !== JSON.stringify(v.blocks)) out.push({ area: 'Varianten', text: `„${v.name}“: Block-Eigenschaften geändert` });
  }
  for (const [id, v] of vA) if (!vB.has(id)) out.push({ area: 'Varianten', text: `− Variante „${v.name}“` });
  if (a.selectedVariantId !== b.selectedVariantId) out.push({ area: 'Auswahl', text: 'Bevorzugte Variante gewechselt' });
  if (JSON.stringify(a.interactions) !== JSON.stringify(b.interactions)) out.push({ area: 'Interaktionen', text: 'Interaktionen geändert' });
  if (JSON.stringify(a.demoData) !== JSON.stringify(b.demoData)) out.push({ area: 'Demo-Daten', text: 'Demo-Daten geändert' });
  if (JSON.stringify(a.viewports) !== JSON.stringify(b.viewports)) out.push({ area: 'Viewports', text: 'Viewports geändert' });
  return out;
}

/** Freigabe-Checkliste – was muss vor einer Freigabe erfüllt sein? */
export function releaseChecklist(feature, qaLatest) {
  const sel = feature.variants.find((v) => v.id === feature.selectedVariantId);
  const qa = qaLatest && qaLatest.variantId === feature.selectedVariantId ? qaLatest : null;
  const qaFresh = qa && new Date(qa.ts) >= new Date(sel?.updatedAt || 0);
  const must = feature.requirements.filter((r) => r.priority === 'must');
  return [
    { id: 'variant', label: 'Bevorzugte Variante gewählt', ok: !!sel },
    { id: 'requirements', label: 'Muss-Anforderungen dokumentiert', ok: must.length > 0, detail: `${must.length} Muss-Anforderungen` },
    { id: 'interactions', label: 'Interaktionen beschrieben', ok: feature.interactions.length > 0, detail: `${feature.interactions.length} Interaktionen` },
    { id: 'qa', label: 'QA für gewählte Variante ohne Fehler', ok: !!qa && qa.status !== 'fail', detail: qa ? `Status ${qa.status}, ${qa.results.length} Viewports` : 'Noch kein QA-Lauf' },
    { id: 'qaFresh', label: 'QA aktueller als letzte Design-Aenderung', ok: !!qaFresh },
    { id: 'viewports', label: 'Alle Ziel-Viewports geprüft', ok: !!qa && feature.viewports.every((v) => qa.results.some((r) => r.group === v || r.viewport === v)), detail: feature.viewports.join(', ') },
  ];
}
