/**
 * Affiliate Tracking Utilities
 * Handles URL parameter tracking, cookie management, and attribution
 */

import { supabase } from './supabase';

const AFFILIATE_COOKIE_NAME = 'affiliate_ref';
const AFFILIATE_COOKIE_EXPIRY_DAYS = 30;

export interface AffiliateCookieData {
  linkCode: string;
  affiliateId: string;
  campaignId: string;
  timestamp: number;
}

/**
 * Get affiliate code from URL parameter
 */
export const getAffiliateCodeFromUrl = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  const params = new URLSearchParams(window.location.search);
  return params.get('ref') || params.get('affiliate') || null;
};

/**
 * Set affiliate cookie
 */
export const setAffiliateCookie = (data: AffiliateCookieData): void => {
  if (typeof document === 'undefined') return;
  
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + AFFILIATE_COOKIE_EXPIRY_DAYS);
  
  const cookieValue = JSON.stringify(data);
  document.cookie = `${AFFILIATE_COOKIE_NAME}=${encodeURIComponent(cookieValue)}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
};

/**
 * Get affiliate data from cookie
 */
export const getAffiliateFromCookie = (): AffiliateCookieData | null => {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  const affiliateCookie = cookies.find(c => c.trim().startsWith(`${AFFILIATE_COOKIE_NAME}=`));
  
  if (!affiliateCookie) return null;
  
  try {
    const cookieValue = affiliateCookie.split('=')[1];
    const decoded = decodeURIComponent(cookieValue);
    const data: AffiliateCookieData = JSON.parse(decoded);
    
    // Check if cookie is still valid (within expiry window)
    const cookieAge = Date.now() - data.timestamp;
    const maxAge = AFFILIATE_COOKIE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    
    if (cookieAge > maxAge) {
      clearAffiliateCookie();
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error parsing affiliate cookie:', error);
    return null;
  }
};

/**
 * Clear affiliate cookie
 */
export const clearAffiliateCookie = (): void => {
  if (typeof document === 'undefined') return;
  document.cookie = `${AFFILIATE_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

/**
 * Track affiliate link click
 */
export const trackAffiliateClick = async (linkCode: string): Promise<void> => {
  try {
    // Get affiliate link ID from code
    const { data: link, error: linkError } = await supabase
      .from('affiliate_links')
      .select('id')
      .eq('link_code', linkCode)
      .single();
    
    if (linkError || !link) {
      console.error('Error finding affiliate link:', linkError);
      return;
    }
    
    // Record click
    await supabase
      .from('affiliate_link_clicks')
      .insert({
        affiliate_link_id: link.id,
        ip_address: null, // Would need server-side to get real IP
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        referrer: typeof document !== 'undefined' ? document.referrer : null,
      });
    
    // Increment click count
    await supabase.rpc('increment_affiliate_link_clicks', { link_id: link.id });
  } catch (error) {
    console.error('Error tracking affiliate click:', error);
  }
};

/**
 * Initialize affiliate tracking from URL
 * Call this on page load to capture affiliate codes from URL
 */
export const initializeAffiliateTracking = async (): Promise<void> => {
  const affiliateCode = getAffiliateCodeFromUrl();
  
  if (!affiliateCode) {
    // Check for existing cookie
    const existingCookie = getAffiliateFromCookie();
    return; // No new affiliate code, keep existing cookie if any
  }
  
  try {
    // Look up affiliate link
    const { data: link, error } = await supabase
      .from('affiliate_links')
      .select(`
        id,
        link_code,
        affiliate_id,
        campaign_id,
        affiliate:affiliates!inner(id, status)
      `)
      .eq('link_code', affiliateCode)
      .eq('affiliate.status', 'approved')
      .single();
    
    if (error || !link) {
      console.error('Invalid or inactive affiliate link:', error);
      return;
    }
    
    // Track click
    await trackAffiliateClick(affiliateCode);
    
    // Set cookie with affiliate data
    setAffiliateCookie({
      linkCode: link.link_code,
      affiliateId: link.affiliate_id,
      campaignId: link.campaign_id,
      timestamp: Date.now(),
    });
    
    // Clean URL (remove affiliate parameter)
    if (typeof window !== 'undefined' && window.history) {
      const url = new URL(window.location.href);
      url.searchParams.delete('ref');
      url.searchParams.delete('affiliate');
      window.history.replaceState({}, '', url.toString());
    }
  } catch (error) {
    console.error('Error initializing affiliate tracking:', error);
  }
};

/**
 * Get current affiliate attribution
 * Returns the affiliate data if user was referred via affiliate link
 */
export const getCurrentAffiliate = (): AffiliateCookieData | null => {
  return getAffiliateFromCookie();
};

/**
 * Create referral record
 * Call this when a conversion event occurs (booking, signup, etc.)
 */
export const createReferral = async (
  referralType: 'student' | 'organizer' | 'venue',
  referredUserId?: string,
  referredVenueId?: string
): Promise<string | null> => {
  const affiliateData = getCurrentAffiliate();
  
  if (!affiliateData) {
    return null; // No affiliate attribution
  }
  
  try {
    // Get affiliate link
    const { data: link, error: linkError } = await supabase
      .from('affiliate_links')
      .select('id')
      .eq('link_code', affiliateData.linkCode)
      .single();
    
    if (linkError || !link) {
      console.error('Error finding affiliate link:', linkError);
      return null;
    }
    
    // Create referral record
    const { data: referral, error: referralError } = await supabase
      .from('affiliate_referrals')
      .insert({
        affiliate_id: affiliateData.affiliateId,
        campaign_id: affiliateData.campaignId,
        affiliate_link_id: link.id,
        referred_user_id: referredUserId || null,
        referred_venue_id: referredVenueId || null,
        referral_type: referralType,
        attribution_method: 'link',
        cookie_data: affiliateData,
      })
      .select('id')
      .single();
    
    if (referralError) {
      console.error('Error creating referral:', referralError);
      return null;
    }
    
    return referral.id;
  } catch (error) {
    console.error('Error creating referral:', error);
    return null;
  }
};

/**
 * Mark referral as converted and create commission
 */
export const convertReferral = async (
  referralId: string,
  conversionEventType: 'booking' | 'organizer_verified' | 'venue_activated',
  conversionEventId: string,
  transactionAmount: number,
  platformFee: number = 0
): Promise<string | null> => {
  try {
    // Get referral details
    const { data: referral, error: referralError } = await supabase
      .from('affiliate_referrals')
      .select(`
        *,
        campaign:affiliate_campaigns(*)
      `)
      .eq('id', referralId)
      .single();
    
    if (referralError || !referral) {
      console.error('Error fetching referral:', referralError);
      return null;
    }
    
    // Update referral as converted
    await supabase
      .from('affiliate_referrals')
      .update({
        converted: true,
        conversion_event_id: conversionEventId,
        conversion_event_type: conversionEventType,
        converted_at: new Date().toISOString(),
      })
      .eq('id', referralId);
    
    // Calculate and create active commission
    const { data: commissionAmount } = await supabase.rpc('calculate_active_commission', {
      p_campaign_id: referral.campaign_id,
      p_affiliate_id: referral.affiliate_id,
      p_transaction_amount: transactionAmount,
      p_platform_fee: platformFee,
    });
    
    if (commissionAmount && commissionAmount > 0) {
      const { data: commission, error: commissionError } = await supabase
        .from('affiliate_commissions')
        .insert({
          affiliate_id: referral.affiliate_id,
          referral_id: referralId,
          campaign_id: referral.campaign_id,
          commission_type: 'active',
          amount: commissionAmount,
          transaction_id: conversionEventId,
          transaction_amount: transactionAmount,
          platform_fee: platformFee,
          status: 'pending',
        })
        .select('id')
        .single();
      
      if (commissionError) {
        console.error('Error creating commission:', commissionError);
        return null;
      }
      
      return commission.id;
    }
    
    return null;
  } catch (error) {
    console.error('Error converting referral:', error);
    return null;
  }
};

