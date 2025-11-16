import { Controller, Post, Get, Delete, Param, UploadedFiles, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { imageConfig } from '../config/image.config';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

@Controller('expenses/:id/images')
export class ImagesController {
  @Post()
  @UseInterceptors(FilesInterceptor('images'))
  async uploadImages(@Param('id') id: string, @UploadedFiles() files: Express.Multer.File[]) {
    if (imageConfig.storage !== 'local') throw new BadRequestException('Endast lokal lagring är implementerad');
    const dir = path.join(imageConfig.localPath, id);
    fs.mkdirSync(dir, { recursive: true });
    const saved: string[] = [];
    for (const file of files) {
      let buffer = file.buffer;
      if (imageConfig.compress) {
        buffer = await sharp(buffer).resize(800).jpeg({ quality: 70 }).toBuffer();
      }
      const filename = `${Date.now()}_${file.originalname}`;
      const filepath = path.join(dir, filename);
      fs.writeFileSync(filepath, buffer);
      saved.push(`/uploads/${id}/${filename}`);
    }
    return { images: saved };
  }

  @Get()
  async getImages(@Param('id') id: string) {
    const dir = path.join(imageConfig.localPath, id);
    if (!fs.existsSync(dir)) return { images: [] };
    const files = fs.readdirSync(dir);
    return { images: files.map(f => `/uploads/${id}/${f}`) };
  }

  @Delete(':imageId')
  async deleteImage(@Param('id') id: string, @Param('imageId') imageId: string) {
    const filepath = path.join(imageConfig.localPath, id, imageId);
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    return { success: true };
  }
}
