import { get, post } from '@/services/api';
import type {
  CreateInvitationsRequest,
  CreateInvitationsResponse,
  InvitationResponse,
  InvitationStatus,
  ListInvitationsResponse,
} from './types';

type ListInvitationsParams = {
  q?: string;
  organizationId?: number;
  status?: InvitationStatus;
  limit?: number;
};

function toInvitationsUrl(params?: ListInvitationsParams): string {
  const query = new URLSearchParams();

  if (params?.q) {
    const q = params.q.trim();
    if (q.length > 0) {
      query.set('q', q);
    }
  }

  if (typeof params?.organizationId === 'number') {
    query.set('organizationId', String(params.organizationId));
  }

  if (params?.status) {
    query.set('status', params.status);
  }

  if (typeof params?.limit === 'number') {
    query.set('limit', String(params.limit));
  }

  const encoded = query.toString();
  return encoded.length > 0 ? `/invitations?${encoded}` : '/invitations';
}

export function listInvitationsRequest(params?: ListInvitationsParams) {
  return get<ListInvitationsResponse>(toInvitationsUrl(params));
}

export function createInvitationsRequest(payload: CreateInvitationsRequest) {
  return post<CreateInvitationsResponse>('/invitations', payload);
}

export function revokeInvitationRequest(id: number) {
  return post<InvitationResponse>(`/invitations/${id}/revoke`);
}
