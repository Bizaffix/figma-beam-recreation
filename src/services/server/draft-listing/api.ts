import { baseApi } from "@/services/server/baseApi";
import type { ApiEnvelope, QueryParams } from "@/types/api.types";
import { toParams } from "@/services/server/utils";

type Paginated<T> = { items: T[] };
export type DraftListingRecord = Record<string, unknown>;

export const draftListingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDraftListings: builder.query<DraftListingRecord[], QueryParams | void>({
      query: (params) => ({
        url: "/draft-listings",
        params: toParams(params ?? undefined),
      }),
      transformResponse: (response: ApiEnvelope<Paginated<DraftListingRecord>>) => response.data.items ?? [],
      providesTags: [{ type: "DraftListing", id: "LIST" }],
    }),

    getDraftListingById: builder.query<DraftListingRecord, string>({
      query: (id) => `/draft-listings/${id}`,
      transformResponse: (response: ApiEnvelope<{ listing: DraftListingRecord }>) => response.data.listing,
      providesTags: (_r, _e, id) => [{ type: "DraftListing", id }],
    }),

    getDraftListingByToken: builder.query<DraftListingRecord, string>({
      query: (token) => `/draft-listings/by-token/${encodeURIComponent(token)}`,
      transformResponse: (response: ApiEnvelope<{ listing: DraftListingRecord }>) => response.data.listing,
    }),

    createDraftListing: builder.mutation<DraftListingRecord, Record<string, unknown>>({
      query: (body) => ({ url: "/draft-listings", method: "POST", body }),
      transformResponse: (response: ApiEnvelope<{ listing: DraftListingRecord }>) => response.data.listing,
      invalidatesTags: [{ type: "DraftListing", id: "LIST" }],
    }),

    updateDraftListing: builder.mutation<
      DraftListingRecord,
      { id: string; body: Record<string, unknown> }
    >({
      query: ({ id, body }) => ({ url: `/draft-listings/${id}`, method: "PATCH", body }),
      transformResponse: (response: ApiEnvelope<{ listing: DraftListingRecord }>) => response.data.listing,
      invalidatesTags: (_r, _e, { id }) => [{ type: "DraftListing", id }, { type: "DraftListing", id: "LIST" }],
    }),

    updateDraftListingByToken: builder.mutation<
      DraftListingRecord,
      { token: string; body: Record<string, unknown> }
    >({
      query: ({ token, body }) => ({
        url: `/draft-listings/by-token/${encodeURIComponent(token)}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (response: ApiEnvelope<{ listing: DraftListingRecord }>) => response.data.listing,
    }),

    deleteDraftListing: builder.mutation<void, string>({
      query: (id) => ({ url: `/draft-listings/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "DraftListing", id: "LIST" }],
    }),

    inviteDraftListing: builder.mutation<unknown, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/draft-listings/${id}/invite`, method: "POST", body }),
    }),

    getDraftListingInterests: builder.query<Record<string, unknown>[], string>({
      query: (id) => `/draft-listings/${id}/interests`,
      transformResponse: (response: ApiEnvelope<{ interests: Record<string, unknown>[] }>) =>
        response.data.interests ?? [],
    }),

    submitDraftListingInterest: builder.mutation<
      unknown,
      { id: string; body: Record<string, unknown> }
    >({
      query: ({ id, body }) => ({ url: `/draft-listings/${id}/interest`, method: "POST", body }),
    }),

    claimDraftListing: builder.mutation<unknown, { token: string; body: Record<string, unknown> }>({
      query: ({ token, body }) => ({
        url: `/draft-listings/${encodeURIComponent(token)}/claim`,
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useGetDraftListingsQuery,
  useLazyGetDraftListingsQuery,
  useGetDraftListingByIdQuery,
  useLazyGetDraftListingByTokenQuery,
  useCreateDraftListingMutation,
  useUpdateDraftListingMutation,
  useUpdateDraftListingByTokenMutation,
  useDeleteDraftListingMutation,
  useInviteDraftListingMutation,
  useGetDraftListingInterestsQuery,
  useLazyGetDraftListingInterestsQuery,
  useSubmitDraftListingInterestMutation,
  useClaimDraftListingMutation,
} = draftListingApi;
