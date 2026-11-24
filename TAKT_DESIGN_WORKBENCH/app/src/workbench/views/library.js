// Component Library – Designsystem: Tokens/Themes + alle Komponenten mit Live-Galerie,
// Zuständen, Schnittstelle, Verwendung (welche Features nutzen sie?) und selektiver Regression.
import { html } from '../../lib/html.js';
import { useState, useMemo } from 'preact/hooks';
import { Icon } from '../../lib/icons.js';
import { Card, Btn, Badge, Empty, Select, TextInput, Seg, QaCell, toast } from '../ui/kit.js';
import { act, qaRunDialog } from './common.js';
import { actions } from '../store.js';
import { COMPONENTS, componentsByCategory, getComponent, validateComponent } from '../../library/registry.js';
import { buildComponentPayload } from '../../core/preview-payload.js';
import { componentUsage, affectedFeatures } from '../../core/impact.js';
import { themes, THEME_IDS, base, COLOR_ROLES, auditTheme, tokensJson, TOKENS_VERSION } from '../../design-system/tokens.js';
import { UI_STATES } from '../../core/schema.js';
import { PreviewFrame } from '../ui/preview-frame.js';
import { navigate, featureHref, studioHref } from '../router.js';
import { download, cx } from '../../lib/util.js';

const COMP_STATUS = [{ value: 'stable', label: 'Stabil' }, { value: 'review', label: 'In Prüfung' }, { value: 'draft', label: 'Entwurf' }, { value: 'deprecated', label: 'Veraltet' }];

function TokensPanel() {
  const [theme, setTheme] = useState('graphite');
  const t = themes[theme];
  const audit = useMemo(() => Object.fromEntries(THEME_IDS.map((id) => [id, auditTheme(id)])), []);
  return html`<div class="wb-col" style="gap:14px">
    <div class="wb-row wb-wrap" style="gap:10px"><div class="wb-grow"><h1 class="wb-h1">Design Tokens & Themes</h1><p class="wb-muted" style="margin-top:4px">Zentrale Quelle: <span class="wb-mono">app/src/design-system/tokens.js</span> (v${TOKENS_VERSION}). Eine Änderung dort wirkt in allen Komponenten und Vorschauen. Themes ändern nur Farben, Oberflächen, Kontraste und Akzente – nie die Informationsarchitektur.</p></div>
      <${Btn} icon="download" onClick=${() => download('takt-design-tokens.json', JSON.stringify(tokensJson(), null, 2))}>Tokens als JSON<//></div>
    <div class="wb-grid wb-grid-3">${THEME_IDS.map((id) => { const a = audit[id]; const st = a.some((x) => x.status === 'fail') ? 'fail' : a.some((x) => x.status === 'warn') ? 'warn' : 'pass';
      return html`<${Card} pad selected=${id === theme} onClick=${() => setTheme(id)}><div class="wb-row"><strong class="wb-grow">${themes[id].label}</strong><${QaCell} status=${st} label="Kontrast-Audit" /></div>
        <div style=${`margin-top:10px;border-radius:10px;padding:14px;background:${themes[id].color.bg};border:1px solid ${themes[id].color.border}`}>
          <div style=${`background:${themes[id].color.surface};border:1px solid ${themes[id].color.border};border-radius:10px;padding:12px;color:${themes[id].color.text}`}>
            <div style="font-weight:700">Überschrift</div><div style=${`color:${themes[id].color.textMuted};font-size:12px`}>Sekundärtext · Meta</div>
            <div style="display:flex;gap:6px;margin-top:10px"><span style=${`background:${themes[id].color.accent};color:${themes[id].color.textOnAccent};padding:4px 10px;border-radius:7px;font-size:12px;font-weight:600`}>Aktion</span>
              ${['success', 'warning', 'danger', 'info'].map((k) => html`<span style=${`width:14px;height:14px;border-radius:50%;background:${themes[id].color[k]};align-self:center`}></span>`)}</div></div></div>
        <p class="wb-small wb-muted" style="margin-top:8px">${themes[id].note}</p><//>`; })}</div>
    <${Card} title=${`Farbrollen – ${t.label}`}>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px">${COLOR_ROLES.map((r) => html`<div class="wb-row" style="gap:8px"><span style=${`width:28px;height:28px;border-radius:7px;flex:none;background:${t.color[r]};box-shadow:0 0 0 1px var(--wb-border-strong)`}></span>
        <div style="min-width:0"><div class="wb-small wb-trunc" style="font-weight:550">${r}</div><div class="wb-xs wb-mono wb-subtle wb-trunc">${t.color[r]}</div></div></div>`)}</div>
      <div class="wb-label" style="margin-top:14px">Diagramm-Palette</div><div class="wb-row" style="gap:6px;margin-top:6px">${t.chart.map((c) => html`<span style=${`width:40px;height:18px;border-radius:5px;background:${c}`} title=${c}></span>`)}</div><//>
    <div class="wb-grid wb-grid-2">
      <${Card} title="Kontrast-Audit">${audit[theme].map((c) => html`<div class="wb-row" style="padding:4px 0"><${QaCell} status=${c.status} /><span class="wb-grow wb-small">${c.name}</span><span class="wb-small wb-mono wb-subtle">${c.detail}</span></div>`)}<//>
      <${Card} title="Typografie, Abstände, Radien">
        <div class="wb-col" style="gap:4px">${Object.entries(base.font.size).reverse().map(([k, v]) => html`<div class="wb-row" style="gap:12px"><span class="wb-mono wb-subtle" style="width:46px">${k}</span><span style=${`font-size:${v}px;font-weight:${v > 18 ? 700 : 500};line-height:1.2`} class="wb-trunc">Termin 09:45 · ${v}px</span></div>`)}</div>
        <div class="wb-label" style="margin-top:12px">Abstände</div><div class="wb-row" style="align-items:flex-end;gap:6px;margin-top:6px">${Object.entries(base.space).filter(([k]) => k !== '0').map(([k, v]) => html`<div class="wb-col" style="gap:2px;align-items:center"><span style=${`width:${v}px;height:${v}px;background:var(--wb-accent-soft);border:1px solid var(--wb-accent);border-radius:3px`}></span><span class="wb-xs wb-subtle">${v}</span></div>`)}</div>
        <div class="wb-label" style="margin-top:12px">Radien · Breakpoints</div><div class="wb-small wb-muted">${Object.entries(base.radius).map(([k, v]) => `${k} ${v}`).join(' · ')}<br />Tablet ≥ ${base.breakpoint.tablet} px · Desktop ≥ ${base.breakpoint.desktop} px · Touch-Ziel ${base.size.touch} px</div><//>
    </div>
  </div>`;
}

function ComponentDetail({ state, def }) {
  const [st, setSt] = useState('default');
  const [theme, setTheme] = useState(state.settings.previewTheme);
  const [device, setDevice] = useState('mobile');
  const payload = useMemo(() => buildComponentPayload(def.id, { theme, state: st }), [def.id, theme, st]);
  const usage = componentUsage(state).get(def.id) || [];
  const affected = affectedFeatures(state, [def.id]);
  const meta = state.components[def.id] || {};
  const errs = validateComponent(def);
  return html`<div class="wb-col" style="gap:14px">
    <div class="wb-row wb-wrap" style="gap:12px;align-items:flex-start">
      <div class="wb-grow"><div class="wb-label" style="margin-bottom:4px">${def.category}</div><h1 class="wb-h1">${def.name}</h1><div class="wb-row" style="gap:8px;margin-top:6px"><span class="wb-mono wb-subtle">${def.id}</span><${Badge} sq>v${def.version || '1.0'}<//>${def.deprecated && html`<${Badge} tone="danger" sq>veraltet<//>`}</div>
        <p class="wb-muted" style="margin-top:8px;max-width:760px">${def.description}</p></div>
      <div class="wb-col" style="gap:6px;width:220px"><${Select} size="sm" value=${meta.status || 'stable'} onChange=${(v) => act(() => actions.updateComponentMeta(def.id, { status: v }))} options=${COMP_STATUS} aria-label="Komponentenstatus" />
        <${Btn} icon="shield-check" disabled=${!affected.length} onClick=${() => qaRunDialog({ jobs: affected.map((a) => ({ featureId: a.featureId, variantId: '*' })), title: `Regression – ${def.name} (${affected.length} Features)`, scope: `Komponente ${def.id}` })}>Betroffene prüfen (${affected.length})<//></div>
    </div>
    ${errs.length > 0 && html`<div class="wb-banner wb-banner--warn"><${Icon} name="alert-triangle" size=${16} /><span>Vertragsverletzungen: ${errs.join('; ')}</span></div>`}
    <div class="wb-grid" style="grid-template-columns:minmax(0,1fr) 330px;align-items:start">
      <div class="wb-col" style="gap:10px">
        <div class="wb-row wb-wrap" style="gap:8px"><${Seg} value=${device} onChange=${setDevice} options=${[{ value: 'mobile', label: 'Mobile', icon: 'smartphone' }, { value: 'tablet', label: 'Tablet', icon: 'tablet' }, { value: 'notebook', label: 'Desktop', icon: 'monitor' }]} />
          <${Seg} value=${theme} onChange=${setTheme} options=${THEME_IDS.map((t) => ({ value: t, label: themes[t].label }))} />
          <${Seg} value=${st} onChange=${setSt} options=${UI_STATES.map((s) => ({ value: s.id, label: s.label }))} /></div>
        <div class="wb-canvas" style="border-radius:12px;border:1px solid var(--wb-border);padding:16px"><${PreviewFrame} payload=${payload} device=${device} height=${device === 'mobile' ? 700 : 620} maxHeight=${560} /></div>
      </div>
      <div class="wb-col" style="gap:12px">
        <${Card} title="Notiz / Änderungsbedarf"><${TextInput} multiline rows="3" value=${meta.notes || ''} placeholder="z. B. Touch-Ziele vergrößern, Variante für Dichte" onCommit=${(v) => act(() => actions.updateComponentMeta(def.id, { notes: v }))} /><//>
        <${Card} title=${`Verwendung (${usage.length})`} sub="Varianten, die diese Komponente nutzen – Grundlage für selektive Regression.">
          ${!usage.length ? html`<div class="wb-small wb-subtle">Noch in keiner Variante verwendet.</div>` : html`<div class="wb-col" style="gap:0;margin:-8px -16px -16px;max-height:260px;overflow:auto">${usage.map((u) => html`<a class="wb-listrow is-click" style="color:inherit;text-decoration:none" href=${studioHref(u.featureId, u.variantId)}>
            <span class="wb-var__letter" style="width:22px;height:22px;font-size:11px">${u.variantId}</span><div class="wb-grow"><div class="wb-trunc wb-small" style="font-weight:550">${u.featureName}</div><div class="wb-xs wb-subtle">${state.modules.find((m) => m.id === u.moduleId)?.name} · ${u.variantName}</div></div>
            ${u.selected && html`<span style="color:var(--wb-warning)"><${Icon} name="star" size=${12} /></span>`}${u.released && html`<span class="wb-subtle" title="freigegeben"><${Icon} name="lock" size=${12} /></span>`}</a>`)}</div>`}<//>
      </div>
    </div>
    <div class="wb-grid wb-grid-2">
      <${Card} title="Eigenschaften (Props)">${(def.props || []).length ? html`<table class="wb-table"><thead><tr><th>Name</th><th>Typ</th><th>Standard</th></tr></thead><tbody>${def.props.map((p) => html`<tr><td><span class="wb-mono">${p.name}</span><div class="wb-xs wb-subtle">${p.label}</div></td><td class="wb-small">${p.type}${p.options ? `: ${p.options.join(' | ')}` : ''}</td><td class="wb-mono wb-small wb-trunc" style="max-width:200px">${JSON.stringify(p.default)}</td></tr>`)}</tbody></table>` : html`<div class="wb-small wb-subtle">Keine.</div>`}<//>
      <div class="wb-col" style="gap:14px">
        <${Card} title="Datenslots">${(def.data || []).length ? def.data.map((d) => html`<div style="padding:4px 0"><span class="wb-mono">${d.slot}</span> <span class="wb-small wb-muted">← Standard-Schlüssel „${d.default}“${d.required ? ' · Pflicht' : ''}</span><div class="wb-xs wb-mono wb-subtle">${d.shape}</div></div>`) : html`<div class="wb-small wb-subtle">Keine – rein konfigurierbar.</div>`}<//>
        <${Card} title="Events & Zustände"><div class="wb-small"><span class="wb-muted">Events:</span> <span class="wb-mono">${(def.events || []).join(', ') || '–'}</span></div>
          <div class="wb-small" style="margin-top:6px"><span class="wb-muted">Selbst gerenderte Zustände:</span> ${(def.states || []).join(', ') || '–'} <span class="wb-subtle">(übrige rendert die Runtime generisch)</span></div><//>
      </div>
    </div>
  </div>`;
}

export function LibraryView({ state, componentId }) {
  const [q, setQ] = useState('');
  const def = componentId && componentId !== 'tokens' ? getComponent(componentId) : null;
  const usage = useMemo(() => componentUsage(state), [state]);
  const n = q.trim().toLowerCase();
  const groups = componentsByCategory().map(([c, l]) => [c, l.filter((x) => !n || `${x.name} ${x.id} ${x.description}`.toLowerCase().includes(n))]).filter(([, l]) => l.length);
  return html`<div class="wb-page" style="max-width:none">
    <div class="wb-grid" style="grid-template-columns:270px minmax(0,1fr);align-items:start;gap:20px">
      <div class="wb-card" style="position:sticky;top:0;max-height:calc(100vh - 100px);overflow:auto">
        <div style="padding:12px 12px 8px"><div class="wb-search"><${Icon} name="search" size=${15} /><input class="wb-input wb-input--sm" placeholder="Komponente suchen …" value=${q} onInput=${(e) => setQ(e.currentTarget.value)} /></div></div>
        <a class=${cx('wb-listrow is-click', (!componentId || componentId === 'tokens') && 'is-active')} style="color:inherit;text-decoration:none;border:0" href="#/library/tokens"><${Icon} name="swatch-book" size=${15} /><strong>Design Tokens & Themes</strong></a>
        ${groups.map(([cat, list]) => html`<div class="wb-nav__label" style="padding:12px 14px 4px">${cat} · ${list.length}</div>
          ${list.map((c) => html`<a class=${cx('wb-listrow is-click', c.id === componentId && 'is-active')} style="color:inherit;text-decoration:none;border:0;padding:6px 14px" href=${`#/library/${c.id}`} data-component=${c.id}>
            <span class="wb-grow wb-trunc">${c.name}</span><span class="wb-xs wb-subtle wb-num">${(usage.get(c.id) || []).length || ''}</span>${state.components[c.id]?.status && state.components[c.id].status !== 'stable' && html`<span class="wb-dot" style="color:var(--wb-warning)" title=${state.components[c.id].status}></span>`}</a>`)}`)}
        <div class="wb-xs wb-subtle" style="padding:12px 14px">${COMPONENTS.length} Komponenten · Neue Komponenten im Code anlegen (library/CONTRACT.md).</div>
      </div>
      <div>${def ? html`<${ComponentDetail} key=${def.id} state=${state} def=${def} />` : componentId && componentId !== 'tokens' ? html`<${Empty} title="Komponente nicht gefunden" />` : html`<${TokensPanel} />`}</div>
    </div>
  </div>`;
}
