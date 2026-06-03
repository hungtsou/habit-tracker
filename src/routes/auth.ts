import { Router } from 'express';
import { validate } from '../middleware/validate';
import { registerUser, loginUser } from '../controllers/auth';
import { registerSchema, loginSchema } from '../schemas/users';

const router = Router();

router.post('/register', validate(registerSchema), registerUser);
router.post('/login', validate(loginSchema), loginUser);

export default router;
