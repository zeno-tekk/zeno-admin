"use client"

import useSWR from "swr"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  ArrowUpCircle,
  ArrowDownCircle,
  Eye,
  Users,
  Calendar,
  ArrowRight,
} from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL
const fetcher = (url: string) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  return fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }).then((r) => r.json())
}

// Same dark-mode-safe color constants as analytics page
const RC = {
  income: "#10b981",
  expense: "#f43f5e",
  primary: "#6366f1",
  grid: "rgba(255,255,255,0.07)",
  axis: "#64748b",
  tooltipBg: "#1e293b",
  tooltipBorder: "#334155",
  tooltipText: "#f1f5f9",
  tooltipItem: "#a5b4fc",
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-RW", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)

function fillDailyData(dailyViews: { date: string; count: number }[], days = 30) {
  const map = new Map(dailyViews.map((d) => [d.date, d.count]))
  return Array.from({ length: days }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (days - 1 - i))
    const iso = date.toISOString().split("T")[0]
    return {
      label: date.toLocaleDateString("en", { month: "short", day: "numeric" }),
      count: map.get(iso) ?? 0,
    }
  })
}

export default function AdminDashboard() {
  const { data: analyticsData } = useSWR<{ success: boolean; data: any }>(
    `${API_URL}/content/analytics/summary`,
    fetcher,
    { refreshInterval: 60000 }
  )
  const { data: financeData } = useSWR<{ success: boolean; data: any }>(
    `${API_URL}/content/finance/summary`,
    fetcher,
    { refreshInterval: 60000 }
  )

  const analytics = analyticsData?.data
  const finance = financeData?.data

  const chartData = analytics ? fillDailyData(analytics.dailyViews ?? []) : []
  const isProfit = finance ? finance.isProfit : true

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back,  here's how things are looking</p>
      </div>

      {/* ── Finance Overview ─────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Finance
          </h2>
          <Link
            href="/admin/finance"
            className="text-xs text-primary flex items-center gap-1 hover:underline"
          >
            Manage <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Net P&L */}
          <Card
            className={`p-5 col-span-2 lg:col-span-1 border-2 ${
              isProfit
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "border-rose-500/30 bg-rose-500/5"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Net P&amp;L
              </span>
              {isProfit ? (
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-rose-500" />
              )}
            </div>
            <div
              className={`text-2xl font-bold ${isProfit ? "text-emerald-500" : "text-rose-500"}`}
            >
              {finance ? `${isProfit ? "+" : "-"}RWF ${fmt(Math.abs(finance.netProfit))}` : "—"}
            </div>
            <div
              className={`text-xs font-semibold mt-1 ${
                isProfit ? "text-emerald-500" : "text-rose-500"
              }`}
            >
              {isProfit ? "▲ In Profit" : "▼ At Loss"}
            </div>
          </Card>

          {/* Income */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Total Income
              </span>
              <ArrowUpCircle className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-emerald-500">
              {finance ? `RWF ${fmt(finance.totalIncome)}` : "—"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {finance ? `${finance.incomeCount} transactions` : ""}
            </div>
          </Card>

          {/* Expenses */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Total Expenses
              </span>
              <ArrowDownCircle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold text-rose-500">
              {finance ? `RWF ${fmt(finance.totalExpenses)}` : "—"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {finance ? `${finance.expenseCount} transactions` : ""}
            </div>
          </Card>

          {/* This month */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                This Month
              </span>
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <div
              className={`text-2xl font-bold ${
                finance
                  ? finance.isThisMonthProfit
                    ? "text-emerald-500"
                    : "text-rose-500"
                  : ""
              }`}
            >
              {finance
                ? `${finance.isThisMonthProfit ? "+" : "-"}RWF ${fmt(Math.abs(finance.thisMonthNet))}`
                : "—"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">net this month</div>
          </Card>
        </div>
      </section>

      {/* ── Analytics Overview ──────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Site Traffic
          </h2>
          <Link
            href="/admin/analytics"
            className="text-xs text-primary flex items-center gap-1 hover:underline"
          >
            Full report <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* KPI cards */}
          <div className="space-y-4">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Total Views
                </span>
                <Eye className="w-4 h-4 text-primary" />
              </div>
              <div className="text-2xl font-bold">
                {analytics?.totalViews?.toLocaleString() ?? "—"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">all time</div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Unique Visitors
                </span>
                <Users className="w-4 h-4 text-cyan-500" />
              </div>
              <div className="text-2xl font-bold">
                {analytics?.uniqueSessions?.toLocaleString() ?? "—"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">distinct sessions</div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  This Week
                </span>
                <Calendar className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold">
                {analytics?.weekViews?.toLocaleString() ?? "—"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">last 7 days</div>
            </Card>
          </div>

          {/* Page views line chart */}
          <Card className="p-5 lg:col-span-2">
            <h3 className="text-sm font-semibold mb-1">Page Views — Last 30 Days</h3>
            <p className="text-xs text-muted-foreground mb-4">
              {analytics?.monthViews ?? 0} views this month
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={RC.grid} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: RC.axis }}
                  interval={Math.floor(chartData.length / 5)}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: RC.axis }}
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
                  formatter={(v: number) => [v, "Views"]}
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
        </div>
      </section>

      {/* ── Recent Activity ─────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Recent Activity
        </h2>

        <div className="grid lg:grid-cols-2 gap-4">
          {/* Recent Finance Entries */}
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="text-sm font-semibold">Latest Transactions</h3>
              <Link href="/admin/finance" className="text-xs text-primary hover:underline">
                View all
              </Link>
            </div>
            {!finance || finance.recentEntries.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                No transactions yet
              </div>
            ) : (
              <div className="divide-y divide-border">
                {finance.recentEntries.map((e: any) => (
                  <div key={e.id} className="flex items-center gap-3 px-5 py-3">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                        e.type === "income"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-rose-500/10 text-rose-500"
                      }`}
                    >
                      {e.type === "income" ? (
                        <ArrowUpCircle className="w-4 h-4" />
                      ) : (
                        <ArrowDownCircle className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{e.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(e.date + "T00:00:00").toLocaleDateString("en", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-bold shrink-0 ${
                        e.type === "income" ? "text-emerald-500" : "text-rose-500"
                      }`}
                    >
                      {e.type === "income" ? "+" : "-"}RWF {fmt(e.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Top Pages */}
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="text-sm font-semibold">Top Pages</h3>
              <Link href="/admin/analytics" className="text-xs text-primary hover:underline">
                Full analytics
              </Link>
            </div>
            {!analytics || analytics.topPages.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                No traffic data yet
              </div>
            ) : (
              <div className="p-5 space-y-3">
                {analytics.topPages.slice(0, 5).map((p: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-4 shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate">{p.page || "/"}</span>
                        <span className="text-sm text-muted-foreground ml-2 shrink-0">{p.views}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{
                            width: `${(p.views / (analytics.topPages[0]?.views || 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </section>
    </div>
  )
}
