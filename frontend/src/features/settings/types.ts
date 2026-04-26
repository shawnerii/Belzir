export type AuthSettings = {
  passkeys: boolean;
  password: boolean;
  emailPasscodes: boolean;
  mobilePasscodes: boolean;
  deletePasswordOnPasskey: boolean;
};

export type MfaSettings = {
  mfaTotp: boolean;
  mfaEmail: boolean;
  mfaSms: boolean;
};

export type GlobalSettings = AuthSettings &
  MfaSettings & {
    id: number;
    createdAt: string;
    updatedAt: string;
  };

export type AuthSettingsPatch = Partial<AuthSettings>;
export type MfaSettingsPatch = Partial<MfaSettings>;

export type GlobalSettingsResponse = {
  settings: GlobalSettings;
};
