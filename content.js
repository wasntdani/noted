const DEFAULT_SETTINGS = {
  targetLang: "en",
  targetDeck: "Default",
  ankiUrl: "http://localhost:8765"
};

let settings = { ...DEFAULT_SETTINGS };
browser.storage.local.get(DEFAULT_SETTINGS).then((stored) => {
  settings = { ...DEFAULT_SETTINGS, ...stored };
});

browser.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  for (const [key, { newValue }] of Object.entries(changes)) {
    settings[key] = newValue;
  }
});

let card = null;

document.addEventListener("mouseup", checkHighlight);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    killCard();
  }
});

function killCard() {
  if (card) {
    card.remove();
    card = null;
  }
}

function checkHighlight(event) {
  if (card && card.contains(event.target)) {
    return;
  }

  const sel = window.getSelection();
  const text = sel.toString().trim();

  if (card) {
    killCard();
  }

  if (text.length > 0) {
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    createPopup(rect, text);
  }
}

async function createPopup(rect, text) {
  card = document.createElement("div");
  card.className = "translationCard";
  card.style.top = `${window.scrollY + rect.bottom + 10}px`;
  card.style.left = `${window.scrollX + rect.left}px`;

  const { translation, detectedLang } = await translateText(text, settings.targetLang);
  const langLabel = `${(detectedLang || "?").toUpperCase()} → ${settings.targetLang.toUpperCase()}`;

  card.innerHTML = `
    <div class="original">${escapeHtml(text)}</div>
    <div class="arrow">${escapeHtml(langLabel)}</div>
    <div class="translated">${escapeHtml(translation)}</div>
    <div class="actions">
        <button type="button" class="export">Export to Anki</button>
        <button type="button" class="close">Close</button>
    </div>
  `;

  document.body.appendChild(card);

  card.querySelector(".close").addEventListener("click", () => {
    killCard();
  });

  const exportEl = card.querySelector(".export");
  exportEl.addEventListener("click", async () => {
    exportEl.disabled = true;
    exportToAnki(text, translation, exportEl);
  });
}

async function translateText(text, targetLang) {
  try {
    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
    );
    if (!res.ok) throw new Error(`Translate request failed (${res.status})`);
    const data = await res.json();
    if (data && data[0]) {
      const translation = data[0].map((seg) => seg[0]).join("");
      const detectedLang = data[2] || null;
      return { translation, detectedLang };
    }
    return { translation: "Translation not found.", detectedLang: null };
  } catch (err) {
    console.error("Translation error:", err);
    return { translation: "Error fetching translation.", detectedLang: null };
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

async function exportToAnki(front, back, btn) {
  try {
    const result = await browser.runtime.sendMessage({
      action: "EXPORT",
      payload: {
        action: "addNote",
        version: 6,
        params: {
          note: {
            deckName: settings.targetDeck,
            modelName: "Basic",
            fields: { Front: front, Back: back },
            tags: ["firefox-extension"]
          }
        }
      }
    });

    if (result.error) throw new Error(result.error);
    btn.innerText = "Saved to Anki!";
  } catch (err) {
    console.error("Anki Export Error:", err);
    btn.innerText = "Error! Check Console";
    btn.disabled = false;
  }
}