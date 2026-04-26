import type { Knex } from 'knex';

const ALERT_SEVERITIES = "'low','medium','high','critical'";
const ALERT_STATUSES = "'new','triaged','escalated','ignored'";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('alerts', (table) => {
    table.string('id').primary();
    table.datetime('received_at').notNullable();
    table
      .specificType('severity', `text check (severity in (${ALERT_SEVERITIES}))`)
      .notNullable();
    table.string('rule_id').notNullable();
    table.string('rule_name').notNullable();
    table.string('host').notNullable();
    table.string('ip').notNullable();
    table
      .specificType('status', `text check (status in (${ALERT_STATUSES}))`)
      .notNullable()
      .defaultTo('new');
    table.specificType('raw_json', 'text check (json_valid(raw_json))').notNullable();
    table.datetime('created_at').notNullable().defaultTo(knex.fn.now());
    table.datetime('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index(['received_at'], 'idx_alerts_received_at');
    table.index(['rule_id'], 'idx_alerts_rule_id');
    table.index(['severity'], 'idx_alerts_severity');
    table.index(['status'], 'idx_alerts_status');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('alerts');
}
