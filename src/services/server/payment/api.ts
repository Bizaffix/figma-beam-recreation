import { baseApi } from "@/services/server/baseApi";
import type { ApiEnvelope } from "@/types/api.types";

export const paymentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createPaymentIntent: builder.mutation<
      { clientSecret: string; paymentIntentId?: string },
      { bookingId: string }
    >({
      query: (body) => ({ url: "/payments/create-intent", method: "POST", body }),
      transformResponse: (
        response: ApiEnvelope<{ clientSecret: string; paymentIntentId?: string }>,
      ) => response.data,
    }),

    confirmPayment: builder.mutation<unknown, Record<string, unknown>>({
      query: (body) => ({ url: "/payments/confirm", method: "POST", body }),
      invalidatesTags: [{ type: "Booking", id: "MY" }],
    }),

    getBookingPayment: builder.query<Record<string, unknown>, string>({
      query: (bookingId) => `/payments/booking/${bookingId}`,
      transformResponse: (response: ApiEnvelope<Record<string, unknown>>) => response.data,
    }),

    submitManualProof: builder.mutation<unknown, { bookingId: string; body: Record<string, unknown> }>({
      query: ({ bookingId, body }) => ({
        url: `/payments/${bookingId}/manual-proof`,
        method: "POST",
        body,
      }),
    }),

    approveManualPayment: builder.mutation<unknown, string>({
      query: (bookingId) => ({ url: `/payments/${bookingId}/approve`, method: "POST" }),
      invalidatesTags: [{ type: "Booking", id: "LIST" }, { type: "Booking", id: "INSTRUCTOR" }],
    }),

    rejectManualPayment: builder.mutation<unknown, { bookingId: string; body?: Record<string, unknown> }>({
      query: ({ bookingId, body }) => ({
        url: `/payments/${bookingId}/reject`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Booking", id: "LIST" }, { type: "Booking", id: "INSTRUCTOR" }],
    }),

    processRefund: builder.mutation<Record<string, unknown>, { bookingId: string; reason: string }>({
      query: ({ bookingId, reason }) => ({
        url: `/payments/${bookingId}/refund`,
        method: "POST",
        body: { reason },
      }),
      transformResponse: (response: ApiEnvelope<{ booking: Record<string, unknown> }>) => response.data.booking,
      invalidatesTags: [{ type: "Booking", id: "LIST" }],
    }),
  }),
});

export const {
  useCreatePaymentIntentMutation,
  useConfirmPaymentMutation,
  useGetBookingPaymentQuery,
  useSubmitManualProofMutation,
  useApproveManualPaymentMutation,
  useRejectManualPaymentMutation,
  useProcessRefundMutation,
} = paymentApi;
