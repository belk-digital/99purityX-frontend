"use client";

import { useQuery } from "@tanstack/react-query";
import { Users, ScrollText, Shield, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { providersApi } from "@/lib/api/providers";
import { auditApi } from "@/lib/api/audit";
import type { AuditLog } from "@/types/audit";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function AuditRow({ log }: { log: AuditLog }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-slate-100 p-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
        <Activity className="h-4 w-4 text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-800">
          <span className="font-medium">{log.action}</span>
          <span className="text-slate-400"> on </span>
          <span className="font-medium">{log.resource}</span>
        </p>
        {log.description && (
          <p className="mt-0.5 text-xs text-slate-500 truncate">{log.description}</p>
        )}
      </div>
      <span className="shrink-0 text-xs text-slate-400">{timeAgo(log.created_at)}</span>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data: providers = [], isLoading: provLoading } = useQuery({
    queryKey: ["providers"],
    queryFn: providersApi.getAll,
  });

  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["audit", "logs", "recent"],
    queryFn: () => auditApi.getLogs({ limit: 10 }),
  });

  const stats = [
    { label: "Providers", value: providers.length, icon: Users, color: "text-violet-600", bg: "bg-violet-50", href: "/admin/users" },
    { label: "Recent Events", value: logs.length, icon: ScrollText, color: "text-amber-600", bg: "bg-amber-50", href: "/admin/audit" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Platform overview and management</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg, href }) => (
          <Link key={href} href={href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
                    {provLoading || logsLoading ? (
                      <Skeleton className="mt-1 h-8 w-10" />
                    ) : (
                      <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
                    )}
                  </div>
                  <div className={`rounded-lg p-2 ${bg}`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent audit activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
          <Link href="/admin/audit" className="text-xs text-red-600 hover:text-red-700 font-medium">
            View all →
          </Link>
        </CardHeader>
        <CardContent className="space-y-2">
          {logsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="space-y-1.5 flex-1"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
              </div>
            ))
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <ScrollText className="h-8 w-8 text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">No audit events yet</p>
            </div>
          ) : (
            logs.slice(0, 5).map((log) => <AuditRow key={log.id} log={log} />)
          )}
        </CardContent>
      </Card>
    </div>
  );
}
