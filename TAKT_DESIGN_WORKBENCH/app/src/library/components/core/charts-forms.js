// Diagramme & Formulare: chart, form-card, quick-add
import { html } from '../../../lib/html.js';
import { useState, useRef, useLayoutEffect } from 'preact/hooks';
import { Card, Button, Field, Input, Select, Textarea, EmptyState, Segmented, toneColor } from '../../ui.js';
import { toList, nextId, money, percent } from '../../helpers.js';
import { fmt } from '../../../lib/util.js';

// --------------------------------------------------------------------------
export const chart = {
  id: 'chart',
  name: 'Diagramm',
  category: 'Diagramme',
  description: 'SVG-Diagramm: Balken, Linie, Fläche oder Ring. Mehrere Serien, Tooltip per Hover/Tap, Zeitraum-Umschalter optional.',
  version: '1.3', // 1.3: quietEmpty; 1.1: Beträge/Prozente über money()/percent() (Privatsphäre, de-DE-Format); 1.2: Summe 0 ehrlich, Achsen bei Nullreihen, Achsenwerte im Privatsphäre-Modus maskiert
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Verlauf' },
    { name: 'type', label: 'Typ', type: 'select', options: ['bar', 'line', 'area', 'donut'], default: 'bar' },
    { name: 'height', label: 'Höhe (px)', type: 'number', default: 200 },
    { name: 'format', label: 'Werteformat', type: 'select', options: ['number', 'currency', 'percent'], default: 'number' },
    { name: 'quietEmpty', label: 'Ohne Daten ausblenden (Erststart)', type: 'boolean', default: false },
    { name: 'ranges', label: 'Zeiträume (optional)', type: 'list', default: [] },
    { name: 'showLegend', label: 'Legende', type: 'boolean', default: true },
  ],
  data: [{ slot: 'series', label: 'Datenreihen', default: 'chart', shape: '{labels:string[], series:[{name,values:number[]}]} | {segments:[{label,value}]} (Ring)', required: true }],
  events: ['chart.point', 'chart.range'],
  states: ['empty'],
  css: `
  .tk-chart svg { display:block; width:100%; overflow:visible; }
  .tk-chart__legend { display:flex; gap:14px; flex-wrap:wrap; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); margin-top:10px; }
  .tk-chart__legend span { display:inline-flex; align-items:center; gap:6px; }
  .tk-chart__tip { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); min-height:20px; margin-bottom:6px; font-variant-numeric:tabular-nums; }
  .tk-chart__tip strong { color:var(--tk-c-text); }
  .tk-chart__donut { display:flex; align-items:center; gap:24px; flex-wrap:wrap; }
  .tk-chart__donut .tk-chart__legend { flex-direction:column; margin:0; gap:8px; }`,
  example: { props: { title: 'Aktivität (Woche)', type: 'bar' }, data: { series: { labels: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'], series: [{ name: 'Erledigt', values: [5, 8, 6, 9, 4, 2, 3] }, { name: 'Neu', values: [3, 4, 7, 3, 5, 1, 2] }] } } },
  render: ({ props, data, ctx }) => {
    const d = data.series;
    const [tip, setTip] = useState(null);
    const ranges = toList(props.ranges);
    const [range, setRange] = useState(ranges[0]);
    // Echte Breite messen statt SVG zu verzerren (Achsenbeschriftung bleibt scharf/proportional)
    const box = useRef(); const [W, setW] = useState(600);
    useLayoutEffect(() => {
      if (!box.current) return undefined;
      const ro = new ResizeObserver(([e]) => setW(Math.max(200, Math.round(e.contentRect.width))));
      ro.observe(box.current); return () => ro.disconnect();
    }, [props.type]);
    const f = (v) => (props.format === 'currency' ? money(ctx, v) : props.format === 'percent' ? percent(ctx, v, { sign: false }) : fmt.number(v, v % 1 ? 1 : 0));
    const head = ranges.length ? html`<${Segmented} value=${range} options=${ranges.map((r) => ({ value: r, label: r }))} onChange=${(r) => { setRange(r); ctx.emit('chart.range', { range: r }); }} />` : null;
    const empty = !d || (d.segments ? !d.segments.length : !(d.series || []).some((s) => s.values?.length));
    if (empty && props.quietEmpty) return null;
    if (empty) return html`<${Card} title=${props.title}><${EmptyState} icon="bar-chart-3" title="Keine Daten" text="Für diesen Zeitraum liegen keine Werte vor." /><//>`;

    if (props.type === 'donut') {
      const segs = d.segments || d.series.map((s) => ({ label: s.name, value: s.values.reduce((a, b) => a + b, 0) }));
      const sum = segs.reduce((a, s) => a + s.value, 0); const total = sum || 1; // Summe 0: Mitte zeigt 0, Legende ohne Prozente
      let acc = 0; const R = 54, C = 2 * Math.PI * R;
      return html`<${Card} title=${props.title} actions=${head}><div class="tk-chart tk-chart__donut">
        <svg viewBox="0 0 140 140" style="width:140px;height:140px;flex:none">
          <circle cx="70" cy="70" r=${R} fill="none" stroke="var(--tk-c-surface3)" stroke-width="16" />
          ${sum > 0 && segs.map((s, i) => { const len = (s.value / total) * C; const el = html`<circle cx="70" cy="70" r=${R} fill="none" stroke=${`var(--tk-chart-${(i % 6) + 1})`} stroke-width="16"
            stroke-dasharray=${`${Math.max(len - 2, 0)} ${C}`} stroke-dashoffset=${-acc} transform="rotate(-90 70 70)" style="cursor:pointer"
            onClick=${() => { setTip(s); ctx.emit('chart.point', { label: s.label }); }} />`; acc += len; return el; })}
          <text x="70" y="66" text-anchor="middle" fill="var(--tk-c-text)" style=${`font-size:${Math.max(10, Math.min(17, 150 / Math.max(1, f(tip ? tip.value : sum).length)))}px;font-weight:700`}>${f(tip ? tip.value : sum)}</text>
          <text x="70" y="84" text-anchor="middle" fill="var(--tk-c-text-subtle)" style="font-size:10px">${tip ? tip.label : 'Gesamt'}</text>
        </svg>
        ${props.showLegend && html`<div class="tk-chart__legend">${segs.map((s, i) => html`<span><i class="tk-dot" style=${`background:var(--tk-chart-${(i % 6) + 1})`}></i>${s.label} <strong class="tk-num" style="color:var(--tk-c-text)">${sum > 0 ? fmt.percent(s.value / total, 0) : '–'}</strong></span>`)}</div>`}
      </div><//>`;
    }

    const labels = d.labels || [];
    const series = d.series || [];
    const H = props.height, P = { l: 40, r: 8, t: 8, b: 22 };
    const all = series.flatMap((s) => s.values); const max = Math.max(...all, 0) * 1.1 || 1; const min = Math.min(0, ...all);
    const x = (i) => P.l + (labels.length <= 1 ? 0 : (i / (labels.length - 1)) * (W - P.l - P.r));
    const y = (v) => P.t + (1 - (v - min) / (max - min)) * (H - P.t - P.b);
    const flat = !all.some((v) => v);  // nur Nullwerte: eine Nulllinie statt „0 · 1 · 1“
    const tickLabel = (t) => (props.format === 'currency' && ctx.privacy ? '••' : Math.abs(t) >= 10000 ? `${fmt.number(t / 1000, 0)}k` : fmt.number(t, Math.abs(max - min) < 3 && t % 1 ? 1 : 0));
    const ticks = flat ? [0] : [...new Map([0, 0.5, 1].map((t) => min + t * (max - min)).map((t) => [tickLabel(t), t])).values()];
    const slotW = (W - P.l - P.r) / labels.length;
    return html`<${Card} title=${props.title} actions=${head}><div class="tk-chart" ref=${box}>
      <div class="tk-chart__tip">${tip ? html`<strong>${tip.label}</strong> · ${tip.items.map((it) => `${it.name}: ${f(it.value)}`).join(' · ')}` : html`<span class="tk-subtle">Punkt antippen für Details</span>`}</div>
      <svg viewBox=${`0 0 ${W} ${H}`} width=${W} height=${H} style=${`height:${H}px`} role="img" aria-label=${props.title}>
        ${ticks.map((t) => html`<g><line x1=${P.l} x2=${W - P.r} y1=${y(t)} y2=${y(t)} stroke="var(--tk-c-border)" stroke-dasharray="3 4" />
          <text x=${P.l - 6} y=${y(t) + 4} text-anchor="end" fill="var(--tk-c-text-subtle)" style="font-size:11px">${tickLabel(t)}</text></g>`)}
        ${props.type === 'bar' ? series.map((s, si) => s.values.map((v, i) => { const bw = Math.min(28, (slotW * 0.7) / series.length); const bx = P.l + i * slotW + (slotW - bw * series.length) / 2 + si * bw;
            return html`<rect x=${bx} y=${y(Math.max(v, 0))} width=${bw - 2} height=${Math.abs(y(v) - y(0))} rx="3" fill=${`var(--tk-chart-${(si % 6) + 1})`} opacity=${tip && tip.i !== i ? 0.45 : 1} />`; }))
          : series.map((s, si) => { const pts = s.values.map((v, i) => `${x(i)},${y(v)}`); const col = `var(--tk-chart-${(si % 6) + 1})`;
            return html`<g>${props.type === 'area' && html`<path d=${`M${pts.join('L')}L${x(s.values.length - 1)},${y(min)}L${x(0)},${y(min)}Z`} fill=${col} opacity=".14" />`}
              <path d=${`M${pts.join('L')}`} fill="none" stroke=${col} stroke-width="2.25" stroke-linejoin="round" stroke-linecap="round" />
              ${tip && html`<circle cx=${x(tip.i)} cy=${y(s.values[tip.i])} r="4" fill=${col} />`}</g>`; })}
        ${labels.map((l, i) => html`<text x=${props.type === 'bar' ? P.l + i * slotW + slotW / 2 : x(i)} y=${H - 4} text-anchor="middle" fill="var(--tk-c-text-subtle)" style="font-size:11px">${slotW < 34 && i % Math.ceil(34 / slotW) ? '' : l}</text>`)}
        ${labels.map((l, i) => html`<rect x=${P.l + i * slotW - (props.type === 'bar' ? 0 : slotW / 2)} y="0" width=${slotW} height=${H} fill="transparent" style="cursor:pointer"
          onMouseEnter=${() => setTip({ i, label: l, items: series.map((s) => ({ name: s.name, value: s.values[i] })) })}
          onClick=${() => { setTip({ i, label: l, items: series.map((s) => ({ name: s.name, value: s.values[i] })) }); ctx.emit('chart.point', { label: l }); }} />`)}
      </svg>
      ${props.showLegend && series.length > 1 && html`<div class="tk-chart__legend">${series.map((s, i) => html`<span><i class="tk-dot" style=${`background:var(--tk-chart-${(i % 6) + 1})`}></i>${s.name}</span>`)}</div>`}
    </div><//>`;
  },
};

// --------------------------------------------------------------------------
const parseFields = (list) => toList(list).map((f) => { const [key, label, type = 'text', opts] = f.split(':'); return { key, label: label || key, type, options: opts ? opts.split('|') : [] }; });

function FormBody({ onDone, fields, props, setData, ctx }) {
  const [v, setV] = useState({}); const [err, setErr] = useState({});
  const submit = (e) => {
    e && e.preventDefault();
    const errors = {};
    for (const f of fields) if (f.key.endsWith('*') && !String(v[f.key.slice(0, -1)] || '').trim()) errors[f.key.slice(0, -1)] = 'Pflichtfeld';
    setErr(errors);
    if (Object.keys(errors).length) { ctx.emit('form.invalid', errors); return; }
    setData('target', (all) => [{ id: nextId(all, 'f'), title: v.title || 'Neuer Eintrag', ...v }, ...(Array.isArray(all) ? all : [])]);
    ctx.emit('form.submit', v); ctx.toast('Gespeichert'); setV({}); onDone && onDone();
  };
  return html`<form class="tk-form" style=${`--cols:${props.columns}`} onSubmit=${submit} novalidate>
    ${fields.map((f) => { const key = f.key.replace('*', ''); const req = f.key.endsWith('*'); const label = `${f.label}${req ? ' *' : ''}`;
      const set = (val) => setV({ ...v, [key]: val });
      return html`<div class=${f.type === 'textarea' ? 'tk-form__wide' : ''}><${Field} label=${label} error=${err[key]}>
        ${f.type === 'textarea' ? html`<${Textarea} value=${v[key]} onInput=${set} rows="3" />`
          : f.type === 'select' ? html`<${Select} value=${v[key] ?? ''} onChange=${set} options=${[{ value: '', label: 'Bitte wählen' }, ...f.options.map((o) => ({ value: o, label: o }))]} />`
          : html`<${Input} type=${f.type} value=${v[key]} onInput=${set} invalid=${!!err[key]} />`}
      <//></div>`; })}
    <div class="tk-form__actions">${onDone && html`<${Button} onClick=${onDone}>Abbrechen<//>`}<${Button} variant="primary" type="submit" icon="check">${props.submitLabel}<//></div>
  </form>`;
}

export const formCard = {
  id: 'form-card',
  name: 'Formular',
  category: 'Formulare',
  description: 'Konfigurierbares Formular ("key:Label:typ[:opt1|opt2]", Pflichtfelder mit *). Validiert, fügt Eintrag in einen Datenslot ein, zeigt Erfolg. Als Karte oder als Dialog-Auslöser.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Neuer Eintrag' },
    { name: 'fields', label: 'Felder', type: 'list', default: ['title*:Titel:text', 'date:Datum:date', 'category:Kategorie:select:Arbeit|Privat', 'text:Notiz:textarea'] },
    { name: 'submitLabel', label: 'Button', type: 'text', default: 'Speichern' },
    { name: 'mode', label: 'Darstellung', type: 'select', options: ['card', 'dialog'], default: 'card' },
    { name: 'columns', label: 'Spalten (Desktop)', type: 'number', default: 2 },
  ],
  data: [{ slot: 'target', label: 'Ziel-Datensatz', default: 'items', shape: 'Array, in das neue Einträge eingefügt werden', required: false }],
  events: ['form.submit', 'form.invalid', 'form.open'],
  states: ['empty', 'loading', 'error'],
  css: `.tk-form { display:grid; gap:var(--tk-space-4); grid-template-columns:repeat(var(--cols,2), minmax(0,1fr)); } .tk-form .tk-form__wide { grid-column:1 / -1; } .bp-mobile .tk-form, .bp-tablet .tk-form { grid-template-columns:minmax(0,1fr); } .tk-form__actions { display:flex; justify-content:flex-end; gap:8px; grid-column:1 / -1; } .bp-mobile .tk-form__actions .tk-btn { flex:1; }`,
  example: { props: { title: 'Termin anlegen', fields: ['title*:Titel:text', 'date*:Datum:date', 'time:Uhrzeit:time', 'category:Kategorie:select:Arbeit|Privat|Sport', 'text:Notiz:textarea'] } },
  render: ({ props, setData, ctx }) => {
    const fields = parseFields(props.fields);
    if (props.mode === 'dialog') return html`<${Button} variant="primary" icon="plus" onClick=${() => { ctx.emit('form.open'); ctx.openDialog({ title: props.title, body: (close) => html`<${FormBody} onDone=${close} fields=${fields} props=${props} setData=${setData} ctx=${ctx} />` }); }}>${props.title}<//>`;
    return html`<${Card} title=${props.title}><${FormBody} fields=${fields} props=${props} setData=${setData} ctx=${ctx} /><//>`;
  },
};

export const quickAdd = {
  id: 'quick-add',
  name: 'Schnelleingabe',
  category: 'Formulare',
  description: 'Einzeilige Eingabe zum schnellen Anlegen (Enter). Fügt in den gebundenen Datenslot ein – gebundene Listen aktualisieren sich sofort. Ideal als Sticky-Leiste unten (Region "bottom").',
  version: '1.0',
  props: [
    { name: 'placeholder', label: 'Platzhalter', type: 'text', default: 'Neue Aufgabe … (Enter)' },
    { name: 'buttonLabel', label: 'Button', type: 'text', default: 'Hinzufügen' },
    { name: 'defaults', label: 'Standardfelder (key=wert)', type: 'list', default: [] },
    { name: 'elevated', label: 'Schwebend (Schatten)', type: 'boolean', default: false },
  ],
  data: [{ slot: 'target', label: 'Ziel-Datensatz', default: 'items', shape: 'Array von Einträgen mit title', required: true }],
  events: ['quickadd.submit'],
  states: ['empty', 'loading', 'error'],
  css: `.tk-quick-add { display:flex; gap:8px; padding:8px; border-radius:var(--tk-radius-lg); background:var(--tk-c-surface); border:1px solid var(--tk-c-border); } .tk-quick-add--elevated { box-shadow:var(--tk-shadow-md); } .tk-quick-add .tk-input { border-color:transparent; background:transparent; } .tk-quick-add .tk-input:focus { box-shadow:none; }`,
  example: { props: { placeholder: 'Neue Aufgabe … (Enter)' }, data: { target: [] } },
  render: ({ props, setData, ctx }) => {
    const [v, setV] = useState('');
    const defaults = Object.fromEntries(toList(props.defaults).map((kv) => kv.split('=')));
    const add = () => { const t = v.trim(); if (!t) return; setData('target', (all) => [{ id: nextId(all, 'q'), title: t, done: false, ...defaults }, ...(Array.isArray(all) ? all : [])]); ctx.emit('quickadd.submit', { title: t }); ctx.toast(`„${t}“ angelegt`); setV(''); };
    return html`<div class=${`tk-quick-add ${props.elevated ? 'tk-quick-add--elevated' : ''}`}>
      <${Input} value=${v} onInput=${setV} placeholder=${props.placeholder} aria-label=${props.placeholder} onKeyDown=${(e) => e.key === 'Enter' && add()} />
      <${Button} variant="primary" icon="plus" onClick=${add} aria-label=${props.buttonLabel}>${ctx.bp === 'mobile' ? null : props.buttonLabel}<//>
    </div>`;
  },
};

export default [chart, formCard, quickAdd];
