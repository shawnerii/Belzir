export type Organization = {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
};

export type ListOrganizationsParams = {
  q?: string;
  limit?: number;
  offset?: number;
};

export type ListOrganizationsResponse = {
  organizations: Organization[];
};

export type CreateOrganizationInput = {
  name: string;
  parentId?: number | null;
};

export type CreateOrganizationResponse = {
  organization: Organization;
};

export type OrganizationUser = {
  id: number;
  firstName: string | null;
  lastName: string | null;
  username: string;
  email: string;
  isActive: boolean;
};

export type ListOrganizationUsersResponse = {
  users: OrganizationUser[];
};

export type AssignOrganizationUserInput = {
  userId: number;
};

export type AssignOrganizationUserResponse = {
  assignment: {
    organizationId: number;
    userId: number;
    createdAt: string;
    user: OrganizationUser;
  };
};
