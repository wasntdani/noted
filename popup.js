const langs = [
  ["en", "English"], ["es", "Spanish"], ["de", "German"], 
  ["ru", "Russian"], ["zh", "Chinese"], ["ja", "Japanese"], ["ar", "Arabic"]
];

const targetLangEl = document.getElementById("targetLang");
const targetDeckEl = document.getElementById("targetDeck");
const saveEl = document.getElementById("save");

async function loadSettings() {
    const settings = await browser.storage.local.get(["targetLang", "targetDeck"]);
    populateLangs(settings.targetLang || "en");
    await loadDecks(settings.targetDeck);
}

function populateLangs(selected) {
    targetLangEl.innerHTML = "";
    for (const [code, lang] of langs) {
        const opt = document.createElement("option");
        opt.value = code;
        opt.textContent = lang;
        if (code === selected) opt.selected = true;
        targetLangEl.appendChild(opt);
    }
}

async function loadDecks(selected) {
    targetDeckEl.innerHTML = `<option>Loading...</option>`;
    try {
        const data = await browser.runtime.sendMessage({ action: "DECKS" });
        if (!data || data.error) throw new Error(data?.error || "Connection failed");

        targetDeckEl.innerHTML = "";
        for (const deck of data.result) {
            const opt = document.createElement("option");
            opt.value = deck;
            opt.textContent = deck;
            if (deck === selected) opt.selected = true;
            targetDeckEl.appendChild(opt);
        }
    } catch (err) {
        targetDeckEl.innerHTML = '<option value="Default">Failed to connect to Anki</option>';
    }
}

saveEl.addEventListener('click', async () => {
    await browser.storage.local.set({ targetDeck: targetDeckEl.value, targetLang: targetLangEl.value });
    
    save.textContent = 'Saved!';
    setTimeout(() => { save.textContent = 'Save Preference'; }, 1500);
  });


loadSettings();