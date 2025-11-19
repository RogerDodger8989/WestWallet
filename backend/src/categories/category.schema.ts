import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema()
export class Category {
    @Prop({ required: true, index: true })
    userId: string;
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true, unique: true })
  displayId: string;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
