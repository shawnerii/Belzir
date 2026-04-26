import { z } from 'zod';

export const triageDecisionSchema = z.enum([
  'true_positive',
  'false_positive',
  'ignore',
  'escalate',
]);

export const createTriageDecisionBodySchema = z.object({
  decision: triageDecisionSchema,
  note: z.string().max(4000).optional(),
  decided_by: z.string().max(120).optional(),
});

export const triageAlertParamsSchema = z.object({
  id: z.string().trim().min(1),
});

export type TriageDecisionType = z.infer<typeof triageDecisionSchema>;
export type CreateTriageDecisionBody = z.infer<typeof createTriageDecisionBodySchema>;
