import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SupplierDocument = Supplier & Document;

@Schema()
export class Supplier {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  category: string;
}

export const SupplierSchema = SchemaFactory.createForClass(Supplier);
