// ============================================================================
// EBENEN & VERSIONEN (Design-Richtungen) – rein, auch von Node/CLI nutzbar.
//
// Ebenen-Leiter (von oben nach unten entscheiden, Entscheidungen vererben sich):
//   Ebene 0  App        – Richtung der ganzen App (Navigation, Theme, Grundhaltung)
//   Ebene 1  Modul      – Modul-Startseite, Informationsarchitektur, Richtung je Modul
//   Ebene 2  Feature    – einzelne Screens/Varianten
//   Ebene 3  Komponente – Bausteine der Library (zentral, wirken überall)
//
// Eine VERSION ist eine Auswahl von Varianten über die ganze App:
//   'arbeitsstand'  – bevorzugte Variante je Feature (aktueller Stand)
//   'freigabe'      – freigegebener Snapshot, sonst Arbeitsstand
//   'dir:<id>'      – Design-Richtung: je Feature die Variante mit passender Richtung,
//                     sonst Fallback auf den Arbeitsstand (Abdeckung wird ausgewiesen)
// ============================================================================

export const DEFAULT_DIRECTIONS = [
  {
    id: 'kompakt', name: 'Kompakt', icon: 'rows-3', tone: 'info',
    claim: 'Alles im Blick, schnell bedient',
    description: 'Hohe Informationsdichte: Listen, Tabellen, kleine Karten, wenige Grafiken. Für Power-User, die viel auf einmal sehen und mit wenigen Taps arbeiten wollen.',
    principles: ['Dichte vor Weißraum', 'Listen & Tabellen statt großer Kacheln', 'Aktionen direkt in der Zeile', 'Zahlen exakt statt gerundet'],
    nav: 'bottom', shell: 'tabs', theme: 'graphite',
  },
  {
    id: 'visuell', name: 'Visuell', icon: 'layout-grid', tone: 'accent',
    claim: 'Ruhig, klar, auf einen Blick verständlich',
    description: 'Große Karten, Diagramme, viel Raum und klare Hierarchie. Orientierung über Bilder, Farben und Fortschrittsanzeigen statt Zahlenkolonnen.',
    principles: ['Eine Botschaft pro Karte', 'Diagramme vor Tabellen', 'Großzügige Abstände', 'Fortschritt sichtbar machen'],
    nav: 'bottom', shell: 'launchpad', theme: 'horizon',
  },
  {
    id: 'fokus', name: 'Fokus', icon: 'target', tone: 'success',
    claim: 'Was ist als Nächstes zu tun?',
    description: 'Handlungsorientiert: priorisiert das Wichtigste, kombiniert Kontext aus anderen Modulen, schlägt nächste Schritte vor und blendet Nebensächliches aus.',
    principles: ['Nächste Aktion zuerst', 'Kontext aus anderen Modulen', 'Hinweise statt Datenwüsten', 'Erfassen ohne Umweg'],
    nav: 'bottom', shell: 'fokus', theme: 'intensiv',
  },
];

export const LEVELS = [
  { id: 'app', label: 'App', short: 'Ebene 0', icon: 'smartphone', question: 'Welche Grundrichtung hat die ganze App?' },
  { id: 'module', label: 'Modul', short: 'Ebene 1', icon: 'boxes', question: 'Wie ist das Modul aufgebaut, wo steigt man ein?' },
  { id: 'feature', label: 'Feature', short: 'Ebene 2', icon: 'file-text', question: 'Welche Variante je Screen?' },
  { id: 'component', label: 'Komponente', short: 'Ebene 3', icon: 'component', question: 'Sind die Bausteine stabil und gut?' },
];

/** Alle Versionen, die der Launcher anbietet. */
export function listVersions(state) {
  const dirs = state.directions?.length ? state.directions : DEFAULT_DIRECTIONS;
  return [
    { id: 'arbeitsstand', name: 'Arbeitsstand', icon: 'pencil', tone: 'neutral', claim: 'Bevorzugte Variante je Feature', kind: 'state' },
    ...dirs.map((d) => ({ ...d, id: `dir:${d.id}`, directionId: d.id, kind: 'direction' })),
    { id: 'mix', name: 'Meine Auswahl', icon: 'list-checks', tone: 'accent', claim: 'Nach deinen Entscheidungen: Feature vor Modul-Richtung vor App-Richtung', kind: 'state' },
    { id: 'freigabe', name: 'Freigegeben', icon: 'badge-check', tone: 'success', claim: 'Nur freigegebene Stände (sonst Arbeitsstand)', kind: 'state' },
  ];
}

/**
 * „Meine Auswahl“: Variante nach den getroffenen Entscheidungen.
 * Rangfolge: entschiedene Variante des Features › Richtung des Moduls › Richtung der App › Arbeitsstand.
 */
function resolveMix(state, feature, selected) {
  const decided = (state.decisions || []).some((d) => d.featureId === feature.id && d.kind === 'variant' && d.status === 'decided');
  if (decided && selected) return { variant: selected, demoData: feature.demoData, source: 'feature', reason: 'Variante des Features entschieden' };
  const m = state.modules?.find((x) => x.id === feature.moduleId);
  for (const [dir, src, why] of [[m?.directionId, 'modul', 'Richtung des Moduls'], [state.app?.directionId, 'app', 'Richtung der App']]) {
    if (!dir) continue;
    const match = feature.variants.find((v) => v.direction === dir);
    if (match) return { variant: match, demoData: feature.demoData, source: src, reason: why };
    return { variant: selected, demoData: feature.demoData, source: selected ? 'fallback' : 'none', reason: `${why} „${dir}“ – keine passende Variante` };
  }
  return { variant: selected, demoData: feature.demoData, source: selected ? 'selected' : 'none', reason: 'Noch nichts entschieden – Arbeitsstand' };
}

const SHELL_OF = { kompakt: 'tabs', visuell: 'launchpad', fokus: 'fokus' };
/** App-Rahmen einer Version: Richtung → ihr Rahmen; sonst App-Einstellung bzw. Rahmen der gewählten App-Richtung. */
export function shellOf(state, version) {
  if (version?.kind === 'direction') return version.shell || SHELL_OF[version.directionId] || 'tabs';
  const appDir = (state.directions || []).find((d) => d.id === state.app?.directionId);
  return state.app?.shell || appDir?.shell || SHELL_OF[state.app?.directionId] || 'tabs';
}

/** Version per ID – inkl. Pseudoversion pin:<featureId>:<variantId> („In App ansehen“ aus dem Studio). */
export function versionById(state, id) {
  const list = listVersions(state);
  if (String(id).startsWith('pin:')) { const [, fid, vid] = id.split(':'); const f = state.features.find((x) => x.id === fid);
    return { id, name: `Ansicht: ${f?.name || fid} · ${vid}`, icon: 'pin', tone: 'accent', claim: 'Diese Variante im App-Zusammenhang, alles andere Arbeitsstand', kind: 'pin', featureId: fid }; }
  return list.find((v) => v.id === id) || list[0];
}

/** Variante eines Features für eine Version (inkl. Herkunft für die Abdeckungsanzeige). */
export function resolveVariant(state, feature, versionId = 'arbeitsstand') {
  const selected = feature.variants.find((v) => v.id === feature.selectedVariantId) || feature.variants[0] || null;
  if (versionId === 'freigabe') {
    const rel = feature.releasedVersionId && state.versions?.find((v) => v.id === feature.releasedVersionId);
    if (rel?.snapshot) {
      const sv = rel.snapshot.variants.find((v) => v.id === rel.snapshot.selectedVariantId) || rel.snapshot.variants[0];
      if (sv) return { variant: sv, demoData: rel.snapshot.demoData, source: 'freigabe' };
    }
    return { variant: selected, demoData: feature.demoData, source: selected ? 'fallback' : 'none' };
  }
  if (versionId.startsWith('dir:')) {
    const dir = versionId.slice(4);
    const match = feature.variants.find((v) => v.direction === dir);
    if (match) return { variant: match, demoData: feature.demoData, source: 'direction' };
    return { variant: selected, demoData: feature.demoData, source: selected ? 'fallback' : 'none' };
  }
  if (versionId === 'mix') return resolveMix(state, feature, selected);
  if (versionId.startsWith('pin:')) {
    // Pseudoversion „In App ansehen“: pin:<featureId>:<variantId> – nur dieses Feature weicht vom Arbeitsstand ab.
    const [, fid, vid] = versionId.split(':');
    const pinned = fid === feature.id && feature.variants.find((v) => v.id === vid);
    if (pinned) return { variant: pinned, demoData: feature.demoData, source: 'pin', reason: `Variante ${vid} zur Ansicht` };
  }
  return { variant: selected, demoData: feature.demoData, source: selected ? 'selected' : 'none' };
}

/** Abdeckung einer Version: wie viele Features haben eine eigene passende Variante? */
export function versionCoverage(state, versionId, moduleId = null) {
  const fs = state.features.filter((f) => !f.archived && f.variants.length && (!moduleId || f.moduleId === moduleId));
  const own = fs.filter((f) => resolveVariant(state, f, versionId).source !== 'fallback').length;
  return { total: fs.length, own, ratio: fs.length ? own / fs.length : 0 };
}

/** Startseite eines Moduls: explizit gesetzt, sonst erstes Feature der Gruppe „Übersicht“, sonst erstes mit Variante. */
export function moduleHome(state, moduleId) {
  const m = state.modules.find((x) => x.id === moduleId);
  const fs = state.features.filter((f) => f.moduleId === moduleId && !f.archived && f.variants.length).sort((a, b) => a.order - b.order);
  if (m?.homeFeatureId && fs.some((f) => f.id === m.homeFeatureId)) return m.homeFeatureId;
  return (fs.find((f) => /übersicht|start|überblick|heute|dashboard/i.test(`${f.group} ${f.name}`)) || fs[0])?.id || null;
}

/** Navigationsregeln eines Features: Interaktionen mit Ziel (`to`) werden zu Links in der App-Vorschau. */
export const navigationRules = (feature) => (feature.interactions || []).filter((i) => i.event && i.to).map((i) => ({ event: i.event, to: i.to, label: i.trigger }));

/** Heuristik für Bestands-Varianten ohne Richtung (Seed-Migration). */
export function guessDirection(variant) {
  const t = `${variant.name} ${variant.concept || ''}`.toLowerCase();
  if (/fokus|produktiv|aufmerksamkeit|nächste|handlung|tagesplan|schritt für schritt|feed/.test(t)) return 'fokus';
  if (/kompakt|liste|tabell|dicht|master-detail|analytisch|kompakte/.test(t)) return 'kompakt';
  if (/visuell|karten|kachel|cockpit|dashboard|raster|grafisch|erzähl|hero/.test(t)) return 'visuell';
  return null;
}

/** Lebensbereiche: Gruppierung der Module (Navigation „Mehr“, Workbench). */
export const AREAS = ['Tag & Organisation', 'Finanzen', 'Gesundheit', 'Wissen & Inhalte', 'Business', 'Umgebung', 'System'];
const AREA_BY_MODULE = { home: 'Tag & Organisation', calendar: 'Tag & Organisation', tasks: 'Tag & Organisation', habits: 'Tag & Organisation', goals: 'Tag & Organisation',
  finance: 'Finanzen', savings: 'Finanzen', trading: 'Finanzen', fitness: 'Gesundheit', nutrition: 'Gesundheit',
  notes: 'Wissen & Inhalte', knowledge: 'Wissen & Inhalte', 'picture-to-text': 'Wissen & Inhalte', documents: 'Wissen & Inhalte',
  sales: 'Business', weather: 'Umgebung', settings: 'System' };
export const areaOf = (m) => m.area || AREA_BY_MODULE[m.id] || 'Weitere';
