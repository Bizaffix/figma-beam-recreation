import type { ApiEnvelope, QueryParams } from "@/types/api.types";

/** Unwrap `{ data: T }` envelope from backend responses. */
export function unwrap<T>(response: ApiEnvelope<T> | T): T {
  if (response && typeof response === "object" && "data" in response) {
    return (response as ApiEnvelope<T>).data;
  }
  return response as T;
}

export type { QueryParams };

export const toParams = (params?: QueryParams | void) => {
  if (!params) return undefined;
  const out: Record<string, string | number> = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v != null) out[k] = v as string | number;
  });
  return out;
};
