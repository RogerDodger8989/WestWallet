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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrera ny användare' })
  async register(@Body() body: { email: string; password: string }) {
    const { email, password } = body;
    if (!email || !password)
      throw new BadRequestException('E-post och lösenord krävs');
    return this.authService.register(email, password);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verifiera e-post via token' })
  async verifyEmail(@Body() body: { token: string }) {
    if (!body.token) throw new BadRequestException('Token krävs');
    return this.authService.verifyEmail(body.token);
  }

  @Post('login')
  @ApiOperation({ summary: 'Logga in och få tokens' })
  async login(@Body() body: { email: string; password: string }) {
    const { email, password } = body;
    if (!email || !password)
      throw new BadRequestException('E-post och lösenord krävs');

    const user = await this.authService.validateUser(email, password);
    return this.authService.login(user);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Begär återställning av lösenord' })
  async forgotPassword(@Body() body: { email: string }) {
    if (!body.email) throw new BadRequestException('E-post krävs');
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Återställ lösenord via token' })
  async resetPassword(@Body() body: { token: string; password: string }) {
    const { token, password } = body;
    if (!token || !password)
      throw new BadRequestException('Token och nytt lösenord krävs');
    return this.authService.resetPassword(token, password);
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Byt ut access/refresh tokens med giltig refresh token',
  })
  async refresh(@Body() body: { userId: string; refresh_token: string }) {
    const { userId, refresh_token } = body;
    if (!userId || !refresh_token)
      throw new BadRequestException('userId och refresh_token krävs');
    return this.authService.refreshTokens(userId, refresh_token);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('logout')
  @ApiOperation({
    summary: 'Logga ut användare (rensa refresh-token & svartlista access-token)',
  })
  async logout(@Req() req: any) {
    const authHeader: string | undefined =
      req.headers?.authorization || req.headers?.Authorization;

    let accessToken: string | undefined;

    if (authHeader && typeof authHeader === 'string') {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        accessToken = parts[1];
      }
    }

    return this.authService.logout(req.user.userId, accessToken);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Hämta information om inloggad användare' })
  async getMe(@Req() req: any) {
    return req.user;
  }
}
