import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  type OnGatewayInit,
} from "@nestjs/websockets";
import { Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Server, Socket } from "socket.io";
import { WS_EVENTS } from "@aktensystem/shared";
import { config } from "../common/config.js";
import { ActorService } from "../rbac/actor.service.js";

/**
 * Realtime-Gateway für Live-Karte, Dispatch-Board und Status-System.
 * Clients abonnieren Sektoren; der Server pusht Positions-/Status-/Dispatch-
 * Events. Fan-out über mehrere Instanzen erfolgt in Phase 3 via Redis-Adapter.
 *
 * Auth: jeder Socket muss beim Connect ein gültiges Access-JWT (handshake.auth.token)
 * vorweisen — sonst Disconnect. Dispatch-/Alarm-Events sind bewusst global (alle
 * Behörden teilen das Lagebild); die Authentifizierung verhindert anonyme Mithörer.
 */
@WebSocketGateway({ cors: true })
export class RealtimeGateway implements OnGatewayInit {
  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly actor: ActorService,
  ) {}

  @WebSocketServer()
  server!: Server;

  /**
   * Auth als Socket.IO-Middleware (NICHT disconnect im handleConnection):
   * ein abgelehnter Handshake liefert dem Client `connect_error` und löst damit
   * automatische Reconnects aus — beim nächsten Versuch sendet die Client-`auth`-
   * Funktion ein frisches Token. So verbindet sich ein eingeloggter Nutzer auch,
   * wenn das Token beim ersten Versuch (Hard-Reload) noch nicht geladen war.
   */
  afterInit(server: Server) {
    server.use(async (socket, next) => {
      const auth = socket.handshake.auth as { token?: string } | undefined;
      const token = auth?.token || (socket.handshake.query?.token as string | undefined);
      if (!token) return next(new Error("unauthorized"));
      try {
        const payload = await this.jwt.verifyAsync<{ sub: string }>(token, {
          secret: config.jwt.accessSecret,
        });
        (socket.data as { userId?: string }).userId = payload.sub;
        next();
      } catch {
        next(new Error("unauthorized"));
      }
    });
  }

  @SubscribeMessage(WS_EVENTS.SUBSCRIBE_SECTOR)
  onSubscribeSector(
    @MessageBody() sector: string,
    @ConnectedSocket() client: Socket,
  ) {
    void client.join(`sector:${sector}`);
    this.logger.debug(`Client ${client.id} abonniert Sektor ${sector}`);
    return { ok: true, sector };
  }

  @SubscribeMessage(WS_EVENTS.UNSUBSCRIBE_SECTOR)
  onUnsubscribeSector(
    @MessageBody() sector: string,
    @ConnectedSocket() client: Socket,
  ) {
    void client.leave(`sector:${sector}`);
    return { ok: true, sector };
  }

  /**
   * LEO-Chat-Kanal abonnieren — nur mit Zugriff (GLOBAL oder eigene Fraktion),
   * sonst kein Join (verhindert Mithören fremder Fraktionskanäle).
   */
  @SubscribeMessage(WS_EVENTS.SUBSCRIBE_CHANNEL)
  async onSubscribeChannel(
    @MessageBody() channel: string,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = (client.data as { userId?: string }).userId;
    if (!userId || !channel) return { ok: false };
    if (channel !== "GLOBAL") {
      const ctx = await this.actor.buildContext(userId);
      if (!ctx.isPlatformAdmin && ctx.factionId !== channel) return { ok: false };
    }
    void client.join(`chat:${channel}`);
    return { ok: true, channel };
  }

  @SubscribeMessage(WS_EVENTS.UNSUBSCRIBE_CHANNEL)
  onUnsubscribeChannel(
    @MessageBody() channel: string,
    @ConnectedSocket() client: Socket,
  ) {
    void client.leave(`chat:${channel}`);
    return { ok: true, channel };
  }

  /** Vom FiveM-Service aufgerufen: Position einer Einheit broadcasten. */
  broadcastPosition(sector: string, payload: unknown) {
    this.server.to(`sector:${sector}`).emit(WS_EVENTS.UNIT_POSITION, payload);
  }

  broadcastDispatch(event: string, payload: unknown) {
    this.server.emit(event, payload);
  }

  /** LEO-Chat-Nachricht an alle Abonnenten des Kanals. */
  broadcastChat(channel: string, payload: unknown) {
    this.server.to(`chat:${channel}`).emit(WS_EVENTS.CHAT_MESSAGE, payload);
  }
}
