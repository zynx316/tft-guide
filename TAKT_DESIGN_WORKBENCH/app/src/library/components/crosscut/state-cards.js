// Zustandskarten: Sync-Konflikt (zwei Stände, Auswahl) und Fehlerkarte (Ursache + Ausweg) für den Zustandskatalog.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Icon, Button } from '../../ui.js';
import { useSynced } from './_crosscut.js';
import { XC_CSS } from './_xc-css.js';

const ERRORS = {
  save: { icon: 'alert-triangle', tone: 'danger', title: 'Speichern hat nicht geklappt', text: 'Prüfe den freien Speicher und versuche es erneut. Deine Eingabe bleibt erhalten.', primary: 'Erneut versuchen', alt: 'Eingabe kopieren', altIcon: 'copy' },
  load: { icon: 'cloud-download', tone: 'warning', title: 'Laden fehlgeschlagen', text: 'Die Daten konnten nicht geladen werden. Der Stand von 09:15 ist noch da.', primary: 'Erneut versuchen', alt: 'Stand von 09:15 ansehen', altIcon: 'clock' },
  storage: { icon: 'archive', tone: 'warning', title: 'Speicher fast voll', text: 'Nur noch 120 MB frei. Leere den Papierkorb oder exportiere alte Daten.', primary: 'Papierkorb öffnen', to: 'system.trash', alt: 'Daten exportieren', altTo: 'settings.data', altIcon: 'download' },
  expired: { icon: 'key-round', tone: 'danger', title: 'Anmeldung abgelaufen', text: 'Etsy hat die Verbindung beendet. Verbinde den Kanal neu, dann läuft der Abgleich weiter.', primary: 'Neu verbinden', alt: 'Später', altIcon: 'clock' },
  notfound: { icon: 'search', tone: 'info', title: 'Eintrag nicht gefunden', text: 'Er wurde gelöscht oder verschoben. Im Papierkorb ist er 30 Tage wiederherstellbar.', primary: 'Papierkorb öffnen', to: 'system.trash', alt: 'Zurück', altIcon: 'arrow-left' },
  unavailable: { icon: 'wifi-off', tone: 'warning', title: 'Dienst nicht erreichbar', text: 'Der Wetterdienst antwortet nicht. TAKT zeigt den Stand von 09:10.', primary: 'Erneut versuchen', alt: 'Offline weiterarbeiten', altIcon: 'wifi-off' },
};
const CSS = `
  .tk-xc-err { display: flex; gap: var(--tk-space-4); padding: var(--tk-space-4); border-radius: var(--tk-radius-lg); border: 1px solid var(--tk-c-border); background: var(--tk-c-surface); min-width: 0; }
  .tk-xc-err > .tk-xc-ic { width: 44px; height: 44px; }
  .tk-xc-err__body { display: flex; flex-direction: column; gap: var(--tk-space-2); min-width: 0; flex: 1 1 auto; }
  .tk-xc-err__body h3 { margin: 0; font-size: var(--tk-fs-lg); }
  .tk-xc-err__body p { margin: 0; color: var(--tk-c-text-muted); line-height: var(--tk-lh-normal); }
  .tk-xc-err__acts { display: flex; gap: var(--tk-space-2); flex-wrap: wrap; margin-top: var(--tk-space-1); }
  .bp-mobile .tk-xc-err__acts .tk-btn { flex: 1 1 140px; justify-content: center; }
  .tk-xc-conf { display: flex; flex-direction: column; gap: var(--tk-space-4); padding: var(--tk-space-4); border-radius: var(--tk-radius-xl); border: 1px solid var(--tk-c-warning); background: var(--tk-c-surface); min-width: 0; }
  .tk-xc-conf header { display: flex; gap: var(--tk-space-3); align-items: flex-start; }
  .tk-xc-conf h3 { margin: 0; font-size: var(--tk-fs-lg); }
  .tk-xc-conf header p, .tk-xc-conf > p { margin: 0; color: var(--tk-c-text-muted); font-size: var(--tk-fs-sm); }
  .tk-xc-conf__cmp { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--tk-space-3); }
  .tk-xc-conf__ver { display: flex; flex-direction: column; gap: var(--tk-space-2); padding: var(--tk-space-3); border-radius: var(--tk-radius-lg); background: var(--tk-c-surface2); border: 1px solid var(--tk-c-border); min-width: 0; }
  .tk-xc-conf__ver h4 { margin: 0; font-size: var(--tk-fs-sm); display: flex; align-items: center; gap: 6px; }
  .tk-xc-conf__f { display: flex; flex-direction: column; gap: 1px; padding: 6px 8px; border-radius: var(--tk-radius-sm); font-size: var(--tk-fs-sm); overflow-wrap: anywhere; }
  .tk-xc-conf__f small { color: var(--tk-c-text-muted); font-size: var(--tk-fs-xs); text-transform: uppercase; letter-spacing: var(--tk-ls-wide); }
  .tk-xc-conf__f[data-diff="true"] { background: var(--tk-c-warning-soft); }
  .tk-xc-conf__opts { display: flex; flex-direction: column; gap: var(--tk-space-2); }
  .tk-xc-conf__opt { display: flex; align-items: center; gap: var(--tk-space-3); min-height: 52px; padding: var(--tk-space-2) var(--tk-space-3); border-radius: var(--tk-radius-lg); border: 1.5px solid var(--tk-c-border); background: var(--tk-c-surface); color: var(--tk-c-text); font: inherit; text-align: left; cursor: pointer; }
  .tk-xc-conf__opt[aria-checked="true"] { border-color: var(--tk-c-accent); background: var(--tk-c-accent-soft); }
  @media (max-width: 420px) { .tk-xc-conf__cmp { grid-template-columns: 1fr; } }`;

const VERSIONS = [
  { id: 'here', label: 'Dieses Gerät', time: '09:12', icon: 'smartphone', f: [['Titel', 'Angebot Müller GmbH finalisieren', false], ['Fällig', 'heute, 14:00', true], ['Notiz', 'Kunde erwartet Rückmeldung bis 14:00 Uhr.', true]] },
  { id: 'there', label: 'Tablet', time: '09:20', icon: 'tablet', f: [['Titel', 'Angebot Müller GmbH finalisieren', false], ['Fällig', 'heute, 16:00', true], ['Notiz', 'Frist verlängert, Rückmeldung bis 16:00 Uhr.', true]] },
];
const CHOICES = [{ id: 'here', label: 'Dieses Gerät behalten', sub: 'Fällig 14:00' }, { id: 'there', label: 'Stand vom Tablet übernehmen', sub: 'Fällig 16:00' }, { id: 'both', label: 'Beide behalten', sub: 'Der zweite Stand wird eine Kopie' }];

export const syncConflict = {
  id: 'sync-conflict',
  name: 'Sync-Konflikt',
  category: 'Querschnitt',
  description: 'Zwei Geräte haben denselben Eintrag geändert: beide Stände nebeneinander, Unterschiede markiert, drei Auswahlmöglichkeiten (dieses Gerät, anderes Gerät, beide behalten). Nichts geht verloren, Rückgängig inklusive.',
  version: '1.1',
  props: [{ name: 'state', label: 'Zustand', type: 'select', options: ['offen', 'gelöst'], default: 'offen' }],
  data: [],
  events: ['conflict.choose', 'conflict.resolve', 'conflict.undo', 'conflict.later'],
  states: [],
  flutter: { widget: 'TaktSyncConflict', propMap: { state: 'status' }, events: { 'conflict.resolve': 'onResolve', 'conflict.later': 'onLater' } },
  a11y: { role: 'group', nameFrom: 'Titel' },
  css: XC_CSS + CSS,
  example: { props: {} },
  render: function SyncConflict({ props, ctx }) {
    const [own, setOwn] = useSynced(props.state);
    const [choice, setChoice] = useState('here');
    if (own === 'gelöst') return html`<div class="tk-xc-conf" style="border-color:var(--tk-c-success)" data-qa="sync-conflict"><header><span class="tk-xc-ic tk-xc-ic--success"><${Icon} name="check-circle-2" size=${20} /></span><div><h3>Konflikt gelöst</h3><p>${CHOICES.find((c) => c.id === choice).label}. Der andere Stand liegt 30 Tage im Verlauf.</p></div></header>
      <div class="tk-row"><${Button} size="sm" icon="undo-2" onClick=${() => { setOwn('offen'); ctx.emit('conflict.undo'); }}>Rückgängig<//></div></div>`;
    return html`<div class="tk-xc-conf" data-qa="sync-conflict"><header><span class="tk-xc-ic tk-xc-ic--warning"><${Icon} name="git-compare" size=${20} /></span><div><h3>Zwei Geräte, zwei Stände</h3><p>Ein anderes Gerät hat dieselbe Aufgabe geändert. Wähle, welcher Stand gilt. Nichts geht verloren.</p></div></header>
      <div class="tk-xc-conf__cmp">${VERSIONS.map((v) => html`<div class="tk-xc-conf__ver" key=${v.id}><h4><${Icon} name=${v.icon} size=${15} />${v.label} · ${v.time}</h4>${v.f.map(([k, val, diff]) => html`<div class="tk-xc-conf__f" data-diff=${diff ? 'true' : undefined}><small>${k}</small>${val}</div>`)}</div>`)}</div>
      <div class="tk-xc-conf__opts" role="radiogroup" aria-label="Welcher Stand gilt?">${CHOICES.map((c) => html`<button type="button" class="tk-xc-conf__opt" role="radio" aria-checked=${choice === c.id ? 'true' : 'false'} key=${c.id} onClick=${() => { setChoice(c.id); ctx.emit('conflict.choose', { choice: c.id }); }}><${Icon} name=${choice === c.id ? 'check-circle-2' : 'circle'} size=${20} /><span class="tk-xc-main"><span class="tk-xc-t">${c.label}</span><span class="tk-xc-s">${c.sub}</span></span></button>`)}</div>
      <div class="tk-row" style="gap:var(--tk-space-2);flex-wrap:wrap"><${Button} variant="primary" icon="check" onClick=${() => { setOwn('gelöst'); ctx.emit('conflict.resolve', { choice }); }}>Übernehmen<//><${Button} variant="ghost" onClick=${() => { ctx.emit('conflict.later'); ctx.toast('Du wirst später erneut gefragt'); }}>Später<//></div></div>`;
  },
};

export const errorCard = {
  id: 'error-card',
  name: 'Fehlerkarte',
  category: 'Querschnitt',
  description: 'Fehler ohne Schuld und ohne Code: Ursache in einem Satz, ein klarer Ausweg und eine Alternative. Sechs Arten: Speichern, Laden, Speicher voll, Anmeldung abgelaufen, nicht gefunden, Dienst nicht erreichbar.',
  version: '1.1',
  props: [
    { name: 'kind', label: 'Art', type: 'select', options: Object.keys(ERRORS), default: 'save' },
    { name: 'showAlt', label: 'Alternative zeigen', type: 'boolean', default: true },
  ],
  data: [],
  events: ['error.retry', 'error.alt'],
  states: [],
  flutter: { widget: 'TaktErrorCard', propMap: { kind: 'kind', showAlt: 'showAlternative' }, events: { 'error.retry': 'onPrimary', 'error.alt': 'onAlternative' } },
  a11y: { role: 'alert', nameFrom: 'Titel' },
  css: XC_CSS + CSS,
  example: { props: { kind: 'storage' } },
  render: function ErrorCard({ props, ctx }) {
    const e = ERRORS[props.kind] || ERRORS.save;
    const [busy, setBusy] = useState(false);
    const run = () => { ctx.emit('error.retry', { kind: props.kind }); if (e.to) ctx.emit(`open:${e.to}`); else { setBusy(true); setTimeout(() => { setBusy(false); ctx.toast('Erneut versucht'); }, 900); } };
    const alt = () => { ctx.emit('error.alt', { kind: props.kind }); if (e.altTo) ctx.emit(`open:${e.altTo}`); else ctx.toast(e.alt); };
    return html`<section class="tk-xc-err" role="alert" aria-label=${e.title} data-qa="error-card"><span class=${`tk-xc-ic tk-xc-ic--${e.tone}`}><${Icon} name=${e.icon} size=${22} /></span>
      <div class="tk-xc-err__body"><h3>${e.title}</h3><p>${e.text}</p><div class="tk-xc-err__acts"><${Button} variant="primary" icon=${busy ? 'loader-2' : e.to ? 'arrow-right' : 'refresh-cw'} disabled=${busy} onClick=${run}>${busy ? 'Lädt …' : e.primary}<//>
        ${props.showAlt && html`<${Button} icon=${e.altIcon} onClick=${alt}>${e.alt}<//>`}</div></div></section>`;
  },
};
export default [syncConflict, errorCard];
