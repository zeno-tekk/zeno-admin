"use client"

import useSWR from "swr"
import { Card } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts"
import {
  Eye,
  Users,
  TrendingUp,
  Calendar,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  ArrowUpRight,
  Clock,
} from "lucide-react"

import { getAuthHeaders } from "@/lib/auth"

const API_URL = process.env.NEXT_PUBLIC_API_URL
const fetcher = (url: string) => fetch(url, { headers: getAuthHeaders() }).then((r) => r.json())

interface DailyView {
  date: string
  count: number
}

interface AnalyticsSummary {
  totalViews: number
  uniqueSessions: number
  todayViews: number
  weekViews: number
  monthViews: number
  topPages: { page: string; views: number }[]
  deviceBreakdown: { device: string; count: number }[]
  browserBreakdown: { browser: string; count: number }[]
  osBreakdown: { os: string; count: number }[]
  topReferrers: { referrer: string; count: number }[]
  dailyViews: DailyView[]
  recentViews: {
    id: number
    page: string
    browser: string
    os: string
    device: string
    ip: string
    referrer: string
    createdAt: string
  }[]
}

// Fill missing days with 0 so the chart always shows 30 days
function fillDailyData(dailyViews: DailyView[], days = 30) {
  const map = new Map(dailyViews.map((d) => [d.date, d.count]))
  const result = []
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const iso = date.toISOString().split("T")[0]
    result.push({
      date: iso,
      label: date.toLocaleDateString("en", { month: "short", day: "numeric" }),
      count: map.get(iso) ?? 0,
    })
  }
  return result
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "text-primary",
}: {
  icon: React.ElementType
  label: string
  value: number | string
  sub?: string
  color?: string
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground font-medium">{label}</span>
        <div className={`w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-3xl font-bold mb-1">{value.toLocaleString()}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </Card>
  )
}

function deviceIcon(device: string) {
  if (device === "mobile") return <Smartphone className="w-4 h-4" />
  if (device === "tablet") return <Tablet className="w-4 h-4" />
  return <Monitor className="w-4 h-4" />
}

const CHART_COLORS = ["#6366f1", "#22d3ee", "#f59e0b", "#10b981", "#f43f5e", "#a78bfa"]

// Recharts renders colors as SVG attributes, not CSS — variables don't resolve there.
// Use explicit values for everything that touches a recharts prop.
const RC = {
  primary: "#6366f1",
  grid: "rgba(255,255,255,0.07)",
  axis: "#64748b",
  tooltipBg: "#1e293b",
  tooltipBorder: "#334155",
  tooltipText: "#f1f5f9",
  tooltipItem: "#a5b4fc",
}

export default function AnalyticsPage() {
  const { data, isLoading } = useSWR<{ success: boolean; data: AnalyticsSummary }>(
    `${API_URL}/content/analytics/summary`,
    fetcher,
    { refreshInterval: 30000 }
  )

  const summary = data?.data

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">Loading traffic data...</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-muted rounded w-24 mb-4" />
              <div className="h-8 bg-muted rounded w-16" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <Card className="p-12 text-center">
          <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No traffic data yet. Data will appear once visitors browse the site.</p>
        </Card>
      </div>
    )
  }

  const chartData = fillDailyData(summary.dailyViews)
  const maxViews = Math.max(...chartData.map((d) => d.count), 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Site traffic and visitor insights · auto-refreshes every 30s
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Eye} label="Total Page Views" value={summary.totalViews} sub="all time" />
        <KpiCard
          icon={Users}
          label="Unique Visitors"
          value={summary.uniqueSessions}
          sub="distinct sessions"
          color="text-cyan-500"
        />
        <KpiCard
          icon={Calendar}
          label="Today"
          value={summary.todayViews}
          sub="views today"
          color="text-amber-500"
        />
        <KpiCard
          icon={TrendingUp}
          label="This Week"
          value={summary.weekViews}
          sub="last 7 days"
          color="text-emerald-500"
        />
      </div>

      {/* Daily Views Chart */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-1">Page Views — Last 30 Days</h2>
        <p className="text-sm text-muted-foreground mb-6">{summary.monthViews} views this month</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={RC.grid} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: RC.axis }}
              interval={Math.floor(chartData.length / 7)}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: RC.axis }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: RC.tooltipBg,
                border: `1px solid ${RC.tooltipBorder}`,
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: RC.tooltipText, fontWeight: 600 }}
              itemStyle={{ color: RC.tooltipItem }}
              formatter={(value: number) => [value, "Views"]}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke={RC.primary}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: RC.primary }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Top Pages + Device Breakdown */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Top Pages</h2>
          {summary.topPages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {summary.topPages.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-4 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate">{p.page || "/"}</span>
                      <span className="text-sm text-muted-foreground ml-2 shrink-0">{p.views}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{
                          width: `${(p.views / (summary.topPages[0]?.views || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Device Breakdown */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Devices</h2>
          {summary.deviceBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={summary.deviceBreakdown}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
              >
                <XAxis
                  dataKey="device"
                  tick={{ fontSize: 12, fill: RC.axis }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: RC.axis }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: RC.tooltipBg,
                    border: `1px solid ${RC.tooltipBorder}`,
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  labelStyle={{ color: RC.tooltipText }}
                  itemStyle={{ color: RC.tooltipItem }}
                  formatter={(v: number) => [v, "Visitors"]}
                />
                <Bar dataKey="count" fill={RC.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}

          {/* Device legend with icons */}
          <div className="flex gap-4 mt-4 flex-wrap">
            {summary.deviceBreakdown.map((d) => {
              const total = summary.deviceBreakdown.reduce((s, x) => s + x.count, 0)
              return (
                <div key={d.device} className="flex items-center gap-1.5 text-sm">
                  <span className="text-muted-foreground">{deviceIcon(d.device)}</span>
                  <span className="capitalize">{d.device}</span>
                  <span className="text-muted-foreground">
                    {total ? Math.round((d.count / total) * 100) : 0}%
                  </span>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Browser + OS breakdowns */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Browser breakdown */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Browsers</h2>
          {summary.browserBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {summary.browserBreakdown.map((b, i) => {
                const total = summary.browserBreakdown.reduce((s, x) => s + x.count, 0)
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{b.browser}</span>
                        <span className="text-sm text-muted-foreground">
                          {b.count} · {total ? Math.round((b.count / total) * 100) : 0}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(b.count / (summary.browserBreakdown[0]?.count || 1)) * 100}%`,
                            background: CHART_COLORS[i % CHART_COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* OS breakdown */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Operating Systems</h2>
          {summary.osBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {summary.osBreakdown.map((o, i) => {
                const total = summary.osBreakdown.reduce((s, x) => s + x.count, 0)
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{o.os}</span>
                        <span className="text-sm text-muted-foreground">
                          {o.count} · {total ? Math.round((o.count / total) * 100) : 0}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(o.count / (summary.osBreakdown[0]?.count || 1)) * 100}%`,
                            background: CHART_COLORS[i % CHART_COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Referrers + Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Referrers */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Top Referrers</h2>
          {summary.topReferrers.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4 text-center">
              No referrer data yet — visitors are arriving directly.
            </div>
          ) : (
            <div className="space-y-3">
              {summary.topReferrers.map((r, i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate">{r.referrer}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-sm font-medium">{r.count}</span>
                    <ArrowUpRight className="w-3 h-3 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Activity */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Visits</h2>
          {summary.recentViews.length === 0 ? (
            <p className="text-sm text-muted-foreground">No visits recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {summary.recentViews.map((v) => (
                <div key={v.id} className="flex items-start gap-3 text-sm">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    {v.device === "mobile" ? (
                      <Smartphone className="w-3.5 h-3.5 text-primary" />
                    ) : v.device === "tablet" ? (
                      <Tablet className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <Monitor className="w-3.5 h-3.5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">{v.page || "/"}</span>
                      <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(v.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {[v.browser, v.os].filter(Boolean).join(" · ")}
                      {v.referrer ? ` · from ${v.referrer}` : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
