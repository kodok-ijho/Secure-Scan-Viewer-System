import { Router } from 'express';
import { login, getCurrentUser } from '../controllers/auth';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.get('/me', authenticateToken, getCurrentUser);

export default router;
