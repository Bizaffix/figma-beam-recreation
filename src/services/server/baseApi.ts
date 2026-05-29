import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { env } from "@/lib/env";
import { tokenManager } from "@/lib/tokenManager";
import { authActions } from "@/redux/auth/authSlice";
import type { ApiEnvelope } from "@/types/api.types";
import type { AuthResponse, AuthState } from "@/types/auth.types";

type ApiRootState = {
  auth: AuthState;
};

const rawBaseQuery = fetchBaseQuery({
  baseUrl: env.apiUrl,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as ApiRootState;
    const accessToken = state.auth.accessToken || tokenManager.getAccessToken();

    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }

    headers.set("Accept", "application/json");
    return headers;
  },
});

const isAuthRefreshRequest = (args: string | FetchArgs) => {
  const url = typeof args === "string" ? args : args.url;
  return url.includes("/auth/refresh-token");
};

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401 && !isAuthRefreshRequest(args)) {
    const refreshResult = await rawBaseQuery(
      { url: "/auth/refresh-token", method: "POST" },
      api,
      extraOptions
    );

    if (refreshResult.data) {
      const data = refreshResult.data as ApiEnvelope<AuthResponse>;
      api.dispatch(authActions.setCredentials(data.data));
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      api.dispatch(authActions.clearCredentials());
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Auth",
    "User",
    "Retreat",
    "Booking",
    "Venue",
    "Message",
    "Admin",
    "Dashboard",
    "Favorite",
    "Affiliate",
    "Payment",
    "DraftListing",
    "EventRequest",
    "Content",
    "Upload",
    "QuiltMatch",
  ],
  endpoints: () => ({}),
});
