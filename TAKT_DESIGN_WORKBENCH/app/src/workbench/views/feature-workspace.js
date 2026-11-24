// ============================================================================
// FEATURE-WORKSPACE – eigener Arbeitsbereich je Feature.
// Tabs: Übersicht · Anforderungen · Design · Vergleich · Interaktionen ·
//       Demo-Daten · Qualität · Entscheidungen · Historie
// ============================================================================
import { html } from '../../lib/html.js';
import { useState } from 'preact/hooks';
import { Icon } from '../../lib/icons.js';
import { Btn, IconBtn, Badge, StatusBadge, Tabs, TextInput, Select, openDialog, toast, Field, QaCell } from '../ui/kit.js';
import { act, featureMenu, newWorkingVersionDialog, qaRunDialog, statusOptions } from './common.js';
import { actions } from '../store.js';
import { FEATURE_STATUSES } from '../../core/schema.js';
import { releaseChecklist, bumpMajor } from '../../core/versioning.js';
import { navigate, featureHref, studioHref, moduleHref } from '../router.js';
import { OverviewTab, RequirementsTab, InteractionsTab, DataTab, DecisionsTab, HistoryTab } from './ws-tabs.js';
import { DesignTab, CompareTab } from './ws-design.js';
import { QaTab } from './ws-qa.js';

export function releaseDialog(state, f) {
  const checks = releaseChecklist(f, state.qa.latest[f.id]);
  const allOk = checks.every((c) => c.ok);
  openDialog({
    title: `Freigabe – ${f.name}`, size: 'wide',
    body: ({ close }) => {
      const [note, setNote] = useState('');
      const [override, setOverride] = useState('');
      const go = () => {
        if (!allOk && !override.trim()) return toast('Bitte begründen, warum trotz offener Punkte freigegeben wird.', 'danger');
        act(() => actions.release(f.id, { note, override: allOk ? '' : override }));
        toast(`„${f.name}“ als v${bumpMajor(f.version)} freigegeben und gesperrt`); close();
      };
      return html`<div class="wb-col" style="gap:14px">
        <p class="wb-muted">Die Freigabe fixiert Designversion, Anforderungen, Interaktionen, Viewports, QA-Ergebnis und Entscheidungen als <strong>v${bumpMajor(f.version)}</strong>. Danach ist das Feature gesperrt – Änderungen erzeugen eine neue Arbeitsversion, der freigegebene Stand bleibt erhalten.</p>
        <div class="wb-card" style="padding:4px 14px">${checks.map((c) => html`<div class="wb-check-item"><span style=${`color:var(--wb-${c.ok ? 'success' : 'warning'})`}><${Icon} name=${c.ok ? 'check-circle-2' : 'alert-triangle'} size=${17} /></span>
          <div class="wb-grow"><div style="font-weight:550">${c.label}</div>${c.detail && html`<div class="wb-small wb-subtle">${c.detail}</div>`}</div></div>`)}</div>
        ${!allOk && html`<${Field} label="Begründung für Freigabe trotz offener Punkte *" hint="Wird in der Version dokumentiert."><textarea class="wb-textarea" rows="2" value=${override} onInput=${(e) => setOverride(e.currentTarget.value)}></textarea><//>`}
        <${Field} label="Freigabenotiz"><textarea class="wb-textarea" rows="2" value=${note} placeholder="z. B. Variante B nach Gerätetest freigegeben" onInput=${(e) => setNote(e.currentTarget.value)}></textarea><//>
        <div class="wb-row" style="justify-content:flex-end">
          ${!checks.find((c) => c.id === 'qa').ok && html`<${Btn} icon="shield-check" onClick=${() => { close(); qaRunDialog({ jobs: [{ featureId: f.id }], title: `QA – ${f.name}` }); }}>Erst QA ausführen<//>`}
          <${Btn} onClick=${close}>Abbrechen<//><${Btn} variant="success" icon="badge-check" onClick=${go} data-confirm>Freigeben<//></div>
      </div>`;
    },
  });
}

const TABS = [
  { value: 'overview', label: 'Übersicht', icon: 'info' },
  { value: 'requirements', label: 'Anforderungen', icon: 'list-todo' },
  { value: 'design', label: 'Design', icon: 'palette' },
  { value: 'compare', label: 'Vergleich', icon: 'git-compare' },
  { value: 'interactions', label: 'Interaktionen', icon: 'zap' },
  { value: 'data', label: 'Demo-Daten', icon: 'file-json' },
  { value: 'qa', label: 'Qualität', icon: 'shield-check' },
  { value: 'decisions', label: 'Entscheidungen', icon: 'gavel' },
  { value: 'history', label: 'Historie', icon: 'history' },
];

export function FeatureWorkspace({ state, feature: f, tab }) {
  const m = state.modules.find((x) => x.id === f.moduleId);
  const qa = state.qa.latest[f.id];
  const decisions = state.decisions.filter((d) => d.featureId === f.id);
  const versions = state.versions.filter((v) => v.featureId === f.id);
  const counts = { requirements: f.requirements.length, design: f.variants.length || null, compare: f.variants.length > 1 ? f.variants.length : null, interactions: f.interactions.length, data: Object.keys(f.demoData || {}).length, decisions: decisions.length, history: versions.length };
  const tabs = TABS.map((t) => ({ ...t, count: counts[t.value] ?? null, dot: t.value === 'qa' && qa ? { pass: 'success', warn: 'warning', fail: 'danger' }[qa.status] : null }));
  const go = (t) => navigate(featureHref(f.id, t));
  const released = state.versions.find((v) => v.id === f.releasedVersionId);
  const props = { state, feature: f, module: m };

  return html`<div class="wb-page" style="gap:14px">
    <div class="wb-row wb-wrap" style="gap:14px;align-items:flex-start">
      <div class="wb-grow" style="min-width:280px">
        <div class="wb-row wb-small" style="gap:6px;padding-left:6px"><a href=${moduleHref(m?.id)} class="wb-row" style="gap:5px"><${Icon} name=${m?.icon} size=${14} />${m?.name}</a><span class="wb-subtle">›</span><span class="wb-subtle">${f.group}</span><span class="wb-subtle wb-mono" style="margin-left:6px">${f.id}</span></div>
        <${TextInput} class="wb-input--ghost wb-input--title" value=${f.name} disabled=${f.locked} onCommit=${(v) => v.trim() && act(() => actions.updateFeature(f.id, { name: v.trim() }, `Umbenannt in „${v.trim()}“`))} aria-label="Feature-Name" />
        <div class="wb-row wb-wrap" style="gap:8px;padding-left:6px;margin-top:4px">
          <${Select} size="sm" style="width:auto" value=${f.status} onChange=${(v) => act(() => actions.setFeatureStatus(f.id, v))} options=${statusOptions(f)} aria-label="Status" data-qa="status-select" />
          <${Badge} outline sq title="Aktuelle Arbeitsversion">v${f.version}${f.locked ? ' · gesperrt' : ' · Arbeitsstand'}<//>
          ${released && html`<${Badge} tone="success" icon="badge-check" sq>Freigegeben v${released.version}<//>`}
          ${f.variants.length > 0 && html`<${Badge} sq>${f.variants.length} Variante${f.variants.length > 1 ? 'n' : ''} · bevorzugt ${f.selectedVariantId}<//>`}
          ${qa && html`<span class="wb-row wb-small" style="gap:5px"><${QaCell} status=${qa.status} /><span class="wb-muted">QA</span></span>`}
        </div>
      </div>
      <div class="wb-row wb-wrap" style="gap:8px">
        <${Btn} icon="palette" onClick=${() => navigate(studioHref(f.id))}>Design Studio<//>
        <${Btn} icon="shield-check" disabled=${!f.variants.length} onClick=${() => qaRunDialog({ jobs: [{ featureId: f.id }], title: `QA – ${f.name}` })}>QA ausführen<//>
        ${f.locked ? html`<${Btn} variant="primary" icon="git-branch" onClick=${() => newWorkingVersionDialog(f.id)}>Neue Arbeitsversion<//>`
          : html`<${Btn} icon="save" onClick=${() => { act(() => actions.saveVersion(f.id, '')); toast(`Version v${f.version} gesichert`); }} title="Aktuellen Stand als Version sichern">Version sichern<//>
            ${f.status !== 'review' ? html`<${Btn} icon="eye" onClick=${() => { act(() => actions.submitReview(f.id)); toast('Zur Prüfung eingereicht'); }}>Zur Prüfung<//>` : null}
            <${Btn} variant="success" icon="badge-check" disabled=${!f.variants.length} onClick=${() => releaseDialog(state, f)}>Freigeben<//>`}
        <${IconBtn} icon="more-horizontal" label="Weitere Aktionen" size=${null} variant=${null} onClick=${(e) => featureMenu(e, f, state)} />
      </div>
    </div>
    ${f.locked && html`<div class="wb-banner wb-banner--lock" data-qa="lock-banner"><span style="color:var(--wb-success)"><${Icon} name="lock" size=${17} /></span>
      <div class="wb-grow"><strong>Freigegeben (v${f.version}) – schreibgeschützt.</strong> <span class="wb-muted">Der freigegebene Stand wird nicht automatisch geändert. Für Änderungen eine neue Arbeitsversion anlegen.</span></div>
      <${Btn} size="sm" icon="git-branch" onClick=${() => newWorkingVersionDialog(f.id)}>Neue Arbeitsversion<//></div>`}
    ${f.archived && html`<div class="wb-banner wb-banner--warn"><${Icon} name="archive" size=${16} /><span class="wb-grow">Archiviert.</span><${Btn} size="sm" onClick=${() => act(() => actions.archiveFeature(f.id, false))}>Wiederherstellen<//></div>`}
    <${Tabs} value=${tab} onChange=${go} options=${tabs} />
    <div data-tab-panel=${tab}>
      ${tab === 'overview' && html`<${OverviewTab} ...${props} />`}
      ${tab === 'requirements' && html`<${RequirementsTab} ...${props} />`}
      ${tab === 'design' && html`<${DesignTab} ...${props} />`}
      ${tab === 'compare' && html`<${CompareTab} ...${props} />`}
      ${tab === 'interactions' && html`<${InteractionsTab} ...${props} />`}
      ${tab === 'data' && html`<${DataTab} ...${props} />`}
      ${tab === 'qa' && html`<${QaTab} ...${props} />`}
      ${tab === 'decisions' && html`<${DecisionsTab} ...${props} />`}
      ${tab === 'history' && html`<${HistoryTab} ...${props} />`}
    </div>
  </div>`;
}
