/**

 * Affiliate Tracking Utilities

 * Handles URL parameter tracking, cookie management, and attribution

 */



import { runApiEndpoint } from "@/redux/apiDispatch";

import { affiliateApi } from "@/services/server";



const AFFILIATE_COOKIE_NAME = "affiliate_ref";

const AFFILIATE_COOKIE_EXPIRY_DAYS = 30;



export interface AffiliateCookieData {

  linkCode: string;

  affiliateId: string;

  campaignId: string;

  timestamp: number;

}



export const getAffiliateCodeFromUrl = (): string | null => {

  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);

  return params.get("ref") || params.get("affiliate") || null;

};



export const setAffiliateCookie = (data: AffiliateCookieData): void => {

  if (typeof document === "undefined") return;

  const expiryDate = new Date();

  expiryDate.setDate(expiryDate.getDate() + AFFILIATE_COOKIE_EXPIRY_DAYS);

  const cookieValue = JSON.stringify(data);

  document.cookie = `${AFFILIATE_COOKIE_NAME}=${encodeURIComponent(cookieValue)}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;

};



export const getAffiliateFromCookie = (): AffiliateCookieData | null => {

  if (typeof document === "undefined") return null;

  const cookies = document.cookie.split(";");

  const affiliateCookie = cookies.find((c) => c.trim().startsWith(`${AFFILIATE_COOKIE_NAME}=`));

  if (!affiliateCookie) return null;

  try {

    const cookieValue = affiliateCookie.split("=")[1];

    const decoded = decodeURIComponent(cookieValue);

    const data: AffiliateCookieData = JSON.parse(decoded);

    const cookieAge = Date.now() - data.timestamp;

    const maxAge = AFFILIATE_COOKIE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

    if (cookieAge > maxAge) {

      clearAffiliateCookie();

      return null;

    }

    return data;

  } catch (error) {

    console.error("Error parsing affiliate cookie:", error);

    return null;

  }

};



export const clearAffiliateCookie = (): void => {

  if (typeof document === "undefined") return;

  document.cookie = `${AFFILIATE_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;

};



export const trackAffiliateClick = async (linkCode: string): Promise<void> => {

  try {

    await runApiEndpoint(affiliateApi.endpoints.trackAffiliate, { affiliateCode: linkCode });

  } catch (error) {

    console.error("Error tracking affiliate click:", error);

  }

};



export const initializeAffiliateTracking = async (): Promise<void> => {

  const affiliateCode = getAffiliateCodeFromUrl();

  if (!affiliateCode) return;



  try {

    await trackAffiliateClick(affiliateCode);

    setAffiliateCookie({

      linkCode: affiliateCode,

      affiliateId: affiliateCode,

      campaignId: "",

      timestamp: Date.now(),

    });



    if (typeof window !== "undefined" && window.history) {

      const url = new URL(window.location.href);

      url.searchParams.delete("ref");

      url.searchParams.delete("affiliate");

      window.history.replaceState({}, "", url.toString());

    }

  } catch (error) {

    console.error("Error initializing affiliate tracking:", error);

  }

};



export const getCurrentAffiliate = (): AffiliateCookieData | null => getAffiliateFromCookie();



export const createReferral = async (

  _referralType: "student" | "organizer" | "venue",

  referredUserId?: string,

): Promise<string | null> => {

  const affiliateData = getCurrentAffiliate();

  if (!affiliateData) return null;



  try {

    const referral = await runApiEndpoint(affiliateApi.endpoints.trackAffiliate, {

      affiliateCode: affiliateData.linkCode,

      referredUserId,

    });

    return (referral as { id?: string })?.id ?? affiliateData.linkCode;

  } catch (error) {

    console.error("Error creating referral:", error);

    return null;

  }

};



export const convertReferral = async (

  referralId: string,

  _conversionEventType: "booking" | "organizer_verified" | "venue_activated",

  conversionEventId: string,

  transactionAmount: number,

): Promise<string | null> => {

  const affiliateData = getCurrentAffiliate();

  if (!affiliateData) return null;



  try {

    await runApiEndpoint(affiliateApi.endpoints.trackAffiliate, {

      affiliateCode: affiliateData.linkCode,

      bookingId: conversionEventId,

      commission: transactionAmount,

    });

    return referralId;

  } catch (error) {

    console.error("Error converting referral:", error);

    return null;

  }

};



export const createPassiveCommission = async (

  referredUserId: string,

  _eventType: "event_published" | "booking_completed" | "venue_booking" | "event_at_venue",

  transactionAmount: number,

  _platformFee = 0,

  transactionId?: string,

): Promise<string | null> => {

  const affiliateData = getCurrentAffiliate();

  if (!affiliateData) return null;



  try {

    await runApiEndpoint(affiliateApi.endpoints.trackAffiliate, {

      affiliateCode: affiliateData.linkCode,

      referredUserId,

      bookingId: transactionId,

      commission: transactionAmount,

    });

    return transactionId ?? null;

  } catch (error) {

    console.error("Error creating passive commission:", error);

    return null;

  }

};


