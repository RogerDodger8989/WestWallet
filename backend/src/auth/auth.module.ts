import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { EmailModule } from '../email/email.module';
import { JwtStrategy } from './jwt.strategy';
import { jwtConstants } from './jwt.constants';

import { RefreshTokenGuard } from './refresh-token.guard';

@Module({
  imports: [
    UsersModule,
    EmailModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: {
        // du använder numeriskt värde i koden (sekunder)
        expiresIn: process.env.JWT_EXPIRES_IN
          ? Number(process.env.JWT_EXPIRES_IN)
          : 3600,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RefreshTokenGuard],
  exports: [AuthService],
})
export class AuthModule {}
