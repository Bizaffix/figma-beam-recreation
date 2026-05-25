type TokenListener = (accessToken: string | null) => void;

let accessToken: string | null = null;
const listeners = new Set<TokenListener>();

const notify = () => {
  listeners.forEach((listener) => listener(accessToken));
};

export const tokenManager = {
  getAccessToken: () => accessToken,

  setAccessToken: (token: string | null) => {
    accessToken = token;
    notify();
  },

  clear: () => {
    accessToken = null;
    notify();
  },

  subscribe: (listener: TokenListener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getAuthHeader: () => {
    const token = tokenManager.getAccessToken();
    return token ? `Bearer ${token}` : null;
  },
};
