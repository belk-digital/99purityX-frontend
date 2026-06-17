"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FlaskConical,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  Ban,
  Droplet,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { labsApi } from "@/lib/api/labs";
import type { LabOrder, LabOrderDetail, LabResult } from "@/types/lab";

// ─── helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type ResultFlag = "normal" | "high" | "low" | "unknown";

function resultFlag(r: LabResult): ResultFlag {
  const val = parseFloat(r.value);
  if (isNaN(val)) return "unknown";
  if (r.reference_min !== null && val < parseFloat(r.reference_min)) return "low";
  if (r.reference_max !== null && val > parseFloat(r.reference_max)) return "high";
  if (r.reference_min !== null || r.reference_max !== null) return "normal";
  return "unknown";
}

const flagStyle: Record<ResultFlag, string> = {
  normal: "text-green-600 bg-green-50",
  high: "text-red-600 bg-red-50",
  low: "text-blue-600 bg-blue-50",
  unknown: "text-slate-500 bg-slate-50",
};

const flagIcon: Record<ResultFlag, React.ReactNode> = {
  normal: <Minus className="h-3 w-3" />,
  high: <TrendingUp className="h-3 w-3" />,
  low: <TrendingDown className="h-3 w-3" />,
  unknown: <Minus className="h-3 w-3" />,
};

const flagLabel: Record<ResultFlag, string> = {
  normal: "Normal",
  high: "High",
  low: "Low",
  unknown: "—",
};

// ─── status badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: LabOrder["status"] }) {
  const map = {
    ordered: { cls: "bg-blue-100 text-blue-700 border-blue-200", icon: <Clock className="h-3 w-3" />, label: "Ordered" },
    sample_collected: { cls: "bg-amber-100 text-amber-700 border-amber-200", icon: <Droplet className="h-3 w-3" />, label: "Sample Collected" },
    completed: { cls: "bg-green-100 text-green-700 border-green-200", icon: <CheckCircle2 className="h-3 w-3" />, label: "Completed" },
    cancelled: { cls: "bg-slate-100 text-slate-500 border-slate-200", icon: <Ban className="h-3 w-3" />, label: "Cancelled" },
  };
  const { cls, icon, label } = map[status] ?? map.ordered;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {icon}
      {label}
    </span>
  );
}

// ─── results table ───────────────────────────────────────────────────────────

function ResultsTable({ results }: { results: LabResult[] }) {
  if (results.length === 0) {
    return <p className="text-sm text-slate-400 italic">No results recorded yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Biomarker</th>
            <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">Value</th>
            <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">Reference</th>
            <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {results.map((r) => {
            const flag = resultFlag(r);
            const refRange =
              r.reference_min !== null && r.reference_max !== null
                ? `${r.reference_min}–${r.reference_max}`
                : r.reference_min !== null
                ? `≥ ${r.reference_min}`
                : r.reference_max !== null
                ? `≤ ${r.reference_max}`
                : "—";

            return (
              <tr key={r.id}>
                <td className="py-2.5 pr-4">
                  <p className="font-medium text-slate-800">{r.biomarker_name}</p>
                  {r.notes && <p className="text-xs text-slate-400">{r.notes}</p>}
                </td>
                <td className="py-2.5 pr-4 text-right font-mono font-semibold text-slate-900">
                  {r.value}
                  {r.unit && <span className="ml-1 text-xs font-normal text-slate-400">{r.unit}</span>}
                </td>
                <td className="py-2.5 pr-4 text-right text-xs text-slate-500">
                  {refRange}
                  {r.unit && refRange !== "—" && (
                    <span className="ml-1 text-slate-400">{r.unit}</span>
                  )}
                </td>
                <td className="py-2.5 text-right">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${flagStyle[flag]}`}>
                    {flagIcon[flag]}
                    {flagLabel[flag]}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── lab order card ──────────────────────────────────────────────────────────

function LabOrderCard({ order }: { order: LabOrder }) {
  const [expanded, setExpanded] = useState(false);

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["lab-order", order.id],
    queryFn: () => labsApi.getOrderDetail(order.id),
    enabled: expanded && order.status === "completed",
  });

  const canExpand = order.status === "completed";

  return (
    <Card className={order.status === "completed" ? "" : "border-slate-200"}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50">
              <FlaskConical className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{order.lab_name}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Ordered {formatDate(order.ordered_at)}
                {order.completed_at && (
                  <span className="ml-2">· Completed {formatDate(order.completed_at)}</span>
                )}
              </p>
              {order.notes && (
                <p className="mt-1 text-xs text-slate-500 italic">{order.notes}</p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2">
            <StatusBadge status={order.status} />
            {canExpand && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors"
              >
                {expanded ? (
                  <>Hide results <ChevronUp className="h-3 w-3" /></>
                ) : (
                  <>View results <ChevronDown className="h-3 w-3" /></>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Expanded results */}
        {expanded && canExpand && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            {detailLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : (
              <ResultsTable results={(detail as LabOrderDetail)?.results ?? []} />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── skeleton ────────────────────────────────────────────────────────────────

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              <Skeleton className="h-6 w-28 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
      <FlaskConical className="h-10 w-10 text-slate-300 mb-3" />
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-1 text-xs text-slate-400">Lab orders are created by your provider</p>
    </div>
  );
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function LabsPage() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["labs", "orders"],
    queryFn: () => labsApi.getOrders({ limit: 50 }),
  });

  const pending = orders.filter((o) => o.status === "ordered" || o.status === "sample_collected");
  const completed = orders.filter((o) => o.status === "completed");
  const cancelled = orders.filter((o) => o.status === "cancelled");

  // Summary stats
  const stats = [
    { label: "Total Orders", value: orders.length, color: "text-slate-700", bg: "bg-slate-50" },
    { label: "Pending", value: pending.length, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Completed", value: completed.length, color: "text-green-600", bg: "bg-green-50" },
    { label: "Cancelled", value: cancelled.length, color: "text-slate-500", bg: "bg-slate-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Lab Results</h1>
        <p className="mt-1 text-sm text-slate-500">
          Your laboratory orders and biomarker results
        </p>
      </div>

      {/* Stats row */}
      {!isLoading && orders.length > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map(({ label, value, color, bg }) => (
            <div key={label} className={`rounded-xl p-4 ${bg}`}>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="mt-0.5 text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      )}

      <Tabs defaultValue={pending.length > 0 ? "pending" : "completed"}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending
            {!isLoading && pending.length > 0 && (
              <span className="ml-1.5 rounded-full bg-blue-100 px-1.5 py-px text-xs font-semibold text-blue-700">
                {pending.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed
            {!isLoading && completed.length > 0 && (
              <span className="ml-1.5 rounded-full bg-green-100 px-1.5 py-px text-xs font-semibold text-green-700">
                {completed.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {isLoading ? (
            <ListSkeleton />
          ) : pending.length === 0 ? (
            <EmptyState label="No pending lab orders" />
          ) : (
            <div className="space-y-3">
              {pending.map((o) => <LabOrderCard key={o.id} order={o} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          {isLoading ? (
            <ListSkeleton />
          ) : completed.length === 0 ? (
            <EmptyState label="No completed lab results yet" />
          ) : (
            <div className="space-y-3">
              {completed.map((o) => <LabOrderCard key={o.id} order={o} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          {isLoading ? (
            <ListSkeleton />
          ) : orders.length === 0 ? (
            <EmptyState label="No lab orders yet" />
          ) : (
            <div className="space-y-3">
              {[...orders]
                .sort((a, b) => new Date(b.ordered_at).getTime() - new Date(a.ordered_at).getTime())
                .map((o) => <LabOrderCard key={o.id} order={o} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
