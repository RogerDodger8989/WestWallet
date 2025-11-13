import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { DevicesService } from './devices.service';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post('register')
  async registerDevice(@Body() body: any) {
    await this.devicesService.registerDevice(body);
    return { success: true };
  }

  @Get(':userId')
  async getDevices(@Param('userId') userId: string) {
    return this.devicesService.getDevices(userId);
  }

  @Delete(':userId/:deviceId')
  async logoutDevice(@Param('userId') userId: string, @Param('deviceId') deviceId: string) {
    await this.devicesService.logoutDevice(userId, deviceId);
    return { success: true };
  }
}
