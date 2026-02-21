import { Router } from 'express';
import timetableController from '../controllers/timetableController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();


// AI-powered timetable generation
router.post('/generate-ai', authenticate, timetableController.generateAI);
router.get('/generated', timetableController.getGeneratedTimetables);
router.get('/generated/:id', timetableController.getGeneratedTimetableById);
router.get('/generated/:id/html', timetableController.getGeneratedTimetableHTML);

export default router;
