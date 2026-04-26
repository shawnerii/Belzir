import type { Knex } from 'knex';

const INCIDENT_SEVERITIES = "'low','medium','high','critical'";
const INCIDENT_STATUSES = "'open','investigating','closed'";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('incidents', (table) => {
    table.string('id').primary();
    table.string('title').notNullable();
    table
      .specificType('severity', `text check (severity in (${INCIDENT_SEVERITIES}))`)
      .notNullable();
    table
      .specificType('status', `text check (status in (${INCIDENT_STATUSES}))`)
      .notNullable()
      .defaultTo('open');
    table.datetime('created_at').notNullable().defaultTo(knex.fn.now());
    table.datetime('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index(['severity'], 'idx_incidents_severity');
    table.index(['status'], 'idx_incidents_status');
    table.index(['created_at'], 'idx_incidents_created_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('incidents');
}
