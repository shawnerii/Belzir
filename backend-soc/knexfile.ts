import path from 'path';
import type { Knex } from 'knex';
import { createBaseSqliteConfig } from './src/db/config';

const config: Knex.Config = {
  ...createBaseSqliteConfig(),
  migrations: {
    directory: path.resolve(process.cwd(), 'src/db/migrations'),
    loadExtensions: ['.ts'],
  },
  seeds: {
    directory: path.resolve(process.cwd(), 'src/db/seeds'),
    loadExtensions: ['.ts'],
  },
};

export default config;
