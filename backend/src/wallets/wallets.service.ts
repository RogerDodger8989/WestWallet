import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Wallet, WalletDocument } from './wallet.schema';

@Injectable()
export class WalletsService {
  constructor(@InjectModel(Wallet.name) private walletModel: Model<WalletDocument>) {}

  async findAll() {
    return this.walletModel.find().exec();
  }

  async findOne(id: string) {
    return this.walletModel.findById(id).exec();
  }

  async create(wallet: Partial<Wallet>) {
    const created = new this.walletModel(wallet);
    return created.save();
  }

  async update(id: string, wallet: Partial<Wallet>) {
    return this.walletModel.findByIdAndUpdate(id, wallet, { new: true }).exec();
  }

  async remove(id: string) {
    return this.walletModel.findByIdAndDelete(id).exec();
  }
}
