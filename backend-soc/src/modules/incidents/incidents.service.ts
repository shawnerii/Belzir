import { randomUUID } from 'crypto';
import type { Knex } from 'knex';
import db from '../../db/knex';
import { AppError } from '../../middleware/errorHandler';
import type {
  CreateIncidentBody,
  IncidentSeverity,
  IncidentStatus,
  ListIncidentsQuery,
  UpdateIncidentBody,
} from './incidents.schemas';

type DbExecutor = Knex | Knex.Transaction;

type IncidentRow = {
  id: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  created_at: string;
  updated_at: string;
};

type IncidentSummaryRow = IncidentRow & {
  alert_count: number | string;
};

type AlertLookupRow = {
  id: string;
};

type LinkedAlertRow = {
  link_id: string;
  linked_at: string;
  id: string;
  received_at: string;
  severity: IncidentSeverity;
  rule_id: string;
  rule_name: string;
  host: string;
  ip: string;
  status: 'new' | 'triaged' | 'escalated' | 'ignored';
  created_at: string;
  updated_at: string;
};

type IncidentCommentRow = {
  id: string;
  incident_id: string;
  author: string | null;
  body: string;
  created_at: string;
};

type IncidentAlertLinkInsertRow = {
  id: string;
  incident_id: string;
  alert_id: string;
  linked_at: string;
};

type IncidentCommentInsertRow = {
  id: string;
  incident_id: string;
  author: string;
  body: string;
  created_at: string;
};

export type IncidentSummary = IncidentRow & {
  alert_count: number;
};

export type IncidentAlertLinkRecord = {
  id: string;
  incident_id: string;
  alert_id: string;
  linked_at: string;
};

export type IncidentCommentRecord = {
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
  alerts: LinkedAlertRow[];
  comments: IncidentCommentRecord[];
  timeline: IncidentTimelineEvent[];
};

export type ListIncidentsResponse = {
  data: IncidentSummary[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
};

function normalizeOptionalText(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed;
}

function parseCount(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return 0;
}

function severitySortSql(order: 'asc' | 'desc'): string {
  const direction = order === 'asc' ? 'asc' : 'desc';
  return `case i.severity when 'low' then 1 when 'medium' then 2 when 'high' then 3 when 'critical' then 4 else 0 end ${direction}`;
}

function mapIncidentSummary(row: IncidentSummaryRow): IncidentSummary {
  return {
    id: row.id,
    title: row.title,
    severity: row.severity,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    alert_count: parseCount(row.alert_count),
  };
}

function isDuplicateIncidentAlertLinkError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const maybeCode = (error as { code?: string }).code;
  if (maybeCode === 'SQLITE_CONSTRAINT_UNIQUE') {
    return true;
  }

  const maybeMessage = (error as { message?: string }).message;
  return (
    typeof maybeMessage === 'string' &&
    maybeMessage.includes('SQLITE_CONSTRAINT') &&
    maybeMessage.includes('incident_alert_links.incident_id') &&
    maybeMessage.includes('incident_alert_links.alert_id')
  );
}

async function loadIncidentSummaryById(
  executor: DbExecutor,
  incidentId: string,
): Promise<IncidentSummary | null> {
  const row = (await executor('incidents as i')
    .leftJoin('incident_alert_links as l', 'l.incident_id', 'i.id')
    .select('i.id', 'i.title', 'i.severity', 'i.status', 'i.created_at', 'i.updated_at')
    .count({ alert_count: 'l.id' })
    .where('i.id', incidentId)
    .groupBy('i.id')
    .first()) as IncidentSummaryRow | undefined;

  if (!row) {
    return null;
  }

  return mapIncidentSummary(row);
}

function buildTimeline(input: {
  incident: IncidentSummary;
  alerts: LinkedAlertRow[];
  comments: IncidentCommentRecord[];
}): IncidentTimelineEvent[] {
  const timeline: IncidentTimelineEvent[] = [
    {
      id: `incident_created:${input.incident.id}`,
      event_type: 'incident_created',
      timestamp: input.incident.created_at,
      incident_id: input.incident.id,
    },
  ];

  if (input.incident.updated_at !== input.incident.created_at) {
    timeline.push({
      id: `incident_updated:${input.incident.id}:${input.incident.updated_at}`,
      event_type: 'incident_updated',
      timestamp: input.incident.updated_at,
      incident_id: input.incident.id,
    });
  }

  for (const linkedAlert of input.alerts) {
    timeline.push({
      id: `alert_linked:${linkedAlert.link_id}`,
      event_type: 'alert_linked',
      timestamp: linkedAlert.linked_at,
      incident_id: input.incident.id,
      alert_id: linkedAlert.id,
    });
  }

  for (const comment of input.comments) {
    timeline.push({
      id: `comment_added:${comment.id}`,
      event_type: 'comment_added',
      timestamp: comment.created_at,
      incident_id: input.incident.id,
      comment_id: comment.id,
      author: comment.author,
      body: comment.body,
    });
  }

  timeline.sort((left, right) => {
    const timeCompare = left.timestamp.localeCompare(right.timestamp);
    if (timeCompare !== 0) {
      return timeCompare;
    }
    return left.id.localeCompare(right.id);
  });

  return timeline;
}

export async function listIncidentsService(query: ListIncidentsQuery): Promise<ListIncidentsResponse> {
  const countQuery = db<IncidentRow>('incidents as i');

  if (query.severity) {
    countQuery.where('i.severity', query.severity);
  }
  if (query.status) {
    countQuery.where('i.status', query.status);
  }

  const countRow = await countQuery.count<{ count: number | string }>({ count: 'i.id' }).first();
  const total = parseCount(countRow?.count);

  const rowsQuery = db('incidents as i')
    .leftJoin('incident_alert_links as l', 'l.incident_id', 'i.id')
    .select('i.id', 'i.title', 'i.severity', 'i.status', 'i.created_at', 'i.updated_at')
    .count({ alert_count: 'l.id' })
    .groupBy('i.id')
    .limit(query.limit)
    .offset(query.offset);

  if (query.severity) {
    rowsQuery.where('i.severity', query.severity);
  }
  if (query.status) {
    rowsQuery.where('i.status', query.status);
  }

  if (query.sort === 'severity') {
    rowsQuery.orderByRaw(severitySortSql(query.order));
  } else {
    rowsQuery.orderBy(`i.${query.sort}`, query.order);
  }
  rowsQuery.orderBy('i.id', 'asc');

  const rows = (await rowsQuery) as IncidentSummaryRow[];

  return {
    data: rows.map(mapIncidentSummary),
    pagination: {
      total,
      limit: query.limit,
      offset: query.offset,
    },
  };
}

export async function getIncidentByIdService(incidentId: string): Promise<IncidentDetailPayload | null> {
  const incident = await loadIncidentSummaryById(db, incidentId);
  if (!incident) {
    return null;
  }

  const linkedAlerts = await db<LinkedAlertRow>('incident_alert_links as l')
    .innerJoin('alerts as a', 'a.id', 'l.alert_id')
    .select(
      'l.id as link_id',
      'l.linked_at',
      'a.id',
      'a.received_at',
      'a.severity',
      'a.rule_id',
      'a.rule_name',
      'a.host',
      'a.ip',
      'a.status',
      'a.created_at',
      'a.updated_at',
    )
    .where('l.incident_id', incidentId)
    .orderBy('l.linked_at', 'asc')
    .orderBy('l.id', 'asc');

  const commentsRows = await db<IncidentCommentRow>('incident_comments')
    .select('id', 'incident_id', 'author', 'body', 'created_at')
    .where({ incident_id: incidentId })
    .orderBy('created_at', 'asc')
    .orderBy('id', 'asc');

  const comments: IncidentCommentRecord[] = commentsRows.map((row) => ({
    id: row.id,
    incident_id: row.incident_id,
    author: row.author ?? 'analyst1',
    body: row.body,
    created_at: row.created_at,
  }));

  return {
    incident,
    alerts: linkedAlerts,
    comments,
    timeline: buildTimeline({
      incident,
      alerts: linkedAlerts,
      comments,
    }),
  };
}

export async function createIncidentService(input: CreateIncidentBody): Promise<IncidentSummary> {
  const now = new Date().toISOString();
  const incidentId = `incident-${randomUUID()}`;
  const status = input.status ?? 'open';

  await db<IncidentRow>('incidents').insert({
    id: incidentId,
    title: input.title,
    severity: input.severity,
    status,
    created_at: now,
    updated_at: now,
  });

  const summary = await loadIncidentSummaryById(db, incidentId);
  if (!summary) {
    throw new AppError(500, 'Failed to load created incident');
  }

  return summary;
}

export async function updateIncidentService(
  incidentId: string,
  input: UpdateIncidentBody,
): Promise<IncidentSummary | null> {
  const now = new Date().toISOString();
  const updates: Partial<IncidentRow> = {
    updated_at: now,
  };

  if (input.title !== undefined) {
    updates.title = input.title;
  }
  if (input.severity !== undefined) {
    updates.severity = input.severity;
  }
  if (input.status !== undefined) {
    updates.status = input.status;
  }

  const updatedCount = await db<IncidentRow>('incidents').where({ id: incidentId }).update(updates);
  if (updatedCount !== 1) {
    return null;
  }

  const summary = await loadIncidentSummaryById(db, incidentId);
  if (!summary) {
    throw new AppError(500, 'Failed to load updated incident');
  }

  return summary;
}

export async function linkAlertToIncidentService(input: {
  incidentId: string;
  alertId: string;
}): Promise<IncidentAlertLinkRecord> {
  const now = new Date().toISOString();

  try {
    return await db.transaction(async (trx) => {
      const incident = await trx<IncidentRow>('incidents')
        .select('id')
        .where({ id: input.incidentId })
        .first();
      if (!incident) {
        throw new AppError(404, 'Incident not found');
      }

      const alert = await trx<AlertLookupRow>('alerts').select('id').where({ id: input.alertId }).first();
      if (!alert) {
        throw new AppError(404, 'Alert not found');
      }

      const existingLink = await trx<IncidentAlertLinkInsertRow>('incident_alert_links')
        .select('id')
        .where({
          incident_id: input.incidentId,
          alert_id: input.alertId,
        })
        .first();
      if (existingLink) {
        throw new AppError(409, 'Alert already linked to incident');
      }

      const linkRow: IncidentAlertLinkInsertRow = {
        id: `link-${randomUUID()}`,
        incident_id: input.incidentId,
        alert_id: input.alertId,
        linked_at: now,
      };

      await trx<IncidentAlertLinkInsertRow>('incident_alert_links').insert(linkRow);

      const updatedCount = await trx<IncidentRow>('incidents')
        .where({ id: input.incidentId })
        .update({ updated_at: now });
      if (updatedCount !== 1) {
        throw new AppError(500, 'Failed to update incident timestamp');
      }

      return {
        id: linkRow.id,
        incident_id: linkRow.incident_id,
        alert_id: linkRow.alert_id,
        linked_at: linkRow.linked_at,
      };
    });
  } catch (error) {
    if (isDuplicateIncidentAlertLinkError(error)) {
      throw new AppError(409, 'Alert already linked to incident');
    }
    throw error;
  }
}

export async function createIncidentCommentService(input: {
  incidentId: string;
  body: string;
  author?: string;
}): Promise<IncidentCommentRecord> {
  const now = new Date().toISOString();
  const author = normalizeOptionalText(input.author) ?? 'analyst1';

  return db.transaction(async (trx) => {
    const incident = await trx<IncidentRow>('incidents')
      .select('id')
      .where({ id: input.incidentId })
      .first();
    if (!incident) {
      throw new AppError(404, 'Incident not found');
    }

    const commentRow: IncidentCommentInsertRow = {
      id: `comment-${randomUUID()}`,
      incident_id: input.incidentId,
      author,
      body: input.body,
      created_at: now,
    };

    await trx<IncidentCommentInsertRow>('incident_comments').insert(commentRow);

    const updatedCount = await trx<IncidentRow>('incidents')
      .where({ id: input.incidentId })
      .update({ updated_at: now });
    if (updatedCount !== 1) {
      throw new AppError(500, 'Failed to update incident timestamp');
    }

    return {
      id: commentRow.id,
      incident_id: commentRow.incident_id,
      author: commentRow.author,
      body: commentRow.body,
      created_at: commentRow.created_at,
    };
  });
}
