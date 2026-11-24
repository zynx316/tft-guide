// Feature-Workspace: Qualität – Prüfumfang, Ergebnis-Matrix, Details, Screenshots (CLI), Gerätetest.
import { html } from '../../lib/html.js';
import { useState } from 'preact/hooks';
import { Icon } from '../../lib/icons.js';
import { Card, Btn, Badge, Empty, Checkbox, QaCell } from '../ui/kit.js';
import { qaRunDialog, devicesLabel } from './common.js';
import { deviceCheckDialog } from './ws-tabs.js';
import { actions, releaseDrift } from '../store.js';
import { DEVICES, deviceById } from '../../core/devices.js';
import { THEME_IDS, themes } from '../../design-system/tokens.js';
import { UI_STATES } from '../../core/schema.js';
import { fmt } from '../../lib/util.js';

export function QaSettings({ settings }) {
  const toggle = (key, id) => { const cur = settings[key] || []; actions.setSetting(key, cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]); };
  return html`<div class="wb-grid wb-grid-3" style="gap:16px">
    <div class="wb-col"><div class="wb-label">Viewports</div>${DEVICES.map((d) => html`<${Checkbox} label=${`${d.label} (${d.width})${d.required ? '' : ' – optional'}`} checked=${settings.qaViewports.includes(d.id)} onChange=${() => toggle('qaViewports', d.id)} />`)}</div>
    <div class="wb-col"><div class="wb-label">Themes</div>${THEME_IDS.map((t) => html`<${Checkbox} label=${themes[t].label} checked=${settings.qaThemes.includes(t)} onChange=${() => toggle('qaThemes', t)} />`)}</div>
    <div class="wb-col"><div class="wb-label">Zustände</div>${UI_STATES.map((s) => html`<${Checkbox} label=${s.label} checked=${settings.qaStates.includes(s.id)} onChange=${() => toggle('qaStates', s.id)} />`)}</div>
  </div>`;
}

export function CheckList({ checks }) {
  return html`<div class="wb-col" style="gap:0">${checks.map((c) => html`<div class="wb-check-item"><${QaCell} status=${c.status} />
    <div class="wb-grow"><div style="font-weight:550">${c.name}</div><div class="wb-small wb-muted">${c.detail}</div>
      ${c.items?.length > 0 && html`<ul class="wb-small wb-mono" style="margin:6px 0 0;padding-left:18px;color:var(--wb-subtle)">${c.items.map((i) => html`<li>${i}</li>`)}</ul>`}</div></div>`)}</div>`;
}

export function QaTab({ state, feature: f }) {
  const qa = state.qa.latest[f.id];
  const [open, setOpen] = useState(null);
  const s = state.settings;
  const cli = state.qa.cli?.results?.filter((r) => r.featureId === f.id) || [];
  const combos = qa ? [...new Set(qa.results.map((r) => `${r.theme}|${r.state}`))] : [];
  const vps = qa ? [...new Set(qa.results.map((r) => r.viewport))] : [];
  const sel = open && qa?.results.find((r) => `${r.viewport}|${r.theme}|${r.state}` === open);
  const outdated = qa && f.variants.some((v) => v.id === qa.variantId && new Date(v.updatedAt) > new Date(qa.ts));
  const drift = f.locked ? releaseDrift(state, f) : [];
  return html`<div class="wb-col" style="gap:14px">
    ${drift.length > 0 && html`<div class="wb-banner wb-banner--warn"><${Icon} name="alert-triangle" size=${16} /><span class="wb-grow"><strong>Regression nötig:</strong> Seit der Freigabe geänderte Komponenten – ${drift.map((d) => `${d.id} (v${d.released} → v${d.current})`).join(', ')}. Darstellung kann vom freigegebenen Stand abweichen.</span>
      <${Btn} size="sm" icon="shield-check" onClick=${() => qaRunDialog({ jobs: [{ featureId: f.id, variantId: '*' }], title: `Regression – ${f.name}` })}>Jetzt prüfen<//></div>`}
    <${Card} title="Prüfumfang" icon="sliders-horizontal" sub=${`Ziel-Viewports des Features: ${f.viewports.join(', ')} · Einstellungen gelten für alle QA-Läufe`} actions=${html`<div class="wb-row">
        <${Btn} icon="shield-check" variant="primary" disabled=${!f.variants.length} onClick=${() => qaRunDialog({ jobs: [{ featureId: f.id }], title: `QA – ${f.name} (Variante ${f.selectedVariantId})` })}>Bevorzugte Variante prüfen<//>
        <${Btn} icon="layers" disabled=${f.variants.length < 2} onClick=${() => qaRunDialog({ jobs: [{ featureId: f.id, variantId: '*' }], title: `QA – ${f.name} (alle Varianten)` })}>Alle Varianten<//></div>`}>
      <${QaSettings} settings=${s} />
      <div class="wb-small wb-subtle" style="margin-top:10px">${s.qaViewports.length * s.qaThemes.length * s.qaStates.length} Prüfungen je Variante · Viewports: ${devicesLabel(s.qaViewports)}</div><//>

    ${!qa ? html`<${Card}><${Empty} icon="shield-check" title="Noch nicht geprüft" text="Der QA-Lauf rendert die Variante in allen gewählten Viewports/Themes/Zuständen und prüft automatisch: Render-Fehler, fehlende Blöcke, horizontalen Überlauf, abgeschnittene Inhalte, Touch-Ziele (Mobile), Kontrast und Bilder." /><//>`
    : html`<${Card} title=${html`Letzter Lauf <span class="wb-muted" style="font-weight:400">· Variante ${qa.variantId} · v${qa.version} · ${fmt.dateTime(qa.ts)}</span>`} actions=${html`<${QaCell} status=${qa.status} />`}>
      ${outdated && html`<div class="wb-banner wb-banner--warn" style="margin-bottom:12px"><${Icon} name="alert-triangle" size=${16} /><span>Die Variante wurde nach diesem Lauf geändert – Ergebnis ist veraltet.</span></div>`}
      <div style="overflow-x:auto"><table class="wb-table"><thead><tr><th>Viewport</th>${combos.map((c) => { const [t, st] = c.split('|'); return html`<th>${themes[t]?.label}${st !== 'default' ? ` · ${UI_STATES.find((x) => x.id === st)?.label}` : ''}</th>`; })}</tr></thead>
        <tbody>${vps.map((vp) => html`<tr><td><span class="wb-row" style="gap:6px"><${Icon} name=${deviceById(vp).icon} size=${14} />${deviceById(vp).label} <span class="wb-subtle wb-num">${deviceById(vp).width}</span></span></td>
          ${combos.map((c) => { const [t, st] = c.split('|'); const r = qa.results.find((x) => x.viewport === vp && x.theme === t && x.state === st); const key = `${vp}|${t}|${st}`;
            return html`<td><button type="button" class="wb-btn wb-btn--sm wb-btn--ghost" aria-pressed=${String(open === key)} onClick=${() => setOpen(open === key ? null : key)}><${QaCell} status=${r?.status} />${r && r.status !== 'pass' && html`<span class="wb-small">${r.checks.filter((x) => x.status !== 'pass').length}</span>`}</button></td>`; })}</tr>`)}</tbody></table></div>
      ${sel ? html`<div style="margin-top:14px"><div class="wb-label" style="margin-bottom:6px">${deviceById(sel.viewport).label} · ${themes[sel.theme]?.label} · ${sel.state}</div><${CheckList} checks=${sel.checks} /></div>`
        : html`<div class="wb-small wb-subtle" style="margin-top:10px">Zelle anklicken für Details.</div>`}<//>`}

    <div class="wb-grid wb-grid-2">
      <${Card} title="Screenshots & visuelle Regression (CLI)" icon="image">
        ${cli.length ? html`<div class="wb-grid wb-grid-2" style="gap:10px">${cli.slice(0, 6).map((r) => html`<a href=${r.screenshot} target="_blank" class="wb-col" style="gap:4px;color:inherit">
          <img class="wb-shot" src=${r.screenshot} alt=${`${r.viewport} ${r.theme}`} loading="lazy" style="max-height:180px;object-fit:cover;object-position:top" />
          <span class="wb-row wb-small"><${QaCell} status=${r.status} />${r.viewport} · ${r.theme}${r.visual ? ` · Δ ${(r.visual.ratio * 100).toFixed(2)} %` : ''}</span></a>`)}</div>`
        : html`<p class="wb-small wb-muted">Screenshots, Referenzbilder und Pixelvergleich erzeugt das CLI: <span class="wb-mono">npm run qa -- --feature ${f.id}</span>. Ergebnisse erscheinen nach „CLI-Ergebnis laden“ im Quality Center.</p>`}<//>
      <${Card} title="Gerätetest" icon="smartphone">
        ${f.realDevice ? html`<div class="wb-row"><${QaCell} status=${f.realDevice.ok ? 'pass' : 'fail'} /><strong>${f.realDevice.ok ? 'Bestanden' : 'Mängel'}</strong><span class="wb-muted wb-small">${fmt.dateTime(f.realDevice.at)}</span></div><p class="wb-small wb-muted" style="margin-top:6px">${f.realDevice.note}</p>`
          : html`<p class="wb-small wb-muted">Routineänderungen werden automatisiert geprüft. Echtes Smartphone nur an Meilensteinen (erste Modulfreigabe, große Responsive-Änderungen, Modulfreigabe, Gesamtcheck). Tipp: <span class="wb-mono">npm run lan</span> und auf dem Handy <span class="wb-mono">http://&lt;PC-IP&gt;:4317/preview.html?feature=${f.id}</span> öffnen.</p>`}
        <${Btn} size="sm" icon="clipboard-check" style="margin-top:10px" onClick=${() => deviceCheckDialog(f)}>Gerätetest dokumentieren<//><//>
    </div>
  </div>`;
}
