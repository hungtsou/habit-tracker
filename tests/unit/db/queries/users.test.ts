import { createUser, findUserByEmail } from '../../../../src/db/queries/users';
import { pool } from '../../../../src/db/pool';

jest.mock('../../../../src/db/pool', () => ({
  pool: { query: jest.fn() },
}));

const mockQuery = pool.query as jest.Mock;

describe('user queries', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('createUser', () => {
    it('inserts a user and returns the created row', async () => {
      const mockUser = {
        id: 'uuid-1',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed',
        created_at: new Date(),
        updated_at: new Date(),
      };
      mockQuery.mockResolvedValue({ rows: [mockUser] });

      const result = await createUser('test@example.com', 'Test User', 'hashed');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        ['test@example.com', 'Test User', 'hashed'],
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('findUserByEmail', () => {
    it('returns the user when found', async () => {
      const mockUser = { id: 'uuid-1', email: 'test@example.com', name: 'Test', password: 'hashed' };
      mockQuery.mockResolvedValue({ rows: [mockUser] });

      const result = await findUserByEmail('test@example.com');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['test@example.com'],
      );
      expect(result).toEqual(mockUser);
    });

    it('returns undefined when user not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await findUserByEmail('nobody@example.com');

      expect(result).toBeUndefined();
    });
  });
});
