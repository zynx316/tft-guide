// Hinweis-System: sachliche Pflicht-/Vertrauenshinweise (Finanzen, Trading, Gesundheit, Steuern, Daten).
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Icon } from '../../ui.js';

const PRESETS = {
  finanzen: { icon: 'info', title: 'Hinweis', text: 'Alle Werte sind Modellrechnungen auf Basis deiner Eingaben. Keine Anlage- oder Steuerberatung.' },
  trading: { icon: 'alert-triangle', title: 'Simulation', text: 'Kurse verzögert und fiktiv. Orders werden nur simuliert, nichts wird ausgeführt. Keine Anlageberatung – Wertpapiere können an Wert verlieren.' },
  sparplan: { icon: 'info', title: 'Modellrechnung', text: 'Prognosen mit angenommener Rendite, ohne Garantie. Vergangene Entwicklung ist kein verlässlicher Indikator für künftige Erträge.' },
  steuer: { icon: 'scale', title: 'Steuer-Schätzung', text: 'Vereinfachte Annahmen (Abgeltungsteuer 25 % + Soli, Stand 01/2026, ohne Kirchensteuer). Keine Steuerberatung.' },
  gesundheit: { icon: 'heart-pulse', title: 'Hinweis', text: 'Richtwerte für gesunde Erwachsene, kein medizinischer Rat. Bei Beschwerden ärztlich abklären.' },
  daten: { icon: 'lock', title: 'Deine Daten', text: 'Alle Daten bleiben lokal auf deinem Gerät. Beträge lassen sich jederzeit ausblenden.' },
};

export const legalNotice = {
  id: 'legal-notice',
  name: 'Sachlicher Hinweis',
  category: 'Querschnitt',
  description: 'Einheitliche, unaufdringliche Pflicht- und Vertrauenshinweise (Finanzen, Trading, Sparplan, Steuer, Gesundheit, Daten). Kompakt als Fußnote oder aufklappbar.',
  version: '1.0',
  props: [
    { name: 'kind', label: 'Art', type: 'select', options: Object.keys(PRESETS), default: 'finanzen' },
    { name: 'style', label: 'Darstellung', type: 'select', options: ['footnote', 'card', 'collapsible'], default: 'footnote' },
    { name: 'text', label: 'Eigener Text (optional)', type: 'textarea', default: '' },
    { name: 'stand', label: 'Datenstand (optional)', type: 'text', default: '' },
  ],
  data: [],
  events: ['legal.open'],
  states: ['empty', 'loading', 'error'],
  css: `
  .tk-legal { display:flex; gap:8px; align-items:flex-start; color:var(--tk-c-text-subtle); font-size:var(--tk-fs-xs); line-height:var(--tk-lh-snug); }
  .tk-legal--card { padding:var(--tk-space-3) var(--tk-space-4); border-radius:var(--tk-radius-md); background:var(--tk-c-surface2); border:1px solid var(--tk-c-border); color:var(--tk-c-text-muted); font-size:var(--tk-fs-sm); }
  .tk-legal__btn { border:0; background:none; color:var(--tk-c-text-muted); font:inherit; font-size:var(--tk-fs-sm); display:inline-flex; align-items:center; gap:6px; padding:8px 0; cursor:pointer; min-height:36px; }
  .tk-legal strong { color:var(--tk-c-text-muted); font-weight:var(--tk-fw-semibold); }`,
  example: { props: { kind: 'trading', style: 'card', stand: 'Kurse von 09:30, verzögert' } },
  render: function LegalNotice({ props, ctx }) {
    const p = PRESETS[props.kind] || PRESETS.finanzen;
    const [open, setOpen] = useState(false);
    const body = html`<span><strong>${p.title}:</strong> ${props.text || p.text}${props.stand ? ` · Stand: ${props.stand}` : ''}</span>`;
    if (props.style === 'collapsible') return html`<div><button type="button" class="tk-legal__btn" aria-expanded=${String(open)} onClick=${() => { setOpen(!open); ctx.emit('legal.open', { kind: props.kind }); }}>
      <${Icon} name=${p.icon} size=${14} />${p.title}<${Icon} name=${open ? 'chevron-up' : 'chevron-down'} size=${14} /></button>${open && html`<div class="tk-legal tk-legal--card">${body}</div>`}</div>`;
    return html`<div class=${`tk-legal ${props.style === 'card' ? 'tk-legal--card' : ''}`} role="note"><${Icon} name=${p.icon} size=${14} />${body}</div>`;
  },
};
export default [legalNotice];
