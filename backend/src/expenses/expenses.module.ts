import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Expense, ExpenseSchema } from './expense.schema';
import { ExpensesService } from './expenses.service';
import { AuditLogModule } from '../common/auditlog.module';
import { WsModule } from '../ws/ws.module';
import { ExpensesController } from './expenses.controller';
import { ImagesController } from './images.controller';
import { auditLogSchema } from '../models/auditlog.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Expense.name, schema: ExpenseSchema },
      { name: 'AuditLog', schema: auditLogSchema },
    ]),
    AuditLogModule,
    WsModule,
  ],
  providers: [ExpensesService],
  exports: [ExpensesService],
  controllers: [ExpensesController, ImagesController],
})
export class ExpensesModule {}
