// Feature-Browser – alle Features modulübergreifend: suchen, filtern, sortieren, Status ändern.
import { html } from '../../lib/html.js';
import { useState, useMemo } from 'preact/hooks';
import { Icon } from '../../lib/icons.js';
import { Card, Btn, IconBtn, Badge, StatusBadge, QaCell, Empty, Select, Checkbox } from '../ui/kit.js';
import { StatusPipeline, newFeatureDialog, featureMenu, act, statusOptions } from './common.js';
import { actions } from '../store.js';
import { FEATURE_STATUSES, statusIndex } from '../../core/schema.js';
import { navigate, featureHref } from '../router.js';
import { fmt } from '../../lib/util.js';
import { tierOf, TIERS } from '../../core/process.js';

export function FeaturesView({ state }) {
  const saved = (() => { try { return JSON.parse(sessionStorage.getItem('wb-feature-filter') || '{}'); } catch { return {}; } })();
  const [q, setQ] = useState(saved.q || '');
  const [mod, setMod] = useState(saved.mod || '');
  const [status, setStatus] = useState(saved.status || '');
  const [archived, setArchived] = useState(false);
  const [tier, setTier] = useState(saved.tier || '');
  const [dir, setDir] = useState(saved.dir || '');
  const [sort, setSort] = useState({ key: 'module', dir: 1 });
  const persist = (o) => { try { sessionStorage.setItem('wb-feature-filter', JSON.stringify({ q, mod, status, tier, dir, ...o })); } catch { /* noop */ } };
  const modName = (id) => state.modules.find((m) => m.id === id)?.name || id;
  const modOrder = (id) => state.modules.find((m) => m.id === id)?.order ?? 99;

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    let r = state.features.filter((f) => (archived ? f.archived : !f.archived))
      .filter((f) => !mod || f.moduleId === mod).filter((f) => !status || f.status === status)
      .filter((f) => !tier || String(tierOf(f)) === tier)
      .filter((f) => !dir || (dir === 'fehlt' ? f.variants.length && state.directions.some((d) => !f.variants.some((v) => v.direction === d.id)) : f.variants.some((v) => v.direction === dir)))
      .filter((f) => !n || `${f.name} ${f.purpose} ${f.group} ${f.id} ${modName(f.moduleId)}`.toLowerCase().includes(n));
    const val = { module: (f) => modOrder(f.moduleId) * 1000 + f.order, name: (f) => f.name.toLowerCase(), status: (f) => statusIndex(f.status), version: (f) => parseFloat(f.version), variants: (f) => f.variants.length, updated: (f) => f.updatedAt, qa: (f) => ({ fail: 0, warn: 1, pass: 2 }[state.qa.latest[f.id]?.status] ?? 3) }[sort.key];
    return r.sort((a, b) => (val(a) > val(b) ? 1 : val(a) < val(b) ? -1 : 0) * sort.dir);
  }, [state, q, mod, status, archived, sort, tier, dir]);

  const th = (key, label, style) => html`<th style=${`cursor:pointer;${style || ''}`} onClick=${() => setSort({ key, dir: sort.key === key ? -sort.dir : 1 })}>${label}${sort.key === key ? (sort.dir > 0 ? ' ↑' : ' ↓') : ''}</th>`;
  const all = state.features.filter((f) => !f.archived);

  return html`<div class="wb-page">
    <div class="wb-row wb-wrap" style="gap:12px;align-items:flex-end">
      <div class="wb-grow"><h1 class="wb-h1">Features</h1><p class="wb-muted" style="margin-top:4px">Modulübergreifend verwalten. Jedes Feature hat einen eigenen Arbeitsbereich mit Anforderungen, Varianten, Vorschau, QA und Historie.</p></div>
      <${Btn} variant="primary" icon="plus" onClick=${() => newFeatureDialog(mod || undefined)}>Feature hinzufügen<//>
    </div>
    <div class="wb-row wb-wrap" style="gap:6px">${FEATURE_STATUSES.map((s) => { const n = all.filter((f) => f.status === s.id).length; return html`<button type="button" class="wb-btn wb-btn--sm" aria-pressed=${String(status === s.id)} onClick=${() => { const v = status === s.id ? '' : s.id; setStatus(v); persist({ status: v }); }}>
      <span class="wb-dot" style=${`color:${s.tone === 'neutral' ? 'var(--wb-subtle)' : `var(--wb-${s.tone})`}`}></span>${s.label}<span class="wb-num wb-subtle">${n}</span></button>`; })}</div>
    <div class="wb-row wb-wrap" style="gap:10px">
      <div class="wb-search" style="flex:1 1 260px;max-width:420px"><${Icon} name="search" size=${15} /><input class="wb-input" type="search" placeholder="Feature, Zweck, Gruppe, ID …" value=${q} onInput=${(e) => { setQ(e.currentTarget.value); persist({ q: e.currentTarget.value }); }} aria-label="Features durchsuchen" /></div>
      <${Select} style="width:auto" value=${mod} onChange=${(v) => { setMod(v); persist({ mod: v }); }} options=${[{ value: '', label: 'Alle Module' }, ...state.modules.filter((m) => !m.archived).sort((a, b) => a.order - b.order).map((m) => ({ value: m.id, label: m.name }))]} aria-label="Modul" />
      <${Select} style="width:auto" value=${tier} onChange=${(v) => { setTier(v); persist({ tier: v }); }} options=${[{ value: '', label: 'Alle Tiers' }, ...TIERS.map((t) => ({ value: String(t.id), label: t.label }))]} aria-label="Design-Tiefe" data-qa="filter-tier" />
      <${Select} style="width:auto" value=${dir} onChange=${(v) => { setDir(v); persist({ dir: v }); }} options=${[{ value: '', label: 'Alle Richtungen' }, ...state.directions.map((d) => ({ value: d.id, label: `Mit Variante „${d.name}“` })), { value: 'fehlt', label: 'Richtung fehlt (Lücken)' }]} aria-label="Richtung" data-qa="filter-direction" />
      <${Checkbox} checked=${archived} onChange=${setArchived} label="Archiv anzeigen" />
      <span class="wb-grow"></span><span class="wb-small wb-muted wb-num">${rows.length} Treffer</span>
      ${(q || mod || status || tier || dir) && html`<${Btn} size="sm" variant="ghost" icon="x" onClick=${() => { setQ(''); setMod(''); setStatus(''); setTier(''); setDir(''); persist({ q: '', mod: '', status: '', tier: '', dir: '' }); }}>Filter zurücksetzen<//>`}
    </div>
    <${StatusPipeline} features=${rows} height=${6} />
    <${Card}>${!rows.length ? html`<${Empty} icon="search" title="Keine Features gefunden" text="Filter anpassen oder ein neues Feature anlegen." />` : html`<div style="overflow-x:auto"><table class="wb-table" data-qa="feature-table">
      <thead><tr>${th('name', 'Feature')}${th('module', 'Modul')}<th class="wb-hide-sm">Gruppe</th><th class="wb-hide-sm" title="Design-Tiefe · Richtungen mit eigener Variante">Tier · Richtungen</th>${th('status', 'Status')}${th('version', 'Version')}${th('variants', 'Var.')}${th('qa', 'QA')}${th('updated', 'Geändert')}<th></th></tr></thead>
      <tbody>${rows.map((f) => html`<tr class="is-click" onClick=${() => navigate(featureHref(f.id))} data-feature=${f.id}>
        <td style="max-width:320px"><div class="wb-row" style="gap:7px"><strong class="wb-trunc">${f.name}</strong>${f.locked && html`<span class="wb-subtle" title="Freigegeben & gesperrt"><${Icon} name="lock" size=${13} /></span>`}</div><div class="wb-xs wb-subtle wb-trunc">${f.purpose}</div></td>
        <td><span class="wb-row wb-small" style="gap:6px"><${Icon} name=${state.modules.find((m) => m.id === f.moduleId)?.icon} size=${14} />${modName(f.moduleId)}</span></td>
        <td class="wb-small wb-muted wb-hide-sm">${f.group}</td>
        <td class="wb-hide-sm"><span class="wb-row" style="gap:4px"><${Badge} sq title=${TIERS.find((t) => t.id === tierOf(f))?.label}>T${tierOf(f)}<//>${state.directions.map((d) => { const has = f.variants.some((v) => v.direction === d.id); return html`<span title=${`${d.name}: ${has ? 'eigene Variante' : 'fehlt'}`} style=${`color:${has ? 'var(--wb-text)' : 'var(--wb-border-strong)'}`}><${Icon} name=${d.icon} size=${13} /></span>`; })}</span></td>
        <td onClick=${(e) => e.stopPropagation()}><${Select} size="sm" style="width:auto;min-width:150px" value=${f.status} onChange=${(v) => act(() => actions.setFeatureStatus(f.id, v))} options=${statusOptions(f)} aria-label="Status" /></td>
        <td class="wb-num wb-small">v${f.version}</td><td class="wb-num wb-small">${f.variants.length}</td>
        <td><${QaCell} status=${state.qa.latest[f.id]?.status} /></td><td class="wb-small wb-muted wb-num">${fmt.relative(f.updatedAt)}</td>
        <td><${IconBtn} icon="more-horizontal" label="Aktionen" onClick=${(e) => featureMenu(e, f, state)} /></td></tr>`)}</tbody></table></div>`}<//>
  </div>`;
}
