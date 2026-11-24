// ============================================================================
// PREVIEW-RUNTIME – läuft im <iframe src="preview.html">.
// * Erhält ein Payload (Feature-Variante oder Einzelkomponente) per
//   window.__taktPreview.render(payload) oder postMessage {target:'takt-preview',type:'render'}
// * Eigenständig per URL: preview.html?feature=<id>&variant=<id>&theme=graphite&state=default&chrome=1
//                          preview.html?component=<id>&theme=horizon
// * Meldet Interaktionen an die Workbench: postMessage {source:'takt-preview',type:'interaction'}
// * QA-Sonde: window.__taktQA.run() (genutzt von Workbench UND CLI/Playwright)
// ============================================================================
import { html, render, Component } from '../lib/html.js';
import { useState, useEffect, useCallback, useRef } from 'preact/hooks';
import { Icon } from '../lib/icons.js';
import { tokensStylesheet } from '../design-system/tokens.js';
import { getComponent, defaultProps, allComponentCss } from '../library/registry.js';
import { Skeleton, ErrorState, Card, Button } from '../library/ui.js';
import { Layout } from './layouts.js';
import { runProbe } from './qa-probe.js';
import { clone } from '../lib/util.js';
import * as FMT from '../lib/format.js';
import { isWorldRef, worldKey } from '../seed/world/index.js';

const styleEl = document.createElement('style');
styleEl.id = 'tk-tokens';
styleEl.textContent = tokensStylesheet() + '\n' + allComponentCss();
document.head.append(styleEl);

import { DEFAULT_TODAY } from '../core/preview-payload.js';
const runtimeErrors = [];
window.addEventListener('error', (e) => runtimeErrors.push(String(e.message || e)));
window.addEventListener('unhandledrejection', (e) => runtimeErrors.push(String(e.reason?.message || e.reason)));

const bpOf = (w) => (w < 600 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop');
const post = (msg) => { try { if (window.parent !== window) window.parent.postMessage({ source: 'takt-preview', ...msg }, '*'); } catch { /* noop */ } };

function useViewport() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => { const on = () => setW(window.innerWidth); window.addEventListener('resize', on); return () => window.removeEventListener('resize', on); }, []);
  const bp = bpOf(w);
  document.documentElement.classList.remove('bp-mobile', 'bp-tablet', 'bp-desktop');
  document.documentElement.classList.add(`bp-${bp}`);
  return { width: w, bp };
}

// ---------------------------------------------------------------- Blocks ---
class Boundary extends Component {
  constructor() { super(); this.state = { err: null }; }
  componentDidCatch(err) { this.setState({ err }); post({ type: 'render-error', blockId: this.props.blockId, message: String(err?.message || err) }); console.error('[preview] Block-Fehler', this.props.blockId, err); }
  render() { return this.state.err ? html`<div class="tk-block-error" data-qa="render-error">Render-Fehler in „${this.props.label}“: ${String(this.state.err.message || this.state.err)}</div>` : this.props.children; }
}

const emptyOf = (v) => (Array.isArray(v) ? [] : v && typeof v === 'object' ? (v.segments ? { segments: [] } : v.series ? { ...v, series: [] } : {}) : v);

function BlockBody({ block, def, store, ctx, forcedState }) {
  const [localState, setLocalState] = useState(null);
  const state = localState || forcedState || 'default';
  const handles = def.states || [];
  if (state === 'loading' && !handles.includes('loading')) return html`<${Card}><${Skeleton} lines=${4} /><//>`;
  if (state === 'error' && !handles.includes('error')) return html`<${Card}><${ErrorState} onRetry=${() => { setLocalState('default'); ctx.emit('state.retry', { block: block.id }); }} /><//>`;
  const slots = def.data || [];
  const keyOf = (slot) => block.bind?.[slot] ?? slots.find((s) => s.slot === slot)?.default ?? slot;
  const data = {};
  for (const s of slots) { const v = store.get(keyOf(s.slot)); data[s.slot] = state === 'empty' ? emptyOf(v) : v; }
  const setData = (slot, valOrFn) => store.setData(keyOf(slot), valOrFn);
  const props = { ...defaultProps(def), ...(block.props || {}) };
  const Render = def.render;
  return html`<${Render} props=${props} data=${data} setData=${setData} ctx=${{ ...ctx, state, block }} />`;
}

function Block({ block, store, ctx, forcedState }) {
  const def = getComponent(block.component);
  const hide = block.hideOn || [];
  const style = block.span ? `--span:${block.span};--span-tablet:${block.spanTablet || (block.span >= 6 ? 12 : 6)}` : '';
  return html`<div class="tk-block" data-block-id=${block.id} data-component=${block.component} style=${style}
      data-hide-mobile=${hide.includes('mobile') ? 'true' : undefined} data-hide-tablet=${hide.includes('tablet') ? 'true' : undefined} data-hide-desktop=${hide.includes('desktop') ? 'true' : undefined}>
    ${!def ? html`<div class="tk-block-error" data-qa="render-error">Unbekannte Komponente „${block.component}“ – in der Library nicht registriert.</div>`
      : html`<${Boundary} key=${JSON.stringify(block)} blockId=${block.id} label=${def.name}><${BlockBody} block=${block} def=${def} store=${store} ctx=${ctx} forcedState=${forcedState} /><//>`}
  </div>`;
}

// ------------------------------------------------------------- App-Shell ---
// Generischer TAKT-App-Rahmen. Im Feature-Modus melden Klicks nur Events; im App-Modus (Demo-Launcher)
// navigiert er wirklich (Module, Features eines Moduls, Zurück).
function AppShell({ chrome, bp, modules = [], activeModule, title, moduleName, canBack, onBack, onNavModule, onMore, onTitle, sideFeatures, activeFeature, onFeature, onSearch, onBell, children }) {
  if (!chrome) return html`<div class="tk-bare">${children}</div>`;
  const mods = modules.slice(0, 12);
  document.documentElement.classList.toggle('tk-has-bottomnav', bp === 'mobile');
  const titleBtn = (strong) => (onTitle
    ? html`<button type="button" class="tk-app__titlebtn" onClick=${onTitle} aria-label=${`${title} – Bereiche des Moduls`}>${strong}<${Icon} name="chevron-down" size=${15} /></button>`
    : strong);
  const back = canBack && html`<button class="tk-btn tk-btn--ghost tk-btn--icon" aria-label="Zurück" onClick=${onBack} data-qa="app-back"><${Icon} name="arrow-left" /></button>`;
  if (bp === 'mobile') {
    const bottom = mods.slice(0, 4); const act = mods.find((m) => m.id === activeModule);
    if (act && !bottom.find((m) => m.id === act.id)) bottom[3] = act;
    return html`<div class="tk-app tk-app--mobile">
      <div class="tk-app__top">${back}<div class="tk-app__crumb">${titleBtn(html`<strong class="tk-truncate">${title || moduleName}</strong>`)}</div>
        <button class="tk-btn tk-btn--ghost tk-btn--icon" aria-label="Suche" onClick=${onSearch} data-qa="app-search"><${Icon} name="search" /></button>
        <button class="tk-btn tk-btn--ghost tk-btn--icon" aria-label="Mitteilungen" onClick=${onBell} data-qa="app-bell"><${Icon} name="bell" /></button></div>
      <main class="tk-app__content">${children}</main>
      <nav class="tk-bottomnav" aria-label="Module">${bottom.map((m) => html`<button type="button" aria-current=${m.id === activeModule ? 'page' : undefined} onClick=${() => onNavModule && onNavModule(m.id)} data-nav-module=${m.id}><${Icon} name=${m.icon} size=${21} /><span>${m.name}</span></button>`)}
        <button type="button" onClick=${onMore} data-nav-more><${Icon} name="menu" size=${21} /><span>Mehr</span></button></nav>
    </div>`;
  }
  return html`<div class=${`tk-app tk-app--${bp}`}>
    <nav class="tk-app__nav" aria-label="Module">
      <div class="tk-app__brand"><span class="tk-app__logo">T</span><span>TAKT</span></div>
      <div class="tk-app__navlist">${mods.map((m) => html`<button type="button" class="tk-navitem" aria-current=${m.id === activeModule ? 'page' : undefined} onClick=${() => onNavModule && onNavModule(m.id)} title=${m.name} data-nav-module=${m.id}><${Icon} name=${m.icon} size=${bp === 'tablet' ? 20 : 18} /><span>${m.name}</span></button>
        ${bp === 'desktop' && m.id === activeModule && sideFeatures?.length > 1 && html`<div class="tk-navsub">${sideFeatures.map((f) => html`<button type="button" class="tk-navsub__item" aria-current=${f.id === activeFeature ? 'page' : undefined} onClick=${() => onFeature(f.id)}>${f.name}</button>`)}</div>`}`)}</div>
    </nav>
    <div class="tk-app__main">
      <div class="tk-app__top">${back}<div class="tk-app__crumb"><span>${moduleName}</span><${Icon} name="chevron-right" size=${14} />${titleBtn(html`<strong class="tk-truncate">${title}</strong>`)}</div>
        <button class="tk-btn tk-btn--ghost tk-btn--icon" aria-label="Suche" onClick=${onSearch} data-qa="app-search"><${Icon} name="search" /></button>
        <button class="tk-btn tk-btn--ghost tk-btn--icon" aria-label="Mitteilungen" onClick=${onBell} data-qa="app-bell"><${Icon} name="bell" /></button>
        <span class="tk-avatar" style="width:30px;height:30px" aria-label="Profil"><${Icon} name="user" size=${16} /></span></div>
      <main class="tk-app__content">${children}</main>
    </div>
  </div>`;
}

// ------------------------------------------------------- Dialog & Toast ---
function useOverlays(emit) {
  const [dialogs, setDialogs] = useState([]);
  const [toasts, setToasts] = useState([]);
  return {
    dialogs, toasts,
    openDialog: (d) => { const id = Math.random().toString(36).slice(2); setDialogs((ds) => [...ds, { ...d, id }]); emit('dialog.open', { title: d.title }); return id; },
    toast: (text) => { const id = Math.random().toString(36).slice(2); setToasts((t) => [...t, { id, text }]); setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2200); },
    closeDialog: (id) => { setDialogs((ds) => ds.filter((d) => d.id !== id)); emit('dialog.close'); },
  };
}

function Overlays({ dialogs, closeDialog, toasts }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && dialogs.length) closeDialog(dialogs[dialogs.length - 1].id); };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [dialogs]);
  return html`${dialogs.map((d) => { const close = () => closeDialog(d.id); return html`<div class="tk-overlay" onClick=${(e) => e.target === e.currentTarget && close()}>
    <div class="tk-dialog" role="dialog" aria-modal="true" aria-label=${d.title}>
      <div class="tk-dialog__head"><div class="tk-dialog__title">${d.title}</div><button class="tk-btn tk-btn--ghost tk-btn--icon tk-btn--sm" aria-label="Schließen" onClick=${close}><${Icon} name="x" size=${16} /></button></div>
      <div class="tk-dialog__body">${typeof d.body === 'function' ? d.body(close) : d.body}</div>
      ${d.footer && html`<div class="tk-dialog__foot">${d.footer(close)}</div>`}
    </div></div>`; })}
  <div class="tk-toasts" aria-live="polite">${toasts.map((t) => html`<div class="tk-toast" key=${t.id}><${Icon} name="check-circle-2" size=${16} />${t.text}</div>`)}</div>`;
}

// ------------------------------------------------------------- Screen ---
// Ein Screen = eine Variante mit eigenen Vorschau-Daten und eigenem UI-Zustand.
// cache (optional): Map, in der der Bedienzustand beim Navigieren erhalten bleibt (App-Modus).
function Screen({ variant, demoData, cacheKey, cache, theme, today, forcedState, overlays, emit, bp, width, world, privacy, params, env }) {
  const cached = cache && cache.get(cacheKey);
  const [data, setDataState] = useState(() => cached?.data || clone(demoData || {}));
  const [ui, setUiState] = useState(() => ({ ...(cached?.ui || {}), ...(params?.id != null ? { selectedId: params.id } : {}), ...(params?.ui || {}) }));
  useEffect(() => { if (cache) cache.set(cacheKey, { data, ui }); }, [data, ui]);
  // Datenschlüssel mit '@world:…' lesen/schreiben den gemeinsamen Weltzustand (modulübergreifend)
  const store = {
    get: (key) => { const v = data[key]; return isWorldRef(v) ? world?.data[worldKey(v)] : v; },
    setData: (key, v) => {
      if (isWorldRef(data[key]) && world) return world.setData(worldKey(data[key]), v);
      setDataState((d) => ({ ...d, [key]: typeof v === 'function' ? v(d[key] ?? []) : v }));
    },
  };
  const ctx = {
    bp, width, theme, today: new Date(today || DEFAULT_TODAY), now: () => new Date(today || DEFAULT_TODAY), fmt: FMT, emit, ui, privacy: !!privacy, env: env || {},
    setUi: (k, v) => setUiState((u) => ({ ...u, [k]: v })),
    openDialog: overlays.openDialog, toast: overlays.toast,
  };
  return html`<div class="tk-screen">${(env?.offline || env?.stale) && html`<${EnvBar} env=${env} />`}<${Layout} key=${variant.id} variant=${variant} bp=${bp} renderBlock=${(b) => html`<${Block} key=${b.id} block=${b} store=${store} ctx=${ctx} forcedState=${forcedState} />`} /></div>`;
}

/** Umgebungshinweis (Offline / veralteter Stand) – generisch für alle Screens. */
const EnvBar = ({ env }) => html`<div class="tk-envbar" role="status" data-qa="envbar">
  <${Icon} name=${env.offline ? 'wifi-off' : 'clock'} size=${15} />
  <span class="tk-grow">${env.offline ? 'Offline – Stand heute 09:15. Änderungen werden gespeichert und später abgeglichen.' : 'Daten von heute 09:15 – Aktualisierung läuft.'}</span></div>`;

/** Schriftskalierung (Barrierefreiheit): wirkt über --tk-text-scale auf alle Schriftgrößen-Tokens. */
const applyEnv = (env) => { document.documentElement.style.setProperty('--tk-text-scale', String(env?.scale || 1)); document.documentElement.toggleAttribute('data-tk-offline', !!env?.offline); };

/** Gemeinsamer Weltzustand (Persona-Daten), geteilt von allen Screens einer Vorschau. */
function useWorld(initial) {
  const [data, setData] = useState(() => clone(initial || {}));
  return { data, setData: (key, v) => setData((d) => ({ ...d, [key]: typeof v === 'function' ? v(d[key] ?? []) : v })) };
}

const NoVariant = () => html`<div class="tk-state"><div class="tk-state__icon"><${Icon} name="palette" size=${22} /></div><div class="tk-state__title">Noch kein Design</div><div class="tk-state__text">Für dieses Feature gibt es noch keine Variante.</div></div>`;

/** Skizze für Features ohne Variante – im Launcher läuft nichts ins Leere. */
const SketchScreen = ({ feature }) => html`<div class="tk-screen tk-sketch" data-qa="sketch">
  <div class="tk-sketch__badge"><${Icon} name="pencil" size=${13} />Skizze – noch kein Design</div>
  <h1 class="tk-h1">${feature.name}</h1>${feature.purpose && html`<p class="tk-muted" style="margin-top:6px;max-width:640px">${feature.purpose}</p>`}
  <div class="tk-sketch__grid">${(feature.requirements || []).map((r) => html`<div class="tk-sketch__card"><span class="tk-label">${{ info: 'Zeigt', action: 'Kann', state: 'Zustand', rule: 'Regel' }[r.type] || r.type}${r.priority === 'must' ? ' · Muss' : ''}</span><span>${r.text}</span><span class="tk-sketch__lines"><i></i><i></i></span></div>`)}
    ${!(feature.requirements || []).length && html`<div class="tk-sketch__card"><span class="tk-label">Offen</span><span>Anforderungen noch nicht erfasst</span><span class="tk-sketch__lines"><i></i><i></i></span></div>`}</div></div>`;

// ----------------------------------------------------------------- Root ---
function PreviewRoot({ payload }) {
  if (payload.mode === 'app') return html`<${AppPlayer} key=${`${payload.versionId}|${payload.revision || ''}|${payload.scenario || ''}`} payload=${payload} />`;
  // Daten/UI-Zustand werden zurückgesetzt, wenn Feature, Variante oder Demo-Daten wechseln –
  // reine Layout-/Prop-Änderungen (Design Studio) behalten den Bedienzustand.
  const sig = `${payload.mode}|${payload.feature?.id}|${payload.variant?.id}|${payload.component?.id}|${payload.scenario || ''}|${JSON.stringify(payload.mode === 'component' ? payload.component?.data : payload.demoData)}`;
  return html`<${PreviewInner} key=${sig} payload=${payload} />`;
}

function PreviewInner({ payload }) {
  const { width, bp } = useViewport();
  const emit = useCallback((event, detail) => post({ type: 'interaction', event, detail: detail ?? null, ts: Date.now() }), []);
  const ov = useOverlays(emit);
  const world = useWorld(payload.world);
  document.documentElement.setAttribute('data-tk-theme', payload.theme || 'graphite');
  applyEnv(payload.env);
  let content;
  if (payload.mode === 'component') {
    const block = { id: 'preview', component: payload.component.id, props: payload.component.props || {} };
    const variant = { id: 'component', layout: { type: 'stack' }, blocks: [block] };
    content = html`<div class="tk-bare"><${Screen} variant=${variant} demoData=${payload.component.data} theme=${payload.theme} today=${payload.today} forcedState=${payload.state} overlays=${ov} emit=${emit} bp=${bp} width=${width} /></div>`;
  } else {
    const navEvt = (event, detail) => () => post({ type: 'interaction', event, detail });
    content = html`<${AppShell} chrome=${payload.chrome} bp=${bp} modules=${payload.modules} activeModule=${payload.module?.id} moduleName=${payload.module?.name} title=${payload.feature?.name}
        onNavModule=${(id) => navEvt('nav.module', { module: id })()} onMore=${navEvt('nav.more')}>
      ${payload.variant ? html`<${Screen} variant=${payload.variant} demoData=${payload.demoData} theme=${payload.theme} today=${payload.today} forcedState=${payload.state} overlays=${ov} emit=${emit} bp=${bp} width=${width} world=${world} privacy=${payload.privacy} env=${payload.env} />` : html`<${NoVariant} />`}
    <//>`;
  }
  const hl = payload.highlightBlock ? html`<style>[data-block-id="${payload.highlightBlock}"]{outline:2px dashed var(--tk-c-accent);outline-offset:4px;border-radius:6px}</style>` : null;
  return html`${hl}${content}<${Overlays} dialogs=${ov.dialogs} closeDialog=${ov.closeDialog} toasts=${ov.toasts} />`;
}

// -------------------------------------------------------- App-Player ---
// Ganze App klickbar (Demo-Launcher): Module, Features, Navigationsregeln, Zurück.
let probePayload = null;
let appNavigate = null;
let appBack = null;
function AppPlayer({ payload }) {
  const { width, bp } = useViewport();
  const features = payload.features || {};
  const start = features[payload.route] ? payload.route : features[payload.startFeatureId] ? payload.startFeatureId : Object.keys(features)[0];
  const [stack, setStack] = useState([{ fid: start, params: null }]);
  const cache = useRef(new Map()).current;
  const world = useWorld(payload.world);
  const top = stack[stack.length - 1];
  const fid = top.fid;
  const f = features[fid];
  const mod = (payload.modules || []).find((m) => m.id === f?.moduleId);
  const moduleFeatures = (payload.modules || []).length ? Object.values(features).filter((x) => x.moduleId === f?.moduleId) : [];

  const go = (to, { replace = false, reset = false, params = null } = {}) => {
    if (!features[to] || (to === fid && !params)) return;
    if (params) cache.delete(`${to}|${JSON.stringify(params)}`);
    const entry = { fid: to, params };
    setStack((st) => (reset ? [entry] : replace ? [...st.slice(0, -1), entry] : [...st, entry]));
  };
  // Von außen (gekoppelte Launcher-Rahmen): Modulwechsel setzt den Verlauf zurück wie ein Tipp auf die Leiste.
  appNavigate = (to, params = null) => go(to, { reset: features[to] && features[to].moduleId !== f?.moduleId, params });
  const goModule = (mid) => { const m = (payload.modules || []).find((x) => x.id === mid); if (m?.home) go(m.home, { reset: true }); };
  const back = () => { if (ov.dialogs?.length) return ov.closeDialog(ov.dialogs[ov.dialogs.length - 1].id); setStack((st) => (st.length > 1 ? st.slice(0, -1) : st)); };
  appBack = back;
  const emit = useCallback((event, detail) => {
    post({ type: 'interaction', event, detail: detail ?? null, ts: Date.now(), featureId: fid });
    const rule = (features[fid]?.nav || []).find((r) => r.event === event);
    if (rule && features[rule.to]) setTimeout(() => go(rule.to, { params: detail && (detail.id != null || detail.ui) ? { id: detail.id, ui: detail.ui } : null }), 60);
  }, [fid]);
  const ov = useOverlays(emit);

  useEffect(() => {
    probePayload = f ? { mode: 'feature', theme: payload.theme, state: payload.state, feature: { id: f.id, name: f.name }, variant: f.variant } : null;
    post({ type: 'route', featureId: fid, moduleId: f?.moduleId, depth: stack.length, title: f?.name, sketch: !f?.variant });
    document.querySelector('.tk-app__content')?.scrollTo?.(0, 0); window.scrollTo(0, 0);
  }, [fid]);
  useEffect(() => {
    const onKey = (e) => { if ((e.key === 'Backspace' && !/input|textarea/i.test(document.activeElement?.tagName)) || (e.altKey && e.key === 'ArrowLeft')) back(); };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, []);
  document.documentElement.setAttribute('data-tk-theme', payload.theme || 'graphite');
  applyEnv(payload.env);

  const groups = (list) => { const m = new Map(); for (const x of list) { const g = x.group || 'Allgemein'; if (!m.has(g)) m.set(g, []); m.get(g).push(x); } return [...m.entries()]; };
  const featureSheet = () => ov.openDialog({ title: mod?.name || 'Bereiche', body: (close) => html`<div class="tk-sheetlist">${groups(moduleFeatures).map(([g, list]) => html`<div class="tk-label" style="margin:6px 0 2px">${g}</div>
      ${list.map((x) => html`<button type="button" class="tk-sheetlist__item" aria-current=${x.id === fid ? 'page' : undefined} onClick=${() => { close(); go(x.id); }}>
        <span class="tk-grow tk-truncate">${x.name}</span>${x.variant ? null : html`<span class="tk-subtle" style="font-size:var(--tk-fs-xs)">ohne Design</span>`}<${Icon} name="chevron-right" size=${15} /></button>`)}`)}</div>` });
  const areas = [...new Set((payload.modules || []).map((m) => m.area || 'Weitere'))];
  const moreSheet = () => ov.openDialog({ title: 'Alle Module', body: (close) => html`${areas.map((a) => html`<div class="tk-label" style="margin:4px 0 6px">${a}</div><div class="tk-modgrid" style="margin-bottom:10px">${(payload.modules || []).filter((m) => (m.area || 'Weitere') === a).map((m) => html`<button type="button" class="tk-modgrid__item" aria-current=${m.id === f?.moduleId ? 'page' : undefined} onClick=${() => { close(); goModule(m.id); }}>
      <span class="tk-modgrid__icon"><${Icon} name=${m.icon} size=${22} /></span><span class="tk-truncate" style="max-width:100%">${m.name}</span></button>`)}</div>`)}` });

  const navModules = payload.favorites?.length ? [...payload.favorites.map((id) => payload.modules.find((m) => m.id === id)).filter(Boolean), ...payload.modules.filter((m) => !payload.favorites.includes(m.id))] : payload.modules;
  return html`<${AppShell} chrome=${payload.chrome !== false} bp=${bp} modules=${navModules} activeModule=${f?.moduleId} moduleName=${mod?.name} title=${f?.name}
      canBack=${stack.length > 1} onBack=${back} onNavModule=${goModule} onMore=${moreSheet} onTitle=${moduleFeatures.length > 1 ? featureSheet : null}
      sideFeatures=${moduleFeatures.filter((x) => x.variant)} activeFeature=${fid} onFeature=${(id) => go(id)}
      onSearch=${() => (features['system.search'] ? go('system.search') : ov.toast('Globale Suche – noch kein Design'))} onBell=${() => (features['system.notifications'] ? go('system.notifications') : ov.toast('Mitteilungen – noch kein Design'))}>
    ${f?.variant ? html`<${Screen} key=${`${fid}|${JSON.stringify(top.params)}`} cacheKey=${`${fid}|${JSON.stringify(top.params)}`} cache=${cache} variant=${f.variant} demoData=${f.demoData} theme=${payload.theme} today=${payload.today} forcedState=${payload.state} overlays=${ov} emit=${emit} bp=${bp} width=${width} world=${world} privacy=${payload.privacy} params=${top.params} env=${payload.env} />` : f ? html`<${SketchScreen} feature=${f} />` : html`<${NoVariant} />`}
  <//><${Overlays} dialogs=${ov.dialogs} closeDialog=${ov.closeDialog} toasts=${ov.toasts} />`;
}

// ------------------------------------------------------------------ API ---
let current = null;
const mount = document.getElementById('preview-root');
function renderPayload(payload) {
  current = payload;
  probePayload = payload.mode === 'app' ? probePayload : payload;
  render(html`<${PreviewRoot} payload=${payload} />`, mount);
  document.body.dataset.ready = 'true';
}
window.__taktPreview = { render: renderPayload, get payload() { return current; }, navigate: (fid, params) => appNavigate && appNavigate(fid, params), back: () => appBack && appBack() };
window.__taktQA = {
  run: async () => {
    // rAF kann in verdeckten Frames gedrosselt sein -> mit Timeout absichern
    await Promise.race([new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))), new Promise((r) => setTimeout(r, 150))]);
    await new Promise((r) => setTimeout(r, 60));
    return runProbe({ payload: probePayload || current, errors: runtimeErrors.slice() });
  },
};
// Design Studio: Alt+Klick auf einen Block wählt ihn im Editor aus.
document.addEventListener('click', (e) => {
  if (!e.altKey) return;
  const el = e.target.closest?.('[data-block-id]');
  if (!el) return;
  e.preventDefault(); e.stopPropagation();
  post({ type: 'select-block', blockId: el.getAttribute('data-block-id') });
}, true);
window.addEventListener('message', (e) => { if (e.data?.target === 'takt-preview' && e.data.type === 'render') renderPayload(e.data.payload); });

// Eigenständiger Modus (URL-Parameter) – für CLI-QA, Direktlinks, echte Geräte im WLAN.
const params = new URLSearchParams(location.search);
if (params.get('feature') || params.get('component') || params.get('app')) {
  import('../core/preview-payload.js').then(async ({ loadStateStandalone, buildFeaturePayload, buildComponentPayload, buildAppPayload }) => {
    const envList = (params.get('env') || '').split(',');
    const opts = { theme: params.get('theme') || undefined, state: params.get('state') || 'default', chrome: params.get('chrome') !== '0', scenario: params.get('scenario') || undefined,
      privacy: envList.includes('privacy'), env: { offline: envList.includes('offline'), stale: envList.includes('stale'), scale: Number(params.get('scale')) || 1 } };
    if (params.get('component')) return renderPayload(buildComponentPayload(params.get('component'), opts));
    if (params.get('app')) { const st = await loadStateStandalone(); return renderPayload(buildAppPayload(st, params.get('version') || 'arbeitsstand', { ...opts, route: params.get('feature') || undefined })); }
    const state = await loadStateStandalone();
    renderPayload(buildFeaturePayload(state, params.get('feature'), params.get('variant'), opts));
  }).catch((err) => { document.body.dataset.ready = 'error'; mount.textContent = 'Preview-Fehler: ' + err.message; console.error(err); });
} else {
  post({ type: 'ready' });
}
