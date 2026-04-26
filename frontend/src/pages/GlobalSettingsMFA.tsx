import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/useAuth';
import { getSettingsRequest, updateMfaSettingsRequest } from '@/features/settings/settings-api';
import type { GlobalSettings, MfaSettings, MfaSettingsPatch } from '@/features/settings/types';

function readErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const reason = err.response?.data?.details?.reason;
    if (err.response?.status === 409 && reason === 'settings_conflict') {
      return 'Die Einstellungen wurden zwischenzeitlich geändert. Bitte erneut versuchen.';
    }

    const detailsMessage = err.response?.data?.details?.message;
    if (typeof detailsMessage === 'string' && detailsMessage.length > 0) {
      return detailsMessage;
    }

    const apiMessage = err.response?.data?.error;
    if (typeof apiMessage === 'string' && apiMessage.length > 0) {
      return apiMessage;
    }
  }

  return fallback;
}

function toMfaPatch(key: keyof MfaSettings, value: boolean): MfaSettingsPatch {
  return { [key]: value } as MfaSettingsPatch;
}

export default function GlobalSettingsMFA() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<keyof MfaSettings | null>(null);
  const requestIdRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    let cancelled = false;

    async function loadSettings() {
      setLoading(true);
      setLoadError(null);
      try {
        const response = await getSettingsRequest();
        if (!cancelled) {
          setSettings(response.settings);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(readErrorMessage(err, 'Einstellungen konnten nicht geladen werden.'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const isSaving = savingKey !== null;

  async function refreshSettingsAfterMutation(requestId: number): Promise<void> {
    try {
      const refreshed = await getSettingsRequest();
      if (isMountedRef.current && requestId === requestIdRef.current) {
        setSettings(refreshed.settings);
      }
    } catch (err) {
      if (isMountedRef.current && requestId === requestIdRef.current) {
        setSaveError((current) =>
          current ?? readErrorMessage(err, 'Einstellungen konnten nicht neu geladen werden.'),
        );
      }
    }
  }

  async function handleToggle(key: keyof MfaSettings, nextValue: boolean): Promise<void> {
    if (!settings || isSaving) {
      return;
    }

    const previousSettings = settings;
    const optimisticSettings: GlobalSettings = {
      ...settings,
      [key]: nextValue,
    };

    if (!isMountedRef.current) {
      return;
    }

    setSettings(optimisticSettings);
    setSaveError(null);
    setSavingKey(key);

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    try {
      const response = await updateMfaSettingsRequest(toMfaPatch(key, nextValue));
      if (isMountedRef.current && requestId === requestIdRef.current) {
        setSettings(response.settings);
      }
    } catch (err) {
      if (isMountedRef.current && requestId === requestIdRef.current) {
        setSettings(previousSettings);
        setSaveError(readErrorMessage(err, 'Einstellungen konnten nicht gespeichert werden.'));
      }
    } finally {
      if (isMountedRef.current && requestId === requestIdRef.current) {
        await refreshSettingsAfterMutation(requestId);
      }
      if (isMountedRef.current && requestId === requestIdRef.current) {
        setSavingKey(null);
      }
    }
  }

  if (!isAdmin) {
    return (
      <section className="page settings-page">
        <h1>Globale Einstellungen</h1>
        <h2>Multifaktor Authentifizierung</h2>
        <p className="form-error">Diese Seite ist nur für Administratoren verfügbar.</p>
      </section>
    );
  }

  return (
    <section className="page settings-page">
      <h1>Globale Einstellungen</h1>
      <h2>Multifaktor Authentifizierung</h2>

      {loadError ? <p className="form-error">{loadError}</p> : null}
      {saveError ? <p className="form-error">{saveError}</p> : null}
      {isSaving ? <p className="settings-status">Änderungen werden gespeichert...</p> : null}

      {loading ? <p>Lade Einstellungen...</p> : null}

      {!loading && settings ? (
        <div className="settings-card-list">
          <article className="settings-card">
            <div>
              <h3>Einmalpasswörter (TOTP-App)</h3>
              <p>Erlaubt zeitbasierte Einmalcodes aus einer Authenticator-App.</p>
            </div>
            <label className="settings-switch">
              <input
                type="checkbox"
                checked={settings.mfaTotp}
                onChange={(event) => void handleToggle('mfaTotp', event.target.checked)}
                disabled={isSaving}
              />
              <span>{settings.mfaTotp ? 'An' : 'Aus'}</span>
            </label>
          </article>

          <article className="settings-card">
            <div>
              <h3>E-Mail Passcodes</h3>
              <p>Erlaubt E-Mail als zweiten Faktor oder als Fallback.</p>
            </div>
            <label className="settings-switch">
              <input
                type="checkbox"
                checked={settings.mfaEmail}
                onChange={(event) => void handleToggle('mfaEmail', event.target.checked)}
                disabled={isSaving}
              />
              <span>{settings.mfaEmail ? 'An' : 'Aus'}</span>
            </label>
          </article>

          <article className="settings-card">
            <div>
              <h3>Mobilfunknummer</h3>
              <p>Erlaubt SMS- oder Mobilfunk-Codes als zweiten Faktor oder Fallback.</p>
            </div>
            <label className="settings-switch">
              <input
                type="checkbox"
                checked={settings.mfaSms}
                onChange={(event) => void handleToggle('mfaSms', event.target.checked)}
                disabled={isSaving}
              />
              <span>{settings.mfaSms ? 'An' : 'Aus'}</span>
            </label>
          </article>
        </div>
      ) : null}
    </section>
  );
}
