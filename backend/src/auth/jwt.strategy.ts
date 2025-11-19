import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConstants } from './jwt.constants';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || '',
    });
  }

  async validate(payload: any) {
      // Logga ut aktuell JWT_SECRET för felsökning
      console.log('[DEBUG] process.env.JWT_SECRET:', process.env.JWT_SECRET);
    // Debug: logga payload och användare
    console.log('[JWT Strategy] Payload:', payload);
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      console.log('[JWT Strategy] Ingen användare hittades för sub:', payload.sub);
    }
    if (user && !user.isVerified) {
      console.log('[JWT Strategy] Användaren är inte verifierad:', user.email);
    }
    return {
      userId: payload.sub,
      email: payload.email,
      role: user?.role || 'user',
    };
  }
}
