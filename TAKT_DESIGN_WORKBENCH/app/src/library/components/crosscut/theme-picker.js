// Darstellung: Theme wählen (mit echter Mini-Vorschau je Theme), Dichte, Schriftgröße, reduzierte Bewegung.
import { html } from '../../../lib/html.js';
import { Icon, Badge, Switch, Segmented } from '../../ui.js';
import { themes, THEME_IDS } from '../../../design-system/tokens.js';
import { getPrefs } from './_system.js';
import { XC_CSS } from './_xc-css.js';

const CSS = `
  .tk-xc-th { display: flex; flex-direction: column; gap: var(--tk-space-4); min-width: 0; }
  .tk-xc-th__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); gap: var(--tk-space-3); }
  .tk-xc-th__opt { display: flex; flex-direction: column; gap: var(--tk-space-3); padding: var(--tk-space-3); border-radius: var(--tk-radius-xl); border: 2px solid var(--tk-c-border); background: var(--tk-c-surface); color: var(--tk-c-text); font: inherit; text-align: left; cursor: pointer; min-width: 0; }
  .tk-xc-th__opt[aria-checked="true"] { border-color: var(--tk-c-accent); box-shadow: 0 0 0 3px var(--tk-c-accent-soft); }
  .tk-xc-th__mini { border-radius: var(--tk-radius-lg); padding: var(--tk-space-3); background: var(--tk-c-bg); color: var(--tk-c-text); border: 1px solid var(--tk-c-border); display: flex; flex-direction: column; gap: 8px; min-width: 0; }
  .tk-xc-th__card { border-radius: var(--tk-radius-md); padding: 10px; background: var(--tk-c-surface); border: 1px solid var(--tk-c-border); display: flex; flex-direction: column; gap: 6px; }
  .tk-xc-th__card b { font-size: var(--tk-fs-sm); }
  .tk-xc-th__card i { display: block; height: 6px; border-radius: 3px; background: var(--tk-c-surface3); }
  .tk-xc-th__bars { display: flex; align-items: flex-end; gap: 4px; height: 28px; }
  .tk-xc-th__bars i { flex: 1; border-radius: 3px 3px 0 0; }
  .tk-xc-th__btn { align-self: flex-start; padding: 4px 12px; border-radius: var(--tk-radius-pill); background: var(--tk-c-accent); color: var(--tk-c-text-on-accent); font-size: var(--tk-fs-xs); font-weight: var(--tk-fw-semibold); }
  .tk-xc-th__name { display: flex; align-items: center; gap: var(--tk-space-2); font-weight: var(--tk-fw-semibold); }
  .tk-xc-th__note { font-size: var(--tk-fs-sm); color: var(--tk-c-text-muted); line-height: var(--tk-lh-snug); }
  .tk-xc-th__sw { display: inline-flex; gap: 3px; }
  .tk-xc-th__sw i { width: 16px; height: 16px; border-radius: 50%; border: 1px solid var(--tk-c-border-strong); }
  .tk-xc-th__rowopt { display: flex; align-items: center; gap: var(--tk-space-3); width: 100%; min-height: 60px; padding: var(--tk-space-2) var(--tk-space-4); border: 0; border-bottom: 1px solid var(--tk-c-border); background: none; color: var(--tk-c-text); font: inherit; text-align: left; cursor: pointer; }
  .tk-xc-th__rowopt:last-child { border-bottom: 0; }
  .tk-xc-th__rowopt[aria-checked="true"] { background: var(--tk-c-accent-soft); }
  .tk-xc-th__sample { padding: var(--tk-space-4); border-radius: var(--tk-radius-xl); background: var(--tk-c-bg); color: var(--tk-c-text); border: 1px solid var(--tk-c-border); display: flex; flex-direction: column; gap: var(--tk-space-2); min-width: 0; }
  .tk-xc-th__sample > div { display: flex; justify-content: space-between; gap: var(--tk-space-3); padding: 8px 12px; border-radius: var(--tk-radius-md); background: var(--tk-c-surface); border: 1px solid var(--tk-c-border); min-width: 0; }
  .tk-xc-th__ctl { display: flex; align-items: center; justify-content: space-between; gap: var(--tk-space-3); flex-wrap: wrap; padding: var(--tk-space-3) var(--tk-space-4); border-radius: var(--tk-radius-lg); border: 1px solid var(--tk-c-border); background: var(--tk-c-surface); }`;

const SCALES = [{ value: '1', label: '100 %' }, { value: '1.3', label: '130 %' }, { value: '2', label: '200 %' }];

export const themePicker = {
  id: 'theme-picker',
  name: 'Theme-Auswahl',
  category: 'Querschnitt',
  description: 'Darstellung wählen: drei Themes mit echter Mini-Vorschau (Graphite, Horizon, Intensiv), Dichte, Schriftgröße mit Beispiel und reduzierte Bewegung. Themes ändern nur Farben, nie die Anordnung.',
  version: '1.0',
  props: [
    { name: 'style', label: 'Darstellung', type: 'select', options: ['cards', 'list'], default: 'cards' },
    { name: 'showOptions', label: 'Dichte, Schrift, Bewegung', type: 'boolean', default: true },
    { name: 'showSample', label: 'Beispiel „Heute“', type: 'boolean', default: true },
  ],
  data: [{ slot: 'prefs', label: 'Einstellungen', default: 'prefs', shape: 'Welt: prefs', required: false }],
  events: ['theme.select', 'appearance.density', 'appearance.scale', 'appearance.motion'],
  states: ['empty'],
  flutter: { widget: 'TaktThemePicker', propMap: { style: 'layout', showOptions: 'showOptions' }, events: { 'theme.select': 'onThemeChanged', 'appearance.scale': 'onTextScaleChanged' } },
  a11y: { role: 'radiogroup', nameFrom: 'Theme' },
  css: XC_CSS + CSS,
  example: { props: {}, data: { prefs: {} } },
  render: function ThemePicker({ props, data, setData, ctx }) {
    const prefs = getPrefs(data.prefs, ctx);
    const save = (next) => setData('prefs', { ...prefs, ...next });
    const pick = (id) => { save({ theme: id }); ctx.emit('theme.select', { theme: id }); ctx.toast(`${themes[id].label} gewählt`); };
    const scale = Number(prefs.textScale) || 1;
    const opt = (id) => {
      const t = themes[id], on = prefs.theme === id;
      if (props.style === 'list') return html`<button type="button" class="tk-xc-th__rowopt" role="radio" aria-checked=${on ? 'true' : 'false'} key=${id} onClick=${() => pick(id)} data-theme-option=${id}>
        <span class="tk-xc-th__sw" data-tk-theme=${id} aria-hidden="true"><i style="background:var(--tk-c-bg)"></i><i style="background:var(--tk-c-surface3)"></i><i style="background:var(--tk-c-accent)"></i><i style="background:var(--tk-c-accent2)"></i></span>
        <span class="tk-xc-main"><span class="tk-xc-t">${t.label}</span><span class="tk-xc-s">${t.note.split('. ')[0]}</span></span>${on && html`<${Icon} name="check" size=${18} />`}</button>`;
      return html`<button type="button" class="tk-xc-th__opt" role="radio" aria-checked=${on ? 'true' : 'false'} key=${id} onClick=${() => pick(id)} data-theme-option=${id}>
        <div class="tk-xc-th__mini" data-tk-theme=${id} aria-hidden="true"><div class="tk-xc-th__card"><b>Heute</b><i style="width:80%"></i><i style="width:55%"></i></div>
          <div class="tk-xc-th__bars"><i style="height:45%;background:var(--tk-chart-1)"></i><i style="height:80%;background:var(--tk-chart-2)"></i><i style="height:60%;background:var(--tk-chart-3)"></i><i style="height:95%;background:var(--tk-chart-4)"></i></div><span class="tk-xc-th__btn">Erfassen</span></div>
        <div class="tk-xc-th__name">${t.label}${on && html`<${Badge} tone="accent" icon="check">Aktiv<//>`}</div><span class="tk-xc-th__note">${t.note}</span></button>`;
    };
    const sample = props.showSample && html`<div class="tk-xc-th__sample" data-tk-theme=${prefs.theme} aria-label="Beispiel Heute" style=${`font-size:${14 * scale}px`}>
      <strong style=${`font-size:${16 * scale}px`}>Heute · Di, 24.11.</strong><div><span>09:45 Daily Stand-up</span><span class="tk-num">Teams</span></div><div><span>14:00 Angebot Müller</span><span class="tk-num">hoch</span></div></div>`;
    return html`<div class="tk-xc-th" data-qa="theme-picker">
      <div class="tk-xc-th__grid" role="radiogroup" aria-label="Theme" style=${props.style === 'list' ? 'display:block;border:1px solid var(--tk-c-border);border-radius:var(--tk-radius-lg);overflow:hidden;background:var(--tk-c-surface)' : ''}>${THEME_IDS.map(opt)}</div>
      <p class="tk-xc-s" style="white-space:normal"><${Icon} name="info" size=${14} /> Die Demo wechselt das Theme im Launcher. Hier siehst du, wie sich jede Wahl anfühlt.</p>
      ${sample}
      ${props.showOptions && html`<div class="tk-xc-th__ctl"><span class="tk-xc-t">Dichte</span><${Segmented} label="Dichte" value=${prefs.density} options=${[{ value: 'komfortabel', label: 'Komfortabel' }, { value: 'kompakt', label: 'Kompakt' }]} onChange=${(v) => { save({ density: v }); ctx.emit('appearance.density', { density: v }); }} /></div>
        <div class="tk-xc-th__ctl"><span class="tk-xc-t">Schriftgröße</span><${Segmented} label="Schriftgröße" value=${String(scale)} options=${SCALES} onChange=${(v) => { save({ textScale: Number(v) }); ctx.emit('appearance.scale', { scale: Number(v) }); }} /></div>
        <div class="tk-xc-th__ctl"><span class="tk-xc-main"><span class="tk-xc-t">Weniger Bewegung</span><span class="tk-xc-s">Animationen reduzieren</span></span><${Switch} checked=${!!prefs.reduceMotion} label="Weniger Bewegung" onChange=${(v) => { save({ reduceMotion: v }); ctx.emit('appearance.motion', { on: v }); }} /></div>`}
    </div>`;
  },
};
export default themePicker;
