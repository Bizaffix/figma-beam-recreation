import { store } from "@/redux/store";

type EndpointResult<TData> = {
  data?: TData;
  error?: unknown;
};

/** RTK Query endpoint object (query or mutation) usable outside React. */
type ApiEndpointLike = {
  initiate: (arg: unknown, options?: Record<string, unknown>) => unknown;
};

/**
 * Run an RTK Query endpoint outside React components.
 * All HTTP traffic must go through RTK Query — use this in lib utilities.
 */
export async function runApiEndpoint<TData = unknown, TArg = unknown>(
  endpoint: ApiEndpointLike,
  arg?: TArg,
): Promise<TData> {
  const action = endpoint.initiate(arg, { subscribe: false, forceRefetch: true });
  const result = (await store.dispatch(action as never)) as EndpointResult<TData>;

  if (result.error) {
    throw result.error;
  }

  return result.data as TData;
}

export { store as apiStore };
