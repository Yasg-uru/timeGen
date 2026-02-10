import { Router } from 'express';
import timetableController from '../controllers/timetableController';

const router = Router();

router.get('/', timetableController.getTimetables);
router.post('/', timetableController.createTimetable);

export default router;
