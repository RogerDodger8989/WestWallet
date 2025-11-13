import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { MailWorker } from './mail.worker';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
      },
    }),
  ],
  providers: [MailWorker],
})
export class QueueModule {}
