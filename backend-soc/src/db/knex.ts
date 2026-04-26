import path from 'path';
import Knex from 'knex';
import { createBaseSqliteConfig } from './config';

const db = Knex({
  ...createBaseSqliteConfig(),
  migrations: {
    directory: path.resolve(__dirname, 'migrations'),
  },
  seeds: {
    directory: path.resolve(__dirname, 'seeds'),
  },
});

export default db;
