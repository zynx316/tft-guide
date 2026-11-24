// Modul "Einstellungen" – Seed-Manifest. Referenztag: Di, 24.11.2026 09:30 (ctx.today).
// Gerüst aller Einstellungen: Startseite (Gruppen), Darstellung, Module & Navigation, Benachrichtigungen, Daten & Backup, Konten & Sync, Sprache & Region, Über TAKT.
// Gemeinsame Einstellungen (`prefs`: Favoriten, aktive Module, Theme, Ruhezeiten, Privatsphäre …) sind geteilter Zustand: was eine Seite ändert, sehen die anderen sofort.

const ALL_VP = ['desktop', 'notebook', 'tablet', 'mobile'];
const I = (trigger, result, event, to) => ({ trigger, result, event, ...(to ? { to } : {}) });
const go = (to, trigger, result) => I(trigger, result || 'Zielseite öffnet sich', `open:${to}`, to);
const TIMES = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`);

// ------------------------------------------------------------------ Einstellungen: Startseite ---
const HOME_GROUPS = [
  { id: 'g-quick', title: 'Schnellzugriff', rows: [
    { id: 'q-amounts', type: 'switch', label: 'Beträge ausblenden', hint: 'Geldbeträge zeigen „••••“', icon: 'eye-off', pref: 'privacy.hideAmounts', keys: 'privatmodus verbergen' },
    { id: 'q-notify', type: 'switch', label: 'Mitteilungen', hint: 'Erinnerungen an Termine und Fristen', icon: 'bell', pref: 'notify.on' },
  ] },
  { id: 'g-look', title: 'Darstellung & Sprache', rows: [
    { id: 'r-appearance', type: 'nav', label: 'Darstellung & Theme', icon: 'palette', to: 'settings.appearance', computed: 'theme', keys: 'farbe dunkel hell schrift dichte graphite horizon intensiv' },
    { id: 'r-region', type: 'nav', label: 'Sprache & Region', icon: 'languages', to: 'settings.region', value: 'Deutsch', keys: 'einheiten wochenstart währung feiertage' },
  ] },
  { id: 'g-app', title: 'Module & Mitteilungen', rows: [
    { id: 'r-modules', type: 'nav', label: 'Module & Navigation', icon: 'layout-grid', to: 'settings.modules', computed: 'modules', keys: 'favoriten leiste reihenfolge' },
    { id: 'r-notify', type: 'nav', label: 'Benachrichtigungen', icon: 'bell', to: 'settings.notifications', computed: 'quiet', keys: 'ruhezeiten mitteilungen erinnerungen' },
  ] },
  { id: 'g-safe', title: 'Sicherheit & Daten', rows: [
    { id: 'r-lock', type: 'nav', label: 'App-Sperre & Datenschutz', icon: 'lock', to: 'system.lock', computed: 'lock', keys: 'pin biometrie privat' },
    { id: 'r-data', type: 'nav', label: 'Daten, Export & Backup', icon: 'cloud-upload', to: 'settings.data', value: 'Heute 03:00', keys: 'sicherung export speicher' },
    { id: 'r-trash', type: 'nav', label: 'Papierkorb', icon: 'trash-2', to: 'system.trash', value: '7 Einträge', keys: 'gelöscht wiederherstellen' },
    { id: 'r-accounts', type: 'nav', label: 'Konten & Sync', icon: 'refresh-cw', to: 'settings.accounts', badge: '1 Konflikt', badgeTone: 'warning', keys: 'konto abgleich geräte dienste' },
  ] },
  { id: 'g-help', title: 'Hilfe', rows: [
    { id: 'r-help', type: 'nav', label: 'Hilfe & Tipps', icon: 'lightbulb', to: 'system.help', keys: 'kurzbefehle tipps' },
    { id: 'r-intro', type: 'nav', label: 'Einführung ansehen', icon: 'sparkles', to: 'system.onboarding', keys: 'willkommen onboarding' },
    { id: 'r-about', type: 'nav', label: 'Über TAKT', icon: 'info', to: 'settings.about', keys: 'version lizenzen feedback' },
  ] },
];
const HOME_TILES = [
  { id: 't-look', title: 'Darstellung & Theme', icon: 'palette', tone: 'accent', to: 'settings.appearance', summary: '{theme}, Schrift und Dichte' },
  { id: 't-modules', title: 'Module & Navigation', icon: 'layout-grid', tone: 'info', to: 'settings.modules', summary: '{modules}, Favoriten in der Leiste' },
  { id: 't-notify', title: 'Benachrichtigungen', icon: 'bell', tone: 'warning', to: 'settings.notifications', summary: 'Ruhezeit {quiet}' },
  { id: 't-lock', title: 'App-Sperre & Datenschutz', icon: 'lock', tone: 'success', to: 'system.lock', summary: 'App-Sperre {lock}, Beträge ausblenden' },
  { id: 't-data', title: 'Daten, Export & Backup', icon: 'cloud-upload', tone: 'info', to: 'settings.data', summary: 'Letzte Sicherung heute 03:00' },
  { id: 't-accounts', title: 'Konten & Sync', icon: 'refresh-cw', tone: 'warning', to: 'settings.accounts', summary: 'Lokal, 1 Konflikt zu lösen' },
  { id: 't-region', title: 'Sprache & Region', icon: 'languages', tone: 'neutral', to: 'settings.region', summary: 'Deutsch, Wochenstart Montag' },
  { id: 't-trash', title: 'Papierkorb', icon: 'trash-2', tone: 'neutral', to: 'system.trash', summary: '7 Einträge, 30 Tage' },
  { id: 't-help', title: 'Hilfe & Tipps', icon: 'lightbulb', tone: 'accent', to: 'system.help', summary: 'Tipps und Kurzbefehle' },
  { id: 't-about', title: 'Über TAKT', icon: 'info', tone: 'neutral', to: 'settings.about', summary: 'Version, Lizenzen, Feedback' },
];
const STEPS = [
  { id: 'c-etsy', title: 'Etsy neu verbinden', text: 'Die Anmeldung ist abgelaufen, Bestellungen werden nicht abgeglichen.', icon: 'key-round', tone: 'danger', done: false, to: 'settings.accounts', actionLabel: 'Verbinden' },
  { id: 'c-lock', title: 'App-Sperre aktivieren', text: 'Schütze Finanzen und Notizen mit PIN oder Biometrie.', icon: 'lock', done: false, to: 'system.lock', actionLabel: 'Einrichten' },
  { id: 'c-nav', title: 'Navigationsleiste anpassen', text: 'Wähle bis zu vier Favoriten für die Leiste.', icon: 'layout-grid', done: false, to: 'settings.modules', actionLabel: 'Anpassen' },
  { id: 'c-backup', title: 'Sicherung prüfen', text: 'Letzte Sicherung heute 03:00 Uhr, die automatische Sicherung ist an.', icon: 'cloud-upload', done: true, to: 'settings.data' },
  { id: 'c-quiet', title: 'Ruhezeiten festlegen', text: '22:00–07:00 Uhr ist eingestellt, Wichtiges kommt durch.', icon: 'moon-star', done: true },
];

// ------------------------------------------------------------------ Benachrichtigungen ---
const NOTIFY_GROUPS = [
  { id: 'n-all', title: 'Allgemein', rows: [
    { id: 'n-on', type: 'switch', label: 'Mitteilungen', hint: 'Erinnerungen an Termine, Aufgaben und Fristen', icon: 'bell', pref: 'notify.on' },
    { id: 'n-digest', type: 'switch', label: 'Tagesübersicht', hint: 'Eine Zusammenfassung statt vieler Einzelmitteilungen', icon: 'newspaper', pref: 'notify.digest', disabledIf: 'notify.on' },
    { id: 'n-digest-time', type: 'select', label: 'Tagesübersicht um', icon: 'clock', options: ['06:30', '07:00', '07:30', '08:00', '08:30'], pref: 'notify.digestTime', disabledIf: 'notify.digest' },
    { id: 'n-group', type: 'choice', label: 'Gruppieren nach', icon: 'list-filter', options: [{ value: 'time', label: 'Zeit' }, { value: 'module', label: 'Modul' }, { value: 'priority', label: 'Dringlichkeit' }], pref: 'notify.groupBy' },
  ] },
  { id: 'n-quiet', title: 'Ruhezeiten', rows: [
    { id: 'q-on', type: 'switch', label: 'Ruhezeiten', hint: 'Kein Ton, keine Vibration', icon: 'moon-star', pref: 'quietHours.on' },
    { id: 'q-from', type: 'select', label: 'Von', icon: 'moon', options: TIMES, pref: 'quietHours.from', disabledIf: 'quietHours.on' },
    { id: 'q-to', type: 'select', label: 'Bis', icon: 'sunrise', options: TIMES, pref: 'quietHours.to', disabledIf: 'quietHours.on' },
    { id: 'q-imp', type: 'switch', label: 'Wichtiges durchlassen', hint: 'Unwetter, Fristen und Sync-Fehler bleiben hörbar', icon: 'alert-circle', pref: 'quietHours.allowImportant', disabledIf: 'quietHours.on' },
  ] },
  { id: 'n-modules', title: 'Je Modul', footer: 'Mitteilungen eines Moduls lassen sich einzeln ausschalten.', rows: [
    { id: 'm-tasks', type: 'switch', label: 'Aufgaben', hint: 'Fälligkeit und Überfälliges', icon: 'list-checks', pref: 'notify.rules.tasks', disabledIf: 'notify.on' },
    { id: 'm-cal', type: 'select', label: 'Kalender', hint: 'Vorlauf vor Terminen', icon: 'calendar', options: ['Aus', '5 Min.', '15 Min.', '30 Min.', '1 Std.'], pref: 'notify.rules.calendar', disabledIf: 'notify.on' },
    { id: 'm-fin', type: 'switch', label: 'Finanzen', hint: 'Fristen, Budgets, Abos', icon: 'wallet', pref: 'notify.rules.finance', disabledIf: 'notify.on' },
    { id: 'm-sav', type: 'switch', label: 'Sparpläne', hint: 'Ausführung und Deckung', icon: 'piggy-bank', pref: 'notify.rules.savings', disabledIf: 'notify.on' },
    { id: 'm-trd', type: 'switch', label: 'Trading', hint: 'Kursalarme (Simulation)', icon: 'candlestick-chart', pref: 'notify.rules.trading', disabledIf: 'notify.on' },
    { id: 'm-fit', type: 'switch', label: 'Fitness', hint: 'Training und Erholung', icon: 'dumbbell', pref: 'notify.rules.fitness', disabledIf: 'notify.on' },
    { id: 'm-nut', type: 'switch', label: 'Ernährung', hint: 'Mahlzeiten und Wasser', icon: 'salad', pref: 'notify.rules.nutrition', disabledIf: 'notify.on' },
    { id: 'm-wx', type: 'select', label: 'Wetter', hint: 'Warnungen', icon: 'cloud-sun', options: ['Aus', 'ab Stufe 1', 'ab Stufe 2', 'ab Stufe 3'], pref: 'notify.rules.weather', disabledIf: 'notify.on' },
    { id: 'm-sal', type: 'switch', label: 'Sales', hint: 'Bestellungen und Kanalfehler', icon: 'store', pref: 'notify.rules.sales', disabledIf: 'notify.on' },
    { id: 'm-hab', type: 'switch', label: 'Gewohnheiten', hint: 'Routinen und Serien', icon: 'repeat', pref: 'notify.rules.habits', disabledIf: 'notify.on' },
  ] },
];
const NOTIFY_MODULES_ONLY = ['n-modules'];

// ------------------------------------------------------------------ Daten, Konten, Region, Über ---
const BACKUPS = [
  { id: 'b1', at: '2026-11-24T03:00:00', size: 6.9, kind: 'auto' },
  { id: 'b2', at: '2026-11-23T03:00:00', size: 6.8, kind: 'auto' },
  { id: 'b3', at: '2026-11-22T03:00:00', size: 6.8, kind: 'auto' },
  { id: 'b4', at: '2026-11-21T03:00:00', size: 6.7, kind: 'auto' },
  { id: 'b5', at: '2026-11-20T21:15:00', size: 6.7, kind: 'manual' },
];
const DATA_GROUPS = [{ id: 'd-misc', title: 'Weitere Optionen', rows: [
  { id: 'd-trash', type: 'nav', label: 'Papierkorb', hint: '30 Tage wiederherstellbar', icon: 'trash-2', to: 'system.trash', value: '7 Einträge' },
  { id: 'd-import', type: 'action', label: 'Daten importieren', hint: 'Aus einer TAKT-Sicherung oder CSV', icon: 'upload', toast: 'Import wählen (Demo)' },
] }];
const ACCOUNT_GROUPS = [
  { id: 'a-profile', title: 'Profil', rows: [
    { id: 'a-name', type: 'info', label: 'Name', value: 'Jonas Keller', icon: 'user' },
    { id: 'a-mail', type: 'info', label: 'E-Mail', value: 'jonas@nordlicht.example', icon: 'at-sign' },
    { id: 'a-store', type: 'info', label: 'Datenspeicher', value: 'Lokal, kein Konto nötig', icon: 'smartphone' },
  ] },
  { id: 'a-sync', title: 'Abgleich', rows: [
    { id: 'a-devices', type: 'switch', label: 'Geräte abgleichen', hint: 'Optional, verschlüsselt, nur mit deinem Konto', icon: 'monitor-smartphone', value: true },
    { id: 'a-wifi', type: 'switch', label: 'Nur im WLAN', hint: 'Spart mobile Daten', icon: 'wifi', value: true },
  ] },
  { id: 'a-services', title: 'Verbundene Dienste', rows: [
    { id: 's-etsy', type: 'nav', label: 'Etsy', hint: 'Anmeldung abgelaufen. Bestellungen werden nicht abgeglichen.', icon: 'store', to: 'sales.connect', badge: 'Neu verbinden', badgeTone: 'danger' },
    { id: 's-shop', type: 'status', label: 'Shopify', hint: 'Bestellungen', icon: 'shopping-cart', value: 'Verbunden', tone: 'success', statusIcon: 'check' },
    { id: 's-gcal', type: 'status', label: 'Google Kalender', hint: 'Termine lesen', icon: 'calendar', value: 'Verbunden', tone: 'success', statusIcon: 'check' },
    { id: 's-wx', type: 'status', label: 'Wetterdienst', hint: 'Ort ohne Namen', icon: 'cloud-sun', value: 'Aktiv', tone: 'success', statusIcon: 'check' },
    { id: 's-bank', type: 'status', label: 'Bankanbindung', hint: 'Umsätze automatisch abrufen', icon: 'landmark', value: 'Nicht verbunden', tone: 'neutral' },
  ] },
  { id: 'a-dev', title: 'Geräte', rows: [
    { id: 'dv-phone', type: 'info', label: 'Dieses Gerät', value: 'Abgleich 09:12', icon: 'smartphone' },
    { id: 'dv-tablet', type: 'info', label: 'Tablet', value: 'Abgleich 09:20', icon: 'tablet' },
  ] },
];
const REGION_GROUPS = [
  { id: 'rg-lang', title: 'Sprache', rows: [
    { id: 'rg-language', type: 'info', label: 'Sprache', value: 'Deutsch', icon: 'languages' },
    { id: 'rg-country', type: 'select', label: 'Region', icon: 'globe', options: ['Deutschland', 'Österreich', 'Schweiz'], value: 'Deutschland' },
  ] },
  { id: 'rg-time', title: 'Datum & Zeit', rows: [
    { id: 'rg-week', type: 'choice', label: 'Woche beginnt am', icon: 'calendar-range', options: ['Montag', 'Sonntag'], pref: 'region.weekStart' },
    { id: 'rg-clock', type: 'info', label: 'Uhrzeit', value: '24 Stunden', icon: 'clock' },
    { id: 'rg-sample', type: 'info', label: 'Beispiel', value: 'Di, 24.11.2026 · 09:30 · 78,4 kg', icon: 'eye' },
  ] },
  { id: 'rg-units', title: 'Einheiten', rows: [
    { id: 'u-temp', type: 'choice', label: 'Temperatur', icon: 'thermometer', options: ['°C', '°F'], pref: 'region.temp' },
    { id: 'u-dist', type: 'choice', label: 'Strecke', icon: 'ruler', options: [{ value: 'km', label: 'Kilometer' }, { value: 'mi', label: 'Meilen' }], pref: 'region.distance' },
    { id: 'u-weight', type: 'choice', label: 'Gewicht', icon: 'weight', options: ['kg', 'lb'], pref: 'region.weight' },
    { id: 'u-currency', type: 'info', label: 'Währung', value: 'Euro (€)', icon: 'euro' },
  ] },
  { id: 'rg-hol', title: 'Feiertage', footer: 'Feiertage erscheinen im Kalender und in der Wochenplanung.', rows: [
    { id: 'h-state', type: 'select', label: 'Bundesland', icon: 'map-pin', options: ['Baden-Württemberg', 'Bayern', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg', 'Hessen', 'Mecklenburg-Vorpommern', 'Niedersachsen', 'Nordrhein-Westfalen', 'Rheinland-Pfalz', 'Saarland', 'Sachsen', 'Sachsen-Anhalt', 'Schleswig-Holstein', 'Thüringen'], pref: 'region.state' },
  ] },
];
const ABOUT_GROUPS = [
  { id: 'ab-app', title: 'TAKT', rows: [
    { id: 'ab-version', type: 'info', label: 'Version', value: '2.0, Design-Entwurf', icon: 'info' },
    { id: 'ab-stand', type: 'info', label: 'Stand', value: '24.11.2026', icon: 'calendar-days' },
    { id: 'ab-data', type: 'info', label: 'Daten', value: 'Lokal auf diesem Gerät', icon: 'smartphone' },
  ] },
  { id: 'ab-legal', title: 'Rechtliches', rows: [
    { id: 'ab-lic', type: 'action', label: 'Lizenzen', hint: 'Quelloffene Bausteine und Schriften', icon: 'scroll-text', toast: 'Lizenzen (Demo)' },
    { id: 'ab-priv', type: 'action', label: 'Datenschutzerklärung', icon: 'shield-check', toast: 'Datenschutzerklärung (Demo)' },
    { id: 'ab-imp', type: 'action', label: 'Impressum', icon: 'file-text', toast: 'Impressum (Demo)' },
  ] },
  { id: 'ab-help', title: 'Hilfe & Feedback', rows: [
    { id: 'ab-tips', type: 'nav', label: 'Hilfe & Tipps', icon: 'lightbulb', to: 'system.help' },
    { id: 'ab-feedback', type: 'action', label: 'Feedback senden', hint: 'Sag, was dir fehlt oder stört', icon: 'send', toast: 'Feedback senden (Demo)' },
    { id: 'ab-states', type: 'nav', label: 'Zustandskatalog', hint: 'Referenz für Offline, Konflikt, Berechtigung, Fehler', icon: 'layers', to: 'system.states' },
  ] },
  { id: 'ab-new', title: 'Neu in TAKT', rows: [
    { id: 'nw-1', type: 'info', label: 'Erfassen in einem Satz', value: 'Neu', icon: 'zap' },
    { id: 'nw-2', type: 'info', label: 'Ruhezeiten für Mitteilungen', value: 'Neu', icon: 'moon-star' },
    { id: 'nw-3', type: 'info', label: 'Papierkorb mit 30 Tagen', value: 'Neu', icon: 'trash-2' },
  ] },
];

const prefsData = { prefs: '@world:prefs' };

export default {
  module: {
    id: 'settings', name: 'Einstellungen', icon: 'settings', area: 'System', status: 'active', theme: 'graphite', designVersion: '0.3', stage: 1, homeFeatureId: 'settings.home',
    dataSource: 'lokal (Einstellungen der App)', offline: 'voll',
    description: 'Alle Einstellungen in Gruppen: Darstellung und Theme, Module und Navigation, Benachrichtigungen mit Ruhezeiten, Daten, Export und Backup, Konten und Sync, Sprache und Region, Über TAKT.',
    source: 'Workbench V2 (Bauplan Brainstorming 24.11.2026); Abgleich mit dem echten TAKT-Konzept in Phase 1',
    infoArchitecture: 'Einstieg „Einstellungen“ (Gruppen). Von dort: Darstellung & Theme · Module & Navigation · Benachrichtigungen · App-Sperre & Datenschutz (TAKT Kern) · Daten, Export & Backup · Konten & Sync · Sprache & Region · Papierkorb (TAKT Kern) · Hilfe & Tipps · Über TAKT. Einstellungen je Modul (z. B. Kalender-Einstellungen) liegen im Modul und sind von hier verlinkt. Die Suche findet jede Einstellung.',
    docs: [
      '## Annahmen',
      '- Das Theme ist global und verändert nie die Informationsarchitektur (Regel aus dem Designsystem).',
      '- Einstellungen, die mehrere Screens betreffen, liegen im gemeinsamen Zustand `prefs` (Favoriten, aktive Module, Theme, Dichte, Schrift, Ruhezeiten, Privatsphäre, Region). Was eine Seite ändert, sehen die anderen sofort.',
      '- Ausgeschaltete Module bleiben mit ihren Daten erhalten, sie sind nur ausgeblendet. „Start“, „Einstellungen“ und „TAKT Kern“ lassen sich nicht ausschalten.',
      '- Höchstens vier Favoriten stehen in der Navigationsleiste, der Rest liegt unter „Mehr“.',
      '- Abhängige Einstellungen sind ausgegraut statt versteckt, damit man sieht, was sie bewirken.',
      '',
      '## Offene Fragen',
      '- Liste, Kacheln oder „Empfehlungen zuerst“ als Einstellungen-Startseite?',
      '- Sicherung nur lokal oder optional im Konto (verschlüsselt)? Das berührt Konten & Sync.',
      '- Regeln für Benachrichtigungen je Modul oder je Mitteilungsart (Fälligkeit, Vorlauf, Kursalarm …)?',
      '',
      '## Grenzen der Demo',
      '- Theme, Favoriten, Schriftgröße und Privatmodus werden gespeichert und in den Einstellungen sichtbar. Auf die gerade laufende Demo wirken sie über die Schalter des Launchers.',
      '- Export, Sicherung, Wiederherstellen und Löschen sind simuliert.',
    ].join('\n'),
    links: ['system', 'home', 'calendar', 'tasks'],
  },
  features: [
    // ------------------------------------------------------------ Startseite
    {
      id: 'settings.home', name: 'Einstellungen', group: 'Übersicht', status: 'review', tier: 1, usage: 'selten, aber wichtig',
      purpose: 'Der Einstieg in alle Einstellungen: nach Gruppen geordnet, mit dem aktuellen Wert in der Zeile, Suche und Schnellschaltern. Von hier öffnet jede Zeile die passende Seite.',
      requirements: [
        { text: 'Gruppen: Darstellung & Sprache, Module & Mitteilungen, Sicherheit & Daten, Hilfe; jede Zeile zeigt den aktuellen Wert (Theme, aktive Module, Ruhezeit, Sperre)', type: 'info', priority: 'must' },
        { text: 'Suche über alle Einstellungen (Name, Hinweis, Stichwörter), Treffer als Zeilen', type: 'action', priority: 'must' },
        { text: 'Schnellzugriff für die zwei häufigsten Schalter (Beträge ausblenden, Mitteilungen)', type: 'action', priority: 'should' },
        { text: 'Hinweise zu offenen Punkten (Konflikt, abgelaufene Anmeldung, Sperre aus) mit Weg zur Lösung', type: 'state', priority: 'should' },
        { text: 'Werte aktualisieren sich sofort, wenn eine Unterseite etwas ändert', type: 'rule', priority: 'must' },
        { text: 'Mobile: Zeilen ≥ 56 px, Schalter mit 44-px-Tippfläche, kein horizontaler Überlauf', type: 'rule', priority: 'must' },
      ],
      interactions: [
        go('settings.appearance', 'Zeile „Darstellung & Theme“ antippen', 'Darstellung öffnet sich'),
        go('settings.region', 'Zeile „Sprache & Region“ antippen', 'Sprache & Region öffnet sich'),
        go('settings.modules', 'Zeile „Module & Navigation“ antippen', 'Module & Navigation öffnet sich'),
        go('settings.notifications', 'Zeile „Benachrichtigungen“ antippen', 'Benachrichtigungen öffnet sich'),
        go('system.lock', 'Zeile „App-Sperre & Datenschutz“ antippen', 'App-Sperre & Datenschutz öffnet sich'),
        go('settings.data', 'Zeile „Daten, Export & Backup“ antippen', 'Daten & Backup öffnet sich'),
        go('system.trash', 'Zeile „Papierkorb“ antippen', 'Papierkorb öffnet sich'),
        go('settings.accounts', 'Zeile „Konten & Sync“ antippen', 'Konten & Sync öffnet sich'),
        go('system.help', 'Zeile „Hilfe & Tipps“ antippen', 'Hilfe & Tipps öffnet sich'),
        go('system.onboarding', 'Zeile „Einführung ansehen“ antippen', 'Willkommen öffnet sich'),
        go('settings.about', 'Zeile „Über TAKT“ antippen', 'Über TAKT öffnet sich'),
        I('Schnellschalter umlegen', 'Einstellung wirkt sofort, Wert steht auch auf der Unterseite', 'settings.change'),
        I('Suchbegriff eingeben', 'Zeilen werden gefiltert', 'settings.search'),
      ],
      acceptance: [
        'Jede Zeile der Startseite führt in einem Tipp zur passenden Seite, „Zurück“ führt zur Startseite.',
        'Die Suche nach „Ruhe“ zeigt „Benachrichtigungen“; „xyz“ zeigt „Keine Einstellung für „xyz““.',
        'Wird in „Darstellung“ ein anderes Theme gewählt, steht es danach auf der Startseite in der Zeile.',
        'Schnellschalter haben Namen für Screenreader und sind mindestens 44 px hoch.',
        'Auf 360 px gibt es keinen horizontalen Überlauf, auch nicht bei Schrift 200 %.',
      ],
      flows: [
        { id: 'fl-ruhe', name: 'Ruhezeiten ändern', steps: [{ featureId: 'settings.home', action: '„Benachrichtigungen“ öffnen' }, { featureId: 'settings.notifications', action: 'Ruhezeit auf 23:00–06:30 setzen' }, { featureId: 'settings.home', action: 'Zeile zeigt 23:00–06:30' }] },
        { id: 'fl-nav', name: 'Navigation anpassen', steps: [{ featureId: 'settings.home', action: '„Module & Navigation“ öffnen' }, { featureId: 'settings.modules', action: 'Favoriten wählen' }] },
      ],
      viewports: ALL_VP,
      demoData: { groups: HOME_GROUPS, tiles: HOME_TILES, steps: STEPS, ...prefsData },
      variants: [
        {
          id: 'A', name: 'Gruppierte Liste', direction: 'kompakt',
          concept: 'Suchfeld, Schnellzugriff und alle Gruppen als Zeilen mit aktuellem Wert. Eine Spalte, jede Seite mit einem Tipp erreichbar.',
          description: '+ Alles sichtbar, vertraut, schnell durchsuchbar  − Viele Zeilen, wenig Hierarchie zwischen wichtig und selten',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Einstellungen', title: 'Einstellungen', subtitle: 'Jonas Keller · lokal gespeichert', primaryLabel: '' } },
            { id: 'list', component: 'settings-list', region: 'main', props: { style: 'inset', searchable: true } },
          ],
        },
        {
          id: 'B', name: 'Kacheln', direction: 'visuell',
          concept: 'Zehn große Kacheln mit Icon, Titel und einer Zeile Zusammenfassung („Graphite, Schrift und Dichte“). Jede Kachel öffnet eine Seite. Platz für einen Blick.',
          description: '+ Ruhig, schnell zu überblicken, gut für Touch  − Werte nur als Zusammenfassung, keine Schnellschalter',
          layout: { type: 'stack' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Einstellungen', title: 'Einstellungen', subtitle: 'Wähle einen Bereich', primaryLabel: '' } },
            { id: 'tiles', component: 'settings-list', region: 'main', bind: { groups: 'tiles' }, props: { style: 'tiles', searchable: true } },
          ],
        },
        {
          id: 'C', name: 'Empfehlungen zuerst', direction: 'fokus',
          concept: 'Oben „Empfohlen für dich“: Etsy neu verbinden, App-Sperre, Navigation anpassen, mit Fortschritt und Aktion. Darunter die Gruppen als kompakte Liste.',
          description: '+ Zeigt, was jetzt zu tun ist, Hinweise statt Suchen  − Die Liste rutscht nach unten, Empfehlungen brauchen gute Regeln',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Einstellungen', title: 'Einstellungen', subtitle: '3 Dinge sind offen', primaryLabel: '' } },
            { id: 'todo', component: 'setup-checklist', region: 'main', bind: { items: 'steps' }, props: { title: 'Empfohlen für dich' } },
            { id: 'list', component: 'settings-list', region: 'main', props: { style: 'inset', groupIds: ['g-look', 'g-app', 'g-safe', 'g-help'] } },
          ],
        },
      ],
      selectedVariantId: 'A',
      links: ['settings.appearance', 'settings.modules', 'settings.notifications', 'system.lock', 'settings.data', 'settings.accounts'],
    },
    // ------------------------------------------------------------ Darstellung
    {
      id: 'settings.appearance', name: 'Darstellung & Theme', group: 'Darstellung', status: 'design', tier: 2, usage: 'selten',
      purpose: 'Theme, Dichte und Schriftgröße wählen und sofort sehen, wie es aussieht. Themes ändern nur Farben, nie die Anordnung.',
      requirements: [
        { text: 'Drei Themes mit echter Mini-Vorschau: Graphite (Standard), Horizon (hell), Intensiv (hoher Kontrast)', type: 'action', priority: 'must' },
        { text: 'Dichte Komfortabel oder Kompakt, Schriftgröße 100, 130 oder 200 % mit Beispiel „Heute“ in der gewählten Größe', type: 'action', priority: 'must' },
        { text: 'Weniger Bewegung (Animationen reduzieren) als Schalter', type: 'action', priority: 'should' },
        { text: 'Änderungen sind sofort sichtbar und gelten für die ganze App, nie je Modul', type: 'rule', priority: 'must' },
        { text: 'Gewählter Wert erscheint auf der Einstellungen-Startseite', type: 'info', priority: 'should' },
      ],
      interactions: [I('Theme wählen', 'Auswahl ist markiert, Beispiel zeigt das Theme', 'theme.select'), I('Schriftgröße wählen', 'Beispiel wird größer', 'appearance.scale')],
      acceptance: [
        'Jedes Theme zeigt eine Vorschau mit seinen echten Farben, die Auswahl ist ohne Farbe allein erkennbar (Haken, „Aktiv“).',
        'Bei Schrift 200 % ist nichts abgeschnitten oder überlappend.',
        'Die Wahl steht danach auf der Einstellungen-Startseite.',
      ],
      viewports: ALL_VP,
      demoData: prefsData,
      variants: [
        {
          id: 'A', name: 'Liste', direction: 'kompakt',
          concept: 'Die drei Themes als Zeilen mit Farbpunkten, darunter Beispiel, Dichte, Schrift und Bewegung.',
          description: '+ Kurz, alles auf einem Blick  − Wirkung der Themes nur an Punkten ablesbar',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Einstellungen', title: 'Darstellung & Theme', subtitle: 'Farben, Dichte und Schrift', primaryLabel: '' } },
            { id: 'theme', component: 'theme-picker', region: 'main', props: { style: 'list', showOptions: true, showSample: true } },
          ],
        },
        {
          id: 'B', name: 'Vorschau-Karten', direction: 'visuell',
          concept: 'Drei große Karten mit je einer Mini-Oberfläche im echten Theme. Man wählt, was man sieht.',
          description: '+ Anschaulich, Entscheidung ohne Erklärung  − Braucht mehr Platz, auf Mobile untereinander',
          layout: { type: 'stack' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Einstellungen', title: 'Darstellung & Theme', subtitle: 'Wähle, was dir gefällt', primaryLabel: '' } },
            { id: 'theme', component: 'theme-picker', region: 'main', props: { style: 'cards', showOptions: true, showSample: true } },
          ],
        },
      ],
      selectedVariantId: 'B',
      links: ['settings.home'],
    },
    // ------------------------------------------------------------ Module & Navigation
    {
      id: 'settings.modules', name: 'Module & Navigation', group: 'Darstellung', status: 'review', tier: 1, usage: 'selten',
      purpose: 'Bestimmen, welche Module TAKT zeigt und welche vier in der Navigationsleiste stehen. Die Vorschau zeigt die Leiste sofort.',
      requirements: [
        { text: 'Alle Module nach Bereich, ein- und ausschaltbar; Start, Einstellungen und TAKT Kern bleiben immer an', type: 'action', priority: 'must' },
        { text: 'Bis zu vier Favoriten (Stern) für die Navigationsleiste, Reihenfolge änderbar; ein fünfter wird mit Begründung abgelehnt', type: 'action', priority: 'must' },
        { text: 'Vorschau der Leiste mit den Favoriten und „Mehr“, Zähler „3 von 4“', type: 'info', priority: 'must' },
        { text: 'Ausgeschaltete Module behalten ihre Daten; ein ausgeschalteter Favorit verlässt die Leiste', type: 'rule', priority: 'must' },
        { text: 'Zurücksetzen auf die Standardauswahl', type: 'action', priority: 'should' },
      ],
      interactions: [I('Schalter umlegen', 'Modul erscheint oder verschwindet, Favorit wird entfernt', 'modules.toggle'), I('Stern antippen', 'Favorit gesetzt oder entfernt, Vorschau aktualisiert', 'modules.favorite'), I('Pfeil antippen', 'Favorit wandert in der Leiste', 'modules.move')],
      acceptance: [
        'Mit vier Favoriten lehnt TAKT den fünften ab und sagt „Höchstens 4 Favoriten. Entferne zuerst einen.“',
        'Ein ausgeschaltetes Modul ist nicht mehr als Favorit gesetzt, die Leiste zeigt es nicht.',
        'Start, Einstellungen lassen sich nicht ausschalten und sind als „Immer an“ gekennzeichnet.',
        'Die Auswahl steht in der Einstellungen-Startseite (z. B. „16 aktiv“).',
      ],
      flows: [{ id: 'fl-fav', name: 'Leiste anpassen', steps: [{ featureId: 'settings.modules', action: 'Stern bei Fitness setzen, Finanzen entfernen' }, { featureId: 'settings.modules', action: 'Vorschau prüfen, Reihenfolge ändern' }] }],
      viewports: ALL_VP,
      demoData: prefsData,
      variants: [
        {
          id: 'A', name: 'Liste mit Reihenfolge', direction: 'kompakt',
          concept: 'Oben die Leistenvorschau und die Reihenfolge der Favoriten mit Pfeilen, darunter alle Module nach Bereich mit Stern und Schalter.',
          description: '+ Alles an einem Ort, Reihenfolge direkt änderbar  − Lang bei 14 Modulen',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Einstellungen', title: 'Module & Navigation', subtitle: 'Was du siehst und was in der Leiste steht', primaryLabel: '' } },
            { id: 'mods', component: 'module-toggle-list', region: 'main', props: { style: 'list', maxFavorites: 4, showPreview: true } },
          ],
        },
        {
          id: 'B', name: 'Modul-Kacheln', direction: 'visuell',
          concept: 'Module als Kacheln: antippen schaltet ein oder aus, der Stern setzt Favoriten. Die Vorschau der Leiste steht oben.',
          description: '+ Anschaulich, ein Tipp pro Modul  − Reihenfolge der Favoriten nicht änderbar',
          layout: { type: 'stack' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Einstellungen', title: 'Module & Navigation', subtitle: 'Tippe ein Modul an, um es zu schalten', primaryLabel: '' } },
            { id: 'mods', component: 'module-toggle-list', region: 'main', props: { style: 'tiles', maxFavorites: 4, showPreview: true } },
          ],
        },
      ],
      selectedVariantId: 'A',
      links: ['settings.home', 'system.onboarding'],
    },
    // ------------------------------------------------------------ Benachrichtigungen
    {
      id: 'settings.notifications', name: 'Benachrichtigungen', group: 'Mitteilungen', status: 'design', tier: 2, usage: 'selten',
      purpose: 'Bestimmen, was TAKT wann meldet: Mitteilungen ein/aus, Tagesübersicht, Ruhezeiten und Regeln je Modul. Wichtiges kommt auch in der Ruhezeit durch.',
      requirements: [
        { text: 'Mitteilungen insgesamt ein/aus; abhängige Einstellungen sind ausgegraut, wenn sie aus sind', type: 'rule', priority: 'must' },
        { text: 'Ruhezeiten (Standard 22:00–07:00) mit Von, Bis und der Ausnahme „Wichtiges durchlassen“', type: 'action', priority: 'must' },
        { text: 'Regeln je Modul: Aufgaben (Fälligkeit), Kalender (Vorlauf), Finanzen, Sparpläne, Trading, Fitness, Ernährung, Wetter (ab Stufe), Sales, Gewohnheiten', type: 'action', priority: 'must' },
        { text: 'Tagesübersicht statt Einzelmitteilungen, Uhrzeit wählbar', type: 'action', priority: 'should' },
        { text: 'Berechtigung „Mitteilungen“: erst erklären, bei Ablehnung Weg in die Systemeinstellungen', type: 'state', priority: 'must' },
      ],
      interactions: [go('system.notifications', '„Mitteilungen“ (Kopfzeile) antippen', 'Mitteilungen öffnen sich'), I('Schalter oder Auswahl ändern', 'Regel gilt sofort', 'settings.change'), I('Von oder Bis ändern', 'Ruhezeit-Band aktualisiert sich', 'quiet.change')],
      acceptance: [
        'Ist „Mitteilungen“ aus, sind alle abhängigen Zeilen ausgegraut und nicht bedienbar.',
        'Ruhezeit 23:00–06:30 erscheint danach in der Mitteilungsliste („Ruhezeit 23:00–06:30“) und auf der Einstellungen-Startseite.',
        'Fehlt die Berechtigung, nennt die Seite die Folge und den Weg in die Systemeinstellungen.',
      ],
      flows: [{ id: 'fl-ruhezeit', name: 'Nachts Ruhe', steps: [{ featureId: 'settings.notifications', action: 'Ruhezeit auf 23:00–06:30 stellen' }, { featureId: 'system.notifications', action: 'Hinweis zeigt die neue Ruhezeit' }] }],
      viewports: ALL_VP,
      demoData: { groups: NOTIFY_GROUPS, ...prefsData },
      variants: [
        {
          id: 'A', name: 'Regeln als Liste', direction: 'kompakt',
          concept: 'Allgemein, Ruhezeiten und Regeln je Modul als gruppierte Zeilen mit Schaltern und Auswahl. Die Berechtigung als Karte oben.',
          description: '+ Alles einstellbar in einer Liste, dicht  − Ruhezeiten nur als Zahlen',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Einstellungen', title: 'Benachrichtigungen', subtitle: 'Was wann gemeldet wird', primaryLabel: 'Mitteilungen', primaryIcon: 'bell', primaryEvent: 'open:system.notifications' } },
            { id: 'perm', component: 'permission-card', region: 'main', props: { kind: 'mitteilungen', state: 'erteilt' } },
            { id: 'list', component: 'settings-list', region: 'main', props: { style: 'inset' } },
          ],
        },
        {
          id: 'C', name: 'Ruhezeiten zuerst', direction: 'fokus',
          concept: 'Zuerst die Ruhezeiten mit 24-Stunden-Band und Von/Bis, dann nur die Regeln je Modul. Das Wichtigste (Wann kommt Ruhe?) zuerst.',
          description: '+ Das Häufigste steht oben, Band macht die Ruhezeit greifbar  − Allgemeine Optionen fehlen auf dieser Seite',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Einstellungen', title: 'Ruhe und Regeln', subtitle: 'Wann TAKT leise bleibt', primaryLabel: 'Mitteilungen', primaryIcon: 'bell', primaryEvent: 'open:system.notifications' } },
            { id: 'quiet', component: 'quiet-hours', region: 'main', props: { title: 'Ruhezeiten' } },
            { id: 'rules', component: 'settings-list', region: 'main', props: { style: 'inset', groupIds: NOTIFY_MODULES_ONLY } },
          ],
        },
      ],
      selectedVariantId: 'A',
      links: ['system.notifications', 'settings.home'],
    },
    // ------------------------------------------------------------ Daten, Export & Backup
    {
      id: 'settings.data', name: 'Daten, Export & Backup', group: 'Daten', status: 'design', tier: 2, usage: 'selten',
      purpose: 'Die eigenen Daten im Griff: Speicher je Modul, automatische Sicherungen, Export als Datei und der Weg, alles zu löschen.',
      requirements: [
        { text: 'Speichernutzung je Modul als Balken und mit Zahlen (MB)', type: 'info', priority: 'must' },
        { text: 'Automatische Sicherung jede Nacht (letzte 7), „Jetzt sichern“ mit Fortschritt, „Wiederherstellen“ mit Nachfrage', type: 'action', priority: 'must' },
        { text: 'Export: Umfang (alles oder Module), Format (JSON, CSV, ICS, Markdown), Ziel (Datei, Teilen, verschlüsselt mit Passwort), Größe vorab', type: 'action', priority: 'must' },
        { text: '„Alle Daten löschen“ nur mit doppelter Bestätigung (LÖSCHEN eintippen)', type: 'rule', priority: 'must' },
        { text: 'Verweis auf den Papierkorb und Import', type: 'info', priority: 'should' },
      ],
      interactions: [go('system.trash', 'Zeile „Papierkorb“ antippen', 'Papierkorb öffnet sich'), I('„Jetzt sichern“', 'Fortschritt, danach neue Sicherung oben', 'backup.now'), I('„Export erstellen“', 'Fortschritt, danach Ergebnis mit „Teilen“', 'export.start')],
      acceptance: [
        '„Jetzt sichern“ legt nach dem Fortschritt eine neue Sicherung als erste Zeile an.',
        '„Wiederherstellen“ und „Alle Daten löschen“ fragen nach und nennen die Folge; Löschen verlangt das Wort LÖSCHEN.',
        'Der verschlüsselte Export ist ohne Passwort mit mindestens 8 Zeichen nicht möglich.',
        'Auf 360 px gibt es keinen horizontalen Überlauf.',
      ],
      viewports: ALL_VP,
      demoData: { backups: BACKUPS, groups: DATA_GROUPS },
      variants: [
        {
          id: 'A', name: 'Sicherung zuerst', direction: 'kompakt',
          concept: 'Eine Spalte: Speicher, Sicherungen, Export, weitere Optionen. In der Reihenfolge, in der man es braucht.',
          description: '+ Klarer Ablauf, einfach  − Auf dem Desktop viel leere Fläche',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Einstellungen', title: 'Daten, Export & Backup', subtitle: 'Deine Daten, deine Kontrolle', primaryLabel: '' } },
            { id: 'bk', component: 'backup-list', region: 'main', props: { showStorage: true, showDanger: false, limit: 4 } },
            { id: 'exp', component: 'export-wizard', region: 'main', props: { title: 'Daten exportieren' } },
            { id: 'misc', component: 'settings-list', region: 'main', props: { style: 'inset' } },
            { id: 'danger', component: 'backup-list', region: 'footer', props: { showStorage: false, showDanger: true, showList: false } },
          ],
        },
        {
          id: 'B', name: 'Zwei Spalten', direction: 'visuell',
          concept: 'Links Export und weitere Optionen, rechts Speicher und Sicherungen. Auf dem Desktop alles auf einen Blick, auf Mobile untereinander.',
          description: '+ Überblick auf großen Schirmen, Speicher als Balken  − Auf Mobile identisch lang',
          layout: { type: 'grid' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Einstellungen', title: 'Daten, Export & Backup', subtitle: 'Speicher, Sicherungen und Export', primaryLabel: '' } },
            { id: 'exp', component: 'export-wizard', region: 'main', span: 6, spanTablet: 12, props: { title: 'Daten exportieren' } },
            { id: 'bk', component: 'backup-list', region: 'main', span: 6, spanTablet: 12, props: { showStorage: true, showDanger: true, limit: 5 } },
            { id: 'misc', component: 'settings-list', region: 'main', span: 12, props: { style: 'inset' } },
          ],
        },
      ],
      selectedVariantId: 'A',
      links: ['system.trash', 'settings.accounts'],
    },
    // ------------------------------------------------------------ Konten & Sync
    {
      id: 'settings.accounts', name: 'Konten & Sync', group: 'Daten', status: 'design', tier: 2, usage: 'selten',
      purpose: 'Profil, Abgleich zwischen Geräten und verbundene Dienste (Shop-Kanäle, Kalender, Wetter, Bank) mit Status. Hier löst man einen Sync-Konflikt und erneuert abgelaufene Anmeldungen.',
      requirements: [
        { text: 'Profil und Speicherort (lokal, kein Konto nötig); Abgleich zwischen Geräten optional und verschlüsselt', type: 'info', priority: 'must' },
        { text: 'Verbundene Dienste mit Status (Verbunden, Anmeldung abgelaufen, Nicht verbunden) und Weg zur Lösung', type: 'state', priority: 'must' },
        { text: 'Sync-Status als Chip (synchron, wartet, Fehler) mit „Erneut versuchen“', type: 'state', priority: 'must' },
        { text: 'Sync-Konflikt: beide Stände nebeneinander, Auswahl, Rückgängig', type: 'state', priority: 'must' },
        { text: 'Geräteliste mit letztem Abgleich', type: 'info', priority: 'should' },
      ],
      interactions: [go('sales.connect', 'Zeile „Etsy“ antippen', 'Kanal verbinden öffnet sich'), I('„Übernehmen“ im Konflikt', 'Konflikt gilt als gelöst', 'conflict.resolve')],
      acceptance: [
        'Ein abgelaufener Dienst („Etsy“) ist in Rot erkennbar (Text und Badge) und führt zum Neu-Verbinden.',
        'Der Konflikt lässt sich lösen, danach steht „Konflikt gelöst“ mit „Rückgängig“.',
        'Auf 360 px gibt es keinen horizontalen Überlauf.',
      ],
      viewports: ALL_VP,
      demoData: { groups: ACCOUNT_GROUPS },
      variants: [{
        id: 'A', name: 'Konto, Konflikt, Dienste', direction: 'kompakt',
        concept: 'Sync-Status oben, der offene Konflikt als Karte, darunter Profil, Abgleich, Dienste mit Status und Geräte als Liste.',
        description: '+ Das Dringende (Konflikt) steht oben, alle Dienste sichtbar  − Lang',
        layout: { type: 'stack', narrow: true },
        blocks: [
          { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Einstellungen', title: 'Konten & Sync', subtitle: 'Geräte und verbundene Dienste', primaryLabel: '' } },
          { id: 'sync', component: 'sync-status', region: 'main', props: { status: 'pending', count: 1, minutesAgo: 10, showTime: true } },
          { id: 'conf', component: 'sync-conflict', region: 'main', props: { state: 'offen' } },
          { id: 'list', component: 'settings-list', region: 'main', props: { style: 'inset' } },
        ],
      }],
      selectedVariantId: 'A',
      links: ['settings.home', 'sales.connect', 'system.states'],
    },
    // ------------------------------------------------------------ Sprache & Region
    {
      id: 'settings.region', name: 'Sprache & Region', group: 'Darstellung', status: 'design', tier: 3, usage: 'selten',
      purpose: 'Sprache, Wochenstart, Einheiten (Temperatur, Strecke, Gewicht), Währung und Bundesland für Feiertage einstellen. Das Beispiel zeigt sofort das Format.',
      requirements: [
        { text: 'Sprache Deutsch, Region Deutschland; Zeitformat 24 Stunden; Währung Euro', type: 'info', priority: 'must' },
        { text: 'Wochenstart Montag oder Sonntag; wirkt auf Kalender und Wochenplanung', type: 'action', priority: 'must' },
        { text: 'Einheiten: Temperatur °C/°F, Strecke km/Meilen, Gewicht kg/lb; wirken in Wetter, Fitness, Ernährung', type: 'action', priority: 'should' },
        { text: 'Bundesland für Feiertage (Standard Nordrhein-Westfalen)', type: 'action', priority: 'should' },
      ],
      interactions: [I('Auswahl ändern', 'Beispiel und betroffene Module nutzen das neue Format', 'settings.change')],
      acceptance: ['Wochenstart, Einheiten und Bundesland lassen sich ändern und bleiben gespeichert.', 'Das Beispiel zeigt Datum, Uhrzeit und Gewicht im gewählten Format.'],
      viewports: ALL_VP,
      demoData: { groups: REGION_GROUPS, ...prefsData },
      variants: [{
        id: 'A', name: 'Gruppierte Liste', direction: 'kompakt',
        concept: 'Sprache, Datum und Zeit, Einheiten und Feiertage als gruppierte Zeilen.',
        description: '+ Alles an einem Ort  − Auswirkung der Einheiten nur im Beispiel sichtbar',
        layout: { type: 'stack', narrow: true },
        blocks: [
          { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Einstellungen', title: 'Sprache & Region', subtitle: 'Formate und Einheiten', primaryLabel: '' } },
          { id: 'list', component: 'settings-list', region: 'main', props: { style: 'inset' } },
        ],
      }],
      selectedVariantId: 'A',
      links: ['settings.home', 'calendar.sources', 'weather.settings'],
    },
    // ------------------------------------------------------------ Über TAKT
    {
      id: 'settings.about', name: 'Über TAKT', group: 'Hilfe', status: 'design', tier: 3, usage: 'selten',
      purpose: 'Version und Stand, Lizenzen, Datenschutz, Impressum, Feedback senden und die Neuigkeiten.',
      requirements: [
        { text: 'Version, Stand und Speicherort der Daten', type: 'info', priority: 'must' },
        { text: 'Lizenzen, Datenschutzerklärung und Impressum erreichbar', type: 'info', priority: 'must' },
        { text: 'Feedback senden und Hilfe & Tipps', type: 'action', priority: 'should' },
        { text: '„Neu in TAKT“ mit den letzten Änderungen', type: 'info', priority: 'could' },
      ],
      interactions: [go('system.help', 'Zeile „Hilfe & Tipps“ antippen', 'Hilfe & Tipps öffnet sich'), go('system.states', 'Zeile „Zustandskatalog“ antippen', 'Zustandskatalog öffnet sich')],
      acceptance: ['Jede Zeile hat eine erkennbare Wirkung (öffnet oder zeigt einen Hinweis).', 'Die Seite sagt, wo die Daten liegen.'],
      viewports: ALL_VP,
      demoData: { groups: ABOUT_GROUPS },
      variants: [{
        id: 'A', name: 'Info und Links', direction: 'kompakt',
        concept: 'Version, Rechtliches, Hilfe und Neuigkeiten als gruppierte Liste, darunter der Datenhinweis.',
        description: '+ Schlicht, vollständig  − Keine Gestaltung',
        layout: { type: 'stack', narrow: true },
        blocks: [
          { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Einstellungen', title: 'Über TAKT', subtitle: 'Version, Lizenzen und Feedback', primaryLabel: '' } },
          { id: 'list', component: 'settings-list', region: 'main', props: { style: 'inset' } },
          { id: 'note', component: 'legal-notice', region: 'main', props: { kind: 'daten' } },
        ],
      }],
      selectedVariantId: 'A',
      links: ['settings.home', 'system.help'],
    },
  ],
  decisions: [
    { featureId: 'settings.home', title: 'Einstellungen-Startseite: Liste, Kacheln oder Empfehlungen zuerst?', decision: '', rationale: 'Liste (A) ist vertraut und durchsuchbar, Kacheln (B) sind ruhig und touchfreundlich, „Empfehlungen zuerst“ (C) zeigt, was jetzt zu tun ist (Etsy-Anmeldung, Sperre). Bei zehn Seiten reicht eine Liste, bei Wachstum helfen Gruppen und Suche.', tradeoffs: 'A: lang, ohne Gewichtung. B: Werte nur als Zusammenfassung. C: braucht verlässliche Regeln für Empfehlungen.', status: 'open' },
    { featureId: 'settings.modules', title: 'Ausgeschaltete Module behalten ihre Daten', decision: 'Ein ausgeschaltetes Modul ist nur ausgeblendet. Seine Daten bleiben erhalten, beim Einschalten ist alles wieder da. „Start“, „Einstellungen“ und „TAKT Kern“ lassen sich nicht ausschalten.', rationale: 'Wer ein Modul probeweise ausschaltet, darf nichts verlieren. Das Löschen von Modul-Daten ist ein eigener, bewusster Schritt (Daten & Backup).', tradeoffs: 'Daten belegen weiter Speicher. Dafür kein Risiko und keine Nachfrage beim Ausschalten.', status: 'decided' },
    { featureId: 'settings.appearance', title: 'Theme gilt für die ganze App', decision: 'Das Theme ist global und ändert nur Farben, nie Anordnung oder Größen. Es gibt keine Themes je Modul.', rationale: 'Einheitliche Wirkung, weniger Wartung, weniger Verwirrung. Regel aus dem Designsystem.', tradeoffs: 'Kein Modul kann sich farblich absetzen. Akzentfarben je Modul bleiben als Icon-Farbe möglich.', status: 'decided' },
    { featureId: 'settings.notifications', title: 'Regeln je Modul oder je Mitteilungsart?', decision: '', rationale: 'Je Modul (heute) ist einfach, je Art (Fälligkeit, Vorlauf, Kursalarm, Frist) wäre präziser, ist aber länger. Android-Kanäle sprechen für Arten.', tradeoffs: 'Je Modul: wenige Schalter, grob. Je Art: genau, aber 20+ Zeilen.', status: 'open' },
    { featureId: 'settings.data', title: 'Sicherung nur lokal oder optional im Konto?', decision: '', rationale: 'Lokal bleibt alles auf dem Gerät und ist einfach, geht aber mit dem Gerät verloren. Ein verschlüsseltes Konto-Backup sichert besser, braucht aber ein Konto und Vertrauen.', tradeoffs: 'Lokal: privat, Risiko Geräteverlust. Konto: sicher, mehr Aufwand und Datenschutzfragen.', status: 'open' },
  ],
};
