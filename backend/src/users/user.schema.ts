import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: false, index: true })
  organizationId?: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ default: 'user' })
  role: string; // 'user', 'admin', 'moderator'

  @Prop({ type: [String], default: ['user'] })
  roles: string[]; // ['user', 'admin', 'moderator']

  @Prop({ default: Date.now })
  trialStart: Date;

  @Prop({ default: 30 })
  trialDaysLeft: number;

  @Prop({ default: false })
  isPaid: boolean;

  @Prop({ default: null })
  paymentMethod: string;

  @Prop({ type: [Object], default: [] })
  paymentHistory: any[];

  @Prop({ type: Object, default: {} })
  preferences: any;

  // Exempel på preferences:
  // {
  //   notifications: { ... },
  //   ui: { theme: 'dark' },
  //   trash: { undoTimeout: 10 }
  // }
}

export const UserSchema = SchemaFactory.createForClass(User);
