import { Response, NextFunction } from 'express';
import { AppError } from '../middleware/error';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../types/express.d';
import * as db from '../db/queries/habits';

export const listHabits = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search } = req.query as { search?: string };
    const habits = await db.findHabitsByUser(req.user!.userId, search);

    res.json({ habits });
  } catch (err) {
    next(err);
  }
};

export const createHabit = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description } = req.body as { name: string; description?: string };
    const habit = await db.createHabit(req.user!.userId, name, description);

    sendSuccess(res, { habit }, 200);
  } catch (err) {
    next(err);
  }
};

export const deleteHabit = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await db.deleteHabit(id, req.user!.userId);
    if (!deleted) {
      next(new AppError('Habit not found', 404));
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
