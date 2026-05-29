import { createContext, useCallback, useContext, useMemo, ReactNode } from "react";
import {
  useGetPlatformSettingsQuery,
  useUpdatePlatformSettingsMutation,
} from "@/services/server/platform-settings/api";
import type { PlatformSettings } from "@/lib/platform-settings";

export type { PlatformSettings };

const DEFAULT_SETTINGS: PlatformSettings = {
  id: "",
  platform_fee_rate_instructor: 12.4,
  platform_fee_rate_venue: 0,
  platform_fee_min: 0,
  platform_fee_max: 0,
  ai_subscription_monthly_price: 3.99,
  updated_at: "",
};

const mapSettings = (settings: Record<string, unknown>): PlatformSettings => ({
  id: "platform",
  platform_fee_rate_instructor: Number(
    settings["platform.fee_percent_instructor"] ?? DEFAULT_SETTINGS.platform_fee_rate_instructor,
  ),
  platform_fee_rate_venue: Number(
    settings["platform.fee_percent_venue"] ?? DEFAULT_SETTINGS.platform_fee_rate_venue,
  ),
  platform_fee_min: Number(settings["platform.fee_min"] ?? DEFAULT_SETTINGS.platform_fee_min),
  platform_fee_max: Number(settings["platform.fee_max"] ?? DEFAULT_SETTINGS.platform_fee_max),
  ai_subscription_monthly_price: Number(
    settings["ai.subscription_monthly_price"] ?? DEFAULT_SETTINGS.ai_subscription_monthly_price,
  ),
  updated_at: new Date().toISOString(),
});

interface PlatformSettingsContextType {
  settings: PlatformSettings | null;
  loading: boolean;
  refresh: () => Promise<void>;
  updateSettings: (
    updates: Partial<
      Pick<
        PlatformSettings,
        | "platform_fee_rate_instructor"
        | "platform_fee_rate_venue"
        | "platform_fee_min"
        | "platform_fee_max"
        | "ai_subscription_monthly_price"
      >
    >,
  ) => Promise<{ success: boolean; error?: string }>;
  instructorFeeRate: number;
}

const PlatformSettingsContext = createContext<PlatformSettingsContextType | undefined>(undefined);

export const PlatformSettingsProvider = ({ children }: { children: ReactNode }) => {
  const { data, isLoading, refetch } = useGetPlatformSettingsQuery();
  const [updatePlatformSettingsMutation] = useUpdatePlatformSettingsMutation();

  const settings = useMemo(() => (data ? mapSettings(data) : null), [data]);

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const updateSettings = useCallback(
    async (
      updates: Partial<
        Pick<
          PlatformSettings,
          | "platform_fee_rate_instructor"
          | "platform_fee_rate_venue"
          | "platform_fee_min"
          | "platform_fee_max"
          | "ai_subscription_monthly_price"
        >
      >,
    ) => {
      try {
        const entries = [
          updates.platform_fee_rate_instructor != null && {
            key: "platform.fee_percent_instructor",
            value: updates.platform_fee_rate_instructor,
          },
          updates.platform_fee_rate_venue != null && {
            key: "platform.fee_percent_venue",
            value: updates.platform_fee_rate_venue,
          },
          updates.platform_fee_min != null && { key: "platform.fee_min", value: updates.platform_fee_min },
          updates.platform_fee_max != null && { key: "platform.fee_max", value: updates.platform_fee_max },
          updates.ai_subscription_monthly_price != null && {
            key: "ai.subscription_monthly_price",
            value: updates.ai_subscription_monthly_price,
          },
        ].filter(Boolean) as { key: string; value: unknown }[];

        await updatePlatformSettingsMutation({ entries }).unwrap();
        await refetch();
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Update failed",
        };
      }
    },
    [updatePlatformSettingsMutation, refetch],
  );

  const instructorFeeRate = settings ? settings.platform_fee_rate_instructor / 100 : 0.124;

  const value: PlatformSettingsContextType = {
    settings,
    loading: isLoading,
    refresh,
    updateSettings,
    instructorFeeRate,
  };

  return <PlatformSettingsContext.Provider value={value}>{children}</PlatformSettingsContext.Provider>;
};

export const usePlatformSettings = () => {
  const context = useContext(PlatformSettingsContext);
  if (context === undefined) {
    throw new Error("usePlatformSettings must be used within a PlatformSettingsProvider");
  }
  return context;
};
