import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Get,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RefreshTokenGuard } from './refresh-token.guard';
import type { Request } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Registrera ny användare (skickar verifieringsmail)',
  })
  async register(@Body() body: { email: string; password: string }) {
    return this.authService.register(body.email, body.password);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verifiera e-post (via POST, token i body)' })
  async verifyEmail(@Body() body: { token: string }) {
    return this.authService.verifyEmail(body.token);
  }

  @Get('verify-email')
  @ApiOperation({
    summary: 'Verifiera e-post direkt via länk (GET /auth/verify-email?token=...)',
  })
  async verifyEmailDirect(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('login')
  @ApiOperation({ summary: 'Logga in och få access/refresh tokens' })
  async login(@Body() body: { email: string; password: string }) {
    const user = await this.authService.validateUser(body.email, body.password);
    return this.authService.login(user);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Skicka återställningslänk för lösenord' })
  async forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Återställ lösenord via token' })
  async resetPassword(
    @Body() body: { token: string; newPassword: string },
  ) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @ApiOperation({ summary: 'Förnya access token med refresh token' })
  async refreshTokens(@Req() req: any) {
    const userId = req.user.sub;
    const refreshToken = req.user.refreshToken;
    return this.authService.refreshTokens(userId, refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('logout')
  @ApiOperation({
    summary: 'Logga ut (svartlistar token och rensar refresh)',
  })
  async logout(@Req() req: Request) {
    const authHeader = req.headers['authorization'];
    const accessToken = authHeader?.split(' ')[1];
    const user = req.user as any;
    return this.authService.logout(user.sub, accessToken);
  }
}
