// ============================================================================
// WORKBENCH-UI-KIT – Bausteine der Workbench-Oberfläche (nicht TAKT!).
// Dialoge/Menüs/Toasts laufen über einen globalen Overlay-Host.
// ============================================================================
import { html } from '../../lib/html.js';
import { useState, useEffect, useRef, useLayoutEffect } from 'preact/hooks';
import { Icon } from '../../lib/icons.js';
import { cx } from '../../lib/util.js';
import { statusInfo } from '../../core/schema.js';

export { Icon };

export const Btn = ({ variant, size, icon, iconRight, children, class: c, pressed, ...rest }) =>
  html`<button type="button" class=${cx('wb-btn', variant && `wb-btn--${variant}`, size === 'sm' && 'wb-btn--sm', icon && !children && 'wb-btn--icon', c)} aria-pressed=${pressed == null ? undefined : String(!!pressed)} ...${rest}>
    ${icon && html`<${Icon} name=${icon} size=${size === 'sm' ? 14 : 16} />`}${children}${iconRight && html`<${Icon} name=${iconRight} size=${14} />`}</button>`;

export const IconBtn = ({ icon, label, size = 'sm', variant = 'ghost', ...rest }) => html`<${Btn} icon=${icon} size=${size} variant=${variant} aria-label=${label} title=${label} ...${rest} />`;

export const Badge = ({ tone, children, icon, dot, sq, outline, title }) =>
  html`<span class=${cx('wb-badge', tone && `wb-badge--${tone}`, sq && 'wb-badge--sq', outline && 'wb-badge--outline')} title=${title}>${dot && html`<span class="wb-dot"></span>`}${icon && html`<${Icon} name=${icon} size=${12} />`}${children}</span>`;

export const StatusBadge = ({ status, short }) => { const s = statusInfo(status); return html`<${Badge} tone=${s.tone === 'neutral' ? null : s.tone} icon=${s.icon}>${short ? s.short : s.label}<//>`; };

export const QaCell = ({ status, label }) => html`<span class=${`wb-cell wb-cell--${status || 'none'}`} title=${label}>${{ pass: '✓', warn: '!', fail: '✕' }[status] || '–'}</span>`;

export const Card = ({ title, icon, actions, children, pad, class: c, onClick, selected, hover, bodyClass, sub }) =>
  html`<section class=${cx('wb-card', pad && 'wb-card--pad', (hover || onClick) && 'wb-card--hover', selected && 'wb-card--selected', c)} onClick=${onClick}>
    ${(title || actions) && html`<div class="wb-card__head">${icon && html`<span class="wb-subtle"><${Icon} name=${icon} size=${16} /></span>`}<div class="wb-card__title">${title}${sub && html`<div class="wb-subtle wb-small wb-card__sub">${sub}</div>`}</div>${actions}</div>`}
    ${title || actions ? html`<div class=${cx('wb-card__body', bodyClass)}>${children}</div>` : children}
  </section>`;

export const Field = ({ label, hint, error, children, right }) =>
  html`<label class="wb-field">${label && html`<span class="wb-field__label">${label}${right && html`<span class="wb-grow"></span>${right}`}</span>`}${children}
    ${error ? html`<span class="wb-field__error">${error}</span>` : hint && html`<span class="wb-field__hint">${hint}</span>`}</label>`;

/** Eingabe, die erst bei Blur/Enter übernimmt (verhindert Historien-Flut). live=true übernimmt sofort (debounced durch Store-Coalescing). */
export function TextInput({ value, onCommit, live, multiline, class: c, size, ...rest }) {
  const [v, setV] = useState(value ?? '');
  const focused = useRef(false);
  useEffect(() => { if (!focused.current) setV(value ?? ''); }, [value]);
  const commit = (nv = v) => { if ((nv ?? '') !== (value ?? '')) onCommit && onCommit(nv); };
  const common = {
    value: v, onFocus: () => { focused.current = true; }, onBlur: () => { focused.current = false; commit(); },
    onInput: (e) => { setV(e.currentTarget.value); if (live) onCommit && onCommit(e.currentTarget.value); },
    ...rest,
  };
  return multiline
    ? html`<textarea class=${cx('wb-textarea', c)} ...${common}></textarea>`
    : html`<input class=${cx('wb-input', size === 'sm' && 'wb-input--sm', c)} onKeyDown=${(e) => { if (e.key === 'Enter') { e.currentTarget.blur(); } if (e.key === 'Escape') { setV(value ?? ''); setTimeout(() => e.target.blur()); } }} ...${common} />`;
}

export const Select = ({ value, onChange, options, size, class: c, ...rest }) =>
  html`<select class=${cx('wb-select', size === 'sm' && 'wb-select--sm', c)} value=${value} onChange=${(e) => onChange(e.currentTarget.value)} ...${rest}>
    ${options.map((o) => (typeof o === 'string' ? html`<option value=${o}>${o}</option>` : html`<option value=${o.value} disabled=${o.disabled}>${o.label}</option>`))}</select>`;

export const Checkbox = ({ checked, onChange, label, ...rest }) =>
  html`<label class="wb-check"><input type="checkbox" checked=${!!checked} onChange=${(e) => onChange(e.currentTarget.checked)} ...${rest} />${label}</label>`;

export const Tabs = ({ value, onChange, options }) =>
  html`<div class="wb-tabs" role="tablist">${options.map((o) => html`<button type="button" role="tab" aria-selected=${String(o.value === value)} onClick=${() => onChange(o.value)} data-tab=${o.value}>
    ${o.icon && html`<${Icon} name=${o.icon} size=${15} />`}${o.label}${o.count != null && html`<${Badge}>${o.count}<//>`}${o.dot && html`<span class="wb-dot" style=${`color:var(--wb-${o.dot})`}></span>`}</button>`)}</div>`;

export const Seg = ({ value, onChange, options, label }) =>
  html`<div class="wb-seg" role="tablist" aria-label=${label}>${options.map((o) => html`<button type="button" role="tab" aria-selected=${String(o.value === value)} onClick=${() => onChange(o.value)} title=${o.title || o.label}>
    ${o.icon && html`<${Icon} name=${o.icon} size=${14} />`}${o.label}</button>`)}</div>`;

export const Empty = ({ icon = 'inbox', title, text, action }) =>
  html`<div class="wb-empty"><div class="wb-empty__icon"><${Icon} name=${icon} size=${22} /></div><div class="wb-empty__title">${title}</div>${text && html`<div class="wb-empty__text">${text}</div>`}${action && html`<div style="margin-top:6px">${action}</div>`}</div>`;

export const Kpi = ({ label, value, icon, foot, tone, onClick }) =>
  html`<${Card} onClick=${onClick}><div class="wb-kpi"><div class="wb-kpi__label">${icon && html`<span style=${tone ? `color:var(--wb-${tone})` : ''}><${Icon} name=${icon} size=${15} /></span>`}${label}</div>
    <div class="wb-kpi__value">${value}</div>${foot && html`<div class="wb-kpi__foot">${foot}</div>`}</div><//>`;

// ---------------------------------------------------------- Overlay-Host ---
let overlays = []; const subs = new Set();
const emit = () => subs.forEach((f) => f([...overlays]));
const push = (o) => { overlays.push({ id: Math.random().toString(36).slice(2), ...o }); emit(); return overlays[overlays.length - 1].id; };
export const closeOverlay = (id) => { overlays = overlays.filter((o) => o.id !== id); emit(); };

/** openDialog({ title, size: 'wide'|'xl', body: Komponente ({ close }) => vnode (Hooks erlaubt), footer: (close) => vnode }) */
export const openDialog = (d) => push({ kind: 'dialog', ...d });
export const confirmDialog = ({ title, text, confirmLabel = 'Bestätigen', danger }) => new Promise((resolve) => {
  const id = push({ kind: 'dialog', title, onClose: () => resolve(false),
    body: () => html`<p class="wb-muted" style="white-space:pre-wrap">${text}</p>`,
    footer: (close) => html`<${Btn} onClick=${() => { resolve(false); close(); }}>Abbrechen<//><${Btn} variant=${danger ? 'danger' : 'primary'} data-confirm onClick=${() => { resolve(true); closeOverlay(id); }}>${confirmLabel}<//>` });
});
export const promptDialog = ({ title, label, value = '', placeholder, confirmLabel = 'Übernehmen', multiline, hint }) => new Promise((resolve) => {
  let current = value;
  const id = push({ kind: 'dialog', title, onClose: () => resolve(null),
    body: () => html`<${Field} label=${label} hint=${hint}>${multiline ? html`<textarea class="wb-textarea" autofocus placeholder=${placeholder} onInput=${(e) => { current = e.currentTarget.value; }}>${value}</textarea>`
      : html`<input class="wb-input" autofocus value=${value} placeholder=${placeholder} onInput=${(e) => { current = e.currentTarget.value; }} onKeyDown=${(e) => { if (e.key === 'Enter') { resolve(current.trim()); closeOverlay(id); } }} />`}<//>`,
    footer: (close) => html`<${Btn} onClick=${() => { resolve(null); close(); }}>Abbrechen<//><${Btn} variant="primary" data-confirm onClick=${() => { resolve(current.trim()); closeOverlay(id); }}>${confirmLabel}<//>` });
});
/** openMenu(event, [{label, icon, onClick, danger, sep}]) */
export function openMenu(e, items) {
  e.preventDefault(); e.stopPropagation();
  const r = e.currentTarget.getBoundingClientRect();
  push({ kind: 'menu', x: r.left, y: r.bottom + 4, right: r.right, items });
}
let toastSeq = 0;
export function toast(text, tone, action) {
  const id = push({ kind: 'toast', text, tone, action, seq: ++toastSeq });
  setTimeout(() => closeOverlay(id), tone === 'danger' ? 6000 : 3200);
}

function Menu({ o }) {
  const ref = useRef();
  const [pos, setPos] = useState({ left: o.x, top: o.y });
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const w = el.offsetWidth, h = el.offsetHeight;
    setPos({ left: Math.max(8, Math.min(o.x, window.innerWidth - w - 8, o.right - w > 0 && o.x + w > window.innerWidth - 8 ? o.right - w : o.x)), top: o.y + h > window.innerHeight - 8 ? Math.max(8, o.y - h - 40) : o.y });
  }, []);
  useEffect(() => {
    const close = (e) => { if (!ref.current?.contains(e.target)) closeOverlay(o.id); };
    const key = (e) => e.key === 'Escape' && closeOverlay(o.id);
    setTimeout(() => document.addEventListener('mousedown', close), 0); document.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', key); };
  }, []);
  return html`<div class="wb-menu" ref=${ref} style=${`left:${pos.left}px;top:${pos.top}px`} role="menu">
    ${o.items.filter(Boolean).map((it) => (it.sep ? html`<hr />` : html`<button type="button" role="menuitem" class=${it.danger ? 'is-danger' : ''} disabled=${it.disabled} onClick=${() => { closeOverlay(o.id); it.onClick && it.onClick(); }}>
      ${it.icon && html`<${Icon} name=${it.icon} size=${15} />`}<span class="wb-grow">${it.label}</span>${it.hint && html`<span class="wb-subtle wb-xs">${it.hint}</span>`}</button>`))}
  </div>`;
}

function DialogView({ o }) {
  const close = () => { o.onClose && o.onClose(); closeOverlay(o.id); };
  return html`<div class="wb-overlay" onMouseDown=${(e) => e.target === e.currentTarget && close()}>
    <div class=${cx('wb-dialog', o.size && `wb-dialog--${o.size}`, o.class)} role="dialog" aria-modal="true" aria-label=${o.title}>
      ${o.title && html`<div class="wb-dialog__head"><div class="wb-dialog__title">${o.title}</div><${IconBtn} icon="x" label="Schließen" onClick=${close} /></div>`}
      <div class="wb-dialog__body">${typeof o.body === 'function' ? html`<${o.body} close=${close} />` : o.body}</div>
      ${o.footer && html`<div class="wb-dialog__foot">${o.footer(close)}</div>`}
    </div></div>`;
}

export function OverlayHost() {
  const [list, setList] = useState([]);
  useEffect(() => { subs.add(setList); return () => subs.delete(setList); }, []);
  // Ein globaler Escape-Handler schließt den obersten Dialog (zuverlässig, auch direkt nach dem Öffnen)
  useEffect(() => {
    const k = (e) => {
      if (e.key !== 'Escape' || overlays.some((x) => x.kind === 'menu')) return;
      const top = overlays.filter((x) => x.kind === 'dialog').pop();
      if (top) { e.preventDefault(); top.onClose && top.onClose(); closeOverlay(top.id); }
    };
    document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k);
  }, []);
  return html`${list.filter((o) => o.kind === 'dialog').map((o) => html`<${DialogView} key=${o.id} o=${o} />`)}
    ${list.filter((o) => o.kind === 'menu').map((o) => html`<${Menu} key=${o.id} o=${o} />`)}
    <div class="wb-toasts" aria-live="polite">${list.filter((o) => o.kind === 'toast').map((o) => html`<div key=${o.id} class=${cx('wb-toast', o.tone === 'danger' && 'wb-toast--danger')}>
      <${Icon} name=${o.tone === 'danger' ? 'alert-triangle' : 'check-circle-2'} size=${16} /><span class="wb-grow">${o.text}</span>${o.action && html`<button type="button" onClick=${() => { closeOverlay(o.id); o.action.onClick(); }}>${o.action.label}</button>`}</div>`)}</div>`;
}

/** Drag&Drop-Sortierung für einfache Listen. Liefert Props für jedes Element. */
export function useSortable(ids, onReorder) {
  const [drag, setDrag] = useState(null); const [over, setOver] = useState(null);
  const itemProps = (id) => ({
    draggable: true,
    onDragStart: (e) => { setDrag(id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', id); },
    onDragOver: (e) => { if (drag) { e.preventDefault(); setOver(id); } },
    onDragLeave: () => setOver((o) => (o === id ? null : o)),
    onDrop: (e) => { e.preventDefault(); if (drag && drag !== id) { const list = ids.filter((x) => x !== drag); list.splice(list.indexOf(id), 0, drag); onReorder(list); } setDrag(null); setOver(null); },
    onDragEnd: () => { setDrag(null); setOver(null); },
    'data-drop': over === id && drag !== id ? 'true' : undefined,
  });
  return { itemProps, dragging: drag };
}
