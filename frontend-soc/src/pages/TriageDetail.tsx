import { useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import { Link, useParams } from 'react-router-dom';
import { getAlert, submitDecision } from '@/features/triage/api';
import type { AlertDetail, DecisionType, TriageDecisionResult } from '@/types/soc';

const decisionButtons: Array<{ decision: DecisionType; label: string }> = [
  { decision: 'true_positive', label: 'True Positive' },
  { decision: 'false_positive', label: 'False Positive' },
  { decision: 'ignore', label: 'Ignore' },
  { decision: 'escalate', label: 'Escalate' },
];

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

export default function TriageDetail() {
  const { id } = useParams();
  const [alert, setAlert] = useState<AlertDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [decisionResult, setDecisionResult] = useState<TriageDecisionResult | null>(null);

  useEffect(() => {
    if (!id) {
      return;
    }

    let active = true;

    const loadAlert = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getAlert(id);
        if (!active) {
          return;
        }
        setAlert(response);
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

    void loadAlert();

    return () => {
      active = false;
    };
  }, [id]);

  const rawJsonText = useMemo(() => {
    if (!alert) {
      return '';
    }
    return JSON.stringify(alert.raw_json, null, 2);
  }, [alert]);

  const handleDecision = async (decision: DecisionType) => {
    if (!id) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const result = await submitDecision(id, {
        decision,
        note: note.trim() || undefined,
      });

      setDecisionResult(result);
      const updated = await getAlert(id);
      setAlert(updated);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!id) {
    return (
      <section className="soc-page">
        <div className="soc-error">Missing alert id.</div>
        <Link to="/triage" className="soc-link">
          Back to Triage Queue
        </Link>
      </section>
    );
  }

  if (isLoading) {
    return <section className="soc-page">Loading alert details...</section>;
  }

  if (!alert) {
    return (
      <section className="soc-page">
        <div className="soc-error">{error || 'Alert not found.'}</div>
        <Link to="/triage" className="soc-link">
          Back to Triage Queue
        </Link>
      </section>
    );
  }

  return (
    <section className="soc-page">
      <div className="soc-page-header">
        <div>
          <h2>{alert.id}</h2>
          <p>
            {alert.rule_name} | {alert.host} | {alert.ip}
          </p>
        </div>
        <Link to="/triage" className="soc-link">
          Back to Queue
        </Link>
      </div>

      {error ? <div className="soc-error">{error}</div> : null}

      {decisionResult ? (
        <div className="soc-success">
          Decision saved: {decisionResult.decision.decision}. Status changed from{' '}
          {decisionResult.alert.previous_status} to {decisionResult.alert.status}.
        </div>
      ) : null}

      <div className="triage-detail-grid">
        <section className="triage-card">
          <h3>Alert Metadata</h3>
          <dl className="triage-meta-list">
            <div>
              <dt>Timestamp</dt>
              <dd>{formatTimestamp(alert.received_at)}</dd>
            </div>
            <div>
              <dt>Severity</dt>
              <dd>{alert.severity}</dd>
            </div>
            <div>
              <dt>Rule</dt>
              <dd>
                {alert.rule_id} - {alert.rule_name}
              </dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{alert.status}</dd>
            </div>
            <div>
              <dt>Last Updated</dt>
              <dd>{formatTimestamp(alert.updated_at)}</dd>
            </div>
          </dl>
        </section>

        <section className="triage-card">
          <h3>Triage Decision</h3>
          <label className="triage-note">
            Optional note
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Add context for the decision..."
              rows={4}
            />
          </label>
          <div className="triage-actions">
            {decisionButtons.map((button) => (
              <button
                key={button.decision}
                type="button"
                disabled={isSubmitting}
                onClick={() => void handleDecision(button.decision)}
              >
                {button.label}
              </button>
            ))}
          </div>
        </section>
      </div>

      <section className="triage-card">
        <h3>Raw JSON</h3>
        <pre className="triage-json">{rawJsonText}</pre>
      </section>
    </section>
  );
}
