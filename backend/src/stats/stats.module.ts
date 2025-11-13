import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Expense, ExpenseSchema } from '../expenses/expense.schema';
import { StatsController } from './stats.controller';
import { ScoreService } from './score.service';
import { WsModule } from '../ws/ws.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Expense.name, schema: ExpenseSchema }]),
    WsModule,
  ],
  controllers: [StatsController],
  providers: [ScoreService],
  exports: [ScoreService],
})
export class StatsModule {}
