import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft,
  Users,
  Clock,
  TrendingUp,
  LogOut,
  ChevronDown,
  Eye,
} from "lucide-react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  fetchAttributionReport,
  fetchBreakdownReport,
  fetchFunnelReport,
  fetchGoalReport,
  fetchJourneyReport,
  fetchRetentionReport,
  fetchRevenueReport,
  fetchUtmReport,
  fetchSessions,
} from "@/services/reports";

interface AnalyticsStats {
  visitors: number;
  pageviews: number;
  visits: number;
  bounceRate: number;
}

interface TimeseriesPoint {
  date: string;
  pageviews: number;
  visitors: number;
}

interface TimeseriesResponse {
  unit: string;
  timezone: string;
  points: TimeseriesPoint[];
}

interface TopPagesResponse {
  totalPageviews: number;
  pages: Array<{ path: string; pageviews: number; percent: number }>;
}

interface EventsResponse {
  unit: string;
  timezone: string;
  events: Array<{ name: string; total: number; series: Array<{ date: string; count: number }> }>;
}

const AdminAnalytics = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role, user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsStats | null>(null);

  const [range, setRange] = useState<"7d" | "30d">("7d");
  const [timeseries, setTimeseries] = useState<TimeseriesResponse | null>(null);
  const [topPages, setTopPages] = useState<TopPagesResponse | null>(null);
  const [events, setEvents] = useState<EventsResponse | null>(null);

  // Report chunk states
  const [attribution, setAttribution] = useState<any>(null);
  const [breakdown, setBreakdown] = useState<any>(null);
  const [breakdownDevice, setBreakdownDevice] = useState<any>(null);
  const [breakdownOs, setBreakdownOs] = useState<any>(null);
  const [breakdownCountry, setBreakdownCountry] = useState<any>(null);
  const [breakdownCity, setBreakdownCity] = useState<any>(null);
  const [funnel, setFunnel] = useState<any>(null);
  const [goal, setGoal] = useState<any>(null);
  const [journey, setJourney] = useState<any>(null);
  const [retention, setRetention] = useState<any>(null);
  const [revenue, setRevenue] = useState<any>(null);
  const [utm, setUtm] = useState<any>(null);
  const [sessions, setSessions] = useState<any>(null);

  const [pagesSortKey, setPagesSortKey] = useState<"pageviews" | "path" | "percent">("pageviews");
  const [pagesSortDir, setPagesSortDir] = useState<"asc" | "desc">("desc");

  // Access check
  useEffect(() => {
    if (role && role !== "admin") {
      navigate("/");
      return;
    }
  }, [role, navigate]);

  const fetchAll = async () => {
    try {
      setLoading(true);

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData?.session) {
        toast({
          title: "Analytics Error",
          description: "Not authenticated",
          variant: "destructive",
        });
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const headers = {
        Authorization: `Bearer ${sessionData.session.access_token}`,
        apikey: supabaseAnonKey,
      };

      const now = Date.now();
      const startAt = range === "7d" ? now - 7 * 24 * 60 * 60 * 1000 : now - 30 * 24 * 60 * 60 * 1000;
      const qs = `startAt=${startAt}&endAt=${now}`;

      const requestJson = async <T,>(url: string): Promise<T> => {
        const res = await fetch(url, { method: "GET", headers });
        const body = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(body?.details || body?.error || `Request failed (${res.status})`);
        }

        return body as T;
      };

      const base = `${supabaseUrl}/functions/v1/analytics`;

      const [overview, ts, pages, ev] = await Promise.all([
        requestJson<AnalyticsStats>(`${base}/overview?${qs}`),
        requestJson<TimeseriesResponse>(`${base}/timeseries?${qs}&unit=day&timezone=UTC`),
        requestJson<TopPagesResponse>(`${base}/pages?${qs}&limit=25`),
        requestJson<EventsResponse>(
          `${base}/events?${qs}&unit=day&timezone=UTC&events=signup_submitted,donate_clicked,contact_form_sent`,
        ),
      ]);

      setAnalytics(overview);
      setTimeseries(ts);
      setTopPages(pages);
      setEvents(ev);

      // Fetch all report chunks in parallel
      try {
        const websiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID || "default";
        const startDate = new Date(startAt).toISOString().split("T")[0];
        const endDate = new Date(now).toISOString().split("T")[0];

        const [
          attrData,
          breakData,
          breakDeviceData,
          breakOsData,
          breakCountryData,
          breakCityData,
          funnelData,
          goalData,
          journeyData,
          retData,
          revData,
          utmData,
          sessData,
        ] = await Promise.all([
          fetchAttributionReport({ websiteId, startDate, endDate }).catch(() => null),
          fetchBreakdownReport({ websiteId, startDate, endDate, field: "browser" }).catch(() => null),
          fetchBreakdownReport({ websiteId, startDate, endDate, field: "device" }).catch(() => null),
          fetchBreakdownReport({ websiteId, startDate, endDate, field: "os" }).catch(() => null),
          fetchBreakdownReport({ websiteId, startDate, endDate, field: "country" }).catch(() => null),
          fetchBreakdownReport({ websiteId, startDate, endDate, field: "city" }).catch(() => null),
          fetchFunnelReport({
            websiteId,
            startDate,
            endDate,
            steps: [
              { type: "path", value: "/" },
              { type: "path", value: "/contact" },
            ],
          }).catch(() => null),
          fetchGoalReport({ websiteId, startDate, endDate, value: "/thank-you", valueType: "path" }).catch(() => null),
          fetchJourneyReport({ websiteId, startDate, endDate, startStep: "/" }).catch(() => null),
          fetchRetentionReport({ websiteId, startDate, endDate }).catch(() => null),
          fetchRevenueReport({ websiteId, startDate, endDate, currency: "USD" }).catch(() => null),
          fetchUtmReport({ websiteId, startDate, endDate }).catch(() => null),
          fetchSessions({ websiteId, startDate, endDate, pageSize: 20 }).catch(() => null),
        ]);

        setAttribution(attrData);
        setBreakdown(breakData);
        setBreakdownDevice(breakDeviceData);
        setBreakdownOs(breakOsData);
        setBreakdownCountry(breakCountryData);
        setBreakdownCity(breakCityData);
        setFunnel(funnelData);
        setGoal(goalData);
        setJourney(journeyData);
        setRetention(retData);
        setRevenue(revData);
        setUtm(utmData);
        setSessions(sessData);
      } catch (reportError) {
      }
    } catch (error) {
      toast({
        title: "Analytics Error",
        description: error instanceof Error ? error.message : "Failed to load analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role !== "admin" || !user) return;
    fetchAll();
  }, [role, user, range]);

  const sortedPages = useMemo(() => {
    const pages = topPages?.pages ? [...topPages.pages] : [];
    pages.sort((a, b) => {
      const dir = pagesSortDir === "asc" ? 1 : -1;
      if (pagesSortKey === "path") return a.path.localeCompare(b.path) * dir;
      if (pagesSortKey === "percent") return (a.percent - b.percent) * dir;
      return (a.pageviews - b.pageviews) * dir;
    });
    return pages;
  }, [topPages, pagesSortKey, pagesSortDir]);

  const togglePagesSort = (key: "pageviews" | "path" | "percent") => {
    if (pagesSortKey === key) {
      setPagesSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setPagesSortKey(key);
    setPagesSortDir(key === "path" ? "asc" : "desc");
  };

  const avgVisitDuration = useMemo(() => {
    if (!analytics || analytics.visits === 0) return 0;
    const minutes = Math.round((analytics.pageviews / analytics.visits) * 2);
    return minutes;
  }, [analytics]);

  // Calculate new vs returning visitors from retention data
  const newVsReturning = useMemo(() => {
    if (!retention || !Array.isArray(retention) || retention.length === 0) {
      return { new: 0, returning: 0, newPercent: 0, returningPercent: 0 };
    }
    const totalVisitors = retention.reduce((sum, r) => sum + (r.visitors || 0), 0);
    const totalReturning = retention.reduce((sum, r) => sum + (r.returnVisitors || 0), 0);
    const totalNew = totalVisitors - totalReturning;
    return {
      new: totalNew,
      returning: totalReturning,
      newPercent: totalVisitors > 0 ? Math.round((totalNew / totalVisitors) * 1000) / 10 : 0,
      returningPercent: totalVisitors > 0 ? Math.round((totalReturning / totalVisitors) * 1000) / 10 : 0,
    };
  }, [retention]);

  // Calculate traffic sources from attribution data
  const trafficSources = useMemo(() => {
    if (!attribution || !attribution.referrers) {
      return [];
    }
    const total = attribution.totals?.visitors || attribution.totals?.pageviews || 1;
    return attribution.referrers
      .slice(0, 10)
      .map((ref: any) => ({
        name: ref.name || "Direct",
        visitors: ref.visitors || ref.pageviews || 0,
        percent: total > 0 ? Math.round(((ref.visitors || ref.pageviews || 0) / total) * 1000) / 10 : 0,
      }))
      .sort((a: any, b: any) => b.visitors - a.visitors);
  }, [attribution]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                📊 Website Analytics
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Simple view of how people use our site
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => navigate("/admin/dashboard")}
                className="text-slate-700 border-slate-300 hover:bg-slate-100 w-full sm:w-auto"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={fetchAll}
                className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                size="sm"
                disabled={loading}
              >
                {loading ? "Loading..." : "Refresh"}
              </Button>
            </div>
          </div>

          {/* Date Range Selector */}
          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              variant={range === "7d" ? "default" : "outline"}
              onClick={() => setRange("7d")}
              disabled={loading}
              className={
                range === "7d"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "border-slate-300 text-slate-700 hover:bg-slate-100"
              }
            >
              📅 Last 7 days
            </Button>
            <Button
              size="sm"
              variant={range === "30d" ? "default" : "outline"}
              onClick={() => setRange("30d")}
              disabled={loading}
              className={
                range === "30d"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "border-slate-300 text-slate-700 hover:bg-slate-100"
              }
            >
              📅 Last 30 days
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 py-6">
        {/* 1️⃣ Overview Cards */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-1">The Big Picture</h2>
          <p className="text-sm text-slate-600 mb-4">
            How many people visited and what they did
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Visitors */}
            <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-xs font-semibold text-slate-500 uppercase">People</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">
                {loading ? "—" : (analytics?.visitors ?? 0).toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 mt-1">How many people visited</p>
            </div>

            {/* Visits */}
            <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-xs font-semibold text-slate-500 uppercase">Sessions</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">
                {loading ? "—" : (analytics?.visits ?? 0).toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 mt-1">Times people visited</p>
            </div>

            {/* Pageviews */}
            <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-xs font-semibold text-slate-500 uppercase">Pages</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">
                {loading ? "—" : (analytics?.pageviews ?? 0).toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 mt-1">Pages people looked at</p>
            </div>

            {/* Bounce Rate */}
            <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-xs font-semibold text-slate-500 uppercase">Bounce</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">
                {loading ? "—" : `${analytics?.bounceRate ?? 0}%`}
              </div>
              <p className="text-xs text-slate-500 mt-1">Left without looking around</p>
            </div>

            {/* Avg Duration */}
            <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-red-600" />
                </div>
                <span className="text-xs font-semibold text-slate-500 uppercase">Time</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">
                {loading ? "—" : `${avgVisitDuration}m`}
              </div>
              <p className="text-xs text-slate-500 mt-1">Average time spent</p>
            </div>

            {/* New vs Returning */}
            <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <span className="text-xs font-semibold text-slate-500 uppercase">Returning</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">
                {loading ? "—" : `${newVsReturning.returningPercent}%`}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {newVsReturning.newPercent}% new, {newVsReturning.returningPercent}% returning
              </p>
            </div>
          </div>
        </section>

        {/* 2️⃣ Traffic Over Time */}
        <section className="mb-8 bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Traffic Over Time</h2>
          <p className="text-sm text-slate-600 mb-4">
            How many visitors and page views each day
          </p>
          <div className="h-80">
            {!loading && timeseries && timeseries.points.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeseries.points} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => {
                      const d = new Date(v);
                      if (Number.isNaN(d.getTime())) return v;
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    }}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                  />
                  <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
                  <Tooltip
                    formatter={(value: any, name: any) => [value, name === "visitors" ? "Visitors" : "Pages"]}
                    labelFormatter={(label: any) => {
                      const d = new Date(label);
                      return Number.isNaN(d.getTime()) ? String(label) : d.toLocaleDateString();
                    }}
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="visitors"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    name="👥 Visitors"
                  />
                  <Line
                    type="monotone"
                    dataKey="pageviews"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    name="👁️ Pageviews"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                <div className="text-center">
                  <p className="text-sm">{loading ? "Loading chart..." : "No data available"}</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 3️⃣ Pages Performance */}
        <section className="mb-8 bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Most Popular Pages</h2>
          <p className="text-sm text-slate-600 mb-4">
            Which pages people visit most
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">
                    <button
                      onClick={() => togglePagesSort("path")}
                      className="flex items-center gap-1 hover:text-slate-900"
                    >
                      📄 Page <ChevronDown className="w-4 h-4" />
                    </button>
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">
                    <button
                      onClick={() => togglePagesSort("pageviews")}
                      className="flex items-center justify-end gap-1 hover:text-slate-900"
                    >
                      Views <ChevronDown className="w-4 h-4" />
                    </button>
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">
                    <button
                      onClick={() => togglePagesSort("percent")}
                      className="flex items-center justify-end gap-1 hover:text-slate-900"
                    >
                      % <ChevronDown className="w-4 h-4" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedPages.length > 0 ? (
                  sortedPages.map((p) => (
                    <tr key={p.path} className="border-b border-slate-100 hover:bg-slate-50 transition">
                      <td className="py-3 px-4">
                        <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-700 max-w-xs block truncate">
                          {p.path}
                        </code>
                      </td>
                      <td className="text-right py-3 px-4 font-medium text-slate-900">
                        {p.pageviews.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-blue-500 h-full rounded-full"
                              style={{ width: `${Math.min(p.percent, 100)}%` }}
                            />
                          </div>
                          <span className="font-semibold text-slate-700 w-12 text-right">
                            {p.percent.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center py-8 text-slate-500">
                      No page data
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 4️⃣ Visitor Sources & 5️⃣ Technology */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Visitor Sources */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Where People Come From</h2>
            <p className="text-sm text-slate-600 mb-4">
              Direct, Search, Referrals, Social, etc.
            </p>
            <div className="space-y-3">
              {loading ? (
                <p className="text-slate-500 text-sm py-4">Loading sources...</p>
              ) : trafficSources.length > 0 ? (
                trafficSources.slice(0, 6).map((source, idx) => {
                  const colors = [
                    "from-blue-50 to-blue-100 text-blue-600",
                    "from-green-50 to-green-100 text-green-600",
                    "from-purple-50 to-purple-100 text-purple-600",
                    "from-pink-50 to-pink-100 text-pink-600",
                    "from-orange-50 to-orange-100 text-orange-600",
                    "from-indigo-50 to-indigo-100 text-indigo-600",
                  ];
                  const icons = ["🔗", "🔍", "🌐", "📱", "📧", "🔖"];
                  const colorClass = colors[idx % colors.length];
                  const icon = icons[idx % icons.length];
                  return (
                    <div
                      key={source.name}
                      className={`flex items-center justify-between p-3 bg-gradient-to-r ${colorClass} rounded-lg`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{icon}</span>
                        <span className="font-medium text-slate-900 truncate">{source.name}</span>
                      </div>
                      <span className="text-sm font-bold ml-2 whitespace-nowrap">{source.percent}%</span>
                    </div>
                  );
                })
              ) : (
                <p className="text-slate-500 text-sm py-4">No source data available</p>
              )}
            </div>
          </div>

          {/* Technology */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-1">What They Use</h2>
            <p className="text-sm text-slate-600 mb-4">
              Browsers, devices, operating systems
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">🌐 Browsers</h3>
                <div className="space-y-2">
                  {loading ? (
                    <p className="text-slate-500 text-xs py-2">Loading...</p>
                  ) : breakdown?.rows && breakdown.rows.length > 0 ? (
                    breakdown.rows.slice(0, 5).map((row: any) => {
                      const total = breakdown.totals?.visitors || breakdown.totals?.views || 1;
                      const percent = total > 0 ? Math.round(((row.visitors || row.views || 0) / total) * 1000) / 10 : 0;
                      return (
                        <div key={row.name} className="flex justify-between items-center text-sm">
                          <span className="truncate">{row.name || "Unknown"}</span>
                          <span className="font-semibold ml-2 whitespace-nowrap">{percent}%</span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-slate-500 text-xs py-2">No browser data</p>
                  )}
                </div>
              </div>
              <div className="pt-3 border-t border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">📱 Devices</h3>
                {loading ? (
                  <p className="text-slate-500 text-xs py-2">Loading...</p>
                ) : breakdownDevice?.rows && breakdownDevice.rows.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {breakdownDevice.rows.slice(0, 3).map((row: any, idx: number) => {
                      const total = breakdownDevice.totals?.visitors || breakdownDevice.totals?.views || 1;
                      const percent = total > 0 ? Math.round(((row.visitors || row.views || 0) / total) * 1000) / 10 : 0;
                      const colors = ["bg-blue-100 text-blue-700", "bg-purple-100 text-purple-700", "bg-green-100 text-green-700"];
                      return (
                        <div key={row.name} className={`flex-1 ${colors[idx % colors.length]} rounded p-2 text-center text-xs font-semibold`}>
                          {row.name || "Unknown"} {percent}%
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-slate-500 text-xs py-2">No device data</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 7️⃣ Location Analytics */}
        <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Where People Are</h2>
          <p className="text-sm text-slate-600 mb-4">
            Countries and cities visiting us
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">🌍 Top Countries</h3>
              <div className="space-y-2">
                {loading ? (
                  <p className="text-slate-500 text-sm py-4">Loading countries...</p>
                ) : breakdownCountry?.rows && breakdownCountry.rows.length > 0 ? (
                  breakdownCountry.rows.slice(0, 5).map((row: any) => {
                    const total = breakdownCountry.totals?.visitors || breakdownCountry.totals?.views || 1;
                    const percent = total > 0 ? Math.round(((row.visitors || row.views || 0) / total) * 1000) / 10 : 0;
                    return (
                      <div
                        key={row.name}
                        className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded hover:bg-slate-100 transition"
                      >
                        <span className="text-sm text-slate-700 truncate">{row.name || "Unknown"}</span>
                        <div className="text-right ml-2">
                          <div className="text-sm font-semibold text-slate-900">
                            {(row.visitors || row.views || 0).toLocaleString()}
                          </div>
                          <div className="text-xs text-slate-500">{percent}%</div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-slate-500 text-sm py-4">No country data available</p>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">🏙️ Top Cities</h3>
              <div className="space-y-2">
                {loading ? (
                  <p className="text-slate-500 text-sm py-4">Loading cities...</p>
                ) : breakdownCity?.rows && breakdownCity.rows.length > 0 ? (
                  breakdownCity.rows.slice(0, 5).map((row: any) => {
                    const total = breakdownCity.totals?.visitors || breakdownCity.totals?.views || 1;
                    const percent = total > 0 ? Math.round(((row.visitors || row.views || 0) / total) * 1000) / 10 : 0;
                    return (
                      <div
                        key={row.name}
                        className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded hover:bg-slate-100 transition"
                      >
                        <span className="text-sm text-slate-700 truncate">{row.name || "Unknown"}</span>
                        <div className="text-right ml-2">
                          <div className="text-sm font-semibold text-slate-900">
                            {(row.visitors || row.views || 0).toLocaleString()}
                          </div>
                          <div className="text-xs text-slate-500">{percent}%</div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-slate-500 text-sm py-4">No city data available</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 8️⃣ Real-Time Activity */}
        <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Live Activity</h2>
          <p className="text-sm text-slate-600 mb-4">
            Recent visitor actions
          </p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {loading ? (
              <p className="text-slate-500 text-sm py-4 text-center">Loading recent activity...</p>
            ) : sessions?.data && sessions.data.length > 0 ? (
              sessions.data.slice(0, 10).map((sess: any, i: number) => {
                const lastAt = sess.lastAt ? new Date(sess.lastAt) : new Date();
                const now = new Date();
                const diffMs = now.getTime() - lastAt.getTime();
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMins / 60);
                const diffDays = Math.floor(diffHours / 24);
                let timeAgo = "";
                if (diffMins < 1) timeAgo = "Just now";
                else if (diffMins < 60) timeAgo = `${diffMins}m`;
                else if (diffHours < 24) timeAgo = `${diffHours}h`;
                else timeAgo = `${diffDays}d`;

                return (
                  <div
                    key={sess.id || i}
                    className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded text-xs hover:bg-slate-100 transition"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-lg">👤</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-slate-900 font-medium">
                          {sess.country || "Unknown"} {sess.city ? `(${sess.city})` : ""}
                        </p>
                        <p className="text-slate-500 truncate">
                          {sess.views || 0} views on {sess.browser || "Unknown"} / {sess.device || "Unknown"}
                        </p>
                      </div>
                    </div>
                    <span className="text-slate-500 ml-2 whitespace-nowrap">{timeAgo}</span>
                  </div>
                );
              })
            ) : (
              <p className="text-slate-500 text-sm py-4 text-center">No recent activity</p>
            )}
          </div>
        </section>

        {/* 1️⃣0️⃣ Events / Conversions */}
        <section className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm p-6 mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-1">🎯 Important Events</h2>
          <p className="text-sm text-slate-600 mb-4">
            Key actions people take
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(events?.events ?? []).length > 0 ? (
              events.events.map((e) => (
                <div
                  key={e.name}
                  className="bg-white rounded-lg p-4 border border-blue-200 hover:shadow-md transition"
                >
                  <p className="text-sm text-slate-600 mb-1">
                    {e.name.replace(/_/g, " ")}
                  </p>
                  <p className="text-3xl font-bold text-indigo-600">
                    {e.total.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">Total</p>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-slate-500">
                <p className="text-sm">No events tracked yet</p>
              </div>
            )}
          </div>
        </section>

        {/* 1️⃣0️⃣ Breakdown Report (Chunk 3) */}
        {breakdown && (
          <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 mb-8">
            <h2 className="text-lg font-bold text-slate-900 mb-1">🔧 Browser Breakdown</h2>
            <p className="text-sm text-slate-600 mb-4">Metrics by browser type</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 px-3 font-semibold text-slate-700">Browser</th>
                    <th className="text-right py-2 px-3 font-semibold text-slate-700">Views</th>
                    <th className="text-right py-2 px-3 font-semibold text-slate-700">Visitors</th>
                    <th className="text-right py-2 px-3 font-semibold text-slate-700">Bounce Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {(breakdown.rows || []).slice(0, 5).map((row: any, i: number) => (
                    <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-700">{row.name}</td>
                      <td className="py-2 px-3 text-right font-medium text-slate-900">{row.views}</td>
                      <td className="py-2 px-3 text-right font-medium text-slate-900">{row.visitors}</td>
                      <td className="py-2 px-3 text-right text-slate-600">
                        {row.visits > 0 ? Math.round((row.bounces / row.visits) * 100) : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 1️⃣3️⃣ Journey Report (Chunk 6) */}
        {journey && (
          <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 mb-8">
            <h2 className="text-lg font-bold text-slate-900 mb-1">🛤️ User Journeys</h2>
            <p className="text-sm text-slate-600 mb-4">Most common paths users take</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(journey.items || []).slice(0, 10).map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded">
                  <span className="text-sm text-slate-700 flex-1 truncate">
                    {item.path.map((p: string, idx: number) => (
                      <span key={idx}>
                        {idx > 0 && " → "}
                        <code className="bg-white px-1 rounded text-xs">{p}</code>
                      </span>
                    ))}
                  </span>
                  <span className="text-sm font-semibold text-slate-900 ml-2">{item.count}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 1️⃣4️⃣ Retention Report (Chunk 7) */}
        {retention && (
          <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 mb-8">
            <h2 className="text-lg font-bold text-slate-900 mb-1">🔄 Daily Retention</h2>
            <p className="text-sm text-slate-600 mb-4">Returning visitor percentages by day</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 px-3 font-semibold text-slate-700">Date</th>
                    <th className="text-right py-2 px-3 font-semibold text-slate-700">Day</th>
                    <th className="text-right py-2 px-3 font-semibold text-slate-700">Visitors</th>
                    <th className="text-right py-2 px-3 font-semibold text-slate-700">Returning</th>
                    <th className="text-right py-2 px-3 font-semibold text-slate-700">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {(retention || []).slice(0, 7).map((row: any, i: number) => (
                    <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-700">{row.date}</td>
                      <td className="py-2 px-3 text-right text-slate-600">{row.day}</td>
                      <td className="py-2 px-3 text-right font-medium text-slate-900">{row.visitors}</td>
                      <td className="py-2 px-3 text-right text-slate-900">{row.returnVisitors}</td>
                      <td className="py-2 px-3 text-right font-semibold text-blue-600">{row.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 1️⃣7️⃣ Sessions Report (Chunk 10) */}
        {sessions && (
          <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 mb-8">
            <h2 className="text-lg font-bold text-slate-900 mb-1">👥 Recent Sessions</h2>
            <p className="text-sm text-slate-600 mb-4">Active user sessions</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 px-3 font-semibold text-slate-700">Browser</th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-700">OS</th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-700">Country</th>
                    <th className="text-right py-2 px-3 font-semibold text-slate-700">Views</th>
                  </tr>
                </thead>
                <tbody>
                  {(sessions.data || []).slice(0, 8).map((sess: any, i: number) => (
                    <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-700">{sess.browser}</td>
                      <td className="py-2 px-3 text-slate-700">{sess.os}</td>
                      <td className="py-2 px-3 text-slate-700">{sess.country}</td>
                      <td className="py-2 px-3 text-right font-medium text-slate-900">{sess.views}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

      </div>
    </div>
  );
};

export default AdminAnalytics;
