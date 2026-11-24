# Finanz-Leitplanken (Finanzen, Sparen, Trading)

> **Stand:** 24.11.2026 · **Referenztag der Demo:** Di, 24.11.2026, 09:30 Uhr
> **Gültigkeit:** verbindlich für jede Variante, Komponente und jeden Seed-Text in `finance.*`, `savings.*`, `trading.*` sowie für Geldbeträge in `home.*`, `sales.*`, `documents.*`, `goals.*` und `system.*` (Suche, Mitteilungen). Gilt, bis eine Entscheidung im Entscheidungslog sie ändert. **Alle Steuer- und Rechtsangaben sind Annahmen mit Stand-Datum und müssen vor einer Veröffentlichung geprüft werden („Annahme, vor Veröffentlichung prüfen“).**
> **Zugehörige Dateien:** `app/src/core/finmath.js` (Rechenkern, `TAX_DE`) · `tools/test-finmath.mjs` (18 Referenztests) · `app/src/library/components/crosscut/legal-notice.js` · `app/src/lib/format.js` (Formatstandard `fmtMoney`, `maskMoney`, 14 Referenzwerte) · `app/src/library/helpers.js` (`money()`, `percent()`) · `tests/format.test.mjs`, `tests/finmath.test.mjs` · `app/src/seed/world/finance.js` · `docs/HEALTH_GUIDELINES.md` (Gegenstück für Körperdaten) · `docs/TEXT_STIL.md` · `docs/DATENWELT.md` · `docs/BAUPLAN.md` (4, 5.8, 6, 10) · Pflichtfrage `pattern-finance-legal` in `app/src/seed/catalog.js`.
> **Ist und Ziel:** „Ist“ beschreibt den Code am Stichtag, „Ziel“ ist verbindlich für neue Arbeit. Abweichungen sind benannt.

## 1. Grundsatz

TAKT zeigt, plant und simuliert. TAKT ist **keine** Anlageberatung, **keine** Steuerberatung, **kein** Broker und **kein** Zahlungsdienst.

| Bereich | Was TAKT tut | Was TAKT nie tut |
|---|---|---|
| Finanzen | Buchungen erfassen, Budgets, Auswertungen, Vermögen anzeigen | Konten verändern, Überweisungen auslösen |
| Sparen | Sparpläne als **Plan-Tracker**: planen, erinnern, Ausführung manuell bestätigen, Deckung prüfen | Sparpläne beim Broker anlegen oder ausführen |
| Trading | Depot anzeigen, Watchlist, **simuliertes** Order-Ticket, Steuer-Orientierung | Orders an einen Broker senden, Kauf-/Verkaufsempfehlungen geben |

Das ist die Empfehlung der Pflichtfrage `pattern-finance-legal` („Anzeige, Planung, Simulation – keine Orderausführung, Hinweise sichtbar“, Reversibilität unumkehrbar, Status offen) und wird bis zur Entscheidung als Arbeitsgrundlage verwendet. Eine Broker-Anbindung wäre ein eigenes Projekt (Backend, Lizenz, Haftung) und ist **ausgeschlossen**.

Kontoanbindung: manuelle Erfassung plus CSV/CAMT-Import (Empfehlung, Entscheidung offen). Ein Bank-Aggregator ist nicht Teil von Basis v1.

## 2. Hinweisarten, Mustertexte, Platzierung

Hinweise kommen aus **einer** Quelle (`legal-notice`), nicht frei editierbar je Variante, damit kein Entwurf den Hinweis wegdesignt. Jedes Modul mit `legal: [...]` zeigt in **jeder Variante jedes Features** mindestens die Hinweise, die in Abschnitt 2.3 für diese Stelle vorgeschrieben sind (Probe `legal-present`, statischer Check, INF-5/INF-6).

### 2.1 Die sechs Finanz-Hinweisarten (`kind`)

| `kind` | Kurztext (höchstens ca. 90 Zeichen) | Langtext |
|---|---|---|
| `simulation` | „Simulation: Es wird keine Order ausgeführt.“ | „Alle Orders, Depotbewegungen und Wertentwicklungen in dieser Ansicht sind simuliert. Es fließt kein Geld und TAKT sendet nichts an einen Broker. Wertpapiere können an Wert verlieren.“ |
| `keine-beratung` | „Keine Anlageberatung. TAKT zeigt Zahlen und Modellrechnungen.“ | „TAKT ist keine Anlage-, Steuer- oder Rechtsberatung und gibt keine Kauf- oder Verkaufsempfehlungen. Entscheidungen triffst du selbst. Ein Kapitalverlust ist möglich.“ |
| `modellrechnung` | „Modellrechnung mit angenommener Rendite. Kein Versprechen.“ | „Die Werte beruhen auf deinen Eingaben und einer angenommenen, gleichbleibenden Rendite. Sie sind keine Prognose und kein Versprechen. Die Wertentwicklung der Vergangenheit ist kein verlässlicher Indikator für die Zukunft. Kosten, Steuern und Inflation sind nur enthalten, wenn sie genannt sind.“ |
| `steuer` | „Steuer-Orientierung, keine Steuerberatung. Annahmen Stand 01/2026.“ | „Vereinfachte Schätzung: Abgeltungsteuer 25 % plus 5,5 % Solidaritätszuschlag darauf, optional Kirchensteuer, Sparer-Pauschbetrag 1.000 € (2.000 € bei Zusammenveranlagung). Teilfreistellung und Vorabpauschale sind nur enthalten, wenn angegeben. Deine tatsächliche Steuer kann abweichen. Lass die Annahmen von einer Steuerberatung prüfen.“ |
| `kursdaten` | „Kurse verzögert, Stand 09:30.“ (Demo: „Kurse fiktiv, Stand 09:30.“) | „Kursdaten stammen von {Quelle}, sind um {Minuten} Minuten verzögert und können Fehler enthalten. Sie eignen sich nicht als Grundlage für Handelsentscheidungen.“ |
| `krypto` | „Kryptowerte sind hochspekulativ und können vollständig an Wert verlieren.“ | „Kryptowerte schwanken stark und können vollständig an Wert verlieren. Gewinne können steuerpflichtig sein. Haltefrist und Freigrenze prüfst du bitte selbst oder mit einer Steuerberatung.“ |

Ergänzend gibt es `daten` (Ist-Preset): „Alle Daten bleiben lokal auf deinem Gerät. Beträge lassen sich jederzeit ausblenden.“ (nur wahr, solange die Datenhaltung lokal-first bleibt, siehe `ADR-002-datenhaltung.md`).

**Ist und Ziel von `legal-notice`**

| | Ist (`legal-notice.js`, Version 1.1, am Stichtag nachgeprüft) | Ziel |
|---|---|---|
| Arten (`kind`) | `finanzen`, `trading`, `sparplan`, `steuer`, `gesundheit`, `simulation`, `keine-beratung`, `modellrechnung`, `kursdaten`, `krypto`, `daten` (11) | wie Ist; die älteren Sammelarten `finanzen`, `trading`, `sparplan` entfallen in neuen Varianten zugunsten der sechs Einzelarten |
| Darstellung (`style`) | `footnote`, `footer`, `inline`, `card`, `banner`, `collapsible` | wie Ist; `banner` bei `simulation` und `krypto` nie einklappbar (Ist: `banner` hat keine Einklappfunktion, ist also nicht wegklickbar) |
| Wortlaut | je Art **ein** Text im Code (z. B. `simulation`: „Dies ist eine Simulation mit fiktiven Beträgen. Es werden keine echten Orders ausgeführt und kein Geld bewegt.“) | Kurz- und Langtext wie in der Tabelle oben; der Code-Wortlaut gilt bis zur Angleichung als Ist (Wunsch an INF-9). Inhaltlich ist kein Widerspruch: keine Order, keine Beratung, Kapitalverlust möglich |
| Stand-Datum | Prop `stand` hängt „· Stand: …“ an; der Text von `steuer` trägt „Stand 01/2026“ fest im Code | `steuer` liest den Stand aus dem Rechenkern (`TAX_DE.stand`), kein festes Datum im Text |
| Freitext | Prop `text` überschreibt den Standardtext | kein Überschreiben der Pflichtaussage, nur Zusatz in `stand` |

Bis zur Angleichung gilt: In Varianten die Einzelarten verwenden, nie ein selbst formuliertes Ersatz-Statement per `text`, und im Feature als Anforderung `type: 'rule'` festhalten, welche Arten Pflicht sind.

### 2.2 Platzierung

| Stil | Verwendung | Verhalten |
|---|---|---|
| `banner` | oben im Screen, Karte mit Symbol | **nicht wegklickbar** bei `simulation` (Order-Ticket, Depot) und `krypto`; sonst nach „Verstanden“ einklappbar auf eine Zeile |
| `inline` | direkt unter oder neben der Zahl oder Grafik, die sie betrifft (z. B. unter dem Wachstumsdiagramm) | immer sichtbar, eine Zeile, `--tk-c-text-subtle`, nie kleiner als `--tk-fs-xs` |
| `footer` | am Ende des Screens | immer sichtbar |

Kontrast: Hinweise sind in allen drei Themes kontrastgeprüft (Theme-Audit). Hinweise sind **Text**, nicht nur Symbol.

### 2.3 Pflicht-Matrix (Feature → Hinweis → Stil)

| Feature (Auszug, IDs siehe Bauplan 6) | Pflicht | Stil |
|---|---|---|
| `finance.home`, `finance.accounts`, `finance.transactions`, `finance.budgets`, `finance.reports`, `finance.subscriptions` | `keine-beratung` | `footer` |
| `finance.capture` | keiner im Eingabeweg (schnelle Erfassung); Hinweis im Ergebnis-Screen | – |
| `finance.networth` | `keine-beratung` | `footer` |
| `finance.business` | `steuer` + `keine-beratung` | `inline` + `footer` |
| `savings.calculator`, `savings.goals`, `savings.plan-detail` | `modellrechnung` direkt am Ergebnis, `keine-beratung` | `inline` + `footer` |
| `savings.plans`, `savings.calendar` | `keine-beratung`, Plan-Tracker-Satz (Abschnitt 8) | `footer` |
| `trading.home`, `trading.portfolio`, `trading.watchlist`, `trading.detail` | `simulation`, `kursdaten`, `keine-beratung` | `banner` + `inline` + `footer` |
| `trading.order` | `simulation` (nicht wegklickbar), `kursdaten`, `keine-beratung` | `banner` + `inline` |
| `trading.tax`, `trading.dividends` | `steuer`, `kursdaten` | `inline` |
| Position oder Watchlist-Eintrag vom Typ Krypto (Welt: `w-btc`) | `krypto` | `inline` am Eintrag |

Beim ersten Öffnen eines Moduls mit `legal` erscheint einmalig der Dialog „Verstanden“ (Muster: Kurztext + [Verstanden] [Mehr erfahren]). Die Zustimmung liegt im Einstellungszustand und ist in Einstellungen › Datenschutz zurücksetzbar.

## 3. Annahmen immer mit Stand-Datum

- Jede Rechnung, die auf einer Annahme beruht (Rendite, Steuersatz, Inflation, Kosten), nennt Annahme **und** Stand: „Annahme · 5 % p. a. · Stand 24.11.2026“. Annahmen sind **Eingaben**, keine Wahrheit.
- Parameter stehen **nur** im Rechenkern, nie in Komponenten. Ist: `TAX_DE` mit `stand: '2026-01'` in `finmath.js`. Ziel: `TAX_PARAMS` mit Feld `asOf` (Bauplan 5.8) und Anzeige „Annahmen Stand: …“.
- Ändert sich ein Parameter, ändert sich `asOf` und der Hinweistext (`steuer`: „Annahmen Stand 01/2026“) mit; kein Hinweis darf ein veraltetes Datum tragen (Prüfung: Hinweistext liest `asOf`).
- Konvention der Verzinsung wird **genannt**: „Zins p. a., monatlich verzinst (nominal), Einzahlung am Monatsende“ (Abschnitt 4.3).

## 4. Spannen statt Einzelwert bei Prognosen

### 4.1 Regel

Eine Projektion wird **nie als einzelne Zahl** gezeigt, sondern als Spanne bei **3 %, 5 % und 7 %** Rendite pro Jahr (Annahme, Nutzer kann ändern). Darstellung: Band mit Mittellinie und Beschriftung der drei Annahmen. Kennzahl im Text als Bereich („zwischen 116.698 € und 196.665 €“). Einzahlungen und Erträge werden getrennt genannt.

Formulierung: im Konjunktiv und mit Annahme („Bei 5 % Rendite pro Jahr wären es etwa 150.437 €“), nie als Versprechen („Du hast dann 150.437 €“). Keine Ampel, keine Bewertung („gut“, „zu wenig“) einer Projektion.

### 4.2 Referenzwerte (Tests)

Startbetrag 10.000 €, Sparrate 300 € pro Monat nachschüssig, 20 Jahre, Einzahlungen gesamt 82.000 €. Referenzrechnung mit **nominaler** Monatsverzinsung (Jahreszins / 12):

| Rendite | Endwert | Ertrag |
|---|---|---|
| 3 % | 116.698,15 € | 34.698,15 € |
| 5 % | **150.436,50 €** | 68.436,50 € |
| 7 % | 196.665,39 € | 114.665,39 € |

Prüfbare Formel für die Tabelle (nominal): `10000 * (1 + r / 12) ** 240 + fvAnnuityNominal(300, r, 240)` ergibt 116.698,15 / 150.436,50 / 196.665,39 für r = 0,03 / 0,05 / 0,07 (am Stichtag nachgerechnet). Ein Test mit diesen drei Werten fehlt in `tests/finmath.test.mjs` und ist Teil des Wunsches an MOD-SAV. Weitere Referenzen (`tools/test-finmath.mjs`): 100 €/Monat, 7 %, 10 Jahre = 17.308,48 €. Steuerbeispiel: 1.500 € Gewinn Aktien-ETF, 30 % Teilfreistellung, 1.000 € Pauschbetrag, 25 % + 5,5 % Soli → **13,19 €** (`estimateTax`: steuerpflichtig 50 €, Steuer 13,19 €; stimmt).

### 4.3 Ist-Abweichung (bitte vor der Umsetzung klären)

- `projectSavings` rechnet mit dem **effektiven** Monatszins `(1 + p.a.)^(1/12) − 1`. Für das Referenzbeispiel ergibt das bei 5 % **148.274,32 €** statt 150.436,50 €, bei 3 % 116.117,45 € und bei 7 % 190.957,76 €. Der Bauplan nennt 150.436,50 € als Testwert; die vorhandenen Tests prüfen nur `fvAnnuityNominal` gegen 17.308,48 €.
- `savingsScenarios` hat die Standardspanne **2 % / 6 % / 9 %** („pessimistisch, erwartet, optimistisch“) statt 3 / 5 / 7 %. Auch die Namen „pessimistisch“ und „optimistisch“ sind zu vermeiden, weil sie als Prognose lesbar sind (Ziel: „vorsichtig“, „Annahme“, „zuversichtlich“ oder nur die Prozentwerte).
- **Entscheidung für neue Arbeit (Annahme):** Ziel ist die **nominale** Konvention, weil Sparplan-Anbieter und die Referenzwerte so rechnen. Bis `finmath.js` angepasst ist, nennt jede Anzeige die Konvention und das Referenzbeispiel gilt als Test, der erst nach der Anpassung grün wird (Wunsch an INF-2/MOD-SAV, siehe Bericht).

## 5. Umbuchung ist neutral

- Eine **Umbuchung** (`type: 'transfer'`) verschiebt Geld zwischen eigenen Konten (Girokonto → Tagesgeld, Girokonto → Depot, Geschäftskonto → Girokonto). Sie ist **weder Einnahme noch Ausgabe**.
- Sie zählt **nicht** in Budgets, Cashflow, Einnahmen/Ausgaben und **Sparquote** (Ist: `savingsRate` in `finmath.js` überspringt `transfer`; Budget-Ist summiert nur `expense`).
- Sparplan-Raten sind Umbuchungen Girokonto → Depot oder Tagesgeld. Der Gesamtbetrag „gespart“ wird getrennt ausgewiesen (Summe der Umbuchungen mit Kategorie `Sparen`), damit er sichtbar ist, ohne Ausgabe zu sein. Welt (Ist): 575 € im November.
- **Beide Seiten** einer Umbuchung tragen denselben Typ. Der Kontoverlauf zeigt sie mit Symbol (Pfeil ↔) und ohne Gewinn-/Verlustfarbe: „Umbuchung auf Depot“.
- **Eingabe:** Im Erfassen-Weg ist „Umbuchung“ ein eigener Modus mit Quell- und Zielkonto, nie eine Kategorie. Rückgängig immer möglich.

**Ist-Abweichung in der Welt (`seed/world/finance.js`):** `t16` „Privatentnahme“ (Giro, +4.200 €) trägt `type: 'income'`, die Gegenbuchung `t17` (Geschäftskonto, −4.200 €) dagegen `type: 'transfer'`. Dadurch enthält `financeSummary.income` 7.152,40 € (Privatentnahme 4.200 € plus Shop-Auszahlungen 2.952,40 €) und die Sparquote erscheint mit **72,4 %**. Ohne die Privatentnahme läge der Wert bei etwa 33 % (Einnahmen 2.952,40 €, Ausgaben 1.975,52 €). Regel: Die Privatentnahme ist in der Gesamtsicht eine Umbuchung. Betriebssicht und Privatsicht müssen **benannt** sein („Privat“, „Betrieb“, „Alles“). Wunsch an MOD-FIN, siehe `DATENWELT.md` Abschnitt 8.

## 6. Rundung und Summen

| Nr. | Regel |
|---|---|
| R1 | Beträge werden **kaufmännisch auf Cent** gerundet: Halbwerte „weg von null“ (0,005 → 0,01; −0,005 → −0,01). |
| R2 | **Summen entstehen aus ungerundeten Werten** und werden erst am Ende einmal gerundet. Eine angezeigte Summe darf um bis zu 0,01 € von der Summe der angezeigten Zeilen abweichen. |
| R3 | Beträge mit Geldwirkung werden intern als **ganze Cent** geführt (Ziel, Bauplan-Idee `money.js`) oder mit R1 gerundet. |
| R4 | Anzeige: Umsätze mit 2 Nachkommastellen; Vermögen, Ziele und Hero-Zahlen ohne Cent, wenn der Zusammenhang es erlaubt (`cents: 'auto' | 0 | 2`). **Pro Screen einheitlich.** |
| R5 | Prozent mit einer Nachkommastelle und Komma; **Prozentpunkte** als „PP“, nie als „%“. Stückzahlen bis 6 Stellen, Krypto bis 8. |

**Prüftabelle (Soll):** 1,005 → 1,01 · 2,675 → 2,68 · −0,005 → −0,01 · −2,675 → −2,68 · 1.234,565 → 1.234,57.

**Ist-Abweichung:** `r2(x) = Math.round(x * 100) / 100` in `finmath.js` und in den Rechnern der Module rundet 1,005 auf 1,00 (Gleitkomma), −2,675 auf −2,67 (negative Halbwerte zur Null) und −0,005 auf −0. Die Anzeige in `lib/format.js` (`Intl`) rundet Halbwerte von null weg und verhindert „−0,00“, die Rechenkerne tun das noch nicht. Ziel: gemeinsame Rundungsfunktion `round2(x) = (Math.sign(x) * Math.round((Math.abs(x) + 1e-9) * 100)) / 100 + 0` (der Summand `+ 0` macht aus −0 ein 0; gültig bis etwa 10 Mio. €) oder Ganzzahl-Cent; Test mit der Prüftabelle in `tests/finmath.test.mjs`. Gegenprobe der Formel: −0,001 → 0 (nicht −0), −0,005 → −0,01, 1,005 → 1,01.

## 7. Privatmodus, Format, Vorzeichen

### 7.1 Privatmodus („Beträge ausblenden“)

- Schalter in Schnelleinstellungen, Einstellungen › Datenschutz und in der Werkzeugleiste des Launchers. Wirkt über `ctx.privacy`.
- **Gleich breite Maske:** Beträge werden durch eine **feste** Maske ersetzt, die Layout und Größenordnung nicht verrät: „•••• €“ (vier Punkte, geschütztes Leerzeichen, Einheit; `min-width` in `ch`, `tabular-nums`). Prozent: „•• %“. Die Maske hängt **nicht** vom Wert ab, damit es beim Umschalten keinen Layoutsprung und keinen Rückschluss auf die Größenordnung gibt.
- `aria-label` „Betrag ausgeblendet“. Antippen blendet **einen** Betrag für 3 Sekunden ein (Ziel).
- Maskiert werden: Kontostände, Buchungsbeträge, Raten, Budgets, Depotwerte, Gewinne in € und %, Achsenbeschriftungen und Tooltips von Diagrammen, Beträge in Mitteilungen, Suchtreffern und Widgets, `aria-label`, `title`, Teilen-Texte.
- **Nicht** maskiert (Ausnahmeliste, Annahme): Kursdaten öffentlicher Wertpapiere (Marktdaten, keine privaten Beträge), Prozent-Fortschritt eines Sparziels ohne Betrag, Termine und Texte.
- Prüfweg: DOM-Scan über alle Finanz-Features bei aktivem Privatmodus (QA-Probe `privacy-clean`, INF-6): kein sichtbarer Betrag.
- **Ist:** `maskMoney()` in `lib/format.js` (INF-2, neu) und `money()` in `helpers.js` liefern „•••• €“, `percent()` „•• %“. Es fehlen `aria-label` „Betrag ausgeblendet“, Antippen zum kurzen Einblenden und die Ausnahmeliste. `money()` delegiert am Stichtag noch nicht an `fmtMoney` (Ziel, Bauplan 5.8).

### 7.2 Format (Bauplan 5.8)

de-DE, Tausenderpunkt, Dezimalkomma, **geschütztes Leerzeichen** (U+00A0) vor der Einheit, **echtes Minus** U+2212, `tabular-nums`, rechtsbündig. Ist: `lib/format.js` ist die einzige Stelle mit `Intl.NumberFormat`; ein Wert, der nach dem Runden 0 ergibt, bekommt nie ein Minus („−0,00 €“ gibt es nicht); fehlende Werte zeigen „–“. Die 14 Referenzwerte stehen als `FORMAT_EXAMPLES` im Code und werden in `tests/format.test.mjs` geprüft. Auszug:

| Aufruf | Anzeige |
|---|---|
| `fmtMoney(0)` | `0,00 €` |
| `fmtMoney(-0.01)` | `−0,01 €` |
| `fmtMoney(1234567.89)` | `1.234.567,89 €` |
| `fmtMoney(9999999.99)` | `9.999.999,99 €` (kein Überlauf bei 360 px) |
| `fmtMoney(1234.5, {cents:false})` | `1.235 €` |
| `fmtMoney(12.5, {sign:true})` | `+12,50 €` |
| `fmtPercent(0.05)` | `5,0 %` |
| `fmtPercent(-0.0123, {sign:true})` | `−1,2 %` |
| `fmtPP(0.012)` | `+1,2 PP` |
| `fmtNumber(0.00001234, {unit:'BTC', digits:8})` | `0,00001234 BTC` |

Das Leerzeichen vor Einheit und Währung ist in allen Zeilen ein geschütztes Leerzeichen. Ist: `money()`/`percent()` in `helpers.js` rufen weiterhin `Intl` direkt auf (Ziel: delegieren an `lib/format.js`; `Intl` und `toLocale*` nur noch dort, Prüfung durch `check`).

### 7.3 Vorzeichen und Pfeil zusätzlich zur Farbe

Gewinn und Verlust werden **immer** durch Vorzeichen (`+`, `−`) und Pfeilsymbol (▲/▼ bzw. Icon) **zusätzlich** zur Farbe gekennzeichnet. Farbe ist nie das einzige Merkmal (Barrierefreiheit, Graustufen, Farbsehschwäche).

| Beispiel (Welt, Ist) | Anzeige |
|---|---|
| All-World, Gesamtgewinn | `+3.399,56 € (+23,2 %) ▲` |
| Apple, Tagesveränderung | `−1,0 % ▼` |
| Emerging Markets, Tagesveränderung | `−0,5 % ▼` |
| Neutral / unverändert | `±0,00 €` ohne Farbe |
| Umbuchung | `Umbuchung 300,00 €` ohne Vorzeichenfarbe |

Farbwahl: Gewinn `--tk-c-success`, Verlust `--tk-c-danger` (Finanz-Kontext, im Unterschied zu Gesundheit erlaubt). `--tk-c-danger` ist **nur** für echte Verluste und Fehler gedacht. **Budget über Plan** zeigt `--tk-c-warning` plus Text („14,50 € über dem Budget“); Beispiel Freizeit 164,50 € von 150 € (Welt, Ist).

## 8. Sparpläne sind Plan-Tracker

- Ein Sparplan in TAKT ist ein **Plan mit Erinnerung**. Er wird beim Broker oder bei der Bank angelegt, TAKT erinnert, gleicht ab und zeigt die Wirkung.
- Pflichtsatz in `savings.plans`, `savings.create`, `savings.calendar` und im Leerzustand: **„Dieser Sparplan wird nicht von TAKT ausgeführt. Du trägst ihn bei deinem Broker ein, TAKT erinnert dich und gleicht ab.“**
- **Ausführung manuell bestätigen** („Ausgeführt am 02.11.“); daraus entsteht eine Umbuchung (Abschnitt 5) und, wenn Positionen verknüpft sind, die Positionsänderung.
- **Ausführungstermin:** Fällt der Tag auf ein Wochenende oder einen Feiertag, wird auf den nächsten Handelstag verschoben und der Hinweis „wird am Mo, 16.11. ausgeführt“ gezeigt. Ist: `nextExecutions` verschiebt Samstag und Sonntag auf Montag, **ohne Feiertage**; Ziel: Feiertage als Parameter.
- **Deckungs-Check:** „Am 01.12. fehlen 120,00 € auf dem Girokonto für alle Sparpläne.“ als Hinweis (`--tk-c-warning`), nie als Alarm.
- Welt (Ist): 5 Pläne, 4 aktiv (All-World 300 €, Emerging Markets 75 €, World IT 50 €, Notgroschen 150 €), E-Bike pausiert bis 15.01.2027. Summe aktiver Raten **575 €** = Umbuchungen „Sparen“ im November. Der Plan Emerging Markets (Tag 15) ist am Sonntag 15.11. gebucht; nach der Regel oben wäre der Montag 16.11. richtig (Hinweis an MOD-SAV).

## 9. Steuerparameter (Annahme, vor Veröffentlichung prüfen)

**Stand der Annahmen: 01/2026** (so im Code: `TAX_DE.stand`). Nichts davon ist geprüft.

| Parameter | Wert | Hinweis |
|---|---|---|
| Sparer-Pauschbetrag | **1.000 €** (Einzelveranlagung), **2.000 €** (Zusammenveranlagung) | Ist: `TAX_DE.sparerPauschbetrag`. Welt: `taxAllowance` 1.000 €, davon 312,40 € genutzt (Trade Republic). |
| Abgeltungsteuer | **25 %** | `TAX_DE.abgeltungsteuer` |
| Solidaritätszuschlag | **5,5 %** auf die Abgeltungsteuer | `TAX_DE.soli`. Effektiv **26,375 %** ohne Kirchensteuer (`TAX_DE.effektiv`, getestet). |
| Kirchensteuer | 8 % oder 9 % der Abgeltungsteuer (je nach Bundesland), **optional** | Mit Kirchensteuer ergibt sich effektiv etwa 27,8 % (8 %) bzw. 28,0 % (9 %), weil sich die Abgeltungsteuer verringert. Ist: nicht berechnet („ohne Kirchensteuer“). |
| Teilfreistellung Aktienfonds | **30 %** | Ist: `teilfreistellungAktienfonds`. Mischfonds 15 %, Immobilienfonds 60 % (Auslandsimmobilien 80 %) sind Annahmen und im Code nicht enthalten. |
| Vorabpauschale | thesaurierende Fonds: jährlicher fiktiver Ertrag, abhängig vom **Basiszins**, belastet im Januar des Folgejahres | Ist: nicht berechnet („ohne Vorabpauschale“). Ziel: Hinweis im Januar (die Persona hält thesaurierende ETFs); Rechnung erst, wenn der Basiszins mit Stand gepflegt ist. |
| Verlusttöpfe | Aktienverluste nur mit Aktiengewinnen verrechenbar, übrige Verluste allgemein | Ziel: Hinweis, keine Rechnung. |
| Kryptowerte | privates Veräußerungsgeschäft: Haltefrist 1 Jahr, Freigrenze 1.000 € | Annahme, prüfen. Countdown („noch 112 Tage bis zur Haltefrist“ ist ein Beispieltext, die Welt hat keinen Krypto-Kauf) nur als Orientierung. |
| Selbstständige | Umsatzsteuer 19 % oder 7 % im Bruttoumsatz enthalten (Beispiel: 1.000 € brutto bei 19 % → 159,66 € Umsatzsteuer); Einkommensteuer-Vorauszahlung 10.03., 10.06., 10.09., 10.12. | Gilt für `finance.business` (Skelett). Kein GoBD-konformes Buchführungswerkzeug. |
| Freistellungsaufträge | Summe aller Aufträge darf den Pauschbetrag nicht übersteigen | Überzuteilung ist ein Fehlerzustand und blockiert das Speichern. |

Mustertext Steuer-Karte: „Noch 687,60 € vom Sparer-Pauschbetrag frei (Annahme, Stand 01/2026). Orientierung, keine Steuerberatung.“ (1.000 € − 312,40 €).

Pflicht: Jede Anzeige eines Steuerwerts trägt den `steuer`-Hinweis **und** „Annahme, vor Veröffentlichung prüfen“ solange das Projekt nicht freigegeben ist. Änderung eines Parameters erfolgt nur im Rechenkern.

## 10. Keine Orderausführung, keine Empfehlung

- Das Order-Ticket ist **Simulation**. Aktionsknopf: **„Order simulieren“**. Bestätigung: „Simulierte Order gespeichert. Es wurde nichts ausgeführt.“ Nie „Kaufen“, „Jetzt handeln“, „Order erteilt“.
- Plausibilitätsschutz (Betrag über Depotverrechnung, Limit weit vom Kurs, Menge 0) erklärt ruhig, was nicht passt, und blockiert nur Unmögliches.
- Keine Broker-Logos, keine Verkaufs- oder Kaufsignale, keine „Tipps“, keine Hervorhebung einzelner Wertpapiere als „Favorit“ durch TAKT.
- Kursalarme informieren über den Kurs („NVIDIA unter 115 €“), sie empfehlen nichts.
- Diese Wörter sind in den Modulen `finance`, `savings`, `trading` verboten (maschinenlesbar, gleiches Format wie in `HEALTH_GUIDELINES.md`, Abschnitt 9.1; Ziel für `tools/check.mjs`):

<!-- finanzbegriffe:start -->
```text
# Empfehlungen und Versprechen
kaufempfehlung
verkaufsempfehlung
garantiert
risikolos
/\bsicher(e|er|es)?\s+(rendite|gewinn|anlage|investition)/i
/\bjetzt\s+(kaufen|investieren|handeln)\b/i
/(geheimtipp|anlagetipp|börsentipp|aktientipp)/i
/\bdu\s+wirst\s+[^!?\n]{0,40}\b(haben|erreichen|verdienen)\b/i
/\bgewinn(e)?\s+(garantiert|sicher)/i
# Falsche Ausführungswirkung
/\border\s+(wurde\s+)?(ausgeführt|erteilt|platziert)\b/i
/\bkauf\s+abgeschlossen\b/i
```
<!-- finanzbegriffe:end -->

Zitate in „…“ in Anforderungen und Akzeptanzkriterien sind erlaubt (wie in `HEALTH_GUIDELINES.md`).

## 11. Herleitbarkeit und Datenstand

- **Jede Kennzahl ist herleitbar.** „Frei verfügbar bis Monatsende“ trägt „Wie berechnet?“ mit den Posten (Saldo, anstehende Fixkosten, geplante Sparraten, Reserven, Tage bis Monatsende). Ziel: `safeToSpend()` in `finmath.js`.
- **Datenstand ehrlich benennen:** „Stand 09:30“, „Offline, Stand 09:15“, „Kurse verzögert“. Fiktive Daten heißen „fiktiv (Demo)“.
- Alle Welt-Werte sind **fiktiv**. ISINs der Demo sind real, Kurse und Bestände erfunden. Kein Hinweis darf Realdaten behaupten.

## 12. Prüfliste je Variante

| Nr. | Prüfpunkt | Prüfweg |
|---|---|---|
| F1 | Pflichthinweise nach 2.3 sichtbar, Stil nach 2.2 | Probe `legal-present`, `check` statisch |
| F2 | Simulation/Krypto-Banner nicht wegklickbar | E2E |
| F3 | Keine Treffer in `finanzbegriffe` | `check` statisch |
| F4 | Prognosen als Spanne 3/5/7 %, Annahme + Stand genannt | Review, Test der Spanne |
| F5 | Umbuchung zählt nicht in Budget, Cashflow, Sparquote | `npm test` (Welt-Invariante, `finmath`) |
| F6 | Rundung nach Prüftabelle in Abschnitt 6 | `npm test` |
| F7 | Privatmodus: kein sichtbarer Betrag im DOM, Maske gleich breit | Probe `privacy-clean` |
| F8 | Vorzeichen und Pfeil zusätzlich zur Farbe, Minus = U+2212 | Probe `money-format` |
| F9 | Steuerwerte aus `TAX_DE`/`TAX_PARAMS`, nie hartkodiert | `check` (Zinsformeln und Sätze in Komponenten melden) |
| F10 | Referenztests (150.436,50 €, 13,19 €) grün | `node tools/test-finmath.mjs` (18 Tests, Ist grün), `tests/finmath.test.mjs` |
| F11 | Plan-Tracker-Satz in Sparplan-Features | Review |
| F12 | Kein horizontaler Überlauf bei 9.999.999,99 € auf 360 px | Probe |

## 13. Offene Punkte und Annahmen

- **Rechtsprüfung** aller Hinweistexte und Steuerangaben vor jeder Veröffentlichung (BAUPLAN_PAKETE `decisionsForUser` Nr. 10). Wer prüft und wann: offen.
- **Verzinsungskonvention** (nominal gegen effektiv) und Standardspanne (3/5/7 gegen 2/6/9): offen, Arbeitsannahme nominal und 3/5/7.
- **Kursdatenquelle** (kostenlos verzögert gegen lizenziert): offen, Demo fiktiv.
- **Kontoanbindung** (Import statt Aggregator): Empfehlung, Entscheidung offen.
- **Kirchensteuer, Basiszins, Teilfreistellung weiterer Fondstypen:** Parameter fehlen im Code, bis zur Pflege Hinweis statt Rechnung.
- **Android-Schutz** (FLAG_SECURE, Biometrie, verschlüsselter Speicher): in der Workbench nur beschreibbar, nicht prüfbar; Test im Flutter-Projekt.
