import { env } from "@/lib/env";
import { tokenManager } from "@/lib/tokenManager";
import type {
  ApiClientRequestOptions,
  ApiEnvelope,
  NormalizedApiError,
  QueryParams,
} from "@/types/api.types";

const buildUrl = (path: string, params?: QueryParams) => {
  const url = new URL(
    path.startsWith("http") ? path : `${env.apiUrl}${path.startsWith("/") ? path : `/${path}`}`
  );

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
};

export class ApiClientError extends Error {
  status: NormalizedApiError["status"];
  details?: unknown;

  constructor(error: NormalizedApiError) {
    super(error.message);
    this.name = "ApiClientError";
    this.status = error.status;
    this.details = error.details;
  }
}

const normalizeError = async (response: Response): Promise<NormalizedApiError> => {
  let body: unknown;

  try {
    body = await response.json();
  } catch {
    body = null;
  }

  const message =
    typeof body === "object" && body !== null && "message" in body
      ? String((body as { message?: unknown }).message)
      : response.statusText || "Request failed";

  return {
    status: response.status,
    message,
    details: body,
  };
};

const normalizeResponse = async <TData>(response: Response): Promise<TData> => {
  if (response.status === 204) {
    return undefined as TData;
  }

  const body = await response.json();
  if (body && typeof body === "object" && "data" in body) {
    return (body as ApiEnvelope<TData>).data;
  }

  return body as TData;
};

const request = async <TData, TBody = unknown>(
  path: string,
  options: ApiClientRequestOptions<TBody> = {}
): Promise<TData> => {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? env.apiTimeoutMs;
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (!options.skipAuth) {
    const authHeader = tokenManager.getAuthHeader();
    if (authHeader) {
      headers.set("Authorization", authHeader);
    }
  }

  if (options.signal) {
    options.signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  try {
    const response = await fetch(buildUrl(path, options.params), {
      method: options.method || "GET",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      credentials: "include",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new ApiClientError(await normalizeError(response));
    }

    return normalizeResponse<TData>(response);
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiClientError({
        status: "TIMEOUT_ERROR",
        message: "Request timed out",
      });
    }

    throw new ApiClientError({
      status: "FETCH_ERROR",
      message: error instanceof Error ? error.message : "Network request failed",
      details: error,
    });
  } finally {
    window.clearTimeout(timeout);
  }
};

export const apiClient = {
  get: <TData>(path: string, options?: Omit<ApiClientRequestOptions, "method" | "body">) =>
    request<TData>(path, { ...options, method: "GET" }),

  post: <TData, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: Omit<ApiClientRequestOptions<TBody>, "method" | "body">
  ) => request<TData, TBody>(path, { ...options, method: "POST", body }),

  put: <TData, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: Omit<ApiClientRequestOptions<TBody>, "method" | "body">
  ) => request<TData, TBody>(path, { ...options, method: "PUT", body }),

  patch: <TData, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: Omit<ApiClientRequestOptions<TBody>, "method" | "body">
  ) => request<TData, TBody>(path, { ...options, method: "PATCH", body }),

  delete: <TData>(path: string, options?: Omit<ApiClientRequestOptions, "method" | "body">) =>
    request<TData>(path, { ...options, method: "DELETE" }),
};
