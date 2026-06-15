import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Logger } from "@nestjs/common";
import type { Server, Socket } from "socket.io";
import { WS_EVENTS } from "@aktensystem/shared";

/**
 * Realtime-Gateway für Live-Karte, Dispatch-Board und Status-System.
 * Clients abonnieren Sektoren; der Server pusht Positions-/Status-/Dispatch-
 * Events. Fan-out über mehrere Instanzen erfolgt in Phase 3 via Redis-Adapter.
 */
@WebSocketGateway({ cors: true })
export class RealtimeGateway {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

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

  /** Vom FiveM-Service aufgerufen: Position einer Einheit broadcasten. */
  broadcastPosition(sector: string, payload: unknown) {
    this.server.to(`sector:${sector}`).emit(WS_EVENTS.UNIT_POSITION, payload);
  }

  broadcastDispatch(event: string, payload: unknown) {
    this.server.emit(event, payload);
  }
}
