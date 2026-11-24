// Versionen & Entscheidungen – Freigaben, Versionen, Entscheidungslog, Änderungsprotokoll, offene Punkte.
import { html } from '../../lib/html.js';
import { useState } from 'preact/hooks';
import { Icon } from '../../lib/icons.js';
import { Card, Btn, Badge, Empty, Select, Tabs, QaCell, StatusBadge, confirmDialog, toast } from '../ui/kit.js';
import { act, decisionDialog, newWorkingVersionDialog } from './common.js';
import { actions } from '../store.js';
import { navigate, featureHref } from '../router.js';
import { fmt, download } from '../../lib/util.js';

const KIND = { draft: ['Entwurf', null, 'git-commit-horizontal'], review: ['Prüfversion', 'warning', 'eye'], release: ['Freigabe', 'success', 'badge-check'] };

export function VersionsView({ state, tab }) {
  const [mod, setMod] = useState('');
  const [kind, setKind] = useState('');
  const fname = (id) => state.features.find((f) => f.id === id)?.name || id;
  const mname = (id) => state.modules.find((m) => m.id === id)?.name || id;
  const released = state.features.filter((f) => f.releasedVersionId && !f.archived);
  const versions = state.versions.filter((v) => (!mod || v.moduleId === mod) && (!kind || v.kind === kind));
  const decisions = state.decisions.filter((d) => !mod || d.moduleId === mod || state.features.find((f) => f.id === d.featureId)?.moduleId === mod);
  const openDec = state.decisions.filter((d) => d.status === 'open');
  const inReview = state.features.filter((f) => f.status === 'review' && !f.archived);
  const qaFail = state.features.filter((f) => state.qa.latest[f.id]?.status === 'fail' && !f.archived);
  const modFilter = html`<${Select} size="sm" style="width:auto" value=${mod} onChange=${setMod} options=${[{ value: '', label: 'Alle Module' }, ...state.modules.map((m) => ({ value: m.id, label: m.name }))]} />`;
  const exportLog = () => download(`takt-entscheidungen-${new Date().toISOString().slice(0, 10)}.md`, ['# TAKT – Entscheidungslog', '', ...state.decisions.map((d) => `## ${d.title}\n- Status: ${d.status}\n- Bezug: ${d.featureId ? fname(d.featureId) : mname(d.moduleId) || 'Allgemein'}\n- Entscheidung: ${d.decision}\n- Begründung: ${d.rationale}\n- Akzeptierte Nachteile: ${d.tradeoffs}\n- Alternativen: ${d.alternatives}\n- Datum: ${fmt.dateTime(d.decidedAt || d.createdAt)}\n`)].join('\n'), 'text/markdown');

  return html`<div class="wb-page">
    <div class="wb-row wb-wrap" style="align-items:flex-end;gap:12px"><div class="wb-grow"><h1 class="wb-h1">Versionen & Entscheidungen</h1><p class="wb-muted" style="margin-top:4px">Freigegebene Designs bleiben stabil. Jede Änderung ist nachvollziehbar – mit Begründung.</p></div>
      <${Btn} icon="download" onClick=${exportLog}>Entscheidungslog (.md)<//><${Btn} variant="primary" icon="plus" onClick=${() => decisionDialog({ preset: { status: 'open' } })}>Entscheidung<//></div>
    <${Tabs} value=${tab} onChange=${(t) => navigate(`#/versions/${t}`)} options=${[
      { value: 'releases', label: 'Freigaben', icon: 'badge-check', count: released.length }, { value: 'versions', label: 'Versionen', icon: 'git-branch', count: state.versions.length },
      { value: 'decisions', label: 'Entscheidungen', icon: 'gavel', count: state.decisions.length }, { value: 'open', label: 'Offene Punkte', icon: 'circle-help', count: openDec.length + inReview.length + qaFail.length },
      { value: 'log', label: 'Änderungsprotokoll', icon: 'history' }]} />

    ${tab === 'releases' && html`<${Card}>${!released.length ? html`<${Empty} icon="badge-check" title="Noch keine Freigaben" text="Ein Feature wird im Workspace über „Freigeben“ fixiert (Designversion, Anforderungen, Interaktionen, Viewports, QA, Entscheidungen)." />`
      : html`<table class="wb-table"><thead><tr><th>Feature</th><th>Modul</th><th>Freigegeben</th><th>Datum</th><th>QA bei Freigabe</th><th>Aktueller Stand</th><th></th></tr></thead><tbody>
        ${released.map((f) => { const v = state.versions.find((x) => x.id === f.releasedVersionId); return html`<tr class="is-click" onClick=${() => navigate(featureHref(f.id, 'history'))}>
          <td><strong>${f.name}</strong></td><td class="wb-small">${mname(f.moduleId)}</td><td><${Badge} tone="success" icon="badge-check" sq>v${v?.version}<//></td><td class="wb-small wb-muted">${v && fmt.dateTime(v.createdAt)}</td>
          <td>${v?.qa ? html`<${QaCell} status=${v.qa.status} />` : html`<span class="wb-small wb-subtle">ohne QA</span>`}</td>
          <td>${f.locked ? html`<${Badge} icon="lock" sq>gesperrt<//>` : html`<${Badge} tone="accent" sq>Arbeitsversion v${f.version}<//>`}</td>
          <td onClick=${(e) => e.stopPropagation()}>${f.locked && html`<${Btn} size="sm" icon="git-branch" onClick=${() => newWorkingVersionDialog(f.id)}>Neue Arbeitsversion<//>`}</td></tr>`; })}</tbody></table>`}<//>`}

    ${tab === 'versions' && html`<div class="wb-col" style="gap:10px"><div class="wb-row" style="gap:8px">${modFilter}<${Select} size="sm" style="width:auto" value=${kind} onChange=${setKind} options=${[{ value: '', label: 'Alle Arten' }, { value: 'draft', label: 'Entwürfe' }, { value: 'review', label: 'Prüfversionen' }, { value: 'release', label: 'Freigaben' }]} /></div>
      <${Card}>${!versions.length ? html`<${Empty} icon="git-branch" title="Keine Versionen" />` : html`<table class="wb-table"><thead><tr><th>Version</th><th>Feature</th><th>Art</th><th>Datum</th><th>Notiz</th></tr></thead><tbody>
        ${versions.slice(0, 300).map((v) => html`<tr class="is-click" onClick=${() => navigate(featureHref(v.featureId, 'history'))}><td class="wb-num"><strong>v${v.version}</strong></td><td>${fname(v.featureId)} <span class="wb-xs wb-subtle">${mname(v.moduleId)}</span></td>
          <td><${Badge} tone=${KIND[v.kind][1]} icon=${KIND[v.kind][2]} sq>${KIND[v.kind][0]}<//></td><td class="wb-small wb-muted wb-num">${fmt.dateTime(v.createdAt)}</td><td class="wb-small wb-trunc" style="max-width:340px">${v.note}</td></tr>`)}</tbody></table>`}<//></div>`}

    ${tab === 'decisions' && html`<div class="wb-col" style="gap:10px"><div class="wb-row">${modFilter}</div>
      ${!decisions.length ? html`<${Card}><${Empty} icon="gavel" title="Keine Entscheidungen" /><//>` : html`<${Card}><div class="wb-col" style="gap:0">${decisions.map((d) => html`<div class="wb-listrow is-click" onClick=${() => decisionDialog({ existing: d })}>
        <${Badge} tone=${d.status === 'open' ? 'warning' : d.status === 'decided' ? 'success' : null} sq>${{ open: 'Offen', decided: 'Entschieden', superseded: 'Überholt' }[d.status]}<//>
        <div class="wb-grow"><div class="wb-trunc" style="font-weight:600">${d.title}</div><div class="wb-small wb-muted wb-trunc">${d.decision || d.rationale || '—'}</div></div>
        <div class="wb-small wb-subtle wb-trunc" style="max-width:220px;text-align:right">${d.featureId ? html`<a href=${featureHref(d.featureId, 'decisions')} onClick=${(e) => e.stopPropagation()}>${fname(d.featureId)}</a>` : mname(d.moduleId) || 'Allgemein'}<div class="wb-xs">${fmt.date(d.decidedAt || d.createdAt)}</div></div></div>`)}</div><//>`}</div>`}

    ${tab === 'open' && html`<div class="wb-grid wb-grid-3">
      <${Card} title="Offene Entscheidungen" icon="gavel">${openDec.length ? openDec.map((d) => html`<div class="wb-listrow is-click" style="padding-left:0;padding-right:0" onClick=${() => decisionDialog({ existing: d })}><span class="wb-grow wb-trunc">${d.title}</span></div>`) : html`<div class="wb-small wb-subtle">Keine.</div>`}<//>
      <${Card} title="In Prüfung" icon="eye">${inReview.length ? inReview.map((f) => html`<a class="wb-listrow is-click" style="padding-left:0;padding-right:0;color:inherit;text-decoration:none" href=${featureHref(f.id)}><span class="wb-grow wb-trunc">${f.name}</span><${QaCell} status=${state.qa.latest[f.id]?.status} /></a>`) : html`<div class="wb-small wb-subtle">Keine.</div>`}<//>
      <${Card} title="QA-Fehler" icon="bug">${qaFail.length ? qaFail.map((f) => html`<a class="wb-listrow is-click" style="padding-left:0;padding-right:0;color:inherit;text-decoration:none" href=${featureHref(f.id, 'qa')}><span class="wb-grow wb-trunc">${f.name}</span><${QaCell} status="fail" /></a>`) : html`<div class="wb-small wb-subtle">Keine.</div>`}<//>
    </div>`}

    ${tab === 'log' && html`<${Card}><div class="wb-col" style="gap:0">${state.history.slice(0, 400).map((h) => html`<div class="wb-row" style="padding:7px 0;border-bottom:1px solid var(--wb-border);gap:12px">
      <span class="wb-small wb-subtle wb-num" style="width:126px;flex:none">${fmt.dateTime(h.ts)}</span><${Badge} sq>${(h.type || '').split('.')[0]}<//><span class="wb-grow">${h.summary}</span>
      ${h.featureId && html`<a class="wb-small wb-trunc" style="max-width:30%" href=${featureHref(h.featureId)}>${fname(h.featureId)}</a>`}</div>`)}</div>
      ${state.history.length > 400 && html`<div class="wb-small wb-subtle" style="padding-top:8px">… ${state.history.length - 400} ältere Einträge im Export enthalten.</div>`}<//>`}
  </div>`;
}
