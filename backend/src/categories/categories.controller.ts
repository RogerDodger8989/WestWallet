import { Controller, Get, Post, Body, Param, Delete, Put, BadRequestException, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CategoriesService } from './categories.service';

@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  async create(@Req() req, @Body() body: { name?: string }) {
    try {
      console.log('[CategoriesController] req.user:', req.user, 'body:', body);
      if (!body || typeof body.name !== 'string' || !body.name.trim()) {
        throw new BadRequestException('Kategori-namn krävs');
      }
      return await this.categoriesService.create(body.name.trim(), req.user.userId);
    } catch (err) {
      console.error('[CategoriesController] create error:', err);
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException('Kunde inte skapa kategori: ' + (err.message || 'Okänt fel'));
    }
  }

  @Get()
  async findAll(@Req() req) {
    console.log('[CategoriesController] req.user:', req.user);
    return this.categoriesService.findAll(req.user.userId);
  }

  @Get(':id')
  async findById(@Req() req, @Param('id') id: string) {
    return this.categoriesService.findById(id, req.user.userId);
  }

  @Put(':id')
  async update(@Req() req, @Param('id') id: string, @Body() body: { name: string }) {
    return this.categoriesService.update(id, body.name, req.user.userId);
  }

  @Delete(':id')
  async delete(@Req() req, @Param('id') id: string) {
    await this.categoriesService.delete(id, req.user.userId);
    return { message: 'Kategori borttagen' };
  }
}
