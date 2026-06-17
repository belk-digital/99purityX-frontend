"use client";

import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, CheckCircle2, Ban } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { appointmentsApi } from "@/lib/api/appointments";
import type { Appointment } from "@/types/appointment";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function StatusBadge({ status }: { status: Appointment["status"] }) {
  const styles = {
    scheduled: "bg-blue-100 text-blue-700 border-blue-200",
    completed: "bg-green-100 text-green-700 border-green-200",
    cancelled: "bg-slate-100 text-slate-500 border-slate-200",
  };
  const icons = {
    scheduled: <Clock className="h-3 w-3" />,
    completed: <CheckCircle2 className="h-3 w-3" />,
    cancelled: <Ban className="h-3 w-3" />,
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${styles[status]}`}>
      {icons[status]}
      {status}
    </span>
  );
}

function AppointmentCard({ appt }: { appt: Appointment }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{formatDate(appt.scheduled_start)}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {formatTime(appt.scheduled_start)} — {formatTime(appt.scheduled_end)}
              </p>
              {appt.reason && <p className="mt-1.5 text-sm text-slate-600">{appt.reason}</p>}
              <p className="mt-1 text-xs text-slate-400">Patient: {appt.patient_id.slice(0, 8)}...</p>
            </div>
          </div>
          <StatusBadge status={appt.status} />
        </div>
      </CardContent>
    </Card>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}><CardContent className="p-4"><div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-3 w-1/3" /></div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div></CardContent></Card>
      ))}
    </div>
  );
}

export default function ProviderAppointmentsPage() {
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["appointments", "me"],
    queryFn: appointmentsApi.getMe,
  });

  const upcoming = appointments.filter((a) => a.status === "scheduled")
    .sort((a, b) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime());
  const past = appointments.filter((a) => a.status !== "scheduled")
    .sort((a, b) => new Date(b.scheduled_start).getTime() - new Date(a.scheduled_start).getTime());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Appointments</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your patient appointments</p>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming
            {!isLoading && upcoming.length > 0 && (
              <span className="ml-1.5 rounded-full bg-blue-100 px-1.5 py-px text-xs font-semibold text-blue-700">{upcoming.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          {isLoading ? <ListSkeleton /> : upcoming.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
              <Calendar className="h-10 w-10 text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-600">No upcoming appointments</p>
            </div>
          ) : (
            <div className="space-y-3">{upcoming.map((a) => <AppointmentCard key={a.id} appt={a} />)}</div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {isLoading ? <ListSkeleton /> : past.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
              <CheckCircle2 className="h-10 w-10 text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-600">No past appointments</p>
            </div>
          ) : (
            <div className="space-y-3">{past.map((a) => <AppointmentCard key={a.id} appt={a} />)}</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
