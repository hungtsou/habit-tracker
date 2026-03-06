import { Router } from 'express';
import authRouter from './auth';
import habitsRouter from './habits';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ data: { status: 'ok' } });
});

router.use('/auth', authRouter);
router.use('/habits', habitsRouter);

export default router;
