// ============================================================================
// PROZESS-KERN – Entscheiden ohne Endlosschleifen (rein, auch von Node nutzbar).
//  * Entscheidungs-Inbox: Rangfolge nach Blockierwirkung × Reversibilität × Alter
//  * Gates: Definition of Ready / Done je Ebene (App · Modul · Feature)
//  * Design-Tiefe (Tier 1–3): wie viel Entscheidungsaufwand ein Feature verdient
//  * Rundenlimit: nach 2 Runden nur noch entscheiden, Empfehlung übernehmen oder parken
// ============================================================================
import { releaseChecklist } from './versioning.js';

export const MAX_ROUNDS = 2;
export const REVERSIBILITY = [
  { id: 'leicht', label: 'leicht umkehrbar', weight: 1 },
  { id: 'aufwendig', label: 'aufwendig umkehrbar', weight: 2 },
  { id: 'unumkehrbar', label: 'praktisch unumkehrbar', weight: 3 },
];
export const DECISION_LEVELS = [
  { id: 'app', label: 'App' }, { id: 'pattern', label: 'Muster (App-weit)' }, { id: 'module', label: 'Modul' }, { id: 'feature', label: 'Feature' }, { id: 'component', label: 'Komponente' },
];
export const levelLabel = (id) => DECISION_LEVELS.find((l) => l.id === id)?.label || id;

// ------------------------------------------------------------ Design-Tiefe ---
export const TIERS = [
  { id: 1, label: 'Tier 1 – täglich/kritisch', hint: 'Bis zu 3 Varianten, Ablauf, Gerätetest, Scorecard' },
  { id: 2, label: 'Tier 2 – regelmäßig', hint: '2 Varianten, Scorecard light' },
  { id: 3, label: 'Tier 3 – selten/Standard', hint: 'Standardmuster der Richtung, Freigabe nach Stichprobe' },
];
/** Tier eines Features: explizit gesetzt, sonst Heuristik (Startseiten & Erfassen = 1, mit Varianten = 2, sonst 3). */
export function tierOf(f) {
  if (f.tier) return f.tier;
  if (/\.(home|today|session|log|quickadd|capture|overview)$/.test(f.id) || /Übersicht/i.test(f.group)) return 1;
  return f.variants?.length ? 2 : 3;
}

// -------------------------------------------------------- Entscheidungs-Inbox ---
const DAY = 86400000;
/** Wie viele Features hängen an dieser Entscheidung? */
export function blocking(state, d) {
  const active = state.features.filter((f) => !f.archived);
  if (d.level === 'app' || d.level === 'pattern') return active.length;
  if (d.level === 'module') return active.filter((f) => f.moduleId === d.moduleId).length;
  if (d.level === 'component') return active.filter((f) => f.variants.some((v) => v.blocks.some((b) => b.component === d.componentId))).length || 1;
  return 1 + active.filter((f) => (f.links || []).includes(d.featureId)).length;
}
/** Fällige Wiedervorlage? (Datum erreicht oder Auslöser erfüllt) */
export function revisitDue(state, d, now = new Date()) {
  if (d.status !== 'parked') return false;
  if (d.revisitAt && new Date(d.revisitAt) <= now) return true;
  if (d.revisitIf === 'nach Phase 1' && state.app?.phase1Done) return true;
  if (d.revisitIf?.startsWith('nach Gerätetest') && d.featureId && state.features.find((f) => f.id === d.featureId)?.realDevice) return true;
  return false;
}
/** Rangfolge offener (und fällig geparkter) Entscheidungen. */
export function rankDecisions(state, now = new Date()) {
  return state.decisions
    .filter((d) => d.status === 'open' || revisitDue(state, d, now))
    .map((d) => {
      const b = blocking(state, d);
      const rev = REVERSIBILITY.find((r) => r.id === d.reversibility)?.weight || 1;
      const ageDays = Math.max(0, (now - new Date(d.createdAt)) / DAY);
      const score = b * rev * (1 + Math.min(ageDays, 60) / 30) * (d.level === 'app' ? 1.5 : 1);
      return { d, score: Math.round(score * 10) / 10, blocks: b, reason: `blockiert ${b} Feature${b === 1 ? '' : 's'} · ${REVERSIBILITY.find((r) => r.id === d.reversibility)?.label || 'Reversibilität offen'}${revisitDue(state, d, now) ? ' · Wiedervorlage fällig' : ''}` };
    })
    .sort((a, b) => b.score - a.score);
}

// ------------------------------------------------------------------- Gates ---
const ok = (id, label, pass, detail = '') => ({ id, label, ok: !!pass, detail });

export function featureReady(state, f) {
  const must = f.requirements.filter((r) => r.priority === 'must');
  const parentOpen = !state.app?.directionId;
  return [
    ok('purpose', 'Zweck beschrieben', (f.purpose || '').trim().length >= 20),
    ok('must', 'Mindestens 3 Muss-Anforderungen', must.length >= 3, `${must.length} Muss`),
    ok('acceptance', 'Akzeptanzkriterien vorhanden', (f.acceptance || []).length >= 1, `${(f.acceptance || []).length} Kriterien`),
    ok('interactions', 'Interaktionen beschrieben', f.interactions.length >= 1, `${f.interactions.length}`),
    ok('tier', 'Design-Tiefe festgelegt', !!f.tier, `Tier ${tierOf(f)}${f.tier ? '' : ' (geschätzt)'}`),
    ok('parent', 'App-Richtung entschieden (sonst „vorläufig“)', !parentOpen, parentOpen ? 'App-Richtung offen' : ''),
  ];
}

export function featureDone(state, f) {
  const base = releaseChecklist(f, state.qa.latest[f.id]).map((c) => ok(c.id, c.label, c.ok, c.detail));
  const tier = tierOf(f);
  const openFeedback = (state.feedback || []).filter((e) => e.target === f.id && e.choose && (!e.status || e.status === 'neu')).length;
  const pinsOpen = (state.pins || []).filter((p) => p.featureId === f.id && p.status === 'offen' && p.severity === 'muss').length;
  return [
    ...base,
    ok('device', 'Gerätetest (Pflicht bei Tier 1)', tier !== 1 || !!f.realDevice?.ok, tier === 1 ? (f.realDevice ? (f.realDevice.ok ? 'bestanden' : 'Mängel') : 'ausstehend') : 'nicht nötig'),
    ok('pins', 'Keine offenen Muss-Anmerkungen', pinsOpen === 0, `${pinsOpen} offen`),
    ok('feedback', 'Übernahme-Wünsche aus dem Launcher gesichtet', openFeedback === 0, `${openFeedback} offen`),
  ];
}

export function moduleDone(state, m) {
  const fs = state.features.filter((f) => f.moduleId === m.id && !f.archived);
  const t1 = fs.filter((f) => tierOf(f) === 1);
  const rel = (f) => ['released', 'implemented', 'regression_ok'].includes(f.status);
  return [
    ok('home', 'Modul-Startseite festgelegt', !!m.homeFeatureId || fs.some((f) => /\.home$/.test(f.id))),
    ok('direction', 'Richtung entschieden (Modul oder geerbt)', !!(m.directionId || state.app?.directionId)),
    ok('tier1', 'Alle Tier-1-Features freigegeben', t1.length > 0 && t1.every(rel), `${t1.filter(rel).length}/${t1.length}`),
    ok('assumption', 'Annahmen geprüft (Phase 1)', !/verifizieren|Annahme/i.test(m.source || '') || m.assumptionStatus === 'bestätigt', m.assumptionStatus || 'offen'),
    ok('device', 'Gerätetest-Meilenstein (erste Freigabe)', fs.some((f) => f.realDevice?.ok), ''),
  ];
}

export function appDone(state) {
  const patterns = state.decisions.filter((d) => d.level === 'pattern');
  const basics = state.decisions.filter((d) => d.level === 'app' && String(d.id).startsWith('app-') && d.status !== 'superseded');
  return [
    ok('direction', 'App-Richtung entschieden', !!state.app?.directionId),
    ok('vision', 'Leitbild (Vision, Kontexte, Prinzipien) gepflegt', !!(state.app?.vision && (state.app?.principles || []).length >= 3)),
    ok('patterns', 'App-weite Muster entschieden', patterns.length > 0 && patterns.every((d) => d.status === 'decided'), `${patterns.filter((d) => d.status === 'decided').length}/${patterns.length}`),
    ok('basics', 'Grundsatzfragen entschieden oder bewusst geparkt', basics.every((d) => d.status === 'decided' || d.status === 'parked'), `${basics.filter((d) => d.status !== 'open').length}/${basics.length}`),
    ok('nav', 'Navigation & Favoriten festgelegt', (state.app?.favorites || []).length >= 3),
    ok('phase1', 'Phase 1 (Abgleich mit echtem TAKT) abgeschlossen', !!state.app?.phase1Done),
  ];
}
export const gateSummary = (checks) => ({ passed: checks.filter((c) => c.ok).length, total: checks.length, ok: checks.every((c) => c.ok) });

// --------------------------------------------------------------- Scorecard ---
export const SCORE_CRITERIA = [
  { id: 'schnelligkeit', label: 'Schnelligkeit', hint: 'Wie schnell erreicht man das häufigste Ziel? (Tipps, Wege)' },
  { id: 'lesbarkeit', label: 'Lesbarkeit', hint: 'Hierarchie, Kontrast, Schriftgrößen, Ruhe' },
  { id: 'ueberblick', label: 'Überblick', hint: 'Sieht man das Wichtige auf einen Blick?' },
  { id: 'optik', label: 'Optik', hint: 'Wirkung, Konsistenz mit der Richtung' },
  { id: 'aufwand', label: 'Umsetzungsaufwand', hint: '5 = gering (wenige, vorhandene Komponenten), 1 = hoch' },
];
/** Gewichteter Score (0–5) einer Variante aus manuellen Bewertungen; null, wenn nichts bewertet. */
export function weightedScore(state, featureId, variantId) {
  const sc = state.scores?.[featureId]?.[variantId]; if (!sc) return null;
  const w = state.app?.weights || {};
  let sum = 0, wsum = 0;
  for (const c of SCORE_CRITERIA) { const v = sc[c.id]; if (v == null) continue; const wt = w[c.id] ?? 1; sum += v * wt; wsum += wt; }
  return wsum ? Math.round((sum / wsum) * 10) / 10 : null;
}
export const ASSUMPTION_STATES = [
  { id: 'offen', label: 'Offen – noch nicht mit echtem TAKT abgeglichen', tone: 'warning' },
  { id: 'bestätigt', label: 'Bestätigt – entspricht dem echten Projekt', tone: 'success' },
  { id: 'abweichend', label: 'Abweichend – Seed muss angepasst werden', tone: 'danger' },
  { id: 'neu', label: 'Neu – bewusst neues Modul für V2.0', tone: 'info' },
];
