"use client";

import { useEffect, useState } from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Loader2, UserCircle, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVideoRoom } from "@/hooks/useVideoRoom";
import { consultationsApi } from "@/lib/api/consultations";

interface VideoCallRoomProps {
  consultationId: string;
  onEnd: () => void;
}

export function VideoCallRoom({ consultationId, onEnd }: VideoCallRoomProps) {
  const {
    status,
    error,
    localVideoRef,
    remoteVideoRef,
    isMuted,
    isCameraOff,
    remoteParticipantCount,
    connect,
    disconnect,
    toggleMute,
    toggleCamera,
  } = useVideoRoom();

  const [callDuration, setCallDuration] = useState(0);

  // Fetch token and connect when component mounts
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const { token, room_name } = await consultationsApi.getVideoToken(consultationId);
        if (!cancelled) {
          await connect(token, room_name);
        }
      } catch (err) {
        console.error("Failed to get video token:", err);
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [consultationId, connect]);

  // Call duration timer
  useEffect(() => {
    if (status !== "connected") return;
    const interval = setInterval(() => setCallDuration((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [status]);

  function formatDuration(secs: number) {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function handleEnd() {
    disconnect();
    onEnd();
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl overflow-hidden">
      {/* Video area */}
      <div className="relative flex-1 bg-slate-800">
        {/* Remote video (full size) */}
        <div
          ref={remoteVideoRef}
          className="absolute inset-0 flex items-center justify-center"
        >
          {remoteParticipantCount === 0 && (
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <UserCircle className="h-20 w-20" />
              <p className="text-sm">
                {status === "connecting"
                  ? "Connecting..."
                  : status === "connected"
                  ? "Waiting for provider to join..."
                  : ""}
              </p>
            </div>
          )}
        </div>

        {/* Local video (picture-in-picture) */}
        <div
          ref={localVideoRef}
          className={cn(
            "absolute bottom-4 right-4 w-36 h-28 rounded-lg overflow-hidden border-2 border-slate-600 bg-slate-700",
            isCameraOff && "hidden"
          )}
        />

        {/* Camera off overlay for local */}
        {isCameraOff && (
          <div className="absolute bottom-4 right-4 w-36 h-28 rounded-lg border-2 border-slate-600 bg-slate-700 flex items-center justify-center">
            <VideoOff className="h-6 w-6 text-slate-400" />
          </div>
        )}

        {/* Status / duration overlay */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          {status === "connecting" && (
            <span className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
              <Loader2 className="h-3 w-3 animate-spin" />
              Connecting
            </span>
          )}
          {status === "connected" && (
            <span className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
              <Wifi className="h-3 w-3 text-green-400" />
              {formatDuration(callDuration)}
            </span>
          )}
          {status === "error" && (
            <span className="flex items-center gap-1.5 rounded-full bg-red-600/80 px-3 py-1 text-xs text-white">
              <WifiOff className="h-3 w-3" />
              {error ?? "Connection error"}
            </span>
          )}
          {status === "disconnected" && (
            <span className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
              Call ended
            </span>
          )}
        </div>

        {/* Remote participant badge */}
        {remoteParticipantCount > 0 && (
          <div className="absolute top-4 right-4 rounded-full bg-green-500/90 px-2.5 py-0.5 text-xs text-white font-medium">
            Provider connected
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div className="flex items-center justify-center gap-4 bg-slate-900 px-6 py-4">
        {/* Mute */}
        <button
          onClick={toggleMute}
          disabled={status !== "connected"}
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full transition-colors disabled:opacity-40",
            isMuted
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-slate-700 hover:bg-slate-600 text-white"
          )}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>

        {/* Camera */}
        <button
          onClick={toggleCamera}
          disabled={status !== "connected"}
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full transition-colors disabled:opacity-40",
            isCameraOff
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-slate-700 hover:bg-slate-600 text-white"
          )}
          title={isCameraOff ? "Turn camera on" : "Turn camera off"}
        >
          {isCameraOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
        </button>

        {/* End call */}
        <button
          onClick={handleEnd}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
          title="End call"
        >
          <PhoneOff className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
