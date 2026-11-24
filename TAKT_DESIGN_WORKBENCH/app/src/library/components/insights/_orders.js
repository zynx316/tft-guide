// Vertrieb: gemeinsame Bausteine der Bestell-Komponenten (Versand-Formular, Summen, Schritte).
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Button, Field, Input, Select } from '../../ui.js';

export const STEPS = ['new', 'paid', 'shipped', 'delivered'];
export const CARRIERS = ['DHL', 'DPD', 'Hermes'];
/** Summe der Positionen, kaufmännisch auf Cent gerundet. */
export const sumLines = (o) => Math.round(((o.lines || []).reduce((s, l) => s + l.qty * l.price, 0)) * 100) / 100;

/** Dialoginhalt „Versenden“: Paketdienst und Sendungsnummer (ohne Nummer nicht bestätigbar). */
export function ShipForm({ o, onSave, close }) {
  const [carrier, setCarrier] = useState(o.carrier || 'DHL'); const [track, setTrack] = useState(o.tracking || `0034043412${String(o.number).replace(/\D/g, '')}`);
  return html`<div class="tk-col" style="gap:12px"><${Field} label="Paketdienst"><${Select} value=${carrier} options=${CARRIERS} onChange=${setCarrier} /><//><${Field} label="Sendungsnummer" error=${track.trim() ? '' : 'Sendungsnummer fehlt.'}><${Input} value=${track} onInput=${setTrack} invalid=${!track.trim()} /><//>
    <div class="tk-row" style="justify-content:flex-end"><${Button} onClick=${close}>Abbrechen<//><${Button} variant="primary" icon="truck" disabled=${!track.trim()} onClick=${() => { onSave(carrier, track.trim()); close(); }}>Als versendet markieren<//></div></div>`;
}
