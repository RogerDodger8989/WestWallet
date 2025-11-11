import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { UserDocument } from '../users/schemas/user.schema';
import { addTokenToBlacklist } from './token-blacklist.store';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  // Registrera ny användare
  async register(email: string, password: string) {
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new ConflictException('E-postadressen används redan');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = uuidv4();

    const user = await this.usersService.createUser(email, hashedPassword);

    // Skicka verifieringsmejl
    await this.emailService.sendVerificationEmail(email, verificationToken);

    return { message: 'Användare skapad. Kontrollera din e-post för verifiering.' };
  }

  // Verifiera e-post via token
  async verifyEmail(token: string) {
    const user = await this.usersService.findByVerificationToken(token);
    if (!user) {
      throw new BadRequestException('Ogiltig eller föråldrad verifieringslänk');
    }

  user.isVerified = true;
  user.verificationToken = undefined;
  await user.save();

    return { message: 'E-post verifierad. Du kan nu logga in.' };
  }

  // Skicka länk för glömt lösenord
  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Ingen användare med denna e-postadress');
    }

    const resetToken = uuidv4();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 1000 * 60 * 15); // 15 min
    await user.save();

  await this.emailService.sendPasswordReset(email, resetToken);
    return { message: 'Återställningslänk skickad till e-post.' };
  }

  // Återställ lösenord
  async resetPassword(token: string, newPassword: string) {
  const user = await this.usersService.findByResetPasswordToken(token);
    if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new BadRequestException('Ogiltig eller föråldrad token');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return { message: 'Lösenordet har uppdaterats.' };
  }

  // Login
  async login(user: UserDocument) {
    const payload: JwtPayload = {
      sub: (user._id as any).toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    await this.usersService.updateRefreshToken((user._id as any).toString(), refreshToken);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: (user._id as any).toString(),
        email: user.email,
        role: user.role,
      },
    };
  }

  // Validera användare vid login
  async validateUser(email: string, password: string): Promise<UserDocument> {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Fel e-post eller lösenord');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Fel e-post eller lösenord');

    if (!user.isVerified)
      throw new UnauthorizedException('Kontot är inte verifierat ännu');

    return user;
  }

  // Byt refresh token mot nya tokens
  async refreshTokens(userId: string, refreshToken: string) {
    const isValid = await this.usersService.validateRefreshToken(
      userId,
      refreshToken,
    );
    if (!isValid) throw new UnauthorizedException('Ogiltig refresh token');

    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('Användaren hittades inte');

    return this.login(user);
  }

  // Logout – rensar refresh-token OCH svartlistar access-token
  async logout(userId: string, accessToken?: string) {
    await this.usersService.removeRefreshToken(userId);

    if (accessToken) {
      addTokenToBlacklist(accessToken);
    }

    return { message: 'Utloggad' };
  }
}

