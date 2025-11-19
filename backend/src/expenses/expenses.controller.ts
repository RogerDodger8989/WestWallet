
import { Controller, Get, Post, Body, Param, Delete, Put, Query, Inject, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExpensesService } from './expenses.service';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@UseGuards(JwtAuthGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(
    private readonly expensesService: ExpensesService,
    @Inject('WsGateway') private readonly wsGateway: any,
    @InjectModel('AuditLog') private readonly auditLogModel: Model<any>,
  ) {}

  @Post('restore')
  async restore(@Req() req, @Body() body: any) {
    console.log('[ExpensesController] req.user:', req.user);
    return this.expensesService.restore(body, req.user.userId);
  }

  // Offline sync: returnera ändrade poster sedan timestamp
  @Get('sync')
  async sync(@Req() req, @Query('since') since: string) {
    console.log('[ExpensesController] req.user:', req.user);
    const date = since ? new Date(since) : new Date(0);
    return this.expensesService.findChangedSince(date, req.user.userId);
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
  async getStats(@Req() req, @Param('year') year: number) {
    return this.expensesService.getStatsByCategoryAndMonth(year, req.user.userId);
  }

  @Post()
  async create(@Req() req, @Body() body: any) {
    // Lägg till userId från JWT
    return this.expensesService.create({ ...body, userId: req.user.userId });
  }

  @Get()
  async findAll(@Req() req) {
    console.log('[ExpensesController] req.user:', req.user);
    return this.expensesService.findAll(req.user.userId);
  }

  @Get('year/:year')
  async findByYear(@Req() req, @Param('year') year: number) {
    return this.expensesService.findByYear(year, req.user.userId);
  }

  @Get(':id')
  async findById(@Req() req, @Param('id') id: string) {
    return this.expensesService.findById(id, req.user.userId);
  }

  @Put(':id')
  async update(@Req() req, @Param('id') id: string, @Body() body: any) {
    return this.expensesService.update(id, body, req.user.userId);
  }

  @Delete(':id')
  async delete(@Req() req, @Param('id') id: string) {
    await this.expensesService.delete(id, req.user.userId);
    return { message: 'Utgift borttagen' };
  }
}
