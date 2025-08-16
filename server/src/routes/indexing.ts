import { Router } from 'express';
import { runIndexing } from '../controllers/indexing';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

router.post('/run', authenticateToken, requireAdmin, runIndexing);

export default router;
