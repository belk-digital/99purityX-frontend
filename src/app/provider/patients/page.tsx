"use client";

import { useQuery } from "@tanstack/react-query";
import { Users, Calendar, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { appointmentsApi } from "@/lib/api/appointments";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface PatientSummary {
  patient_id: string;
  total_appointments: number;
  completed: number;
  upcoming: number;
  last_seen: string | null;
  next_appointment: string | null;
}

export default function ProviderPatientsPage() {
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["appointments", "me"],
    queryFn: appointmentsApi.getMe,
  });

  // Derive patient list from appointments
  const patientsMap = new Map<string, PatientSummary>();
  appointments.forEach((a) => {
    const existing = patientsMap.get(a.patient_id);
    if (!existing) {
      patientsMap.set(a.patient_id, {
        patient_id: a.patient_id,
        total_appointments: 1,
        completed: a.status === "completed" ? 1 : 0,
        upcoming: a.status === "scheduled" ? 1 : 0,
        last_seen: a.status === "completed" ? a.scheduled_start : null,
        next_appointment: a.status === "scheduled" ? a.scheduled_start : null,
      });
    } else {
      existing.total_appointments++;
      if (a.status === "completed") {
        existing.completed++;
        if (!existing.last_seen || a.scheduled_start > existing.last_seen) {
          existing.last_seen = a.scheduled_start;
        }
      }
      if (a.status === "scheduled") {
        existing.upcoming++;
        if (!existing.next_appointment || a.scheduled_start < existing.next_appointment) {
          existing.next_appointment = a.scheduled_start;
        }
      }
    }
  });

  const patients = Array.from(patientsMap.values()).sort((a, b) => {
    if (a.upcoming !== b.upcoming) return b.upcoming - a.upcoming;
    return b.total_appointments - a.total_appointments;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Patients</h1>
        <p className="mt-1 text-sm text-slate-500">
          {isLoading ? "Loading..." : `${patients.length} patients from your appointments`}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-3 w-1/4" /></div>
            </div></CardContent></Card>
          ))}
        </div>
      ) : patients.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
          <Users className="h-10 w-10 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-600">No patients yet</p>
          <p className="mt-1 text-xs text-slate-400">Patients will appear here once they book appointments with you</p>
        </div>
      ) : (
        <div className="space-y-3">
          {patients.map((p) => (
            <Card key={p.patient_id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-600">
                      {p.patient_id.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Patient {p.patient_id.slice(0, 8)}...</p>
                      <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {p.total_appointments} appointments
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          {p.completed} completed
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    {p.upcoming > 0 && (
                      <span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                        {p.upcoming} upcoming
                      </span>
                    )}
                    {p.last_seen && (
                      <p className="mt-1 text-xs text-slate-400">Last seen {formatDate(p.last_seen)}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
