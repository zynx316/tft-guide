// Finanzen: Privatsphäre und Sicherheit – Beträge ausblenden, App-Sperre (Simulation), Puffer, lokale Daten.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Icon, Switch, Segmented, Select, Input, Badge } from '../../ui.js';
import { arr, obj } from './_calc.js';
import { FIN_CSS, slots, pctx, eur, Tile } from './_fin.js';
import { ex } from './_example.js';

const AFTER = [{ value: '0', label: 'Sofort' }, { value: '1', label: 'Nach 1 Minute' }, { value: '5', label: 'Nach 5 Minuten' }, { value: '15', label: 'Nach 15 Minuten' }];
const Row = ({ label, hint, checked, onChange, id }) => html`<div class="tk-fnv__row"><span class="tk-fn-grow"><span class="tk-fn-title" style="display:block;white-space:normal">${label}</span>${hint && html`<span class="tk-fn-sub" style="display:block">${hint}</span>`}</span><${Switch} checked=${checked} onChange=${onChange} label=${label} /></div>`;

export const finPrivacyPanel = {
  id: 'fin-privacy-panel',
  name: 'Privatsphäre und Sicherheit',
  category: 'Finanzen',
  description: 'Beträge ausblenden (mit Vorschau), App-Sperre für Finanzen als Simulation, Puffer für „frei verfügbar“ und der Hinweis, dass alle Daten lokal liegen. Export und Löschen sind als Simulation vorhanden.',
  version: '1.1',
  props: [{ name: 'title', label: 'Titel', type: 'text', default: 'Privatsphäre und Sicherheit' }, { name: 'showPreview', label: 'Vorschau der Maske', type: 'boolean', default: true }],
  data: slots('prefs', 'accounts'),
  events: ['privacy.toggle', 'privacy.lock', 'privacy.test', 'privacy.export', 'privacy.delete', 'privacy.reserve'],
  states: ['empty'],
  css: `
  .tk-fnv { display:flex; flex-direction:column; gap:var(--tk-space-4); min-width:0; }
  .tk-fnv__sec { display:flex; flex-direction:column; gap:var(--tk-space-2); } .tk-fnv__row { display:flex; align-items:center; gap:12px; min-height:48px; padding:4px 0; border-bottom:1px solid var(--tk-c-border); } .tk-fnv__row:last-child { border-bottom:0; }
  .tk-fnv__prev { display:flex; align-items:center; gap:12px; padding:var(--tk-space-3); border-radius:var(--tk-radius-md); background:var(--tk-c-surface2); border:1px dashed var(--tk-c-border-strong); }
  [data-tk-large-text] .tk-fnv__prev { flex-wrap:wrap; row-gap:4px; } [data-tk-large-text] .tk-fnv__prev > .tk-fn-ico { display:none; } [data-tk-large-text] .tk-fnv__prev > .tk-fn-grow { flex:1 1 8em; }
  .tk-fnv__lock { display:flex; flex-direction:column; align-items:center; gap:12px; padding:var(--tk-space-6) 0; text-align:center; }
  .bp-mobile .tk-fnv .tk-switch { width:52px; height:32px; } .bp-mobile .tk-fnv .tk-switch::after { width:26px; height:26px; }`,
  example: { data: ex('prefs', 'accounts') },
  render: function FinPrivacyPanel({ props, data, setData, ctx }) {
    const p = obj(data.prefs), c = pctx(ctx, data), [reserve, setReserve] = useState(String(p.reserve ?? 0).replace('.', ','));
    const giro = arr(data.accounts).find((a) => a.type === 'giro');
    const set = (patch, ev) => { setData('prefs', (x) => ({ ...obj(x), ...patch })); ctx.emit(ev, patch); };
    const test = () => ctx.openDialog({ title: 'Finanzen gesperrt', body: (close) => html`<div class="tk-fnv__lock"><${Tile} icon="lock" tone="accent" size=${56} /><div><strong>Finanzen sind gesperrt</strong><p class="tk-fn-meta">${p.lockMethod === 'pin' ? 'Gib deine PIN ein.' : 'Entsperre mit Fingerabdruck oder Gesicht.'}</p></div><${Button} variant="primary" icon="unlock" onClick=${close}>Entsperren<//><p class="tk-fn-note"><${Icon} name="info" size=${14} />Simulation: Es wird keine echte Sperre gesetzt.</p></div>` });
    const del = () => ctx.openDialog({ title: 'Finanzdaten löschen?', body: (close) => html`<div class="tk-fn-stack"><p>Alle Konten, Buchungen und Budgets werden endgültig gelöscht. Das lässt sich nicht rückgängig machen.</p><div class="tk-fn-actions"><${Button} variant="primary" onClick=${() => { ctx.emit('privacy.delete'); ctx.toast('Simulation: Es wurde nichts gelöscht'); close(); }}>Löschen<//><${Button} onClick=${close}>Behalten<//></div></div>` });
    const num = (v) => { const n = parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) && n >= 0 ? n : 0; };
    return html`<${Card} title=${props.title} icon="shield-check"><div class="tk-fnv">
      <div class="tk-fnv__sec"><span class="tk-fn-cap">Anzeige</span>
        <${Row} label="Beträge ausblenden" hint="Salden, Buchungen und Budgets erscheinen als „••••“. Ideal in Bahn und Café." checked=${!!p.hideAmounts} onChange=${(v) => set({ hideAmounts: v }, 'privacy.toggle')} />
        ${props.showPreview && giro && html`<div class="tk-fnv__prev" data-qa="privacy-preview"><${Tile} icon="credit-card" tone=${1} size=${34} /><span class="tk-fn-grow tk-fn-title">${giro.name}</span><strong class="tk-fn-num">${eur(c, giro.balance)}</strong><${Badge} tone=${p.hideAmounts ? 'success' : 'neutral'}>${p.hideAmounts ? 'ausgeblendet' : 'sichtbar'}<//></div>`}
        <${Row} label="Zum Einblenden antippen" hint="Ein Betrag erscheint für 3 Sekunden." checked=${!!p.tapReveal} onChange=${(v) => set({ tapReveal: v }, 'privacy.toggle')} />
        <${Row} label="In Mitteilungen ausblenden" hint="Auf dem Sperrbildschirm erscheint kein Betrag." checked=${!!p.hideInNotifications} onChange=${(v) => set({ hideInNotifications: v }, 'privacy.toggle')} />
        <${Row} label="Im App-Wechsler verbergen" checked=${!!p.hideInSwitcher} onChange=${(v) => set({ hideInSwitcher: v }, 'privacy.toggle')} /></div>
      <div class="tk-fnv__sec"><span class="tk-fn-cap">App-Sperre für Finanzen</span>
        <${Row} label="Finanzen separat sperren" hint="Beim Öffnen des Moduls fragt TAKT nach Biometrie oder PIN." checked=${!!p.lock} onChange=${(v) => set({ lock: v }, 'privacy.lock')} />
        ${p.lock && html`<div class="tk-fn-stack"><${Segmented} label="Methode" value=${p.lockMethod || 'biometrie'} onChange=${(v) => set({ lockMethod: v }, 'privacy.lock')} options=${[{ value: 'biometrie', label: 'Biometrie', icon: 'fingerprint' }, { value: 'pin', label: 'PIN', icon: 'key-round' }]} />
          <label class="tk-field"><span class="tk-field__label">Sperren</span><${Select} value=${String(p.lockAfterMin ?? 1)} onChange=${(v) => set({ lockAfterMin: Number(v) }, 'privacy.lock')} options=${AFTER} aria-label="Sperren nach" /></label>
          <div><${Button} size="sm" icon="lock" onClick=${() => { test(); ctx.emit('privacy.test'); }}>Sperre testen<//></div></div>`}</div>
      <div class="tk-fnv__sec"><span class="tk-fn-cap">Berechnung</span><label class="tk-field"><span class="tk-field__label">Puffer bei „frei verfügbar“ (€)</span><${Input} inputmode="decimal" value=${reserve} onInput=${(v) => { setReserve(v); set({ reserve: num(v) }, 'privacy.reserve'); }} aria-label="Puffer in Euro" /></label><span class="tk-fn-sub">Dieser Betrag zählt nie als frei verfügbar.</span></div>
      <div class="tk-fnv__sec"><span class="tk-fn-cap">Lokale Daten</span><div class="tk-fnv__prev" style="border-style:solid"><${Icon} name="database" size=${18} /><span class="tk-fn-grow">Alle Finanzdaten liegen auf deinem Gerät. In der Demo sind sie fiktiv.</span></div>
        <div class="tk-fn-actions"><${Button} icon="download" onClick=${() => { ctx.emit('privacy.export'); ctx.toast('Export vorbereitet (Simulation)'); }}>Als CSV exportieren<//><${Button} variant="ghost" icon="trash-2" onClick=${del}>Finanzdaten löschen<//></div></div></div><//>`;
  },
};
export default [finPrivacyPanel];
