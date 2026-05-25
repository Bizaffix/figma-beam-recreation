import { baseApi } from "@/services/api/baseApi";
import type { ApiEnvelope, PaginatedResponse, QueryParams } from "@/types/api.types";

export interface RetreatListItem {
  id: string | number;
  title?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export const retreatApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRetreats: builder.query<PaginatedResponse<RetreatListItem> | RetreatListItem[], QueryParams | void>({
      query: (params) => ({
        url: "/retreats",
        params: params || undefined,
      }),
      transformResponse: (
        response: ApiEnvelope<PaginatedResponse<RetreatListItem> | RetreatListItem[]>
      ) => response.data,
      providesTags: ["Retreat"],
    }),

    getRetreatById: builder.query<RetreatListItem, string | number>({
      query: (id) => `/retreats/${id}`,
      transformResponse: (response: ApiEnvelope<RetreatListItem>) => response.data,
      providesTags: (_result, _error, id) => [{ type: "Retreat", id }],
    }),
  }),
});

export const { useGetRetreatsQuery, useGetRetreatByIdQuery } = retreatApi;
