import type { AskPayload, AssistantResponse } from "@/types/interview";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

interface AskStreamHandlers {
  onToken: (token: string) => void;
  onDone: (response: AssistantResponse) => void;
  onError: (message: string) => void;
}

function parseSseChunk(chunk: string): Array<{ type: string; [key: string]: unknown }> {
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
        return JSON.parse(json) as { type: string; [key: string]: unknown };
      } catch {
        return { type: "noop" };
      }
    });
}

export async function askInterviewAssistant(
  payload: AskPayload,
  handlers: AskStreamHandlers
): Promise<void> {
  const response = await fetch(`${API_URL}/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok || !response.body) {
    handlers.onError("Failed to connect to assistant.");
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
        handlers.onToken(String(event.token ?? ""));
      } else if (event.type === "done") {
        handlers.onDone(event.data as AssistantResponse);
      } else if (event.type === "error") {
        handlers.onError(String(event.message ?? "Unknown streaming error"));
      }
    });
  }

  if (buffer.trim()) {
    const events = parseSseChunk(buffer);
    events.forEach((event) => {
      if (event.type === "done") {
        handlers.onDone(event.data as AssistantResponse);
      } else if (event.type === "error") {
        handlers.onError(String(event.message ?? "Unknown streaming error"));
      }
    });
  }
}
