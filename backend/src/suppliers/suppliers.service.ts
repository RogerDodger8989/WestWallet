import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Supplier, SupplierDocument } from './supplier.schema';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectModel(Supplier.name) private readonly supplierModel: Model<SupplierDocument>,
  ) {}

  async create(name: string, categoryId: string): Promise<SupplierDocument> {
    const exists = await this.supplierModel.findOne({ name, categoryId });
    if (exists) throw new BadRequestException('Leverantör finns redan');
    // Generera displayId
    const last = await this.supplierModel.findOne().sort({ displayId: -1 });
    let nextId = 'S000001';
    if (last && last.displayId) {
      const num = parseInt(last.displayId.slice(1)) + 1;
      nextId = 'S' + num.toString().padStart(6, '0');
    }
    return new this.supplierModel({ name, categoryId, displayId: nextId }).save();
  }

  async findAll(categoryId?: string): Promise<SupplierDocument[]> {
    if (categoryId) {
      return this.supplierModel.find({ categoryId }).exec();
    }
    return this.supplierModel.find().exec();
  }

  async findById(id: string): Promise<SupplierDocument | null> {
    return this.supplierModel.findById(id).exec();
  }

  async update(id: string, name: string, categoryId: string): Promise<SupplierDocument> {
    const sup = await this.supplierModel.findById(id);
    if (!sup) {
      const error: any = new NotFoundException('Leverantör hittades inte');
      error.errorCode = 'SUPPLIER_NOT_FOUND';
      throw error;
    }
    sup.name = name;
    sup.categoryId = categoryId;
    return sup.save();
  }
  async findByCategory(category: string): Promise<SupplierDocument[]> {
    return this.supplierModel.find({ category }).exec();
  }

  async delete(id: string): Promise<void> {
    await this.supplierModel.findByIdAndDelete(id);
  }
}
