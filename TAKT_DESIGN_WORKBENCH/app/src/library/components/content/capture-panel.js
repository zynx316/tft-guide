// Picture to Text: Bild erfassen (Kamera/Datei/Zwischenablage – simuliert) mit Verarbeitungszuständen
import { html } from '../../../lib/html.js';
import { useState, useEffect, useRef } from 'preact/hooks';
import { Card, Button, Badge, Icon, Segmented, Progress, Select, Chip, Field, Input, Switch, EmptyState } from '../../ui.js';
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
      const entry = { id: ctx.newId('c'), title: s.title, subtitle: s.text.split('\n').join(' · ').slice(0, 70), meta: 'Gerade eben', badge: `${Math.round(s.confidence * 100)} %`, tone: s.confidence > 0.9 ? 'success' : 'warning',
        icon: from === 'camera' ? 'camera' : from === 'clipboard' ? 'clipboard' : 'image', source: from, group: SOURCES.find((x) => x.value === from)?.label, text: s.text, lang: lang === 'Automatisch' ? s.lang : lang, confidence: s.confidence, uncertain: s.uncertain || [], created: isoLocal(ctx.today) };
      setData('captures', (a) => [entry, ...(Array.isArray(a) ? a : [])]); ctx.setUi('selectedId', entry.id);
      setDone({ lines, conf: s.confidence, unsure: (s.uncertain || []).length });
      ctx.emit('capture.done', { id: entry.id, source: from }); ctx.toast('Text erkannt');
    };
    const start = (from = source) => {
      if (run) return; setDone(null); setRun({ source: from, p: 0 });
      ctx.emit('capture.start', { source: from });
      const t0 = performance.now();
      timer.current = setInterval(() => {
        const p = Math.min(1, (performance.now() - t0) / DURATION);
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

// ------------------------------------------------------------------------------------------------ Einstieg ---
const WAYS = [
  { event: 'scan.document', icon: 'scan', label: 'Dokument scannen', sub: 'Mehrere Seiten, als PDF speichern' },
  { event: 'scan.receipt', icon: 'receipt', label: 'Beleg erkennen', sub: 'Betrag, Händler, Datum – als Ausgabe buchen' },
  { event: 'scan.card', icon: 'user', label: 'Visitenkarte', sub: 'Kontakt aus dem Foto übernehmen' },
  { event: 'scan.text', icon: 'scan-text', label: 'Text erkennen', sub: 'Foto, Screenshot oder Zwischenablage' },
];

export const captureLauncher = {
  id: 'capture-launcher',
  name: 'Erkennen starten',
  category: 'Inhalte',
  description: 'Die vier Wege der Texterkennung als Einstieg: Dokument scannen, Beleg erkennen, Visitenkarte, Text erkennen. Als große Kacheln, Zeilen oder als Hauptaktion mit zwei Alternativen. Jeder Weg meldet ein eigenes Ereignis.',
  version: '1.0',
  props: [
    { name: 'style', label: 'Darstellung', type: 'select', options: ['tiles', 'row', 'hero'], default: 'tiles' },
    { name: 'title', label: 'Titel', type: 'text', default: '' },
  ],
  data: [],
  events: ['scan.document', 'scan.receipt', 'scan.card', 'scan.text'],
  states: ['empty'],
  css: `
  .tk-launch { display:grid; gap:var(--tk-space-3); grid-template-columns:repeat(4, minmax(0,1fr)); }
  .bp-tablet .tk-launch { grid-template-columns:repeat(2, minmax(0,1fr)); }
  .bp-mobile .tk-launch { grid-template-columns:repeat(2, minmax(0,1fr)); gap:var(--tk-space-2); }
  .tk-launch__tile { display:flex; flex-direction:column; align-items:flex-start; gap:10px; padding:var(--tk-space-4); text-align:left; color:inherit; font:inherit; cursor:pointer; min-width:0; min-height:132px; }
  .tk-launch__ico { width:44px; height:44px; border-radius:14px; display:grid; place-items:center; background:var(--tk-c-accent-soft); color:var(--tk-c-accent); }
  .tk-launch__tile strong { font-weight:var(--tk-fw-semibold); font-size:var(--tk-fs-md); overflow-wrap:anywhere; }
  .tk-launch__tile span:last-child { overflow-wrap:anywhere; }
  .tk-launch--hero .tk-btn, .tk-launch__alt .tk-btn { min-width:0; height:auto; white-space:normal; overflow-wrap:anywhere; }
  .tk-launch__tile span:last-child { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); }
  .tk-launch--row { display:flex; flex-wrap:wrap; gap:8px; }
  .tk-launch--row .tk-btn { flex:1 1 auto; justify-content:center; min-width:0; height:auto; min-height:var(--tk-size-control); white-space:normal; text-align:center; overflow-wrap:anywhere; }
  .bp-mobile .tk-launch--row { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); }
  .tk-launch--hero { display:flex; flex-direction:column; gap:10px; }
  .tk-launch--hero .tk-btn--primary { min-height:64px; font-size:var(--tk-fs-lg); justify-content:center; gap:10px; }
  .tk-launch__alt { display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:8px; }
  .tk-launch__alt .tk-btn { min-height:48px; justify-content:center; }
  [data-tk-large-text] .tk-launch__alt { grid-template-columns:minmax(0,1fr); }
  [data-tk-large-text] .tk-launch--hero .tk-btn, [data-tk-large-text] .tk-launch__alt .tk-btn { overflow-wrap:break-word; }`,
  example: { props: { style: 'tiles' }, data: {} },
  render: ({ props, ctx }) => {
    const go = (w) => ctx.emit(w.event);
    const head = props.title && html`<div class="tk-h3">${props.title}</div>`;
    if (props.style === 'row') return html`<div class="tk-launch tk-launch--row" role="group" aria-label="Erkennen starten">${WAYS.map((w) => html`<${Button} icon=${w.icon} aria-label=${w.label} onClick=${() => go(w)}>${ctx.bp === 'mobile' && w.event === 'scan.document' ? 'Scannen' : w.label}<//>`)}</div>`;
    if (props.style === 'hero') return html`<div class="tk-launch--hero">${head}<${Button} variant="primary" icon="scan" onClick=${() => go(WAYS[0])}>Dokument scannen<//>
      <div class="tk-launch__alt">${WAYS.slice(1).map((w) => html`<${Button} icon=${w.icon} aria-label=${w.label} onClick=${() => go(w)}>${ctx.bp === 'mobile' ? (w.event === 'scan.card' ? 'Karte' : w.label.split(' ')[0]) : w.label}<//>`)}</div></div>`;
    return html`<div class="tk-col" style="gap:12px">${head}<div class="tk-launch">${WAYS.map((w) => html`<button type="button" class="tk-card tk-card--interactive tk-launch__tile" onClick=${() => go(w)}>
      <span class="tk-launch__ico"><${Icon} name=${w.icon} size=${22} /></span><strong>${w.label}</strong><span>${w.sub}</span></button>`)}</div></div>`;
  },
};

// ------------------------------------------------------------------------------------------------ Dokumenten-Scanner ---
const FILTERS = ['Dokument', 'Foto', 'S/W'];
const paperStyle = (pg) => `transform:rotate(${pg.rot}deg);${pg.filter === 'S/W' ? 'filter:grayscale(1) contrast(1.25);' : ''}${pg.filter === 'Foto' ? 'background:color-mix(in srgb, var(--tk-c-warning) 9%, var(--tk-c-surface));' : ''}`;
const Paper = ({ pg, mini }) => html`<div class=${`tk-scan__paper ${mini ? 'tk-scan__paper--mini' : ''}`} style=${paperStyle(pg)}>${[80, 94, 60, 88, 72, 92, 54, 84, 66, 90].slice(0, mini ? 6 : 10).map((w, i) => html`<i style=${`width:${w}%;${i === 0 ? 'height:9px;' : ''}`}></i>`)}</div>`;

function ExportForm({ pages, defaultName, onSave, close }) {
  const [name, setName] = useState(defaultName); const [ocr, setOcr] = useState(true);
  return html`<div class="tk-col" style="gap:14px"><${Field} label="Dateiname"><${Input} value=${name} onInput=${setName} aria-label="Dateiname" /><//>
    <div class="tk-row" style="gap:12px"><${Switch} checked=${ocr} onChange=${setOcr} label="Text durchsuchbar machen" /><span>Text durchsuchbar machen</span></div>
    <div class="tk-muted" style="font-size:var(--tk-fs-sm)">${pages} ${pages === 1 ? 'Seite' : 'Seiten'} · ca. ${pages * 72 + (ocr ? 12 : 0)} KB · PDF</div>
    <div class="tk-row" style="justify-content:flex-end"><${Button} onClick=${close}>Abbrechen<//><${Button} variant="primary" icon="download" onClick=${() => { onSave(name.trim() || defaultName, ocr); close(); }}>PDF speichern<//></div></div>`;
}

export const docScanner = {
  id: 'doc-scanner',
  name: 'Dokumenten-Scanner',
  category: 'Inhalte',
  description: 'Mehrseitiger Scanner (simuliert): Kamera mit Kantenerkennung, Auslöser, Seitenstapel, pro Seite drehen, zuschneiden und Filter (Dokument, Foto, S/W), Seiten umordnen und als PDF speichern oder Text erkennen. Mit Kamera-Berechtigung (fragen/erteilt/verweigert).',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Dokument scannen' },
    { name: 'layout', label: 'Aufbau', type: 'select', options: ['smartphone', 'bench'], default: 'smartphone' },
    { name: 'permission', label: 'Kamera-Berechtigung', type: 'select', options: ['erteilt', 'fragen', 'verweigert'], default: 'erteilt' },
    { name: 'startPhase', label: 'Start', type: 'select', options: ['camera', 'edit'], default: 'camera' },
    { name: 'startPages', label: 'Seiten zu Beginn (Demo)', type: 'number', default: 0 },
  ],
  data: [
    { slot: 'captures', label: 'Erfassungen', default: 'captures', shape: 'wie capture-panel', required: false },
    { slot: 'samples', label: 'Texte für die simulierte Erkennung', default: 'samples', shape: '{title,text,lang,confidence}[]', required: false },
  ],
  events: ['scan.capture', 'scan.edit', 'scan.export', 'scan.ocr', 'permission.grant', 'permission.alternative'],
  states: ['empty'],
  css: `
  .tk-scan { display:flex; flex-direction:column; gap:var(--tk-space-4); min-width:0; }
  .bp-desktop .tk-scan--bench { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); align-items:start; }
  .tk-scan__view { position:relative; border-radius:var(--tk-radius-lg); overflow:hidden; background:var(--tk-c-surface3); display:grid; place-items:center; min-height:300px; padding:18px; }
  .tk-scan__svg { width:100%; max-width:300px; height:auto; display:block; }
  .tk-scan__badge { position:absolute; left:50%; top:12px; transform:translateX(-50%); display:inline-flex; align-items:center; gap:6px; padding:5px 12px; border-radius:var(--tk-radius-pill); font-size:var(--tk-fs-sm); font-weight:var(--tk-fw-medium); background:var(--tk-c-surface); border:1px solid var(--tk-c-border-strong); white-space:nowrap; }
  .tk-scan__badge[data-found="true"] { color:var(--tk-c-success); border-color:var(--tk-c-success); }
  .tk-scan__flash { position:absolute; inset:0; background:var(--tk-c-surface); opacity:0; pointer-events:none; transition:opacity .15s; }
  .tk-scan__flash[data-on="true"] { opacity:.85; }
  .tk-scan__shutter { align-self:center; width:72px; height:72px; border-radius:50%; border:4px solid var(--tk-c-accent); background:var(--tk-c-surface); display:grid; place-items:center; cursor:pointer; padding:0; color:var(--tk-c-accent); }
  .tk-scan__shutter:hover { background:var(--tk-c-accent-soft); }
  .tk-scan__bar { display:grid; grid-template-columns:minmax(0,1fr) auto minmax(0,1fr); align-items:center; gap:var(--tk-space-4); }
  .tk-scan__bar > :first-child { justify-self:end; }
  .tk-scan__bar > :last-child { justify-self:start; }
  .tk-scan__strip { display:flex; gap:10px; overflow-x:auto; padding:2px 2px 6px; scrollbar-width:none; }
  .tk-scan__thumb { position:relative; flex:none; width:56px; height:76px; border-radius:var(--tk-radius-sm); border:2px solid var(--tk-c-border); background:var(--tk-c-surface3); padding:4px; cursor:pointer; display:grid; place-items:center; }
  .tk-scan__thumb[aria-current="true"] { border-color:var(--tk-c-accent); }
  .tk-scan__thumb small { position:absolute; right:-4px; bottom:-4px; min-width:18px; height:18px; border-radius:9px; background:var(--tk-c-accent); color:var(--tk-c-on-accent, var(--tk-c-bg)); font-size:11px; display:grid; place-items:center; font-weight:var(--tk-fw-semibold); }
  .tk-scan__paper { width:100%; max-width:210px; min-height:150px; padding:16px 14px; border-radius:var(--tk-radius-sm); background:var(--tk-c-surface); box-shadow:var(--tk-shadow-md); display:flex; flex-direction:column; gap:9px; transition:transform .25s; }
  .tk-scan__paper i { display:block; height:6px; border-radius:3px; background:var(--tk-c-border-strong); }
  .tk-scan__paper--mini { min-height:0; padding:6px 5px; gap:4px; box-shadow:none; max-width:none; } .tk-scan__paper--mini i { height:3px; }
  .tk-scan__crop { position:relative; display:grid; place-items:center; padding:14px; width:min(100%, 260px); box-sizing:border-box; }
  .tk-scan__crop[data-on="true"] { outline:2px dashed var(--tk-c-accent); outline-offset:-2px; }
  .tk-scan__tools { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
  .bp-mobile .tk-scan__tools .tk-btn { min-height:44px; }
  .tk-scan__perm { display:flex; flex-direction:column; align-items:center; text-align:center; gap:12px; padding:var(--tk-space-8) var(--tk-space-4); border-radius:var(--tk-radius-lg); background:var(--tk-c-surface2); }`,
  example: { props: { startPages: 2 }, data: { captures: [], samples: [{ title: 'Stromliefervertrag', text: 'Stromliefervertrag\nVertragsnummer 7741-2209\nLaufzeit 12 Monate', lang: 'Deutsch', confidence: 0.93 }] } },
  render: ({ props, data, setData, ctx }) => {
    const mk = (i) => ({ id: `p${i}`, filter: 'Dokument', rot: 0, crop: true });
    const [pages, setPages] = useState(() => Array.from({ length: props.startPages || 0 }, (_, i) => mk(i + 1)));
    const [sel, setSel] = useState(0); const [phase, setPhase] = useState(props.startPhase);
    const [found, setFound] = useState(false); const [flash, setFlash] = useState(false); const [perm, setPerm] = useState(props.permission);
    const [saved, setSaved] = useState(null); const [prog, setProg] = useState(null);
    const bench = props.layout === 'bench' && ctx.bp === 'desktop';
    const camera = (bench || phase === 'camera') && !saved; const edit = (bench || phase === 'edit') && !saved;
    useEffect(() => { if (!camera || perm !== 'erteilt') return undefined; setFound(false); const t = setTimeout(() => setFound(true), 900); return () => clearTimeout(t); }, [camera, perm, pages.length]);
    const samples = data.samples || [];
    const cur = pages[Math.min(sel, pages.length - 1)];
    const patch = (p) => setPages((a) => a.map((x, i) => (i === sel ? { ...x, ...p } : x)));
    const snap = () => { if (!found) { ctx.toast('Noch keine Kanten erkannt'); return; } setFlash(true); setTimeout(() => setFlash(false), 160); const n = pages.length + 1; setPages((a) => [...a, mk(ctx.newId('p'))]); setSel(pages.length); ctx.emit('scan.capture', { pages: n }); ctx.toast(`Seite ${n} erfasst`); };
    const fromFile = () => { const n = pages.length + 1; setPages((a) => [...a, mk(ctx.newId('p'))]); setSel(pages.length); setPerm('erteilt'); ctx.emit('permission.alternative'); ctx.toast(`Seite ${n} aus Datei hinzugefügt`); };
    const move = (d) => { const j = sel + d; if (j < 0 || j >= pages.length) return; setPages((a) => { const b = a.slice(); [b[sel], b[j]] = [b[j], b[sel]]; return b; }); setSel(j); ctx.emit('scan.edit', { action: 'move' }); };
    const del = () => { setPages((a) => a.filter((_, i) => i !== sel)); setSel(Math.max(0, sel - 1)); ctx.emit('scan.edit', { action: 'delete' }); ctx.toast('Seite entfernt'); };
    const entry = (title, kind, ocr) => { const text = pages.map((_, i) => (samples[i % Math.max(samples.length, 1)]?.text || 'Text der Seite')).join('\n'); return { id: ctx.newId('c'), title, kind, pages: pages.length, subtitle: `${pages.length} ${pages.length === 1 ? 'Seite' : 'Seiten'} · ${kind === 'document' ? 'PDF' : 'Text'}`, meta: 'Gerade eben', badge: '94 %', tone: 'success', icon: 'file-text', source: 'camera', group: 'Kamera', text, lang: 'Deutsch', confidence: 0.94, uncertain: [], created: isoLocal(ctx.today), searchable: ocr }; };
    const save = (name, ocr) => { setProg(0); const t0 = performance.now(); const iv = setInterval(() => { const p = Math.min(1, (performance.now() - t0) / 1400); if (p >= 1) { clearInterval(iv); setProg(null); const e = entry(name, 'document', ocr); setData('captures', (a) => [e, ...(Array.isArray(a) ? a : [])]); ctx.setUi('selectedId', e.id); setSaved({ name, n: pages.length }); ctx.emit('scan.export', { id: e.id }); ctx.toast(`PDF gespeichert · ${pages.length} ${pages.length === 1 ? 'Seite' : 'Seiten'}`); } else setProg(p); }, 100); };
    const ocr = () => { const e = entry(`Scan ${pages.length} ${pages.length === 1 ? 'Seite' : 'Seiten'}`, 'text', true); setData('captures', (a) => [e, ...(Array.isArray(a) ? a : [])]); ctx.setUi('selectedId', e.id); ctx.emit('scan.ocr', { id: e.id }); ctx.toast('Text erkannt'); };
    const reset = () => { setPages([]); setSel(0); setSaved(null); setPhase('camera'); };

    if (saved) return html`<${Card} title=${props.title} icon="scan"><div class="tk-col" style="align-items:center;text-align:center;gap:12px;padding:var(--tk-space-6) 0"><span style="color:var(--tk-c-success)"><${Icon} name="check-circle-2" size=${40} /></span>
      <div style="font-weight:var(--tk-fw-semibold);font-size:var(--tk-fs-lg)">PDF gespeichert</div><div class="tk-muted">${saved.name} · ${saved.n} ${saved.n === 1 ? 'Seite' : 'Seiten'}</div><${Button} variant="primary" icon="plus" onClick=${reset}>Neuer Scan<//></div><//>`;

    const view = perm !== 'erteilt'
      ? html`<div class="tk-scan__perm"><span class="tk-subtle"><${Icon} name="camera" size=${32} /></span><div style="font-weight:var(--tk-fw-semibold)">Zugriff auf die Kamera nötig</div>
          <div class="tk-muted" style="max-width:340px;font-size:var(--tk-fs-sm)">${perm === 'verweigert' ? 'Ohne Kamera kannst du keine Dokumente scannen. Wähle eine Datei oder erlaube die Kamera in den Einstellungen.' : 'TAKT nutzt die Kamera, um Seiten aufzunehmen. Bilder bleiben auf deinem Gerät.'}</div>
          <div class="tk-row" style="flex-wrap:wrap;justify-content:center;gap:8px">${perm === 'fragen' && html`<${Button} variant="primary" icon="camera" onClick=${() => { setPerm('erteilt'); ctx.emit('permission.grant'); }}>Kamera erlauben<//>`}<${Button} icon="upload" onClick=${fromFile}>Aus Datei wählen<//></div></div>`
      : html`<div class="tk-col" style="gap:var(--tk-space-4)"><div class="tk-scan__view"><span class="tk-scan__badge" data-found=${found ? 'true' : 'false'} aria-live="polite"><${Icon} name=${found ? 'check-circle-2' : 'loader-2'} size=${14} />${found ? 'Kanten erkannt' : 'Suche Dokument …'}</span>
          <svg class="tk-scan__svg" viewBox="0 0 300 400" role="img" aria-label="Kamerabild mit erkanntem Dokument"><polygon points="52,66 248,52 258,350 42,342" fill="var(--tk-c-surface)" stroke=${found ? 'var(--tk-c-success)' : 'var(--tk-c-border-strong)'} stroke-width="3" stroke-linejoin="round" />
            ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => html`<line x1="72" x2=${72 + [150, 160, 100, 150, 130, 156, 90, 146, 110][i]} y1=${96 + i * 28 - i * 0.6} y2=${96 + i * 28 - i * 0.6} stroke="var(--tk-c-border-strong)" stroke-width=${i === 0 ? 8 : 5} stroke-linecap="round" />`)}
            ${[[52, 66], [248, 52], [258, 350], [42, 342]].map(([x, y]) => html`<circle cx=${x} cy=${y} r="7" fill="var(--tk-c-surface)" stroke=${found ? 'var(--tk-c-success)' : 'var(--tk-c-accent)'} stroke-width="3" />`)}</svg>
          <span class="tk-scan__flash" data-on=${flash ? 'true' : 'false'}></span></div>
          <div class="tk-scan__bar"><${Button} icon="upload" aria-label="Aus Datei hinzufügen" onClick=${fromFile}>${ctx.bp === 'mobile' ? null : 'Datei'}<//><button type="button" class="tk-scan__shutter" aria-label="Seite aufnehmen" onClick=${snap}><${Icon} name="camera" size=${28} /></button>
            ${!bench && pages.length > 0 ? html`<${Button} variant="primary" onClick=${() => { setPhase('edit'); ctx.emit('scan.edit', { action: 'open' }); }}>Fertig (${pages.length})<//>` : html`<span></span>`}</div></div>`;

    const strip = pages.length > 0 && html`<div class="tk-scan__strip" role="group" aria-label="Seiten">${pages.map((pg, i) => html`<button type="button" class="tk-scan__thumb" aria-current=${i === sel ? 'true' : 'false'} aria-label=${`Seite ${i + 1}`} onClick=${() => setSel(i)}><${Paper} pg=${pg} mini=${true} /><small>${i + 1}</small></button>`)}
      ${!bench && html`<button type="button" class="tk-scan__thumb" aria-label="Weitere Seite aufnehmen" style="border-style:dashed" onClick=${() => setPhase('camera')}><${Icon} name="plus" size=${20} /></button>`}</div>`;
    const editor = !cur ? html`<${EmptyState} icon="scan" title="Noch keine Seite" text="Nimm die erste Seite auf, sie erscheint hier zum Bearbeiten." />`
      : html`<div class="tk-col" style="gap:var(--tk-space-3)">${strip}
        <div class="tk-scan__view" style="min-height:280px"><div class="tk-scan__crop" data-on=${cur.crop ? 'true' : 'false'}><${Paper} pg=${cur} /></div></div>
        <${Segmented} label="Filter" value=${cur.filter} options=${FILTERS.map((f) => ({ value: f, label: f }))} onChange=${(f) => { patch({ filter: f }); ctx.emit('scan.edit', { action: 'filter', filter: f }); }} />
        <div class="tk-scan__tools"><${Button} size="sm" icon="rotate-ccw" onClick=${() => { patch({ rot: (cur.rot + 90) % 360 }); ctx.emit('scan.edit', { action: 'rotate' }); }}>Drehen<//><${Button} size="sm" icon="scan-line" aria-pressed=${cur.crop ? 'true' : 'false'} onClick=${() => { patch({ crop: !cur.crop }); ctx.emit('scan.edit', { action: 'scan-line' }); }}>Zuschneiden<//>
          <${Button} size="sm" variant="ghost" icon="arrow-left" aria-label="Seite nach vorn" disabled=${sel === 0} onClick=${() => move(-1)} /><${Button} size="sm" variant="ghost" icon="arrow-right" aria-label="Seite nach hinten" disabled=${sel >= pages.length - 1} onClick=${() => move(1)} /><${Button} size="sm" variant="ghost" icon="trash-2" aria-label="Seite entfernen" onClick=${del} /></div>
        ${prog != null ? html`<div class="tk-col" style="gap:6px" aria-live="polite"><${Progress} value=${prog} /><span class="tk-subtle" style="font-size:var(--tk-fs-sm)">PDF wird erstellt … ${Math.round(prog * 100)} %</span></div>`
          : html`<div class="tk-row" style="gap:8px;flex-wrap:wrap"><${Button} variant="primary" icon="download" onClick=${() => ctx.openDialog({ title: 'Als PDF speichern', body: (close) => html`<${ExportForm} pages=${pages.length} defaultName="Scan 24.11.2026" onSave=${save} close=${close} />` })}>Als PDF speichern<//><${Button} icon="scan-text" onClick=${ocr}>Text erkennen<//></div>`}</div>`;
    return html`<${Card} title=${props.title} icon="scan" actions=${pages.length > 0 && html`<${Badge}>${pages.length} ${pages.length === 1 ? 'Seite' : 'Seiten'}<//>`}><div class=${`tk-scan ${bench ? 'tk-scan--bench' : ''}`}>${camera && view}${edit && editor}</div><//>`;
  },
};
