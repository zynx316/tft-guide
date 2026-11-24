// ============================================================================
// ARBEITSAUFTRAG – macht aus Entscheidungen, Anmerkungen und Feedback einen
// abarbeitbaren Markdown-Auftrag für Claude Code (/takt-work-order).
// Rein (kein DOM), auch von Node aus nutzbar.
// ============================================================================
import { featureSpecMarkdown } from './spec.js';
import { levelLabel, rankDecisions, MAX_ROUNDS } from './process.js';

const day = (d) => (d ? new Date(d).toLocaleDateString('de-DE') : '–');
const featureName = (state, id) => state.features.find((f) => f.id === id)?.name || id;

function implementationHint(state, d) {
  if (d.kind === 'variant' && d.featureId) {
    return `Feature \`${d.featureId}\`: Variante **${d.chosen}** ist Arbeitsstand. Spezifikation unten bzw. Workbench › Feature › „Spezifikation (.md)“. In Flutter: Screen gemäß Blöcken/Komponenten der Variante umsetzen, Akzeptanzkriterien als Widget-Tests.`;
  }
  if (d.kind === 'app-direction') {
    const dir = (state.directions || []).find((x) => x.id === d.chosen);
    return `App-Richtung **${dir?.name || d.chosen}**: In der Workbench ist je Feature die Variante dieser Richtung bevorzugt. Features ohne passende Variante (Abdeckung im Demo-Launcher prüfen) bekommen eine Variante dieser Richtung. Flutter: Navigationsrahmen „${dir?.nav || 'bottom'}“, Theme „${dir?.theme || 'graphite'}“.`;
  }
  if (d.level === 'pattern') {
    return `App-weites Muster: Auswirkung – ${d.consequences || 'siehe Entscheidung'}. Alle betroffenen Komponenten/Varianten angleichen, in \`docs/DESIGN_SYSTEM.md\` (Abschnitt Muster) dokumentieren.`;
  }
  if (d.level === 'module' && d.moduleId) return `Modul \`${d.moduleId}\`: Entscheidung auf alle Features des Moduls anwenden.`;
  return d.featureId ? `Feature \`${d.featureId}\` anpassen.` : 'Umsetzen wie beschrieben.';
}

/**
 * @param {object} state Workbench-Zustand
 * @param {{roundId?:string, featureIds?:string[], since?:string, withSpecs?:boolean, getComponent?:Function}} opts
 */
export function workOrderMarkdown(state, { roundId = null, featureIds = null, since = null, withSpecs = true, getComponent } = {}) {
  const round = roundId ? state.rounds.find((r) => r.id === roundId) : null;
  const inScope = (d) => {
    if (round) return round.agenda.includes(d.id);
    if (featureIds) return featureIds.includes(d.featureId);
    if (since) return d.decidedAt && d.decidedAt >= since;
    return true;
  };
  const decided = state.decisions.filter((d) => d.status === 'decided' && inScope(d) && (round || featureIds || since || !d.implementedAt));
  const parked = state.decisions.filter((d) => d.status === 'parked' && inScope(d));
  const pins = (state.pins || []).filter((p) => p.status === 'offen' && (round ? p.roundId === round.id || round.agenda.includes(p.decisionId) : featureIds ? featureIds.includes(p.featureId) : true));
  const feedback = (state.feedback || []).filter((e) => (!e.status || e.status === 'neu') && (e.choose || e.comment) && (!featureIds || featureIds.includes(e.target)) && !round);
  const untreated = round ? round.agenda.filter((id) => !round.results.some((r) => r.decisionId === id)).map((id) => state.decisions.find((d) => d.id === id)).filter(Boolean) : [];
  const title = round ? `Entscheidungsrunde „${round.title}“ vom ${day(round.startedAt)}` : featureIds ? `Features ${featureIds.join(', ')}` : 'Gesamtstand';

  const L = [];
  L.push(`# Arbeitsauftrag – ${title}`, '');
  L.push(`> Erzeugt von der TAKT Design Workbench am ${day(new Date())}. Für Claude Code: \`/takt-work-order <diese Datei>\`.`);
  L.push('> Regeln: TAKT-Projekt nur lesen (nichts stagen/committen/pushen, keine produktiven Dart-Dateien ohne ausdrücklichen Auftrag). Freigegebene Features nur über „Neue Arbeitsversion“ ändern. Nach jeder Änderung `npm run check`, nach Komponenten-/Layoutänderungen `npm run qa:changed`.', '');

  L.push(`## 1. Entschieden – umsetzen (${decided.length})`, '');
  if (!decided.length) L.push('_Keine neuen Entscheidungen._', '');
  for (const d of decided) {
    const opt = d.options?.find((o) => o.id === d.chosen);
    L.push(`- [ ] **${d.title}** _(${levelLabel(d.level)}${d.featureId ? ` · ${featureName(state, d.featureId)}` : ''})_`);
    L.push(`  - Entscheidung: ${opt ? opt.label : d.decision || '–'}${d.decidedBy === 'Empfehlung übernommen' ? ' (Empfehlung übernommen)' : ''}`);
    if (d.rationale) L.push(`  - Begründung: ${d.rationale.replace(/\n/g, ' ')}`);
    if (d.tradeoffs) L.push(`  - Bewusst akzeptiert: ${d.tradeoffs.replace(/\n/g, ' ')}`);
    L.push(`  - Umsetzung: ${implementationHint(state, d)}`);
  }
  L.push('');

  L.push(`## 2. Änderungen nötig (${pins.length})`, '');
  if (!pins.length) L.push('_Keine offenen Anmerkungen._', '');
  for (const p of pins) {
    L.push(`- [ ] ${p.severity === 'muss' ? '**Muss**' : 'Soll'}: ${p.text}${p.featureId ? ` – Feature \`${p.featureId}\` (${featureName(state, p.featureId)})` : ''}${p.variantId ? `, Variante ${p.variantId}` : ''}${p.decisionId ? ` – zu Frage „${state.decisions.find((d) => d.id === p.decisionId)?.title || p.decisionId}“` : ''}`);
  }
  if (pins.some((p) => p.decisionId)) L.push('', `> Fragen mit „Änderung nötig“ kommen in die nächste Runde – dort nur noch entscheiden oder parken (Rundenlimit ${MAX_ROUNDS}).`);
  L.push('');

  if (feedback.length) {
    L.push(`## 3. Feedback aus dem Demo-Launcher (${feedback.length})`, '');
    for (const e of feedback.slice(0, 40)) L.push(`- [ ] ${e.choose ? `Übernahme-Wunsch: **${e.versionName || e.version || ''}**` : 'Kommentar'} für ${e.targetName ? `„${e.targetName}“ ` : ''}\`${e.target || 'app'}\`${e.rating ? ` · ${e.rating}★` : ''}${e.comment ? ` – „${e.comment}“` : ''}`);
    if (feedback.length > 40) L.push(`- … ${feedback.length - 40} weitere (Workbench › Demo & Entscheidung › Feedback)`);
    L.push('');
  }

  L.push(`## ${feedback.length ? 4 : 3}. Geparkt (${parked.length})`, '');
  if (!parked.length) L.push('_Nichts geparkt._');
  for (const d of parked) L.push(`- ${d.title} – Wiedervorlage ${d.revisitAt ? `am ${day(d.revisitAt)}` : d.revisitIf || 'offen'}`);
  L.push('');
  if (untreated.length) {
    L.push('## Nicht behandelt (nächste Runde)', '');
    for (const d of untreated) L.push(`- ${d.title} (${levelLabel(d.level)}, ${d.rounds || 0}. Runde)`);
    L.push('');
  }

  const next = rankDecisions(state).slice(0, 5);
  if (next.length) {
    L.push('## Als Nächstes entscheiden (Inbox, nach Blockierwirkung)', '');
    for (const x of next) L.push(`- ${x.d.title} – ${x.reason}`);
    L.push('');
  }

  L.push('## Prüfschritte', '', '- [ ] `npm run check`', '- [ ] `npm run qa:changed` (bzw. `npm run qa -- --feature <id>` je geändertem Feature)', '- [ ] Demo-Launcher: geänderte Features in allen Versionen durchklicken (`#/decide` › Demo-Launcher)', '- [ ] Entscheidungen in der Workbench als umgesetzt markieren, `WORK_LOG.md` ergänzen', '');

  if (withSpecs && getComponent) {
    const specFeatures = [...new Set(decided.filter((d) => d.kind === 'variant' && d.featureId).map((d) => d.featureId))].slice(0, 8);
    if (specFeatures.length) {
      L.push('---', '', '# Anhang: Spezifikationen der entschiedenen Features', '');
      for (const fid of specFeatures) {
        try { L.push(featureSpecMarkdown(state, fid, { getComponent, source: 'arbeitsstand' }).replace(/^# /m, '## '), ''); } catch (e) { L.push(`_Spezifikation für ${fid} nicht erzeugbar: ${e.message}_`, ''); }
      }
    }
  }
  return L.join('\n');
}
