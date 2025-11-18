
import { Controller, Get, Post, Body, Param, Delete, Put, Query, Inject } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Controller('expenses')
export class ExpensesController {
  constructor(
    private readonly expensesService: ExpensesService,
    @Inject('WsGateway') private readonly wsGateway: any,
    @InjectModel('AuditLog') private readonly auditLogModel: Model<any>,
  ) {}

  @Post('restore')
  async restore(@Body() body: any) {
    return this.expensesService.restore(body);
  }

  // Offline sync: returnera ändrade poster sedan timestamp
  @Get('sync')
  async sync(@Query('since') since: string) {
    const date = since ? new Date(since) : new Date(0);
    return this.expensesService.findChangedSince(date);
  }

  // Hämta auditlogg för utgifter
  @Get('auditlog')
  async getAuditLog() {
    const logs = await this.auditLogModel.find({ model: 'Expense' }).sort({ timestamp: -1 }).limit(100).exec();
    if (logs.length > 0) {
      this.wsGateway?.sendEvent('auditLogEvent', { log: logs[0] });
    }
    return logs;
  }

  // Statistik: summera utgifter per kategori och månad
  @Get('stats/:year')
  async getStats(@Param('year') year: number) {
    return this.expensesService.getStatsByCategoryAndMonth(year);
  }

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
