import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

export interface Rule {
  _id?: string;
  contains: string;
  category: string;
  supplier: string;
  userId: string;
}

@Injectable()
export class RuleService {
  constructor(@InjectModel('Rule') private ruleModel: Model<Rule>) {}

  async findAllByUser(userId: string): Promise<Rule[]> {
    return this.ruleModel.find({ userId }).exec();
  }

  async create(rule: Rule): Promise<Rule> {
    const created = new this.ruleModel(rule);
    return created.save();
  }

  async delete(id: string): Promise<void> {
    await this.ruleModel.findByIdAndDelete(id);
  }

  async update(id: string, rule: Partial<Rule>): Promise<Rule> {
    const updated = await this.ruleModel.findByIdAndUpdate(id, rule, { new: true });
    if (!updated) throw new Error('Rule not found');
    return updated as Rule;
  }
}
