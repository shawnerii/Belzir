import { z } from 'zod';

export const invitationStatusSchema = z.enum(['pending', 'revoked', 'accepted']);

export const createInvitationsSchema = z.object({
  emails: z.array(z.string().trim().min(1).max(255)).min(1).max(50),
  organizationId: z.number().int().positive(),
});

export const listInvitationsQuerySchema = z.object({
  q: z.string().trim().min(1).max(255).optional(),
  organizationId: z.coerce.number().int().positive().optional(),
  status: invitationStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const invitationIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type InvitationStatus = z.infer<typeof invitationStatusSchema>;
export type CreateInvitationsInput = z.infer<typeof createInvitationsSchema>;
export type ListInvitationsQueryInput = z.infer<typeof listInvitationsQuerySchema>;
export type InvitationIdParamInput = z.infer<typeof invitationIdParamSchema>;
