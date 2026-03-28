(function initInterviewCopilot() {
  if (window.__INTERVIEW_COPILOT_EXTENSION__) {
    return;
  }
  window.__INTERVIEW_COPILOT_EXTENSION__ = true;

  const SETTINGS_KEY = "interviewCopilotSettings";
  const USER_ID_KEY = "interviewCopilotUserId";
  const DEFAULT_SETTINGS = {
    mode: "HR",
    apiUrl: "http://localhost:8080",
  };

  const state = {
    settings: { ...DEFAULT_SETTINGS },
    panelVisible: false,
    listening: false,
    keepListening: false,
    recognition: null,
    activeAssistantMessage: null,
    lastTranscript: "",
    lastTranscriptAt: 0,
  };

  const els = createUi();
  hydrateSettings().then(syncUi).catch(() => syncUi());

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    handleRuntimeMessage(message)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, message: String(error) }));
    return true;
  });

  async function handleRuntimeMessage(message) {
    const { type, settings } = message ?? {};
    if (settings) {
      mergeSettings(settings);
      await persistSettings();
    }

    if (type === "COPILOT_SYNC_SETTINGS") {
      syncUi();
      return;
    }

    if (type === "COPILOT_TOGGLE_PANEL") {
      state.panelVisible = !state.panelVisible;
      syncUi();
      return;
    }

    if (type === "COPILOT_START") {
      state.panelVisible = true;
      syncUi();
      await startListening();
      return;
    }

    if (type === "COPILOT_STOP") {
      stopListening();
      return;
    }
  }

  function createUi() {
    const root = document.createElement("div");
    root.id = "interview-copilot-root";
    root.innerHTML = `
      <style>
        #interview-copilot-root {
          all: initial;
          position: fixed;
          top: 16px;
          right: 16px;
          z-index: 2147483647;
          font-family: "Segoe UI", Tahoma, sans-serif;
        }
        #interview-copilot-root * {
          box-sizing: border-box;
          font-family: inherit;
        }
        .copilot-panel {
          width: min(92vw, 380px);
          max-height: 85vh;
          display: none;
          border-radius: 14px;
          border: 1px solid #d3dde3;
          overflow: hidden;
          background: linear-gradient(165deg, #fffaf4, #f2f6f9 65%);
          color: #1e2b33;
          box-shadow: 0 20px 45px rgba(18, 30, 41, 0.2);
        }
        .copilot-panel[data-visible="true"] {
          display: block;
        }
        .copilot-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: #13242e;
          color: #eff8ff;
        }
        .copilot-title {
          font-size: 13px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          font-weight: 700;
        }
        .copilot-indicator {
          font-size: 11px;
          border-radius: 999px;
          padding: 3px 8px;
          font-weight: 700;
          border: 1px solid #4d5f69;
          color: #c8d3db;
          background: #273b47;
        }
        .copilot-indicator[data-live="true"] {
          color: #ffffff;
          border-color: #ef4444;
          background: #dc2626;
        }
        .copilot-body {
          padding: 10px;
        }
        .copilot-controls {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .copilot-controls select,
        .copilot-controls button {
          border: 1px solid #cfd8de;
          border-radius: 8px;
          padding: 7px 8px;
          background: #ffffff;
          color: #1e2b33;
          font-size: 12px;
          cursor: pointer;
        }
        .copilot-controls button.primary {
          background: #0f766e;
          color: #ffffff;
          border-color: #0f766e;
          font-weight: 700;
        }
        .copilot-controls button.secondary {
          background: #dbe3ea;
          color: #1e2b33;
          font-weight: 700;
        }
        .copilot-status {
          margin-top: 8px;
          padding: 8px;
          border-radius: 8px;
          background: #ffffff;
          border: 1px solid #d5dee4;
          font-size: 12px;
          color: #354651;
          line-height: 1.3;
          white-space: pre-wrap;
        }
        .copilot-consent {
          margin-top: 6px;
          font-size: 11px;
          color: #66573e;
        }
        .copilot-feed {
          margin-top: 10px;
          max-height: 50vh;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-right: 2px;
        }
        .copilot-msg {
          border-radius: 10px;
          padding: 8px 9px;
          border: 1px solid #d5dee4;
          background: #ffffff;
          font-size: 12px;
          line-height: 1.35;
          color: #1f2a30;
          white-space: pre-wrap;
        }
        .copilot-msg.user {
          border-color: #bdd8d6;
          background: #eefaf9;
        }
        .copilot-msg.assistant {
          border-color: #d8d8f5;
          background: #f7f7ff;
        }
        .copilot-msg.system {
          border-color: #e8d2d2;
          background: #fff6f6;
        }
        .copilot-msg-label {
          display: block;
          margin-bottom: 4px;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 700;
          color: #5a6d78;
        }
      </style>
      <section class="copilot-panel" data-visible="false">
        <header class="copilot-header">
          <div class="copilot-title">Interview Copilot</div>
          <div class="copilot-indicator" data-live="false">OFF</div>
        </header>
        <div class="copilot-body">
          <div class="copilot-controls">
            <select id="copilot-mode" aria-label="Mode">
              <option value="HR">HR</option>
              <option value="Technical">Technical</option>
              <option value="Startup">Startup</option>
            </select>
            <button id="copilot-start" class="primary" type="button">Start</button>
            <button id="copilot-stop" class="secondary" type="button">Stop</button>
            <button id="copilot-clear" type="button">Clear</button>
          </div>
          <div class="copilot-status" id="copilot-status">Panel ready. Press Start to listen.</div>
          <div class="copilot-consent">Use only for mock or explicitly consented sessions.</div>
          <div class="copilot-feed" id="copilot-feed"></div>
        </div>
      </section>
    `;

    document.documentElement.appendChild(root);

    const panel = root.querySelector(".copilot-panel");
    const indicator = root.querySelector(".copilot-indicator");
    const status = root.querySelector("#copilot-status");
    const feed = root.querySelector("#copilot-feed");
    const mode = root.querySelector("#copilot-mode");
    const start = root.querySelector("#copilot-start");
    const stop = root.querySelector("#copilot-stop");
    const clear = root.querySelector("#copilot-clear");

    mode.addEventListener("change", async () => {
      state.settings.mode = mode.value;
      await persistSettings();
      setStatus(`Mode set to ${mode.value}.`);
    });

    start.addEventListener("click", () => {
      startListening().catch((error) => {
        setStatus(error instanceof Error ? error.message : "Unable to start listening.");
      });
    });

    stop.addEventListener("click", () => {
      stopListening();
    });

    clear.addEventListener("click", () => {
      feed.innerHTML = "";
      setStatus("Messages cleared.");
    });

    return { root, panel, indicator, status, feed, mode, start, stop };
  }

  async function hydrateSettings() {
    const stored = await readStorage(SETTINGS_KEY);
    if (stored && typeof stored === "object") {
      mergeSettings(stored);
    }
  }

  function mergeSettings(next) {
    state.settings = {
      ...state.settings,
      ...next,
    };
  }

  async function persistSettings() {
    await writeStorage(SETTINGS_KEY, state.settings);
  }

  function syncUi() {
    els.panel.dataset.visible = String(state.panelVisible);
    els.indicator.dataset.live = String(state.listening);
    els.indicator.textContent = state.listening ? "LISTENING" : "OFF";
    if (els.mode.value !== state.settings.mode) {
      els.mode.value = state.settings.mode;
    }
  }

  function setStatus(message) {
    els.status.textContent = message;
  }

  function appendMessage(role, text) {
    const messageEl = document.createElement("article");
    messageEl.className = `copilot-msg ${role}`;

    const labelEl = document.createElement("span");
    labelEl.className = "copilot-msg-label";
    labelEl.textContent = role === "user" ? "Question" : role === "assistant" ? "Suggestion" : "System";

    const bodyEl = document.createElement("div");
    bodyEl.textContent = text;

    messageEl.appendChild(labelEl);
    messageEl.appendChild(bodyEl);
    els.feed.appendChild(messageEl);
    els.feed.scrollTop = els.feed.scrollHeight;

    return {
      setText: (nextText) => {
        bodyEl.textContent = nextText;
        els.feed.scrollTop = els.feed.scrollHeight;
      },
    };
  }

  function getRecognitionConstructor() {
    return window.SpeechRecognition || window.webkitSpeechRecognition;
  }

  function ensureRecognition() {
    if (state.recognition) {
      return state.recognition;
    }

    const SpeechRecognitionCtor = getRecognitionConstructor();
    if (!SpeechRecognitionCtor) {
      return null;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result?.[0]?.transcript?.trim();
        if (!transcript) {
          continue;
        }

        if (result.isFinal) {
          void handleTranscript(transcript);
        } else {
          interimText += ` ${transcript}`;
        }
      }

      if (interimText.trim()) {
        setStatus(`Listening...\n${interimText.trim()}`);
      } else if (state.listening) {
        setStatus("Listening...");
      }
    };

    recognition.onerror = (event) => {
      state.listening = false;
      state.keepListening = false;
      syncUi();
      const reason = event?.error ? String(event.error) : "unknown";
      setStatus(`Voice error: ${reason}`);
      appendMessage("system", `Voice error: ${reason}`);
    };

    recognition.onend = () => {
      state.listening = false;
      syncUi();
      if (state.keepListening) {
        setTimeout(() => {
          try {
            recognition.start();
            state.listening = true;
            syncUi();
            setStatus("Listening...");
          } catch {
            setStatus("Listening paused. Press Start to continue.");
          }
        }, 300);
      } else {
        setStatus("Stopped.");
      }
    };

    state.recognition = recognition;
    return recognition;
  }

  async function startListening() {
    const recognition = ensureRecognition();
    if (!recognition) {
      state.panelVisible = true;
      syncUi();
      appendMessage("system", "Speech recognition is not available in this browser.");
      setStatus("Speech recognition not supported.");
      return;
    }

    if (state.listening) {
      setStatus("Already listening.");
      return;
    }

    state.panelVisible = true;
    state.keepListening = true;
    syncUi();
    setStatus("Starting microphone...");

    try {
      recognition.start();
      state.listening = true;
      syncUi();
      setStatus("Listening...");
    } catch {
      state.keepListening = false;
      setStatus("Could not start microphone. Allow mic permission and retry.");
    }
  }

  function stopListening() {
    state.keepListening = false;
    state.listening = false;
    syncUi();

    if (state.recognition) {
      try {
        state.recognition.stop();
      } catch {
        // no-op
      }
    }
    setStatus("Stopped.");
  }

  function shouldSkipTranscript(text) {
    const now = Date.now();
    const cleaned = text.trim();
    if (cleaned.length < 4) {
      return true;
    }

    const isDuplicate =
      cleaned.toLowerCase() === state.lastTranscript.toLowerCase() &&
      now - state.lastTranscriptAt < 2500;
    state.lastTranscript = cleaned;
    state.lastTranscriptAt = now;
    return isDuplicate;
  }

  async function handleTranscript(transcript) {
    if (!state.listening || shouldSkipTranscript(transcript)) {
      return;
    }

    appendMessage("user", transcript);
    const assistantMessage = appendMessage("assistant", "");
    state.activeAssistantMessage = assistantMessage;

    setStatus("Generating answer...");
    const userId = await getOrCreateUserId();

    try {
      await streamAssistantAnswer({
        apiUrl: state.settings.apiUrl,
        payload: {
          userId,
          transcript,
          mode: state.settings.mode,
          profile: {
            name: "Candidate",
            targetRole: "Software Engineer",
            yearsExperience: 3,
            strengths: ["communication", "problem solving"],
          },
        },
        onToken: (token) => {
          const current = (assistantMessage.currentText ?? "") + token;
          assistantMessage.currentText = current;
          assistantMessage.setText(current);
        },
        onDone: (response) => {
          const finalText = response?.shortAnswer || response?.raw || "No response";
          assistantMessage.currentText = finalText;
          assistantMessage.setText(finalText);
          setStatus("Listening...");
        },
        onError: (message) => {
          assistantMessage.setText(message);
          setStatus(message);
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Assistant request failed.";
      assistantMessage.setText(message);
      setStatus(message);
      appendMessage("system", message);
    }
  }

  async function getOrCreateUserId() {
    const existing = await readStorage(USER_ID_KEY);
    if (typeof existing === "string" && existing.length > 0) {
      return existing;
    }

    const nextId = `ext-${crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`}`;
    await writeStorage(USER_ID_KEY, nextId);
    return nextId;
  }

  function parseSseChunk(chunk) {
    return chunk
      .split("\n\n")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) =>
        entry
          .split("\n")
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.replace(/^data:\s*/, ""))
          .join("")
      )
      .map((json) => {
        try {
          return JSON.parse(json);
        } catch {
          return { type: "noop" };
        }
      });
  }

  async function streamAssistantAnswer({ apiUrl, payload, onToken, onDone, onError }) {
    const response = await fetch(`${apiUrl.replace(/\/+$/, "")}/ask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok || !response.body) {
      onError("Failed to connect to API. Check API URL and CORS settings.");
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const boundary = buffer.lastIndexOf("\n\n");
      if (boundary === -1) {
        continue;
      }

      const processable = buffer.slice(0, boundary + 2);
      buffer = buffer.slice(boundary + 2);

      const events = parseSseChunk(processable);
      events.forEach((event) => {
        if (event.type === "token") {
          onToken(String(event.token ?? ""));
        } else if (event.type === "done") {
          onDone(event.data ?? {});
        } else if (event.type === "error") {
          onError(String(event.message ?? "Assistant error"));
        }
      });
    }

    if (buffer.trim()) {
      const events = parseSseChunk(buffer);
      events.forEach((event) => {
        if (event.type === "done") {
          onDone(event.data ?? {});
        } else if (event.type === "error") {
          onError(String(event.message ?? "Assistant error"));
        }
      });
    }
  }

  function readStorage(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => resolve(result?.[key]));
    });
  }

  function writeStorage(key, value) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, () => resolve());
    });
  }
})();
