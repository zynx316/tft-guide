// Berechtigung: erst erklären, dann fragen. Bei „verweigert“ Erklärung, Alternative und Weg in die Systemeinstellungen.
import { html } from '../../../lib/html.js';
import { Button, Badge, Icon } from '../../ui.js';
import { useSynced } from './_crosscut.js';

const KINDS = {
  kamera: { icon: 'camera', title: 'Kamera', why: 'TAKT nutzt die Kamera, um Barcodes zu scannen und Belege oder Texte aus Fotos zu übernehmen. Bilder bleiben auf deinem Gerät.',
    lost: 'Ohne Kamerazugriff kannst du keine Barcodes scannen und keine Belege fotografieren.', alt: 'Barcode oder Betrag von Hand eintragen', altIcon: 'keyboard', path: 'Einstellungen › Apps › TAKT › Berechtigungen › Kamera' },
  standort: { icon: 'map-pin', title: 'Standort', why: 'Dein Standort liefert das Wetter vor Ort. Er wird nur für die Abfrage genutzt, es werden keine Bewegungsdaten gespeichert.',
    lost: 'Ohne Standort kennt TAKT dein Wetter nicht automatisch.', alt: 'Ort von Hand wählen (z. B. Bielefeld)', altIcon: 'search', path: 'Einstellungen › Apps › TAKT › Berechtigungen › Standort' },
  mitteilungen: { icon: 'bell', title: 'Mitteilungen', why: 'Für Erinnerungen an Termine, fällige Aufgaben und Gewohnheiten. Du bestimmst pro Modul, was ankommt, und kannst ruhige Zeiten festlegen.',
    lost: 'Ohne Mitteilungen erinnert TAKT dich nicht von selbst an Termine und Fristen.', alt: 'Erinnerungen in der App unter „Heute“ ansehen', altIcon: 'list-checks', path: 'Einstellungen › Apps › TAKT › Mitteilungen' },
  gesundheit: { icon: 'heart-pulse', title: 'Gesundheitsdaten', why: 'TAKT liest Schritte und Schlaf aus der Gesundheits-App des Geräts, damit du nichts doppelt eintragen musst. Die Daten bleiben lokal.',
    lost: 'Ohne Zugriff übernimmt TAKT keine Schritte und keinen Schlaf automatisch.', alt: 'Werte von Hand eintragen', altIcon: 'pencil', path: 'Einstellungen › Datenschutz › Gesundheit › TAKT' },
};

export const permissionCard = {
  id: 'permission-card',
  name: 'Berechtigungs-Karte',
  category: 'Querschnitt',
  description: 'Erklärt vor der Systemabfrage, wozu TAKT eine Berechtigung braucht (Kamera, Standort, Mitteilungen, Gesundheitsdaten). Bei Ablehnung: Folgen, Alternative und Weg in die Systemeinstellungen.',
  version: '1.0',
  props: [
    { name: 'kind', label: 'Berechtigung', type: 'select', options: Object.keys(KINDS), default: 'kamera' },
    { name: 'state', label: 'Zustand', type: 'select', options: ['fragen', 'erteilt', 'verweigert'], default: 'fragen' },
  ],
  data: [],
  events: ['permission.grant', 'permission.deny', 'permission.settings', 'permission.alternative'],
  states: [],
  flutter: {
    widget: 'TaktPermissionCard',
    propMap: { kind: 'permission', state: 'status' },
    events: { 'permission.grant': 'onRequest', 'permission.deny': 'onDeny', 'permission.settings': 'onOpenSettings', 'permission.alternative': 'onAlternative' },
  },
  a11y: { role: 'group', nameFrom: 'Titel' },
  css: `
  .tk-perm { display: flex; flex-direction: column; gap: var(--tk-space-3); padding: var(--tk-space-4); border-radius: var(--tk-radius-lg); border: 1px solid var(--tk-c-border); background: var(--tk-c-surface); min-width: 0; }
  .tk-perm__head { display: flex; align-items: center; gap: var(--tk-space-3); min-width: 0; }
  .tk-perm__icon { width: 44px; height: 44px; border-radius: var(--tk-radius-md); display: grid; place-items: center; flex: none; background: var(--tk-c-accent-soft); color: var(--tk-c-accent); }
  .tk-perm--verweigert .tk-perm__icon { background: var(--tk-c-warning-soft); color: var(--tk-c-warning); }
  .tk-perm--erteilt .tk-perm__icon { background: var(--tk-c-success-soft); color: var(--tk-c-success); }
  .tk-perm__title { font-size: var(--tk-fs-lg); font-weight: var(--tk-fw-semibold); color: var(--tk-c-text); }
  .tk-perm__text { color: var(--tk-c-text-muted); font-size: var(--tk-fs-md); line-height: var(--tk-lh-normal); margin: 0; }
  .tk-perm__lost { display: flex; gap: var(--tk-space-2); padding: var(--tk-space-3); border-radius: var(--tk-radius-md); background: var(--tk-c-warning-soft); color: var(--tk-c-text); font-size: var(--tk-fs-sm); line-height: var(--tk-lh-snug); }
  .tk-perm__lost svg { flex: none; color: var(--tk-c-warning); margin-top: 1px; }
  .tk-perm__alt { display: flex; align-items: center; gap: var(--tk-space-3); width: 100%; min-height: 48px; padding: var(--tk-space-2) var(--tk-space-3); border-radius: var(--tk-radius-md); border: 1px solid var(--tk-c-border-strong); background: var(--tk-c-surface2); color: var(--tk-c-text); font: inherit; font-size: var(--tk-fs-md); text-align: left; cursor: pointer; }
  .tk-perm__alt:hover { border-color: var(--tk-c-accent); }
  .tk-perm__path { font-size: var(--tk-fs-xs); color: var(--tk-c-text-subtle); line-height: var(--tk-lh-snug); }
  .tk-perm__actions { display: flex; gap: var(--tk-space-2); flex-wrap: wrap; }
  .bp-mobile .tk-perm__actions .tk-btn { flex: 1 1 100%; }
  .bp-mobile .tk-perm__alt { min-height: var(--tk-size-touch); }`,
  example: { props: { kind: 'kamera', state: 'verweigert' } },
  render: function PermissionCard({ props, ctx }) {
    const k = KINDS[props.kind] || KINDS.kamera;
    const [own, setState] = useSynced(ctx.state === 'denied' ? 'verweigert' : props.state);
    const state = ctx.state === 'denied' ? 'verweigert' : own;
    const detail = { kind: props.kind };
    const badge = { fragen: html`<${Badge}>Nicht erteilt<//>`, erteilt: html`<${Badge} tone="success" icon="check">Erlaubt<//>`, verweigert: html`<${Badge} tone="warning" icon="alert-triangle">Verweigert<//>` }[state];
    return html`<section class=${`tk-perm tk-perm--${state}`} aria-label=${`Berechtigung ${k.title}`} data-qa="permission-card">
      <div class="tk-perm__head"><span class="tk-perm__icon"><${Icon} name=${k.icon} size=${22} /></span><span class="tk-perm__title tk-grow">${k.title}</span>${badge}</div>
      ${state === 'fragen' && html`<p class="tk-perm__text">${k.why}</p>
        <div class="tk-perm__actions">
          <${Button} variant="primary" icon="check" onClick=${() => { setState('erteilt'); ctx.emit('permission.grant', detail); ctx.toast(`${k.title}: erlaubt`); }}>Erlauben<//>
          <${Button} onClick=${() => { setState('verweigert'); ctx.emit('permission.deny', detail); }}>Nicht erlauben<//></div>`}
      ${state === 'erteilt' && html`<p class="tk-perm__text">${k.title}-Zugriff ist aktiv. Du kannst ihn jederzeit in den Systemeinstellungen widerrufen.</p>
        <div class="tk-perm__actions"><${Button} size="sm" icon="settings" onClick=${() => { ctx.emit('permission.settings', detail); ctx.toast('Systemeinstellungen werden geöffnet'); }}>Einstellungen öffnen<//></div>`}
      ${state === 'verweigert' && html`<div class="tk-perm__lost"><${Icon} name="info" size=${16} /><span>${k.lost}</span></div>
        <button type="button" class="tk-perm__alt" onClick=${() => { ctx.emit('permission.alternative', detail); ctx.toast(k.alt); }}>
          <${Icon} name=${k.altIcon} size=${18} /><span class="tk-grow"><strong>Stattdessen:</strong> ${k.alt}</span><${Icon} name="chevron-right" size=${16} /></button>
        <div class="tk-perm__actions"><${Button} variant="primary" icon="settings" onClick=${() => { ctx.emit('permission.settings', detail); ctx.toast('Systemeinstellungen werden geöffnet'); }}>Einstellungen öffnen<//></div>
        <span class="tk-perm__path">Weg: ${k.path}</span>`}
    </section>`;
  },
};
export default permissionCard;
