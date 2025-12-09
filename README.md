
# AlarmMonitor Horoskop & Autobahn-Sperrungen

Eine kleine, statische Web-App, die täglich um 05:00 Uhr lokal ein neues, zufälliges Horoskop aus einer CSV-Datei anzeigt. Zusätzlich werden aktuelle Sperrungen auf ausgewählten Autobahnen angezeigt, gefiltert nach für die Rettungswache relevanten Orten. Neben dem Horoskop wird ein QR‑Code angezeigt, der zu einer Feedback-Seite führt.

Einsatzkontext: Diese Seite ist für die Anzeige auf einem Alarmmonitor einer Rettungswache gedacht und wird in einer DIVERA 24/7 Umgebung genutzt.

Hinweis: Dieses Projekt ist ein Spaßprojekt, um Kolleg:innen mit etwas Humor und aktuellen Verkehrsinformationen durch den oft fordernden Dienstalltag zu begleiten.


## Features
- Tägliche, deterministische Zufallsauswahl aus `horoskop.csv`
- Tageswechsel um 05:00 Uhr (lokale Zeit); automatischer Reload genau zu diesem Zeitpunkt
- Automatischer Dark-/Light‑Mode via `prefers-color-scheme`
- QR‑Code neben dem Horoskop, verlinkt auf `feedback.html`
- Feedback-Seite öffnet das E‑Mail‑Programm mit vorbefülltem Betreff und Nachricht
- **Anzeige aktueller Sperrungen auf den Autobahnen A3, A5, A60, A67, A671**
- **Filterung der Sperrungen nach relevanten Orten (z. B. Mainz, Wiesbaden, Rüsselsheim, etc.)**


## Projektstruktur
```
.
├── index.html         # Startseite (Horoskop + QR-Code + Autobahn-Sperrungen)
├── index.css          # Styles inkl. Dark-Mode
├── index.js           # Logik: CSV laden, Auswahl, Auto-Reload, QR setzen, Sperrungen abrufen und filtern
├── horoskop.csv       # Datenquelle (Überschrift;Text)
├── feedback.html      # Feedback-Formular (mailto:)
└── feedback.css       # Styles für Feedback-Seite
```
## Sperrungsanzeige & Filterung

Die App ruft aktuelle Sperrungen von der offiziellen Autobahn-API für die Autobahnen A3, A5, A60, A67 und A671 ab. Es werden nur Sperrungen angezeigt, die für die Rettungswache relevant sind. Die Relevanz wird anhand von Ortsnamen und Anschlussstellen im Titel, Untertitel oder der Beschreibung der Sperrung geprüft.

**Beispiel für relevante Orte:**

```
const relevanteStichwoerter = [
  "Mainz", "Rüsselsheim", "Wiesbaden", "Darmstadt", "Raunheim", "Groß-Gerau",
  "Büttelborn", "Bischofsheim", "Mörfelden", "Langen", "Weiterstadt", "Ginsheim-Gustavsburg"
];
```

Nur Sperrungen, die einen dieser Begriffe enthalten, werden angezeigt. Die Anzeige erfolgt je Autobahn in einem eigenen Bereich.

**Angezeigte Informationen pro Sperrung:**
- Titel und Untertitel der Sperrung
- Beginn und Ende (aus der Beschreibung, hervorgehoben)

## CSV-Format
- Trennzeichen: Semikolon `;`
- Erste Zeile (Header) wird erkannt und übersprungen
- Jede weitere Zeile: `Überschrift;Text`

Beispiel:
```
Überschrift;Text
Tageshoroskop;Heute ist euer Tag! Zumindest bis der Melder geht.
Spruch des Tages;Ein guter Tag, um den Kollegen daran zu erinnern, dass 'gleich zurück' relativ ist.
```


## Funktionsweise der Auswahl
- Die Auswahl ist „willkürlich“, aber pro Tag stabil (deterministisch)
- Der Tageswechsel findet um 05:00 Uhr lokaler Zeit statt (nicht um Mitternacht)
- Ein Timer lädt die Seite genau um 05:00 neu, sodass automatisch das neue Horoskop erscheint

## Lokal starten
Da `fetch` genutzt wird, sollte die Seite über einen lokalen Webserver geöffnet werden (nicht via `file://`).

- Python (3.x):
  ```bash
  python3 -m http.server 8000
  ```
  Öffne dann: http://localhost:8000

- Node (serve):
  ```bash
  npx serve
  ```

## Deployment-Hinweise
- Statisches Hosting (z. B. GitHub Pages, Netlify, Vercel) funktioniert problemlos
- Achte darauf, dass `horoskop.csv` im selben Verzeichnis wie `index.html` liegt (fetch via relative URL)

## Feedback-Konfiguration
- In `feedback.html` wird ein `mailto:` Link erzeugt
- Passe die Zieladresse bei Bedarf in `feedback.html` an (Variable `to`, aktuell `feedback@example.com`)

## Anpassungen
- Dark-Mode-Farben in `index.css` und `feedback.css`
- QR‑Bildgröße: `index.html` (`#feedback-qr` width/height)
- Tageswechselzeit (aktuell 05:00): `dayKeyWithCutoff(5)` und `scheduleDailyReload(5)` in `index.js`
- Layout: Bootstrap-Grid in `index.html`

## Lizenz
MIT License – siehe [LICENSE](./LICENSE).

## Hinweis / Disclaimer
- Dieses Projekt dient ausschließlich der Unterhaltung. Es stellt keine medizinische Beratung dar und ist nicht für den klinischen Einsatz geeignet.
- Inhalte können ungenau, satirisch oder unvollständig sein.
- Keine Verbindung zu DIVERA 24/7: Dieses Projekt steht in keinem Zusammenhang mit, wird nicht unterstützt, gesponsert oder autorisiert von DIVERA 24/7 oder deren Betreiber:innen.
- Alle genannten Namen und Marken sind Eigentum der jeweiligen Rechteinhaber:innen.

English:
- This project is for entertainment purposes only. It does not constitute medical advice and is not intended for clinical use.
- Content may be inaccurate, satirical, or incomplete.
- No affiliation with DIVERA 24/7: This project is not affiliated with, endorsed by, sponsored by, or authorized by DIVERA 24/7 or its operators.
- All product names, logos, and brands are property of their respective owners.
