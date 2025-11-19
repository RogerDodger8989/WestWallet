import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ExpenseDocument = Expense & Document;

@Schema()
export class Expense {
    @Prop({ required: true, index: true })
    userId: string;
  @Prop({ required: true })
  name: string;

  @Prop({ required: false, index: true })
  organizationId?: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true, unique: true })
  displayId: string;

  @Prop({ required: true })
  year: number;

  @Prop({ required: true })
  month: number;

  @Prop()
  category?: string;

  @Prop()
  supplier?: string;

  @Prop()
  note?: string;
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense);


