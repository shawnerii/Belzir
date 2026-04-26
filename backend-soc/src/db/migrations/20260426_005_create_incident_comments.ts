import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('incident_comments', (table) => {
    table.string('id').primary();
    table.string('incident_id').notNullable();
    table.string('author').nullable();
    table.text('body').notNullable();
    table.datetime('created_at').notNullable().defaultTo(knex.fn.now());

    table
      .foreign('incident_id', 'fk_incident_comments_incident_id')
      .references('incidents.id')
      .onDelete('CASCADE');

    table.index(['incident_id'], 'idx_incident_comments_incident_id');
    table.index(['created_at'], 'idx_incident_comments_created_at');
    table.index(['incident_id', 'created_at'], 'idx_incident_comments_incident_created_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('incident_comments');
}
