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

