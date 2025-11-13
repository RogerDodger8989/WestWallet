import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Expense, ExpenseDocument } from './expense.schema';

@Injectable()
export class ExpensesService {
    // Statistik: summera utgifter per kategori och månad
    async getStatsByCategoryAndMonth(year: number) {
      return this.expenseModel.aggregate([
        { $match: { year } },
        { $group: {
            _id: { category: '$category', month: '$month' },
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.category': 1, '_id.month': 1 } }
      ]);
    }
  constructor(
    @InjectModel(Expense.name) private readonly expenseModel: Model<ExpenseDocument>,
    @Inject('AuditLogService') private readonly auditLogService: any,
  ) {}

  async create(data: Partial<Expense>): Promise<ExpenseDocument> {
    const doc = await new this.expenseModel(data).save();
    await this.auditLogService?.log({
      userId: data.userId,
      action: 'create',
      model: 'Expense',
      documentId: doc._id,
      changes: data,
    });
    return doc;
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
    if (!exp) {
      const error: any = new NotFoundException('Utgift hittades inte');
      error.errorCode = 'EXPENSE_NOT_FOUND';
      throw error;
    }
    const before = { ...exp.toObject() };
    Object.assign(exp, data);
    const updated = await exp.save();
    await this.auditLogService?.log({
      userId: data.userId,
      action: 'update',
      model: 'Expense',
      documentId: id,
      changes: { before, after: updated.toObject() },
    });
    return updated;
  }

  async delete(id: string): Promise<void> {
    const doc = await this.expenseModel.findByIdAndDelete(id);
    await this.auditLogService?.log({
      action: 'delete',
      model: 'Expense',
      documentId: id,
      changes: doc?.toObject(),
    });
  }
}
