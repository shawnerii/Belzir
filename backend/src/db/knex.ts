import path from 'path';
import Knex from 'knex';
import { config } from '../config/env';

const db = Knex({
  client: 'better-sqlite3',
  connection: {
    filename: path.resolve(__dirname, '../../', config.dbPath),
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
    directory: path.resolve(__dirname, 'migrations'),
  },
  seeds: {
    directory: path.resolve(__dirname, 'seeds'),
  },
});

export default db;
