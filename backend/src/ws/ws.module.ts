import { Module } from '@nestjs/common';
import { WsGateway } from './ws.gateway';

@Module({
  providers: [
    {
      provide: 'WsGateway',
      useClass: WsGateway,
    },
    WsGateway,
  ],
  exports: ['WsGateway', WsGateway],
})
export class WsModule {}