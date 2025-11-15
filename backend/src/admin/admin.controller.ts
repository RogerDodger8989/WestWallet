import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { AdminService } from './admin.service';
import type { User } from './admin.service';

@Controller('admin/users')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  async getUsers(): Promise<User[]> {
    return this.adminService.getUsers();
  }

  @Post()
  async createUser(@Body() user: any): Promise<User> {
    return this.adminService.createUser(user);
  }

  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() user: any): Promise<User | undefined> {
    return this.adminService.updateUser(id, user);
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string): Promise<boolean> {
    return this.adminService.deleteUser(id);
  }
}
