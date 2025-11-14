import { Controller, Post, Body } from '@nestjs/common';
import { WhatIfService } from './whatif.service';

@Controller('whatif')
export class WhatIfController {
  constructor(private readonly whatIfService: WhatIfService) {}

  @Post('simulate')
  simulate(@Body('current') current: any, @Body('scenario') scenario: any) {
    return this.whatIfService.simulate(current, scenario);
  }
}
