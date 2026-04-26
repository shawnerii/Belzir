import dotenv from 'dotenv';
import ms from 'ms';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT ?? '4000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  dbPath: process.env.DB_PATH ?? './data/dev.sqlite',
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
};

export function requireJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET env var is required. Copy .env.example to .env and set a value.');
  }
  return secret;
}

let jwtExpirySecondsCache: number | null = null;

export function requireJwtExpiresInSeconds(): number {
  if (jwtExpirySecondsCache !== null) {
    return jwtExpirySecondsCache;
  }

  const parsed = ms(config.jwtExpiresIn as ms.StringValue);
  if (typeof parsed !== 'number' || !Number.isFinite(parsed) || parsed < 1000) {
    throw new Error(
      'JWT_EXPIRES_IN must be at least 1 second (e.g. 1s, 15m, 1h, 8h, or 7d).',
    );
  }

  jwtExpirySecondsCache = Math.floor(parsed / 1000);
  return jwtExpirySecondsCache;
}
