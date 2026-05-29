import { baseApi } from "@/services/server/baseApi";
import type { ApiEnvelope, QueryParams } from "@/types/api.types";
import { toParams } from "@/services/server/utils";

type Paginated<T> = { items: T[] };

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminDashboard: builder.query<Record<string, unknown>, void>({
      query: () => "/admin/dashboard",
      transformResponse: (response: ApiEnvelope<Record<string, unknown>>) => response.data,
      providesTags: ["Dashboard", "Admin"],
    }),

    getAdminAnalytics: builder.query<Record<string, unknown>, QueryParams | void>({
      query: (params) => ({ url: "/admin/analytics", params: toParams(params ?? undefined) }),
      transformResponse: (response: ApiEnvelope<Record<string, unknown>>) => response.data,
    }),

    getAdminUsers: builder.query<Record<string, unknown>[], QueryParams | void>({
      query: (params) => ({ url: "/admin/users", params: toParams(params ?? undefined) }),
      transformResponse: (response: ApiEnvelope<Paginated<Record<string, unknown>>>) => response.data.items ?? [],
      providesTags: ["Admin"],
    }),

    updateAdminUser: builder.mutation<
      Record<string, unknown>,
      { id: string; body: Record<string, unknown> }
    >({
      query: ({ id, body }) => ({ url: `/admin/users/${id}`, method: "PATCH", body }),
      transformResponse: (response: ApiEnvelope<{ user: Record<string, unknown> }>) => response.data.user,
      invalidatesTags: ["Admin"],
    }),

    approveRetreat: builder.mutation<unknown, string>({
      query: (id) => ({ url: `/admin/retreats/${id}/approve`, method: "PATCH" }),
      invalidatesTags: ["Retreat", "Admin"],
    }),

    rejectRetreat: builder.mutation<unknown, { id: string; body?: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/admin/retreats/${id}/reject`, method: "PATCH", body }),
      invalidatesTags: ["Retreat", "Admin"],
    }),

    approveVenue: builder.mutation<unknown, string>({
      query: (id) => ({ url: `/admin/venues/${id}/approve`, method: "PATCH" }),
      invalidatesTags: ["Venue", "Admin"],
    }),

    rejectVenue: builder.mutation<unknown, { id: string; body?: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/admin/venues/${id}/reject`, method: "PATCH", body }),
      invalidatesTags: ["Venue", "Admin"],
    }),

    getAdminPayments: builder.query<Record<string, unknown>[], QueryParams | void>({
      query: (params) => ({ url: "/admin/payments", params: toParams(params ?? undefined) }),
      transformResponse: (response: ApiEnvelope<Paginated<Record<string, unknown>>>) => response.data.items ?? [],
    }),

    getAdminBookings: builder.query<Record<string, unknown>[], QueryParams | void>({
      query: (params) => ({ url: "/admin/bookings", params: toParams(params ?? undefined) }),
      transformResponse: (response: ApiEnvelope<Paginated<Record<string, unknown>>>) => response.data.items ?? [],
    }),

    getAdminRetreats: builder.query<Record<string, unknown>[], QueryParams | void>({
      query: (params) => ({ url: "/admin/retreats", params: toParams(params ?? undefined) }),
      transformResponse: (response: ApiEnvelope<Paginated<Record<string, unknown>>>) => response.data.items ?? [],
    }),

    getAdminVenues: builder.query<Record<string, unknown>[], QueryParams | void>({
      query: (params) => ({ url: "/admin/venues", params: toParams(params ?? undefined) }),
      transformResponse: (response: ApiEnvelope<Paginated<Record<string, unknown>>>) => response.data.items ?? [],
    }),

    getAuditLogs: builder.query<Record<string, unknown>[], QueryParams | void>({
      query: (params) => ({ url: "/admin/audit-logs", params: toParams(params ?? undefined) }),
      transformResponse: (response: ApiEnvelope<Paginated<Record<string, unknown>>>) => response.data.items ?? [],
    }),

    getEmailTemplates: builder.query<Record<string, unknown>[], void>({
      query: () => "/admin/email-templates",
      transformResponse: (response: ApiEnvelope<{ templates: Record<string, unknown>[] }>) =>
        response.data.templates ?? [],
    }),

    createEmailTemplate: builder.mutation<Record<string, unknown>, Record<string, unknown>>({
      query: (body) => ({ url: "/admin/email-templates", method: "POST", body }),
      transformResponse: (response: ApiEnvelope<{ template: Record<string, unknown> }>) => response.data.template,
    }),

    deleteEmailTemplate: builder.mutation<void, string>({
      query: (id) => ({ url: `/admin/email-templates/${id}`, method: "DELETE" }),
    }),

    generateBlog: builder.mutation<{ slug: string }, void>({
      query: () => ({ url: "/admin/content/generate-blog", method: "POST" }),
      transformResponse: (response: ApiEnvelope<{ slug: string }>) => response.data,
      invalidatesTags: ["Content"],
    }),

    generateNews: builder.mutation<{ slugs: string[] }, void>({
      query: () => ({ url: "/admin/content/generate-news", method: "POST" }),
      transformResponse: (response: ApiEnvelope<{ slugs: string[] }>) => response.data,
      invalidatesTags: ["Content"],
    }),

    notifyNewRetreat: builder.mutation<unknown, Record<string, unknown>>({
      query: (body) => ({ url: "/admin/notifications/retreat", method: "POST", body }),
    }),
  }),
});

export const {
  useGetAdminDashboardQuery,
  useLazyGetAdminDashboardQuery,
  useGetAdminAnalyticsQuery,
  useGetAdminUsersQuery,
  useLazyGetAdminUsersQuery,
  useUpdateAdminUserMutation,
  useApproveRetreatMutation,
  useRejectRetreatMutation,
  useApproveVenueMutation,
  useRejectVenueMutation,
  useGetAdminPaymentsQuery,
  useGetAdminBookingsQuery,
  useLazyGetAdminBookingsQuery,
  useGetAdminRetreatsQuery,
  useLazyGetAdminRetreatsQuery,
  useGetAdminVenuesQuery,
  useLazyGetAdminVenuesQuery,
  useGetAuditLogsQuery,
  useGetEmailTemplatesQuery,
  useLazyGetEmailTemplatesQuery,
  useCreateEmailTemplateMutation,
  useDeleteEmailTemplateMutation,
  useGenerateBlogMutation,
  useGenerateNewsMutation,
  useNotifyNewRetreatMutation,
} = adminApi;

export const useGetAdminDashboardSummaryQuery = useGetAdminDashboardQuery;
