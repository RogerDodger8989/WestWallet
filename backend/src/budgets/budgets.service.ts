import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Budget, BudgetDocument } from './budget.schema';

@Injectable()
export class BudgetsService {
  constructor(
    @InjectModel(Budget.name) private readonly budgetModel: Model<BudgetDocument>,
  ) {}

  async create(data: Partial<Budget>): Promise<BudgetDocument> {
    return new this.budgetModel(data).save();
  }

  async findAll(): Promise<BudgetDocument[]> {
    return this.budgetModel.find().exec();
  }

  async findByCategory(category: string): Promise<BudgetDocument[]> {
    return this.budgetModel.find({ category: new Types.ObjectId(category) }).exec();
  }

  async findById(id: string): Promise<BudgetDocument | null> {
    return this.budgetModel.findById(id).exec();
  }

  async update(id: string, data: Partial<Budget>): Promise<BudgetDocument> {
    const bud = await this.budgetModel.findById(id);
    if (!bud) throw new NotFoundException('Budget hittades inte');
    Object.assign(bud, data);
    return bud.save();
  }

  async delete(id: string): Promise<void> {
    await this.budgetModel.findByIdAndDelete(id);
  }
}
