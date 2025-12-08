// --- Autobahn App API Beispiel: Sperrungen auf der A671 abrufen ---
function showCurrentClosures(autobahn) {
  const url = `https://verkehr.autobahn.de/o/autobahn/${autobahn}/services/closure`;
  fetch(url)
    .then(response => {
      if (!response.ok) throw new Error('Netzwerkantwort war nicht ok');
      return response.json();
    })
    .then(data => {
      const now = new Date();
      // Prüfe, ob das Array existiert
      const closures = Array.isArray(data) ? data : data.closures || [];
      const active = closures.filter(item => {
        const start = new Date(item.start);
        const end = new Date(item.end);
        return start <= now && end >= now;
      });
      // Zeige die Sperrungen im UI an
      const el = document.getElementById("autobahn-closures");
      if (el) {
        if (active.length === 0) {
          el.textContent = "Keine aktuellen Sperrungen.";
        } else {
          el.innerHTML = active.map(item =>
            `<div>
              <strong>${item.description || "Sperrung"}</strong><br>
              Von: ${item.start}<br>
              Bis: ${item.end}
            </div>`
          ).join("<hr>");
        }
      }
    })
    .catch(error => {
      console.error(`Fehler beim Abrufen für ${autobahn}:`, error);
    });
}

// Beispielaufrufe:
showCurrentClosures('A3');
showCurrentClosures('A5');
showCurrentClosures('A60');
showCurrentClosures('A67');
showCurrentClosures('A671');

// Testdaten für Design-Check
const testClosures = [
  {
    description: "Fahrbahnerneuerung zwischen Wiesbaden und Mainz",
    start: "2025-12-08T08:00:00Z",
    end: "2025-12-10T18:00:00Z"
  },
  {
    description: "Brückenarbeiten bei Rüsselsheim",
    start: "2025-12-07T22:00:00Z",
    end: "2025-12-09T05:00:00Z"
  }
];

// Funktion zum Testen der Anzeige
function showTestClosures() {
  const el = document.getElementById("autobahn-closures");
  if (el) {
    el.innerHTML = testClosures.map(item =>
      `<div>
        <strong>${item.description}</strong><br>
        Von: ${item.start}<br>
        Bis: ${item.end}
      </div>`
    ).join("<hr>");
  }
}

// Zum Testen einfach aufrufen:
showTestClosures();
// --- Ende Autobahn App API Beispiel ---

function hashStringToInt(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h ^= str.charCodeAt(i), h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  return h >>> 0;
}

function mulberry32(a) {
  return function () {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function dayKeyWithCutoff(cutoffHourLocal = 5) {
  const now = new Date();
  // If current local time is before cutoff, use previous calendar day
  const d = new Date(now);
  if (d.getHours() < cutoffHourLocal) {
    d.setDate(d.getDate() - 1);
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function loadHoroscopes() {
  const res = await fetch("horoskop.csv");
  if (!res.ok) throw new Error("CSV konnte nicht geladen werden");
  const raw = await res.text();
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  const hasHeader = /überschrift/i.test(lines[0]) && /text/i.test(lines[0]);
  const dataLines = hasHeader ? lines.slice(1) : lines;

  const items = dataLines
    .map((l) => {
      const parts = l.split(";");
      if (parts.length < 2) return null;
      const title = parts[0].trim();
      const text = parts.slice(1).join(";").trim();
      if (!title || !text) return null;
      return { title, text };
    })
    .filter(Boolean);

  return items;
}

function pickDaily(items) {
  if (!items || items.length === 0) return null;
  const seed = hashStringToInt(dayKeyWithCutoff(5));
  const rnd = mulberry32(seed);
  const idx = Math.floor(rnd() * items.length);
  return items[idx];
}

function msUntilNextCutoff(cutoffHourLocal = 5) {
  const now = new Date();
  const next = new Date(now);
  next.setHours(cutoffHourLocal, 0, 0, 0);
  if (now >= next) {
    next.setDate(next.getDate() + 1);
  }
  return next - now;
}

function scheduleDailyReload(cutoffHourLocal = 5) {
  const ms = msUntilNextCutoff(cutoffHourLocal);
  if (ms > 0 && Number.isFinite(ms)) {
    setTimeout(() => {
      // Reload the page to pick up the new daily selection
      location.reload();
    }, ms);
  }
}

function renderHoroscope(itemOrMessage) {
  const el = document.getElementById("horoskop-content");
  if (!el) return;
  // If a string is provided, render it as a message
  if (typeof itemOrMessage === "string") {
    el.textContent = itemOrMessage;
    return;
  }
  const item = itemOrMessage;
  if (!item) {
    el.textContent = "Keine Horoskope gefunden.";
    return;
  }
  el.innerHTML = `<div class="fw-semibold">${item.title}</div><div>${item.text}</div>`;
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const items = await loadHoroscopes();
    const selection = pickDaily(items);
    renderHoroscope(selection);
  } catch (e) {
    renderHoroscope("Fehler beim Laden des Horoskops.");
  }
  // Auto-reload at the next cutoff (05:00 local time)
  scheduleDailyReload(5);

  // Set QR code and link to feedback page
  try {
    const feedbackUrl = new URL("feedback.html", location.href).toString();
    const qr = document.getElementById("feedback-qr");
    if (qr) {
      const size = 200;
      const api = "https://api.qrserver.com/v1/create-qr-code/";
      qr.src = `${api}?size=${size}x${size}&data=${encodeURIComponent(feedbackUrl)}`;
    }
    const link = document.getElementById("feedback-link");
    if (link) link.href = feedbackUrl;
  } catch (_) {
    // ignore QR/link errors
  }
});

