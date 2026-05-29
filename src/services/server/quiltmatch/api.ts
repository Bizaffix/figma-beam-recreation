import { baseApi } from "@/services/server/baseApi";
import type { ApiEnvelope } from "@/types/api.types";

export const quiltmatchApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    searchQuiltMatch: builder.mutation<
      Record<string, unknown>,
      { query: string; filters?: Record<string, unknown>; limit?: number }
    >({
      query: (body) => ({ url: "/quiltmatch/search", method: "POST", body }),
      transformResponse: (response: ApiEnvelope<Record<string, unknown>>) => response.data,
    }),

    discoverQuiltMatch: builder.mutation<Record<string, unknown>, Record<string, unknown>>({
      query: (body) => ({ url: "/quiltmatch/discover", method: "POST", body }),
      transformResponse: (response: ApiEnvelope<Record<string, unknown>>) => response.data,
    }),

    submitQuiltMatchInterest: builder.mutation<unknown, Record<string, unknown>>({
      query: (body) => ({ url: "/draft-listings/interest", method: "POST", body }),
    }),

    createAiSubscriptionCheckout: builder.mutation<Record<string, unknown>, { nextPath?: string } | void>({
      query: (body) => ({
        url: "/quiltmatch/upgrade",
        method: "POST",
        body: body ?? undefined,
      }),
      transformResponse: (response: ApiEnvelope<Record<string, unknown>>) => response.data,
    }),

    createAiSubscriptionPortal: builder.mutation<Record<string, unknown>, void>({
      query: () => ({ url: "/quiltmatch/billing-portal", method: "POST" }),
      transformResponse: (response: ApiEnvelope<Record<string, unknown>>) => response.data,
    }),
  }),
});

export const {
  useSearchQuiltMatchMutation,
  useDiscoverQuiltMatchMutation,
  useSubmitQuiltMatchInterestMutation,
  useCreateAiSubscriptionCheckoutMutation,
  useCreateAiSubscriptionPortalMutation,
} = quiltmatchApi;
