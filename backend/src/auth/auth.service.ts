import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { UserDocument } from '../users/schemas/user.schema';

interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
  ) {}

  // Registrera ny användare
  async register(email: string, password: string) {
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new ConflictException('E-postadressen är redan registrerad');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.usersService.createUser(email, hashedPassword);

    const token = uuidv4();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await this.usersService.setVerificationToken((user._id as any).toString(), token, expires);
    await this.emailService.sendVerificationEmail(email, token);

    return { message: 'Registrering lyckades. Kontrollera din e-post för verifiering.' };
  }

  // Glömt lösenord
  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new NotFoundException('Ingen användare med den e-postadressen');

    const token = uuidv4();
    const expires = new Date(Date.now() + 60 * 60 * 1000);
  await this.usersService.setResetPasswordToken((user._id as any).toString(), token, expires);
    await this.emailService.sendPasswordReset(email, token);
    return { message: 'Återställningslänk skickad till e-postadressen.' };
  }

  // Återställ lösenord
  async resetPassword(token: string, newPassword: string) {
    const user = await this.usersService.findByResetPasswordToken(token);
    if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new BadRequestException('Ogiltigt eller utgånget token');
    }

    const hash = await bcrypt.hash(newPassword, 10);
  await this.usersService.updatePassword((user._id as any).toString(), hash);
  await this.usersService.clearResetPasswordToken((user._id as any).toString());
    return { message: 'Lösenord uppdaterat' };
  }

  // Verifiera e-post
  async verifyEmail(token: string) {
    const user = await this.usersService.findByVerificationToken(token);
    if (!user || !user.verificationTokenExpires || user.verificationTokenExpires < new Date()) {
      throw new BadRequestException('Ogiltigt eller utgånget token');
    }
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();
    return { message: 'E-post verifierad. Du kan nu logga in.' };
  }

  // Validera användare
  async validateUser(email: string, password: string): Promise<UserDocument | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;
    if (!user.isVerified) throw new BadRequestException('E-posten är inte verifierad.');
    const match = await bcrypt.compare(password, user.password);
    return match ? user : null;
  }

  // Login – skapar både access & refresh token
  async login(user: UserDocument) {
  const userId = (user._id as any).toString();
    const payload: JwtPayload = { sub: userId, email: user.email };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET || 'dev-secret',
      expiresIn: process.env.JWT_EXPIRES_IN ? Number(process.env.JWT_EXPIRES_IN) : 3600,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ? Number(process.env.JWT_REFRESH_EXPIRES_IN) : 604800,
    });

    await this.usersService.updateRefreshToken(userId, refreshToken);
    return { access_token: accessToken, refresh_token: refreshToken };
  }

  // Byt ut tokens via refresh token
  async refreshTokens(userId: string, refreshToken: string) {
    const isValid = await this.usersService.validateRefreshToken(userId, refreshToken);
    if (!isValid) throw new UnauthorizedException('Ogiltig refresh token');
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('Användaren hittades inte');
    return this.login(user);
  }

  // Logout
  async logout(userId: string) {
    await this.usersService.removeRefreshToken(userId);
    return { message: 'Utloggad' };
  }
}
