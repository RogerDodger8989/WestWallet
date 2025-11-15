import { Module } from '@nestjs/common';
import { AdminController } from './admin/admin.controller';
import { AdminService } from './admin/admin.service';
import { AdminLogViewerController } from './admin-log-viewer.controller';
import { AdminImpersonateController } from './admin-impersonate.controller';
import { AuditLogService } from './common/auditlog.service';
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
import { DevicesModule } from './devices/devices.module';
import { EventsModule } from './events/events.module';
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
import { BillingModule } from './billing.module';
import { BillingController } from './billing.controller';
import { HealthScoreModule } from './healthscore.module';
import { HealthScoreController } from './healthscore.controller';
import { ConfigModule } from './config.module';
import { ConfigController } from './config.controller';

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
      DevicesModule,
      EventsModule,
      StatsModule,
      WalletsModule,
      UploadsModule,
      QueueModule,
      AiModule,
      WebhooksModule,
      CacheModule,
      AuditLogModule,
      WsModule,
      BillingModule,
      HealthScoreModule,
      ConfigModule,
  ],
  controllers: [AdminController, AdminLogViewerController, AdminImpersonateController, BillingController, HealthScoreController, ConfigController],
  providers: [
    AuditLogService,
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
    AdminService,
  ],
})
export class AppModule {}
