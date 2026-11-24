// ============================================================================
// DESIGN STUDIO – Varianten gestalten: Layout wählen, Blöcke aus der Bibliothek
// hinzufügen/anordnen, Props & Datenbindung im Inspector, Live-Vorschau in
// echten Viewport-Breiten (einzeln oder mehrere gleichzeitig).
// ============================================================================
import { html } from '../../lib/html.js';
import { useState, useMemo, useCallback, useEffect } from 'preact/hooks';
import { Icon } from '../../lib/icons.js';
import { Btn, IconBtn, Badge, Empty, Select, TextInput, Checkbox, Field, openDialog, openMenu, confirmDialog, promptDialog, toast, Seg } from '../ui/kit.js';
import { act, newWorkingVersionDialog, qaRunDialog } from './common.js';
import { preferDialog } from './ws-design.js';
import { actions, getState } from '../store.js';
import { buildFeaturePayload } from '../../core/preview-payload.js';
import { deviceById } from '../../core/devices.js';
import { COMPONENTS, componentsByCategory, getComponent, defaultProps } from '../../library/registry.js';
import { LAYOUT_TYPES, layoutInfo, REGION_LABELS } from '../../preview/layouts.js';
import { PreviewFrame, PreviewToolbar } from '../ui/preview-frame.js';
import { navigate, studioHref, featureHref } from '../router.js';
import { statusInfo } from '../../core/schema.js';
import { cx } from '../../lib/util.js';

// ------------------------------------------------------ Komponenten-Picker ---
export function componentPicker(onPick, regionDefault = 'main', regions = ['main']) {
  openDialog({ title: 'Block hinzufügen', size: 'wide', body: ({ close }) => {
    const [q, setQ] = useState(''); const [region, setRegion] = useState(regions.includes(regionDefault) ? regionDefault : 'main');
    const n = q.trim().toLowerCase();
    const groups = componentsByCategory().map(([cat, list]) => [cat, list.filter((c) => !n || `${c.name} ${c.id} ${c.description} ${cat}`.toLowerCase().includes(n))]).filter(([, l]) => l.length);
    return html`<div class="wb-row" style="gap:10px"><div class="wb-search wb-grow"><${Icon} name="search" size=${15} /><input class="wb-input" autofocus placeholder="Komponente suchen (z. B. Liste, Kalender, Diagramm) …" value=${q} onInput=${(e) => setQ(e.currentTarget.value)} /></div>
      <${Select} style="width:auto" value=${region} onChange=${setRegion} options=${regions.map((r) => ({ value: r, label: `Region: ${REGION_LABELS[r]}` }))} /></div>
      <div style="max-height:56vh;overflow:auto;display:flex;flex-direction:column;gap:14px">${groups.map(([cat, list]) => html`<div><div class="wb-label" style="margin-bottom:6px">${cat}</div>
        <div class="wb-grid wb-grid-2" style="gap:8px">${list.map((c) => html`<button type="button" class="wb-card wb-card--hover" style="text-align:left;padding:10px 12px;display:flex;gap:10px;align-items:flex-start" data-component=${c.id} onClick=${() => { onPick(c.id, region); close(); }}>
          <span style="width:30px;height:30px;border-radius:8px;display:grid;place-items:center;background:var(--wb-accent-soft);color:var(--wb-accent);flex:none"><${Icon} name="component" size=${15} /></span>
          <div class="wb-grow"><div style="font-weight:600">${c.name} <span class="wb-mono wb-subtle" style="font-weight:400">${c.id}</span></div><div class="wb-small wb-muted" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${c.description}</div></div></button>`)}</div></div>`)}
        ${!groups.length && html`<${Empty} title="Keine Komponente gefunden" text="Neue Komponenten werden im Code angelegt (app/src/library/components, siehe CONTRACT.md)." />`}</div>`;
  } });
}

// --------------------------------------------------------------- Prop-Feld ---
function PropField({ spec, value, onChange, disabled }) {
  const label = spec.label || spec.name;
  switch (spec.type) {
    case 'boolean': return html`<${Checkbox} label=${label} checked=${!!value} disabled=${disabled} onChange=${onChange} />`;
    case 'number': return html`<${Field} label=${label}><${TextInput} size="sm" type="number" value=${value ?? ''} disabled=${disabled} onCommit=${(v) => onChange(v === '' ? undefined : Number(v))} /><//>`;
    case 'select': return html`<${Field} label=${label}><${Select} size="sm" value=${value ?? ''} disabled=${disabled} onChange=${onChange} options=${spec.options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o))} /><//>`;
    case 'textarea': return html`<${Field} label=${label}><${TextInput} multiline rows="3" value=${value ?? ''} disabled=${disabled} onCommit=${onChange} /><//>`;
    case 'list': return html`<${Field} label=${label} hint="Kommagetrennt"><${TextInput} size="sm" value=${Array.isArray(value) ? value.join(', ') : value ?? ''} disabled=${disabled} onCommit=${(v) => onChange(v.split(',').map((s) => s.trim()).filter(Boolean))} /><//>`;
    default: return html`<${Field} label=${label}><${TextInput} size="sm" value=${value ?? ''} disabled=${disabled} onCommit=${onChange} /><//>`;
  }
}

// --------------------------------------------------------------- Inspector ---
function BlockInspector({ f, v, block, locked, onDeselect }) {
  const def = getComponent(block.component);
  const idx = v.blocks.findIndex((b) => b.id === block.id);
  const regions = layoutInfo(v.layout?.type).regions;
  const upd = (patch, label) => act(() => actions.updateBlock(f.id, v.id, block.id, patch, label));
  const props = { ...defaultProps(def), ...(block.props || {}) };
  const keys = Object.keys(f.demoData || {});
  const hide = block.hideOn || [];
  return html`<div>
    <div class="wb-section"><div class="wb-section__head"><span style="color:var(--wb-accent)"><${Icon} name="component" size=${16} /></span><strong class="wb-grow wb-trunc">${def?.name || block.component}</strong><${IconBtn} icon="x" label="Auswahl aufheben" onClick=${onDeselect} /></div>
      <div class="wb-small wb-muted">${def?.description || 'Unbekannte Komponente'}</div>
      <div class="wb-row wb-small" style="gap:6px"><span class="wb-mono wb-subtle">#${block.id}</span><span class="wb-grow"></span><a href=${`#/library/${block.component}`}>In Library</a></div>
      <div class="wb-row" style="gap:4px">
        <${IconBtn} icon="arrow-up" label="Nach oben" disabled=${locked || idx === 0} onClick=${() => act(() => actions.moveBlock(f.id, v.id, block.id, idx - 1))} />
        <${IconBtn} icon="arrow-down" label="Nach unten" disabled=${locked || idx === v.blocks.length - 1} onClick=${() => act(() => actions.moveBlock(f.id, v.id, block.id, idx + 1))} />
        <${IconBtn} icon="copy" label="Duplizieren" disabled=${locked} onClick=${() => act(() => actions.duplicateBlock(f.id, v.id, block.id))} />
        <span class="wb-grow"></span><${Btn} size="sm" variant="danger" icon="trash-2" disabled=${locked} onClick=${() => { act(() => actions.removeBlock(f.id, v.id, block.id)); onDeselect(); }}>Entfernen<//></div></div>
    <div class="wb-section"><div class="wb-label">Platzierung</div>
      <${Field} label="Region"><${Select} size="sm" value=${regions.includes(block.region) ? block.region : 'main'} disabled=${locked} onChange=${(r) => upd({ region: r }, `Block → ${REGION_LABELS[r]}`)} options=${regions.map((r) => ({ value: r, label: REGION_LABELS[r] }))} /><//>
      ${v.layout?.type === 'grid' && html`<div class="wb-grid wb-grid-2" style="gap:8px"><${Field} label="Breite Desktop (1–12)"><${TextInput} size="sm" type="number" min="1" max="12" value=${block.span || 12} disabled=${locked} onCommit=${(x) => upd({ span: Math.max(1, Math.min(12, Number(x) || 12)) }, 'Spannweite geändert')} /><//>
        <${Field} label="Breite Tablet"><${TextInput} size="sm" type="number" min="1" max="12" value=${block.spanTablet || ''} placeholder="auto" disabled=${locked} onCommit=${(x) => upd({ spanTablet: x ? Number(x) : undefined }, 'Spannweite Tablet geändert')} /><//></div>`}
      ${v.layout?.type === 'tabs' && html`<${Field} label="Reiter"><${TextInput} size="sm" value=${block.tab || 'Übersicht'} disabled=${locked} onCommit=${(x) => upd({ tab: x }, 'Reiter geändert')} /><//>`}
      <div class="wb-label" style="margin-top:4px">Ausblenden auf</div>
      <div class="wb-row wb-wrap" style="gap:12px">${['mobile', 'tablet', 'desktop'].map((bp) => html`<${Checkbox} label=${{ mobile: 'Mobile', tablet: 'Tablet', desktop: 'Desktop' }[bp]} checked=${hide.includes(bp)} disabled=${locked} onChange=${(on) => upd({ hideOn: on ? [...hide, bp] : hide.filter((x) => x !== bp) }, 'Sichtbarkeit geändert')} />`)}</div></div>
    ${(def?.data || []).length > 0 && html`<div class="wb-section"><div class="wb-label">Datenbindung</div>
      ${def.data.map((slot) => html`<${Field} label=${`${slot.label} (${slot.slot})`} hint=${slot.shape}><${Select} size="sm" disabled=${locked} value=${block.bind?.[slot.slot] ?? slot.default}
        onChange=${(k) => upd({ bind: { ...(block.bind || {}), [slot.slot]: k } }, `Bindung ${slot.slot} → ${k}`)} options=${[...new Set([...keys, block.bind?.[slot.slot] ?? slot.default])].map((k) => ({ value: k, label: keys.includes(k) ? k : `${k} (fehlt)` }))} /><//>`)}
      <a class="wb-small" href=${featureHref(f.id, 'data')}>Demo-Daten bearbeiten</a></div>`}
    <div class="wb-section"><div class="wb-row"><div class="wb-label wb-grow">Eigenschaften</div><${Btn} size="sm" variant="ghost" icon="rotate-ccw" disabled=${locked} onClick=${() => upd({ props: {} }, 'Props zurückgesetzt')}>Standard<//></div>
      ${(def?.props || []).length ? def.props.map((spec) => html`<${PropField} key=${spec.name} spec=${spec} value=${props[spec.name]} disabled=${locked} onChange=${(val) => act(() => actions.setBlockProp(f.id, v.id, block.id, spec.name, val))} />`)
        : html`<div class="wb-small wb-subtle">Keine konfigurierbaren Eigenschaften.</div>`}
      ${(def?.events || []).length > 0 && html`<div class="wb-small wb-subtle">Events: <span class="wb-mono">${def.events.join(', ')}</span></div>`}</div>
  </div>`;
}

function VariantInspector({ f, v, locked }) {
  const upd = (patch, label) => act(() => actions.updateVariant(f.id, v.id, patch, label));
  const L = v.layout || { type: 'stack' };
  return html`<div>
    <div class="wb-section"><div class="wb-label">Variante ${v.id}</div>
      <${Field} label="Name"><${TextInput} size="sm" value=${v.name} disabled=${locked} onCommit=${(x) => upd({ name: x }, `Variante umbenannt: ${x}`)} /><//>
      <${Field} label="Konzept" hint="Kernidee: Informationshierarchie, Bedienkonzept – nicht nur Farben."><${TextInput} multiline rows="4" value=${v.concept} disabled=${locked} onCommit=${(x) => upd({ concept: x }, 'Konzept bearbeitet')} /><//>
      <${Field} label="Stärken / Schwächen"><${TextInput} multiline rows="3" value=${v.description} disabled=${locked} onCommit=${(x) => upd({ description: x }, 'Beschreibung bearbeitet')} /><//>
      <${Field} label="Design-Richtung (Version im Demo-Launcher)" hint="Ordnet die Variante einer durchgängigen Version der App zu."><${Select} size="sm" value=${v.direction || ''} disabled=${locked}
        onChange=${(d) => act(() => actions.setVariantDirection(f.id, v.id, d))} options=${[{ value: '', label: '– keine –' }, ...(getState().directions || []).map((d) => ({ value: d.id, label: `${d.name} – ${d.claim}` }))]} /><//>
      ${f.selectedVariantId === v.id ? html`<${Badge} tone="warning" icon="star">Bevorzugte Variante<//>` : html`<${Btn} size="sm" icon="star" disabled=${locked} onClick=${() => preferDialog(f, v)}>Als bevorzugt wählen<//>`}</div>
    <div class="wb-section"><div class="wb-label">Layout</div>
      <div class="wb-layoutpick">${LAYOUT_TYPES.map((t) => html`<button type="button" aria-pressed=${String(L.type === t.id)} disabled=${locked} title=${t.hint} onClick=${() => upd({ layout: { ...L, type: t.id } }, `Layout → ${t.label}`)}><${Icon} name=${t.icon} size=${18} />${t.label}</button>`)}</div>
      <div class="wb-small wb-subtle">${layoutInfo(L.type).hint}</div>
      ${L.type === 'stack' && html`<${Checkbox} label="Schmale Inhaltsbreite (760 px)" checked=${!!L.narrow} disabled=${locked} onChange=${(x) => upd({ layout: { ...L, narrow: x } }, 'Layout-Option geändert')} />`}
      ${L.type === 'split' && html`<${Checkbox} label="Gleich breite Spalten" checked=${!!L.even} disabled=${locked} onChange=${(x) => upd({ layout: { ...L, even: x } }, 'Layout-Option geändert')} />
        <${Checkbox} label="Seitenspalte auf Mobile zuerst" checked=${!!L.asideFirstOnMobile} disabled=${locked} onChange=${(x) => upd({ layout: { ...L, asideFirstOnMobile: x } }, 'Layout-Option geändert')} />`}
      ${L.type === 'sidebar' && html`<${Field} label="Beschriftung Panel (Mobile)"><${TextInput} size="sm" value=${L.panelLabel || 'Filter & Navigation'} disabled=${locked} onCommit=${(x) => upd({ layout: { ...L, panelLabel: x } }, 'Layout-Option geändert')} /><//>`}
    </div>
    <div class="wb-section wb-small wb-subtle">Tipp: Alt+Klick in der Vorschau wählt einen Block aus. Blöcke per Drag & Drop in der Gliederung sortieren oder auf eine Region ziehen.</div>
  </div>`;
}

// ---------------------------------------------------------------- Studio ---
export function StudioView({ state, feature: f, variantId }) {
  const [blockId, setBlockId] = useState(null);
  const [multi, setMulti] = useState(false);
  const [log, setLog] = useState([]);
  const [showLog, setShowLog] = useState(false);
  const [drag, setDrag] = useState(null); const [over, setOver] = useState(null);
  const [zoom, setZoom] = useState('fit');
  useEffect(() => { if (f && state.settings.lastFeatureId !== f.id) actions.setSetting('lastFeatureId', f.id); }, [f?.id]);
  const s = state.settings;
  const v = f?.variants.find((x) => x.id === variantId) || f?.variants.find((x) => x.id === f.selectedVariantId) || f?.variants[0];
  const block = v?.blocks.find((b) => b.id === blockId);
  const payload = useMemo(() => (f && v ? { ...buildFeaturePayload(state, f.id, v.id, { theme: s.previewTheme, state: s.previewState, chrome: s.chrome, scenario: s.previewScenario }), highlightBlock: blockId } : null), [state, f?.id, v?.id, s.previewTheme, s.previewState, s.chrome, s.previewScenario, blockId]);
  const onInteraction = useCallback((m) => {
    if (m.type === 'select-block') { setBlockId(m.blockId); return; }
    if (m.type === 'interaction' || m.type === 'render-error') setLog((l) => [{ id: Math.random(), ev: m.event || 'render-error', detail: m.detail || m.message, ts: new Date() }, ...l].slice(0, 40));
  }, []);

  const groups = {};
  for (const m of state.modules.filter((x) => !x.archived).sort((a, b) => a.order - b.order)) groups[m.name] = state.features.filter((x) => x.moduleId === m.id && !x.archived);
  const picker = html`<select class="wb-select wb-select--sm" value=${f?.id || ''} onChange=${(e) => navigate(studioHref(e.currentTarget.value))} aria-label="Feature wählen">
    ${!f && html`<option value="">Feature wählen …</option>`}${Object.entries(groups).map(([g, list]) => html`<optgroup label=${g}>${list.map((x) => html`<option value=${x.id}>${x.name} (${x.variants.length})</option>`)}</optgroup>`)}</select>`;
  if (!f) return html`<div class="wb-page"><h1 class="wb-h1">Design Studio</h1><div style="max-width:420px">${picker}</div><${Empty} icon="palette" title="Feature wählen" /></div>`;
  const locked = f.locked;
  const regions = layoutInfo(v?.layout?.type).regions;
  const addBlock = (region) => componentPicker((cid, r) => { const id = act(() => actions.addBlock(f.id, v.id, cid, r)); if (id) setBlockId(id); }, region || block?.region || 'main', regions);
  const newVariant = (e) => openMenu(e, [
    { label: 'Leere Variante', icon: 'plus', onClick: () => { const id = act(() => actions.addVariant(f.id, {})); if (id) navigate(studioHref(f.id, id)); } },
    v && { label: `Aus ${v.id} ableiten (duplizieren)`, icon: 'copy', onClick: () => { const id = act(() => actions.addVariant(f.id, { from: v.id })); if (id) navigate(studioHref(f.id, id)); } },
    { sep: true }, ...LAYOUT_TYPES.map((t) => ({ label: `Neu mit Layout „${t.label}“`, icon: t.icon, onClick: () => { const id = act(() => actions.addVariant(f.id, { layoutType: t.id })); if (id) navigate(studioHref(f.id, id)); } })),
  ]);
  const variantMenu = (e, x) => openMenu(e, [
    { label: 'Umbenennen', icon: 'pencil', disabled: locked, onClick: async () => { const n = await promptDialog({ title: 'Variante umbenennen', label: 'Name', value: x.name }); if (n) act(() => actions.updateVariant(f.id, x.id, { name: n }, `Variante umbenannt: ${n}`)); } },
    { label: 'Duplizieren', icon: 'copy', disabled: locked, onClick: () => { const id = act(() => actions.addVariant(f.id, { from: x.id })); if (id) navigate(studioHref(f.id, id)); } },
    { label: 'Als bevorzugt wählen', icon: 'star', disabled: locked || f.selectedVariantId === x.id, onClick: () => preferDialog(f, x) },
    { sep: true },
    { label: 'Löschen …', icon: 'trash-2', danger: true, disabled: locked, onClick: async () => { if (await confirmDialog({ title: `Variante ${x.id} löschen?`, text: `„${x.name}“ wird entfernt (Rückgängig mit Strg+Z; gesicherte Versionen bleiben erhalten).`, danger: true, confirmLabel: 'Löschen' })) { act(() => actions.deleteVariant(f.id, x.id)); navigate(studioHref(f.id)); } } },
  ]);
  const dropOn = (targetIndex, region) => {
    if (!drag || locked) return;
    const b = v.blocks.find((x) => x.id === drag);
    if (region && b.region !== region) act(() => actions.updateBlock(f.id, v.id, drag, { region }, `Block → ${REGION_LABELS[region]}`));
    if (targetIndex != null) act(() => actions.moveBlock(f.id, v.id, drag, targetIndex > v.blocks.findIndex((x) => x.id === drag) ? targetIndex - 1 : targetIndex));
    setDrag(null); setOver(null);
  };
  const devs = multi ? (s.multiViewports || ['desktop', 'tablet', 'mobile']) : [s.viewport];

  return html`<div class="wb-page wb-page--full"><div class="wb-studio">
    <aside class="wb-studio__left" aria-label="Varianten und Gliederung">
      <div class="wb-section"><div class="wb-label">Feature</div>${picker}
        <div class="wb-row wb-small" style="gap:6px"><span class="wb-muted">${statusInfo(f.status).label} · v${f.version}</span><span class="wb-grow"></span><a href=${featureHref(f.id)}>Workspace</a></div></div>
      ${locked && html`<div class="wb-section" style="background:var(--wb-success-soft)"><div class="wb-row wb-small"><${Icon} name="lock" size=${14} /><span class="wb-grow">Freigegeben – nur ansehen.</span></div><${Btn} size="sm" icon="git-branch" onClick=${() => newWorkingVersionDialog(f.id)}>Neue Arbeitsversion<//></div>`}
      <div class="wb-section"><div class="wb-section__head"><div class="wb-label wb-grow">Varianten</div><${Btn} size="sm" icon="plus" disabled=${locked} onClick=${newVariant}>Neu<//></div>
        <div class="wb-varlist">${f.variants.map((x) => html`<div class=${cx('wb-var', x.id === v?.id && 'is-active')} onClick=${() => { setBlockId(null); navigate(studioHref(f.id, x.id)); }} data-variant=${x.id}>
          <span class="wb-var__letter">${x.id}</span><div class="wb-grow"><div class="wb-trunc" style="font-weight:600">${x.name}</div><div class="wb-xs wb-subtle">${layoutInfo(x.layout?.type).label} · ${x.blocks.length} Blöcke${x.direction ? ` · ${(state.directions || []).find((d) => d.id === x.direction)?.name || x.direction}` : ''}</div></div>
          ${f.selectedVariantId === x.id && html`<span style="color:var(--wb-warning)" title="Bevorzugt"><${Icon} name="star" size=${14} /></span>`}<${IconBtn} icon="more-vertical" label="Variantenaktionen" onClick=${(e) => { e.stopPropagation(); variantMenu(e, x); }} /></div>`)}
          ${!f.variants.length && html`<div class="wb-small wb-subtle">Noch keine Variante.</div>`}</div></div>
      ${v && html`<div class="wb-section" style="flex:1"><div class="wb-section__head"><div class="wb-label wb-grow">Gliederung</div><${Btn} size="sm" variant="primary" icon="plus" disabled=${locked} onClick=${() => addBlock()} data-qa="add-block">Block<//></div>
        <div>${regions.map((r) => { const list = v.blocks.filter((b) => (regions.includes(b.region) ? b.region : 'main') === r); return html`<div onDragOver=${(e) => { if (drag) { e.preventDefault(); setOver(`r:${r}`); } }} onDrop=${(e) => { e.preventDefault(); dropOn(null, r); }}>
          <div class="wb-outline-region" style=${over === `r:${r}` ? 'color:var(--wb-accent)' : ''}><span>${REGION_LABELS[r]}</span><${IconBtn} icon="plus" label=${`Block in ${REGION_LABELS[r]}`} disabled=${locked} onClick=${() => addBlock(r)} /></div>
          ${!list.length && html`<div class="wb-xs wb-subtle" style="padding:2px 6px 6px">leer</div>`}
          ${list.map((b) => { const d = getComponent(b.component); const gi = v.blocks.indexOf(b); return html`<div class=${cx('wb-outline-item', b.id === blockId && 'is-active', over === b.id && 'is-drop')} draggable=${!locked}
            onDragStart=${(e) => { setDrag(b.id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', b.id); }} onDragEnd=${() => { setDrag(null); setOver(null); }}
            onDragOver=${(e) => { if (drag) { e.preventDefault(); e.stopPropagation(); setOver(b.id); } }} onDrop=${(e) => { e.preventDefault(); e.stopPropagation(); dropOn(gi, r); }}
            onClick=${() => setBlockId(b.id === blockId ? null : b.id)} data-block=${b.id}>
            <span class="wb-grip"><${Icon} name="grip-vertical" size=${14} /></span><div class="wb-grow"><div class="wb-trunc" style="font-weight:550;font-size:13px">${d?.name || b.component}${!d && html` <span style="color:var(--wb-danger)">(unbekannt)</span>`}</div>
              <div class="wb-xs wb-subtle wb-trunc">#${b.id}${b.props?.title ? ` · ${b.props.title}` : ''}${b.span ? ` · ${b.span}/12` : ''}${b.tab ? ` · ${b.tab}` : ''}</div></div>
            ${(b.hideOn || []).map((h) => html`<span title=${`ausgeblendet auf ${h}`} class="wb-subtle"><${Icon} name=${{ mobile: 'smartphone', tablet: 'tablet', desktop: 'monitor' }[h]} size=${12} /></span>`)}</div>`; })}</div>`; })}</div></div>`}
    </aside>

    <section class="wb-studio__center">
      <div class="wb-studio__toolbar"><${PreviewToolbar} settings=${s} onChange=${(p) => actions.setSettings(p)} multi=${multi} onMulti=${setMulti}
        extra=${html`${!multi && html`<${Seg} value=${zoom} onChange=${setZoom} options=${[{ value: 'fit', label: 'Einpassen' }, { value: '100', label: '100 %' }]} />`}
          <${Btn} size="sm" icon="zap" pressed=${showLog} onClick=${() => setShowLog(!showLog)}>Log${log.length ? ` (${log.length})` : ''}<//>
          <${Btn} size="sm" icon="shield-check" disabled=${!v} onClick=${() => qaRunDialog({ jobs: [{ featureId: f.id, variantId: v.id }], title: `QA – ${f.name} · Variante ${v.id}` })}>QA<//>
          <${Btn} size="sm" icon="smartphone" disabled=${!v} title="In App ansehen: ganze App mit dieser Variante, Rest Arbeitsstand (Mobile, neuer Tab)" onClick=${() => window.open(`./preview.html?app=1&version=${encodeURIComponent(`pin:${f.id}:${v.id}`)}&theme=${s.previewTheme}&scenario=${s.previewScenario || 'alltag'}`, '_blank', 'popup,width=420,height=880')} data-qa="studio-in-app">In App<//>
          <${Btn} size="sm" icon="external-link" disabled=${!v} title="Vorschau in neuem Tab (Direktlink, auch für echte Geräte)" onClick=${() => window.open(`./preview.html?feature=${encodeURIComponent(f.id)}&variant=${encodeURIComponent(v.id)}&theme=${s.previewTheme}&state=${s.previewState}&chrome=${s.chrome ? 1 : 0}&scenario=${s.previewScenario || 'alltag'}`, '_blank')} />`} /></div>
      <div class="wb-studio__stage wb-canvas" data-qa="studio-stage">
        ${!v ? html`<div class="wb-card" style="max-width:460px"><${Empty} icon="palette" title="Noch keine Variante" text="Lege eine Variante an und setze sie aus Bibliothekskomponenten zusammen." action=${html`<${Btn} variant="primary" icon="plus" disabled=${locked} onClick=${newVariant}>Variante anlegen<//>`} /></div>`
          : devs.map((d) => html`<div style=${zoom === '100' && !multi ? '' : `flex:${deviceById(d).width};min-width:0;max-width:${deviceById(d).width}px`}><${PreviewFrame} payload=${payload} device=${d} fit=${zoom !== '100' || multi} maxHeight=${multi ? 620 : 760} onInteraction=${onInteraction} /></div>`)}
      </div>
      ${showLog && html`<div class="wb-log">${!log.length ? html`<div class="wb-log__row wb-subtle">Bediene die Vorschau – Interaktionen erscheinen hier. Alt+Klick wählt Blöcke aus.</div>`
        : log.map((l) => html`<div class="wb-log__row"><span class="wb-num wb-subtle">${l.ts.toLocaleTimeString('de-DE')}</span><span class="wb-mono">${l.ev}</span><span class="wb-grow wb-trunc wb-subtle">${l.detail ? JSON.stringify(l.detail) : ''}</span></div>`)}</div>`}
    </section>

    <aside class="wb-studio__right" aria-label="Inspector">
      ${!v ? html`<div class="wb-section wb-small wb-subtle">Keine Variante gewählt.</div>` : block ? html`<${BlockInspector} key=${block.id} f=${f} v=${v} block=${block} locked=${locked} onDeselect=${() => setBlockId(null)} />` : html`<${VariantInspector} key=${v.id} f=${f} v=${v} locked=${locked} />`}
    </aside>
  </div></div>`;
}
