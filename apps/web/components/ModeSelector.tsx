"use client";

import clsx from "clsx";
import type { AssistantMode } from "@/types/interview";

const modes: AssistantMode[] = ["HR", "Technical", "Startup"];

interface ModeSelectorProps {
  value: AssistantMode;
  onChange: (mode: AssistantMode) => void;
}

export function ModeSelector({ value, onChange }: ModeSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {modes.map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          className={clsx(
            "rounded-xl border px-3 py-2 text-xs font-semibold transition",
            value === mode
              ? "border-ink bg-ink text-canvas"
              : "border-ink/20 bg-white/70 text-ink hover:border-ink/50"
          )}
        >
          {mode}
        </button>
      ))}
    </div>
  );
}
