import type { NavigateFunction } from "react-router-dom";
import type { BackendUserRole } from "@/types/auth.types";

const REDIRECT_KEY = "bmqr_post_auth_redirect";

export function setPostAuthRedirect(path: string) {
  if (!path || !path.startsWith("/")) return;
  localStorage.setItem(REDIRECT_KEY, path);
}

export function getPostAuthRedirect() {
  return localStorage.getItem(REDIRECT_KEY);
}

export function consumePostAuthRedirect(defaultPath = "/home") {
  const stored = localStorage.getItem(REDIRECT_KEY);
  if (stored) {
    localStorage.removeItem(REDIRECT_KEY);
    return stored;
  }
  return defaultPath;
}

/** Role-based home redirect after login or OAuth (respects stored `next` path). */
export function redirectAfterAuth(
  navigate: NavigateFunction,
  role?: BackendUserRole | string | null,
) {
  const redirectPath = consumePostAuthRedirect();
  if (redirectPath && redirectPath !== "/home") {
    navigate(redirectPath, { replace: true });
    return;
  }

  if (role === "instructor") {
    navigate("/instructor/dashboard", { replace: true });
  } else if (role === "admin") {
    navigate("/admin/dashboard", { replace: true });
  } else if (role === "location_owner") {
    navigate("/location-owner/dashboard", { replace: true });
  } else {
    navigate("/home", { replace: true });
  }
}
