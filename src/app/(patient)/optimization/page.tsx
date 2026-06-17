"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Zap,
  Repeat,
  Pill,
  CheckCircle2,
  Circle,
  Pause,
  Ban,
  Calendar,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { programsApi, habitsApi, peptidesApi } from "@/lib/api/optimization";
import type {
  OptimizationProgram,
  HabitProtocol,
  PeptideProtocol,
} from "@/types/optimization";

// ─── helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function capitalize(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── status badges ───────────────────────────────────────────────────────────

function ProgramStatusBadge({ status }: { status: OptimizationProgram["status"] }) {
  const map: Record<string, { cls: string; label: string }> = {
    draft: { cls: "bg-slate-100 text-slate-500 border-slate-200", label: "Draft" },
    active: { cls: "bg-teal-100 text-teal-700 border-teal-200", label: "Active" },
    paused: { cls: "bg-amber-100 text-amber-700 border-amber-200", label: "Paused" },
    completed: { cls: "bg-green-100 text-green-700 border-green-200", label: "Completed" },
    cancelled: { cls: "bg-slate-100 text-slate-500 border-slate-200", label: "Cancelled" },
  };
  const { cls, label } = map[status] ?? map.draft;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

// ─── program card ────────────────────────────────────────────────────────────

function ProgramCard({ program }: { program: OptimizationProgram }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className={program.status === "active" ? "border-teal-200" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50">
              <Zap className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{program.name}</p>
              {program.goal && (
                <p className="mt-0.5 text-xs text-slate-500">{program.goal}</p>
              )}
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                {program.start_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(program.start_date)}
                    {program.end_date && ` — ${formatDate(program.end_date)}`}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <ProgramStatusBadge status={program.status} />
            {program.notes && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                {expanded ? <>Less <ChevronUp className="h-3 w-3" /></> : <>Notes <ChevronDown className="h-3 w-3" /></>}
              </button>
            )}
          </div>
        </div>
        {expanded && program.notes && (
          <div className="mt-3 border-t border-slate-100 pt-3">
            <p className="text-sm text-slate-600">{program.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── habit card ──────────────────────────────────────────────────────────────

function HabitCard({ habit }: { habit: HabitProtocol }) {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split("T")[0];
  const [logging, setLogging] = useState(false);

  const logMutation = useMutation({
    mutationFn: habitsApi.createLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habit-logs"] });
      toast.success(`"${habit.title}" logged for today!`);
      setLogging(false);
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      toast.error(err?.response?.data?.detail ?? "Failed to log habit");
    },
  });

  const isActive = habit.status === "active";

  return (
    <Card className={isActive ? "border-indigo-200" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
              <Repeat className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{habit.title}</p>
              {habit.description && (
                <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{habit.description}</p>
              )}
              <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-400">
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-600 font-medium">
                  {capitalize(habit.frequency)}
                </span>
                {habit.target_value && (
                  <span>
                    Target: {habit.target_value}{habit.target_unit ? ` ${habit.target_unit}` : ""}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
              isActive ? "bg-indigo-100 text-indigo-700 border-indigo-200" : "bg-slate-100 text-slate-500 border-slate-200"
            }`}>
              {isActive ? <Circle className="h-3 w-3 fill-current" /> : habit.status === "completed" ? <CheckCircle2 className="h-3 w-3" /> : habit.status === "paused" ? <Pause className="h-3 w-3" /> : <Ban className="h-3 w-3" />}
              {capitalize(habit.status)}
            </span>
            {isActive && (
              <Button
                size="sm"
                disabled={logMutation.isPending}
                onClick={() => {
                  if (logging) {
                    logMutation.mutate({
                      habit_protocol_id: habit.id,
                      date: today,
                      completed: true,
                    });
                  } else {
                    setLogging(true);
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {logMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : logging ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Circle className="h-3.5 w-3.5" />
                )}
                {logging ? "Confirm" : "Log Today"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── peptide card ────────────────────────────────────────────────────────────

function PeptideCard({ peptide }: { peptide: PeptideProtocol }) {
  const isActive = peptide.status === "active";

  return (
    <Card className={isActive ? "border-rose-200" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-50">
              <Pill className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{peptide.peptide_name}</p>
              {peptide.purpose && (
                <p className="mt-0.5 text-xs text-slate-500">{peptide.purpose}</p>
              )}
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-rose-50 px-2 py-0.5 text-rose-600 font-medium">
                  {peptide.dosage}
                </span>
                <span className="text-slate-400">{peptide.frequency}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                  {capitalize(peptide.route)}
                </span>
              </div>
              {peptide.start_date && (
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                  <Calendar className="h-3 w-3" />
                  {formatDate(peptide.start_date)}
                  {peptide.end_date && ` — ${formatDate(peptide.end_date)}`}
                </p>
              )}
            </div>
          </div>
          <span className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
            isActive ? "bg-rose-100 text-rose-700 border-rose-200"
            : peptide.status === "completed" ? "bg-green-100 text-green-700 border-green-200"
            : "bg-slate-100 text-slate-500 border-slate-200"
          }`}>
            {capitalize(peptide.status)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── skeletons / empty ───────────────────────────────────────────────────────

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
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
      <Icon className="h-10 w-10 text-slate-300 mb-3" />
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-1 text-xs text-slate-400">Programs are prescribed by your provider</p>
    </div>
  );
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function OptimizationPage() {
  const { data: programs = [], isLoading: programsLoading } = useQuery({
    queryKey: ["optimization", "programs"],
    queryFn: () => programsApi.getAll({ limit: 50 }),
  });

  const { data: habits = [], isLoading: habitsLoading } = useQuery({
    queryKey: ["optimization", "habits"],
    queryFn: () => habitsApi.getAll({ limit: 50 }),
  });

  const { data: peptides = [], isLoading: peptidesLoading } = useQuery({
    queryKey: ["optimization", "peptides"],
    queryFn: () => peptidesApi.getAll({ limit: 50 }),
  });

  const activePrograms = programs.filter((p) => p.status === "active");
  const activeHabits = habits.filter((h) => h.status === "active");
  const activePeptides = peptides.filter((p) => p.status === "active");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Optimization</h1>
        <p className="mt-1 text-sm text-slate-500">
          Your optimization programs, habits, and peptide protocols
        </p>
      </div>

      {/* Summary stats */}
      {!programsLoading && !habitsLoading && !peptidesLoading && (programs.length > 0 || habits.length > 0 || peptides.length > 0) && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-teal-50 p-4">
            <p className="text-2xl font-bold text-teal-700">{activePrograms.length}</p>
            <p className="mt-0.5 text-xs text-slate-500">Active Programs</p>
          </div>
          <div className="rounded-xl bg-indigo-50 p-4">
            <p className="text-2xl font-bold text-indigo-700">{activeHabits.length}</p>
            <p className="mt-0.5 text-xs text-slate-500">Active Habits</p>
          </div>
          <div className="rounded-xl bg-rose-50 p-4">
            <p className="text-2xl font-bold text-rose-700">{activePeptides.length}</p>
            <p className="mt-0.5 text-xs text-slate-500">Active Peptides</p>
          </div>
        </div>
      )}

      <Tabs defaultValue="programs">
        <TabsList>
          <TabsTrigger value="programs">
            Programs
            {!programsLoading && activePrograms.length > 0 && (
              <span className="ml-1.5 rounded-full bg-teal-100 px-1.5 py-px text-xs font-semibold text-teal-700">
                {activePrograms.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="habits">
            Habits
            {!habitsLoading && activeHabits.length > 0 && (
              <span className="ml-1.5 rounded-full bg-indigo-100 px-1.5 py-px text-xs font-semibold text-indigo-700">
                {activeHabits.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="peptides">
            Peptides
            {!peptidesLoading && activePeptides.length > 0 && (
              <span className="ml-1.5 rounded-full bg-rose-100 px-1.5 py-px text-xs font-semibold text-rose-700">
                {activePeptides.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Programs */}
        <TabsContent value="programs" className="mt-4">
          {programsLoading ? (
            <ListSkeleton />
          ) : programs.length === 0 ? (
            <EmptyState icon={Zap} label="No optimization programs yet" />
          ) : (
            <div className="space-y-3">
              {programs
                .sort((a, b) => (a.status === "active" ? -1 : 1))
                .map((p) => <ProgramCard key={p.id} program={p} />)}
            </div>
          )}
        </TabsContent>

        {/* Habits */}
        <TabsContent value="habits" className="mt-4">
          {habitsLoading ? (
            <ListSkeleton />
          ) : habits.length === 0 ? (
            <EmptyState icon={Repeat} label="No habit protocols yet" />
          ) : (
            <div className="space-y-3">
              {habits
                .sort((a, b) => (a.status === "active" ? -1 : 1))
                .map((h) => <HabitCard key={h.id} habit={h} />)}
            </div>
          )}
        </TabsContent>

        {/* Peptides */}
        <TabsContent value="peptides" className="mt-4">
          {peptidesLoading ? (
            <ListSkeleton />
          ) : peptides.length === 0 ? (
            <EmptyState icon={Pill} label="No peptide protocols yet" />
          ) : (
            <div className="space-y-3">
              {peptides
                .sort((a, b) => (a.status === "active" ? -1 : 1))
                .map((p) => <PeptideCard key={p.id} peptide={p} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
