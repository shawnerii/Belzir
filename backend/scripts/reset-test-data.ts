import db from '../src/db/knex';
import { normalizeIdentifier } from '../src/modules/users/normalize';
import { seed as seedDemoOrgs } from '../src/db/seeds/03_demo_orgs';

async function main() {
  const seedAdminEmail = normalizeIdentifier(process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com');

  await db.transaction(async (trx) => {
    await trx('invitations').delete();
    await trx('organization_users').delete();
    await trx('organizations').delete();
    await trx('users')
      .where({ is_system: 0 })
      .andWhereNot({ email: seedAdminEmail })
      .delete();

    await trx('settings')
      .insert({
        id: 1,
        passkeys: false,
        password: true,
        email_passcodes: false,
        mobile_passcodes: false,
        delete_password_on_passkey: false,
        mfa_totp: false,
        mfa_email: false,
        mfa_sms: false,
      })
      .onConflict('id')
      .merge({
        passkeys: false,
        password: true,
        email_passcodes: false,
        mobile_passcodes: false,
        delete_password_on_passkey: false,
        mfa_totp: false,
        mfa_email: false,
        mfa_sms: false,
        updated_at: trx.fn.now(),
      });
  });

  await seedDemoOrgs(db);

  console.log('Test data reset complete.');
}

main()
  .catch((err) => {
    console.error('Failed to reset test data:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.destroy();
  });
