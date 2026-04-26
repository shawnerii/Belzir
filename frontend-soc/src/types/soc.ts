export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'new' | 'triaged' | 'escalated' | 'ignored';
export type DecisionType = 'true_positive' | 'false_positive' | 'ignore' | 'escalate';
export type SortField = 'received_at' | 'severity';
export type SortOrder = 'asc' | 'desc';
export type IncidentStatus = 'open' | 'investigating' | 'closed';
export type IncidentSortField = 'updated_at' | 'created_at' | 'severity';

export type AlertSummary = {
  id: string;
  received_at: string;
  severity: Severity;
  rule_id: string;
  rule_name: string;
  host: string;
  ip: string;
  status: AlertStatus;
  created_at: string;
  updated_at: string;
};

export type AlertDetail = AlertSummary & {
  raw_json: unknown;
};

export type ListAlertsParams = {
  severity?: Severity;
  status?: AlertStatus;
  sort?: SortField;
  order?: SortOrder;
  limit?: number;
  offset?: number;
};

export type ListAlertsResponse = {
  data: AlertSummary[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
};

export type TriageDecision = {
  id: string;
  alert_id: string;
  decision: DecisionType;
  note: string | null;
  decided_by: string;
  decided_at: string;
  created_at: string;
  updated_at: string;
};

export type TriageDecisionPayload = {
  decision: DecisionType;
  note?: string;
  decided_by?: string;
};

export type TriageDecisionResult = {
  decision: TriageDecision;
  alert: {
    id: string;
    previous_status: AlertStatus;
    status: AlertStatus;
    updated_at: string;
  };
};

export type IncidentSummary = {
  id: string;
  title: string;
  severity: Severity;
  status: IncidentStatus;
  created_at: string;
  updated_at: string;
  alert_count: number;
};

export type ListIncidentsParams = {
  severity?: Severity;
  status?: IncidentStatus;
  sort?: IncidentSortField;
  order?: SortOrder;
  limit?: number;
  offset?: number;
};

export type ListIncidentsResponse = {
  data: IncidentSummary[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
};

export type IncidentLinkedAlert = AlertSummary & {
  link_id: string;
  linked_at: string;
};

export type IncidentComment = {
  id: string;
  incident_id: string;
  author: string;
  body: string;
  created_at: string;
};

export type IncidentTimelineEventType =
  | 'incident_created'
  | 'incident_updated'
  | 'alert_linked'
  | 'comment_added';

export type IncidentTimelineEvent = {
  id: string;
  event_type: IncidentTimelineEventType;
  timestamp: string;
  incident_id: string;
  alert_id?: string;
  comment_id?: string;
  author?: string | null;
  body?: string;
};

export type IncidentDetailPayload = {
  incident: IncidentSummary;
  alerts: IncidentLinkedAlert[];
  comments: IncidentComment[];
  timeline: IncidentTimelineEvent[];
};

export type CreateIncidentPayload = {
  title: string;
  severity: Severity;
  status?: IncidentStatus;
};

export type UpdateIncidentPayload = {
  title?: string;
  severity?: Severity;
  status?: IncidentStatus;
};

export type LinkIncidentAlertPayload = {
  alert_id: string;
};

export type IncidentAlertLinkResult = {
  id: string;
  incident_id: string;
  alert_id: string;
  linked_at: string;
};

export type CreateIncidentCommentPayload = {
  body: string;
  author?: string;
};
