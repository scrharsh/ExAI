import Groq from "groq-sdk";
import { env } from "../config/env.js";

const client = new Groq({
  apiKey: env.GROQ_API_KEY,
});

interface StreamInput {
  prompt: string;
  onToken: (token: string) => void;
}

function getModelCandidates(): string[] {
  const fallbacks = env.GROQ_FALLBACK_MODELS.split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return [env.GROQ_MODEL, ...fallbacks];
}

function isModelDecommissionedError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeCode = (error as { error?: { error?: { code?: string } } }).error?.error?.code;
  if (maybeCode === "model_decommissioned") {
    return true;
  }

  const message = (error as { message?: string }).message ?? "";
  return message.includes("model_decommissioned") || message.includes("decommissioned");
}

export async function streamGroqCompletion({ prompt, onToken }: StreamInput): Promise<string> {
  const candidates = getModelCandidates();
  let lastError: unknown;

  for (const model of candidates) {
    try {
      const stream = await client.chat.completions.create({
        model,
        stream: true,
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              "You are an interview response copilot. Stay concise, practical, and high signal.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      let fullText = "";
      for await (const chunk of stream) {
        const token = chunk.choices?.[0]?.delta?.content ?? "";
        if (!token) {
          continue;
        }
        fullText += token;
        onToken(token);
      }

      return fullText;
    } catch (error) {
      lastError = error;
      if (!isModelDecommissionedError(error)) {
        throw error;
      }
    }
  }

  throw (
    lastError ??
    new Error("No Groq model was available for completion. Check GROQ_MODEL and GROQ_FALLBACK_MODELS.")
  );
}
