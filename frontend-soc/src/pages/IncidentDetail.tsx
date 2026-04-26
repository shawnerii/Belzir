import { useEffect, useState, type FormEvent } from 'react';
import { AxiosError } from 'axios';
import { Link, useParams } from 'react-router-dom';
import {
  addIncidentComment,
  getIncident,
  linkAlertToIncident,
  updateIncident,
} from '@/features/incidents/api';
import type {
  IncidentDetailPayload,
  IncidentStatus,
  IncidentTimelineEvent,
  Severity,
} from '@/types/soc';

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

function formatTimelineEvent(event: IncidentTimelineEvent): string {
  switch (event.event_type) {
    case 'incident_created':
      return 'Incident created';
    case 'incident_updated':
      return 'Incident updated';
    case 'alert_linked':
      return event.alert_id ? `Alert linked (${event.alert_id})` : 'Alert linked';
    case 'comment_added':
      return event.author ? `Comment added by ${event.author}` : 'Comment added';
    default:
      return event.event_type;
  }
}

export default function IncidentDetail() {
  const { id } = useParams();
  const [detail, setDetail] = useState<IncidentDetailPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const [updateTitle, setUpdateTitle] = useState('');
  const [updateSeverity, setUpdateSeverity] = useState<Severity>('medium');
  const [updateStatus, setUpdateStatus] = useState<IncidentStatus>('open');

  const [alertIdToLink, setAlertIdToLink] = useState('');
  const [commentBody, setCommentBody] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');

  const loadIncident = async (incidentId: string, showLoading: boolean) => {
    if (showLoading) {
      setIsLoading(true);
    }
    try {
      const response = await getIncident(incidentId);
      setDetail(response);
      setUpdateTitle(response.incident.title);
      setUpdateSeverity(response.incident.severity);
      setUpdateStatus(response.incident.status);
      setError(null);
    } catch (err) {
      setError(extractErrorMessage(err));
      setDetail(null);
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!id) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      void loadIncident(id, true);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [id]);

  const handleUpdateIncident = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id) {
      return;
    }

    const title = updateTitle.trim();
    if (!title) {
      setError('Title is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setInfoMessage(null);
    try {
      await updateIncident(id, {
        title,
        severity: updateSeverity,
        status: updateStatus,
      });
      await loadIncident(id, false);
      setInfoMessage('Incident updated.');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLinkAlert = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id) {
      return;
    }

    const alertId = alertIdToLink.trim();
    if (!alertId) {
      setError('Alert ID is required to create a link.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setInfoMessage(null);
    try {
      await linkAlertToIncident(id, { alert_id: alertId });
      setAlertIdToLink('');
      await loadIncident(id, false);
      setInfoMessage(`Alert ${alertId} linked.`);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id) {
      return;
    }

    const body = commentBody.trim();
    if (!body) {
      setError('Comment body is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setInfoMessage(null);
    try {
      await addIncidentComment(id, {
        body,
        author: commentAuthor.trim() || undefined,
      });
      setCommentBody('');
      setCommentAuthor('');
      await loadIncident(id, false);
      setInfoMessage('Comment added.');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!id) {
    return (
      <section className="soc-page">
        <div className="soc-error">Missing incident id.</div>
        <Link to="/incidents" className="soc-link">
          Back to Incidents
        </Link>
      </section>
    );
  }

  if (isLoading) {
    return <section className="soc-page">Loading incident...</section>;
  }

  if (!detail) {
    return (
      <section className="soc-page">
        <div className="soc-error">{error || 'Incident not found.'}</div>
        <Link to="/incidents" className="soc-link">
          Back to Incidents
        </Link>
      </section>
    );
  }

  return (
    <section className="soc-page">
      <div className="soc-page-header">
        <div>
          <h2>{detail.incident.id}</h2>
          <p>
            {detail.incident.title} | {detail.incident.severity} | {detail.incident.status}
          </p>
        </div>
        <Link to="/incidents" className="soc-link">
          Back to Incidents
        </Link>
      </div>

      {error ? <div className="soc-error">{error}</div> : null}
      {infoMessage ? <div className="soc-success">{infoMessage}</div> : null}

      <div className="incident-detail-grid">
        <section className="triage-card">
          <h3>Incident Metadata</h3>
          <dl className="triage-meta-list">
            <div>
              <dt>Title</dt>
              <dd>{detail.incident.title}</dd>
            </div>
            <div>
              <dt>Severity</dt>
              <dd>{detail.incident.severity}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{detail.incident.status}</dd>
            </div>
            <div>
              <dt>Alert Count</dt>
              <dd>{detail.incident.alert_count}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatTimestamp(detail.incident.created_at)}</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>{formatTimestamp(detail.incident.updated_at)}</dd>
            </div>
          </dl>
        </section>

        <section className="triage-card">
          <h3>Update Incident</h3>
          <form className="incident-form" onSubmit={(event) => void handleUpdateIncident(event)}>
            <label>
              Title
              <input
                value={updateTitle}
                onChange={(event) => setUpdateTitle(event.target.value)}
                maxLength={240}
              />
            </label>
            <label>
              Severity
              <select
                value={updateSeverity}
                onChange={(event) => setUpdateSeverity(event.target.value as Severity)}
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
                value={updateStatus}
                onChange={(event) => setUpdateStatus(event.target.value as IncidentStatus)}
              >
                <option value="open">Open</option>
                <option value="investigating">Investigating</option>
                <option value="closed">Closed</option>
              </select>
            </label>
            <button type="submit" disabled={isSubmitting}>
              Save Incident
            </button>
          </form>
        </section>
      </div>

      <div className="incident-detail-grid">
        <section className="triage-card">
          <h3>Link Alert</h3>
          <form className="incident-form" onSubmit={(event) => void handleLinkAlert(event)}>
            <label>
              Alert ID
              <input
                value={alertIdToLink}
                onChange={(event) => setAlertIdToLink(event.target.value)}
                placeholder="alert-001"
              />
            </label>
            <button type="submit" disabled={isSubmitting}>
              Link Alert
            </button>
          </form>
        </section>

        <section className="triage-card">
          <h3>Add Comment</h3>
          <form className="incident-form" onSubmit={(event) => void handleAddComment(event)}>
            <label>
              Comment
              <textarea
                value={commentBody}
                onChange={(event) => setCommentBody(event.target.value)}
                rows={4}
                maxLength={4000}
              />
            </label>
            <label>
              Author (optional)
              <input
                value={commentAuthor}
                onChange={(event) => setCommentAuthor(event.target.value)}
                placeholder="analyst2"
                maxLength={120}
              />
            </label>
            <button type="submit" disabled={isSubmitting}>
              Add Comment
            </button>
          </form>
        </section>
      </div>

      <section className="triage-card">
        <h3>Linked Alerts</h3>
        <div className="triage-table-wrap">
          <table className="triage-table incidents-alerts-table">
            <thead>
              <tr>
                <th>Alert ID</th>
                <th>Linked At</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Rule</th>
                <th>Host</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {detail.alerts.length === 0 ? (
                <tr>
                  <td colSpan={7}>No linked alerts yet.</td>
                </tr>
              ) : (
                detail.alerts.map((alert) => (
                  <tr key={alert.link_id}>
                    <td>{alert.id}</td>
                    <td>{formatTimestamp(alert.linked_at)}</td>
                    <td>
                      <span className={`severity-badge severity-${alert.severity}`}>{alert.severity}</span>
                    </td>
                    <td>{alert.status}</td>
                    <td>{alert.rule_name}</td>
                    <td>{alert.host}</td>
                    <td>{alert.ip}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="incident-detail-grid">
        <section className="triage-card">
          <h3>Comments</h3>
          <ul className="incident-comments">
            {detail.comments.length === 0 ? (
              <li>No comments yet.</li>
            ) : (
              detail.comments.map((comment) => (
                <li key={comment.id}>
                  <div className="incident-comments-meta">
                    <strong>{comment.author}</strong> at {formatTimestamp(comment.created_at)}
                  </div>
                  <div>{comment.body}</div>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="triage-card">
          <h3>Timeline</h3>
          <ul className="incident-timeline">
            {detail.timeline.map((event) => (
              <li key={event.id}>
                <div className="incident-timeline-time">{formatTimestamp(event.timestamp)}</div>
                <div>{formatTimelineEvent(event)}</div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}
