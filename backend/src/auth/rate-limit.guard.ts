import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import { CacheService } from '../cache/cache.service';

const REQUEST_LIMIT = 200; // max requests per minut
const WRITE_LIMIT = 20; // max writes per minut
const WINDOW_SECONDS = 60;

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private readonly cacheService: CacheService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId || request.ip;
    const method = request.method;
    const isWrite = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    // Key per user per window
    const now = Math.floor(Date.now() / 1000 / WINDOW_SECONDS);
    const reqKey = `ratelimit:req:${userId}:${now}`;
    const writeKey = `ratelimit:write:${userId}:${now}`;

    // Requests
    let reqCount = await this.cacheService.get<number>(reqKey) || 0;
        if (reqCount >= REQUEST_LIMIT) {
          throw new BadRequestException('API rate limit exceeded (requests/min)');
    }
    await this.cacheService.set(reqKey, reqCount + 1, WINDOW_SECONDS);

    // Writes
    if (isWrite) {
      let writeCount = await this.cacheService.get<number>(writeKey) || 0;
          if (writeCount >= WRITE_LIMIT) {
            throw new BadRequestException('API rate limit exceeded (writes/min)');
      }
      await this.cacheService.set(writeKey, writeCount + 1, WINDOW_SECONDS);
    }

    return true;
  }
}
