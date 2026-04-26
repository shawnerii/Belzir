import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('invitations', (table) => {
    table.increments('id').primary();
    table.string('email').notNullable();
    table.string('email_normalized').notNullable();
    table
      .integer('organization_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('organizations')
      .onDelete('RESTRICT');
    table.string('token').notNullable().unique();
    table
      .enu('status', ['pending', 'revoked', 'accepted'], {
        useNative: false,
        enumName: 'invitation_status',
      })
      .notNullable()
      .defaultTo('pending');
    table
      .integer('invited_by_user_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table.datetime('expires_at').nullable();
    table.datetime('created_at').notNullable().defaultTo(knex.fn.now());
    table.datetime('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.raw('CREATE INDEX invitations_org_id_idx ON invitations(organization_id)');
  await knex.schema.raw('CREATE INDEX invitations_status_idx ON invitations(status)');
  await knex.schema.raw('CREATE INDEX invitations_created_at_idx ON invitations(created_at DESC)');
  await knex.schema.raw(
    "CREATE UNIQUE INDEX invitations_pending_email_org_unique ON invitations(email_normalized, organization_id) WHERE status = 'pending'",
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('invitations');
}
