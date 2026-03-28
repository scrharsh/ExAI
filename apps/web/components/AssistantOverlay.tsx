"use client";

import { useCallback, useMemo, useState } from "react";
import { Mic, MicOff, LoaderCircle } from "lucide-react";
import { askInterviewAssistant } from "@/lib/api";
import { getOrCreateUserId } from "@/lib/user";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import type { AssistantMode, CandidateProfile, ChatMessage } from "@/types/interview";
import { MessageBubble } from "./MessageBubble";
import { ModeSelector } from "./ModeSelector";
import { ProfileForm } from "./ProfileForm";

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatAssistantText(raw: string): string {
  const shortAnswerMatch = raw.match(/\[SHORT_ANSWER\]([\s\S]*?)(?=\n\[[A-Z_]+\]|$)/i);
  return shortAnswerMatch?.[1]?.trim() ?? raw.trim();
}

export function AssistantOverlay() {
  const [mode, setMode] = useState<AssistantMode>("HR");
  const [profile, setProfile] = useState<CandidateProfile>({
    name: "Candidate",
    targetRole: "Software Engineer",
    yearsExperience: 3,
    strengths: ["communication", "problem solving"],
  });
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "system",
      content: "Interview copilot ready. Start speaking and I will suggest concise answers in real time.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [isStreaming, setIsStreaming] = useState(false);

  const appendMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const updateMessage = useCallback((id: string, updater: (msg: ChatMessage) => ChatMessage) => {
    setMessages((prev) => prev.map((msg) => (msg.id === id ? updater(msg) : msg)));
  }, []);

  const handleTranscript = useCallback(
    async (transcript: string) => {
      const cleaned = transcript.trim();
      if (!cleaned) {
        return;
      }

      const userId = getOrCreateUserId();
      const userMessageId = createId("u");
      const assistantMessageId = createId("a");

      appendMessage({
        id: userMessageId,
        role: "user",
        content: cleaned,
        timestamp: new Date().toISOString(),
      });

      appendMessage({
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
      });

      setIsStreaming(true);
      try {
        await askInterviewAssistant(
          {
            userId,
            transcript: cleaned,
            mode,
            profile,
          },
          {
            onToken: (token) => {
              updateMessage(assistantMessageId, (msg) => ({
                ...msg,
                content: `${msg.content}${token}`,
              }));
            },
            onDone: (data) => {
              updateMessage(assistantMessageId, (msg) => ({
                ...msg,
                content: formatAssistantText(data.raw),
                sections: {
                  shortAnswer: data.shortAnswer,
                  bulletPoints: data.bulletPoints,
                  confidenceTips: data.confidenceTips,
                },
              }));
              setIsStreaming(false);
            },
            onError: (message) => {
              updateMessage(assistantMessageId, (msg) => ({
                ...msg,
                role: "system",
                content: message,
              }));
              setIsStreaming(false);
            },
          }
        );
      } catch (error) {
        updateMessage(assistantMessageId, (msg) => ({
          ...msg,
          role: "system",
          content: error instanceof Error ? error.message : "Unknown assistant error",
        }));
        setIsStreaming(false);
      }
    },
    [appendMessage, mode, profile, updateMessage]
  );

  const { supported, listening, interim, error, startListening, stopListening } =
    useSpeechRecognition({
      onFinalTranscript: handleTranscript,
    });

  const statusText = useMemo(() => {
    if (supported === null) {
      return "Checking microphone support...";
    }
    if (!supported) {
      return "Web Speech API not supported in this browser.";
    }
    if (error) {
      return `Voice error: ${error}`;
    }
    if (listening) {
      return interim ? `Listening... "${interim}"` : "Listening...";
    }
    return "Press mic to start listening";
  }, [error, interim, listening, supported]);

  return (
    <aside className="fixed right-4 top-4 z-50 h-[min(88vh,760px)] w-[min(96vw,410px)] rounded-3xl border border-ink/20 bg-canvas/90 p-4 shadow-float backdrop-blur-xl">
      <div className="flex h-full flex-col gap-3">
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/60">Live Interview AI</p>
            <h2 className="text-lg font-bold text-ink">Real-time Assistant</h2>
          </div>
          <button
            type="button"
            onClick={listening ? stopListening : startListening}
            disabled={supported !== true}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink/20 bg-white text-ink transition hover:scale-105 hover:bg-ink hover:text-canvas disabled:opacity-50"
            aria-label={listening ? "Stop listening" : "Start listening"}
          >
            {listening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
        </header>

        <ModeSelector value={mode} onChange={setMode} />
        <ProfileForm profile={profile} onChange={setProfile} />

        <p className="rounded-xl border border-ink/10 bg-white/60 px-3 py-2 text-xs text-ink/80">{statusText}</p>

        <div className="flex-1 space-y-2 overflow-y-auto rounded-2xl border border-ink/10 bg-gradient-to-b from-white to-[#f2f7f7] p-3">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {isStreaming ? (
            <div className="inline-flex items-center gap-2 rounded-xl border border-ink/10 bg-white/90 px-3 py-2 text-xs text-ink/70">
              <LoaderCircle className="animate-spin" size={14} />
              Streaming response...
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
