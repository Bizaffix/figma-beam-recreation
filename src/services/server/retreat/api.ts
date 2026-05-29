import { baseApi } from "@/services/server/baseApi";
import type { ApiEnvelope, QueryParams } from "@/types/api.types";
import { toParams } from "@/services/server/utils";

type Paginated<T> = { items: T[] };
type RetreatRecord = Record<string, unknown>;

export const retreatApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRetreats: builder.query<RetreatRecord[], QueryParams | void>({
      query: (params) => ({
        url: "/retreats",
        params: toParams({ limit: 60, sort: "startDate:asc", ...params }),
      }),
      transformResponse: (response: ApiEnvelope<Paginated<RetreatRecord>>) => response.data.items ?? [],
      providesTags: (result) =>
        result
          ? [
              ...result.map((r) => ({ type: "Retreat" as const, id: String(r.id) })),
              { type: "Retreat", id: "LIST" },
            ]
          : [{ type: "Retreat", id: "LIST" }],
    }),

    getRetreatById: builder.query<RetreatRecord, string | number>({
      query: (id) => `/retreats/${id}`,
      transformResponse: (response: ApiEnvelope<{ retreat: RetreatRecord }>) => response.data.retreat,
      providesTags: (_r, _e, id) => [{ type: "Retreat", id: String(id) }],
    }),

    getMyRetreats: builder.query<RetreatRecord[], QueryParams | void>({
      query: (params) => ({
        url: "/retreats/instructor/my-retreats",
        params: toParams(params ?? undefined),
      }),
      transformResponse: (response: ApiEnvelope<Paginated<RetreatRecord>>) => response.data.items ?? [],
      providesTags: [{ type: "Retreat", id: "MY" }],
    }),

    createRetreat: builder.mutation<RetreatRecord, Record<string, unknown>>({
      query: (body) => ({ url: "/retreats", method: "POST", body }),
      transformResponse: (response: ApiEnvelope<{ retreat: RetreatRecord }>) => response.data.retreat,
      invalidatesTags: [{ type: "Retreat", id: "LIST" }, { type: "Retreat", id: "MY" }],
    }),

    updateRetreat: builder.mutation<RetreatRecord, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/retreats/${id}`, method: "PATCH", body }),
      transformResponse: (response: ApiEnvelope<{ retreat: RetreatRecord }>) => response.data.retreat,
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Retreat", id },
        { type: "Retreat", id: "LIST" },
        { type: "Retreat", id: "MY" },
      ],
    }),

    publishRetreat: builder.mutation<RetreatRecord, string>({
      query: (id) => ({ url: `/retreats/${id}/publish`, method: "POST" }),
      transformResponse: (response: ApiEnvelope<{ retreat: RetreatRecord }>) => response.data.retreat,
      invalidatesTags: (_r, _e, id) => [
        { type: "Retreat", id },
        { type: "Retreat", id: "LIST" },
        { type: "Retreat", id: "MY" },
      ],
    }),

    deleteRetreat: builder.mutation<void, string>({
      query: (id) => ({ url: `/retreats/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Retreat", id: "LIST" }, { type: "Retreat", id: "MY" }],
    }),

    getRetreatRooms: builder.query<RetreatRecord[], string>({
      query: (id) => `/retreats/${id}/rooms`,
      transformResponse: (response: ApiEnvelope<{ rooms: RetreatRecord[] }>) => response.data.rooms ?? [],
    }),

    getRetreatSeats: builder.query<RetreatRecord[], string>({
      query: (id) => `/retreats/${id}/seats`,
      transformResponse: (response: ApiEnvelope<{ seats: RetreatRecord[] }>) => response.data.seats ?? [],
    }),

    updateRetreatSeatGrid: builder.mutation<unknown, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/retreats/${id}/seat-grid`, method: "POST", body }),
    }),

    snapshotVenueToRetreat: builder.mutation<unknown, { retreatId: string; venueId: string }>({
      query: ({ retreatId, venueId }) => ({
        url: `/retreats/${retreatId}/snapshot-venue/${venueId}`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, { retreatId }) => [{ type: "Retreat", id: retreatId }],
    }),

    getBedAttendee: builder.query<Record<string, unknown> | null, string>({
      query: (bedId) => `/retreats/beds/${bedId}/attendee`,
      transformResponse: (response: ApiEnvelope<{ profile?: Record<string, unknown> }>) =>
        response.data.profile ?? null,
    }),

    getSeatAttendee: builder.query<Record<string, unknown> | null, string>({
      query: (seatId) => `/retreats/seats/${seatId}/attendee`,
      transformResponse: (response: ApiEnvelope<{ profile?: Record<string, unknown> }>) =>
        response.data.profile ?? null,
    }),
  }),
});

export const {
  useGetRetreatsQuery,
  useLazyGetRetreatsQuery,
  useGetRetreatByIdQuery,
  useLazyGetRetreatByIdQuery,
  useGetMyRetreatsQuery,
  useLazyGetMyRetreatsQuery,
  useCreateRetreatMutation,
  useUpdateRetreatMutation,
  usePublishRetreatMutation,
  useDeleteRetreatMutation,
  useGetRetreatRoomsQuery,
  useLazyGetRetreatRoomsQuery,
  useGetRetreatSeatsQuery,
  useUpdateRetreatSeatGridMutation,
  useSnapshotVenueToRetreatMutation,
  useLazyGetBedAttendeeQuery,
  useLazyGetSeatAttendeeQuery,
} = retreatApi;
