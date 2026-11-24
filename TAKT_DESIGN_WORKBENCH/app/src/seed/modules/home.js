// Modul "Start" – das Herzstück der App: modulübergreifende Tagesübersicht, Briefing, Rückblick und Anpassung.
// Referenztag: Di, 24.11.2026 09:30 (ctx.today). Termine, Aufgaben, Finanzen, Wetter, Training und Ernährung kommen aus der gemeinsamen
// Datenwelt (@world:…), Gewohnheiten aus dem Modul „Gewohnheiten“.
import calendar from './calendar.js';
import tasks from './tasks.js';
import finance from './finance.js';
import savings from './savings.js';
import fitness from './fitness.js';
import nutrition from './nutrition.js';
import weather from './weather.js';

// --- Navigationsziele: nur Features, die es wirklich gibt --------------------------------------------------------
const FEATURE_IDS = new Set([calendar, tasks, finance, savings, fitness, nutrition, weather].flatMap((m) => (m.features || []).map((f) => f.id)));
const go = (...ids) => ids.find((id) => FEATURE_IDS.has(id)) || '';
const NAV = {
  calendar: go('calendar.home', 'calendar.week'), tasks: go('tasks.home', 'tasks.overview'), habits: 'habits.home', weather: go('weather.home', 'weather.current'),
  finance: go('finance.home', 'finance.accounts'), savings: go('savings.home'), training: go('fitness.home', 'fitness.overview'), nutrition: go('nutrition.home'),
};
const LABEL = { calendar: 'Kalender', tasks: 'Aufgaben', habits: 'Gewohnheiten', weather: 'Wetter', finance: 'Finanzen', savings: 'Sparpläne', training: 'Fitness', nutrition: 'Ernährung' };
/** Interaktionen „<prefix>.<modul>“ → Modul-Startseite, nur wo das Ziel existiert. */
const links = (prefix, keys, what) => keys.filter((k) => NAV[k]).map((k) => ({ trigger: `${what}: ${LABEL[k]}`, result: `${LABEL[k]} öffnet sich`, event: `${prefix}.${k}`, to: NAV[k] }));

// --- Lokale Kurzdaten der Persona (Di, 24.11.2026 09:30) -----------------------------------------------------------
// Wetter, Training und Ernährung kommen aus der gemeinsamen Datenwelt (Wetter-Ort, Fitness heute, Ernährung heute).
const HINTS = [
  { id: 'hi1', tone: 'danger', icon: 'alert-circle', title: 'Angebot Müller GmbH heute 14:00 fällig', text: 'Noch offen: PDF erzeugen und an den Kunden senden – etwa 60 Minuten eingeplant.', source: 'Aufgaben', module: 'tasks', actionLabel: 'Aufgabe öffnen', needs: { task: 't1' } },
  { id: 'hi2', tone: 'warning', icon: 'wind', title: 'Sturmböen ab 14 Uhr', text: 'Der Lieferanten-Call um 15:00 läuft per Zoom – Wege am besten vor 14 Uhr erledigen.', source: 'Wetter · Kalender', module: 'weather', actionLabel: 'Wetter ansehen', needs: { alert: true, events: 'e6' } },
  { id: 'hi3', tone: 'accent', icon: 'calendar-clock', title: 'Überschneidung um 11:00', text: 'Sprint-Planung und „Fokus: Workbench-Review“ liegen übereinander.', source: 'Kalender', module: 'calendar', actionLabel: 'Im Kalender ansehen', needs: { events: ['e3', 'e4'] } },
  { id: 'hi4', tone: 'info', icon: 'piggy-bank', title: 'Sparpläne laufen am 01.12.', text: 'Die nächste Ausführung ist am Dienstag; das Girokonto ist ausreichend gedeckt.', source: 'Sparpläne · Finanzen', module: 'savings', actionLabel: 'Sparpläne ansehen', needs: { plans: true } },
  { id: 'hi5', tone: 'neutral', icon: 'tv', title: 'Netflix seit 34 Tagen nicht genutzt', text: 'Das Abo läuft monatlich weiter – prüfen, ob es noch gebraucht wird.', source: 'Finanzen (Abos)', module: 'finance', actionLabel: 'Abos prüfen', needs: { sub: 'sub-netflix' } },
];
const TILES = [
  { id: 'hints', label: 'Hinweise', icon: 'sparkles', tone: 'accent', on: true, size: 'M' }, { id: 'rings', label: 'Tag in Ringen', icon: 'target', tone: 'success', on: true, size: 'M' },
  { id: 'agenda', label: 'Agenda', icon: 'calendar', tone: 'accent', on: true, size: 'L' }, { id: 'tasks', label: 'Aufgaben', icon: 'list-checks', tone: 'warning', on: true, size: 'M' },
  { id: 'habits', label: 'Gewohnheiten', icon: 'repeat', tone: 'success', on: true, size: 'M' }, { id: 'weather', label: 'Wetter', icon: 'cloud-sun', tone: 'info', on: true, size: 'S' },
  { id: 'finance', label: 'Finanzen', icon: 'wallet', tone: 'accent2', on: true, size: 'S' }, { id: 'savings', label: 'Sparplan', icon: 'piggy-bank', tone: 3, on: false, size: 'S' },
  { id: 'training', label: 'Training', icon: 'dumbbell', tone: 6, on: true, size: 'S' }, { id: 'nutrition', label: 'Ernährung', icon: 'apple', tone: 4, on: false, size: 'S' },
  { id: 'quick', label: 'Schnellerfassung', icon: 'plus', tone: 'accent', on: true, size: 'M' },
];
// Wochenwerte (Aufgaben, Fokuszeit, Auszahlungen) werden nie hier gepflegt: Diagramm und Rückblick rechnen sie aus der Welt (tasks, taskActivity, taskFocusLog, transactions).

const world = { events: '@world:events', tasks: '@world:tasks', finance: '@world:financeSummary', plans: '@world:savingsPlans', budgets: '@world:budgets', subs: '@world:subscriptions', weather: '@world:wxActive', training: '@world:fitnessToday', nutrition: '@world:nutSummary', activity: '@world:taskActivity', log: '@world:taskFocusLog', transactions: '@world:transactions' };
const local = { habits: '@world:habits', hints: HINTS };
const ALL_VP = ['desktop', 'notebook', 'tablet', 'mobile'];
const demoToday = { ...world, ...local, tiles: TILES };
const demoBrief = { ...world, ...local };
const demoReview = { ...world, ...local };

const EXTRA_NAV = [
  { trigger: 'Gewohnheit antippen', result: 'Detail der Gewohnheit (Serie, Heatmap)', event: 'habit.open', to: 'habits.detail' },
  { trigger: '„Alle Gewohnheiten“', result: 'Gewohnheiten – Heute', event: 'habit.all', to: 'habits.home' },
];

// Gesundheitshinweis (docs/HEALTH_GUIDELINES.md, P1): jede Variante trägt eine sachliche Fußnote.
const LEGAL = { id: 'legal', component: 'legal-notice', region: 'footer', props: { kind: 'gesundheit', style: 'footnote' } };
const withLegal = (features, only) => features.map((f) => ((only && !only.includes(f.id)) || !f.variants?.length ? f : { ...f, variants: f.variants.map((v) => (v.blocks.some((b) => b.component === 'legal-notice') ? v : { ...v, blocks: [...v.blocks, LEGAL] })) }));

export default {
  module: {
    id: 'home', name: 'Start', icon: 'home', status: 'active', area: 'Tag & Organisation', theme: 'graphite', designVersion: '0.3', homeFeatureId: 'home.today',
    description: 'Das Herzstück: Heute auf einen Blick – Termine, Aufgaben, Gewohnheiten, Wetter, Geld und Training – dazu Morgenbriefing, Tagesrückblick und eine anpassbare Startseite.',
    source: 'Annahme der Workbench, Bauplan Brainstorming 24.11.2026 – in Phase 1 gegen das TAKT-Modulregister verifizieren',
    infoArchitecture: 'Einstieg der App. Drei Arten, den Tag zu sehen: Cockpit (alles gleichzeitig, dicht), Tageslandschaft (Ringe und große Karten) und Fokus-Feed (nächste Aktion, Hinweise, Kontext). Jede Kachel öffnet ihr Modul. Dazu Tagesbriefing (morgens, 30 Sekunden), Rückblick (Abend und Woche) und „Startseite anpassen“ (Kacheln wählen, sortieren, Größe).',
    docs: [
      '## Leitidee',
      '- Start besitzt keine eigenen Daten, sondern verdichtet Kalender, Aufgaben, Gewohnheiten, Wetter, Finanzen, Fitness und Ernährung. Jede Kachel führt in das zuständige Modul.',
      '- Hinweise sind regelbasiert (kein KI-Zwang), nennen Quelle und Aktion und lassen sich ausblenden oder auf später legen.',
      '- Beträge und Prozente laufen über den Privatsphäre-Modus; Hinweise nennen bewusst keine Beträge.',
      '',
      '## Annahmen',
      '- Referenztag der Workbench: Di, 24.11.2026 09:30. Wetter, Training und Ernährung kommen aus der gemeinsamen Datenwelt.',
      '- Gewohnheiten kommen aus dem Modul „Gewohnheiten“ (Tageszeiten Morgens, Tagsüber, Abends).',
      '',
      '## Offene Fragen',
      '- Gibt es im echten TAKT bereits eine Startseite oder ein Dashboard im Modulregister?',
      '- Wie viele Kacheln sind standardmäßig sichtbar (Minimal vs. Alles)?',
    ].join('\n'),
    links: ['calendar', 'tasks', 'habits', 'finance', 'savings', 'fitness', 'nutrition', 'weather'],
  },
  features: withLegal([
    // ----------------------------------------------------------------------------------------- Heute
    {
      id: 'home.today', name: 'Heute', group: 'Übersicht', status: 'design', tier: 1,
      purpose: 'Beim Öffnen der App in unter fünf Sekunden erfassen, was heute ansteht, was Aufmerksamkeit braucht und wie der Tag läuft – modulübergreifend, mit Sprung in jedes Modul.',
      requirements: [
        { text: 'Gesundheits-Leitplanken 3: Training, Ernährung und Gewohnheiten ohne Bewertung und ohne Alarmfarbe; Zahlen lassen sich ausblenden (Leitplanken 4)', type: 'rule', priority: 'must' },
        { text: 'Agenda des Tages (heutige Termine mit Uhrzeit und freien Fenstern) aus dem Kalender', type: 'info', priority: 'must' },
        { text: 'Fällige und überfällige Aufgaben, abhakbar, aus dem Aufgaben-Modul', type: 'action', priority: 'must' },
        { text: 'Gewohnheiten des Tages abhaken oder hochzählen; Sprung in „Gewohnheiten“', type: 'action', priority: 'must' },
        { text: 'Kurzinfos: Wetter, Finanzen (Ausgaben, Sparquote), nächste Sparplan-Ausführung, Training und Ernährung', type: 'info', priority: 'should' },
        { text: 'Smart-Hinweise mit Quelle und Aktion; ausblenden oder „Später“', type: 'action', priority: 'should' },
        { text: 'Schnellerfassung ohne Modulwechsel: Aufgabe, Notiz, Ausgabe, Wasser', type: 'action', priority: 'should' },
        { text: 'Jede Kachel öffnet ihr Modul; „Anpassen“ öffnet die Konfiguration der Startseite', type: 'action', priority: 'must' },
        { text: 'Leerer Tag zeigt freundlichen Leerzustand statt leerer Karten; Beträge folgen dem Privatsphäre-Modus', type: 'state', priority: 'must' },
      ],
      interactions: [
        { trigger: 'Aufgabe abhaken', result: 'Aufgabe wird durchgestrichen, Zähler und Ringe aktualisieren sich', event: 'task.toggle' },
        { trigger: 'Aufgabe antippen', result: 'Aufgaben-Detail', event: 'task.open', to: go('tasks.detail') },
        ...links('tile.open', ['calendar', 'tasks', 'habits', 'weather', 'finance', 'savings', 'training', 'nutrition'], 'Kachel'),
        ...links('hint.open', ['weather', 'tasks', 'calendar', 'finance', 'savings'], 'Hinweis'),
        ...EXTRA_NAV,
        { trigger: '„Briefing“ im Kopf', result: 'Morgenbriefing öffnet sich', event: 'briefing.open', to: 'home.briefing' },
        { trigger: '„Anpassen“ im Kopf', result: 'Startseite anpassen', event: 'header.secondary', to: 'home.customize' },
        { trigger: 'Schnellerfassung absenden', result: 'Aufgabe erscheint sofort in der Liste', event: 'quickadd.submit' },
        { trigger: 'Hinweis ausblenden / später', result: 'Hinweis verschwindet', event: 'hint.dismiss' },
      ].filter((i) => i.to !== '' || !/^(tile|hint)\.open/.test(i.event)),
      acceptance: [
        'Die Startseite zeigt Termine, Aufgaben, Gewohnheiten, Wetter und mindestens eine Finanzinformation, ohne das Modul zu wechseln.',
        'Jede Kachel öffnet im Launcher das zugehörige Modul; Gewohnheiten führen nach „Gewohnheiten – Heute“.',
        'Abhaken einer Aufgabe oder Gewohnheit wirkt sofort auf Zähler und Fortschrittsringe.',
        'Alle Beträge und Prozente verschwinden im Privatsphäre-Modus („•••• €“).',
        'Auf 360 px Breite gibt es keinen horizontalen Überlauf; alle Touch-Ziele sind mindestens 36 px hoch.',
        'Im Leerzustand zeigen die Blöcke einen Hinweis statt leerer Karten.',
      ],
      flows: [
        { id: 'fl-morgen', name: 'Morgens: Überblick und erste Aktion', steps: [{ featureId: 'home.today', action: 'Hinweis „Angebot fällig“ lesen' }, { featureId: 'home.today', action: 'Aufgabe antippen' }, { featureId: go('tasks.detail') || 'home.today', action: 'Teilschritt erledigen' }] },
        { id: 'fl-gewohnheiten', name: 'Gewohnheit abhaken und Serie prüfen', steps: [{ featureId: 'home.today', action: 'Dehnen abhaken' }, { featureId: 'home.today', action: '„Alle Gewohnheiten“ antippen' }, { featureId: 'habits.home', action: 'Fortschritt ansehen' }] },
      ],
      viewports: ALL_VP, demoData: demoToday,
      variants: [
        {
          id: 'A', name: 'Cockpit', direction: 'kompakt', concept: 'Dashboard-Raster: Kennzahlen oben, darunter Hinweise, Agenda, Aufgaben, Gewohnheiten und Kurzinfos – alles gleichzeitig sichtbar, Aktionen direkt in der Zeile. Schnellerfassung unten fixiert.',
          description: '+ Maximale Übersicht auf großen Bildschirmen  − Auf Mobile lange Seite',
          layout: { type: 'grid' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Dienstag, 24. November', title: 'Guten Morgen, Jonas', subtitle: 'Dein Tag auf einen Blick', primaryLabel: 'Briefing', primaryIcon: 'sunrise', primaryEvent: 'briefing.open', secondaryLabel: 'Anpassen', secondaryIcon: 'sliders-horizontal' } },
            { id: 'kpi', component: 'today-tiles', region: 'main', span: 12, spanTablet: 12, props: { layout: 'strip', tiles: ['calendar', 'tasks', 'habits', 'weather'] } },
            { id: 'hints', component: 'hint-cards', region: 'main', span: 12, spanTablet: 12, bind: { hints: 'hints' }, props: { title: 'Hinweise', style: 'list', limit: 2, dense: true } },
            { id: 'agenda', component: 'agenda', region: 'main', span: 7, spanTablet: 12, bind: { events: 'events' }, props: { title: 'Agenda heute', days: 1, startFrom: 'today', showFree: true } },
            { id: 'tasks', component: 'task-list', region: 'main', span: 5, spanTablet: 12, bind: { tasks: 'tasks' }, props: { title: 'Aufgaben', groupBy: 'due', showDone: false, dense: true, limit: 7, showProject: false, selectable: false } },
            { id: 'habits', component: 'habit-list', region: 'main', span: 5, spanTablet: 12, bind: { habits: 'habits' }, props: { title: 'Gewohnheiten', style: 'rows', groupBy: 'daypart', showWeek: false, showStreak: true } },
            { id: 'more', component: 'today-tiles', region: 'main', span: 7, spanTablet: 12, props: { title: 'Geld, Training & Ernährung', layout: 'list', tiles: ['finance', 'savings', 'training', 'nutrition'] } },
            { id: 'cap', component: 'quick-capture', region: 'bottom', bind: { tasks: 'tasks', habits: 'habits' }, props: { elevated: true } },
          ],
        },
        {
          id: 'B', name: 'Fokus-Feed', direction: 'fokus', concept: 'Eine Spalte, priorisiert nach Dringlichkeit: wichtigster Hinweis, dann „Als Nächstes“ (Termin, überfällige Aufgaben, freie Fenster), die nächste Gewohnheit und der Kontext aus anderen Modulen. Erfassen ohne Umweg unten.',
          description: '+ Klare Reihenfolge, schnell bedienbar  − Weniger Überblick auf Desktop',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { title: 'Heute', subtitle: 'Di, 24. November', primaryLabel: 'Briefing', primaryIcon: 'sunrise', primaryEvent: 'briefing.open', secondaryLabel: 'Anpassen', secondaryIcon: 'sliders-horizontal' } },
            { id: 'note', component: 'hint-cards', region: 'main', bind: { hints: 'hints' }, props: { style: 'banner' } },
            { id: 'next', component: 'focus-next', region: 'main', bind: { events: 'events', tasks: 'tasks' }, props: { title: 'Als Nächstes' } },
            { id: 'habit', component: 'habit-list', region: 'main', bind: { habits: 'habits' }, props: { title: 'Gewohnheiten', style: 'next', allLabel: 'Alle Gewohnheiten' } },
            { id: 'ctx', component: 'today-tiles', region: 'main', props: { title: 'Kontext', layout: 'list', tiles: ['calendar', 'tasks', 'weather', 'training', 'nutrition', 'finance', 'savings'] } },
            { id: 'cap', component: 'quick-capture', region: 'bottom', bind: { tasks: 'tasks', habits: 'habits' }, props: { elevated: true } },
          ],
        },
        {
          id: 'C', name: 'Tageslandschaft', direction: 'visuell', concept: 'Der Tag in Ringen und großen Karten: Fortschritt von Aufgaben, Gewohnheiten, Wasser und Terminen, daneben die Agenda; darunter eine Karte je Modul mit einer Botschaft. Wenig Text, viel Raum.',
          description: '+ Ruhig, auf einen Blick verständlich  − Weniger Details ohne Antippen',
          layout: { type: 'grid' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Dienstag, 24. November', title: 'Guten Morgen', subtitle: 'Ein ruhiger Überblick über deinen Tag', primaryLabel: 'Briefing', primaryIcon: 'sunrise', primaryEvent: 'briefing.open', secondaryLabel: 'Anpassen', secondaryIcon: 'sliders-horizontal' } },
            { id: 'rings', component: 'day-rings', region: 'main', span: 5, spanTablet: 12, bind: { events: 'events', tasks: 'tasks', habits: 'habits' }, props: { title: 'Dein Tag', layout: 'stacked' } },
            { id: 'agenda', component: 'agenda', region: 'main', span: 7, spanTablet: 12, bind: { events: 'events' }, props: { title: 'Heute', days: 1, startFrom: 'today', showFree: true } },
            { id: 'cards', component: 'today-tiles', region: 'main', span: 12, spanTablet: 12, props: { layout: 'cards', columns: 3, tiles: ['weather', 'finance', 'training', 'nutrition', 'savings', 'tasks'] } },
            { id: 'habits', component: 'habit-list', region: 'main', span: 12, spanTablet: 12, bind: { habits: 'habits' }, props: { title: 'Gewohnheiten', style: 'cards', allLabel: 'Alle Gewohnheiten' } },
            { id: 'chart', component: 'task-week-chart', region: 'main', span: 7, spanTablet: 12, bind: { tasks: 'tasks', activity: 'activity', log: 'log' }, props: { title: 'Aufgaben – letzte 7 Tage' } },
            { id: 'hints', component: 'hint-cards', region: 'main', span: 5, spanTablet: 12, bind: { hints: 'hints' }, props: { title: 'Hinweise', style: 'list', limit: 3 } },
          ],
        },
      ],
      selectedVariantId: 'B',
      links: ['home.briefing', 'home.review', 'home.customize', 'habits.home', 'calendar.week', 'tasks.overview'],
    },
    // ------------------------------------------------------------------------------------ Tagesbriefing
    {
      id: 'home.briefing', name: 'Tagesbriefing', group: 'Rituale', status: 'design', tier: 1,
      purpose: 'Das Morgenbriefing in 30 Sekunden: Wetter, erster Termin, wichtigste Aufgaben, Gewohnheiten, Geld und Training – als lesbare Karte und als Mitteilung um 07:00.',
      requirements: [
        { text: 'Gesundheits-Leitplanken 3: Training, Ernährung und Gewohnheiten ohne Bewertung und ohne Alarmfarbe; Zahlen lassen sich ausblenden (Leitplanken 4)', type: 'rule', priority: 'must' },
        { text: 'Mindestens fünf Quellen (Wetter, Kalender, Aufgaben, Gewohnheiten, Finanzen, Fitness/Ernährung), jede mit Quellenangabe', type: 'info', priority: 'must' },
        { text: 'Jede Zeile führt ins zuständige Modul', type: 'action', priority: 'must' },
        { text: 'Mitteilung um 07:00 an- und ausschaltbar', type: 'action', priority: 'should' },
        { text: 'Kleidungs- und Wegetipp aus dem Wetter (Sturmböen, Termine)', type: 'info', priority: 'should' },
        { text: 'Briefing lässt sich als gelesen markieren; danach geht es zur Startseite', type: 'action', priority: 'should' },
        { text: 'Leerzustand, wenn noch keine Quellen verbunden sind', type: 'state', priority: 'must' },
      ],
      interactions: [
        ...links('briefing.open', ['weather', 'calendar', 'tasks', 'habits', 'finance', 'training'], 'Zeile'),
        { trigger: '„Los geht’s“ / „Verstanden“', result: 'Zurück zur Startseite', event: 'briefing.done', to: 'home.today' },
        { trigger: 'Mitteilung ein/aus', result: 'Hinweis „täglich um 07:00“', event: 'briefing.schedule' },
        { trigger: 'Weiter in den Karten', result: 'Nächste Karte', event: 'briefing.step' },
      ],
      acceptance: [
        'Das Briefing nennt mindestens fünf Quellen und beschreibt jede in höchstens zwei Zeilen.',
        'Jede Zeile führt im Launcher in das jeweilige Modul.',
        'Der Schritte-Modus lässt sich in sechs Taps durchgehen und endet auf der Startseite.',
        'Zahlen im Briefing (Termine, Aufgaben, Gewohnheiten) stimmen mit der Startseite überein.',
      ],
      flows: [{ id: 'fl-brief', name: 'Briefing in 30 Sekunden', steps: [{ featureId: 'home.briefing', action: 'Karten durchgehen' }, { featureId: 'home.briefing', action: '„Los geht’s“' }, { featureId: 'home.today', action: 'Mit dem Tag starten' }] }],
      viewports: ALL_VP, demoData: demoBrief,
      variants: [
        {
          id: 'A', name: 'Liste', direction: 'kompakt', concept: 'Alle Zeilen untereinander mit Quelle, darunter die wichtigsten Hinweise. Schnell zu überfliegen.',
          description: '+ Alles in einem Blick, dicht  − Wenig erzählerisch',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Start', title: 'Tagesbriefing', subtitle: 'In 30 Sekunden informiert', primaryLabel: '' } },
            { id: 'brief', component: 'day-brief', region: 'main', props: { style: 'list' } },
            { id: 'hints', component: 'hint-cards', region: 'main', bind: { hints: 'hints' }, props: { title: 'Hinweise', style: 'list', limit: 3, dense: true } },
          ],
        },
        {
          id: 'B', name: 'Geschichte', direction: 'visuell', concept: 'Eine große Begrüßungskarte mit dem Tag in einem Satz, darunter eine Karte je Quelle. Ruhig, mit viel Raum.',
          description: '+ Schön lesbar, motivierend  − Mehr Scrollen',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'brief', component: 'day-brief', region: 'main', props: { style: 'story' } },
          ],
        },
        {
          id: 'C', name: 'Schritte', direction: 'fokus', concept: 'Eine Karte nach der anderen – Wetter, Termine, Aufgaben, Gewohnheiten, Geld, Training – mit „Weiter“ und am Ende „Los geht’s“.',
          description: '+ Keine Ablenkung, in 30 Sekunden durch  − Kein Überblick auf einmal',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'brief', component: 'day-brief', region: 'main', props: { style: 'steps' } },
          ],
        },
      ],
      selectedVariantId: 'C',
      links: ['home.today', 'home.review'],
    },
    // ----------------------------------------------------------------------------------------- Rückblick
    {
      id: 'home.review', name: 'Rückblick', group: 'Rituale', status: 'review', tier: 2,
      purpose: 'Abends den Tag abschließen (Aufgaben verschieben, Gewohnheiten bestätigen, Top 3 für morgen) und sonntags die Woche aus allen Modulen zurückblicken.',
      requirements: [
        { text: 'Gesundheits-Leitplanken 3: Training, Ernährung und Gewohnheiten ohne Bewertung und ohne Alarmfarbe; Zahlen lassen sich ausblenden (Leitplanken 4)', type: 'rule', priority: 'must' },
        { text: 'Tagesabschluss in drei Schritten: offene Aufgaben (erledigt, auf morgen, streichen), Gewohnheiten, Top 3 und Energie', type: 'action', priority: 'must' },
        { text: 'Aufgaben auf morgen schieben mit einem Tipp; das Ergebnis ist sofort in der Aufgabenliste sichtbar', type: 'action', priority: 'must' },
        { text: 'Wochenrückblick mit mindestens sechs Kennzahlen aus fünf Modulen (Aufgaben, Fokuszeit, Training, Gewohnheiten, Budget, Sparquote, Shop)', type: 'info', priority: 'must' },
        { text: 'Drei Fragen und Speichern als Notiz', type: 'action', priority: 'should' },
        { text: 'Abschluss in höchstens zwei Minuten bedienbar', type: 'rule', priority: 'should' },
        { text: 'Leerzustand, wenn nichts abzuschließen ist („Sauber abgeschlossen“)', type: 'state', priority: 'must' },
      ],
      interactions: [
        { trigger: 'Aufgabe erledigt / auf morgen / streichen', result: 'Aufgabe wird aktualisiert', event: 'ritual.task.move' },
        { trigger: 'Tag abschließen', result: 'Zusammenfassung mit Zählern', event: 'ritual.complete' },
        { trigger: 'Woche wechseln', result: 'Kennzahlen berechnen sich neu', event: 'review.week' },
        ...links('review.open', ['tasks', 'calendar', 'habits', 'finance', 'savings', 'training'], 'Kennzahl'),
        { trigger: 'Als Notiz sichern', result: 'Rückblick gespeichert', event: 'review.save' },
      ],
      acceptance: [
        'Der Tagesabschluss verschiebt Aufgaben sichtbar: Nach „Morgen“ steht die Aufgabe in der Aufgabenliste mit dem Datum Mi, 25.11.',
        'Der Wochenrückblick zeigt mindestens sechs Kennzahlen aus fünf Modulen und verlinkt jede.',
        'Gewohnheiten lassen sich im Abschluss bestätigen und wirken auf „Heute“.',
        'Der Abschluss ist in unter zwei Minuten durchführbar (drei Schritte, ein Tipp je Aufgabe).',
      ],
      flows: [{ id: 'fl-abend', name: 'Abends abschließen', steps: [{ featureId: 'home.review', action: 'Offene Aufgaben auf morgen schieben' }, { featureId: 'home.review', action: 'Gewohnheiten bestätigen' }, { featureId: 'home.review', action: 'Top 3 wählen, Tag abschließen' }] }],
      viewports: ALL_VP, demoData: demoReview,
      variants: [
        {
          id: 'A', name: 'Abend & Woche (Liste)', direction: 'kompakt', concept: 'Zwei Reiter: Abend (alle drei Schritte auf einer Seite) und Woche (Kennzahlen als Liste mit Delta). Dicht und schnell.',
          description: '+ Alles ohne Blättern  − Lange Seite',
          layout: { type: 'tabs' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Start', title: 'Rückblick', subtitle: 'Abend abschließen, Woche verstehen', primaryLabel: '', secondaryLabel: 'Startseite', secondaryIcon: 'home' } },
            { id: 'day', component: 'ritual-stepper', region: 'main', tab: 'Abend', bind: { tasks: 'tasks', habits: 'habits' }, props: { style: 'list' } },
            { id: 'week', component: 'week-review', region: 'main', tab: 'Woche', bind: { tasks: 'tasks', activity: 'activity', log: 'log', transactions: 'transactions', habits: 'habits', finance: 'finance', budgets: 'budgets' }, props: { scope: 'all', style: 'list' } },
          ],
        },
        {
          id: 'B', name: 'Woche in Karten', direction: 'visuell', concept: 'Die Woche als Karten mit Vergleich zur Vorwoche und Diagramm; der Abend als geführter Ablauf im zweiten Reiter.',
          description: '+ Erzählend, schöne Übersicht  − Abend erst im zweiten Reiter',
          layout: { type: 'tabs' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Start', title: 'Rückblick', subtitle: 'Was diese Woche geschafft wurde', primaryLabel: '', secondaryLabel: 'Startseite', secondaryIcon: 'home' } },
            { id: 'week', component: 'week-review', region: 'main', tab: 'Woche', bind: { tasks: 'tasks', activity: 'activity', log: 'log', transactions: 'transactions', habits: 'habits', finance: 'finance', budgets: 'budgets' }, props: { scope: 'all', style: 'cards' } },
            { id: 'chart', component: 'task-week-chart', region: 'main', tab: 'Woche', bind: { tasks: 'tasks', activity: 'activity', log: 'log' }, props: { title: 'Aufgaben – letzte 7 Tage' } },
            { id: 'day', component: 'ritual-stepper', region: 'main', tab: 'Abend', bind: { tasks: 'tasks', habits: 'habits' }, props: { style: 'wizard' } },
          ],
        },
        {
          id: 'C', name: 'Abschluss-Ritual', direction: 'fokus', concept: 'Nur der Tagesabschluss, Schritt für Schritt: Aufgaben, Gewohnheiten, Morgen. Ein ruhiger Hinweis auf den Wochenrückblick am Sonntag.',
          description: '+ Kurz, klar, abends genau richtig  − Woche nicht sichtbar',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { title: 'Tagesabschluss', subtitle: 'In zwei Minuten bereit für morgen', primaryLabel: '', secondaryLabel: 'Startseite', secondaryIcon: 'home' } },
            { id: 'day', component: 'ritual-stepper', region: 'main', bind: { tasks: 'tasks', habits: 'habits' }, props: { style: 'wizard' } },
            { id: 'note', component: 'notice-banner', region: 'main', props: { tone: 'info', title: 'Wochenrückblick am Sonntag', text: 'Sonntags stellt TAKT die Woche aus allen Modulen zusammen – mit drei Fragen zum Mitnehmen.', dismissible: true } },
          ],
        },
      ],
      selectedVariantId: 'C',
      links: ['home.today', 'habits.review'],
      seedHistory: [{ kind: 'draft', note: 'Entwurf: Tagesabschluss als Stepper, Wochenrückblick als Karten' }, { kind: 'review', note: 'Zur Prüfung: Dauer unter 2 Minuten, Verschieben mit einem Tipp' }],
    },
    // --------------------------------------------------------------------------- Startseite anpassen
    {
      id: 'home.customize', name: 'Startseite anpassen', group: 'Einstellungen', status: 'design', tier: 3,
      purpose: 'Die Startseite zusammenstellen: Kacheln ein- und ausblenden, sortieren, Größe wählen – mit Vorlagen für typische Tage.',
      requirements: [
        { text: 'Kacheln ein-/ausblenden und sortieren (Pfeile, auch per Tastatur bedienbar)', type: 'action', priority: 'must' },
        { text: 'Größe je Kachel (klein, mittel, groß)', type: 'action', priority: 'should' },
        { text: 'Vorlagen „Minimal“, „Arbeit“, „Fitness-Fokus“, „Alles“', type: 'action', priority: 'should' },
        { text: 'Live-Vorschau der gewählten Reihenfolge', type: 'info', priority: 'should' },
        { text: 'Zurücksetzen auf Standard; Speichern bestätigt mit Hinweis', type: 'action', priority: 'must' },
        { text: 'Hinweis, wenn keine Kachel gewählt ist', type: 'state', priority: 'should' },
      ],
      interactions: [
        { trigger: 'Schalter an/aus', result: 'Kachel erscheint oder verschwindet in der Vorschau', event: 'customize.toggle' },
        { trigger: 'Pfeil hoch/runter', result: 'Reihenfolge ändert sich', event: 'customize.move' },
        { trigger: 'Vorlage wählen', result: 'Auswahl wird gesetzt', event: 'customize.preset' },
        { trigger: 'Speichern', result: 'Startseite gespeichert, zurück zu „Heute“', event: 'customize.save', to: 'home.today' },
      ],
      acceptance: [
        'Jede Kachel hat einen beschrifteten Schalter und Pfeile mit Beschriftung (Tastatur und Screenreader).',
        'Vorlagen setzen die Sichtbarkeit sofort, die Vorschau folgt unmittelbar.',
        'Speichern führt zurück zur Startseite und bestätigt per Hinweis.',
      ],
      viewports: ALL_VP, demoData: { tiles: TILES },
      variants: [
        {
          id: 'A', name: 'Liste', direction: 'kompakt', concept: 'Eine Liste aller Kacheln mit Schalter, Größe und Pfeilen. Vorlagen als Chips oben.',
          description: '+ Schnell, präzise  − Ergebnis nur im Kopf',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Start', title: 'Startseite anpassen', subtitle: 'Kacheln wählen und sortieren', primaryLabel: '' } },
            { id: 'cfg', component: 'tile-config', region: 'main', props: { mode: 'list', showPresets: true, showSizes: true } },
          ],
        },
        {
          id: 'B', name: 'Mit Vorschau', direction: 'visuell', concept: 'Links die Liste, rechts eine Live-Vorschau der Startseite im Handy-Rahmen – Größen sieht man sofort.',
          description: '+ Ergebnis sichtbar  − Auf Mobile Vorschau unter der Liste',
          layout: { type: 'stack' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Start', title: 'Startseite anpassen', subtitle: 'Gestalte deinen Start', primaryLabel: '' } },
            { id: 'cfg', component: 'tile-config', region: 'main', props: { mode: 'preview', showPresets: true, showSizes: true } },
          ],
        },
      ],
      selectedVariantId: 'B',
      links: ['home.today'],
    },
    // ---------------------------------------------------------------------------------- Hinweise
    {
      id: 'home.hints', name: 'Hinweise', group: 'Übersicht', status: 'design', tier: 2,
      purpose: 'Regelbasierte Hinweise aus allen Modulen („Sturm und Termin“, „Frist heute“, „Abo ungenutzt“) – mit Quelle, Aktion, Wegwischen und „Später“.',
      requirements: [
        { text: 'Jeder Hinweis nennt Quelle (Modul) und eine Aktion', type: 'rule', priority: 'must' },
        { text: 'Wegwischen und „Später erinnern“; ausgeblendete Hinweise kommen nicht sofort wieder', type: 'action', priority: 'must' },
        { text: 'Priorisierung: Frist heute vor Wetter vor Spar-Tipps', type: 'rule', priority: 'should' },
        { text: 'Hinweise nennen keine Beträge (Privatsphäre)', type: 'rule', priority: 'should' },
        { text: 'Leerzustand „Alles im Griff“', type: 'state', priority: 'must' },
      ],
      interactions: [...links('hint.open', ['weather', 'tasks', 'calendar', 'finance', 'savings'], 'Hinweis'), { trigger: 'Hinweis wegwischen', result: 'Hinweis verschwindet', event: 'hint.dismiss' }],
      viewports: ALL_VP, demoData: { ...world, hints: HINTS },
      variants: [
        {
          id: 'A', name: 'Karten', direction: 'fokus', concept: 'Hinweise als Karten mit Farbkante, Quelle und Aktion – der wichtigste zuerst.',
          description: '+ Klar, handlungsorientiert  − Nimmt Platz',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Start', title: 'Hinweise', subtitle: 'Was jetzt wichtig ist', primaryLabel: '' } },
            { id: 'hints', component: 'hint-cards', region: 'main', bind: { hints: 'hints' }, props: { title: 'Hinweise', style: 'cards' } },
          ],
        },
      ],
      selectedVariantId: 'A',
      links: ['home.today'],
    },
    // ------------------------------------------------------------------------------ Erste Schritte
    {
      id: 'home.firststeps', name: 'Erste Schritte', group: 'Übersicht', status: 'analyzed', tier: 3,
      purpose: 'Leerzustand der Startseite: statt leerer Karten eine Checkliste mit den nächsten Einrichtungsschritten (Kalender verbinden, erste Aufgabe, erste Gewohnheit, Wetterort).',
      requirements: [
        { text: 'Checkliste mit höchstens fünf Schritten, jeder mit direktem Sprung', type: 'action', priority: 'must' },
        { text: 'Abgehakte Schritte bleiben sichtbar, bis alle erledigt sind; dann verschwindet die Karte', type: 'rule', priority: 'should' },
        { text: 'Beispielinhalte laden oder leer starten', type: 'action', priority: 'could' },
      ],
      interactions: [], viewports: ALL_VP, demoData: demoToday, variants: [], links: ['home.today'],
    },
  ], ['home.today', 'home.briefing', 'home.review']),
  decisions: [
    { featureId: 'home.today', title: 'Start-Modul als eigenständiges Modul führen?', decision: '', rationale: 'Annahme der Workbench. Klären, ob TAKT bereits eine Startseite/Dashboard im Modulregister hat und wie sie mit „Einstellungen › Start-Modul“ zusammenhängt.', tradeoffs: 'Eigenständig: klare Verantwortung, eigene Features. Als Einstellung eines anderen Moduls: weniger Aufwand, aber keine eigene Navigation.', status: 'open' },
    { featureId: 'home.today', title: 'Welche Richtung für „Heute“?', decision: '', rationale: 'Cockpit (A) zeigt alles gleichzeitig, Fokus-Feed (B) priorisiert die nächste Aktion, Tageslandschaft (C) setzt auf Ringe und große Karten. Entscheidung nach Test mit echtem Tagesablauf und einhändiger Bedienung auf dem Handy.', tradeoffs: 'A: viel Information, auf Mobile lang. B: schnell, weniger Überblick. C: ruhig, weniger Details ohne Antippen.', status: 'open' },
    { featureId: 'home.hints', title: 'Hinweise regelbasiert statt KI', decision: 'Hinweise entstehen aus einfachen Regeln (Frist heute, Wetter und Termin, ungenutztes Abo), nennen Quelle und Aktion und kommen ohne KI-Dienst aus.', rationale: 'Nachvollziehbar, offline, datensparsam. Jeder Hinweis lässt sich erklären („Quelle: Wetter · Kalender“).', tradeoffs: 'Weniger „intelligent“. Dafür vorhersagbar und testbar.', status: 'decided' },
    { featureId: 'home.today', title: 'Kachel führt in die Modul-Startseite', decision: 'Jede Kachel öffnet die Startseite des zuständigen Moduls (nicht ein Unterfeature), außer es gibt einen direkten Bezug wie „Aufgabe antippen“ → Aufgaben-Detail.', rationale: 'Vorhersehbar und einheitlich: Man landet immer dort, wo man weitermachen kann.', tradeoffs: 'Ein Tipp mehr bis zum Detail. Dafür kein Verirren in Unterseiten.', status: 'decided' },
  ],
};
