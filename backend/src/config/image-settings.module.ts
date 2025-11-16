import { Module } from '@nestjs/common';
import { ImageSettingsController } from './image-settings.controller';

@Module({
  controllers: [ImageSettingsController],
})
export class ImageSettingsModule {}
