// ============================================================================
// LAYOUT-ENGINE – rendert eine Varianten-Spezifikation (layout + blocks).
// Layout-Typen: stack | split | sidebar | grid | tabs
// Regionen:     header (oben, volle Breite) | main | aside (split) |
//               panel (sidebar) | footer | bottom (sticky, z. B. Quick-Add)
// ============================================================================
import { html } from '../lib/html.js';
import { useState } from 'preact/hooks';
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

export function Layout({ variant, renderBlock, bp }) {
  const L = variant.layout || { type: 'stack' };
  const reg = blocksByRegion(variant);
  const [panelOpen, setPanelOpen] = useState(false);
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
  return html`<div class=${`tk-layout tk-layout--${L.type || 'stack'} ${L.narrow ? 'tk-layout--narrow' : ''} ${L.even ? 'tk-layout--split-even' : ''} ${L.stretch ? 'tk-layout--stretch' : ''} ${L.asideSticky ? 'tk-layout--aside-sticky' : ''}`} data-layout=${L.type}>
    ${region('header', reg.header)}${body}${region('footer', reg.footer)}${region('bottom', reg.bottom)}
  </div>`;
}
