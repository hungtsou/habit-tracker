import { Router } from 'express';
import { validate } from '../middleware/validate';
import { registerUser } from '../controllers/auth';
import { registerSchema } from '../schemas/users';

const router = Router();

router.post('/register', validate(registerSchema), registerUser);

export default router;
