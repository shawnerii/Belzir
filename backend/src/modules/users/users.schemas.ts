import { z } from 'zod';

const nameSchema = z.string().trim().min(1).max(120);
const usernameSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[A-Za-z0-9._-]+$/, 'Username may only include letters, digits, dot, underscore, and hyphen.');
const emailSchema = z.string().trim().email().max(255);
const phoneSchema = z.string().trim().min(1).max(80);
const roleSchema = z.enum(['admin', 'user']);

export const createUserSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  username: usernameSchema,
  email: emailSchema,
  phone: phoneSchema.optional(),
  role: roleSchema.default('user'),
  password: z.string().min(8).max(255).optional(),
});

export const updateUserSchema = z
  .object({
    firstName: nameSchema.optional(),
    lastName: nameSchema.optional(),
    username: usernameSchema.optional(),
    email: emailSchema.optional(),
    phone: z.union([phoneSchema, z.null()]).optional(),
    role: roleSchema.optional(),
  })
  .refine((value) => Object.values(value).some((entry) => entry !== undefined), {
    message: 'At least one field must be provided.',
  });

export const listUsersQuerySchema = z.object({
  q: z.string().trim().min(1).max(255).optional(),
  isActive: z.enum(['true', 'false']).optional(),
});

export const userIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ListUsersQueryInput = z.infer<typeof listUsersQuerySchema>;
export type UserIdParamInput = z.infer<typeof userIdParamSchema>;
export type UserRole = z.infer<typeof roleSchema>;
