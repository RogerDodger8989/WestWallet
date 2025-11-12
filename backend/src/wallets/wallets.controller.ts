import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { Wallet } from './wallet.schema';

@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get()
  findAll() {
    return this.walletsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.walletsService.findOne(id);
  }

  @Post()
  create(@Body() wallet: Partial<Wallet>) {
    return this.walletsService.create(wallet);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() wallet: Partial<Wallet>) {
    return this.walletsService.update(id, wallet);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.walletsService.remove(id);
  }
}
