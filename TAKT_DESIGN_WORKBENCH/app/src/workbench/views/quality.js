// Quality Center – Gesamtstatus, selektive Tests über Abhängigkeitsanalyse, Läufe, CLI-Screenshots, Gerätetests.
import { html } from '../../lib/html.js';
import { useState, useMemo } from 'preact/hooks';
import { Icon } from '../../lib/icons.js';
import { Card, Btn, Badge, Empty, Select, Tabs, QaCell, Checkbox, toast } from '../ui/kit.js';
import { qaRunDialog } from './common.js';
import { QaSettings, CheckList } from './ws-qa.js';
import { actions, releaseDrift } from '../store.js';
import { DEVICES, deviceById } from '../../core/devices.js';
import { COMPONENTS, getComponent } from '../../library/registry.js';
import { affectedFeatures, componentUsage } from '../../core/impact.js';
import { auditTheme, THEME_IDS, themes } from '../../design-system/tokens.js';
import { navigate, featureHref } from '../router.js';
import { fmt } from '../../lib/util.js';

const worst = (list) => (list.some((r) => r.status === 'fail') ? 'fail' : list.some((r) => r.status === 'warn') ? 'warn' : list.length ? 'pass' : null);

export function QualityView({ state, tab }) {
  const [mod, setMod] = useState('');
  const [onlyIssues, setOnlyIssues] = useState(false);
  const [selComps, setSelComps] = useState([]);
  const [cliErr, setCliErr] = useState('');
  const fs = state.features.filter((f) => !f.archived && f.variants.length && (!mod || f.moduleId === mod));
  const rows = fs.filter((f) => !onlyIssues || ['fail', 'warn'].includes(state.qa.latest[f.id]?.status) || !state.qa.latest[f.id]);
  const usage = useMemo(() => componentUsage(state), [state]);
  const affected = affectedFeatures(state, selComps);
  const tested = fs.filter((f) => state.qa.latest[f.id]);
  const outdated = tested.filter((f) => { const q = state.qa.latest[f.id]; const v = f.variants.find((x) => x.id === q.variantId); return v && new Date(v.updatedAt) > new Date(q.ts); });
  const cli = state.qa.cli;
  const loadCli = async () => {
    try { const r = await fetch('/api/qa/latest', { cache: 'no-store' }); if (!r.ok) throw new Error(r.status === 404 ? 'Noch kein CLI-Lauf vorhanden (npm run qa).' : `HTTP ${r.status}`); actions.setCliQa(await r.json()); setCliErr(''); toast('CLI-Ergebnis geladen'); }
    catch (e) { setCliErr(e.message); }
  };
  const themeAudit = THEME_IDS.map((id) => ({ id, checks: auditTheme(id) }));
  const drifted = state.features.filter((f) => f.locked && !f.archived).map((f) => ({ f, drift: releaseDrift(state, f) })).filter((x) => x.drift.length);

  return html`<div class="wb-page">
    <div class="wb-row wb-wrap" style="align-items:flex-end;gap:12px"><div class="wb-grow"><h1 class="wb-h1">Quality Center</h1><p class="wb-muted" style="margin-top:4px">Automatisierte Prüfungen statt Routine-Tests auf dem Smartphone. Gezielt: nur Betroffenes prüfen.</p></div>
      <${Btn} icon="shield-check" variant="primary" disabled=${!fs.length} onClick=${() => qaRunDialog({ jobs: fs.map((f) => ({ featureId: f.id })), title: `QA – ${mod ? state.modules.find((m) => m.id === mod)?.name : 'alle Features'} (${fs.length})`, scope: mod ? `Modul ${mod}` : 'alle' })}>${mod ? 'Modul' : 'Alle'} prüfen (${fs.length})<//>
      ${outdated.length > 0 && html`<${Btn} icon="refresh-cw" onClick=${() => qaRunDialog({ jobs: outdated.map((f) => ({ featureId: f.id })), title: `Veraltete Prüfungen erneuern (${outdated.length})`, scope: 'veraltet' })}>Veraltete erneuern (${outdated.length})<//>`}</div>

    <div class="wb-grid wb-grid-4">
      ${['pass', 'warn', 'fail'].map((s) => html`<${Card} pad><div class="wb-row"><${QaCell} status=${s} /><span class="wb-muted">${{ pass: 'Bestanden', warn: 'Warnungen', fail: 'Fehler' }[s]}</span></div><div class="wb-kpi__value" style="margin-top:6px">${tested.filter((f) => state.qa.latest[f.id].status === s).length}</div><//>`)}
      <${Card} pad><div class="wb-row"><${QaCell} /><span class="wb-muted">Ungeprüft / veraltet</span></div><div class="wb-kpi__value" style="margin-top:6px">${fs.length - tested.length} / ${outdated.length}</div><//>
    </div>

    <${Tabs} value=${tab} onChange=${(t) => navigate(`#/quality/${t}`)} options=${[{ value: 'overview', label: 'Matrix', icon: 'grid-2x2' }, { value: 'impact', label: 'Selektive Tests', icon: 'target' }, { value: 'runs', label: 'Läufe', icon: 'history', count: state.qa.runs.length }, { value: 'cli', label: 'Screenshots & Regression', icon: 'image' }, { value: 'devices', label: 'Gerätetests', icon: 'smartphone' }, { value: 'settings', label: 'Prüfumfang', icon: 'sliders-horizontal' }]} />

    ${tab === 'overview' && html`<div class="wb-col" style="gap:10px"><div class="wb-row" style="gap:10px"><${Select} size="sm" style="width:auto" value=${mod} onChange=${setMod} options=${[{ value: '', label: 'Alle Module' }, ...state.modules.filter((m) => !m.archived).map((m) => ({ value: m.id, label: m.name }))]} />
      <${Checkbox} checked=${onlyIssues} onChange=${setOnlyIssues} label="Nur Auffällige/Ungeprüfte" /></div>
      <${Card}>${!rows.length ? html`<${Empty} icon="shield-check" title="Nichts anzuzeigen" />` : html`<div style="overflow-x:auto"><table class="wb-table"><thead><tr><th>Feature</th><th>Var.</th>${DEVICES.map((d) => html`<th title=${`${d.label} ${d.width}px`}><${Icon} name=${d.icon} size=${13} /> ${d.width}</th>`)}<th>Stand</th><th></th></tr></thead><tbody>
        ${rows.map((f) => { const q = state.qa.latest[f.id]; const v = q && f.variants.find((x) => x.id === q.variantId); const old = q && v && new Date(v.updatedAt) > new Date(q.ts);
          return html`<tr class="is-click" onClick=${() => navigate(featureHref(f.id, 'qa'))}><td><strong class="wb-trunc">${f.name}</strong><div class="wb-xs wb-subtle">${state.modules.find((m) => m.id === f.moduleId)?.name}</div></td><td>${q?.variantId || f.selectedVariantId}</td>
            ${DEVICES.map((d) => html`<td><${QaCell} status=${q ? worst(q.results.filter((r) => r.viewport === d.id)) : null} /></td>`)}
            <td class="wb-small ${old ? '' : 'wb-muted'}" style=${old ? 'color:var(--wb-warning)' : ''}>${q ? (old ? 'veraltet' : fmt.relative(q.ts)) : 'ungeprüft'}</td>
            <td onClick=${(e) => e.stopPropagation()}><${Btn} size="sm" variant="ghost" icon="play" onClick=${() => qaRunDialog({ jobs: [{ featureId: f.id }], title: `QA – ${f.name}` })}>Prüfen<//></td></tr>`; })}</tbody></table></div>`}<//></div>`}

    ${tab === 'impact' && drifted.length > 0 && html`<div class="wb-banner wb-banner--warn" style="margin-bottom:12px"><${Icon} name="alert-triangle" size=${16} /><span class="wb-grow"><strong>${drifted.length} freigegebene Features</strong> nutzen Komponenten, die seit der Freigabe eine neue Version haben: ${drifted.map((x) => x.f.name).join(', ')}</span>
      <${Btn} size="sm" icon="shield-check" onClick=${() => qaRunDialog({ jobs: drifted.map((x) => ({ featureId: x.f.id, variantId: '*' })), title: 'Regression freigegebener Features' })}>Regression prüfen<//></div>`}
    ${tab === 'impact' && html`<div class="wb-grid" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:start">
      <${Card} title="Geänderte Komponenten wählen" sub="Wird eine gemeinsame Komponente verbessert, werden nur die Features geprüft, die sie verwenden – nicht die ganze App.">
        <div style="max-height:460px;overflow:auto" class="wb-col">${COMPONENTS.map((c) => html`<${Checkbox} checked=${selComps.includes(c.id)} onChange=${(on) => setSelComps(on ? [...selComps, c.id] : selComps.filter((x) => x !== c.id))}
          label=${html`<span>${c.name} <span class="wb-xs wb-subtle">${c.category} · ${(usage.get(c.id) || []).length} Verwendungen</span></span>`} />`)}</div><//>
      <${Card} title=${`Betroffene Features (${affected.length})`} actions=${html`<${Btn} size="sm" variant="primary" icon="shield-check" disabled=${!affected.length} onClick=${() => qaRunDialog({ jobs: affected.map((a) => ({ featureId: a.featureId, variantId: '*' })), title: `Regression – ${selComps.length} Komponenten`, scope: `Komponenten ${selComps.join(',')}` })}>Gezielt prüfen<//>`}>
        ${!affected.length ? html`<div class="wb-small wb-subtle">Komponenten links auswählen. Für Token-/Theme-Änderungen alle Features prüfen. Im CLI: <span class="wb-mono">npm run qa:changed</span> erkennt geänderte Komponenten automatisch (Datei-Hash).</div>`
        : html`<div class="wb-col" style="gap:0;margin:-8px -16px -16px">${affected.map((a) => html`<a class="wb-listrow is-click" style="color:inherit;text-decoration:none" href=${featureHref(a.featureId, 'qa')}><div class="wb-grow"><div style="font-weight:550" class="wb-trunc">${a.featureName}</div>
          <div class="wb-xs wb-subtle">Varianten ${a.variants.join(', ')} · über ${a.via.map((v) => getComponent(v)?.name || v).join(', ')}</div></div>${a.released && html`<${Badge} tone="success" icon="lock" sq>freigegeben – Regression!<//>`}<${QaCell} status=${state.qa.latest[a.featureId]?.status} /></a>`)}</div>`}<//></div>`}

    ${tab === 'runs' && html`<${Card}>${!state.qa.runs.length ? html`<${Empty} icon="history" title="Noch keine QA-Läufe" />` : html`<table class="wb-table"><thead><tr><th>Zeit</th><th>Umfang</th><th>Features</th><th>Ergebnis</th><th>Bestanden / Warn. / Fehler</th></tr></thead><tbody>
      ${state.qa.runs.map((r) => html`<tr><td class="wb-small wb-num">${fmt.dateTime(r.ts)}</td><td class="wb-small">${r.scope}</td><td class="wb-small wb-trunc" style="max-width:360px">${r.features.map((id) => state.features.find((f) => f.id === id)?.name || id).join(', ')}</td><td><${QaCell} status=${r.status} /></td><td class="wb-num wb-small">${r.counts.pass} / ${r.counts.warn} / ${r.counts.fail}</td></tr>`)}</tbody></table>`}<//>`}

    ${tab === 'cli' && html`<div class="wb-col" style="gap:12px">
      <${Card} title="CLI-QA (Playwright)" icon="clipboard-check" actions=${html`<${Btn} size="sm" icon="refresh-cw" onClick=${loadCli}>CLI-Ergebnis laden<//>`}>
        <div class="wb-small wb-muted">Das CLI erzeugt Screenshots je Feature × Viewport × Theme, vergleicht sie pixelgenau mit Referenzbildern (Baselines) und testet die Workbench-Bedienung end-to-end. <span class="wb-mono">npm run qa</span> · <span class="wb-mono">npm run qa:changed</span> · <span class="wb-mono">npm run qa:baseline</span> – Details in QA_REPORT.md.</div>
        ${cliErr && html`<div class="wb-field__error" style="margin-top:8px">${cliErr}</div>`}
        ${cli && html`<div class="wb-row wb-wrap" style="gap:10px;margin-top:10px"><${QaCell} status=${cli.status} /><strong>${fmt.dateTime(cli.ts)}</strong><span class="wb-small wb-muted">${cli.summary}</span></div>
          ${cli.e2e && html`<div class="wb-small" style="margin-top:8px"><strong>E2E Workbench:</strong> ${cli.e2e.passed}/${cli.e2e.total} bestanden${cli.e2e.failed?.length ? html` · <span style="color:var(--wb-danger)">${cli.e2e.failed.join(', ')}</span>` : ''}</div>`}`}<//>
      ${cli?.results?.length > 0 && html`<div class="wb-grid" style="grid-template-columns:repeat(auto-fill,minmax(230px,1fr))">${cli.results.map((r) => html`<${Card} pad>
        <a href=${r.screenshot} target="_blank"><img class="wb-shot" src=${r.screenshot} alt=${`${r.featureId} ${r.viewport}`} loading="lazy" style="height:200px;width:100%;object-fit:cover;object-position:top" /></a>
        <div class="wb-row" style="margin-top:8px"><${QaCell} status=${r.status} /><span class="wb-small wb-trunc wb-grow" style="font-weight:550">${state.features.find((f) => f.id === r.featureId)?.name || r.featureId}</span></div>
        <div class="wb-xs wb-subtle">${r.variantId} · ${r.viewport} · ${r.theme}${r.visual ? ` · Δ ${(r.visual.ratio * 100).toFixed(2)} % ${r.visual.status === 'new' ? '(neue Baseline)' : ''}` : ''}</div>
        ${r.visual?.diff && html`<a class="wb-xs" href=${r.visual.diff} target="_blank">Differenzbild ansehen</a>`}<//>`)}</div>`}
    </div>`}

    ${tab === 'devices' && html`<div class="wb-col" style="gap:12px">
      <div class="wb-banner wb-banner--info"><${Icon} name="smartphone" size=${16} /><span>Echtes Smartphone nur an Meilensteinen: erste Freigabe eines Moduls · große Änderungen am Responsive-System · Freigabe des Gesamtmoduls · finaler Gesamtcheck. Direktlink: <span class="wb-mono">npm run lan</span> → <span class="wb-mono">http://&lt;PC-IP&gt;:4317/preview.html?feature=&lt;id&gt;</span></span></div>
      <${Card}><table class="wb-table"><thead><tr><th>Modul</th><th>Meilenstein</th><th>Gerätetests</th></tr></thead><tbody>${state.modules.filter((m) => !m.archived).map((m) => { const mf = state.features.filter((f) => f.moduleId === m.id && !f.archived); const rel = mf.filter((f) => f.locked); const dev = mf.filter((f) => f.realDevice);
        return html`<tr><td><strong>${m.name}</strong></td><td class="wb-small">${rel.length ? (rel.length === mf.length ? 'Modul vollständig freigegeben → Gesamtcheck fällig' : `${rel.length} Freigaben → Gerätetest der ersten Freigabe`) : html`<span class="wb-subtle">noch keine Freigabe</span>`}</td>
          <td>${dev.length ? dev.map((f) => html`<a href=${featureHref(f.id, 'qa')} style="margin-right:8px"><${QaCell} status=${f.realDevice.ok ? 'pass' : 'fail'} /> ${f.name}</a>`) : rel.length ? html`<${Badge} tone="warning" sq>ausstehend<//>` : html`<span class="wb-subtle">–</span>`}</td></tr>`; })}</tbody></table><//></div>`}

    ${tab === 'settings' && html`<div class="wb-col" style="gap:12px"><${Card} title="Prüfumfang (global)"><${QaSettings} settings=${state.settings} /><//>
      <${Card} title="Theme-/Token-Audit"><div class="wb-grid wb-grid-3">${themeAudit.map((t) => html`<div><div class="wb-row" style="margin-bottom:6px"><strong class="wb-grow">${themes[t.id].label}</strong><${QaCell} status=${worst(t.checks)} /></div><${CheckList} checks=${t.checks.filter((c) => c.status !== 'pass')} />${t.checks.every((c) => c.status === 'pass') && html`<div class="wb-small wb-subtle">Alle ${t.checks.length} Prüfungen bestanden.</div>`}</div>`)}</div><//></div>`}
  </div>`;
}
