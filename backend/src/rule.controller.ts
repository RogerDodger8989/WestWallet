import { Controller, Get, Post, Body, Delete, Param, Put, Req, UseGuards } from '@nestjs/common';
import { RuleService } from './rule.service';
import type { Rule } from './rule.service';

@Controller('rules')
export class RuleController {
  constructor(private readonly ruleService: RuleService) {}

  @Get()
  async getAll(@Req() req): Promise<Rule[]> {
    return this.ruleService.findAllByUser(req.user.id);
  }

  @Post()
  async create(@Req() req, @Body() rule: Rule): Promise<Rule> {
    return this.ruleService.create({ ...rule, userId: req.user.id });
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return this.ruleService.delete(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() rule: Partial<Rule>): Promise<Rule> {
    return this.ruleService.update(id, rule);
  }
}
