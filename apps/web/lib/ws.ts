"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:4000";

/**
 * Verbindet zum NestJS-Realtime-Gateway und registriert Event-Handler.
 * Handler-Map: Event-Name -> Callback. Räumt bei Unmount auf.
 */
export function useSocket(
  handlers: Record<string, (payload: unknown) => void>,
  subscribeSectors: string[] = [],
): void {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    let socket: Socket | null = null;
    try {
      socket = io(WS_URL, { transports: ["websocket"], reconnection: true });
    } catch {
      return;
    }

    const current = handlersRef.current;
    for (const [event, cb] of Object.entries(current)) {
      socket.on(event, cb);
    }
    socket.on("connect", () => {
      for (const s of subscribeSectors) socket?.emit("subscribe:sector", s);
    });

    return () => {
      socket?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribeSectors.join(",")]);
}
