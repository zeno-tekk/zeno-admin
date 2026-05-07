"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, ChevronLeft, ChevronRight, Calendar, User } from "lucide-react";
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

interface LogsResponse {
  page: number;
  limit: number;
  total: number;
  data: ActivityLog[];
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

export default function LogsPage() {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useSWR<LogsResponse>(
    `${API_URL}/logs?page=${page}&limit=${limit}`,
    fetcher
  );

  const logs = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Activity Logs</h1>
        <p className="text-muted-foreground mt-2">
          {total} total actions recorded
        </p>
      </div>

      {isLoading ? (
        <Card className="p-6">Loading...</Card>
      ) : logs.length === 0 ? (
        <Card className="p-12 text-center">
          <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No activity logs yet.</p>
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            {logs.map((log) => (
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} · {total} logs
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
