import { Controller, Post, Param, Body, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users/users.service';
import { AuthService } from './auth/auth.service';

@Controller('admin/impersonate')
export class AdminImpersonateController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  // Admin impersonates a user by userId, returns JWT for that user
  @Post(':userId')
  async impersonate(@Param('userId') userId: string, @Body('adminId') adminId: string) {
    // Check if adminId is an admin
    const admin = await this.usersService.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      throw new ForbiddenException('Not authorized');
    }
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new ForbiddenException('User not found');
    }
    // Generate JWT for the user
    return this.authService.login(user);
  }
}
