// Wetter: Radar als Tabelle (wx-radar-table) – Niederschlag je 10 Minuten von −1 Std. bis +2 Std. mit Zeitleiste, Balken und Kennzahlen, ohne Karte.
import { html } from '../../../lib/html.js';
import { Card, Badge, Icon } from '../../ui.js';
import { fmtNumber } from '../../../lib/format.js';
import { placeOf, settingsOf, unitsOf, hm, stamp, NoPlace, SLOT_PLACE, SLOT_SETTINGS, EX } from './_weather2.js';
import { rainLevel } from './nowcast.js';
import { HOME, rainAt } from './_radar.js';

const BINS = [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];   // Start des Blocks in 10-Minuten-Einheiten ab jetzt
const clock = (today, min) => stamp(new Date(new Date(today).getTime() + min * 60000));
const hmRange = (today, a) => `${hm(clock(today, a * 10))}–${hm(clock(today, a * 10 + 10))}`;

export const wxRadarTable = {
  id: 'wx-radar-table',
  name: 'Radar-Tabelle (10 Minuten)',
  category: 'Wetter',
  description: 'Regen am Ort in 10-Minuten-Blöcken von −1 Std. (beobachtet) bis +2 Std. (Vorhersage): Kennzahlen (Beginn, Ende, Spitze, Summe), Zeitleiste als Farbband und eine Tabelle mit Balken, Menge je 10 Minuten und Stufe. Eine Zeile antippen setzt den Radar-Zeitpunkt (ctx.ui.radarT). Ohne Karte, dicht und exakt.',
  version: '1.2',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Niederschlag je 10 Minuten' },
    { name: 'showObserved', label: 'Beobachtung (−1 Std.) zeigen', type: 'boolean', default: true },
    { name: 'hideDry', label: 'Trockene Blöcke ausblenden', type: 'boolean', default: false },
  ],
  data: [SLOT_PLACE, SLOT_SETTINGS],
  events: ['weather.radar.frame', 'weather.radar.open'],
  states: ['empty'],
  flutter: { widget: 'WxRadarTable', propMap: { showObserved: 'showObserved', hideDry: 'hideDry' }, events: ['weather.radar.frame'] },
  css: `
  .tk-wxt10__kpis { display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:1px; border:1px solid var(--tk-c-border); border-radius:var(--tk-radius-md); overflow:hidden; background:var(--tk-c-border); margin-bottom:var(--tk-space-3); }
  .bp-mobile .tk-wxt10__kpis { grid-template-columns:repeat(2, minmax(0, 1fr)); }
  .tk-wxt10__kpi { background:var(--tk-c-surface); padding:8px 10px; min-width:0; } .tk-wxt10__kpi span { display:block; font-size:var(--tk-fs-xs); color:var(--tk-c-text-muted); } .tk-wxt10__kpi strong { font-size:var(--tk-fs-md); font-weight:var(--tk-fw-bold); font-variant-numeric:tabular-nums; overflow-wrap:break-word; }
  .tk-wxt10__strip { position:relative; display:flex; height:14px; border-radius:var(--tk-radius-sm); overflow:hidden; background:var(--tk-c-surface3); gap:1px; } .tk-wxt10__strip i { flex:1; min-width:0; background:var(--tk-c-surface3); } .tk-wxt10__strip i[data-obs="true"] { opacity:.55; }
  .tk-wxt10__ticks { position:relative; height:18px; font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); font-variant-numeric:tabular-nums; margin-bottom:var(--tk-space-3); } .tk-wxt10__ticks span { position:absolute; top:2px; transform:translateX(-50%); white-space:nowrap; } .tk-wxt10__ticks span:first-child { transform:none; } .tk-wxt10__ticks span:last-child { transform:translateX(-100%); }
  .tk-wxt10__tbl { width:100%; border-collapse:collapse; font-variant-numeric:tabular-nums; font-size:var(--tk-fs-sm); }
  .tk-wxt10__tbl th { text-align:left; font-weight:var(--tk-fw-semibold); font-size:var(--tk-fs-xs); color:var(--tk-c-text-muted); padding:6px 8px; border-bottom:1px solid var(--tk-c-border-strong); }
  .tk-wxt10__tbl td { padding:0 8px; height:34px; border-bottom:1px solid var(--tk-c-border); } .bp-mobile .tk-wxt10__tbl td { height:44px; }
  .tk-wxt10__tbl tr[data-sel="true"] td { background:var(--tk-c-accent-soft); } .tk-wxt10__tbl tbody tr { cursor:pointer; } .tk-wxt10__tbl tbody tr:hover td { background:var(--tk-c-surface2); }
  .tk-wxt10__tbl tr[data-obs="true"] td { color:var(--tk-c-text-muted); } .tk-wxt10__tbl tr[data-now="true"] td { border-top:2px solid var(--tk-c-text); }
  .tk-wxt10__tbl td:nth-child(n+3), .tk-wxt10__tbl th:nth-child(n+3) { text-align:right; white-space:nowrap; } .tk-wxt10__tbl td:nth-child(2) { width:34%; }
  .tk-wxt10__tbl td:first-child { white-space:nowrap; } .bp-mobile .tk-wxt10__tbl td:first-child small { display:none; } .tk-wxt10__tbl tr[data-obs="true"] .tk-wxt10__rowbtn { font-style:italic; }
  .tk-wxt10__bar { display:block; height:12px; border-radius:3px; min-width:2px; } .tk-wxt10__dry { color:var(--tk-c-text-subtle); }
  .tk-wxt10__rowbtn { all:unset; display:flex; align-items:center; min-height:34px; min-width:44px; cursor:pointer; } .bp-mobile .tk-wxt10__rowbtn { min-height:44px; } .tk-wxt10__rowbtn:focus-visible { outline:2px solid var(--tk-c-focus); outline-offset:2px; }
  .bp-mobile .tk-wxt10__lv, .bp-mobile .tk-wxt10__rate { display:none; }
  [data-tk-large-text] .tk-wxt10__tbl td { height:auto; padding-block:8px; white-space:normal; } [data-tk-large-text] .tk-wxt10__tbl th, [data-tk-large-text] .tk-wxt10__tbl td { padding-inline:4px; hyphens:manual; } [data-tk-large-text] .tk-wxt10__tbl td:nth-child(n+3), [data-tk-large-text] .tk-wxt10__tbl th:nth-child(n+3), [data-tk-large-text] .tk-wxt10__tbl td:first-child { white-space:normal; } [data-tk-large-text] .tk-wxt10__kpis { grid-template-columns:minmax(0, 1fr); }`,
  example: { data: { place: EX.place, settings: EX.settings } },
  render: ({ props, data, ctx }) => {
    const place = placeOf(data), nc = place?.nowcast;
    if (!nc) return html`<${NoPlace} icon="cloud-rain" title="Kein Radar" text="Für diesen Ort liegt keine Kurzfrist-Vorhersage vor." />`;
    const U = unitsOf(settingsOf(data)), inch = U.raw.precip === 'in', amt = (mm) => (inch ? fmtNumber(mm / 25.4, { digits: 3 }) : fmtNumber(mm, { digits: 2 })), unit = inch ? 'in' : 'mm';
    const shift = place.id !== 'bielefeld' ? (place.lon * 3) % 7 : 0;
    const rows = BINS.filter((b) => props.showObserved || b >= 0).map((b) => {
      const mmh = b < 0 ? (rainAt(HOME[0] + 0.5, HOME[1] + 0.5, b * 10 + 2.5, shift) + rainAt(HOME[0] + 0.5, HOME[1] + 0.5, b * 10 + 7.5, shift)) / 2 : ((nc.values[b * 2]?.mm ?? 0) + (nc.values[b * 2 + 1]?.mm ?? 0)) / 2;
      return { b, mmh, mm: mmh / 6, lvl: rainLevel(mmh), obs: b < 0 };
    });
    const fc = rows.filter((r) => !r.obs), wet = fc.filter((r) => r.mmh >= 0.1), sum = fc.reduce((s, r) => s + r.mm, 0), peak = fc.reduce((a, r) => (r.mmh > a.mmh ? r : a), fc[0]);
    const start = wet[0], end = wet.length ? wet[wet.length - 1] : null;
    const max = Math.max(0.2, ...rows.map((r) => r.mm)), selT = ctx.ui.radarT, selB = selT != null ? Math.floor(selT / 10) : null;
    // Läufe aus mindestens drei trockenen Blöcken (gleiche Phase) werden zu einer Zeile zusammengefasst
    const shown = [];
    for (let i = 0; i < rows.length;) {
      let j = i; while (j + 1 < rows.length && rows[j + 1].mmh < 0.1 && rows[i].mmh < 0.1 && rows[j + 1].obs === rows[i].obs) j++;
      if (rows[i].mmh < 0.1 && j - i >= 2) { if (!props.hideDry) shown.push({ ...rows[i], to: rows[j].b, n: j - i + 1 }); i = j + 1; } else { if (!(props.hideDry && rows[i].mmh < 0.1 && rows[i].b !== 0)) shown.push(rows[i]); i += 1; }
    }
    const pick = (r) => { ctx.setUi('radarT', r.b * 10); ctx.emit('weather.radar.frame', { minutes: r.b * 10 }); };
    const total = rows.length, nowAt = rows.findIndex((r) => r.b === 0);
    return html`<${Card} title=${props.title} icon="waves" actions=${html`<${Badge} tone=${nc.state === 'dry' ? 'success' : 'info'}>${nc.headline}<//>`}>
      <div class="tk-wxt10__kpis"><div class="tk-wxt10__kpi"><span>Beginn</span><strong>${start ? (start.b === 0 ? 'jetzt' : `ca. ${hm(clock(ctx.today, nc.startsInMin != null ? nc.startsInMin : start.b * 10))} Uhr`) : 'kein Regen'}</strong></div>
        <div class="tk-wxt10__kpi"><span>Ende</span><strong>${end ? `gegen ${nc.endsAt ? nc.endsAt : hm(clock(ctx.today, end.b * 10 + 10))} Uhr` : '–'}</strong></div>
        <div class="tk-wxt10__kpi"><span>Spitze</span><strong>${peak && peak.mmh >= 0.1 ? `${amt(peak.mmh)} ${unit}/h · ${hm(clock(ctx.today, peak.b * 10))}` : '–'}</strong></div>
        <div class="tk-wxt10__kpi"><span>Summe 2 Std.</span><strong>${amt(sum)} ${unit}</strong></div></div>
      <div class="tk-wxt10__strip" role="img" aria-label=${`Zeitleiste von −1 Std. bis +2 Std., ${wet.length ? `Regen ${wet.length * 10} Minuten` : 'trocken'}`}>${rows.map((r) => html`<i data-obs=${String(r.obs)} style=${r.mmh >= 0.1 ? `background:${r.lvl.color}` : ''}></i>`)}</div>
      <div class="tk-wxt10__ticks" aria-hidden="true"><span style="left:0">${props.showObserved ? '−1 Std.' : 'Jetzt'}</span>${props.showObserved && nowAt > 0 && html`<span style=${`left:${(nowAt / total) * 100}%`}>Jetzt</span>`}<span style="left:100%">+2 Std.</span></div>
      <table class="tk-wxt10__tbl"><thead><tr><th scope="col">Zeit</th><th scope="col">Menge</th><th scope="col">${unit}/10 Min.</th><th scope="col" class="tk-wxt10__rate">${unit}/h</th><th scope="col" class="tk-wxt10__lv">Stufe</th></tr></thead>
        <tbody>${shown.map((r) => html`<tr data-obs=${String(r.obs)} data-now=${String(r.b === 0 && props.showObserved && !r.obs)} data-sel=${String(selB === r.b)} onClick=${() => pick(r)}>
          <td><button type="button" class="tk-wxt10__rowbtn" aria-label=${`${r.n ? `${hm(clock(ctx.today, r.b * 10))}–${hm(clock(ctx.today, r.to * 10 + 10))}` : hmRange(ctx.today, r.b)} Uhr, ${r.mmh >= 0.1 ? `${r.lvl.label}, ${amt(r.mm)} ${unit}` : 'trocken'}${r.obs ? ', beobachtet' : ''}. Im Radar zeigen`} onClick=${(e) => { e.stopPropagation(); pick(r); }}>${r.n ? `${hm(clock(ctx.today, r.b * 10))}–${hm(clock(ctx.today, r.to * 10 + 10))}` : hmRange(ctx.today, r.b)}${r.obs ? html` <small class="tk-wxt10__dry">beob.</small>` : ''}</button></td>
          <td>${r.mmh >= 0.1 ? html`<span class="tk-wxt10__bar" style=${`width:${Math.max(3, (r.mm / max) * 100)}%;background:${r.lvl.color}`}></span>` : html`<span class="tk-wxt10__dry">trocken${r.n ? ` · ${r.n} Blöcke` : ''}</span>`}</td>
          <td>${r.mmh >= 0.1 ? amt(r.mm) : '–'}</td><td class="tk-wxt10__rate">${r.mmh >= 0.1 ? amt(r.mmh) : '–'}</td><td class="tk-wxt10__lv">${r.mmh >= 0.1 ? r.lvl.label : '–'}</td></tr>`)}</tbody></table>
      <div class="tk-subtle" style="font-size:var(--tk-fs-xs);margin-top:var(--tk-space-2)">Kursive Zeilen sind beobachtet · Menge je 10 Minuten = Intensität ÷ 6 · simulierte Demo-Daten (Quelle im Echtbetrieb: DWD-Radar)</div><//>`;
  },
};
export default [wxRadarTable];
