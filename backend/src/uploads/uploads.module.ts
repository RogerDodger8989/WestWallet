import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { WsModule } from '../ws/ws.module';

@Module({
  imports: [WsModule],
  controllers: [UploadsController],
})
export class UploadsModule {}
