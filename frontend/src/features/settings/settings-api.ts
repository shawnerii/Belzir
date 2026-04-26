import { get, patch } from '@/services/api';
import type {
  AuthSettingsPatch,
  GlobalSettings,
  GlobalSettingsResponse,
  MfaSettingsPatch,
} from './types';

type ApiSettings = {
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

type ApiSettingsResponse = {
  settings: ApiSettings;
};

type ApiAuthSettingsPatch = Partial<{
  passkeys: boolean;
  password: boolean;
  email_passcodes: boolean;
  mobile_passcodes: boolean;
  delete_password_on_passkey: boolean;
}>;

type ApiMfaSettingsPatch = Partial<{
  mfa_totp: boolean;
  mfa_email: boolean;
  mfa_sms: boolean;
}>;

function toGlobalSettings(apiSettings: ApiSettings): GlobalSettings {
  return {
    id: apiSettings.id,
    passkeys: apiSettings.passkeys,
    password: apiSettings.password,
    emailPasscodes: apiSettings.email_passcodes,
    mobilePasscodes: apiSettings.mobile_passcodes,
    deletePasswordOnPasskey: apiSettings.delete_password_on_passkey,
    mfaTotp: apiSettings.mfa_totp,
    mfaEmail: apiSettings.mfa_email,
    mfaSms: apiSettings.mfa_sms,
    createdAt: apiSettings.created_at,
    updatedAt: apiSettings.updated_at,
  };
}

function toGlobalSettingsResponse(response: ApiSettingsResponse): GlobalSettingsResponse {
  return {
    settings: toGlobalSettings(response.settings),
  };
}

function toApiAuthSettingsPatch(patchInput: AuthSettingsPatch): ApiAuthSettingsPatch {
  const payload: ApiAuthSettingsPatch = {};

  if (patchInput.passkeys !== undefined) {
    payload.passkeys = patchInput.passkeys;
  }
  if (patchInput.password !== undefined) {
    payload.password = patchInput.password;
  }
  if (patchInput.emailPasscodes !== undefined) {
    payload.email_passcodes = patchInput.emailPasscodes;
  }
  if (patchInput.mobilePasscodes !== undefined) {
    payload.mobile_passcodes = patchInput.mobilePasscodes;
  }
  if (patchInput.deletePasswordOnPasskey !== undefined) {
    payload.delete_password_on_passkey = patchInput.deletePasswordOnPasskey;
  }

  return payload;
}

function toApiMfaSettingsPatch(patchInput: MfaSettingsPatch): ApiMfaSettingsPatch {
  const payload: ApiMfaSettingsPatch = {};

  if (patchInput.mfaTotp !== undefined) {
    payload.mfa_totp = patchInput.mfaTotp;
  }
  if (patchInput.mfaEmail !== undefined) {
    payload.mfa_email = patchInput.mfaEmail;
  }
  if (patchInput.mfaSms !== undefined) {
    payload.mfa_sms = patchInput.mfaSms;
  }

  return payload;
}

export async function getSettingsRequest(): Promise<GlobalSettingsResponse> {
  const response = await get<ApiSettingsResponse>('/settings');
  return toGlobalSettingsResponse(response);
}

export async function updateAuthSettingsRequest(
  patchInput: AuthSettingsPatch,
): Promise<GlobalSettingsResponse> {
  const response = await patch<ApiSettingsResponse>('/settings/auth', toApiAuthSettingsPatch(patchInput));
  return toGlobalSettingsResponse(response);
}

export async function updateMfaSettingsRequest(
  patchInput: MfaSettingsPatch,
): Promise<GlobalSettingsResponse> {
  const response = await patch<ApiSettingsResponse>('/settings/mfa', toApiMfaSettingsPatch(patchInput));
  return toGlobalSettingsResponse(response);
}
