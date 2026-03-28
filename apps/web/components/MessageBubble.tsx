"use client";

import clsx from "clsx";
import type { ChatMessage } from "@/types/interview";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  return (
    <div
      className={clsx(
        "max-w-[92%] rounded-2xl p-3 text-sm leading-relaxed shadow-sm animate-fade-in-up",
        isUser && "ml-auto bg-ink text-canvas",
        !isUser && !isSystem && "mr-auto border border-ink/10 bg-white/90 text-ink",
        isSystem && "mr-auto border border-amber-600/30 bg-amber-50 text-amber-900"
      )}
    >
      <p className="whitespace-pre-wrap">{message.content}</p>
      {message.sections?.bulletPoints?.length ? (
        <ul className="mt-2 list-disc space-y-1 pl-4 text-xs opacity-90">
          {message.sections.bulletPoints.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      ) : null}
      {message.sections?.confidenceTips?.length ? (
        <ul className="mt-2 list-disc space-y-1 pl-4 text-xs opacity-90">
          {message.sections.confidenceTips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
