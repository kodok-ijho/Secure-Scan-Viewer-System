import { Router } from 'express';
import { listUsers, createUser, updateUser, changePassword, deleteUser } from '../controllers/users';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, requireAdmin, listUsers);
router.post('/', authenticateToken, requireAdmin, createUser);
router.put('/:id', authenticateToken, requireAdmin, updateUser);
router.patch('/:id/password', authenticateToken, requireAdmin, changePassword);
router.delete('/:id', authenticateToken, requireAdmin, deleteUser);

export default router;
