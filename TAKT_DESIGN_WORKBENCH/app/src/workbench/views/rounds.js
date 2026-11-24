// ============================================================================
// ENTSCHEIDUNGSRUNDEN – zeitlich begrenzt entscheiden statt endlos vergleichen.
// Agenda aus offenen Entscheidungen (sortiert nach Blockierwirkung), Zeitbox,
// je Frage: Optionen (mit Live-Vorschau bei Varianten/Richtungen), Empfehlung,
// Entscheiden · Parken · „Änderung nötig“. Rundenlimit: ab Runde 2 nur noch
// entscheiden, Empfehlung übernehmen oder parken.
// ============================================================================
import { html } from '../../lib/html.js';
import { useState, useEffect, useMemo } from 'preact/hooks';
import { Icon } from '../../lib/icons.js';
import { Card, Btn, Badge, Empty, Select, Field, openDialog, toast } from '../ui/kit.js';
import { act, DecisionRow, decisionStatusLabel, decisionTone } from './common.js';
import { actions, getState } from '../store.js';
import { rankDecisions, MAX_ROUNDS, levelLabel } from '../../core/process.js';
import { buildFeaturePayload, buildAppPayload } from '../../core/preview-payload.js';
import { PreviewFrame } from '../ui/preview-frame.js';
import { navigate } from '../router.js';
import { fmt, cx, download } from '../../lib/util.js';
import { workOrderMarkdown } from '../../core/workorder.js';
import { getComponent } from '../../library/registry.js';

const SCOPES = (state) => [
  { value: 'app', label: 'App-Ebene (Richtung + Pflichtfragen)' },
  ...state.modules.filter((m) => !m.archived).sort((a, b) => a.order - b.order).map((m) => ({ value: `module:${m.id}`, label: `Modul: ${m.name}` })),
];

/** Legt fehlende offene Fragen für den Umfang an (App-Richtung bzw. Variantenfragen) – nicht während des Renderns aufrufen. */
function prepareScope(scope) {
  const state = getState();
  if (scope === 'app') { act(() => actions.ensureAppDirectionDecision()); return; }
  const mid = scope.slice(7);
  for (const f of state.features.filter((x) => x.moduleId === mid && !x.archived && !x.locked && x.variants.length > 1)) {
    if (!state.decisions.some((d) => d.featureId === f.id && d.kind === 'variant' && d.status === 'decided')) act(() => actions.ensureVariantDecision(f.id));
  }
}
function agendaFor(state, scope) {
  if (scope === 'app') return rankDecisions(state).filter((x) => x.d.level === 'app' || x.d.level === 'pattern').map((x) => x.d.id);
  const mid = scope.slice(7);
  return rankDecisions(state).filter((x) => x.d.moduleId === mid || state.features.find((f) => f.id === x.d.featureId)?.moduleId === mid).map((x) => x.d.id);
}

export function newRoundDialog(state, presetScope) {
  prepareScope(presetScope || 'app');
  openDialog({ title: 'Neue Entscheidungsrunde', size: 'wide', body: ({ close }) => {
    const [scope, setScope] = useState(presetScope || 'app');
    const [box, setBox] = useState(20);
    const [agenda, setAgenda] = useState(() => agendaFor(getState(), presetScope || 'app'));
    const [picked, setPicked] = useState(() => agenda.slice(0, 7));
    useEffect(() => { prepareScope(scope); const a = agendaFor(getState(), scope); setAgenda(a); setPicked(a.slice(0, 7)); }, [scope]);
    const st = getState();
    return html`<div class="wb-col" style="gap:12px">
      <p class="wb-muted">Eine Runde klärt 5–7 Fragen in einer festen Zeit. Jede Frage wird höchstens ${MAX_ROUNDS}× vorgelegt – danach nur noch entscheiden, Empfehlung übernehmen oder bewusst parken.</p>
      <div class="wb-grid wb-grid-2"><${Field} label="Umfang"><${Select} value=${scope} onChange=${setScope} options=${SCOPES(st)} /><//>
        <${Field} label="Zeitbox"><${Select} value=${String(box)} onChange=${(v) => setBox(Number(v))} options=${['10', '20', '30', '45'].map((x) => ({ value: x, label: `${x} Minuten` }))} /><//></div>
      <div class="wb-label">Agenda (${picked.length} ausgewählt, sortiert nach Blockierwirkung)</div>
      <div class="wb-card" style="max-height:320px;overflow:auto">${!agenda.length ? html`<${Empty} icon="check-check" title="Keine offenen Fragen in diesem Umfang" />` : agenda.map((id) => { const d = st.decisions.find((x) => x.id === id); if (!d) return null;
        return html`<label class="wb-listrow" style="cursor:pointer"><input type="checkbox" checked=${picked.includes(id)} onChange=${(e) => setPicked(e.currentTarget.checked ? [...picked, id] : picked.filter((x) => x !== id))} style="accent-color:var(--wb-accent)" />
          <${Badge} outline sq>${levelLabel(d.level)}<//><span class="wb-grow wb-trunc">${d.title}</span>${(d.rounds || 0) > 0 && html`<${Badge} tone=${d.rounds >= MAX_ROUNDS ? 'danger' : 'warning'} sq>${d.rounds}. Runde war<//>`}</label>`; })}</div>
      <div class="wb-row" style="justify-content:flex-end"><${Btn} onClick=${close}>Abbrechen<//><${Btn} variant="primary" icon="play" disabled=${!picked.length} data-confirm onClick=${() => {
        const title = scope === 'app' ? 'App-Ebene' : `Modul ${st.modules.find((m) => m.id === scope.slice(7))?.name}`;
        const id = act(() => actions.startRound({ title, level: scope === 'app' ? 'app' : 'module', scopeId: scope === 'app' ? 'app' : scope.slice(7), agenda: agenda.filter((x) => picked.includes(x)), timeboxMin: box }));
        close(); if (id) navigate(`#/rounds/${id}`); }}>Runde starten<//></div></div>`;
  } });
}

function Timer({ round }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const end = new Date(round.startedAt).getTime() + round.timeboxMin * 60000;
  const left = Math.round((end - now) / 1000);
  const over = left < 0; const mm = Math.floor(Math.abs(left) / 60), ss = Math.abs(left) % 60;
  return html`<span class=${cx('wb-badge', over ? 'wb-badge--danger' : left < 120 ? 'wb-badge--warning' : 'wb-badge--accent')} style="font-size:14px;height:28px;padding:0 12px" data-qa="round-timer">
    <${Icon} name="timer" size=${14} />${over ? '+' : ''}${mm}:${String(ss).padStart(2, '0')}${over ? ' über Zeit' : ''}</span>`;
}

function OptionPreview({ state, option }) {
  const payload = useMemo(() => {
    try {
      if (option.ref?.featureId) return buildFeaturePayload(state, option.ref.featureId, option.ref.variantId, { theme: state.settings.previewTheme });
      if (option.ref?.directionId) return buildAppPayload(state, `dir:${option.ref.directionId}`, {});
    } catch { return null; }
    return null;
  }, [option.id]);
  if (!payload) return null;
  return html`<div class="wb-canvas" style="border-radius:10px;padding:10px 4px;margin-top:8px"><${PreviewFrame} payload=${payload} device="mobile" maxHeight=${360} showMeta=${false} /></div>`;
}

function RoundRunner({ state, round }) {
  const [idx, setIdx] = useState(() => Math.max(0, round.agenda.findIndex((id) => !round.results.some((r) => r.decisionId === id))));
  const [choice, setChoice] = useState(null); const [why, setWhy] = useState(''); const [note, setNote] = useState('');
  const id = round.agenda[idx]; const d = state.decisions.find((x) => x.id === id);
  useEffect(() => { setChoice(d?.chosen || null); setWhy(''); setNote(''); }, [id]);
  const res = (x) => round.results.find((r) => r.decisionId === x)?.outcome;
  const limit = (d?.rounds || 0) >= MAX_ROUNDS;
  const next = () => setIdx((i) => Math.min(i + 1, round.agenda.length - 1));
  const applyDecision = (chosen, byRec) => {
    const rationale = why || (byRec ? (d.recommendation?.reasons || []).join('; ') : '');
    if (d.kind === 'variant' && chosen) act(() => actions.selectVariant(d.featureId, chosen, { rationale, byRecommendation: byRec }));
    else if (d.kind === 'app-direction' && chosen) act(() => actions.applyDirection('app', 'app', chosen, { rationale, byRecommendation: byRec }));
    else act(() => actions.decide(d.id, { chosen, rationale, byRecommendation: byRec }));
    actions.roundResult(round.id, d.id, 'entschieden', why); toast('Entschieden'); next();
  };
  const closed = round.status === 'geschlossen';
  const counts = { entschieden: 0, geparkt: 0, änderung: 0 }; round.results.forEach((r) => { counts[r.outcome] = (counts[r.outcome] || 0) + 1; });
  return html`<div class="wb-page">
    <div class="wb-row wb-wrap" style="gap:12px;align-items:center">
      <div class="wb-grow"><div class="wb-label">Entscheidungsrunde · ${round.title}</div><h1 class="wb-h1">${closed ? 'Ergebnis' : `Frage ${idx + 1} von ${round.agenda.length}`}</h1></div>
      ${!closed && html`<${Timer} round=${round} />`}
      <${Badge} tone="success" sq>${counts.entschieden} entschieden<//><${Badge} tone="info" sq>${counts.geparkt} geparkt<//><${Badge} tone="warning" sq>${counts.änderung || 0} Änderung<//>
      ${!closed && html`<${Btn} icon="check-check" onClick=${() => { act(() => actions.closeRound(round.id)); toast('Runde abgeschlossen'); }}>Runde abschließen<//>`}
      <${Btn} icon="file-text" onClick=${() => download(`arbeitsauftrag-${round.id}.md`, workOrderMarkdown(getState(), { roundId: round.id, getComponent }), 'text/markdown')}>Arbeitsauftrag (.md)<//>
    </div>
    <div class="wb-row wb-wrap" style="gap:6px">${round.agenda.map((x, i) => { const dd = state.decisions.find((y) => y.id === x); const o = res(x);
      return html`<button type="button" class=${cx('wb-btn wb-btn--sm', i === idx && !closed && 'is-active')} aria-pressed=${String(i === idx && !closed)} onClick=${() => setIdx(i)} title=${dd?.title}>
        <span class="wb-dot" style=${`color:var(--wb-${o === 'entschieden' ? 'success' : o === 'geparkt' ? 'info' : o === 'änderung' ? 'warning' : 'border-strong'})`}></span>${i + 1}</button>`; })}</div>
    ${closed ? html`<${Card} title="Zusammenfassung"><div class="wb-col" style="gap:0;margin:-8px -16px -16px">${round.agenda.map((x) => { const dd = state.decisions.find((y) => y.id === x); return dd && html`<${DecisionRow} d=${dd} state=${state} reason=${res(x) || 'nicht behandelt'} />`; })}</div><//>
      <p class="wb-muted">Nächste Schritte: Arbeitsauftrag exportieren und mit Claude Code umsetzen (<span class="wb-mono">/takt-work-order</span>), geparkte Fragen erscheinen zur Wiedervorlage in der Inbox.</p>`
    : !d ? html`<${Empty} title="Frage nicht gefunden" />` : html`<div class="wb-grid" style="grid-template-columns:minmax(0,1fr) 340px;align-items:start">
      <div class="wb-col" style="gap:12px">
        <${Card}><div class="wb-row wb-wrap" style="gap:8px;margin-bottom:8px"><${Badge} outline sq>${levelLabel(d.level)}<//><${Badge} tone=${decisionTone(d.status)} sq>${decisionStatusLabel(d.status)}<//>
            ${d.reversibility && html`<${Badge} sq>${d.reversibility}<//>`}<${Badge} tone=${limit ? 'danger' : null} sq>${d.rounds || 0}. Runde (max. ${MAX_ROUNDS})<//></div>
          <h2 class="wb-h2" style="font-size:19px">${d.question || d.title}</h2>${d.consequences && html`<p class="wb-small wb-muted" style="margin-top:6px">Auswirkung: ${d.consequences}</p>`}<//>
        <div class="wb-grid" role="radiogroup" aria-label="Optionen" style=${`grid-template-columns:repeat(${Math.min(3, Math.max(1, d.options.length))}, minmax(0,1fr))`}>${d.options.map((o) => html`<div class=${cx('wb-card wb-card--pad', choice === o.id && 'wb-card--selected')} data-option=${o.id}>
          <button type="button" role="radio" aria-checked=${String(choice === o.id)} class="wb-row" style="width:100%;background:none;border:0;padding:0;color:inherit;cursor:pointer;text-align:left;font:inherit" onClick=${() => setChoice(o.id)} data-option-select=${o.id}>
            <span class="wb-radio-dot" aria-hidden="true">${choice === o.id && html`<${Icon} name="check" size=${12} />`}</span><strong class="wb-grow">${o.label}</strong>${d.recommendation?.optionId === o.id && html`<${Badge} tone="accent" icon="sparkles" sq>Empfehlung<//>`}</button>
          ${o.description && html`<p class="wb-small wb-muted" style="margin-top:4px">${o.description}</p>`}<${OptionPreview} state=${state} option=${o} /></div>`)}
          ${!d.options.length && html`<${Card} pad><p class="wb-muted">Keine Optionen hinterlegt – Entscheidung als Freitext begründen.</p><//>`}</div>
      </div>
      <div class="wb-col" style="gap:12px;position:sticky;top:0">
        ${d.recommendation && html`<${Card} title="Empfehlung" icon="sparkles"><strong>${d.options.find((o) => o.id === d.recommendation.optionId)?.label}</strong><ul class="wb-small" style="margin:6px 0 0;padding-left:18px">${(d.recommendation.reasons || []).map((r) => html`<li>${r}</li>`)}</ul>
          <${Btn} size="sm" variant="primary" icon="check" style="margin-top:10px" onClick=${() => applyDecision(d.recommendation.optionId, true)} data-qa="accept-recommendation">Empfehlung übernehmen<//><//>`}
        <${Card} title="Entscheiden"><${Field} label="Begründung (kurz)"><textarea class="wb-textarea" rows="3" value=${why} onInput=${(e) => setWhy(e.currentTarget.value)} placeholder="Warum diese Option?"></textarea><//>
          <${Btn} variant="primary" icon="gavel" style="margin-top:10px;width:100%" disabled=${d.options.length > 0 && !choice} onClick=${() => applyDecision(choice, false)} data-qa="round-decide">${choice ? `„${d.options.find((o) => o.id === choice)?.label}“ entscheiden` : 'Option wählen'}<//><//>
        <${Card} title="Nicht jetzt"><div class="wb-col" style="gap:8px">
          <${Btn} icon="pause" onClick=${() => { act(() => actions.parkDecision(d.id, { revisitAt: new Date(Date.now() + 7 * 86400000).toISOString(), note: why })); actions.roundResult(round.id, d.id, 'geparkt', why); toast('Geparkt – kommt zur Wiedervorlage'); next(); }}>Parken (Wiedervorlage in 1 Woche)<//>
          <input class="wb-input wb-input--sm" placeholder="Welche Änderung ist nötig?" value=${note} onInput=${(e) => setNote(e.currentTarget.value)} disabled=${limit} />
          <${Btn} icon="pencil" disabled=${limit || !note.trim()} title=${limit ? `Rundenlimit (${MAX_ROUNDS}) erreicht – jetzt entscheiden oder parken` : ''} onClick=${() => { act(() => actions.addPin({ featureId: d.featureId, decisionId: d.id, kind: 'änderung', severity: 'muss', text: note, roundId: round.id })); actions.roundResult(round.id, d.id, 'änderung', note); toast('Änderung notiert – Frage kommt in die nächste Runde'); next(); }}>Änderung nötig<//>
          ${limit && html`<div class="wb-small" style="color:var(--wb-danger)">Rundenlimit erreicht: keine weitere Vergleichsrunde.</div>`}</div><//>
      </div></div>`}
  </div>`;
}

export function RoundsView({ state, roundId }) {
  const round = roundId && state.rounds.find((r) => r.id === roundId);
  if (round) return html`<${RoundRunner} key=${round.id} state=${state} round=${round} />`;
  return html`<div class="wb-page">
    <div class="wb-row wb-wrap" style="gap:12px;align-items:flex-end"><div class="wb-grow"><h1 class="wb-h1">Entscheidungsrunden</h1>
      <p class="wb-muted" style="margin-top:4px">Fragen bündeln, in fester Zeit entscheiden, höchstens ${MAX_ROUNDS} Runden je Frage. So enden Designrunden.</p></div>
      <${Btn} variant="primary" icon="play" onClick=${() => newRoundDialog(state)} data-qa="new-round">Neue Runde<//></div>
    <${Card}>${!state.rounds.length ? html`<${Empty} icon="timer" title="Noch keine Runde" text="Starte mit der App-Ebene: Richtung und Pflichtfragen in 20 Minuten." action=${html`<${Btn} variant="primary" icon="play" onClick=${() => newRoundDialog(state, 'app')}>App-Ebene entscheiden<//>`} />`
      : html`<table class="wb-table"><thead><tr><th>Runde</th><th>Start</th><th>Fragen</th><th>Ergebnis</th><th>Status</th></tr></thead><tbody>${state.rounds.map((r) => html`<tr class="is-click" onClick=${() => navigate(`#/rounds/${r.id}`)}>
        <td><strong>${r.title}</strong></td><td class="wb-small wb-num">${fmt.dateTime(r.startedAt)}</td><td class="wb-num">${r.agenda.length}</td>
        <td class="wb-small">${r.results.filter((x) => x.outcome === 'entschieden').length} entschieden · ${r.results.filter((x) => x.outcome === 'geparkt').length} geparkt · ${r.results.filter((x) => x.outcome === 'änderung').length} Änderung</td>
        <td><${Badge} tone=${r.status === 'läuft' ? 'accent' : 'success'} sq>${r.status}<//></td></tr>`)}</tbody></table>`}<//>
  </div>`;
}
