import {
  Controller,
  Get,
  UseGuards,
  Req,
  Patch,
  Param,
  Body,
  Delete,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UserDocument } from './schemas/user.schema';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Users')
@Controller('users')
export class UsersController {
        // Soft delete user (move to trash)
        @UseGuards(JwtAuthGuard, RolesGuard)
        @Roles('admin')
        @ApiBearerAuth()
        @Delete(':id')
        @ApiOperation({ summary: 'Soft delete user (move to trash)' })
        async softDeleteUser(@Param('id') id: string) {
          const user = await this.usersService.softDeleteUser(id);
          if (!user) throw new NotFoundException('User not found or already deleted');
          return { success: true };
        }

        // Restore user from trash
        @UseGuards(JwtAuthGuard, RolesGuard)
        @Roles('admin')
        @ApiBearerAuth()
        @Patch('restore/:id')
        @ApiOperation({ summary: 'Restore user from trash' })
        async restoreUser(@Param('id') id: string) {
          const user = await this.usersService.restoreUser(id);
          if (!user) throw new NotFoundException('User not found or not deleted');
          return { success: true };
        }

        // List deleted users (trash)
        @UseGuards(JwtAuthGuard, RolesGuard)
        @Roles('admin')
        @ApiBearerAuth()
        @Get('trash')
        @ApiOperation({ summary: 'List deleted users (trash)' })
        async listDeletedUsers() {
          return this.usersService.listDeletedUsers();
        }
    // Hämta användarens inställningar
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('user', 'admin')
    @ApiBearerAuth()
    @Get('me/preferences')
    @ApiOperation({ summary: 'Hämta användarens inställningar' })
    async getPreferences(@Req() req: any) {
      const user = await this.usersService.findById(req.user.userId);
      if (!user) throw new NotFoundException('Användaren hittades inte');
      return user.preferences || {};
    }

    // Uppdatera användarens inställningar
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('user', 'admin')
    @ApiBearerAuth()
    @Patch('me/preferences')
    @ApiOperation({ summary: 'Uppdatera användarens inställningar' })
    async updatePreferences(@Req() req: any, @Body() prefs: any) {
      const user = await this.usersService.findById(req.user.userId);
      if (!user) throw new NotFoundException('Användaren hittades inte');
      user.preferences = { ...user.preferences, ...prefs };
      await user.save();
      return user.preferences;
    }
  constructor(private readonly usersService: UsersService) {}

  // Hämta inloggad användare
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'admin')
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Hämta aktuell användares profil' })
  @ApiResponse({ status: 200, description: 'Returnerar användarens information' })
  async getMe(@Req() req: any) {
    const user = await this.usersService.findById(req.user.userId);
    if (!user) throw new NotFoundException('Användaren hittades inte');

    const obj = user.toObject ? user.toObject() : user;
    delete obj.password;
    delete obj.refreshTokenHash;
    delete obj.resetPasswordToken;
    delete obj.resetPasswordExpires;
    delete obj.verificationToken;
    delete obj.verificationTokenExpires;

    return obj;
  }

  // Lista alla användare (endast admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @Get('all')
  @ApiOperation({ summary: 'Lista alla användare (endast admin)' })
  async getAll() {
    const users = await this.usersService.findAll();
    return users.map((u) => ({
      id: u._id,
      email: u.email,
      role: u.role,
      verified: u.isVerified,
      createdAt: u.createdAt,
    }));
  }

  // Ändra roll (endast admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @Patch(':id/role')
  @ApiOperation({ summary: 'Ändra roll på användare (endast admin)' })
  @ApiResponse({ status: 200, description: 'Roll uppdaterad' })
  async updateRole(
    @Param('id') userId: string,
    @Body('role') role: string,
  ) {
    if (!['user', 'admin'].includes(role)) {
      throw new BadRequestException('Ogiltig roll');
    }

    const updated = await this.usersService.updateUserRole(userId, role);
    return {
      id: updated._id,
      email: updated.email,
      role: updated.role,
    };
  }

  // Markera som verifierad (endast admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @Patch(':id/verify')
  @ApiOperation({ summary: 'Markera användare som verifierad (endast admin)' })
  @ApiResponse({ status: 200, description: 'Användare verifierad' })
  async verifyUser(@Param('id') userId: string) {
    const updated = await this.usersService.verifyUserManually(userId);
    return {
      id: updated._id,
      email: updated.email,
      verified: updated.isVerified,
    };
  }

  // Ta bort användare (endast admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Ta bort användare (endast admin)' })
  @ApiResponse({ status: 200, description: 'Användare borttagen' })
  async deleteUser(@Param('id') userId: string) {
    await this.usersService.deleteUser(userId);
    return { message: 'Användaren har tagits bort' };
  }
}
