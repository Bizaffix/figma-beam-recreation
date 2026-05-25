import { baseApi } from "@/services/api/baseApi";
import type { ApiEnvelope } from "@/types/api.types";

export interface AdminDashboardSummary {
  users?: number;
  retreats?: number;
  bookings?: number;
  venues?: number;
}

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminDashboardSummary: builder.query<AdminDashboardSummary, void>({
      query: () => "/admin/dashboard/summary",
      transformResponse: (response: ApiEnvelope<AdminDashboardSummary>) => response.data,
      providesTags: ["Admin", "Dashboard"],
    }),
  }),
});

export const { useGetAdminDashboardSummaryQuery } = adminApi;
