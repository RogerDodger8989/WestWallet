import { Injectable } from '@nestjs/common';
// import HealthScore from './models/healthscore.schema';

@Injectable()
export class WhatIfService {
  // Simulate scenario: e.g. new expense, changed income, etc.
  async simulate(current: {
    spargrad: number;
    fastaKostnader: number;
    inkomst: number;
    skuldniva: number;
    volatilitet: number;
  }, changes: Partial<{
    spargrad: number;
    fastaKostnader: number;
    inkomst: number;
    skuldniva: number;
    volatilitet: number;
  }>) {
    const next = { ...current, ...changes };
    let score = 100;
    if (next.spargrad < 0.1) score -= 20;
    if (next.fastaKostnader > next.inkomst * 0.5) score -= 20;
    if (next.skuldniva > next.inkomst * 2) score -= 20;
    if (next.volatilitet > 0.2) score -= 20;
    const tips: string[] = [];
    if (next.spargrad < 0.1) tips.push('Öka din spargrad');
    if (next.fastaKostnader > next.inkomst * 0.5) tips.push('Minska fasta kostnader');
    if (next.skuldniva > next.inkomst * 2) tips.push('Minska skulder');
    if (next.volatilitet > 0.2) tips.push('Stabilare ekonomi');
    return { score, tips, next };
  }
}
