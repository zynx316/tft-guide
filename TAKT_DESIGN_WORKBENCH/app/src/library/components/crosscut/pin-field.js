// PIN-Feld mit Ziffernblock: Entsperren (mit Biometrie-Simulation, Fehlversuchen, „PIN vergessen“) oder neue PIN festlegen.
import { html } from '../../../lib/html.js';
import { useState, useEffect } from 'preact/hooks';
import { Icon, Button } from '../../ui.js';
import { fmtTime, fmtDate } from '../../../lib/format.js';
import { WEEKDAYS_LONG, isoWeekday } from '../../../lib/date.js';
import { XC_CSS } from './_xc-css.js';

const CSS = `
  .tk-xc-pin { display: flex; flex-direction: column; align-items: center; gap: var(--tk-space-5); padding: var(--tk-space-6) var(--tk-space-4); border-radius: var(--tk-radius-xl); border: 1px solid var(--tk-c-border); background: var(--tk-c-surface); min-width: 0; }
  .tk-xc-pin--lockscreen { background: linear-gradient(180deg, var(--tk-c-accent-soft), var(--tk-c-surface) 60%); }
  .tk-xc-pin__clock { display: flex; flex-direction: column; align-items: center; gap: 2px; }
  .tk-xc-pin__clock strong { font-size: 52px; line-height: 1; font-weight: var(--tk-fw-bold); letter-spacing: var(--tk-ls-tight); font-variant-numeric: tabular-nums; }
  .tk-xc-pin__clock span { color: var(--tk-c-text-muted); }
  .tk-xc-pin__title { display: flex; align-items: center; gap: var(--tk-space-2); font-weight: var(--tk-fw-semibold); font-size: var(--tk-fs-lg); text-align: center; }
  .tk-xc-pin__dots { display: flex; gap: var(--tk-space-4); height: 20px; }
  .tk-xc-pin__dots i { width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--tk-c-border-strong); }
  .tk-xc-pin__dots i[data-on="true"] { background: var(--tk-c-accent); border-color: var(--tk-c-accent); }
  .tk-xc-pin__dots[data-err="true"] { animation: tk-xc-shake .4s; }
  .tk-xc-pin__dots[data-err="true"] i { border-color: var(--tk-c-danger); background: var(--tk-c-danger); }
  @keyframes tk-xc-shake { 20% { transform: translateX(-8px); } 40% { transform: translateX(8px); } 60% { transform: translateX(-5px); } 80% { transform: translateX(5px); } }
  @media (prefers-reduced-motion: reduce) { .tk-xc-pin__dots[data-err="true"] { animation: none; } }
  .tk-xc-pin__msg { min-height: 20px; margin: 0; text-align: center; font-size: var(--tk-fs-sm); color: var(--tk-c-text-muted); }
  .tk-xc-pin__msg[data-tone="danger"] { color: var(--tk-c-danger); }
  .tk-xc-pin__pad { display: grid; grid-template-columns: repeat(3, 68px); gap: var(--tk-space-3) var(--tk-space-4); }
  .tk-xc-pin__key { width: 68px; height: 68px; border-radius: 50%; border: 1px solid var(--tk-c-border-strong); background: var(--tk-c-surface2); color: var(--tk-c-text); font: inherit; font-size: 26px; font-weight: var(--tk-fw-medium); display: grid; place-items: center; cursor: pointer; }
  .tk-xc-pin__key:hover { background: var(--tk-c-surface3); }
  .tk-xc-pin__key:active { background: var(--tk-c-accent-soft); }
  .tk-xc-pin__key--ghost { border-color: transparent; background: none; color: var(--tk-c-text-muted); }
  .tk-xc-pin__key[disabled] { opacity: .4; cursor: default; }
  .tk-xc-pin__ok { display: flex; flex-direction: column; align-items: center; gap: var(--tk-space-3); text-align: center; padding: var(--tk-space-4) 0; }
  .tk-xc-pin__ok > span { width: 64px; height: 64px; border-radius: 50%; display: grid; place-items: center; background: var(--tk-c-success-soft); color: var(--tk-c-success); }`;

export const pinField = {
  id: 'pin-field',
  name: 'PIN-Feld',
  category: 'Querschnitt',
  description: 'Ziffernblock für die App-Sperre: PIN eingeben mit Punkten, Fehlversuchen (nach drei Versuchen Wartezeit), Biometrie-Simulation und „PIN vergessen“. Modus „Festlegen“ fragt die neue PIN zweimal. Demo-PIN ist 1234.',
  version: '1.0',
  props: [
    { name: 'mode', label: 'Modus', type: 'select', options: ['unlock', 'set'], default: 'unlock' },
    { name: 'length', label: 'Stellen', type: 'number', default: 4 },
    { name: 'lockScreen', label: 'Mit Uhr und Datum', type: 'boolean', default: false },
    { name: 'biometric', label: 'Biometrie anbieten', type: 'boolean', default: true },
    { name: 'demoPin', label: 'Demo-PIN', type: 'text', default: '1234' },
    { name: 'title', label: 'Titel', type: 'text', default: 'TAKT ist gesperrt' },
  ],
  data: [],
  events: ['pin.digit', 'pin.success', 'pin.error', 'pin.biometric', 'pin.forgot', 'pin.set', 'pin.relock'],
  states: [],
  flutter: { widget: 'TaktPinPad', propMap: { mode: 'mode', length: 'pinLength', biometric: 'allowBiometrics', lockScreen: 'showClock' }, events: { 'pin.success': 'onUnlocked', 'pin.error': 'onWrongPin', 'pin.biometric': 'onBiometric' } },
  a11y: { role: 'group', nameFrom: 'Titel' },
  css: XC_CSS + CSS,
  example: { props: { lockScreen: true } },
  render: function PinField({ props, ctx }) {
    const len = Math.max(4, Math.min(8, Number(props.length) || 4));
    const [pin, setPin] = useState('');
    const [first, setFirst] = useState(null);       // Modus „Festlegen“: erste Eingabe
    const [err, setErr] = useState(false);
    const [tries, setTries] = useState(0);
    const [scan, setScan] = useState(false);
    const [ok, setOk] = useState(false);
    const locked = tries >= 3;
    useEffect(() => { if (!scan) return undefined; const t = setTimeout(() => { setScan(false); setOk(true); ctx.emit('pin.success', { via: 'biometric' }); }, 900); return () => clearTimeout(t); }, [scan]);
    useEffect(() => { if (!err) return undefined; const t = setTimeout(() => { setErr(false); setPin(''); }, 600); return () => clearTimeout(t); }, [err]);
    const done = (value) => {
      if (props.mode === 'set') {
        if (first == null) { setFirst(value); setPin(''); return; }
        if (first === value) { setOk(true); ctx.emit('pin.set'); ctx.toast('PIN gespeichert'); } else { setErr(true); setFirst(null); ctx.emit('pin.error', { reason: 'mismatch' }); }
        return;
      }
      if (value === String(props.demoPin)) { setOk(true); ctx.emit('pin.success', { via: 'pin' }); } else { setErr(true); setTries((n) => n + 1); ctx.emit('pin.error', { tries: tries + 1 }); }
    };
    const press = (d) => { if (locked || err || scan || pin.length >= len) return; const v = pin + d; setPin(v); ctx.emit('pin.digit'); if (v.length === len) done(v); };
    const del = () => { if (!err && !locked) setPin(pin.slice(0, -1)); };
    const onKey = (e) => { if (/^\d$/.test(e.key)) press(e.key); else if (e.key === 'Backspace') del(); };
    const reset = () => { setOk(false); setPin(''); setTries(0); setFirst(null); ctx.emit('pin.relock'); };
    const forgot = () => { ctx.emit('pin.forgot'); ctx.openDialog({ title: 'PIN vergessen?', body: () => html`<p style="margin:0">Ohne PIN lässt sich TAKT nur durch Zurücksetzen entsperren. Deine Daten bleiben erhalten, wenn du eine Sicherung hast. Alles andere wird gelöscht.</p>`, footer: (close) => html`<${Button} onClick=${close}>Abbrechen<//><${Button} variant="danger" onClick=${close}>Zurücksetzen<//>` }); };
    const t = ctx.today;
    const msg = ok ? '' : err ? (props.mode === 'set' ? 'Die PINs stimmen nicht überein. Beginne neu.' : `PIN falsch. ${3 - tries > 0 ? `Noch ${3 - tries} ${3 - tries === 1 ? 'Versuch' : 'Versuche'}.` : ''}`) : locked ? 'Zu viele Versuche. Warte 30 Sekunden.' : scan ? 'Fingerabdruck wird geprüft …' : props.mode === 'set' ? (first == null ? 'Neue PIN wählen' : 'PIN wiederholen') : `PIN eingeben (Demo: ${props.demoPin})`;
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
    if (ok) return html`<div class=${`tk-xc-pin${props.lockScreen ? ' tk-xc-pin--lockscreen' : ''}`} data-qa="pin-field"><div class="tk-xc-pin__ok"><span><${Icon} name="check" size=${32} /></span><strong>${props.mode === 'set' ? 'PIN gespeichert' : 'Entsperrt'}</strong><p class="tk-xc-s" style="margin:0;text-align:center">${props.mode === 'set' ? 'Ab sofort fragt TAKT nach dieser PIN.' : 'Willkommen zurück.'}</p><${Button} icon="lock" onClick=${reset}>${props.mode === 'set' ? 'Nochmal festlegen' : 'Erneut sperren'}<//></div></div>`;
    return html`<div class=${`tk-xc-pin${props.lockScreen ? ' tk-xc-pin--lockscreen' : ''}`} data-qa="pin-field" role="group" aria-label=${props.title} tabindex="0" onKeyDown=${onKey}>
      ${props.lockScreen && html`<div class="tk-xc-pin__clock"><strong>${fmtTime(t)}</strong><span>${WEEKDAYS_LONG[isoWeekday(t) - 1]}, ${fmtDate(t, { style: 'long' })}</span></div>`}
      <div class="tk-xc-pin__title"><${Icon} name=${props.mode === 'set' ? 'key-round' : 'lock'} size=${20} />${props.mode === 'set' ? 'PIN festlegen' : props.title}</div>
      <div class="tk-xc-pin__dots" data-err=${err ? 'true' : undefined} role="img" aria-label=${`${pin.length} von ${len} Ziffern`}>${Array.from({ length: len }, (_, i) => html`<i key=${i} data-on=${i < pin.length ? 'true' : 'false'}></i>`)}</div>
      <p class="tk-xc-pin__msg" role="status" data-tone=${err || locked ? 'danger' : undefined}>${msg}</p>
      <div class="tk-xc-pin__pad">${keys.map((d) => html`<button type="button" class="tk-xc-pin__key" key=${d} disabled=${locked} onClick=${() => press(d)} aria-label=${d}>${d}</button>`)}
        ${props.biometric && props.mode !== 'set' ? html`<button type="button" class="tk-xc-pin__key tk-xc-pin__key--ghost" disabled=${locked} aria-label="Mit Fingerabdruck entsperren" onClick=${() => { ctx.emit('pin.biometric'); setScan(true); }}><${Icon} name="fingerprint" size=${28} /></button>` : html`<span></span>`}
        <button type="button" class="tk-xc-pin__key" disabled=${locked} onClick=${() => press('0')} aria-label="0">0</button>
        <button type="button" class="tk-xc-pin__key tk-xc-pin__key--ghost" aria-label="Ziffer löschen" onClick=${del}><${Icon} name="arrow-left" size=${24} /></button></div>
      ${props.mode !== 'set' && html`<button type="button" class="tk-xc-link" onClick=${forgot}>PIN vergessen?</button>`}
      ${locked && html`<button type="button" class="tk-xc-link" onClick=${reset}>Demo zurücksetzen</button>`}</div>`;
  },
};
export default pinField;
