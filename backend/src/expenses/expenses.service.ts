import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { AuditLogService } from '../common/auditlog.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Expense, ExpenseDocument } from './expense.schema';

@Injectable()
export class ExpensesService {
      // Offline sync: hämta utgifter ändrade sedan viss tidpunkt
      async findChangedSince(since: Date, userId: string): Promise<ExpenseDocument[]> {
        return this.expenseModel.find({ updatedAt: { $gte: since }, userId }).exec();
      }
    // Statistik: summera utgifter per kategori och månad
    async getStatsByCategoryAndMonth(year: number, userId: string) {
      const stats = await this.expenseModel.aggregate([
        { $match: { year, userId } },
        { $group: {
            _id: { category: '$category', month: '$month' },
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.category': 1, '_id.month': 1 } }
      ]);
      // WebSocket: skicka event till alla klienter
      this.wsGateway?.sendEvent('dashboardStats', { year, stats });
      return stats;
    }
  async restore(body: any, userId: string): Promise<ExpenseDocument | null> {
    // Exempel: återställ en post genom att sätta isDeleted = false
    if (!body.id) throw new NotFoundException('ID saknas');
    return this.expenseModel.findOneAndUpdate({ _id: body.id, userId }, { isDeleted: false }, { new: true }).exec();
  }
  constructor(
    @InjectModel(Expense.name) private readonly expenseModel: Model<ExpenseDocument>,
    @Inject(forwardRef(() => AuditLogService)) private readonly auditLogService: AuditLogService,
    @Inject('WsGateway') private readonly wsGateway: any,
  ) {}

  async create(data: Partial<Expense>): Promise<ExpenseDocument> {
    // Generera displayId som löpnummer med prefix 'A' och fem siffror
    if (!data.displayId) {
      const last = await this.expenseModel.findOne({ userId: data.userId }, {}, { sort: { displayId: -1 } });
      let nextNum = 1;
      if (last && last.displayId && /^A\d{5}$/.test(last.displayId)) {
        nextNum = parseInt(last.displayId.slice(1), 10) + 1;
      }
      data.displayId = `A${nextNum.toString().padStart(5, '0')}`;
    }
    const doc = await new this.expenseModel(data).save();
    await this.auditLogService?.log({
      action: 'create',
      model: 'Expense',
      documentId: doc._id ? doc._id.toString() : '',
      changes: data,
    });
    // WebSocket: skicka event till alla klienter
    this.wsGateway?.sendEvent('expenseCreated', { expense: doc });
    return doc;
  }

  async findAll(userId: string): Promise<ExpenseDocument[]> {
    const items = await this.expenseModel.find({ userId }).exec();
    // Use import for imageConfig
    // Fallback to defaultPath if localPath is undefined
    const { imageConfig } = require('../config/image.config');
    const fs = require('fs');
    const path = require('path');
    const basePath = imageConfig.localPath || imageConfig.defaultPath;
    return items.map((item: any) => {
      let displayId = item.displayId || item._id?.toString();
      if (!displayId) return { ...item.toObject(), images: [] };
      const dir = path.join(basePath, displayId);
      let images: string[] = [];
      if (fs.existsSync(dir)) {
        images = fs.readdirSync(dir).map((f: string) => `/uploads/${displayId}/${f}`);
      }
      return { ...item.toObject(), images };
    });
  }

  async findByYear(year: number, userId: string): Promise<ExpenseDocument[]> {
    return this.expenseModel.find({ year, userId }).exec();
  }

  async findById(id: string, userId: string): Promise<ExpenseDocument | null> {
    return this.expenseModel.findOne({ _id: id, userId }).exec();
  }

  async update(id: string, data: Partial<Expense>, userId: string): Promise<ExpenseDocument> {
    const exp = await this.expenseModel.findOne({ _id: id, userId });
    if (!exp) {
      const error: any = new NotFoundException('Utgift hittades inte');
      error.errorCode = 'EXPENSE_NOT_FOUND';
      throw error;
    }
    const before = { ...exp.toObject() };
    Object.assign(exp, data);
    const updated = await exp.save();
    await this.auditLogService?.log({
      action: 'update',
      model: 'Expense',
      documentId: id,
      changes: { before, after: updated.toObject() },
    });
    // WebSocket: skicka event till alla klienter
    this.wsGateway?.sendEvent('expenseUpdated', { expense: updated });
    return updated;
  }

  async delete(id: string, userId: string): Promise<void> {
    const doc = await this.expenseModel.findOneAndDelete({ _id: id, userId });
    await this.auditLogService?.log({
      action: 'delete',
      model: 'Expense',
      documentId: id,
      changes: doc?.toObject(),
    });
    // WebSocket: skicka event till alla klienter
    this.wsGateway?.sendEvent('expenseDeleted', { expenseId: id });
  }
}
