import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Expense, ExpenseDocument } from './expense.schema';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectModel(Expense.name) private readonly expenseModel: Model<ExpenseDocument>,
  ) {}

  async create(data: Partial<Expense>): Promise<ExpenseDocument> {
    return new this.expenseModel(data).save();
  }

  async findAll(): Promise<ExpenseDocument[]> {
    return this.expenseModel.find().exec();
  }

  async findByYear(year: number): Promise<ExpenseDocument[]> {
    return this.expenseModel.find({ year }).exec();
  }

  async findById(id: string): Promise<ExpenseDocument | null> {
    return this.expenseModel.findById(id).exec();
  }

  async update(id: string, data: Partial<Expense>): Promise<ExpenseDocument> {
    const exp = await this.expenseModel.findById(id);
    if (!exp) throw new NotFoundException('Utgift hittades inte');
    Object.assign(exp, data);
    return exp.save();
  }

  async delete(id: string): Promise<void> {
    await this.expenseModel.findByIdAndDelete(id);
  }
}
