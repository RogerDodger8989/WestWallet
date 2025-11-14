import { Module } from '@nestjs/common';
import { HealthScoreService } from './healthscore.service';

@Module({
  providers: [HealthScoreService],
  exports: [HealthScoreService],
})
export class HealthScoreModule {}
