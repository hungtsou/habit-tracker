import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { AppError } from '../middleware/error';
import { sendSuccess } from '../utils/response';
import * as db from '../db/queries/users';

const SALT_ROUNDS = 10;

export const registerUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    const existing = await db.findUserByEmail(email);
    if (existing) {
      next(new AppError('Email already in use', 409));
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await db.createUser(email, passwordHash);
    sendSuccess(res, user, 201);
  } catch (err) {
    next(err);
  }
};
