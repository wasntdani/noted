browser.runtime.onMessage.addListener(async (message) => {
  if (message.action === "EXPORT") {
    try {
      const response = await fetch("http://localhost:8765", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message.payload)
      });
      return await response.json();
    } catch (err) {
      return { error: err.message };
    }
  }
  if (message.action === "DECKS") {
    try {
      const response = await fetch("http://localhost:8765", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deckNames", version: 6 })
      });
      return await response.json();
    } catch (err) {
      return { error: err.message };
    }
  }
});