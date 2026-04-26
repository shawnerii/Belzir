import { z } from 'zod';

export const incidentSeveritySchema = z.enum(['low', 'medium', 'high', 'critical']);
export const incidentStatusSchema = z.enum(['open', 'investigating', 'closed']);
export const incidentSortSchema = z.enum(['updated_at', 'created_at', 'severity']);
export const sortOrderSchema = z.enum(['asc', 'desc']);

export const listIncidentsQuerySchema = z
  .object({
    severity: incidentSeveritySchema.optional(),
    status: incidentStatusSchema.optional(),
    sort: incidentSortSchema.default('updated_at'),
    order: sortOrderSchema.default('desc'),
    limit: z.coerce.number().int().min(1).max(100).default(25),
    offset: z.coerce.number().int().min(0).default(0),
  })
  .strict();

export const incidentParamsSchema = z.object({
  id: z.string().trim().min(1),
});

export const createIncidentBodySchema = z
  .object({
    title: z.string().trim().min(1).max(240),
    severity: incidentSeveritySchema,
    status: incidentStatusSchema.optional(),
  })
  .strict();

export const updateIncidentBodySchema = z
  .object({
    title: z.string().trim().min(1).max(240).optional(),
    severity: incidentSeveritySchema.optional(),
    status: incidentStatusSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided',
  });

export const linkIncidentAlertBodySchema = z
  .object({
    alert_id: z.string().trim().min(1),
  })
  .strict();

export const createIncidentCommentBodySchema = z
  .object({
    body: z.string().trim().min(1).max(4000),
    author: z.string().trim().min(1).max(120).optional(),
  })
  .strict();

export type IncidentSeverity = z.infer<typeof incidentSeveritySchema>;
export type IncidentStatus = z.infer<typeof incidentStatusSchema>;
export type ListIncidentsQuery = z.infer<typeof listIncidentsQuerySchema>;
export type CreateIncidentBody = z.infer<typeof createIncidentBodySchema>;
export type UpdateIncidentBody = z.infer<typeof updateIncidentBodySchema>;
export type LinkIncidentAlertBody = z.infer<typeof linkIncidentAlertBodySchema>;
export type CreateIncidentCommentBody = z.infer<typeof createIncidentCommentBodySchema>;
