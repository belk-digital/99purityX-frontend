"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Calendar,
  CalendarPlus,
  Clock,
  X,
  CheckCircle2,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BookAppointmentDialog } from "@/components/patient/BookAppointmentDialog";
import { appointmentsApi } from "@/lib/api/appointments";
import type { Appointment } from "@/types/appointment";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
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
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${styles[status]}`}
    >
      {icons[status]}
      {status}
    </span>
  );
}

function AppointmentCard({
  appointment,
  onCancel,
  cancelling,
}: {
  appointment: Appointment;
  onCancel: (id: string) => void;
  cancelling: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {formatDate(appointment.scheduled_start)}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {formatTime(appointment.scheduled_start)} — {formatTime(appointment.scheduled_end)}
              </p>
              {appointment.reason && (
                <p className="mt-1.5 text-sm text-slate-600">{appointment.reason}</p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2">
            <StatusBadge status={appointment.status} />
            {appointment.status === "scheduled" && (
              <button
                onClick={() => onCancel(appointment.id)}
                disabled={cancelling}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                <X className="h-3 w-3" />
                Cancel
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ label, onBook }: { label: string; onBook: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
      <Calendar className="h-10 w-10 text-slate-300 mb-3" />
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <Button onClick={onBook} size="sm" className="mt-4">
        <CalendarPlus className="h-4 w-4" />
        Book Appointment
      </Button>
    </div>
  );
}

function AppointmentListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function AppointmentsPage() {
  const [bookOpen, setBookOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["appointments", "me"],
    queryFn: appointmentsApi.getMe,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) =>
      appointmentsApi.update(id, { status: "cancelled" }),
    onMutate: (id) => setCancellingId(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments", "me"] });
      toast.success("Appointment cancelled");
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      toast.error(err?.response?.data?.detail ?? "Failed to cancel appointment");
    },
    onSettled: () => setCancellingId(null),
  });

  const upcoming = appointments
    .filter((a) => a.status === "scheduled")
    .sort(
      (a, b) =>
        new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime()
    );

  const past = appointments
    .filter((a) => a.status !== "scheduled")
    .sort(
      (a, b) =>
        new Date(b.scheduled_start).getTime() - new Date(a.scheduled_start).getTime()
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Appointments</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your scheduled and past appointments
          </p>
        </div>
        <Button onClick={() => setBookOpen(true)}>
          <CalendarPlus className="h-4 w-4" />
          Book Appointment
        </Button>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming
            {!isLoading && upcoming.length > 0 && (
              <span className="ml-1.5 rounded-full bg-blue-100 px-1.5 py-px text-xs font-semibold text-blue-700">
                {upcoming.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          {isLoading ? (
            <AppointmentListSkeleton />
          ) : upcoming.length === 0 ? (
            <EmptyState label="No upcoming appointments" onBook={() => setBookOpen(true)} />
          ) : (
            <div className="space-y-3">
              {upcoming.map((appt) => (
                <AppointmentCard
                  key={appt.id}
                  appointment={appt}
                  onCancel={(id) => cancelMutation.mutate(id)}
                  cancelling={cancellingId === appt.id}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {isLoading ? (
            <AppointmentListSkeleton />
          ) : past.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
              <CheckCircle2 className="h-10 w-10 text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-600">No past appointments yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {past.map((appt) => (
                <AppointmentCard
                  key={appt.id}
                  appointment={appt}
                  onCancel={(id) => cancelMutation.mutate(id)}
                  cancelling={cancellingId === appt.id}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <BookAppointmentDialog open={bookOpen} onOpenChange={setBookOpen} />
    </div>
  );
}
