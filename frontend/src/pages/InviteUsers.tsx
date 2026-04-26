import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import axios from 'axios';
import {
  createInvitationsRequest,
  listInvitationsRequest,
} from '@/features/invitations/invitations-api';
import type {
  CreateInvitationResult,
  CreateInvitationsResponse,
  Invitation,
  InvitationStatus,
} from '@/features/invitations/types';
import { listOrganizationsRequest } from '@/features/organizations/organizations-api';
import type { Organization } from '@/features/organizations/types';
import { useAuth } from '@/context/useAuth';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type InvitationStatusFilter = InvitationStatus | 'all';
type InvitationOrgFilter = number | 'all';

function normalizeEmailForDedupe(value: string): string {
  return value.normalize('NFKC').trim().toLowerCase();
}

function splitEmailInput(value: string): string[] {
  return value
    .split(/[\s,;]+/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function parseUniqueEmails(value: string): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const email of splitEmailInput(value)) {
    const dedupeKey = normalizeEmailForDedupe(email);
    if (dedupeKey.length === 0 || seen.has(dedupeKey)) {
      continue;
    }

    seen.add(dedupeKey);
    unique.push(email);
  }

  return unique;
}

function statusLabel(status: Invitation['status']): string {
  if (status === 'pending') {
    return 'Ausstehend';
  }
  if (status === 'revoked') {
    return 'Widerrufen';
  }
  return 'Akzeptiert';
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('de-DE');
}

function readErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const message = err.response?.data?.error;
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
  }
  return fallback;
}

function readResultDetailsFromError(err: unknown): CreateInvitationResult[] | null {
  if (!axios.isAxiosError(err)) {
    return null;
  }

  const details = err.response?.data?.details;
  const results = details?.results;

  if (!Array.isArray(results)) {
    return null;
  }

  return results
    .filter((entry) => {
      return (
        typeof entry === 'object' &&
        entry !== null &&
        typeof entry.status === 'string' &&
        typeof entry.email === 'string' &&
        typeof entry.input === 'string'
      );
    })
    .map((entry) => {
      const normalized =
        typeof entry.emailNormalized === 'string'
          ? entry.emailNormalized
          : normalizeEmailForDedupe(entry.email as string);

      return {
        ...(entry as CreateInvitationResult),
        emailNormalized: normalized,
      };
    });
}

export default function InviteUsers() {
  const { user } = useAuth();

  const [emailsInput, setEmailsInput] = useState('');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<number | null>(null);
  const [recentInvitations, setRecentInvitations] = useState<Invitation[]>([]);

  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [loadingInvitations, setLoadingInvitations] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [organizationLoadError, setOrganizationLoadError] = useState<string | null>(null);
  const [invitationLoadError, setInvitationLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitInfo, setSubmitInfo] = useState<string | null>(null);
  const [lastResults, setLastResults] = useState<CreateInvitationResult[] | null>(null);

  const [invitationQuery, setInvitationQuery] = useState('');
  const [invitationStatusFilter, setInvitationStatusFilter] =
    useState<InvitationStatusFilter>('all');
  const [invitationOrgFilter, setInvitationOrgFilter] = useState<InvitationOrgFilter>('all');
  const [invitationRefreshTick, setInvitationRefreshTick] = useState(0);

  const invitationRequestIdRef = useRef(0);

  const parsedEmails = useMemo(() => parseUniqueEmails(emailsInput), [emailsInput]);
  const invalidClientEmails = useMemo(
    () => parsedEmails.filter((email) => !EMAIL_PATTERN.test(email)),
    [parsedEmails],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadOrganizations() {
      if (user?.role !== 'admin') {
        setLoadingOrgs(false);
        setOrganizations([]);
        setSelectedOrganizationId(null);
        return;
      }

      setLoadingOrgs(true);
      setOrganizationLoadError(null);

      try {
        const response = await listOrganizationsRequest();
        if (cancelled) {
          return;
        }

        setOrganizations(response.organizations);
        setSelectedOrganizationId((current) => {
          if (
            current !== null &&
            response.organizations.some((organization) => organization.id === current)
          ) {
            return current;
          }

          return response.organizations.length > 0 ? response.organizations[0].id : null;
        });
      } catch (err) {
        if (!cancelled) {
          setOrganizationLoadError(readErrorMessage(err, 'Organisationen konnten nicht geladen werden.'));
        }
      } finally {
        if (!cancelled) {
          setLoadingOrgs(false);
        }
      }
    }

    void loadOrganizations();

    return () => {
      cancelled = true;
    };
  }, [user?.role]);

  useEffect(() => {
    let cancelled = false;
    const requestId = invitationRequestIdRef.current + 1;
    invitationRequestIdRef.current = requestId;

    async function loadInvitations() {
      if (user?.role !== 'admin') {
        setLoadingInvitations(false);
        setRecentInvitations([]);
        return;
      }

      setLoadingInvitations(true);
      setInvitationLoadError(null);

      try {
        const response = await listInvitationsRequest({
          limit: 10,
          q: invitationQuery.trim() || undefined,
          status: invitationStatusFilter === 'all' ? undefined : invitationStatusFilter,
          organizationId: invitationOrgFilter === 'all' ? undefined : invitationOrgFilter,
        });

        if (cancelled || requestId !== invitationRequestIdRef.current) {
          return;
        }

        setRecentInvitations(response.invitations);
      } catch (err) {
        if (cancelled || requestId !== invitationRequestIdRef.current) {
          return;
        }

        setInvitationLoadError(readErrorMessage(err, 'Einladungen konnten nicht geladen werden.'));
      } finally {
        if (!cancelled && requestId === invitationRequestIdRef.current) {
          setLoadingInvitations(false);
        }
      }
    }

    void loadInvitations();

    return () => {
      cancelled = true;
    };
  }, [
    user?.role,
    invitationQuery,
    invitationStatusFilter,
    invitationOrgFilter,
    invitationRefreshTick,
  ]);

  function refreshInvitations() {
    setInvitationRefreshTick((current) => current + 1);
  }

  const canSubmit = useMemo(() => {
    return !submitting && parsedEmails.length > 0 && selectedOrganizationId !== null;
  }, [parsedEmails.length, selectedOrganizationId, submitting]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || selectedOrganizationId === null) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSubmitInfo(null);
    setLastResults(null);

    try {
      const response: CreateInvitationsResponse = await createInvitationsRequest({
        emails: parsedEmails,
        organizationId: selectedOrganizationId,
      });

      setLastResults(response.results);
      setSubmitInfo(
        `Verarbeitet: ${response.summary.requested}, erstellt: ${response.summary.created}, doppelt: ${response.summary.duplicate}, ungültig: ${response.summary.invalid}.`,
      );

      if (response.summary.created > 0) {
        setEmailsInput('');
      }

      refreshInvitations();
    } catch (err) {
      setSubmitError(readErrorMessage(err, 'Einladungen konnten nicht erstellt werden.'));
      setLastResults(readResultDetailsFromError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <section className="page invite-page">
        <h1>Benutzer einladen</h1>
        <p className="form-error">Nur Administratoren dürfen Einladungen verwalten.</p>
      </section>
    );
  }

  return (
    <section className="page invite-page">
      <h1>Benutzer einladen</h1>
      <div className="invite-grid">
        <section className="invite-form" aria-labelledby="invite-form-title">
          <h2 id="invite-form-title">Einladung erstellen</h2>
          <form onSubmit={handleSubmit}>
            <label htmlFor="invite-emails">Email Addressen eingeben</label>
            <textarea
              id="invite-emails"
              className="invite-emails"
              value={emailsInput}
              onChange={(event) => setEmailsInput(event.target.value)}
              placeholder="beispiel1@firma.de, beispiel2@firma.de"
              rows={8}
            />

            <p className="invite-hint">
              {parsedEmails.length} eindeutige Adressen erkannt.
              {invalidClientEmails.length > 0 ? ` ${invalidClientEmails.length} wirken ungültig.` : ''}
            </p>

            <label htmlFor="invite-organization">Organisation wechseln</label>
            <select
              id="invite-organization"
              value={selectedOrganizationId ?? ''}
              onChange={(event) => {
                const nextValue = Number(event.target.value);
                setSelectedOrganizationId(Number.isFinite(nextValue) ? nextValue : null);
              }}
              disabled={loadingOrgs || organizations.length === 0}
            >
              {organizations.length === 0 ? (
                <option value="" disabled>
                  {loadingOrgs ? 'Lade Organisationen...' : 'Keine Organisationen verfügbar'}
                </option>
              ) : null}
              {organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
            </select>

            <button type="submit" disabled={!canSubmit}>
              {submitting ? 'Lädt...' : 'Einladen'}
            </button>
          </form>

          {organizationLoadError ? <p className="form-error">{organizationLoadError}</p> : null}
          {submitError ? <p className="form-error">{submitError}</p> : null}
          {submitInfo ? <p className="form-info">{submitInfo}</p> : null}

          {lastResults ? (
            <ul className="invite-results" aria-label="Einladungsergebnisse">
              {lastResults.map((result, index) => (
                <li key={`${result.input}-${result.status}-${index}`} className={`invite-result-${result.status}`}>
                  <span>{result.email}</span>
                  <span>
                    {result.status}
                    {result.reason ? ` · ${result.reason}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section className="invite-recent" aria-labelledby="invite-recent-title">
          <div className="invite-recent-header">
            <h2 id="invite-recent-title">Letzte Einladungen</h2>
            <button type="button" onClick={refreshInvitations} disabled={loadingInvitations}>
              Aktualisieren
            </button>
          </div>

          <div className="invite-filter-row">
            <input
              type="search"
              value={invitationQuery}
              onChange={(event) => setInvitationQuery(event.target.value)}
              placeholder="Email oder Organisation filtern"
              aria-label="Einladungen filtern"
            />
            <select
              value={invitationStatusFilter}
              onChange={(event) => setInvitationStatusFilter(event.target.value as InvitationStatusFilter)}
              aria-label="Status filtern"
            >
              <option value="all">Alle Status</option>
              <option value="pending">Ausstehend</option>
              <option value="revoked">Widerrufen</option>
              <option value="accepted">Akzeptiert</option>
            </select>
            <select
              value={invitationOrgFilter === 'all' ? 'all' : String(invitationOrgFilter)}
              onChange={(event) => {
                if (event.target.value === 'all') {
                  setInvitationOrgFilter('all');
                  return;
                }

                const nextValue = Number(event.target.value);
                setInvitationOrgFilter(Number.isFinite(nextValue) ? nextValue : 'all');
              }}
              aria-label="Organisation filtern"
            >
              <option value="all">Alle Organisationen</option>
              {organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setInvitationQuery('');
                setInvitationStatusFilter('all');
                setInvitationOrgFilter('all');
              }}
            >
              Zurücksetzen
            </button>
          </div>

          {invitationLoadError ? <p className="form-error">{invitationLoadError}</p> : null}
          {loadingInvitations ? <p>Lade Einladungen...</p> : null}

          {!loadingInvitations ? (
            <ul className="invite-recent-list">
              {recentInvitations.map((invitation) => (
                <li key={invitation.id}>
                  <div className="invite-recent-top">
                    <strong>{invitation.email}</strong>
                    <span className={`invite-status invite-status-${invitation.status}`}>
                      {statusLabel(invitation.status)}
                    </span>
                  </div>
                  <div className="invite-recent-meta">
                    <span>{invitation.organizationName}</span>
                    <span>{formatTimestamp(invitation.createdAt)}</span>
                  </div>
                </li>
              ))}
              {recentInvitations.length === 0 ? <li>Keine Einladungen vorhanden.</li> : null}
            </ul>
          ) : null}
        </section>
      </div>
    </section>
  );
}
