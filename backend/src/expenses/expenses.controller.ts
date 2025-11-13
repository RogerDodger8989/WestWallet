import { Controller, Get, Post, Body, Param, Delete, Put, Query } from '@nestjs/common';
import { ExpensesService } from './expenses.service';

@Controller('expenses')
export class ExpensesController {
      // Hämta auditlogg för utgifter
      @Get('auditlog')
      async getAuditLog() {
        const AuditLog = (await import('../models/auditlog.schema')).default;
        return AuditLog.find({ model: 'Expense' }).sort({ timestamp: -1 }).limit(100).exec();
      }
    // Statistik: summera utgifter per kategori och månad
    @Get('stats/:year')
    async getStats(@Param('year') year: number) {
      return this.expensesService.getStatsByCategoryAndMonth(year);
    }
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  async create(@Body() body: any) {
    return this.expensesService.create(body);
  }

  @Get()
  async findAll() {
    return this.expensesService.findAll();
  }

  @Get('year/:year')
  async findByYear(@Param('year') year: number) {
    return this.expensesService.findByYear(year);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.expensesService.findById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.expensesService.update(id, body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.expensesService.delete(id);
    return { message: 'Utgift borttagen' };
  }
}
