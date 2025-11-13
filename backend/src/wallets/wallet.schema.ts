import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WalletDocument = Wallet & Document;

@Schema()
export class Wallet {
  @Prop({ required: true })
  name: string;

    @Prop({ required: false, index: true })
    organizationId?: string;

  @Prop({ required: true })
  userId: string;

  @Prop()
  balance: number;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);
