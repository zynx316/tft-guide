// Trading – Formular „Kursalarm anlegen“: Wertpapier, Richtung, Kursmarke mit Abstand zum aktuellen Kurs und Prüfung.
import { html } from '../../../lib/html.js';
import { useState, useEffect } from 'preact/hooks';
import { Button, Field, Input, Select, Segmented } from '../../ui.js';
import { fmtPercent, fmtNumber } from '../../../lib/format.js';
import { arr } from './_calc.js';
import { isoDay } from '../../../lib/util.js';

const num = (s) => parseFloat(String(s).replace(/\./g, '').replace(',', '.'));

export function AlertForm({ data, setData, ctx, compact, onDone }) {
  const insts = arr(data.instruments);
  const [sec, setSec] = useState(() => (insts.find((i) => i.id === ctx.ui.selectedId) || insts[0] || {}).id || '');
  const [dir, setDir] = useState('below'), [val, setVal] = useState(''), [err, setErr] = useState('');
  useEffect(() => { if (insts.some((i) => i.id === ctx.ui.selectedId)) setSec(ctx.ui.selectedId); }, [ctx.ui.selectedId]);
  const inst = insts.find((i) => i.id === sec), v = num(val), dist = inst && v > 0 ? (v - inst.price) / inst.price : null;
  const submit = (e) => {
    e && e.preventDefault();
    let m = '';
    if (!inst) m = 'Bitte ein Wertpapier wählen.';
    else if (!(v > 0)) m = 'Bitte eine Kursmarke größer 0 eingeben, zum Beispiel 120,50.';
    else if (dir === 'above' && v <= inst.price) m = `Der Kurs liegt bereits bei ${fmtNumber(inst.price, { digits: 2 })} €. Für „über“ ist eine höhere Marke nötig.`;
    else if (dir === 'below' && v >= inst.price) m = `Der Kurs liegt bereits bei ${fmtNumber(inst.price, { digits: 2 })} €. Für „unter“ ist eine niedrigere Marke nötig.`;
    else if (arr(data.alerts).some((a) => a.securityId === sec && a.dir === dir && a.price === v && a.status === 'aktiv')) m = 'Diesen Alarm gibt es schon.';
    setErr(m); if (m) { ctx.emit('alert.invalid', { message: m }); return; }
    const a = { id: ctx.newId ? ctx.newId('al') : `al-${arr(data.alerts).length + 1}`, securityId: sec, dir, price: v, status: 'aktiv', created: isoDay(ctx.today), user: true };
    setData('alerts', (l) => [a, ...arr(l)]); ctx.emit('alert.create', { id: sec, dir, price: v }); ctx.toast(`Alarm für ${inst.short || inst.name} angelegt`); setVal(''); setErr(''); onDone && onDone(a);
  };
  const ph = inst ? fmtNumber(inst.price * (dir === 'above' ? 1.05 : 0.95), { digits: inst.price >= 5000 ? 0 : 2 }) : '';
  return html`<form class=${`tk-trd-af ${compact ? 'tk-trd-af--c' : ''}`} onSubmit=${submit} novalidate>
    <${Field} label="Wertpapier"><${Select} value=${sec} onChange=${(x) => { setSec(x); setErr(''); }} options=${insts.map((i) => ({ value: i.id, label: i.short || i.name }))} aria-label="Wertpapier" /><//>
    <div class="tk-col" style="gap:6px"><span class="tk-field__label">Wenn der Kurs …</span><${Segmented} label="Richtung" value=${dir} onChange=${(x) => { setDir(x); setErr(''); }} options=${[{ value: 'below', label: 'fällt unter', icon: 'trending-down' }, { value: 'above', label: 'steigt über', icon: 'trending-up' }]} /></div>
    <${Field} label="Kursmarke (€)" error=${err} hint=${inst ? `Aktuell ${fmtNumber(inst.price, { digits: 2 })} €${dist != null ? ` · Abstand ${fmtPercent(Math.abs(dist), { digits: 1 })}` : ''}` : ''}><${Input} type="text" inputmode="decimal" value=${val} onInput=${(x) => { setVal(x); setErr(''); }} invalid=${!!err} placeholder=${ph} aria-label="Kursmarke in Euro" /><//>
    <${Button} variant="primary" type="submit" icon="bell">Alarm anlegen<//></form>`;
}
export const AF_CSS = `.tk-trd-af { display:grid; grid-template-columns:minmax(0,1.2fr) auto minmax(0,1fr) auto; gap:var(--tk-space-3); align-items:start; } .tk-trd-af .tk-btn[type="submit"] { align-self:end; }
  .tk-trd-af--c, .bp-mobile .tk-trd-af, .bp-tablet .tk-trd-af { grid-template-columns:minmax(0,1fr); } .tk-trd-af--c .tk-btn[type="submit"] { width:100%; }`;
