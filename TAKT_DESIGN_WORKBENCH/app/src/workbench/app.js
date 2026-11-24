// ============================================================================
// WORKBENCH-APP – Shell, Routing, globale Tastenkürzel, Befehlspalette.
// Routen (Hash):
//   #/                      Übersicht            #/modules[/:id]        Module / Modul-Cockpit
//   #/features              Feature-Browser      #/features/:id[/:tab]  Feature-Workspace
//   #/studio[/:featureId]   Design Studio        #/library[/:compId]    Komponenten
//   #/versions[/:tab]       Versionen & Entscheidungen
//   #/quality[/:tab]        Quality Center       #/data                 Daten, Backup, Einstellungen
// ============================================================================
import { html } from '../lib/html.js';
import { useState, useEffect, useMemo } from 'preact/hooks';
import { Icon } from '../lib/icons.js';
import { getState, subscribe, persistence, undo, redo, canUndo, canRedo, actions } from './store.js';
import { OverlayHost, IconBtn, Btn, openDialog, closeOverlay, toast, Badge } from './ui/kit.js';
import { fmt, cx } from '../lib/util.js';
import { statusInfo } from '../core/schema.js';
import { COMPONENTS } from '../library/registry.js';
import { Dashboard } from './views/dashboard.js';
import { ModulesView, ModuleCockpit } from './views/modules.js';
import { FeaturesView } from './views/features.js';
import { FeatureWorkspace } from './views/feature-workspace.js';
import { StudioView } from './views/studio.js';
import { LibraryView } from './views/library.js';
import { VersionsView } from './views/versions.js';
import { QualityView } from './views/quality.js';
import { DataView } from './views/data.js';

// ---------------------------------------------------------------- Router ---
import { navigate, featureHref, moduleHref } from './router.js';
export { navigate, featureHref, moduleHref };
function useRoute() {
  const parse = () => (location.hash.replace(/^#\/?/, '') || '').split('/').filter(Boolean).map(decodeURIComponent);
  const [route, setRoute] = useState(parse());
  useEffect(() => { const on = () => setRoute(parse()); window.addEventListener('hashchange', on); return () => window.removeEventListener('hashchange', on); }, []);
  return route;
}

// --------------------------------------------------------------- Palette ---
function CommandPalette({ close, state }) {
  const [q, setQ] = useState(''); const [i, setI] = useState(0);
  const items = useMemo(() => {
    const base = [
      { label: 'Übersicht', icon: 'layout-dashboard', href: '#/' }, { label: 'Module', icon: 'boxes', href: '#/modules' },
      { label: 'Features', icon: 'list-checks', href: '#/features' }, { label: 'Design Studio', icon: 'palette', href: '#/studio' },
      { label: 'Komponenten', icon: 'component', href: '#/library' }, { label: 'Versionen & Entscheidungen', icon: 'git-branch', href: '#/versions' },
      { label: 'Quality Center', icon: 'shield-check', href: '#/quality' }, { label: 'Daten & Backup', icon: 'save', href: '#/data' },
    ];
    const mods = state.modules.map((m) => ({ label: m.name, sub: 'Modul', icon: m.icon, href: moduleHref(m.id) }));
    const feats = state.features.filter((f) => !f.archived).map((f) => ({ label: f.name, sub: `${state.modules.find((m) => m.id === f.moduleId)?.name || ''} · ${statusInfo(f.status).label}`, icon: 'file-text', href: featureHref(f.id) }));
    const comps = COMPONENTS.map((c) => ({ label: c.name, sub: `Komponente · ${c.category}`, icon: 'component', href: `#/library/${c.id}` }));
    const all = [...base, ...mods, ...feats, ...comps];
    const n = q.trim().toLowerCase();
    return (n ? all.filter((x) => `${x.label} ${x.sub || ''}`.toLowerCase().includes(n)) : all).slice(0, 40);
  }, [q]);
  const go = (it) => { close(); navigate(it.href); };
  return html`<div class="wb-col" style="gap:0;margin:-18px">
    <div class="wb-search" style="padding:12px;border-bottom:1px solid var(--wb-border)"><${Icon} name="search" size=${16} />
      <input class="wb-input" autofocus placeholder="Modul, Feature, Komponente oder Bereich suchen …" value=${q} style="padding-left:34px;height:38px;font-size:14px"
        onInput=${(e) => { setQ(e.currentTarget.value); setI(0); }}
        onKeyDown=${(e) => { if (e.key === 'ArrowDown') { e.preventDefault(); setI(Math.min(i + 1, items.length - 1)); } if (e.key === 'ArrowUp') { e.preventDefault(); setI(Math.max(i - 1, 0)); } if (e.key === 'Enter' && items[i]) go(items[i]); }} /></div>
    <div class="wb-palette__list">${items.map((it, k) => html`<div class=${cx('wb-palette__item', k === i && 'is-active')} onMouseEnter=${() => setI(k)} onClick=${() => go(it)}>
      <span class="wb-subtle"><${Icon} name=${it.icon} size=${16} /></span><span class="wb-grow wb-trunc">${it.label}</span>${it.sub && html`<span class="wb-subtle wb-small wb-trunc" style="max-width:50%">${it.sub}</span>`}</div>`)}
      ${!items.length && html`<div class="wb-empty"><div class="wb-empty__title">Keine Treffer</div></div>`}</div>
  </div>`;
}
const openPalette = () => openDialog({ title: null, class: 'wb-palette', body: ({ close }) => html`<${CommandPalette} close=${close} state=${getState()} />` });

// ------------------------------------------------------------------ Shell ---
function NavItem({ href, icon, label, active, count, sub, dot }) {
  return html`<a class=${cx('wb-nav__item', sub && 'wb-nav__item--sub')} href=${href} aria-current=${active ? 'page' : undefined}>
    ${dot ? html`<span class="wb-dot" style=${`color:${dot}`}></span>` : html`<${Icon} name=${icon} size=${sub ? 15 : 17} />`}<span class="wb-trunc">${label}</span>${count != null && html`<span class="wb-nav__count">${count}</span>`}</a>`;
}

function SaveIndicator() {
  const p = persistence;
  const map = { saved: ['check-circle-2', 'var(--wb-success)', p.mode === 'file' ? 'Gespeichert (Datei)' : 'Gespeichert (Browser)'], saving: ['loader-2', 'var(--wb-muted)', 'Speichert …'], dirty: ['circle-dot', 'var(--wb-warning)', 'Ungespeichert …'], error: ['alert-triangle', 'var(--wb-danger)', 'Nur Browser-Speicher'], idle: ['circle', 'var(--wb-subtle)', p.mode === 'file' ? 'Datei-Speicher' : 'Browser-Speicher'] };
  const [icon, color, text] = map[p.status] || map.idle;
  return html`<div class="wb-save" title=${p.error || (p.lastSaved ? `Zuletzt gespeichert ${fmt.time(p.lastSaved)}` : '')} data-save-status=${p.status}>
    <span style=${`color:${color}`}><${Icon} name=${icon} size=${14} /></span><span class="wb-trunc">${text}</span>${p.lastSaved && html`<span class="wb-num" style="margin-left:auto">${fmt.time(p.lastSaved)}</span>`}</div>`;
}

function Shell({ state, route, children, crumbs }) {
  const [navOpen, setNavOpen] = useState(false);
  useEffect(() => setNavOpen(false), [route.join('/')]);
  const sec = route[0] || '';
  const activeFeatures = state.features.filter((f) => !f.archived);
  const inWork = activeFeatures.filter((f) => ['design', 'review'].includes(f.status)).length;
  const openDec = state.decisions.filter((d) => d.status === 'open').length;
  const qaFails = Object.values(state.qa.latest).filter((x) => x.status === 'fail').length;
  const mods = state.modules.filter((m) => !m.archived).sort((a, b) => a.order - b.order);
  const activeModule = sec === 'modules' ? route[1] : sec === 'features' && route[1] ? state.features.find((f) => f.id === route[1])?.moduleId : null;
  const wbTheme = state.settings.wbTheme;
  return html`<div class=${cx('wb-app', navOpen && 'is-nav-open')}>
    <aside class="wb-side" aria-label="Hauptnavigation">
      <div class="wb-brand"><span class="wb-brand__logo">T</span><div><div class="wb-brand__name">TAKT Design Workbench</div><div class="wb-brand__sub">${state.meta.project}</div></div></div>
      <nav class="wb-nav">
        <${NavItem} href="#/" icon="layout-dashboard" label="Übersicht" active=${sec === ''} />
        <${NavItem} href="#/modules" icon="boxes" label="Module" active=${sec === 'modules' && !route[1]} count=${mods.length} />
        <${NavItem} href="#/features" icon="list-checks" label="Features" active=${sec === 'features'} count=${activeFeatures.length} />
        <${NavItem} href=${state.settings.lastFeatureId ? `#/studio/${encodeURIComponent(state.settings.lastFeatureId)}` : '#/studio'} icon="palette" label="Design Studio" active=${sec === 'studio'} count=${inWork || null} />
        <${NavItem} href="#/library" icon="component" label="Komponenten" active=${sec === 'library'} count=${COMPONENTS.length} />
        <${NavItem} href="#/versions" icon="git-branch" label="Versionen & Entscheidungen" active=${sec === 'versions'} count=${openDec || null} />
        <${NavItem} href="#/quality" icon="shield-check" label="Quality Center" active=${sec === 'quality'} count=${qaFails || null} />
        <div class="wb-nav__label">Module</div>
        ${mods.map((m) => html`<${NavItem} sub href=${moduleHref(m.id)} icon=${m.icon} label=${m.name} active=${activeModule === m.id}
          count=${state.features.filter((f) => f.moduleId === m.id && !f.archived).length} />`)}
      </nav>
      <div class="wb-side__foot">
        <${SaveIndicator} />
        <div class="wb-row"><${NavItem} href="#/data" icon="save" label="Daten & Backup" active=${sec === 'data'} /></div>
      </div>
    </aside>
    <div class="wb-main">
      <header class="wb-top">
        <${IconBtn} icon="menu" label="Navigation" class="wb-menu-btn" onClick=${() => setNavOpen(!navOpen)} />
        <nav class="wb-crumbs" aria-label="Pfad">${crumbs.map((c, i) => (i < crumbs.length - 1 ? html`<a href=${c.href}>${c.label}</a><${Icon} name="chevron-right" size=${13} />` : html`<strong>${c.label}</strong>`))}</nav>
        <${Btn} size="sm" icon="search" onClick=${openPalette} class="wb-hide-sm" title="Suchen (Strg+K)">Suchen <span class="wb-kbd">Strg K</span><//>
        <${IconBtn} icon="undo-2" label="Rückgängig (Strg+Z)" disabled=${!canUndo()} onClick=${undo} />
        <${IconBtn} icon="redo-2" label="Wiederholen (Strg+Umschalt+Z)" disabled=${!canRedo()} onClick=${redo} />
        <${IconBtn} icon=${wbTheme === 'dark' ? 'sun' : 'moon'} label="Workbench hell/dunkel" onClick=${() => actions.setSetting('wbTheme', wbTheme === 'dark' ? 'light' : 'dark')} />
      </header>
      <main class="wb-content" id="wb-content">${children}</main>
    </div>
  </div>`;
}

// ------------------------------------------------------------------- App ---
export function App() {
  const [state, setState] = useState(getState());
  const [, force] = useState(0);
  const route = useRoute();
  useEffect(() => subscribe((s) => { setState(s); force((n) => n + 1); }), []);
  useEffect(() => { document.documentElement.setAttribute('data-wb-theme', state.settings.wbTheme || 'dark'); }, [state.settings.wbTheme]);
  useEffect(() => {
    const onKey = (e) => {
      const mod = e.ctrlKey || e.metaKey;
      const typing = /input|textarea|select/i.test(document.activeElement?.tagName || '') || document.activeElement?.isContentEditable;
      if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); }
      else if (mod && e.key.toLowerCase() === 'z' && !typing) { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      else if (mod && e.key.toLowerCase() === 'y' && !typing) { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => { document.getElementById('wb-content')?.scrollTo(0, 0); }, [route[0], route[1]]);

  const [sec, a, b] = route;
  const crumbs = [{ label: 'Workbench', href: '#/' }];
  let view;
  const feature = (id) => state.features.find((f) => f.id === id);
  const mod = (id) => state.modules.find((m) => m.id === id);
  switch (sec) {
    case undefined: case '': crumbs.push({ label: 'Übersicht' }); view = html`<${Dashboard} state=${state} />`; break;
    case 'modules':
      crumbs.push({ label: 'Module', href: '#/modules' });
      if (a && mod(a)) { crumbs.push({ label: mod(a).name }); view = html`<${ModuleCockpit} state=${state} module=${mod(a)} />`; }
      else view = html`<${ModulesView} state=${state} />`;
      break;
    case 'features':
      crumbs.push({ label: 'Features', href: '#/features' });
      if (a && feature(a)) { const f = feature(a); crumbs.push({ label: mod(f.moduleId)?.name || f.moduleId, href: moduleHref(f.moduleId) }, { label: f.name }); view = html`<${FeatureWorkspace} key=${f.id} state=${state} feature=${f} tab=${b || 'overview'} />`; }
      else view = html`<${FeaturesView} state=${state} />`;
      break;
    case 'studio': {
      const f = feature(a) || feature(state.settings.lastFeatureId) || state.features.find((x) => x.variants.length);
      crumbs.push({ label: 'Design Studio', href: '#/studio' }); if (f) crumbs.push({ label: `${mod(f.moduleId)?.name} › ${f.name}` });
      view = html`<${StudioView} key=${f?.id} state=${state} feature=${f} variantId=${b} />`; break;
    }
    case 'library': crumbs.push({ label: 'Komponenten', href: '#/library' }); if (a) crumbs.push({ label: a }); view = html`<${LibraryView} state=${state} componentId=${a} />`; break;
    case 'versions': crumbs.push({ label: 'Versionen & Entscheidungen' }); view = html`<${VersionsView} state=${state} tab=${a || 'releases'} />`; break;
    case 'quality': crumbs.push({ label: 'Quality Center' }); view = html`<${QualityView} state=${state} tab=${a || 'overview'} />`; break;
    case 'data': crumbs.push({ label: 'Daten & Backup' }); view = html`<${DataView} state=${state} />`; break;
    default: crumbs.push({ label: 'Nicht gefunden' }); view = html`<div class="wb-page"><div class="wb-empty"><div class="wb-empty__title">Seite nicht gefunden</div><a href="#/">Zur Übersicht</a></div></div>`;
  }
  return html`<${Shell} state=${state} route=${route} crumbs=${crumbs}>${view}<//><${OverlayHost} />`;
}
