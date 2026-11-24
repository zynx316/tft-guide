# Text-Stil (Anrede, Ton, Mikrotexte, Glossar)

> **Stand:** 24.11.2026 · **Referenztag der Demo:** Di, 24.11.2026, 09:30 Uhr
> **Gültigkeit:** gilt für jeden sichtbaren Text der App in Komponenten, Seed-Manifesten, Welt-Dateien und Hinweisen (`legal-notice`). Nicht für Texte der Workbench-Oberfläche selbst, dort gilt dieselbe Sprachregel, aber ohne Glossarzwang. **Die Anrede „du“ ist eine Arbeitsannahme**: Die Pflichtfrage `pattern-tone` („Anrede und Tonalität“) hat die Empfehlung „du, freundlich, knapp, ohne Ausrufezeichen“, ihr Status ist **offen**. Wird sie anders entschieden, ändern sich Abschnitt 1 und die Beispiele, die Regeln für Ton, Mikrotexte und Glossar bleiben.
> **Zugehörige Dateien:** `app/src/seed/catalog.js` (Pflichtfragen `tone`, `empty`, `delete`, `formats`) · `app/src/lib/format.js` und `app/src/lib/date.js` (Zahlen, Datum, Zeit) · `app/src/library/CONTRACT.md` · `docs/HEALTH_GUIDELINES.md` (Verbotsbegriffe) · `docs/FINANCE_GUIDELINES.md` (Hinweise, Maske) · `docs/DATENWELT.md` · `CLAUDE.md` (Regel 6: echte Umlaute).

## 1. Anrede

- **Du**, kleingeschrieben („dein Konto“, „deine Termine“). Gilt für Buttons, Hinweise, Fehler, Onboarding, Benachrichtigungen.
- **Keine Anrede in Beschriftungen:** Menü, Tabs, Spaltenköpfe, Buttons, Felder bleiben neutral („Termine“, „Speichern“, „Betrag“). Die Anrede steckt nur in Sätzen.
- **Kein „man“, kein „wir“, kein „der Nutzer“.** TAKT spricht in der ersten Person nur, wo eine Funktion handelt („TAKT setzt es auf 1.790 kcal“).
- **Geschlecht:** Sätze so bauen, dass keine Formen nötig sind („Sprich mit deiner Praxis“, „Ärztin oder Arzt“, wenn die Person gemeint ist).
- **Finanzen und Gesundheit:** sachlich, ohne Druck. „Du“ bleibt, aber ohne Aufforderung zu handeln, die wie ein Rat wirkt: „Prüfe die Annahmen“ ist erlaubt, „Du solltest jetzt verkaufen“ nie (`FINANCE_GUIDELINES.md` Abschnitt 10).

## 2. Ton

| Regel | Beispiel gut | Beispiel schlecht |
|---|---|---|
| **Ruhig:** keine Ausrufezeichen. | „Aufgabe erledigt.“ | „Super gemacht!“ |
| **Knapp:** ein Gedanke pro Satz, ein Satz pro Zeile, wo möglich. | „Speichern hat nicht geklappt. Versuche es erneut.“ | „Leider ist beim Speichern ein unerwarteter Fehler aufgetreten, bitte versuche es zu einem späteren Zeitpunkt noch einmal.“ |
| **Sachlich:** keine Füllwörter („bitte“ nur, wenn es Mühe macht), keine Verniedlichung. | „Zugriff auf die Kamera nötig.“ | „Ups! Wir bräuchten kurz deine Kamera :)“ |
| **Ohne Wertung:** nie Lob, Rüge oder Moral bei Zahlen (Gesundheit: `HEALTH_GUIDELINES.md` Abschnitt 3). | „Heute etwas über dem Ziel. Der Wochenschnitt zählt.“ | „Zu viel gegessen.“ |
| **Ohne Emoji, ohne Smileys, ohne Großbuchstaben-Betonung.** | „Wichtig: Hinweis zur Steuer“ | „ACHTUNG!!! (mit Emoji)“ |
| **Aktiv, Gegenwart.** | „Die Sparrate wird am 01.12. gebucht.“ | „Es wird eine Buchung vorgenommen werden.“ |
| **Konkret:** Zahl, Datum, Name statt Allgemeinheit. | „Am 01.12. fehlen 120,00 € auf dem Girokonto.“ | „Dein Konto ist nicht ausreichend gedeckt.“ |

Wortlänge und Zeilen: Titel höchstens 40 Zeichen, Button höchstens 2 Wörter (3 mit Objekt), Hinweis kurz höchstens 90 Zeichen, Fehlertext höchstens 2 Sätze.

## 3. Mikrotexte

### 3.1 Buttons

- **Verb im Infinitiv**, kein „Jetzt“, keine Frage (Ausnahmen als feste Wendung: „Rückgängig“, „Verstanden“, „Später“): „Speichern“, „Hinzufügen“, „Erfassen“, „Abbrechen“, „Löschen“, „Rückgängig“, „Später“, „Verstanden“, „Weiter“, „Zurück“.
- Mehrdeutige Aktionen bekommen das Objekt: „Mahlzeit speichern“, „Termin hinzufügen“, „Order simulieren“ (nie „Kaufen“).
- **Primär** = die eine Hauptaktion. Zerstörende Aktion nie primär.
- **Kein „OK“, kein „Ja/Nein“.** Antworten benennen die Wirkung („Löschen“ / „Behalten“).

### 3.2 Bestätigungen

- Kurz, im Perfekt oder als Zustand, mit **Rückgängig**, wenn möglich: „Termin gelöscht. Rückgängig“.
- **Kein Bestätigungsdialog vor dem Löschen**, sondern sofort löschen, „Rückgängig“ und Papierkorb (Empfehlung der Pflichtfrage `pattern-delete`, offen). Dialog nur bei Unumkehrbarem („Konto löschen“, „Gesundheitsdaten löschen“) und dann mit klarer Folge: „Alle Gewichtsdaten werden endgültig gelöscht. Das lässt sich nicht rückgängig machen.“
- Erfolg ohne Lob: „Gespeichert.“, „Aufgabe erledigt.“, „Sparplan pausiert bis 15.01.2027.“

### 3.3 Fehler: Was ist passiert, was jetzt?

Muster: **Ursache in einem Satz + Ausweg**. Nie Fehlercodes, nie Schuld.

| Situation | Text |
|---|---|
| Netz fehlt | „Keine Verbindung. Deine Änderung ist gespeichert und wird später abgeglichen.“ |
| Speichern scheitert | „Speichern hat nicht geklappt. Prüfe den freien Speicher und versuche es erneut.“ |
| Berechtigung verweigert | „Ohne Kamera kannst du keinen Strichcode scannen. Gib die EAN manuell ein oder erlaube die Kamera in den Einstellungen.“ |
| Eingabe passt nicht | „Diese Angabe passt nicht (20 kg). Prüfe den Wert.“ |
| Konflikt | „Ein anderer Tab hat inzwischen gespeichert. Lade neu, dein Stand bleibt als Kopie erhalten.“ |
| Nichts gefunden | „Keine Treffer für „Quark“. Eigenes Lebensmittel anlegen?“ |
| Offline (Banner) | „Offline, Stand 09:15.“ |
| Veraltet (Badge) | „Stand 09:10“ |

Verboten: „Ups“, „Leider“, „Fehler 500“, „Etwas ist schiefgelaufen“, „Bitte kontaktieren Sie den Support“.

### 3.4 Platzhalter, Ladezustand, Fortschritt

- Laden: „Lädt …“ (Leerzeichen vor den drei Punkten) nur, wenn es über 300 ms dauert, sonst Platzhalter-Blöcke ohne Text.
- Eingabe-Hinweis (`placeholder`) ist ein Beispiel, kein Label: „z. B. morgen 14 Uhr Zahnarzt“.
- Pflichtfelder werden durch Wirkung erklärt („Ohne Betrag kannst du nicht speichern“), nicht durch Sterne.

## 4. Leerzustand-Muster

**Aufbau: Titel (was ist leer) + eine Zeile Erklärung + genau eine Aktion.** Optional ein Link „Mit Beispieldaten starten“. (Empfehlung der Pflichtfrage `pattern-empty`: „Erklärung + eine klare erste Aktion“.)

| Ort | Titel | Erklärung | Aktion |
|---|---|---|---|
| Aufgaben (leer) | Keine Aufgaben | Was du erledigen willst, sammelst du hier. | **Aufgabe hinzufügen** |
| Termine heute | Heute ist nichts geplant | Ein freier Tag. Trage etwas ein oder genieße ihn. | **Termin hinzufügen** |
| Buchungen | Noch keine Buchungen | Erfasse Ausgaben und Einnahmen, dann siehst du, was bis Monatsende frei ist. | **Buchung erfassen** |
| Mahlzeiten | Noch nichts erfasst | Suche ein Lebensmittel oder scanne einen Strichcode. | **Mahlzeit erfassen** |
| Sparpläne | Noch kein Sparplan | TAKT plant, erinnert und gleicht ab. Ausgeführt wird er bei deinem Broker. | **Sparplan anlegen** |
| Suche ohne Treffer | Keine Treffer für „Quark“ | Prüfe die Schreibweise oder suche in allen Modulen. | **In allen Modulen suchen** |
| Offline, nichts im Cache | Noch keine Daten offline | Sobald du wieder online bist, lädt TAKT die Daten. | – |

Regeln: keine Illustration als einziger Inhalt, keine Entschuldigung („Leider …“), keine Mehrfach-Aktionen, **keine Moral** („Du hast schon lange nicht trainiert“). Erststart-Szenario siehe `DATENWELT.md` Abschnitt 6.

## 5. Zahlen, Datum, Zeit

**Verbindliche Quelle:** `app/src/lib/format.js` (`fmtMoney`, `fmtPercent`, `fmtPP`, `fmtNumber`, `fmtWeight`, `fmtDuration`, `fmtDate`, `fmtTime`, `fmtRelativeDay`) und `app/src/lib/date.js`. **Nicht selbst formatieren**, `Intl` und `toLocale*` nur dort (Bauplan 5.8, Ziel für `check`). Weitere Details und Maske: `FINANCE_GUIDELINES.md` Abschnitt 7.

| Art | Form | Beispiel |
|---|---|---|
| Betrag | Tausenderpunkt, Dezimalkomma, geschütztes Leerzeichen vor `€`, Minus U+2212 | `1.234,56 €`, `−12,00 €` |
| Prozent | Komma, geschütztes Leerzeichen | `5,0 %` |
| Prozentpunkte | `PP`, nie `%` | `+1,2 PP` |
| Gewicht | eine Nachkommastelle | `82,4 kg` |
| Dauer | `Std.` und `Min.` | `1 Std. 25 Min.`, `45 Min.` |
| Datum (Liste, Kurz) | `TT.MM.` | `24.11.` |
| Datum (voll) | `TT.MM.JJJJ` | `24.11.2026` |
| Datum (mit Wochentag) | `Di, 24.11.` (Wochentage `Mo Di Mi Do Fr Sa So`, ohne Punkt) | `Mi, 25.11.` |
| Datum (ausgeschrieben) | `24. November 2026` | |
| Uhrzeit | 24 Stunden, `09:30`; im Satz mit „Uhr“ | `um 09:30 Uhr` |
| Zeitspanne | Halbgeviertstrich ohne Leerzeichen | `10:30–12:00`, `16.–22.11.` |
| Relativ | `heute`, `morgen`, `gestern`, `Do`, `in 5 Tagen`, `vor 3 Tagen` | `fmtRelativeDay` |
| Fehlender Wert | Halbgeviertstrich | `–` |

Weitere Regeln: Woche beginnt am Montag; Einheiten nie ohne Leerzeichen (`78,4 kg`, nicht `78,4kg`); `kcal` klein; keine „1,2k“-Kürzel außer „Tsd./Mio.“ mit vollem Wert im Tooltip; Beträge rechtsbündig mit `tabular-nums`.

## 6. Schreibweise

- **Echte Umlaute und ß** (ä ö ü ß, Ä Ö Ü) in allen Texten, Kommentaren und Dokumenten. `npm run check` meldet `ae`/`oe`/`ue`-Umschreibungen. Technische IDs und Dateinamen dürfen ASCII sein (`muenchen`, `wochenmarkt`).
- Deutsche Anführungszeichen „…“ und ‚…‘, Gedankenstrich „–“ mit Leerzeichen, Auslassung „…“ (ein Zeichen) nur in Ladetexten, kein „--“.
- Ein geschütztes Leerzeichen bei „z. B.“, „ca. 5“, Zahl und Einheit.
- Keine Abkürzungen im Fließtext, die nicht jeder kennt (außer Std., Min., kcal, kg, km, €, %, PP, EAN).
- Keine Versions- oder Modellnamen von KI-Modellen in Texten, Kommentaren oder Dateien.

## 7. Glossar (einheitliche Begriffe)

Ein Ding hat **einen** Namen in der ganzen App. Die rechte Spalte ist verboten.

| Verwende | Nicht verwenden | Bedeutung |
|---|---|---|
| **Aufgabe** | To-do, Task, Todo | etwas, das erledigt wird, mit oder ohne Datum |
| **Termin** | Event, Meeting, Eintrag (im Kalender) | etwas mit Datum und Uhrzeit im Kalender |
| **Erinnerung** | Alarm, Reminder | Mitteilung zu einem Zeitpunkt |
| **Notiz** | Memo, Note | freier Text |
| **Mitteilung** | Push, Benachrichtigung (Liste) | Eintrag in der Mitteilungszentrale (die Systemeinstellung heißt „Benachrichtigungen“) |
| **Eingang** | Inbox, Posteingang | ungeordnete, noch zu sortierende Dinge (Aufgaben, Erfassen) |
| **Erfassen** | Eingeben, Anlegen (für schnelle Einträge) | schnell etwas eintragen; „Anlegen“ nur für Dinge mit Namen (Sparplan, Konto, Liste) |
| **Buchung** | Transaktion, Umsatz | Geldbewegung auf einem Konto |
| **Umbuchung** | Transfer, Überweisung (zwischen eigenen Konten) | Verschiebung zwischen eigenen Konten, weder Einnahme noch Ausgabe |
| **Einnahme / Ausgabe** | Eingang / Ausgang | Buchungsart |
| **Budget** | Limit, Etat | Plan je Kategorie und Monat |
| **Sparplan** | Sparrate (für den Plan), Dauerauftrag (für Brokerpläne) | Plan, der regelmäßig spart; **Sparrate** nur für den Betrag |
| **Sparziel** | Wunschziel | Betrag und Termin, auf den gespart wird |
| **Depot** | Portfolio (Anzeige), Wertpapierkonto | Konto mit Wertpapieren |
| **Position** | Holding | ein Wertpapier im Depot |
| **Watchlist** | Beobachtungsliste, Favoriten (für Kurse) | beobachtete Wertpapiere |
| **Order** (simuliert) | Auftrag, Trade | Handelsanweisung im Ticket, immer „simuliert“ |
| **Kurs** | Preis (für Wertpapiere) | Marktpreis |
| **Abo** | Subscription, Abonnement | wiederkehrende Zahlung für einen Dienst |
| **Fixkosten** | Pflichtausgaben | regelmäßige Ausgaben |
| **Frei verfügbar** | Safe-to-spend, Spielraum | Betrag bis Monatsende nach Fixkosten und Sparraten |
| **Mahlzeit** | Gericht, Essen (Kategorie) | Frühstück, Mittag, Abend, Snack |
| **Eintrag** | Log | Zeile im Ernährungs- oder Trainingstagebuch |
| **Training** | Workout (außer als Feature-Name im Seed) | Oberbegriff; **Einheit** = eine Trainingseinheit |
| **Übung / Satz / Wiederholung (Wdh.)** | Exercise, Set, Rep | Bausteine einer Einheit |
| **Gewichtstrend** | Gewichtskurve | geglätteter Verlauf des Gewichts |
| **Serie** | Streak | aufeinanderfolgende Wochen (Training) oder Tage (Gewohnheiten) |
| **Pausenjoker** | Gnadentag, Freeze | ein Joker, der die Serie hält |
| **Gewohnheit** | Habit | regelmäßige Handlung, die abgehakt wird |
| **Ziel** | Goal | übergeordnetes Ziel mit Fortschritt |
| **Papierkorb** | Mülleimer | Aufbewahrung gelöschter Dinge (30 Tage) |
| **Rückgängig** | Undo, Wiederherstellen (für Löschen) | Aktion im Toast |
| **Modul** | Bereich, App-Teil (in der UI) | Teil der App (Kalender, Aufgaben …) |
| **Favoriten** | Tabs, Shortcuts | die ersten vier Module in der unteren Leiste |
| **Mehr** | Menü, Weitere | Eintrag für alle übrigen Module |
| **Heute** | Dashboard, Start (für den Tag) | die Startübersicht des Tages |
| **Sperre** | Lock, PIN-Schutz | App-Sperre |
| **Privatmodus** | Verstecken, Maskieren | Beträge ausblenden |
| **Offline** | Ohne Netz | Zustand ohne Verbindung |

Workbench-Begriffe (nicht in der App): Feature, Variante, Richtung, Version, Freigabe, Tier, Eingang (der Workbench), Ausbaustufe, Phase, Ebene. „Eingang“ in der Workbench heißt der Posteingang für Handy-Feedback und ist **nicht** der App-Eingang.

## 8. Beispiele gut und schlecht

| Kontext | Gut | Schlecht |
|---|---|---|
| Kalorien über Ziel | „Heute etwas über dem Ziel. Der Wochenschnitt zählt: Ø 2.310 kcal bei 2.400.“ | „Du hast heute gesündigt!“ |
| Serie unterbrochen | „Neustart: Deine 12 Wochen bleiben im Verlauf.“ | „Serie verloren.“ |
| Budget überschritten | „14,50 € über dem Budget Freizeit.“ | „ACHTUNG: Budget gesprengt!“ |
| Sparplan | „Dieser Sparplan wird nicht von TAKT ausgeführt. Du trägst ihn bei deinem Broker ein.“ | „Dein Sparplan läuft!“ |
| Order | „Simulierte Order gespeichert. Es wurde nichts ausgeführt.“ | „Kauf erfolgreich!“ |
| Prognose | „Bei 5 % Rendite pro Jahr wären es etwa 150.437 € (Annahme).“ | „Du wirst 150.437 € haben.“ |
| Löschen | „Aufgabe gelöscht. Rückgängig“ | „Möchtest du diese Aufgabe wirklich löschen?“ + „OK“ / „Abbrechen“ |
| Leerer Screen | „Keine Aufgaben. Was du erledigen willst, sammelst du hier. [Aufgabe hinzufügen]“ | „Hier ist noch nichts :(“ |
| Berechtigung | „Zugriff auf die Kamera nötig, um Strichcodes zu scannen. [Erlauben]“ | „Wir brauchen deine Kamera!“ |
| Wetter | „Ab 14 Uhr Sturmböen bis 72 km/h.“ | „Achtung Unwetter!!!“ |
| Termin | „Mittag mit Jana, 12:30–13:30, Café Moll“ | „Event: Mittag m. Jana (12:30h)“ |
| Zahl | „78,4 kg“, „1.234,56 €“, „−3,2 %“ | „78.4kg“, „1234.56 Euro“, „-3.2%“ |
| Fehler | „Keine Verbindung. Deine Änderung ist gespeichert.“ | „Fehler 503: Server nicht erreichbar.“ |
| Hinweis Gesundheit | „Richtwerte für gesunde Erwachsene, kein medizinischer Rat.“ | „Du bist zu schwer, bitte abnehmen.“ |

## 9. Prüfung

| Prüfpunkt | Wie |
|---|---|
| Echte Umlaute, keine `ae/oe/ue`-Umschreibung | `npm run check` (vorhanden) |
| Keine Ausrufezeichen in Nutzertexten | Ziel für `check` (String-Literale in `seed/**`, `library/components/**`); Ausnahme: Zitate in Anforderungen |
| Verbotsbegriffe | `HEALTH_GUIDELINES.md` Abschnitt 9, `FINANCE_GUIDELINES.md` Abschnitt 10 |
| Format nur über `lib/format.js` | Ziel für `check` (`Intl`, `toLocale*`) und Probe `money-format` |
| Glossar | Review; mögliche `check`-Regel für die rechte Spalte (z. B. „To-do“, „Task“, „Transaktion“) als Hinweis |
| Anrede „du“ durchgängig, keine „Sie“-Formen | Review und Hinweis-Regel für „Sie“, „Ihr“ in Nutzertexten (Ziel) |

## 10. Offene Punkte

- **Anrede** (du/Sie) und Tonalität: Entscheidung `pattern-tone` offen, Empfehlung „du“.
- **Löschen mit Rückgängig** statt Dialog: Entscheidung `pattern-delete` offen, Empfehlung „sofort löschen mit Rückgängig und Papierkorb“.
- **Leerzustände** `pattern-empty`: Empfehlung „Erklärung plus eine Aktion“, offen.
- **Zahlenformat** `pattern-formats`: Empfehlung de-DE, offen.
- **Mehrsprachigkeit** ist nicht geplant; alle Texte deutsch.

## Nachtrag: Versalien und „ß“
CSS-Großschreibung (`text-transform: uppercase`, z. B. `.tk-label`) macht aus „ß“ ein „SS“ („EIWEISS“). Für Beschriftungen mit
„ß“ die Klasse `tk-label--nocaps` bzw. `tk-nocaps` verwenden oder die Beschriftung in normaler Schreibung setzen.
Bei großer Schrift (≥ 125 %) brechen Buttons automatisch um; lange Beschriftungen trotzdem kurz halten (Verb + Objekt).
