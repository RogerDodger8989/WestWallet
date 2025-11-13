import { Module } from '@nestjs/common';
import { MJMLService } from './mjml.service';

@Module({
  providers: [MJMLService],
  exports: [MJMLService],
})
export class MJMLModule {}