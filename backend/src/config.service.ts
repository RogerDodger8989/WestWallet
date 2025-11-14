import { Injectable } from '@nestjs/common';
import Config from '../models/config.schema';

@Injectable()
export class ConfigService {
  async getConfig() {
    return Config.findOne().lean();
  }

  async updateConfig(data: any) {
    return Config.findOneAndUpdate({}, { ...data, updatedAt: new Date() }, { upsert: true, new: true });
  }
}
