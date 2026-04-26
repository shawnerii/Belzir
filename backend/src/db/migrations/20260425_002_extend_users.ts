import type { Knex } from 'knex';
import { normalizeIdentifier } from '../../modules/users/normalize';

type ExistingUserRow = {
  id: number;
  email: string;
  username: string;
};

function assertNoNormalizedCollisions(
  rows: ExistingUserRow[],
  key: 'email' | 'username',
): void {
  const seen = new Map<string, number>();

  for (const row of rows) {
    const normalized = normalizeIdentifier(row[key]);
    const previousId = seen.get(normalized);
    if (previousId !== undefined && previousId !== row.id) {
      throw new Error(
        `Migration aborted: normalized ${key} collision between user ids ${previousId} and ${row.id}.`,
      );
    }
    seen.set(normalized, row.id);
  }
}

async function normalizeStoredIdentifiers(knex: Knex): Promise<void> {
  const rows = await knex<ExistingUserRow>('users').select('id', 'email', 'username');
  assertNoNormalizedCollisions(rows, 'email');
  assertNoNormalizedCollisions(rows, 'username');

  for (const row of rows) {
    await knex('users')
      .where({ id: row.id })
      .update({
        email: normalizeIdentifier(row.email),
        username: normalizeIdentifier(row.username),
      });
  }
}

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.string('first_name');
    table.string('last_name');
    table.string('phone');
    table.boolean('is_system').notNullable().defaultTo(false);
  });

  await normalizeStoredIdentifiers(knex);

  await knex('users')
    .where({ email: 'admin@example.com' })
    .update({
      first_name: 'Admin',
      last_name: 'User',
      is_system: true,
    });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('is_system');
    table.dropColumn('phone');
    table.dropColumn('last_name');
    table.dropColumn('first_name');
  });
}
