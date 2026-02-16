import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  getPlatformSettings,
  updatePlatformSettings,
  invalidatePlatformSettingsCache,
  type PlatformSettings,
} from '@/lib/platform-settings';

interface PlatformSettingsContextType {
  settings: PlatformSettings | null;
  loading: boolean;
  refresh: () => Promise<void>;
  updateSettings: (
    updates: Partial<Pick<PlatformSettings, 'platform_fee_rate_instructor' | 'platform_fee_rate_venue' | 'platform_fee_min' | 'platform_fee_max'>>
  ) => Promise<{ success: boolean; error?: string }>;
  /** Instructor fee rate as decimal (e.g. 0.124 for 12.4%) */
  instructorFeeRate: number;
}

const PlatformSettingsContext = createContext<PlatformSettingsContextType | undefined>(undefined);

export const PlatformSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    invalidatePlatformSettingsCache();
    const s = await getPlatformSettings();
    setSettings(s);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const updateSettings = async (
    updates: Partial<Pick<PlatformSettings, 'platform_fee_rate_instructor' | 'platform_fee_rate_venue' | 'platform_fee_min' | 'platform_fee_max'>>
  ) => {
    const { data, error } = await updatePlatformSettings(updates);
    if (error) {
      return { success: false, error: error.message };
    }
    if (data) {
      setSettings(data);
      invalidatePlatformSettingsCache();
      return { success: true };
    }
    return { success: false, error: 'Unknown error' };
  };

  const instructorFeeRate = settings ? settings.platform_fee_rate_instructor / 100 : 0.124;

  const value: PlatformSettingsContextType = {
    settings,
    loading,
    refresh,
    updateSettings,
    instructorFeeRate,
  };

  return (
    <PlatformSettingsContext.Provider value={value}>
      {children}
    </PlatformSettingsContext.Provider>
  );
};

export const usePlatformSettings = () => {
  const context = useContext(PlatformSettingsContext);
  if (context === undefined) {
    throw new Error('usePlatformSettings must be used within a PlatformSettingsProvider');
  }
  return context;
};
