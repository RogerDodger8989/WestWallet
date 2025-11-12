import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Supplier, SupplierDocument } from './supplier.schema';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectModel(Supplier.name) private readonly supplierModel: Model<SupplierDocument>,
  ) {}

  async create(name: string, category: string): Promise<SupplierDocument> {
    return new this.supplierModel({ name, category }).save();
  }

  async findAll(): Promise<SupplierDocument[]> {
    return this.supplierModel.find().exec();
  }

  async findById(id: string): Promise<SupplierDocument | null> {
    return this.supplierModel.findById(id).exec();
  }

  async update(id: string, name: string, category: string): Promise<SupplierDocument> {
    const sup = await this.supplierModel.findById(id);
    if (!sup) throw new NotFoundException('Leverantör hittades inte');
    sup.name = name;
    sup.category = category;
    return sup.save();
  }
  async findByCategory(category: string): Promise<SupplierDocument[]> {
    return this.supplierModel.find({ category }).exec();
  }

  async delete(id: string): Promise<void> {
    await this.supplierModel.findByIdAndDelete(id);
  }
}
