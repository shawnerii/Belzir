import type { Knex } from 'knex';
import { alertStatusMaterialization, triageDecisionSeedRows } from './data/socSeedData';

export async function seed(knex: Knex): Promise<void> {
  await knex.transaction(async (trx) => {
    await trx('triage_decisions').delete();

    await trx('triage_decisions').insert(triageDecisionSeedRows);

    for (const change of alertStatusMaterialization) {
      const updated = await trx('alerts').where({ id: change.alert_id }).update({
        status: change.status,
        updated_at: change.updated_at,
      });

      if (updated !== 1) {
        throw new Error(`Expected seeded alert ${change.alert_id} to exist.`);
      }
    }
  });
}
