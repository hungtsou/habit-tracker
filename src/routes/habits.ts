import { Router } from 'express';
import { validate } from '../middleware/validate';
import { createHabitSchema } from '../schemas/habits';
import * as controller from '../controllers/habits';

const router = Router();

router.get('/', controller.getHabits);
router.post('/', validate(createHabitSchema), controller.createHabit);
router.delete('/:id', controller.deleteHabit);

export default router;
