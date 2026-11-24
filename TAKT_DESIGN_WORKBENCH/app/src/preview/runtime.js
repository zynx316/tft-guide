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
import { useState, useEffect, useCallback } from 'preact/hooks';
import { Icon } from '../lib/icons.js';
import { tokensStylesheet } from '../design-system/tokens.js';
import { getComponent, defaultProps, allComponentCss } from '../library/registry.js';
import { Skeleton, ErrorState, Card, Button } from '../library/ui.js';
import { Layout } from './layouts.js';
import { runProbe } from './qa-probe.js';
import { clone } from '../lib/util.js';

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
  for (const s of slots) { const v = store.data[keyOf(s.slot)]; data[s.slot] = state === 'empty' ? emptyOf(v) : v; }
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
function AppShell({ payload, bp, children }) {
  if (!payload.chrome) return html`<div class="tk-bare">${children}</div>`;
  const mods = (payload.modules || []).slice(0, 10);
  const active = payload.module?.id;
  const nav = (m) => () => { post({ type: 'interaction', event: 'nav.module', detail: { module: m.id } }); };
  document.documentElement.classList.toggle('tk-has-bottomnav', bp === 'mobile');
  if (bp === 'mobile') {
    const bottom = mods.slice(0, 4); if (active && !bottom.find((m) => m.id === active) && payload.module) bottom[3] = payload.module;
    return html`<div class="tk-app tk-app--mobile">
      <div class="tk-app__top"><div class="tk-app__crumb"><strong class="tk-truncate">${payload.feature?.name || payload.module?.name}</strong></div>
        <button class="tk-btn tk-btn--ghost tk-btn--icon" aria-label="Suche"><${Icon} name="search" /></button>
        <button class="tk-btn tk-btn--ghost tk-btn--icon" aria-label="Mitteilungen"><${Icon} name="bell" /></button></div>
      <main class="tk-app__content">${children}</main>
      <nav class="tk-bottomnav" aria-label="Module">${bottom.map((m) => html`<button type="button" aria-current=${m.id === active ? 'page' : undefined} onClick=${nav(m)}><${Icon} name=${m.icon} size=${21} /><span>${m.name}</span></button>`)}
        <button type="button" onClick=${() => post({ type: 'interaction', event: 'nav.more' })}><${Icon} name="menu" size=${21} /><span>Mehr</span></button></nav>
    </div>`;
  }
  return html`<div class=${`tk-app tk-app--${bp}`}>
    <nav class="tk-app__nav" aria-label="Module">
      <div class="tk-app__brand"><span class="tk-app__logo">T</span><span>TAKT</span></div>
      <div class="tk-app__navlist">${mods.map((m) => html`<button type="button" class="tk-navitem" aria-current=${m.id === active ? 'page' : undefined} onClick=${nav(m)} title=${m.name}><${Icon} name=${m.icon} size=${bp === 'tablet' ? 20 : 18} /><span>${m.name}</span></button>`)}</div>
    </nav>
    <div class="tk-app__main">
      <div class="tk-app__top"><div class="tk-app__crumb"><span>${payload.module?.name}</span><${Icon} name="chevron-right" size=${14} /><strong class="tk-truncate">${payload.feature?.name}</strong></div>
        <button class="tk-btn tk-btn--ghost tk-btn--icon" aria-label="Suche"><${Icon} name="search" /></button>
        <button class="tk-btn tk-btn--ghost tk-btn--icon" aria-label="Mitteilungen"><${Icon} name="bell" /></button>
        <span class="tk-avatar" style="width:30px;height:30px" aria-label="Profil"><${Icon} name="user" size=${16} /></span></div>
      <main class="tk-app__content">${children}</main>
    </div>
  </div>`;
}

// ------------------------------------------------------- Dialog & Toast ---
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

// ----------------------------------------------------------------- Root ---
function PreviewRoot({ payload }) {
  // Daten/UI-Zustand werden zurückgesetzt, wenn Feature, Variante oder Demo-Daten wechseln –
  // reine Layout-/Prop-Aenderungen (Design Studio) behalten den Bedienzustand.
  const sig = `${payload.mode}|${payload.feature?.id}|${payload.variant?.id}|${payload.component?.id}|${JSON.stringify(payload.mode === 'component' ? payload.component?.data : payload.demoData)}`;
  return html`<${PreviewInner} key=${sig} payload=${payload} />`;
}

function PreviewInner({ payload }) {
  const { width, bp } = useViewport();
  const [data, setDataState] = useState(() => clone((payload.mode === 'component' ? payload.component?.data : payload.demoData) || {}));
  const [ui, setUiState] = useState({});
  const [dialogs, setDialogs] = useState([]);
  const [toasts, setToasts] = useState([]);

  const store = { data, setData: (key, v) => setDataState((d) => ({ ...d, [key]: typeof v === 'function' ? v(d[key] ?? []) : v })) };
  const emit = useCallback((event, detail) => post({ type: 'interaction', event, detail: detail ?? null, ts: Date.now() }), []);
  const ctx = {
    bp, width, theme: payload.theme, today: new Date(payload.today || DEFAULT_TODAY),
    emit, ui,
    setUi: (k, v) => setUiState((u) => ({ ...u, [k]: v })),
    openDialog: (d) => { const id = Math.random().toString(36).slice(2); setDialogs((ds) => [...ds, { ...d, id }]); emit('dialog.open', { title: d.title }); return id; },
    toast: (text) => { const id = Math.random().toString(36).slice(2); setToasts((t) => [...t, { id, text }]); setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2200); },
  };
  const closeDialog = (id) => { setDialogs((ds) => ds.filter((d) => d.id !== id)); emit('dialog.close'); };

  document.documentElement.setAttribute('data-tk-theme', payload.theme || 'graphite');
  let content;
  if (payload.mode === 'component') {
    const block = { id: 'preview', component: payload.component.id, props: payload.component.props || {} };
    content = html`<${Block} block=${block} store=${store} ctx=${ctx} forcedState=${payload.state} />`;
    content = html`<div class="tk-bare">${content}</div>`;
  } else if (payload.variant) {
    content = html`<${AppShell} payload=${payload} bp=${bp}>
      <${Layout} key=${payload.variant.id} variant=${payload.variant} bp=${bp} renderBlock=${(b) => html`<${Block} key=${b.id} block=${b} store=${store} ctx=${ctx} forcedState=${payload.state} />`} />
    <//>`;
  } else {
    content = html`<div class="tk-bare"><div class="tk-state"><div class="tk-state__title">Keine Variante</div><div class="tk-state__text">Dieses Feature hat noch keine Designvariante.</div></div></div>`;
  }
  const hl = payload.highlightBlock ? html`<style>[data-block-id="${payload.highlightBlock}"]{outline:2px dashed var(--tk-c-accent);outline-offset:4px;border-radius:6px}</style>` : null;
  return html`${hl}${content}<${Overlays} dialogs=${dialogs} closeDialog=${closeDialog} toasts=${toasts} />`;
}

// ------------------------------------------------------------------ API ---
let current = null;
const mount = document.getElementById('preview-root');
function renderPayload(payload) {
  current = payload;
  render(html`<${PreviewRoot} payload=${payload} />`, mount);
  document.body.dataset.ready = 'true';
}
window.__taktPreview = { render: renderPayload, get payload() { return current; } };
window.__taktQA = {
  run: async () => {
    // rAF kann in verdeckten Frames gedrosselt sein -> mit Timeout absichern
    await Promise.race([new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))), new Promise((r) => setTimeout(r, 150))]);
    await new Promise((r) => setTimeout(r, 60));
    return runProbe({ payload: current, errors: runtimeErrors.slice() });
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
if (params.get('feature') || params.get('component')) {
  import('../core/preview-payload.js').then(async ({ loadStateStandalone, buildFeaturePayload, buildComponentPayload }) => {
    const opts = { theme: params.get('theme') || undefined, state: params.get('state') || 'default', chrome: params.get('chrome') !== '0' };
    if (params.get('component')) return renderPayload(buildComponentPayload(params.get('component'), opts));
    const state = await loadStateStandalone();
    renderPayload(buildFeaturePayload(state, params.get('feature'), params.get('variant'), opts));
  }).catch((err) => { document.body.dataset.ready = 'error'; mount.textContent = 'Preview-Fehler: ' + err.message; console.error(err); });
} else {
  post({ type: 'ready' });
}
