export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type QueryParams = Record<
  string,
  string | number | boolean | null | undefined
>;

export interface ApiEnvelope<TData = unknown> {
  success?: boolean;
  message?: string;
  data: TData;
}

export interface ApiErrorBody {
  success?: false;
  message?: string;
  error?: string;
  errors?: unknown;
  statusCode?: number;
}

export interface NormalizedApiError {
  status: number | "FETCH_ERROR" | "TIMEOUT_ERROR" | "PARSING_ERROR" | "CUSTOM_ERROR";
  message: string;
  details?: unknown;
}

export interface PaginatedResponse<TItem> {
  items: TItem[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

export interface ApiClientRequestOptions<TBody = unknown> {
  method?: HttpMethod;
  body?: TBody;
  params?: QueryParams;
  headers?: HeadersInit;
  timeoutMs?: number;
  signal?: AbortSignal;
  skipAuth?: boolean;
}
