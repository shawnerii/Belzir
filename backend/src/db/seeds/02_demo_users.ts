import type { Knex } from 'knex';
import bcrypt from 'bcryptjs';
import { normalizeIdentifier } from '../../modules/users/normalize';

export async function seed(knex: Knex): Promise<void> {
  const passwordHash = await bcrypt.hash('DemoUser123!', 10);

  const users = [
    {
      first_name: 'Max',
      last_name: 'Mustermann',
      username: normalizeIdentifier('max'),
      email: normalizeIdentifier('max@example.com'),
      phone: '+49 151 0000001',
    },
    {
      first_name: 'Erika',
      last_name: 'Musterfrau',
      username: normalizeIdentifier('erika'),
      email: normalizeIdentifier('erika@example.com'),
      phone: '+49 151 0000002',
    },
    {
      first_name: 'Hans',
      last_name: 'Tester',
      username: normalizeIdentifier('hans'),
      email: normalizeIdentifier('hans@example.com'),
      phone: null,
    },
  ];

  for (const user of users) {
    const existing = await knex('users')
      .select('id')
      .where({ email: user.email })
      .orWhere({ username: user.username })
      .first();
    if (existing) {
      continue;
    }

    await knex('users').insert({
      ...user,
      password_hash: passwordHash,
      role: 'user',
      is_active: true,
      is_system: false,
    });
  }
}
