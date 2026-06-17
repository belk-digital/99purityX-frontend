"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { appointmentsApi } from "@/lib/api/appointments";
import { consultationsApi } from "@/lib/api/consultations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  Calendar,
  Users,
  Video,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";
import type { Appointment } from "@/types/appointment";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ProviderDashboardPage() {
  const { user } = useAuth();

  const { data: appointments = [], isLoading: apptLoading } = useQuery({
    queryKey: ["appointments", "me"],
    queryFn: appointmentsApi.getMe,
  });

  const { data: consultations = [], isLoading: consLoading } = useQuery({
    queryKey: ["consultations", "me"],
    queryFn: () => consultationsApi.getMe({ limit: 50 }),
  });

  const upcoming = appointments
    .filter((a) => a.status === "scheduled")
    .sort((a, b) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime())
    .slice(0, 5);

  const uniquePatients = new Set(appointments.map((a) => a.patient_id));
  const completedConsults = consultations.filter((c) => c.status === "completed");
  const activeConsults = consultations.filter((c) => c.status === "in_progress");

  const displayName = user?.email?.split("@")[0] ?? "Doctor";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const stats = [
    { label: "Upcoming", value: upcoming.length, sub: "appointments", icon: Calendar, color: "text-blue-600", bg: "bg-blue-50", href: "/provider/appointments" },
    { label: "Total", value: uniquePatients.size, sub: "patients", icon: Users, color: "text-violet-600", bg: "bg-violet-50", href: "/provider/patients" },
    { label: "Active", value: activeConsults.length, sub: "consultations", icon: Video, color: "text-amber-600", bg: "bg-amber-50", href: "/provider/consultations" },
    { label: "Completed", value: completedConsults.length, sub: "consultations", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50", href: "/provider/consultations" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{greeting}, Dr. {displayName}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, sub, icon: Icon, color, bg, href }) => (
          <Link key={href} href={href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
                    {apptLoading || consLoading ? (
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

      {/* Upcoming appointments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">Today&apos;s Appointments</CardTitle>
          <Link href="/provider/appointments" className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-medium">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {apptLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="space-y-1.5 flex-1"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
              </div>
            ))
          ) : upcoming.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar className="h-8 w-8 text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">No upcoming appointments</p>
            </div>
          ) : (
            upcoming.map((appt) => (
              <div key={appt.id} className="flex items-start gap-3 rounded-lg border border-slate-100 p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {appt.reason ?? "Patient consultation"}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{formatDateTime(appt.scheduled_start)}</p>
                </div>
                <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                  {appt.status}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
