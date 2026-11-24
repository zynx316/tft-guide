// „Kündigung vorbereiten“: Textvorlage im Dialog. TAKT versendet nichts und gibt keine Rechtsberatung – der Text lässt sich kopieren
// oder als Aufgabe merken (Welt `tasks`, nur im App-Modus). Frist, Anschrift und Wortlaut prüfst du im Vertrag.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Button, Textarea, Icon } from '../../ui.js';
import { fmtDate } from '../../../lib/format.js';
import { addDays, toIsoDay } from '../../../lib/date.js';

/** Vorlage als Text: Kündigung zum Vertragsende (falls bekannt) und hilfsweise zum nächstmöglichen Zeitpunkt. */
const hasNo = (n) => n && n !== '–';
export const maskedNo = (n) => hasNo(n) && /[•*]/.test(n);
export function cancelText(c, name) {
  const no = hasNo(c.customerNo) ? (maskedNo(c.customerNo) ? '[bitte eintragen]' : c.customerNo) : '';
  const noSub = no ? `, Kundennummer ${no}` : '', noIn = no ? ` (Kundennummer ${no})` : '';
  const when = c.endsOn ? `zum ${fmtDate(c.endsOn)}` : 'zum nächstmöglichen Zeitpunkt';
  return [
    `Betreff: Kündigung ${c.kind === 'Versicherung' ? 'meiner Versicherung' : 'meines Vertrags'} „${c.name}“${noSub}`, '',
    'Sehr geehrte Damen und Herren,', '',
    `hiermit kündige ich ${c.kind === 'Versicherung' ? 'meine Versicherung' : 'meinen Vertrag'} „${c.name}“${noIn} fristgerecht ${when}${c.endsOn ? ', hilfsweise zum nächstmöglichen Zeitpunkt' : ''}.`, '',
    'Bitte bestätigen Sie mir die Kündigung und den Beendigungstermin schriftlich.', '',
    'Mit freundlichen Grüßen', name || '[Vorname Nachname]', '[Straße und Hausnummer, PLZ Ort]',
  ].join('\n');
}

function Draft({ ctx, c, close, name }) {
  const [text, setText] = useState(() => cancelText(c, name));
  const copy = () => { try { navigator.clipboard?.writeText(text); } catch { /* Zwischenablage nicht verfügbar */ } ctx.emit('contract.cancel.copy', { id: c.id }); ctx.toast('Text kopiert. Es wurde nichts gesendet.'); };
  const remember = () => {
    const due = c.cancelBy ? toIsoDay(addDays(c.cancelBy, -2)) : toIsoDay(addDays(ctx.today, 3));
    const task = { id: ctx.newId('t-kuend'), title: `Kündigung senden: ${c.name}`, due, priority: c.cancelBy ? 'hoch' : 'mittel', project: 'Finanzen', category: 'Finanzen', status: 'Offen', estimate: 15, subtasks: [], note: 'Aus Dokumente & Verträge. Text liegt als Vorlage bereit.' };
    if (ctx.world) ctx.world.add('tasks', task);
    ctx.emit('contract.cancel.task', { id: c.id }); ctx.toast(ctx.world ? `Aufgabe angelegt, fällig ${fmtDate(due, { style: 'weekday' })}` : 'Aufgabe würde angelegt');
    close();
  };
  return html`<div class="tk-dok-col">
    <p class="tk-dok-sub" role="note"><${Icon} name="info" size=${14} /> Textvorlage, keine Rechtsberatung. Prüfe Frist und Anschrift im Vertrag. Gesendet wird nichts.</p>
    ${c.cancelTo && html`<p class="tk-dok-sub"><b>Kündigung an:</b> ${c.cancelTo}</p>`}
    ${maskedNo(c.customerNo) && html`<p class="tk-dok-sub" role="note"><b>Kundennummer:</b> Trag die Nummer aus dem Vertrag bei „[bitte eintragen]“ ein. Aus Datenschutz zeigt TAKT sie hier nicht im Klartext.</p>`}
    <${Textarea} value=${text} onInput=${setText} rows="11" aria-label="Text der Kündigung" />
    <div class="tk-dok-btns"><${Button} variant="primary" icon="copy" onClick=${copy}>Text kopieren<//><${Button} icon="list-checks" onClick=${remember}>Als Aufgabe merken<//><${Button} variant="ghost" onClick=${close}>Schließen<//></div>
  </div>`;
}

/** Dialog „Kündigung vorbereiten“. Nicht kündbare Verträge (z. B. Miete) bekommen keine Vorlage, nur den Hinweis. */
export function openCancelDraft(ctx, c) {
  ctx.emit('contract.cancel', { id: c.id });
  const name = ctx.world?.get('persona')?.name;
  ctx.openDialog({ title: `Kündigung vorbereiten: ${c.name}`, body: (close) => html`<${Draft} ctx=${ctx} c=${c} close=${close} name=${name} />` });
}
