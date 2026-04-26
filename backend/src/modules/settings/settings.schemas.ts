import { z } from 'zod';

const optionalBoolean = z.boolean().optional();

export const updateAuthSettingsSchema = z
  .object({
    passkeys: optionalBoolean,
    password: optionalBoolean,
    email_passcodes: optionalBoolean,
    mobile_passcodes: optionalBoolean,
    delete_password_on_passkey: optionalBoolean,
  })
  .strict()
  .refine((value) => Object.values(value).some((entry) => entry !== undefined), {
    message: 'At least one field must be provided.',
  });

export const updateMfaSettingsSchema = z
  .object({
    mfa_totp: optionalBoolean,
    mfa_email: optionalBoolean,
    mfa_sms: optionalBoolean,
  })
  .strict()
  .refine((value) => Object.values(value).some((entry) => entry !== undefined), {
    message: 'At least one field must be provided.',
  });

export type UpdateAuthSettingsInput = z.infer<typeof updateAuthSettingsSchema>;
export type UpdateMfaSettingsInput = z.infer<typeof updateMfaSettingsSchema>;
