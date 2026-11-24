// Modul "Start" – modulüberggreifende Tagesübersicht (Annahme, in Phase 1 verifizieren)
const metrics = [
  { label: 'Termine heute', value: 5, icon: 'calendar', tone: 'accent', delta: 1, suffix: '' },
  { label: 'Aufgaben fällig', value: 7, icon: 'list-checks', tone: 'warning', delta: -2, suffix: '', invert: true },
  { label: 'Fokuszeit geplant', value: '3,5', unit: 'h', icon: 'timer', tone: 'success', delta: 12, spark: [2, 2.5, 3, 2.75, 3.25, 3.5] },
  { label: 'Ausgaben Nov.', value: '1.284', unit: '€', icon: 'wallet', tone: 'info', delta: -6, invert: true, spark: [1500, 1420, 1390, 1350, 1300, 1284] },
];
const agenda = [
  { id: 'e1', title: 'Daily Stand-up', subtitle: 'Team TAKT · Teams', meta: '09:45', badge: 'Arbeit', tone: 'accent', icon: 'users', group: 'Vormittag' },
  { id: 'e2', title: 'Fokus: Workbench-Review', subtitle: 'Varianten Kalender freigeben', meta: '10:30', badge: 'Fokus', tone: 'success', icon: 'target', group: 'Vormittag' },
  { id: 'e3', title: 'Mittag mit Jana', meta: '12:30', badge: 'Privat', tone: 'accent2', icon: 'utensils', group: 'Mittag' },
  { id: 'e4', title: 'Lieferanten-Call Etsy', subtitle: 'Konditionen Q1', meta: '15:00', badge: 'Sales', tone: 'warning', icon: 'store', group: 'Nachmittag' },
  { id: 'e5', title: 'Krafttraining Oberkörper', meta: '18:30', badge: 'Fitness', tone: 'info', icon: 'dumbbell', group: 'Abend' },
];
const tasks = [
  { id: 't1', title: 'Angebot Müller GmbH finalisieren', meta: 'heute', badge: 'Hoch', tone: 'danger', done: false },
  { id: 't2', title: 'Belege Oktober hochladen', meta: 'heute', badge: 'Mittel', tone: 'warning', done: false },
  { id: 't3', title: 'Produktfotos Winterkollektion', meta: 'morgen', badge: 'Mittel', tone: 'warning', done: false },
  { id: 't4', title: 'Steuerberater Termin bestätigen', meta: 'Do', badge: 'Niedrig', tone: 'neutral', done: true },
];
const activity = [
  { id: 'a1', title: 'Bestellung #4182 über Shopify', time: '2026-11-24T08:52:00', icon: 'shopping-cart', tone: 'success', text: '2 Artikel · 64,90 €' },
  { id: 'a2', title: 'Notiz „Ideen TAKT V2“ bearbeitet', time: '2026-11-24T07:40:00', icon: 'sticky-note', tone: 'warning' },
  { id: 'a3', title: 'Trainingsziel Woche erreicht', time: '2026-11-23T19:10:00', icon: 'dumbbell', tone: 'info' },
];
const week = { labels: ['Mi', 'Do', 'Fr', 'Sa', 'So', 'Mo', 'Di'], series: [{ name: 'Erledigt', values: [6, 4, 7, 2, 1, 8, 3] }, { name: 'Neu', values: [4, 5, 3, 1, 2, 6, 4] }] };

export default {
  module: {
    id: 'home', name: 'Start', icon: 'home', status: 'concept', theme: 'graphite', designVersion: '0.1',
    description: 'Modulübergreifende Tagesübersicht: das Wichtigste aus Kalender, Aufgaben, Finanzen und Fitness auf einen Blick.',
    source: 'Annahme der Workbench – in Phase 1 gegen das TAKT-Modulregister verifizieren',
    infoArchitecture: 'Einstieg der App. 1) Begrüßung + Datum, 2) Kennzahlen des Tages, 3) Agenda, 4) Fällige Aufgaben, 5) Hinweise (Wetter/Termine), 6) Aktivität.',
    docs: 'Bewusst schlank gehalten: Jede Kachel verlinkt in das zuständige Modul. Keine eigene Datenhaltung.',
    links: ['calendar', 'tasks', 'finance', 'fitness', 'weather'],
  },
  features: [
    {
      id: 'home.today', name: 'Tagesübersicht', group: 'Übersicht', status: 'design',
      purpose: 'Beim Öffnen der App in unter 5 Sekunden erfassen, was heute ansteht und was Aufmerksamkeit braucht.',
      requirements: [
        { text: 'Heutige Termine chronologisch mit Uhrzeit', type: 'info', priority: 'must' },
        { text: 'Fällige und überfällige Aufgaben abhakbar', type: 'action', priority: 'must' },
        { text: 'Kennzahlen des Tages (Termine, Aufgaben, Fokuszeit, Ausgaben)', type: 'info', priority: 'should' },
        { text: 'Schnell eine Aufgabe erfassen, ohne das Modul zu wechseln', type: 'action', priority: 'should' },
        { text: 'Leerer Tag zeigt motivierenden Leerzustand statt leerer Karten', type: 'state', priority: 'must' },
        { text: 'Auf Mobile ohne horizontales Scrollen bedienbar', type: 'rule', priority: 'must' },
      ],
      interactions: [
        { trigger: 'Aufgabe abhaken', result: 'Aufgabe wird durchgestrichen, Zähler aktualisiert', event: 'item.toggle' },
        { trigger: 'Termin antippen', result: 'Termin wird ausgewählt / Detail', event: 'item.open' },
        { trigger: 'Schnelleingabe + Enter', result: 'Aufgabe erscheint oben in der Liste', event: 'quickadd.submit' },
        { trigger: 'Kennzahl antippen', result: 'Sprung ins Modul', event: 'metric.open' },
      ],
      demoData: { metrics, agenda, tasks, activity, week },
      variants: [
        {
          id: 'A', name: 'Cockpit', concept: 'Dashboard-Raster: alle Bereiche gleichzeitig sichtbar, Kennzahlen oben. Maximale Übersicht auf grossen Bildschirmen.',
          description: '+ Alles auf einen Blick (Desktop)  − Auf Mobile lange Seite',
          layout: { type: 'grid' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Dienstag, 24. November', title: 'Guten Morgen', subtitle: '5 Termine · 7 Aufgaben fällig · leicht bewölkt 6°', primaryLabel: 'Erfassen', primaryIcon: 'plus' } },
            { id: 'kpi', component: 'metric-row', region: 'main', span: 12, bind: { metrics: 'metrics' } },
            { id: 'agenda', component: 'item-list', region: 'main', span: 7, bind: { items: 'agenda' }, props: { title: 'Agenda heute', groupBy: 'group' } },
            { id: 'tasks', component: 'item-list', region: 'main', span: 5, bind: { items: 'tasks' }, props: { title: 'Fällig', checkable: true, selectable: false } },
            { id: 'chart', component: 'chart', region: 'main', span: 7, bind: { series: 'week' }, props: { title: 'Aufgaben – letzte 7 Tage', type: 'bar', height: 160 } },
            { id: 'feed', component: 'activity-feed', region: 'main', span: 5, bind: { events: 'activity' }, props: { title: 'Aktivität', limit: 3 } },
          ],
        },
        {
          id: 'B', name: 'Fokus-Feed', concept: 'Eine Spalte, priorisiert nach Dringlichkeit: Hinweis → Fällig → Agenda. Schnelleingabe unten fixiert. Mobile-first.',
          description: '+ Klare Reihenfolge, schnell bedienbar  − Weniger Überblick auf Desktop',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { title: 'Heute', subtitle: 'Di, 24. November · 7 Aufgaben fällig', primaryLabel: '' } },
            { id: 'note', component: 'notice-banner', region: 'main', props: { tone: 'warning', title: 'Angebot Müller GmbH ist heute fällig', text: 'Kunde erwartet Rückmeldung bis 14:00.', actionLabel: 'Öffnen' } },
            { id: 'tasks', component: 'item-list', region: 'main', bind: { items: 'tasks' }, props: { title: 'Zuerst erledigen', checkable: true, selectable: false } },
            { id: 'agenda', component: 'item-list', region: 'main', bind: { items: 'agenda' }, props: { title: 'Agenda', dense: true } },
            { id: 'add', component: 'quick-add', region: 'bottom', bind: { target: 'tasks' }, props: { placeholder: 'Aufgabe für heute … (Enter)', elevated: true } },
          ],
        },
      ],
      selectedVariantId: 'B',
    },
  ],
  decisions: [
    { featureId: 'home.today', title: 'Start-Modul als eigenständiges Modul führen?', decision: '', rationale: 'Annahme der Workbench. Klären, ob TAKT bereits eine Startseite/Dashboard im Modulregister hat.', status: 'open' },
  ],
};
