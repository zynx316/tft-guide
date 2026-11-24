// Modul "Wetter" – Vorhersage für Standort und gemerkte Orte (Annahme, in Phase 1 gegen Modulregister verifizieren)
const L = (...lines) => lines.join('\n');
const p2 = (n) => String(n).padStart(2, '0');

// --- Demo-Daten rund um Di 24.11.2026 09:30, Standort Bielefeld (Novemberwerte) -------------------------
const DAY_PLAN = {
  '2026-11-24': { mid: 5.2, amp: 1.9, wind: [14, 20], codes: (h) => (h < 10 ? 'cloudy' : h < 13 ? 'partly' : h < 19 ? 'drizzle' : 'cloudy') },
  '2026-11-25': { mid: 5, amp: 1, wind: [26, 46], codes: (h) => (h < 5 ? 'cloudy' : h < 21 ? 'rain' : 'drizzle') },
  '2026-11-26': { mid: 2.5, amp: 2.5, wind: [10, 18], codes: (h) => (h < 7 || h >= 17 ? 'clear' : 'sun') },
};
const POP = { sun: 0, clear: 0, partly: 10, cloudy: 15, drizzle: 50, rain: 85 };
const PRECIP = { drizzle: 0.3, rain: 0.9 };

const hours = [];
for (const [date, plan] of Object.entries(DAY_PLAN)) {
  for (let h = 0; h < 24; h++) {
    const code = plan.codes(h);
    const peak = date === '2026-11-25' ? Math.max(0, 1 - Math.abs(h - 16) / 6) : Math.max(0, 1 - Math.abs(h - 14) / 8);
    hours.push({
      time: `${date}T${p2(h)}:00:00`,
      temp: Math.round(plan.mid + plan.amp * Math.sin(((h - 9) / 24) * 2 * Math.PI)),
      code,
      precip: code === 'rain' && date === '2026-11-25' && h >= 12 && h <= 19 ? 1.4 : PRECIP[code] || 0,
      pop: Math.min(100, (POP[code] || 0) + (code === 'rain' ? Math.round(peak * 10) : 0)),
      wind: Math.round(plan.wind[0] + (plan.wind[1] - plan.wind[0]) * peak),
    });
  }
}

const current = {
  location: 'Bielefeld', updated: '2026-11-24T09:15:00', temp: 5, feels: 2, code: 'cloudy', high: 7, low: 3,
  wind: 18, windDir: 'SW', gust: 34, precip: 0.2, pop: 30, humidity: 84, pressure: 1012, uv: 1, sunrise: '07:52', sunset: '16:28',
  summary: 'Meist trüb, am Nachmittag vereinzelt Nieselregen. Morgen wird es stürmisch – Böen bis 75 km/h.',
};

const daily = [
  { date: '2026-11-24', code: 'cloudy', min: 3, max: 7, pop: 30, precip: 1.2 },
  { date: '2026-11-25', code: 'rain', min: 4, max: 6, pop: 90, precip: 9.4 },
  { date: '2026-11-26', code: 'sun', min: 0, max: 5, pop: 0, precip: 0 },
  { date: '2026-11-27', code: 'partly', min: -1, max: 4, pop: 10, precip: 0 },
  { date: '2026-11-28', code: 'snow', min: -2, max: 2, pop: 60, precip: 3.1 },
  { date: '2026-11-29', code: 'cloudy', min: 0, max: 3, pop: 20, precip: 0.2 },
  { date: '2026-11-30', code: 'drizzle', min: 1, max: 5, pop: 50, precip: 1.8 },
  { date: '2026-12-01', code: 'rain', min: 3, max: 7, pop: 70, precip: 5.6 },
  { date: '2026-12-02', code: 'partly', min: 2, max: 6, pop: 20, precip: 0 },
  { date: '2026-12-03', code: 'fog', min: 1, max: 5, pop: 10, precip: 0 },
];

const alerts = [
  { id: 'w1', severity: 'moderate', title: 'Markante Sturmböen', text: 'Am Mittwoch sind aus Südwest Böen bis 75 km/h (Bft 9) zu erwarten, exponiert auch Sturmböen. Lose Gegenstände sichern, Aufenthalt im Freien und unter Bäumen meiden.', from: '2026-11-25T13:00:00', to: '2026-11-25T21:00:00', area: 'Kreis Bielefeld' },
  { id: 'w2', severity: 'minor', title: 'Leichter Frost', text: 'In der Nacht zum Freitag Tiefstwerte um −2 °C, örtlich Reifglätte auf Brücken und Radwegen.', from: '2026-11-26T22:00:00', to: '2026-11-27T08:00:00', area: 'Kreis Bielefeld' },
];

const locations = [
  { id: 'l1', title: 'Bielefeld', subtitle: 'Aktueller Standort · bewölkt', meta: '5°', badge: 'Standort', tone: 'accent', icon: 'map-pin' },
  { id: 'l2', title: 'Hamburg', subtitle: 'Regen · 4° / 8°', meta: '6°', badge: 'Gemerkt', tone: 'neutral', icon: 'cloud-rain' },
  { id: 'l3', title: 'München', subtitle: 'Teils bewölkt · 1° / 6°', meta: '3°', badge: 'Gemerkt', tone: 'neutral', icon: 'cloud-sun' },
  { id: 'l4', title: 'Lissabon', subtitle: 'Reiseziel ab 12.12. · sonnig', meta: '15°', badge: 'Reise', tone: 'warning', icon: 'plane' },
];

const hdr = (props) => ({ id: 'hdr', component: 'page-header', region: 'header', props });
const data = { current, hours, daily, alerts, locations };

export default {
  module: {
    id: 'weather', name: 'Wetter', icon: 'cloud-sun', status: 'concept', theme: 'graphite', designVersion: '0.1',
    description: 'Aktuelles Wetter, Stunden- und Tagesvorhersage sowie Warnungen für den eigenen Standort und gemerkte Orte.',
    source: 'Annahme der Workbench – in Phase 1 gegen das TAKT-Modulregister verifizieren',
    infoArchitecture: 'Einstieg: aktuelles Wetter mit Warnungen. Darunter Stundenverlauf (24 h) und Tagesvorhersage (7–10 Tage). Auswahl eines Tages steuert den Stundenverlauf. Orte verwalten und Warnungen sind eigene Features.',
    docs: L('**Annahmen**', '- Wetterdaten kommen von einem externen Dienst; Warnungen amtlich (z. B. DWD).', '- Standard ist der aktuelle Standort; weitere Orte sind gemerkt.', '- Temperatur in °C, Wind in km/h, Niederschlag in mm.', '', '**Offene Fragen**', '- Welcher Wetterdienst ist im bestehenden TAKT angebunden?', '- Push-Benachrichtigungen bei Unwetterwarnungen gewünscht?', '- Sollen Wetterhinweise im Kalender (Outdoor-Termine) auftauchen?'),
    links: ['home', 'calendar', 'fitness'],
  },
  features: [
    {
      id: 'weather.current', name: 'Aktuelles Wetter', group: 'Vorhersage', status: 'released',
      purpose: 'Auf einen Blick wissen, wie das Wetter jetzt ist und ob in den nächsten Stunden etwas zu beachten ist.',
      requirements: [
        { text: 'Aktuelle Temperatur, gefühlte Temperatur und Zustand mit Icon groß darstellen', type: 'info', priority: 'must' },
        { text: 'Wind (mit Böen), Niederschlag und Luftfeuchte als Detailwerte', type: 'info', priority: 'must' },
        { text: 'Standort und Aktualisierungszeit sichtbar; manuelles Aktualisieren', type: 'action', priority: 'must' },
        { text: 'Warnungen sind prominent und nach Schweregrad unterscheidbar', type: 'rule', priority: 'must' },
        { text: 'Stunden- und Tagesverlauf direkt darunter erreichbar', type: 'info', priority: 'should' },
        { text: 'Leer- und Fehlerzustand, wenn keine Wetterdaten vorliegen', type: 'state', priority: 'must' },
        { text: 'Auf Mobile ohne horizontales Scrollen der Seite; nur der Stundenverlauf scrollt in sich', type: 'rule', priority: 'must' },
      ],
      interactions: [
        { trigger: 'Aktualisieren antippen', result: 'Werte werden neu geladen, Toast „Wetter aktualisiert“', event: 'weather.refresh' },
        { trigger: 'Detailwert antippen', result: 'Detail zum Wert (z. B. Windverlauf)', event: 'weather.detail' },
        { trigger: 'Stunde antippen', result: 'Detailzeile zeigt Zustand, Temperatur, Wind, Regen', event: 'weather.hour' },
        { trigger: 'Tag antippen', result: 'Stundenverlauf zeigt diesen Tag', event: 'weather.day' },
        { trigger: 'Warnung antippen', result: 'Warntext klappt auf', event: 'weather.alert.open' },
      ],
      viewports: ['desktop', 'notebook', 'tablet', 'mobile'],
      demoData: data,
      variants: [
        {
          id: 'A', name: 'Dashboard-Raster', concept: 'Alles gleichzeitig sichtbar: Aktuelles Wetter links, Warnungen rechts, darunter Stundenkurve und Tageskacheln. Auswahl eines Tages steuert die Stundenansicht.',
          description: '+ Maximale Übersicht auf Desktop und Tablet  − Auf Mobile eine lange, dichte Seite',
          layout: { type: 'grid' },
          blocks: [
            hdr({ eyebrow: 'Wetter', title: 'Bielefeld', subtitle: 'Dienstag, 24. November', primaryLabel: 'Orte', primaryIcon: 'map-pin', primaryEvent: 'weather.locations' }),
            { id: 'now', component: 'weather-now', region: 'main', span: 7, props: { layout: 'hero' } },
            { id: 'alerts', component: 'weather-alerts', region: 'main', span: 5, props: { title: 'Warnungen', expandFirst: true } },
            { id: 'hourly', component: 'weather-hourly', region: 'main', span: 12, props: { title: 'Stündlich', count: 24 } },
            { id: 'daily', component: 'weather-daily', region: 'main', span: 12, props: { title: '7-Tage-Vorhersage', days: 7, layout: 'tiles' } },
          ],
        },
        {
          id: 'B', name: 'Erzählerischer Feed', concept: 'Eine ruhige Spalte, die das Wetter „erzählt“: erst der wichtigste Hinweis (Sturm morgen), dann kompakt das Jetzt, die nächsten Stunden und die kommenden Tage.',
          description: '+ Klare Priorisierung, sehr gut mit dem Daumen lesbar  − Weniger Details gleichzeitig, kein Warnungsüberblick',
          layout: { type: 'stack', narrow: true },
          blocks: [
            hdr({ title: 'Heute in Bielefeld', subtitle: 'Di, 24. November · 09:15 Uhr', primaryLabel: '' }),
            { id: 'note', component: 'notice-banner', region: 'main', props: { tone: 'warning', title: 'Morgen Sturmböen bis 75 km/h', text: 'Mittwoch zwischen 13 und 21 Uhr. Fahrrad lieber stehen lassen.', actionLabel: 'Details', dismissible: false } },
            { id: 'now', component: 'weather-now', region: 'main', props: { layout: 'compact', showDetails: false, showSun: false } },
            { id: 'hourly', component: 'weather-hourly', region: 'main', props: { title: 'Nächste Stunden', count: 12, showDetail: false } },
            { id: 'daily', component: 'weather-daily', region: 'main', props: { title: 'Die nächsten Tage', days: 5, layout: 'list' } },
          ],
        },
      ],
      selectedVariantId: 'A',
      links: ['weather.hourly', 'weather.daily', 'weather.alerts'],
      seedHistory: [
        { kind: 'draft', note: 'Erster Entwurf: Dashboard und Feed' },
        { kind: 'review', note: 'Zur Prüfung: Hierarchie Warnungen vs. Aktuelles' },
        { kind: 'release', note: 'Freigabe von Variante A (Dashboard-Raster)' },
      ],
    },
    {
      id: 'weather.hourly', name: 'Stündliche Vorhersage', group: 'Vorhersage', status: 'design',
      purpose: 'Den Tagesverlauf planen: Wann wird es kälter, wann regnet es, wie windig wird es?',
      requirements: [
        { text: 'Temperaturkurve mit Zustands-Icon, Uhrzeit und Regenwahrscheinlichkeit je Stunde', type: 'info', priority: 'must' },
        { text: 'Niederschlagsbalken (mm) unter der Kurve', type: 'info', priority: 'should' },
        { text: 'Stunde auswählen zeigt Details (Wind, Niederschlag)', type: 'action', priority: 'should' },
        { text: 'Auf Mobile scrollt nur der Verlauf horizontal, nicht die Seite', type: 'rule', priority: 'must' },
        { text: 'Zeigt wahlweise die nächsten 24 Stunden oder einen gewählten Tag', type: 'rule', priority: 'should' },
      ],
      interactions: [
        { trigger: 'Stunde antippen', result: 'Detailzeile aktualisiert sich', event: 'weather.hour' },
        { trigger: 'Tag in der Vorhersage wählen', result: 'Stundenverlauf wechselt auf diesen Tag', event: 'weather.day' },
        { trigger: '„Ab jetzt“ antippen', result: 'Zurück zu den nächsten Stunden', event: 'weather.day' },
      ],
      viewports: ['desktop', 'tablet', 'mobile'],
      demoData: data,
      variants: [{
        id: 'A', name: 'Tag wählen, Stunden sehen', concept: 'Oben die Tageskacheln als Datumswähler, darunter der Stundenverlauf des gewählten Tages mit Kurve und Niederschlagsbalken.',
        description: '+ Einfaches Mental Model (Tag → Stunden)  − Zwei Blöcke teilen sich einen Zustand, auf Mobile zwei Scroll-Ebenen',
        layout: { type: 'stack' },
        blocks: [
          hdr({ eyebrow: 'Wetter', title: 'Verlauf', subtitle: 'Bielefeld', primaryLabel: '' }),
          { id: 'days', component: 'weather-daily', region: 'main', props: { title: 'Tag wählen', days: 3, layout: 'tiles' } },
          { id: 'hourly', component: 'weather-hourly', region: 'main', props: { title: 'Stündlich', count: 24 } },
        ],
      }],
      selectedVariantId: 'A',
    },
    {
      id: 'weather.daily', name: '7-Tage-Vorhersage', group: 'Vorhersage', status: 'review',
      purpose: 'Die Woche überblicken: Welche Tage sind mild, nass oder frostig?',
      requirements: [
        { text: '7 bis 10 Tage mit Icon, Min/Max und Regenwahrscheinlichkeit', type: 'info', priority: 'must' },
        { text: 'Min/Max-Balken zeigen die Spanne relativ zum gesamten Zeitraum', type: 'info', priority: 'should' },
        { text: 'Tag antippen wählt ihn aus und steuert die Stundenansicht', type: 'action', priority: 'must' },
        { text: 'Heutiger Tag ist hervorgehoben und als „Heute“ benannt', type: 'rule', priority: 'should' },
      ],
      interactions: [{ trigger: 'Tag antippen', result: 'Tag wird gewählt, Stundenverlauf zeigt ihn', event: 'weather.day' }, { trigger: 'Stunde antippen', result: 'Detailzeile aktualisiert sich', event: 'weather.hour' }],
      viewports: ['desktop', 'tablet', 'mobile'],
      demoData: data,
      variants: [{
        id: 'A', name: 'Liste mit Balken + Stunden', concept: 'Links die Tagesliste mit Min/Max-Balken, rechts (auf Mobile darunter) die Stunden des gewählten Tages.',
        description: '+ Balken machen Unterschiede sofort sichtbar  − Auf Mobile zwei Abschnitte untereinander',
        layout: { type: 'split', even: true },
        blocks: [
          hdr({ eyebrow: 'Wetter', title: 'Die nächsten 10 Tage', subtitle: 'Bielefeld', primaryLabel: '' }),
          { id: 'daily', component: 'weather-daily', region: 'main', props: { title: '10-Tage-Vorhersage', days: 10, layout: 'list' } },
          { id: 'hourly', component: 'weather-hourly', region: 'aside', props: { title: 'Stunden des gewählten Tages', count: 12 } },
        ],
      }],
      selectedVariantId: 'A',
      seedHistory: [{ kind: 'draft', note: 'Liste mit Balken' }, { kind: 'review', note: 'Zur Prüfung: Zusammenspiel mit Stundenansicht' }],
    },
    {
      id: 'weather.locations', name: 'Orte verwalten', group: 'Orte', status: 'design',
      purpose: 'Weitere Orte (Heimat, Reiseziele) merken und schnell deren Wetter sehen.',
      requirements: [
        { text: 'Liste gemerkter Orte mit aktueller Temperatur und Kurzbeschreibung', type: 'info', priority: 'must' },
        { text: 'Ort per Schnelleingabe hinzufügen', type: 'action', priority: 'must' },
        { text: 'Aktueller Standort ist als solcher gekennzeichnet und nicht löschbar', type: 'rule', priority: 'should' },
        { text: 'Leerzustand ohne gemerkte Orte', type: 'state', priority: 'must' },
      ],
      interactions: [{ trigger: 'Ort eingeben + Enter', result: 'Ort erscheint oben in der Liste', event: 'quickadd.submit' }, { trigger: 'Ort antippen', result: 'Ort wird ausgewählt', event: 'item.open' }],
      viewports: ['desktop', 'mobile'],
      demoData: data,
      variants: [{
        id: 'A', name: 'Ortsliste mit Schnelleingabe', concept: 'Einfache Liste der Orte, Schnelleingabe unten fixiert (Daumenzone auf Mobile).',
        description: '+ Minimal und schnell  − Keine Kartenansicht',
        layout: { type: 'stack', narrow: true },
        blocks: [
          hdr({ title: 'Orte', subtitle: '4 gemerkte Orte', primaryLabel: '' }),
          { id: 'list', component: 'item-list', region: 'main', bind: { items: 'locations' }, props: { title: 'Gemerkte Orte', emptyTitle: 'Noch keine Orte' } },
          { id: 'add', component: 'quick-add', region: 'bottom', bind: { target: 'locations' }, props: { placeholder: 'Ort hinzufügen … (Enter)', defaults: ['icon=map-pin', 'badge=Gemerkt'], elevated: true } },
        ],
      }],
      selectedVariantId: 'A',
    },
    {
      id: 'weather.alerts', name: 'Unwetterwarnungen', group: 'Warnungen', status: 'analyzed',
      purpose: 'Rechtzeitig über amtliche Warnungen für den Standort informiert werden.',
      requirements: [
        { text: 'Warnungen nach Schweregrad (Hinweis, markant, Unwetter, extrem) unterscheiden', type: 'rule', priority: 'must' },
        { text: 'Zeitraum und Gebiet je Warnung; Details aufklappbar', type: 'info', priority: 'must' },
        { text: 'Optionale Push-Benachrichtigung ab Stufe „markant“', type: 'action', priority: 'could' },
      ],
      interactions: [{ trigger: 'Warnung antippen', result: 'Details klappen auf', event: 'weather.alert.open' }, { trigger: 'Ausblenden antippen', result: 'Warnung verschwindet', event: 'weather.alert.dismiss' }],
      viewports: ['mobile', 'desktop'],
      demoData: data,
    },
    {
      id: 'weather.widgets', name: 'Wetter in Start & Kalender', group: 'Integration', status: 'not_analyzed',
      purpose: 'Wetterhinweise dort zeigen, wo sie Entscheidungen beeinflussen (Start-Modul, Kalender-Termine im Freien).',
      requirements: [
        { text: 'Kompakte Wetter-Kachel für das Start-Modul', type: 'info', priority: 'should' },
        { text: 'Hinweis bei Terminen im Freien bei Regen oder Sturm', type: 'rule', priority: 'could' },
      ],
      interactions: [{ trigger: 'Kachel antippen', result: 'Öffnet das Wetter-Modul', event: 'weather.detail' }],
      viewports: ['mobile', 'desktop'],
      demoData: data,
    },
  ],
  decisions: [
    { featureId: 'weather.current', title: 'Dashboard-Raster als Standard-Variante', decision: 'Variante A (Dashboard-Raster) wird freigegeben.',
      rationale: 'Wetter wird meist zum schnellen Nachsehen genutzt – Warnungen, Jetzt und Verlauf gleichzeitig zu sehen spart Tipps. Auf Mobile bleibt die Reihenfolge Jetzt → Warnungen → Stunden → Tage erhalten.',
      tradeoffs: 'Dichter als der Feed; der erzählerische Feed (B) bleibt als Idee für das Start-Modul erhalten.', status: 'decided' },
    { featureId: 'weather.alerts', title: 'Push-Benachrichtigung bei Unwetterwarnungen?', decision: '', rationale: 'Hoher Nutzen bei Sturm und Glätte, aber Benachrichtigungs-Einstellungen müssen im Modul „Einstellungen“ ergänzt werden.', status: 'open' },
    { featureId: 'weather.hourly', title: 'Stundenverlauf: 24 oder 48 Stunden?', decision: '', rationale: '24 Stunden halten die Kurve lesbar; 48 Stunden helfen bei der Planung von Reisen, brauchen aber mehr Scrollen auf Mobile.', status: 'open' },
  ],
};
