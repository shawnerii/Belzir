import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Knex } from 'knex';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, process.env.DB_PATH ?? './data/dev.sqlite');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const config: Knex.Config = {
  client: 'better-sqlite3',
  connection: {
    filename: dbPath,
  },
  pool: {
    afterCreate: (conn: unknown, done: (err: Error | null, connection: unknown) => void) => {
      try {
        const sqlite = conn as { pragma?: (sql: string) => unknown };
        if (typeof sqlite.pragma !== 'function') {
          throw new Error('Failed to enable foreign keys: sqlite pragma API is unavailable.');
        }
        sqlite.pragma('foreign_keys = ON');
        done(null, conn);
      } catch (err) {
        done(err as Error, conn);
      }
    },
  },
  useNullAsDefault: true,
  migrations: {
    directory: path.resolve(__dirname, 'src/db/migrations'),
    loadExtensions: ['.ts'],
  },
  seeds: {
    directory: path.resolve(__dirname, 'src/db/seeds'),
    loadExtensions: ['.ts'],
  },
};

export default config;
