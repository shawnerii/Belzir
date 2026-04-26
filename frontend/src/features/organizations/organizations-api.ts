import { del, get, post } from '@/services/api';
import type {
  AssignOrganizationUserInput,
  AssignOrganizationUserResponse,
  CreateOrganizationInput,
  CreateOrganizationResponse,
  ListOrganizationsParams,
  ListOrganizationsResponse,
  ListOrganizationUsersResponse,
} from './types';

function toOrganizationsUrl(params?: ListOrganizationsParams): string {
  const query = new URLSearchParams();

  if (params?.q) {
    const q = params.q.trim();
    if (q.length > 0) {
      query.set('q', q);
    }
  }
  if (typeof params?.limit === 'number') {
    query.set('limit', String(params.limit));
  }
  if (typeof params?.offset === 'number') {
    query.set('offset', String(params.offset));
  }

  const encoded = query.toString();
  return encoded.length > 0 ? `/organizations?${encoded}` : '/organizations';
}

export function listOrganizationsRequest(params?: ListOrganizationsParams) {
  return get<ListOrganizationsResponse>(toOrganizationsUrl(params));
}

export function createOrganizationRequest(payload: CreateOrganizationInput) {
  return post<CreateOrganizationResponse>('/organizations', payload);
}

export function deleteOrganizationRequest(id: number): Promise<void> {
  return del(`/organizations/${id}`);
}

export function listOrganizationUsersRequest(organizationId: number) {
  return get<ListOrganizationUsersResponse>(`/organizations/${organizationId}/users`);
}

export function assignUserToOrganizationRequest(
  organizationId: number,
  payload: AssignOrganizationUserInput,
) {
  return post<AssignOrganizationUserResponse>(`/organizations/${organizationId}/users`, payload);
}

export function unassignUserFromOrganizationRequest(organizationId: number, userId: number): Promise<void> {
  return del(`/organizations/${organizationId}/users/${userId}`);
}
