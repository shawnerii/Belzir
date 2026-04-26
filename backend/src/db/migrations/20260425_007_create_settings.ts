import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('settings', (table) => {
    table.integer('id').primary().notNullable().defaultTo(1);
    table.boolean('passkeys').notNullable().defaultTo(false);
    table.boolean('password').notNullable().defaultTo(true);
    table.boolean('email_passcodes').notNullable().defaultTo(false);
    table.boolean('mobile_passcodes').notNullable().defaultTo(false);
    table.boolean('delete_password_on_passkey').notNullable().defaultTo(false);
    table.boolean('mfa_totp').notNullable().defaultTo(false);
    table.boolean('mfa_email').notNullable().defaultTo(false);
    table.boolean('mfa_sms').notNullable().defaultTo(false);
    table.datetime('created_at').notNullable().defaultTo(knex.fn.now());
    table.datetime('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.raw(`
    CREATE TRIGGER settings_singleton_insert
    BEFORE INSERT ON settings
    FOR EACH ROW
    BEGIN
      SELECT CASE
        WHEN NEW.id <> 1 THEN RAISE(ABORT, 'settings_id_must_be_1')
      END;
    END;
  `);
  await knex.schema.raw(`
    CREATE TRIGGER settings_singleton_update
    BEFORE UPDATE OF id ON settings
    FOR EACH ROW
    BEGIN
      SELECT CASE
        WHEN NEW.id <> 1 THEN RAISE(ABORT, 'settings_id_must_be_1')
      END;
    END;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.raw('DROP TRIGGER IF EXISTS settings_singleton_update');
  await knex.schema.raw('DROP TRIGGER IF EXISTS settings_singleton_insert');
  await knex.schema.dropTable('settings');
}
