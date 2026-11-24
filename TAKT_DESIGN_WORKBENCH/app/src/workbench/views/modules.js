// Module: Übersicht (sortieren, filtern, archivieren) und Modul-Cockpit.
import { html } from '../../lib/html.js';
import { useState } from 'preact/hooks';
import { Icon } from '../../lib/icons.js';
import { Card, Btn, IconBtn, Badge, StatusBadge, QaCell, Empty, Seg, TextInput, Select, openMenu, confirmDialog, toast, useSortable, Tabs } from '../ui/kit.js';
import { StatusPipeline, moduleProgress, moduleDialog, newFeatureDialog, featureMenu, decisionDialog, act, qaRunDialog } from './common.js';
import { actions } from '../store.js';
import { moduleStatusInfo, MODULE_STATUSES, statusInfo } from '../../core/schema.js';
import { themes, THEME_IDS } from '../../design-system/tokens.js';
import { featureHref, moduleHref, navigate, studioHref } from '../router.js';
import { fmt } from '../../lib/util.js';

function moduleMenu(e, m) {
  openMenu(e, [
    { label: 'Cockpit öffnen', icon: 'arrow-right', onClick: () => navigate(moduleHref(m.id)) },
    { label: 'Bearbeiten …', icon: 'pencil', onClick: () => moduleDialog(m) },
    { label: 'Feature hinzufügen …', icon: 'plus', onClick: () => newFeatureDialog(m.id) },
    { sep: true },
    m.archived ? { label: 'Wiederherstellen', icon: 'archive-restore', onClick: () => act(() => actions.archiveModule(m.id, false)) }
      : { label: 'Archivieren', icon: 'archive', onClick: () => { act(() => actions.archiveModule(m.id, true)); toast(`„${m.name}“ archiviert`, null, { label: 'Rückgängig', onClick: () => actions.archiveModule(m.id, false) }); } },
    { label: 'Löschen …', icon: 'trash-2', danger: true, onClick: async () => { if (await confirmDialog({ title: 'Modul löschen?', text: `„${m.name}“ wird entfernt. Nur möglich, wenn keine Features mehr enthalten sind.`, danger: true, confirmLabel: 'Löschen' })) act(() => actions.deleteModule(m.id)); } },
  ]);
}

export function ModulesView({ state }) {
  const [filter, setFilter] = useState('active');
  const [layout, setLayout] = useState('grid');
  const all = state.modules.slice().sort((a, b) => a.order - b.order);
  const list = all.filter((m) => (filter === 'archived' ? m.archived : filter === 'reference' ? m.isReference && !m.archived : !m.archived));
  const { itemProps } = useSortable(list.map((m) => m.id), (ids) => {
    const rest = all.filter((m) => !ids.includes(m.id)).map((m) => m.id);
    act(() => actions.reorderModules([...ids, ...rest]));
  });
  return html`<div class="wb-page">
    <div class="wb-row wb-wrap" style="gap:12px;align-items:flex-end">
      <div class="wb-grow"><h1 class="wb-h1">Module</h1><p class="wb-muted" style="margin-top:4px">Jedes Modul hat ein eigenes Cockpit. Reihenfolge per Drag & Drop – sie gilt auch für die Navigation in der Vorschau.</p></div>
      <${Seg} value=${filter} onChange=${setFilter} options=${[{ value: 'active', label: `Aktiv ${all.filter((m) => !m.archived).length}` }, { value: 'reference', label: 'Referenz' }, { value: 'archived', label: `Archiv ${all.filter((m) => m.archived).length}` }]} />
      <${Seg} value=${layout} onChange=${setLayout} options=${[{ value: 'grid', label: '', icon: 'layout-grid', title: 'Kacheln' }, { value: 'list', label: '', icon: 'list', title: 'Liste' }]} />
      <${Btn} variant="primary" icon="plus" onClick=${() => moduleDialog()}>Modul hinzufügen<//>
    </div>
    ${!list.length ? html`<${Card}><${Empty} icon="boxes" title=${filter === 'archived' ? 'Keine archivierten Module' : 'Keine Module'} action=${filter !== 'archived' && html`<${Btn} variant="primary" icon="plus" onClick=${() => moduleDialog()}>Modul hinzufügen<//>`} /><//>`
    : layout === 'grid' ? html`<div class="wb-grid" style="grid-template-columns:repeat(auto-fill,minmax(290px,1fr))">${list.map((m) => { const p = moduleProgress(state, m.id); const st = moduleStatusInfo(m.status); const ip = itemProps(m.id);
      return html`<div ...${ip} class=${`wb-card wb-card--hover ${ip['data-drop'] ? 'wb-card--selected' : ''}`} style="padding:16px;display:flex;flex-direction:column;gap:12px;cursor:pointer" onClick=${() => navigate(moduleHref(m.id))} data-module=${m.id}>
        <div class="wb-row" style="gap:12px"><span style="width:40px;height:40px;border-radius:11px;display:grid;place-items:center;background:var(--wb-accent-soft);color:var(--wb-accent);flex:none"><${Icon} name=${m.icon} size=${20} /></span>
          <div class="wb-grow"><div style="font-weight:650;font-size:15px" class="wb-trunc">${m.name}</div><div class="wb-row" style="gap:6px;margin-top:3px"><${Badge} tone=${st.tone === 'neutral' ? null : st.tone} sq>${st.label}<//>${m.isReference && html`<${Badge} tone="info" sq>Referenz<//>`}<span class="wb-xs wb-subtle">v${m.designVersion}</span></div></div>
          <${IconBtn} icon="more-horizontal" label="Aktionen" onClick=${(e) => moduleMenu(e, m)} /></div>
        <p class="wb-small wb-muted" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:38px">${m.description || '—'}</p>
        <${StatusPipeline} features=${p.features} height=${7} />
        <div class="wb-row wb-small wb-muted"><span class="wb-num">${p.total} Features</span>·<span class="wb-num">${p.done} freigegeben</span><span class="wb-grow"></span><span class="wb-subtle" title="Ziehen zum Sortieren"><${Icon} name="grip-vertical" size=${15} /></span></div>
      </div>`; })}</div>`
    : html`<${Card}><table class="wb-table"><thead><tr><th></th><th>Modul</th><th>Status</th><th>Theme</th><th>Features</th><th>Fortschritt</th><th>Geändert</th><th></th></tr></thead><tbody>
      ${list.map((m) => { const p = moduleProgress(state, m.id); const ip = itemProps(m.id); return html`<tr ...${ip} class="is-click" onClick=${() => navigate(moduleHref(m.id))} style=${ip['data-drop'] ? 'box-shadow:inset 0 2px 0 var(--wb-accent)' : ''}>
        <td style="width:28px" class="wb-subtle"><${Icon} name="grip-vertical" size=${15} /></td><td><div class="wb-row"><${Icon} name=${m.icon} size=${16} /><strong>${m.name}</strong>${m.isReference && html`<${Badge} tone="info" sq>Referenz<//>`}</div></td>
        <td>${moduleStatusInfo(m.status).label}</td><td>${themes[m.theme]?.label}</td><td class="wb-num">${p.total}</td><td style="width:180px"><${StatusPipeline} features=${p.features} height=${6} /></td><td class="wb-small wb-muted">${fmt.relative(m.updatedAt)}</td>
        <td><${IconBtn} icon="more-horizontal" label="Aktionen" onClick=${(e) => moduleMenu(e, m)} /></td></tr>`; })}</tbody></table><//>`}
  </div>`;
}

// ---------------------------------------------------------- Cockpit ---
export function ModuleCockpit({ state, module: m }) {
  const [tab, setTab] = useState('features');
  const p = moduleProgress(state, m.id);
  const features = state.features.filter((f) => f.moduleId === m.id).sort((a, b) => a.order - b.order);
  const active = features.filter((f) => !f.archived), archived = features.filter((f) => f.archived);
  const groups = [...new Set(active.map((f) => f.group || 'Allgemein'))];
  const decisions = state.decisions.filter((d) => d.moduleId === m.id || active.some((f) => f.id === d.featureId));
  const { itemProps } = useSortable(active.map((f) => f.id), (ids) => act(() => actions.reorderFeatures(ids)));
  const upd = (patch, label) => act(() => actions.updateModule(m.id, patch, label));
  const linked = (m.links || []).map((id) => state.modules.find((x) => x.id === id)).filter(Boolean);
  const qaFails = active.filter((f) => state.qa.latest[f.id]?.status === 'fail').length;

  return html`<div class="wb-page">
    ${m.archived && html`<div class="wb-banner wb-banner--warn"><${Icon} name="archive" size=${16} /><span class="wb-grow">Dieses Modul ist archiviert.</span><${Btn} size="sm" onClick=${() => act(() => actions.archiveModule(m.id, false))}>Wiederherstellen<//></div>`}
    <div class="wb-row wb-wrap" style="gap:16px;align-items:flex-start">
      <span style="width:52px;height:52px;border-radius:14px;display:grid;place-items:center;background:var(--wb-accent-soft);color:var(--wb-accent);flex:none"><${Icon} name=${m.icon} size=${26} /></span>
      <div class="wb-grow" style="min-width:260px">
        <${TextInput} class="wb-input--ghost wb-input--title" value=${m.name} onCommit=${(v) => v.trim() && upd({ name: v.trim() }, `Modul umbenannt in „${v.trim()}“`)} aria-label="Modulname" />
        <div class="wb-row wb-wrap" style="gap:8px;margin-top:6px;padding-left:6px">
          <${Select} size="sm" style="width:auto" value=${m.status} onChange=${(v) => upd({ status: v }, `Modulstatus → ${moduleStatusInfo(v).label}`)} options=${MODULE_STATUSES.map((s) => ({ value: s.id, label: s.label }))} aria-label="Status" />
          <${Select} size="sm" style="width:auto" value=${m.theme} onChange=${(v) => upd({ theme: v }, `Theme → ${themes[v].label}`)} options=${THEME_IDS.map((t) => ({ value: t, label: `Theme ${themes[t].label}` }))} aria-label="Theme" />
          <span class="wb-small wb-muted">Designversion</span><${TextInput} size="sm" style="width:64px" value=${m.designVersion} onCommit=${(v) => upd({ designVersion: v }, `Designversion → ${v}`)} aria-label="Designversion" />
          ${m.isReference && html`<${Badge} tone="info">Referenzmodul<//>`}<span class="wb-small wb-subtle">Quelle: ${m.source || '—'}</span>
        </div>
      </div>
      <div class="wb-row"><${Btn} icon="shield-check" disabled=${!active.some((f) => f.variants.length)} onClick=${() => qaRunDialog({ jobs: active.filter((f) => f.variants.length).map((f) => ({ featureId: f.id })), title: `QA – Modul ${m.name}`, scope: `Modul ${m.id}` })}>Modul prüfen<//>
        <${Btn} icon="pencil" onClick=${() => moduleDialog(m)}>Bearbeiten<//><${Btn} variant="primary" icon="plus" onClick=${() => newFeatureDialog(m.id)}>Feature<//><${IconBtn} icon="more-horizontal" label="Weitere Aktionen" variant=${null} size=${null} onClick=${(e) => moduleMenu(e, m)} /></div>
    </div>

    <div class="wb-grid wb-grid-4">
      <${Card} pad><div class="wb-kpi__label">Fortschritt</div><div class="wb-kpi__value">${Math.round(p.ratio * 100)} %</div><div class="wb-kpi__foot">${p.done} von ${p.total} freigegeben</div><//>
      <${Card} pad><div class="wb-kpi__label">In Arbeit</div><div class="wb-kpi__value">${active.filter((f) => ['design', 'review'].includes(f.status)).length}</div><div class="wb-kpi__foot">${active.filter((f) => f.status === 'review').length} in Prüfung</div><//>
      <${Card} pad><div class="wb-kpi__label">Varianten</div><div class="wb-kpi__value">${active.reduce((n, f) => n + f.variants.length, 0)}</div><div class="wb-kpi__foot">${active.filter((f) => f.variants.length > 1).length} Features mit Vergleich</div><//>
      <${Card} pad><div class="wb-kpi__label">Qualität</div><div class="wb-kpi__value" style=${qaFails ? 'color:var(--wb-danger)' : ''}>${qaFails ? `${qaFails} Fehler` : active.some((f) => state.qa.latest[f.id]) ? 'OK' : '–'}</div><div class="wb-kpi__foot">${active.filter((f) => state.qa.latest[f.id]).length} geprüfte Features</div><//>
    </div>
    <${StatusPipeline} features=${active} legend />

    <${Tabs} value=${tab} onChange=${setTab} options=${[{ value: 'features', label: 'Features', icon: 'list-checks', count: active.length }, { value: 'ia', label: 'Informationsarchitektur', icon: 'list-tree' }, { value: 'docs', label: 'Dokumentation', icon: 'book-open' }, { value: 'links', label: 'Verknüpfungen', icon: 'link-2', count: linked.length }, { value: 'decisions', label: 'Entscheidungen', icon: 'gavel', count: decisions.length }]} />

    ${tab === 'features' && html`<div class="wb-col" style="gap:16px">
      ${!active.length && html`<${Card}><${Empty} icon="list-checks" title="Noch keine Features" text="Lege die Features dieses Moduls an – z. B. aus dem Modulregister oder der bestehenden App." action=${html`<${Btn} variant="primary" icon="plus" onClick=${() => newFeatureDialog(m.id)}>Feature anlegen<//>`} /><//>`}
      ${groups.map((g) => html`<${Card} title=${g} actions=${html`<span class="wb-small wb-subtle">${active.filter((f) => (f.group || 'Allgemein') === g).length}</span>`}>
        <div class="wb-col" style="gap:0;margin:-8px -16px -16px">${active.filter((f) => (f.group || 'Allgemein') === g).map((f) => { const ip = itemProps(f.id); const qa = state.qa.latest[f.id];
          return html`<div ...${ip} class="wb-listrow is-click" style=${ip['data-drop'] ? 'box-shadow:inset 0 2px 0 var(--wb-accent)' : ''} onClick=${() => navigate(featureHref(f.id))} data-feature=${f.id}>
            <span class="wb-subtle" title="Ziehen zum Sortieren" style="cursor:grab"><${Icon} name="grip-vertical" size=${15} /></span>
            <div class="wb-grow"><div class="wb-row" style="gap:8px"><strong class="wb-trunc">${f.name}</strong>${f.locked && html`<span class="wb-subtle" title="Freigegeben & gesperrt"><${Icon} name="lock" size=${13} /></span>`}</div>
              <div class="wb-small wb-subtle wb-trunc">${f.purpose || 'Kein Zweck beschrieben'}</div></div>
            <span class="wb-small wb-muted wb-num wb-hide-sm">v${f.version}</span><span class="wb-small wb-muted wb-num wb-hide-sm" style="width:84px">${f.variants.length} Var. · ${f.requirements.length} Anf.</span>
            <${QaCell} status=${qa?.status} label="Letzte QA" /><div style="width:150px;display:flex;justify-content:flex-end"><${StatusBadge} status=${f.status} /></div>
            <${IconBtn} icon="palette" label="Im Design Studio öffnen" onClick=${(e) => { e.stopPropagation(); navigate(studioHref(f.id)); }} />
            <${IconBtn} icon="more-horizontal" label="Aktionen" onClick=${(e) => featureMenu(e, f, state)} /></div>`; })}</div><//>`)}
      ${archived.length > 0 && html`<details><summary class="wb-small wb-muted" style="cursor:pointer">Archivierte Features (${archived.length})</summary>
        <div class="wb-card" style="margin-top:8px">${archived.map((f) => html`<div class="wb-listrow"><span class="wb-grow wb-muted">${f.name}</span><${Btn} size="sm" icon="archive-restore" onClick=${() => act(() => actions.archiveFeature(f.id, false))}>Wiederherstellen<//></div>`)}</div></details>`}
    </div>`}

    ${tab === 'ia' && html`<${Card} title="Informationsarchitektur" sub="Hauptansichten, Navigation und Hierarchie des Moduls – bleibt modulspezifisch (Themes ändern sie nicht).">
      <${TextInput} multiline rows="10" value=${m.infoArchitecture} onCommit=${(v) => upd({ infoArchitecture: v }, 'Informationsarchitektur bearbeitet')} placeholder="z. B. 1) Übersicht 2) Detail 3) Bearbeiten …" />
      <div class="wb-small wb-subtle" style="margin-top:8px">Feature-Gruppen: ${groups.join(' · ') || '—'}</div><//>`}
    ${tab === 'docs' && html`<div class="wb-grid wb-grid-2">
      <${Card} title="Beschreibung"><${TextInput} multiline rows="4" value=${m.description} onCommit=${(v) => upd({ description: v }, 'Beschreibung bearbeitet')} /><//>
      <${Card} title="Dokumentation, Annahmen, offene Fragen"><${TextInput} multiline rows="10" value=${m.docs} onCommit=${(v) => upd({ docs: v }, 'Dokumentation bearbeitet')} /><//></div>`}
    ${tab === 'links' && html`<${Card} title="Verknüpfte Module" sub="Fachliche Abhängigkeiten (z. B. Kalender ↔ Aufgaben).">
      <div class="wb-row wb-wrap" style="gap:8px">${linked.map((x) => html`<span class="wb-badge wb-badge--outline" style="height:28px;padding:0 6px 0 10px"><a href=${moduleHref(x.id)}>${x.name}</a><${IconBtn} icon="x" label="Entfernen" onClick=${() => upd({ links: m.links.filter((l) => l !== x.id) }, 'Verknüpfung entfernt')} /></span>`)}
        <${Select} size="sm" style="width:auto" value="" onChange=${(v) => v && upd({ links: [...(m.links || []), v] }, 'Verknüpfung hinzugefügt')} options=${[{ value: '', label: '+ Modul verknüpfen' }, ...state.modules.filter((x) => x.id !== m.id && !(m.links || []).includes(x.id)).map((x) => ({ value: x.id, label: x.name }))]} /></div>
      <div class="wb-small wb-subtle" style="margin-top:12px">Feature-Verknüpfungen: ${active.flatMap((f) => (f.links || []).map((l) => `${f.name} → ${state.features.find((y) => y.id === l)?.name || l}`)).join(' · ') || 'keine'}</div><//>`}
    ${tab === 'decisions' && html`<${Card} title="Entscheidungen im Modul" actions=${html`<${Btn} size="sm" icon="plus" onClick=${() => decisionDialog({ moduleId: m.id })}>Entscheidung<//>`}>
      ${decisions.length ? html`<div class="wb-col" style="gap:0;margin:-8px -16px -16px">${decisions.map((d) => html`<div class="wb-listrow is-click" onClick=${() => decisionDialog({ existing: d })}>
        <${Badge} tone=${d.status === 'open' ? 'warning' : d.status === 'decided' ? 'success' : null} sq>${{ open: 'Offen', decided: 'Entschieden', superseded: 'Überholt' }[d.status]}<//>
        <div class="wb-grow"><div class="wb-trunc" style="font-weight:550">${d.title}</div><div class="wb-small wb-subtle wb-trunc">${d.decision || d.rationale}</div></div>
        <span class="wb-small wb-muted wb-trunc" style="max-width:200px">${state.features.find((f) => f.id === d.featureId)?.name || ''}</span></div>`)}</div>` : html`<${Empty} icon="gavel" title="Keine Entscheidungen" />`}<//>`}
  </div>`;
}
