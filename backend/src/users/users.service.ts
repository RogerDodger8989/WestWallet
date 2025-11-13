import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  // Skapa användare
  async createUser(
    email: string,
    passwordHash: string,
  ): Promise<UserDocument> {
    const createdUser = new this.userModel({
      email,
      passwordHash,
      role: 'user',
      preferences: {},
    });
    return createdUser.save();
  }

  // Hitta användare via e-post
  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email, isDeleted: false }).exec();
  }

  // Hitta användare via resetPasswordToken
  async findByResetPasswordToken(
    token: string,
  ): Promise<UserDocument | null> {
    return this.userModel.findOne({ resetPasswordToken: token }).exec();
  }

  // Hitta användare via ID
  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ _id: id, isDeleted: false }).exec();
  }

  // Soft delete user (move to trash)
  async softDeleteUser(id: string): Promise<UserDocument | null> {
    const user = await this.userModel.findById(id);
    if (!user || user.isDeleted) return null;
    user.isDeleted = true;
    user.deletedAt = new Date();
    await user.save();
    return user;
  }

  // Restore user from trash
  async restoreUser(id: string): Promise<UserDocument | null> {
    const user = await this.userModel.findById(id);
    if (!user || !user.isDeleted) return null;
    user.isDeleted = false;
    user.deletedAt = null;
    await user.save();
    return user;
  }

  // List deleted users (in trash)
  async listDeletedUsers(): Promise<UserDocument[]> {
    return this.userModel.find({ isDeleted: true }).exec();
  }

  // Lista alla användare (för admin)
  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().exec();
  }

  // Uppdatera lösenord
  async updatePassword(
    userId: string,
    passwordHash: string,
  ): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      const error: any = new NotFoundException('Användaren hittades inte');
      error.errorCode = 'USER_NOT_FOUND';
      throw error;
    }
    user.passwordHash = passwordHash;
    return user.save();
  }

  // Verifieringstoken
  async setVerificationToken(
    userId: string,
    token: string,
    expires: Date,
  ): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      verificationToken: token,
      verificationTokenExpires: expires,
    });
  }

  async findByVerificationToken(
    token: string,
  ): Promise<UserDocument | null> {
    return this.userModel.findOne({ verificationToken: token }).exec();
  }

  async clearVerificationToken(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      verificationToken: null,
      verificationTokenExpires: null,
    });
  }

  // Reset-lösenordstoken
  async setResetPasswordToken(
    userId: string,
    token: string,
    expires: Date,
  ): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      resetPasswordToken: token,
      resetPasswordExpires: expires,
    });
  }

  async clearResetPasswordToken(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });
  }

  // Refresh token-hantering
  async updateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const hashed = await bcrypt.hash(refreshToken, 10);
    await this.userModel.findByIdAndUpdate(userId, {
      refreshTokenHash: hashed,
    });
  }

  async removeRefreshToken(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      refreshTokenHash: null,
    });
  }

  async validateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<boolean> {
    const user = await this.userModel.findById(userId);
    if (!user || !user.refreshTokenHash) return false;
    return bcrypt.compare(refreshToken, user.refreshTokenHash);
  }

  // 🧑‍💼 Ändra roll (admin)
  async updateUserRole(userId: string, role: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      const error: any = new NotFoundException('Användaren hittades inte');
      error.errorCode = 'USER_NOT_FOUND';
      throw error;
    }
    user.role = role;
    return user.save();
  }

  // 🗑️ Ta bort användare (admin)
  async deleteUser(userId: string): Promise<void> {
    const deleted = await this.userModel.findByIdAndDelete(userId).exec();
    if (!deleted) {
      const error: any = new NotFoundException('Användaren hittades inte');
      error.errorCode = 'USER_NOT_FOUND';
      throw error;
    }
  }

  // ✅ Manuell verifiering av användare (admin)
  async verifyUserManually(userId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      const error: any = new NotFoundException('Användaren hittades inte');
      error.errorCode = 'USER_NOT_FOUND';
      throw error;
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;

    return user.save();
  }
}
