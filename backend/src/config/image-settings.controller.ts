import { Controller, Get, Patch, Body } from '@nestjs/common';
import { imageConfig } from './image.config';
import { UpdateImageSettingsDto } from './image-settings-update.dto';

@Controller('image-settings')
export class ImageSettingsController {
  @Get()
  getSettings() {
    return imageConfig;
  }

  @Patch()
  updateSettings(@Body() dto: UpdateImageSettingsDto) {
    if (dto.localPath) {
      imageConfig.localPath = dto.localPath;
    }
    return imageConfig;
  }
}
