// src/lib/onboarding.ts

export const ONBOARDING_KEYS = {
  workspaceLanding: "motionai:onboarding:workspace_landing", // base key (we'll suffix userId/workspaceId)
} as const;

function safeLocalStorage() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getUserId(user: any): string | null {
  const id = user?.id || user?._id;
  return id ? String(id) : null;
}

/**
 * Key builders
 * - per-user: motionai:onboarding:workspace_landing:<userId>
 * - per-user+workspace: motionai:onboarding:workspace_landing:<userId>:<workspaceId>
 */
export function onboardingKey(
  base: string,
  opts: { userId?: string | null; workspaceId?: string | null } = {},
) {
  const parts = [base];

  if (opts.userId) parts.push(String(opts.userId));
  if (opts.workspaceId) parts.push(String(opts.workspaceId));

  return parts.join(":");
}

/**
 * Returns true if onboarding has been completed.
 * If userId missing, falls back to global key (not recommended, but safe).
 */
export function isOnboardingDone(
  baseKey: string,
  opts: { userId?: string | null; workspaceId?: string | null } = {},
): boolean {
  const ls = safeLocalStorage();
  if (!ls) return false;

  const key = onboardingKey(baseKey, opts);
  return ls.getItem(key) === "true";
}

/**
 * Mark onboarding as completed.
 */
export function setOnboardingDone(
  baseKey: string,
  opts: { userId?: string | null; workspaceId?: string | null } = {},
): void {
  const ls = safeLocalStorage();
  if (!ls) return;

  const key = onboardingKey(baseKey, opts);
  ls.setItem(key, "true");
}

/**
 * Reset onboarding (useful for testing)
 */
export function resetOnboarding(
  baseKey: string,
  opts: { userId?: string | null; workspaceId?: string | null } = {},
): void {
  const ls = safeLocalStorage();
  if (!ls) return;

  const key = onboardingKey(baseKey, opts);
  ls.removeItem(key);
}

/**
 * Optional: Store which step user reached (so you can resume)
 */
export function getOnboardingStep(
  baseKey: string,
  opts: { userId?: string | null; workspaceId?: string | null } = {},
): number {
  const ls = safeLocalStorage();
  if (!ls) return 0;

  const key = onboardingKey(`${baseKey}:step`, opts);
  const raw = ls.getItem(key);
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) ? n : 0;
}

export function setOnboardingStep(
  baseKey: string,
  step: number,
  opts: { userId?: string | null; workspaceId?: string | null } = {},
): void {
  const ls = safeLocalStorage();
  if (!ls) return;

  const key = onboardingKey(`${baseKey}:step`, opts);
  ls.setItem(key, String(step));
}
