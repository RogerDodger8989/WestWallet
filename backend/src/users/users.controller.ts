import {
  Controller,
  Get,
  UseGuards,
  Req,
  Patch,
  Param,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UsersService } from './users.service';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Inloggad användare hämtar sin profil
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'admin')
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Hämta inloggad användare' })
  @ApiResponse({ status: 200, description: 'Returnerar användardata' })
  async getMe(@Req() req: any) {
    const user = await this.usersService.findById(req.user.userId);
    if (!user) return { message: 'Användare hittades inte' };

    const obj = user.toObject();
    delete obj.password;
    delete obj.refreshTokenHash;
    delete obj.resetPasswordToken;
    delete obj.resetPasswordExpires;
    delete obj.verificationToken;
    delete obj.verificationTokenExpires;

    return obj;
  }

  // Endast admin: lista alla användare
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
    }));
  }

  // Endast admin: ändra roll
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @Patch(':id/role')
  @ApiOperation({ summary: 'Ändra roll för användare (endast admin)' })
  async updateUserRole(
    @Param('id') userId: string,
    @Body('role') role: string,
  ) {
    if (!['user', 'admin'].includes(role)) {
      throw new BadRequestException('Ogiltig roll');
    }

    const updated = await this.usersService.updateUserRole(userId, role);
    return { id: updated._id, email: updated.email, role: updated.role };
  }
}
