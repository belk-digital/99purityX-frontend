"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { appointmentsApi } from "@/lib/api/appointments";
import { providersApi } from "@/lib/api/providers";

interface BookAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const emptyForm = {
  provider_id: "",
  date: "",
  start_time: "",
  end_time: "",
  reason: "",
};

export function BookAppointmentDialog({ open, onOpenChange }: BookAppointmentDialogProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);

  const { data: providers = [], isLoading: providersLoading } = useQuery({
    queryKey: ["providers"],
    queryFn: providersApi.getAll,
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: appointmentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments", "me"] });
      toast.success("Appointment booked successfully!");
      setForm(emptyForm);
      onOpenChange(false);
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      toast.error(err?.response?.data?.detail ?? "Failed to book appointment");
    },
  });

  function handleChange(field: keyof typeof emptyForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.provider_id || !form.date || !form.start_time || !form.end_time) {
      toast.error("Please fill in all required fields");
      return;
    }

    const start = new Date(`${form.date}T${form.start_time}`);
    const end = new Date(`${form.date}T${form.end_time}`);

    if (end <= start) {
      toast.error("End time must be after start time");
      return;
    }

    mutation.mutate({
      provider_id: form.provider_id,
      scheduled_start: start.toISOString(),
      scheduled_end: end.toISOString(),
      reason: form.reason || undefined,
    });
  }

  function providerLabel(p: { provider_type: string; speciality: string | null }) {
    return p.speciality ? `${p.provider_type} — ${p.speciality}` : p.provider_type;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Book Appointment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Provider */}
          <div className="space-y-1.5">
            <Label htmlFor="provider">Provider *</Label>
            {providersLoading ? (
              <div className="flex h-9 items-center gap-2 rounded-lg border border-input px-3 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading providers...
              </div>
            ) : providers.length === 0 ? (
              <div className="flex h-9 items-center rounded-lg border border-input px-3 text-sm text-muted-foreground">
                No providers available
              </div>
            ) : (
              <select
                id="provider"
                value={form.provider_id}
                onChange={(e) => handleChange("provider_id", e.target.value)}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="">Select a provider...</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {providerLabel(p)}
                    {p.consultation_fee ? ` ($${p.consultation_fee})` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={form.date}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => handleChange("date", e.target.value)}
              required
            />
          </div>

          {/* Start / End time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="start_time">Start time *</Label>
              <Input
                id="start_time"
                type="time"
                value={form.start_time}
                onChange={(e) => handleChange("start_time", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end_time">End time *</Label>
              <Input
                id="end_time"
                type="time"
                value={form.end_time}
                onChange={(e) => handleChange("end_time", e.target.value)}
                required
              />
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <Label htmlFor="reason">Reason for visit</Label>
            <textarea
              id="reason"
              value={form.reason}
              onChange={(e) => handleChange("reason", e.target.value)}
              placeholder="Briefly describe the reason for your visit..."
              rows={3}
              className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none resize-none placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <DialogFooter showCloseButton>
            <Button
              type="submit"
              disabled={mutation.isPending || providersLoading || providers.length === 0}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Booking...
                </>
              ) : (
                <>
                  <CalendarPlus className="h-4 w-4" />
                  Book Appointment
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
