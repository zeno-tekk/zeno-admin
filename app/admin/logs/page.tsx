"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, ChevronLeft, ChevronRight, Calendar, User, LogIn, CheckCircle, XCircle, Monitor } from "lucide-react";
import useSWR from "swr";
import { getAuthHeaders } from "@/lib/auth";

interface ActivityLog {
  id: number;
  email: string | null;
  action: string;
  targetId: string | null;
  targetType: string | null;
  details: string | null;
  createdAt: string;
}

interface LoginLog {
  id: number;
  email: string;
  success: boolean;
  failureReason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface LogsResponse<T> {
  page: number;
  limit: number;
  total: number;
  data: T[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const fetcher = (url: string) => fetch(url, { headers: getAuthHeaders() }).then((r) => r.json());

const TARGET_COLORS: Record<string, string> = {
  Product: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Service: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  TeamMember: "bg-green-500/10 text-green-600 dark:text-green-400",
  Testimonial: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  Stat: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  HeroContent: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  BlogPost: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  ContactMessage: "bg-red-500/10 text-red-600 dark:text-red-400",
  FinanceEntry: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Users: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
};

type Tab = "activity" | "logins";

export default function LogsPage() {
  const [tab, setTab] = useState<Tab>("activity");
  const [activityPage, setActivityPage] = useState(1);
  const [loginPage, setLoginPage] = useState(1);
  const limit = 20;

  const { data: activityData, isLoading: activityLoading } = useSWR<LogsResponse<ActivityLog>>(
    `${API_URL}/logs?page=${activityPage}&limit=${limit}`,
    fetcher
  );

  const { data: loginData, isLoading: loginLoading } = useSWR<LogsResponse<LoginLog>>(
    `${API_URL}/logs/logins?page=${loginPage}&limit=${limit}`,
    fetcher
  );

  const activityLogs = activityData?.data || [];
  const activityTotal = activityData?.total || 0;
  const activityTotalPages = Math.ceil(activityTotal / limit);

  const loginLogs = loginData?.data || [];
  const loginTotal = loginData?.total || 0;
  const loginTotalPages = Math.ceil(loginTotal / limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Logs</h1>
        <p className="text-muted-foreground mt-2">
          Monitor activity and login attempts across the platform.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        <button
          onClick={() => setTab("activity")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "activity"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Activity Logs
            {activityTotal > 0 && (
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">{activityTotal}</span>
            )}
          </span>
        </button>
        <button
          onClick={() => setTab("logins")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "logins"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="flex items-center gap-2">
            <LogIn className="w-4 h-4" />
            Login Attempts
            {loginTotal > 0 && (
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">{loginTotal}</span>
            )}
          </span>
        </button>
      </div>

      {/* Activity Logs Tab */}
      {tab === "activity" && (
        <>
          {activityLoading ? (
            <Card className="p-6">Loading...</Card>
          ) : activityLogs.length === 0 ? (
            <Card className="p-12 text-center">
              <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No activity logs yet.</p>
            </Card>
          ) : (
            <>
              <div className="space-y-2">
                {activityLogs.map((log) => (
                  <Card key={log.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="mt-0.5 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Activity className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm">{log.action}</p>
                          {log.details && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.details}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            {log.email && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <User className="w-3 h-3" />
                                {log.email}
                              </span>
                            )}
                            {log.targetType && (
                              <span
                                className={`px-1.5 py-0.5 text-xs rounded-full ${
                                  TARGET_COLORS[log.targetType] ?? "bg-muted text-muted-foreground"
                                }`}
                              >
                                {log.targetType}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span className="whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {activityTotalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {activityPage} of {activityTotalPages} · {activityTotal} logs
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                      disabled={activityPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActivityPage((p) => Math.min(activityTotalPages, p + 1))}
                      disabled={activityPage === activityTotalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Login Attempts Tab */}
      {tab === "logins" && (
        <>
          {loginLoading ? (
            <Card className="p-6">Loading...</Card>
          ) : loginLogs.length === 0 ? (
            <Card className="p-12 text-center">
              <LogIn className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No login attempts recorded yet.</p>
            </Card>
          ) : (
            <>
              <div className="space-y-2">
                {loginLogs.map((log) => (
                  <Card key={log.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            log.success ? "bg-emerald-500/10" : "bg-red-500/10"
                          }`}
                        >
                          {log.success ? (
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{log.email}</span>
                            <span
                              className={`px-1.5 py-0.5 text-xs rounded-full ${
                                log.success
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : "bg-red-500/10 text-red-600 dark:text-red-400"
                              }`}
                            >
                              {log.success ? "Success" : "Failed"}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-1">
                            {!log.success && log.failureReason && (
                              <span className="text-xs text-muted-foreground">
                                Reason: {log.failureReason}
                              </span>
                            )}
                            {log.ipAddress && (
                              <span className="text-xs text-muted-foreground">
                                IP: {log.ipAddress}
                              </span>
                            )}
                            {log.userAgent && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground truncate max-w-xs">
                                <Monitor className="w-3 h-3 shrink-0" />
                                <span className="truncate">{log.userAgent}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span className="whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {loginTotalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {loginPage} of {loginTotalPages} · {loginTotal} attempts
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLoginPage((p) => Math.max(1, p - 1))}
                      disabled={loginPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLoginPage((p) => Math.min(loginTotalPages, p + 1))}
                      disabled={loginPage === loginTotalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
