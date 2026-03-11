jest.mock('dotenv', () => ({ config: jest.fn() }));

describe('env config', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    jest.resetModules();
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('exports a valid env object when all required variables are set', async () => {
    process.env.NODE_ENV    = 'development';
    process.env.DATABASE_URL = 'postgres://localhost:5432/habit_tracker';
    process.env.JWT_SECRET   = 'a-sufficiently-long-secret-key';

    const { env } = await import('../../../src/config/env');

    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(3000);
    expect(env.DATABASE_URL).toBe('postgres://localhost:5432/habit_tracker');
    expect(env.JWT_SECRET).toBe('a-sufficiently-long-secret-key');
  });

  it('coerces PORT from string to number', async () => {
    process.env.DATABASE_URL = 'postgres://localhost:5432/habit_tracker';
    process.env.JWT_SECRET   = 'a-sufficiently-long-secret-key';
    process.env.PORT         = '8080';

    const { env } = await import('../../../src/config/env');

    expect(env.PORT).toBe(8080);
    expect(typeof env.PORT).toBe('number');
  });

  it('applies default PORT of 3000 when PORT is not set', async () => {
    process.env.DATABASE_URL = 'postgres://localhost:5432/habit_tracker';
    process.env.JWT_SECRET   = 'a-sufficiently-long-secret-key';
    delete process.env.PORT;

    const { env } = await import('../../../src/config/env');

    expect(env.PORT).toBe(3000);
  });

  it('isProd returns true only in production', async () => {
    process.env.NODE_ENV     = 'production';
    process.env.DATABASE_URL = 'postgres://localhost:5432/habit_tracker';
    process.env.JWT_SECRET   = 'a-sufficiently-long-secret-key';

    const { isProd, isDev, isTest } = await import('../../../src/config/env');

    expect(isProd()).toBe(true);
    expect(isDev()).toBe(false);
    expect(isTest()).toBe(false);
  });

  it('isDev returns true only in development', async () => {
    process.env.NODE_ENV     = 'development';
    process.env.DATABASE_URL = 'postgres://localhost:5432/habit_tracker';
    process.env.JWT_SECRET   = 'a-sufficiently-long-secret-key';

    const { isProd, isDev, isTest } = await import('../../../src/config/env');

    expect(isDev()).toBe(true);
    expect(isProd()).toBe(false);
    expect(isTest()).toBe(false);
  });

  it('isTest returns true only in test', async () => {
    process.env.NODE_ENV     = 'test';
    process.env.DATABASE_URL = 'postgres://localhost:5432/habit_tracker';
    process.env.JWT_SECRET   = 'a-sufficiently-long-secret-key';

    const { isProd, isDev, isTest } = await import('../../../src/config/env');

    expect(isTest()).toBe(true);
    expect(isProd()).toBe(false);
    expect(isDev()).toBe(false);
  });

  it('calls process.exit(1) when a required variable is missing', async () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    delete process.env.DATABASE_URL;
    delete process.env.JWT_SECRET;

    await expect(import('../../../src/config/env')).rejects.toThrow('process.exit called');

    mockExit.mockRestore();
  });

  it('defaults JWT_EXPIRES_IN to "24h"', async () => {
    process.env.DATABASE_URL = 'postgres://localhost:5432/habit_tracker';
    process.env.JWT_SECRET   = 'a-sufficiently-long-secret-key';
    delete process.env.JWT_EXPIRES_IN;

    const { env } = await import('../../../src/config/env');

    expect(env.JWT_EXPIRES_IN).toBe('24h');
  });

  it('calls process.exit(1) when JWT_SECRET is shorter than 16 characters', async () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    process.env.DATABASE_URL = 'postgres://localhost:5432/habit_tracker';
    process.env.JWT_SECRET   = 'short';

    await expect(import('../../../src/config/env')).rejects.toThrow('process.exit called');

    mockExit.mockRestore();
  });
});
