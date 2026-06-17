"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Target,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Pause,
  Ban,
  Calendar,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LogProgressDialog } from "@/components/patient/LogProgressDialog";
import { goalsApi } from "@/lib/api/goals";
import type { HealthGoal, HealthGoalDetail, GoalProgress as GoalProgressType } from "@/types/goal";

// ─── helpers ────────────────────────────────────────────────────────────────

function categoryLabel(cat: HealthGoal["category"]) {
  return cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function goalPercent(g: HealthGoal) {
  const start = g.start_value ?? 0;
  const current = g.current_value ?? start;
  const target = g.target_value ?? 0;
  if (target === start) return 0;
  return Math.min(100, Math.max(0, Math.round(((current - start) / (target - start)) * 100)));
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const categoryColors: Record<string, string> = {
  weight_loss: "bg-orange-100 text-orange-700",
  muscle_gain: "bg-red-100 text-red-700",
  metabolic_health: "bg-emerald-100 text-emerald-700",
  hormone_health: "bg-pink-100 text-pink-700",
  sleep: "bg-indigo-100 text-indigo-700",
  recovery: "bg-sky-100 text-sky-700",
  cardiovascular: "bg-rose-100 text-rose-700",
  longevity: "bg-teal-100 text-teal-700",
  biomarker: "bg-violet-100 text-violet-700",
  custom: "bg-slate-100 text-slate-600",
};

// ─── status badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: HealthGoal["status"] }) {
  const map = {
    active: { cls: "bg-teal-100 text-teal-700 border-teal-200", icon: <Target className="h-3 w-3" />, label: "Active" },
    achieved: { cls: "bg-green-100 text-green-700 border-green-200", icon: <CheckCircle2 className="h-3 w-3" />, label: "Achieved" },
    paused: { cls: "bg-amber-100 text-amber-700 border-amber-200", icon: <Pause className="h-3 w-3" />, label: "Paused" },
    cancelled: { cls: "bg-slate-100 text-slate-500 border-slate-200", icon: <Ban className="h-3 w-3" />, label: "Cancelled" },
  };
  const { cls, icon, label } = map[status] ?? map.active;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {icon}
      {label}
    </span>
  );
}

// ─── progress history ────────────────────────────────────────────────────────

function ProgressTimeline({ records }: { records: GoalProgressType[] }) {
  const sorted = [...records].sort(
    (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
  );

  if (sorted.length === 0) {
    return <p className="text-sm text-slate-400 italic">No progress entries yet.</p>;
  }

  return (
    <div className="space-y-2">
      {sorted.map((entry, i) => (
        <div key={entry.id} className="flex items-start gap-3">
          <div className="relative flex flex-col items-center">
            <div className="h-2 w-2 rounded-full bg-teal-500 ring-2 ring-teal-100" />
            {i < sorted.length - 1 && (
              <div className="mt-0.5 h-full w-px bg-slate-200" />
            )}
          </div>
          <div className="flex-1 pb-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800">{entry.value}</span>
              <span className="text-xs text-slate-400">{formatShortDate(entry.recorded_at)}</span>
            </div>
            {entry.notes && (
              <p className="mt-0.5 text-xs text-slate-500">{entry.notes}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── goal card ───────────────────────────────────────────────────────────────

function GoalCard({
  goal,
  onLogProgress,
}: {
  goal: HealthGoal;
  onLogProgress: (goal: HealthGoal) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const pct = goalPercent(goal);
  const isActive = goal.status === "active";

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["goal", goal.id],
    queryFn: () => goalsApi.getById(goal.id),
    enabled: expanded,
  });

  return (
    <Card className={isActive ? "border-teal-200 shadow-sm shadow-teal-50" : ""}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-slate-900">{goal.title}</h3>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${categoryColors[goal.category] ?? categoryColors.custom}`}>
                {categoryLabel(goal.category)}
              </span>
            </div>
            {goal.description && (
              <p className="mt-1 text-xs text-slate-500 line-clamp-2">{goal.description}</p>
            )}
          </div>
          <StatusBadge status={goal.status} />
        </div>

        {/* Progress bar */}
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">
              {goal.current_value ?? goal.start_value ?? 0}
              {goal.unit && ` ${goal.unit}`}
            </span>
            <span className="font-semibold text-teal-600">{pct}%</span>
            <span className="text-slate-500">
              {goal.target_value ?? "—"}
              {goal.unit && ` ${goal.unit}`}
            </span>
          </div>
          <Progress value={pct} className="h-2" />
        </div>

        {/* Meta row */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {goal.target_date && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Calendar className="h-3 w-3" />
                Target: {formatShortDate(goal.target_date)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isActive && (
              <Button
                size="sm"
                onClick={() => onLogProgress(goal)}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                <Plus className="h-3.5 w-3.5" />
                Log Progress
              </Button>
            )}
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              {expanded ? (
                <>History <ChevronUp className="h-3 w-3" /></>
              ) : (
                <>History <ChevronDown className="h-3 w-3" /></>
              )}
            </button>
          </div>
        </div>

        {/* Expanded progress history */}
        {expanded && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            {detailLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-2 w-2 rounded-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <ProgressTimeline records={(detail as HealthGoalDetail)?.progress_records ?? []} />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── skeleton / empty ────────────────────────────────────────────────────────

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-1/4" />
              <Skeleton className="h-3 w-1/6" />
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
      <Target className="h-10 w-10 text-slate-300 mb-3" />
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-1 text-xs text-slate-400">Goals are set by your provider during consultations</p>
    </div>
  );
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function GoalsPage() {
  const [logGoal, setLogGoal] = useState<HealthGoal | null>(null);

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["goals"],
    queryFn: () => goalsApi.getAll({ limit: 50 }),
  });

  const active = goals.filter((g) => g.status === "active");
  const achieved = goals.filter((g) => g.status === "achieved");
  const other = goals.filter((g) => g.status === "paused" || g.status === "cancelled");

  // Summary
  const avgProgress = active.length > 0
    ? Math.round(active.reduce((sum, g) => sum + goalPercent(g), 0) / active.length)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Health Goals</h1>
        <p className="mt-1 text-sm text-slate-500">
          Track your health goals and log progress
        </p>
      </div>

      {/* Summary stats */}
      {!isLoading && goals.length > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-xl bg-teal-50 p-4">
            <p className="text-2xl font-bold text-teal-700">{active.length}</p>
            <p className="mt-0.5 text-xs text-slate-500">Active Goals</p>
          </div>
          <div className="rounded-xl bg-green-50 p-4">
            <p className="text-2xl font-bold text-green-700">{achieved.length}</p>
            <p className="mt-0.5 text-xs text-slate-500">Achieved</p>
          </div>
          <div className="rounded-xl bg-violet-50 p-4">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-5 w-5 text-violet-600" />
              <p className="text-2xl font-bold text-violet-700">{avgProgress}%</p>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">Avg. Progress</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-2xl font-bold text-slate-700">{goals.length}</p>
            <p className="mt-0.5 text-xs text-slate-500">Total Goals</p>
          </div>
        </div>
      )}

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            Active
            {!isLoading && active.length > 0 && (
              <span className="ml-1.5 rounded-full bg-teal-100 px-1.5 py-px text-xs font-semibold text-teal-700">
                {active.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="achieved">
            Achieved
            {!isLoading && achieved.length > 0 && (
              <span className="ml-1.5 rounded-full bg-green-100 px-1.5 py-px text-xs font-semibold text-green-700">
                {achieved.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="other">Other</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          {isLoading ? (
            <ListSkeleton />
          ) : active.length === 0 ? (
            <EmptyState label="No active health goals" />
          ) : (
            <div className="space-y-3">
              {active.map((g) => (
                <GoalCard key={g.id} goal={g} onLogProgress={setLogGoal} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="achieved" className="mt-4">
          {isLoading ? (
            <ListSkeleton />
          ) : achieved.length === 0 ? (
            <EmptyState label="No goals achieved yet — keep going!" />
          ) : (
            <div className="space-y-3">
              {achieved.map((g) => (
                <GoalCard key={g.id} goal={g} onLogProgress={setLogGoal} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="other" className="mt-4">
          {isLoading ? (
            <ListSkeleton />
          ) : other.length === 0 ? (
            <EmptyState label="No paused or cancelled goals" />
          ) : (
            <div className="space-y-3">
              {other.map((g) => (
                <GoalCard key={g.id} goal={g} onLogProgress={setLogGoal} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Log progress dialog */}
      {logGoal && (
        <LogProgressDialog
          open={!!logGoal}
          onOpenChange={(open) => { if (!open) setLogGoal(null); }}
          goal={logGoal}
        />
      )}
    </div>
  );
}
