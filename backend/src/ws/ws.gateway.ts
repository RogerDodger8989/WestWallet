import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: true })
export class WsGateway {
  @WebSocketServer()
  server: Server;

  // Skicka event till alla klienter
  sendEvent(event: string, payload: any) {
    this.server.emit(event, payload);
  }

  // Exempel: klient kan skicka "ping"
  @SubscribeMessage('ping')
  handlePing(@MessageBody() data: any) {
    return { event: 'pong', data };
  }
}
