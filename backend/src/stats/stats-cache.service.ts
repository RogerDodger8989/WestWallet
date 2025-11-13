import { Injectable } from '@nestjs/common';
import { CacheService } from '../cache/cache.service';
import { ExpenseDocument } from '../expenses/expense.schema';

@Injectable()
export class StatsCacheService {
  constructor(private readonly cacheService: CacheService) {}

  async getOrCalculateStats(year: number, expenses: ExpenseDocument[], income: number) {
    const cacheKey = `stats:${year}`;
    let stats = await this.cacheService.get<any>(cacheKey);
    if (!stats) {
      // Beräkna stats
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
      const totalIncome = income;
      const byVendor = {};
      const byCategory = {};
      for (const e of expenses) {
        if (e.supplier) byVendor[e.supplier] = (byVendor[e.supplier] || 0) + e.amount;
        if (e.category) byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
      }
      const difference = totalIncome - totalExpenses;
      // Prognos: enkel linjär extrapolering
      const avgMonth = expenses.length ? totalExpenses / expenses.length : 0;
      const forecast = avgMonth * 12;
      stats = { totalExpenses, totalIncome, byVendor, byCategory, difference, forecast };
      await this.cacheService.set(cacheKey, stats, 3600); // cache 1h
    }
    return stats;
  }
}
