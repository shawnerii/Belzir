import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('incident_alert_links', (table) => {
    table.string('id').primary();
    table.string('incident_id').notNullable();
    table.string('alert_id').notNullable();
    table.datetime('linked_at').notNullable().defaultTo(knex.fn.now());

    table
      .foreign('incident_id', 'fk_incident_alert_links_incident_id')
      .references('incidents.id')
      .onDelete('CASCADE');
    table
      .foreign('alert_id', 'fk_incident_alert_links_alert_id')
      .references('alerts.id')
      .onDelete('CASCADE');

    table.unique(['incident_id', 'alert_id'], {
      indexName: 'uq_incident_alert_links_incident_alert',
    });
    table.index(['incident_id'], 'idx_incident_alert_links_incident_id');
    table.index(['alert_id'], 'idx_incident_alert_links_alert_id');
    table.index(['linked_at'], 'idx_incident_alert_links_linked_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('incident_alert_links');
}
