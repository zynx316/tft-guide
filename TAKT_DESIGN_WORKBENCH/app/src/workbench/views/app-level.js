// ============================================================================
// EBENE 0 · APP – Leitbild, App-weite Muster (Pflichtfragen), Gates, Annahmen
// und die Entscheidungs-Inbox. Hier entsteht der Rahmen, an dem sich alle
// Module und Features messen lassen.
// ============================================================================
import { html } from '../../lib/html.js';
import { useState } from 'preact/hooks';
import { Icon } from '../../lib/icons.js';
import { Card, Btn, Badge, Empty, Tabs, Select, Field, TextInput, Checkbox, Kpi } from '../ui/kit.js';
import { act, DecisionRow } from './common.js';
import { actions } from '../store.js';
import { rankDecisions, appDone, moduleDone, featureReady, featureDone, gateSummary, tierOf, TIERS, SCORE_CRITERIA, ASSUMPTION_STATES, MAX_ROUNDS } from '../../core/process.js';
import { navigate, moduleHref, featureHref } from '../router.js';
import { newRoundDialog } from './rounds.js';
import { cx } from '../../lib/util.js';

const TABS = [
  { value: 'leitbild', label: 'Leitbild', icon: 'target' }, { value: 'inbox', label: 'Inbox', icon: 'inbox' }, { value: 'muster', label: 'App-weite Muster', icon: 'scale' },
  { value: 'gates', label: 'Gates & Fortschritt', icon: 'clipboard-check' }, { value: 'annahmen', label: 'Annahmen', icon: 'flag' },
];

export const GateList = ({ checks }) => html`<ul class="wb-gates">${checks.map((c) => html`<li class=${cx('wb-gate', c.ok ? 'is-ok' : 'is-open')} data-gate=${c.id}>
  <span class="wb-gate__icon"><${Icon} name=${c.ok ? 'check' : 'circle'} size=${14} /></span><span class="wb-grow">${c.label}</span>${c.detail && html`<span class="wb-small wb-muted">${c.detail}</span>`}</li>`)}</ul>`;

export const GateBadge = ({ checks, label }) => { const g = gateSummary(checks); return html`<${Badge} tone=${g.ok ? 'success' : g.passed / g.total >= 0.6 ? 'warning' : null} sq title=${checks.filter((c) => !c.ok).map((c) => `offen: ${c.label}`).join('\n') || 'alle erfüllt'}>${label ? `${label} ` : ''}${g.passed}/${g.total}<//>`; };

const lines = (arr) => (arr || []).join('\n');
const unlines = (s) => s.split('\n').map((x) => x.trim()).filter(Boolean);

function Leitbild({ state }) {
  const a = state.app;
  const mods = state.modules.filter((m) => !m.archived).sort((x, y) => x.order - y.order);
  return html`<div class="wb-grid" style="grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);align-items:start">
    <div class="wb-col" style="gap:12px">
      <${Card} title="Vision" icon="target" sub="Ein Satz, an dem sich jede Variante messen lässt.">
        <${TextInput} multiline rows=${3} value=${a.vision || ''} onCommit=${(v) => act(() => actions.setAppSetting({ vision: v }, 'Vision bearbeitet'))} data-qa="app-vision" /><//>
      <${Card} title="Nutzungskontexte" sub="Wann und wie wird TAKT benutzt? (eine Zeile je Kontext)">
        <${TextInput} multiline rows=${4} value=${lines(a.contexts)} onCommit=${(v) => act(() => actions.setAppSetting({ contexts: unlines(v) }, 'Kontexte bearbeitet'))} /><//>
      <${Card} title="Prinzipien" sub="Prüfbare Leitsätze – Grundlage für Reviews und Scorecards (mind. 3).">
        <${TextInput} multiline rows=${5} value=${lines(a.principles)} onCommit=${(v) => act(() => actions.setAppSetting({ principles: unlines(v) }, 'Prinzipien bearbeitet'))} /><//>
      <${Card} title="Bewusst nicht (Nicht-Ziele)" sub="Was TAKT V2.0 ausdrücklich nicht wird.">
        <${TextInput} multiline rows=${3} value=${lines(a.nonGoals)} onCommit=${(v) => act(() => actions.setAppSetting({ nonGoals: unlines(v) }, 'Nicht-Ziele bearbeitet'))} /><//>
    </div>
    <div class="wb-col" style="gap:12px">
      <${Card} title="Bewertungsgewichte" icon="scale" sub="Gewichtung der Scorecard beim Variantenvergleich (0 = egal, 3 = entscheidend).">
        <div class="wb-col" style="gap:8px">${SCORE_CRITERIA.map((c) => html`<div class="wb-row"><span class="wb-grow" title=${c.hint}>${c.label}</span>
          <${Select} size="sm" style="width:auto" value=${String(a.weights?.[c.id] ?? 1)} onChange=${(v) => act(() => actions.setAppSetting({ weights: { ...a.weights, [c.id]: Number(v) } }, 'Gewichte bearbeitet'))} options=${['0', '1', '2', '3'].map((x) => ({ value: x, label: x }))} aria-label=${`Gewicht ${c.label}`} /></div>`)}</div><//>
      <${Card} title="Favoriten der Navigation" icon="star" sub="Bis zu 4 Module in der unteren Leiste, der Rest unter „Mehr“.">
        <div class="wb-col" style="gap:4px">${mods.map((m) => { const on = (a.favorites || []).includes(m.id); return html`<${Checkbox} checked=${on} label=${m.name} disabled=${!on && (a.favorites || []).length >= 4}
          onChange=${(v) => act(() => actions.setAppSetting({ favorites: v ? [...(a.favorites || []), m.id] : (a.favorites || []).filter((x) => x !== m.id) }, 'Favoriten geändert'))} />`; })}</div><//>
      <${Card} title="Phase 1 · Abgleich mit dem echten TAKT" icon="flag" sub="Erst wenn Module und Features mit dem Flutter-Projekt abgeglichen sind (/takt-phase1).">
        <${Checkbox} checked=${!!a.phase1Done} label="Phase 1 abgeschlossen" onChange=${(v) => act(() => actions.setAppSetting({ phase1Done: v }, v ? 'Phase 1 abgeschlossen' : 'Phase 1 wieder offen'))} /><//>
    </div></div>`;
}

function Inbox({ state }) {
  const ranked = rankDecisions(state);
  return html`<${Card} title=${`Entscheidungs-Inbox (${ranked.length})`} icon="inbox" sub="Sortiert nach Blockierwirkung × Reversibilität × Alter. Oben steht, was am meisten aufhält."
    actions=${html`<${Btn} size="sm" variant="primary" icon="play" disabled=${!ranked.length} onClick=${() => newRoundDialog(state, 'app')}>Runde starten<//>`}>
    ${!ranked.length ? html`<${Empty} icon="check-check" title="Nichts offen" text="Alle Fragen sind entschieden oder geparkt." />`
      : html`<div class="wb-col" style="gap:0;margin:-8px -16px -16px" data-qa="inbox">${ranked.map((x) => html`<${DecisionRow} d=${x.d} state=${state} reason=${`${x.reason} · Score ${x.score}`} />`)}</div>`}<//>`;
}

function Patterns({ state }) {
  const ps = state.decisions.filter((d) => d.level === 'pattern');
  const done = ps.filter((d) => d.status === 'decided').length;
  return html`<div class="wb-col" style="gap:12px">
    <${Card} pad><div class="wb-row wb-wrap" style="gap:12px"><div class="wb-grow"><strong>${done} von ${ps.length} App-weiten Mustern entschieden.</strong>
      <div class="wb-small wb-muted">Einmal entscheiden, überall anwenden: Navigation, Erfassen, Löschen, Formate, Datenschutz … Jede Frage hat eine vorbereitete, begründete Empfehlung. Rundenlimit: ${MAX_ROUNDS}.</div></div>
      <div class="wb-bar" style="width:160px"><span style=${`width:${ps.length ? (done / ps.length) * 100 : 0}%;background:var(--wb-success)`}></span></div>
      <${Btn} variant="primary" icon="play" onClick=${() => newRoundDialog(state, 'app')} data-qa="pattern-round">In einer Runde entscheiden<//></div><//>
    <${Card}><div class="wb-col" style="gap:0;margin:-8px -16px -16px">${ps.map((d) => html`<${DecisionRow} d=${d} state=${state} reason=${d.status === 'open' && d.recommendation ? `Empfehlung: ${d.options.find((o) => o.id === d.recommendation.optionId)?.label}` : ''} />`)}</div><//></div>`;
}

function Gates({ state }) {
  const mods = state.modules.filter((m) => !m.archived).sort((a, b) => a.order - b.order);
  return html`<div class="wb-col" style="gap:12px">
    <${Card} title="Gate · App (Ebene 0)" icon="smartphone" sub="Erst wenn diese Punkte erfüllt sind, lohnt sich Feinarbeit an Features."><${GateList} checks=${appDone(state)} /><//>
    <${Card} title="Gates je Modul (Ebene 1) und Feature (Ebene 2)" icon="boxes">
      <div style="overflow-x:auto"><table class="wb-table"><thead><tr><th>Modul</th><th>Modul fertig</th><th>Features bereit (DoR)</th><th>Features fertig (DoD)</th><th>Tier 1 / 2 / 3</th></tr></thead><tbody>
      ${mods.map((m) => { const fs = state.features.filter((f) => f.moduleId === m.id && !f.archived);
        const ready = fs.filter((f) => gateSummary(featureReady(state, f)).ok).length; const done = fs.filter((f) => gateSummary(featureDone(state, f)).ok).length;
        const t = [1, 2, 3].map((n) => fs.filter((f) => tierOf(f) === n).length);
        return html`<tr class="is-click" onClick=${() => navigate(moduleHref(m.id))}><td><span class="wb-row" style="gap:6px"><${Icon} name=${m.icon} size=${15} /><strong>${m.name}</strong></span></td>
          <td><${GateBadge} checks=${moduleDone(state, m)} /></td><td class="wb-num">${ready}/${fs.length}</td><td class="wb-num">${done}/${fs.length}</td><td class="wb-num wb-small">${t.join(' / ')}</td></tr>`; })}</tbody></table></div><//>
    <${Card} title="Design-Tiefe" icon="gauge" sub="Nicht jedes Feature verdient drei Varianten.">${TIERS.map((t) => html`<div class="wb-row wb-small" style="padding:4px 0"><${Badge} sq>${t.label}<//><span class="wb-muted">${t.hint}</span></div>`)}<//></div>`;
}

function Assumptions({ state }) {
  const mods = state.modules.filter((m) => !m.archived).sort((a, b) => a.order - b.order);
  const assumedDecisions = state.decisions.filter((d) => d.assumption && d.status !== 'superseded');
  return html`<div class="wb-col" style="gap:12px">
    <${Card} title="Annahmen-Register (Module)" icon="flag" sub="Inhalte, die aus Recherche statt aus dem echten TAKT-Projekt stammen. Vor Feinarbeit in Phase 1 bestätigen oder korrigieren.">
      <div style="overflow-x:auto"><table class="wb-table"><thead><tr><th>Modul</th><th>Quelle</th><th>Status</th><th>Notiz</th></tr></thead><tbody>
      ${mods.map((m) => html`<tr><td><a href=${moduleHref(m.id)}><strong>${m.name}</strong></a></td><td class="wb-small wb-muted" style="max-width:280px">${m.source || '–'}</td>
        <td><${Select} size="sm" style="width:auto" value=${m.assumptionStatus || 'offen'} onChange=${(v) => act(() => actions.setAssumption(m.id, v, m.assumptionNote || ''))} options=${ASSUMPTION_STATES.map((s) => ({ value: s.id, label: s.id }))} aria-label=${`Annahme ${m.name}`} /></td>
        <td><${TextInput} size="sm" value=${m.assumptionNote || ''} placeholder="z. B. Feature X fehlt im echten Projekt" onCommit=${(v) => act(() => actions.setAssumption(m.id, m.assumptionStatus || 'offen', v))} /></td></tr>`)}</tbody></table></div>
      <div class="wb-small wb-muted" style="margin-top:8px">${ASSUMPTION_STATES.map((s) => html`<div><${Badge} tone=${s.tone} sq>${s.id}<//> ${s.label.split('–')[1]}</div>`)}</div><//>
    <${Card} title=${`Als Annahme markierte Entscheidungen (${assumedDecisions.length})`}>${assumedDecisions.length ? html`<div class="wb-col" style="gap:0;margin:-8px -16px -16px">${assumedDecisions.map((d) => html`<${DecisionRow} d=${d} state=${state} />`)}</div>` : html`<${Empty} title="Keine" text="Im Entscheidungsdialog „Annahme“ ankreuzen, wenn eine Entscheidung auf ungeprüften Annahmen beruht." />`}<//></div>`;
}

export function AppLevelView({ state, tab }) {
  const ranked = rankDecisions(state);
  const g = gateSummary(appDone(state));
  const ps = state.decisions.filter((d) => d.level === 'pattern');
  const dir = state.directions.find((d) => d.id === state.app.directionId);
  return html`<div class="wb-page">
    <div><div class="wb-label">Ebene 0</div><h1 class="wb-h1">App-Ebene</h1><p class="wb-muted" style="margin-top:4px">Leitbild, App-weite Muster und Gates. Was hier entschieden ist, muss in keinem Modul neu diskutiert werden.</p></div>
    <div class="wb-grid wb-grid-4">
      <${Kpi} label="App-Richtung" value=${dir ? dir.name : 'offen'} icon="compass" tone=${dir ? 'success' : 'warning'} onClick=${() => navigate('#/decide')} />
      <${Kpi} label="Muster entschieden" value=${`${ps.filter((d) => d.status === 'decided').length}/${ps.length}`} icon="scale" onClick=${() => navigate('#/app/muster')} />
      <${Kpi} label="Offene Fragen (Inbox)" value=${ranked.length} icon="inbox" tone=${ranked.length ? 'warning' : 'success'} onClick=${() => navigate('#/app/inbox')} />
      <${Kpi} label="App-Gate" value=${`${g.passed}/${g.total}`} icon="clipboard-check" tone=${g.ok ? 'success' : null} onClick=${() => navigate('#/app/gates')} />
    </div>
    <${Tabs} value=${tab} onChange=${(t) => navigate(`#/app/${t}`)} options=${TABS} />
    ${tab === 'leitbild' ? html`<${Leitbild} state=${state} />` : tab === 'inbox' ? html`<${Inbox} state=${state} />` : tab === 'muster' ? html`<${Patterns} state=${state} />` : tab === 'gates' ? html`<${Gates} state=${state} />` : html`<${Assumptions} state=${state} />`}
  </div>`;
}
