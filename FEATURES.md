# Neue Features

## Toast Notifications
Ersetzt alle nervigen Browser-Alerts durch schöne Toast-Nachrichten:
- **Success** (grün): Erfolgreiche Aktionen
- **Error** (rot): Fehlermeldungen
- **Warning** (orange): Warnungen
- **Info** (blau): Informationen

Toasts erscheinen oben rechts und verschwinden automatisch nach 3,5 Sekunden.
Klicke auf einen Toast, um ihn sofort zu schließen.

## Loading States
Während lange Operationen laufen (z.B. CSV-Import), wird ein Loading-Overlay mit Spinner angezeigt:
- "CSV wird gelesen..."
- "Daten werden importiert..."
- "Wird gespeichert..."

## Verbesserte Fehlerbehandlung
Alle Fehler werden jetzt benutzerfreundlich angezeigt:
- **LocalStorage voll**: Zeigt konkrete Lösung (Browser-Cache leeren)
- **CSV-Fehler**: Klare Fehlermeldungen mit Details
- **Import-Probleme**: Hilfreiche Hinweise statt kryptischer Errors

## Copy/Paste Feature

### Zellen kopieren
1. Klicke auf eine Zelle mit Zahlenwert
2. **Mehrere Zellen auswählen**:
   - `Ctrl/Cmd + Klick`: Einzelne Zellen hinzufügen
   - `Shift + Klick`: Bereich zwischen zwei Zellen auswählen
3. `Ctrl/Cmd + C`: Ausgewählte Werte kopieren
4. Grüner gepunkteter Rahmen bestätigt das Kopieren

### Zellen einfügen
1. Wähle Zielzellen aus (gleiche Anzahl wie kopiert)
2. `Ctrl/Cmd + V`: Werte einfügen
3. Toast zeigt an, wie viele Werte eingefügt wurden

### Auswahl aufheben
- `ESC`: Hebt die aktuelle Auswahl auf
- Klick außerhalb der Tabelle: Hebt die Auswahl ebenfalls auf

### Visuelle Hinweise
- **Blaue Umrandung**: Aktuell ausgewählte Zellen
- **Grüner gepunkteter Rahmen**: Gerade kopierte Zellen
- **Hellblaue Hintergrundfarbe**: Ausgewählte Zellen

## Beispiel-Workflows

### Daten von einer Woche auf die nächste kopieren
1. Wähle alle Werte von KW1 aus (Shift + Klick)
2. `Ctrl/Cmd + C` zum Kopieren
3. Wähle die Zellen von KW2 aus
4. `Ctrl/Cmd + V` zum Einfügen
5. Toast bestätigt: "7 Werte eingefügt"

### Schnelles CSV-Import mit Feedback
1. Klicke auf "UPLOAD" im Header
2. Wähle CSV-Datei aus
3. Loading-Spinner erscheint: "CSV wird gelesen..."
4. Toast bestätigt: "CSV erfolgreich geladen"
5. Ordne Spalten zu
6. Loading-Spinner: "Daten werden importiert..."
7. Toast bestätigt: "31 Tage erfolgreich importiert!"

## Technische Details

### Neue Dateien
- `scripts/toast.js` - Toast Notification System
- `scripts/loading.js` - Loading State Management
- `scripts/clipboard.js` - Copy/Paste Feature
- `FEATURES.md` - Diese Dokumentation

### CSS-Erweiterungen
- Toast-Animationen mit Slide-In/Out
- Loading-Overlay mit Backdrop-Filter
- Cell-Selection Styles
- Responsive Toast-Positionierung (Mobile)

### Keyboard Shortcuts
- `Ctrl/Cmd + C`: Kopieren
- `Ctrl/Cmd + V`: Einfügen
- `ESC`: Auswahl aufheben
- `Shift + Klick`: Bereich auswählen
- `Ctrl/Cmd + Klick`: Mehrfachauswahl

### Browser-Kompatibilität
- Chrome/Edge: Vollständig unterstützt
- Firefox: Vollständig unterstützt
- Safari: Vollständig unterstützt
- Mobile Browser: Touch-Events funktionieren

## Bekannte Einschränkungen
- Copy/Paste funktioniert nur für Zahlenwerte (input type="number")
- Maximum 5 Toasts gleichzeitig (älteste werden automatisch entfernt)
- Copy/Paste funktioniert nur innerhalb des Trackers (nicht tabellenübergreifend)
