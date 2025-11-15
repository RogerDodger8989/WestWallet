import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './category.schema';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  async create(name: string): Promise<CategoryDocument> {
    // Dublettkontroll
    const exists = await this.categoryModel.findOne({ name });
    if (exists) throw new BadRequestException('Kategori finns redan');
    // Generera displayId
    const last = await this.categoryModel.findOne().sort({ displayId: -1 });
    let nextId = 'A000001';
    if (last && last.displayId) {
      const num = parseInt(last.displayId.slice(1)) + 1;
      nextId = 'A' + num.toString().padStart(6, '0');
    }
    return new this.categoryModel({ name, displayId: nextId }).save();
  }

  async findAll(): Promise<CategoryDocument[]> {
    return this.categoryModel.find().exec();
  }

  async findById(id: string): Promise<CategoryDocument | null> {
    return this.categoryModel.findById(id).exec();
  }

  async update(id: string, name: string): Promise<CategoryDocument> {
    const cat = await this.categoryModel.findById(id);
    if (!cat) {
      const error: any = new NotFoundException('Kategori hittades inte');
      error.errorCode = 'CATEGORY_NOT_FOUND';
      throw error;
    }
    cat.name = name;
    return cat.save();
  }

  async delete(id: string): Promise<void> {
    await this.categoryModel.findByIdAndDelete(id);
  }
}
