import type { Knex } from 'knex';
import { z } from 'zod';
import db from '../../db/knex';
import { AppError } from '../../middleware/errorHandler';
import { normalizeIdentifier, normalizeText } from '../users/normalize';
import { findOrganizationById, type PublicOrganization } from '../organizations/organizations.service';
import type {
  CreateInvitationsInput,
  InvitationStatus,
  ListInvitationsQueryInput,
} from './invitations.schemas';

type InvitationRow = {
  id: number;
  email: string;
  email_normalized: string;
  organization_id: number;
  status: InvitationStatus;
  invited_by_user_id: number | null;
  created_at: string;
  updated_at: string;
  organization_name: string;
  organization_slug: string;
};

type InvitationInsertRow = {
  email: string;
  email_normalized: string;
  organization_id: number;
  status: InvitationStatus;
  invited_by_user_id: number;
};

type PreparedEmailCandidate = {
  sourceIndex: number;
  input: string;
  original: string;
  normalized: string;
};

export type PublicInvitation = {
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
  invitation?: PublicInvitation;
};

export type CreateInvitationsResult = {
  organization: Pick<PublicOrganization, 'id' | 'name' | 'slug'>;
  results: CreateInvitationResult[];
  summary: {
    requested: number;
    created: number;
    duplicate: number;
    invalid: number;
  };
};

const INVITATION_SELECT_COLUMNS = [
  'i.id',
  'i.email',
  'i.email_normalized',
  'i.organization_id',
  'i.status',
  'i.invited_by_user_id',
  'i.created_at',
  'i.updated_at',
  'o.name as organization_name',
  'o.slug as organization_slug',
] as const;

const emailValidationSchema = z.string().email().max(255);

class DuplicatePendingInvitationError extends Error {
  constructor() {
    super('Duplicate pending invitation');
    this.name = 'DuplicatePendingInvitationError';
  }
}

function toPublicInvitation(row: InvitationRow): PublicInvitation {
  return {
    id: row.id,
    email: row.email,
    emailNormalized: row.email_normalized,
    organizationId: row.organization_id,
    organizationName: row.organization_name,
    organizationSlug: row.organization_slug,
    status: row.status,
    invitedByUserId: row.invited_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isUniqueConstraintError(err: unknown): err is Error {
  if (!(err instanceof Error)) {
    return false;
  }

  return err.message.includes('SQLITE_CONSTRAINT') && err.message.includes('UNIQUE constraint failed');
}

function isPendingInvitationUniqueConflict(err: unknown): boolean {
  if (!isUniqueConstraintError(err)) {
    return false;
  }

  return (
    err.message.includes('invitations.email_normalized') &&
    err.message.includes('invitations.organization_id')
  );
}

async function fetchInvitationById(
  executor: Knex | Knex.Transaction,
  id: number,
): Promise<PublicInvitation | null> {
  const row = await executor<InvitationRow>('invitations as i')
    .select(...INVITATION_SELECT_COLUMNS)
    .join('organizations as o', 'o.id', 'i.organization_id')
    .where('i.id', id)
    .first();

  return row ? toPublicInvitation(row) : null;
}

async function insertInvitationInTransaction(
  trx: Knex.Transaction,
  input: InvitationInsertRow,
): Promise<PublicInvitation> {
  try {
    const insertResult = await trx<InvitationInsertRow>('invitations').insert(input);

    const insertedId = Array.isArray(insertResult)
      ? Number(insertResult[0])
      : Number(insertResult);

    const invitation = await fetchInvitationById(trx, insertedId);
    if (!invitation) {
      throw new Error('Failed to load created invitation');
    }

    return invitation;
  } catch (err) {
    if (isPendingInvitationUniqueConflict(err)) {
      throw new DuplicatePendingInvitationError();
    }

    throw err;
  }
}

function prepareEmailCandidates(emails: string[]): {
  results: Array<CreateInvitationResult | null>;
  validCandidates: PreparedEmailCandidate[];
} {
  const results: Array<CreateInvitationResult | null> = new Array(emails.length).fill(null);
  const validCandidates: PreparedEmailCandidate[] = [];
  const seen = new Set<string>();

  for (const [index, inputEmail] of emails.entries()) {
    const original = normalizeText(inputEmail);
    const normalized = normalizeIdentifier(original);

    if (!emailValidationSchema.safeParse(normalized).success) {
      results[index] = {
        input: inputEmail,
        email: original,
        emailNormalized: normalized,
        status: 'invalid',
        reason: 'Invalid email format',
      };
      continue;
    }

    if (seen.has(normalized)) {
      results[index] = {
        input: inputEmail,
        email: original,
        emailNormalized: normalized,
        status: 'duplicate',
        reason: 'Duplicate email in request',
      };
      continue;
    }

    seen.add(normalized);
    validCandidates.push({
      sourceIndex: index,
      input: inputEmail,
      original,
      normalized,
    });
  }

  return { results, validCandidates };
}

function summarize(results: CreateInvitationResult[]): CreateInvitationsResult['summary'] {
  const summary = {
    requested: results.length,
    created: 0,
    duplicate: 0,
    invalid: 0,
  };

  for (const item of results) {
    if (item.status === 'created') {
      summary.created += 1;
      continue;
    }

    if (item.status === 'duplicate') {
      summary.duplicate += 1;
      continue;
    }

    summary.invalid += 1;
  }

  return summary;
}

function assertOrganizationExists(
  organization: PublicOrganization | null,
): asserts organization is PublicOrganization {
  if (!organization) {
    throw new AppError(404, 'Organization not found');
  }
}

function finalizeResults(results: Array<CreateInvitationResult | null>): CreateInvitationResult[] {
  const missingIndex = results.findIndex((item) => item === null);
  if (missingIndex !== -1) {
    throw new Error(`Invitation processing did not produce a complete result set at index ${missingIndex}`);
  }

  return results as CreateInvitationResult[];
}

export async function createInvitations(
  actorId: number,
  input: CreateInvitationsInput,
): Promise<CreateInvitationsResult> {
  const organization = await findOrganizationById(input.organizationId);
  assertOrganizationExists(organization);

  const { results, validCandidates } = prepareEmailCandidates(input.emails);
  if (validCandidates.length === 0) {
    const finalized = results.filter((item): item is CreateInvitationResult => item !== null);
    const summary = summarize(finalized);
    throw new AppError(400, 'All provided emails are invalid', { results: finalized, summary });
  }

  await db.transaction(async (trx) => {
    const existingRows = await trx('invitations')
      .select('email_normalized')
      .where({ organization_id: organization.id, status: 'pending' })
      .whereIn(
        'email_normalized',
        validCandidates.map((entry) => entry.normalized),
      );

    const existingSet = new Set<string>(existingRows.map((row) => String(row.email_normalized)));

    for (const entry of validCandidates) {
      if (existingSet.has(entry.normalized)) {
        results[entry.sourceIndex] = {
          input: entry.input,
          email: entry.original,
          emailNormalized: entry.normalized,
          status: 'duplicate',
          reason: 'Pending invitation already exists for this organization',
        };
        continue;
      }

      try {
        const invitation = await insertInvitationInTransaction(trx, {
          email: entry.original,
          email_normalized: entry.normalized,
          organization_id: organization.id,
          status: 'pending',
          invited_by_user_id: actorId,
        });

        results[entry.sourceIndex] = {
          input: entry.input,
          email: entry.original,
          emailNormalized: entry.normalized,
          status: 'created',
          invitation,
        };
      } catch (err) {
        if (err instanceof DuplicatePendingInvitationError) {
          results[entry.sourceIndex] = {
            input: entry.input,
            email: entry.original,
            emailNormalized: entry.normalized,
            status: 'duplicate',
            reason: 'Pending invitation already exists for this organization',
          };
          continue;
        }

        throw err;
      }
    }
  });

  const finalizedResults = finalizeResults(results);
  const summary = summarize(finalizedResults);

  return {
    organization: {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
    },
    results: finalizedResults,
    summary,
  };
}

export async function listInvitations(query: ListInvitationsQueryInput): Promise<PublicInvitation[]> {
  const limit = query.limit ?? 10;

  const invitationsQuery = db<InvitationRow>('invitations as i')
    .select(...INVITATION_SELECT_COLUMNS)
    .join('organizations as o', 'o.id', 'i.organization_id')
    .orderBy('i.created_at', 'desc')
    .orderBy('i.id', 'desc')
    .limit(limit);

  if (query.organizationId !== undefined) {
    invitationsQuery.where('i.organization_id', query.organizationId);
  }

  if (query.status !== undefined) {
    invitationsQuery.where('i.status', query.status);
  }

  if (query.q) {
    const search = `%${normalizeText(query.q).toLowerCase()}%`;
    invitationsQuery.andWhere((builder) => {
      builder
        .whereRaw('LOWER(i.email_normalized) LIKE ?', [search])
        .orWhereRaw('LOWER(o.name) LIKE ?', [search])
        .orWhereRaw('LOWER(o.slug) LIKE ?', [search]);
    });
  }

  const rows = await invitationsQuery;
  return rows.map(toPublicInvitation);
}

export async function revokeInvitation(id: number): Promise<PublicInvitation | null> {
  const invitation = await fetchInvitationById(db, id);
  if (!invitation) {
    return null;
  }

  if (invitation.status === 'accepted') {
    throw new AppError(409, 'Accepted invitation cannot be revoked');
  }

  if (invitation.status !== 'revoked') {
    await db('invitations')
      .where({ id })
      .update({
        status: 'revoked',
        updated_at: db.fn.now() as unknown as string,
      });
  }

  return fetchInvitationById(db, id);
}
