import { z } from 'zod';

// Only the identifier is trimmed; passwords must preserve whitespace.
export const loginSchema = z.object({
  usernameOrEmail: z.string().trim().min(1),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;
