import { AssistantOverlay } from "@/components/AssistantOverlay";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-canvas text-ink">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-10 top-0 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute bottom-12 right-20 h-80 w-80 rounded-full bg-ember/20 blur-3xl" />
        <div className="absolute left-1/3 top-1/2 h-56 w-56 rounded-full bg-mint/20 blur-3xl" />
      </div>

      <section className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-20">
        <div className="max-w-2xl space-y-6">
          <p className="inline-flex rounded-full border border-ink/15 bg-white/60 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
            AI Interview Copilot
          </p>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
            Speak naturally. Get instant interview answers with confidence coaching.
          </h1>
          <p className="max-w-xl text-base text-ink/75 sm:text-lg">
            This assistant captures live mic input, classifies question type, and streams concise answer
            suggestions while your interview is happening.
          </p>
        </div>
      </section>

      <AssistantOverlay />
    </main>
  );
}
