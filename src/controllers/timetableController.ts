import { Request, Response, NextFunction } from 'express';
import timetableService from '../services/timetableService';

export const getTimetables = (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = timetableService.getAll();
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

export const createTimetable = (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.body;
    const created = timetableService.create(payload);
    res.status(201).json({ data: created });
  } catch (err) {
    next(err);
  }
};

export default { getTimetables, createTimetable };
