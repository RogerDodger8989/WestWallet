import { Schema, model } from 'mongoose';

export const DeviceSchema = new Schema({
  userId: { type: String, required: true },
  deviceId: { type: String, required: true },
  deviceName: { type: String },
  ip: { type: String },
  lastActive: { type: Date, default: Date.now },
  sessionId: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default model('Device', DeviceSchema);
