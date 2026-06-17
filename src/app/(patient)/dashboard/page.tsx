"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { appointmentsApi } from "@/lib/api/appointments";
import { goalsApi } from "@/lib/api/goals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import {
  Calendar,
  Target,
  FlaskConical,
  Video,
  ArrowRight,
  Clock,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import type { Appointment } from "@/types/appointment";
import type { HealthGoal } from "@/types/goal";

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusBadge(status: Appointment["status"]) {
  const map = {
    scheduled: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-slate-100 text-slate-500",
  };
  return map[status] ?? map.scheduled;
}

function goalProgress(goal: HealthGoal) {
  const start = goal.start_value ?? 0;
  const current = goal.current_value ?? goal.start_value ?? 0;
  const target = goal.target_value ?? 0;
  if (target === start) return 0;
  return Math.min(100, Math.round(((current - start) / (target - start)) * 100));
}

function categoryLabel(cat: HealthGoal["category"]) {
  return cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: appointments, isLoading: apptLoading } = useQuery({
    queryKey: ["appointments", "me"],
    queryFn: () => appointmentsApi.getMe(),
  });

  const { data: goals, isLoading: goalsLoading } = useQuery({
    queryKey: ["goals"],
    queryFn: () => goalsApi.getAll({ limit: 10 }),
  });

  const upcomingAppointments = (appointments ?? [])
    .filter((a) => a.status === "scheduled")
    .sort((a, b) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime())
    .slice(0, 3);

  const activeGoals = (goals ?? []).filter((g) => g.status === "active").slice(0, 4);

  const stats = [
    {
      label: "Upcoming",
      value: upcomingAppointments.length,
      icon: Calendar,
      sub: "appointments",
      href: "/appointments",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Active",
      value: activeGoals.length,
      icon: Target,
      sub: "health goals",
      href: "/goals",
      color: "text-teal-600",
      bg: "bg-teal-50",
    },
    {
      label: "Total",
      value: (appointments ?? []).filter((a) => a.status === "completed").length,
      icon: Video,
      sub: "consultations done",
      href: "/consultations",
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      label: "Pending",
      value: 0,
      icon: FlaskConical,
      sub: "lab results",
      href: "/labs",
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  const displayName = user?.email?.split("@")[0] ?? "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {greeting}, {displayName}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, sub, href, color, bg }) => (
          <Link key={href} href={href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
                    {apptLoading || goalsLoading ? (
                      <Skeleton className="mt-1 h-8 w-10" />
                    ) : (
                      <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
                    )}
                    <p className="mt-0.5 text-xs text-slate-500">{sub}</p>
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Upcoming Appointments</CardTitle>
            <Link
              href="/appointments"
              className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {apptLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))
            ) : upcomingAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-sm text-slate-500">No upcoming appointments</p>
                <Link
                  href="/appointments"
                  className="mt-2 text-xs text-teal-600 hover:underline font-medium"
                >
                  Book one now
                </Link>
              </div>
            ) : (
              upcomingAppointments.map((appt) => (
                <div key={appt.id} className="flex items-start gap-3 rounded-lg border border-slate-100 p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {appt.reason ?? "Medical consultation"}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{formatDateTime(appt.scheduled_start)}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(appt.status)}`}>
                    {appt.status}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Active health goals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Active Health Goals</CardTitle>
            <Link
              href="/goals"
              className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {goalsLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))
            ) : activeGoals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Target className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-sm text-slate-500">No active goals yet</p>
                <p className="text-xs text-slate-400 mt-1">Goals are set by your provider</p>
              </div>
            ) : (
              activeGoals.map((goal) => {
                const pct = goalProgress(goal);
                return (
                  <div key={goal.id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <TrendingUp className="h-3.5 w-3.5 shrink-0 text-teal-500" />
                        <span className="text-sm font-medium text-slate-800 truncate">{goal.title}</span>
                      </div>
                      <span className="shrink-0 text-xs font-semibold text-teal-600">{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">{categoryLabel(goal.category)}</span>
                      {goal.target_date && (
                        <span className="text-xs text-slate-400">
                          Target: {new Date(goal.target_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Book Appointment", href: "/appointments", icon: Calendar, color: "text-blue-600", bg: "bg-blue-50 hover:bg-blue-100" },
              { label: "View Lab Results", href: "/labs", icon: FlaskConical, color: "text-amber-600", bg: "bg-amber-50 hover:bg-amber-100" },
              { label: "My Documents", href: "/documents", icon: CheckCircle2, color: "text-violet-600", bg: "bg-violet-50 hover:bg-violet-100" },
              { label: "Optimization", href: "/optimization", icon: TrendingUp, color: "text-teal-600", bg: "bg-teal-50 hover:bg-teal-100" },
            ].map(({ label, href, icon: Icon, color, bg }) => (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-2 rounded-xl p-4 text-center transition-colors ${bg}`}
              >
                <Icon className={`h-6 w-6 ${color}`} />
                <span className="text-xs font-medium text-slate-700">{label}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
