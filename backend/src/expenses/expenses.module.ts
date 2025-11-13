import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Expense, ExpenseSchema } from './expense.schema';
import { ExpensesService } from './expenses.service';
import { AuditLogModule } from '../common/auditlog.module';
import { WsModule } from '../ws/ws.module';
import { ExpensesController } from './expenses.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Expense.name, schema: ExpenseSchema }]),
    AuditLogModule,
    WsModule,
  ],
  providers: [ExpensesService],
  controllers: [ExpensesController],
})
export class ExpensesModule {}
