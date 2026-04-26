export type InvitationStatus = 'pending' | 'revoked' | 'accepted';

export type Invitation = {
  id: number;
  email: string;
  emailNormalized: string;
  organizationId: number;
  organizationName: string;
  organizationSlug: string;
  status: InvitationStatus;
  invitedByUserId: number | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateInvitationResultStatus = 'created' | 'duplicate' | 'invalid';

export type CreateInvitationResult = {
  input: string;
  email: string;
  emailNormalized: string;
  status: CreateInvitationResultStatus;
  reason?: string;
  invitation?: Invitation;
};

export type CreateInvitationsRequest = {
  emails: string[];
  organizationId: number;
};

export type CreateInvitationsResponse = {
  organization: {
    id: number;
    name: string;
    slug: string;
  };
  results: CreateInvitationResult[];
  summary: {
    requested: number;
    created: number;
    duplicate: number;
    invalid: number;
  };
};

export type ListInvitationsResponse = {
  invitations: Invitation[];
};

export type InvitationResponse = {
  invitation: Invitation;
};
