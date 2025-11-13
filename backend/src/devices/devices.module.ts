import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DeviceSchema } from './device.schema';
import { DevicesService } from './devices.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Device', schema: DeviceSchema }]),
  ],
  providers: [DevicesService],
  exports: [DevicesService],
})
export class DevicesModule {}
