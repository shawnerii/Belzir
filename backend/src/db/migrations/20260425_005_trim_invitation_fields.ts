import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.raw('DROP INDEX IF EXISTS invitations_created_at_idx');

  await knex.schema.alterTable('invitations', (table) => {
    table.dropColumn('token');
    table.dropColumn('expires_at');
  });

  await knex.schema.raw('CREATE INDEX invitations_created_at_id_idx ON invitations(created_at, id)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.raw('DROP INDEX IF EXISTS invitations_created_at_id_idx');

  await knex.schema.alterTable('invitations', (table) => {
    table.string('token').nullable();
    table.datetime('expires_at').nullable();
  });

  await knex.schema.raw('CREATE INDEX invitations_created_at_idx ON invitations(created_at DESC)');
}
