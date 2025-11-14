import { Schema, model } from 'mongoose';

export const configSchema = new Schema({
  trialDays: { type: Number, default: 30 },
  prices: {
    basic: { type: Number, default: 0 },
    premium: { type: Number, default: 99 },
  },
  maxFileSize: { type: Number, default: 10 * 1024 * 1024 }, // 10 MB
  notifications: { type: Boolean, default: true },
  maxUsersPerOrg: { type: Number, default: 10 },
  updatedAt: { type: Date, default: Date.now },
});

export default model('Config', configSchema);
