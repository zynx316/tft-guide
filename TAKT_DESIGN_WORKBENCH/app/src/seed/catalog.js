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

// ============================================================================
// GRUNDSATZFRAGEN DER APP (Ebene 0) – aus dem Bauplan (docs/BAUPLAN.md, „Entscheidungen für den Nutzer“).
// Fragen, die schon als Pflichtfrage oben stehen (Tonalität, Navigation/Start, Themes), sind hier nicht doppelt.
// ============================================================================
const a = (id, title, question, options, rec, reasons, consequences, reversibility = 'aufwendig') => ({
  ...q(id, title, question, options, rec, reasons, consequences, reversibility), id: `app-${id}`, level: 'app',
});

export const APP_QUESTIONS = [
  a('persona', 'Persona der Demo-Datenwelt', 'Mit wessen Alltag werden alle Module gezeigt und bewertet?', [
    ['jonas', 'Jonas Keller beibehalten', 'Platzhalter: 38, Bielefeld, Online-Shop, ETF-Sparer, Krafttraining 3×/Woche'],
    ['eigen', 'An die eigene Lebenssituation anpassen', 'Struktur bleibt, Werte (Beträge, Termine, Ziele) in seed/world ändern'],
    ['zwei', 'Zweite Persona zur Gegenprüfung', 'z. B. Familie mit Kindern, angestellt – zeigt, ob Entwürfe tragen']],
  'eigen', ['Entscheidungen fallen realistischer, wenn Beträge, Termine und Ziele zum echten Alltag passen', 'Nur Werte ändern – alle Komponenten und Invarianten bleiben gültig'], 'Alle Module zeigen dieselbe Welt; Anpassung in app/src/seed/world/*.js (siehe docs/DATENWELT.md).', 'leicht'),
  a('sync', 'Datenhaltung und Synchronisation', 'Wo liegen die Daten von TAKT – nur auf dem Gerät oder auch synchronisiert?', [
    ['local', 'Nur lokal + manuelles Backup (Export-Datei)'],
    ['local-sync', 'Lokal zuerst + optionaler, verschlüsselter Sync/Backup', 'Konflikte sichtbar, geteilte Listen (z. B. Einkauf) möglich'],
    ['cloud', 'Cloud zuerst (Konto Pflicht)']],
  'local-sync', ['Erfassen muss ohne Netz funktionieren', 'Gerätewechsel und geteilte Einkaufsliste brauchen später Sync', 'Verschlüsselung hält Gesundheits- und Finanzdaten privat'], 'Bestimmt Datenmodell (IDs, Zeitstempel, Konfliktfelder), Einstellungen › Daten und das Onboarding. Siehe docs/ADR-002-datenhaltung.md.', 'unumkehrbar'),
  a('scope', 'Modulumfang von V2.0 (Moduldeckel)', 'Welche Module gehören in V2.0 – und welche bewusst nicht?', [
    ['basis', '19 Module laut Bauplan', 'Reisen als Vorlage, Rechnungen nur als Export, Kontakte/Zeiterfassung/Journal später'],
    ['mehr', '+ Kontakte, Zeiterfassung und Journal', 'Mehr Abdeckung, aber weniger Tiefe je Modul'],
    ['schlank', 'Nur Kern: Start, Kalender, Aufgaben, Notizen, Finanzen, Fitness, Ernährung, Wetter', 'Schneller fertig, weniger All-in-one']],
  'basis', ['Tiefe vor Breite: lieber 19 gute als 25 halbe Module', 'Verworfene Module bleiben als Entscheidung dokumentiert und können später kommen'], 'Legt Navigation (Mehr/Lebensbereiche), Ausbaustufen und Datenwelt fest.', 'aufwendig'),
  a('sources', 'Datenquellen für Wetter, Kurse und Lebensmittel', 'Welche externen Quellen nutzt TAKT?', [
    ['frei', 'Frei verfügbare Quellen', 'Wetter: DWD/Open-Meteo · Kurse: verzögert (15 Min.) · Lebensmittel: Open Food Facts (ODbL, Namensnennung)'],
    ['lizenz', 'Lizenzierte Quellen', 'Echtzeitkurse, kommerzielle Lebensmitteldatenbank – laufende Kosten, Verträge'],
    ['demo', 'Bis Phase 2 nur Demo-Daten, Entscheidung je Modul']],
  'frei', ['Keine laufenden Kosten für eine persönliche App', 'Offline-Cache möglich', 'Lizenzpflichten (Namensnennung) sind überschaubar'], 'Beeinflusst Alarme (Wetterwarnungen), Plausibilitätsprüfungen im Order-Ticket und das Offline-Verhalten. Pollen und Radar nur regional verfügbar.', 'aufwendig'),
  a('banking', 'Konto- und Depotanbindung', 'Wie kommen Buchungen und Depotwerte in TAKT?', [
    ['manuell', 'Manuelle Erfassung + CSV/CAMT-Import, Sparpläne als Plan-Tracker'],
    ['aggregator', 'Bank-Aggregator (PSD2-Dienst)', 'Automatisch, aber Backend, Vertrag und Haftung nötig'],
    ['broker', 'Broker-Anbindung mit echten Orders']],
  'manuell', ['Ohne Backend und Lizenz umsetzbar', 'Schnellerfassung in unter 5 Sekunden ist ohnehin der Hauptweg', 'TAKT führt nie selbst Sparpläne oder Orders aus'], 'Finanzen/Sparen/Trading bleiben Planung und Überblick; Import-Assistent wird eigenes Feature.', 'aufwendig'),
  a('health', 'Umfang der Gesundheitsfunktionen', 'Wie weit gehen Fitness und Ernährung?', [
    ['ruhig', 'Ruhiger Kern', 'Aktivitätskalorien nie als Zusatzbudget, kein GPS-Tracking, Gewohnheitsmodus ohne Zahlen wählbar'],
    ['gps', '+ GPS-Ausdauertraining (Laufen, Rad)'],
    ['voll', '+ Health-Connect-Sync, Aktivitätskalorien verrechnet']],
  'ruhig', ['Nachhaltig statt Druck (siehe docs/HEALTH_GUIDELINES.md)', 'GPS und Sync brauchen Berechtigungen, Hintergrunddienste und Gerätetests'], 'Legt Berechtigungen, Datenschutzhinweise und die Ernährungsrechnung fest.', 'aufwendig'),
  a('legal-review', 'Fachliche Prüfung der Hinweistexte', 'Wer prüft Texte zu Anlage, Steuer und Gesundheit – und wann?', [
    ['vor-release', 'Vor jeder Veröffentlichung durch eine Fachperson; bis dahin als Annahme gekennzeichnet'],
    ['selbst', 'Selbstprüfung anhand der Leitlinien-Checkliste'],
    ['keine', 'Keine Prüfung (nur private Nutzung)']],
  'vor-release', ['Hinweise sind zentral (legal-notice) – eine Prüfung gilt für alle Module', 'Private Nutzung braucht keine Prüfung, eine Veröffentlichung schon'], 'Texte in legal-notice und den Leitlinien tragen ein Stand-Datum und den Status „Annahme“.', 'leicht'),
  a('android', 'Android-Plattformvorgaben', 'Welche Android-Konventionen gelten für die Flutter-Umsetzung?', [
    ['takt', 'Eigene TAKT-Themes, Edge-to-Edge und Predictive Back Pflicht', 'Dynamic Color später als Option'],
    ['dynamic', 'Material You (Dynamic Color) als Standard'],
    ['minimal', 'Nur Edge-to-Edge, sonst Standardverhalten']],
  'takt', ['Themes sind geprüft (Kontrast-Audit) und markenprägend', 'Edge-to-Edge ist ab Android 15 Standard, Predictive Back erwartet'], 'ThemeData/ThemeExtension aus dem Token-Export, Navigation mit Predictive-Back-Unterstützung.', 'aufwendig'),
  a('seed-patch', 'Übernahme der neuen Seed-Inhalte zuhause', 'Wie kommt der neue Stand in die eigene Workbench-Datei?', [
    ['neu', 'Neu anlegen aus dem Seed (vorher automatisches Backup)', 'Empfohlen, solange noch kaum eigene Entscheidungen im Stand sind'],
    ['additiv', 'Nur Neues ergänzen („Neue Seed-Inhalte übernehmen“)', 'Bestehende Features bleiben unverändert – neue Varianten bestehender Features fehlen dann'],
    ['patch', 'Seed-Patch: unveränderte, nicht gesperrte Features aktualisieren, Gesperrtes als Vorschlag', 'Noch zu bauen (Bauplan 5.10)']],
  'neu', ['Der Seed enthält jetzt alle Module mit Richtungsvarianten', 'Backup macht den Schritt umkehrbar', 'Ergänzen allein würde neue Varianten bestehender Features auslassen'], 'Daten & Backup › „Auf Seed zurücksetzen“ (Backup entsteht automatisch) oder „Neue Seed-Inhalte übernehmen“.', 'leicht'),
  a('device-test', 'Gerätetest als Freigabe-Bedingung', 'Ab wann ist ein Test auf einem echten Android-Gerät Pflicht?', [
    ['tier1', 'Pflicht für Tier-1-Features und Modul-Meilensteine'],
    ['meilensteine', 'Nur an Meilensteinen (erste Modulfreigabe, Gesamtcheck)'],
    ['alle', 'Für jede Freigabe']],
  'tier1', ['Tier 1 sind die täglich genutzten Screens – dort zählt Daumenzone und Tastatur', 'Alle Freigaben zu testen bremst ohne Mehrwert'], 'Gate „Fertig“ prüft den Gerätetest bei Tier 1 (bereits so umgesetzt); Checkliste in docs/GERAETETEST.md.', 'leicht'),
  a('coverage', 'Richtungswahl bei geringer Abdeckung', 'Darf eine App-Richtung gewählt werden, wenn weniger als 60 % der Tier-1-Features eine eigene Variante haben?', [
    ['warnen', 'Erlaubt, mit sichtbarer Warnung und Pflichtbegründung'],
    ['sperren', 'Gesperrt, bis 60 % erreicht sind'],
    ['frei', 'Ohne Einschränkung']],
  'warnen', ['Ehrlicher Vergleich ohne den Prozess zu blockieren', 'Fehlende Varianten werden danach gezielt nachgezogen'], 'Launcher und Entscheidungsrunde zeigen die Abdeckung je Richtung.', 'leicht'),
];
