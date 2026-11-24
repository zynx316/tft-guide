// Fitness: gemeinsame UI-Bausteine (Stepper, Ring, Muskel-Badge, Takt der Live-Einheit) und geteiltes CSS.
// Das CSS (FIT_CSS) hängt an der Komponente „set-logger“ und gilt damit für alle Fitness-Komponenten.
import { html } from '../../../lib/html.js';
import { useState, useEffect, useRef } from 'preact/hooks';
import { Icon, toneColor } from '../../ui.js';
import { numAuto, num, MUSCLES } from './_calc.js';

export const muscleColor = (m) => toneColor({ Brust: 1, Rücken: 2, Schulter: 3, Bizeps: 4, Trizeps: 5, Beine: 6, Gesäß: 'accent2', Core: 'info' }[m] || 'neutral');
export const hideVal = (ctx, text) => (ctx.ui?.hideWeight ? '•••' : text);
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const parseNum = (t) => { const n = parseFloat(String(t).replace(/\s/g, '').replace(',', '.')); return Number.isFinite(n) ? n : null; };

/** Zahlen-Stepper mit direkter Eingabe (Dezimalkomma), min/max und Schrittweite. */
export function Stepper({ value, onChange, step = 1, min = 0, max = 999, decimals, unit, label, size = 'md', disabled }) {
  const [txt, setTxt] = useState(null);
  const show = txt ?? (decimals != null ? num(value ?? 0, decimals) : numAuto(value ?? 0));
  const set = (v) => { const r = Math.round(clamp(v, min, max) * 100) / 100; onChange && onChange(r); };
  const commit = () => { const n = parseNum(txt); setTxt(null); if (n != null) set(n); };
  return html`<div class=${`tk-fit-step tk-fit-step--${size}`} role="group" aria-label=${label}>
    <button type="button" aria-label=${`${label} verringern`} disabled=${disabled || value <= min} onClick=${() => set((value || 0) - step)}><${Icon} name="minus" size=${size === 'lg' ? 22 : 16} /></button>
    <input type="text" inputmode="decimal" aria-label=${label} value=${show} disabled=${disabled} onInput=${(e) => setTxt(e.currentTarget.value)} onBlur=${() => txt != null && commit()}
      onKeyDown=${(e) => e.key === 'Enter' && e.currentTarget.blur()} onFocus=${(e) => e.currentTarget.select()} />
    <button type="button" aria-label=${`${label} erhöhen`} disabled=${disabled || value >= max} onClick=${() => set((value || 0) + step)}><${Icon} name="plus" size=${size === 'lg' ? 22 : 16} /></button>
    ${unit && html`<span class="tk-fit-step__u" aria-hidden="true">${unit}</span>`}
  </div>`;
}

/** Fortschrittsring (0–1) mit beliebigem Inhalt in der Mitte. */
export function Ring({ value = 0, size = 120, stroke = 10, tone = 'accent', label, children }) {
  const R = (size - stroke) / 2, C = 2 * Math.PI * R, col = toneColor(tone), v = clamp(value, 0, 1);
  return html`<div class="tk-fit-ring" style=${`width:${size}px;height:${size}px`} role="img" aria-label=${label}>
    <svg width=${size} height=${size} viewBox=${`0 0 ${size} ${size}`} aria-hidden="true"><circle cx=${size / 2} cy=${size / 2} r=${R} fill="none" stroke=${col} stroke-opacity=".18" stroke-width=${stroke} />
      <circle cx=${size / 2} cy=${size / 2} r=${R} fill="none" stroke=${col} stroke-width=${stroke} stroke-linecap="round" stroke-dasharray=${`${Math.max(v * C, 0.01)} ${C}`} transform=${`rotate(-90 ${size / 2} ${size / 2})`} /></svg>
    <div class="tk-fit-ring__in">${children}</div></div>`;
}

/** Schalter mit ganzer Zeile als Tippfläche (mindestens 44 px hoch). */
export const Toggle = ({ checked, onChange, label }) => html`<button type="button" role="switch" aria-checked=${String(!!checked)} class="tk-fit-toggle" onClick=${() => onChange(!checked)}><span class="tk-fit-toggle__track"><i></i></span><span>${label}</span></button>`;

export const MuscleDot = ({ muscle }) => html`<span class="tk-fit-mus"><i style=${`background:${muscleColor(muscle)}`}></i>${muscle}</span>`;

/** Takt der Live-Einheit: genau EINE gemountete Komponente zählt Dauer und Pause herunter. */
let tickOwner = null;
export function useSessionTicker(session, setSession, ctx) {
  const ref = useRef(session); ref.current = session;
  const cx = useRef(ctx); cx.current = ctx;
  useEffect(() => {
    if (!cx.current.live) return undefined; // Uhr läuft nur im Launcher (ctx.live), in QA/Workbench bleibt sie fest
    const me = Math.random();
    const t = setInterval(() => {
      if (!tickOwner) tickOwner = me;
      if (tickOwner !== me) return;
      const s = ref.current;
      if (!s || s.status !== 'running') return;
      const fire = s.rest?.running && s.rest.left <= 1;
      setSession((cur) => {
        if (!cur || cur.status !== 'running') return cur;
        const r = cur.rest;
        const rest = r && r.running ? (r.left <= 1 ? { ...r, left: 0, running: false, done: true } : { ...r, left: r.left - 1 }) : r;
        return { ...cur, elapsed: (cur.elapsed || 0) + 1, rest };
      });
      if (fire) { cx.current.emit('timer.done', { exercise: s.rest.exerciseId }); cx.current.toast('Pause vorbei – nächster Satz'); }
    }, 1000);
    return () => { clearInterval(t); if (tickOwner === me) tickOwner = null; };
  }, []);
}

export const FIT_CSS = `
.tk-fit-step { display:inline-flex; align-items:center; border:1px solid var(--tk-c-border-strong); border-radius:var(--tk-radius-md); background:var(--tk-c-surface2); max-width:100%; }
.tk-fit-step button { border:0; background:transparent; color:var(--tk-c-text); width:36px; height:40px; cursor:pointer; display:grid; place-items:center; flex:none; }
.tk-fit-step button:first-child { border-radius:var(--tk-radius-md) 0 0 var(--tk-radius-md); } .tk-fit-step button:last-of-type { border-radius:0 var(--tk-radius-md) var(--tk-radius-md) 0; }
.tk-fit-step button:hover:not(:disabled) { background:var(--tk-c-surface3); } .tk-fit-step button:disabled { opacity:.35; cursor:default; }
.tk-fit-step input { width:52px; height:40px; border:0; background:transparent; text-align:center; font-weight:var(--tk-fw-semibold); font-variant-numeric:tabular-nums; font-size:var(--tk-fs-md); padding:0; min-width:0; flex:1 1 auto; color:var(--tk-c-text); }
.tk-fit-step input:focus { outline:2px solid var(--tk-c-accent); outline-offset:-2px; border-radius:var(--tk-radius-sm); }
.tk-fit-step__u { padding:0 10px 0 0; color:var(--tk-c-text-subtle); font-size:var(--tk-fs-sm); }
.tk-fit-step--lg button { width:60px; height:60px; } .tk-fit-step--lg input { width:110px; height:60px; font-size:var(--tk-fs-3xl); }
.bp-mobile .tk-fit-step input { font-size:16px; width:46px; height:44px; } .bp-mobile .tk-fit-step button { width:36px; height:44px; }
.bp-mobile .tk-fit-step--lg button { width:64px; height:64px; } .bp-mobile .tk-fit-step--lg input { width:100px; height:64px; font-size:var(--tk-fs-3xl); }
.tk-fit-ring { position:relative; flex:none; } .tk-fit-ring svg { display:block; } .tk-fit-ring__in { position:absolute; inset:0; display:grid; place-items:center; text-align:center; }
.tk-fit-mus { display:inline-flex; align-items:center; gap:6px; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); } .tk-fit-mus i { width:8px; height:8px; border-radius:50%; display:block; flex:none; }
.tk-fit-stat { display:flex; flex-direction:column; gap:2px; min-width:0; } .tk-fit-stat span { font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); text-transform:uppercase; letter-spacing:var(--tk-ls-wide); font-weight:var(--tk-fw-semibold); }
.tk-fit-stat strong { font-size:var(--tk-fs-xl); font-variant-numeric:tabular-nums; line-height:1.15; } .tk-fit-stat small { color:var(--tk-c-text-muted); font-size:var(--tk-fs-sm); font-weight:var(--tk-fw-regular); }
.tk-fit-chips { display:flex; flex-wrap:wrap; gap:var(--tk-space-2); } .tk-fit-big { font-size:var(--tk-fs-3xl); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); font-variant-numeric:tabular-nums; line-height:1.1; }
.tk-fit-cta { width:100%; min-height:48px; justify-content:center; }
.tk-fit-link { border:0; background:none; color:inherit; font:inherit; cursor:pointer; padding:0; text-align:left; min-width:0; display:inline-flex; align-items:center; min-height:32px; max-width:100%; }
.bp-mobile .tk-fit-link { min-height:40px; }
.tk-fit-link:hover { color:var(--tk-c-accent); }
.tk-fit-toggle { display:inline-flex; align-items:center; gap:10px; min-height:44px; background:none; border:0; color:var(--tk-c-text-muted); font-size:var(--tk-fs-sm); cursor:pointer; padding:0; text-align:left; }
.tk-fit-toggle__track { width:38px; height:22px; border-radius:11px; background:var(--tk-c-surface3); border:1px solid var(--tk-c-border-strong); position:relative; flex:none; } .tk-fit-toggle__track i { position:absolute; top:2px; left:2px; width:16px; height:16px; border-radius:50%; background:var(--tk-c-text-muted); transition:transform var(--tk-motion-fast); }
.tk-fit-toggle[aria-checked="true"] .tk-fit-toggle__track { background:var(--tk-c-accent); border-color:transparent; } .tk-fit-toggle[aria-checked="true"] .tk-fit-toggle__track i { transform:translateX(16px); background:var(--tk-c-text-on-accent); }
@media (prefers-reduced-motion: reduce) { .tk-fit-ring circle { transition:none !important; } }`;
export { MUSCLES };
