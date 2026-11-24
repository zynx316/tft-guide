# Gerätetest (echtes Android-Handy)

> **Stand:** 24.11.2026 · **Referenztag der Demo:** Di, 24.11.2026, 09:30 Uhr
> **Gültigkeit:** gilt für jeden Test der Demo-Launcher-Versionen und einzelner Features auf einem **echten Smartphone**. Die Workbench-QA (Playwright, Chromium) prüft Layout, Kontrast und Abläufe, aber **nicht** Daumenzone, Tastatur, Hintergrund-Timer, Scroll-Gefühl und Safe-Area auf echter Hardware. Genau das deckt dieses Verfahren ab. Das Verfahren ist eine **Arbeitsannahme** und wird nach dem ersten Protokoll überarbeitet.
> **Zugehörige Dateien:** `package.json` (`npm run lan`) · `server.mjs` (`/api/network`, `/api/feedback`) · `app/launcher.html`, `app/src/launcher/launcher.js` (QR-Dialog „Aufs Handy“) · `app/src/workbench/views/ws-tabs.js` (Karte „Gerätetest“, `deviceCheckDialog`) · `app/src/workbench/store.js` (`actions.setRealDevice`) · `app/src/core/process.js` (Freigabe-Checkliste, Modul-Gate) · `docs/ADR-001-demo-launcher.md` (Secure Context, `adb reverse`) · `docs/PERSONA.md` (Nutzungskontexte) · `docs/BAUPLAN.md` (8, 10, 13).

## 1. Wann ist der Gerätetest Pflicht?

| Anlass | Pflicht | Grundlage (Ist) |
|---|---|---|
| **Tier-1-Feature** vor der Freigabe | **ja** | Freigabe-Checkliste: „Gerätetest (Pflicht bei Tier 1)“, bei Mängeln oder fehlendem Test ist der Punkt nicht erfüllt (`featureDone` in `core/process.js`) |
| **Erste Freigabe eines Moduls** (Meilenstein) | **ja**, mindestens ein Feature des Moduls | Modul-Gate „Gerätetest-Meilenstein (erste Freigabe)“ (`moduleDone`) |
| **Große Responsive- oder Layoutänderung** (Runtime, Shell, Tokens, Safe-Area) | ja, Stichprobe der Tier-1-Features | Hinweis in der Karte „Gerätetest“ |
| **Modulfreigabe** und **finaler Gesamtcheck** (Basis v1) | ja | Abnahme in Bauplan 1 und 11: „Gerätetest-Protokoll existiert“ |
| **Tier 2** | empfohlen (Stichprobe), keine Sperre | |
| **Tier 3, Skizzen** | nein | |

Nach einem **Mangel** wird nur der betroffene Punkt wiederholt, nicht die ganze Liste. Ein neues Protokoll verweist auf das vorherige.

## 2. Vorbereitung

### 2.1 Verbindung (Weg wählen)

| Weg | Befehle und Schritte | Wann |
|---|---|---|
| **A. LAN mit QR-Code** (Standard) | 1. Am PC `npm run lan` starten. 2. PC und Handy im **selben WLAN**, Windows-Firewall „Privates Netzwerk“ erlauben, VPN und Gastnetz aus. 3. Im Launcher auf dem Laptop **„Aufs Handy“** öffnen, QR-Code scannen (zeigt `http://<PC-IP>:4317/launcher.html`). 4. Zeigt der Dialog „Der Server ist nur auf diesem Rechner erreichbar“, wurde nicht mit `npm run lan` gestartet. | Aussehen, Bedienung, Daumenzone, Tastatur, Scrollen |
| **B. `adb reverse`** | 1. USB-Debugging am Handy einschalten, per USB verbinden. 2. `adb devices` (Gerät sichtbar). 3. `adb reverse tcp:4317 tcp:4317`. 4. Am PC `npm start` (oder `npm run serve`). 5. Am Handy `http://localhost:4317/launcher.html` öffnen. Danach `adb reverse --remove tcp:4317`. | wenn **Secure Context** nötig ist (Service Worker, Installation, Offline). Achtung: Das Handy gilt hier als **lokal** und kann Entscheidungen direkt schreiben (`ADR-001-demo-launcher.md` Abschnitt 5.3). |

Direktlinks für einzelne Features (LAN): `http://<PC-IP>:4317/preview.html?feature=<id>&variant=<v>&theme=<t>`; ganze App einer Richtung: `preview.html?app=1&version=dir:fokus`. Der QR-Dialog liefert den Startlink.

Der LAN-Modus öffnet den PC im WLAN. **Nur in einem vertrauenswürdigen Netz**, danach den Server beenden (Strg+C). Es gibt im Ist-Stand **keine PIN**; Schreiben auf die Workbench ist im LAN gesperrt, nur Feedback wird angenommen. Die Daten sind fiktiv.

### 2.2 Gerät vorbereiten

- Akku über 50 %, Bildschirm-Timeout auf 10 Minuten, automatische Drehung **an**, Schriftgröße **Standard** (Test „Schrift 200 %“ später gesondert), Helligkeit mittel.
- Navigation merken: Gesten oder Drei-Tasten-Leiste (beeinflusst Safe-Area und Zurück).
- Browser: Chrome (aktuelle Version notieren). Keine Erweiterungen, kein Datensparmodus.
- **Stand notieren** (Launcher-Kopf oder Workbench): Revision, Seed-Version, Version bzw. Richtung, Szenario, Theme. Ohne Stand ist ein Protokoll nicht reproduzierbar.
- Ausgangszustand: Seite neu laden, Szenario „Alltag“, Theme „Graphite“, Privatmodus aus. Die Demo-Welt setzt sich beim Neuladen zurück (`DATENWELT.md` Abschnitt 5.1).
- Testperson: der Nutzer selbst, mit der gewohnten Hand und Haltung. Zweite Person nur zum Notieren.

## 3. Checkliste

**Pflichtumfang für Tier 1: G1 bis G9.** G10 bis G16 sind „sollte“ und für Meilensteine Pflicht. Ergebnis je Punkt: ✓ (ok), ✗ (Mangel), – (nicht anwendbar, mit Grund).

| Nr. | Punkt | Wie prüfen | Erwartung |
|---|---|---|---|
| **G1** | **Daumenzone** | Hauptabläufe mit **einer Hand** im Stehen und im Gehen. Primäraktion, Navigation, „Hinzufügen“, „Speichern“ im unteren Drittel. | Alle häufigen Aktionen mit dem Daumen erreichbar, Touch-Ziele mindestens 44 × 44 dp, kein Fehltipp auf Nachbarziele |
| **G2** | **Tastatur verdeckt nichts** | Jedes Eingabefeld und jeden Sheet-Dialog mit offener Tastatur (Hochformat). Zahlenfelder: Dezimaltastatur, Komma eingeben (z. B. „62,5“). | Feld und Aktionsleiste („Hinzufügen“, „Speichern“) bleiben sichtbar, Fokus scrollt ins Bild, kein Layoutsprung beim Schließen |
| **G3** | **Scrollen** | Lange Liste, Liste im Sheet, Tabelle, Seite mit fester Kopfzeile und fester Navigation. | Kein Ruckeln, kein „Hängen“ am Rand, feste Leisten bleiben, Scroll-Position bleibt beim Zurück, kein ungewolltes Neuladen durch Herunterziehen |
| **G4** | **Zurück und Predictive Back** | Android-Zurück (Geste und Taste) in Sheet, Dialog, Detail, Modulwechsel, Start. Rand-Wischgeste. | Zuerst Sheet oder Dialog schließen, dann eine Ebene zurück, am Start nicht unerwartet die Demo verlassen. **Predictive-Back-Animation** ist im Web nicht darstellbar: nur notieren |
| **G5** | **Timer im Hintergrund** | Rest-Timer (`fitness.session`) und Fokus-Timer starten, App 60 Sekunden verlassen oder Bildschirm sperren, zurückkehren. | Zeit stimmt, Timer läuft weiter oder ist korrekt nachgerechnet. Alarm und Vibration im Hintergrund sind im Web **nicht verlässlich**: als Befund für Flutter notieren |
| **G6** | **Safe-Area, Notch, Gestenleiste** | Hochformat und Querformat, Kamera-Ausschnitt, Gestenleiste unten. | Kopfzeile nicht unter dem Kamera-Ausschnitt, untere Navigation oberhalb der Gestenleiste, Inhalt im Querformat nicht hinter der Kamera |
| **G7** | **Schrift 200 %** | Systemschrift auf „Größte“ stellen und in der Demo Schrift 200 % (`scale=2`). Stichproben: Start, Liste, Formular, Sheet, Tabelle. | Nichts abgeschnitten, kein horizontales Scrollen, Buttons erreichbar, Zahlen und Beträge ohne Überlauf, 9.999.999,99 € passt |
| **G8** | **Dunkel und Hell** | Themes Graphite, Horizon (hell), Intensiv; Systemmodus dunkel/hell; draußen bei Tageslicht oder maximaler Helligkeit. | Kontrast und Lesbarkeit ausreichend, keine hellen Blitze beim Laden, Diagramme und Hinweise lesbar, Farbe nie das einzige Merkmal |
| **G9** | **Einhand-Hauptablauf in drei Taps** | Je Feature den **Kern-Ablauf** durchführen (Beispiele: Mahlzeit erfassen, Buchung erfassen, Satz loggen, Aufgabe abhaken) und Taps zählen. | Ziel laut Anforderung (z. B. höchstens 3 Taps), ohne Zweithand, ohne Zoomen |
| **G10** | **Querformat** | Drehen auf jedem Hauptscreen, mit offener Tastatur. | Layout wechselt sinnvoll, kein Datenverlust, Bedienung bleibt möglich |
| **G11** | **Offline und Zustände** | Flugmodus (Weg B zusätzlich: nach dem ersten Laden). Szenarien „Erster Start“ und „Stress-Tag“. | Banner „Offline, Stand …“, Erfassen möglich, Leer- und Stresszustand brauchbar. **Im LAN-Weg ohne Secure Context funktioniert Offline nicht:** als erwartet notieren |
| **G12** | **Privatmodus** | Beträge ausblenden, durch Finanz-Screens gehen, Mitteilungen ansehen. | Keine Beträge sichtbar, Maske gleich breit, kein Layoutsprung (`FINANCE_GUIDELINES.md` Abschnitt 7) |
| **G13** | **Leistung** | Start, Modulwechsel, Liste mit vielen Einträgen (Stress-Tag). | Start unter 3 Sekunden gefühlt, Interaktionen ohne Verzögerung, kein Ruckeln beim Scrollen |
| **G14** | **Sheets, Dialoge, Toasts** | Öffnen, Schließen, Rückgängig-Toast, Mehrfachtipp. | Erreichbar im Daumenbereich, verdecken keine Tastatur, Toast nicht unter der Gestenleiste |
| **G15** | **Texte und Hinweise** | Pflichthinweise (`legal-notice`), Fehler-, Leer-, Warntexte lesen. | Vorhanden, lesbar, ohne Druck, Du-Form (`TEXT_STIL.md`) |
| **G16** | **Unterschied zu Flutter** | Scroll-Physik, Ripple, Haptik, Schrift, Tastaturverhalten bewusst beobachten. | Nur **notieren**, nicht als Mangel werten (`ADR-001-demo-launcher.md` Abschnitt 6) |

## 4. Protokollformat

Das Protokoll ist eine Markdown-Datei. Ablage (Ziel): `docs/geraetetests/GT-<JJJJ-MM-TT>-<gerät>.md`, der Ordner entsteht mit dem ersten Protokoll. Ein Protokoll kann mehrere Features abdecken. Vorlage zum Kopieren:

```markdown
# Gerätetest GT-2026-11-27-pixel8

- **Datum, Uhrzeit:** 27.11.2026, 18:10 bis 19:05
- **Tester:** Jonas (Annahme)
- **Gerät:** Pixel 8, Android 15 (Annahme), Display 412 × 915 dp, Dichte ...
- **Browser:** Chrome 131 (Version notieren)
- **System:** Schrift Standard, Dunkelmodus an/aus, Navigation Gesten / Drei Tasten
- **Verbindung:** LAN (QR) / adb reverse
- **Stand der Workbench:** Revision 1234, Seed 2026-11-24.3, Build ...
- **Version/Richtung:** Fokus (`dir:fokus`) · **Szenario:** Alltag · **Theme:** Graphite
- **Geprüft:** nutrition.log (Variante B, Tier 1), nutrition.today (Variante A, Tier 1)
- **Vorgängerprotokoll:** keines

## Ergebnis je Punkt

| Nr. | Punkt | Ergebnis | Notiz, Beleg |
|---|---|---|---|
| G1 | Daumenzone | ✓ | |
| G2 | Tastatur verdeckt nichts | ✗ | siehe M1 |
| G3 | Scrollen | ✓ | |
| G4 | Zurück | ✓ | Predictive Back nicht darstellbar |
| G5 | Timer im Hintergrund | – | nicht Teil dieser Features |
| ... | | | |

## Mängel

| Nr. | Schwere | Feature | Schritte | Erwartet | Beobachtet | Beleg |
|---|---|---|---|---|---|---|
| M1 | muss | nutrition.log | Suche öffnen, „Skyr“ tippen, Portion wählen | Leiste „Hinzufügen“ sichtbar | Leiste unter der Tastatur | Foto 1 |

## Annahmen geprüft

| Annahme | bestätigt/widerlegt |
|---|---|
| Einhand-Erfassen in drei Taps möglich | bestätigt |

## Gesamtergebnis

bestanden / bestanden mit Mängeln / nicht bestanden · Wiederholung nötig für: G2 nach Behebung von M1
```

Schwere der Mängel: **muss** (blockiert die Freigabe), **soll** (vor Abschluss des Moduls), **kann** (Wunsch). „muss“-Mängel werden als Anmerkung (Pin) mit Schwere „muss“ am Feature erfasst und sperren die Freigabe über „Keine offenen Muss-Anmerkungen“.

**Kurzprotokoll-Zeile** (für das Notizfeld der Workbench, eine Zeile):

`GT-2026-11-27-pixel8 · 15 von 16 ok · Mängel: M1 Tastatur verdeckt „Hinzufügen“ (nutrition.log) · Protokoll: docs/geraetetests/GT-2026-11-27-pixel8.md`

## 5. Dokumentation in der Workbench

Pfad im Ist-Stand: **Feature öffnen › Reiter „Übersicht“ › Karte „Gerätetest (echtes Smartphone)“ › Schaltfläche „Gerätetest dokumentieren“**. Dieselbe Schaltfläche steht im Reiter „Qualität“ (Karte „Gerätetest“) und öffnet denselben Dialog.

| Feld im Dialog | Eintrag |
|---|---|
| **Gerät / Browser** | z. B. „Pixel 8, Chrome 131“ |
| **Ergebnis** | „Bestanden“ oder „Mängel gefunden“ |
| **Beobachtungen** | die **Kurzprotokoll-Zeile** (Abschnitt 4) |

Speichern ruft `actions.setRealDevice(featureId, { ok, note })` und legt am Feature `realDevice { ok, note, at }` ab. Wirkungen:

1. **Tier-1-Feature:** Der Gate-Punkt „Gerätetest (Pflicht bei Tier 1)“ wird erfüllt (nur bei „Bestanden“), bei „Mängel gefunden“ bleibt er offen und zeigt „Mängel“.
2. **Modul:** Das Modul-Gate „Gerätetest-Meilenstein (erste Freigabe)“ wird erfüllt, sobald ein Feature des Moduls bestanden ist.
3. **Wiedervorlage:** Entscheidungen mit der Bedingung „nach Gerätetest“ werden fällig, sobald das Feature einen Gerätetest hat.
4. **Spezifikation:** Der Export nennt „Gerätetest: bestanden/Mängel – Notiz“.

Je getestetem Feature **ein** Eintrag (derselbe Verweis auf das Protokoll). Nach der Behebung von Mängeln erneut dokumentieren (der letzte Eintrag gilt). **Ziel** (Bauplan 8): ein eigener Reiter „Gerätetest“ je Feature mit der Checkliste G1 bis G16 und Ergebnis je Punkt; bis dahin gilt das Verfahren oben.

## 6. Grenzen der Aussage

- Ein bestandener Test gilt für **dieses Gerät, diesen Browser, diesen Stand**. Andere Geräte (kleine Displays 360 × 780, Tablets, Foldables) und **iOS** sind damit nicht geprüft.
- Das Web-Verhalten ist **nicht** das Flutter-Verhalten (Scroll-Physik, Ripple, Haptik, Schrift, Tastatur). Die Demo entscheidet über Layout, Hierarchie und Navigation. Aussagen zu Timern im Hintergrund, Kamera und Health Connect bleiben Annahmen bis zum Test in Flutter (Bauplan 13).
- Der Test ersetzt nicht die automatische QA (`npm run verify`), er ergänzt sie.
