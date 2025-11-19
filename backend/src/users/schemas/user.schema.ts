import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
      // Soft delete (papperskorg)
      @Prop({ default: false })
      isDeleted: boolean;

      @Prop({ default: null, type: Date })
      deletedAt: Date | null;
    @Prop({ type: Object, default: {} })
    preferences: any;

    @Prop({ required: true })
    passwordHash: string;

    @Prop({ default: Date.now })
    trialStart: Date;

    @Prop({ default: 30 })
    trialDaysLeft: number;

    @Prop({ default: false })
    isPaid: boolean;

    @Prop({ default: null })
    paymentMethod: string;
  @Prop({ required: true, unique: true })
  email: string;


  @Prop({ default: false })
  isVerified: boolean;

  @Prop()
  verificationToken?: string;

  @Prop()
  verificationTokenExpires?: Date;

  @Prop()
  resetPasswordToken?: string;

  @Prop()
  resetPasswordExpires?: Date;

  @Prop()
  refreshTokenHash?: string;

  // 👇 roll: user/admin
  @Prop({ default: 'user', enum: ['user', 'admin'] })
  role: string;

  // Mongoose timestamps
  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
