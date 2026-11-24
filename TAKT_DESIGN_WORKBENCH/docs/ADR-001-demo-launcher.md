# ADR-001: Demo-Launcher als HTML/PWA auf der Preview-Runtime

> **Stand:** 24.11.2026 · **Status:** angenommen für Basis v1 (Arbeitsstand aus dem Bauplan). Reversibilität: **aufwendig**. **Wiedervorlage:** nach dem ersten Gerätetest-Meilenstein (`GERAETETEST.md`) und nach Phase 1 (Abgleich mit dem echten TAKT-Projekt).
> **Gültigkeit:** gilt für den Demo-Launcher (`app/launcher.html`) und alle Ansichten, in denen TAKT als ganze App erlebbar ist. Nicht verbindlich für die Technik der echten App (Flutter).
> **Zugehörige Dateien:** `app/launcher.html` · `app/src/launcher/launcher.js`, `launcher.css`, `devices.js` · `app/preview.html`, `app/src/preview/runtime.js` (AppPlayer) · `app/sw.js` · `app/manifest.webmanifest` · `app/icon.svg` · `server.mjs` (`/api/network`, `/api/feedback`) · `package.json` (`npm run lan`) · `docs/BAUPLAN.md` (4, 12, 13) · `docs/ADR-002-datenhaltung.md` · `docs/GERAETETEST.md`.

## 1. Kontext

Der Nutzer will TAKT V2.0 (Flutter) als **ganze, bedienbare App** in mehreren Versionen (Kompakt, Visuell, Fokus) auf dem Laptop **und** auf dem Handy ansehen, vergleichen und entscheiden, bevor ein Modul in Flutter gebaut wird. Randbedingungen:

- Die Entwicklungsumgebung der Workbench hat **kein Flutter-SDK und kein Android-SDK**. Prüfung läuft mit Node und Chromium (Playwright).
- Es gibt bereits eine **Preview-Runtime** (Preact und htm ohne Build) mit anfangs 45+, inzwischen 296 Komponenten, Tokens, deklarativen Varianten, Navigationsregeln, einem App-Player und einer QA-Sonde.
- Der Rohbau des Launchers existiert (Versionskarten, Rahmen, gekoppelte Navigation, Bewertung, QR-Code, Feedback an die Workbench, Service Worker, Manifest).
- Das Handy ist ein **Android-Gerät** (Annahme, `PERSONA.md`); das Netz ist ein Heim-WLAN.

## 2. Entscheidung

Der Demo-Launcher ist eine **HTML/PWA-Seite auf derselben Preview-Runtime**. Jede Version der App läuft als eigener Iframe auf `preview.html` (Modus „App“). Auf dem Laptop zeigt der Launcher bis zu mehrere Versionen im Telefonrahmen nebeneinander, auf dem Handy füllt die gewählte Version den Bildschirm ohne Rahmen. Bewertungen vom Handy gehen als Feedback an die Workbench, Entscheidungen fallen am Laptop.

Gründe: wiederverwendbare Komponenten und Tokens, deklarative Varianten bleiben erhalten, mit Playwright prüfbar, auf Handy und Laptop identisch, kein SDK nötig, installierbar (unter den Bedingungen von Abschnitt 5).

## 3. Verworfene und verschobene Optionen

| Option | Gründe | K.-o.-Kriterium oder Anwendungsfall |
|---|---|---|
| **Flutter Web** | Alle (inzwischen 296) Komponenten müssten in Dart doppelt entstehen, die deklarative Variantenmechanik und die QA-Sonde gingen verloren, der Start ist durch die Engine groß (Größenordnung 2 MB, Annahme), kein SDK in der Umgebung | **K.-o.:** kein Flutter-SDK hier. Sinnvoll später als Abgleich zu Hause (Phase 1), nicht als Entscheidungswerkzeug |
| **Electron oder Tauri** | Löst nur den Laptop-Fall, nicht das Handy. Tauri braucht eine Rust-Toolchain, Electron ist schwer und bringt Update-Pflichten | **K.-o.:** deckt das Handy nicht ab |
| **Capacitor oder TWA** (Android-Hülle) | Braucht Android-SDK, JDK und für TWA HTTPS-Hosting; für Entscheidungen im Heimnetz Aufwand ohne Gewinn | **Später:** APK-Hülle um dieselbe Seite als Hausaufgabe auf dem eigenen Rechner, wenn die PWA-Installation nicht reicht |
| **Nur Screenshots oder Wegwerf-HTML** | genau das, was die Workbench ersetzen soll (Mission) | **K.-o.:** nicht klickbar, nicht prüfbar |

Bewertung der gewählten Option gegen die Kriterien: Aufwand **gering** (Rohbau vorhanden), Wiederverwendung der Komponenten **voll**, Treue zum Flutter-Gefühl **mittel** (Abschnitt 6), Handy und Laptop **identisch**, Offline **nur im Secure Context** (Abschnitt 5), automatische Prüfung **ja**, Pflege **ohne SDK** möglich.

## 4. Folgen

**Positiv**

- Jede Verbesserung einer Komponente wirkt in allen Versionen und im Launcher.
- Entscheidungen entstehen aus bedienbaren Versionen mit Abdeckungsanzeige, nicht aus Einzelbildern.
- QA und Gerätetest verwenden dieselbe Basis (`preview.html?app=1&version=dir:<richtung>`).

**Negativ oder zu beachten**

- Der **Gefühlsunterschied zu Flutter** (Abschnitt 6) ist dauerhaft. Die Demo entscheidet über Layout, Hierarchie und Navigation, **nicht** über Mikro-Interaktionen.
- **Secure Context im LAN** (Abschnitt 5) begrenzt Offline-Fähigkeit und Installation auf dem Handy.
- Mehrere Iframes mit der ganzen Welt (Größe des Payloads, `DATENWELT.md` Abschnitt 5.1) können auf einfachen Handys ruckeln. Auf dem Handy läuft deshalb immer nur **eine** Version.
- Der **Schreibzugriff** der Workbench darf nie über das LAN möglich sein (Regel 3 in `CLAUDE.md`, Freigaben sind gesperrt). Ausnahme ist nur das append-only Feedback.
- Browser-Unterschiede (iOS Safari, View Transitions, Wake Lock, Orientation Lock) sind hier **nicht testbar**. iOS gilt als ungeprüft.

## 5. Secure Context, LAN und adb reverse

### 5.1 Das Problem

Über `http://192.168.x.x:4317` ist die Seite **kein Secure Context**. Folgen auf dem Handy: **kein Service Worker, keine Installierbarkeit als PWA, kein Wake Lock, keine Clipboard-API**. Der Launcher registriert den Service Worker nur, wenn `window.isSecureContext` wahr ist (`launcher.js`). Die Seite selbst läuft im LAN normal, nur eben ohne Offline-Cache.

### 5.2 Wege (Reihenfolge nach Aufwand)

| Weg | Befehle | Secure Context | Hinweis |
|---|---|---|---|
| **A. LAN (QR-Code)** | `npm run lan`, Handy im gleichen WLAN, QR im Launcher („Aufs Handy“) oder `http://<PC-IP>:4317/launcher.html` | **nein** | Schnellster Weg für Aussehen und Bedienen. Windows-Firewall „Privates Netzwerk“ erlauben. VPN oder Gastnetz stören. |
| **B. `adb reverse`** | USB-Debugging am Handy einschalten, `adb devices`, `adb reverse tcp:4317 tcp:4317`, am PC `npm start` (oder `npm run serve`), am Handy `http://localhost:4317/launcher.html` | **ja** (localhost) | Service Worker und Installation wirken. Entfernen: `adb reverse --remove tcp:4317`. Erfordert Android-Debug-Bridge auf dem PC. |
| **C. Statisches Export-Paket auf HTTPS** | geplant als `npm run demo:export` (Ziel, nicht umgesetzt), Ordner auf ein statisches HTTPS-Hosting legen | **ja** | Läuft ohne PC, Feedback dann per Export und Import. Hosting und Datenschutz bewusst prüfen. |
| **D. Tunnel** (z. B. ein HTTPS-Tunnel zum PC) | Werkzeug nach Wahl | **ja** | Öffnet den PC nach außen: nur mit PIN und nur kurz, keine echten Daten. Nicht empfohlen. |

### 5.3 Wichtige Folge von Weg B (Schreibzugriff)

Über `adb reverse` erscheint das Handy dem Server als **lokaler** Aufrufer (Quelladresse 127.0.0.1, Host `localhost`). Der Launcher unterscheidet nach `location.hostname` und hält die Seite dann für **lokal** (`LOCAL`): Er lädt den Workbench-Store und **schreibt Entscheidungen direkt** (`PUT /api/state` mit Revision). Das ist praktisch, kann aber zu 409-Konflikten mit dem Laptop führen (Konfliktregel in `ADR-002-datenhaltung.md`). **Empfehlung:** Für reines Bewerten am Handy Weg A verwenden (nur Feedback, schreibgeschützt) oder bei Weg B nur lesen und bewerten. Ein Parameter `?readonly=1` ist ein Wunsch an INF-4.

### 5.4 Ist-Stand der Hülle

| Teil | Ist (24.11.2026) | Ziel (INF-4) |
|---|---|---|
| `sw.js` | Cache `takt-launcher-v1`, Vorab-Cache: `launcher.html`, `preview.html`, `manifest.webmanifest`, `icon.svg`; statische Dateien „Cache zuerst, im Hintergrund aktualisieren“, `/api/` „Netz zuerst“, `/api/state` wird zwischengespeichert; **kein Vorab-Cache der Module** | Dateiliste mit Hash, Update-Hinweis „Neuer Stand verfügbar“, sichtbarer Status „Offline nicht verfügbar: http im LAN“ |
| `manifest.webmanifest` | `display: standalone`, `start_url: ./launcher.html`, Icon nur `icon.svg` (`any` und `maskable`) | PNG 192 und 512, `maskable`, Farben aus den Tokens |
| MIME | erledigt: `server.mjs` liefert `.webmanifest` als `application/manifest+json` | – |
| Server | Bindung standardmäßig 127.0.0.1; `npm run lan` = `--host 0.0.0.0`; im LAN nur `GET`, Schreiben nur lokal; `POST /api/feedback` ist die einzige Ausnahme (20 KB je Eintrag, gleicher Origin, Schema 2, Rate-Limit 60 pro Minute je IP, Deduplizierung nach `id`, Rotation der Datei ab 5 MB); `GET /api/feedback?since=`, `GET /api/ping`; `/api/network` liefert LAN-Adressen, `boundTo` und (nur lokal) die PIN | **erledigt:** WLAN-PIN – `npm run lan` erzeugt bei jedem Start eine 6-stellige PIN (`--pin <n>` fest, `--no-pin` aus), im QR-Link als `?k=`, sonst Header `X-Takt-Pin`; ohne PIN beantwortet der Server anderen Geräten nur `/api/ping` (sonst 401); Test `server-pin` |
| Frames | Launcher koppelt Iframes über `window.__taktPreview.navigate`, `render`; Nachrichten `ready`, `route`, `interaction`, `select-block`; Rahmen-Auswahl (`shell`: tabs/launchpad/fokus) und `ctx.now` sind umgesetzt (INF-1 fertig) | Nachrichtenvertrag nach Bauplan 5.4 |

## 6. Bekannte Schwächen gegenüber Flutter (und was wir dagegen tun)

| Schwäche | Auswirkung | Gegenmaßnahme |
|---|---|---|
| **Scroll-Physik** (Trägheit, Overscroll) | Listen fühlen sich anders an | Nicht bewerten; im Gerätetest als „weicht ab“ notieren |
| **Ripple und Zustandsanimation** | Touch-Rückmeldung anders | Interaktionsspezifikation je Komponente (`flutter`-Feld im Komponentenvertrag, Bauplan 5.9) |
| **Haptik und Vibration** | im Web kaum und uneinheitlich | als Annahme in der Spezifikation vermerken |
| **Schriftdarstellung** | andere Glättung und Metriken als Flutter | Schrift Inter und JetBrains Mono lokal, falls Download möglich, sonst Hausaufgabe |
| **Tastaturverhalten** (Verdeckung, Visual Viewport) | andere Resize-Logik als Android-Flutter | Pflichtpunkt im Gerätetest |
| **Safe-Area** | Iframes erben `env(safe-area-inset-*)` nicht zuverlässig | Launcher liest die Insets aus und reicht sie durch (Ziel, `safe=`-Parameter) |
| **Predictive Back, Dynamic Color, Edge-to-Edge** | nicht abbildbar | eigene Entscheidungen (Bauplan 12), nur beschrieben |
| **Hintergrund-Timer, Kamera, Health Connect** | im Web nicht gleichwertig | bleiben Annahmen bis Test in Flutter (Bauplan 13) |

## 7. Offene Punkte

- **Handy über `adb reverse` als „lokal“**: Soll das Schreiben zugelassen bleiben? (Abschnitt 5.3)
- **Statisches Export-Paket** (`demo:export`) und HTTPS-Hosting: Priorität P1, Entscheidung über Hosting offen.
- **APK-Hülle** (Capacitor oder TWA): Hausaufgabe nur bei Bedarf, dann als eigene Anleitung.
- **iOS**: kein Test geplant, bis ein Gerät zur Verfügung steht.
- **Wiedervorlage**: nach dem ersten Gerätetest-Protokoll; ändern sich dann Annahmen zu Scroll, Tastatur oder Schrift, wird diese Entscheidung neu bewertet.
