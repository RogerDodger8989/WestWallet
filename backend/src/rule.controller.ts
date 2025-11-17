import { Controller, Get, Post, Body, Delete, Param, Put } from '@nestjs/common';
import { RuleService } from './rule.service';
import type { Rule } from './rule.service';

@Controller('rules')
export class RuleController {
  constructor(private readonly ruleService: RuleService) {}

  @Get()
  async getAll(): Promise<Rule[]> {
    return this.ruleService.findAll();
  }

  @Post()
  async create(@Body() rule: Rule): Promise<Rule> {
    return this.ruleService.create(rule);
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
