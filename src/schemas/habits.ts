import { z } from 'zod';

export const createHabitSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(1, 'Name must not be empty')
    .max(100, 'Name must be at most 100 characters'),
  description: z.string().trim().max(500, 'Description must be at most 500 characters').optional(),
});
export type CreateHabitInput = z.infer<typeof createHabitSchema>;
