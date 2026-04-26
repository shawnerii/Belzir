import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { listAlerts } from '@/features/triage/api';
import type {
  AlertStatus,
  AlertSummary,
  ListAlertsResponse,
  Severity,
  SortField,
  SortOrder,
} from '@/types/soc';

type FiltersState = {
  severity?: Severity;
  status?: AlertStatus;
  sort: SortField;
  order: SortOrder;
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
  return 'Failed to load alert queue.';
}

export default function TriageList() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<AlertSummary[]>([]);
  const [pagination, setPagination] = useState<ListAlertsResponse['pagination'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FiltersState>({
    sort: 'received_at',
    order: 'desc',
  });

  useEffect(() => {
    let active = true;

    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await listAlerts({
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
        setAlerts(response.data);
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
    return `Showing ${alerts.length} of ${pagination.total} alerts`;
  }, [alerts.length, pagination]);

  const toggleSort = (field: SortField) => {
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
          <h2>Triage Queue</h2>
          <p>{totalText || 'Loading queue...'}</p>
        </div>
      </div>

      <div className="triage-filters">
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
                status: (event.target.value || undefined) as AlertStatus | undefined,
              }))
            }
          >
            <option value="">All</option>
            <option value="new">New</option>
            <option value="triaged">Triaged</option>
            <option value="escalated">Escalated</option>
            <option value="ignored">Ignored</option>
          </select>
        </label>
      </div>

      {error ? (
        <div className="soc-error">{error}</div>
      ) : (
        <div className="triage-table-wrap">
          <table className="triage-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>
                  <button type="button" onClick={() => toggleSort('received_at')}>
                    Timestamp {filters.sort === 'received_at' ? `(${filters.order})` : ''}
                  </button>
                </th>
                <th>
                  <button type="button" onClick={() => toggleSort('severity')}>
                    Severity {filters.sort === 'severity' ? `(${filters.order})` : ''}
                  </button>
                </th>
                <th>Rule</th>
                <th>Host</th>
                <th>IP</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7}>Loading alerts...</td>
                </tr>
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan={7}>No alerts match current filters.</td>
                </tr>
              ) : (
                alerts.map((alert) => (
                  <tr
                    key={alert.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/triage/${alert.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        navigate(`/triage/${alert.id}`);
                      }
                    }}
                  >
                    <td>{alert.id}</td>
                    <td>{formatTimestamp(alert.received_at)}</td>
                    <td>
                      <span className={`severity-badge severity-${alert.severity}`}>{alert.severity}</span>
                    </td>
                    <td>{alert.rule_name}</td>
                    <td>{alert.host}</td>
                    <td>{alert.ip}</td>
                    <td>{alert.status}</td>
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
