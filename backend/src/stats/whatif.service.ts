import { Injectable } from '@nestjs/common';
import { ExpenseDocument } from '../expenses/expense.schema';
import { ScoreService } from './score.service';

export interface WhatIfScenario {
  type: 'reduce_subscriptions' | 'sell_asset';
  percent?: number;
  assetName?: string;
  assetValue?: number;
}

@Injectable()
export class WhatIfService {
  constructor(private readonly scoreService: ScoreService) {}

  simulate(expenses: ExpenseDocument[], income: number, debts: number, scenario: WhatIfScenario) {
    let simulatedExpenses: ExpenseDocument[] = [...expenses];
    let simulatedIncome = income;
    let simulatedDebts = debts;

    if (scenario.type === 'reduce_subscriptions' && typeof scenario.percent === 'number') {
      simulatedExpenses = simulatedExpenses.map(e => {
        if (e.type === 'fixed') {
          const copy = Object.assign(Object.create(Object.getPrototypeOf(e)), e);
          copy.amount = e.amount * (1 - scenario.percent! / 100);
          return copy;
        }
        return e;
      });
    }
    if (scenario.type === 'sell_asset' && scenario.assetValue) {
      simulatedIncome += scenario.assetValue;
    }
    // Fler scenarion kan läggas till här

    return this.scoreService.calculateScore(simulatedExpenses, simulatedIncome, simulatedDebts);
  }
}
