// ============================================================================
// QA-SONDE – automatische Layout- und Qualitätsprüfungen im Vorschau-DOM.
// Wird identisch genutzt von: Workbench (Feature-QA, Quality Center) und
// CLI (qa/run-qa.mjs via Playwright: window.__taktQA.run()).
// Ergebnis je Check: { id, name, status: pass|warn|fail, detail, items[] }
// ============================================================================
import { parseColor, blend, contrast } from '../design-system/tokens.js';

export const CHECKS = [
  { id: 'render', name: 'Rendering ohne Fehler' },
  { id: 'blocks', name: 'Alle Blöcke vorhanden & sichtbar' },
  { id: 'overflow-x', name: 'Kein horizontaler Überlauf' },
  { id: 'clipped', name: 'Kein abgeschnittener Inhalt' },
  { id: 'touch', name: 'Touch-Ziele ausreichend gross (Mobile)' },
  { id: 'contrast', name: 'Textkontrast (WCAG)' },
  { id: 'images', name: 'Bilder geladen & beschriftet' },
  { id: 'a11y-names', name: 'Bedienelemente haben einen Namen (Screenreader)' },
  { id: 'privacy', name: 'Privatsphäre-Modus: keine Beträge sichtbar' },
];

const visible = (el) => {
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return false;
  const cs = getComputedStyle(el);
  return cs.visibility !== 'hidden' && cs.display !== 'none' && parseFloat(cs.opacity) > 0.05;
};
const describe = (el) => {
  const id = el.closest('[data-block-id]')?.getAttribute('data-block-id');
  const comp = el.closest('[data-component]')?.getAttribute('data-component');
  const txt = (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
  return `${comp ? comp + (id ? '#' + id : '') + ' › ' : ''}<${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''}> ${txt ? '„' + txt + '“' : ''}`;
};

function effectiveBg(el) {
  let layers = [];
  for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
    const c = parseColor(getComputedStyle(n).backgroundColor);
    if (c && c.a > 0) { layers.push(c); if (c.a >= 0.99) break; }
  }
  let bg = parseColor(getComputedStyle(document.body).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 };
  if (bg.a < 1) bg = blend(bg, { r: 255, g: 255, b: 255, a: 1 });
  for (let i = layers.length - 1; i >= 0; i--) bg = blend(layers[i], bg);
  return bg;
}

export async function runProbe({ payload, errors = [] } = {}) {
  const W = window.innerWidth, H = window.innerHeight;
  const bp = W < 600 ? 'mobile' : W < 1024 ? 'tablet' : 'desktop';
  const checks = [];
  const add = (id, status, detail, items = []) => checks.push({ id, name: CHECKS.find((c) => c.id === id)?.name || id, status, detail, items: items.slice(0, 12) });

  // 1) Render-Fehler
  const errEls = [...document.querySelectorAll('[data-qa="render-error"]')];
  add('render', errEls.length || errors.length ? 'fail' : 'pass',
    errEls.length || errors.length ? `${errEls.length} Block-Fehler, ${errors.length} Laufzeitfehler` : 'Keine Fehler',
    [...errEls.map((e) => e.textContent.trim().slice(0, 140)), ...errors]);

  // 2) Blöcke vorhanden
  const blocks = payload?.variant?.blocks || (payload?.component ? [{ id: 'preview' }] : []);
  const missing = [];
  let expected = 0;
  const tabsLayout = payload?.variant?.layout?.type === 'tabs';
  for (const b of blocks) {
    if ((b.hideOn || []).includes(bp)) continue;
    const el = document.querySelector(`[data-block-id="${CSS.escape(b.id)}"]`);
    if (tabsLayout && !el) continue; // inaktiver Reiter
    if (b.region === 'panel' && bp === 'mobile') continue; // eingeklappt
    expected++;
    if (!el) { missing.push(`${b.component}#${b.id} fehlt im DOM`); continue; }
    if (el.getBoundingClientRect().height < 4 && el.children.length) missing.push(`${b.component}#${b.id} ist leer/unsichtbar`);
  }
  add('blocks', missing.length ? 'fail' : 'pass', missing.length ? `${missing.length} von ${expected} fehlen` : `${expected} Blöcke sichtbar`, missing);

  // 3) Horizontaler Überlauf
  const docW = document.documentElement.scrollWidth;
  const offenders = [];
  if (docW > W + 1) {
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.right > W + 1 && r.width > 0 && visible(el) && !el.closest('.tk-table-wrap,.tk-seg,.tk-tabs,.tk-search-filter__chips,[data-scroll-x]')) {
        if (![...el.children].some((c) => c.getBoundingClientRect().right > W + 1)) offenders.push(`${describe(el)} (rechts ${Math.round(r.right)} px)`);
      }
      if (offenders.length > 12) break;
    }
  }
  add('overflow-x', docW > W + 1 ? 'fail' : 'pass', docW > W + 1 ? `Dokument ${docW} px breit bei Viewport ${W} px` : `Dokumentbreite ${docW} px ≤ ${W} px`, offenders);

  // 4) Abgeschnittene Inhalte (overflow hidden ohne Ellipsis/Line-Clamp)
  const clipped = [];
  for (const el of document.querySelectorAll('.tk-app__content *, .tk-bare *')) {
    const cs = getComputedStyle(el);
    if (!/(hidden|clip)/.test(cs.overflowX + cs.overflowY)) continue;
    if (cs.textOverflow === 'ellipsis' || cs.webkitLineClamp !== 'none' && cs.webkitLineClamp) continue;
    if (el.tagName === 'svg' || el.closest('svg') || !visible(el)) continue;
    if (el.matches('.tk-card--flush,.tk-dialog,.tk-progress,.tk-skel,[data-clip-ok]')) continue;
    const overX = el.scrollWidth > el.clientWidth + 2 && /(hidden|clip)/.test(cs.overflowX);
    const overY = el.scrollHeight > el.clientHeight + 2 && /(hidden|clip)/.test(cs.overflowY) && el.clientHeight > 0;
    if (overX || overY) clipped.push(`${describe(el)} (${overX ? 'breite' : ''}${overX && overY ? '+' : ''}${overY ? 'höhe' : ''})`);
    if (clipped.length > 12) break;
  }
  add('clipped', clipped.length ? 'warn' : 'pass', clipped.length ? `${clipped.length} Elemente schneiden Inhalt ab` : 'Keine abgeschnittenen Inhalte', clipped);

  // 5) Touch-Ziele (nur Mobile relevant)
  if (bp === 'mobile') {
    const small = [], tiny = [];
    for (const el of document.querySelectorAll('button, a[href], input:not([type=hidden]), select, textarea, [role=button], [role=tab], [role=checkbox], [role=switch]')) {
      if (!visible(el) || el.closest('[aria-hidden="true"]')) continue;
      const r = el.getBoundingClientRect();
      const m = Math.min(r.width, r.height);
      if (m < 24) tiny.push(`${describe(el)} ${Math.round(r.width)}×${Math.round(r.height)}`);
      else if (m < 32) small.push(`${describe(el)} ${Math.round(r.width)}×${Math.round(r.height)}`);
    }
    add('touch', tiny.length ? 'fail' : small.length ? 'warn' : 'pass', tiny.length ? `${tiny.length} Ziele < 24 px` : small.length ? `${small.length} Ziele < 32 px (Ziel 44 px)` : 'Alle Ziele ≥ 32 px', [...tiny, ...small]);
  } else add('touch', 'pass', `nicht relevant (${bp})`);

  // 6) Kontrast
  const lowFail = [], lowWarn = [];
  let sampled = 0;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.textContent.trim().length > 1 ? 1 : 2) });
  const seen = new Set();
  while (walker.nextNode() && sampled < 500) {
    const el = walker.currentNode.parentElement;
    if (!el || seen.has(el) || !visible(el) || el.closest('svg,[aria-hidden="true"],.tk-skel,option')) continue;
    seen.add(el); sampled++;
    const cs = getComputedStyle(el);
    const fg = parseColor(cs.color); if (!fg) continue;
    const bg = effectiveBg(el);
    const ratio = contrast(blend(fg, bg), bg);
    const large = parseFloat(cs.fontSize) >= 18.6 || (parseFloat(cs.fontSize) >= 14 && parseInt(cs.fontWeight, 10) >= 700);
    const min = large ? 3 : 4.5;
    const disabled = el.closest(':disabled,[aria-disabled="true"]');
    if (disabled) continue;
    if (ratio < min - 1.5) lowFail.push(`${describe(el)} ${ratio.toFixed(2)}:1`);
    else if (ratio < min) lowWarn.push(`${describe(el)} ${ratio.toFixed(2)}:1`);
  }
  add('contrast', lowFail.length ? 'fail' : lowWarn.length ? 'warn' : 'pass', `${sampled} Textstellen geprüft${lowFail.length ? `, ${lowFail.length} deutlich zu schwach` : ''}${lowWarn.length ? `, ${lowWarn.length} knapp unter Ziel` : ''}`, [...lowFail, ...lowWarn]);

  // 7) Bilder
  const imgs = [...document.querySelectorAll('img')];
  const badImg = imgs.filter((i) => !i.complete || i.naturalWidth === 0 || !i.hasAttribute('alt')).map((i) => describe(i));
  add('images', badImg.length ? 'fail' : 'pass', imgs.length ? `${imgs.length} Bilder, ${badImg.length} Probleme` : 'keine Bilder', badImg);

  // 8) Zugängliche Namen: Buttons, Links, Formularfelder und Rollen-Elemente brauchen Text, aria-label, Titel oder Label
  const nameOf = (el) => {
    if (el.getAttribute('aria-label')?.trim() || el.getAttribute('title')?.trim()) return true;
    const lb = el.getAttribute('aria-labelledby'); if (lb && lb.split(/\s+/).some((id) => document.getElementById(id)?.textContent.trim())) return true;
    if (/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) {
      if (el.type === 'hidden') return true;
      if (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)) return true;
      if (el.closest('label')) return true;
      return !!(el.getAttribute('placeholder') || '').trim(); // Platzhalter als schwacher Ersatz
    }
    if ((el.textContent || '').trim()) return true;
    return [...el.querySelectorAll('img[alt]')].some((i) => i.alt.trim());
  };
  const interactive = [...document.querySelectorAll('button, a[href], input, select, textarea, [role="button"], [role="switch"], [role="checkbox"], [role="radio"], [role="tab"], [role="slider"]')]
    .filter((el) => visible(el) && !el.closest('[aria-hidden="true"]'));
  const unnamed = interactive.filter((el) => !nameOf(el)).map((el) => describe(el));
  add('a11y-names', unnamed.length ? 'warn' : 'pass', unnamed.length ? `${unnamed.length} von ${interactive.length} Bedienelementen ohne Namen` : `${interactive.length} Bedienelemente benannt`, unnamed.slice(0, 20));

  // 9) Privatsphäre: im Privatsphäre-Modus darf kein Geldbetrag lesbar sein
  if (payload?.privacy) {
    const money = /(?:^|[^\w•])[−-]?\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?\s?€/;
    const leaks = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) { const t = n.textContent; if (money.test(t) && n.parentElement && visible(n.parentElement) && !n.parentElement.closest('script,style')) leaks.push(`${describe(n.parentElement)} „${t.trim().slice(0, 40)}“`); }
    add('privacy', leaks.length ? 'warn' : 'pass', leaks.length ? `${leaks.length} Beträge trotz Privatsphäre-Modus sichtbar` : 'Keine Beträge sichtbar', leaks.slice(0, 20));
  } else add('privacy', 'pass', 'nicht aktiv');

  const worst = checks.some((c) => c.status === 'fail') ? 'fail' : checks.some((c) => c.status === 'warn') ? 'warn' : 'pass';
  return { status: worst, bp, width: W, height: H, theme: payload?.theme, state: payload?.state || 'default', checks, ts: new Date().toISOString() };
}
