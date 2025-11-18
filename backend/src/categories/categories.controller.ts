import { Controller, Get, Post, Body, Param, Delete, Put, BadRequestException } from '@nestjs/common';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  async create(@Body() body: { name?: string }) {
    if (!body || typeof body.name !== 'string' || !body.name.trim()) {
      throw new BadRequestException('Kategori-namn krävs');
    }
    return await this.categoriesService.create(body.name.trim());
  }

  @Get()
  async findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.categoriesService.findById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: { name: string }) {
    return this.categoriesService.update(id, body.name);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.categoriesService.delete(id);
    return { message: 'Kategori borttagen' };
  }
}
