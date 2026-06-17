"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart3, Users, Target, TrendingUp, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { appointmentsApi } from "@/lib/api/appointments";
import { consultationsApi } from "@/lib/api/consultations";

export default function ProviderAnalyticsPage() {
  const { data: appointments = [], isLoading: apptLoading } = useQuery({
    queryKey: ["appointments", "me"],
    queryFn: appointmentsApi.getMe,
  });

  const { data: consultations = [], isLoading: consLoading } = useQuery({
    queryKey: ["consultations", "me"],
    queryFn: () => consultationsApi.getMe({ limit: 100 }),
  });

  const isLoading = apptLoading || consLoading;

  const totalAppointments = appointments.length;
  const completedAppointments = appointments.filter((a) => a.status === "completed").length;
  const cancelledAppointments = appointments.filter((a) => a.status === "cancelled").length;
  const uniquePatients = new Set(appointments.map((a) => a.patient_id)).size;
  const completedConsultations = consultations.filter((c) => c.status === "completed").length;
  const followUpRequired = consultations.filter((c) => c.follow_up_required).length;
  const completionRate = totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0;
  const cancellationRate = totalAppointments > 0 ? Math.round((cancelledAppointments / totalAppointments) * 100) : 0;

  const stats = [
    { label: "Total Patients", value: uniquePatients, icon: Users, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Total Appointments", value: totalAppointments, icon: Activity, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Consultations Done", value: completedConsultations, icon: Target, color: "text-green-600", bg: "bg-green-50" },
    { label: "Follow-ups Needed", value: followUpRequired, icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">Your practice performance overview</p>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
                  {isLoading ? (
                    <Skeleton className="mt-1 h-8 w-12" />
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
        ))}
      </div>

      {/* Rates */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Appointment Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <div className="space-y-3">
                <div className="flex items-end justify-between">
                  <span className="text-4xl font-bold text-green-600">{completionRate}%</span>
                  <span className="text-sm text-slate-500">{completedAppointments} of {totalAppointments}</span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-100">
                  <div className="h-3 rounded-full bg-green-500 transition-all" style={{ width: `${completionRate}%` }} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Cancellation Rate</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <div className="space-y-3">
                <div className="flex items-end justify-between">
                  <span className={`text-4xl font-bold ${cancellationRate > 20 ? "text-red-600" : "text-slate-700"}`}>
                    {cancellationRate}%
                  </span>
                  <span className="text-sm text-slate-500">{cancelledAppointments} of {totalAppointments}</span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-100">
                  <div
                    className={`h-3 rounded-full transition-all ${cancellationRate > 20 ? "bg-red-500" : "bg-slate-400"}`}
                    style={{ width: `${cancellationRate}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Appointment Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="rounded-xl bg-blue-50 p-4">
                <p className="text-2xl font-bold text-blue-700">
                  {appointments.filter((a) => a.status === "scheduled").length}
                </p>
                <p className="text-xs text-slate-500">Scheduled</p>
              </div>
              <div className="rounded-xl bg-green-50 p-4">
                <p className="text-2xl font-bold text-green-700">{completedAppointments}</p>
                <p className="text-xs text-slate-500">Completed</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-2xl font-bold text-slate-600">{cancelledAppointments}</p>
                <p className="text-xs text-slate-500">Cancelled</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
