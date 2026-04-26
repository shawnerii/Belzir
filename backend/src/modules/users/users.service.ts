import bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import db from '../../db/knex';
import { AppError } from '../../middleware/errorHandler';
import {
  listOrganizationsForUser,
  type PublicOrganization,
} from '../organizations/organizations.service';
import type { CreateUserInput, UpdateUserInput, UserRole } from './users.schemas';
import { normalizeIdentifier, normalizeOptionalText, normalizeText } from './normalize';

type UserRow = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  username: string;
  email: string;
  phone: string | null;
  role: string;
  is_active: number | boolean;
  is_system: number | boolean;
  password_hash: string;
  created_at: string;
  updated_at: string;
};

export type PublicUser = {
  id: number;
  firstName: string | null;
  lastName: string | null;
  username: string;
  email: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  isSystem: boolean;
  organizations?: PublicUserOrganization[];
};

export type CreateUserResult = {
  user: PublicUser;
  temporaryPassword?: string;
};

const USER_COLUMNS = [
  'id',
  'first_name',
  'last_name',
  'username',
  'email',
  'phone',
  'role',
  'is_active',
  'is_system',
] as const;

type PublicUserOrganization = Pick<PublicOrganization, 'id' | 'name' | 'slug' | 'parentId'>;

function asBoolean(value: number | boolean): boolean {
  return Boolean(value);
}

function asRole(value: string): UserRole {
  return value === 'admin' ? 'admin' : 'user';
}

function toPublicUser(
  row: Pick<UserRow, (typeof USER_COLUMNS)[number]>,
  options?: {
    organizations?: PublicUserOrganization[];
  },
): PublicUser {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    username: row.username,
    email: row.email,
    phone: row.phone,
    role: asRole(row.role),
    isActive: asBoolean(row.is_active),
    isSystem: asBoolean(row.is_system),
    ...(options?.organizations !== undefined && { organizations: options.organizations }),
  };
}

function makeTemporaryPassword(length = 14): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i += 1) {
    password += alphabet[randomInt(alphabet.length)];
  }
  return password;
}

function mapUniqueConstraintError(err: unknown): AppError | null {
  if (!(err instanceof Error)) {
    return null;
  }
  if (!err.message.includes('SQLITE_CONSTRAINT') && !err.message.includes('UNIQUE constraint')) {
    return null;
  }

  if (err.message.includes('users.email')) {
    return new AppError(409, 'Email already exists');
  }
  if (err.message.includes('users.username')) {
    return new AppError(409, 'Username already exists');
  }

  return new AppError(409, 'Unique constraint violation');
}

async function ensureAnotherActiveAdminExists(excludeUserId: number): Promise<void> {
  const row = await db<UserRow>('users')
    .where({ role: 'admin', is_active: 1 })
    .whereNot({ id: excludeUserId })
    .count<{ count: number | string }>({ count: 'id' })
    .first();

  const count = Number(row?.count ?? 0);
  if (count < 1) {
    throw new AppError(403, 'At least one active admin must remain');
  }
}

async function getUserRowById(id: number): Promise<UserRow | undefined> {
  return db<UserRow>('users').where({ id }).first();
}

export async function listUsers(params: {
  q?: string;
  isActive?: boolean;
}): Promise<PublicUser[]> {
  const query = db<UserRow>('users')
    .select(...USER_COLUMNS)
    .orderBy('last_name', 'asc')
    .orderBy('first_name', 'asc')
    .orderBy('username', 'asc');

  if (typeof params.isActive === 'boolean') {
    query.where({ is_active: params.isActive ? 1 : 0 });
  }

  if (params.q) {
    const search = `%${normalizeText(params.q).toLowerCase()}%`;
    query.andWhere((builder) => {
      builder
        .whereRaw('LOWER(email) LIKE ?', [search])
        .orWhereRaw('LOWER(username) LIKE ?', [search])
        .orWhereRaw('LOWER(COALESCE(first_name, \'\')) LIKE ?', [search])
        .orWhereRaw('LOWER(COALESCE(last_name, \'\')) LIKE ?', [search]);
    });
  }

  const rows = await query;
  return rows.map((row) => toPublicUser(row));
}

export async function getUserById(id: number): Promise<PublicUser | null> {
  const row = await db<UserRow>('users')
    .select(...USER_COLUMNS)
    .where({ id })
    .first();

  if (!row) {
    return null;
  }

  const organizations = await listOrganizationsForUser(id);
  return toPublicUser(row, {
    organizations: organizations.map((organization) => ({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      parentId: organization.parentId,
    })),
  });
}

export async function createUser(input: CreateUserInput): Promise<CreateUserResult> {
  const email = normalizeIdentifier(input.email);
  const username = normalizeIdentifier(input.username);
  const firstName = normalizeText(input.firstName);
  const lastName = normalizeText(input.lastName);
  const phone = normalizeOptionalText(input.phone);
  const role: UserRole = input.role ?? 'user';

  const temporaryPassword = input.password ?? makeTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);

  try {
    await db<UserRow>('users').insert({
      first_name: firstName,
      last_name: lastName,
      username,
      email,
      phone,
      role,
      is_active: true,
      is_system: false,
      password_hash: passwordHash,
      updated_at: db.fn.now() as unknown as string,
    });
  } catch (err) {
    const mapped = mapUniqueConstraintError(err);
    if (mapped) {
      throw mapped;
    }
    throw err;
  }

  const created = await db<UserRow>('users')
    .select('id')
    .where({ email })
    .first();

  if (!created) {
    throw new Error('Failed to load created user');
  }

  const createdUser = await getUserById(created.id);
  if (!createdUser) {
    throw new Error('Failed to load created user');
  }

  if (input.password) {
    return { user: createdUser };
  }

  return { user: createdUser, temporaryPassword };
}

export async function updateUser(
  actorUserId: number,
  userId: number,
  patch: UpdateUserInput,
): Promise<PublicUser | null> {
  const current = await getUserRowById(userId);
  if (!current) {
    return null;
  }

  const updates: Partial<UserRow> = {};

  if (patch.firstName !== undefined) {
    const firstName = normalizeText(patch.firstName);
    if (firstName !== (current.first_name ?? '')) {
      updates.first_name = firstName;
    }
  }
  if (patch.lastName !== undefined) {
    const lastName = normalizeText(patch.lastName);
    if (lastName !== (current.last_name ?? '')) {
      updates.last_name = lastName;
    }
  }
  if (patch.phone !== undefined) {
    const phone = normalizeOptionalText(patch.phone);
    if (phone !== current.phone) {
      updates.phone = phone;
    }
  }
  if (patch.email !== undefined) {
    const email = normalizeIdentifier(patch.email);
    if (email !== current.email) {
      if (asBoolean(current.is_system)) {
        throw new AppError(403, 'System user email cannot be changed');
      }
      updates.email = email;
    }
  }
  if (patch.username !== undefined) {
    const username = normalizeIdentifier(patch.username);
    if (username !== current.username) {
      if (asBoolean(current.is_system)) {
        throw new AppError(403, 'System user username cannot be changed');
      }
      updates.username = username;
    }
  }
  if (patch.role !== undefined && patch.role !== current.role) {
    if (asBoolean(current.is_system)) {
      throw new AppError(403, 'System user role cannot be changed');
    }
    if (actorUserId === current.id && current.role === 'admin' && patch.role === 'user') {
      throw new AppError(403, 'You cannot demote your own admin role');
    }
    if (current.role === 'admin' && patch.role === 'user' && asBoolean(current.is_active)) {
      await ensureAnotherActiveAdminExists(current.id);
    }
    updates.role = patch.role;
  }

  if (Object.keys(updates).length === 0) {
    return getUserById(userId);
  }

  updates.updated_at = db.fn.now() as unknown as string;

  try {
    await db<UserRow>('users')
      .where({ id: userId })
      .update(updates);
  } catch (err) {
    const mapped = mapUniqueConstraintError(err);
    if (mapped) {
      throw mapped;
    }
    throw err;
  }

  return getUserById(userId);
}

export async function deleteUser(actorUserId: number, userId: number): Promise<boolean> {
  const current = await getUserRowById(userId);
  if (!current) {
    return false;
  }

  if (actorUserId === current.id) {
    throw new AppError(403, 'You cannot delete your own account');
  }
  if (asBoolean(current.is_system)) {
    throw new AppError(403, 'System user cannot be deleted');
  }
  if (current.role === 'admin' && asBoolean(current.is_active)) {
    await ensureAnotherActiveAdminExists(current.id);
  }

  await db<UserRow>('users').where({ id: userId }).delete();
  return true;
}

export async function setUserActiveState(
  actorUserId: number,
  userId: number,
  isActive: boolean,
): Promise<PublicUser | null> {
  const current = await getUserRowById(userId);
  if (!current) {
    return null;
  }

  if (asBoolean(current.is_system)) {
    throw new AppError(403, 'System user state cannot be changed');
  }

  if (!isActive) {
    if (actorUserId === current.id) {
      throw new AppError(403, 'You cannot deactivate your own account');
    }
    if (current.role === 'admin' && asBoolean(current.is_active)) {
      await ensureAnotherActiveAdminExists(current.id);
    }
  }

  if (asBoolean(current.is_active) !== isActive) {
    await db<UserRow>('users')
      .where({ id: userId })
      .update({
        is_active: isActive ? 1 : 0,
        updated_at: db.fn.now() as unknown as string,
      });
  }

  return getUserById(userId);
}

export async function resetUserPassword(
  actorUserId: number,
  userId: number,
): Promise<string | null> {
  const current = await getUserRowById(userId);
  if (!current) {
    return null;
  }

  if (actorUserId === current.id) {
    throw new AppError(403, 'You cannot reset your own password');
  }

  const temporaryPassword = makeTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);

  await db<UserRow>('users')
    .where({ id: userId })
    .update({
      password_hash: passwordHash,
      updated_at: db.fn.now() as unknown as string,
    });

  return temporaryPassword;
}
