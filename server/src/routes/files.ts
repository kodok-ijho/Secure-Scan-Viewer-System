import { Router } from 'express';
import { listUserFiles, streamFile, downloadFile, deleteFile } from '../controllers/files';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, listUserFiles);
router.get('/:filename/stream', authenticateToken, streamFile);
router.get('/:filename/download', authenticateToken, downloadFile);
router.delete('/:filename', authenticateToken, deleteFile);

export default router;
