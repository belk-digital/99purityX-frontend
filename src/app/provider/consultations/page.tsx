"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Video, Clock, CheckCircle2, Ban, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { consultationsApi } from "@/lib/api/consultations";
import type { Consultation, ConsultationStatus } from "@/types/consultation";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function StatusBadge({ status }: { status: ConsultationStatus }) {
  const map = {
    in_progress: { cls: "bg-amber-100 text-amber-700 border-amber-200", icon: <Clock className="h-3 w-3" />, label: "In Progress" },
    completed: { cls: "bg-green-100 text-green-700 border-green-200", icon: <CheckCircle2 className="h-3 w-3" />, label: "Completed" },
    cancelled: { cls: "bg-slate-100 text-slate-500 border-slate-200", icon: <Ban className="h-3 w-3" />, label: "Cancelled" },
  };
  const { cls, icon, label } = map[status] ?? map.completed;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {icon}{label}
    </span>
  );
}

function ConsultationCard({ consultation }: { consultation: Consultation }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(consultation.provider_notes ?? "");
  const [summary, setSummary] = useState(consultation.summary ?? "");

  const updateMutation = useMutation({
    mutationFn: (data: { status?: ConsultationStatus; provider_notes?: string; summary?: string; ended_at?: string }) =>
      consultationsApi.update(consultation.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultations", "me"] });
      toast.success("Consultation updated");
    },
    onError: () => toast.error("Failed to update"),
  });

  const isActive = consultation.status === "in_progress";

  return (
    <Card className={isActive ? "border-amber-200" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50">
              <Video className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {consultation.started_at ? formatDate(consultation.started_at) : "—"}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {consultation.started_at ? formatTime(consultation.started_at) : ""}
              </p>
              {consultation.chief_complaint && (
                <p className="mt-1 text-xs text-slate-500">Complaint: {consultation.chief_complaint}</p>
              )}
              <p className="mt-1 text-xs text-slate-400">Patient: {consultation.patient_id.slice(0, 8)}...</p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <StatusBadge status={consultation.status} />
            {isActive && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateMutation.mutate({
                  status: "completed",
                  ended_at: new Date().toISOString(),
                  provider_notes: notes || undefined,
                  summary: summary || undefined,
                })}
                disabled={updateMutation.isPending}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Complete
              </Button>
            )}
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              {expanded ? <>Less <ChevronUp className="h-3 w-3" /></> : <>Notes <ChevronDown className="h-3 w-3" /></>}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Provider Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none resize-none placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/50"
                placeholder="Write clinical notes..."
                readOnly={!isActive}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Summary</label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={2}
                className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none resize-none placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/50"
                placeholder="Brief summary for the patient..."
                readOnly={!isActive}
              />
            </div>
            {isActive && (
              <Button
                size="sm"
                onClick={() => updateMutation.mutate({ provider_notes: notes, summary })}
                disabled={updateMutation.isPending}
              >
                Save Notes
              </Button>
            )}
          </div>
        )}
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
          <Skeleton className="h-6 w-24 rounded-full" />
        </div></CardContent></Card>
      ))}
    </div>
  );
}

export default function ProviderConsultationsPage() {
  const { data: consultations = [], isLoading } = useQuery({
    queryKey: ["consultations", "me"],
    queryFn: () => consultationsApi.getMe({ limit: 50 }),
  });

  const active = consultations.filter((c) => c.status === "in_progress");
  const completed = consultations.filter((c) => c.status === "completed");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Consultations</h1>
        <p className="mt-1 text-sm text-slate-500">Manage consultations and write clinical notes</p>
      </div>

      <Tabs defaultValue={active.length > 0 ? "active" : "completed"}>
        <TabsList>
          <TabsTrigger value="active">
            Active
            {!isLoading && active.length > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-px text-xs font-semibold text-amber-700">{active.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          {isLoading ? <ListSkeleton /> : active.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
              <Video className="h-10 w-10 text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-600">No active consultations</p>
            </div>
          ) : (
            <div className="space-y-3">{active.map((c) => <ConsultationCard key={c.id} consultation={c} />)}</div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          {isLoading ? <ListSkeleton /> : completed.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
              <FileText className="h-10 w-10 text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-600">No completed consultations</p>
            </div>
          ) : (
            <div className="space-y-3">{completed.map((c) => <ConsultationCard key={c.id} consultation={c} />)}</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
