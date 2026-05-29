import { baseApi } from "@/services/server/baseApi";
import type { ApiEnvelope, QueryParams } from "@/types/api.types";
import { toParams } from "@/services/server/utils";

type Paginated<T> = { items: T[] };
export type EventRequestRecord = Record<string, unknown>;

export const eventRequestApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEventRequests: builder.query<EventRequestRecord[], QueryParams | void>({
      query: (params) => ({
        url: "/event-requests",
        params: toParams(params ?? undefined),
      }),
      transformResponse: (response: ApiEnvelope<Paginated<EventRequestRecord>>) => response.data.items ?? [],
      providesTags: [{ type: "EventRequest", id: "LIST" }],
    }),

    getEventRequestById: builder.query<EventRequestRecord, string>({
      query: (id) => `/event-requests/${id}`,
      transformResponse: (response: ApiEnvelope<{ eventRequest: EventRequestRecord }>) =>
        response.data.eventRequest,
      providesTags: (_r, _e, id) => [{ type: "EventRequest", id }],
    }),

    createEventRequest: builder.mutation<EventRequestRecord, Record<string, unknown>>({
      query: (body) => ({ url: "/event-requests", method: "POST", body }),
      transformResponse: (response: ApiEnvelope<{ eventRequest: EventRequestRecord }>) =>
        response.data.eventRequest,
      invalidatesTags: [{ type: "EventRequest", id: "LIST" }],
    }),

    respondToEventRequest: builder.mutation<
      EventRequestRecord,
      { id: string; body: Record<string, unknown> }
    >({
      query: ({ id, body }) => ({ url: `/event-requests/${id}/respond`, method: "POST", body }),
      transformResponse: (response: ApiEnvelope<{ eventRequest: EventRequestRecord }>) =>
        response.data.eventRequest,
      invalidatesTags: (_r, _e, { id }) => [{ type: "EventRequest", id }, { type: "EventRequest", id: "LIST" }],
    }),

    cancelEventRequest: builder.mutation<unknown, string>({
      query: (id) => ({ url: `/event-requests/${id}/cancel`, method: "POST" }),
      invalidatesTags: [{ type: "EventRequest", id: "LIST" }],
    }),

    getEventCoHosts: builder.query<EventRequestRecord[], string>({
      query: (eventRequestId) => `/event-requests/${eventRequestId}/co-hosts`,
      transformResponse: (response: ApiEnvelope<{ coHosts: EventRequestRecord[] }>) =>
        response.data.coHosts ?? [],
    }),

    addEventCoHost: builder.mutation<
      EventRequestRecord,
      { eventRequestId: string; body: Record<string, unknown> }
    >({
      query: ({ eventRequestId, body }) => ({
        url: `/event-requests/${eventRequestId}/co-hosts`,
        method: "POST",
        body,
      }),
    }),

    updateEventCoHost: builder.mutation<
      EventRequestRecord,
      { eventRequestId: string; coHostId: string; body: Record<string, unknown> }
    >({
      query: ({ eventRequestId, coHostId, body }) => ({
        url: `/event-requests/${eventRequestId}/co-hosts/${coHostId}`,
        method: "PATCH",
        body,
      }),
    }),

    deleteEventCoHost: builder.mutation<void, { eventRequestId: string; coHostId: string }>({
      query: ({ eventRequestId, coHostId }) => ({
        url: `/event-requests/${eventRequestId}/co-hosts/${coHostId}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useGetEventRequestsQuery,
  useLazyGetEventRequestsQuery,
  useGetEventRequestByIdQuery,
  useCreateEventRequestMutation,
  useRespondToEventRequestMutation,
  useCancelEventRequestMutation,
  useGetEventCoHostsQuery,
  useLazyGetEventCoHostsQuery,
  useAddEventCoHostMutation,
  useUpdateEventCoHostMutation,
  useDeleteEventCoHostMutation,
} = eventRequestApi;
