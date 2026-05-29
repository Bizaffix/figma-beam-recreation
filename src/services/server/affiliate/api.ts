import { baseApi } from "@/services/server/baseApi";
import type { ApiEnvelope, QueryParams } from "@/types/api.types";
import { toParams } from "@/services/server/utils";

export type AffiliateRecord = Record<string, unknown>;
export type AffiliateLinkRecord = Record<string, unknown>;
export type AffiliateCampaignRecord = Record<string, unknown>;

export const affiliateApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    trackAffiliate: builder.mutation<
      unknown,
      { affiliateCode: string; referredUserId?: string; bookingId?: string; commission?: number }
    >({
      query: (body) => ({ url: "/affiliates/track", method: "POST", body }),
    }),

    getMyAffiliate: builder.query<{ affiliate: AffiliateRecord; referrals?: unknown[] }, void>({
      query: () => "/affiliates/me",
      transformResponse: (response: ApiEnvelope<{ affiliate: AffiliateRecord; referrals?: unknown[] }>) =>
        response.data,
      providesTags: ["Affiliate"],
    }),

    getMyAffiliateLinks: builder.query<AffiliateLinkRecord[], void>({
      query: () => "/affiliates/me/links",
      transformResponse: (response: ApiEnvelope<{ links: AffiliateLinkRecord[] }>) => response.data.links ?? [],
    }),

    createAffiliateLink: builder.mutation<AffiliateLinkRecord, Record<string, unknown>>({
      query: (body) => ({ url: "/affiliates/me/links", method: "POST", body }),
      transformResponse: (response: ApiEnvelope<{ link: AffiliateLinkRecord }>) => response.data.link,
      invalidatesTags: ["Affiliate"],
    }),

    deleteAffiliateLink: builder.mutation<void, string>({
      query: (id) => ({ url: `/affiliates/me/links/${id}`, method: "DELETE" }),
      invalidatesTags: ["Affiliate"],
    }),

    getMyCommissions: builder.query<AffiliateRecord[], void>({
      query: () => "/affiliates/me/commissions",
      transformResponse: (response: ApiEnvelope<{ commissions: AffiliateRecord[] }>) =>
        response.data.commissions ?? [],
    }),

    getCampaigns: builder.query<AffiliateCampaignRecord[], void>({
      query: () => "/affiliates/campaigns",
      transformResponse: (response: ApiEnvelope<{ campaigns: AffiliateCampaignRecord[] }>) =>
        response.data.campaigns ?? [],
    }),

    createCampaign: builder.mutation<AffiliateCampaignRecord, Record<string, unknown>>({
      query: (body) => ({ url: "/affiliates/campaigns", method: "POST", body }),
      transformResponse: (response: ApiEnvelope<{ campaign: AffiliateCampaignRecord }>) => response.data.campaign,
      invalidatesTags: ["Affiliate"],
    }),

    updateCampaign: builder.mutation<
      AffiliateCampaignRecord,
      { id: string; body: Record<string, unknown> }
    >({
      query: ({ id, body }) => ({ url: `/affiliates/campaigns/${id}`, method: "PATCH", body }),
      transformResponse: (response: ApiEnvelope<{ campaign: AffiliateCampaignRecord }>) => response.data.campaign,
      invalidatesTags: ["Affiliate"],
    }),

    deleteCampaign: builder.mutation<void, string>({
      query: (id) => ({ url: `/affiliates/campaigns/${id}`, method: "DELETE" }),
      invalidatesTags: ["Affiliate"],
    }),

    assignCampaign: builder.mutation<unknown, Record<string, unknown>>({
      query: (body) => ({ url: "/affiliates/campaigns/assign", method: "POST", body }),
    }),

    listAllAffiliates: builder.query<AffiliateRecord[], void>({
      query: () => "/affiliates",
      transformResponse: (response: ApiEnvelope<{ affiliates: AffiliateRecord[] }>) =>
        response.data.affiliates ?? [],
      providesTags: ["Affiliate"],
    }),

    createAffiliate: builder.mutation<AffiliateRecord, Record<string, unknown>>({
      query: (body) => ({ url: "/affiliates", method: "POST", body }),
      transformResponse: (response: ApiEnvelope<{ affiliate: AffiliateRecord }>) => response.data.affiliate,
      invalidatesTags: ["Affiliate"],
    }),

    updateAffiliate: builder.mutation<AffiliateRecord, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/affiliates/${id}`, method: "PATCH", body }),
      transformResponse: (response: ApiEnvelope<{ affiliate: AffiliateRecord }>) => response.data.affiliate,
      invalidatesTags: ["Affiliate"],
    }),

    listAllAffiliateLinks: builder.query<AffiliateLinkRecord[], void>({
      query: () => "/affiliates/links",
      transformResponse: (response: ApiEnvelope<{ links: AffiliateLinkRecord[] }>) => response.data.links ?? [],
    }),

    createAdminAffiliateLink: builder.mutation<AffiliateLinkRecord, Record<string, unknown>>({
      query: (body) => ({ url: "/affiliates/links", method: "POST", body }),
      transformResponse: (response: ApiEnvelope<{ link: AffiliateLinkRecord }>) => response.data.link,
    }),

    listAllReferrals: builder.query<AffiliateRecord[], QueryParams | void>({
      query: (params) => ({ url: "/affiliates/referrals", params: toParams(params ?? undefined) }),
      transformResponse: (response: ApiEnvelope<{ referrals: AffiliateRecord[] }>) =>
        response.data.referrals ?? [],
    }),

    listAllCommissions: builder.query<AffiliateRecord[], void>({
      query: () => "/affiliates/commissions",
      transformResponse: (response: ApiEnvelope<{ commissions: AffiliateRecord[] }>) =>
        response.data.commissions ?? [],
    }),

    listPayouts: builder.query<unknown[], void>({
      query: () => "/affiliates/payouts",
      transformResponse: (response: ApiEnvelope<{ payouts: unknown[] }>) => response.data.payouts ?? [],
    }),

    createPayout: builder.mutation<unknown, Record<string, unknown>>({
      query: (body) => ({ url: "/affiliates/payouts", method: "POST", body }),
    }),

    setCommissionStatus: builder.mutation<unknown, { id: string; status: string }>({
      query: ({ id, status }) => ({
        url: `/affiliates/commissions/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
    }),
  }),
});

export const {
  useTrackAffiliateMutation,
  useGetMyAffiliateQuery,
  useLazyGetMyAffiliateQuery,
  useGetMyAffiliateLinksQuery,
  useLazyGetMyAffiliateLinksQuery,
  useCreateAffiliateLinkMutation,
  useDeleteAffiliateLinkMutation,
  useGetMyCommissionsQuery,
  useLazyGetMyCommissionsQuery,
  useGetCampaignsQuery,
  useLazyGetCampaignsQuery,
  useCreateCampaignMutation,
  useUpdateCampaignMutation,
  useDeleteCampaignMutation,
  useAssignCampaignMutation,
  useListAllAffiliatesQuery,
  useLazyListAllAffiliatesQuery,
  useCreateAffiliateMutation,
  useUpdateAffiliateMutation,
  useListAllAffiliateLinksQuery,
  useLazyListAllAffiliateLinksQuery,
  useCreateAdminAffiliateLinkMutation,
  useListAllReferralsQuery,
  useLazyListAllReferralsQuery,
  useListAllCommissionsQuery,
  useLazyListAllCommissionsQuery,
  useListPayoutsQuery,
  useLazyListPayoutsQuery,
  useCreatePayoutMutation,
  useSetCommissionStatusMutation,
} = affiliateApi;
