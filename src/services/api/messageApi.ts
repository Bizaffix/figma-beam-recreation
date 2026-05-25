import { baseApi } from "@/services/api/baseApi";
import type { ApiEnvelope, PaginatedResponse, QueryParams } from "@/types/api.types";

export interface MessageThread {
  id: string | number;
  subject?: string;
  unreadCount?: number;
  updatedAt?: string;
}

export const messageApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMessageThreads: builder.query<PaginatedResponse<MessageThread> | MessageThread[], QueryParams | void>({
      query: (params) => ({
        url: "/messages",
        params: params || undefined,
      }),
      transformResponse: (
        response: ApiEnvelope<PaginatedResponse<MessageThread> | MessageThread[]>
      ) => response.data,
      providesTags: ["Message"],
    }),

    getMessageThreadById: builder.query<MessageThread, string | number>({
      query: (id) => `/messages/${id}`,
      transformResponse: (response: ApiEnvelope<MessageThread>) => response.data,
      providesTags: (_result, _error, id) => [{ type: "Message", id }],
    }),
  }),
});

export const { useGetMessageThreadsQuery, useGetMessageThreadByIdQuery } = messageApi;
