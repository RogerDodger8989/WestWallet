import { Controller, Get, Query, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Expense, ExpenseDocument } from '../expenses/expense.schema';
import { ScoreService } from './score.service';

@Controller('stats')
export class StatsController {
  constructor(
    @InjectModel(Expense.name) private readonly expenseModel: Model<ExpenseDocument>,
    private readonly scoreService: ScoreService,
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
}
