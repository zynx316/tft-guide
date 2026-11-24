// Feature-Workspace: Design (Vorschau der Varianten) und Vergleich (nebeneinander, bedienbar).
import { html } from '../../lib/html.js';
import { useState, useMemo } from 'preact/hooks';
import { Icon } from '../../lib/icons.js';
import { Card, Btn, Badge, Empty, Select, Field, openDialog, toast, Seg } from '../ui/kit.js';
import { act } from './common.js';
import { actions } from '../store.js';
import { buildFeaturePayload } from '../../core/preview-payload.js';
import { DEVICES, deviceById } from '../../core/devices.js';
import { getComponent } from '../../library/registry.js';
import { layoutInfo, REGION_LABELS } from '../../preview/layouts.js';
import { PreviewFrame, PreviewToolbar } from '../ui/preview-frame.js';
import { navigate, studioHref } from '../router.js';
import { cx } from '../../lib/util.js';
import { Scorecard } from './ws-process.js';

export function VariantChips({ feature: f, value, onChange, multi }) {
  return html`<div class="wb-row wb-wrap" style="gap:6px">${f.variants.map((v) => { const on = multi ? value.includes(v.id) : value === v.id; return html`<button type="button" class=${cx('wb-var', on && 'is-active')} style="padding:5px 10px 5px 6px"
    onClick=${() => onChange(multi ? (on ? value.filter((x) => x !== v.id) : [...value, v.id].slice(-3)) : v.id)} aria-pressed=${String(on)} data-variant=${v.id}>
    <span class="wb-var__letter">${v.id}</span><span class="wb-trunc" style="max-width:160px;font-weight:550">${v.name}</span>${f.selectedVariantId === v.id && html`<span style="color:var(--wb-warning)" title="Bevorzugt"><${Icon} name="star" size=${13} /></span>`}</button>`; })}</div>`;
}

const variantStats = (v) => {
  const comps = v.blocks.map((b) => b.component);
  return { layout: layoutInfo(v.layout?.type).label, blocks: v.blocks.length, comps: [...new Set(comps)], regions: [...new Set(v.blocks.map((b) => b.region || 'main'))], hiddenMobile: v.blocks.filter((b) => (b.hideOn || []).includes('mobile')).length };
};

export function DesignTab({ state, feature: f }) {
  const [vid, setVid] = useState(f.selectedVariantId || f.variants[0]?.id);
  const [multi, setMulti] = useState(false);
  const s = state.settings;
  const v = f.variants.find((x) => x.id === vid) || f.variants[0];
  const payload = useMemo(() => (v ? buildFeaturePayload(state, f.id, v.id, { theme: s.previewTheme, state: s.previewState, chrome: s.chrome, scenario: s.previewScenario }) : null), [state, f.id, v?.id, s.previewTheme, s.previewState, s.chrome, s.previewScenario]);
  if (!v) return html`<${Card}><${Empty} icon="palette" title="Noch keine Designvariante" text="Lege im Design Studio eine erste Variante an – aus Bibliothekskomponenten, mit Layout und Demo-Daten." action=${html`<${Btn} variant="primary" icon="plus" disabled=${f.locked} onClick=${() => { const id = act(() => actions.addVariant(f.id, {})); if (id) navigate(studioHref(f.id, id)); }}>Erste Variante anlegen<//>`} /><//>`;
  const st = variantStats(v);
  const devs = multi ? (s.multiViewports || ['desktop', 'tablet', 'mobile']) : [s.viewport];
  return html`<div class="wb-col" style="gap:12px">
    <div class="wb-row wb-wrap" style="gap:10px"><${VariantChips} feature=${f} value=${v.id} onChange=${setVid} /><span class="wb-grow"></span>
      ${f.selectedVariantId !== v.id && html`<${Btn} size="sm" icon="star" disabled=${f.locked} onClick=${() => preferDialog(f, v)}>Als bevorzugt wählen<//>`}
      <${Btn} size="sm" icon="palette" onClick=${() => navigate(studioHref(f.id, v.id))}>Im Studio bearbeiten<//></div>
    <${PreviewToolbar} settings=${s} onChange=${(p) => actions.setSettings(p)} multi=${multi} onMulti=${setMulti} />
    <div class="wb-grid" style="grid-template-columns:minmax(0,1fr) 280px;align-items:start">
      <div class="wb-canvas" style="border-radius:12px;border:1px solid var(--wb-border);padding:18px;display:flex;gap:22px;justify-content:center;align-items:flex-start;min-height:400px">
        ${devs.map((d) => html`<div style=${`flex:${deviceById(d).width};min-width:0;max-width:${deviceById(d).width}px`}><${PreviewFrame} payload=${payload} device=${d} maxHeight=${multi ? 560 : 680} /></div>`)}</div>
      <div class="wb-col" style="gap:12px">
        <${Card} title=${`${v.id} – ${v.name}`}><p style="white-space:pre-wrap">${v.concept || html`<span class="wb-subtle">Kein Konzepttext.</span>`}</p>${v.description && html`<p class="wb-small wb-muted" style="margin-top:8px;white-space:pre-wrap">${v.description}</p>`}<//>
        <${Card} title="Struktur"><div class="wb-col wb-small" style="gap:6px">
          <div class="wb-row wb-between"><span class="wb-muted">Layout</span><strong>${st.layout}</strong></div>
          <div class="wb-row wb-between"><span class="wb-muted">Blöcke</span><strong>${st.blocks}</strong></div>
          <div class="wb-row wb-between"><span class="wb-muted">Regionen</span><span>${st.regions.map((r) => REGION_LABELS[r] || r).join(', ')}</span></div>
          <div class="wb-row wb-between"><span class="wb-muted">Mobil ausgeblendet</span><span>${st.hiddenMobile}</span></div>
          <hr class="wb-sep" /><div class="wb-row wb-wrap" style="gap:4px">${st.comps.map((c) => html`<a href=${`#/library/${c}`}><${Badge} sq>${getComponent(c)?.name || c}<//></a>`)}</div></div><//>
      </div>
    </div>
  </div>`;
}

export function preferDialog(f, v) {
  openDialog({ title: `Variante ${v.id} „${v.name}“ bevorzugen`, size: 'wide', body: ({ close }) => {
    const [rationale, setR] = useState(''); const [tradeoffs, setT] = useState('');
    return html`<p class="wb-muted">Die bevorzugte Variante ist der Arbeitsstand des Features (Basis für QA und Freigabe). Die Begründung wird als Entscheidung dokumentiert.</p>
      <${Field} label="Warum diese Variante?"><textarea class="wb-textarea" rows="3" autofocus value=${rationale} placeholder="z. B. Beste Lesbarkeit auf Mobile, kombiniert Termine und Aufgaben, wenigste Klicks" onInput=${(e) => setR(e.currentTarget.value)}></textarea><//>
      <${Field} label="Bewusst akzeptierte Nachteile"><textarea class="wb-textarea" rows="2" value=${tradeoffs} placeholder="z. B. Geringere Informationsdichte auf Desktop" onInput=${(e) => setT(e.currentTarget.value)}></textarea><//>
      <div class="wb-row" style="justify-content:flex-end"><${Btn} onClick=${close}>Abbrechen<//>
        <${Btn} variant="primary" icon="star" data-confirm onClick=${() => { act(() => actions.selectVariant(f.id, v.id, { rationale, tradeoffs })); toast(`Variante ${v.id} ist jetzt bevorzugt`); close(); }}>Bevorzugen${rationale ? ' & dokumentieren' : ''}<//></div>`;
  } });
}

export function CompareTab({ state, feature: f }) {
  const [ids, setIds] = useState(f.variants.slice(0, 3).map((v) => v.id));
  const [device, setDevice] = useState(state.settings.viewport === 'desktop' || state.settings.viewport === 'notebook' ? 'notebook' : 'mobile');
  const s = state.settings;
  const sel = ids.map((id) => f.variants.find((v) => v.id === id)).filter(Boolean);
  const payloads = useMemo(() => Object.fromEntries(sel.map((v) => [v.id, buildFeaturePayload(state, f.id, v.id, { theme: s.previewTheme, state: s.previewState, chrome: s.chrome, scenario: s.previewScenario })])), [state, ids.join(), s.previewTheme, s.previewState, s.chrome, s.previewScenario]);
  if (f.variants.length < 2) return html`<${Card}><${Empty} icon="git-compare" title="Mindestens zwei Varianten nötig" text="Nicht jedes Feature braucht mehrere Entwürfe. Bei komplexen Features lohnt der Vergleich grundlegend unterschiedlicher Ansätze (Hierarchie, Layout, Bedienkonzept)." action=${html`<${Btn} icon="copy" disabled=${f.locked || !f.variants.length} onClick=${() => { const id = act(() => actions.addVariant(f.id, { from: f.variants[0].id })); if (id) navigate(studioHref(f.id, id)); }}>Variante ableiten<//>`} /><//>`;
  const stats = Object.fromEntries(sel.map((v) => [v.id, variantStats(v)]));
  const uniqueComps = (v) => stats[v.id].comps.filter((c) => sel.filter((o) => o.id !== v.id).every((o) => !stats[o.id].comps.includes(c)));
  const d = deviceById(device);
  return html`<div class="wb-col" style="gap:12px">
    <div class="wb-row wb-wrap" style="gap:10px"><span class="wb-small wb-muted">Vergleichen (max. 3):</span><${VariantChips} feature=${f} value=${ids} onChange=${setIds} multi /></div>
    <div class="wb-row wb-wrap" style="gap:8px"><span class="wb-small wb-muted">Gemeinsamer Viewport:</span>
      <${Seg} value=${device} onChange=${setDevice} options=${DEVICES.map((x) => ({ value: x.id, label: x.label, icon: x.icon }))} />
      <${PreviewToolbar} settings=${{ ...s, viewport: device }} onChange=${(p) => { if (p.viewport) setDevice(p.viewport); else actions.setSettings(p); }} multi=${true} compact /></div>
    <div class="wb-compare" style=${`grid-template-columns:repeat(${sel.length}, minmax(0,1fr))`}>
      ${sel.map((v) => { const st = stats[v.id]; const uniq = uniqueComps(v); return html`<div class="wb-compare__col" data-compare=${v.id}>
        <div class="wb-row" style="gap:8px"><span class="wb-var__letter" style="background:var(--wb-accent);color:var(--wb-on-accent)">${v.id}</span><strong class="wb-grow wb-trunc">${v.name}</strong>
          ${f.selectedVariantId === v.id ? html`<${Badge} tone="warning" icon="star">Bevorzugt<//>` : html`<${Btn} size="sm" icon="star" disabled=${f.locked} onClick=${() => preferDialog(f, v)}>Bevorzugen<//>`}</div>
        <div class="wb-canvas wb-compare__stage"><${PreviewFrame} payload=${payloads[v.id]} device=${d} maxHeight=${d.group === 'mobile' ? 620 : 520} showMeta=${false} /></div>
        <p class="wb-small" style="white-space:pre-wrap;min-height:54px">${v.concept}</p>
        <div class="wb-card" style="padding:10px 12px"><div class="wb-col wb-small" style="gap:5px">
          <div class="wb-row wb-between"><span class="wb-muted">Layout</span><strong>${st.layout}</strong></div>
          <div class="wb-row wb-between"><span class="wb-muted">Blöcke / Komponenten</span><span>${st.blocks} / ${st.comps.length}</span></div>
          <div class="wb-row wb-between"><span class="wb-muted">Mobil ausgeblendet</span><span>${st.hiddenMobile}</span></div>
          <div><span class="wb-muted">Nur in dieser Variante:</span> ${uniq.length ? uniq.map((c) => html`<${Badge} tone="accent" sq>${getComponent(c)?.name || c}<//> `) : html`<span class="wb-subtle">–</span>`}</div>
          ${v.description && html`<div class="wb-muted" style="white-space:pre-wrap;margin-top:4px">${v.description}</div>`}</div></div>
        <${Btn} size="sm" variant="ghost" icon="palette" onClick=${() => navigate(studioHref(f.id, v.id))}>Im Studio öffnen<//>
      </div>`; })}
    </div>
    <div class="wb-small wb-subtle">Alle Vorschauen sind voll bedienbar (Filter, Dialoge, Eingaben). Jede Spalte hat einen eigenen Vorschau-Zustand.</div>
    <${Scorecard} state=${state} feature=${f} variants=${sel} stats=${stats} />
  </div>`;
}
