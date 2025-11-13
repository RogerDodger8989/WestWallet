import { Injectable } from '@nestjs/common';
import Device from './device.schema';

@Injectable()
export class DevicesService {
  async registerDevice({ userId, deviceId, deviceName, ip, sessionId }: {
    userId: string;
    deviceId: string;
    deviceName?: string;
    ip?: string;
    sessionId?: string;
  }) {
    await Device.findOneAndUpdate(
      { userId, deviceId },
      { deviceName, ip, lastActive: new Date(), sessionId },
      { upsert: true, new: true }
    );
  }

  async getDevices(userId: string) {
    return Device.find({ userId }).sort({ lastActive: -1 }).exec();
  }

  async logoutDevice(userId: string, deviceId: string) {
    await Device.deleteOne({ userId, deviceId });
  }
}
