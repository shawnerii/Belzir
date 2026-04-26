import { get, post } from '@/services/api';
import type {
  AlertDetail,
  ListAlertsParams,
  ListAlertsResponse,
  TriageDecisionPayload,
  TriageDecisionResult,
} from '@/types/soc';

type AlertDetailEnvelope = { data: AlertDetail };
type TriageDecisionEnvelope = { data: TriageDecisionResult };

export function listAlerts(params: ListAlertsParams): Promise<ListAlertsResponse> {
  return get<ListAlertsResponse>('/alerts', params as unknown as Record<string, unknown>);
}

export async function getAlert(id: string): Promise<AlertDetail> {
  const response = await get<AlertDetailEnvelope>(`/alerts/${id}`);
  return response.data;
}

export async function submitDecision(
  alertId: string,
  payload: TriageDecisionPayload,
): Promise<TriageDecisionResult> {
  const response = await post<TriageDecisionEnvelope>(`/triage/alerts/${alertId}/decisions`, payload);
  return response.data;
}
