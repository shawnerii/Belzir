import { z } from 'zod';

export const alertSeveritySchema = z.enum(['low', 'medium', 'high', 'critical']);
export const alertStatusSchema = z.enum(['new', 'triaged', 'escalated', 'ignored']);
export const alertSortSchema = z.enum(['received_at', 'severity']);
export const sortOrderSchema = z.enum(['asc', 'desc']);

export const listAlertsQuerySchema = z.object({
  severity: alertSeveritySchema.optional(),
  status: alertStatusSchema.optional(),
  sort: alertSortSchema.default('received_at'),
  order: sortOrderSchema.default('desc'),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
}).strict();

export const alertParamsSchema = z.object({
  id: z.string().trim().min(1),
});

export type ListAlertsQuery = z.infer<typeof listAlertsQuerySchema>;
export type AlertSeverity = z.infer<typeof alertSeveritySchema>;
export type AlertStatus = z.infer<typeof alertStatusSchema>;
