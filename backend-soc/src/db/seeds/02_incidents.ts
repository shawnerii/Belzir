import type { Knex } from 'knex';
import {
  incidentAlertLinkSeedRows,
  incidentCommentSeedRows,
  incidentSeedRows,
} from './data/socSeedData';

export async function seed(knex: Knex): Promise<void> {
  // 01_alerts performs the full table clear for baseline resets.
  await knex('incidents').insert(incidentSeedRows);
  await knex('incident_alert_links').insert(incidentAlertLinkSeedRows);
  await knex('incident_comments').insert(incidentCommentSeedRows);
}
