"use client";

import type { CandidateProfile } from "@/types/interview";

interface ProfileFormProps {
  profile: CandidateProfile;
  onChange: (profile: CandidateProfile) => void;
}

export function ProfileForm({ profile, onChange }: ProfileFormProps) {
  return (
    <div className="space-y-2 rounded-2xl border border-ink/15 bg-white/80 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/70">Candidate Profile</p>
      <input
        value={profile.name ?? ""}
        onChange={(event) => onChange({ ...profile, name: event.target.value })}
        placeholder="Name"
        className="w-full rounded-lg border border-ink/15 bg-white px-2 py-1.5 text-xs text-ink outline-none ring-accent focus:ring-2"
      />
      <input
        value={profile.targetRole ?? ""}
        onChange={(event) => onChange({ ...profile, targetRole: event.target.value })}
        placeholder="Target role"
        className="w-full rounded-lg border border-ink/15 bg-white px-2 py-1.5 text-xs text-ink outline-none ring-accent focus:ring-2"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          min={0}
          value={profile.yearsExperience ?? ""}
          onChange={(event) =>
            onChange({
              ...profile,
              yearsExperience: event.target.value ? Number(event.target.value) : undefined,
            })
          }
          placeholder="Years exp"
          className="w-full rounded-lg border border-ink/15 bg-white px-2 py-1.5 text-xs text-ink outline-none ring-accent focus:ring-2"
        />
        <input
          value={profile.strengths?.join(", ") ?? ""}
          onChange={(event) =>
            onChange({
              ...profile,
              strengths: event.target.value
                .split(",")
                .map((value) => value.trim())
                .filter(Boolean),
            })
          }
          placeholder="Strengths (comma)"
          className="w-full rounded-lg border border-ink/15 bg-white px-2 py-1.5 text-xs text-ink outline-none ring-accent focus:ring-2"
        />
      </div>
    </div>
  );
}
