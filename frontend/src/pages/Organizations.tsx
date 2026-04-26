import { useEffect, useMemo, useState, type FormEvent } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/useAuth';
import {
  assignUserToOrganizationRequest,
  createOrganizationRequest,
  deleteOrganizationRequest,
  listOrganizationsRequest,
  listOrganizationUsersRequest,
  unassignUserFromOrganizationRequest,
} from '@/features/organizations/organizations-api';
import type { Organization, OrganizationUser } from '@/features/organizations/types';
import { listUsersRequest } from '@/features/users/users-api';
import type { User } from '@/features/users/types';

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

function fullNameOrUsername(user: Pick<User, 'firstName' | 'lastName' | 'username'>): string {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
  return fullName.length > 0 ? fullName : user.username;
}

export default function Organizations() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrganizations, setLoadingOrganizations] = useState(false);
  const [organizationsError, setOrganizationsError] = useState<string | null>(null);
  const [organizationsReloadTick, setOrganizationsReloadTick] = useState(0);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<number | null>(null);

  const [organizationUsers, setOrganizationUsers] = useState<OrganizationUser[]>([]);
  const [loadingOrganizationUsers, setLoadingOrganizationUsers] = useState(false);
  const [organizationUsersError, setOrganizationUsersError] = useState<string | null>(null);
  const [organizationUsersReloadTick, setOrganizationUsersReloadTick] = useState(0);
  const [organizationUsersForOrganizationId, setOrganizationUsersForOrganizationId] = useState<number | null>(
    null,
  );

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loadingAllUsers, setLoadingAllUsers] = useState(false);
  const [allUsersError, setAllUsersError] = useState<string | null>(null);

  const [assignmentUserId, setAssignmentUserId] = useState<number | null>(null);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createParentId, setCreateParentId] = useState<string>('');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [parentOptions, setParentOptions] = useState<Organization[]>([]);
  const [loadingParentOptions, setLoadingParentOptions] = useState(false);
  const [parentOptionsError, setParentOptionsError] = useState<string | null>(null);

  const selectedOrganization = useMemo(
    () => organizations.find((organization) => organization.id === selectedOrganizationId) ?? null,
    [organizations, selectedOrganizationId],
  );
  const hasLoadedUsersForSelectedOrganization =
    selectedOrganizationId !== null && organizationUsersForOrganizationId === selectedOrganizationId;

  const assignableUsers = useMemo(() => {
    const assignedIds = new Set<number>(organizationUsers.map((candidate) => candidate.id));
    return allUsers.filter((candidate) => !assignedIds.has(candidate.id));
  }, [allUsers, organizationUsers]);

  const effectiveAssignmentUserId = useMemo(() => {
    if (typeof assignmentUserId === 'number' && assignableUsers.some((entry) => entry.id === assignmentUserId)) {
      return assignmentUserId;
    }
    return assignableUsers.length > 0 ? assignableUsers[0].id : null;
  }, [assignableUsers, assignmentUserId]);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    let canceled = false;

    async function loadOrganizations() {
      setLoadingOrganizations(true);
      setOrganizationsError(null);

      try {
        const response = await listOrganizationsRequest({
          q: searchQuery.trim() || undefined,
        });
        if (canceled) {
          return;
        }

        setOrganizations(response.organizations);
        setSelectedOrganizationId((current) => {
          if (
            typeof current === 'number' &&
            response.organizations.some((organization) => organization.id === current)
          ) {
            return current;
          }
          return response.organizations.length > 0 ? response.organizations[0].id : null;
        });
      } catch (err) {
        if (!canceled) {
          setOrganizationsError(readErrorMessage(err, 'Organisationen konnten nicht geladen werden.'));
        }
      } finally {
        if (!canceled) {
          setLoadingOrganizations(false);
        }
      }
    }

    void loadOrganizations();

    return () => {
      canceled = true;
    };
  }, [isAdmin, searchQuery, organizationsReloadTick]);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    let canceled = false;

    async function loadUsers() {
      setLoadingAllUsers(true);
      setAllUsersError(null);
      try {
        const response = await listUsersRequest();
        if (!canceled) {
          setAllUsers(response.users);
        }
      } catch (err) {
        if (!canceled) {
          setAllUsersError(readErrorMessage(err, 'Benutzerliste konnte nicht geladen werden.'));
        }
      } finally {
        if (!canceled) {
          setLoadingAllUsers(false);
        }
      }
    }

    void loadUsers();

    return () => {
      canceled = true;
    };
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    if (selectedOrganizationId === null) {
      return;
    }

    const currentOrganizationId = selectedOrganizationId;

    let canceled = false;
    async function loadOrganizationUsers() {
      setLoadingOrganizationUsers(true);
      setOrganizationUsersError(null);
      try {
        const response = await listOrganizationUsersRequest(currentOrganizationId);
        if (!canceled) {
          setOrganizationUsersForOrganizationId(currentOrganizationId);
          setOrganizationUsers(response.users);
        }
      } catch (err) {
        if (!canceled) {
          setOrganizationUsersError(
            readErrorMessage(err, 'Zugewiesene Benutzer konnten nicht geladen werden.'),
          );
        }
      } finally {
        if (!canceled) {
          setLoadingOrganizationUsers(false);
        }
      }
    }

    void loadOrganizationUsers();

    return () => {
      canceled = true;
    };
  }, [isAdmin, selectedOrganizationId, organizationUsersReloadTick]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchQuery(searchInput.trim());
  };

  const handleOpenCreateModal = async () => {
    setCreateName('');
    setCreateParentId('');
    setCreateError(null);
    setParentOptionsError(null);
    setIsCreateModalOpen(true);
    setLoadingParentOptions(true);

    try {
      const response = await listOrganizationsRequest();
      setParentOptions(response.organizations);
    } catch (err) {
      setParentOptionsError(readErrorMessage(err, 'Organisationen konnten nicht geladen werden.'));
    } finally {
      setLoadingParentOptions(false);
    }
  };

  const handleCreateOrganization = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (createName.trim().length === 0) {
      return;
    }

    setCreateSubmitting(true);
    setCreateError(null);
    setActionError(null);
    setInfoMessage(null);

    try {
      const response = await createOrganizationRequest({
        name: createName.trim(),
        parentId: createParentId.length > 0 ? Number(createParentId) : null,
      });
      setIsCreateModalOpen(false);
      setSearchInput('');
      setSearchQuery('');
      setInfoMessage('Die Organisation wurde erstellt.');
      setSelectedOrganizationId(response.organization.id);
      setOrganizationsReloadTick((current) => current + 1);
    } catch (err) {
      setCreateError(readErrorMessage(err, 'Organisation konnte nicht erstellt werden.'));
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedOrganization) {
      return;
    }
    const confirmed = window.confirm(`Organisation "${selectedOrganization.name}" wirklich löschen?`);
    if (!confirmed) {
      return;
    }

    setDeleteLoading(true);
    setActionError(null);
    setInfoMessage(null);

    try {
      await deleteOrganizationRequest(selectedOrganization.id);
      setInfoMessage('Organisation wurde gelöscht.');
      setSelectedOrganizationId(null);
      setOrganizations((current) =>
        current.filter((organization) => organization.id !== selectedOrganization.id),
      );
      setOrganizationsReloadTick((current) => current + 1);
      setOrganizationUsers([]);
      setOrganizationUsersForOrganizationId(null);
    } catch (err) {
      setActionError(readErrorMessage(err, 'Organisation konnte nicht gelöscht werden.'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleAssignUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selectedOrganizationId === null || effectiveAssignmentUserId === null) {
      return;
    }

    setAssignmentLoading(true);
    setActionError(null);
    setInfoMessage(null);

    try {
      await assignUserToOrganizationRequest(selectedOrganizationId, { userId: effectiveAssignmentUserId });
      setInfoMessage('Benutzer wurde der Organisation zugewiesen.');
      setOrganizationUsersReloadTick((current) => current + 1);
    } catch (err) {
      setActionError(readErrorMessage(err, 'Benutzer konnte nicht zugewiesen werden.'));
    } finally {
      setAssignmentLoading(false);
    }
  };

  const handleUnassignUser = async (userId: number) => {
    if (selectedOrganizationId === null) {
      return;
    }

    setAssignmentLoading(true);
    setActionError(null);
    setInfoMessage(null);

    try {
      await unassignUserFromOrganizationRequest(selectedOrganizationId, userId);
      setInfoMessage('Benutzerzuweisung wurde entfernt.');
      setOrganizationUsersReloadTick((current) => current + 1);
    } catch (err) {
      setActionError(readErrorMessage(err, 'Benutzerzuweisung konnte nicht entfernt werden.'));
    } finally {
      setAssignmentLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <section className="page">
        <h1>Organisation ändern</h1>
        <p className="form-error">Diese Seite ist nur für Administratoren verfügbar.</p>
      </section>
    );
  }

  return (
    <section className="page org-page">
      <h1>Organisation ändern</h1>

      {infoMessage ? <p className="form-info">{infoMessage}</p> : null}
      {actionError ? <p className="form-error">{actionError}</p> : null}

      <div className="org-toolbar">
        <form className="org-search-form" onSubmit={handleSearchSubmit}>
          <input
            type="search"
            placeholder="Organisation suchen"
            aria-label="Organisation suchen"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
          <button type="submit">Suchen</button>
        </form>

        <div className="org-toolbar-actions">
          <button type="button" onClick={handleOpenCreateModal}>
            Erstellen
          </button>
          <button
            type="button"
            onClick={handleDeleteSelected}
            disabled={selectedOrganization === null || deleteLoading}
          >
            {deleteLoading ? 'Löschen...' : 'Löschen'}
          </button>
        </div>
      </div>

      <div className="org-grid">
        <section className="org-list-panel">
          {organizationsError ? <p className="form-error">{organizationsError}</p> : null}
          {loadingOrganizations ? <p>Lade Organisationen...</p> : null}

          {!loadingOrganizations && !organizationsError && organizations.length === 0 ? (
            <p className="org-empty-state">Keine Organisationen gefunden.</p>
          ) : null}

          {!loadingOrganizations && !organizationsError && organizations.length > 0 ? (
            <ul className="org-list">
              {organizations.map((organization) => (
                <li key={organization.id}>
                  <button
                    type="button"
                    className={
                      organization.id === selectedOrganizationId
                        ? 'org-list-item org-list-item-selected'
                        : 'org-list-item'
                    }
                    onClick={() => {
                      setLoadingOrganizationUsers(true);
                      setOrganizationUsers([]);
                      setOrganizationUsersError(null);
                      setSelectedOrganizationId(organization.id);
                    }}
                  >
                    <span className="org-list-name">{organization.name}</span>
                    <span className="org-list-meta">{organization.slug}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section className="org-users-panel">
          {selectedOrganization ? (
            <>
              <h2>{selectedOrganization.name}</h2>
              <p className="org-users-subtitle">Slug: {selectedOrganization.slug}</p>

              {organizationUsersError ? <p className="form-error">{organizationUsersError}</p> : null}
              {allUsersError ? <p className="form-error">{allUsersError}</p> : null}
              {loadingOrganizationUsers ? <p>Lade zugewiesene Benutzer...</p> : null}

              {!loadingOrganizationUsers && hasLoadedUsersForSelectedOrganization && organizationUsers.length === 0 ? (
                <p>Keine Benutzer</p>
              ) : null}

              {!loadingOrganizationUsers &&
              hasLoadedUsersForSelectedOrganization &&
              organizationUsers.length > 0 ? (
                <ul className="org-users-list">
                  {organizationUsers.map((entry) => (
                    <li key={entry.id}>
                      <div>
                        <span className="org-user-name">{fullNameOrUsername(entry)}</span>
                        <span className="org-user-meta">
                          {entry.email} · {entry.isActive ? 'Aktiv' : 'Inaktiv'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUnassignUser(entry.id)}
                        disabled={assignmentLoading}
                      >
                        Entfernen
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}

              <form className="org-assignment-form" onSubmit={handleAssignUser}>
                <label htmlFor="org-user-select">Benutzer zuweisen</label>
                <div className="org-assignment-controls">
                  <select
                    id="org-user-select"
                    value={effectiveAssignmentUserId ?? ''}
                    onChange={(event) => {
                      const parsed = Number(event.target.value);
                      setAssignmentUserId(Number.isFinite(parsed) && parsed > 0 ? parsed : null);
                    }}
                    disabled={loadingAllUsers || assignableUsers.length === 0 || assignmentLoading}
                  >
                    {assignableUsers.length === 0 ? (
                      <option value="">Keine verfügbaren Benutzer</option>
                    ) : null}
                    {assignableUsers.map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>
                        {fullNameOrUsername(candidate)} ({candidate.email})
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={
                      assignmentLoading ||
                      loadingAllUsers ||
                      assignableUsers.length === 0 ||
                      effectiveAssignmentUserId === null
                    }
                  >
                    {assignmentLoading ? 'Speichert...' : 'Zuweisen'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <p>Wählen Sie eine Organisation aus.</p>
          )}
        </section>
      </div>

      {isCreateModalOpen ? (
        <div className="org-modal-backdrop" role="presentation">
          <div className="org-modal" role="dialog" aria-modal="true" aria-label="Organisation erstellen">
            <h2>Organisation erstellen</h2>
            <p>
              Wählen Sie eine übergeordnete Organisation aus oder lassen Sie das Feld leer, um eine
              Hauptorganisation zu erstellen.
            </p>

            <form onSubmit={handleCreateOrganization} className="org-modal-form">
              <label>
                Obergeordnote Organisation
                <select
                  value={createParentId}
                  onChange={(event) => setCreateParentId(event.target.value)}
                  disabled={loadingParentOptions}
                >
                  <option value="">Keine</option>
                  {parentOptions.map((organization) => (
                    <option key={organization.id} value={organization.id}>
                      {organization.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Name
                <input
                  value={createName}
                  onChange={(event) => setCreateName(event.target.value)}
                  required
                  autoFocus
                />
              </label>

              {parentOptionsError ? <p className="form-error">{parentOptionsError}</p> : null}
              {createError ? <p className="form-error">{createError}</p> : null}

              <div className="org-modal-actions">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} disabled={createSubmitting}>
                  Abbrechen
                </button>
                <button type="submit" disabled={createSubmitting}>
                  {createSubmitting ? 'Speichert...' : 'Ja'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
