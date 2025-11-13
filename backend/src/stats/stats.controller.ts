import { Controller, Get, Query, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Expense, ExpenseDocument } from '../expenses/expense.schema';
import { ScoreService } from './score.service';
import { WhatIfService, WhatIfScenario } from './whatif.service';
import { StatsCacheService } from './stats-cache.service';

@Controller('stats')
export class StatsController {
  constructor(
    @InjectModel(Expense.name) private readonly expenseModel: Model<ExpenseDocument>,
    private readonly scoreService: ScoreService,
    private readonly whatIfService: WhatIfService,
    private readonly statsCacheService: StatsCacheService,
    @Inject('WsGateway') private readonly wsGateway: any,
  ) {}

  @Get('score')
  async getScore(
    @Query('year') year: number,
    @Query('income') income: number,
    @Query('debts') debts: number,
  ) {
    // Hämta utgifter för året
    const expenses = await this.expenseModel.find({ year }).exec();
    const result = this.scoreService.calculateScore(expenses, income, debts);
    // WebSocket: skicka event till alla klienter
    this.wsGateway?.sendEvent('scoreCalculated', result);
    return result;
  }

  @Get('whatif')
  async getWhatIf(
    @Query('year') year: number,
    @Query('income') income: number,
    @Query('debts') debts: number,
    @Query('type') type: string,
    @Query('percent') percent?: number,
    @Query('assetName') assetName?: string,
    @Query('assetValue') assetValue?: number,
  ) {
    const expenses = await this.expenseModel.find({ year }).exec();
    const scenario: WhatIfScenario = { type: type as any, percent, assetName, assetValue };
    const result = this.whatIfService.simulate(expenses, income, debts, scenario);
    this.wsGateway?.sendEvent('whatIfSimulated', { scenario, result });
    return result;
  }

  @Get('cached')
  async getCachedStats(
    @Query('year') year: number,
    @Query('income') income: number,
  ) {
    const expenses = await this.expenseModel.find({ year }).exec();
    const stats = await this.statsCacheService.getOrCalculateStats(year, expenses, income);
    this.wsGateway?.sendEvent('statsCached', stats);
    return stats;
  }
}
