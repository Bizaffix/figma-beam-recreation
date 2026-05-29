import { baseApi } from "@/services/server/baseApi";
import type { ApiEnvelope, QueryParams } from "@/types/api.types";
import { toParams } from "@/services/server/utils";

type Paginated<T> = { items: T[] };
export type BookingRecord = Record<string, unknown>;

export const bookingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyBookings: builder.query<BookingRecord[], QueryParams | void>({
      query: (params) => ({
        url: "/bookings/my-bookings",
        params: toParams(params ?? undefined),
      }),
      transformResponse: (response: ApiEnvelope<Paginated<BookingRecord>>) => response.data.items ?? [],
      providesTags: [{ type: "Booking", id: "MY" }],
    }),

    getInstructorBookings: builder.query<BookingRecord[], QueryParams | void>({
      query: (params) => ({
        url: "/bookings/instructor/my-bookings",
        params: toParams(params ?? undefined),
      }),
      transformResponse: (response: ApiEnvelope<Paginated<BookingRecord>>) => response.data.items ?? [],
      providesTags: [{ type: "Booking", id: "INSTRUCTOR" }],
    }),

    listBookings: builder.query<BookingRecord[], QueryParams | void>({
      query: (params) => ({
        url: "/bookings",
        params: toParams(params ?? undefined),
      }),
      transformResponse: (response: ApiEnvelope<Paginated<BookingRecord>>) => response.data.items ?? [],
      providesTags: [{ type: "Booking", id: "LIST" }],
    }),

    getBookingById: builder.query<BookingRecord, string>({
      query: (id) => `/bookings/${id}`,
      transformResponse: (response: ApiEnvelope<{ booking: BookingRecord }>) => response.data.booking,
      providesTags: (_r, _e, id) => [{ type: "Booking", id }],
    }),

    createBooking: builder.mutation<BookingRecord, Record<string, unknown>>({
      query: (body) => ({ url: "/bookings", method: "POST", body }),
      transformResponse: (response: ApiEnvelope<{ booking: BookingRecord }>) => response.data.booking,
      invalidatesTags: [
        { type: "Booking", id: "MY" },
        { type: "Booking", id: "INSTRUCTOR" },
        { type: "Retreat", id: "LIST" },
      ],
    }),

    updateBooking: builder.mutation<BookingRecord, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/bookings/${id}`, method: "PATCH", body }),
      transformResponse: (response: ApiEnvelope<{ booking: BookingRecord }>) => response.data.booking,
      invalidatesTags: (_r, _e, { id }) => [{ type: "Booking", id }],
    }),

    cancelBooking: builder.mutation<BookingRecord, { id: string; reason?: string }>({
      query: ({ id, reason }) => ({ url: `/bookings/${id}/cancel`, method: "POST", body: { reason } }),
      transformResponse: (response: ApiEnvelope<{ booking: BookingRecord }>) => response.data.booking,
      invalidatesTags: (_r, _e, { id }) => [{ type: "Booking", id }, { type: "Booking", id: "MY" }],
    }),

    holdInventory: builder.mutation<
      unknown,
      { retreatId: string; body: { bedId?: string; seatId?: string } }
    >({
      query: ({ retreatId, body }) => ({
        url: `/bookings/${retreatId}/hold-inventory`,
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useGetMyBookingsQuery,
  useLazyGetMyBookingsQuery,
  useGetInstructorBookingsQuery,
  useLazyGetInstructorBookingsQuery,
  useListBookingsQuery,
  useLazyListBookingsQuery,
  useGetBookingByIdQuery,
  useLazyGetBookingByIdQuery,
  useCreateBookingMutation,
  useUpdateBookingMutation,
  useCancelBookingMutation,
  useHoldInventoryMutation,
} = bookingApi;
