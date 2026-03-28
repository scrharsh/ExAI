const STORAGE_KEY = "interview-assistant-user-id";

export function getOrCreateUserId(): string {
  if (typeof window === "undefined") {
    return "server-session";
  }

  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const generated =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `user-${Date.now()}`;

  window.localStorage.setItem(STORAGE_KEY, generated);
  return generated;
}
