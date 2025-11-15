import { Controller, Get, Post, Body, Param, Delete, Put, Query, BadRequestException } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';

@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  async create(@Body() body: { name: string, categoryId: string }) {
    try {
      return await this.suppliersService.create(body.name, body.categoryId);
    } catch (error) {
      if (error instanceof BadRequestException) {
        return { statusCode: 400, message: error.message };
      }
      throw error;
    }
  }

  @Get()
  async findAll(@Query('categoryId') categoryId?: string) {
    return this.suppliersService.findAll(categoryId);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.suppliersService.findById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: { name: string, category: string }) {
    return this.suppliersService.update(id, body.name, body.category);
  }
  @Get('category/:category')
  async findByCategory(@Param('category') category: string) {
    return this.suppliersService.findByCategory(category);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.suppliersService.delete(id);
    return { message: 'Leverantör borttagen' };
  }
}
