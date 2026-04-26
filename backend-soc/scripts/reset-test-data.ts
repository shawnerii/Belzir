import db from '../src/db/knex';
import { seed as seedAlerts } from '../src/db/seeds/01_alerts';
import { seed as seedIncidents } from '../src/db/seeds/02_incidents';
import { seed as seedTriageDecisions } from '../src/db/seeds/03_triage_decisions';

async function main() {
  await seedAlerts(db);
  await seedIncidents(db);
  await seedTriageDecisions(db);

  console.log('SOC test data reset complete.');
}

main()
  .catch((err) => {
    console.error('Failed to reset SOC test data:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.destroy();
  });
