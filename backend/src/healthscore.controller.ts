import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { HealthScoreService } from './healthscore.service';

@Controller('healthscore')
export class HealthScoreController {
  constructor(private readonly healthScoreService: HealthScoreService) {}

  @Get(':organizationId')
  async getScore(@Param('organizationId') organizationId: string) {
    return this.healthScoreService.getScore(organizationId);
  }

  @Post(':organizationId')
  async updateScore(
    @Param('organizationId') organizationId: string,
    @Body() data: any
  ) {
    return this.healthScoreService.updateScore(organizationId, data);
  }
}
