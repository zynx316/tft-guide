// ============================================================================
// PFLICHTFRAGEN DER APP-EBENE (Muster) – einmal entscheiden, überall anwenden.
// Jede Frage hat Optionen, eine begründete Empfehlung (vorbereitet, NICHT entschieden),
// Auswirkungen und Reversibilität. Entschieden wird in einer Entscheidungsrunde.
// ============================================================================
const q = (id, title, question, options, rec, reasons, consequences, reversibility = 'aufwendig') => ({
  id: `pattern-${id}`, level: 'pattern', status: 'open', title, question,
  options: options.map(([oid, label, description = '']) => ({ id: oid, label, description })),
  recommendation: { optionId: rec, reasons, confidence: 'mittel', by: 'Claude (Vorschlag)' },
  consequences, reversibility, assumption: false,
});

export const PATTERN_QUESTIONS = [
  q('nav', 'Hauptnavigation der App', 'Wie navigiert man zwischen 16+ Modulen?', [
    ['bottom', 'Untere Leiste (4 Favoriten + „Mehr“)', 'Daumen-erreichbar, Favoriten frei wählbar'],
    ['hub', 'Start als Modul-Hub (Kacheln)', 'Alle Module auf einer Startseite, keine feste Leiste'],
    ['drawer', 'Seitenmenü (Drawer)', 'Viele Einträge, aber versteckt und schlechter erreichbar']],
  'bottom', ['Einhandbedienung am Handy', 'Häufigste 4 Module ohne Umweg', 'Skaliert über „Mehr“ + Lebensbereiche'], 'Bestimmt App-Rahmen, Startseite und Onboarding (Favoritenwahl).', 'aufwendig'),
  q('start', 'Startbildschirm', 'Womit öffnet die App?', [
    ['today', '„Heute“ (modulübergreifend)', 'Agenda, Fälliges, Kennzahlen, Hinweise'], ['last', 'Zuletzt genutztes Modul'], ['hub', 'Modul-Hub']],
  'today', ['Der Mehrwert einer All-in-one-App entsteht modulübergreifend', 'Morgens in 30 Sekunden orientiert'], 'Start-Modul wird Tier 1, braucht Datenwelt aus allen Modulen.', 'leicht'),
  q('density', 'Informationsdichte', 'Wie dicht sind Listen und Karten standardmäßig?', [
    ['kompakt', 'Kompakt'], ['komfortabel', 'Komfortabel'], ['wählbar', 'Wählbar je Nutzer (Standard komfortabel)']],
  'wählbar', ['Power-User will Dichte, Gelegenheitsnutzung braucht Ruhe', 'Tokens erlauben Dichte-Skala ohne IA-Änderung'], 'Alle Listen-Komponenten brauchen eine Dichte-Prop.', 'leicht'),
  q('capture', 'Globale Schnellerfassung', 'Wie erfasst man etwas von überall?', [
    ['fab', 'Schwebender Plus-Knopf (FAB) auf allen Screens'], ['bar', 'Erfassen-Leiste unten im Modul'], ['global', 'Ein globales „Erfassen“ mit Erkennung (Aufgabe/Termin/Notiz/Buchung)']],
  'global', ['Ein Ort für alles senkt Denkaufwand', 'Erkennung spart Modulwechsel', 'Ergänzt um Modul-Erfassen, wo sinnvoll'], 'TAKT Kern › Schnell erfassen wird Tier 1.', 'aufwendig'),
  q('input', 'Eingabemuster', 'Wie öffnen Formulare zum Anlegen/Bearbeiten?', [
    ['sheet', 'Bottom-Sheet (Mobile) / Dialog (Desktop)'], ['fullscreen', 'Vollbild-Screen'], ['inline', 'Inline in der Liste']],
  'sheet', ['Kontext bleibt sichtbar', 'Konsistent mit Runtime-Dialogen', 'Vollbild nur für lange Formulare (Assistenten)'], 'Dialog-Primitiv ist Standard; Assistenten als eigene Screens.', 'aufwendig'),
  q('delete', 'Löschen', 'Bestätigungsdialog oder Rückgängig?', [
    ['undo', 'Sofort löschen + „Rückgängig“-Hinweis + Papierkorb (30 Tage)'], ['confirm', 'Bestätigungsdialog vor jedem Löschen']],
  'undo', ['Weniger Unterbrechung', 'Papierkorb macht Fehler folgenlos', 'Bestätigung nur bei Unumkehrbarem (z. B. Konto löschen)'], 'Papierkorb in TAKT Kern, Toast mit Aktion in allen Modulen.', 'leicht'),
  q('empty', 'Leer- und Erstnutzungszustände', 'Wie sehen leere Screens aus?', [
    ['guided', 'Erklärung + eine klare erste Aktion (+ optional Beispieldaten)'], ['minimal', 'Nur Hinweis „Noch nichts hier“']],
  'guided', ['Erste Nutzung entscheidet über Akzeptanz', 'Komponenten haben bereits EmptyState mit Aktion'], 'Jede Sammlungskomponente braucht Aktion im Leerzustand.', 'leicht'),
  q('tone', 'Anrede und Tonalität', 'Wie spricht TAKT mit dem Nutzer?', [
    ['du', '„Du“, freundlich, knapp, ohne Ausrufezeichen'], ['sie', '„Sie“, sachlich']],
  'du', ['Persönliche App', 'Kurze Texte lesen sich mobil besser', 'Gesundheit/Finanzen: sachlich, ohne Druck'], 'Mikrocopy-Katalog und alle Seeds.', 'leicht'),
  q('formats', 'Zahlen-, Datums- und Währungsformate', 'Welche Formate gelten?', [
    ['de', 'de-DE: 1.234,56 €, Di, 24.11., 24-h-Zeit, Woche ab Montag'], ['system', 'Systemeinstellung des Geräts']],
  'de', ['Persona und Steuerkontext deutsch', 'Einheitlich prüfbar (QA)'], 'money()/percent()-Helfer, intl de_DE in Flutter.', 'leicht'),
  q('privacy', 'Sensible Daten (Finanzen, Gesundheit)', 'Wie werden Beträge und Gesundheitsdaten geschützt?', [
    ['mask', 'Beträge ausblendbar + App-Sperre für sensible Module'], ['lock', 'Ganze App mit PIN/Biometrie'], ['none', 'Kein besonderer Schutz']],
  'mask', ['Schneller Blick ohne Preisgabe in der Öffentlichkeit', 'Sperre nur, wo nötig (weniger Reibung)', 'Gesundheitsdaten Art. 9 DSGVO: lokal'], 'Privatsphäre-Modus in allen Finanz-Komponenten, TAKT Kern › App-Sperre.', 'aufwendig'),
  q('offline', 'Offline-Verhalten', 'Was passiert ohne Netz?', [
    ['local-first', 'Lokal zuerst: alles nutzbar, Sync später, Konflikte sichtbar'], ['readonly', 'Nur lesen ohne Netz']],
  'local-first', ['Kerndaten liegen ohnehin lokal', 'Erfassen unterwegs muss immer gehen'], 'Zustandskatalog (Offline, Sync-Konflikt) wird verbindlich.', 'unumkehrbar'),
  q('theme', 'Themes', 'Welche Themes bietet TAKT?', [
    ['three', 'Graphite (Standard), Horizon (hell), Intensiv (Kontrast)'], ['system', 'Hell/Dunkel nach System + Akzentfarbe']],
  'three', ['Bereits im Designsystem und geprüft', 'Themes ändern nur Farben – kein Mehraufwand je Modul'], 'Theme-Auswahl in Einstellungen, Kontrast-Audit bleibt Pflicht.', 'leicht'),
  q('gestures', 'Gesten', 'Welche Wischgesten gibt es in Listen?', [
    ['swipe', 'Wischen: rechts = erledigen/abhaken, links = mehr (Löschen, Verschieben)'], ['none', 'Keine Gesten, nur Tippen + Menü']],
  'swipe', ['Schnell bei häufigen Aktionen', 'Immer mit sichtbarer Alternative (Menü) – barrierefrei'], 'Listen-Komponenten brauchen Swipe-Aktionen + Menü.', 'aufwendig'),
  q('notifications', 'Benachrichtigungen', 'Wie laut ist TAKT?', [
    ['digest', 'Tagesbriefing + nur zeitkritische Einzel-Mitteilungen, Ruhezeiten'], ['all', 'Jede Erinnerung einzeln']],
  'digest', ['Weniger Unterbrechung', 'Ein Ort für alles (Mitteilungszentrale)'], 'Regeln in TAKT Kern › Mitteilungen, Briefing im Start-Modul.', 'leicht'),
  q('a11y', 'Barrierefreiheit & Schriftgröße', 'Welcher Anspruch gilt?', [
    ['aa', 'WCAG AA, Schrift bis 200 % ohne Abschneiden, Touch ≥ 44 dp'], ['basic', 'Nur Kontrast']],
  'aa', ['QA-Sonde prüft Kontrast/Touch schon', 'Skalierung muss früh im Layout berücksichtigt werden'], 'Schriftskalierung als QA-Dimension ergänzen.', 'aufwendig'),
  q('onboarding', 'Onboarding', 'Wie startet man das erste Mal?', [
    ['modules', '3 Schritte: Module wählen → Favoriten → Datenschutz, dann Start mit Beispieldaten optional'], ['none', 'Direkt in die App']],
  'modules', ['16+ Module überfordern ohne Auswahl', 'Favoriten speisen die Navigation'], 'TAKT Kern › Willkommen wird Pflicht-Feature.', 'leicht'),
  q('back', 'Zurück-Verhalten', 'Was macht „Zurück“ (Android) in Modulen?', [
    ['stack', 'Pro Modul eigener Verlauf, Zurück zuerst Dialog/Sheet schließen, dann Ebene hoch'], ['global', 'Globaler Verlauf über Module hinweg']],
  'stack', ['Erwartung von Android-Nutzern', 'Modulwechsel über Leiste behält Zustand'], 'Navigation (go_router) mit Shell-Routen je Modul.', 'aufwendig'),
  q('widgets', 'Startbildschirm-Widgets (Android)', 'Welche Widgets in V2.0?', [
    ['core', 'Heute, Schnell erfassen, Nächster Termin'], ['later', 'Später']],
  'core', ['Hoher Nutzen bei geringem Umfang', 'Wiederverwendung der Start-Komponenten'], 'Eigene Spezifikation je Widget (Flutter home_widget).', 'leicht'),
  q('finance-legal', 'Finanzen & Trading: Hinweise und Grenzen', 'Wie weit gehen Finanz-Funktionen?', [
    ['simulate', 'Anzeige, Planung, Simulation – keine Orderausführung, Hinweise sichtbar'], ['broker', 'Broker-Anbindung mit echten Orders']],
  'simulate', ['Rechtlich und technisch beherrschbar', 'Fokus auf Überblick und Planung'], 'legal-notice in Finanz-/Trading-Features, Order-Ticket bleibt Simulation.', 'unumkehrbar'),
  q('health-tone', 'Gesundheit: Tonalität und Grenzen', 'Wie motiviert TAKT bei Fitness/Ernährung?', [
    ['calm', 'Ruhig, ohne Rot bei Überschreitung, keine Diät-Moral, Untergrenzen bei Zielen'], ['gamified', 'Stark spielerisch (Abzeichen, Ranglisten)']],
  'calm', ['Nachhaltige Gewohnheiten statt Druck', 'Keine Medizinprodukt-Aussagen'], 'Gesundheits-Leitplanken verbindlich für alle Varianten.', 'aufwendig'),
];
