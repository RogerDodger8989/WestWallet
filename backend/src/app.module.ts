import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import * as dotenv from 'dotenv';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EmailModule } from './email/email.module';
import { CategoriesModule } from './categories/categories.module';
import { ExpensesModule } from './expenses/expenses.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { BudgetsModule } from './budgets/budgets.module';
import { WalletsModule } from './wallets/wallets.module';
import { UploadsModule } from './uploads/uploads.module';
import { QueueModule } from './queue/queue.module';

dotenv.config();

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/westwallet',
    ),
  AuthModule,
  UsersModule,
  EmailModule,
  CategoriesModule,
  ExpensesModule,
  SuppliersModule,
  BudgetsModule,
  WalletsModule,
  UploadsModule,
  QueueModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
