import { env } from "@/lib/env";

export type GoogleOAuthStartOptions = {
  from?: "signup";
};

/** Full-page redirect URL to start Google OAuth on the backend API. */
export function buildGoogleOAuthStartUrl(options: GoogleOAuthStartOptions = {}): string {
  const params = new URLSearchParams();
  if (options.from === "signup") params.set("from", "signup");
  const qs = params.toString();
  return `${env.apiUrl}/auth/oauth/google${qs ? `?${qs}` : ""}`;
}

export function parseOAuthCallbackHash(): { accessToken: string | null; userId: string | null } {
  const raw = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
  if (!raw) return { accessToken: null, userId: null };
  const params = new URLSearchParams(raw);
  return {
    accessToken: params.get("accessToken"),
    userId: params.get("userId"),
  };
}

export function clearOAuthCallbackHash(): void {
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
}
