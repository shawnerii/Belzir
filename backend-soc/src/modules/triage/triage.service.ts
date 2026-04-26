import { randomUUID } from 'crypto';
import { AppError } from '../../middleware/errorHandler';
import db from '../../db/knex';
import type { AlertStatus } from '../alerts/alerts.schemas';
import type { TriageDecisionType } from './triage.schemas';

type AlertStatusRow = {
  id: string;
  status: AlertStatus;
  updated_at: string;
};

type TriageDecisionInsertRow = {
  id: string;
  alert_id: string;
  decision: TriageDecisionType;
  note: string | null;
  decided_by: string;
  decided_at: string;
  created_at: string;
  updated_at: string;
};

export type TriageDecisionRecord = {
  id: string;
  alert_id: string;
  decision: TriageDecisionType;
  note: string | null;
  decided_by: string;
  decided_at: string;
  created_at: string;
  updated_at: string;
};

export type TriageMutationResult = {
  decision: TriageDecisionRecord;
  alert: {
    id: string;
    previous_status: AlertStatus;
    status: AlertStatus;
    updated_at: string;
  };
};

const DECISION_TO_STATUS: Record<TriageDecisionType, AlertStatus> = {
  true_positive: 'triaged',
  false_positive: 'triaged',
  escalate: 'escalated',
  ignore: 'ignored',
};

function normalizeOptionalText(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed;
}

export async function createTriageDecisionService(input: {
  alertId: string;
  decision: TriageDecisionType;
  note?: string;
  decidedBy?: string;
}): Promise<TriageMutationResult> {
  const now = new Date().toISOString();
  const decisionId = `decision-${randomUUID()}`;
  const status = DECISION_TO_STATUS[input.decision];
  const note = normalizeOptionalText(input.note);
  const decidedBy = normalizeOptionalText(input.decidedBy) ?? 'analyst1';

  return db.transaction(async (trx) => {
    const currentAlert = await trx<AlertStatusRow>('alerts')
      .select('id', 'status', 'updated_at')
      .where({ id: input.alertId })
      .first();

    if (!currentAlert) {
      throw new AppError(404, 'Alert not found');
    }

    const decisionRow: TriageDecisionInsertRow = {
      id: decisionId,
      alert_id: input.alertId,
      decision: input.decision,
      note: note ?? null,
      decided_by: decidedBy,
      decided_at: now,
      created_at: now,
      updated_at: now,
    };

    await trx<TriageDecisionInsertRow>('triage_decisions').insert(decisionRow);

    const updatedCount = await trx<AlertStatusRow>('alerts').where({ id: input.alertId }).update({
      status,
      updated_at: now,
    });

    if (updatedCount !== 1) {
      throw new AppError(500, 'Failed to update alert status');
    }

    const updatedAlert = await trx<AlertStatusRow>('alerts')
      .select('id', 'status', 'updated_at')
      .where({ id: input.alertId })
      .first();

    if (!updatedAlert) {
      throw new AppError(500, 'Failed to load updated alert');
    }

    return {
      decision: decisionRow,
      alert: {
        id: updatedAlert.id,
        previous_status: currentAlert.status,
        status: updatedAlert.status,
        updated_at: updatedAlert.updated_at,
      },
    };
  });
}
