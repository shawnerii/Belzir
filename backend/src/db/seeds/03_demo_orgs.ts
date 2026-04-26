import type { Knex } from 'knex';

const DEMO_ORGS = [
  { name: 'Kunden', slug: 'kunden' },
  { name: 'Partner', slug: 'partner' },
  { name: 'Intern', slug: 'intern' },
];

export async function seed(knex: Knex): Promise<void> {
  for (const organization of DEMO_ORGS) {
    const existing = await knex('organizations').select('id').where({ slug: organization.slug }).first();
    if (existing) {
      continue;
    }

    await knex('organizations').insert(organization);
  }
}
