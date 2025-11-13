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

    // Trial/prenumeration: sätt read-only-läge om trial är slut och isPaid är false
    const user = request.user;
    if (user) {
      const trialEnd = new Date(user.trialStart);
      trialEnd.setDate(trialEnd.getDate() + (user.trialDaysLeft || 0));
      const now = new Date();
      if (now > trialEnd && !user.isPaid) {
        request.readOnly = true;
      } else {
        request.readOnly = false;
      }
    }

    return (await super.canActivate(context)) as boolean;
  }
}
