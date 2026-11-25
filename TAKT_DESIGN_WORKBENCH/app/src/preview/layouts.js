// ============================================================================
// LAYOUT-ENGINE – rendert eine Varianten-Spezifikation (layout + blocks).
// Layout-Typen: stack | split | sidebar | grid | tabs
// Regionen:     header (oben, volle Breite) | main | aside (split) |
//               panel (sidebar) | footer | bottom (sticky, z. B. Quick-Add)
// ============================================================================
import { html } from '../lib/html.js';
import { useState, useEffect, useRef } from 'preact/hooks';
import { Icon } from '../lib/icons.js';

export const LAYOUT_TYPES = [
  { id: 'stack', label: 'Stapel', icon: 'rows-3', regions: ['header', 'main', 'footer', 'bottom'], hint: 'Eine Spalte. Ideal für fokussierte, mobile-first Screens.' },
  { id: 'split', label: 'Haupt + Seitenspalte', icon: 'layout-panel-left', regions: ['header', 'main', 'aside', 'footer', 'bottom'], hint: 'Inhalt 2/3, Kontext 1/3. Auf Mobile/Tablet unter dem Inhalt.' },
  { id: 'sidebar', label: 'Seitenleiste + Inhalt', icon: 'panel-left', regions: ['header', 'panel', 'main', 'footer', 'bottom'], hint: 'Navigation/Filter links. Auf Mobile einklappbar.' },
  { id: 'grid', label: 'Dashboard-Raster', icon: 'layout-grid', regions: ['header', 'main', 'footer', 'bottom'], hint: '12er-Raster mit Spannweite je Block (span).' },
  { id: 'tabs', label: 'Registerkarten', icon: 'columns-3', regions: ['header', 'main', 'footer', 'bottom'], hint: 'Blöcke werden per Block-Feld "tab" auf Reiter verteilt.' },
];
export const REGION_LABELS = { header: 'Kopf', main: 'Hauptbereich', aside: 'Seitenspalte', panel: 'Seitenleiste', footer: 'Fuß', bottom: 'Unten fixiert' };
export const layoutInfo = (id) => LAYOUT_TYPES.find((l) => l.id === id) || LAYOUT_TYPES[0];

/** Liefert die Blöcke einer Region in Reihenfolge. Unbekannte Regionen fallen auf main. */
export function blocksByRegion(variant) {
  const type = variant?.layout?.type || 'stack';
  const allowed = layoutInfo(type).regions;
  const out = {};
  for (const b of variant?.blocks || []) {
    const r = allowed.includes(b.region) ? b.region : 'main';
    (out[r] ||= []).push(b);
  }
  return out;
}

/**
 * Master-Detail mobil (`layout.masterDetail`, nur Typ `sidebar`): liefert 'list' (Liste, volle Breite),
 * 'detail' (gewählter Eintrag mit Zurück-Schritt) oder null (kein Master-Detail: Tablet/Desktop, anderer Typ, nicht gesetzt).
 * Maßgeblich ist allein `ctx.ui.selectedId` – `autoSelectFirst` o. Ä. der Detail-Komponente wirkt dort nur auf breiten Viewports.
 */
export function masterDetailMode(layout, bp, selectedId) {
  if (!layout?.masterDetail || layout.type !== 'sidebar' || bp !== 'mobile') return null;
  return selectedId != null && selectedId !== '' ? 'detail' : 'list';
}

export function Layout({ variant, renderBlock, bp, ui, setUi }) {
  const L = variant.layout || { type: 'stack' };
  const reg = blocksByRegion(variant);
  const md = reg.panel?.length ? masterDetailMode(L, bp, ui?.selectedId) : null;
  const rootRef = useRef(null), backRef = useRef(null), prevMd = useRef(md);
  const goBack = () => setUi && setUi('selectedId', null);
  useEffect(() => { // Wechsel Liste <-> Detail: nach oben, Fokus auf „Zurück“ (Detail) bzw. in die Liste
    if (prevMd.current === md) return; const was = prevMd.current; prevMd.current = md;
    if (!md || !was) return;
    rootRef.current?.scrollIntoView?.({ block: 'start' });
    if (md === 'detail') backRef.current?.focus?.({ preventScroll: true });
    else rootRef.current?.querySelector('[data-region="panel"] button, [data-region="panel"] [role="button"]')?.focus?.({ preventScroll: true });
  }, [md]);
  useEffect(() => { // Escape im Detail = Zurück (nicht in Eingabefeldern und nicht bei offenem Dialog)
    if (md !== 'detail') return undefined;
    const onKey = (e) => {
      if (e.key !== 'Escape' || e.defaultPrevented || document.querySelector('[role="dialog"],[aria-modal="true"]')) return;
      const t = e.target; if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return;
      goBack();
    };
    document.addEventListener('keydown', onKey); return () => document.removeEventListener('keydown', onKey);
  }, [md]);
  const [panelOpen, setPanelOpen] = useState(!!L.panelOpen); // layout.panelOpen: Seitenleiste (Liste) startet mobil aufgeklappt
  const tabsList = [...new Set((reg.main || []).map((b) => b.tab || 'Übersicht'))];
  const [tab, setTab] = useState(tabsList[0]);
  const activeTab = tabsList.includes(tab) ? tab : tabsList[0];
  const region = (name, blocks, extra = {}) => blocks && blocks.length
    ? html`<div class=${`tk-region tk-region--${name}`} data-region=${name} ...${extra}>${blocks.map(renderBlock)}</div>` : null;

  let body;
  switch (L.type) {
    case 'split': {
      const asideFirst = L.asideFirstOnMobile && bp === 'mobile';
      const main = region('main', reg.main), aside = region('aside', reg.aside);
      body = html`<div class="tk-layout__body">${asideFirst ? [aside, main] : [main, aside]}</div>`;
      break;
    }
    case 'sidebar':
      if (md) { // Master-Detail mobil: entweder nur die Liste (volle Breite) oder nur das Detail mit Zurück-Schritt
        const backText = L.backLabel || 'Zurück zur Liste';
        body = html`<div class="tk-layout__body" data-master-detail=${md}>
          ${region('panel', reg.panel, { 'data-open': 'true', style: md === 'detail' ? 'display:none' : null })}
          ${md === 'detail' && html`<div class="tk-col" style="gap:12px;min-width:0">
            <button type="button" ref=${backRef} class="tk-btn" data-qa="md-back" aria-label=${backText} onClick=${goBack} style="min-height:44px;align-self:flex-start;gap:8px;padding-inline:12px 16px"><${Icon} name="arrow-left" size=${18} /><span>${backText}</span></button>
            ${region('main', reg.main)}</div>`}</div>`;
        break;
      }
      body = html`<div class="tk-layout__body">
        ${reg.panel?.length ? html`<div class="tk-col" style="gap:0">
          <button type="button" class="tk-btn tk-panel-toggle" style="justify-content:space-between;width:100%;margin-bottom:12px" aria-expanded=${panelOpen ? 'true' : 'false'} onClick=${() => setPanelOpen(!panelOpen)}>
            <span class="tk-row"><${Icon} name="sliders-horizontal" size=${16} />${L.panelLabel || 'Filter & Navigation'}</span><${Icon} name=${panelOpen ? 'chevron-up' : 'chevron-down'} size=${16} /></button>
          ${region('panel', reg.panel, { 'data-open': bp === 'mobile' ? String(panelOpen) : 'true' })}</div>` : null}
        ${region('main', reg.main)}</div>`;
      break;
    case 'tabs':
      body = html`<div class="tk-layout__body"><div class="tk-col" style="gap:16px;min-width:0">
        ${tabsList.length > 1 && html`<div class="tk-tabs" role="tablist">${tabsList.map((t) => html`<button type="button" role="tab" aria-selected=${t === activeTab ? 'true' : 'false'} onClick=${() => setTab(t)}>${t}</button>`)}</div>`}
        ${region('main', (reg.main || []).filter((b) => (b.tab || 'Übersicht') === activeTab))}</div></div>`;
      break;
    default:
      body = html`<div class="tk-layout__body">${region('main', reg.main)}</div>`;
  }
  return html`<div class=${`tk-layout tk-layout--${L.type || 'stack'} ${L.narrow ? 'tk-layout--narrow' : ''} ${L.even ? 'tk-layout--split-even' : ''} ${L.stretch ? 'tk-layout--stretch' : ''} ${L.asideSticky ? 'tk-layout--aside-sticky' : ''}`} data-layout=${L.type} ref=${rootRef} style=${md ? 'scroll-margin-top:80px' : null}>
    ${region('header', reg.header)}${body}${region('footer', reg.footer)}${region('bottom', reg.bottom)}
  </div>`;
}
