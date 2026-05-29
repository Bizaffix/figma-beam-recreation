import { baseApi } from "@/services/server/baseApi";
import type { ApiEnvelope, QueryParams } from "@/types/api.types";
import type { VenueIcalTokenStatus } from "@/types/venue-ical.types";
import { toParams } from "@/services/server/utils";

type Paginated<T> = { items: T[] };
type VenueRecord = Record<string, unknown>;

export const venueApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getVenues: builder.query<VenueRecord[], QueryParams | void>({
      query: (params) => ({
        url: "/venues",
        params: toParams({ limit: 60, sort: "createdAt:desc", ...params }),
      }),
      transformResponse: (response: ApiEnvelope<Paginated<VenueRecord>>) => response.data.items ?? [],
      providesTags: (result) =>
        result
          ? [
              ...result.map((v) => ({ type: "Venue" as const, id: String(v.id) })),
              { type: "Venue", id: "LIST" },
            ]
          : [{ type: "Venue", id: "LIST" }],
    }),

    getVenueById: builder.query<VenueRecord, string>({
      query: (id) => `/venues/${id}`,
      transformResponse: (response: ApiEnvelope<{ venue: VenueRecord }>) => response.data.venue,
      providesTags: (_r, _e, id) => [{ type: "Venue", id }],
    }),

    getMyVenues: builder.query<VenueRecord[], QueryParams | void>({
      query: (params) => ({
        url: "/venues/owner/my-venues",
        params: toParams(params ?? undefined),
      }),
      transformResponse: (response: ApiEnvelope<Paginated<VenueRecord>>) => response.data.items ?? [],
      providesTags: [{ type: "Venue", id: "MY" }],
    }),

    createVenue: builder.mutation<VenueRecord, Record<string, unknown>>({
      query: (body) => ({ url: "/venues", method: "POST", body }),
      transformResponse: (response: ApiEnvelope<{ venue: VenueRecord }>) => response.data.venue,
      invalidatesTags: [{ type: "Venue", id: "LIST" }, { type: "Venue", id: "MY" }],
    }),

    updateVenue: builder.mutation<VenueRecord, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/venues/${id}`, method: "PATCH", body }),
      transformResponse: (response: ApiEnvelope<{ venue: VenueRecord }>) => response.data.venue,
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Venue", id },
        { type: "Venue", id: "LIST" },
        { type: "Venue", id: "MY" },
      ],
    }),

    deleteVenue: builder.mutation<void, string>({
      query: (id) => ({ url: `/venues/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Venue", id: "LIST" }, { type: "Venue", id: "MY" }],
    }),

    getVenueRooms: builder.query<VenueRecord[], string>({
      query: (venueId) => `/venues/${venueId}/rooms`,
      transformResponse: (response: ApiEnvelope<{ rooms: VenueRecord[] }>) => response.data.rooms ?? [],
      providesTags: (_r, _e, venueId) => [{ type: "Venue", id: `${venueId}-rooms` }],
    }),

    createVenueRoom: builder.mutation<VenueRecord, { venueId: string; body: Record<string, unknown> }>({
      query: ({ venueId, body }) => ({ url: `/venues/${venueId}/rooms`, method: "POST", body }),
      transformResponse: (response: ApiEnvelope<{ room: VenueRecord }>) => response.data.room,
      invalidatesTags: (_r, _e, { venueId }) => [{ type: "Venue", id: `${venueId}-rooms` }],
    }),

    updateVenueRoom: builder.mutation<
      VenueRecord,
      { venueId: string; roomId: string; body: Record<string, unknown> }
    >({
      query: ({ venueId, roomId, body }) => ({
        url: `/venues/${venueId}/rooms/${roomId}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (response: ApiEnvelope<{ room: VenueRecord }>) => response.data.room,
      invalidatesTags: (_r, _e, { venueId }) => [{ type: "Venue", id: `${venueId}-rooms` }],
    }),

    deleteVenueRoom: builder.mutation<void, { venueId: string; roomId: string }>({
      query: ({ venueId, roomId }) => ({ url: `/venues/${venueId}/rooms/${roomId}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, { venueId }) => [{ type: "Venue", id: `${venueId}-rooms` }],
    }),

    createVenueBed: builder.mutation<
      VenueRecord,
      { venueId: string; roomId: string; body: Record<string, unknown> }
    >({
      query: ({ venueId, roomId, body }) => ({
        url: `/venues/${venueId}/rooms/${roomId}/beds`,
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiEnvelope<{ bed: VenueRecord }>) => response.data.bed,
      invalidatesTags: (_r, _e, { venueId }) => [{ type: "Venue", id: `${venueId}-rooms` }],
    }),

    updateVenueBed: builder.mutation<
      VenueRecord,
      { venueId: string; bedId: string; body: Record<string, unknown> }
    >({
      query: ({ venueId, bedId, body }) => ({
        url: `/venues/${venueId}/beds/${bedId}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (response: ApiEnvelope<{ bed: VenueRecord }>) => response.data.bed,
      invalidatesTags: (_r, _e, { venueId }) => [{ type: "Venue", id: `${venueId}-rooms` }],
    }),

    deleteVenueBed: builder.mutation<void, { venueId: string; bedId: string }>({
      query: ({ venueId, bedId }) => ({ url: `/venues/${venueId}/beds/${bedId}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, { venueId }) => [{ type: "Venue", id: `${venueId}-rooms` }],
    }),

    getVenueIcalToken: builder.query<VenueIcalTokenStatus, string>({
      query: (venueId) => `/venues/${venueId}/ical/token`,
      transformResponse: (response: ApiEnvelope<VenueIcalTokenStatus>) => response.data,
      providesTags: (_r, _e, venueId) => [{ type: "Venue", id: `${venueId}-ical` }],
    }),

    regenerateVenueIcalToken: builder.mutation<VenueIcalTokenStatus, string>({
      query: (venueId) => ({
        url: `/venues/${venueId}/ical/token/regenerate`,
        method: "POST",
      }),
      transformResponse: (response: ApiEnvelope<VenueIcalTokenStatus>) => response.data,
      invalidatesTags: (_r, _e, venueId) => [{ type: "Venue", id: `${venueId}-ical` }],
    }),
  }),
});

export const {
  useGetVenuesQuery,
  useLazyGetVenuesQuery,
  useGetVenueByIdQuery,
  useLazyGetVenueByIdQuery,
  useGetMyVenuesQuery,
  useLazyGetMyVenuesQuery,
  useCreateVenueMutation,
  useUpdateVenueMutation,
  useDeleteVenueMutation,
  useGetVenueRoomsQuery,
  useLazyGetVenueRoomsQuery,
  useCreateVenueRoomMutation,
  useUpdateVenueRoomMutation,
  useDeleteVenueRoomMutation,
  useCreateVenueBedMutation,
  useUpdateVenueBedMutation,
  useDeleteVenueBedMutation,
  useGetVenueIcalTokenQuery,
  useLazyGetVenueIcalTokenQuery,
  useRegenerateVenueIcalTokenMutation,
} = venueApi;
