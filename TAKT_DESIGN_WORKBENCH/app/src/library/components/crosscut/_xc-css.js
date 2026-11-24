// Gemeinsames CSS der Kern-Bausteine (Präfix tk-xc-): Listenzeilen, Abschnittsköpfe, Icon-Kacheln, Markierung, Chips-Zeile.
export const XC_CSS = `
  .tk-xc-mark { background: var(--tk-c-accent-soft); color: inherit; border-radius: 3px; padding: 0 1px; font-weight: var(--tk-fw-semibold); }
  .tk-xc-sec { display: flex; align-items: center; gap: var(--tk-space-2); padding: var(--tk-space-4) var(--tk-space-1) var(--tk-space-2); font-size: var(--tk-fs-xs); font-weight: var(--tk-fw-semibold); letter-spacing: var(--tk-ls-wide); text-transform: uppercase; color: var(--tk-c-text-subtle); min-width: 0; }
  .tk-xc-sec:first-child { padding-top: var(--tk-space-1); }
  .tk-xc-sec__n { margin-left: auto; font-variant-numeric: tabular-nums; }
  .tk-xc-row { display: flex; align-items: center; gap: var(--tk-space-3); width: 100%; min-height: 52px; padding: var(--tk-space-2) var(--tk-space-3); border: 0; border-bottom: 1px solid var(--tk-c-border); background: none; color: var(--tk-c-text); font: inherit; text-align: left; cursor: pointer; min-width: 0; }
  .tk-xc-row:last-child { border-bottom: 0; }
  .tk-xc-row:hover, .tk-xc-row[aria-selected="true"] { background: var(--tk-c-surface2); }
  .tk-xc-row[aria-selected="true"] { box-shadow: inset 3px 0 0 var(--tk-c-accent); }
  .tk-xc-row[disabled] { opacity: .55; cursor: default; }
  .bp-mobile .tk-xc-row { min-height: var(--tk-size-touch); }
  .tk-xc-ic { width: 36px; height: 36px; border-radius: var(--tk-radius-md); display: grid; place-items: center; flex: none; background: var(--tk-c-accent-soft); color: var(--tk-c-accent); }
  .tk-xc-ic--success { background: var(--tk-c-success-soft); color: var(--tk-c-success); }
  .tk-xc-ic--warning { background: var(--tk-c-warning-soft); color: var(--tk-c-warning); }
  .tk-xc-ic--danger { background: var(--tk-c-danger-soft); color: var(--tk-c-danger); }
  .tk-xc-ic--info { background: var(--tk-c-info-soft); color: var(--tk-c-info); }
  .tk-xc-ic--neutral { background: var(--tk-c-surface3); color: var(--tk-c-text-muted); }
  .tk-xc-main { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .tk-xc-t { font-weight: var(--tk-fw-medium); color: var(--tk-c-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
  .tk-xc-s { font-size: var(--tk-fs-sm); color: var(--tk-c-text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
  .tk-xc-end { flex: none; display: flex; flex-direction: column; align-items: flex-end; gap: 2px; font-size: var(--tk-fs-sm); color: var(--tk-c-text-subtle); font-variant-numeric: tabular-nums; }
  .tk-xc-chips { display: flex; gap: var(--tk-space-2); overflow-x: auto; scrollbar-width: none; padding: 2px 1px; margin: 0 -1px; }
  .tk-xc-chips::-webkit-scrollbar { display: none; }
  .tk-xc-chips .tk-chip { flex: none; }
  .tk-xc-wrap { display: flex; flex-wrap: wrap; gap: var(--tk-space-2); min-width: 0; }
  .tk-xc-kbd { display: inline-flex; align-items: center; justify-content: center; min-width: 22px; height: 22px; padding: 0 6px; border-radius: var(--tk-radius-xs); border: 1px solid var(--tk-c-border-strong); background: var(--tk-c-surface2); color: var(--tk-c-text-muted); font-size: var(--tk-fs-xs); font-family: var(--tk-font); }
  .tk-xc-link { border: 0; background: none; padding: var(--tk-space-2) var(--tk-space-3); color: var(--tk-c-accent); font: inherit; font-size: var(--tk-fs-sm); font-weight: var(--tk-fw-medium); cursor: pointer; border-radius: var(--tk-radius-sm); min-height: 36px; }
  .tk-xc-link:hover { background: var(--tk-c-accent-soft); }
  .bp-mobile .tk-xc-link { min-height: var(--tk-size-touch); }
  .tk-xc-stack { display: flex; flex-direction: column; gap: var(--tk-space-3); min-width: 0; }
  .tk-xc-iconbtn { width: 36px; height: 36px; flex: none; display: grid; place-items: center; border: 0; border-radius: var(--tk-radius-sm); background: none; color: var(--tk-c-text-muted); cursor: pointer; }
  .tk-xc-iconbtn:hover { background: var(--tk-c-surface3); color: var(--tk-c-text); }
  .bp-mobile .tk-xc-iconbtn { width: var(--tk-size-touch); height: var(--tk-size-touch); }`;
/** Beschriftung für Zwecke der Tonfarbe (Badge/Icon): tone → Klassen-Suffix. */
export const toneIc = (tone) => (['success', 'warning', 'danger', 'info', 'neutral'].includes(tone) ? ` tk-xc-ic--${tone}` : '');
