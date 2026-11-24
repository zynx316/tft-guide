// Picture to Text: Bild erfassen (Kamera/Datei/Zwischenablage – simuliert) mit Verarbeitungszuständen
import { html } from '../../../lib/html.js';
import { useState, useEffect, useRef } from 'preact/hooks';
import { Card, Button, Badge, Icon, Segmented, Progress, Select, Chip, Field } from '../../ui.js';
import { isoLocal } from './content-util.js';

const SOURCES = [
  { value: 'camera', label: 'Kamera', icon: 'camera', cta: 'Foto aufnehmen', hint: 'Halte das Dokument gerade und gut beleuchtet in den Rahmen.' },
  { value: 'file', label: 'Datei', icon: 'upload', cta: 'Bild auswählen', hint: 'JPG, PNG, HEIC oder PDF · bis 20 MB' },
  { value: 'clipboard', label: 'Zwischenablage', icon: 'clipboard', cta: 'Aus Zwischenablage einfügen', hint: 'Fügt den zuletzt kopierten Screenshot oder das Bild ein.' },
];
const STEPS = [{ label: 'Bild laden', icon: 'image' }, { label: 'Text erkennen', icon: 'scan-text' }, { label: 'Ergebnis aufbereiten', icon: 'sparkles' }];
const DURATION = 2400;

export const capturePanel = {
  id: 'capture-panel',
  name: 'Bild erfassen',
  category: 'Inhalte',
  description: 'Quelle wählen (Kamera, Datei, Zwischenablage – simuliert), Dropzone, Verarbeitungsfortschritt (laden → erkennen → fertig). Legt das Ergebnis im Slot „captures“ ab und wählt es aus (ctx.ui.selectedId).',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Bild erfassen' },
    { name: 'defaultSource', label: 'Standardquelle', type: 'select', options: ['camera', 'file', 'clipboard'], default: 'camera' },
    { name: 'showSourceTabs', label: 'Quellen-Umschalter', type: 'boolean', default: true },
    { name: 'showOptions', label: 'Optionen (Sprache, Layout)', type: 'boolean', default: true },
    { name: 'compact', label: 'Kompakt (kleine Dropzone)', type: 'boolean', default: false },
  ],
  data: [
    { slot: 'captures', label: 'Erfassungen (Verlauf)', default: 'captures', shape: '{id,title,subtitle,meta,text,lang,confidence,uncertain?,source,icon,badge,tone}[]', required: true },
    { slot: 'samples', label: 'Simulierte Erkennungsergebnisse', default: 'samples', shape: '{title,source?,text,lang,confidence,uncertain?}[]', required: true },
  ],
  events: ['capture.source', 'capture.start', 'capture.done', 'capture.cancel'],
  states: ['empty'],
  css: `
  .tk-capture { display:flex; flex-direction:column; gap:var(--tk-space-4); min-width:0; }
  .tk-capture__drop { display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; gap:8px; padding:var(--tk-space-8) var(--tk-space-4); min-height:220px; border:2px dashed var(--tk-c-border-strong); border-radius:var(--tk-radius-lg); background:var(--tk-c-surface2); color:var(--tk-c-text-muted); cursor:pointer; width:100%; font:inherit; transition:border-color var(--tk-motion-fast), background var(--tk-motion-fast); }
  .tk-capture__drop:hover, .tk-capture__drop[data-over="true"] { border-color:var(--tk-c-accent); background:var(--tk-c-accent-soft); }
  .tk-capture--compact .tk-capture__drop { min-height:130px; padding:var(--tk-space-5) var(--tk-space-4); }
  .tk-capture__drop-icon { width:56px; height:56px; border-radius:18px; display:grid; place-items:center; background:var(--tk-c-accent-soft); color:var(--tk-c-accent); margin-bottom:4px; }
  .tk-capture__drop-title { color:var(--tk-c-text); font-weight:var(--tk-fw-semibold); font-size:var(--tk-fs-lg); }
  .tk-capture__hint { font-size:var(--tk-fs-sm); max-width:360px; }
  .tk-capture__opts { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:var(--tk-space-3); align-items:end; }
  .bp-mobile .tk-capture__opts { grid-template-columns:minmax(0,1fr); }
  .tk-capture__switch .tk-chip[aria-pressed="true"] { color:var(--tk-c-text); }
  .tk-capture__switch { display:flex; align-items:center; gap:10px; min-height:var(--tk-size-control); font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); }
  .bp-mobile .tk-capture__switch { min-height:44px; }
  .tk-capture__run { display:flex; gap:var(--tk-space-4); align-items:center; padding:var(--tk-space-4); border:1px solid var(--tk-c-border); border-radius:var(--tk-radius-lg); background:var(--tk-c-surface2); }
  .tk-capture__thumb { width:84px; height:108px; flex:none; border-radius:var(--tk-radius-sm); border:1px solid var(--tk-c-border-strong); background:var(--tk-c-surface); padding:10px 8px; display:flex; flex-direction:column; gap:6px; position:relative; overflow:hidden; }
  .tk-capture__thumb i { display:block; height:5px; border-radius:3px; background:var(--tk-c-surface3); }
  .tk-capture__scan { position:absolute; left:0; right:0; height:3px; background:var(--tk-c-accent); box-shadow:0 0 12px var(--tk-c-accent); animation:tk-capture-scan 1.4s ease-in-out infinite alternate; }
  @keyframes tk-capture-scan { from { top:6px; } to { top:calc(100% - 9px); } }
  @media (prefers-reduced-motion: reduce) { .tk-capture__scan { animation:none; top:50%; } }
  .tk-capture__steps { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:8px; }
  .tk-capture__step { display:flex; align-items:center; gap:8px; font-size:var(--tk-fs-sm); color:var(--tk-c-text-subtle); }
  .tk-capture__step[data-state="active"] { color:var(--tk-c-text); font-weight:var(--tk-fw-semibold); }
  .tk-capture__step[data-state="done"] { color:var(--tk-c-text-muted); }
  .tk-capture__step[data-state="done"] .tk-capture__step-ic { color:var(--tk-c-success); }
  .tk-capture__step[data-state="active"] .tk-capture__step-ic { color:var(--tk-c-accent); }
  .tk-capture__done { display:flex; align-items:center; gap:var(--tk-space-3); padding:var(--tk-space-4); border-radius:var(--tk-radius-lg); background:var(--tk-c-success-soft); border:1px solid color-mix(in srgb, var(--tk-c-success) 30%, transparent); flex-wrap:wrap; }
  .bp-mobile .tk-capture__run { flex-direction:column; align-items:stretch; }
  .bp-mobile .tk-capture__thumb { width:100%; height:64px; flex-direction:row; flex-wrap:wrap; align-content:center; }`,
  example: { data: {
    captures: [],
    samples: [{ title: 'Quittung Buchhandlung', source: 'camera', lang: 'Deutsch', confidence: 0.96, text: 'Buchhandlung Neumann\nRechnung Nr. 20418\n2 × Fachbuch Typografie 49,80 €\nSumme 49,80 €', uncertain: [{ word: 'Typografle', alt: 'Typografie', conf: 0.61 }] }],
  } },
  render: ({ props, data, setData, ctx }) => {
    const [source, setSource] = useState(props.defaultSource);
    const [lang, setLang] = useState('Automatisch');
    const [layout, setLayout] = useState(true);
    const [over, setOver] = useState(false);
    const [run, setRun] = useState(null); // { source, p } | null
    const [done, setDone] = useState(null);
    const timer = useRef(null);
    const samples = data.samples || [];
    useEffect(() => () => clearInterval(timer.current), []);
    const src = SOURCES.find((s) => s.value === source) || SOURCES[0];

    const finish = (from) => {
      clearInterval(timer.current); setRun(null);
      const all = data.captures || [];
      const pool = samples.filter((s) => !s.source || s.source === from); const list = pool.length ? pool : samples;
      const s = list[all.length % Math.max(list.length, 1)];
      if (!s) { ctx.toast('Keine Testdaten für die Erkennung vorhanden'); return; }
      const lines = s.text.split('\n').length;
      const entry = { id: `c${Date.now().toString(36)}`, title: s.title, subtitle: s.text.split('\n').join(' · ').slice(0, 70), meta: 'Gerade eben', badge: `${Math.round(s.confidence * 100)} %`, tone: s.confidence > 0.9 ? 'success' : 'warning',
        icon: from === 'camera' ? 'camera' : from === 'clipboard' ? 'clipboard' : 'image', source: from, group: SOURCES.find((x) => x.value === from)?.label, text: s.text, lang: lang === 'Automatisch' ? s.lang : lang, confidence: s.confidence, uncertain: s.uncertain || [], created: isoLocal(ctx.today) };
      setData('captures', (a) => [entry, ...(Array.isArray(a) ? a : [])]); ctx.setUi('selectedId', entry.id);
      setDone({ lines, conf: s.confidence, unsure: (s.uncertain || []).length });
      ctx.emit('capture.done', { id: entry.id, source: from }); ctx.toast('Text erkannt');
    };
    const start = (from = source) => {
      if (run) return; setDone(null); setRun({ source: from, p: 0 });
      ctx.emit('capture.start', { source: from });
      const t0 = Date.now();
      timer.current = setInterval(() => {
        const p = Math.min(1, (Date.now() - t0) / DURATION);
        if (p >= 1) finish(from); else setRun({ source: from, p });
      }, 100);
    };
    const cancel = () => { clearInterval(timer.current); setRun(null); ctx.emit('capture.cancel'); ctx.toast('Erkennung abgebrochen'); };
    const stepIdx = run ? (run.p < 0.25 ? 0 : run.p < 0.8 ? 1 : 2) : -1;

    let body;
    if (run) {
      body = html`<div class="tk-capture__run" aria-live="polite">
        <div class="tk-capture__thumb" role="img" aria-label="Vorschau des erfassten Bildes">${[70, 90, 55, 80, 65, 85, 50, 75].map((w) => html`<i style=${`width:${w}%`}></i>`)}<span class="tk-capture__scan"></span></div>
        <div class="tk-grow tk-col" style="gap:12px">
          <ul class="tk-capture__steps">${STEPS.map((s, i) => html`<li class="tk-capture__step" data-state=${i < stepIdx ? 'done' : i === stepIdx ? 'active' : 'wait'}>
            <span class="tk-capture__step-ic"><${Icon} name=${i < stepIdx ? 'check-circle-2' : i === stepIdx ? 'loader-2' : 'circle'} size=${17} /></span>${s.label}${i === stepIdx && html`<span class="tk-subtle">…</span>`}</li>`)}</ul>
          <${Progress} value=${run.p} />
          <div class="tk-row" style="justify-content:space-between"><span class="tk-subtle tk-num" style="font-size:var(--tk-fs-sm)">${Math.round(run.p * 100)} %</span><${Button} size="sm" icon="x" onClick=${cancel}>Abbrechen<//></div>
        </div></div>`;
    } else if (done) {
      body = html`<div class="tk-capture__done"><span style="color:var(--tk-c-success)"><${Icon} name="check-circle-2" size=${24} /></span>
        <div class="tk-grow"><div style="font-weight:var(--tk-fw-semibold)">Fertig – ${done.lines} Zeilen erkannt</div>
          <div class="tk-muted" style="font-size:var(--tk-fs-sm)">Konfidenz ${Math.round(done.conf * 100)} %${done.unsure ? ` · ${done.unsure} unsichere${done.unsure === 1 ? 's Wort' : ' Wörter'} markiert` : ''}</div></div>
        <${Button} icon="plus" onClick=${() => setDone(null)}>Weiteres Bild<//></div>`;
    } else {
      body = html`<button type="button" class="tk-capture__drop" data-over=${over ? 'true' : 'false'} aria-label=${`${src.cta} oder Bild ablegen`}
        onClick=${() => start()} onDragOver=${(e) => { e.preventDefault(); setOver(true); }} onDragLeave=${() => setOver(false)} onDrop=${(e) => { e.preventDefault(); setOver(false); setSource('file'); start('file'); }}>
        <span class="tk-capture__drop-icon"><${Icon} name=${src.icon} size=${26} /></span>
        <span class="tk-capture__drop-title">${ctx.bp === 'mobile' ? src.cta : 'Bild hier ablegen oder auswählen'}</span>
        <span class="tk-capture__hint">${src.hint}</span>
        <span class="tk-btn tk-btn--primary" style="margin-top:8px"><${Icon} name=${src.icon} size=${17} />${src.cta}</span></button>`;
    }
    return html`<${Card} title=${props.title} icon="scan-text" actions=${html`<${Badge} icon="sparkles">Texterkennung<//>`}>
      <div class=${`tk-capture ${props.compact ? 'tk-capture--compact' : ''}`}>
        ${props.showSourceTabs && html`<${Segmented} label="Quelle" value=${source} options=${SOURCES.map(({ value, label, icon }) => ({ value, label, icon }))} onChange=${(v) => { if (run) return; setSource(v); setDone(null); ctx.emit('capture.source', { source: v }); }} />`}
        ${body}
        ${props.showOptions && !run && html`<div class="tk-capture__opts">
          <${Field} label="Sprache"><${Select} value=${lang} options=${['Automatisch', 'Deutsch', 'Englisch']} onChange=${setLang} /><//>
          <div class="tk-capture__switch"><${Chip} active=${layout} icon="layout-list" onClick=${() => setLayout(!layout)}>Layout beibehalten<//></div></div>`}
      </div><//>`;
  },
};
