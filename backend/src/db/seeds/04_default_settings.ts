import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('settings')
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
    .ignore();
}
