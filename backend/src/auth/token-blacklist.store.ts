// src/auth/token-blacklist.store.ts
import Redis from 'ioredis';

let redis: Redis | null = null;
const localBlacklist = new Map<string, number>(); // fallback

function getRedisClient(): Redis | null {
  if (redis) return redis;
  try {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    redis = new Redis(url);
    redis.on('error', (err) => {
      console.warn('[Redis] Fel vid anslutning:', err.message);
      redis = null;
    });
    return redis;
  } catch {
    console.warn('[Redis] Använd lokal svartlista som fallback.');
    redis = null;
    return null;
  }
}

function decodeJwtPayload(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    let payload = parts[1];
    payload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padding = 4 - (payload.length % 4);
    if (padding !== 4) payload += '='.repeat(padding);

    const json = Buffer.from(payload, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export async function addTokenToBlacklist(token: string): Promise<void> {
  const payload = decodeJwtPayload(token);
  let expiresAt = Date.now() + 60 * 60 * 1000; // fallback: 1h

  if (payload && typeof payload.exp === 'number') {
    expiresAt = payload.exp * 1000;
  }

  const ttlSeconds = Math.max(Math.floor((expiresAt - Date.now()) / 1000), 1);

  const client = getRedisClient();
  if (client) {
    await client.set(`blacklist:${token}`, '1', 'EX', ttlSeconds);
  } else {
    localBlacklist.set(token, expiresAt);
  }
}

export async function isTokenBlacklisted(token: string): Promise<boolean> {
  const client = getRedisClient();
  if (client) {
    const result = await client.get(`blacklist:${token}`);
    return !!result;
  }

  const expiresAt = localBlacklist.get(token);
  if (!expiresAt) return false;
  if (Date.now() > expiresAt) {
    localBlacklist.delete(token);
    return false;
  }
  return true;
}
