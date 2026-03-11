import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createUser, findUserByEmail } from '../db/queries/users';
import { AppError } from '../middleware/error';
import { env } from '../config/env';

const SALT_ROUNDS = 10;

function signToken(userId: string): string {
  return jwt.sign({ userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, name, password } = req.body;

    const existing = await findUserByEmail(email);
    if (existing) {
      next(new AppError('Email already registered', 409));
      return;
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await createUser(email, name, hashedPassword);
    const token = signToken(user.id);

    res.status(201).json({
      data: { id: user.id, email: user.email, name: user.name, token },
    });
  } catch (err: unknown) {
    if (
      err &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code: string }).code === '23505'
    ) {
      next(new AppError('Email already registered', 409));
      return;
    }
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;

    const user = await findUserByEmail(email);
    if (!user) {
      next(new AppError('Invalid email or password', 401));
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      next(new AppError('Invalid email or password', 401));
      return;
    }

    const token = signToken(user.id);

    res.status(200).json({
      data: { id: user.id, email: user.email, name: user.name, token },
    });
  } catch (err) {
    next(err);
  }
}
