import dotenv from 'dotenv';
import type Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import type { Knex } from 'knex';
import { resolveProjectRoot } from '../config/projectRoot';

const projectRoot = resolveProjectRoot(__dirname);
dotenv.config({ path: path.resolve(projectRoot, '.env') });

const DEFAULT_SOC_DB_PATH = './data/soc.sqlite';

export function resolveSocDbPath(): string {
  const configuredPath = process.env.SOC_DB_PATH?.trim() || DEFAULT_SOC_DB_PATH;
  const absolutePath = path.resolve(projectRoot, configuredPath);

  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });

  return absolutePath;
}

type BaseSqliteConfig = Pick<
  Knex.Config,
  'client' | 'connection' | 'pool' | 'useNullAsDefault'
>;

export function createBaseSqliteConfig(): BaseSqliteConfig {
  return {
    client: 'better-sqlite3',
    connection: {
      filename: resolveSocDbPath(),
    },
    pool: {
      afterCreate: (conn: unknown, done: (err: Error | null, connection: unknown) => void) => {
        try {
          const sqlite = conn as Database.Database;
          sqlite.pragma('foreign_keys = ON');
          done(null, conn);
        } catch (err) {
          done(err as Error, conn);
        }
      },
    },
    useNullAsDefault: true,
  };
}
