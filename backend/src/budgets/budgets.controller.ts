import { Controller, Get, Post, Body, Param, Delete, Put, Query } from '@nestjs/common';
import { BudgetsService } from './budgets.service';

@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  async create(@Body() body: any) {
    return this.budgetsService.create(body);
  }

  @Get()
  async findAll() {
    return this.budgetsService.findAll();
  }

  @Get('category/:category')
  async findByCategory(@Param('category') category: string) {
    // Validate ObjectId format
    if (!category.match(/^[0-9a-fA-F]{24}$/)) {
      return { error: 'Invalid category ObjectId' };
    }
    return this.budgetsService.findByCategory(category);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.budgetsService.findById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.budgetsService.update(id, body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.budgetsService.delete(id);
    return { message: 'Budget borttagen' };
  }
}
