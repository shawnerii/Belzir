import type { Knex } from 'knex';

export async function clearSocTables(knex: Knex): Promise<void> {
  await knex('incident_comments').delete();
  await knex('incident_alert_links').delete();
  await knex('triage_decisions').delete();
  await knex('incidents').delete();
  await knex('alerts').delete();
}
