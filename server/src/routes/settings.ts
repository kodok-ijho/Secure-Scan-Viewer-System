import { Router } from 'express';
import { getSettings, updateSettings, testFolderAccess } from '../controllers/settings';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, requireAdmin, getSettings);
router.put('/', authenticateToken, requireAdmin, updateSettings);
router.post('/test-access', authenticateToken, requireAdmin, testFolderAccess);

export default router;
