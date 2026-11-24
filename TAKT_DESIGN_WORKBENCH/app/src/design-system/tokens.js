// ============================================================================
// TAKT DESIGN TOKENS – die EINZIGE Quelle für Farben, Typografie, Abstände …
// ----------------------------------------------------------------------------
// * Alle TAKT-Komponenten (app/src/library) nutzen außchließlich die hieraus
//   erzeugten CSS-Variablen  (--tk-…). Kein Hex-Wert in Komponenten!
// * Themes verändern NUR Farben/Oberflächen/Kontraste/Akzente/Schatten –
//   niemals Abstände, Größen oder die Informationsarchitektur.
// * Export als JSON (Workbench > Daten) dient als Grundlage für das spätere
//   Mapping auf Flutter ThemeData / ThemeExtension.
// * TODO Phase 1 (lokal): Farbwerte mit den bestehenden TAKT-Themes
//   (Graphite / Horizon / Intensiv) aus dem Flutter-Projekt abgleichen.
// ============================================================================

export const TOKENS_VERSION = '1.0.0';

export const base = {
  font: {
    family: "'Inter', 'Segoe UI Variable', 'Segoe UI', system-ui, -apple-system, Roboto, sans-serif",
    mono: "'JetBrains Mono', 'Cascadia Code', Consolas, ui-monospace, monospace",
    size: { xs: 11, sm: 12.5, md: 14, lg: 16, xl: 19, '2xl': 23, '3xl': 29, '4xl': 36 },
    weight: { regular: 400, medium: 500, semibold: 600, bold: 700 },
    lineHeight: { tight: 1.2, snug: 1.35, normal: 1.5 },
    tracking: { tight: '-0.015em', normal: '0', wide: '0.04em' },
  },
  space: { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 28, 8: 32, 10: 40, 12: 48, 16: 64 },
  radius: { xs: 4, sm: 6, md: 10, lg: 14, xl: 20, pill: 999 },
  size: {
    touch: 44,          // Mindest-Touchziel (Mobile)
    control: 36,        // Standard-Höhe Buttons/Inputs (Desktop)
    controlSm: 28,
    icon: 18, iconSm: 15, iconLg: 22,
    appBar: 56, bottomNav: 64, navRail: 76, sidebar: 232,
    contentMax: 1280,
  },
  breakpoint: { tablet: 600, desktop: 1024, wide: 1366 },
  motion: { fast: '120ms', base: '180ms', slow: '280ms', ease: 'cubic-bezier(.2,.7,.2,1)' },
  z: { sticky: 10, drawer: 40, dialog: 50, toast: 60 },
};

// Farbrollen – jedes Theme MUSS alle Rollen definieren (wird von QA geprüft).
export const COLOR_ROLES = [
  'bg', 'surface', 'surface2', 'surface3', 'overlay',
  'border', 'borderStrong',
  'text', 'textMuted', 'textSubtle', 'textOnAccent',
  'accent', 'accentHover', 'accentSoft', 'accent2',
  'success', 'successSoft', 'warning', 'warningSoft', 'danger', 'dangerSoft', 'info', 'infoSoft',
  'focus', 'navBg', 'navActive',
];

export const themes = {
  graphite: {
    label: 'Graphite',
    note: 'Standard. Ruhiges, neutrales Dunkelgrau, kühler Blau-Akzent. Für tägliche Nutzung.',
    scheme: 'dark',
    color: {
      bg: '#0f1114', surface: '#171a1f', surface2: '#1e2228', surface3: '#272c33', overlay: 'rgba(5,6,8,.62)',
      border: '#2a2f37', borderStrong: '#3a414b',
      text: '#e9ecf0', textMuted: '#a3aab4', textSubtle: '#8a929d', textOnAccent: '#08111f',
      accent: '#6aa6ff', accentHover: '#8ab9ff', accentSoft: 'rgba(106,166,255,.15)', accent2: '#b48cff',
      success: '#43c08a', successSoft: 'rgba(67,192,138,.15)', warning: '#e8aa45', warningSoft: 'rgba(232,170,69,.16)',
      danger: '#f06a6a', dangerSoft: 'rgba(240,106,106,.15)', info: '#5fc0dc', infoSoft: 'rgba(95,192,220,.14)',
      focus: '#8ab9ff', navBg: '#121418', navActive: 'rgba(106,166,255,.14)',
    },
    chart: ['#6aa6ff', '#43c08a', '#e8aa45', '#b48cff', '#5fc0dc', '#f06a6a'],
    shadow: { sm: '0 1px 2px rgba(0,0,0,.4)', md: '0 6px 18px rgba(0,0,0,.35)', lg: '0 18px 48px rgba(0,0,0,.5)' },
  },
  horizon: {
    label: 'Horizon',
    note: 'Hell und luftig. Weisse Flächen, Himmelblau/Petrol-Akzent. Für Tageslicht und Lesbarkeit.',
    scheme: 'light',
    color: {
      bg: '#f3f6fa', surface: '#ffffff', surface2: '#f6f8fb', surface3: '#e9eef5', overlay: 'rgba(15,23,42,.38)',
      border: '#dfe5ee', borderStrong: '#c7d0dc',
      text: '#14202e', textMuted: '#4f5d6e', textSubtle: '#66727f', textOnAccent: '#ffffff',
      accent: '#1a62bb', accentHover: '#14529f', accentSoft: 'rgba(31,111,209,.1)', accent2: '#0f9488',
      success: '#0f7140', successSoft: 'rgba(20,128,74,.1)', warning: '#8f5000', warningSoft: 'rgba(214,137,16,.14)',
      danger: '#c8322f', dangerSoft: 'rgba(200,50,47,.09)', info: '#08698b', infoSoft: 'rgba(11,122,160,.1)',
      focus: '#1a62bb', navBg: '#ffffff', navActive: 'rgba(31,111,209,.1)',
    },
    chart: ['#1a62bb', '#0f9488', '#d68910', '#7c5cd6', '#0b7aa0', '#c8322f'],
    shadow: { sm: '0 1px 2px rgba(16,24,40,.06)', md: '0 6px 16px rgba(16,24,40,.08)', lg: '0 18px 44px rgba(16,24,40,.14)' },
  },
  intensiv: {
    label: 'Intensiv',
    note: 'Hoher Kontrast. Tiefschwarz, kräftiger Orange-/Magenta-Akzent. Fokus und Motivation.',
    scheme: 'dark',
    color: {
      bg: '#050505', surface: '#0e0e10', surface2: '#16161a', surface3: '#202026', overlay: 'rgba(0,0,0,.72)',
      border: '#26262d', borderStrong: '#3a3a44',
      text: '#ffffff', textMuted: '#bdbdc7', textSubtle: '#9a9aa6', textOnAccent: '#140700',
      accent: '#ff7a1a', accentHover: '#ff9547', accentSoft: 'rgba(255,122,26,.17)', accent2: '#ff3d9a',
      success: '#2ee68a', successSoft: 'rgba(46,230,138,.15)', warning: '#ffd23f', warningSoft: 'rgba(255,210,63,.15)',
      danger: '#ff4d5e', dangerSoft: 'rgba(255,77,94,.16)', info: '#3dd6ff', infoSoft: 'rgba(61,214,255,.14)',
      focus: '#ffb27a', navBg: '#000000', navActive: 'rgba(255,122,26,.18)',
    },
    chart: ['#ff7a1a', '#3dd6ff', '#2ee68a', '#ff3d9a', '#ffd23f', '#a78bfa'],
    shadow: { sm: '0 1px 2px rgba(0,0,0,.6)', md: '0 6px 20px rgba(0,0,0,.6)', lg: '0 20px 50px rgba(0,0,0,.75)' },
  },
};

export const THEME_IDS = Object.keys(themes);

const kebab = (s) => String(s).replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
const px = (v) => (typeof v === 'number' ? `${v}px` : v);

/** Basis-Variablen (theme-unabhängig). */
export function baseCssVars() {
  const v = [];
  v.push(`--tk-font: ${base.font.family}`, `--tk-font-mono: ${base.font.mono}`);
  for (const [k, val] of Object.entries(base.font.size)) v.push(`--tk-fs-${k}: calc(${px(val)} * var(--tk-text-scale, 1))`);
  for (const [k, val] of Object.entries(base.font.weight)) v.push(`--tk-fw-${k}: ${val}`);
  for (const [k, val] of Object.entries(base.font.lineHeight)) v.push(`--tk-lh-${k}: ${val}`);
  for (const [k, val] of Object.entries(base.font.tracking)) v.push(`--tk-ls-${k}: ${val}`);
  for (const [k, val] of Object.entries(base.space)) v.push(`--tk-space-${k}: ${px(val)}`);
  for (const [k, val] of Object.entries(base.radius)) v.push(`--tk-radius-${k}: ${px(val)}`);
  for (const [k, val] of Object.entries(base.size)) v.push(`--tk-size-${kebab(k)}: ${px(val)}`);
  for (const [k, val] of Object.entries(base.motion)) v.push(`--tk-motion-${k}: ${val}`);
  for (const [k, val] of Object.entries(base.z)) v.push(`--tk-z-${k}: ${val}`);
  return v;
}

/** Theme-Variablen (Farben, Schatten, Chart-Palette). */
export function themeCssVars(themeId) {
  const t = themes[themeId] || themes.graphite;
  const v = [`color-scheme: ${t.scheme}`];
  for (const [k, val] of Object.entries(t.color)) v.push(`--tk-c-${kebab(k)}: ${val}`);
  t.chart.forEach((c, i) => v.push(`--tk-chart-${i + 1}: ${c}`));
  for (const [k, val] of Object.entries(t.shadow)) v.push(`--tk-shadow-${k}: ${val}`);
  return v;
}

/** Vollständiges Stylesheet: :root = Basis, [data-tk-theme=x] = Themes. */
export function tokensStylesheet() {
  let css = `:root{${baseCssVars().join(';')}}\n`;
  for (const id of THEME_IDS) css += `[data-tk-theme="${id}"]{${themeCssVars(id).join(';')}}\n`;
  return css;
}

/** JSON-Export (für Flutter-Mapping / Dokumentation). */
export function tokensJson() {
  return { version: TOKENS_VERSION, base, themes, colorRoles: COLOR_ROLES };
}

// --- Kontrast-Hilfen (auch von QA genutzt) ---------------------------------
export function parseColor(str) {
  if (!str) return null;
  str = String(str).trim();
  let m = str.match(/^#([0-9a-f]{3,8})$/i);
  if (m) {
    let h = m[1];
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1 };
  }
  m = str.match(/^rgba?\(([^)]+)\)$/);
  if (m) {
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(parseFloat);
    return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 };
  }
  return null;
}
const lum = ({ r, g, b }) => {
  const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
export function blend(fg, bg) {
  const a = fg.a ?? 1;
  return { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a), a: 1 };
}
export function contrast(c1, c2) {
  const l1 = lum(c1), l2 = lum(c2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

/** Prüft die Kernkombinationen eines Themes (Token-Audit für Quality Center). */
export function auditTheme(themeId) {
  const t = themes[themeId];
  const c = (k) => parseColor(t.color[k]);
  const out = [];
  const missing = COLOR_ROLES.filter((r) => !t.color[r]);
  out.push({ id: 'roles', name: 'Alle Farbrollen definiert', status: missing.length ? 'fail' : 'pass', detail: missing.join(', ') || `${COLOR_ROLES.length} Rollen` });
  const pairs = [
    ['text', 'bg', 7], ['text', 'surface', 7], ['textMuted', 'surface', 4.5], ['textSubtle', 'surface', 4.5],
    ['textOnAccent', 'accent', 4.5], ['accent', 'surface', 3], ['danger', 'surface', 3], ['success', 'surface', 3], ['warning', 'surface', 3],
    // Text auf getönten Flächen (Badges, aktive Chips, Navigation) – über surface bzw. navBg geblendet
    ['accent', 'accentSoft', 4.5, 'surface'], ['success', 'successSoft', 4.5, 'surface'], ['warning', 'warningSoft', 4.5, 'surface'],
    ['danger', 'dangerSoft', 4.5, 'surface'], ['info', 'infoSoft', 4.5, 'surface'], ['accent', 'navActive', 4.5, 'navBg'], ['textMuted', 'surface3', 4.5],
  ];
  for (const [fg, bgKey, min, under] of pairs) {
    const bg = under ? blend(c(bgKey), c(under)) : c(bgKey);
    const ratio = contrast(blend(c(fg), bg), bg);
    const bg2 = bgKey;
    out.push({ id: `contrast-${fg}-${bg2}`, name: `Kontrast ${fg} auf ${bg2}`, status: ratio >= min ? 'pass' : ratio >= min * 0.85 ? 'warn' : 'fail', detail: `${ratio.toFixed(2)} : 1 (Ziel ≥ ${min})` });
  }
  return out;
}
