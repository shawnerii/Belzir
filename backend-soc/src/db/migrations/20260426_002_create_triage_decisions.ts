import type { Knex } from 'knex';

const TRIAGE_DECISIONS = "'true_positive','false_positive','ignore','escalate'";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('triage_decisions', (table) => {
    table.string('id').primary();
    table.string('alert_id').notNullable();
    table
      .specificType('decision', `text check (decision in (${TRIAGE_DECISIONS}))`)
      .notNullable();
    table.text('note').nullable();
    table.string('decided_by').nullable();
    table.datetime('decided_at').notNullable();
    table.datetime('created_at').notNullable().defaultTo(knex.fn.now());
    table.datetime('updated_at').notNullable().defaultTo(knex.fn.now());

    table
      .foreign('alert_id', 'fk_triage_decisions_alert_id')
      .references('alerts.id')
      .onDelete('CASCADE');

    table.index(['alert_id'], 'idx_triage_decisions_alert_id');
    table.index(['decided_at'], 'idx_triage_decisions_decided_at');
    table.index(['alert_id', 'decided_at'], 'idx_triage_decisions_alert_decided');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('triage_decisions');
}
