// „Demo & Entscheidung“ – Ebene für Ebene entscheiden: App (Richtung) → Module → Features.
// Einstieg in den Demo-Launcher, Feedback-Eingang (auch vom Handy), Pflege der Richtungen.
import { html } from '../../lib/html.js';
import { useState, useEffect } from 'preact/hooks';
import { Icon } from '../../lib/icons.js';
import { Card, Btn, IconBtn, Badge, Empty, Tabs, Select, TextInput, Field, QaCell, openDialog, toast, confirmDialog } from '../ui/kit.js';
import { act, StatusPipeline } from './common.js';
import { actions } from '../store.js';
import { LEVELS, listVersions, versionCoverage, moduleHome } from '../../core/directions.js';
import { navigate, featureHref, moduleHref, studioHref } from '../router.js';
import { fmt, cx } from '../../lib/util.js';
import { themes, THEME_IDS } from '../../design-system/tokens.js';

function applyDialog(state, scope, targetId, dir) {
  const where = scope === 'app' ? 'die ganze App' : scope === 'module' ? `Modul „${state.modules.find((m) => m.id === targetId)?.name}“` : `Feature „${state.features.find((f) => f.id === targetId)?.name}“`;
  const cov = versionCoverage(state, `dir:${dir.id}`, scope === 'module' ? targetId : null);
  openDialog({ title: `Richtung „${dir.name}“ für ${where}`, size: 'wide', body: ({ close }) => {
    const [why, setWhy] = useState(''); const [tradeoffs, setT] = useState('');
    return html`<p class="wb-muted">${dir.description}</p>
      <p class="wb-small">Je Feature wird die Variante dieser Richtung als bevorzugt gesetzt. ${scope !== 'feature' ? html`<strong>${cov.own} von ${cov.total}</strong> Features haben eine passende Variante – die übrigen behalten ihre bisherige Wahl.` : ''} Freigegebene Features bleiben unverändert.</p>
      <${Field} label="Begründung"><textarea class="wb-textarea" rows="3" autofocus value=${why} onInput=${(e) => setWhy(e.currentTarget.value)} placeholder="Warum diese Richtung? (Launcher-Eindruck, Bewertungen, Kriterien)"></textarea><//>
      <${Field} label="Bewusst akzeptierte Nachteile"><textarea class="wb-textarea" rows="2" value=${tradeoffs} onInput=${(e) => setT(e.currentTarget.value)}></textarea><//>
      <div class="wb-row" style="justify-content:flex-end"><${Btn} onClick=${close}>Abbrechen<//><${Btn} variant="primary" icon="check" data-confirm onClick=${() => {
        const r = act(() => actions.applyDirection(scope, targetId, dir.id, { rationale: why, tradeoffs }));
        if (r) toast(`${r.applied.length} Features umgestellt${r.skippedLocked.length ? ` · ${r.skippedLocked.length} freigegebene unverändert` : ''}${r.missing.length ? ` · ${r.missing.length} ohne passende Variante` : ''}`);
        close(); }}>Übernehmen<//></div>`;
  } });
}

function DirectionCard({ dir, state, selected, onApply }) {
  const cov = versionCoverage(state, `dir:${dir.id}`);
  return html`<div class=${cx('wb-card wb-card--pad', selected && 'wb-card--selected')} style="display:flex;flex-direction:column;gap:10px">
    <div class="wb-row"><span style=${`width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:var(--wb-${dir.tone}-soft, var(--wb-panel-3));color:var(--wb-${dir.tone}, var(--wb-muted))`}><${Icon} name=${dir.icon} size=${18} /></span>
      <div class="wb-grow"><strong style="font-size:15px">${dir.name}</strong><div class="wb-small wb-muted">${dir.claim}</div></div>${selected && html`<${Badge} tone="success" icon="check">App-Richtung<//>`}</div>
    <p class="wb-small">${dir.description}</p>
    <ul class="wb-small wb-muted" style="margin:0;padding-left:18px">${(dir.principles || []).map((p) => html`<li>${p}</li>`)}</ul>
    <div class="wb-row wb-small"><span class="wb-muted">Abdeckung</span><div class="wb-bar wb-grow"><span style=${`width:${cov.ratio * 100}%;background:var(--wb-accent)`}></span></div><span class="wb-num">${cov.own}/${cov.total}</span></div>
    <div class="wb-row"><span class="wb-xs wb-subtle">Theme-Vorschlag: ${themes[dir.theme]?.label || dir.theme}</span><span class="wb-grow"></span>
      <a class="wb-btn wb-btn--sm" href=${`./launcher.html`} target="_blank"><${Icon} name="smartphone" size=${14} />Ansehen<//><${Btn} size="sm" variant=${selected ? null : 'primary'} icon="check" onClick=${onApply}>${selected ? 'Erneut anwenden' : 'Für App wählen'}<//></div>
  </div>`;
}

function LevelLadder({ state }) {
  const dirs = state.directions;
  const mods = state.modules.filter((m) => !m.archived).sort((a, b) => a.order - b.order);
  const appDir = dirs.find((d) => d.id === state.app.directionId);
  return html`<div class="wb-col" style="gap:16px">
    <div class="wb-grid wb-grid-4">${LEVELS.map((l, i) => html`<div class="wb-card wb-card--pad"><div class="wb-row"><span class="wb-badge wb-badge--sq">${l.short}</span><strong>${l.label}</strong></div><div class="wb-small wb-muted" style="margin-top:6px">${l.question}</div></div>`)}</div>
    <${Card} title="Ebene 0 · App-Richtung" icon="smartphone" sub=${appDir ? `Gewählt: ${appDir.name} · ${fmt.dateTime(state.app.decidedAt)}` : 'Noch nicht entschieden – im Launcher vergleichen, dann hier wählen.'}>
      <div class="wb-grid wb-grid-3">${dirs.map((d) => html`<${DirectionCard} dir=${d} state=${state} selected=${state.app.directionId === d.id} onApply=${() => applyDialog(state, 'app', 'app', d)} />`)}</div><//>
    <${Card} title="Ebene 1 · Module" icon="boxes" sub="Je Modul: Startseite, Richtung (erbt die App-Richtung, kann abweichen) und Fortschritt.">
      <div style="overflow-x:auto"><table class="wb-table"><thead><tr><th>Modul</th><th>Startseite</th><th>Richtung</th><th>Abdeckung je Richtung</th><th>Status</th></tr></thead><tbody>
        ${mods.map((m) => { const home = moduleHome(state, m.id); const fs = state.features.filter((f) => f.moduleId === m.id && !f.archived); const withV = fs.filter((f) => f.variants.length);
          const md = dirs.find((d) => d.id === m.directionId); const inherited = !md && appDir;
          return html`<tr><td><a href=${moduleHref(m.id)} class="wb-row" style="gap:6px;color:inherit"><${Icon} name=${m.icon} size=${15} /><strong>${m.name}</strong></a></td>
            <td><${Select} size="sm" style="width:auto;max-width:200px" value=${m.homeFeatureId || ''} onChange=${(v) => act(() => actions.setModuleHome(m.id, v))} options=${[{ value: '', label: `Automatisch (${state.features.find((f) => f.id === home)?.name || '–'})` }, ...withV.map((f) => ({ value: f.id, label: f.name }))]} aria-label=${`Startseite ${m.name}`} /></td>
            <td><${Select} size="sm" style="width:auto" value=${m.directionId || ''} onChange=${(v) => { if (v) applyDialog(state, 'module', m.id, dirs.find((d) => d.id === v)); }} options=${[{ value: '', label: inherited ? `erbt: ${appDir.name}` : '– offen –' }, ...dirs.map((d) => ({ value: d.id, label: d.name }))]} aria-label=${`Richtung ${m.name}`} /></td>
            <td><div class="wb-row" style="gap:10px">${dirs.map((d) => { const c = versionCoverage(state, `dir:${d.id}`, m.id); return html`<span class="wb-small wb-num" title=${`${d.name}: ${c.own}/${c.total}`}><${Icon} name=${d.icon} size=${12} /> ${c.own}/${c.total}</span>`; })}</div></td>
            <td style="width:180px"><${StatusPipeline} features=${fs} height=${6} /></td></tr>`; })}</tbody></table></div><//>
    <${Card} title="Ebene 2 · Features ohne Entscheidung" icon="file-text" sub="Features mit mehreren Varianten, für die noch keine Entscheidung dokumentiert ist.">
      ${(() => { const open = state.features.filter((f) => !f.archived && f.variants.length > 1 && !state.decisions.some((d) => d.featureId === f.id && d.status === 'decided'));
        return open.length ? html`<div class="wb-col" style="gap:0;margin:-8px -16px -16px">${open.map((f) => html`<a class="wb-listrow is-click" style="color:inherit;text-decoration:none" href=${featureHref(f.id, 'compare')}>
          <span class="wb-subtle"><${Icon} name=${state.modules.find((m) => m.id === f.moduleId)?.icon} size=${15} /></span><span class="wb-grow wb-trunc"><strong>${f.name}</strong> <span class="wb-small wb-muted">${state.modules.find((m) => m.id === f.moduleId)?.name}</span></span>
          <span class="wb-small wb-muted">${f.variants.length} Varianten: ${f.variants.map((v) => dirs.find((d) => d.id === v.direction)?.name || '–').join(' · ')}</span><${Icon} name="chevron-right" size=${15} /></a>`)}</div>` : html`<${Empty} icon="check-check" title="Alle Vergleiche entschieden" />`; })()}<//>
  </div>`;
}

function FeedbackInbox({ state }) {
  const [loading, setLoading] = useState(false);
  const load = async (quiet) => {
    setLoading(true);
    try { const r = await fetch('/api/feedback', { cache: 'no-store' }); if (!r.ok) throw new Error(`HTTP ${r.status}`); const n = actions.importFeedback(await r.json()); if (!quiet) toast(n ? `${n} neue Rückmeldungen` : 'Keine neuen Rückmeldungen'); }
    catch (e) { if (!quiet) toast(`Feedback nicht ladbar: ${e.message}`, 'danger'); }
    setLoading(false);
  };
  useEffect(() => { load(true); }, []);
  const fb = state.feedback;
  const versions = listVersions(state);
  const agg = {};
  for (const e of fb) if (e.rating) { const k = `${e.versionName || e.version}`; (agg[k] ||= []).push(e.rating); }
  const adopt = (e) => {
    const v = versions.find((x) => x.id === e.version);
    if (e.choose && v?.kind === 'direction') applyDialog(state, e.level === 'app' ? 'app' : e.level === 'module' ? 'module' : 'feature', e.level === 'app' ? 'app' : e.target, state.directions.find((d) => d.id === v.directionId));
    else openDialog({ title: 'Als Entscheidung übernehmen', body: ({ close }) => html`<p>„${e.comment || `${e.versionName}: ${e.rating || '–'} Sterne`}“</p><div class="wb-row" style="justify-content:flex-end"><${Btn} onClick=${close}>Abbrechen<//><${Btn} variant="primary" data-confirm onClick=${() => {
      act(() => actions.addDecision({ title: `${e.versionName} – ${e.targetName || e.target}`, decision: e.choose ? `Vorschlag: ${e.versionName} übernehmen` : '', rationale: e.comment || '', status: e.choose ? 'decided' : 'open', featureId: e.level === 'feature' ? e.target : null, moduleId: e.level === 'module' ? e.target : null }));
      actions.setFeedbackStatus(e.id, 'übernommen'); toast('Entscheidung angelegt'); close(); }}>Anlegen<//></div>` });
  };
  return html`<div class="wb-col" style="gap:14px">
    <div class="wb-row wb-wrap" style="gap:10px"><p class="wb-muted wb-grow">Bewertungen, Kommentare und „Übernehmen“-Wünsche aus dem Demo-Launcher – auch vom Handy (WLAN). Hier sichten und als Entscheidung übernehmen.</p>
      <${Btn} icon="refresh-cw" disabled=${loading} onClick=${() => load(false)}>Vom Server laden<//></div>
    ${Object.keys(agg).length > 0 && html`<${Card} title="Durchschnittliche Bewertung je Version"><div class="wb-row wb-wrap" style="gap:18px">${Object.entries(agg).map(([k, list]) => html`<div class="wb-col" style="gap:2px"><strong>${k}</strong><span class="wb-num" style="font-size:20px;font-weight:700">${(list.reduce((a, b) => a + b, 0) / list.length).toFixed(1).replace('.', ',')} ★</span><span class="wb-xs wb-subtle">${list.length} Bewertungen</span></div>`)}</div><//>`}
    <${Card}>${!fb.length ? html`<${Empty} icon="message-square" title="Noch kein Feedback" text="Im Demo-Launcher Versionen bewerten, kommentieren oder übernehmen – die Rückmeldungen erscheinen hier." action=${html`<a class="wb-btn wb-btn--primary" href="./launcher.html" target="_blank"><${Icon} name="smartphone" size=${15} />Launcher öffnen<//>`} />`
      : html`<table class="wb-table"><thead><tr><th>Zeit</th><th>Version</th><th>Ebene · Bezug</th><th>Bewertung</th><th>Kommentar</th><th>Gerät</th><th>Status</th><th></th></tr></thead><tbody>
        ${fb.slice(0, 300).map((e) => html`<tr><td class="wb-small wb-num">${fmt.dateTime(e.ts)}</td><td><strong>${e.versionName || e.version}</strong></td><td class="wb-small">${LEVELS.find((l) => l.id === e.level)?.label || e.level} · ${e.targetName || e.target}</td>
          <td class="wb-num">${e.rating ? '★'.repeat(e.rating) : '–'}${e.favorite ? ' ♥' : ''}${e.choose ? html` <${Badge} tone="accent" sq>Übernehmen<//>` : ''}</td><td class="wb-small" style="max-width:320px">${e.comment || ''}</td><td class="wb-small wb-muted">${e.device || ''}</td>
          <td><${Badge} tone=${e.status === 'übernommen' ? 'success' : e.status === 'verworfen' ? null : 'warning'} sq>${e.status || 'neu'}<//></td>
          <td style="white-space:nowrap">${e.status !== 'übernommen' && html`<${Btn} size="sm" icon="check" onClick=${() => adopt(e)}>Übernehmen<//>`}<${IconBtn} icon="x" label="Verwerfen" onClick=${() => actions.setFeedbackStatus(e.id, 'verworfen')} /></td></tr>`)}</tbody></table>`}<//>
  </div>`;
}

function DirectionsEditor({ state }) {
  return html`<div class="wb-col" style="gap:14px"><p class="wb-muted">Design-Richtungen sind durchgängige Versionen der App. Jede Variante kann einer Richtung zugeordnet werden (Design Studio › Variante › Richtung). Der Launcher zeigt je Richtung die passende Variante jedes Features.</p>
    ${state.directions.map((d) => html`<${Card} title=${d.name} icon=${d.icon} actions=${html`<span class="wb-xs wb-mono wb-subtle">${d.id}</span>`}>
      <div class="wb-grid wb-grid-2" style="gap:12px">
        <${Field} label="Name"><${TextInput} value=${d.name} onCommit=${(v) => act(() => actions.updateDirection(d.id, { name: v }))} /><//>
        <${Field} label="Leitsatz"><${TextInput} value=${d.claim} onCommit=${(v) => act(() => actions.updateDirection(d.id, { claim: v }))} /><//>
        <${Field} label="Beschreibung"><${TextInput} multiline rows="3" value=${d.description} onCommit=${(v) => act(() => actions.updateDirection(d.id, { description: v }))} /><//>
        <${Field} label="Prinzipien (eine pro Zeile)"><${TextInput} multiline rows="3" value=${(d.principles || []).join('\n')} onCommit=${(v) => act(() => actions.updateDirection(d.id, { principles: v.split('\n').map((x) => x.trim()).filter(Boolean) }))} /><//>
        <${Field} label="Theme-Vorschlag"><${Select} value=${d.theme} onChange=${(v) => act(() => actions.updateDirection(d.id, { theme: v }))} options=${THEME_IDS.map((t) => ({ value: t, label: themes[t].label }))} /><//>
      </div><//>`)}
    <div class="wb-row"><${Btn} icon="plus" onClick=${async () => { const id = act(() => actions.addDirection({ name: 'Neue Richtung', claim: '' })); if (id) toast('Richtung angelegt'); }}>Richtung hinzufügen<//>
      <${Btn} variant="ghost" icon="rotate-ccw" onClick=${async () => { if (await confirmDialog({ title: 'Richtungen zurücksetzen?', text: 'Kompakt, Visuell und Fokus werden in den Standard versetzt. Zuordnungen an Varianten bleiben erhalten.' })) act(() => actions.resetDirections()); }}>Standard wiederherstellen<//></div></div>`;
}

export function DecideView({ state, tab }) {
  const versions = listVersions(state);
  const newFb = state.feedback.filter((e) => !e.status || e.status === 'neu').length;
  return html`<div class="wb-page">
    <div class="wb-row wb-wrap" style="gap:14px;align-items:flex-end">
      <div class="wb-grow"><h1 class="wb-h1">Demo & Entscheidung</h1><p class="wb-muted" style="margin-top:4px">Die ganze App im Demo-Launcher ansehen – in mehreren Versionen nebeneinander oder auf dem Handy – und Ebene für Ebene entscheiden: App → Modul → Feature.</p></div>
      <a class="wb-btn wb-btn--primary" href="./launcher.html" target="_blank" data-qa="open-launcher"><${Icon} name="smartphone" size=${16} />Demo-Launcher öffnen<//>
    </div>
    <div class="wb-grid" style="grid-template-columns:repeat(auto-fit,minmax(190px,1fr))">${versions.map((v) => { const c = versionCoverage(state, v.id); return html`<div class="wb-card wb-card--pad"><div class="wb-row"><${Icon} name=${v.icon} size=${16} /><strong>${v.name}</strong></div>
      <div class="wb-small wb-muted" style="margin-top:4px;min-height:36px">${v.claim}</div><div class="wb-row wb-small" style="margin-top:6px"><div class="wb-bar wb-grow"><span style=${`width:${c.ratio * 100}%;background:var(--wb-accent)`}></span></div><span class="wb-num">${c.own}/${c.total}</span></div></div>`; })}</div>
    <${Tabs} value=${tab} onChange=${(t) => navigate(`#/decide/${t}`)} options=${[{ value: 'levels', label: 'Ebenen-Leiter', icon: 'layers' }, { value: 'feedback', label: 'Feedback', icon: 'message-square', count: newFb || null }, { value: 'directions', label: 'Richtungen', icon: 'compass' }]} />
    ${tab === 'levels' && html`<${LevelLadder} state=${state} />`}
    ${tab === 'feedback' && html`<${FeedbackInbox} state=${state} />`}
    ${tab === 'directions' && html`<${DirectionsEditor} state=${state} />`}
  </div>`;
}
