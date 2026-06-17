"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScrollText, Activity, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { auditApi } from "@/lib/api/audit";
import type { AuditLog } from "@/types/audit";

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

const actionColors: Record<string, string> = {
  CREATE: "bg-green-100 text-green-700",
  UPDATE: "bg-blue-100 text-blue-700",
  DELETE: "bg-red-100 text-red-700",
  LOGIN: "bg-teal-100 text-teal-700",
  LOGOUT: "bg-slate-100 text-slate-600",
};

function getActionColor(action: string) {
  const upper = action.toUpperCase();
  for (const [key, cls] of Object.entries(actionColors)) {
    if (upper.includes(key)) return cls;
  }
  return "bg-slate-100 text-slate-600";
}

function AuditLogRow({ log }: { log: AuditLog }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
              <Activity className="h-4 w-4 text-slate-500" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${getActionColor(log.action)}`}>
                  {log.action}
                </span>
                <span className="text-sm font-medium text-slate-800">{log.resource}</span>
                {log.resource_id && (
                  <span className="text-xs text-slate-400 font-mono">{log.resource_id.slice(0, 8)}...</span>
                )}
              </div>
              {log.description && (
                <p className="mt-1 text-xs text-slate-500">{log.description}</p>
              )}
              <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-400">
                <span>{formatTimestamp(log.created_at)}</span>
                {log.actor_user_id && (
                  <span>Actor: {log.actor_user_id.slice(0, 8)}...</span>
                )}
                {log.ip_address && <span>IP: {log.ip_address}</span>}
              </div>
            </div>
          </div>
          {log.audit_metadata && Object.keys(log.audit_metadata).length > 0 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="shrink-0 text-xs text-slate-400 hover:text-slate-600"
            >
              {expanded ? "Hide" : "Details"}
            </button>
          )}
        </div>
        {expanded && log.audit_metadata && (
          <pre className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 overflow-x-auto">
            {JSON.stringify(log.audit_metadata, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}><CardContent className="p-4"><div className="flex items-start gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-3 w-2/3" /><Skeleton className="h-3 w-1/4" /></div>
        </div></CardContent></Card>
      ))}
    </div>
  );
}

export default function AdminAuditPage() {
  const [search, setSearch] = useState("");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["audit", "logs"],
    queryFn: () => auditApi.getLogs({ limit: 100 }),
  });

  const filtered = logs.filter((log) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.resource.toLowerCase().includes(q) ||
      (log.description?.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
        <p className="mt-1 text-sm text-slate-500">
          Platform activity and security events
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search by action, resource, or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {!isLoading && (
        <p className="text-xs text-slate-400">
          Showing {filtered.length} of {logs.length} events
        </p>
      )}

      {isLoading ? (
        <ListSkeleton />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
          <ScrollText className="h-10 w-10 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-600">
            {logs.length === 0 ? "No audit events yet" : "No events match your search"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((log) => <AuditLogRow key={log.id} log={log} />)}
        </div>
      )}
    </div>
  );
}
