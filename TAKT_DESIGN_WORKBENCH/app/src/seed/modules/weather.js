// Modul "Wetter" – Jetzt, Nowcast, Radar, Stunden, 10 Tage, Warnungen, Umwelt, Kleidung & Aktivität, Orte, Einstellungen (Datenwelt: seed/world/weather.js)
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

// Welt-gebundene Demo-Daten der neuen Wetter-Features (Persona „Ein Tag“, Di 24.11.2026 09:30): siehe seed/world/weather.js.
// Der freigegebene Stand weather.current behält seine eigenen, lokalen Demo-Daten (data) unverändert.
const W = { place: '@world:wxActive', active: '@world:wxActive', places: '@world:wxPlaces', settings: '@world:wxSettings', events: '@world:events', training: '@world:wxTraining', venues: '@world:wxVenues', levels: '@world:wxAlertLevels' };
const wd = (...keys) => Object.fromEntries(keys.map((k) => [k, W[k]]));
const ALL = ['desktop', 'notebook', 'tablet', 'mobile'];
const B = (id, component, region, props, extra = {}) => ({ id, component, region, ...(props ? { props } : {}), ...extra });

export default {
  module: {
    id: 'weather', name: 'Wetter', icon: 'cloud-sun', status: 'active', area: 'Umgebung', theme: 'graphite', designVersion: '0.4', homeFeatureId: 'weather.home',
    description: 'Wetter, das Entscheidungen trägt: Jetzt, Regen in den nächsten Minuten, Stunden und 10 Tage, amtliche Warnungen, Pollen, UV und Luft – und was das für Kleidung, Training und Termine bedeutet.',
    source: 'Auftrag 2026-11 (Wetter erstklassig ausbauen); Quellenfrage offen – in Phase 1 gegen das TAKT-Modulregister verifizieren',
    infoArchitecture: [
      'Einstieg: Übersicht (weather.home) mit Jetzt, Nowcast („Regen in 12 Minuten“), Warnung, Kleidungstipp und Tagesverlauf.',
      'Vertiefen: Regenradar, Stündlich (48 h), 10 Tage (Tag antippen öffnet die Stunden des Tages), Warnungen (DWD-Stufen), Pollen/UV/Luft, Kleidung & Aktivität (Wege zu Terminen, Lauf- und Trainingsfenster).',
      'Orte: Suche, Favoriten, Reihenfolge, Reiseziele; Auswahl eines Ortes wirkt auf alle Screens. Einstellungen: Einheiten, Benachrichtigungen, Ruhezeiten, Quelle.',
      'Navigation im Launcher: home → radar | alerts | hourly | daily | advice | environment | locations | settings; daily → hourly (Tag); locations → home.',
    ].join('\n'),
    docs: L(
      '## Annahmen',
      '- Wetterdaten kommen von einem externen Dienst; Warnungen amtlich (DWD-Schema, Stufe 1–4 mit Farben Gelb, Orange, Rot, Violett).',
      '- Alle Demo-Daten sind fiktiv und liegen in der gemeinsamen Datenwelt (`seed/world/weather.js`): Bielefeld (Standort), Hamburg (gemerkt, Unwetterwarnung Stufe 3), Lissabon (Reise ab 12.12.) und fünf Suchorte.',
      '- Referenzmoment: Di, 24.11.2026 09:30, 6 °C, leicht bewölkt, Schauer um 09:42, ab 14 Uhr Sturmböen bis 72 km/h. Tageswerte, gefühlte Temperatur, Nowcast-Text, Luftqualitätsindex, Sonnenzeiten und Mondphase werden in der Welt-Datei berechnet.',
      '- Radar ist eine schematische Simulation (Raster, 1 Kästchen ≈ 5 km), keine Kartenkacheln.',
      '- Pollen und UV sind im November ohne Aussage; Demo-Schalter „Frühling“ bzw. „Sommer“ zeigen die Zustände.',
      '- Einheiten und Empfindlichkeit werden in `weather.settings` gesetzt und wirken in den Wetter-Screens des Launchers sofort (nicht in der freigegebenen Ansicht „Aktuelles Wetter“).',
      '',
      '## Offene Fragen',
      '- Welcher Wetterdienst liefert Radar, Pollen und Luftqualität lizenzrechtlich sauber? (Entscheidung offen)',
      '- Radar: echte Kartenkacheln (Lizenz, Datenmenge) oder schematische Rasterkarte?',
      '- Trainingstage kommen aus der Fitness-Welt (Mo Unterkörper, Mi Oberkörper A, Fr Ganzkörper, Sa lockerer Lauf, FitX Bielefeld). Die Kalender-Serie „Krafttraining Oberkörper“ liegt auf Donnerstag im Studio Kraftwerk – Abweichung zwischen Kalender und Fitness, im Kalender-Modul klären.',
      '',
      '## Hinweise',
      '- Gesundheitshinweise (Pollen, UV, Luft) sind Richtwerte, kein medizinischer Rat.',
    ),
    links: ['home', 'calendar', 'fitness', 'tasks', 'settings', 'system'],
  },
  features: [
    // ======================================================================= Übersicht (Modul-Startseite)
    {
      id: 'weather.home', name: 'Übersicht', group: 'Übersicht', status: 'review', tier: 1, usage: 'täglich, mehrmals',
      purpose: 'Einstieg ins Wetter: Wie ist es jetzt, was kommt in den nächsten Minuten und Stunden – und was heißt das für heute? Von hier geht es zu Radar, Stunden, 10 Tagen, Warnungen, Kleidung, Umwelt und Orten.',
      requirements: [
        { text: 'Jetzt: Temperatur, Zustand, gefühlte Temperatur, Hoch/Tief, Ort und Datenstand', type: 'info', priority: 'must' },
        { text: 'Nowcast als Klartext „Regen in 12 Minuten“ mit Ende und Intensität, antippbar zum Regenradar', type: 'info', priority: 'must' },
        { text: 'Aktive und kommende Warnungen mit Stufe und Zeitraum, wichtigste zuerst', type: 'rule', priority: 'must' },
        { text: 'Kleidungstipp für den Rest des Tages aus gefühlter Temperatur, Wind und Regen', type: 'info', priority: 'should' },
        { text: 'Tagesverlauf (Kurve oder Zeitleiste mit Terminen) zeigt, wann draußen was geht', type: 'info', priority: 'should' },
        { text: 'Jeder Block führt in die passende Tiefe (Radar, Stündlich, 10 Tage, Warnungen, Kleidung, Umwelt, Orte)', type: 'action', priority: 'must' },
        { text: 'Offline und veraltete Daten sind mit Stand sichtbar; Leerzustand ohne Wetterdaten', type: 'state', priority: 'must' },
      ],
      interactions: [
        { trigger: 'Nowcast oder Radar-Kachel antippen', result: 'Regenradar öffnet sich', event: 'weather.radar.open', to: 'weather.radar' },
        { trigger: 'Warnung antippen', result: 'Warnungen öffnen mit aufgeklappter Warnung', event: 'weather.alert.open', to: 'weather.alerts' },
        { trigger: 'Stundenüberblick oder Tagesverlauf antippen', result: 'Stündliche Vorhersage', event: 'weather.hourly.open', to: 'weather.hourly' },
        { trigger: '„10 Tage“ oder Tag antippen', result: '10-Tage-Vorhersage', event: 'weather.daily.open', to: 'weather.daily' },
        { trigger: 'Kleidungstipp „Mehr“ oder Hinweis antippen', result: 'Kleidung & Aktivität', event: 'weather.advice.open', to: 'weather.advice' },
        { trigger: 'UV, Luft oder Pollen antippen', result: 'Pollen, UV & Luft', event: 'weather.environment.open', to: 'weather.environment' },
        { trigger: 'Ortsname oder „Orte“ antippen', result: 'Orte verwalten', event: 'weather.locations.open', to: 'weather.locations' },
        { trigger: '„Orte“ im Kopf antippen', result: 'Orte verwalten', event: 'header.secondary', to: 'weather.locations' },
        { trigger: '„Einheiten & Benachrichtigungen“ antippen', result: 'Einstellungen', event: 'weather.settings.open', to: 'weather.settings' },
        { trigger: 'Aktualisieren antippen', result: 'Werte werden neu geladen, Hinweis „Wetter aktualisiert“', event: 'weather.refresh' },
      ],
      acceptance: [
        'Beim Öffnen sind Ort, Temperatur, Zustand und Datenstand ohne Scrollen sichtbar (390 × 844 px).',
        '„Regen in 12 Min.“ erscheint in allen drei Versionen und öffnet das Regenradar.',
        'Die Sturmwarnung (Stufe 2, ab 14 Uhr) ist ohne Tippen sichtbar und öffnet die Warnungen mit aufgeklappter Warnung.',
        'Der Kleidungstipp nennt konkrete Dinge (z. B. Winterjacke, Mütze, Regenjacke) und folgt der Empfindlichkeit aus den Einstellungen.',
        'Ein Ortswechsel in „Orte“ ändert Temperatur, Nowcast, Warnungen und Kleidung auf der Startseite.',
        'Ohne Wetterdaten zeigt jeder Block einen Leerzustand statt leerer Fläche.',
      ],
      flows: [
        { id: 'f-regen', name: 'Regen prüfen vor dem Losgehen', steps: [{ featureId: 'weather.home', action: 'Karte „Regen in 12 Min.“ ansehen' }, { featureId: 'weather.radar', action: 'Zeitleiste abspielen, Zugrichtung prüfen' }, { featureId: 'weather.advice', action: 'Regenjacke einpacken' }] },
        { id: 'f-sturm', name: 'Sturm am Nachmittag einplanen', steps: [{ featureId: 'weather.home', action: 'Warnung antippen' }, { featureId: 'weather.alerts', action: 'Zeitraum, Tipps und betroffene Termine lesen' }, { featureId: 'weather.advice', action: 'Wege und Termine vorziehen' }] },
      ],
      viewports: ALL, demoData: wd('place', 'settings', 'events', 'venues', 'training'),
      variants: [
        {
          id: 'A', name: 'Kompakt', direction: 'kompakt', concept: 'Dichte Übersicht für Power-User: Jetzt als Zeile, Nowcast als Streifen, Warnungen als Liste, Stunden als Tabelle und 5 Tage – rechts alle Messwerte exakt in Zeilen.',
          description: '+ Alles auf einmal, Zahlen exakt, jede Zeile führt in die Tiefe  − Wenig Raum, wenig „Wetter-Gefühl“',
          layout: { type: 'split', panelLabel: 'Messwerte' },
          blocks: [
            hdr({ eyebrow: 'Wetter', title: 'Wetter', subtitle: 'Di, 24.11. · aktueller Ort', primaryLabel: 'Radar', primaryIcon: 'waves', primaryEvent: 'weather.radar.open', secondaryLabel: 'Orte', secondaryIcon: 'map-pin' }),
            B('now', 'wx-now', 'main', { layout: 'compact' }),
            B('nc', 'wx-nowcast', 'main', { layout: 'strip' }),
            B('al', 'wx-alerts', 'main', { mode: 'compact', limit: 3, title: 'Warnungen' }),
            B('hs', 'wx-hourly-strip', 'main', { layout: 'table', count: 8, title: 'Nächste Stunden', linkLabel: 'Stündlich' }),
            B('dl', 'wx-days', 'main', { layout: 'list', mode: 'open', days: 5, title: 'Nächste 5 Tage', linkLabel: '10 Tage' }),
            B('st', 'wx-stats', 'aside', { layout: 'rows', title: 'Messwerte', metrics: ['wind', 'gust', 'rain', 'humidity', 'pressure', 'dew', 'uv', 'air', 'pollen'] }),
            B('cl', 'wx-clothing', 'aside', { layout: 'compact', linkLabel: 'Mehr' }),
            B('src', 'wx-source', 'aside', { variant: 'footnote' }),
          ],
        },
        {
          id: 'B', name: 'Visuell', direction: 'visuell', concept: 'Eine Botschaft pro Karte: große Jetzt-Karte, „Regen in 12 Min.“ mit Balkenkurve, Warn-Banner, Tagesverlauf als Kurve, Radar-Kachel, Kleidung und Umwelt, dann Stunden- und Tageskarten zum Wischen.',
          description: '+ Sofort verständlich, ruhig, viel Wetter-Gefühl  − Mehr Scrollen, weniger Zahlen gleichzeitig',
          layout: { type: 'grid', stretch: true },
          blocks: [
            hdr({ eyebrow: 'Wetter', title: 'Wetter', subtitle: 'Dienstag, 24. November', primaryLabel: '', secondaryLabel: 'Orte', secondaryIcon: 'map-pin' }),
            B('hero', 'wx-now', 'main', { layout: 'hero' }, { span: 7, spanTablet: 12 }),
            B('nc', 'wx-nowcast', 'main', { layout: 'headline' }, { span: 5, spanTablet: 12 }),
            B('al', 'wx-alerts', 'main', { mode: 'banner' }, { span: 12 }),
            B('curve', 'wx-day-curve', 'main', { title: 'Tagesverlauf' }, { span: 7, spanTablet: 12 }),
            B('radar', 'wx-radar', 'main', { layout: 'tile', title: 'Regenradar' }, { span: 5, spanTablet: 12 }),
            B('cl', 'wx-clothing', 'main', { layout: 'card', showParts: false, linkLabel: 'Mehr' }, { span: 6, spanTablet: 12 }),
            B('st', 'wx-stats', 'main', { layout: 'tiles', title: 'Umwelt & Wind', metrics: ['wind', 'uv', 'air', 'pollen'] }, { span: 6, spanTablet: 12 }),
            B('hs', 'wx-hourly-strip', 'main', { layout: 'cards', count: 14, title: 'Stündlich', linkLabel: 'Alle Stunden' }, { span: 12 }),
            B('dl', 'wx-days', 'main', { layout: 'tiles', mode: 'open', days: 10, title: '10 Tage', linkLabel: 'Details' }, { span: 12 }),
            B('src', 'wx-source', 'main', { variant: 'footnote' }, { span: 12 }),
          ],
        },
        {
          id: 'C', name: 'Fokus', direction: 'fokus', concept: 'Was ist heute wichtig? Priorisierte Hinweise (Sturm ab 14 Uhr, Regen in 12 Min., Mittagstermin vor dem Sturm, Kleidung, Lauffenster) mit je einer Aktion, darunter der Tag als Zeitleiste mit Terminen und Wetter.',
          description: '+ Beantwortet „Was muss ich tun?“, bindet Kalender und Training ein  − Weniger Überblick über Details',
          layout: { type: 'split' },
          blocks: [
            hdr({ eyebrow: 'Wetter', title: 'Heute', subtitle: 'Di, 24.11. · 09:30 Uhr', primaryLabel: '', secondaryLabel: 'Orte', secondaryIcon: 'map-pin' }),
            B('brief', 'wx-briefing', 'main', { title: 'Heute wichtig', limit: 5 }),
            B('now', 'wx-now', 'main', { layout: 'line' }),
            B('tl', 'wx-day-timeline', 'main', { title: 'Dein Tag mit Wetter' }),
            B('nc', 'wx-nowcast', 'aside', { layout: 'bars', title: 'Regen in 2 Stunden' }),
            B('cl', 'wx-clothing', 'aside', { layout: 'compact', linkLabel: 'Mehr' }),
            B('act', 'wx-activity', 'aside', { layout: 'compact', limit: 3, title: 'Beste Fenster' }),
            B('hs', 'wx-hourly-strip', 'aside', { layout: 'cards', count: 12, title: 'Nächste Stunden', linkLabel: 'Stündlich' }),
            B('dl', 'wx-days', 'aside', { layout: 'list', mode: 'open', days: 5, title: 'Nächste Tage', linkLabel: '10 Tage' }),
            B('st', 'wx-stats', 'aside', { layout: 'tiles', metrics: ['uv', 'air', 'pollen'] }),
            B('src', 'wx-source', 'aside', { variant: 'footnote' }),
          ],
        },
      ],
      selectedVariantId: 'B',
      links: ['weather.radar', 'weather.hourly', 'weather.daily', 'weather.alerts', 'weather.advice', 'weather.environment', 'weather.locations'],
      seedHistory: [{ kind: 'draft', note: 'Drei Richtungen: kompakt, visuell, fokus' }, { kind: 'review', note: 'Zur Prüfung: Reihenfolge Nowcast, Warnung, Kleidung' }],
    },
    // ======================================================================= Aktuelles Wetter (FREIGEGEBEN – unverändert; Block weather.current wird unten eingefügt)
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
    // ======================================================================= Regenradar
    {
      id: 'weather.radar', name: 'Regenradar', group: 'Vorhersage', status: 'design', tier: 1, usage: 'täglich',
      purpose: 'Sehen, ob und wann Regen kommt: animierte Niederschlagskarte mit Zeitleiste und die 2-Stunden-Kurve für den eigenen Ort.',
      requirements: [
        { text: 'Karte mit Ortsmarke, Niederschlagsstufen (Niesel bis Starkregen) und Legende', type: 'info', priority: 'must' },
        { text: 'Zeitleiste von −2 h bis +2 h mit Play/Pause, Beobachtung und Vorhersage unterscheidbar', type: 'action', priority: 'must' },
        { text: 'Nowcast-Kurve in 5-Minuten-Schritten läuft mit dem Radar-Zeitpunkt mit', type: 'info', priority: 'must' },
        { text: 'Klartext „Regen beginnt in 12 Min., hört gegen 10:15 auf“', type: 'info', priority: 'must' },
        { text: 'Zoom 1× / 2× um den Ort; Bewegung respektiert „Animationen reduzieren“', type: 'rule', priority: 'should' },
        { text: 'Hinweis, dass Karte und Daten in der Workbench simuliert sind', type: 'rule', priority: 'should' },
      ],
      interactions: [
        { trigger: 'Play/Pause antippen', result: 'Zeitleiste läuft oder hält an', event: 'weather.radar.play' },
        { trigger: 'Zeitleiste ziehen', result: 'Karte zeigt den gewählten Zeitpunkt', event: 'weather.radar.frame' },
        { trigger: 'Zoom 1× / 2×', result: 'Kartenausschnitt wechselt', event: 'weather.radar.zoom' },
        { trigger: 'Nowcast-Balken streichen', result: 'Zeitpunkt, Stufe und Menge werden genannt', event: 'weather.nowcast.point' },
        { trigger: 'Warn-Banner „Details“ antippen', result: 'Warnungen öffnen sich', event: 'weather.alert.open', to: 'weather.alerts' },
        { trigger: 'Kleidungstipp „Mehr“ antippen', result: 'Kleidung & Aktivität', event: 'weather.advice.open', to: 'weather.advice' },
      ],
      acceptance: [
        'Die Karte zeigt Ortsmarke, Zeitstempel und Phase (Beobachtung, Jetzt, Vorhersage).',
        'Play bewegt die Zeitleiste von −2 h bis +2 h; Ziehen der Leiste pausiert die Wiedergabe.',
        'Der Nowcast unter der Karte hebt den gewählten Zeitpunkt hervor.',
        'Der Text nennt Beginn in Minuten, Ende und Intensität und passt zur Kurve.',
        'Legende nennt alle fünf Stufen; Karte hat einen Hinweis auf Simulation.',
      ],
      flows: [{ id: 'f-radar', name: 'Radar prüfen', steps: [{ featureId: 'weather.home', action: 'Nowcast-Karte antippen' }, { featureId: 'weather.radar', action: 'Abspielen, Zugrichtung lesen' }] }],
      viewports: ALL, demoData: wd('place', 'settings'),
      variants: [
        {
          id: 'A', name: 'Karte im Fokus', direction: 'visuell', concept: 'Die große Karte mit Zeitleiste steht oben, darunter die Nowcast-Kurve und ein Warn-Banner. Orientierung über Bild und Bewegung.',
          description: '+ Zugrichtung und Ausdehnung sofort sichtbar  − Text kommt erst nach der Karte',
          layout: { type: 'stack' },
          blocks: [
            hdr({ eyebrow: 'Wetter', title: 'Regenradar', subtitle: 'Niederschlag von −2 bis +2 Stunden', primaryLabel: '' }),
            B('radar', 'wx-radar', 'main', { layout: 'full', title: 'Niederschlag' }),
            B('nc', 'wx-nowcast', 'main', { layout: 'bars', title: 'Regen in 2 Stunden', linkRadar: false }),
            B('al', 'wx-alerts', 'main', { mode: 'banner' }),
            B('src', 'wx-source', 'main', { variant: 'footnote', settingsLink: false }),
          ],
        },
        {
          id: 'B', name: 'Text-Nowcast zuerst', direction: 'fokus', concept: 'Erst die Antwort („Regen in 12 Min.“, Ende, Intensität), dann die kleine Karte und was man anziehen sollte. Für „Gehe ich jetzt los?“.',
          description: '+ Entscheidung in einer Sekunde  − Karte kleiner, weniger Überblick',
          layout: { type: 'stack', narrow: true },
          blocks: [
            hdr({ eyebrow: 'Wetter', title: 'Regen in 12 Minuten?', subtitle: 'Stand 09:25 Uhr', primaryLabel: '' }),
            B('nc', 'wx-nowcast', 'main', { layout: 'headline', linkRadar: false }),
            B('radar', 'wx-radar', 'main', { layout: 'compact', title: 'Radar' }),
            B('cl', 'wx-clothing', 'main', { layout: 'compact', title: 'Dafür anziehen', linkLabel: 'Mehr' }),
            B('al', 'wx-alerts', 'main', { mode: 'banner' }),
          ],
        },
      ],
      selectedVariantId: 'A', links: ['weather.home', 'weather.alerts'],
    },
    // ======================================================================= Stündlich
    {
      id: 'weather.hourly', name: 'Stündlich', group: 'Vorhersage', status: 'design', tier: 2, usage: 'täglich',
      purpose: 'Den Tag planen: wann wird es kälter, wann regnet es, wie böig wird es? 48 Stunden, jeder Tag wählbar.',
      requirements: [
        { text: 'Temperatur, Symbol, Regenrisiko und Wind je Stunde; Niederschlagsmenge', type: 'info', priority: 'must' },
        { text: 'Umschalten zwischen Temperatur, Regen und Wind', type: 'action', priority: 'should' },
        { text: 'Tageswahl („Ab jetzt“, Heute, Morgen …); aus der 10-Tage-Ansicht vorbelegt', type: 'action', priority: 'must' },
        { text: 'Stunde antippen zeigt Details (gefühlt, Wind mit Böen, Regen, Feuchte)', type: 'action', priority: 'should' },
        { text: 'Tage ohne Stundenwerte zeigen ein Tagesprofil (Nacht, Morgen, Mittag, Abend)', type: 'state', priority: 'should' },
        { text: 'Nur der Verlauf scrollt horizontal, nie die Seite', type: 'rule', priority: 'must' },
      ],
      interactions: [
        { trigger: 'Stunde antippen', result: 'Detailzeile aktualisiert sich', event: 'weather.hour' },
        { trigger: 'Tag wählen', result: 'Verlauf wechselt auf diesen Tag', event: 'weather.hourly.day' },
        { trigger: 'Temperatur/Regen/Wind wählen', result: 'Diagramm wechselt', event: 'weather.hourly.metric' },
        { trigger: 'Stunde in der Tabelle antippen', result: 'Bleibt in der Ansicht, Zeile hervorgehoben', event: 'weather.hourly.open' },
      ],
      acceptance: ['Beim Öffnen zeigt der Verlauf 48 Stunden ab jetzt mit „Jetzt“-Marke.', 'Kommt man aus „10 Tage“, ist der gewählte Tag vorbelegt.', 'Temperatur, Regen und Wind lassen sich umschalten; die Legende nennt die Einheit.', 'Die Einheiten folgen den Einstellungen (z. B. °F, m/s).'],
      viewports: ['desktop', 'tablet', 'mobile'], demoData: wd('place', 'settings'),
      variants: [
        {
          id: 'A', name: 'Diagramm', direction: 'visuell', concept: 'Wischbares Diagramm mit Kurve, Symbolen, Regenrisiko und Wind; darunter das Tagesdetail des gewählten Tages.',
          description: '+ Verlauf auf einen Blick, Tageswahl direkt  − weniger exakte Zahlen als eine Tabelle',
          layout: { type: 'stack' },
          blocks: [
            hdr({ eyebrow: 'Wetter', title: 'Stündlich', subtitle: '48 Stunden ab jetzt', primaryLabel: '' }),
            B('hourly', 'wx-hourly', 'main', { title: 'Verlauf', count: 48 }),
            B('detail', 'wx-day-detail', 'main', { showAction: false }),
          ],
        },
        {
          id: 'B', name: 'Tabelle', direction: 'kompakt', concept: 'Dichte Stundenliste mit Tagestrennern: Zeit, Symbol, Temperatur (gefühlt), Regen und Wind – daneben Nowcast und Warnungen.',
          description: '+ Exakte Werte, viele Stunden sichtbar  − kein Verlaufsgefühl',
          layout: { type: 'split' },
          blocks: [
            hdr({ eyebrow: 'Wetter', title: 'Stündlich', subtitle: '48 Stunden ab jetzt', primaryLabel: '' }),
            B('table', 'wx-hourly-strip', 'main', { layout: 'table', count: 48, title: 'Alle Stunden', linkLabel: '', followDay: true }),
            B('nc', 'wx-nowcast', 'aside', { layout: 'strip' }),
            B('al', 'wx-alerts', 'aside', { mode: 'compact', title: 'Warnungen', limit: 3 }),
            B('src', 'wx-source', 'aside', { variant: 'footnote', settingsLink: false }),
          ],
        },
      ],
      selectedVariantId: 'A', links: ['weather.daily'],
    },
    // ======================================================================= 10 Tage
    {
      id: 'weather.daily', name: '10 Tage', group: 'Vorhersage', status: 'review', tier: 2, usage: 'mehrmals pro Woche',
      purpose: 'Die nächsten Tage überblicken: mild, nass oder frostig? Einen Tag antippen und seine Stunden sehen.',
      requirements: [
        { text: 'Zehn Tage mit Symbol, Min/Max, Regenrisiko und Hinweis auf Frost oder Sturm', type: 'info', priority: 'must' },
        { text: 'Min/Max-Balken zeigen die Spanne relativ zum ganzen Zeitraum', type: 'info', priority: 'should' },
        { text: 'Tag antippen öffnet den Stundenverlauf dieses Tages', type: 'action', priority: 'must' },
        { text: 'Tagesdetail mit Tageszeiten, Regen, Wind, UV, Sonnenstunden, Auf- und Untergang', type: 'info', priority: 'should' },
        { text: 'Heute und Morgen sind benannt, danach Wochentag mit Datum', type: 'rule', priority: 'should' },
      ],
      interactions: [
        { trigger: 'Tag antippen (Liste) oder „Stundenverlauf“ (Detail)', result: 'Stündliche Vorhersage des Tages', event: 'weather.day', to: 'weather.hourly' },
        { trigger: 'Tag in den Kacheln wählen', result: 'Tagesdetail wechselt', event: 'weather.day.select' },
        { trigger: 'Warnung antippen', result: 'Warnungen öffnen sich', event: 'weather.alert.open', to: 'weather.alerts' },
      ],
      acceptance: ['Zehn Tage sind sichtbar, Heute und Morgen benannt.', 'Frost (Tiefstwert unter 0 °) und Sturmböen (ab 60 km/h) sind am Tag markiert.', 'Antippen eines Tages öffnet „Stündlich“ mit diesem Tag vorbelegt.', 'Tage ab dem sechsten zeigen im Stundenverlauf das Tagesprofil statt leerer Fläche.'],
      flows: [{ id: 'f-tag', name: 'Wochenende planen', steps: [{ featureId: 'weather.home', action: '„10 Tage“ antippen' }, { featureId: 'weather.daily', action: 'Samstag wählen' }, { featureId: 'weather.hourly', action: 'Stunden des Samstags lesen' }] }],
      viewports: ['desktop', 'tablet', 'mobile'], demoData: wd('place', 'settings'),
      variants: [
        {
          id: 'A', name: 'Liste mit Balken', direction: 'kompakt', concept: 'Eine Zeile je Tag mit Min/Max-Balken, Regenrisiko und Hinweisen; daneben Warnungen und Sonne. Antippen öffnet die Stunden.',
          description: '+ Unterschiede sofort sichtbar, schnell  − Details nur einen Schritt weiter',
          layout: { type: 'split' },
          blocks: [
            hdr({ eyebrow: 'Wetter', title: '10 Tage', subtitle: 'Die nächsten Tage', primaryLabel: '' }),
            B('days', 'wx-days', 'main', { layout: 'list', mode: 'navigate', days: 10, title: 'Vorhersage' }),
            B('al', 'wx-alerts', 'aside', { mode: 'compact', title: 'Warnungen', limit: 3 }),
            B('sun', 'wx-sun', 'aside', { layout: 'compact' }),
          ],
        },
        {
          id: 'B', name: 'Kacheln + Tagesdetail', direction: 'visuell', concept: 'Wischbare Tageskacheln, darunter das Detail des gewählten Tages mit Tageszeiten und Kennzahlen; ein Button führt zu den Stunden.',
          description: '+ Ein Tag nach dem anderen, ruhig  − mehr Schritte bis zur Stunde',
          layout: { type: 'stack' },
          blocks: [
            hdr({ eyebrow: 'Wetter', title: '10 Tage', subtitle: 'Die nächsten Tage', primaryLabel: '' }),
            B('tiles', 'wx-days', 'main', { layout: 'tiles', mode: 'detail', days: 10, title: 'Tag wählen' }),
            B('detail', 'wx-day-detail', 'main', { showAction: true }),
            B('sun', 'wx-sun', 'main', { layout: 'full' }),
          ],
        },
      ],
      selectedVariantId: 'A', links: ['weather.hourly'],
      seedHistory: [{ kind: 'draft', note: 'Liste mit Balken, Kacheln mit Detail' }, { kind: 'review', note: 'Zur Prüfung: Übergang in den Stundenverlauf' }],
    },
    // ======================================================================= Warnungen
    {
      id: 'weather.alerts', name: 'Warnungen', group: 'Warnungen', status: 'design', tier: 1, usage: 'bei Warnlage',
      purpose: 'Rechtzeitig und klar über amtliche Warnungen informiert werden: Stufe, Zeitraum, was zu tun ist, was es für Termine bedeutet.',
      requirements: [
        { text: 'Stufen 1–4 nach DWD-Schema (Gelb, Orange, Rot, Violett) mit Symbol und Stufenanzeige, nicht nur Farbe', type: 'rule', priority: 'must' },
        { text: 'Zeitraum mit Status („beginnt in 4 Std. 30 Min.“) und Zeitleiste über 72 Stunden', type: 'info', priority: 'must' },
        { text: 'Verhaltenstipps je Warnung und Hinweis auf betroffene Termine mit Weg', type: 'info', priority: 'should' },
        { text: 'Quelle, Ausgabezeit und Gebiet je Warnung (Attribution)', type: 'rule', priority: 'must' },
        { text: 'Umschalter „Alle Orte“ für Warnungen an gemerkten Orten (z. B. Hamburg, Stufe 3)', type: 'action', priority: 'should' },
        { text: 'Positive Meldung ohne Warnungen; Erklärung der Stufen', type: 'state', priority: 'should' },
      ],
      interactions: [
        { trigger: 'Warnung antippen', result: 'Details klappen auf', event: 'weather.alert.open' },
        { trigger: 'Teilen antippen', result: 'Warntext wird geteilt', event: 'weather.alert.share' },
        { trigger: 'Ausblenden antippen', result: 'Warnung verschwindet aus der Liste', event: 'weather.alert.dismiss' },
        { trigger: 'Stufe in der Erklärung antippen', result: 'Bedeutung klappt auf', event: 'weather.alert.level' },
        { trigger: 'Termin mit Weg antippen', result: 'Hinweise zu Hin- und Rückweg', event: 'weather.commute.open' },
      ],
      acceptance: ['Die Sturmwarnung zeigt Stufe 2, Zeitraum 14:00 – 23:00 Uhr, Tipps und Quelle (DWD, fiktiv).', 'Die Stufe ist ohne Farbe erkennbar (Stufenanzeige und Text).', '„Alle Orte“ zeigt zusätzlich Hamburg mit Stufe 3.', 'Ausblenden entfernt die Warnung, die Seite bleibt konsistent (Leerzustand mit positiver Meldung).'],
      viewports: ['mobile', 'tablet', 'desktop'], demoData: wd('place', 'settings', 'events', 'venues', 'places', 'levels', 'training'),
      variants: [
        {
          id: 'A', name: 'Kompakt', direction: 'kompakt', concept: 'Warnungen als dichte Liste, jede Zeile klappt Details inline auf; Stufen-Erklärung darunter.',
          description: '+ Alle Warnungen auf einen Blick  − weniger Kontext zu Terminen',
          layout: { type: 'stack', narrow: true },
          blocks: [
            hdr({ eyebrow: 'Wetter', title: 'Warnungen', subtitle: 'Amtliche Warnungen', primaryLabel: '' }),
            B('al', 'wx-alerts', 'main', { mode: 'compact', inlineExpand: true, allowAllPlaces: true, title: 'Aktuell' }),
            B('lv', 'wx-alert-levels', 'main', {}),
            B('src', 'wx-source', 'main', { variant: 'footnote', settingsLink: false }),
          ],
        },
        {
          id: 'B', name: 'Fokus', direction: 'fokus', concept: 'Die wichtigste Warnung groß mit Tipps und betroffenen Terminen; darunter Termine und Wege, die davon berührt werden.',
          description: '+ Sagt, was zu tun ist  − eine Warnung zur Zeit im Blick',
          layout: { type: 'split' },
          blocks: [
            hdr({ eyebrow: 'Wetter', title: 'Warnungen', subtitle: 'Was heißt das für heute?', primaryLabel: '' }),
            B('al', 'wx-alerts', 'main', { mode: 'full', allowAllPlaces: true, title: 'Warnungen' }),
            B('trips', 'wx-commute', 'aside', { layout: 'rows', title: 'Betroffene Wege', hours: 48 }),
            B('lv', 'wx-alert-levels', 'aside', {}),
          ],
        },
      ],
      selectedVariantId: 'B', links: ['weather.advice'],
    },
    // ======================================================================= Kleidung & Aktivität
    {
      id: 'weather.advice', name: 'Kleidung & Aktivität', group: 'Alltag', status: 'design', tier: 2, usage: 'täglich',
      purpose: 'Das Wetter in Entscheidungen übersetzen: was anziehen, wann laufen oder Rad fahren, wie komme ich zu Terminen und zum Training?',
      requirements: [
        { text: 'Kleidungstipp aus gefühlter Temperatur, Wind, Regen und UV, nach Tageszeit aufgeschlüsselt', type: 'info', priority: 'must' },
        { text: 'Empfindlichkeit einstellbar (friert schnell, normal, unempfindlich), wirkt sofort', type: 'action', priority: 'should' },
        { text: 'Aktivitätsfenster mit Bewertung 0–100: Laufen, Radfahren, Spaziergang, Auto waschen, Wäsche trocknen', type: 'info', priority: 'must' },
        { text: 'Trainingstage aus Fitness (Mo/Mi/Fr Kraft, Wochenende Laufen/Wandern) mit Wetter zum Termin', type: 'info', priority: 'should' },
        { text: 'Termine und Wege aus dem Kalender: Hin- und Rückweg, Verkehrsmittel, Empfehlung (Regenjacke, Auto statt Rad)', type: 'info', priority: 'must' },
        { text: 'Freie Fenster ohne Termin werden bevorzugt; Warnungen fließen in die Bewertung ein', type: 'rule', priority: 'should' },
      ],
      interactions: [
        { trigger: 'Empfindlichkeit wählen', result: 'Kleidungstipp passt sich an', event: 'weather.clothing.sensitivity' },
        { trigger: 'Gegenstand antippen', result: 'Als eingepackt markiert', event: 'weather.clothing.pack' },
        { trigger: 'Aktivität antippen', result: 'Eignungsband und Tage klappen auf', event: 'weather.activity.open' },
        { trigger: 'Training antippen', result: 'Detail zum Training', event: 'weather.training.open' },
        { trigger: 'Termin antippen', result: 'Hinweise zu Hin- und Rückweg', event: 'weather.commute.open' },
        { trigger: 'Hinweis „Warnung“ antippen', result: 'Warnungen öffnen sich', event: 'weather.alert.open', to: 'weather.alerts' },
        { trigger: 'Hinweis „Radar“ antippen', result: 'Regenradar öffnet sich', event: 'weather.radar.open', to: 'weather.radar' },
        { trigger: 'Hinweis „Pollen“ antippen', result: 'Pollen, UV & Luft', event: 'weather.environment.open', to: 'weather.environment' },
      ],
      acceptance: ['Heute lautet der Tipp: Winterjacke, Mütze und Regenjacke (kein Schirm wegen Böen).', 'Für „friert schnell“ kommen Handschuhe dazu, für „unempfindlich“ genügt eine Übergangsjacke.', 'Das Mittagstreffen um 12:30 ist als „passt, vor dem Sturm“ bewertet; der Lauf am Samstag nennt das beste Zeitfenster.', 'Heute gibt es kein gutes Lauffenster, weil Termine und Sturm kollidieren; die Seite sagt das offen.'],
      flows: [{ id: 'f-lauf', name: 'Lauf am Wochenende planen', steps: [{ featureId: 'weather.home', action: 'Kleidungstipp „Mehr“ antippen' }, { featureId: 'weather.advice', action: 'Laufen aufklappen, Samstag-Fenster lesen' }] }],
      viewports: ALL, demoData: wd('place', 'settings', 'events', 'venues', 'training'),
      variants: [
        {
          id: 'A', name: 'Kompakt', direction: 'kompakt', concept: 'Aktivitätsfenster als Liste mit Bewertung, Termine und Wege als Zeilen; Kleidung kompakt in der Seitenspalte.',
          description: '+ Viele Antworten in einer Liste  − wenig Illustration',
          layout: { type: 'split' },
          blocks: [
            hdr({ eyebrow: 'Wetter', title: 'Kleidung & Aktivität', subtitle: 'Heute und die nächsten Tage', primaryLabel: '' }),
            B('act', 'wx-activity', 'main', { layout: 'full', title: 'Aktivitätsfenster' }),
            B('trips', 'wx-commute', 'main', { layout: 'rows', title: 'Termine & Wege', hours: 120 }),
            B('cl', 'wx-clothing', 'aside', { layout: 'card', showParts: false }),
          ],
        },
        {
          id: 'B', name: 'Visuell', direction: 'visuell', concept: 'Große Kleidungskarte mit Tageszeiten, Termine und Wege als Karten, darunter die Aktivitäten mit Eignungsband.',
          description: '+ Ruhig, jede Karte eine Aussage  − länger',
          layout: { type: 'grid' },
          blocks: [
            hdr({ eyebrow: 'Wetter', title: 'Kleidung & Aktivität', subtitle: 'Was heute zu tun ist', primaryLabel: '' }),
            B('cl', 'wx-clothing', 'main', { layout: 'card', title: 'Heute anziehen' }, { span: 5, spanTablet: 12 }),
            B('trips', 'wx-commute', 'main', { layout: 'cards', title: 'Termine & Wege', hours: 96, limit: 4 }, { span: 7, spanTablet: 12 }),
            B('act', 'wx-activity', 'main', { layout: 'full', title: 'Aktivitätsfenster' }, { span: 12 }),
          ],
        },
        {
          id: 'C', name: 'Fokus', direction: 'fokus', concept: 'Erst die priorisierten Hinweise für heute, dann Kleidung, die nächsten Wege und die drei besten Fenster.',
          description: '+ Sagt, was jetzt zu tun ist  − weniger Vergleich der Tage',
          layout: { type: 'stack', narrow: true },
          blocks: [
            hdr({ eyebrow: 'Wetter', title: 'Was heißt das für heute?', subtitle: 'Di, 24.11.', primaryLabel: '' }),
            B('brief', 'wx-briefing', 'main', { title: 'Heute wichtig', limit: 4 }),
            B('cl', 'wx-clothing', 'main', { layout: 'compact', title: 'Anziehen' }),
            B('trips', 'wx-commute', 'main', { layout: 'cards', title: 'Nächste Wege', hours: 48, limit: 2 }),
            B('act', 'wx-activity', 'main', { layout: 'compact', limit: 3, title: 'Beste Fenster' }),
          ],
        },
      ],
      selectedVariantId: 'C', links: ['weather.home', 'weather.alerts'],
    },
    // ======================================================================= Pollen, UV & Luft
    {
      id: 'weather.environment', name: 'Pollen, UV & Luft', group: 'Umwelt', status: 'design', tier: 3, usage: 'saisonal',
      purpose: 'Für Allergiker und Outdoor-Aktive: Pollenflug, UV-Index und Luftqualität verständlich – mit Stufen, Verlauf und Empfehlung.',
      requirements: [
        { text: 'Pollen für heute bis übermorgen auf Stufen 0–3, „Meine Allergene“ wählbar, Mitteilung ab Stufe 2', type: 'info', priority: 'must' },
        { text: 'UV-Index mit Stufe, Tagesverlauf, Schutz ab UV 3, Hauttyp und Eigenschutzzeit', type: 'info', priority: 'must' },
        { text: 'Luftqualität als 6-stufiger Index mit Schadstoffen, Verlauf, Ausblick und Sport-Empfehlung', type: 'info', priority: 'must' },
        { text: 'Erklärungen („Was bedeutet Stufe 2?“) im Info-Dialog', type: 'action', priority: 'should' },
        { text: 'Sonne und Mond: Auf-/Untergang, Tageslänge, goldene Stunde, Mondphase', type: 'info', priority: 'could' },
        { text: 'Demo-Schalter für Frühling und Sommer, weil im November nichts auffällt', type: 'rule', priority: 'should' },
        { text: 'Gesundheitshinweis: Richtwerte, kein medizinischer Rat', type: 'rule', priority: 'must' },
      ],
      interactions: [
        { trigger: 'Allergen an- oder abwählen', result: 'Meine Allergene ändern sich, Zusammenfassung folgt', event: 'weather.pollen.allergen' },
        { trigger: 'Tag wählen (Heute/Morgen/Übermorgen)', result: 'Pollenstufen wechseln', event: 'weather.pollen.day' },
        { trigger: 'Info antippen', result: 'Dialog erklärt die Stufen', event: 'weather.env.info' },
        { trigger: 'Hauttyp wählen', result: 'Eigenschutzzeit wird neu berechnet', event: 'weather.uv.skin' },
        { trigger: 'Schadstoff antippen', result: 'Wert und Einordnung', event: 'weather.air.pollutant' },
      ],
      acceptance: ['Im November zeigt Pollen „Keine Belastung“ mit Hinweis auf die nächste Saison; der Frühling-Schalter zeigt Birke stark.', 'UV-Index 1 sagt „Kein Sonnenschutz nötig“; der Sommer-Schalter nennt Zeitfenster und Eigenschutzzeit.', 'Die Luftqualität nennt Stufe, führenden Schadstoff und eine Empfehlung.', 'Alle Info-Dialoge enthalten den Hinweis „kein medizinischer Rat“.'],
      viewports: ALL, demoData: wd('place', 'settings'),
      variants: [
        {
          id: 'A', name: 'Kompakt', direction: 'kompakt', concept: 'Pollen als Tabelle mit Saisonkalender, daneben UV und Luft als schmale Karten mit exakten Werten.',
          description: '+ Alles Wichtige in einer Spalte  − wenig Visualisierung',
          layout: { type: 'split' },
          blocks: [
            hdr({ eyebrow: 'Wetter', title: 'Pollen, UV & Luft', subtitle: 'Stand 09:25 Uhr', primaryLabel: '' }),
            B('pollen', 'wx-pollen', 'main', { title: 'Pollenflug', showSeason: true }),
            B('uv', 'wx-uv', 'aside', {}),
            B('air', 'wx-air', 'aside', {}),
          ],
        },
        {
          id: 'B', name: 'Visuell', direction: 'visuell', concept: 'Drei große Karten mit Anzeige (UV-Halbkreis, Luft-Skala, Pollenstufen), unten Sonne und Mond.',
          description: '+ Jede Karte eine Botschaft  − mehr Platz nötig',
          layout: { type: 'grid' },
          blocks: [
            hdr({ eyebrow: 'Wetter', title: 'Pollen, UV & Luft', subtitle: 'Umwelt heute', primaryLabel: '' }),
            B('uv', 'wx-uv', 'main', {}, { span: 6, spanTablet: 12 }),
            B('air', 'wx-air', 'main', {}, { span: 6, spanTablet: 12 }),
            B('pollen', 'wx-pollen', 'main', { title: 'Pollenflug', showSeason: true }, { span: 12 }),
            B('sun', 'wx-sun', 'main', { layout: 'full' }, { span: 12 }),
            B('legal', 'legal-notice', 'main', { kind: 'gesundheit', style: 'footnote' }, { span: 12 }),
          ],
        },
      ],
      selectedVariantId: 'B', links: ['weather.home'],
    },
    // ======================================================================= Orte
    {
      id: 'weather.locations', name: 'Orte', group: 'Orte', status: 'design', tier: 3, usage: 'selten',
      purpose: 'Orte finden, merken und vergleichen: aktueller Standort, Favoriten, Reiseziele. Auswahl eines Ortes zeigt sein Wetter.',
      requirements: [
        { text: 'Suche mit Vorschlägen (Name, Region, aktuelle Temperatur) und „Hinzufügen“', type: 'action', priority: 'must' },
        { text: 'Gemerkte Orte mit Zustand, Hoch/Tief und Warnhinweis; Standort steht fest an erster Stelle und ist nicht löschbar', type: 'rule', priority: 'must' },
        { text: 'Favorit, Reihenfolge ändern, Entfernen', type: 'action', priority: 'should' },
        { text: 'Reiseorte mit Datum und „in 18 Tagen“; Klimahinweis, wenn die Vorhersage noch nicht reicht', type: 'info', priority: 'should' },
        { text: 'Zwei Orte vergleichen (Jetzt, Heute, Regen, Wind, Morgen)', type: 'action', priority: 'could' },
        { text: 'Leerzustand ohne Orte, Hinweis ohne Suchtreffer', type: 'state', priority: 'must' },
      ],
      interactions: [
        { trigger: 'Ort antippen', result: 'Ort wird aktiv, Übersicht zeigt sein Wetter', event: 'weather.location.select', to: 'weather.home' },
        { trigger: 'Hinzufügen antippen', result: 'Ort erscheint in den gemerkten Orten', event: 'weather.location.add' },
        { trigger: 'Entfernen antippen', result: 'Ort verschwindet aus der Liste', event: 'weather.location.remove' },
        { trigger: 'Favorit antippen', result: 'Stern wird gesetzt oder entfernt', event: 'weather.location.favorite' },
        { trigger: 'Nach oben/unten', result: 'Reihenfolge ändert sich', event: 'weather.location.move' },
        { trigger: 'Zwei Orte abhaken', result: 'Vergleich erscheint', event: 'weather.location.compare' },
        { trigger: '„Einheiten & Benachrichtigungen“ antippen', result: 'Einstellungen', event: 'weather.settings.open', to: 'weather.settings' },
      ],
      acceptance: ['Die Suche nach „tok“ findet Tokio mit Temperatur und „Hinzufügen“.', 'Bielefeld ist als Standort markiert und lässt sich nicht entfernen.', 'Lissabon zeigt „Reise 12.–19.12. · in 18 Tagen“.', 'Tippen auf Hamburg zeigt in der Übersicht Hamburg mit der Warnung Stufe 3.'],
      viewports: ['desktop', 'tablet', 'mobile'], demoData: wd('places', 'active', 'settings', 'place'),
      variants: [{
        id: 'A', name: 'Suche + Liste', direction: 'kompakt', concept: 'Suchfeld oben, darunter die gemerkten Orte mit Werkzeugen pro Zeile und optionalem Vergleich.',
        description: '+ Minimal, schnell, daumenfreundlich  − keine Kartenansicht',
        layout: { type: 'stack', narrow: true },
        blocks: [
          hdr({ eyebrow: 'Wetter', title: 'Orte', subtitle: 'Standort, gemerkte Orte und Reisen', primaryLabel: '' }),
          B('places', 'wx-places', 'main', { title: 'Gemerkte Orte', showCompare: true }),
          B('src', 'wx-source', 'main', { variant: 'footnote', settingsLink: true }),
          B('legal', 'legal-notice', 'main', { kind: 'daten', style: 'footnote', text: 'Der Standort wird nur für die Wetterabfrage verwendet. Gemerkte Orte bleiben auf dem Gerät.' }),
        ],
      }],
      selectedVariantId: 'A', links: ['weather.home', 'weather.settings'],
    },
    // ======================================================================= Einstellungen
    {
      id: 'weather.settings', name: 'Einheiten & Benachrichtigungen', group: 'Einstellungen', status: 'design', tier: 3, usage: 'selten',
      purpose: 'Einheiten und Hinweise so einstellen, dass das Wetter zu einem passt: °C/°F, km/h oder Beaufort, Regen-Hinweis, Tageszusammenfassung, Warnstufe, Ruhezeiten, Quelle.',
      requirements: [
        { text: 'Einheiten für Temperatur, Wind, Niederschlag und Druck mit Live-Vorschau', type: 'action', priority: 'must' },
        { text: 'Änderungen wirken sofort in Übersicht, Stündlich, 10 Tage, Radar, Kleidung und Warnungen', type: 'rule', priority: 'must' },
        { text: 'Benachrichtigungen: Regen in Minuten, tägliche Zusammenfassung um 07:00, Pollen, UV, Termin-Hinweise', type: 'action', priority: 'must' },
        { text: 'Warnungen ab Stufe 1–4, nur Standort oder alle Orte, Ruhezeiten mit Ausnahme ab Stufe 3', type: 'action', priority: 'must' },
        { text: 'Aktualisierungsintervall und Datenquelle (Entscheidung offen); Offline simulieren', type: 'info', priority: 'should' },
        { text: 'Schalter und Auswahl mit Touch-Ziel ≥ 44 px, mit Beschriftung für Screenreader', type: 'rule', priority: 'must' },
      ],
      interactions: [{ trigger: 'Einstellung ändern', result: 'Wert wird gespeichert und wirkt sofort', event: 'weather.settings.change' }],
      acceptance: ['Wechsel auf °F und m/s ändert die Vorschauzeile und danach alle Wetter-Screens.', '„Offline simulieren“ zeigt überall den letzten Stand mit Hinweis.', 'Ruhezeiten zeigen die Ausnahme für Stufe 3 und höher.', 'Die offene Entscheidung zur Datenquelle ist sichtbar.'],
      viewports: ['desktop', 'mobile'], demoData: wd('place', 'settings'),
      variants: [{
        id: 'A', name: 'Gruppierte Liste', direction: 'kompakt', concept: 'Vier Karten: Einheiten (mit Vorschau), Benachrichtigungen, Unwetterwarnungen, Daten und Aktualisierung.',
        description: '+ Vertraut und schnell  − lange Liste',
        layout: { type: 'stack', narrow: true },
        blocks: [
          hdr({ eyebrow: 'Wetter', title: 'Einstellungen', subtitle: 'Einheiten und Benachrichtigungen · gilt für alle Orte', primaryLabel: '' }),
          B('set', 'wx-settings', 'main', { showPreview: true }),
          B('legal', 'legal-notice', 'main', { kind: 'daten', style: 'footnote', text: 'Der Standort wird nur für die Wetterabfrage verwendet; es werden keine Bewegungsdaten gespeichert.' }),
        ],
      }],
      selectedVariantId: 'A', links: ['weather.home'],
    },
    // ======================================================================= Widgets (unverändert, Skizze)
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
    { featureId: 'weather.settings', title: 'Wetterquelle: DWD, Open-Meteo oder kommerzieller Dienst?', decision: '',
      rationale: 'Radar, Pollen, Luftqualität und amtliche Warnungen hängen an der Quelle. DWD-Open-Data ist frei, hat aber kein UV und keine Pollen im selben Format; Open-Meteo liefert Luft und Pollen, nicht aber amtliche Warnungen; kommerzielle Dienste decken alles ab, kosten aber und brauchen Lizenzen.',
      tradeoffs: 'Eine Quelle ist einfacher zu pflegen, mehrere Quellen liefern bessere Daten, brauchen aber Attribution und Abgleich.',
      alternatives: 'DWD + Open-Meteo kombinieren; nur kommerzieller Dienst; nur Open-Meteo mit Hinweis „nicht amtlich“ bei Warnungen.', status: 'open' },
    { featureId: 'weather.radar', title: 'Radar: schematische Rasterkarte oder echte Kartenkacheln?', decision: '',
      rationale: 'Echte Kacheln wirken vertrauter, brauchen aber Kartenlizenz, mehr Datenvolumen und Offline-Strategie. Die schematische Rasterkarte ist leicht, offline-fähig und reicht für „kommt Regen, woher, wann“.',
      tradeoffs: 'Schematisch: wenig Orientierung abseits der Stadt. Echt: Lizenz- und Traffic-Kosten.', status: 'open' },
    { featureId: 'weather.alerts', title: 'Push bei Unwetterwarnungen', decision: 'Standardmäßig Push ab Stufe 2 für den Standort; Schwelle, Orte und Ruhezeiten stehen in den Wetter-Einstellungen. Stufe 3 und höher durchbricht die Ruhezeit.',
      rationale: 'Sturm und Glätte sind der wichtigste Nutzen von Push im Wetter. Die Kanäle (Benachrichtigungscenter, Ruhezeiten) laufen zentral in „Mitteilungen“, damit es keine Doppelungen gibt.',
      tradeoffs: 'Mehr Mitteilungen bei Stufe 1 möglich – deshalb Standard erst ab Stufe 2.', status: 'decided' },
    { featureId: 'weather.hourly', title: 'Stundenverlauf: 24 oder 48 Stunden?', decision: '48 Stunden ab jetzt, dazu Tageswahl für die nächsten Tage (Stundenwerte für 5 Tage, danach Tagesprofil).',
      rationale: '48 Stunden decken „heute Abend“ und „morgen früh“ ab, wischen lässt sich gut. Die Tageswahl hält die Kurve lesbar.',
      tradeoffs: 'Auf Mobile mehr Wischen; Gewinn bei der Planung von Terminen und Training.', status: 'decided' },
    { featureId: 'weather.advice', title: 'Kleidungstipp: Empfindlichkeit einstellbar', decision: 'Drei Stufen (friert schnell, normal, unempfindlich) verschieben die gefühlte Temperatur um −3 / 0 / +3 °C; Standard „normal“.',
      rationale: 'Das persönliche Kälteempfinden unterscheidet sich stark; ein fester Tipp wird sonst ignoriert. Drei Stufen sind einfach erklärbar.',
      tradeoffs: 'Weniger fein als ein freier Regler, dafür verständlich und testbar.', status: 'decided' },
  ],
};
