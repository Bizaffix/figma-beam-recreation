const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const apiUrl = trimTrailingSlash(
  import.meta.env.VITE_API_URL || "http://localhost:4000/api"
);

export const env = {
  apiUrl,
  apiTimeoutMs: Number(import.meta.env.VITE_API_TIMEOUT_MS || 30000),
};
