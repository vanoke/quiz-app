import { Router } from 'express';
import { hostedHistory, playedHistory } from '../controllers/historyController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/hosted', requireRole('host'), hostedHistory);
router.get('/played', playedHistory);

export default router;