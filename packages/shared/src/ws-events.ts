/**
 * WebSocket-Event-Namen — geteilter Vertrag zwischen NestJS-Gateway und
 * Frontend (Live-Karte, Dispatch-Board, Status-System).
 */
export const WS_EVENTS = {
  // Server -> Client
  UNIT_POSITION: "unit:position",
  UNIT_STATUS: "unit:status",
  DISPATCH_CREATED: "dispatch:created",
  DISPATCH_UPDATED: "dispatch:updated",
  DISPATCH_ASSIGNED: "dispatch:assigned",
  DISPATCH_ALERT: "dispatch:alert", // Panic/Backup-Alarm (P1/P2)
  RADIO_ROSTER: "radio:roster", // Funk-Roster geändert
  CASEFILE_SHARED: "casefile:shared",
  NOTIFICATION: "notification",

  // Client -> Server
  SUBSCRIBE_SECTOR: "subscribe:sector",
  UNSUBSCRIBE_SECTOR: "unsubscribe:sector",
  SET_UNIT_STATUS: "unit:set-status",
} as const;

export type WsEvent = (typeof WS_EVENTS)[keyof typeof WS_EVENTS];

/** Redis Pub/Sub Kanäle (Backend-intern, fan-out über Instanzen). */
export const REDIS_CHANNELS = {
  POSITIONS: "ch:positions",
  DISPATCH: "ch:dispatch",
  NOTIFICATIONS: "ch:notifications",
} as const;
