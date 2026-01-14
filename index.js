// --- Autobahn App API Beispiel: Sperrungen auf der A671 abrufen ---
function showCurrentClosures(autobahn) {
  const url = `https://verkehr.autobahn.de/o/autobahn/${autobahn}/services/closure`;
  fetch(url)
    .then(response => {
      if (!response.ok) throw new Error('Netzwerkantwort war nicht ok');
      return response.json();
    })
    .then(data => {
      // Die API liefert ein Objekt mit "closure"-Array
      const closures = Array.isArray(data.closure) ? data.closure : [];
      // Filtere nur aktuelle Sperrungen (future === false)
      const active = closures.filter(item => item && item.future === false);
      const relevanteStichwoerter = ["Mainz", "Rüsselsheim", "Wiesbaden", "Darmstadt", "Raunheim", "Groß-Gerau", "Büttelborn", "Bischofsheim", "Mörfelden-Walldorf", "Mörfelden", "Walldorf", "Langen", "Weiterstadt", "Ginsheim-Gustavsburg", "Mainz -> Wiesbaden"];
      const relevant = active.filter(item =>
        relevanteStichwoerter.some(kw =>
          (item.title && item.title.includes(kw)) ||
          (item.subtitle && item.subtitle.includes(kw)) ||
          (item.description && item.description.some(line => line.includes(kw)))
        )
      );
      // Für jede Autobahn ein eigenes Ausgabefeld
      const elId = `autobahn-closures-${autobahn}`;
      let el = document.getElementById(elId);
      if (!el) {
        // Falls das Element noch nicht existiert, erstelle es unterhalb von autobahn-closures (Sammelcontainer)
        const container = document.getElementById("autobahn-closures");
        if (container) {
          el = document.createElement("div");
          el.id = elId;
          el.style.marginBottom = "1em";
          container.appendChild(el);
        }
      }
      if (el) {
        if (relevant.length === 0) {
          // el.innerHTML += "Keine aktuellen Sperrungen.";
        } else {
          //el.innerHTML = `<h3>${autobahn}</h3>`;
          el.innerHTML += relevant.map(item => {
            let beginn = '';
            let ende = '';
            if (item.description && item.description.length > 3) {
              beginn = item.description[1]; // Zeile 2: Beginn
              ende = item.description[2];   // Zeile 3: Ende
            }
            return `<div>
              <strong>${item.title || "Sperrung"}</strong><!-- <br> -->
              ${item.subtitle ? item.subtitle + '<br>' : ''}
              ${beginn ? '<b>' + beginn + '</b><!-- <br> -->' : ''}
              ${ende ? '<b>' + ende + '</b><br>' : ''}
            </div>`;
          }).join("<hr>");
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

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("de-DE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ninaSeverityBadge(severity) {
  const s = String(severity || "").toLowerCase();
  if (s === "extreme") return "bg-danger";
  if (s === "severe") return "bg-warning text-dark";
  if (s === "moderate") return "bg-info text-dark";
  if (s === "minor") return "bg-secondary";
  return "bg-light text-dark";
}

async function fetchJson(url, { signal } = {}) {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status} für ${url}`);
  return res.json();
}

const NINA_DEFAULT_ARS = "064330000000"; // Kreis Groß-Gerau (für die Wache Gustavsburg)
// Browser-Problem: warnung.bund.de/api31 ist oft ohne CORS erreichbar.
// Lösung: same-origin Proxy-Route (/nina/...) über server.js.
const NINA_BASE = "/nina";
const NINA_REFRESH_MS = 2 * 60 * 1000;

function getConfiguredNinaARS() {
  const fromStorage = (localStorage.getItem("nina_ars") || "").trim();
  const ars = fromStorage || NINA_DEFAULT_ARS;
  return ars;
}

function normalizeARS(input) {
  const digits = String(input || "").replace(/\D/g, "");
  if (digits.length === 12) return digits;
  if (digits.length === 5) return `${digits}0000000`;
  return null;
}

function renderNinaLoading(el, message = "NINA Warnungen werden geladen …") {
  el.innerHTML = `
    <div class="d-flex align-items-center gap-2">
      <div class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></div>
      <div>${escapeHtml(message)}</div>
    </div>
  `;
}

function renderNinaError(el, message) {
  el.innerHTML = `
    <div class="alert alert-danger mb-0" role="alert">
      ${escapeHtml(message)}
    </div>
  `;
}

function buildNinaShell(ars) {
  const niceARS = escapeHtml(ars);
  return `
    <!-- <div class="d-flex flex-wrap align-items-end justify-content-between gap-2 mb-3">
      <div class="small opacity-75">Quelle: warnung.bund.de (NINA API, via lokaler Proxy), ARS: <span class="fw-semibold">${niceARS}</span></div>
      <div class="d-flex align-items-center gap-2">
        <label for="nina-ars" class="form-label mb-0 small">ARS</label>
        <input id="nina-ars" class="form-control form-control-sm" style="max-width: 180px" inputmode="numeric" placeholder="z.B. 06433" value="${niceARS}" />
        <button id="nina-ars-save" class="btn btn-sm btn-outline-light">Übernehmen</button>
      </div>
    </div> -->
    <div id="nina-list"></div>
  `;
}

function parseDashboardEntry(entry) {
  const id = entry?.id;
  const payload = entry?.payload || {};
  const data = payload?.data || {};
  return {
    id,
    provider: data?.provider || payload?.data?.provider || payload?.provider,
    severity: data?.severity || payload?.data?.severity || payload?.severity,
    msgType: data?.msgType || payload?.data?.msgType || payload?.msgType,
    headline: data?.headline || entry?.i18nTitle?.de || payload?.i18nTitle?.de,
    sent: entry?.sent || data?.sent || payload?.sent,
    areaType: data?.area?.type,
    areaData: data?.area?.data,
    event: data?.transKeys?.event,
  };
}

function isProbablyCancelled(item) {
  const msg = String(item?.msgType || "").toLowerCase();
  return msg === "cancel";
}

function renderNinaList(listEl, items) {
  if (!items || items.length === 0) {
    listEl.innerHTML = `<div class="opacity-75">Keine aktuellen Warnungen für diese Region.</div>`;
    return;
  }

  listEl.innerHTML = items
    .map((w, idx) => {
      const title = escapeHtml(w.headline || w.id || "Warnung");
      const severity = escapeHtml(w.severity || "");
      const badgeClass = ninaSeverityBadge(w.severity);
      const sent = escapeHtml(formatDateTime(w.sent));
      const metaBits = [sent, w.provider].filter(Boolean).map(escapeHtml).join(" · ");
      const collapseId = `nina-detail-${idx}`;
      const buttonId = `nina-detail-btn-${idx}`;
      const detailsUrl = `${NINA_BASE}/warnings/${encodeURIComponent(w.id)}.json`;
      return `
        <div class="border-top pt-3 mt-3">
          <div class="d-flex flex-wrap align-items-start justify-content-between gap-2">
            <div>
              <div class="fw-semibold" style="font-size: 1.1rem">${title}</div>
              <div class="small opacity-75">${metaBits}</div>
            </div>
            <div class="d-flex align-items-center gap-2">
              ${severity ? `<span class="badge ${badgeClass}">${severity}</span>` : ""}
              <button class="btn btn-sm btn-outline-light" type="button" data-nina-details-url="${escapeHtml(detailsUrl)}" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="false" aria-controls="${collapseId}" id="${buttonId}">Details</button>
            </div>
          </div>
          <div class="collapse mt-2" id="${collapseId}">
            <div class="card card-body" data-nina-detail-container="true">
              <div class="small opacity-75">Details werden geladen …</div>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

async function loadNinaDashboard(ars, { signal } = {}) {
  const url = `${NINA_BASE}/dashboard/${encodeURIComponent(ars)}.json`;
  const raw = await fetchJson(url, { signal });
  const arr = Array.isArray(raw) ? raw : [];
  const parsed = arr.map(parseDashboardEntry).filter((x) => x && x.id);
  const current = parsed.filter((x) => !isProbablyCancelled(x));
  current.sort((a, b) => new Date(b.sent || 0) - new Date(a.sent || 0));
  return current;
}

function attachNinaDetailLazyLoading(rootEl) {
  rootEl.addEventListener("show.bs.collapse", async (ev) => {
    const collapseEl = ev.target;
    if (!collapseEl || collapseEl.dataset.ninaLoaded === "1") return;

    const btn = rootEl.querySelector(`[data-bs-target="#${CSS.escape(collapseEl.id)}"]`);
    const detailsUrl = btn?.getAttribute("data-nina-details-url");
    const container = collapseEl.querySelector("[data-nina-detail-container='true']");
    if (!detailsUrl || !container) return;

    container.innerHTML = `<div class="small opacity-75">Details werden geladen …</div>`;
    try {
      const detail = await fetchJson(detailsUrl);
      const info = Array.isArray(detail?.info) ? detail.info[0] : null;
      const headline = escapeHtml(info?.headline || "");
      const description = info?.description || "";
      const web = info?.web;
      const senderName = escapeHtml(info?.senderName || "");

      const htmlDescription = description
        ? `<div class="mt-2">${String(description)}</div>`
        : `<div class="mt-2 small opacity-75">Keine Beschreibung vorhanden.</div>`;

      container.innerHTML = `
        ${headline ? `<div class="fw-semibold">${headline}</div>` : ""}
        ${senderName ? `<div class="small opacity-75">${senderName}</div>` : ""}
        ${htmlDescription}
        ${web ? `<div class="mt-2"><a class="link-light" href="${escapeHtml(web)}" target="_blank" rel="noopener noreferrer">Weitere Infos</a></div>` : ""}
      `;

      collapseEl.dataset.ninaLoaded = "1";
    } catch (e) {
      container.innerHTML = `<div class="text-danger">Fehler beim Laden der Details.</div>`;
    }
  });
}

function initNina() {
  const ninaRoot = document.getElementById("nina-content");
  if (!ninaRoot) return;

  let abortController = null;

  const refresh = async () => {
    if (abortController) abortController.abort();
    abortController = new AbortController();

    const ars = getConfiguredNinaARS();
    ninaRoot.innerHTML = buildNinaShell(ars);

    const listEl = document.getElementById("nina-list");
    if (!listEl) return;
    renderNinaLoading(listEl);

    try {
      const items = await loadNinaDashboard(ars, { signal: abortController.signal });
      renderNinaList(listEl, items);
    } catch (e) {
      if (e?.name === "AbortError") return;
      renderNinaError(listEl, "NINA konnte nicht geladen werden (Netzwerk/CORS/ARS prüfen).");
      console.error("NINA Fehler:", e);
    }
  };

  ninaRoot.innerHTML = buildNinaShell(getConfiguredNinaARS());
  attachNinaDetailLazyLoading(ninaRoot);

  ninaRoot.addEventListener("click", (ev) => {
    const t = ev.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.id !== "nina-ars-save") return;
    const input = ninaRoot.querySelector("#nina-ars");
    const raw = input?.value;
    const normalized = normalizeARS(raw);
    if (!normalized) {
      const listEl = document.getElementById("nina-list");
      if (listEl) renderNinaError(listEl, "Ungültiger ARS. Erlaubt: 5-stellig (Kreis) oder 12-stellig.");
      return;
    }
    localStorage.setItem("nina_ars", normalized);
    refresh();
  });

  refresh();
  setInterval(refresh, NINA_REFRESH_MS);
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

  // NINA Warnungen (Region per ARS, default: Kreis Groß-Gerau)
  initNina();

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

