process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-do-not-use-in-prod';
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL || 'postgres://postgres:password@localhost:5432/habit_tracker_test';
