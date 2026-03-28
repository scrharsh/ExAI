const modeEl = document.getElementById("mode");
const apiUrlEl = document.getElementById("apiUrl");
const statusEl = document.getElementById("status");
const startEl = document.getElementById("start");
const stopEl = document.getElementById("stop");
const toggleEl = document.getElementById("toggle");

const STORAGE_KEY = "interviewCopilotSettings";

function setStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.style.color = isError ? "#b91c1c" : "#42515b";
}

function getActiveTab() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs?.[0];
      if (!tab?.id) {
        reject(new Error("No active tab found."));
        return;
      }
      resolve(tab);
    });
  });
}

function sendToActiveTab(message) {
  return getActiveTab().then(
    (tab) =>
      new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tab.id, message, (response) => {
          const error = chrome.runtime.lastError;
          if (error) {
            reject(new Error(error.message));
            return;
          }
          resolve(response);
        });
      })
  );
}

function getStoredSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      resolve(result?.[STORAGE_KEY] ?? null);
    });
  });
}

function setStoredSettings(settings) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: settings }, () => resolve());
  });
}

async function readSettingsFromUi() {
  return {
    mode: modeEl.value,
    apiUrl: apiUrlEl.value.trim() || "http://localhost:8080",
  };
}

async function hydrate() {
  const saved = await getStoredSettings();
  if (saved?.mode) {
    modeEl.value = saved.mode;
  }
  if (saved?.apiUrl) {
    apiUrlEl.value = saved.apiUrl;
  }
}

async function pushSettings() {
  const settings = await readSettingsFromUi();
  await setStoredSettings(settings);
  return settings;
}

async function withAction(name, action) {
  setStatus(`${name}...`);
  try {
    await action();
    setStatus(`${name} done.`);
  } catch (error) {
    setStatus(error instanceof Error ? error.message : `${name} failed.`, true);
  }
}

modeEl.addEventListener("change", async () => {
  const settings = await pushSettings();
  sendToActiveTab({ type: "COPILOT_SYNC_SETTINGS", settings }).catch(() => {
    // Ignore if content script not available on this page.
  });
});

apiUrlEl.addEventListener("change", async () => {
  const settings = await pushSettings();
  sendToActiveTab({ type: "COPILOT_SYNC_SETTINGS", settings }).catch(() => {
    // Ignore if content script not available on this page.
  });
});

startEl.addEventListener("click", () =>
  withAction("Starting", async () => {
    const settings = await pushSettings();
    await sendToActiveTab({ type: "COPILOT_START", settings });
  })
);

stopEl.addEventListener("click", () =>
  withAction("Stopping", async () => {
    const settings = await pushSettings();
    await sendToActiveTab({ type: "COPILOT_STOP", settings });
  })
);

toggleEl.addEventListener("click", () =>
  withAction("Toggling panel", async () => {
    const settings = await pushSettings();
    await sendToActiveTab({ type: "COPILOT_TOGGLE_PANEL", settings });
  })
);

hydrate().catch(() => {
  setStatus("Failed to load settings.", true);
});
