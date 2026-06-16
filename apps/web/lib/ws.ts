"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { getAccessToken } from "./api";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:4000";

/**
 * Verbindet zum NestJS-Realtime-Gateway und registriert Event-Handler.
 * Handler-Map: Event-Name -> Callback. Räumt bei Unmount auf.
 */
export function useSocket(
  handlers: Record<string, (payload: unknown) => void>,
  subscribeSectors: string[] = [],
  subscribeChannels: string[] = [],
): void {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    let socket: Socket | null = null;
    try {
      socket = io(WS_URL, {
        transports: ["websocket"],
        reconnection: true,
        // Token-Funktion -> bei jedem (Re-)Connect frisches Access-JWT (Gateway verlangt Auth).
        auth: (cb) => cb({ token: getAccessToken() ?? "" }),
      });
    } catch {
      return;
    }

    // Stabile Wrapper: rufen stets den aktuellen Handler aus der Ref auf
    // (kein Stale-Closure, auch wenn Callers inline-Handler je Render übergeben).
    for (const event of Object.keys(handlersRef.current)) {
      socket.on(event, (p) => handlersRef.current[event]?.(p));
    }
    socket.on("connect", () => {
      for (const s of subscribeSectors) socket?.emit("subscribe:sector", s);
      for (const c of subscribeChannels) socket?.emit("subscribe:channel", c);
    });

    return () => {
      socket?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribeSectors.join(","), subscribeChannels.join(",")]);
}
