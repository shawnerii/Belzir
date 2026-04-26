import { AppError } from '../../middleware/errorHandler';
import db from '../../db/knex';
import type { AlertSeverity, AlertStatus, ListAlertsQuery } from './alerts.schemas';

type AlertRow = {
  id: string;
  received_at: string;
  severity: AlertSeverity;
  rule_id: string;
  rule_name: string;
  host: string;
  ip: string;
  status: AlertStatus;
  raw_json: string;
  created_at: string;
  updated_at: string;
};

export type AlertSummary = Omit<AlertRow, 'raw_json'>;

export type AlertDetail = Omit<AlertRow, 'raw_json'> & {
  raw_json: unknown;
};

export type ListAlertsResponse = {
  data: AlertSummary[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
};

function severitySortSql(order: 'asc' | 'desc'): string {
  // Safety contract: `order` must come from `sortOrderSchema` enum validation.
  const direction = order === 'asc' ? 'asc' : 'desc';
  return `case severity when 'low' then 1 when 'medium' then 2 when 'high' then 3 when 'critical' then 4 else 0 end ${direction}`;
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

export async function listAlertsService(query: ListAlertsQuery): Promise<ListAlertsResponse> {
  const baseQuery = db<AlertRow>('alerts');

  if (query.severity) {
    baseQuery.where({ severity: query.severity });
  }

  if (query.status) {
    baseQuery.where({ status: query.status });
  }

  const countRow = await baseQuery.clone().count<{ count: number | string }>({ count: 'id' }).first();
  const total = parseCount(countRow?.count);

  const rowsQuery = baseQuery
    .clone()
    .select(
      'id',
      'received_at',
      'severity',
      'rule_id',
      'rule_name',
      'host',
      'ip',
      'status',
      'created_at',
      'updated_at',
    )
    .limit(query.limit)
    .offset(query.offset);

  if (query.sort === 'severity') {
    rowsQuery.orderByRaw(severitySortSql(query.order));
  } else {
    rowsQuery.orderBy('received_at', query.order);
  }
  rowsQuery.orderBy('id', 'asc');

  const rows = await rowsQuery;

  return {
    data: rows,
    pagination: {
      total,
      limit: query.limit,
      offset: query.offset,
    },
  };
}

export async function getAlertByIdService(alertId: string): Promise<AlertDetail | null> {
  const row = await db<AlertRow>('alerts').where({ id: alertId }).first();

  if (!row) {
    return null;
  }

  let parsedRawJson: unknown;
  try {
    parsedRawJson = JSON.parse(row.raw_json);
  } catch (err) {
    throw new AppError(500, `Alert ${alertId} has invalid raw_json payload`, err);
  }

  return {
    id: row.id,
    received_at: row.received_at,
    severity: row.severity,
    rule_id: row.rule_id,
    rule_name: row.rule_name,
    host: row.host,
    ip: row.ip,
    status: row.status,
    raw_json: parsedRawJson,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
