import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Eye, FileText, Link as LinkIcon, Percent } from "lucide-react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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

  const [pagesSortKey, setPagesSortKey] = useState<"pageviews" | "path" | "percent">("pageviews");
  const [pagesSortDir, setPagesSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    if (role !== "admin" || !user) return;
    fetchAll();
  }, [role, user]);

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
          console.error("Analytics function error:", { status: res.status, body, url });
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
    } catch (error) {
      console.error("Unexpected analytics error:", error);
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
  }, [range]);

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

  return (
    <div className="min-h-screen bg-gradient-hero pb-20">
      <div className="bg-gradient-primary text-white px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Analytics</h1>
            <p className="text-white/90 text-sm sm:text-lg">Umami website stats</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => navigate("/admin/dashboard")}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 w-full sm:w-auto"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              variant="outline"
              onClick={fetchAll}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 w-full sm:w-auto"
              size="sm"
              disabled={loading}
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 -mt-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Button
            size="sm"
            variant={range === "7d" ? "default" : "outline"}
            onClick={() => setRange("7d")}
            disabled={loading}
          >
            Last 7 days
          </Button>
          <Button
            size="sm"
            variant={range === "30d" ? "default" : "outline"}
            onClick={() => setRange("30d")}
            disabled={loading}
          >
            Last 30 days
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard
            icon={Eye}
            value={loading ? "—" : (analytics?.visitors ?? "—")}
            label="Visitors"
            variant="default"
          />
          <StatCard
            icon={FileText}
            value={loading ? "—" : (analytics?.pageviews ?? "—")}
            label="Pageviews"
            variant="default"
          />
          <StatCard
            icon={LinkIcon}
            value={loading ? "—" : (analytics?.visits ?? "—")}
            label="Visits"
            variant="default"
          />
          <StatCard
            icon={Percent}
            value={loading ? "—" : `${analytics?.bounceRate ?? 0}%`}
            label="Bounce Rate"
            variant="default"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-[18px] p-6 shadow-[0_1px_3px_0_rgb(0_0_0_/_0.05),0_1px_2px_-1px_rgb(0_0_0_/_0.05)] lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold" style={{ color: "#0F172A" }}>Traffic</h2>
              <span className="text-xs text-muted-foreground">{range}</span>
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeseries?.points ?? []} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => {
                      const d = new Date(v);
                      if (Number.isNaN(d.getTime())) return v;
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    }}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: any, name: any) => [value, name]}
                    labelFormatter={(label: any) => {
                      const d = new Date(label);
                      return Number.isNaN(d.getTime()) ? String(label) : d.toLocaleString();
                    }}
                  />
                  <Line type="monotone" dataKey="pageviews" stroke="#459394" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="visitors" stroke="#EF684B" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">Pageviews (teal) vs Visitors (orange)</div>
          </div>

          <div className="bg-white rounded-[18px] p-6 shadow-[0_1px_3px_0_rgb(0_0_0_/_0.05),0_1px_2px_-1px_rgb(0_0_0_/_0.05)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold" style={{ color: "#0F172A" }}>Events / Conversions</h2>
              <span className="text-xs text-muted-foreground">{range}</span>
            </div>
            <div className="space-y-3">
              {(events?.events ?? []).slice(0, 6).map((e) => (
                <div key={e.name} className="flex items-center justify-between">
                  <div className="text-sm truncate pr-2" title={e.name}>{e.name}</div>
                  <div className="text-sm font-semibold">{e.total.toLocaleString()}</div>
                </div>
              ))}
              {(!events?.events || events.events.length === 0) && (
                <div className="text-sm text-muted-foreground">No events found</div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[18px] p-6 mt-6 shadow-[0_1px_3px_0_rgb(0_0_0_/_0.05),0_1px_2px_-1px_rgb(0_0_0_/_0.05)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold" style={{ color: "#0F172A" }}>Top Pages</h2>
            <span className="text-xs text-muted-foreground">{range}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4">
                    <button className="font-semibold" onClick={() => togglePagesSort("path")}>
                      Page
                    </button>
                  </th>
                  <th className="py-2 pr-4 text-right">
                    <button className="font-semibold" onClick={() => togglePagesSort("pageviews")}>
                      Pageviews
                    </button>
                  </th>
                  <th className="py-2 text-right">
                    <button className="font-semibold" onClick={() => togglePagesSort("percent")}>
                      % of traffic
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedPages.map((p) => (
                  <tr key={p.path} className="border-b last:border-b-0">
                    <td className="py-2 pr-4 max-w-[520px] truncate" title={p.path}>{p.path}</td>
                    <td className="py-2 pr-4 text-right font-medium">{p.pageviews.toLocaleString()}</td>
                    <td className="py-2 text-right">{p.percent.toFixed(1)}%</td>
                  </tr>
                ))}
                {sortedPages.length === 0 && (
                  <tr>
                    <td className="py-6 text-center text-muted-foreground" colSpan={3}>No page data</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
