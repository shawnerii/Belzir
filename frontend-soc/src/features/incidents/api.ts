import { get, patch, post } from '@/services/api';
import type {
  CreateIncidentCommentPayload,
  CreateIncidentPayload,
  IncidentAlertLinkResult,
  IncidentComment,
  IncidentDetailPayload,
  IncidentSummary,
  LinkIncidentAlertPayload,
  ListIncidentsParams,
  ListIncidentsResponse,
  UpdateIncidentPayload,
} from '@/types/soc';

type IncidentSummaryEnvelope = { data: IncidentSummary };
type IncidentDetailEnvelope = { data: IncidentDetailPayload };
type IncidentAlertLinkEnvelope = { data: IncidentAlertLinkResult };
type IncidentCommentEnvelope = { data: IncidentComment };

export function listIncidents(params: ListIncidentsParams): Promise<ListIncidentsResponse> {
  return get<ListIncidentsResponse>('/incidents', params as unknown as Record<string, unknown>);
}

export async function getIncident(id: string): Promise<IncidentDetailPayload> {
  const response = await get<IncidentDetailEnvelope>(`/incidents/${id}`);
  return response.data;
}

export async function createIncident(payload: CreateIncidentPayload): Promise<IncidentSummary> {
  const response = await post<IncidentSummaryEnvelope>('/incidents', payload);
  return response.data;
}

export async function updateIncident(
  incidentId: string,
  payload: UpdateIncidentPayload,
): Promise<IncidentSummary> {
  const response = await patch<IncidentSummaryEnvelope>(`/incidents/${incidentId}`, payload);
  return response.data;
}

export async function linkAlertToIncident(
  incidentId: string,
  payload: LinkIncidentAlertPayload,
): Promise<IncidentAlertLinkResult> {
  const response = await post<IncidentAlertLinkEnvelope>(`/incidents/${incidentId}/alerts`, payload);
  return response.data;
}

export async function addIncidentComment(
  incidentId: string,
  payload: CreateIncidentCommentPayload,
): Promise<IncidentComment> {
  const response = await post<IncidentCommentEnvelope>(`/incidents/${incidentId}/comments`, payload);
  return response.data;
}
