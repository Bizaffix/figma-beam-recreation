import { baseApi } from "@/services/api/baseApi";
import type { ApiEnvelope, PaginatedResponse, QueryParams } from "@/types/api.types";

export interface VenueListItem {
  id: string | number;
  name?: string;
  status?: string;
  city?: string;
  state?: string;
}

export const venueApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getVenues: builder.query<PaginatedResponse<VenueListItem> | VenueListItem[], QueryParams | void>({
      query: (params) => ({
        url: "/venues",
        params: params || undefined,
      }),
      transformResponse: (
        response: ApiEnvelope<PaginatedResponse<VenueListItem> | VenueListItem[]>
      ) => response.data,
      providesTags: ["Venue"],
    }),

    getVenueById: builder.query<VenueListItem, string | number>({
      query: (id) => `/venues/${id}`,
      transformResponse: (response: ApiEnvelope<VenueListItem>) => response.data,
      providesTags: (_result, _error, id) => [{ type: "Venue", id }],
    }),
  }),
});

export const { useGetVenuesQuery, useGetVenueByIdQuery } = venueApi;
