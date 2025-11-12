import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';

@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  async create(@Body() body: { name: string, category: string }) {
  console.log('REQ BODY:', body);
  return this.suppliersService.create(body.name, body.category);
  }

  @Get()
  async findAll() {
    return this.suppliersService.findAll();
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
