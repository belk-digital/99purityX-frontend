"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  Room,
  LocalVideoTrack,
  LocalAudioTrack,
  RemoteParticipant,
  RemoteTrack,
  RemoteVideoTrack,
  RemoteAudioTrack,
} from "twilio-video";

export type RoomStatus = "idle" | "connecting" | "connected" | "disconnected" | "error";

export interface UseVideoRoomResult {
  status: RoomStatus;
  error: string | null;
  localVideoRef: React.RefObject<HTMLDivElement | null>;
  remoteVideoRef: React.RefObject<HTMLDivElement | null>;
  isMuted: boolean;
  isCameraOff: boolean;
  remoteParticipantCount: number;
  connect: (token: string, roomName: string) => Promise<void>;
  disconnect: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
}

export function useVideoRoom(): UseVideoRoomResult {
  const roomRef = useRef<Room | null>(null);
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);

  const [status, setStatus] = useState<RoomStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [remoteParticipantCount, setRemoteParticipantCount] = useState(0);

  const attachTrack = useCallback((track: RemoteTrack, container: HTMLDivElement) => {
    if (track.kind === "video" || track.kind === "audio") {
      const el = (track as RemoteVideoTrack | RemoteAudioTrack).attach();
      el.style.width = "100%";
      el.style.height = "100%";
      el.style.objectFit = "cover";
      container.appendChild(el);
    }
  }, []);

  const detachTrack = useCallback((track: RemoteTrack, container: HTMLDivElement) => {
    if (track.kind === "video" || track.kind === "audio") {
      (track as RemoteVideoTrack | RemoteAudioTrack)
        .detach()
        .forEach((el) => {
          if (container.contains(el)) container.removeChild(el);
        });
    }
  }, []);

  const attachParticipant = useCallback(
    (participant: RemoteParticipant) => {
      setRemoteParticipantCount((n) => n + 1);
      const container = remoteVideoRef.current;
      if (!container) return;

      participant.tracks.forEach((pub) => {
        if (pub.isSubscribed && pub.track) {
          attachTrack(pub.track, container);
        }
      });

      participant.on("trackSubscribed", (track) => {
        if (container) attachTrack(track, container);
      });

      participant.on("trackUnsubscribed", (track) => {
        if (container) detachTrack(track, container);
      });
    },
    [attachTrack, detachTrack]
  );

  const connect = useCallback(
    async (token: string, roomName: string) => {
      try {
        setStatus("connecting");
        setError(null);

        // Dynamically import twilio-video (browser-only)
        const Video = await import("twilio-video");

        const room = await Video.connect(token, {
          name: roomName,
          audio: true,
          video: { width: 640, height: 480 },
        });

        roomRef.current = room;
        setStatus("connected");

        // Attach local video
        const localContainer = localVideoRef.current;
        if (localContainer) {
          room.localParticipant.videoTracks.forEach((pub) => {
            const el = (pub.track as LocalVideoTrack).attach();
            el.style.width = "100%";
            el.style.height = "100%";
            el.style.objectFit = "cover";
            localContainer.appendChild(el);
          });
        }

        // Attach already-present remote participants
        room.participants.forEach(attachParticipant);

        room.on("participantConnected", attachParticipant);

        room.on("participantDisconnected", () => {
          setRemoteParticipantCount((n) => Math.max(0, n - 1));
        });

        room.on("disconnected", () => {
          setStatus("disconnected");
          setRemoteParticipantCount(0);
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to connect to video room";
        setError(msg);
        setStatus("error");
      }
    },
    [attachParticipant]
  );

  const disconnect = useCallback(() => {
    const room = roomRef.current;
    if (!room) return;

    // Detach local video elements
    const localContainer = localVideoRef.current;
    if (localContainer) {
      room.localParticipant.videoTracks.forEach((pub) => {
        (pub.track as LocalVideoTrack).detach().forEach((el) => {
          if (localContainer.contains(el)) localContainer.removeChild(el);
        });
      });
    }

    room.disconnect();
    roomRef.current = null;
    setStatus("disconnected");
  }, []);

  const toggleMute = useCallback(() => {
    const room = roomRef.current;
    if (!room) return;
    room.localParticipant.audioTracks.forEach((pub) => {
      const track = pub.track as LocalAudioTrack;
      if (isMuted) {
        track.enable();
      } else {
        track.disable();
      }
    });
    setIsMuted((v) => !v);
  }, [isMuted]);

  const toggleCamera = useCallback(() => {
    const room = roomRef.current;
    if (!room) return;
    room.localParticipant.videoTracks.forEach((pub) => {
      const track = pub.track as LocalVideoTrack;
      if (isCameraOff) {
        track.enable();
      } else {
        track.disable();
      }
    });
    setIsCameraOff((v) => !v);
  }, [isCameraOff]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      roomRef.current?.disconnect();
    };
  }, []);

  return {
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
  };
}
