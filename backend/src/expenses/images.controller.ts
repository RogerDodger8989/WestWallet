import { Controller, Post, Get, Delete, Param, UploadedFiles, UseInterceptors, BadRequestException } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { imageConfig } from '../config/image.config';
import { imageCategories } from '../config/image-categories.config';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

@Controller('expenses/:id/images')
export class ImagesController {
  constructor(private readonly expensesService: ExpensesService) {}
  @Post()
  @UseInterceptors(FilesInterceptor('images'))
  async uploadImages(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Param('category') category?: string
  ) {
    if (imageConfig.storage !== 'local') throw new BadRequestException('Endast lokal lagring är implementerad');
    let basePath = imageConfig.localPath;
    if (category) {
      const cat = imageCategories.find(c => c.key === category);
      if (cat && cat.localPath) basePath = cat.localPath;
    }
    // Hämta displayId för posten
    let displayId = id;
    try {
      const expense = await this.expensesService.findById(id);
      if (expense && expense.displayId) displayId = expense.displayId;
    } catch {}
    const dir = path.join(basePath, displayId);
    console.log('Försöker skapa mapp:', dir);
    try {
      fs.mkdirSync(dir, { recursive: true });
      console.log('Mapp skapad eller fanns redan:', dir);
    } catch (err) {
      console.error('Kunde inte skapa mapp:', dir, err);
      throw new BadRequestException('Kunde inte skapa mapp för bilder: ' + dir);
    }
    const saved: string[] = [];
    for (const file of files) {
      let buffer = file.buffer;
      try {
        if (imageConfig.compress) {
          buffer = await sharp(buffer).resize(800).jpeg({ quality: 70 }).toBuffer();
        }
      } catch (err) {
        console.error('Kunde inte komprimera bild:', file.originalname, err);
        throw new BadRequestException('Kunde inte komprimera bild: ' + file.originalname);
      }
      const filename = `${displayId}_${Date.now()}.jpg`;
      const filepath = path.join(dir, filename);
      try {
        fs.writeFileSync(filepath, buffer);
      } catch (err) {
        console.error('Kunde inte spara bild:', filepath, err);
        throw new BadRequestException('Kunde inte spara bild: ' + filepath);
      }
      saved.push(`/uploads/${displayId}/${filename}`);
    }
    return { images: saved };
  }

  @Get()
  async getImages(@Param('id') id: string, @Param('category') category?: string) {
    let basePath = imageConfig.localPath;
    if (category) {
      const cat = imageCategories.find(c => c.key === category);
      if (cat && cat.localPath) basePath = cat.localPath;
    }
    // Hämta displayId för posten
    let displayId = id;
    try {
      const expense = await this.expensesService.findById(id);
      if (expense && expense.displayId) displayId = expense.displayId;
    } catch {}
    const dir = path.join(basePath, displayId);
    if (!fs.existsSync(dir)) return { images: [] };
    const files = fs.readdirSync(dir);
    return { images: files.map(f => `/uploads/${displayId}/${f}`) };
  }

  @Delete(':imageId')
  async deleteImage(@Param('id') id: string, @Param('imageId') imageId: string, @Param('category') category?: string) {
    let basePath = imageConfig.localPath;
    if (category) {
      const cat = imageCategories.find(c => c.key === category);
      if (cat && cat.localPath) basePath = cat.localPath;
    }
    // Hämta displayId för posten
    let displayId = id;
    try {
      const expense = await this.expensesService.findById(id);
      if (expense && expense.displayId) displayId = expense.displayId;
    } catch {}
    const filepath = path.join(basePath, displayId, imageId);
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    return { success: true };
  }
}
