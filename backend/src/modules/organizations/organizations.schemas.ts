import { z } from 'zod';

export const organizationIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const organizationUserParamSchema = z.object({
  id: z.coerce.number().int().positive(),
  userId: z.coerce.number().int().positive(),
});

export const listOrganizationsQuerySchema = z.object({
  q: z.string().trim().min(1).max(255).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(1).max(120),
  parentId: z.union([z.number().int().positive(), z.null()]).optional(),
});

export const assignOrganizationUserSchema = z.object({
  userId: z.number().int().positive(),
});

export type OrganizationIdParamInput = z.infer<typeof organizationIdParamSchema>;
export type OrganizationUserParamInput = z.infer<typeof organizationUserParamSchema>;
export type ListOrganizationsQueryInput = z.infer<typeof listOrganizationsQuerySchema>;
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type AssignOrganizationUserInput = z.infer<typeof assignOrganizationUserSchema>;
