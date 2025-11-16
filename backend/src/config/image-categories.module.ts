import { Module } from '@nestjs/common';
import { ImageCategoriesController } from './image-categories.controller';

@Module({
  controllers: [ImageCategoriesController],
})
export class ImageCategoriesModule {}
