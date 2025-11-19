import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Supplier, SupplierDocument } from './supplier.schema';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectModel(Supplier.name) private readonly supplierModel: Model<SupplierDocument>,
  ) {}

  async create(name: string, categoryId: string, userId: string): Promise<SupplierDocument> {
    try {
      if (!name || !categoryId) {
        console.error('Missing name or categoryId:', { name, categoryId });
        throw new BadRequestException('Namn och kategori måste anges');
      }
      // Dublettkontroll: returnera existerande om exakt samma finns
      const exists = await this.supplierModel.findOne({ name, categoryId, userId });
      if (exists) {
        console.log('Supplier already exists, returning existing:', exists);
        return exists;
      }
      // Generera displayId
      const last = await this.supplierModel.findOne({ userId }).sort({ displayId: -1 });
      let nextId = 'S000001';
      if (last && last.displayId) {
        const num = parseInt(last.displayId.slice(1)) + 1;
        nextId = 'S' + num.toString().padStart(6, '0');
      }
      const supplier = new this.supplierModel({ name, categoryId, displayId: nextId, userId });
      const saved = await supplier.save();
      console.log('Supplier created:', saved);
      return saved;
    } catch (error) {
      console.error('Error creating supplier:', error);
      throw error;
    }
  }

  async findAll(userId: string, categoryId?: string): Promise<SupplierDocument[]> {
    if (categoryId) {
      return this.supplierModel.find({ userId, categoryId }).exec();
    }
    return this.supplierModel.find({ userId }).exec();
  }

  async findById(id: string, userId: string): Promise<SupplierDocument | null> {
    return this.supplierModel.findOne({ _id: id, userId }).exec();
  }

  async update(id: string, name: string, categoryId: string, userId: string): Promise<SupplierDocument> {
    const sup = await this.supplierModel.findOne({ _id: id, userId });
    if (!sup) {
      throw new NotFoundException('Supplier not found');
    }
    sup.name = name;
    sup.categoryId = categoryId;
    return sup.save();
  }
  async findByCategory(category: string): Promise<SupplierDocument[]> {
    return this.supplierModel.find({ category }).exec();
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.supplierModel.findOneAndDelete({ _id: id, userId });
  }
}
