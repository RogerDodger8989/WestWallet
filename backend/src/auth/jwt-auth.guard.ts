import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { isTokenBlacklisted } from './token-blacklist.store';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined =
      request.headers?.authorization || request.headers?.Authorization;

    if (authHeader && typeof authHeader === 'string') {
      const parts = authHeader.split(' ');
      const token = parts.length === 2 ? parts[1] : null;

      if (token && (await isTokenBlacklisted(token))) {
        throw new UnauthorizedException('Token är ogiltig (utloggad).');
      }
    }

    return (await super.canActivate(context)) as boolean;
  }
}
