import { randomUUID } from 'crypto';
import type { PublicUser } from '../../src/db/types';

export const buildPublicUser = (overrides: Partial<PublicUser> = {}): PublicUser => ({
  id: randomUUID(),
  email: 'test@example.com',
  created_at: new Date(),
  ...overrides,
});
