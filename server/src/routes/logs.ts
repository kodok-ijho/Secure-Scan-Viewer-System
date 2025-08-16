import { Router } from 'express';
import { getLogs, getLogStats } from '../controllers/logs';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, requireAdmin, getLogs);
router.get('/stats', authenticateToken, requireAdmin, getLogStats);

export default router;
