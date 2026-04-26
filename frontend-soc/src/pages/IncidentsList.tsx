import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import { createIncident, listIncidents } from '@/features/incidents/api';
import type {
  IncidentSortField,
  IncidentStatus,
  IncidentSummary,
  ListIncidentsResponse,
  Severity,
  SortOrder,
} from '@/types/soc';

type IncidentFiltersState = {
  severity?: Severity;
  status?: IncidentStatus;
  sort: IncidentSortField;
  order: SortOrder;
};

type CreateIncidentState = {
  title: string;
  severity: Severity;
  status: IncidentStatus;
};

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString();
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const apiMessage = error.response?.data?.error as string | undefined;
    if (apiMessage) {
      return apiMessage;
    }
    if (error.message) {
      return error.message;
    }
  }
  return 'Unexpected error';
}

export default function IncidentsList() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<IncidentSummary[]>([]);
  const [pagination, setPagination] = useState<ListIncidentsResponse['pagination'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<IncidentFiltersState>({
    sort: 'updated_at',
    order: 'desc',
  });

  const [createForm, setCreateForm] = useState<CreateIncidentState>({
    title: '',
    severity: 'medium',
    status: 'open',
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await listIncidents({
          severity: filters.severity,
          status: filters.status,
          sort: filters.sort,
          order: filters.order,
          limit: 50,
          offset: 0,
        });

        if (!active) {
          return;
        }

        setIncidents(response.data);
        setPagination(response.pagination);
      } catch (err) {
        if (!active) {
          return;
        }
        setError(extractErrorMessage(err));
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void run();

    return () => {
      active = false;
    };
  }, [filters.order, filters.severity, filters.sort, filters.status]);

  const totalText = useMemo(() => {
    if (!pagination) {
      return '';
    }
    return `Showing ${incidents.length} of ${pagination.total} incidents`;
  }, [incidents.length, pagination]);

  const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateError(null);

    const title = createForm.title.trim();
    if (!title) {
      setCreateError('Title is required.');
      return;
    }

    setIsCreating(true);
    try {
      const incident = await createIncident({
        title,
        severity: createForm.severity,
        status: createForm.status,
      });
      navigate(`/incidents/${incident.id}`);
    } catch (err) {
      setCreateError(extractErrorMessage(err));
    } finally {
      setIsCreating(false);
    }
  };

  const toggleSort = (field: IncidentSortField) => {
    setFilters((current) => {
      if (current.sort === field) {
        return {
          ...current,
          order: current.order === 'asc' ? 'desc' : 'asc',
        };
      }
      return {
        ...current,
        sort: field,
        order: 'desc',
      };
    });
  };

  return (
    <section className="soc-page">
      <div className="soc-page-header">
        <div>
          <h2>Incidents</h2>
          <p>{totalText || 'Loading incidents...'}</p>
        </div>
      </div>

      <div className="incidents-grid">
        <section className="triage-card">
          <h3>Create Incident</h3>
          <form className="incident-form" onSubmit={(event) => void handleCreateSubmit(event)}>
            <label>
              Title
              <input
                value={createForm.title}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder="e.g. Privilege Escalation Investigation"
                maxLength={240}
              />
            </label>

            <label>
              Severity
              <select
                value={createForm.severity}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    severity: event.target.value as Severity,
                  }))
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </label>

            <label>
              Status
              <select
                value={createForm.status}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    status: event.target.value as IncidentStatus,
                  }))
                }
              >
                <option value="open">Open</option>
                <option value="investigating">Investigating</option>
                <option value="closed">Closed</option>
              </select>
            </label>

            {createError ? <div className="soc-error">{createError}</div> : null}
            <button type="submit" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Incident'}
            </button>
          </form>
        </section>

        <section className="triage-card">
          <h3>Filters</h3>
          <div className="triage-filters incidents-filters">
            <label>
              Severity
              <select
                value={filters.severity ?? ''}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    severity: (event.target.value || undefined) as Severity | undefined,
                  }))
                }
              >
                <option value="">All</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </label>

            <label>
              Status
              <select
                value={filters.status ?? ''}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    status: (event.target.value || undefined) as IncidentStatus | undefined,
                  }))
                }
              >
                <option value="">All</option>
                <option value="open">Open</option>
                <option value="investigating">Investigating</option>
                <option value="closed">Closed</option>
              </select>
            </label>
          </div>
        </section>
      </div>

      {error ? (
        <div className="soc-error">{error}</div>
      ) : (
        <div className="triage-table-wrap">
          <table className="triage-table incidents-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>
                  <button type="button" onClick={() => toggleSort('severity')}>
                    Severity {filters.sort === 'severity' ? `(${filters.order})` : ''}
                  </button>
                </th>
                <th>Status</th>
                <th>Alert Count</th>
                <th>
                  <button type="button" onClick={() => toggleSort('updated_at')}>
                    Updated {filters.sort === 'updated_at' ? `(${filters.order})` : ''}
                  </button>
                </th>
                <th>
                  <button type="button" onClick={() => toggleSort('created_at')}>
                    Created {filters.sort === 'created_at' ? `(${filters.order})` : ''}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7}>Loading incidents...</td>
                </tr>
              ) : incidents.length === 0 ? (
                <tr>
                  <td colSpan={7}>No incidents match current filters.</td>
                </tr>
              ) : (
                incidents.map((incident) => (
                  <tr
                    key={incident.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/incidents/${incident.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        navigate(`/incidents/${incident.id}`);
                      }
                    }}
                  >
                    <td>{incident.id}</td>
                    <td>{incident.title}</td>
                    <td>
                      <span className={`severity-badge severity-${incident.severity}`}>{incident.severity}</span>
                    </td>
                    <td>{incident.status}</td>
                    <td>{incident.alert_count}</td>
                    <td>{formatTimestamp(incident.updated_at)}</td>
                    <td>{formatTimestamp(incident.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
