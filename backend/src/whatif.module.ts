import { Module } from '@nestjs/common';
import { WhatIfService } from './whatif.service';

@Module({
  providers: [WhatIfService],
  exports: [WhatIfService],
})
export class WhatIfModule {}
