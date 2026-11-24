// Übersicht – Gesamtstatus der Designarbeit auf einen Blick (bewusst nicht überladen).
import { html } from '../../lib/html.js';
import { Icon } from '../../lib/icons.js';
import { Card, Kpi, Btn, Badge, StatusBadge, QaCell, Empty } from '../ui/kit.js';
import { StatusPipeline, moduleProgress, newFeatureDialog, moduleDialog, decisionDialog } from './common.js';
import { featureHref, moduleHref, studioHref } from '../router.js';
import { fmt } from '../../lib/util.js';
import { statusIndex } from '../../core/schema.js';

/** Heuristik: Was ist als Nächstes sinnvoll? */
function nextSteps(state) {
  const out = [];
  const fs = state.features.filter((f) => !f.archived);
  const mod = (id) => state.modules.find((m) => m.id === id);
  for (const f of fs.filter((x) => x.status === 'review')) {
    const qa = state.qa.latest[f.id];
    if (!qa) out.push({ prio: 1, icon: 'shield-check', tone: 'warning', text: `QA für „${f.name}“ ausführen`, sub: `${mod(f.moduleId)?.name} · in Prüfung, noch kein QA-Lauf`, href: featureHref(f.id, 'qa') });
    else if (qa.status !== 'fail') out.push({ prio: 1, icon: 'badge-check', tone: 'success', text: `„${f.name}“ freigeben`, sub: `QA ${qa.status === 'pass' ? 'bestanden' : 'mit Warnungen'} · ${fmt.relative(qa.ts)}`, href: featureHref(f.id, 'overview') });
    else out.push({ prio: 1, icon: 'bug', tone: 'danger', text: `QA-Fehler in „${f.name}“ beheben`, sub: `${qa.results.filter((r) => r.status === 'fail').length} Viewports mit Fehlern`, href: featureHref(f.id, 'qa') });
  }
  for (const f of fs.filter((x) => x.status === 'design' && x.variants.length > 1 && !state.decisions.some((d) => d.featureId === x.id && d.status === 'decided'))) {
    out.push({ prio: 2, icon: 'git-compare', tone: 'accent', text: `Varianten von „${f.name}“ vergleichen & entscheiden`, sub: `${f.variants.length} Varianten · ${mod(f.moduleId)?.name}`, href: featureHref(f.id, 'compare') });
  }
  for (const d of state.decisions.filter((x) => x.status === 'open').slice(0, 3)) {
    out.push({ prio: 3, icon: 'gavel', tone: 'warning', text: d.title, sub: 'Offene Entscheidung', href: d.featureId ? featureHref(d.featureId, 'decisions') : '#/versions/decisions' });
  }
  for (const f of fs.filter((x) => x.status === 'analyzed' && !x.variants.length).slice(0, 3)) {
    out.push({ prio: 4, icon: 'palette', tone: 'info', text: `Erste Variante für „${f.name}“ entwerfen`, sub: `${mod(f.moduleId)?.name} · analysiert, noch kein Design`, href: studioHref(f.id) });
  }
  for (const f of fs.filter((x) => x.locked && !x.realDevice).slice(0, 2)) {
    out.push({ prio: 5, icon: 'smartphone', tone: null, text: `Gerätetest für „${f.name}“ dokumentieren`, sub: 'Meilenstein: erste Freigabe', href: featureHref(f.id, 'qa') });
  }
  return out.sort((a, b) => a.prio - b.prio).slice(0, 7);
}

export function Dashboard({ state }) {
  const fs = state.features.filter((f) => !f.archived);
  const mods = state.modules.filter((m) => !m.archived).sort((a, b) => a.order - b.order);
  const inWork = fs.filter((f) => ['design', 'review'].includes(f.status));
  const released = fs.filter((f) => statusIndex(f.status) >= statusIndex('released'));
  const openDec = state.decisions.filter((d) => d.status === 'open');
  const qaVals = Object.entries(state.qa.latest).filter(([id]) => fs.some((f) => f.id === id)).map(([, v]) => v);
  const qa = { pass: qaVals.filter((x) => x.status === 'pass').length, warn: qaVals.filter((x) => x.status === 'warn').length, fail: qaVals.filter((x) => x.status === 'fail').length };
  const steps = nextSteps(state);
  const recent = state.history.slice(0, 8);
  const variants = fs.reduce((n, f) => n + f.variants.length, 0);

  return html`<div class="wb-page">
    <div class="wb-row wb-wrap" style="align-items:flex-end;gap:14px">
      <div class="wb-grow"><div class="wb-label" style="margin-bottom:6px">${state.meta.project} · Designarbeit</div><h1 class="wb-h1">Übersicht</h1>
        <p class="wb-muted" style="margin-top:4px">${released.length} von ${fs.length} Features freigegeben · ${inWork.length} in Arbeit · Stand ${fmt.dateTime(state.meta.updatedAt)}</p></div>
      <${Btn} icon="plus" onClick=${() => moduleDialog()}>Modul<//><${Btn} variant="primary" icon="plus" onClick=${() => newFeatureDialog()}>Feature<//>
    </div>

    <div class="wb-grid wb-grid-4">
      <${Kpi} label="Module" icon="boxes" value=${mods.length} foot=${`${mods.filter((m) => m.isReference).length} Referenzmodule`} onClick=${() => (location.hash = '#/modules')} />
      <${Kpi} label="Features" icon="list-checks" value=${fs.length} foot=${`${variants} Designvarianten`} onClick=${() => (location.hash = '#/features')} />
      <${Kpi} label="In Arbeit" icon="pencil" tone="accent" value=${inWork.length} foot=${`${fs.filter((f) => f.status === 'review').length} davon in Prüfung`} onClick=${() => (location.hash = '#/features')} />
      <${Kpi} label="Freigegeben" icon="badge-check" tone="success" value=${released.length} foot=${`${openDec.length} offene Entscheidungen`} onClick=${() => (location.hash = '#/versions')} />
    </div>

    <${Card} title="Fortschritt nach Status" icon="activity" actions=${html`<span class="wb-small wb-subtle">${fs.length} Features</span>`}><${StatusPipeline} features=${fs} height=${12} legend /><//>

    <div class="wb-grid" style="grid-template-columns:minmax(0,1.35fr) minmax(0,1fr)">
      <${Card} title="Module" icon="boxes" actions=${html`<a class="wb-small" href="#/modules">Alle</a>`} bodyClass="wb-col">
        <div class="wb-col" style="gap:2px;margin:-6px -8px">${mods.map((m) => { const p = moduleProgress(state, m.id); return html`<a class="wb-listrow is-click" style="border:0;border-radius:8px;color:inherit;text-decoration:none" href=${moduleHref(m.id)}>
          <span class="wb-subtle"><${Icon} name=${m.icon} size=${17} /></span><span class="wb-trunc" style="width:140px;font-weight:550">${m.name}</span>
          <div class="wb-grow"><${StatusPipeline} features=${p.features} height=${7} /></div>
          <span class="wb-small wb-muted wb-num" style="width:64px;text-align:right">${p.done}/${p.total}</span>${m.isReference ? html`<${Badge} tone="info" sq>Referenz<//>` : html`<span style="width:66px"></span>`}</a>`; })}</div>
      <//>
      <div class="wb-col" style="gap:14px">
        <${Card} title="Nächste sinnvolle Schritte" icon="sparkles">
          ${steps.length ? html`<div class="wb-col" style="gap:2px;margin:-6px -8px">${steps.map((s) => html`<a class="wb-listrow is-click" style="border:0;border-radius:8px;color:inherit;text-decoration:none" href=${s.href}>
            <span style=${`color:${s.tone ? `var(--wb-${s.tone})` : 'var(--wb-subtle)'}`}><${Icon} name=${s.icon} size=${16} /></span>
            <div class="wb-grow"><div class="wb-trunc" style="font-weight:550">${s.text}</div><div class="wb-small wb-subtle wb-trunc">${s.sub}</div></div><span class="wb-subtle"><${Icon} name="chevron-right" size=${15} /></span></a>`)}</div>`
          : html`<${Empty} icon="check-check" title="Alles erledigt" text="Keine offenen Prüfungen, Entscheidungen oder Entwürfe." />`}
        <//>
        <${Card} title="Qualität" icon="shield-check" actions=${html`<a class="wb-small" href="#/quality">Quality Center</a>`}>
          <div class="wb-row wb-wrap" style="gap:10px">
            <div class="wb-row"><${QaCell} status="pass" /><span class="wb-num"><strong>${qa.pass}</strong> bestanden</span></div>
            <div class="wb-row"><${QaCell} status="warn" /><span class="wb-num"><strong>${qa.warn}</strong> Warnungen</span></div>
            <div class="wb-row"><${QaCell} status="fail" /><span class="wb-num"><strong>${qa.fail}</strong> Fehler</span></div>
            <div class="wb-row"><${QaCell} status="none" /><span class="wb-num"><strong>${fs.filter((f) => f.variants.length && !state.qa.latest[f.id]).length}</strong> ungeprüft</span></div>
          </div>
          ${state.qa.runs[0] && html`<div class="wb-small wb-subtle" style="margin-top:10px">Letzter Lauf ${fmt.relative(state.qa.runs[0].ts)} · ${state.qa.runs[0].counts.pass + state.qa.runs[0].counts.warn + state.qa.runs[0].counts.fail} Prüfungen</div>`}
        <//>
      </div>
    </div>

    <div class="wb-grid wb-grid-2">
      <${Card} title="Offene Entscheidungen" icon="gavel" actions=${html`<${Btn} size="sm" icon="plus" onClick=${() => decisionDialog({ preset: { status: 'open' } })}>Neu<//>`}>
        ${openDec.length ? html`<div class="wb-col" style="gap:2px;margin:-6px -8px">${openDec.slice(0, 6).map((d) => html`<a class="wb-listrow is-click" style="border:0;border-radius:8px;color:inherit;text-decoration:none" href=${d.featureId ? featureHref(d.featureId, 'decisions') : '#/versions/decisions'}>
          <span style="color:var(--wb-warning)"><${Icon} name="circle-help" size=${16} /></span><div class="wb-grow"><div class="wb-trunc" style="font-weight:550">${d.title}</div>
          <div class="wb-small wb-subtle wb-trunc">${d.featureId ? state.features.find((f) => f.id === d.featureId)?.name : state.modules.find((m) => m.id === d.moduleId)?.name || 'Allgemein'}</div></div></a>`)}</div>`
        : html`<${Empty} icon="gavel" title="Keine offenen Entscheidungen" />`}
      <//>
      <${Card} title="Letzte Änderungen" icon="history" actions=${html`<a class="wb-small" href="#/versions/log">Protokoll</a>`}>
        <div class="wb-col" style="gap:0;margin:-6px 0">${recent.map((h) => html`<div class="wb-row" style="padding:6px 0;border-bottom:1px solid var(--wb-border);gap:10px">
          <span class="wb-small wb-subtle wb-num" style="width:88px;flex:none">${fmt.relative(h.ts)}</span><span class="wb-trunc wb-grow">${h.summary}</span>
          ${h.featureId && html`<a class="wb-small wb-trunc" style="max-width:40%" href=${featureHref(h.featureId)}>${state.features.find((f) => f.id === h.featureId)?.name || ''}</a>`}</div>`)}</div>
      <//>
    </div>

    <${Card} title="In Arbeit" icon="pencil" actions=${html`<a class="wb-small" href="#/features">Alle Features</a>`}>
      ${inWork.length ? html`<div class="wb-grid wb-grid-3">${inWork.slice(0, 9).map((f) => html`<a class="wb-card wb-card--hover wb-card--pad" style="color:inherit;text-decoration:none;display:flex;flex-direction:column;gap:8px" href=${featureHref(f.id)}>
        <div class="wb-row"><span class="wb-subtle"><${Icon} name=${state.modules.find((m) => m.id === f.moduleId)?.icon} size=${15} /></span><span class="wb-small wb-subtle wb-trunc">${state.modules.find((m) => m.id === f.moduleId)?.name}</span><span class="wb-grow"></span><${StatusBadge} status=${f.status} short /></div>
        <div style="font-weight:650" class="wb-trunc">${f.name}</div>
        <div class="wb-row wb-small wb-muted"><span>v${f.version}</span>·<span>${f.variants.length} Varianten</span>·<span>${f.requirements.length} Anforderungen</span>${state.qa.latest[f.id] && html`<span class="wb-grow"></span><${QaCell} status=${state.qa.latest[f.id].status} />`}</div></a>`)}</div>`
      : html`<${Empty} title="Nichts in Arbeit" text="Wähle ein analysiertes Feature und lege im Design Studio eine erste Variante an." />`}
    <//>
  </div>`;
}
