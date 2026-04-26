import type { Knex } from 'knex';
import { alertSeedRows } from './data/socSeedData';
import { clearSocTables } from '../seedUtils';

export async function seed(knex: Knex): Promise<void> {
  await clearSocTables(knex);
  await knex('alerts').insert(alertSeedRows);
}
