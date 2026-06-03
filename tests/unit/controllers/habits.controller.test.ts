import { createHabit } from '../../../src/controllers/habits';
import * as db from '../../../src/db/queries/habits';

vi.mock('../../../src/db/queries/habits');

const mockReq = (overrides = {}) =>
  ({
    user: { userId: 'user-uuid-1' },
    body: {},
    params: {},
    query: {},
    ...overrides,
  }) as any;

const mockRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  return res;
};

describe('createHabit', () => {
  it('should create a habit and return it', async () => {
    const habit = {
      id: 'habit-uuid-1',
      user_id: 'user-uuid-1',
      name: 'Run',
      description: null,
      created_at: new Date(),
    };
    vi.mocked(db.createHabit).mockResolvedValue(habit);

    const req = mockReq({ body: { name: 'Run' } });
    const res = mockRes();
    const next = vi.fn();

    await createHabit(req, res, next);

    expect(db.createHabit).toHaveBeenCalledWith('user-uuid-1', 'Run', undefined);
    expect(next).not.toHaveBeenCalled();
  });
});
