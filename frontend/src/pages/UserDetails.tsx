import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/context/useAuth';
import {
  assignUserToOrganizationRequest,
  listOrganizationsRequest,
  unassignUserFromOrganizationRequest,
} from '@/features/organizations/organizations-api';
import type { Organization } from '@/features/organizations/types';
import {
  activateUserRequest,
  deactivateUserRequest,
  deleteUserRequest,
  getUserRequest,
  resetUserPasswordRequest,
  updateUserRequest,
} from '@/features/users/users-api';
import type { User, UserRole } from '@/features/users/types';

type EditFormState = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  role: UserRole;
};

function readErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
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

function toFormState(user: User): EditFormState {
  return {
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    username: user.username,
    email: user.email,
    phone: user.phone ?? '',
    role: user.role,
  };
}

function differs(a: string, b: string): boolean {
  return a.trim() !== b.trim();
}

function withOrganizations(previous: User, next: User): User {
  if (next.organizations !== undefined) {
    return next;
  }

  return {
    ...next,
    organizations: previous.organizations ?? [],
  };
}

export default function UserDetails() {
  const navigate = useNavigate();
  const { user: actor } = useAuth();
  const { id } = useParams();
  const userId = Number(id);
  const isValidUserId = Number.isInteger(userId) && userId > 0;

  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState<EditFormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [organizationOptions, setOrganizationOptions] = useState<Organization[]>([]);
  const [loadingOrganizationOptions, setLoadingOrganizationOptions] = useState(false);
  const [organizationSelectionId, setOrganizationSelectionId] = useState<number | null>(null);
  const [organizationActionLoading, setOrganizationActionLoading] = useState(false);
  const [organizationError, setOrganizationError] = useState<string | null>(null);
  const [organizationInfo, setOrganizationInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!isValidUserId) {
      return;
    }

    let canceled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await getUserRequest(userId);
        if (canceled) {
          return;
        }
        setUser(response.user);
        setForm(toFormState(response.user));
      } catch (err) {
        if (!canceled) {
          setError(readErrorMessage(err, 'Benutzer konnte nicht geladen werden.'));
        }
      } finally {
        if (!canceled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      canceled = true;
    };
  }, [isValidUserId, userId]);

  useEffect(() => {
    if (!isValidUserId || actor?.role !== 'admin') {
      return;
    }

    let canceled = false;

    async function loadOrganizationOptions() {
      setLoadingOrganizationOptions(true);
      setOrganizationError(null);

      try {
        const response = await listOrganizationsRequest();
        if (!canceled) {
          setOrganizationOptions(response.organizations);
        }
      } catch (err) {
        if (!canceled) {
          setOrganizationError(readErrorMessage(err, 'Organisationen konnten nicht geladen werden.'));
        }
      } finally {
        if (!canceled) {
          setLoadingOrganizationOptions(false);
        }
      }
    }

    void loadOrganizationOptions();
    return () => {
      canceled = true;
    };
  }, [actor?.role, isValidUserId]);

  const isSelf = useMemo(() => {
    if (!user || !actor) {
      return false;
    }
    return user.id === actor.id;
  }, [actor, user]);

  const assignedOrganizationIds = useMemo(() => {
    return new Set((user?.organizations ?? []).map((organization) => organization.id));
  }, [user?.organizations]);

  const assignableOrganizations = useMemo(() => {
    return organizationOptions.filter((organization) => !assignedOrganizationIds.has(organization.id));
  }, [assignedOrganizationIds, organizationOptions]);

  const effectiveOrganizationSelectionId = useMemo(() => {
    if (
      typeof organizationSelectionId === 'number' &&
      assignableOrganizations.some((entry) => entry.id === organizationSelectionId)
    ) {
      return organizationSelectionId;
    }
    return assignableOrganizations.length > 0 ? assignableOrganizations[0].id : null;
  }, [assignableOrganizations, organizationSelectionId]);

  if (!isValidUserId) {
    return (
      <section className="page">
        <h1>Benutzer Details</h1>
        <p className="form-error">Ungültige Benutzer-ID.</p>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="page">
        <h1>Benutzer Details</h1>
        <p>Lade Benutzer...</p>
      </section>
    );
  }

  if (error || !user || !form) {
    return (
      <section className="page">
        <h1>Benutzer Details</h1>
        <p className="form-error">{error ?? 'Benutzer nicht gefunden.'}</p>
      </section>
    );
  }

  const isSystemUser = user.isSystem;
  const assignedOrganizations = user.organizations ?? [];

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setInfo(null);

    const payload: {
      firstName?: string;
      lastName?: string;
      username?: string;
      email?: string;
      phone?: string | null;
      role?: UserRole;
    } = {};

    if (differs(form.firstName, user.firstName ?? '')) {
      payload.firstName = form.firstName.trim();
    }
    if (differs(form.lastName, user.lastName ?? '')) {
      payload.lastName = form.lastName.trim();
    }
    if (differs(form.username, user.username)) {
      payload.username = form.username.trim();
    }
    if (differs(form.email, user.email)) {
      payload.email = form.email.trim();
    }
    if (differs(form.phone, user.phone ?? '')) {
      const nextPhone = form.phone.trim();
      payload.phone = nextPhone.length > 0 ? nextPhone : null;
    }
    if (form.role !== user.role) {
      payload.role = form.role;
    }

    if (Object.keys(payload).length === 0) {
      setInfo('Keine Änderungen vorhanden.');
      return;
    }

    setSaving(true);
    try {
      const response = await updateUserRequest(user.id, payload);
      const nextUser = withOrganizations(user, response.user);
      setUser(nextUser);
      setForm(toFormState(nextUser));
      setInfo('Benutzer wurde aktualisiert.');
    } catch (err) {
      setError(readErrorMessage(err, 'Benutzer konnte nicht aktualisiert werden.'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    setError(null);
    setInfo(null);
    setActionLoading(true);
    try {
      const response = user.isActive
        ? await deactivateUserRequest(user.id)
        : await activateUserRequest(user.id);
      const nextUser = withOrganizations(user, response.user);
      setUser(nextUser);
      setForm(toFormState(nextUser));
      setInfo(nextUser.isActive ? 'Benutzer aktiviert.' : 'Benutzer deaktiviert.');
    } catch (err) {
      setError(readErrorMessage(err, 'Status konnte nicht geändert werden.'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Benutzer wirklich löschen?')) {
      return;
    }
    setError(null);
    setInfo(null);
    setActionLoading(true);
    try {
      await deleteUserRequest(user.id);
      navigate('/users', { replace: true });
    } catch (err) {
      setError(readErrorMessage(err, 'Benutzer konnte nicht gelöscht werden.'));
      setActionLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!window.confirm('Passwort zurücksetzen?')) {
      return;
    }
    setError(null);
    setInfo(null);
    setActionLoading(true);
    try {
      const response = await resetUserPasswordRequest(user.id);
      setInfo(`Temporäres Passwort: ${response.temporaryPassword}`);
    } catch (err) {
      setError(readErrorMessage(err, 'Passwort konnte nicht zurückgesetzt werden.'));
    } finally {
      setActionLoading(false);
    }
  };

  const refreshUserWithOrganizations = async () => {
    const response = await getUserRequest(user.id);
    setUser(response.user);
    setForm(toFormState(response.user));
  };

  const handleAssignOrganization = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (effectiveOrganizationSelectionId === null) {
      return;
    }

    setOrganizationActionLoading(true);
    setOrganizationError(null);
    setOrganizationInfo(null);

    try {
      await assignUserToOrganizationRequest(effectiveOrganizationSelectionId, { userId: user.id });
      await refreshUserWithOrganizations();
      setOrganizationInfo('Organisation wurde zugewiesen.');
    } catch (err) {
      setOrganizationError(readErrorMessage(err, 'Organisation konnte nicht zugewiesen werden.'));
    } finally {
      setOrganizationActionLoading(false);
    }
  };

  const handleUnassignOrganization = async (organizationId: number) => {
    setOrganizationActionLoading(true);
    setOrganizationError(null);
    setOrganizationInfo(null);

    try {
      await unassignUserFromOrganizationRequest(organizationId, user.id);
      await refreshUserWithOrganizations();
      setOrganizationInfo('Organisation wurde entfernt.');
    } catch (err) {
      setOrganizationError(readErrorMessage(err, 'Organisation konnte nicht entfernt werden.'));
    } finally {
      setOrganizationActionLoading(false);
    }
  };

  return (
    <section className="page user-details-page">
      <h1>Benutzer Details</h1>

      <div className="user-details-header">
        <div>
          <p className="user-details-name">
            {[user.firstName, user.lastName].filter(Boolean).join(' ') || user.username}
          </p>
          <p className="user-details-meta">
            @{user.username} · {user.email}
          </p>
        </div>
        <div className="user-details-badges">
          <span className={user.isActive ? 'badge-success' : 'badge-muted'}>
            {user.isActive ? 'Aktiv' : 'Inaktiv'}
          </span>
          {user.isSystem ? <span className="badge-muted">System</span> : null}
        </div>
      </div>

      <div className="user-details-actions">
        <button
          type="button"
          onClick={handleToggleActive}
          disabled={actionLoading || isSystemUser || isSelf}
        >
          {user.isActive ? 'Benutzer deaktivieren' : 'Benutzer aktivieren'}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={actionLoading || isSystemUser || isSelf}
        >
          Benutzer löschen
        </button>
        <button type="button" onClick={handleResetPassword} disabled={actionLoading || isSelf}>
          Passwort zurücksetzen
        </button>
        <button
          type="button"
          onClick={() =>
            document.getElementById('user-organization-section')?.scrollIntoView({ behavior: 'smooth' })
          }
        >
          Autorisierung für Organisationen
        </button>
      </div>

      <section className="user-org-section" id="user-organization-section">
        <h2>Organisationen</h2>

        {organizationError ? <p className="form-error">{organizationError}</p> : null}
        {organizationInfo ? <p className="form-info">{organizationInfo}</p> : null}

        {assignedOrganizations.length === 0 ? (
          <p>Keine Organisationen zugewiesen.</p>
        ) : (
          <ul className="user-org-chip-list">
            {assignedOrganizations.map((organization) => (
              <li key={organization.id}>
                <span className="user-org-chip">{organization.name}</span>
                <button
                  type="button"
                  onClick={() => handleUnassignOrganization(organization.id)}
                  disabled={organizationActionLoading}
                >
                  Entfernen
                </button>
              </li>
            ))}
          </ul>
        )}

        <form className="user-org-assign-form" onSubmit={handleAssignOrganization}>
          <label htmlFor="user-org-select">Organisation zuweisen</label>
          <div className="user-org-assign-controls">
            <select
              id="user-org-select"
              value={effectiveOrganizationSelectionId ?? ''}
              onChange={(event) => {
                const parsed = Number(event.target.value);
                setOrganizationSelectionId(Number.isFinite(parsed) && parsed > 0 ? parsed : null);
              }}
              disabled={
                loadingOrganizationOptions ||
                organizationActionLoading ||
                assignableOrganizations.length === 0
              }
            >
              {assignableOrganizations.length === 0 ? (
                <option value="">Keine verfügbaren Organisationen</option>
              ) : null}
              {assignableOrganizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={
                loadingOrganizationOptions ||
                organizationActionLoading ||
                assignableOrganizations.length === 0 ||
                effectiveOrganizationSelectionId === null
              }
            >
              {organizationActionLoading ? 'Speichert...' : 'Zuweisen'}
            </button>
          </div>
        </form>
      </section>

      <form className="users-edit-form" onSubmit={handleSave}>
        <label>
          Vorname
          <input
            value={form.firstName}
            onChange={(event) =>
              setForm((current) => (current ? { ...current, firstName: event.target.value } : current))
            }
            required
          />
        </label>
        <label>
          Nachname
          <input
            value={form.lastName}
            onChange={(event) =>
              setForm((current) => (current ? { ...current, lastName: event.target.value } : current))
            }
            required
          />
        </label>
        <label>
          Benutzername
          <input
            value={form.username}
            onChange={(event) =>
              setForm((current) => (current ? { ...current, username: event.target.value } : current))
            }
            required
            disabled={isSystemUser}
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(event) =>
              setForm((current) => (current ? { ...current, email: event.target.value } : current))
            }
            required
            disabled={isSystemUser}
          />
        </label>
        <label>
          Telefonnummer
          <input
            value={form.phone}
            onChange={(event) =>
              setForm((current) => (current ? { ...current, phone: event.target.value } : current))
            }
          />
        </label>
        <label>
          Rolle
          <select
            value={form.role}
            onChange={(event) =>
              setForm((current) =>
                current ? { ...current, role: event.target.value as UserRole } : current
              )
            }
            disabled={isSystemUser || (isSelf && user.role === 'admin')}
          >
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
        </label>

        <button type="submit" disabled={saving}>
          {saving ? 'Speichern...' : 'Benutzer bearbeiten'}
        </button>
      </form>

      {error ? <p className="form-error">{error}</p> : null}
      {info ? <p className="form-info">{info}</p> : null}
    </section>
  );
}
