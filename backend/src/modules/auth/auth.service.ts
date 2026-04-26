import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../../db/knex';
import { requireJwtSecret, requireJwtExpiresInSeconds } from '../../config/env';
import { normalizeIdentifier } from '../users/normalize';

export type UserRow = {
  id: number;
  email: string;
  username: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  password_hash: string;
  role: string;
  is_active: number | boolean;
  is_system?: number | boolean;
};

export type PublicUser = {
  id: number;
  email: string;
  username: string;
  role: string;
};

// Precomputed at module load so unknown-user path still runs bcrypt.compare
// with matching cost (saltRounds=10) to defeat timing-based enumeration.
const DUMMY_HASH = bcrypt.hashSync('__timing_equalizer__', 10);

export async function findUserByIdentifier(raw: string): Promise<UserRow | undefined> {
  const id = normalizeIdentifier(raw);
  return db<UserRow>('users')
    .whereRaw('LOWER(email) = ?', [id])
    .orWhereRaw('LOWER(username) = ?', [id])
    .first();
}

export async function verifyCredentials(
  rawIdentifier: string,
  password: string,
): Promise<PublicUser | null> {
  const user = await findUserByIdentifier(rawIdentifier);

  if (!user) {
    // Constant-time equalizer: do a real bcrypt.compare so response time
    // matches the password-mismatch branch. Result is always discarded.
    await bcrypt.compare(password, DUMMY_HASH);
    return null;
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return null;
  }

  if (!user.is_active) {
    // Collapsed into the same null return to prevent enumeration of
    // disabled-but-existing accounts.
    return null;
  }

  return { id: user.id, email: user.email, username: user.username, role: user.role };
}

export function issueToken(user: PublicUser): { token: string; expiresIn: number } {
  const secret = requireJwtSecret();
  const expiresIn = requireJwtExpiresInSeconds();
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    secret,
    { expiresIn },
  );
  return { token, expiresIn };
}

export async function findActiveUserById(id: number): Promise<PublicUser | null> {
  const row = await db<UserRow>('users')
    .select('id', 'email', 'username', 'role', 'is_active')
    .where({ id })
    .first();
  if (!row || !row.is_active) {
    return null;
  }
  return { id: row.id, email: row.email, username: row.username, role: row.role };
}
