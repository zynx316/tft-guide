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
import { useState, useEffect, useCallback, useRef, useMemo } from 'preact/hooks';
import { Icon } from '../lib/icons.js';
import { tokensStylesheet } from '../design-system/tokens.js';
import { getComponent, defaultProps, allComponentCss } from '../library/registry.js';
import { Skeleton, ErrorState, Card, Button } from '../library/ui.js';
import { Layout } from './layouts.js';
import { runProbe } from './qa-probe.js';
import { clone } from '../lib/util.js';
import * as FMT from '../lib/format.js';
import { Launchpad, CaptureSheet, LAUNCHPAD } from './launchpad.js';
import { DEFAULT_PREFS } from '../library/components/crosscut/_system.js';
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

const isEmptyData = (v) => v == null || v === '' || (Array.isArray(v) ? v.length === 0 : typeof v === 'object' && Object.keys(v).length === 0);
function BlockBody({ block, def, store, ctx, forcedState }) {
  const [localState, setLocalState] = useState(null);
  const state = localState || forcedState || 'default';
  const handles = def.states || [];
  if (state === 'loading' && !handles.includes('loading')) return html`<${Card}><${Skeleton} lines=${4} /><//>`;
  if (state === 'error' && !handles.includes('error')) return html`<${Card}><${ErrorState} onRetry=${() => { setLocalState('default'); ctx.emit('state.retry', { block: block.id }); }} /><//>`;
  // Sichtbarkeit nach Daten (Manifest): hideWhenEmpty/showWhenEmpty = Datenschlüssel des Features (auch '@world:'-gebunden).
  // So zeigt ein Erststart genau eine Einladung statt mehrerer leerer Karten – ohne Sonderkomponenten.
  if (block.hideWhenEmpty || block.showWhenEmpty) {
    // ein Schlüssel oder eine Liste: „leer“ heißt, alle genannten Daten sind leer
    const empty = (k) => state === 'empty' || [].concat(k).every((x) => isEmptyData(store.get(x)));
    if (block.hideWhenEmpty && empty(block.hideWhenEmpty)) return null;
    if (block.showWhenEmpty && !empty(block.showWhenEmpty)) return null;
  }
  const slots = def.data || [];
  const keyOf = (slot) => block.bind?.[slot] ?? slots.find((s) => s.slot === slot)?.default ?? slot;
  const data = {};
  for (const s of slots) { const v = store.get(keyOf(s.slot)); data[s.slot] = state === 'empty' ? emptyOf(v) : v; }
  const setData = (slot, valOrFn) => store.setData(keyOf(slot), valOrFn);
  const props = { ...defaultProps(def), ...(block.props || {}) };
  const Render = def.render;
  return html`<${Render} props=${props} data=${data} setData=${setData} ctx=${{ ...ctx, state, block }} />`;
}

/** Breite des Blocks (ctx.blockWidth) – für Diagramme/SVG ohne eigenen ResizeObserver. */
function useBlockWidth() {
  const ref = useRef(null); const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current; if (!el) return undefined;
    const measure = () => setW(Math.round(el.getBoundingClientRect().width));
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(measure); ro.observe(el); return () => ro.disconnect();
  }, []);
  return [ref, w];
}

function Block({ block, store, ctx, forcedState }) {
  const def = getComponent(block.component);
  const hide = block.hideOn || [];
  const style = block.span ? `--span:${block.span};--span-tablet:${block.spanTablet || (block.span >= 6 ? 12 : 6)}` : '';
  const [ref, blockWidth] = useBlockWidth();
  const bctx = useMemo(() => ({ ...ctx, blockWidth: blockWidth || ctx.width }), [ctx, blockWidth]);
  return html`<div ref=${ref} class="tk-block" data-block-id=${block.id} data-component=${block.component} style=${style}
      data-hide-mobile=${hide.includes('mobile') ? 'true' : undefined} data-hide-tablet=${hide.includes('tablet') ? 'true' : undefined} data-hide-desktop=${hide.includes('desktop') ? 'true' : undefined}>
    ${!def ? html`<div class="tk-block-error" data-qa="render-error">Unbekannte Komponente „${block.component}“ – in der Library nicht registriert.</div>`
      : html`<${Boundary} key=${JSON.stringify(block)} blockId=${block.id} label=${def.name}><${BlockBody} block=${block} def=${def} store=${store} ctx=${bctx} forcedState=${forcedState} /><//>`}
  </div>`;
}

// ------------------------------------------------------------- App-Shell ---
// Generischer TAKT-App-Rahmen. Im Feature-Modus melden Klicks nur Events; im App-Modus (Demo-Launcher)
// navigiert er wirklich (Module, Features eines Moduls, Zurück).
function AppShell({ chrome, bp, modules = [], activeModule, title, moduleName, canBack, onBack, onNavModule, onMore, onTitle, sideFeatures, activeFeature, onFeature, onSearch, onBell, shell = 'tabs', onHome, onCapture, homeModule = 'home', children }) {
  if (!chrome) return html`<div class="tk-bare">${children}</div>`;
  const mods = modules; // alle aktiven Module (19); die Seitenleiste scrollt, mobil steht der Rest unter „Mehr“/„Alle“
  document.documentElement.classList.toggle('tk-has-bottomnav', bp === 'mobile');
  const titleBtn = (strong) => (onTitle
    ? html`<button type="button" class="tk-app__titlebtn" onClick=${onTitle} aria-label=${`${title} – Bereiche des Moduls`}>${strong}<${Icon} name="chevron-down" size=${15} /></button>`
    : strong);
  const back = canBack && html`<button class="tk-btn tk-btn--ghost tk-btn--icon" aria-label="Zurück" onClick=${onBack} data-qa="app-back"><${Icon} name="arrow-left" /></button>`;
  if (bp === 'mobile') {
    const navBtn = (m, label = m.name, icon = m.icon) => html`<button type="button" aria-current=${m.id === activeModule ? 'page' : undefined} onClick=${() => onNavModule && onNavModule(m.id)} data-nav-module=${m.id}><${Icon} name=${icon} size=${21} /><span>${label}</span></button>`;
    let nav;
    if (shell === 'fokus') {
      const home = mods.find((m) => m.id === homeModule) || mods[0];
      nav = html`<nav class="tk-bottomnav tk-bottomnav--fokus" aria-label="Navigation">${home && navBtn(home, 'Heute', 'sun')}
        <button type="button" onClick=${onMore} data-nav-more aria-current=${home && activeModule && activeModule !== home.id ? 'page' : undefined}><${Icon} name="layout-grid" size=${21} /><span>Module</span></button>
        <button type="button" class="tk-navfab" onClick=${onCapture} aria-label="Erfassen" data-qa="nav-capture"><${Icon} name="plus" size=${26} /></button>
        <button type="button" onClick=${onSearch} data-qa="app-search"><${Icon} name="search" size=${21} /><span>Suche</span></button>
        <button type="button" onClick=${onBell} data-qa="app-bell"><${Icon} name="bell" size=${21} /><span>Mitteilungen</span></button></nav>`;
    } else if (shell === 'launchpad') {
      const bottom = mods.filter((m) => m.id !== homeModule).slice(0, 3); const act = mods.find((m) => m.id === activeModule);
      if (act && act.id !== homeModule && !bottom.find((m) => m.id === act.id)) bottom[2] = act;
      nav = html`<nav class="tk-bottomnav" aria-label="Module"><button type="button" aria-current=${!activeModule ? 'page' : undefined} onClick=${onHome} data-nav-launchpad><${Icon} name="layout-grid" size=${21} /><span>Start</span></button>
        ${bottom.map((m) => navBtn(m))}<button type="button" onClick=${onMore} data-nav-more><${Icon} name="menu" size=${21} /><span>Alle</span></button></nav>`;
    } else {
      const bottom = mods.slice(0, 4); const act = mods.find((m) => m.id === activeModule);
      if (act && !bottom.find((m) => m.id === act.id)) bottom[3] = act;
      nav = html`<nav class="tk-bottomnav" aria-label="Module">${bottom.map((m) => navBtn(m))}
        <button type="button" onClick=${onMore} data-nav-more><${Icon} name="menu" size=${21} /><span>Mehr</span></button></nav>`;
    }
    return html`<div class=${`tk-app tk-app--mobile tk-shell--${shell}`}>
      <div class="tk-app__top">${back}<div class="tk-app__crumb">${titleBtn(html`<strong class="tk-truncate">${title || moduleName}</strong>`)}</div>
        ${shell !== 'fokus' && html`<button class="tk-btn tk-btn--ghost tk-btn--icon" aria-label="Suche" onClick=${onSearch} data-qa="app-search"><${Icon} name="search" /></button>
        <button class="tk-btn tk-btn--ghost tk-btn--icon" aria-label="Mitteilungen" onClick=${onBell} data-qa="app-bell"><${Icon} name="bell" /></button>`}</div>
      <main class="tk-app__content">${children}</main>${nav}
    </div>`;
  }
  return html`<div class=${`tk-app tk-app--${bp}`}>
    <nav class="tk-app__nav" aria-label="Module">
      <div class="tk-app__brand"><span class="tk-app__logo">T</span><span>TAKT</span></div>
      <div class="tk-app__navlist">${shell === 'launchpad' && onHome && html`<button type="button" class="tk-navitem" aria-current=${!activeModule ? 'page' : undefined} onClick=${onHome} title="Alle Module" data-nav-launchpad><${Icon} name="layout-grid" size=${bp === 'tablet' ? 20 : 18} /><span>Übersicht</span></button>`}${mods.map((m) => html`<button type="button" class="tk-navitem" aria-current=${m.id === activeModule ? 'page' : undefined} onClick=${() => onNavModule && onNavModule(m.id)} title=${m.name} data-nav-module=${m.id}><${Icon} name=${m.icon} size=${bp === 'tablet' ? 20 : 18} /><span>${m.name}</span></button>
        ${bp === 'desktop' && m.id === activeModule && sideFeatures?.length > 1 && html`<div class="tk-navsub">${sideFeatures.map((f) => html`<button type="button" class="tk-navsub__item" aria-current=${f.id === activeFeature ? 'page' : undefined} onClick=${() => onFeature(f.id)}>${f.name}</button>`)}</div>`}`)}</div>
    </nav>
    <div class="tk-app__main">
      <div class="tk-app__top">${back}<div class="tk-app__crumb"><span>${moduleName}</span><${Icon} name="chevron-right" size=${14} />${titleBtn(html`<strong class="tk-truncate">${title}</strong>`)}</div>
        <button class="tk-btn tk-btn--ghost tk-btn--icon" aria-label="Suche" onClick=${onSearch} data-qa="app-search"><${Icon} name="search" /></button>
        <button class="tk-btn tk-btn--ghost tk-btn--icon" aria-label="Mitteilungen" onClick=${onBell} data-qa="app-bell"><${Icon} name="bell" /></button>
        ${shell === 'fokus' && onCapture && html`<button class="tk-btn tk-btn--primary tk-app__capture" onClick=${onCapture} data-qa="nav-capture"><${Icon} name="plus" size=${16} />Erfassen</button>`}
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
// Lebendige Uhr (nur Launcher, ctx.live): startet am Referenztag und läuft ab dem Laden weiter. In QA/Workbench fest.
const LIVE_T0 = Date.now();
function Screen({ variant, demoData, cacheKey, cache, theme, today, forcedState, overlays, emit, bp, width, world, privacy, params, env, live, mode = 'feature' }) {
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
    bp, width, theme, today: new Date(today || DEFAULT_TODAY), now: () => (live ? new Date(new Date(today || DEFAULT_TODAY).getTime() + (Date.now() - LIVE_T0)) : new Date(today || DEFAULT_TODAY)), live: !!live, mode, fmt: FMT, newId, world: worldApi(world),
    setPrefs: (patch) => world && world.setData('prefs', (p) => deepMerge(p && !Array.isArray(p) ? p : {}, patch)),
    setTheme: (id) => world && world.setData('prefs', (p) => deepMerge(p && !Array.isArray(p) ? p : {}, { theme: id })),
    setPrivacy: (on) => world && world.setData('prefs', (p) => deepMerge(p && !Array.isArray(p) ? p : {}, { privacy: { hideAmounts: !!on } })), emit, ui, privacy: !!privacy, env: env || {},
    textScale: Number(env?.scale) || 1, largeText: (Number(env?.scale) || 1) >= 1.25,
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
const applyEnv = (env) => {
  const sc = Number(env?.scale) || 1; const root = document.documentElement;
  root.style.setProperty('--tk-text-scale', String(sc)); root.toggleAttribute('data-tk-offline', !!env?.offline);
  root.toggleAttribute('data-tk-large-text', sc >= 1.25); // große Schrift: Buttons dürfen umbrechen (siehe takt-base.css)
};

/** Gemeinsamer Weltzustand (Persona-Daten), geteilt von allen Screens einer Vorschau. */
function useWorld(initial) {
  const [data, setData] = useState(() => clone(initial || {}));
  return { data, setData: (key, v) => setData((d) => ({ ...d, [key]: typeof v === 'function' ? v(d[key] ?? []) : v })), reset: () => setData(clone(initial || {})) };
}
/** Komponenten-Zugriff auf die Welt (ctx.world): lesen, setzen, an Listen vorn anfügen, zurücksetzen. */
const worldApi = (world) => (world ? {
  get: (key) => world.data[key],
  set: (key, v) => world.setData(key, v),
  add: (key, item) => world.setData(key, (list) => [item, ...(Array.isArray(list) ? list : [])]),
  reset: () => world.reset(),
} : null);
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
const deepMerge = (a, b) => { const out = { ...a }; for (const [k, v] of Object.entries(b || {})) out[k] = isObj(v) && isObj(a?.[k]) ? deepMerge(a[k], v) : v; return out; };
// Deterministische IDs für neu angelegte Objekte (ctx.newId): Zähler je Vorschau-Sitzung, kein Zufall.
let idSeq = 0;
const newId = (prefix = 'neu') => `${prefix}-${++idSeq}`;

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
    content = html`<div class="tk-bare"><${Screen} variant=${variant} demoData=${payload.component.data} theme=${payload.theme} today=${payload.today} forcedState=${payload.state} overlays=${ov} emit=${emit} bp=${bp} width=${width} mode="component" /></div>`;
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
  const shell = payload.shell || 'tabs';
  const start = features[payload.route] ? payload.route : shell === 'launchpad' ? LAUNCHPAD : features[payload.startFeatureId] ? payload.startFeatureId : Object.keys(features)[0];
  const [stack, setStack] = useState([{ fid: start, params: null }]);
  const cache = useRef(new Map()).current;
  const routed = useRef(false); const externalNav = useRef(false);
  const world = useWorld(payload.world);
  const top = stack[stack.length - 1];
  const fid = top.fid;
  const f = features[fid];
  const mod = (payload.modules || []).find((m) => m.id === f?.moduleId);
  const moduleFeatures = (payload.modules || []).length ? Object.values(features).filter((x) => x.moduleId === f?.moduleId) : [];

  const go = (to, { replace = false, reset = false, params = null } = {}) => {
    if ((!features[to] && to !== LAUNCHPAD) || (to === fid && !params)) return;
    if (params) cache.delete(`${to}|${JSON.stringify(params)}`);
    const entry = { fid: to, params };
    setStack((st) => (reset ? [entry] : replace ? [...st.slice(0, -1), entry] : [...st, entry]));
  };
  // Von außen (gekoppelte Launcher-Rahmen): Modulwechsel setzt den Verlauf zurück wie ein Tipp auf die Leiste.
  appNavigate = (to, params = null) => {
    if (to === LAUNCHPAD && shell !== 'launchpad') return;
    if ((!features[to] && to !== LAUNCHPAD) || (to === fid && !params)) return;
    externalNav.current = true;
    go(to, { reset: to === LAUNCHPAD || (features[to] && features[to].moduleId !== f?.moduleId), params });
  };
  const goModule = (mid) => { const m = (payload.modules || []).find((x) => x.id === mid); if (m?.home) go(m.home, { reset: true }); };
  const back = () => { if (ov.dialogs?.length) return ov.closeDialog(ov.dialogs[ov.dialogs.length - 1].id); setStack((st) => (st.length > 1 ? st.slice(0, -1) : st)); };
  appBack = back;
  // Navigation: Regel aus interaction.to (Vorrang) oder Ziel im Event selbst (detail.to) – ein Event kann so mehrere Ziele
  // haben (Kacheln, Verknüpfungs-Chips). Ziele: Feature-ID oder module:<id> (Modul-Startseite). Rückgabe: true = navigiert.
  const resolveTo = (to) => (typeof to !== 'string' ? null : to.startsWith('module:') ? (payload.modules || []).find((m) => m.id === to.slice(7))?.home || null : features[to] ? to : null);
  const emit = useCallback((event, detail) => {
    post({ type: 'interaction', event, detail: detail ?? null, ts: Date.now(), featureId: fid });
    const rule = (features[fid]?.nav || []).find((r) => r.event === event);
    const target = resolveTo(rule?.to) || resolveTo(detail?.to);
    if (!target) return false;
    const otherModule = features[target]?.moduleId !== features[fid]?.moduleId && String(rule?.to || detail?.to).startsWith('module:');
    setTimeout(() => go(target, { reset: otherModule, params: detail && (detail.id != null || detail.ui) ? { id: detail.id, ui: detail.ui } : null }), 60);
    return true;
  }, [fid]);
  const ov = useOverlays(emit);

  useEffect(() => {
    probePayload = f ? { mode: 'feature', theme: payload.theme, state: payload.state, privacy: !!payload.privacy, feature: { id: f.id, name: f.name }, variant: f.variant,
      module: (payload.modules || []).find((m) => m.id === f.moduleId) || null } : null;
    post({ type: 'route', featureId: fid, moduleId: f?.moduleId, depth: stack.length, title: fid === LAUNCHPAD ? 'Übersicht' : f?.name, sketch: fid !== LAUNCHPAD && !f?.variant, initial: !routed.current, shellPage: fid === LAUNCHPAD, external: externalNav.current });
    routed.current = true; externalNav.current = false;
    document.querySelector('.tk-app__content')?.scrollTo?.(0, 0); window.scrollTo(0, 0);
  }, [fid]);
  useEffect(() => {
    const onKey = (e) => { if ((e.key === 'Backspace' && !/input|textarea/i.test(document.activeElement?.tagName)) || (e.altKey && e.key === 'ArrowLeft')) back(); };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, []);
  // Einstellungen der Demo (Welt-Schlüssel `prefs`, geschrieben von den Einstellungs-Screens) wirken auf die laufende App.
  // Vorgaben des Launchers (Theme, Schrift, Beträge) gelten, bis in der Demo selbst etwas geändert wurde.
  // „Geändert“ = weicht vom Startwert der Sitzung UND vom Standard (DEFAULT_PREFS) ab – Standardwerte, die Einstellungs-
  // Screens beim ersten Speichern mitschreiben, überschreiben die Launcher-Vorgaben nicht.
  const prefs = world.data.prefs || {}; const prefs0 = payload.world?.prefs || {};
  const at = (o, path) => path.reduce((x, k) => x?.[k], o);
  const changed = (path) => { const v = at(prefs, path); if (v === undefined) return false; const j = JSON.stringify(v); return j !== JSON.stringify(at(prefs0, path)) && j !== JSON.stringify(at(DEFAULT_PREFS, path)); };
  const theme = changed(['theme']) ? prefs.theme : payload.theme || 'graphite';
  const privacy = changed(['privacy', 'hideAmounts']) ? !!prefs.privacy.hideAmounts : !!payload.privacy;
  const env = changed(['textScale']) ? { ...(payload.env || {}), scale: Number(prefs.textScale) || 1 } : payload.env;
  const enabled = (m) => prefs.enabled?.[m.id] !== false || m.id === f?.moduleId;
  const modules = (payload.modules || []).filter(enabled);
  document.documentElement.setAttribute('data-tk-theme', theme);
  applyEnv(env);

  const groups = (list) => { const m = new Map(); for (const x of list) { const g = x.group || 'Allgemein'; if (!m.has(g)) m.set(g, []); m.get(g).push(x); } return [...m.entries()]; };
  const featureSheet = () => ov.openDialog({ title: mod?.name || 'Bereiche', body: (close) => html`<div class="tk-sheetlist">${groups(moduleFeatures).map(([g, list]) => html`<div class="tk-label" style="margin:6px 0 2px">${g}</div>
      ${list.map((x) => html`<button type="button" class="tk-sheetlist__item" aria-current=${x.id === fid ? 'page' : undefined} onClick=${() => { close(); go(x.id); }}>
        <span class="tk-grow tk-truncate">${x.name}</span>${x.variant ? null : html`<span class="tk-subtle" style="font-size:var(--tk-fs-xs)">ohne Design</span>`}<${Icon} name="chevron-right" size=${15} /></button>`)}`)}</div>` });
  const areas = [...new Set(modules.map((m) => m.area || 'Weitere'))];
  const moreSheet = () => ov.openDialog({ title: 'Alle Module', body: (close) => html`${areas.map((a) => html`<div class="tk-label" style="margin:4px 0 6px">${a}</div><div class="tk-modgrid" style="margin-bottom:10px">${modules.filter((m) => (m.area || 'Weitere') === a).map((m) => html`<button type="button" class="tk-modgrid__item" aria-current=${m.id === f?.moduleId ? 'page' : undefined} onClick=${() => { close(); goModule(m.id); }}>
      <span class="tk-modgrid__icon"><${Icon} name=${m.icon} size=${22} /></span><span class="tk-truncate" style="max-width:100%">${m.name}</span></button>`)}</div>`)}` });

  const favs = (changed(['favorites']) && Array.isArray(prefs.favorites) ? prefs.favorites : payload.favorites) || [];
  const navModules = favs.length ? [...favs.map((id) => modules.find((m) => m.id === id)).filter(Boolean), ...modules.filter((m) => !favs.includes(m.id))] : modules;
  const capture = () => (features['system.capture']?.variant ? go('system.capture') : ov.openDialog({ title: 'Erfassen', body: (close) => html`<${CaptureSheet} close=${close} world=${world} today=${new Date(payload.today || DEFAULT_TODAY)} toast=${ov.toast} emit=${emit} />` }));
  const isPad = fid === LAUNCHPAD;
  return html`<${AppShell} chrome=${payload.chrome !== false} bp=${bp} modules=${navModules} activeModule=${f?.moduleId} moduleName=${isPad ? 'TAKT' : mod?.name} title=${isPad ? 'Übersicht' : f?.name}
      shell=${shell} onHome=${() => go(LAUNCHPAD, { reset: true })} onCapture=${capture} homeModule=${(payload.modules || [])[0]?.id}
      canBack=${stack.length > 1} onBack=${back} onNavModule=${goModule} onMore=${moreSheet} onTitle=${moduleFeatures.length > 1 ? featureSheet : null}
      sideFeatures=${moduleFeatures.filter((x) => x.variant)} activeFeature=${fid} onFeature=${(id) => go(id)}
      onSearch=${() => (features['system.search'] ? go('system.search') : ov.toast('Globale Suche – noch kein Design'))} onBell=${() => (features['system.notifications'] ? go('system.notifications') : ov.toast('Mitteilungen – noch kein Design'))}>
    ${isPad ? html`<${Launchpad} modules=${modules} world=${world.data} today=${new Date(payload.today || DEFAULT_TODAY)} privacy=${privacy} onOpen=${goModule} />`
    : f?.variant ? html`<${Screen} key=${`${fid}|${JSON.stringify(top.params)}`} cacheKey=${`${fid}|${JSON.stringify(top.params)}`} cache=${cache} variant=${f.variant} demoData=${f.demoData} theme=${theme} today=${payload.today} forcedState=${payload.state} overlays=${ov} emit=${emit} bp=${bp} width=${width} world=${world} privacy=${privacy} params=${top.params} env=${env} live=${payload.live} mode="app" />` : f ? html`<${SketchScreen} feature=${f} />` : html`<${NoVariant} />`}
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
    let res = await runProbe({ payload: probePayload || current, errors: runtimeErrors.slice() });
    // Unter hoher Last kann das erste vollständige Rendern nach data-ready kommen: bei fehlenden Blöcken kurz nachmessen.
    for (let i = 0; i < 3 && res?.checks?.some((c) => c.id === 'blocks' && c.status === 'fail'); i++) {
      await new Promise((r) => setTimeout(r, 250));
      res = await runProbe({ payload: probePayload || current, errors: runtimeErrors.slice() });
    }
    return res;
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
    if (params.get('app')) { const st = await loadStateStandalone(); return renderPayload(buildAppPayload(st, params.get('version') || 'arbeitsstand', { ...opts, route: params.get('feature') || params.get('route') || undefined, shell: params.get('shell') || undefined })); }
    const state = await loadStateStandalone();
    renderPayload(buildFeaturePayload(state, params.get('feature'), params.get('variant'), opts));
  }).catch((err) => { document.body.dataset.ready = 'error'; mount.textContent = 'Preview-Fehler: ' + err.message; console.error(err); });
} else {
  post({ type: 'ready' });
}
