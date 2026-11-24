// ============================================================================
// SPEZIFIKATION – Umsetzungsvorlage (Markdown) je Feature und je Modul.
// Quelle: freigegebener Snapshot (falls vorhanden) oder Arbeitsstand.
// Gedacht für die Umsetzung im Flutter-Projekt (z. B. durch Claude Code).
// getComponent wird übergeben, damit das Modul browser-/node-neutral bleibt.
// ============================================================================
import { statusInfo } from './schema.js';
import { LAYOUT_FLUTTER, REGION_FLUTTER, flutterHintFor } from './flutter.js';
import { navigationRules } from './directions.js';

const esc = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const typeLabel = { info: 'Information', action: 'Aktion', state: 'Zustand', rule: 'Regel' };
const prioLabel = { must: 'Muss', should: 'Soll', could: 'Kann' };

function shapeOf(value, depth = 0) {
  if (Array.isArray(value)) return value.length ? `Liste (${value.length}) von ${shapeOf(value[0], depth + 1)}` : 'leere Liste';
  if (value && typeof value === 'object') {
    if (depth > 1) return 'Objekt';
    return `{ ${Object.entries(value).slice(0, 14).map(([k, v]) => `${k}: ${Array.isArray(v) ? 'Liste' : v === null ? 'null' : typeof v}`).join(', ')} }`;
  }
  return typeof value;
}

export function featureSpecMarkdown(state, featureId, { getComponent, source = 'auto' } = {}) {
  const f = state.features.find((x) => x.id === featureId); if (!f) return '';
  const m = state.modules.find((x) => x.id === f.moduleId);
  const rel = f.releasedVersionId && state.versions.find((v) => v.id === f.releasedVersionId);
  const useRel = source === 'release' || (source === 'auto' && rel && f.locked);
  const snap = useRel && rel ? { ...f, ...rel.snapshot } : f;
  const variant = snap.variants.find((v) => v.id === snap.selectedVariantId) || snap.variants[0];
  const decisions = state.decisions.filter((d) => d.featureId === f.id && d.status !== 'superseded');
  const qa = state.qa.latest[f.id];
  const nav = navigationRules(snap);
  const L = [];
  L.push(`# ${m?.name || f.moduleId} › ${f.name}`, '');
  L.push(`| Feld | Wert |`, '|---|---|');
  L.push(`| Feature-ID | \`${f.id}\` |`, `| Modul | ${m?.name} (\`${f.moduleId}\`) |`, `| Gruppe | ${f.group} |`, `| Status | ${statusInfo(f.status).label} |`);
  L.push(`| Stand | ${useRel ? `**Freigabe v${rel.version}** vom ${new Date(rel.createdAt).toLocaleDateString('de-DE')}` : `Arbeitsstand v${f.version} (nicht freigegeben)`} |`);
  L.push(`| Variante | ${variant ? `${variant.id} – ${variant.name}${variant.direction ? ` (Richtung ${variant.direction})` : ''}` : '–'} |`, `| Ziel-Viewports | ${snap.viewports.join(', ')} |`, `| Zustände | ${snap.states.join(', ')} |`, '');
  L.push('## Zweck', '', snap.purpose || '_nicht beschrieben_', '');
  L.push('## Anforderungen', '');
  if (!snap.requirements.length) L.push('_keine_');
  else { L.push('| # | Typ | Prio | Anforderung |', '|---|---|---|---|'); snap.requirements.forEach((r, i) => L.push(`| ${i + 1} | ${typeLabel[r.type] || r.type} | ${prioLabel[r.priority] || r.priority} | ${esc(r.text)} |`)); }
  L.push('');
  if ((f.acceptance || []).length) { L.push('## Akzeptanzkriterien', '', ...f.acceptance.map((a) => `- [ ] ${a}`), ''); }
  L.push('## Interaktionen', '');
  if (!snap.interactions.length) L.push('_keine_');
  else { L.push('| Auslöser | Ergebnis | Event | Navigiert zu |', '|---|---|---|---|'); for (const i of snap.interactions) L.push(`| ${esc(i.trigger)} | ${esc(i.result)} | \`${i.event || '–'}\` | ${i.to ? `\`${i.to}\`` : '–'} |`); }
  L.push('');
  if ((f.flows || []).length) { L.push('## Abläufe', ''); for (const fl of f.flows) { L.push(`**${fl.name}**`, ...fl.steps.map((s, i) => `${i + 1}. \`${s.featureId}\` – ${s.action}`), ''); } }
  if (variant) {
    L.push('## Layout', '', `**${variant.layout?.type || 'stack'}** – ${LAYOUT_FLUTTER[variant.layout?.type || 'stack']}`, '');
    if (variant.concept) L.push(`> ${variant.concept}`, '');
    L.push('## Aufbau (Blöcke in Reihenfolge)', '', '| # | Region | Komponente | Wichtige Eigenschaften | Daten | Sichtbarkeit | Flutter |', '|---|---|---|---|---|---|---|');
    variant.blocks.forEach((b, i) => {
      const def = getComponent ? getComponent(b.component) : null;
      const props = Object.entries(b.props || {}).filter(([, v]) => v !== '' && v != null).map(([k, v]) => `${k}=${Array.isArray(v) ? v.join('/') : v}`).join('; ');
      const bind = Object.entries(b.bind || {}).map(([s, k]) => `${s}←${k}`).join(', ');
      L.push(`| ${i + 1} | ${REGION_FLUTTER[b.region || 'main']?.split(' ')[0] || b.region} | ${def?.name || b.component} (\`${b.component}\`${def?.version ? ` v${def.version}` : ''}) | ${esc(props) || '–'} | ${bind || '–'} | ${(b.hideOn || []).length ? `ausgeblendet: ${b.hideOn.join(', ')}` : 'immer'}${b.span ? ` · ${b.span}/12` : ''} | ${esc(flutterHintFor(def || { id: b.component }))} |`);
    });
    L.push('');
    const comps = [...new Set(variant.blocks.map((b) => b.component))].map((id) => getComponent && getComponent(id)).filter(Boolean);
    if (comps.length) {
      L.push('## Verwendete Komponenten', '');
      for (const c of comps) L.push(`- **${c.name}** (\`${c.id}\` v${c.version || '1.0'}): ${c.description}${(c.events || []).length ? ` Events: ${c.events.map((e) => `\`${e}\``).join(', ')}.` : ''}`);
      L.push('');
    }
  }
  L.push('## Datenmodell (aus Demo-Daten abgeleitet)', '');
  const dd = snap.demoData || {};
  if (!Object.keys(dd).length) L.push('_keine Demo-Daten_');
  else { L.push('| Schlüssel | Struktur |', '|---|---|'); for (const [k, v] of Object.entries(dd)) L.push(`| \`${k}\` | ${esc(shapeOf(v))} |`); }
  L.push('');
  if (nav.length) { L.push('## Navigation', '', ...nav.map((n) => `- \`${n.event}\` → \`${n.to}\`${n.label ? ` (${n.label})` : ''}`), ''); }
  L.push('## Entscheidungen', '');
  if (!decisions.length) L.push('_keine dokumentiert_');
  for (const d of decisions) L.push(`- **${d.title}** (${d.status === 'decided' ? 'entschieden' : 'offen'}): ${d.decision || ''}${d.rationale ? ` – Begründung: ${d.rationale}` : ''}${d.tradeoffs ? ` – Akzeptierte Nachteile: ${d.tradeoffs}` : ''}`);
  L.push('', '## Qualität', '');
  const relQa = useRel && rel?.qa;
  if (relQa) L.push(`QA bei Freigabe: **${relQa.status}** (${relQa.results.length} Prüfungen: ${[...new Set(relQa.results.map((r) => r.viewport))].join(', ')})`);
  else if (qa) L.push(`Letzte QA: **${qa.status}** am ${new Date(qa.ts).toLocaleString('de-DE')} (${qa.results.length} Prüfungen)`);
  else L.push('_noch nicht geprüft_');
  if (f.realDevice) L.push(`Gerätetest: ${f.realDevice.ok ? 'bestanden' : 'Mängel'} – ${f.realDevice.note || ''}`);
  L.push('', '## Umsetzungshinweise (Flutter)', '',
    '- Farben/Abstände/Radien ausschließlich aus `takt_tokens.dart` (Export: Workbench › Daten & Backup › Flutter-Tokens).',
    '- Breakpoints: Mobile < 600, Tablet 600–1023, Desktop ≥ 1024 (`TaktBreakpoint`). Touch-Ziele ≥ 44 dp.',
    '- Alle Zustände umsetzen: Standard, Leer (mit Handlungsaufforderung), Lädt (Skeleton), Fehler (mit „Erneut versuchen“).',
    '- Texte deutsch, Zahlen/Datum mit `intl` (de_DE). Interaktions-Events als Analytics-/Test-Schlüssel übernehmen.',
    `- Referenz-Screenshots: \`qa/baselines/${f.id}/\` der Workbench.`, '');
  return L.join('\n');
}

export function moduleSpecMarkdown(state, moduleId, opts) {
  const m = state.modules.find((x) => x.id === moduleId); if (!m) return '';
  const fs = state.features.filter((f) => f.moduleId === moduleId && !f.archived).sort((a, b) => a.order - b.order);
  const L = [`# Modul ${m.name} – Spezifikation`, '', m.description || '', '', '## Informationsarchitektur', '', m.infoArchitecture || '_offen_', ''];
  L.push('## Features', '', '| Feature | Gruppe | Status | Variante |', '|---|---|---|---|');
  for (const f of fs) L.push(`| ${f.name} (\`${f.id}\`) | ${f.group} | ${statusInfo(f.status).label} | ${f.variants.find((v) => v.id === f.selectedVariantId)?.name || '–'} |`);
  L.push('', '---', '');
  for (const f of fs) L.push(featureSpecMarkdown(state, f.id, opts), '', '---', '');
  return L.join('\n');
}
