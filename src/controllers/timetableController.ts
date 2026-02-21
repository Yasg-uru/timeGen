import { Request, Response, NextFunction } from 'express';
import { generateTimetableWithAI } from '../services/openaiService';
import { renderTimetableHTML } from '../services/htmlRenderer';
import GeneratedTimetable from '../models/generatedTimetableModel';

/**
 * POST /api/timetable/generate-ai
 * Body: { prompt: string }
 * Generates a timetable using OpenAI based on the user's prompt
 * and returns JSON + HTML.
 */
export const generateAI = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      res.status(400).json({ error: 'A "prompt" field is required describing the timetable requirements.' });
      return;
    }

    // Generate via OpenAI
    const timetableData = await generateTimetableWithAI(prompt.trim());

    // Render HTML
    const htmlContent = renderTimetableHTML(timetableData);

    // Ensure requester is authenticated and save user id
    const userId = (req as any).user?.sub;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Save to DB with creator reference
    const saved = await GeneratedTimetable.create({
      prompt: prompt.trim(),
      ...timetableData,
      htmlContent,
      createdBy: userId
    });

    res.status(201).json({
      data: {
        id: saved._id,
        department: saved.department,
        semester: saved.semester,
        room: saved.room,
        effectiveDate: saved.effectiveDate,
        timeTableMonth: saved.timeTableMonth,
        days: saved.days,
        timeSlots: saved.timeSlots,
        subjects: saved.subjects,
        facultyList: saved.facultyList,
        slots: saved.slots,
        classCoordinator: saved.classCoordinator,
        classCoCoordinator: saved.classCoCoordinator
      },
      html: htmlContent
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/timetable/generated
 * Returns all previously generated timetables (metadata, no HTML).
 */
export const getGeneratedTimetables = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const timetables = await GeneratedTimetable.find()
      .select('-htmlContent -slots')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ data: timetables });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/timetable/generated/:id
 * Returns a specific generated timetable by ID including HTML.
 */
export const getGeneratedTimetableById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const timetable = await GeneratedTimetable.findById(id).populate('createdBy', 'name email');

    if (!timetable) {
      res.status(404).json({ error: 'Timetable not found' });
      return;
    }

    res.json({ data: timetable });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/timetable/generated/:id/html
 * Returns the HTML rendering directly (content-type: text/html).
 */
export const getGeneratedTimetableHTML = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const timetable = await GeneratedTimetable.findById(id);

    if (!timetable) {
      res.status(404).json({ error: 'Timetable not found' });
      return;
    }

    res.setHeader('Content-Type', 'text/html');
    res.send(timetable.htmlContent);
  } catch (err) {
    next(err);
  }
};

export default {
  generateAI,
  getGeneratedTimetables,
  getGeneratedTimetableById,
  getGeneratedTimetableHTML
};
