import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Expense, ExpenseSchema } from '../expenses/expense.schema';
import { StatsController } from './stats.controller';
import { ScoreService } from './score.service';
import { WhatIfService } from './whatif.service';
import { StatsCacheService } from './stats-cache.service';
import { WsModule } from '../ws/ws.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Expense.name, schema: ExpenseSchema }]),
    WsModule,
    CacheModule,
  ],
  controllers: [StatsController],
  providers: [ScoreService, WhatIfService, StatsCacheService],
  exports: [ScoreService, WhatIfService, StatsCacheService],
})
export class StatsModule {}
