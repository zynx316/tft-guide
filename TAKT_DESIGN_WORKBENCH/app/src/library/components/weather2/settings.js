// Wetter: Einheiten & Benachrichtigungen (wx-settings) und Quellenzeile (wx-source)
import { html } from '../../../lib/html.js';
import { Card, Badge, Button, Icon, Segmented, Switch, Select } from '../../ui.js';
import { placeOf, settingsOf, unitsOf, freshness, hm, SLOT_PLACE, SLOT_SETTINGS, EX, NoPlace } from './_weather2.js';

const Row = ({ label, sub, children, stack }) => html`<div class=${`tk-wxset__row${stack ? ' tk-wxset__row--stack' : ''}`}><div class="tk-grow"><div class="tk-wxset__l">${label}</div>${sub && html`<div class="tk-wxset__s">${sub}</div>`}</div><div class="tk-wxset__c">${children}</div></div>`;
const LEVELS = [{ value: 1, label: '1' }, { value: 2, label: '2' }, { value: 3, label: '3' }, { value: 4, label: '4' }];

export const wxSettings = {
  id: 'wx-settings',
  name: 'Einheiten & Benachrichtigungen',
  category: 'Wetter',
  description: 'Einstellungen des Wetter-Moduls: Einheiten (°C/°F, km/h, m/s, Beaufort, mph, mm/in, hPa/inHg) mit Live-Vorschau, Benachrichtigungen (Regen, Tageszusammenfassung, Pollen, UV, Pendeln), Warnstufe, Ruhezeiten, Aktualisierung und Offline-Simulation. Änderungen wirken sofort in allen Wetter-Screens des Launchers.',
  version: '1.0',
  props: [{ name: 'showPreview', label: 'Live-Vorschau der Einheiten', type: 'boolean', default: true }],
  data: [SLOT_PLACE, SLOT_SETTINGS],
  events: ['weather.settings.change'],
  states: ['empty'],
  css: `
  .tk-wxset__row { display:flex; align-items:center; gap:var(--tk-space-4); min-height:56px; padding:10px 0; border-bottom:1px solid var(--tk-c-border); } .tk-wxset__row:last-child { border-bottom:0; }
  .tk-wxset__l { font-weight:var(--tk-fw-medium); } .tk-wxset__s { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); margin-top:2px; line-height:1.4; } .tk-wxset__c { flex:none; display:flex; align-items:center; gap:var(--tk-space-2); max-width:62%; }
  .bp-mobile .tk-wxset__row--stack { flex-direction:column; align-items:stretch; gap:8px; } .bp-mobile .tk-wxset__row--stack .tk-wxset__c { max-width:100%; }
  .bp-mobile .tk-wxset__c .tk-switch { width:56px; height:34px; border-radius:17px; } .bp-mobile .tk-wxset__c .tk-switch::after { width:28px; height:28px; top:2px; left:2px; } .bp-mobile .tk-wxset__c .tk-switch[aria-checked="true"]::after { transform:translateX(22px); }
  .bp-mobile .tk-wxset__row .tk-seg button { min-width:44px; justify-content:center; }
  .tk-wxset__prev { display:flex; flex-wrap:wrap; gap:6px var(--tk-space-4); padding:var(--tk-space-3) var(--tk-space-4); border-radius:var(--tk-radius-md); background:var(--tk-c-accent-soft); font-variant-numeric:tabular-nums; font-size:var(--tk-fs-md); } .tk-wxset__prev span { display:inline-flex; align-items:center; gap:6px; }
  .tk-wxsrc { display:flex; align-items:center; gap:8px; flex-wrap:wrap; font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); line-height:1.5; } .tk-wxsrc svg { flex:none; }
  .tk-wxsrc__banner { display:flex; align-items:center; gap:var(--tk-space-3); padding:var(--tk-space-3) var(--tk-space-4); border-radius:var(--tk-radius-lg); background:var(--tk-c-warning-soft); border:1px solid color-mix(in srgb, var(--tk-c-warning) 35%, transparent); font-size:var(--tk-fs-sm); }`,
  example: { data: { place: EX.place, settings: EX.settings } },
  render: ({ props, data, setData, ctx }) => {
    const place = placeOf(data), S = settingsOf(data), U = unitsOf(S);
    const set = (path, v) => { setData('settings', (s) => { const c = settingsOf({ settings: s && !Array.isArray(s) ? s : {} }); const [a, b] = path.split('.'); return b ? { ...c, [a]: { ...c[a], [b]: v } } : { ...c, [a]: v }; }); ctx.emit('weather.settings.change', { key: path, value: v }); };
    const sw = (path, val, label) => html`<${Switch} checked=${val} label=${label} onChange=${(v) => set(path, v)} />`;
    const seg = (path, val, options, label) => html`<${Segmented} label=${label} value=${val} onChange=${(v) => set(path, v)} options=${options} />`;
    const times = ['06:30', '07:00', '07:30', '08:00', '09:00'].map((t) => ({ value: t, label: `${t} Uhr` }));
    const qt = ['20:00', '21:00', '22:00', '23:00'].map((t) => ({ value: t, label: t })), qe = ['05:30', '06:30', '07:30', '08:30'].map((t) => ({ value: t, label: t }));
    return html`<div class="tk-col" style="gap:var(--tk-space-4)">
      <${Card} title="Einheiten" icon="ruler">
        ${props.showPreview && place && html`<div class="tk-wxset__prev" aria-live="polite"><span><strong>${U.t(place.current.temp)}</strong></span><span><${Icon} name="wind" size=${14} />${U.w(place.current.wind)}</span><span><${Icon} name="umbrella" size=${14} />${U.p(place.hours[9]?.precip ?? 0.3)}</span><span><${Icon} name="gauge" size=${14} />${U.pr(place.current.pressure)}</span></div>`}
        <${Row} stack label="Temperatur">${seg('units.temp', S.units.temp, [{ value: 'C', label: '°C' }, { value: 'F', label: '°F' }], 'Temperatur')}<//>
        <${Row} stack label="Wind">${seg('units.wind', S.units.wind, [{ value: 'kmh', label: 'km/h' }, { value: 'ms', label: 'm/s' }, { value: 'bft', label: 'Bft' }, { value: 'mph', label: 'mph' }], 'Wind')}<//>
        <${Row} stack label="Niederschlag">${seg('units.precip', S.units.precip, [{ value: 'mm', label: 'mm' }, { value: 'in', label: 'Zoll' }], 'Niederschlag')}<//>
        <${Row} stack label="Luftdruck">${seg('units.pressure', S.units.pressure, [{ value: 'hPa', label: 'hPa' }, { value: 'inHg', label: 'inHg' }], 'Luftdruck')}<//>
        <${Row} label="Zeitformat" sub="Folgt der Systemeinstellung: 24-Stunden-Anzeige."><${Badge}>24 Std.<//><//><//>
      <${Card} title="Benachrichtigungen" icon="bell">
        <${Row} label="Regen in den nächsten Minuten" sub="Hinweis, wenn Regen am Standort beginnt (Nowcast)">${sw('notify.nowcast', S.notify.nowcast, 'Regen-Hinweis')}<//>
        <${Row} label="Tägliche Zusammenfassung" sub="Wetter, Kleidung und Termine mit Weg">${S.notify.daily && html`<${Select} value=${S.notify.dailyTime} options=${times} onChange=${(v) => set('notify.dailyTime', v)} aria-label="Uhrzeit der Zusammenfassung" style="width:auto" />`}${sw('notify.daily', S.notify.daily, 'Tägliche Zusammenfassung')}<//>
        <${Row} label="Pollenwarnung" sub="Ab Stufe 2 für meine Allergene">${sw('notify.allergy', S.notify.allergy, 'Pollenwarnung')}<//>
        <${Row} label="UV-Hinweis" sub="Ab UV-Index 3">${sw('notify.uv', S.notify.uv, 'UV-Hinweis')}<//>
        <${Row} label="Pendel- und Terminhinweise" sub="Regen oder Sturm auf dem Weg zu Terminen">${sw('notify.commute', S.notify.commute, 'Terminhinweise')}<//><//>
      <${Card} title="Unwetterwarnungen" icon="alert-triangle">
        <${Row} stack label="Benachrichtigen ab Stufe" sub="1 Wetterwarnung · 2 markant · 3 Unwetter · 4 extrem">${seg('alerts.minLevel', S.alerts.minLevel, LEVELS, 'Warnstufe')}<//>
        <${Row} stack label="Gilt für">${seg('alerts.scope', S.alerts.scope, [{ value: 'standort', label: 'Nur Standort' }, { value: 'alle', label: 'Alle Orte' }], 'Orte')}<//>
        <${Row} label="Ruhezeiten" sub=${S.alerts.quiet ? 'Unwetterwarnungen ab Stufe 3 kommen trotzdem durch.' : 'Keine Ruhezeit festgelegt.'}>${sw('alerts.quiet', S.alerts.quiet, 'Ruhezeiten')}<//>
        ${S.alerts.quiet && html`<${Row} label="Von – bis"><${Select} value=${S.alerts.quietFrom} options=${qt} onChange=${(v) => set('alerts.quietFrom', v)} aria-label="Ruhezeit von" style="width:auto" /><${Select} value=${S.alerts.quietTo} options=${qe} onChange=${(v) => set('alerts.quietTo', v)} aria-label="Ruhezeit bis" style="width:auto" /><//>`}<//>
      <${Card} title="Daten & Aktualisierung" icon="cloud-download">
        <${Row} stack label="Aktualisierung" sub="Im Mobilfunk-Sparmodus seltener">${seg('refreshMin', S.refreshMin, [{ value: 15, label: '15 Min.' }, { value: 30, label: '30 Min.' }, { value: 60, label: '60 Min.' }], 'Aktualisierung')}<//>
        <${Row} label="Datenquelle" sub="Warnungen und Radar amtlich (DWD). Die Quellenwahl ist noch offen."><${Badge} tone="warning">Entscheidung offen<//><//>
        <${Row} label="Offline simulieren" sub="Zeigt in allen Wetter-Screens den letzten Stand mit Hinweis.">${sw('offline', S.offline, 'Offline simulieren')}<//><//></div>`;
  },
};

export const wxSource = {
  id: 'wx-source',
  name: 'Quelle & Datenstand',
  category: 'Wetter',
  description: 'Fußzeile mit Datenstand, Quelle (Attribution) und Aktualisierungsintervall. Zeigt bei Offline oder veralteten Daten einen Hinweis mit „Erneut versuchen“. Optional Link zu den Einstellungen.',
  version: '1.0',
  props: [
    { name: 'variant', label: 'Darstellung', type: 'select', options: ['footnote', 'banner'], default: 'footnote' },
    { name: 'settingsLink', label: 'Link „Einstellungen“', type: 'boolean', default: true },
  ],
  data: [SLOT_PLACE, SLOT_SETTINGS],
  events: ['weather.refresh', 'weather.settings.open'],
  states: ['empty'],
  css: ``,
  example: { data: { place: EX.place, settings: EX.settings } },
  render: ({ props, data, ctx }) => {
    const place = placeOf(data);
    if (!place) return html`<${NoPlace} card=${false} />`;
    const S = settingsOf(data), fr = freshness(place, S, ctx.today);
    const banner = fr.state !== 'ok' && html`<div class="tk-wxsrc__banner" role="status"><${Icon} name=${fr.state === 'offline' ? 'signal' : 'clock'} size=${18} /><span class="tk-grow"><strong>${fr.state === 'offline' ? 'Du bist offline.' : 'Die Daten sind veraltet.'}</strong> Angezeigt wird der letzte Stand von ${hm(place.updated)} Uhr.</span><${Button} size="sm" icon="refresh-cw" onClick=${() => { ctx.emit('weather.refresh'); ctx.toast(S.offline ? 'Weiter offline' : 'Wetter aktualisiert'); }}>Erneut versuchen<//></div>`;
    if (props.variant === 'banner') return banner || null;
    return html`${banner}<div class="tk-wxsrc"><${Icon} name="info" size=${13} /><span>${fr.label} · Quelle: ${place.source} · Aktualisierung alle ${S.refreshMin} Min.</span>
      ${props.settingsLink && html`<${Button} size="sm" variant="ghost" icon="settings" onClick=${() => ctx.emit('weather.settings.open')}>Einheiten & Benachrichtigungen<//>`}</div>`;
  },
};
export default [wxSettings, wxSource];
