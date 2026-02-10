import { Router } from 'express';
import timetable from './timetable';
import auth from './auth';

const router = Router();

router.use('/timetable', timetable);
router.use('/auth', auth);

export default router;
