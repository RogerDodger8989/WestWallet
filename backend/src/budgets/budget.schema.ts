import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BudgetDocument = Budget & Document;

@Schema()
export class Budget {
  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  category: Types.ObjectId;

  @Prop({ required: true })
  year: number;

  @Prop({ required: true })
  amount: number;
}

export const BudgetSchema = SchemaFactory.createForClass(Budget);
