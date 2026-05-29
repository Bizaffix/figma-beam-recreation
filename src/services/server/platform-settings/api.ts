import { baseApi } from "@/services/server/baseApi";
import type { ApiEnvelope } from "@/types/api.types";

export type PlatformSettingsMap = Record<string, unknown>;

export const platformSettingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPlatformSettings: builder.query<PlatformSettingsMap, void>({
      query: () => "/platform-settings",
      transformResponse: (response: ApiEnvelope<{ settings: PlatformSettingsMap }>) =>
        response.data.settings ?? {},
      providesTags: ["Admin"],
    }),

    updatePlatformSettings: builder.mutation<
      PlatformSettingsMap,
      { entries: { key: string; value: unknown }[] }
    >({
      query: (body) => ({ url: "/platform-settings", method: "PATCH", body }),
      transformResponse: (response: ApiEnvelope<{ settings: PlatformSettingsMap }>) =>
        response.data.settings ?? {},
      invalidatesTags: ["Admin"],
    }),
  }),
});

export const { useGetPlatformSettingsQuery, useUpdatePlatformSettingsMutation } = platformSettingsApi;
