"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Video,
  Clock,
  CheckCircle2,
  Ban,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  PhoneCall,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { VideoCallRoom } from "@/components/patient/VideoCallRoom";
import { consultationsApi } from "@/lib/api/consultations";
import type { Consultation } from "@/types/consultation";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
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

function duration(start: string, end: string | null) {
  if (!end) return null;
  const mins = Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / 60000
  );
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function StatusBadge({ status }: { status: Consultation["status"] }) {
  const map = {
    in_progress: {
      cls: "bg-amber-100 text-amber-700 border-amber-200",
      icon: <Clock className="h-3 w-3" />,
      label: "In Progress",
    },
    completed: {
      cls: "bg-green-100 text-green-700 border-green-200",
      icon: <CheckCircle2 className="h-3 w-3" />,
      label: "Completed",
    },
    cancelled: {
      cls: "bg-slate-100 text-slate-500 border-slate-200",
      icon: <Ban className="h-3 w-3" />,
      label: "Cancelled",
    },
  };
  const { cls, icon, label } = map[status] ?? map.completed;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {icon}
      {label}
    </span>
  );
}

function ConsultationCard({
  consultation,
  onJoinCall,
}: {
  consultation: Consultation;
  onJoinCall: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const dur = duration(consultation.started_at ?? "", consultation.ended_at ?? null);
  const hasDetails =
    consultation.chief_complaint ||
    consultation.provider_notes ||
    consultation.summary;
  const isActive = consultation.status === "in_progress";

  return (
    <Card className={isActive ? "border-violet-200 shadow-sm shadow-violet-100" : ""}>
      <CardContent className="p-4">
        {/* Header row */}
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
                {dur && <span className="ml-2 text-slate-400">· {dur}</span>}
              </p>
              {consultation.chief_complaint && !expanded && (
                <p className="mt-1.5 line-clamp-1 text-sm text-slate-600">
                  {consultation.chief_complaint}
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2">
            <StatusBadge status={consultation.status} />
            {consultation.follow_up_required && (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">
                <AlertCircle className="h-3 w-3" />
                Follow-up
              </span>
            )}
            {isActive && (
              <Button
                size="sm"
                onClick={() => onJoinCall(consultation.id)}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                <PhoneCall className="h-3.5 w-3.5" />
                Join Call
              </Button>
            )}
            {hasDetails && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                {expanded ? (
                  <>Less <ChevronUp className="h-3 w-3" /></>
                ) : (
                  <>Details <ChevronDown className="h-3 w-3" /></>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
            {consultation.chief_complaint && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Chief Complaint
                </p>
                <p className="mt-1 text-sm text-slate-700">{consultation.chief_complaint}</p>
              </div>
            )}
            {consultation.summary && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Summary
                </p>
                <p className="mt-1 text-sm text-slate-700">{consultation.summary}</p>
              </div>
            )}
            {consultation.provider_notes && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Provider Notes
                </p>
                <p className="mt-1 text-sm text-slate-700">{consultation.provider_notes}</p>
              </div>
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
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
              </div>
              <Skeleton className="h-6 w-24 rounded-full" />
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
      <FileText className="h-10 w-10 text-slate-300 mb-3" />
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-1 text-xs text-slate-400">
        Consultations are created by your provider after an appointment
      </p>
    </div>
  );
}

export default function ConsultationsPage() {
  const [activeCallId, setActiveCallId] = useState<string | null>(null);

  const { data: consultations = [], isLoading } = useQuery({
    queryKey: ["consultations", "me"],
    queryFn: () => consultationsApi.getMe({ limit: 50 }),
  });

  const active = consultations
    .filter((c) => c.status === "in_progress")
    .sort((a, b) => new Date(b.started_at ?? "").getTime() - new Date(a.started_at ?? "").getTime());

  const completed = consultations
    .filter((c) => c.status === "completed")
    .sort((a, b) => new Date(b.started_at ?? "").getTime() - new Date(a.started_at ?? "").getTime());

  const cancelled = consultations
    .filter((c) => c.status === "cancelled")
    .sort((a, b) => new Date(b.started_at ?? "").getTime() - new Date(a.started_at ?? "").getTime());

  // Full-screen video call overlay
  if (activeCallId) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">Video Consultation</h1>
          <button
            onClick={() => setActiveCallId(null)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <X className="h-4 w-4" />
            Back to list
          </button>
        </div>
        <div className="h-[calc(100vh-12rem)]">
          <VideoCallRoom
            consultationId={activeCallId}
            onEnd={() => setActiveCallId(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Consultations</h1>
        <p className="mt-1 text-sm text-slate-500">
          Your consultation history with providers
        </p>
      </div>

      <Tabs defaultValue={active.length > 0 ? "active" : "completed"}>
        <TabsList>
          <TabsTrigger value="active">
            Active
            {!isLoading && active.length > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-px text-xs font-semibold text-amber-700">
                {active.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed
            {!isLoading && completed.length > 0 && (
              <span className="ml-1.5 rounded-full bg-green-100 px-1.5 py-px text-xs font-semibold text-green-700">
                {completed.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          {isLoading ? (
            <ListSkeleton />
          ) : active.length === 0 ? (
            <EmptyState label="No active consultations" />
          ) : (
            <div className="space-y-3">
              {active.map((c) => (
                <ConsultationCard key={c.id} consultation={c} onJoinCall={setActiveCallId} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          {isLoading ? (
            <ListSkeleton />
          ) : completed.length === 0 ? (
            <EmptyState label="No completed consultations yet" />
          ) : (
            <div className="space-y-3">
              {completed.map((c) => (
                <ConsultationCard key={c.id} consultation={c} onJoinCall={setActiveCallId} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="mt-4">
          {isLoading ? (
            <ListSkeleton />
          ) : cancelled.length === 0 ? (
            <EmptyState label="No cancelled consultations" />
          ) : (
            <div className="space-y-3">
              {cancelled.map((c) => (
                <ConsultationCard key={c.id} consultation={c} onJoinCall={setActiveCallId} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
