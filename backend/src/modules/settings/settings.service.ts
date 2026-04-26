import type { Knex } from 'knex';
import db from '../../db/knex';
import { AppError } from '../../middleware/errorHandler';
import type { UpdateAuthSettingsInput, UpdateMfaSettingsInput } from './settings.schemas';

type SettingsRow = {
  id: number;
  passkeys: number | boolean;
  password: number | boolean;
  email_passcodes: number | boolean;
  mobile_passcodes: number | boolean;
  delete_password_on_passkey: number | boolean;
  mfa_totp: number | boolean;
  mfa_email: number | boolean;
  mfa_sms: number | boolean;
  created_at: string;
  updated_at: string;
};

export type PublicSettings = {
  id: number;
  passkeys: boolean;
  password: boolean;
  email_passcodes: boolean;
  mobile_passcodes: boolean;
  delete_password_on_passkey: boolean;
  mfa_totp: boolean;
  mfa_email: boolean;
  mfa_sms: boolean;
  created_at: string;
  updated_at: string;
};

type AuthSnapshot = Pick<
  PublicSettings,
  'passkeys' | 'password' | 'email_passcodes' | 'mobile_passcodes' | 'delete_password_on_passkey'
>;

type MfaSnapshot = Pick<PublicSettings, 'mfa_totp' | 'mfa_email' | 'mfa_sms'>;

const SETTINGS_SINGLETON_ID = 1;
const MAX_UPDATE_RETRIES = 5;

function asBoolean(value: number | boolean): boolean {
  return Boolean(value);
}

function asDbBoolean(value: boolean): number {
  return value ? 1 : 0;
}

function toPublicSettings(row: SettingsRow): PublicSettings {
  return {
    id: row.id,
    passkeys: asBoolean(row.passkeys),
    password: asBoolean(row.password),
    email_passcodes: asBoolean(row.email_passcodes),
    mobile_passcodes: asBoolean(row.mobile_passcodes),
    delete_password_on_passkey: asBoolean(row.delete_password_on_passkey),
    mfa_totp: asBoolean(row.mfa_totp),
    mfa_email: asBoolean(row.mfa_email),
    mfa_sms: asBoolean(row.mfa_sms),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function toAuthSnapshot(settings: PublicSettings): AuthSnapshot {
  return {
    passkeys: settings.passkeys,
    password: settings.password,
    email_passcodes: settings.email_passcodes,
    mobile_passcodes: settings.mobile_passcodes,
    delete_password_on_passkey: settings.delete_password_on_passkey,
  };
}

function toMfaSnapshot(settings: PublicSettings): MfaSnapshot {
  return {
    mfa_totp: settings.mfa_totp,
    mfa_email: settings.mfa_email,
    mfa_sms: settings.mfa_sms,
  };
}

async function ensureSettingsRow(trx: Knex | Knex.Transaction): Promise<void> {
  await trx('settings')
    .insert({
      id: SETTINGS_SINGLETON_ID,
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

async function readSettingsRow(trx: Knex | Knex.Transaction): Promise<SettingsRow> {
  await ensureSettingsRow(trx);
  const row = await trx<SettingsRow>('settings')
    .where({ id: SETTINGS_SINGLETON_ID })
    .first();

  if (!row) {
    throw new Error('Failed to load settings row');
  }

  return row;
}

function buildNextAuthSettings(current: AuthSnapshot, patch: UpdateAuthSettingsInput): AuthSnapshot {
  const next: AuthSnapshot = {
    passkeys: patch.passkeys ?? current.passkeys,
    password: patch.password ?? current.password,
    email_passcodes: patch.email_passcodes ?? current.email_passcodes,
    mobile_passcodes: patch.mobile_passcodes ?? current.mobile_passcodes,
    delete_password_on_passkey:
      patch.delete_password_on_passkey ?? current.delete_password_on_passkey,
  };

  if (!next.passkeys) {
    next.delete_password_on_passkey = false;
  }

  if (!next.passkeys && !next.password && !next.email_passcodes && !next.mobile_passcodes) {
    throw new AppError(409, 'At least one primary authentication method must remain enabled.', {
      reason: 'auth_methods_lockout',
      message: 'Cannot disable passkeys, password, email passcodes, and mobile passcodes at the same time.',
    });
  }

  return next;
}

function buildNextMfaSettings(current: MfaSnapshot, patch: UpdateMfaSettingsInput): MfaSnapshot {
  return {
    mfa_totp: patch.mfa_totp ?? current.mfa_totp,
    mfa_email: patch.mfa_email ?? current.mfa_email,
    mfa_sms: patch.mfa_sms ?? current.mfa_sms,
  };
}

export async function getSettings(): Promise<PublicSettings> {
  const row = await readSettingsRow(db);
  return toPublicSettings(row);
}

export async function updateAuthSettings(patch: UpdateAuthSettingsInput): Promise<PublicSettings> {
  for (let attempt = 0; attempt < MAX_UPDATE_RETRIES; attempt += 1) {
    const updated = await db.transaction(async (trx): Promise<PublicSettings | null> => {
      const current = toPublicSettings(await readSettingsRow(trx));
      const currentAuth = toAuthSnapshot(current);
      const nextAuth = buildNextAuthSettings(currentAuth, patch);

      const changedRows = await trx<SettingsRow>('settings')
        .where({ id: SETTINGS_SINGLETON_ID })
        .andWhere('passkeys', asDbBoolean(currentAuth.passkeys))
        .andWhere('password', asDbBoolean(currentAuth.password))
        .andWhere('email_passcodes', asDbBoolean(currentAuth.email_passcodes))
        .andWhere('mobile_passcodes', asDbBoolean(currentAuth.mobile_passcodes))
        .andWhere(
          'delete_password_on_passkey',
          asDbBoolean(currentAuth.delete_password_on_passkey),
        )
        .update({
          passkeys: nextAuth.passkeys,
          password: nextAuth.password,
          email_passcodes: nextAuth.email_passcodes,
          mobile_passcodes: nextAuth.mobile_passcodes,
          delete_password_on_passkey: nextAuth.delete_password_on_passkey,
          updated_at: trx.fn.now() as unknown as string,
        });

      if (changedRows < 1) {
        return null;
      }

      return getSettingsFromTransaction(trx);
    });

    if (updated) {
      return updated;
    }
  }

  throw new AppError(409, 'Settings were updated concurrently. Please retry.', {
    reason: 'settings_conflict',
  });
}

export async function updateMfaSettings(patch: UpdateMfaSettingsInput): Promise<PublicSettings> {
  for (let attempt = 0; attempt < MAX_UPDATE_RETRIES; attempt += 1) {
    const updated = await db.transaction(async (trx): Promise<PublicSettings | null> => {
      const current = toPublicSettings(await readSettingsRow(trx));
      const currentMfa = toMfaSnapshot(current);
      const nextMfa = buildNextMfaSettings(currentMfa, patch);

      const changedRows = await trx<SettingsRow>('settings')
        .where({ id: SETTINGS_SINGLETON_ID })
        .andWhere('mfa_totp', asDbBoolean(currentMfa.mfa_totp))
        .andWhere('mfa_email', asDbBoolean(currentMfa.mfa_email))
        .andWhere('mfa_sms', asDbBoolean(currentMfa.mfa_sms))
        .update({
          mfa_totp: nextMfa.mfa_totp,
          mfa_email: nextMfa.mfa_email,
          mfa_sms: nextMfa.mfa_sms,
          updated_at: trx.fn.now() as unknown as string,
        });

      if (changedRows < 1) {
        return null;
      }

      return getSettingsFromTransaction(trx);
    });

    if (updated) {
      return updated;
    }
  }

  throw new AppError(409, 'Settings were updated concurrently. Please retry.', {
    reason: 'settings_conflict',
  });
}

async function getSettingsFromTransaction(trx: Knex.Transaction): Promise<PublicSettings> {
  const row = await trx<SettingsRow>('settings')
    .where({ id: SETTINGS_SINGLETON_ID })
    .first();

  if (!row) {
    throw new Error('Failed to load updated settings');
  }

  return toPublicSettings(row);
}
