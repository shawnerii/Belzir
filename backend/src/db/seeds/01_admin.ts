import type { Knex } from 'knex';
import bcrypt from 'bcryptjs';
import { normalizeIdentifier } from '../../modules/users/normalize';

export async function seed(knex: Knex): Promise<void> {
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';
  const passwordHash = await bcrypt.hash(password, 10);
  const email = normalizeIdentifier('admin@example.com');
  const username = normalizeIdentifier('admin');

  await knex('users')
    .insert({
      email,
      username,
      first_name: 'Admin',
      last_name: 'User',
      phone: null,
      password_hash: passwordHash,
      role: 'admin',
      is_active: true,
      is_system: true,
    })
    .onConflict('email')
    .merge({
      username,
      first_name: 'Admin',
      last_name: 'User',
      phone: null,
      password_hash: passwordHash,
      role: 'admin',
      is_active: true,
      is_system: true,
      updated_at: knex.fn.now(),
    });
}
