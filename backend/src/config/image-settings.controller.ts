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
    if (dto.localPath && dto.localPath !== imageConfig.localPath) {
      const fs = require('fs');
      const path = require('path');
      const oldPath = imageConfig.localPath;
      const newPath = dto.localPath;
      // Flytta alla undermappar och filer från gamla till nya mappen
      if (fs.existsSync(oldPath)) {
        const subdirs = fs.readdirSync(oldPath);
        for (const subdir of subdirs) {
          const oldSubdir = path.join(oldPath, subdir);
          const newSubdir = path.join(newPath, subdir);
          if (fs.lstatSync(oldSubdir).isDirectory()) {
            fs.mkdirSync(newSubdir, { recursive: true });
            const files = fs.readdirSync(oldSubdir);
            for (const file of files) {
              const oldFile = path.join(oldSubdir, file);
              const newFile = path.join(newSubdir, file);
              if (!fs.existsSync(newFile)) {
                fs.renameSync(oldFile, newFile);
              }
            }
          }
        }
      }
      imageConfig.localPath = newPath;
    }
    return imageConfig;
  }
}
