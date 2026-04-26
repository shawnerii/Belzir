import dotenv from 'dotenv';
import path from 'path';
import { resolveSocDbPath } from '../db/config';
import { resolveProjectRoot } from './projectRoot';

const projectRoot = resolveProjectRoot(__dirname);
dotenv.config({ path: path.resolve(projectRoot, '.env') });

function parseSocPort(value: string | undefined): number {
  const fallback = 4100;
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    return fallback;
  }

  return parsed;
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseSocPort(process.env.SOC_PORT),
  dbPath: resolveSocDbPath(),
};
