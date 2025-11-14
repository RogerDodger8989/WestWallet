import { Injectable } from '@nestjs/common';
import HealthScore from './models/healthscore.schema';

@Injectable()
export class HealthScoreService {
  async getScore(organizationId: string) {
    return HealthScore.findOne({ organizationId }).lean();
  }

  async calculateScore(data: {
    spargrad: number;
    fastaKostnader: number;
    inkomst: number;
    skuldniva: number;
    volatilitet: number;
  }) {
    // Simple scoring logic, can be expanded
    let score = 100;
    if (data.spargrad < 0.1) score -= 20;
    if (data.fastaKostnader > data.inkomst * 0.5) score -= 20;
    if (data.skuldniva > data.inkomst * 2) score -= 20;
    if (data.volatilitet > 0.2) score -= 20;
    const tips: string[] = [];
    if (data.spargrad < 0.1) tips.push('Öka din spargrad');
    if (data.fastaKostnader > data.inkomst * 0.5) tips.push('Minska fasta kostnader');
    if (data.skuldniva > data.inkomst * 2) tips.push('Minska skulder');
    if (data.volatilitet > 0.2) tips.push('Stabilare ekonomi');
    return { score, tips };
  }

  async updateScore(organizationId: string, data: any) {
    const { score, tips } = await this.calculateScore(data);
    return HealthScore.findOneAndUpdate(
      { organizationId },
      { ...data, score, tips, updatedAt: new Date() },
      { upsert: true, new: true }
    );
  }
}
