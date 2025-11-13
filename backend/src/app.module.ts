import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import * as dotenv from 'dotenv';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EmailModule } from './email/email.module';
import { MJMLModule } from './email/mjml.module';
import { CategoriesModule } from './categories/categories.module';
import { ExpensesModule } from './expenses/expenses.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { BudgetsModule } from './budgets/budgets.module';
import { StatsModule } from './stats/stats.module';
import { WalletsModule } from './wallets/wallets.module';
import { UploadsModule } from './uploads/uploads.module';
import { QueueModule } from './queue/queue.module';
import { AiModule } from './ai/ai.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { CacheModule } from './cache/cache.module';
import { AuditLogModule } from './common/auditlog.module';
import { WsModule } from './ws/ws.module';
import { APP_GUARD } from '@nestjs/core';
import { RateLimitGuard } from './auth/rate-limit.guard';

dotenv.config();

@Module({
  imports: [
      MongooseModule.forRoot(
        process.env.MONGODB_URI || 'mongodb://localhost:27017/westwallet',
      ),
      AuthModule,
      UsersModule,
      EmailModule,
      MJMLModule,
      CategoriesModule,
      ExpensesModule,
      SuppliersModule,
      BudgetsModule,
      StatsModule,
      WalletsModule,
      UploadsModule,
      QueueModule,
      AiModule,
      WebhooksModule,
      CacheModule,
      AuditLogModule,
      WsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
})
export class AppModule {}
