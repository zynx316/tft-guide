// ============================================================================
// PREVIEW-FRAME – echtes Iframe in exakter Gerätebreite (Media-Queries & Breakpoints
// greifen real), skaliert auf den verfügbaren Platz. Payload-Updates werden live
// übertragen (keine Neuladung), Interaktionen kommen per postMessage zurück.
// ============================================================================
import { html } from '../../lib/html.js';
import { useEffect, useRef, useState, useLayoutEffect } from 'preact/hooks';
import { Icon } from '../../lib/icons.js';
import { DEVICES, deviceById } from '../../core/devices.js';
import { THEME_IDS, themes } from '../../design-system/tokens.js';
import { UI_STATES } from '../../core/schema.js';
import { Seg, Select, Btn, IconBtn } from './kit.js';
import { cx } from '../../lib/util.js';

/**
 * <PreviewFrame payload device="mobile" fit maxHeight=… onInteraction=fn onFrame=fn label />
 * fit: auf Containerbreite (und maxHeight) skalieren; zoom=1 => Originalgröße.
 */
export function PreviewFrame({ payload, device = 'mobile', fit = true, maxHeight, maxWidth, onInteraction, onFrame, label, showMeta = true, height }) {
  const d = typeof device === 'string' ? deviceById(device) : device;
  const H = height || d.height;
  const wrap = useRef(); const frame = useRef();
  const [box, setBox] = useState({ w: 0 });
  const [ready, setReady] = useState(false);
  const last = useRef(null);

  useLayoutEffect(() => {
    if (!wrap.current) return;
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width }));
    ro.observe(wrap.current); return () => ro.disconnect();
  }, []);
  const avail = Math.min(box.w || d.width, maxWidth || Infinity);
  const scale = fit ? Math.min(1, avail / d.width, maxHeight ? maxHeight / H : 1) : 1;

  const push = () => {
    const w = frame.current?.contentWindow;
    if (!w || !w.__taktPreview || !payload) return false;
    const sig = JSON.stringify(payload);
    if (sig === last.current) return true;
    last.current = sig; w.__taktPreview.render(payload); return true;
  };
  useEffect(() => { if (ready) push(); }, [payload, ready]);
  useEffect(() => {
    const on = (e) => {
      if (e.source !== frame.current?.contentWindow || e.data?.source !== 'takt-preview') return;
      if (e.data.type === 'ready') { setReady(true); last.current = null; push(); }
      else onInteraction && onInteraction(e.data);
    };
    window.addEventListener('message', on); return () => window.removeEventListener('message', on);
  }, [onInteraction, payload]);
  useEffect(() => { onFrame && onFrame(frame.current); }, [frame.current]);

  return html`<div class="wb-frame" style="width:100%">
    ${showMeta && html`<div class="wb-frame__meta"><${Icon} name=${d.icon} size=${13} /><span>${label || d.label}</span><span class="wb-num">${d.width} × ${H}</span>${scale < 0.999 && html`<span class="wb-num">· ${Math.round(scale * 100)} %</span>`}</div>`}
    <div ref=${wrap} style="width:100%;display:flex;justify-content:center">
      <div class=${cx('wb-frame__box', d.group === 'mobile' && 'wb-frame__box--mobile')} style=${`width:${d.width * scale}px;height:${H * scale}px`}>
        <iframe ref=${frame} src="./preview.html" title=${`Vorschau ${d.label}`} data-device=${d.id}
          style=${`width:${d.width}px;height:${H}px;transform:scale(${scale})`}
          onLoad=${() => { setReady(true); last.current = null; setTimeout(push, 0); }}></iframe>
        ${!ready && html`<div class="wb-frame__loading">Vorschau lädt …</div>`}
      </div>
    </div>
  </div>`;
}

/** Werkzeugleiste: Gerät, Theme, Zustand, App-Rahmen, Mehrfachansicht */
export function PreviewToolbar({ settings, onChange, multi, onMulti, extra, compact }) {
  return html`<div class="wb-row wb-wrap" style="gap:8px">
    ${!multi && html`<div class="wb-btngroup" role="group" aria-label="Gerät">${DEVICES.map((d) => html`<${Btn} size="sm" icon=${d.icon} pressed=${settings.viewport === d.id} onClick=${() => onChange({ viewport: d.id })} title=${`${d.label} ${d.width}×${d.height}`} aria-label=${d.label}>${compact ? null : html`<span class="wb-hide-sm">${d.width}</span>`}<//>`)}</div>`}
    ${onMulti && html`<${Btn} size="sm" icon="columns-3" pressed=${multi} onClick=${() => onMulti(!multi)} title="Mehrere Viewports gleichzeitig">Multi<//>`}
    <${Select} size="sm" value=${settings.previewTheme} onChange=${(v) => onChange({ previewTheme: v })} options=${THEME_IDS.map((t) => ({ value: t, label: `Theme: ${themes[t].label}` }))} style="width:auto" aria-label="Theme" />
    <${Select} size="sm" value=${settings.previewState} onChange=${(v) => onChange({ previewState: v })} options=${UI_STATES.map((s) => ({ value: s.id, label: `Zustand: ${s.label}` }))} style="width:auto" aria-label="Zustand" />
    <${Btn} size="sm" icon="smartphone" pressed=${settings.chrome} onClick=${() => onChange({ chrome: !settings.chrome })} title="TAKT-App-Rahmen (Navigation) anzeigen">Rahmen<//>
    ${extra}
  </div>`;
}
