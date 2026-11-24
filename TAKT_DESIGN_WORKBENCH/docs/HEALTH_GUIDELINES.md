# Gesundheits-Leitplanken (Fitness, Ernährung, Gewohnheiten)

> **Stand:** 24.11.2026 · **Referenztag der Demo:** Di, 24.11.2026, 09:30 Uhr (`DEFAULT_TODAY`)
> **Gültigkeit:** verbindlich für jede Variante, jede Komponente und jeden Seed-Text in `fitness.*`, `nutrition.*`, `habits.*`, in den Gesundheitsteilen von `home.*`, `goals.*`, `weather.health` und in allen Modulen mit `legal: ['gesundheit']`. Gilt, bis eine Entscheidung im Entscheidungslog sie ändert. Alle Zahlen und Texte sind **Annahmen**, bis sie vor einer Veröffentlichung fachlich geprüft wurden (siehe Abschnitt 11).
> **Zugehörige Dateien:** `app/src/library/components/crosscut/legal-notice.js` (Hinweis `gesundheit`) · `app/src/core/health.js` (Gesundheitsrechner: Grundumsatz, Kalorienziel mit Leitplanken, Epley, Trend, Serie mit Joker, EAN, Atwater) · `app/src/library/components/nutrition/_calc.js` (Rechner des Ernährungsmoduls, siehe Abschnitt 2.5) · `app/src/lib/format.js` (Zahlenformate) · `tests/health.test.mjs` · `app/src/seed/world/fitness.js`, `nutrition.js` · `app/src/seed/catalog.js` (Pflichtfrage `pattern-health-tone`) · `docs/TEXT_STIL.md` · `docs/FINANCE_GUIDELINES.md` (Gegenstück für Geld) · `docs/DATENWELT.md` · `docs/BAUPLAN.md` (5.8, 6, 10).
> **Ist und Ziel:** „Ist“ beschreibt, was der Code am Stichtag tut. „Ziel“ ist verbindlich für neue Arbeit. Wo beides abweicht, steht es ausdrücklich dabei.

## 1. Grundsatz: TAKT ist kein Medizinprodukt

TAKT liefert **Orientierung für gesunde Erwachsene**, keine Diagnose, keine Therapie, keine individuelle Ernährungs- oder Trainingsberatung.

| Erlaubt | Verboten |
|---|---|
| „Dein geschätzter Grundumsatz liegt bei etwa 1.737 kcal.“ | „Du hast einen zu niedrigen Stoffwechsel.“ |
| „Orientierung, keine medizinische Diagnose.“ | „Dein Ruhepuls zeigt eine Herzschwäche.“ |
| „Bei Beschwerden ärztlich abklären.“ | „Mit diesem Plan heilst du deinen Rücken.“ |
| „Der Gewichtstrend sinkt um etwa 0,3 kg pro Woche.“ | „Du bist zu dick / zu dünn / übergewichtig.“ |
| „Heute eher leicht trainieren: Schlaf unter 7 Stunden, Muskelkater mittel.“ | „Du bist übertrainiert.“ (Diagnose) |

**Pflichten**

1. Jede Variante eines Features in einem Modul mit `legal: ['gesundheit']` enthält mindestens eine `legal-notice` mit `kind: 'gesundheit'` (Ist: Preset `gesundheit`, Text: „Richtwerte für gesunde Erwachsene, kein medizinischer Rat. Bei Beschwerden ärztlich abklären.“). Der Hinweis ist nicht wegdesignbar und nicht per Prop abschaltbar (Bauplan 5.12, `legal-present`-Prüfung). Ist (`legal-notice` Version 1.1): Die Prop `text` überschreibt den Standardtext noch; für `gesundheit` ist das **verboten** (Ziel: Prop nur für Sonderfälle anderer Arten, Wunsch an INF-9). Darstellung `footer`, `inline` oder `card`; **nicht `banner`**, weil der Banner Warnfarbe trägt (`--tk-c-warning-soft`) und T1 sie im Kalorien-, Gewichts- und Wasserkontext verbietet.
2. Beim ersten Öffnen von Ernährung oder Fitness erscheint einmalig der Dialog „Gut zu wissen“ (Muster unten). Er ist dauerhaft nachlesbar unter Einstellungen › Datenschutz › Gesundheitshinweis.
3. Jedes Gesundheits-Feature trägt mindestens eine Anforderung `type: 'rule'`, `priority: 'must'` mit Verweis auf einen Abschnitt dieses Dokuments (z. B. „Leitplanken 2: Untergrenze“).
4. Empfehlungen nennen immer ihren Grund („weil Schlaf unter 7 Stunden und Muskelkater hoch“), nie eine unerklärte Punktzahl (kein „Readiness 62“).

**Mustertext Erststart-Dialog (Annahme, vor Veröffentlichung prüfen lassen)**

> **Gut zu wissen**
> TAKT gibt dir Richtwerte für gesunde Erwachsene. Das ist keine medizinische Beratung und ersetzt keine Ärztin und keinen Arzt. Bei Beschwerden, Vorerkrankungen, Schwangerschaft oder Stillzeit sprich bitte vorher mit deiner Praxis.
> Deine Gesundheitsdaten bleiben auf deinem Gerät.
> [Verstanden] [Mehr erfahren]

## 2. Kalorien- und Gewichtsziele: Untergrenzen und Tempo

### 2.1 Regeln (verbindlich)

| Nr. | Regel | Umsetzung / Prüfweg |
|---|---|---|
| K1 | Das Tagesziel liegt **nie unter dem geschätzten Grundumsatz** (Mifflin-St-Jeor). | Ist: `safeCalorieTarget` in `core/health.js` (hebt auf den Grundumsatz an) und `planTarget` in `nutrition/_calc.js`. Testfall mit festen Werten (`tests/health.test.mjs`). |
| K2 | Zusätzlich gilt eine absolute Untergrenze: **1.500 kcal (m), 1.200 kcal (w), 1.350 kcal (keine Angabe)**. Maßgeblich ist der höhere Wert aus K1 und K2. | Ist: nur in `nutrition/_calc.js` (`KCAL_FLOOR`, `floor = max(bmr, KCAL_FLOOR)`); `core/health.js` kennt nur den Grundumsatz. Ziel: auch in `core/health.js`. Werte sind Annahmen. |
| K3 | Abnahme **Standard 0,5 % des Körpergewichts pro Woche**, Vorschläge **höchstens 0,75 %**; die äußere Grenze, die nie überschritten wird, ist **ca. 1 %** (und absolut 0,75 kg pro Woche). | Ist, zwei Stände: `core/health.js` schlägt 0,5 % vor und deckelt bei 0,75 %. `nutrition/_calc.js` deckelt bei 1 % und 0,75 kg pro Woche, Wizard-Stufen 0,25 und 0,5 kg. Ziel: der Wizard nutzt `core/health.js` (siehe 2.5). |
| K4 | **Unter 18 Jahren keine Defizit-Ziele.** Der Wizard bietet „Abnehmen“ nicht an, zeigt den Hinweistext K4 und führt zu „Gewicht halten“ oder „Gesund essen ohne Zahlen“. | Ist: `blocked: 'minor'` in `planTarget`. |
| K5 | **Unter 14 Jahren** erscheint kein Kalorienrechner, nur der Gewohnheitsmodus (Abschnitt 5). | Ziel, Annahme (Empfehlung). |
| K6 | Plausibilitätsgrenzen für Eingaben: Alter 14–100 (darunter greift K5), Größe 120–230 cm, Gewicht 30–300 kg. Außerhalb: Rückfrage, kein Ergebnis. | Ziel; Fehlertext siehe Abschnitt 2.3. |
| K7 | Zielgewicht mit BMI unter 18,5: Hinweis K7, Speichern bleibt möglich, das Ergebnis wird nicht als Empfehlung formuliert. BMI wird dabei **nicht** als „Untergewicht“ bezeichnet. | Ziel. |
| K8 | **Aktivitätskalorien sind standardmäßig kein zusätzliches Essensbudget.** Trainingstag-Zuschlag (Ist: 150 kcal) gibt es nur nach ausdrücklichem Einschalten. | Ist: `nutGoals.includeActivity: false`, `useTrainingBonus: false`. |
| K9 | Das Ziel zeigt immer die Herleitung („Warum diese Zahl?“): Grundumsatz, Aktivitätsfaktor, Tempo, Ergebnis, Untergrenze. | Wizard-Komponente `goal-wizard`. |
| K10 | Faustregel „7.700 kcal entsprechen etwa 1 kg Körpergewicht“ wird als Näherung bezeichnet, nie als Gesetz. | Text in der Herleitung. |

### 2.2 Rechenbeispiel Jonas (Welt-Daten, Ist am Stichtag)

Persona: 38 Jahre, 182 cm, 78,4 kg (`fitnessProfile`, `bodySummary` und `nutProfile` stimmen überein), Aktivität „aktiv“ (Faktor 1,55).

- Grundumsatz (m): 10 × 78,4 + 6,25 × 182 − 5 × 38 + 5 = 1.736,5, gerundet **1.737 kcal** (`nutProfile.bmr`; `bmrMifflin` liefert ungerundet 1.736,5).
- Gesamtumsatz: 1.737 × 1,55 = **2.692 kcal** (`nutProfile.tdee`).
- Untergrenze: max(1.737; 1.500) = **1.737 kcal** (`planTarget` rundet sie auf die nächsten 10 kcal auf: 1.740).
- Tempo 0,27 kg pro Woche (`nutProfile.pace`) → Defizit 0,27 × 7.700 / 7 = 297 kcal pro Tag → rechnerisch 2.395 kcal, `planTarget` rundet auf **2.400 kcal**. Das ist exakt `nutGoals.kcal` (Defizit gegenüber dem Gesamtumsatz: 292 kcal, rund 0,27 kg pro Woche).
- Standard nach `safeCalorieTarget` (0,5 % = 0,39 kg pro Woche): Defizit 431 kcal → **2.260 kcal**. Das ist der vorsichtigere Vorschlag, die Welt wählt bewusst ein etwas langsameres Tempo.
- Alle Werte liegen über der Untergrenze 1.737 kcal, K1 und K2 sind erfüllt.
- Obergrenze für das Tempo bei 78,4 kg: 0,75 % = 0,59 kg pro Woche (`core/health.js`); 1 % = 0,78 kg, absolut gedeckelt auf 0,75 kg (`_calc.js`).
- Gegenprobe der Stopps mit demselben Profil (`planTarget`): Tempo 0,9 kg pro Woche ergibt Ziel 1.870 kcal mit Stopp „pace“ (Tempo auf 0,75 kg begrenzt); Alter 17 ergibt Stopp „minor“ und Ziel = Gesamtumsatz.

Hinweis: Gewicht, Größe und Zielgewicht von Fitness und Ernährung wurden am Stichtag angeglichen (früher 82,4 kg und 183 cm in der Ernährung, Befund B1 in `DATENWELT.md`, jetzt behoben). Diese Zahlen ändern sich, wenn die Persona bestätigt oder geändert wird; maßgeblich ist immer die Rechnung aus den Welt-Schlüsseln.

### 2.3 Mustertexte der Sicherheits-Stopps

Alle Texte: ruhig, ohne Ausrufezeichen, mit Ausweg. Ton: `docs/TEXT_STIL.md`.

| Stopp | Muster |
|---|---|
| K1/K2 Untergrenze | „Dieses Ziel liegt unter deinem geschätzten Grundumsatz von 1.737 kcal. TAKT setzt es auf 1.740 kcal. Weniger zu essen ist ohne ärztliche Begleitung nicht sinnvoll.“ (Zahlen aus dem Beispiel Jonas, `planTarget` rundet die Untergrenze auf 10 kcal auf.) |
| K3 Tempo | „Mehr als 0,75 kg pro Woche ist zu schnell. Das Tempo wurde auf 0,75 kg begrenzt. Langsamer klappt es meist dauerhafter.“ |
| K4 unter 18 | „Unter 18 Jahren bietet TAKT keine Abnehm-Ziele an. Dein Körper wächst noch, sprich bitte mit deiner Ärztin oder deinem Arzt. Du kannst dein Gewicht halten oder ohne Zahlen essen.“ |
| K6 unplausibel | „Diese Angabe passt nicht (20 kg). Prüfe den Wert oder wähle eine andere Einheit.“ |
| K7 niedriges Zielgewicht | „Dein Zielgewicht liegt sehr niedrig. Bitte lass dieses Ziel von einer Ärztin oder einem Arzt einschätzen, bevor du loslegst.“ |
| Sonderfälle (siehe 2.4) | Text 2.4 |

### 2.4 Schwangerschaft, Stillzeit, Essstörung, Vorerkrankung

- Der Wizard fragt **optional und nur einmal** („Gilt für dich etwas davon?“ Schwangerschaft, Stillzeit, Vorerkrankung, ich möchte das nicht angeben). Die Antwort wird **nicht gespeichert**, sondern steuert nur die Anzeige des Hinweises in dieser Sitzung (Datensparsamkeit, Abschnitt 8).
- Eine Essstörung wird **nicht abgefragt**. Der Hinweistext nennt sie dennoch, weil jede Zahlen-App für Betroffene riskant sein kann. Er verweist auf den Gewohnheitsmodus und auf ärztliche Hilfe.
- Bei „Schwangerschaft“, „Stillzeit“ oder „Vorerkrankung“ wird **kein Defizit-Ziel berechnet**, bis die Person „Trotzdem weiter“ wählt. Die Auswahl „Gewohnheitsmodus“ ist gleichwertig sichtbar.

**Mustertext (sanft):**

> **Ein kurzer Hinweis**
> In Schwangerschaft und Stillzeit, bei Vorerkrankungen oder wenn Essen und Gewicht dich stark beschäftigen, ist ein Kaloriendefizit nicht ohne ärztlichen Rat sinnvoll. TAKT kann das nicht beurteilen.
> Sprich bitte vorher mit deiner Praxis. Du kannst TAKT auch ohne Zahlen nutzen.
> [Ohne Zahlen starten] [Trotzdem weiter]

### 2.5 Eine Rechnung statt zwei (Ist-Abweichung)

Am Stichtag existieren zwei Kalorienrechner mit leicht verschiedenen Regeln:

| | `app/src/core/health.js` (`safeCalorieTarget`) | `nutrition/_calc.js` (`planTarget`) |
|---|---|---|
| Untergrenze | Grundumsatz | Grundumsatz **und** 1.500 / 1.200 / 1.350 kcal |
| Standard-Tempo | 0,5 % pro Woche | frei wählbar (Welt: 0,35 kg) |
| Obergrenze Tempo | 0,75 % pro Woche | 1 % und 0,75 kg pro Woche |
| unter 18 | Ziel = Gesamtumsatz | gesperrt mit Hinweistext |
| Tempo-Einheit | Anteil Körpergewicht | kg pro Woche |

**Ziel:** `core/health.js` ist die einzige Rechnung (Bauplan 5.8) und übernimmt die strengere Untergrenze K2 sowie die Hinweistexte von `_calc.js`. Bis dahin gilt für neue Texte und Tests die jeweils **strengere** Regel. Wunsch an INF-2 und MOD-NUT im Bericht.

## 3. Tonalität: ruhig, ohne Druck, ohne Moral

### 3.1 Regeln

| Nr. | Regel |
|---|---|
| T1 | **Überschreitung ist nie rot und nie alarmierend.** Weder `--tk-c-danger` noch `--tk-c-warning` im Kalorien-, Makro-, Gewichts- und Wasserkontext. Erlaubt: `--tk-c-text-muted`, `--tk-c-info`, `--tk-c-accent2`. |
| T2 | **Keine Moralwörter** (Liste in Abschnitt 9). Lebensmittel sind weder „erlaubt“ noch „verboten“, weder „gut“ noch „schlecht“. |
| T3 | **Wochen- statt Tagesbewertung.** Der Tageswert wird neutral gezeigt, bewertet („im Korridor“) wird nur der 7-Tage-Schnitt. |
| T4 | **Serie mit Pausenjoker.** Training zählt **Wochen** mit erreichtem Wochenziel (Ist Welt: 12 Wochen, 2 Joker pro Quartal, 1 übrig, `fitnessStreak`). Gewohnheiten zählen **Tage** mit einem Joker pro Kalenderwoche (Ist: `streakWithJoker` in `core/health.js`, Standard `jokersPerWeek: 1`). Beide Modelle sind zulässig, jedes nennt seine Joker sichtbar. Urlaub und Krankheit frieren die Serie ein. |
| T5 | Nach einer unterbrochenen Serie steht „Neustart“, nie „verloren“. Der Verlauf bleibt sichtbar. |
| T6 | Gewicht wird als **Trend** (exponentiell geglättet) gezeigt, die Tageszahl blass. Kein BMI ohne Wunsch, nie mit Bewertungsfarbe. |
| T7 | Lob ist selten, einmalig, leise und abschaltbar (Meilensteine). `prefers-reduced-motion` ist Pflicht, kein Konfetti als Standard. |
| T8 | Zahlen haben nie Alarmfarbe **und** Alarmsymbol. Farbe ist nie das einzige Merkmal. |
| T9 | Ein „Ziel nicht erreicht“ führt zu einem Vorschlag („Ziel für nächste Woche senken?“), nie zu einer Rüge. Nach 3 nicht erreichten Wochen: Vorschlag, das Ziel zu senken. |

### 3.2 Mustertexte

| Situation | Text |
|---|---|
| Heute über dem Kalorienziel | „Heute etwas über dem Ziel. Der Wochenschnitt zählt: Ø 2.310 kcal bei 2.400.“ (Beispielwerte, nicht aus der Welt) |
| Zahl im Tagesring über 100 % | Ring wechselt in `--tk-c-info`, Mitte zeigt „+120 kcal“, kein Ausrufezeichen. |
| Nichts erfasst (Lücke) | „Gestern ist leer geblieben. Du kannst nachtragen, oder es einfach so lassen.“ |
| Serie unterbrochen | „Neustart: Deine 12 Wochen bleiben im Verlauf.“ |
| Joker eingesetzt | „Pausenjoker genutzt. Deine Serie läuft weiter. Noch 1 Joker in diesem Quartal.“ |
| Wochenziel nicht erreicht | „Diese Woche 2 von 3 Einheiten. Möchtest du nächste Woche mit 2 starten?“ |
| Gewicht springt um mehr als 3 kg | „Das ist ein großer Sprung. Stimmt der Wert? Tagesschwankungen von 1 bis 2 kg sind normal.“ |
| Lücke über 14 Tage beim Wiegen | „Zuletzt gewogen am 09.11. Wiegen ist freiwillig, der Trend rechnet mit.“ |
| Ziel erreicht | „Wochenziel erreicht.“ (ohne Konfetti, ohne „Super!“) |
| Wasser weit über Ziel | „Das Ziel ist ein Richtwert. Trinken nach Durst reicht.“ |

### 3.3 Beispiel aus der Welt (Ist)

`budgets` zeigt „Freizeit“ mit 164,50 € von 150 € (Finanzen). Für Kalorien gilt das gleiche Prinzip wie für das Budget in `FINANCE_GUIDELINES.md`, **aber** ohne Rot und ohne Warnfarbe. In `nutHistory` liegen Tage über und unter dem Ziel von 2.400 kcal: So 22.11. mit 2.701 kcal (über dem Ziel), Sa 21.11. mit 2.089 kcal (darunter), Do 19.11. und Sa 14.11. ohne Erfassung (`logged: false`). Diese Tage werden ohne Wertung dargestellt, nicht erfasste Tage als Lücke („Gestern ist leer geblieben …“), nie als 0 kcal.

## 4. Gewicht und Kalorien ausblendbar

- **Ausblenden** ist immer möglich: Einstellungen › Datenschutz › „Gewicht ausblenden“ und „Kalorien ausblenden“. Ist: Schlüssel `nutGoals.showNumbers`; für Gewicht fehlt ein Schlüssel (Ziel: `prefs.health.hideWeight`, `prefs.health.hideKcal`, Eigentümer settings-Welt).
- Wirkung: Im Feature, im Start-Modul, in Benachrichtigungen und im Teilen-Text erscheint **keine** Gewichts- bzw. Kalorienzahl, auch nicht als Diagrammbeschriftung, `aria-label` oder Tooltip. Prüfweg: DOM-Scan bei aktiviertem Schalter (QA-Probe, INF-6).
- Das Ausblenden ist ohne PIN möglich und sofort wirksam (keine Rückfrage, kein Warnhinweis).

## 5. Gewohnheitsmodus (ohne Zahlen)

Gedacht für Menschen, die ohne Zählen essen und trainieren wollen, und als schützende Option bei Unsicherheit.

| Bleibt sichtbar | Verschwindet |
|---|---|
| Mahlzeiten als Einträge („Skyr-Bowl“, „Quiche mit Salat“) | kcal, Makros in Gramm, Prozentringe |
| Wasser als Gefäße oder „Ziel erreicht“ ohne Millimeter-Balken | Gewicht, Trend, BMI, Umfänge |
| Training: Einheit erledigt, Wochenziel als Punkte | Kalorien pro Einheit, Aktivkalorien |
| Gewohnheiten und Serie mit Joker | Kalorienbilanz, „übrig“ |

- Der Modus ist im Wizard als Ziel „Gesund essen ohne Zahlen“ wählbar und jederzeit in den Einstellungen umschaltbar. Er blockiert keine Funktionen, er blendet Zahlen aus.
- Der Modus ist **Standard-Option** (Entscheidung offen, siehe BAUPLAN_PAKETE `decisionsForUser` Nr. 8).
- Jede Gesundheits-Variante prüft in der QA einen Zustand „Gewohnheitsmodus“ (DOM enthält kein `kcal` und kein `kg`).

## 6. Training: Sicherheit

| Nr. | Regel | Mustertext / Beispiel |
|---|---|---|
| S1 | **Aufwärmen** vor der ersten schweren Übung: Aufwärmsätze sind eigener Satztyp (`warm`), zählen nicht ins Volumen und nicht als Rekord. Ist: Programm markiert Aufwärmen bei Kniebeuge, Bankdrücken, Hip Thrust. | „Aufwärmsatz: 37,5 kg × 8“ |
| S2 | **Schmerz = abbrechen.** Auf jeder Session-Variante steht dauerhaft ein dezenter Hinweis; die Übung hat „Überspringen“ ohne Begründungszwang. | „Bei Schmerz oder Schwindel abbrechen. Stechender Schmerz ist kein Trainingsreiz.“ |
| S3 | **Konservative Progression.** Ist: doppelte Progression (obere Wiederholungszahl bei allen Sätzen erreicht, dann Langhantel +2,5 kg, Kurzhantel +1 kg). Vorschläge sind Vorschläge, nie Pflicht. | „Bei allen Sätzen 10 Wiederholungen geschafft. Nächstes Mal 62,5 kg probieren.“ |
| S4 | **Entlastungswoche** (Deload) alle 4 bis 6 Wochen als Vorschlag. Ist: alle 6 Wochen mit etwa 60 % Volumen, die nächste wird für KW 50 (ab 07.12.) vorgeschlagen und ist verschiebbar (`trainingProgram.deload`). | „KW 50: eine leichtere Woche mit etwa 60 % Volumen wäre sinnvoll. Du kannst sie im Plan verschieben.“ |
| S5 | **Geschätzte Maximalkraft** (Epley) ist immer als „geschätzt“ beschriftet. Maximalversuche werden nie vorgeschlagen. | „1RM geschätzt: 92 kg“ |
| S6 | **Erholung mit Faktoren statt Punktzahl.** Empfehlung nennt mindestens einen Eingabewert. | „Heute eher leicht, weil Schlaf unter 7 Stunden (6,9) und Muskelkater mittel.“ |
| S7 | Erhöhter Ruhepuls oder schlechter Schlaf über Tage: neutral formuliert, mit ärztlichem Hinweis. Kein „Warnung“, kein Rot. | „Dein Ruhepuls liegt seit 5 Tagen höher als sonst. Beobachte es, bei Beschwerden lass es ärztlich abklären.“ |
| S8 | Wetter und Training: Bei Sturm- oder Glättewarnung (Welt: Stufe 2 am Di, 24.11. ab 14:00 Uhr) wird eine Alternative angeboten, keine Absage erzwungen. | „Ab 14 Uhr Sturmböen bis 72 km/h. Heute ist Erholung eingeplant, der Lauf am Samstag passt.“ |
| S9 | Anfänger-Hinweis bei Programmen mit Stufe „Einsteiger“: „Lass dir Technik zeigen, bevor du schwer trainierst.“ | |

## 7. Allergene: die 14 EU-Hauptallergene

Grundlage: Verordnung (EU) Nr. 1169/2011, Anhang II (Lebensmittelinformations-Verordnung). Die Liste ist **verbindlich und vollständig**; Daten tragen die Kurzform aus der dritten Spalte (Ist-Bestand in den Demo-Daten: `Milch`, `Eier`, `Fisch`, `Soja`, `Sesam`, `Erdnüsse`, `Gluten`, `Schalenfrüchte`).

| Nr. | Allergen (Bezeichnung) | Kurzform in Daten | In Demo-Daten vorhanden |
|---|---|---|---|
| 1 | Glutenhaltiges Getreide (Weizen, Roggen, Gerste, Hafer, Dinkel, Kamut) | `Gluten` | ja (Hafer, Brot, Nudeln, Bier) |
| 2 | Krebstiere | `Krebstiere` | nein |
| 3 | Eier | `Eier` | ja |
| 4 | Fisch | `Fisch` | ja (Lachs, Thunfisch) |
| 5 | Erdnüsse | `Erdnüsse` | ja |
| 6 | Soja | `Soja` | ja (Tofu, Whey) |
| 7 | Milch (einschließlich Laktose) | `Milch` | ja |
| 8 | Schalenfrüchte (Mandeln, Haselnüsse, Walnüsse, Cashew, Pecannüsse, Paranüsse, Pistazien, Macadamia) | `Schalenfrüchte` | ja (Walnüsse, Mandeln) |
| 9 | Sellerie | `Sellerie` | nein |
| 10 | Senf | `Senf` | nein |
| 11 | Sesam | `Sesam` | ja (Hummus) |
| 12 | Schwefeldioxid und Sulfite (über 10 mg/kg bzw. 10 mg/l) | `Sulfite` | nein |
| 13 | Lupine | `Lupine` | nein |
| 14 | Weichtiere | `Weichtiere` | nein |

**Regeln**

1. Allergene stehen als Liste in `allergens[]` je Lebensmittel, nur mit Kurzformen aus der Tabelle (check-Kandidat: unbekannte Werte melden).
2. Anzeige als **Text plus Symbol**, nie nur Farbe: „Enthält: Milch, Erdnüsse“.
3. Hat die Person ein Allergen-Profil gesetzt, erscheint beim Erfassen ein ruhiger Hinweis („Enthält Milch, die du im Profil markiert hast“). Kein Blockieren, keine Alarmfarbe.
4. Pflichttext in Lebensmittel-, Rezept- und Scan-Features: **„Angaben ohne Gewähr. Prüfe das Etikett.“** Spuren („kann Spuren enthalten“) werden nicht modelliert und nie ausgeschlossen behauptet.
5. **Nicht verwechseln:** `wxSettings.allergens` (Birke, Gräser) sind **Pollenallergien** des Wetter-Moduls und gehören nicht in diese Liste. Ein check-Kandidat prüft nur `allergens` an Lebensmitteln.
6. Demo-Nährwerte sind Richtwerte und tragen `source: 'Demo-Daten (…)'`. Sie dürfen nie als geprüfte Herstellerdaten erscheinen.

## 8. Datenschutz: Gesundheitsdaten (Art. 9 DSGVO)

Gesundheitsdaten (Gewicht, Körpermaße, Kalorien, Training, Schlaf, Ruhepuls, Körperfotos, Allergene) sind eine **besondere Kategorie personenbezogener Daten** (Art. 9 DSGVO). Für die echte App gilt:

| Nr. | Regel | Status |
|---|---|---|
| D1 | **Lokal speichern.** Gesundheitsdaten verlassen das Gerät nicht (kein Konto, keine Cloud, keine Analyse-Dienste). Sync ist eine offene Entscheidung (`ADR-002-datenhaltung.md`) und würde eine neue Einwilligung erfordern. | Ziel |
| D2 | **Ausdrückliche Einwilligung** (Art. 9 Abs. 2 lit. a) vor der ersten Erfassung von Gesundheitsdaten. Eigener Schritt im Erststart, getrennt von Nutzungsbedingungen, nicht vorausgewählt, jederzeit widerrufbar. | Ziel |
| D3 | **Widerruf, Export, Löschen** je Bereich (Gewicht, Training, Ernährung) in Einstellungen › Daten. Löschen ist endgültig und wird vorher einmal erklärt, ohne Papierkorb für Gesundheitsdaten. | Ziel |
| D4 | **Körperfotos** sind privat, nur lokal, standardmäßig aus, nie im Teilen-Dialog vorausgewählt. | Ziel |
| D5 | **App-Sperre** (Biometrie/PIN) optional; Pflichtfrage `pattern-privacy` (Empfehlung: „Beträge ausblenden und Sperre für sensible Module“) ist noch offen. | Ziel |
| D6 | **Datensparsamkeit:** Angaben zu Schwangerschaft, Vorerkrankung oder Essstörung werden **nicht gespeichert** (Abschnitt 2.4). | Ziel |
| D7 | **Health Connect** (Schritte, Schlaf, Puls) nur nach einzelner, verweigerbarer Berechtigung je Datentyp. Zustand `denied` zeigt den Weg zur manuellen Eingabe. | Ziel |
| D8 | Keine Cloud-Dienste für Gesundheitsfunktionen (z. B. Foto-Kalorienschätzung) bis zur eigenen Entscheidung. | Ziel |
| D9 | **Workbench:** Die Workbench speichert nur fiktive Demo-Daten. Feedback aus dem Launcher (`/api/feedback`) enthält **keine** Gesundheitswerte, nur Bewertung, Route und Kommentar. | Ist |

Rechtliche Wirksamkeit (Einwilligungstext, Verarbeitungsverzeichnis, Hosting) ist **nicht** Teil der Workbench und braucht eine juristische Prüfung (Entscheidung offen, Bauplan 13).

## 9. Verbotene Begriffe (maschinenlesbar) und Alternativen

### 9.1 Format für die Prüfung (INF-5, `tools/check.mjs`)

Zwischen den Markierungen steht je Zeile **ein Eintrag**:

- Zeilen mit ```` ``` ```` am Anfang, mit `#` am Anfang und Leerzeilen werden ignoriert.
- Beginnt der Eintrag mit `/` und endet auf `/` oder `/<flags>`, ist er ein **regulärer Ausdruck** (JavaScript, z. B. `/\bcheat[\s-]?(day|meal)/i`). Vor Umlauten am Wortanfang funktioniert `\b` nicht; dort steht `(?<![\p{L}])` mit Flag `u`.
- Sonst ist es eine **Teilzeichenkette**: Treffer, wenn der Eintrag irgendwo im Text vorkommt, Groß-/Kleinschreibung egal (`sünd` trifft „Sünde“, „gesündigt“, „Sündenfall“).
- Ein Treffer ist ein **Fehler** laut Vertrag. Ist: `tools/check.mjs` meldet ihn derzeit als **Hinweis** (Warnung) und hängt an jeden regulären Ausdruck das Flag `u` an, die Ausdrücke müssen also im Unicode-Modus gültig sein (kein `\-`, `\ ` oder ähnliche Escapes). Passagen in „…“ entfernt der Check vor dem Vergleich (Zitat-Ausnahme).

**Geltungsbereich (Empfehlung):** String-Literale und Template-Texte in `app/src/seed/**` und in den Komponentenordnern `fitness/`, `nutrition/`, `habits/`, `health/`, `goals/`, `home/`; zusätzlich `legal-notice`-Presets. Kommentare, `docs/**` und diese Datei werden nicht geprüft.

**Ausnahme (Zitat):** Ein Begriff in deutschen Anführungszeichen („…“) innerhalb einer Anforderung, eines Akzeptanzkriteriums oder einer Entscheidungsbegründung gilt als **Zitat des Verbots** und ist erlaubt. Beispiel (Ist, `seed/modules/fitness.js`): Texte ohne Moralwörter („verloren“, „versagt“). Ohne diese Ausnahme würde die Regel sich selbst melden.

**Probelauf am Stichtag (24.11.2026):** Die Liste wurde gegen `app/src/seed/**` und die Ordner `fitness/`, `nutrition/`, `habits/` unter `library/components/` gehalten (Teilzeichenkette bzw. Regex je Zeile, Kommentarzeilen ausgenommen). Ergebnis: **4 Treffer, alle als Zitat in „…“** in Anforderungen und Akzeptanzkriterien der Seed-Manifeste `fitness.js` und `nutrition.js` (zu Beginn der Arbeit waren es 7, auch in `habits.js`; z. B. „Keine Bewertungswörter („verloren“, „versagt“)“), also erlaubt. **Keine echten Verstöße.** Warnbegriffe: 1 Treffer (`verfehlten Wochen` in einer Anforderung von `fitness.js`), nicht nutzersichtbar. Die Zahlen können sich ändern, solange die Module weiterarbeiten.

<!-- verbotsbegriffe:start -->
```text
# Moral- und Strafwörter
sünd
kalorienbombe
/(?<![\p{L}])innere[nrms]?\s+schweinehund/iu
/\bdisziplin/i
/\bgescheitert\b/i
/\bversag(t|te|en|er)\b/i
/\bversager/i
/\bkontrollverlust/i
# Abtrainieren und Verbrennen als Guthaben
abtrainier
wegtrainier
wegschwitz
fettverbrenn
/\bverbr[ea]nn\w*\b[^.\n]{0,40}\b(kalorien|kcal)\b/i
/\b(kalorien|kcal)\b[^.\n]{0,40}\bverbr[ea]nn/i
/\bkalorien\s+(abarbeiten|loswerden|wegmachen)/i
/\bhast\s+(dir\s+)?[^.\n]{0,25}\bverdient\b/i
# Tages- und Serienbewertung
/\bschlecht(er|en|es|e)?\s+(tag|woche|mahlzeit|essen)\b/i
/\bcheat[\s-]?(day|meal|tag|mahlzeit)/i
/\bserie\s+(ist\s+)?(verloren|gerissen|vorbei|zerstört|gebrochen)/i
/\bstreak\s+(verloren|gebrochen|gerissen)/i
/\bzu\s+viel\s+gegessen\b/i
# Körperbewertung und Diagnose
/(?<![\p{L}])(übergewicht|untergewicht|fettleibig|adipositas|adipös)\p{L}*/iu
/\bdu\s+bist\s+zu\s+(dick|dünn|schwer|fett)/i
/\bzu\s+dick\b/i
/\b(idealgewicht|normalgewicht)\b/i
/\b(heilt|heilung|therapiert|diagnostiziert)\b/i
```
<!-- verbotsbegriffe:end -->

### 9.2 Warnbegriffe (Hinweis statt Fehler)

Treffer sind ein Hinweis in `npm run check` (kein Abbruch), weil sie je nach Zusammenhang erlaubt sind. Gleiches Format wie oben.

<!-- warnbegriffe:start -->
```text
/\b(erlaubte?[rsmn]?|verbotene?[rsmn]?)\s+(lebensmittel|essen|snacks?|speisen)/i
/\b(lebensmittel|essen|snacks?)\s+(ist|sind)\s+(erlaubt|verboten)/i
/\b(gesunde|ungesunde)s?\s+(lebensmittel|ernährung)/i
/\bverfehl/i
/\bkalorien[\s-]?(limit|grenze|budget\s+überschritten)/i
/\bnur\s+noch\s+\d+\s*kcal/i
/\b(schaffst|musst|solltest)\s+du\b/i
```
<!-- warnbegriffe:end -->

### 9.3 Erlaubte Alternativen

| Statt | Besser |
|---|---|
| „Du hast gesündigt.“ / Diät-Sünde | „Heute etwas über dem Ziel. Der Wochenschnitt zählt.“ |
| „Das musst du abtrainieren.“ | „Training und Essen sind getrennte Dinge. Heute ist Erholung eingeplant.“ |
| „Kalorien verbrennen“ (als Guthaben) | „Aktivitätsumsatz“ (nur Anzeige, kein Essensbudget) |
| „Du hast versagt.“ / „Serie verloren“ | „Neustart. Deine 12 Wochen bleiben im Verlauf.“ |
| „Schlechter Tag“ | „Ein ruhiger Tag.“ oder gar keine Wertung |
| „Cheat Day“ | „Freier Tag“ (Eintrag ohne Ziel-Vergleich) |
| „Das hast du dir verdient.“ | „Lass es dir schmecken.“ |
| „Übergewicht“, „zu dick“ | keine Einordnung; Trend und eigenes Ziel zeigen |
| „Disziplin“ | „Routine“, „Gewohnheit“ |
| „Erlaubt / verboten“ (Lebensmittel) | „Passt zu deinem Eiweißziel“ / „enthält Milch“ |
| „Ziel verfehlt“ | „Ziel diese Woche nicht erreicht. Nächste Woche anpassen?“ |
| „Deine Werte sind schlecht.“ | „Dein Ruhepuls liegt höher als sonst. Beobachten, bei Beschwerden ärztlich abklären.“ |

## 10. Prüfliste je Variante (vor Freigabe)

| Nr. | Prüfpunkt | Wie geprüft |
|---|---|---|
| P1 | `legal-notice` `kind: 'gesundheit'` sichtbar | Probe `legal-present` (INF-6) |
| P2 | Kein `--tk-c-danger` / `--tk-c-warning` in Kalorien-, Gewicht-, Makro-, Wasser-Kontext | `check` statisch (Bauplan 10) |
| P3 | Keine Treffer in Abschnitt 9.1 | `check` statisch |
| P4 | Untergrenze, Tempo und unter-18-Regel greifen im Wizard (Testfälle mit festen Eingaben) | `npm test`: Ist `tests/health.test.mjs` (Rechner in `core/health.js`); Ziel zusätzlich Tests des Ernährungspakets für `planTarget` (Namensraum nach Bauplan 5.14) |
| P5 | Zustand „Gewohnheitsmodus“ zeigt weder `kcal` noch `kg` | QA-Probe, DOM-Scan |
| P6 | „Gewicht ausblenden“ entfernt jede Gewichtszahl, auch in `aria-label` | QA-Probe, DOM-Scan |
| P7 | Überschreitung zeigt Text statt Alarm, Farbe nie allein | Sicht + Probe (Kontrast, Text vorhanden) |
| P8 | Serie nutzt Wochen, Joker, „Neustart“ statt Verlustwort | Text-Check P3 + Review |
| P9 | Allergene nur mit Kurzformen aus Abschnitt 7, Pflichttext vorhanden | `check` (Kandidat), Review |
| P10 | Satztypen: Aufwärmsätze zählen nicht in Volumen und Rekorde | `npm test` (calc) |
| P11 | Touch-Ziele ≥ 44 px für Stepper und Satz-Logger | QA-Probe |
| P12 | Empfehlungen nennen ihren Grund | Review |

## 11. Offene Punkte und Annahmen

- **Fachliche Prüfung** aller Zahlen (Untergrenzen 1.500 / 1.200 / 1.350 kcal, 1 % und 0,75 kg pro Woche, Grundumsatzformel, Alterungsgrenzen 14 und 18) und aller Hinweistexte durch eine qualifizierte Person vor einer Veröffentlichung. Bis dahin Annahme.
- **Rechtsprüfung** der Hinweistexte und des Einwilligungsverfahrens (Art. 9 DSGVO): Entscheidung offen (BAUPLAN_PAKETE `decisionsForUser` Nr. 10).
- **Aktivitätskalorien** als Essensbudget: Empfehlung „nie“ (Nr. 8 derselben Liste), Entscheidung offen.
- **Pflichtfrage `pattern-health-tone`** (Katalog): Empfehlung „ruhig, ohne Rot, keine Diät-Moral, Untergrenzen“, Status offen. Dieses Dokument setzt die Empfehlung als Arbeitsgrundlage um.
- **Bewusst ausgeklammert** (erhöhtes Risiko für Fehlinformation oder Druck): Intervallfasten, Medikamenten- und Supplement-Verwaltung, Wettkampfdiäten, KI-Foto-Kalorienschätzung, Ranglisten und Social-Funktionen.
- **Quellen für Lebensmitteldaten** (Open Food Facts mit ODbL-Namensnennung gegen eigene Datenbank): Entscheidung offen; die Demo nutzt eigene Richtwerte.
