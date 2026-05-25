import { baseApi } from "@/services/api/baseApi";
import type { ApiEnvelope, PaginatedResponse, QueryParams } from "@/types/api.types";

export interface BookingListItem {
  id: string | number;
  retreatId?: string | number;
  status?: string;
  totalAmount?: number;
}

export const bookingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBookings: builder.query<PaginatedResponse<BookingListItem> | BookingListItem[], QueryParams | void>({
      query: (params) => ({
        url: "/bookings",
        params: params || undefined,
      }),
      transformResponse: (
        response: ApiEnvelope<PaginatedResponse<BookingListItem> | BookingListItem[]>
      ) => response.data,
      providesTags: ["Booking"],
    }),

    getBookingById: builder.query<BookingListItem, string | number>({
      query: (id) => `/bookings/${id}`,
      transformResponse: (response: ApiEnvelope<BookingListItem>) => response.data,
      providesTags: (_result, _error, id) => [{ type: "Booking", id }],
    }),
  }),
});

export const { useGetBookingsQuery, useGetBookingByIdQuery } = bookingApi;
