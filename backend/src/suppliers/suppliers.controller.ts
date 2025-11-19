import { Controller, Get, Post, Body, Param, Delete, Put, Query, BadRequestException, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SuppliersService } from './suppliers.service';

@UseGuards(JwtAuthGuard)
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  async create(@Req() req, @Body() body: { name: string, categoryId: string }) {
    try {
      console.log('[SuppliersController] req.user:', req.user, 'body:', body);
      if (!body || typeof body.name !== 'string' || !body.name.trim()) {
        throw new BadRequestException('Leverantörsnamn krävs');
      }
      if (!body.categoryId) {
        throw new BadRequestException('Kategori måste anges');
      }
      return await this.suppliersService.create(body.name.trim(), body.categoryId, req.user.userId);
    } catch (err) {
      console.error('[SuppliersController] create error:', err);
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException('Kunde inte skapa leverantör: ' + (err.message || 'Okänt fel'));
    }
  }

  @Get()
  async findAll(@Req() req, @Query('categoryId') categoryId?: string) {
    console.log('[SuppliersController] req.user:', req.user);
    return this.suppliersService.findAll(req.user.userId, categoryId);
  }

  @Get(':id')
  async findById(@Req() req, @Param('id') id: string) {
    return this.suppliersService.findById(id, req.user.userId);
  }

  @Put(':id')
  async update(@Req() req, @Param('id') id: string, @Body() body: { name: string, category: string }) {
    return this.suppliersService.update(id, body.name, body.category, req.user.userId);
  }
  @Get('category/:category')
  async findByCategory(@Param('category') category: string) {
    return this.suppliersService.findByCategory(category);
  }

  @Delete(':id')
  async delete(@Req() req, @Param('id') id: string) {
    await this.suppliersService.delete(id, req.user.userId);
    return { message: 'Leverantör borttagen' };
  }
}
