// Wetter: amtliche Warnungen
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Badge, Icon, EmptyState } from '../../ui.js';
import { fmt } from '../../../lib/util.js';
import { dayLabel } from './weather-util.js';

const SEV = { minor: { tone: 'info', label: 'Hinweis', icon: 'info' }, moderate: { tone: 'warning', label: 'Markante Warnung', icon: 'alert-triangle' }, severe: { tone: 'danger', label: 'Unwetterwarnung', icon: 'alert-circle' }, extreme: { tone: 'danger', label: 'Extreme Unwetterwarnung', icon: 'zap' } };

export const weatherAlerts = {
  id: 'weather-alerts',
  name: 'Wetterwarnungen',
  category: 'Wetter',
  description: 'Amtliche Warnungen nach Schweregrad (Hinweis, markant, Unwetter) mit Zeitraum und Details zum Aufklappen. Warnungen lassen sich ausblenden.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Warnungen' },
    { name: 'expandFirst', label: 'Erste Warnung aufgeklappt', type: 'boolean', default: true },
  ],
  data: [{ slot: 'alerts', label: 'Warnungen', default: 'alerts', shape: '{id,severity:minor|moderate|severe|extreme,title,text,from,to,area?}[]', required: true }],
  events: ['weather.alert.open', 'weather.alert.dismiss'],
  states: ['empty'],
  css: `
  .tk-wa { display:flex; flex-direction:column; gap:var(--tk-space-3); }
  .tk-wa__item { border-radius:var(--tk-radius-lg); border:1px solid transparent; overflow:hidden; }
  .tk-wa__head { display:flex; align-items:center; gap:var(--tk-space-3); width:100%; padding:var(--tk-space-3) var(--tk-space-4); min-height:56px; border:0; background:transparent; color:var(--tk-c-text); font:inherit; text-align:left; cursor:pointer; }
  .tk-wa__ic { flex:none; display:grid; place-items:center; }
  .tk-wa__title { font-weight:var(--tk-fw-semibold); }
  .tk-wa__time { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); }
  .tk-wa__body { padding:0 var(--tk-space-4) var(--tk-space-4) calc(var(--tk-space-4) + 22px + var(--tk-space-3)); font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); line-height:1.6; display:flex; flex-direction:column; gap:10px; }
  .bp-mobile .tk-wa__body { padding-left:var(--tk-space-4); }`,
  example: { data: { alerts: [
    { id: 'w1', severity: 'moderate', title: 'Sturmböen', text: 'Aus Südwest sind Böen bis 75 km/h zu erwarten. Lose Gegenstände sichern, Aufenthalt im Freien meiden.', from: '2026-11-25T13:00:00', to: '2026-11-25T21:00:00', area: 'Kreis Bielefeld' },
    { id: 'w2', severity: 'minor', title: 'Leichter Frost', text: 'In der Nacht zum Freitag Tiefstwerte um −2 °C, örtlich Reifglätte.', from: '2026-11-26T22:00:00', to: '2026-11-27T08:00:00', area: 'Kreis Bielefeld' },
  ] } },
  render: ({ props, data, ctx }) => {
    const [hidden, setHidden] = useState([]);
    const list = (data.alerts || []).filter((a) => !hidden.includes(a.id));
    const [open, setOpen] = useState(props.expandFirst ? (data.alerts || [])[0]?.id : null);
    if (!list.length) return html`<${Card} title=${props.title} icon="shield-check"><${EmptyState} icon="shield-check" title="Keine Warnungen" text="Für deinen Standort liegen aktuell keine amtlichen Warnungen vor." /><//>`;
    return html`<${Card} title=${props.title} icon="alert-triangle" actions=${html`<${Badge}>${list.length}<//>`}><div class="tk-wa">
      ${list.map((a) => { const s = SEV[a.severity] || SEV.minor; const isOpen = open === a.id;
        return html`<div class="tk-wa__item" style=${`background:var(--tk-c-${s.tone}-soft);border-color:color-mix(in srgb, var(--tk-c-${s.tone}) 30%, transparent)`}>
          <button type="button" class="tk-wa__head" aria-expanded=${isOpen ? 'true' : 'false'} onClick=${() => { setOpen(isOpen ? null : a.id); if (!isOpen) ctx.emit('weather.alert.open', { id: a.id }); }}>
            <span class="tk-wa__ic" style=${`color:var(--tk-c-${s.tone})`}><${Icon} name=${s.icon} size=${22} /></span>
            <span class="tk-grow"><span class="tk-wa__title">${a.title}</span><span class="tk-wa__time" style="display:block">${dayLabel(a.from, ctx.today, true)} ${fmt.time(a.from)} – ${dayLabel(a.to, ctx.today, true) === dayLabel(a.from, ctx.today, true) ? '' : `${dayLabel(a.to, ctx.today, true)} `}${fmt.time(a.to)} Uhr</span></span>
            <${Icon} name=${isOpen ? 'chevron-up' : 'chevron-down'} size=${18} /></button>
          ${isOpen && html`<div class="tk-wa__body"><span>${a.text}</span>
            <div class="tk-row" style="flex-wrap:wrap;gap:8px"><${Badge}>${s.label}<//>${a.area && html`<${Badge} icon="map-pin">${a.area}<//>`}
              <span class="tk-grow"></span><${Button} size="sm" onClick=${() => { setHidden([...hidden, a.id]); ctx.emit('weather.alert.dismiss', { id: a.id }); ctx.toast('Warnung ausgeblendet'); }}>Ausblenden<//></div></div>`}
        </div>`; })}
    </div><//>`;
  },
};
