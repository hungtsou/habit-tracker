import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createHabitSchema } from '../schemas/habits';
import * as controller from '../controllers/habits';

const router = Router();

router.get('/', authenticate, controller.getHabits);
router.post('/', authenticate, validate(createHabitSchema), controller.createHabit);
router.delete('/:id', controller.deleteHabit);

export default router;
