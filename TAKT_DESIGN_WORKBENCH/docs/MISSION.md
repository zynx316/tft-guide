# Original-Auftrag (unverändert übernommen, Stand 24.11.2026)

> Dieses Dokument ist die Referenz für Ziele und Anforderungen der TAKT Design Workbench.
> Umsetzungsstand je Punkt: siehe `HANDOFF.md` (Abschnitt „Abdeckung des Auftrags“) und `TASKS.md`.

---

CLAUDE – OVERNIGHT AUTONOMOUS PROJECT

TAKT DESIGN WORKBENCH – MODULAR DESIGN SYSTEM, FEATURE WORKSPACE, INTERACTIVE PREVIEW & QA

## MASTER MISSION

Du erhältst einen umfassenden Entwicklungsauftrag.

Dein Ziel ist die Entwicklung einer eigenständigen TAKT Design Workbench – einer dauerhaften Design-, Konzeptions-, Vorschau- und Qualitätssicherungsumgebung, mit der wir TAKT langfristig Modul für Modul und Feature für Feature weiterentwickeln können.

Ich möchte zukünftig nicht mehr bei jeder Designänderung von vorne anfangen, neue HTML-Dateien erstellen, sämtliche Screens neu gestalten oder wiederholt endlose Tests auf echten Smartphones durchführen müssen.

Stattdessen benötigen wir eine zentrale, dauerhaft nutzbare Arbeitsumgebung, in der:

- Die gesamte TAKT-Modulstruktur abgebildet werden kann.
- Jedes Modul einzeln bearbeitet werden kann.
- Jedes Feature separat betrachtet und gestaltet werden kann.
- Verschiedene Layout- und Designvarianten erstellt und verglichen werden können.
- Features unabhängig voneinander entwickelt werden können.
- Freigegebene Designs erhalten bleiben.
- Änderungen nachvollziehbar dokumentiert werden.
- Bereits abgeschlossene Features nicht ständig erneut aufgebaut werden.
- Gemeinsame Designkomponenten zentral verbessert werden können.
- Eine interaktive Desktop- und Mobile-Vorschau existiert.
- Die Qualität automatisiert geprüft werden kann.
- Das System flexibel genug bleibt, um neue Ideen und Features jederzeit aufzunehmen.

Du sollst diesen Auftrag nicht nur theoretisch ausarbeiten. Du sollst das Konzept durchdenken, die Architektur festlegen und – sofern die technische Umgebung dies zulässt – mit Claude Code tatsächlich einen ersten funktionsfähigen Prototyp entwickeln.

Nutze die Nacht sinnvoll und autonom.

Arbeite nicht nach wenigen Minuten an einem Minimal-Dashboard und erkläre den Auftrag anschließend für abgeschlossen.

---

## 1. AUTONOMES ARBEITEN ÜBER DIE NACHT

Du darfst und sollst den Auftrag eigenständig in mehrere klar definierte Phasen aufteilen.

Arbeite sequenziell.

Du darfst Worker-Sessions und Sub-Agents für unabhängige Recherche-, Analyse- und Prüfaufgaben einsetzen. Die zentrale Architektur, Entscheidungen, Integration und Qualitätskontrolle bleiben jedoch bei dir.

Du sollst während der Arbeit:

1. Den Auftrag vollständig verstehen.
2. Die bestehende TAKT-Projektstruktur untersuchen.
3. Eine sinnvolle Architektur für die Workbench entwickeln.
4. Die Architektur auf Probleme und Risiken prüfen.
5. Den Prototyp schrittweise aufbauen.
6. Komponenten wiederverwendbar entwickeln.
7. Module und Features dynamisch verwaltbar machen.
8. Die Vorschau tatsächlich interaktiv gestalten.
9. Automatisierte Qualitätssicherung integrieren.
10. Den fertigen Zustand gründlich überprüfen.
11. Dokumentieren, was tatsächlich umgesetzt wurde.
12. Einen vollständigen Bericht erstellen.

Wenn eine Phase abgeschlossen ist, gehe selbstständig zur nächsten Phase über.

Wenn du an einer Stelle blockiert bist, suche eine sinnvolle Alternative, statt die gesamte Arbeit abzubrechen.

Wenn etwas technisch nicht möglich ist, dokumentiere die Einschränkung und arbeite mit der bestmöglichen Alternative weiter.

Keine unnötigen Rückfragen während der Nacht. Triff nachvollziehbare technische Entscheidungen selbstständig, sofern diese keine riskanten Änderungen an bestehenden Produktivdaten oder Projektdateien verursachen.

---

## 2. DIE GRUNDIDEE

Entwickle keine einmalige HTML-Vorschau.

Entwickle eine dauerhafte Arbeitsumgebung:

TAKT DESIGN WORKBENCH

Die Workbench ist ein eigenständiges Werkzeug zur Entwicklung, Gestaltung, Strukturierung, Visualisierung und Freigabe von TAKT-Modulen und Features.

Sie soll langfristig als unser zentraler Designarbeitsplatz dienen.

Die Anwendung soll selbst eine hochwertige Softwareoberfläche besitzen.

Sie ist kein simples Admin-Dashboard.

Sie ist kein statischer Screenshot.

Sie ist kein bloßer HTML-Katalog.

Sie ist eine interaktive Umgebung, in der wir die zukünftige TAKT-Anwendung Schritt für Schritt konzipieren können.

---

## 3. ZUERST: PROJEKTUMGEBUNG UND BESTAND UNTERSUCHEN

Bekannter Projektpfad:

"G:\Projekte\97_Uebernahme\TAKT-Merge-Git\"

Dieser Pfad ist nur ein Ausgangspunkt.

Verifiziere:

- Wo befindet sich das aktuelle TAKT-Projekt?
- Welche Version ist die aktuell verwendete?
- Welche Projektkopien existieren?
- Welche bisherigen Designprototypen existieren?
- Welche HTML-Vorschauen existieren bereits?
- Welche Designkonzepte wurden bereits entwickelt?
- Welche Dokumentationen existieren?
- Welche Modulregistrierung ist aktuell?
- Welche Features und Module sind bereits bekannt?
- Welche Anforderungen aus früheren Konzepten müssen berücksichtigt werden?

Nutze vorhandene Projektinformationen und Dokumentationen, sofern diese zugänglich sind.

Fitness und Finanzen wurden bereits separat ausführlich behandelt.

Diese Bereiche sollen nicht erneut vollständig auditiert werden.

Berücksichtige jedoch ihre bereits bekannten Anforderungen und Konzepte bei der Architektur und Gestaltung der Workbench.

Insbesondere sollen sie als Referenz dienen, damit das neue Designsystem nicht wieder bei null anfängt.

### Git-Sicherheit

Vor allen Arbeiten:

- Branch ermitteln.
- Commit ermitteln.
- Git-Status prüfen.
- Änderungen dokumentieren.
- Untracked-Dateien dokumentieren.
- Vorhandene Prototypen prüfen.

Aus früheren Prüfungen waren unter anderem folgende Änderungen bekannt:

- "android/version_code.state"
- "_bau_apk_2026-09-27.ps1"

Prüfe den aktuellen Status.

Nichts überschreiben. Nichts zurücksetzen. Nichts stagen. Nichts stashen. Nichts committen. Nichts pushen.

Keine produktiven Flutter-/Dart-Dateien verändern.

Die Workbench ist ein eigenständiges Projekt beziehungsweise ein eindeutig isolierter Arbeitsbereich.

---

## 4. AUTONOME AGENTEN UND WORKER-SESSIONS

Nutze Claude Code mit mehreren spezialisierten Sessions und Sub-Agents.

### Modellvorgaben

Worker-Sessions: Modell: Sonnet · Effort: High

Sub-Agents: Modell: Sonnet · Normales Effort-Level

Nutze keine anderen Modelle als Ersatz.

Falls die Umgebung das explizite Setzen der Modelle oder Effort-Level nicht unterstützt, dokumentiere die tatsächliche Einschränkung.

### Mögliche Agentenverteilung

**Worker A – TAKT-Projektanalyse.** Untersucht: Projektstruktur, Modulregister, Navigation, bestehende Features, Projektkopien, Designstand, vorhandene Dokumentationen. Ergebnis: Eine belastbare Modul- und Feature-Struktur.

**Worker B – Workbench-Architektur.** Entwickelt einen Vorschlag für: Modulverwaltung, Feature-Verwaltung, Designvarianten, Freigabesystem, Versionshistorie, Datenstruktur, Komponentenarchitektur.

**Worker C – UX und Informationsarchitektur.** Untersucht, wie die Workbench selbst möglichst intuitiv gestaltet werden sollte. Fokus: Navigationsstruktur, Arbeitsbereiche, Modul-Cockpits, Feature-Detailseiten, Designvergleich, weniger Klicks, weniger Scrollen, klare Hierarchie.

**Worker D – Responsive Design und Preview.** Untersucht die beste Lösung für: Desktop, Notebook, Tablet, Mobile, Geräteprofile, Vorschaugrößen, Viewport-Wechsel, Layouttests.

**Worker E – QA und Testsystem.** Entwickelt eine Strategie für: UI-Tests, Interaktionstests, Screenshot-Tests, Responsive Tests, visuelle Regression, Feature-Freigaben, Regressionstests für gemeinsame Komponenten.

**Worker F – Designsystem.** Entwickelt eine sinnvolle globale Designsystem-Struktur. Fokus: Themes, Typografie, Farben, Abstände, Komponenten, Navigation, Karten, Tabellen, Diagramme, Formulare, Dialoge, Statusanzeigen.

**Worker G – Architekturprüfung.** Prüft die geplante Architektur kritisch. Fragen: Ist sie zu kompliziert? Ist sie zu monolithisch? Sind die Features wirklich unabhängig? Können Designs ohne komplette Neuentwicklung geändert werden? Ist die Komponentenstruktur sinnvoll? Gibt es unnötige Abhängigkeiten? Ist die Workbench langfristig erweiterbar? Werden unnötige Technologien verwendet?

Die zentrale Instanz übernimmt die Ergebnisse und entscheidet.

Agenten dürfen Vorschläge liefern, aber keine unabhängigen Gesamtarchitekturen implementieren.

---

## 5. DIE ZENTRALE NAVIGATION DER WORKBENCH

Entwickle eine klare Navigation. Die Workbench soll mindestens folgende Bereiche besitzen:

**A. Overview / Dashboard.** Startseite der Workbench. Sie zeigt: Gesamtstatus der Designarbeit, Anzahl vorhandener Module, Anzahl vorhandener Features, Features in Arbeit, freigegebene Features, offene Entscheidungen, letzte Änderungen, nächste sinnvolle Arbeitsbereiche, Qualitätsstatus. Die Übersicht darf nicht mit Informationen überladen sein. Sie soll einen schnellen Überblick über den gesamten Fortschritt ermöglichen.

**B. Modules.** Eine vollständige Modulübersicht. Jedes Modul soll ein eigenes Cockpit besitzen. Beispiele: Kalender, Aufgaben, Wetter, Notizen, Knowledge Base, Sales Channels, Picture to Text, Fitness, Finanzen, Trading, weitere tatsächlich vorhandene TAKT-Module. Fitness und Finanzen werden als bereits bearbeitete Referenzmodule geführt.

**C. Features.** Ein zentraler Feature-Browser. Features sollen unabhängig vom Modul verwaltet werden können, aber eindeutig einem Modul zugeordnet sein.
Beispiel Kalender: Tagesansicht, Wochenansicht, Monatsansicht, Termin erstellen, Termin bearbeiten, Wiederholungen, Kategorien, Filter, Aufgabenintegration.
Aufgaben: Aufgabenübersicht, Kanban, Listenansicht, Prioritäten, Fälligkeit, Wiederholungen, Kategorien, Projekte, Detailansicht.
Die konkrete Feature-Liste muss aus der tatsächlichen TAKT-Struktur abgeleitet und später flexibel erweitert werden können.

**D. Design Studio.** Der zentrale Bereich für die visuelle Gestaltung. Hier sollen: Features geöffnet werden, Layouts verändert werden, Designvarianten angelegt werden, Varianten verglichen werden, Vorschauen gestartet werden, Themes gewechselt werden, Desktop- und Mobile-Ansichten geprüft werden, Änderungen gespeichert werden.

**E. Component Library.** Eine gemeinsame Bibliothek für alle Module. Hier befinden sich beispielsweise: Buttons, Karten, Statistiken, Tabellen, Listen, Diagramme, Navigationselemente, Dialoge, Formulare, Filter, Suchfelder, Tabs, Badges, Empty States, Loading States, Error States. Komponenten sollen zentral gepflegt und wiederverwendbar sein.

**F. Versions und Decision Center.** Ein zentraler Bereich für: freigegebene Designs, Designversionen, Änderungsverlauf, Entscheidungen, Begründungen, offene Punkte, Rücknahme auf vorherige Versionen, Änderungsprotokolle.

**G. Quality Center.** Eine zentrale Qualitätsübersicht. Dort sollen sichtbar sein: Welche Features wurden geprüft? Welche Prüfungen bestanden? Welche Prüfungen sind offen? Welche Fehler existieren? Welche Viewports wurden getestet? Welche Screenshots existieren? Welche Regressionen sind aufgetreten?

---

## 6. MODULE UND FEATURES FLEXIBEL VERWALTEN

Die Workbench darf nicht auf eine feste Liste von Modulen oder Features beschränkt sein.

Ich möchte jederzeit: ein neues Modul hinzufügen, ein Modul umbenennen, Module sortieren, Module archivieren, Features hinzufügen, Features umbenennen, Features verschieben, Features gruppieren, Features archivieren, Features duplizieren, Feature-Status verändern, Feature-Versionen verwalten, Features mit anderen Features verknüpfen.

Die Architektur soll das unterstützen.

**Modulstruktur.** Jedes Modul besitzt: Name, Icon, Beschreibung, Status, Theme, Designversion, Feature-Liste, Modulübersicht, Verknüpfungen, Dokumentation.

**Featurestruktur.** Jedes Feature besitzt: Feature-ID, Name, Modul, Zweck, Anforderungen, Status, Designversion, Layout, Designvarianten, Interaktionen, Demo-Daten, Viewports, Qualitätsprüfungen, Entscheidungen, Änderungsverlauf, Screenshots, Referenzen.

Die Datenstruktur soll erweiterbar sein. Verwende keine unnötig komplizierte Datenbankarchitektur, wenn eine einfache lokale persistente Struktur ausreicht.

---

## 7. FEATURE-WORKSPACE – DAS ZENTRALE ELEMENT

Jedes Feature erhält seinen eigenen vollständigen Arbeitsbereich. Beispiel: Kalender → Wochenansicht. Der Arbeitsbereich enthält:

1. **Übersicht:** Feature-Name, zugehöriges Modul, Zweck, Status, aktuelle Version.
2. **Anforderungen:** Was muss dieses Feature können? Welche Informationen müssen sichtbar sein? Welche Aktionen müssen möglich sein? Welche Zustände gibt es?
3. **Design:** Das aktuell ausgewählte Layout.
4. **Designvarianten:** Beispielsweise Variante A, B, C. Varianten müssen sich sinnvoll unterscheiden. Nicht nur Farben verändern. Vergleiche unterschiedliche Informationshierarchien, Layouts, Bedienkonzepte und Komponentenanordnungen.
5. **Preview:** Eine echte interaktive Vorschau.
6. **Viewports:** Desktop, Notebook, Tablet, Mobile.
7. **Interaktionen:** Alle relevanten Interaktionen des Features.
8. **Demo-Daten:** Eigene Daten für das Feature.
9. **Qualitätskontrolle:** Tests und Qualitätskriterien.
10. **Entscheidungen:** Warum wurde Variante B ausgewählt? Warum wurde ein bestimmtes Layout bevorzugt? Welche Nachteile wurden bewusst akzeptiert?
11. **Historie:** Welche Versionen existieren? Welche Änderungen wurden durchgeführt?

---

## 8. DESIGNVARIANTEN UND VERGLEICH

Die Workbench soll flexible Designvergleiche ermöglichen. Nicht jedes Feature benötigt drei Entwürfe. Die Anzahl der Varianten soll vom Nutzen abhängen. Bei komplexen Features können beispielsweise drei grundlegend unterschiedliche Ansätze erstellt werden.

Beispiel Kalender:
- **Variante A – Kompakt:** maximale Informationsdichte, kleine Karten, übersichtliche Termine, Fokus auf schnelle Bedienung.
- **Variante B – Visuell:** größere Termine, mehr Raum, klarere Tagesstruktur, visuelle Orientierung.
- **Variante C – Produktivitätsorientiert:** Termine und Aufgaben kombiniert, Prioritäten, Fokus auf nächste Aktionen, Kontextinformationen.

Diese Varianten sollen in der Vorschau vergleichbar sein.

**Vergleichsmöglichkeiten** (sofern sinnvoll): Nebeneinander-Vergleich, Wechsel zwischen Varianten, gemeinsamer Viewport, Theme-Wechsel, Vergleich wichtiger Interaktionen, Kennzeichnung der Unterschiede, Auswahl einer bevorzugten Variante.

Die Workbench darf nicht nur einen Screenshotvergleich bieten. Es sollen echte, bedienbare Varianten sein.

---

## 9. GLOBALES DESIGN SYSTEM

Entwickle ein zentrales Designsystem.

**Themes:** Graphite – Standard, Horizon, Intensiv. Die Themes beeinflussen: Farben, Hintergrund, Oberflächen, Kontraste, Akzente, ausgewählte visuelle Details. Sie dürfen nicht die Informationsarchitektur verändern.

**Design Tokens** für: Farben, Typografie, Abstände, Border Radius, Schatten, Größen, Oberflächen, Status, Breakpoints, Animationen. Diese Tokens sollen an einer zentralen Stelle definiert sein. Die Änderung eines Tokens soll nicht manuell in vielen Dateien erforderlich sein.

**Komponenten:** Erstelle eine sinnvolle wiederverwendbare Komponentenbibliothek. Beispielsweise: App Shell, Sidebar, Top Navigation, Mobile Navigation, Module Cards, Feature Cards, Metric Cards, Charts, Tables, Lists, Search, Filters, Tabs, Buttons, Dialogs, Drawers, Forms, Notifications, Status Badges, Empty States, Error States. Komponenten müssen nicht nur optisch existieren, sondern sinnvolle Interaktionen besitzen.

---

## 10. DESIGN FREIGEBEN UND EINFRIEREN

Ein zentrales Ziel ist, endlose Designrunden zu verhindern. Implementiere ein nachvollziehbares Freigabesystem.

**Feature-Status (mindestens):** Nicht untersucht, Analysiert, Design in Arbeit, In Prüfung, Freigegeben, Implementiert, Regression bestanden.

**Freigabe:** Ein Feature kann nach erfolgreicher Prüfung freigegeben werden. Eine Freigabe soll: Designversion fixieren, Anforderungen fixieren, Interaktionen dokumentieren, Viewports dokumentieren, Tests dokumentieren, Screenshot-Referenzen speichern, Entscheidungsgrundlage speichern.

Freigegebene Designs werden nicht automatisch geändert. Eine Änderung an einem freigegebenen Feature erzeugt eine neue Arbeitsversion. Der bestehende freigegebene Stand bleibt erhalten.

**Versionierung** (Beispiel): v0.1 – erster Entwurf, v0.2 – Verbesserungen, v0.3 – Prüfversion, v1.0 – freigegeben. Die Versionsnummern können technisch anders gestaltet werden, wenn es sinnvoller ist. Wichtig ist die nachvollziehbare Historie.

---

## 11. FLEXIBILITÄT OHNE CHAOS

Wir müssen jederzeit: neues Feature hinzufügen, Feature aufteilen, Feature zusammenführen, neue Variante entwickeln, neue Viewports hinzufügen, neue Interaktionen ergänzen, bestehende Designs überarbeiten, Komponenten verbessern, Module umstrukturieren. Aber Flexibilität darf nicht bedeuten, dass ständig alles neu aufgebaut wird.

**Regeln:**
1. Features sind eigenständige Einheiten.
2. Gemeinsame Komponenten werden zentral verwaltet.
3. Freigegebene Features bleiben stabil.
4. Änderungen erzeugen neue Versionen.
5. Module behalten ihre eigene Informationsarchitektur.
6. Gemeinsame Designregeln gelten global.
7. Jede Änderung wird nachvollziehbar.
8. Tests werden gezielt auf betroffene Bereiche beschränkt.
9. Regressionen werden bei gemeinsamen Komponenten geprüft.
10. Keine unkontrollierte globale Neugestaltung.

---

## 12. AUTOMATISIERTE QUALITY ASSURANCE

Die Workbench soll eine eigene QA-Struktur besitzen. Ich möchte nicht jede Kleinigkeit auf meinem echten Smartphone überprüfen müssen. Entwickle deshalb ein möglichst automatisiertes Prüfkonzept.

**Viewport-Prüfungen (mindestens):** 1440 px Desktop, 1280 px Notebook, 1024 px, 768 px, 390 px Smartphone. Optional weitere Viewports, sofern sie einen echten Mehrwert bieten.

**Interaktionstests – prüfe:** Navigation, Tabs, Dialoge, Formulare, Filter, Suche, Theme-Wechsel, responsive Navigation, Featurewechsel, Variantenwechsel, Speichern, Bearbeiten, Löschen, Zurücknavigation.

**Visual Regression** (soweit technisch sinnvoll): Screenshot-Erstellung, Referenzscreenshots, Vergleich mit freigegebenen Versionen, Erkennung auffälliger Layoutabweichungen, Prüfung abgeschnittener Inhalte, Prüfung horizontaler Überläufe, Prüfung fehlender Elemente.

**Selektive Tests:** Wenn eine einzelne Komponente verändert wird, teste primär: diese Komponente, die betroffenen Features, die relevanten Viewports. Wenn eine globale Komponente geändert wird: teste die Module, die diese Komponente verwenden. Nicht bei jeder Änderung automatisch die gesamte Anwendung neu testen, wenn dies nicht notwendig ist.

**Echte Geräte:** Ein echtes Smartphone soll weiterhin bei definierten Qualitätsmeilensteinen geprüft werden: erste Freigabe eines Moduls, große Änderungen am Responsive-System, Freigabe des Gesamtmoduls, finaler Gesamtcheck. Routineänderungen sollen primär in automatisierter Vorschau geprüft werden.

---

## 13. PERSISTENZ

Die Workbench darf nach Schließen und erneutem Öffnen nicht ihren Zustand verlieren. Speichere mindestens: Module, Features, Status, Designvarianten, ausgewählte Varianten, Designentscheidungen, Versionen, Historie, Theme-Einstellungen, Preview-Einstellungen, QA-Status, Viewport-Einstellungen. Verwende eine geeignete lokale Persistenz. Der aktuelle Zustand soll zuverlässig wiederhergestellt werden.

**Backup und Export** (möglichst): Export der Workbench-Daten, Backup, Import, Wiederherstellung, Projektübertragung. Der Benutzer darf nicht an die einzige lokale Datei gebunden sein.

---

## 14. ARCHITEKTUR

Entwickle die Workbench möglichst modular. Getrennte Bereiche: Application Shell, Navigation, Module Manager, Feature Manager, Design Studio, Preview Engine, Theme Engine, Component Library, Version Manager, Decision Log, QA Engine, Persistence, Import/Export.

Die Architektur darf nicht überkompliziert werden. Bevor du eine Technologie einsetzt, prüfe: Ist sie wirklich notwendig? Macht sie die Anwendung schwerer? Ist sie langfristig wartbar? Ist sie lokal zuverlässig? Kann sie ohne Backend funktionieren? Kann sie später erweitert werden?

Bevorzuge ein lokal ausführbares System. Wenn eine Desktop-Anwendung sinnvoller ist, darfst du eine entsprechende Architektur vorschlagen. Für die erste Version soll jedoch möglichst schnell eine zuverlässig ausführbare Vorschau entstehen. Wähle Technologien nach Wartbarkeit, Zuverlässigkeit und tatsächlichem Nutzen – nicht nach Trend.

---

## 15. UMSETZUNGSPLAN

- **PHASE 1 – Recherche und Bestand:** Projekt identifizieren, Modulregister auslesen, vorhandene Dokumentationen untersuchen, vorhandene HTML-Prototypen untersuchen, Anforderungen aus bisherigen Designkonzepten zusammentragen, Fitness und Finanzen als Referenzbereiche berücksichtigen, Architekturvorschläge der Agents zusammenführen. Ergebnis: belastbare Grundlage.
- **PHASE 2 – Architektur:** Workbench-Struktur, Datenmodell, Navigation, Module, Features, Feature-Workspace, Designvarianten, Versionierung, Freigabesystem, Persistenz, QA. Architektur kritisch prüfen, unnötige Komplexität vereinfachen. Ergebnis: technische Grundlage.
- **PHASE 3 – Designkonzept:** zuerst das Design der Workbench selbst: Dashboard, Navigation, Modulübersicht, Feature-Browser, Feature-Workspace, Design Studio, Variantenvergleich, Component Library, Version Center, Quality Center. Die Workbench muss selbst ein hochwertiges Design besitzen. Ergebnis: konsistentes, vollständiges Grunddesign.
- **PHASE 4 – Implementierung**, Priorität: 1. funktionierende Anwendungsshell, 2. Navigation, 3. Module, 4. Features, 5. Feature-Workspace, 6. Preview, 7. Designvarianten, 8. Themes, 9. Component Library, 10. Versionierung, 11. Freigaben, 12. Persistenz, 13. QA, 14. Import und Export. Nicht alles gleichzeitig bauen. Schrittweise entwickeln und testen.
- **PHASE 5 – Demo-Daten und erste Module:** mindestens Kalender, Aufgaben, Notizen, Wetter, Knowledge Base, Sales Channels, Picture to Text, weitere tatsächlich existierende Module. Fitness und Finanzen als Referenzbereiche ohne erneutes Vollaudit. Die Demo soll zeigen, wie ein Modul von der Bestandsaufnahme bis zur Freigabe durchläuft.
- **PHASE 6 – Designvarianten:** Variantenvergleich implementieren, für geeignete Features echte unterschiedliche Layoutvarianten (funktional und strukturell; z. B. Kompakt, Visuell, Produktivitätsorientiert). Demonstrieren, wie eine Variante ausgewählt und als Arbeitsstand gespeichert wird.
- **PHASE 7 – Quality Assurance:** Navigation, Module, Features, Interaktionen, Persistenz, Themes, Varianten, Viewports, Mobile, Dialoge, Formulare, Fehlerzustände prüfen. Fehler beheben. Gezielte Regressionstests.
- **PHASE 8 – Abschlussprüfung:** Gesamtsystem prüfen, keine rein oberflächliche Sichtprüfung, Anwendung tatsächlich öffnen und bedienen, Einschränkungen dokumentieren.
- **PHASE 9 – Dokumentation:** vollständiger Abschlussbericht.

---

## 16. QUALITÄTSANFORDERUNGEN

Die Workbench soll kein Minimalprodukt werden. Priorität ist Qualität. Vermeide: schnell zusammengeschusterte Dashboard-Karten, Dummy-Buttons ohne Funktion, unvollständige Feature-Ansichten, nur eine hübsche Startseite, generische Admin-Layouts, unnötig komplizierte Architektur, mehrfach implementierte Komponenten, Verlust von Zuständen, unzuverlässige Persistenz, nicht dokumentierte Entscheidungen, Designvarianten, die sich nur in Farben unterscheiden, übertriebene Animationen, endlose Scrollseiten, unnötige Textwände. Das System muss logisch aufgebaut, nachvollziehbar und erweiterbar sein.

---

## 17. WAS DU DIE NACHT ÜBER TATSÄCHLICH TUN SOLLST

Verwende die verfügbare Arbeitszeit sinnvoll. Wenn ein Arbeitsschritt abgeschlossen ist, fahre mit dem nächsten fort. Grundstruktur → Feature-Verwaltung → Design Studio → Preview Engine → Varianten → Versionierung, Freigaben, QA und Persistenz. Wenn die Kernarchitektur bereits früher vollständig funktioniert, investiere die verbleibende Zeit in: Verbesserung der UX, Erweiterung der Beispielmodule, zusätzliche Designvarianten, bessere responsive Darstellung, bessere Interaktionen, Fehlerbehebung, Qualitätssicherung, Dokumentation, Architekturprüfung. Vermeide künstliche Arbeit. Wenn ein Bereich bereits hochwertig und vollständig ist, muss er nicht erneut gebaut werden. Arbeite nach tatsächlichem Qualitätsbedarf.

---

## 18. ERWARTETE DATEIEN

Neuer, eindeutig benannter Arbeitsordner, z. B. "TAKT_DESIGN_WORKBENCH/".

- **A. Workbench:** eine tatsächlich ausführbare, interaktive Anwendung.
- **B. README.md:** Was ist die Workbench? Wie wird sie gestartet und verwendet? Wie werden Module/Features hinzugefügt, Varianten erstellt, Designs freigegeben? Wie funktioniert die QA?
- **C. ARCHITECTURE.md:** Architektur, Datenmodelle, Komponenten, Persistenz, Preview, Themes, Versionierung, QA.
- **D. Designsystem:** Dokumentation und zentrale Implementierung des Designsystems.
- **E. QA_REPORT.md:** Testumfang, Ergebnisse, Fehler, Viewports, Regression, offene Probleme.
- **F. WORK_LOG.md:** chronologisch: Phasen, Entscheidungen, Fortschritte, Probleme, Änderungen, Testläufe.
- **G. Feature- und Modulbeispiele:** nachvollziehbare Beispielmodule und Features.
- **H. Export und Backup:** soweit implementiert, Dokumentation und Beispiele.

---

## 19. ABSCHLUSSMELDUNG

Klare und ehrliche Zusammenfassung: Was wurde tatsächlich erstellt (Workbench, Navigation, Module, Features, Design Studio, Preview, Varianten, Themes, Versionierung, Freigabesystem, QA, Persistenz, Export)? Was funktioniert tatsächlich (nur getestete Funktionen)? Was wurde getestet (Tests, Viewports, Interaktionen, Ergebnisse)? Was ist noch offen? Wie starte ich die Anwendung (exakte Startschritte)? Wo liegen die Dateien (vollständige Pfade)? Was ist der nächste sinnvolle Entwicklungsschritt (nur die nächsten konkreten Schritte)?

---

## 20. ABSCHLIESSENDE LEITLINIE

Du entwickelst hier die Grundlage für eine langfristige Zusammenarbeit an TAKT V2.0. Wir wollen in Zukunft: ein Modul auswählen, das Modul verstehen, ein Feature auswählen, Anforderungen definieren, Designs entwickeln, Varianten vergleichen, eine Variante freigeben, das nächste Feature bearbeiten. Ohne jedes Mal das gesamte Modul neu zu erstellen. Ohne ständig neue Wegwerfprototypen. Ohne unkontrollierte Designrunden. Ohne unnötige Tests auf echten Geräten. Mit hoher Qualität. Mit nachvollziehbaren Entscheidungen. Mit einer zentralen Designbibliothek. Mit einer dauerhaften Historie. Mit maximaler Flexibilität.

Das Ziel ist eine funktionierende TAKT Design Workbench, die wir ab diesem Zeitpunkt als unseren dauerhaften Arbeitsplatz für die modulweise Entwicklung von TAKT V2.0 verwenden können.

---

### Zusatz zur Übergabe (Nachricht vom 24.11.2026)

> „Arbeite schonmal alles soweit aus, dass ich es später zuhause in mein Claude Code übernehmen kann, [sodass] automatisch er sich alles holt an Kontext und Aufgaben und co."

→ Umgesetzt über `CLAUDE.md` (automatisch geladen), `HANDOFF.md`, `TASKS.md`, `.claude/commands/` und `.claude/agents/`.
