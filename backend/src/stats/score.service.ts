import { Injectable } from '@nestjs/common';
import { Expense, ExpenseDocument } from '../expenses/expense.schema';

@Injectable()
export class ScoreService {
  // Beräkna ekonomi-hälsopoäng och tips
  calculateScore(expenses: ExpenseDocument[], income: number, debts: number): {
    score: number;
    tips: string[];
    details: {
      savingsRate: number;
      fixedVsIncome: number;
      debtLevel: number;
      volatility: number;
    };
  } {
    // Spargrad
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const savingsRate = income > 0 ? Math.max(0, 1 - totalExpenses / income) : 0;

    // Fasta kostnader vs inkomst
    const fixedExpenses = expenses.filter(e => e.type === 'fixed').reduce((sum, e) => sum + e.amount, 0);
    const fixedVsIncome = income > 0 ? fixedExpenses / income : 0;

    // Skuldnivåer
    const debtLevel = income > 0 ? debts / income : 0;

    // Volatilitet (stddev på månadsutgifter)
    const byMonth = expenses.reduce((acc, e) => {
      acc[e.month] = (acc[e.month] || 0) + e.amount;
      return acc;
    }, {} as Record<number, number>);
    const months = Object.values(byMonth);
    const avg = months.length ? months.reduce((a, b) => a + b, 0) / months.length : 0;
    const volatility = months.length ? Math.sqrt(months.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / months.length) : 0;

    // Poäng (0–100)
    let score = 100;
    if (savingsRate < 0.1) score -= 30;
    else if (savingsRate < 0.2) score -= 15;
    if (fixedVsIncome > 0.5) score -= 20;
    if (debtLevel > 1) score -= 20;
    if (volatility > avg * 0.5) score -= 15;
    score = Math.max(0, Math.min(100, Math.round(score)));

    // Tips
    const tips: string[] = [];
    if (savingsRate < 0.1) tips.push('Öka din spargrad. Försök spara minst 10% av din inkomst.');
    if (fixedVsIncome > 0.5) tips.push('Fasta kostnader är höga jämfört med din inkomst. Se över abonnemang och boende.');
    if (debtLevel > 1) tips.push('Skulder överstiger din årsinkomst. Prioritera amortering.');
    if (volatility > avg * 0.5) tips.push('Dina utgifter varierar mycket mellan månader. Försök jämna ut kostnaderna.');

    return {
      score,
      tips,
      details: {
        savingsRate,
        fixedVsIncome,
        debtLevel,
        volatility,
      },
    };
  }
}
