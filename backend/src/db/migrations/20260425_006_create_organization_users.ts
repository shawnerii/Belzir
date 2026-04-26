import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('organization_users', (table) => {
    table
      .integer('organization_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('organizations')
      .onDelete('RESTRICT');
    table
      .integer('user_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.datetime('created_at').notNullable().defaultTo(knex.fn.now());
    table.primary(['organization_id', 'user_id']);
  });

  await knex.schema.raw('CREATE INDEX organization_users_user_id_idx ON organization_users(user_id)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('organization_users');
}
