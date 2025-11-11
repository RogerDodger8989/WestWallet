import {
  Controller,
  Post,
  Body,
  BadRequestException,
  UseGuards,
  Get,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Auth') // 📘 Gruppnamn i Swagger
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrera ny användare' })
  @ApiResponse({ status: 201, description: 'Registrering lyckades.' })
  async register(@Body() body: { email: string; password: string }) {
    const { email, password } = body;
    if (!email || !password) throw new BadRequestException('Email och lösenord krävs');
    return this.authService.register(email, password);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Skicka e-post för återställning av lösenord' })
  async forgotPassword(@Body('email') email: string) {
    if (!email) throw new BadRequestException('Email krävs');
    return this.authService.forgotPassword(email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Återställ lösenord med token' })
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    if (!body.token || !body.newPassword)
      throw new BadRequestException('Token och nytt lösenord krävs');
    return this.authService.resetPassword(body.token, body.newPassword);
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Verifiera e-postadress' })
  async verifyEmail(@Body('token') token: string) {
    if (!token) throw new BadRequestException('Token krävs');
    return this.authService.verifyEmail(token);
  }

  @Post('login')
  @ApiOperation({ summary: 'Logga in och få access + refresh tokens' })
  async login(@Body() body: { email: string; password: string }) {
    const { email, password } = body;
    if (!email || !password) throw new BadRequestException('Email och lösenord krävs');
    const user = await this.authService.validateUser(email, password);
    if (!user) throw new BadRequestException('Ogiltiga inloggningsuppgifter');
    return this.authService.login(user);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth() // 📘 kräver JWT-token i Swagger
  @Get('me')
  @ApiOperation({ summary: 'Hämta inloggad användare' })
  getMe(@Req() req: any) {
    return req.user;
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Få nya tokens via refresh token' })
  async refresh(@Body() body: { userId: string; refresh_token: string }) {
    const { userId, refresh_token } = body;
    if (!userId || !refresh_token)
      throw new BadRequestException('userId och refresh_token krävs');
    return this.authService.refreshTokens(userId, refresh_token);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('logout')
  @ApiOperation({ summary: 'Logga ut användare (rensa refresh-token)' })
  async logout(@Req() req: any) {
    return this.authService.logout(req.user.userId);
  }
}
