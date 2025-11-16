import { Controller, Get, Patch, Body } from '@nestjs/common';
import { imageCategories } from './image-categories.config';
import { UpdateImageCategoryDto } from './image-categories-update.dto';

@Controller('image-categories')
export class ImageCategoriesController {
  @Get()
  getCategories() {
    return imageCategories;
  }

  @Patch()
  updateCategory(@Body() dto: UpdateImageCategoryDto) {
    const cat = imageCategories.find(c => c.key === dto.key);
    if (cat && dto.localPath) {
      cat.localPath = dto.localPath;
    }
    return cat;
  }
}
