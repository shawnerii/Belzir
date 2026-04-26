import db from '../../db/knex';
import { AppError } from '../../middleware/errorHandler';
import { normalizeText } from '../users/normalize';

type OrganizationRow = {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  created_at: string;
  updated_at: string;
};

type OrganizationCountRow = {
  count?: number | string | bigint;
};

type UserExistsRow = {
  id: number;
};

type OrganizationUserRow = {
  organization_id: number;
  user_id: number;
  created_at: string;
  id: number;
  first_name: string | null;
  last_name: string | null;
  username: string;
  email: string;
  is_active: number | boolean;
};

type OrganizationUserRawRow = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  username: string;
  email: string;
  is_active: number | boolean;
};

export type PublicOrganization = {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicOrganizationUser = {
  id: number;
  firstName: string | null;
  lastName: string | null;
  username: string;
  email: string;
  isActive: boolean;
};

export type PublicOrganizationUserAssignment = {
  organizationId: number;
  userId: number;
  createdAt: string;
  user: PublicOrganizationUser;
};

type ListOrganizationsParams = {
  q?: string;
  limit?: number;
  offset?: number;
};

type CreateOrganizationParams = {
  name: string;
  parentId?: number | null;
};

type AssignUserToOrganizationResult = {
  assignment: PublicOrganizationUserAssignment;
  created: boolean;
};

const ORGANIZATION_COLUMNS = ['id', 'name', 'slug', 'parent_id', 'created_at', 'updated_at'] as const;

function asBoolean(value: number | boolean): boolean {
  return Boolean(value);
}

function readCount(row: OrganizationCountRow | undefined): number {
  return Number(row?.count ?? 0);
}

function toOrganizationSlug(name: string): string {
  const slug = name
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');

  if (slug.length === 0) {
    throw new AppError(400, 'Organization name must include at least one letter or number');
  }

  return slug;
}

function toPublicOrganization(
  row: Pick<OrganizationRow, (typeof ORGANIZATION_COLUMNS)[number]>,
): PublicOrganization {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    parentId: row.parent_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toPublicOrganizationUser(row: OrganizationUserRawRow): PublicOrganizationUser {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    username: row.username,
    email: row.email,
    isActive: asBoolean(row.is_active),
  };
}

function toPublicOrganizationUserAssignment(row: OrganizationUserRow): PublicOrganizationUserAssignment {
  return {
    organizationId: row.organization_id,
    userId: row.user_id,
    createdAt: row.created_at,
    user: toPublicOrganizationUser(row),
  };
}

function isUniqueConstraintError(err: unknown): err is Error {
  if (!(err instanceof Error)) {
    return false;
  }
  const sqliteCode = (err as Error & { code?: string }).code;
  return (
    (typeof sqliteCode === 'string' && sqliteCode.startsWith('SQLITE_CONSTRAINT')) ||
    err.message.includes('UNIQUE constraint failed')
  );
}

function isSlugUniqueConflict(err: unknown): boolean {
  if (!isUniqueConstraintError(err)) {
    return false;
  }
  return err.message.includes('organizations.slug');
}

function isOrganizationUsersUniqueConflict(err: unknown): boolean {
  if (!isUniqueConstraintError(err)) {
    return false;
  }
  return (
    err.message.includes('organization_users.organization_id') &&
    err.message.includes('organization_users.user_id')
  );
}

function isForeignKeyConstraintError(err: unknown): err is Error {
  if (!(err instanceof Error)) {
    return false;
  }
  return (
    err.message.includes('SQLITE_CONSTRAINT_FOREIGNKEY') || err.message.includes('FOREIGN KEY constraint failed')
  );
}

async function ensureUserExists(userId: number): Promise<void> {
  const user = await db<UserExistsRow>('users').select('id').where({ id: userId }).first();
  if (!user) {
    throw new AppError(404, 'User not found');
  }
}

async function ensureOrganizationExists(id: number): Promise<void> {
  const organization = await findOrganizationById(id);
  if (!organization) {
    throw new AppError(404, 'Organization not found');
  }
}

async function fetchOrganizationUserAssignment(
  organizationId: number,
  userId: number,
): Promise<PublicOrganizationUserAssignment | null> {
  const row = await db<OrganizationUserRow>('organization_users as ou')
    .select(
      'ou.organization_id',
      'ou.user_id',
      'ou.created_at',
      'u.id',
      'u.first_name',
      'u.last_name',
      'u.username',
      'u.email',
      'u.is_active',
    )
    .join('users as u', 'u.id', 'ou.user_id')
    .where('ou.organization_id', organizationId)
    .andWhere('ou.user_id', userId)
    .first();

  return row ? toPublicOrganizationUserAssignment(row) : null;
}

export async function listOrganizations(params: ListOrganizationsParams = {}): Promise<PublicOrganization[]> {
  const query = db<OrganizationRow>('organizations')
    .select(...ORGANIZATION_COLUMNS)
    .orderByRaw('LOWER(name) ASC')
    .orderBy('id', 'asc');

  if (params.q) {
    const search = `%${normalizeText(params.q).toLowerCase()}%`;
    query.andWhere((builder) => {
      builder.whereRaw('LOWER(name) LIKE ?', [search]).orWhereRaw('LOWER(slug) LIKE ?', [search]);
    });
  }

  if (params.limit !== undefined) {
    query.limit(params.limit);
  }
  if (params.offset !== undefined) {
    query.offset(params.offset);
  }

  const rows = await query;
  return rows.map(toPublicOrganization);
}

export async function findOrganizationById(id: number): Promise<PublicOrganization | null> {
  const row = await db<OrganizationRow>('organizations')
    .select(...ORGANIZATION_COLUMNS)
    .where({ id })
    .first();

  return row ? toPublicOrganization(row) : null;
}

export async function createOrganization(input: CreateOrganizationParams): Promise<PublicOrganization> {
  const normalizedName = normalizeText(input.name);
  const parentId = input.parentId ?? null;

  if (parentId !== null) {
    const parent = await findOrganizationById(parentId);
    if (!parent) {
      throw new AppError(404, 'Parent organization not found');
    }
  }

  const slug = toOrganizationSlug(normalizedName);

  let insertedId: number;
  try {
    const result = await db<OrganizationRow>('organizations').insert({
      name: normalizedName,
      slug,
      parent_id: parentId,
      updated_at: db.fn.now() as unknown as string,
    });
    insertedId = Array.isArray(result) ? Number(result[0]) : Number(result);
  } catch (err) {
    if (isSlugUniqueConflict(err)) {
      throw new AppError(409, 'An organization with a similar name already exists');
    }
    throw err;
  }

  const created = await findOrganizationById(insertedId);
  if (!created) {
    throw new Error('Failed to load created organization');
  }

  return created;
}

export async function deleteOrganization(id: number): Promise<boolean> {
  const organization = await findOrganizationById(id);
  if (!organization) {
    return false;
  }

  const assignedUsersCountRow = await db<OrganizationCountRow>('organization_users')
    .where({ organization_id: id })
    .count<OrganizationCountRow>({ count: 'user_id' })
    .first();
  if (readCount(assignedUsersCountRow) > 0) {
    throw new AppError(409, 'Organization cannot be deleted', {
      reason: 'organization_has_users',
      message: 'Organization has assigned users.',
    });
  }

  const invitationsCountRow = await db<OrganizationCountRow>('invitations')
    .where({ organization_id: id })
    .count<OrganizationCountRow>({ count: 'id' })
    .first();
  if (readCount(invitationsCountRow) > 0) {
    throw new AppError(409, 'Organization cannot be deleted', {
      reason: 'organization_has_invitations',
      message: 'Organization has existing invitations.',
    });
  }

  const childOrganizationsCountRow = await db<OrganizationCountRow>('organizations')
    .where({ parent_id: id })
    .count<OrganizationCountRow>({ count: 'id' })
    .first();
  if (readCount(childOrganizationsCountRow) > 0) {
    throw new AppError(409, 'Organization cannot be deleted', {
      reason: 'organization_has_children',
      message: 'Organization has child organizations.',
    });
  }

  try {
    const deletedCount = await db<OrganizationRow>('organizations').where({ id }).delete();
    return deletedCount > 0;
  } catch (err) {
    if (isForeignKeyConstraintError(err)) {
      throw new AppError(409, 'Organization cannot be deleted', {
        reason: 'organization_referenced',
        message: 'Organization is referenced by related records.',
      });
    }
    throw err;
  }
}

export async function assignUserToOrganization(
  organizationId: number,
  userId: number,
): Promise<AssignUserToOrganizationResult> {
  await Promise.all([ensureOrganizationExists(organizationId), ensureUserExists(userId)]);

  let created = true;
  try {
    await db('organization_users').insert({
      organization_id: organizationId,
      user_id: userId,
    });
  } catch (err) {
    if (isOrganizationUsersUniqueConflict(err)) {
      created = false;
    } else if (isForeignKeyConstraintError(err)) {
      // Org or user was deleted between the existence check and the insert.
      // Re-run the existence checks so the caller sees a 404 for the entity
      // that actually disappeared, instead of a generic 409.
      await Promise.all([ensureOrganizationExists(organizationId), ensureUserExists(userId)]);
      throw new AppError(404, 'Organization or user not found');
    } else {
      throw err;
    }
  }

  const assignment = await fetchOrganizationUserAssignment(organizationId, userId);
  if (!assignment) {
    throw new Error('Failed to load organization assignment');
  }

  return { assignment, created };
}

export async function unassignUserFromOrganization(organizationId: number, userId: number): Promise<void> {
  await db('organization_users')
    .where({
      organization_id: organizationId,
      user_id: userId,
    })
    .delete();
}

export async function listOrganizationsForUser(userId: number): Promise<PublicOrganization[]> {
  const rows = await db<OrganizationRow>('organization_users as ou')
    .select('o.id', 'o.name', 'o.slug', 'o.parent_id', 'o.created_at', 'o.updated_at')
    .join('organizations as o', 'o.id', 'ou.organization_id')
    .where('ou.user_id', userId)
    .orderByRaw('LOWER(o.name) ASC')
    .orderBy('o.id', 'asc');

  return rows.map(toPublicOrganization);
}

export async function listUsersForOrganization(organizationId: number): Promise<PublicOrganizationUser[]> {
  await ensureOrganizationExists(organizationId);

  const rows = await db<OrganizationUserRawRow>('organization_users as ou')
    .select('u.id', 'u.first_name', 'u.last_name', 'u.username', 'u.email', 'u.is_active')
    .join('users as u', 'u.id', 'ou.user_id')
    .where('ou.organization_id', organizationId)
    .orderByRaw('LOWER(COALESCE(u.last_name, \'\')) ASC')
    .orderByRaw('LOWER(COALESCE(u.first_name, \'\')) ASC')
    .orderByRaw('LOWER(u.username) ASC')
    .orderBy('u.id', 'asc');

  return rows.map(toPublicOrganizationUser);
}
