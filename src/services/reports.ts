import { getBackendAccessToken } from "@/lib/backendAuth";

export interface ReportParameters {
  [key: string]: any;
}

export interface Report {
  id: string;
  name: string;
  type: string;
  websiteId: string;
  description?: string;
  parameters: ReportParameters;
  createdAt: string;
  updatedAt: string;
}

export interface FetchReportsParams {
  websiteId: string;
  type?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateReportParams {
  name: string;
  type: string;
  websiteId: string;
  description?: string;
  parameters: ReportParameters;
}

export interface FetchReportsResponse {
  data: Report[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Fetch all existing reports for a website
 * GET /api/reports
 */
export const fetchReports = async (params: FetchReportsParams): Promise<FetchReportsResponse> => {
  try {
    const accessToken = getBackendAccessToken();
    if (!accessToken) {
      throw new Error("Not authenticated");
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      apikey: supabaseAnonKey,
      "Content-Type": "application/json",
    };

    const queryParams = new URLSearchParams();
    queryParams.append("websiteId", params.websiteId);
    if (params.type) {
      queryParams.append("type", params.type);
    }
    queryParams.append("page", String(params.page || 1));
    queryParams.append("pageSize", String(params.pageSize || 20));

    const url = `${supabaseUrl}/functions/v1/reports?${queryParams.toString()}`;

    const res = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(errorBody?.error || `Failed to fetch reports (${res.status})`);
    }

    const data = await res.json();
    return data as FetchReportsResponse;
  } catch (error) {
    console.error("Error fetching reports:", error);
    throw error;
  }
};

/**
 * Create a new report
 * POST /api/reports
 */
export const createReport = async (params: CreateReportParams): Promise<Report> => {
  try {
    const accessToken = getBackendAccessToken();
    if (!accessToken) {
      throw new Error("Not authenticated");
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      apikey: supabaseAnonKey,
      "Content-Type": "application/json",
    };

    const url = `${supabaseUrl}/functions/v1/reports`;

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: params.name,
        type: params.type,
        websiteId: params.websiteId,
        description: params.description || null,
        parameters: params.parameters,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(errorBody?.error || `Failed to create report (${res.status})`);
    }

    const data = await res.json();
    return data as Report;
  } catch (error) {
    console.error("Error creating report:", error);
    throw error;
  }
};

/**
 * Update an existing report
 * PUT /api/reports/:id
 */
export const updateReport = async (
  reportId: string,
  params: Partial<CreateReportParams>,
): Promise<Report> => {
  try {
    const accessToken = getBackendAccessToken();
    if (!accessToken) {
      throw new Error("Not authenticated");
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      apikey: supabaseAnonKey,
      "Content-Type": "application/json",
    };

    const url = `${supabaseUrl}/functions/v1/reports/${reportId}`;

    const res = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(errorBody?.error || `Failed to update report (${res.status})`);
    }

    const data = await res.json();
    return data as Report;
  } catch (error) {
    console.error("Error updating report:", error);
    throw error;
  }
};

/**
 * Delete an existing report
 * DELETE /api/reports/:id
 */
export const deleteReport = async (reportId: string): Promise<void> => {
  try {
    const accessToken = getBackendAccessToken();
    if (!accessToken) {
      throw new Error("Not authenticated");
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      apikey: supabaseAnonKey,
      "Content-Type": "application/json",
    };

    const url = `${supabaseUrl}/functions/v1/reports/${reportId}`;

    const res = await fetch(url, {
      method: "DELETE",
      headers,
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(errorBody?.error || `Failed to delete report (${res.status})`);
    }
  } catch (error) {
    console.error("Error deleting report:", error);
    throw error;
  }
};

export interface GetReportParams {
  reportId: string;
}

/**
 * Get a single report by ID
 * GET /api/reports/:id
 */
export const getReport = async (reportId: string): Promise<Report> => {
  try {
    const accessToken = getBackendAccessToken();
    if (!accessToken) {
      throw new Error("Not authenticated");
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      apikey: supabaseAnonKey,
    };

    const url = `${supabaseUrl}/functions/v1/reports/${reportId}`;

    const res = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(errorBody?.error || `Failed to get report (${res.status})`);
    }

    const data = await res.json();
    return data as Report;
  } catch (error) {
    console.error("Error getting report:", error);
    throw error;
  }
};

// Attribution Report Types & Interfaces

export type AttributionModel = "first-click" | "last-click";
export type AttributionType = "path" | "event";

export interface AttributionUTM {
  sources: Array<{ name: string; pageviews: number; visitors: number }>;
  mediums: Array<{ name: string; pageviews: number; visitors: number }>;
  campaigns: Array<{ name: string; pageviews: number; visitors: number }>;
  contents: Array<{ name: string; pageviews: number; visitors: number }>;
  terms: Array<{ name: string; pageviews: number; visitors: number }>;
}

export interface AttributionTotals {
  pageviews: number;
  visitors: number;
  visits: number;
}

export interface AttributionReferrer {
  name: string;
  pageviews: number;
  visitors: number;
}

export interface AttributionReportData {
  model: AttributionModel;
  type: AttributionType;
  step?: string | null;
  referrers: AttributionReferrer[];
  utm: AttributionUTM;
  totals: AttributionTotals;
}

export interface AttributionReportParams {
  websiteId: string;
  startDate: string | number;
  endDate: string | number;
  model?: AttributionModel;
  type?: AttributionType;
  step?: string;
  filters?: Record<string, any>;
}

/**
 * Fetch attribution report data
 * POST /analytics/attribution
 */
export const fetchAttributionReport = async (
  params: AttributionReportParams,
): Promise<AttributionReportData> => {
  try {
    const accessToken = getBackendAccessToken();
    if (!accessToken) {
      throw new Error("Not authenticated");
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      apikey: supabaseAnonKey,
      "Content-Type": "application/json",
    };

    // Convert dates to timestamps
    const startAtMs =
      typeof params.startDate === "string"
        ? new Date(params.startDate).getTime()
        : params.startDate;
    const endAtMs =
      typeof params.endDate === "string" ? new Date(params.endDate).getTime() : params.endDate;

    const url = `${supabaseUrl}/functions/v1/analytics/attribution?startAt=${startAtMs}&endAt=${endAtMs}`;

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        websiteId: params.websiteId,
        reportType: "attribution",
        model: params.model || "last-click",
        type: params.type || "path",
        step: params.step,
        filters: params.filters,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(
        errorBody?.error || `Failed to fetch attribution report (${res.status})`,
      );
    }

    const data = await res.json();
    return data as AttributionReportData;
  } catch (error) {
    console.error("Error fetching attribution report:", error);
    throw error;
  }
};

// Breakdown Report Types & Interfaces

export type BreakdownField =
  | "path"
  | "title"
  | "query"
  | "referrer"
  | "browser"
  | "os"
  | "device"
  | "country"
  | "region"
  | "city"
  | "hostname"
  | "tag"
  | "event";

export interface BreakdownRow {
  name: string;
  views: number;
  visitors: number;
  visits: number;
  bounces: number;
  totaltime: number;
}

export interface BreakdownReportData {
  field: BreakdownField;
  rows: BreakdownRow[];
  totals: {
    views: number;
    visitors: number;
    visits: number;
    bounces: number;
    totaltime: number;
  };
}

export interface BreakdownReportParams {
  websiteId: string;
  startDate: string | number;
  endDate: string | number;
  field: BreakdownField;
  filters?: Record<string, any>;
}

// Goal Report Types & Interfaces

export type GoalValueType = "event" | "path";

export interface GoalReportParams {
  websiteId: string;
  startDate: string | number;
  endDate: string | number;
  value: string;
  valueType?: GoalValueType;
  filters?: Record<string, any>;
}

export interface GoalReportData {
  num: number;
  total: number;
}

/**
 * Fetch goal report data
 * POST /analytics/goals
 */
export const fetchGoalReport = async (
  params: GoalReportParams,
): Promise<GoalReportData> => {
  try {
    const accessToken = getBackendAccessToken();
    if (!accessToken) {
      throw new Error("Not authenticated");
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      apikey: supabaseAnonKey,
      "Content-Type": "application/json",
    };

    const startAtMs = typeof params.startDate === "string" ? new Date(params.startDate).getTime() : params.startDate;
    const endAtMs = typeof params.endDate === "string" ? new Date(params.endDate).getTime() : params.endDate;

    const url = `${supabaseUrl}/functions/v1/analytics/goals?startAt=${startAtMs}&endAt=${endAtMs}`;

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        websiteId: params.websiteId,
        value: params.value,
        valueType: params.valueType || "path",
        filters: params.filters,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(errorBody?.error || `Failed to fetch goal report (${res.status})`);
    }

    const data = await res.json();
    return data as GoalReportData;
  } catch (error) {
    console.error("Error fetching goal report:", error);
    throw error;
  }
};

/**
 * Fetch breakdown report data
 * POST /analytics/breakdown
 */
export const fetchBreakdownReport = async (
  params: BreakdownReportParams,
): Promise<BreakdownReportData> => {
  try {
    const accessToken = getBackendAccessToken();
    if (!accessToken) {
      throw new Error("Not authenticated");
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      apikey: supabaseAnonKey,
      "Content-Type": "application/json",
    };

    // Convert dates to timestamps
    const startAtMs =
      typeof params.startDate === "string"
        ? new Date(params.startDate).getTime()
        : params.startDate;
    const endAtMs =
      typeof params.endDate === "string" ? new Date(params.endDate).getTime() : params.endDate;

    const url = `${supabaseUrl}/functions/v1/analytics/breakdown?startAt=${startAtMs}&endAt=${endAtMs}`;

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        websiteId: params.websiteId,
        reportType: "breakdown",
        field: params.field,
        filters: params.filters,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(
        errorBody?.error || `Failed to fetch breakdown report (${res.status})`,
      );
    }

    const data = await res.json();
    return data as BreakdownReportData;
  } catch (error) {
    console.error("Error fetching breakdown report:", error);
    throw error;
  }
};

// Funnel Report Types & Interfaces

export type FunnelStepType = "path" | "event";

export interface FunnelStepParam {
  type: FunnelStepType;
  value: string;
}

export interface FunnelStepResult {
  type: FunnelStepType;
  value: string;
  visitors: number;
  dropped: number;
  dropoff: number; // percent
  remaining: number;
}

export interface FunnelReportParams {
  websiteId: string;
  startDate: string | number;
  endDate: string | number;
  steps: FunnelStepParam[];
  window?: number; // days between steps (optional)
  filters?: Record<string, any>;
}

export interface FunnelReportData {
  window?: number;
  funnel: FunnelStepResult[];
}

/**
 * Fetch funnel report data
 * POST /analytics/funnel
 */
export const fetchFunnelReport = async (
  params: FunnelReportParams,
): Promise<FunnelReportData> => {
  try {
    const accessToken = getBackendAccessToken();
    if (!accessToken) {
      throw new Error("Not authenticated");
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      apikey: supabaseAnonKey,
      "Content-Type": "application/json",
    };

    const startAtMs = typeof params.startDate === "string" ? new Date(params.startDate).getTime() : params.startDate;
    const endAtMs = typeof params.endDate === "string" ? new Date(params.endDate).getTime() : params.endDate;

    const url = `${supabaseUrl}/functions/v1/analytics/funnel?startAt=${startAtMs}&endAt=${endAtMs}`;

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        websiteId: params.websiteId,
        type: "funnel",
        steps: params.steps,
        window: params.window,
        filters: params.filters,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(errorBody?.error || `Failed to fetch funnel report (${res.status})`);
    }

    const data = await res.json();
    return data as FunnelReportData;
  } catch (error) {
    console.error("Error fetching funnel report:", error);
    throw error;
  }
};

// Journey Report Types & Interfaces

export interface JourneyItem {
  path: string[];
  count: number;
}

export interface JourneyReportParams {
  websiteId: string;
  startDate: string | number;
  endDate: string | number;
  startStep: string;
  endStep?: string;
  maxSteps?: number;
  filters?: Record<string, any>;
}

export interface JourneyReportData {
  items: JourneyItem[];
  count: number;
}

/**
 * Fetch journey report data (user paths/sequences)
 * POST /analytics/journey
 */
export const fetchJourneyReport = async (
  params: JourneyReportParams,
): Promise<JourneyReportData> => {
  try {
    const accessToken = getBackendAccessToken();
    if (!accessToken) {
      throw new Error("Not authenticated");
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      apikey: supabaseAnonKey,
      "Content-Type": "application/json",
    };

    const startAtMs = typeof params.startDate === "string" ? new Date(params.startDate).getTime() : params.startDate;
    const endAtMs = typeof params.endDate === "string" ? new Date(params.endDate).getTime() : params.endDate;

    const url = `${supabaseUrl}/functions/v1/analytics/journey?startAt=${startAtMs}&endAt=${endAtMs}`;

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        websiteId: params.websiteId,
        startStep: params.startStep,
        endStep: params.endStep,
        maxSteps: params.maxSteps || 7,
        filters: params.filters,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(errorBody?.error || `Failed to fetch journey report (${res.status})`);
    }

    const data = await res.json();
    return data as JourneyReportData;
  } catch (error) {
    console.error("Error fetching journey report:", error);
    throw error;
  }
};

// Retention Report Types & Interfaces

export interface RetentionRow {
  date: string;
  day: string;
  visitors: number;
  returnVisitors: number;
  percentage: number;
}

export interface RetentionReportParams {
  websiteId: string;
  startDate: string | number;
  endDate: string | number;
  timezone?: string;
  filters?: Record<string, any>;
}

/**
 * Fetch retention report data
 * POST /analytics/retention
 */
export const fetchRetentionReport = async (
  params: RetentionReportParams,
): Promise<RetentionRow[]> => {
  try {
    const accessToken = getBackendAccessToken();
    if (!accessToken) {
      throw new Error("Not authenticated");
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      apikey: supabaseAnonKey,
      "Content-Type": "application/json",
    };

    const startAtMs = typeof params.startDate === "string" ? new Date(params.startDate).getTime() : params.startDate;
    const endAtMs = typeof params.endDate === "string" ? new Date(params.endDate).getTime() : params.endDate;

    const url = `${supabaseUrl}/functions/v1/analytics/retention?startAt=${startAtMs}&endAt=${endAtMs}`;

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        websiteId: params.websiteId,
        timezone: params.timezone || "UTC",
        filters: params.filters,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(errorBody?.error || `Failed to fetch retention report (${res.status})`);
    }

    const data = await res.json();
    return data as RetentionRow[];
  } catch (error) {
    console.error("Error fetching retention report:", error);
    throw error;
  }
};

// Revenue Report Types & Interfaces

export interface RevenueChartPoint {
  x: string;
  t: string;
  y: number;
}

export interface RevenueCountry {
  name: string;
  value: number;
}

export interface RevenueTotals {
  sum: number;
  count: number;
  unique_count: number;
  average: number;
  currency: string;
}

export interface RevenueReportData {
  chart: RevenueChartPoint[];
  country: RevenueCountry[];
  total: RevenueTotals;
}

export interface RevenueReportParams {
  websiteId: string;
  startDate: string | number;
  endDate: string | number;
  timezone?: string;
  currency?: string;
  filters?: Record<string, any>;
}

/**
 * Fetch revenue report data
 * POST /analytics/revenue
 */
export const fetchRevenueReport = async (
  params: RevenueReportParams,
): Promise<RevenueReportData> => {
  try {
    const accessToken = getBackendAccessToken();
    if (!accessToken) {
      throw new Error("Not authenticated");
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      apikey: supabaseAnonKey,
      "Content-Type": "application/json",
    };

    const startAtMs = typeof params.startDate === "string" ? new Date(params.startDate).getTime() : params.startDate;
    const endAtMs = typeof params.endDate === "string" ? new Date(params.endDate).getTime() : params.endDate;

    const url = `${supabaseUrl}/functions/v1/analytics/revenue?startAt=${startAtMs}&endAt=${endAtMs}`;

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        websiteId: params.websiteId,
        timezone: params.timezone || "UTC",
        currency: params.currency || "USD",
        filters: params.filters,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(errorBody?.error || `Failed to fetch revenue report (${res.status})`);
    }

    const data = await res.json();
    return data as RevenueReportData;
  } catch (error) {
    console.error("Error fetching revenue report:", error);
    throw error;
  }
};

// UTM Report Types & Interfaces

export interface UtmParameter {
  name: string;
  views: number;
  visitors: number;
}

export interface UtmReportData {
  utm_source: UtmParameter[];
  utm_medium: UtmParameter[];
  utm_campaign: UtmParameter[];
  utm_term: UtmParameter[];
  utm_content: UtmParameter[];
}

export interface UtmReportParams {
  websiteId: string;
  startDate: string | number;
  endDate: string | number;
  filters?: Record<string, any>;
}

/**
 * Fetch UTM report data
 * POST /analytics/utm
 */
export const fetchUtmReport = async (params: UtmReportParams): Promise<UtmReportData> => {
  try {
    const accessToken = getBackendAccessToken();
    if (!accessToken) {
      throw new Error("Not authenticated");
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      apikey: supabaseAnonKey,
      "Content-Type": "application/json",
    };

    const startAtMs = typeof params.startDate === "string" ? new Date(params.startDate).getTime() : params.startDate;
    const endAtMs = typeof params.endDate === "string" ? new Date(params.endDate).getTime() : params.endDate;

    const url = `${supabaseUrl}/functions/v1/analytics/utm?startAt=${startAtMs}&endAt=${endAtMs}`;

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        websiteId: params.websiteId,
        filters: params.filters,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(errorBody?.error || `Failed to fetch UTM report (${res.status})`);
    }

    const data = await res.json();
    return data as UtmReportData;
  } catch (error) {
    console.error("Error fetching UTM report:", error);
    throw error;
  }
};

// Session Report Types & Interfaces

export interface Session {
  id: string;
  browser: string;
  os: string;
  device: string;
  screen: string;
  language: string;
  country: string;
  region: string;
  city: string;
  firstAt: number;
  lastAt: number;
  visits: number;
  views: number;
}

export interface SessionListParams {
  websiteId: string;
  startDate: string | number;
  endDate: string | number;
  page?: number;
  pageSize?: number;
  search?: string;
  filters?: Record<string, any>;
}

export interface SessionListResponse {
  data: Session[];
  page: number;
  pageSize: number;
  total: number;
}

/**
 * Fetch sessions list
 * GET /api/websites/:websiteId/sessions
 */
export const fetchSessions = async (params: SessionListParams): Promise<SessionListResponse> => {
  try {
    const accessToken = getBackendAccessToken();
    if (!accessToken) {
      throw new Error("Not authenticated");
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      apikey: supabaseAnonKey,
    };

    const startAtMs = typeof params.startDate === "string" ? new Date(params.startDate).getTime() : params.startDate;
    const endAtMs = typeof params.endDate === "string" ? new Date(params.endDate).getTime() : params.endDate;

    const queryParams = new URLSearchParams();
    queryParams.append("startAt", String(startAtMs));
    queryParams.append("endAt", String(endAtMs));
    queryParams.append("page", String(params.page || 1));
    queryParams.append("pageSize", String(params.pageSize || 20));
    if (params.search) queryParams.append("search", params.search);

    const url = `${supabaseUrl}/functions/v1/analytics/sessions?${queryParams.toString()}`;

    const res = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(errorBody?.error || `Failed to fetch sessions (${res.status})`);
    }

    const data = await res.json();
    return data as SessionListResponse;
  } catch (error) {
    console.error("Error fetching sessions:", error);
    throw error;
  }
};

export interface SessionStats {
  pageviews: number;
  visitors: number;
  visits: number;
  countries: number;
  events: number;
}

/**
 * Fetch session statistics
 * GET /api/websites/:websiteId/sessions/stats
 */
export const fetchSessionStats = async (
  websiteId: string,
  startDate: string | number,
  endDate: string | number,
): Promise<SessionStats> => {
  try {
    const accessToken = getBackendAccessToken();
    if (!accessToken) {
      throw new Error("Not authenticated");
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      apikey: supabaseAnonKey,
    };

    const startAtMs = typeof startDate === "string" ? new Date(startDate).getTime() : startDate;
    const endAtMs = typeof endDate === "string" ? new Date(endDate).getTime() : endDate;

    const url = `${supabaseUrl}/functions/v1/analytics/sessions/stats?startAt=${startAtMs}&endAt=${endAtMs}`;

    const res = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(errorBody?.error || `Failed to fetch session stats (${res.status})`);
    }

    const data = await res.json();
    return data as SessionStats;
  } catch (error) {
    console.error("Error fetching session stats:", error);
    throw error;
  }
};

export interface WeeklySessionData {
  [day: string]: Array<{ hour: number; count: number }>;
}

/**
 * Fetch weekly session data (hourly by weekday)
 * GET /api/websites/:websiteId/sessions/weekly
 */
export const fetchWeeklySessions = async (
  websiteId: string,
  startDate: string | number,
  endDate: string | number,
  timezone?: string,
): Promise<WeeklySessionData> => {
  try {
    const accessToken = getBackendAccessToken();
    if (!accessToken) {
      throw new Error("Not authenticated");
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      apikey: supabaseAnonKey,
    };

    const startAtMs = typeof startDate === "string" ? new Date(startDate).getTime() : startDate;
    const endAtMs = typeof endDate === "string" ? new Date(endDate).getTime() : endDate;

    let url = `${supabaseUrl}/functions/v1/analytics/sessions/weekly?startAt=${startAtMs}&endAt=${endAtMs}`;
    if (timezone) url += `&timezone=${encodeURIComponent(timezone)}`;

    const res = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(errorBody?.error || `Failed to fetch weekly sessions (${res.status})`);
    }

    const data = await res.json();
    return data as WeeklySessionData;
  } catch (error) {
    console.error("Error fetching weekly sessions:", error);
    throw error;
  }
};

export interface SessionDetail extends Session {
  events: number;
  totaltime: number;
}

/**
 * Fetch a single session's details
 * GET /api/websites/:websiteId/sessions/:sessionId
 */
export const fetchSessionDetail = async (
  websiteId: string,
  sessionId: string,
  startDate: string | number,
  endDate: string | number,
): Promise<SessionDetail> => {
  try {
    const accessToken = getBackendAccessToken();
    if (!accessToken) {
      throw new Error("Not authenticated");
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      apikey: supabaseAnonKey,
    };

    const startAtMs = typeof startDate === "string" ? new Date(startDate).getTime() : startDate;
    const endAtMs = typeof endDate === "string" ? new Date(endDate).getTime() : endDate;

    const url = `${supabaseUrl}/functions/v1/analytics/sessions/${sessionId}?startAt=${startAtMs}&endAt=${endAtMs}`;

    const res = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(errorBody?.error || `Failed to fetch session detail (${res.status})`);
    }

    const data = await res.json();
    return data as SessionDetail;
  } catch (error) {
    console.error("Error fetching session detail:", error);
    throw error;
  }
};

export interface SessionActivity {
  createdAt: string;
  urlPath: string;
  urlQuery: string;
  referrerDomain: string;
  eventId: string | null;
  eventType: string;
  eventName: string | null;
  visitId: string;
  hasData: boolean;
}

/**
 * Fetch session activity (pageviews and events)
 * GET /api/websites/:websiteId/sessions/:sessionId/activity
 */
export const fetchSessionActivity = async (
  websiteId: string,
  sessionId: string,
  startDate: string | number,
  endDate: string | number,
): Promise<SessionActivity[]> => {
  try {
    const accessToken = getBackendAccessToken();
    if (!accessToken) {
      throw new Error("Not authenticated");
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      apikey: supabaseAnonKey,
    };

    const startAtMs = typeof startDate === "string" ? new Date(startDate).getTime() : startDate;
    const endAtMs = typeof endDate === "string" ? new Date(endDate).getTime() : endDate;

    const url = `${supabaseUrl}/functions/v1/analytics/sessions/${sessionId}/activity?startAt=${startAtMs}&endAt=${endAtMs}`;

    const res = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(errorBody?.error || `Failed to fetch session activity (${res.status})`);
    }

    const data = await res.json();
    return data as SessionActivity[];
  } catch (error) {
    console.error("Error fetching session activity:", error);
    throw error;
  }
};

export interface SessionProperty {
  dataKey: string;
  dataType: string;
  stringValue: string | null;
  numberValue: number | null;
  dateValue: string | null;
  createdAt: string;
}

/**
 * Fetch session properties
 * GET /api/websites/:websiteId/sessions/:sessionId/properties
 */
export const fetchSessionProperties = async (
  websiteId: string,
  sessionId: string,
  startDate: string | number,
  endDate: string | number,
): Promise<SessionProperty[]> => {
  try {
    const accessToken = getBackendAccessToken();
    if (!accessToken) {
      throw new Error("Not authenticated");
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      apikey: supabaseAnonKey,
    };

    const startAtMs = typeof startDate === "string" ? new Date(startDate).getTime() : startDate;
    const endAtMs = typeof endDate === "string" ? new Date(endDate).getTime() : endDate;

    const url = `${supabaseUrl}/functions/v1/analytics/sessions/${sessionId}/properties?startAt=${startAtMs}&endAt=${endAtMs}`;

    const res = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(errorBody?.error || `Failed to fetch session properties (${res.status})`);
    }

    const data = await res.json();
    return data as SessionProperty[];
  } catch (error) {
    console.error("Error fetching session properties:", error);
    throw error;
  }
};

export interface SessionDataProperty {
  propertyName: string;
  total: number;
}

/**
 * Fetch all available session data properties
 * GET /api/websites/:websiteId/session-data/properties
 */
export const fetchSessionDataProperties = async (
  websiteId: string,
  startDate: string | number,
  endDate: string | number,
): Promise<SessionDataProperty[]> => {
  try {
    const accessToken = getBackendAccessToken();
    if (!accessToken) {
      throw new Error("Not authenticated");
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      apikey: supabaseAnonKey,
    };

    const startAtMs = typeof startDate === "string" ? new Date(startDate).getTime() : startDate;
    const endAtMs = typeof endDate === "string" ? new Date(endDate).getTime() : endDate;

    const url = `${supabaseUrl}/functions/v1/analytics/sessions/session-data/properties?startAt=${startAtMs}&endAt=${endAtMs}`;

    const res = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(errorBody?.error || `Failed to fetch session data properties (${res.status})`);
    }

    const data = await res.json();
    return data as SessionDataProperty[];
  } catch (error) {
    console.error("Error fetching session data properties:", error);
    throw error;
  }
};

export interface SessionDataValue {
  value: string;
  total: number;
}

/**
 * Fetch values for a specific session data property
 * GET /api/websites/:websiteId/session-data/values
 */
export const fetchSessionDataValues = async (
  websiteId: string,
  propertyName: string,
  startDate: string | number,
  endDate: string | number,
): Promise<SessionDataValue[]> => {
  try {
    const accessToken = getBackendAccessToken();
    if (!accessToken) {
      throw new Error("Not authenticated");
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      apikey: supabaseAnonKey,
    };

    const startAtMs = typeof startDate === "string" ? new Date(startDate).getTime() : startDate;
    const endAtMs = typeof endDate === "string" ? new Date(endDate).getTime() : endDate;

    const url = `${supabaseUrl}/functions/v1/analytics/sessions/session-data/values?startAt=${startAtMs}&endAt=${endAtMs}&propertyName=${encodeURIComponent(propertyName)}`;

    const res = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(errorBody?.error || `Failed to fetch session data values (${res.status})`);
    }

    const data = await res.json();
    return data as SessionDataValue[];
  } catch (error) {
    console.error("Error fetching session data values:", error);
    throw error;
  }
};

