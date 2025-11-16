import { Module } from '@nestjs/common';
import { ImagesController } from './images.controller';
import { ExpensesModule } from './expenses.module';
import { ExpensesService } from './expenses.service';
import { AuditLogModule } from '../common/auditlog.module';
import { WsModule } from '../ws/ws.module';

@Module({
  imports: [ExpensesModule, AuditLogModule, WsModule],
  controllers: [ImagesController],
  providers: [ExpensesService],
  exports: [AuditLogModule, WsModule],
})
export class ImagesModule {}
