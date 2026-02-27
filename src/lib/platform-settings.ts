import { supabase } from './supabase';

export interface PlatformSettings {
  id: string;
  platform_fee_rate_instructor: number;
  platform_fee_rate_venue: number;
  platform_fee_min: number;
  platform_fee_max: number;
  ai_subscription_monthly_price: number;
  updated_at: string;
}

const DEFAULT_SETTINGS: PlatformSettings = {
  id: '',
  platform_fee_rate_instructor: 12.4,
  platform_fee_rate_venue: 0,
  platform_fee_min: 0,
  platform_fee_max: 0,
  ai_subscription_monthly_price: 3.99,
  updated_at: '',
};

let cachedSettings: PlatformSettings | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60_000; // 1 minute

/**
 * Fetch platform settings from the database.
 * Uses a short cache to avoid excessive reads.
 */
export async function getPlatformSettings(): Promise<PlatformSettings> {
  if (cachedSettings && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return cachedSettings;
  }

  const { data, error } = await supabase
    .from('platform_settings')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    console.warn('Failed to fetch platform settings, using defaults:', error.message);
    return { ...DEFAULT_SETTINGS };
  }

  cachedSettings = {
    id: data.id,
    platform_fee_rate_instructor: Number(data.platform_fee_rate_instructor ?? 12.4),
    platform_fee_rate_venue: Number(data.platform_fee_rate_venue ?? 0),
    platform_fee_min: Number(data.platform_fee_min ?? 0),
    platform_fee_max: Number(data.platform_fee_max ?? 0),
    ai_subscription_monthly_price: Number(data.ai_subscription_monthly_price ?? 3.99),
    updated_at: data.updated_at ?? '',
  };
  cacheTimestamp = Date.now();
  return cachedSettings;
}

/**
 * Get the instructor platform fee rate as a decimal (e.g. 0.124 for 12.4%).
 */
export function getInstructorFeeRateDecimal(settings: PlatformSettings): number {
  return settings.platform_fee_rate_instructor / 100;
}

/**
 * Update platform settings (admin only).
 */
export async function updatePlatformSettings(
  updates: Partial<Pick<PlatformSettings, 'platform_fee_rate_instructor' | 'platform_fee_rate_venue' | 'platform_fee_min' | 'platform_fee_max' | 'ai_subscription_monthly_price'>>
): Promise<{ data: PlatformSettings | null; error: Error | null }> {
  const { data: existing } = await supabase
    .from('platform_settings')
    .select('id')
    .limit(1)
    .single();

  if (!existing?.id) {
    const { data: inserted, error: insertError } = await supabase
      .from('platform_settings')
      .insert({
        platform_fee_rate_instructor: updates.platform_fee_rate_instructor ?? 12.4,
        platform_fee_rate_venue: updates.platform_fee_rate_venue ?? 0,
        platform_fee_min: updates.platform_fee_min ?? 0,
        platform_fee_max: updates.platform_fee_max ?? 0,
        ai_subscription_monthly_price: updates.ai_subscription_monthly_price ?? 3.99,
      })
      .select()
      .single();

    if (insertError) return { data: null, error: insertError as Error };
    cachedSettings = null;
    return { data: inserted as PlatformSettings, error: null };
  }

  const { data, error } = await supabase
    .from('platform_settings')
    .update(updates)
    .eq('id', existing.id)
    .select()
    .single();

  if (error) return { data: null, error: error as Error };
  cachedSettings = null;
  return { data: data as PlatformSettings, error: null };
}

/**
 * Invalidate the cache (call after admin updates).
 */
export function invalidatePlatformSettingsCache(): void {
  cachedSettings = null;
}
