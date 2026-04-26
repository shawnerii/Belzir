export type UserRole = 'admin' | 'user';

export type UserOrganization = {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
};

export type User = {
  id: number;
  firstName: string | null;
  lastName: string | null;
  username: string;
  email: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  isSystem: boolean;
  organizations?: UserOrganization[];
};

export type CreateUserInput = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone?: string;
  role?: UserRole;
  password?: string;
};

export type UpdateUserInput = {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  phone?: string | null;
  role?: UserRole;
};

export type CreateUserResponse = {
  user: User;
  temporaryPassword?: string;
};

export type UserResponse = {
  user: User;
};

export type ListUsersResponse = {
  users: User[];
};
